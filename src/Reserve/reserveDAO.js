import { pool } from "../Config/db.connect.js";
import { BaseError } from "../Config/error.js";
import { status } from "../Config/response.status.js";

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

//예약 실행
export const createReservation = async (songName, startTime, endTime, requestTime) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const existingReserve = await getReserveByDate(connection, startTime, endTime);
        console.log(existingReserve);
        await connection.commit();
        return;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}