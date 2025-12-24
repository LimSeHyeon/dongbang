import express from 'express';
import * as AdminController from './adminController.js';
import { verifyAdmin } from './adminMiddleware.js';

export const adminRouter = express.Router();

adminRouter.post('', verifyAdmin, AdminController.getSettingInfo);

adminRouter.patch('/setting', AdminController.changeSettingInfo);

adminRouter.patch('/password', AdminController.changePassword);

adminRouter.post('/reserve', AdminController.requestReserve);