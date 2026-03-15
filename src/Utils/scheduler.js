import cron from 'node-cron';

import redisClient from '../config/redis.js';
import * as ReserveService from '../Reserve/reserveService.js';

export const syncReservationsToDB = async () => {
    console.log("예약 처리 시작");
    try {
        while(true) {
            const data = await redisClient.rPop('reserveQueue');
            if(!data) break;

            const { songName, startTime, hapjuTerm, requestedAt } = JSON.parse(data);

            try {
                //히스토리 저장 후 키 삭제
                await ReserveService.saveHistory({ 
                    songName, startTime, hapjuTerm, requestedAt 
                });

                //실제 예약 실행
                const byAdmin = false;
                await ReserveService.createReservation({ 
                    songName, startTime, hapjuTerm 
                }, requestedAt, byAdmin);
                console.log(`성공: ${songName} (${startTime})`);
            } catch (err) {
                console.error(`실패 (${songName}):`, err.message);
            }
        }
        console.log("예약처리 종료");
    } catch (error) {
        console.log("배치 중 오류 발생", error);
    }
}

cron.schedule('*/15 * * * * *', () => {
    syncReservationsToDB();
});