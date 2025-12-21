import { response } from "../Config/response.js";
import { status } from "../Config/response.status.js";

import * as AdminDAO from './adminDAO.js';
import { BaseError } from '../Config/error.js';

export const verifyAdmin = async (req, res, next) => {
    const result = await AdminDAO.getPassword();
    console.log("passwordDB ", result.password)
    console.log("passwordReq ", req.body.password);
    if(req.body.password !== result.password) throw new BaseError(status.UNAUTHORIZED);
    next();
}