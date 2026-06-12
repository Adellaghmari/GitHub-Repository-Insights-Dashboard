import { Request, Response } from 'express';
import * as github from '../services/github.service';
import * as repository from '../services/repository.service';
import { asyncHandler } from '../middleware/errorHandler';

export const searchRepositories = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const page = parseInt((req.query.page as string) || '1', 10);
  const perPage = parseInt((req.query.per_page as string) || '20', 10);
  const sort = (req.query.sort as string) || 'stars';
  const order = (req.query.order as string) || 'desc';

  if (!q.trim()) {
    res.json({ total_count: 0, items: [], incomplete_results: false });
    return;
  }

  const results = await github.searchRepositories(q, page, perPage, sort, order);

  await repository.recordSearch(q, results.total_count);

  const items = results.items.map((item) => {
    const issueRatio = item.stargazers_count > 0
      ? item.open_issues_count / item.stargazers_count
      : 0;
    let riskHint = 'low';
    if (issueRatio > 0.08) riskHint = 'high';
    else if (issueRatio > 0.03) riskHint = 'medium';

    return {
      id: item.id,
      owner: item.owner.login,
      name: item.name,
      fullName: item.full_name,
      description: item.description,
      htmlUrl: item.html_url,
      stars: item.stargazers_count,
      forks: item.forks_count,
      openIssues: item.open_issues_count,
      language: item.language,
      updatedAt: item.updated_at,
      pushedAt: item.pushed_at,
      license: item.license?.spdx_id || null,
      riskHint,
    };
  });

  res.json({
    total_count: results.total_count,
    incomplete_results: results.incomplete_results,
    items,
    rateLimit: github.getRateLimitStatus(),
  });
});
