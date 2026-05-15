import { Router } from 'express';
import { error } from '../utils/responseHelpers';

export const disputeRoutes = Router();

disputeRoutes.post('/disputes', async (_req, res, next) => {
  try {
    error(res, 'Not yet implemented', 501);
  } catch (e) {
    next(e);
  }
});
