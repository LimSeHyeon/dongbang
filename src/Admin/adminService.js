import * as AdminDAO from './adminDAO.js';

export const getSetting = async() => {
    return AdminDAO.getSetting();
}