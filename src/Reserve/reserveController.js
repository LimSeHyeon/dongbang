import { status } from "../config/response.status.js";
import { response } from "../config/response.js";

import * as ReserveService from "./reserveService.js";

export const requestReserveInfo = async (req, res, next) => {
    res.send(response(status.SUCCESS, await ReserveService.saveRequest(req.body)));
}

export const cancelReserve = async (req, res, next) => {
    res.send(response(status.SUCCESS, await ReserveService.cancelReserve(req.query.reservationId)));
}

export const getReserve = async (req, res, next) => {
    res.send(response(status.SUCCESS, await ReserveService.getWeeklyReserve(req.query.date)))
}

export const changeReserve = async (req, res, next) => {
    res.send(response(status.SUCCESS, await ReserveService.checkAndChangeReserve(req.body)));
}
