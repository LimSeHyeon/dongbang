import { BaseError } from "../Config/error.js";
import { status } from "../Config/response.status.js";

import * as AdminDAO from './adminDAO.js';
import * as AdminDTO from "./adminDTO.js";

export const getSetting = async() => {
    const result = await AdminDAO.getSetting();
    return AdminDTO.settingInfoDTO(result);
}

export const updateSetting = async(newSetting) => {
    await AdminDAO.updateSetting(newSetting);
    const result = await AdminDAO.getSetting();
    return AdminDTO.settingInfoDTO(result);
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

export const getWeeklyHistory = async() => {
    const result = await AdminDAO.selectSevenDaysHistory();
    return AdminDTO.historyDTO(result);
}