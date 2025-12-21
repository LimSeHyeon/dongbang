import { pool } from "../Config/db.connect.js";
import { BaseError } from "../Config/error.js";
import { status } from "../Config/response.status.js";

import * as AdminDTO from "./adminDTO.js";


//비밀번호 조회(관리자 확인용)
export const getPassword = async() => {
    const query = "SELECT password FROM manage";
    try {
        const [result] = await pool.query(query);
        return result[0];
    } catch (err) {
        console.error(err);
        throw new BaseError(
            status.PARAMETER_IS_WRONG,
            "DB 쿼리 실행 중 에러 발생"
        );
    }
}

//설정 조회
export const getSetting = async () => {
    const query = "SELECT open_weekday, open_time, max_use_time FROM settings";
    try {
        const [result] = await pool.query(query);
        console.log("result : ", result[0]);
        return AdminDTO.settingInfoDTO(result[0]);
    } catch (err) {
        console.error(err);
        throw new BaseError(
            status.PARAMETER_IS_WRONG,
            "DB 쿼리 실행 중 에러 발생"
        );
    }
};
