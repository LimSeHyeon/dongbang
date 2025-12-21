import * as AdminDAO from './adminDAO.js';

export const getSetting = async() => {
    return AdminDAO.getSetting();
}

export const updateSetting = async(newSetting) => {
    await AdminDAO.updateSetting(newSetting);
    return await AdminDAO.getSetting();
}