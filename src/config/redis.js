import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
    url : `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT}`,
    db : `${process.env.REDIS_DB}`,
    password : `${process.env.REDIS_PW}`
});

redisClient.on('error', (err) => console.error('Redis 연결 에러:', err));

const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log('Redis 연결 완료!');
    } catch (err) {
        console.error('Redis 연결 실패: ', err);
    }
};

connectRedis();

export default redisClient;