import express from 'express';
import cors, { type CorsOptions } from 'cors';
import { env } from './config/env';
import { getDatabaseStatus } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  env.frontendUrl,
].filter((origin, index, origins) => Boolean(origin) && origins.indexOf(origin) === index);

function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

const app = express();

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    service: 'GitHub Repository Insights API',
    status: 'ok',
    health: '/api/health',
    monitor: '/api/monitor',
  });
});

app.use('/api', routes);

app.use(errorHandler);

const start = async () => {
  await getDatabaseStatus();

  app.listen(env.port, () => {
    console.log(`GitHub Repository Insights API running on port ${env.port}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
