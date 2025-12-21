import { StatusCodes } from "http-status-codes";

export const status = {
    // success
    SUCCESS: {status: StatusCodes.OK, "isSuccess": true, "code": 200, "message": "success!"},
    
    // error
    WRONG_EXTENSION: {status: StatusCodes.WRONG_EXTENSION, "isSuccess": false, "code": 400, "message":"잘못된 확장입니다."},
    DB_ERROR: {status: 500, "isSuccess": false, "code": 500, "message": "DB오류입니다."},
    
    // common err
    INTERNAL_SERVER_ERROR: {status: StatusCodes.INTERNAL_SERVER_ERROR, "isSuccess": false, "code": 400, "message": "서버 에러, 관리자에게 문의 바랍니다." },
    BAD_REQUEST: {status: StatusCodes.BAD_REQUEST, "isSuccess": false, "code": 400, "message": "잘못된 요청입니다." },
    UNAUTHORIZED: {status: StatusCodes.UNAUTHORIZED, "isSuccess": false, "code": 401, "message": "권한이 잘못되었습니다." },
    METHOD_NOT_ALLOWED: {status: StatusCodes.METHOD_NOT_ALLOWED, "isSuccess": false, "code": 400, "message": "지원하지 않는 Http Method 입니다." },
    FORBIDDEN: {status: StatusCodes.FORBIDDEN, "isSuccess": false, "code": 403, "message": "금지된 요청입니다." },
    NOT_FOUND: {status: StatusCodes.NOT_FOUND, "isSuccess": false, "code": 404, "message": "요청한 페이지를 찾을 수 없습니다. 관리자에게 문의 바랍니다." },

    // db error
    PARAMETER_IS_WRONG: {status: 400, "isSuccess": false, "message": "쿼리 실행 시 전달되는 파라미터가 잘못되었습니다. 파라미터 개수 혹은 파라미터 형식을 확인해주세요."},

    //Admin error
    PASSWORD_CHANGE_ERROR: {status: 400, "isSuccess": false, "message": "비밀번호 재설정 오류"}
};