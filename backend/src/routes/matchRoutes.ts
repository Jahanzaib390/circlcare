import { Router } from 'express';
import { error } from '../utils/responseHelpers';

export const matchRoutes = Router();

matchRoutes.post('/match', async (_req, res, next) => {
  try {
    error(res, 'Not yet implemented', 501);
  } catch (e) {
    next(e);
  }
});
