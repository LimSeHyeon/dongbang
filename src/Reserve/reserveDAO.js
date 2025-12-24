import { pool } from "../Config/db.connect.js";
import { BaseError } from "../Config/error.js";
import { status } from "../Config/response.status.js";
import moment from 'moment-timezone';

//예약로그 저장
export const saveHistory = async(songName, startTime, hapjuTerm, requestTime) => {
    //트랜잭션 사용
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const query = `
                    INSERT INTO reserve_history (song_name, start_time, hapju_term, request_time)
                    VALUES (?, ?, ?, ?)`;
        await connection.execute(query, [songName, startTime, hapjuTerm, requestTime]);
        await connection.commit();
        return;
    } catch (err) {
        console.error(err);
        await connection.rollback();
        throw new BaseError({
            ...status.DB_ERROR,
            message: err.message
        });
    } finally {
        connection.release();
    }
}

//날짜별 예약 조회
export const getReserveByDate = async(connection, startTime, endTime) => {
    const query = `
            SELECT start_time, end_time 
            FROM reservation 
            WHERE start_time < ? 
              AND end_time > ?
            ORDER BY start_time ASC
            FOR UPDATE;
        `;
        const [rows] = await connection.execute(query, [endTime, startTime]);
        return rows;
}

const insertReservation = async(connection, data) => {
    console.log("예약 정보 추가");
    const query = `
        INSERT INTO reservation (song_name, start_time, end_time, reserved_time, by_admin)
        VALUES (?, ?, ?, ?, ?);`;
    return await connection.execute(query, [data.songName, data.startTime, data.endTime, data.requestTime, data.byAdmin]);
}

//예약 실행
export const createReservation = async (songName, startTime, endTime, requestTime, byAdmin) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const existingReserve = await getReserveByDate(connection, startTime, endTime);
        console.log(existingReserve);

        //예약 시간대 분리
        const slots = [];
        let startPointer = startTime;
        const finalTime = endTime;

        for(const reserve of existingReserve) {

            // const bStart = moment.utc(reserve.start_time).format('YYYY-MM-DD HH:mm:ss');
            // const bEnd = moment.utc(reserve.end_time).format('YYYY-MM-DD HH:mm:ss');

            // ISO 문자열에서 T와 Z를 제거하여 순수한 지역 시간 문자열로 만든 뒤 moment에 넣습니다.
            const bStart = moment(reserve.start_time.toISOString().replace('T', ' ').replace('Z', '')).format('YYYY-MM-DD HH:mm:ss');
            const bEnd = moment(reserve.end_time.toISOString().replace('T', ' ').replace('Z', '')).format('YYYY-MM-DD HH:mm:ss');

            if(startPointer < bStart) {
                slots.push({ start: startPointer, end: bStart });
            }
            startPointer = bEnd;
        }
        if(startPointer < finalTime) {
            slots.push({ start: startPointer, end: finalTime });
        }

        //저장
        if (slots.length !== 0) {
            for (const slot of slots) {
                await insertReservation(connection, {
                    songName,
                    startTime: slot.start,
                    endTime: slot.end,
                    requestTime: requestTime,
                    byAdmin: byAdmin
                });
            }
        }

        await connection.commit();
        return {reserved: slots};
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

export const deleteReserve = async(reservationId) => {
    const query = `DELETE FROM reservation WHERE reservation_id = ?;`;
    try {
        const [result] = await pool.query(query, [reservationId]);
        return result.affectedRows>0;
    }
    catch (err) {
        console.error(err);
        throw new BaseError({
            ...status.DB_ERROR,
            message: err.message
        });
    }
}