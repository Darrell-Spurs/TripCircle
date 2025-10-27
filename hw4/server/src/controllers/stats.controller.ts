import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import db from '../utils/db';

export const getOverview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 總餐廳數
    const totalRestaurants = db.prepare('SELECT COUNT(*) as count FROM restaurants WHERE user_id = ?')
      .get(userId) as any;

    // 總拜訪次數與總花費
    const visitStats = db.prepare(`
      SELECT 
        COUNT(*) as total_visits,
        COALESCE(SUM(total_spent), 0) as total_spent
      FROM visit_records
      WHERE user_id = ?
    `).get(userId) as any;

    // 平均評分
    const avgRating = db.prepare(`
      SELECT COALESCE(AVG(rating), 0) as average_rating
      FROM visit_records
      WHERE user_id = ?
    `).get(userId) as any;

    res.json({
      success: true,
      data: {
        totalRestaurants: totalRestaurants.count || 0,
        totalVisits: visitStats.total_visits || 0,
        totalSpent: visitStats.total_spent || 0,
        averageRating: avgRating.average_rating || 0,
      }
    });
  } catch (error) {
    console.error('Error getting overview:', error);
    res.status(500).json({ success: false, error: 'Failed to get overview stats' });
  }
};

export const getMonthlyStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 取得最近 12 個月的拜訪統計
    const monthlyStats = db.prepare(`
      SELECT 
        strftime('%Y-%m', visit_date) as month,
        COUNT(*) as count,
        COALESCE(SUM(total_spent), 0) as spent
      FROM visit_records
      WHERE user_id = ?
        AND visit_date >= datetime('now', '-12 months')
      GROUP BY strftime('%Y-%m', visit_date)
      ORDER BY month DESC
    `).all(userId) as any[];

    res.json({ success: true, data: monthlyStats });
  } catch (error) {
    console.error('Error getting monthly stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get monthly stats' });
  }
};

export const getTopRestaurants = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 取得拜訪次數最多的餐廳
    const topRestaurants = db.prepare(`
      SELECT 
        r.*,
        COUNT(vr.id) as visit_count,
        COALESCE(SUM(vr.total_spent), 0) as total_spent,
        COALESCE(AVG(vr.rating), 0) as average_rating
      FROM restaurants r
      LEFT JOIN visit_records vr ON r.id = vr.restaurant_id
      WHERE r.user_id = ?
      GROUP BY r.id
      ORDER BY visit_count DESC, average_rating DESC
      LIMIT 10
    `).all(userId) as any[];

    // 處理標籤
    for (const restaurant of topRestaurants) {
      const tags = db.prepare(`
        SELECT t.name FROM tags t
        JOIN restaurant_tags rt ON t.id = rt.tag_id
        WHERE rt.restaurant_id = ?
      `).all(restaurant.id).map((row: any) => row.name);
      restaurant.tags = tags;
    }

    res.json({ success: true, data: topRestaurants });
  } catch (error) {
    console.error('Error getting top restaurants:', error);
    res.status(500).json({ success: false, error: 'Failed to get top restaurants' });
  }
};
