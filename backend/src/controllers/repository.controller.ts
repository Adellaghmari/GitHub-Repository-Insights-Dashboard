import { Request, Response } from 'express';
import * as github from '../services/github.service';
import * as repository from '../services/repository.service';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { isDatabaseConfigured } from '../config/env';
import { getDatabaseStatus } from '../config/database';

const repoParams = (req: Request) => {
  const owner = String(req.params.owner);
  const repo = String(req.params.repo);
  return { owner, repo };
};

export const getRepository = asyncHandler(async (req: Request, res: Response) => {
  const { owner, repo } = repoParams(req);
  const insights = await repository.getRepositoryInsights(owner, repo);
  res.json(insights);
});

export const getLanguages = asyncHandler(async (req: Request, res: Response) => {
  const { owner, repo } = repoParams(req);
  const langMap = await github.getRepositoryLanguages(owner, repo);
  const total = Object.values(langMap).reduce((a, b) => a + b, 0);
  const languages = Object.entries(langMap)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: total > 0 ? Math.round((bytes / total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);
  res.json({ languages, rateLimit: github.getRateLimitStatus() });
});

export const getInsights = asyncHandler(async (req: Request, res: Response) => {
  const { owner, repo } = repoParams(req);
  const insights = await repository.getRepositoryInsights(owner, repo);
  res.json(insights);
});

export const saveRepository = asyncHandler(async (req: Request, res: Response) => {
  if (!isDatabaseConfigured()) {
    throw new AppError('Database features unavailable. Connect PostgreSQL to save analyses.', 503, 'DATABASE_UNAVAILABLE');
  }

  const dbStatus = await getDatabaseStatus();
  if (!dbStatus.connected) {
    throw new AppError('Database connection failed. Check DATABASE_URL.', 503, 'DATABASE_UNAVAILABLE');
  }

  const { owner, repo } = repoParams(req);
  const result = await repository.saveRepository(owner, repo);
  res.status(201).json(result);
});

export const getSavedRepositories = asyncHandler(async (req: Request, res: Response) => {
  if (!isDatabaseConfigured()) {
    res.json({ items: [], databaseAvailable: false });
    return;
  }

  const sort = (req.query.sort as string) || 'last_analyzed_at';
  const order = (req.query.order as 'asc' | 'desc') || 'desc';
  const filter = req.query.filter as string | undefined;

  const items = await repository.getSavedRepositories(sort, order, filter);
  res.json({ items, databaseAvailable: true });
});

export const getSavedRepository = asyncHandler(async (req: Request, res: Response) => {
  if (!isDatabaseConfigured()) {
    throw new AppError('Database features unavailable.', 503, 'DATABASE_UNAVAILABLE');
  }

  const id = parseInt(String(req.params.id), 10);
  const item = await repository.getSavedRepositoryById(id);
  if (!item) throw new AppError('Saved repository not found', 404);
  res.json(item);
});

export const deleteSavedRepository = asyncHandler(async (req: Request, res: Response) => {
  if (!isDatabaseConfigured()) {
    throw new AppError('Database features unavailable.', 503, 'DATABASE_UNAVAILABLE');
  }

  const id = parseInt(String(req.params.id), 10);
  const deleted = await repository.deleteSavedRepository(id);
  if (!deleted) throw new AppError('Saved repository not found', 404);
  res.json({ success: true });
});

export const compareRepositories = asyncHandler(async (req: Request, res: Response) => {
  const { repositories } = req.body as {
    repositories: Array<{ owner: string; name: string }>;
  };

  if (!repositories || repositories.length < 2) {
    throw new AppError('Provide at least 2 repositories to compare', 400);
  }

  if (repositories.length > 4) {
    throw new AppError('Maximum 4 repositories per comparison', 400);
  }

  const result = await repository.compareRepositories(repositories);

  if (isDatabaseConfigured()) {
    const { query: dbQuery } = await import('../config/database');
    const ids = await Promise.all(
      repositories.map(async (r) => {
        const saved = await repository.getSavedRepositories();
        const match = saved.find(
          (s) => s.owner === r.owner && s.name === r.name
        );
        return match?.id;
      })
    );
    const validIds = ids.filter((id): id is number => id !== undefined);
    if (validIds.length > 0) {
      await dbQuery(
        `INSERT INTO comparison_reports (title, repository_ids, summary, winner)
         VALUES ($1, $2, $3, $4)`,
        [
          `Compare: ${repositories.map((r) => `${r.owner}/${r.name}`).join(' vs ')}`,
          validIds,
          result.summary,
          result.winner,
        ]
      );
    }
  }

  res.json({
    ...result,
    databaseAvailable: isDatabaseConfigured(),
  });
});
