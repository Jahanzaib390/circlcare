import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { parseRoutes } from './routes/parseRoutes';
import { matchRoutes } from './routes/matchRoutes';
import { quoteRoutes } from './routes/quoteRoutes';
import { bookingRoutes } from './routes/bookingRoutes';
import { disputeRoutes } from './routes/disputeRoutes';
import { providerRoutes } from './routes/providerRoutes';
import { demoRoutes } from './routes/demoRoutes';
import { transcriptionRoutes } from './routes/transcriptionRoutes';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use(requestLogger);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', parseRoutes);
app.use('/api', matchRoutes);
app.use('/api', quoteRoutes);
app.use('/api', bookingRoutes);
app.use('/api', disputeRoutes);
app.use('/api', providerRoutes);
app.use('/api', demoRoutes);
app.use('/api', transcriptionRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`[CirclCare API] Listening on http://${HOST}:${PORT}`);
});

export { app };
