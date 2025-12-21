import { status } from "../Config/response.status.js";
import { response } from "../Config/response.js";

import * as AdminDAO from '../Admin/adminDAO.js';

const getWeekdayName = (day) => ["일", "월", "화", "수", "목", "금", "토"][day];

export const checkTime = async (req, res, next) => {
    const { start_time } = req.body;
    const targetDate = new Date(start_time);

    //이번 주 예약인지 확인
    const now = new Date();
    //const currentDay = now.getDay();
    const currentDay = 4;
    const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;
    const thisSunday = new Date(now);
    thisSunday.setDate(now.getDate() + daysUntilSunday);
    thisSunday.setHours(23, 59, 59, 999);

    if (targetDate <= thisSunday) {
        return next();
    }

    //다음 주 예약
    //예약 기준일시보다 나중이면 바로 예약 가능
    const settingResult = await AdminDAO.getSetting();
    const isAfterOpenDay = currentDay > settingResult.open_weekday || (currentDay === 0);
    const isSameDayAfterTime = (currentDay === settingResult.open_weekday && now.getHours() >= settingResult.open_time);

    if (isAfterOpenDay || isSameDayAfterTime) {
        return next();
    }

    console.log(settingResult.open_weekday);
    console.log(getWeekdayName(settingResult.open_weekday));
    //예약 불가
    return res.send(response(status.FORBIDDEN, {
        message: `다음 주 예약은 ${getWeekdayName(settingResult.open_weekday)}요일 ${settingResult.open_time}시부터 가능합니다.`
    }));
}

