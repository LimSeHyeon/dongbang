import express from 'express';
import { response } from "./src/Config/response.js";
import cors from 'cors';
import { adminRouter } from './src/Admin/adminRouter.js';
import { reserveRouter } from './src/Reserve/reserveRouter.js';
import { syncReservationsToDB } from './src/Utils/scheduler.js';

const app = express()
const port = 3000

syncReservationsToDB();

app.use(cors()); // cors 오류 방지
app.use(express.static('public')); 
app.use(express.json()); // body에 필요

app.get('/', (req, res) => {
    res.sendFile(path.resolve('public', 'index.html'));
});

// router setting
app.use('/admin', adminRouter);
app.use('/reserve', reserveRouter);


app.use((err, req, res, next) => {
    // 템플릿 엔진 변수 설정
    res.locals.message = err.message;   
    // 개발환경이면 에러를 출력하고 아니면 출력하지 않기
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};

    const statusCode = err.data?.status || 500;
    const responseData = err.data || {
        isSuccess: false,
        code: 500,
        message: err.message
    };

    res.status(statusCode).send(response(responseData));
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})