import { Router } from 'express';
import {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  searchPlaces,
} from '../controllers/restaurant.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// 所有餐廳相關路由都需要認證
router.use(authenticateToken);

router.get('/', getRestaurants);
router.get('/:id', getRestaurant);
router.post('/', createRestaurant);
router.put('/:id', updateRestaurant);
router.delete('/:id', deleteRestaurant);
router.post('/search', searchPlaces);

export default router;
