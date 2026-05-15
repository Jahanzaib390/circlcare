import { Router } from 'express';
import { error } from '../utils/responseHelpers';

export const bookingRoutes = Router();

bookingRoutes.post('/bookings', async (_req, res, next) => {
  try {
    error(res, 'Not yet implemented', 501);
  } catch (e) {
    next(e);
  }
});
bookingRoutes.get('/bookings/:id', async (_req, res, next) => {
  try {
    error(res, 'Not yet implemented', 501);
  } catch (e) {
    next(e);
  }
});
bookingRoutes.get('/bookings/:id/status', async (_req, res, next) => {
  try {
    error(res, 'Not yet implemented', 501);
  } catch (e) {
    next(e);
  }
});
bookingRoutes.post('/bookings/:id/simulate', async (_req, res, next) => {
  try {
    error(res, 'Not yet implemented', 501);
  } catch (e) {
    next(e);
  }
});
bookingRoutes.post('/bookings/:id/cancel', async (_req, res, next) => {
  try {
    error(res, 'Not yet implemented', 501);
  } catch (e) {
    next(e);
  }
});
