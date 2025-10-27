import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import db from '../utils/db';

export const getVisits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { restaurantId, startDate, endDate, start, end } = req.query;

    let query = `
      SELECT vr.*, r.name as restaurant_name, r.address as restaurant_address
      FROM visit_records vr
      JOIN restaurants r ON vr.restaurant_id = r.id
      WHERE vr.user_id = ?
    `;

    const params: any[] = [userId];

    if (restaurantId) {
      query += ` AND vr.restaurant_id = ?`;
      params.push(restaurantId);
    }

    if (startDate) {
      query += ` AND vr.visit_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND vr.visit_date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY vr.visit_date DESC`;

    // 分頁
    if (start && end) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(end as string) - parseInt(start as string), parseInt(start as string));
    }

    const visits = db.prepare(query).all(...params) as any[];

    // 取得餐點資料
    for (const visit of visits) {
      const dishes = db.prepare('SELECT * FROM dishes WHERE visit_id = ?').all(visit.id);
      visit.dishes = dishes;

      const photos = db.prepare('SELECT photo_url FROM visit_photos WHERE visit_id = ?')
        .all(visit.id)
        .map((row: any) => row.photo_url);
      visit.photos = photos.length > 0 ? photos : undefined;
    }

    res.json({ success: true, data: visits });
  } catch (error) {
    console.error('Error getting visits:', error);
    res.status(500).json({ success: false, error: 'Failed to get visits' });
  }
};

export const getVisit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const visit = db.prepare('SELECT * FROM visit_records WHERE id = ? AND user_id = ?')
      .get(id, userId) as any;

    if (!visit) {
      return res.status(404).json({ success: false, error: 'Visit not found' });
    }

    // 取得餐廳資訊
    const restaurant = db.prepare('SELECT id, name, address FROM restaurants WHERE id = ?')
      .get((visit as any).restaurant_id);
    (visit as any).restaurant = restaurant;

    // 取得餐點
    const dishes = db.prepare('SELECT * FROM dishes WHERE visit_id = ?').all(id);
    (visit as any).dishes = dishes;

    // 取得照片
    const photos = db.prepare('SELECT photo_url FROM visit_photos WHERE visit_id = ?')
      .all(id)
      .map((row: any) => row.photo_url);
    (visit as any).photos = photos.length > 0 ? photos : undefined;

    res.json({ success: true, data: visit });
  } catch (error) {
    console.error('Error getting visit:', error);
    res.status(500).json({ success: false, error: 'Failed to get visit' });
  }
};

export const createVisit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { restaurantId, visitDate, rating, comment, dishes, totalSpent, photos } = req.body;

    if (!restaurantId || !visitDate || !rating) {
      return res.status(400).json({ success: false, error: 'Restaurant ID, visit date, and rating are required' });
    }

    // 驗證餐廳屬於該使用者
    const restaurant = db.prepare('SELECT id FROM restaurants WHERE id = ? AND user_id = ?')
      .get(restaurantId, userId);

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    const visitId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO visit_records (id, restaurant_id, user_id, visit_date, rating, comment, total_spent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      visitId,
      restaurantId,
      userId,
      new Date(visitDate).toISOString(),
      rating,
      comment || null,
      totalSpent || 0,
      now,
      now
    );

    // 處理餐點
    if (dishes && Array.isArray(dishes)) {
      for (const dish of dishes) {
        const dishId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO dishes (id, visit_id, name, price, rating, comment)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          dishId,
          visitId,
          dish.name,
          dish.price || 0,
          dish.rating || null,
          dish.comment || null
        );
      }
    }

    // 處理照片
    if (photos && Array.isArray(photos)) {
      for (const photoUrl of photos) {
        const photoId = crypto.randomUUID();
        db.prepare('INSERT INTO visit_photos (id, visit_id, photo_url) VALUES (?, ?, ?)')
          .run(photoId, visitId, photoUrl);
      }
    }

    res.status(201).json({ success: true, data: { id: visitId }, message: 'Visit created successfully' });
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ success: false, error: 'Failed to create visit' });
  }
};

export const updateVisit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { visitDate, rating, comment, dishes, totalSpent, photos } = req.body;

    // 檢查拜訪紀錄是否存在
    const existing = db.prepare('SELECT id FROM visit_records WHERE id = ? AND user_id = ?')
      .get(id, userId);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Visit not found' });
    }

    let updateQuery = 'UPDATE visit_records SET updated_at = ?';
    const updateParams: any[] = [new Date().toISOString()];

    if (visitDate) {
      updateQuery += ', visit_date = ?';
      updateParams.push(new Date(visitDate).toISOString());
    }
    if (rating !== undefined) {
      updateQuery += ', rating = ?';
      updateParams.push(rating);
    }
    if (comment !== undefined) {
      updateQuery += ', comment = ?';
      updateParams.push(comment || null);
    }
    if (totalSpent !== undefined) {
      updateQuery += ', total_spent = ?';
      updateParams.push(totalSpent);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    db.prepare(updateQuery).run(...updateParams);

    // 更新餐點
    if (dishes !== undefined) {
      // 刪除舊餐點
      db.prepare('DELETE FROM dishes WHERE visit_id = ?').run(id);
      // 新增新餐點
      if (Array.isArray(dishes)) {
        for (const dish of dishes) {
          const dishId = crypto.randomUUID();
          db.prepare(`
            INSERT INTO dishes (id, visit_id, name, price, rating, comment)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            dishId,
            id,
            dish.name,
            dish.price || 0,
            dish.rating || null,
            dish.comment || null
          );
        }
      }
    }

    // 更新照片
    if (photos !== undefined) {
      // 刪除舊照片
      db.prepare('DELETE FROM visit_photos WHERE visit_id = ?').run(id);
      // 新增新照片
      if (Array.isArray(photos)) {
        for (const photoUrl of photos) {
          const photoId = crypto.randomUUID();
          db.prepare('INSERT INTO visit_photos (id, visit_id, photo_url) VALUES (?, ?, ?)')
            .run(photoId, id, photoUrl);
        }
      }
    }

    res.json({ success: true, message: 'Visit updated successfully' });
  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({ success: false, error: 'Failed to update visit' });
  }
};

export const deleteVisit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // 檢查拜訪紀錄是否存在
    const existing = db.prepare('SELECT id FROM visit_records WHERE id = ? AND user_id = ?')
      .get(id, userId);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Visit not found' });
    }

    // 由於有外鍵約束，相關資料會自動刪除
    db.prepare('DELETE FROM visit_records WHERE id = ?').run(id);

    res.json({ success: true, message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ success: false, error: 'Failed to delete visit' });
  }
};
