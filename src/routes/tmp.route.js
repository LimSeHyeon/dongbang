// tmp.route.js

import express from 'express';
import { tempTest } from '../controllers/tmp.controller.js';
	
export const tempRouter = express.Router();

tempRouter.get('/test', tempTest);