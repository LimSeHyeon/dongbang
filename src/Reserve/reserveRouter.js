import express from 'express';
import * as ReserveController from './reserveController.js';
import { checkTime } from './reserveMiddleware.js';

export const reserveRouter = express.Router();

reserveRouter.post('', checkTime, ReserveController.requestReserveInfo);

reserveRouter.delete('', ReserveController.cancelReserve);