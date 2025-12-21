import { status } from "../Config/response.status.js";
import { response } from "../Config/response.js";

import * as ReserveService from "./reserveService.js";

export const requestReserveInfo = async (req, res, next) => {
    res.send(response(status.SUCCESS, await ReserveService.saveRequest(req.body)));
}