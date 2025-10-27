import { Router } from 'express';
import { getTags, createTag, deleteTag } from '../controllers/tag.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// 所有標籤相關路由都需要認證
router.use(authenticateToken);

router.get('/', getTags);
router.post('/', createTag);
router.delete('/:id', deleteTag);

export default router;
