import cron from 'node-cron';

import redisClient from '../Config/redis.js';
import * as ReserveDAO from '../Reserve/reserveDAO.js';

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
            const startTimeDate = new Date(startTime);
            const endTime = new Date(startTimeDate.getTime() + hapjuTerm * 60 * 60 * 1000);

            try {
                //히스토리 저장
                await ReserveDAO.saveHistory(songName, startTime, hapjuTerm, requestTime)
                //DB 저장 성공 시 Redis 키 삭제
                await redisClient.del(key);
                console.log(`성공: ${songName} (${startTime})`);
            } catch (err) {
                await connection.rollback();
                console.error(`실패 (${songName}):`, err.message);
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