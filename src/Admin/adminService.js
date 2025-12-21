import { BaseError } from "../Config/error.js";
import { status } from "../Config/response.status.js";

import * as AdminDAO from './adminDAO.js';

export const getSetting = async() => {
    return AdminDAO.getSetting();
}

export const updateSetting = async(newSetting) => {
    await AdminDAO.updateSetting(newSetting);
    return await AdminDAO.getSetting();
}

export const updatePassword = async(req) => {
    const prevPassword = await AdminDAO.getPassword();
    console.log(prevPassword.password);
    if(prevPassword.password !== req.prevPassword) throw new BaseError({
        ...status.PASSWORD_CHANGE_ERROR
    })
    await AdminDAO.updatePassword(req.newPassword);
    return;
}