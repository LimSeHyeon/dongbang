import express from 'express';
import { adminRouter } from './src/Admin/adminRouter';
import cors from 'cors';

const app = express()
const port = 3000

app.use(cors()); // cors 오류 방지
app.use(express.static('public')); 
app.use(express.json()); // body에 필요

// router setting
app.use('/admin', adminRouter);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})