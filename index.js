import express from 'express';
import { tempRouter } from './src/routes/tmp.route';
import cors from 'cors';

const app = express()
const port = 3000

app.use(cors()); // cors 오류 방지
app.use(express.static('public')); 
app.use(express.json()); // body에 필요

// router setting
app.use('/tmp', tempRouter);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})