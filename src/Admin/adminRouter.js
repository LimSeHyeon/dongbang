import express from 'express';
import * as AdminController from './adminController.js';

export const adminRouter = express.Router();

adminRouter.get('/setting', AdminController.getSettingInfo);