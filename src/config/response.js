// response.js

export const response = ({isSuccess, code, message}, result=null) => {
    return {
        isSuccess: isSuccess,
        code: code,
        message: message,
        result: result
    }
};