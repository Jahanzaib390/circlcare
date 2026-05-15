import { Router } from 'express';
import { error } from '../utils/responseHelpers';

export const demoRoutes = Router();

demoRoutes.post('/demo/scenario/:id', async (_req, res, next) => {
  try {
    error(res, 'Not yet implemented', 501);
  } catch (e) {
    next(e);
  }
});
