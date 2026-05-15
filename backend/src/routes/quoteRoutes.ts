import { Router } from 'express';
import { error } from '../utils/responseHelpers';

export const quoteRoutes = Router();

quoteRoutes.post('/quote', async (_req, res, next) => {
  try {
    error(res, 'Not yet implemented', 501);
  } catch (e) {
    next(e);
  }
});
