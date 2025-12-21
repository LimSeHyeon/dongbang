import { status } from "../Config/response.status.js";
import { response } from "../Config/response.js";

import * as AdminService from "./adminService.js";

export const getSettingInfo = async (req, res, next) => {
    res.send(response(status.SUCCESS, await AdminService.getSetting()));
};

export const changeSettingInfo = async (req, res, next) => {
    res.send(response(status.SUCCESS, await AdminService.updateSetting(req.body)));
}

export const changePassword = async (req, res, next) => {
    res.send(response(status.SUCCESS, await AdminService.updatePassword(req.body)));
}