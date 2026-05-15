import { Router } from 'express';
import { error } from '../utils/responseHelpers';

export const parseRoutes = Router();

parseRoutes.post('/parse-request', async (_req, res, next) => {
  try {
    // TODO Phase 1.3 — implement Gemini parse-request
    error(res, 'Not yet implemented', 501);
  } catch (e) {
    next(e);
  }
});
