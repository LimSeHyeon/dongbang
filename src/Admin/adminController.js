import { status } from "../Config/response.status.js";
import { response } from "../Config/response.js";

import * as AdminService from "./adminService.js";
import * as ReserveService from "../Reserve/reserveService.js";

export const getSettingInfo = async (req, res, next) => {
    res.send(response(status.SUCCESS, await AdminService.getSetting()));
};

export const changeSettingInfo = async (req, res, next) => {
    res.send(response(status.SUCCESS, await AdminService.updateSetting(req.body)));
}

export const changePassword = async (req, res, next) => {
    res.send(response(status.SUCCESS, await AdminService.updatePassword(req.body)));
}

export const requestReserve = async (req, res, next) => {
    const requestedAt = new Date().toISOString()
    const byAdmin = true;
    res.send(response(status.SUCCESS, await ReserveService.createReservation(req.body, requestedAt, byAdmin)));
}

export const getHistory = async (req, res, next) => {
    res.send(response(status.SUCCESS, await AdminService.getWeeklyHistory()));
}