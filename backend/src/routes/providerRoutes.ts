import { Router } from 'express';
import { success } from '../utils/responseHelpers';
import providers from '../../data/providers.json';

export const providerRoutes = Router();

providerRoutes.get('/providers', (_req, res) => {
  success(res, providers);
});
providerRoutes.get('/providers/:id', (req, res) => {
  const p = (providers as any[]).find((x) => x.id === req.params.id);
  if (!p)
    return res
      .status(404)
      .json({ success: false, error: 'Provider not found', data: null, meta: {} });
  success(res, p);
});
providerRoutes.post('/providers/:id/reputation', async (_req, res, next) => {
  try {
    success(res, { updated: true });
  } catch (e) {
    next(e);
  }
});
