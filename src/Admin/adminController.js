import express from "express";
import * as AdminService from "./adminService.js";

import { status } from "../Config/response.status.js";
import { response } from "../Config/response.js";

export const getSettingInfo = async (req, res, next) => {
    res.send(response(status.SUCCESS, await AdminService.getSetting()));
};
