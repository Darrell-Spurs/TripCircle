import { Router } from 'express';
import {
  getVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
} from '../controllers/visit.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// 所有拜訪紀錄相關路由都需要認證
router.use(authenticateToken);

router.get('/', getVisits);
router.get('/:id', getVisit);
router.post('/', createVisit);
router.put('/:id', updateVisit);
router.delete('/:id', deleteVisit);

export default router;
