import { pool } from "../config/db.connect.js";
import { BaseError } from "../config/error.js";
import { status } from "../config/response.status.js";


//비밀번호 조회(관리자 확인용)
export const getPassword = async() => {
    const query = "SELECT password FROM manage";
    try {
        const [result] = await pool.query(query);
        return result[0];
    } catch (err) {
        console.error(err);
        throw new BaseError({
            ...status.DB_ERROR,
            message: err.message
        });
    }
}

//관리자 비밀번호 변경
export const updatePassword = async(newPassword) => {
    const query = "UPDATE manage SET password = ? WHERE manage_id = ?";
    try {
        const [result] = await pool.query(query, [newPassword, 1]);
        return;
    } catch (err) {
        console.error(err);
        throw new BaseError({
            ...status.DB_ERROR,
            message: err.message
        });
    }
}

//설정 조회
export const getSetting = async () => {
    const query = "SELECT open_weekday, open_time, max_use_time FROM settings";
    try {
        const [result] = await pool.query(query);
        console.log("result : ", result[0]);
        return result[0];
    } catch (err) {
        console.error(err);
        throw new BaseError({
            ...status.DB_ERROR,
            message: err.message
        });
    }
};

//설정 변경
export const updateSetting = async (newSetting) => {
    const query = "UPDATE settings SET open_weekday=?, open_time=?, max_use_time = ? WHERE settings_id = ?";
    console.log("newSetting ", newSetting)
    try {
        const [result] = await pool.query(query, [newSetting.openWeekday, newSetting.openTime, newSetting.maxUseTime, 1]);
        return;
    } catch (err) {
        console.error(err);
        throw new BaseError({
            ...status.DB_ERROR,
            message: err.message
        });
    }
}

//히스토리 조회
export const selectSevenDaysHistory = async() => {
    const query = `
        SELECT * FROM reserve_history 
        WHERE request_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY request_time DESC, history_id DESC;
    `;
    //로그 요약 정보
    const summaryQuery = `
        SELECT 
            SUM(hapju_term) as totalDuration,
            COUNT(*) as totalCount,
            MIN(request_time) as startDate,
            MAX(request_time) as endDate
        FROM reserve_history 
        WHERE request_time >= DATE_SUB(NOW(), INTERVAL 7 DAY);
    `;
    const [result] = await pool.query(query);
    const [summary] = await pool.query(summaryQuery);
    return {
        result : result,
        summary : summary[0]
    };
}