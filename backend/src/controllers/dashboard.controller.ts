import { Request, Response } from 'express';
import * as repository from '../services/repository.service';
import * as github from '../services/github.service';
import { getDatabaseStatus } from '../config/database';
import { env, isDatabaseConfigured } from '../config/env';
import { asyncHandler } from '../middleware/errorHandler';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await repository.getDashboardData();
  const dbStatus = await getDatabaseStatus();

  res.json({
    ...data,
    database: {
      configured: dbStatus.configured,
      connected: dbStatus.connected,
    },
  });
});

export const getRiskCenter = asyncHandler(async (_req: Request, res: Response) => {
  const data = await repository.getRiskCenterData();
  res.json({
    ...data,
    databaseAvailable: isDatabaseConfigured(),
  });
});

export const getSearchHistory = asyncHandler(async (_req: Request, res: Response) => {
  const history = await repository.getSearchHistory();
  res.json({
    items: history,
    databaseAvailable: isDatabaseConfigured(),
  });
});

export const getMonitor = asyncHandler(async (_req: Request, res: Response) => {
  const dbStatus = await getDatabaseStatus();
  const rateLimit = await github.fetchRateLimit();

  let databaseStatus: 'connected' | 'not_configured' | 'unavailable';
  if (!dbStatus.configured) {
    databaseStatus = 'not_configured';
  } else if (dbStatus.connected) {
    databaseStatus = 'connected';
  } else {
    databaseStatus = 'unavailable';
  }

  res.json({
    apiStatus: 'connected',
    databaseStatus,
    githubRateLimit: rateLimit
      ? {
          remaining: rateLimit.remaining,
          limit: rateLimit.limit,
          used: rateLimit.used,
          resetAt: new Date(rateLimit.reset * 1000).toISOString(),
        }
      : null,
    cache: {
      ttlHours: 24,
      strategy: 'Repository analyses are cached for 24 hours when PostgreSQL is connected.',
      freshLabel: 'Fresh result',
      cachedLabel: 'Cached result',
      fallbackNote: 'Live GitHub API data is used when the database is not configured.',
    },
    githubToken: {
      configured: Boolean(env.githubToken),
    },
    lastCheckedAt: new Date().toISOString(),
  });
});

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const dbStatus = await getDatabaseStatus();
  const dashboard = await repository.getDashboardData();

  res.json({
    status: 'ok',
    service: 'GitHub Repository Insights API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    github: {
      tokenConfigured: Boolean(process.env.GITHUB_TOKEN),
      rateLimit: dashboard.rateLimit,
    },
  });
});
