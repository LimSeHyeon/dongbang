import { pool } from "../config/db.connect.js";
import { BaseError } from "../config/error.js";
import { status } from "../config/response.status.js";
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

//예약 삭제
export const deleteReserve = async(reservationId) => {

    const connection = await pool.getConnection();
    const selectQuery = `SELECT song_name, start_time, end_time FROM reservation WHERE reservation_id = ?;`
    const saveQuery = `INSERT INTO delete_history (song_name, start_time, end_time) VALUES (?, ?, ?);`
    const deleteQuery = `DELETE FROM reservation WHERE reservation_id = ?;`;
    try {
        await connection.beginTransaction();
        
        const [selectResult] = await connection.query(selectQuery, [reservationId]);
        if(selectResult.length===0) return false;

        await connection.query(saveQuery, [selectResult[0].song_name, selectResult[0].start_time, selectResult[0].end_time]);
        
        const [deleteResult] = await connection.query(deleteQuery, [reservationId]);

        await connection.commit();
        return deleteResult.affectedRows>0;
    }
    catch (err) {
        console.error(err);
        await connection.rollback();
        throw new BaseError({
            ...status.DB_ERROR,
            message: err.message
        });
    }
    finally {
        connection.release();
    }
}

//주별 예약 조회
export const selectReserveByPeriod = async(startDate, endDate) => {
    const query = `
        SELECT * FROM reservation 
        WHERE start_time >= ? AND start_time <= ?
        ORDER BY start_time ASC;
    `;

    try {
        const [result] = await pool.query(query, [startDate, endDate]);
        return result;
    } catch (err) {
        console.error(err);
        throw new BaseError({
            ...status.DB_ERROR,
            message: err.message
        });
    }
}

//자기 자신을 제외하고 겹치는 예약 조회
const getConflictingReserve = async (connection, startTime, endTime, excludeId) => {
    const query = `
        SELECT reservation_id, start_time, end_time
        FROM reservation
        WHERE start_time < ?
          AND end_time > ?
          AND reservation_id != ?
        FOR UPDATE;
    `;
    const [rows] = await connection.execute(query, [endTime, startTime, excludeId]);
    return rows;
};

//예약 수정
export const updateReserve = async(req) => {
    const { reservationId, changeStartTime, changeEndTime } = req;
    const selectReserveQuery = `SELECT reservation_id, start_time, end_time FROM reservation WHERE reservation_id = ? FOR UPDATE;`
    const updateQuery = `UPDATE reservation SET start_time = ? , end_time = ? WHERE reservation_id = ?;`
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        //예약 행 잠금
        const [target] = await connection.execute(selectReserveQuery, [reservationId])

        if(target.length === 0) throw new BaseError({
            ...status.DATA_NOT_FOUND,
            message: "존재하지 않는 예약입니다."
        });
        
        //예약 가능한지 확인
        const existingReserve = await getConflictingReserve(connection, changeStartTime, changeEndTime, reservationId);
        if (existingReserve.length > 0) {
            throw new BaseError({
                ...status.RESERVATION_CONFLICT, // 없다면 status에 추가
                message: "변경하려는 시간대에 이미 예약이 존재합니다."
            });
        }

        //수정 가능하면 수정하고 저장
        await connection.execute(updateQuery, [changeStartTime, changeEndTime, reservationId]);
        
        await connection.commit();
        return { reservationId, startTime: changeStartTime, endTime: changeEndTime };

    } catch (err) {
        await connection.rollback();
        throw new BaseError({
            ...status.DB_ERROR,
            message: err.message
        });
    } finally {
        connection.release();
    }
}
