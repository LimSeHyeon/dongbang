import { v4 as uuidv4 } from 'uuid';
import { BaseError } from "../Config/error.js";
import moment from 'moment-timezone';
import { status } from "../Config/response.status.js";
import redisClient from '../Config/redis.js';
import * as ReserveDAO from './reserveDAO.js';
import * as AdminDAO from '../Admin/adminDAO.js';
import { formatDate } from '../Utils/dateConverter.js';

export const saveRequest = async(requestInfo) => {
    const { songName, startTime, hapjuTerm } = requestInfo;
    const requestId = `booking_req:${uuidv4()}`;

    const reservationInfo = {
        songName,
        startTime,
        hapjuTerm,
        requestedAt: new Date().toISOString()
    };

    console.log(reservationInfo);

    try {
        await redisClient.set(requestId, JSON.stringify(reservationInfo), {
            EX: 3600 
        });
        return {
            success: true,
            requestId,
            data: reservationInfo
        };
    } catch (error) {
        console.error('Redis 저장 실패:', error);
        throw new BaseError({
            ...status.REDIS_CONNECT,
            message: '예약 요청 처리 중 오류가 발생했습니다.'
        });
    }
}

export const saveHistory = async({ songName, startTime, hapjuTerm, requestedAt }) => {
    const startTimeDate = new Date(startTime);
    const formattedStart = formatDate(startTimeDate);
    await ReserveDAO.saveHistory(songName, formattedStart, hapjuTerm, new Date(requestedAt));
    return;
}

export const createReservation = async({ songName, startTime, hapjuTerm, requestedAt }) => {
    const startTimeDate = moment(startTime).tz('Asia/Seoul');
    //최대 예약 시간 초과 방지
    const setting = await AdminDAO.getSetting();
    const maxUseTime = setting.max_use_time;
    const useTime = (hapjuTerm < maxUseTime) ? hapjuTerm : maxUseTime;
    let endTimeDate = startTimeDate.clone().add(useTime, 'hours');
    
    //자정 안 넘어가도록
    const endOfDay = startTimeDate.clone().endOf('day');
    if (endTimeDate.isAfter(endOfDay)) {
        endTimeDate = startTimeDate.clone().add(1, 'day').startOf('day');
    }
    
    const formattedStart = startTimeDate.format('YYYY-MM-DD HH:mm:ss');
    const formattedEnd = endTimeDate.format('YYYY-MM-DD HH:mm:ss');
    const formattedRequest = moment(requestedAt).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

    await ReserveDAO.createReservation(songName, formattedStart, formattedEnd, formattedRequest);
}