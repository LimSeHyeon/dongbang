import { BaseError } from "../config/error.js";
import moment from 'moment-timezone';
import { status } from "../config/response.status.js";
import redisClient from '../config/redis.js';
import * as ReserveDAO from './reserveDAO.js';
import * as AdminDAO from '../Admin/adminDAO.js';
import * as ReserveDTO from './reserveDTO.js';
import { formatDate } from '../Utils/dateConverter.js';

//예약정보 Redis에 push
export const saveRequest = async(requestInfo) => {
    const { songName, startTime, hapjuTerm } = requestInfo;

    const reservationInfo = {
        songName,
        startTime,
        hapjuTerm,
        requestedAt: moment(new Date()).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
    };

    console.log(reservationInfo);

    try {
        await redisClient.lPush('reserveQueue', JSON.stringify(reservationInfo), {
            EX: 3600 
        });
        return reservationInfo;
    } catch (error) {
        console.error('Redis 저장 실패:', error);
        throw new BaseError({
            ...status.REDIS_CONNECT,
            message: '예약 요청 처리 중 오류가 발생했습니다.'
        });
    }
}

export const saveHistory = async({ songName, startTime, hapjuTerm, requestedAt }) => {
    const formattedStart =moment(startTime).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
    const formattedRequest = moment(requestedAt).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
    await ReserveDAO.saveHistory(songName, formattedStart, hapjuTerm, formattedRequest);
    return;
}

export const createReservation = async(req, requestedAt, byAdmin) => {
    const { songName, startTime, hapjuTerm } = req;
    const startTimeDate = moment(startTime).tz('Asia/Seoul');

    let endTimeDate;
    
    //최대 예약 시간 초과 방지
    if(!byAdmin) {
        const setting = await AdminDAO.getSetting();
        const maxUseTime = setting.max_use_time;
        const useTime = (hapjuTerm < maxUseTime) ? hapjuTerm : maxUseTime;
        endTimeDate = startTimeDate.clone().add(useTime, 'hours');
    }
    else {//관리자는 최대 예약 시간 무시
        endTimeDate = startTimeDate.clone().add(hapjuTerm, 'hours');
    }
    
    //자정 안 넘어가도록
    const endOfDay = startTimeDate.clone().endOf('day');
    if (endTimeDate.isAfter(endOfDay)) {
        endTimeDate = startTimeDate.clone().add(1, 'day').startOf('day');
    }
    
    const formattedStart = startTimeDate.format('YYYY-MM-DD HH:mm:ss');
    const formattedEnd = endTimeDate.format('YYYY-MM-DD HH:mm:ss');
    const formattedRequest = moment(requestedAt).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

    const result = await ReserveDAO.createReservation(songName, formattedStart, formattedEnd, formattedRequest, byAdmin);
    return result;
}

export const cancelReserve = async(reservationId) => {
    const isDeleted = await ReserveDAO.deleteReserve(reservationId);
    if(!isDeleted) throw new BaseError(status.DATA_NOT_DELETED);
    return {"deleted": reservationId};
}

export const getWeeklyReserve = async(startDate) => {
    const startOfWeek = moment(startDate).tz('Asia/Seoul').startOf('day');
    const endOfWeek = startOfWeek.clone().add(6, 'days').endOf('day');

    const formattedStart = startOfWeek.format('YYYY-MM-DD HH:mm:ss');
    const formattedEnd = endOfWeek.format('YYYY-MM-DD HH:mm:ss');

    const result = await ReserveDAO.selectReserveByPeriod(formattedStart, formattedEnd);
    return ReserveDTO.reserveListDTO(result, formattedStart, formattedEnd);
}