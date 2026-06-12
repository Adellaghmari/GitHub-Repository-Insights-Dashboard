import { Router } from 'express';
import * as searchController from '../controllers/search.controller';
import * as repoController from '../controllers/repository.controller';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.get('/health', dashboardController.getHealth);
router.get('/monitor', dashboardController.getMonitor);
router.get('/dashboard', dashboardController.getDashboard);
router.get('/risk-center', dashboardController.getRiskCenter);
router.get('/search-history', dashboardController.getSearchHistory);

router.get('/search/repositories', searchController.searchRepositories);

router.get('/repositories/:owner/:repo', repoController.getRepository);
router.get('/repositories/:owner/:repo/languages', repoController.getLanguages);
router.get('/repositories/:owner/:repo/insights', repoController.getInsights);
router.post('/repositories/:owner/:repo/save', repoController.saveRepository);

router.get('/saved-repositories', repoController.getSavedRepositories);
router.get('/saved-repositories/:id', repoController.getSavedRepository);
router.delete('/saved-repositories/:id', repoController.deleteSavedRepository);

router.post('/compare', repoController.compareRepositories);

export default router;
