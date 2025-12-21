import express from 'express';
import { adminRouter } from './src/Admin/adminRouter';
import { response } from "./src/Config/response.js";
import cors from 'cors';

const app = express()
const port = 3000

app.use(cors()); // cors 오류 방지
app.use(express.static('public')); 
app.use(express.json()); // body에 필요

// router setting
app.use('/admin', adminRouter);


app.use((err, req, res, next) => {
    // 템플릿 엔진 변수 설정
    res.locals.message = err.message;   
    // 개발환경이면 에러를 출력하고 아니면 출력하지 않기
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {}; 
    res.status(err.data.status).send(response(err.data));
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})