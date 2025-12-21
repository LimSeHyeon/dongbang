import cron from 'node-cron';

import redisClient from '../Config/redis.js';
import { pool } from '../Config/db.connect.js';

export const syncReservationsToDB = async () => {
    console.log("예약 처리 시작");
    try {
        const keys = await redisClient.keys('booking_req:*');
        if (keys.length === 0) return;

        for (const key of keys) {
            const data = await redisClient.get(key);
            if (!data) continue;

            const { songName, startTime, hapjuTerm, requestedAt } = JSON.parse(data);

            const requestTime = new Date(requestedAt);

            //트랜잭션 사용
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                const query = `
                    INSERT INTO reserve_history (song_name, start_time, hapju_term, request_time)
                    VALUES (?, ?, ?, ?)
                `;
                await connection.execute(query, [songName, startTime, hapjuTerm, requestTime]);

                // 3. DB 저장 성공 시 Redis에서 해당 키 삭제
                await redisClient.del(key);

                await connection.commit();
                console.log(`성공: ${songName} (${startTime})`);
            } catch (err) {
                await connection.rollback();
                console.error(`실패 (${songName}):`, err.message);
            } finally {
                connection.release();
            }
        }
        console.log("예약처리 종료");
    } catch (error) {
        console.log("배치 중 오류 발생", error);
    }
}

cron.schedule('*/30 * * * * *', () => {
    syncReservationsToDB();
});