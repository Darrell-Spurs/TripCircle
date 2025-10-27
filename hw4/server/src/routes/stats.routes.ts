import { Router } from 'express';
import { getOverview, getMonthlyStats, getTopRestaurants } from '../controllers/stats.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// 所有統計相關路由都需要認證
router.use(authenticateToken);

router.get('/overview', getOverview);
router.get('/monthly', getMonthlyStats);
router.get('/top-restaurants', getTopRestaurants);

export default router;
