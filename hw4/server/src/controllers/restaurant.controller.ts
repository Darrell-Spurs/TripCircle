import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import db from '../utils/db';
import { GoogleMapsService } from '../services/google-maps.service';

export const getRestaurants = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status, search, tag } = req.query;

    let query = `
      SELECT 
        r.*,
        GROUP_CONCAT(rt.tag_id) as tag_ids,
        COUNT(DISTINCT vr.id) as total_visits,
        COALESCE(SUM(vr.total_spent), 0) as total_spent,
        COALESCE(AVG(vr.rating), 0) as average_rating
      FROM restaurants r
      LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
      LEFT JOIN visit_records vr ON r.id = vr.restaurant_id
      WHERE r.user_id = ?
    `;

    const params: any[] = [userId];

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (r.name LIKE ? OR r.address LIKE ? OR r.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` GROUP BY r.id ORDER BY r.updated_at DESC`;

    const restaurants = db.prepare(query).all(...params) as any[];

    // 處理標籤
    for (const restaurant of restaurants) {
      if (restaurant.tag_ids) {
        const tagIds = restaurant.tag_ids.split(',');
        const tags = tagIds.map((tagId: string) => 
          db.prepare('SELECT name FROM tags WHERE id = ?').get(tagId)
        ).filter(Boolean).map((t: any) => t.name);
        restaurant.tags = tags;
      } else {
        restaurant.tags = [];
      }
      delete restaurant.tag_ids;
    }

    // 標籤篩選
    let filteredRestaurants = restaurants;
    if (tag) {
      filteredRestaurants = restaurants.filter((r: any) => r.tags.includes(tag));
    }

    // 處理圖片
    for (const restaurant of filteredRestaurants) {
      const images = db.prepare('SELECT image_url FROM restaurant_images WHERE restaurant_id = ?')
        .all(restaurant.id)
        .map((row: any) => row.image_url);
      restaurant.images = images.length > 0 ? images : undefined;
    }

    res.json({ success: true, data: filteredRestaurants });
  } catch (error) {
    console.error('Error getting restaurants:', error);
    res.status(500).json({ success: false, error: 'Failed to get restaurants' });
  }
};

export const getRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ? AND user_id = ?')
      .get(id, userId) as any;

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    // 取得標籤
    const tags = db.prepare(`
      SELECT t.name FROM tags t
      JOIN restaurant_tags rt ON t.id = rt.tag_id
      WHERE rt.restaurant_id = ?
    `).all(id).map((row: any) => row.name);
    restaurant.tags = tags;

    // 取得圖片
    const images = db.prepare('SELECT image_url FROM restaurant_images WHERE restaurant_id = ?')
      .all(id)
      .map((row: any) => row.image_url);
    restaurant.images = images.length > 0 ? images : undefined;

    // 取得統計資料
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_visits,
        COALESCE(SUM(total_spent), 0) as total_spent,
        COALESCE(AVG(rating), 0) as average_rating
      FROM visit_records
      WHERE restaurant_id = ?
    `).get(id) as any;
    const statsData = stats || {};
    restaurant.total_visits = statsData.total_visits || 0;
    restaurant.total_spent = statsData.total_spent || 0;
    restaurant.average_rating = statsData.average_rating || 0;

    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Error getting restaurant:', error);
    res.status(500).json({ success: false, error: 'Failed to get restaurant' });
  }
};

export const createRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, address, phone, website, description, images, tags, status } = req.body;

    if (!name || !address) {
      return res.status(400).json({ success: false, error: 'Name and address are required' });
    }

    // Geocoding 取得經緯度
    const geocodeResult = await GoogleMapsService.geocodeAddress(address);
    if (!geocodeResult) {
      return res.status(400).json({ success: false, error: 'Failed to geocode address' });
    }

    const restaurantId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO restaurants (id, user_id, name, address, latitude, longitude, phone, website, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      restaurantId,
      userId,
      name,
      geocodeResult.formattedAddress || address,
      geocodeResult.lat,
      geocodeResult.lng,
      phone || null,
      website || null,
      description || null,
      status || 'want_to_visit',
      now,
      now
    );

    // 處理圖片
    if (images && Array.isArray(images)) {
      for (const imageUrl of images) {
        const imageId = crypto.randomUUID();
        db.prepare('INSERT INTO restaurant_images (id, restaurant_id, image_url) VALUES (?, ?, ?)')
          .run(imageId, restaurantId, imageUrl);
      }
    }

    // 處理標籤
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        // 取得或建立標籤
        let tag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?')
          .get(userId, tagName);

        let tagId;
        if (!tag) {
          tagId = crypto.randomUUID();
          db.prepare('INSERT INTO tags (id, user_id, name, color) VALUES (?, ?, ?, ?)')
            .run(tagId, userId, tagName, '#FF5722');
        } else {
          tagId = (tag as any).id;
        }

        // 建立關聯
        db.prepare('INSERT OR IGNORE INTO restaurant_tags (restaurant_id, tag_id) VALUES (?, ?)')
          .run(restaurantId, tagId);
      }
    }

    res.status(201).json({ success: true, data: { id: restaurantId }, message: 'Restaurant created successfully' });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ success: false, error: 'Failed to create restaurant' });
  }
};

export const updateRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { name, address, phone, website, description, images, tags, status } = req.body;

    // 檢查餐廳是否存在
    const existing = db.prepare('SELECT id FROM restaurants WHERE id = ? AND user_id = ?')
      .get(id, userId);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    let updateQuery = 'UPDATE restaurants SET updated_at = ?';
    const updateParams: any[] = [new Date().toISOString()];

    // 如果更新地址，重新 geocode
    let newLat = null, newLng = null, newAddress = null;
    if (address) {
      const geocodeResult = await GoogleMapsService.geocodeAddress(address);
      if (geocodeResult) {
        newLat = geocodeResult.lat;
        newLng = geocodeResult.lng;
        newAddress = geocodeResult.formattedAddress || address;
        updateQuery += ', address = ?, latitude = ?, longitude = ?';
        updateParams.push(newAddress, newLat, newLng);
      }
    }

    if (name) {
      updateQuery += ', name = ?';
      updateParams.push(name);
    }
    if (phone !== undefined) {
      updateQuery += ', phone = ?';
      updateParams.push(phone || null);
    }
    if (website !== undefined) {
      updateQuery += ', website = ?';
      updateParams.push(website || null);
    }
    if (description !== undefined) {
      updateQuery += ', description = ?';
      updateParams.push(description || null);
    }
    if (status) {
      updateQuery += ', status = ?';
      updateParams.push(status);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    db.prepare(updateQuery).run(...updateParams);

    // 更新圖片
    if (images !== undefined) {
      // 刪除舊圖片
      db.prepare('DELETE FROM restaurant_images WHERE restaurant_id = ?').run(id);
      // 新增新圖片
      if (Array.isArray(images)) {
        for (const imageUrl of images) {
          const imageId = crypto.randomUUID();
          db.prepare('INSERT INTO restaurant_images (id, restaurant_id, image_url) VALUES (?, ?, ?)')
            .run(imageId, id, imageUrl);
        }
      }
    }

    // 更新標籤
    if (tags !== undefined) {
      // 刪除舊標籤關聯
      db.prepare('DELETE FROM restaurant_tags WHERE restaurant_id = ?').run(id);
      // 新增新標籤
      if (Array.isArray(tags)) {
        for (const tagName of tags) {
          let tag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?')
            .get(userId, tagName);
          
          let tagId;
          if (!tag) {
            tagId = crypto.randomUUID();
            db.prepare('INSERT INTO tags (id, user_id, name, color) VALUES (?, ?, ?, ?)')
              .run(tagId, userId, tagName, '#FF5722');
          } else {
            tagId = (tag as any).id;
          }
          
          db.prepare('INSERT OR IGNORE INTO restaurant_tags (restaurant_id, tag_id) VALUES (?, ?)')
            .run(id, tagId);
        }
      }
    }

    res.json({ success: true, message: 'Restaurant updated successfully' });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ success: false, error: 'Failed to update restaurant' });
  }
};

export const deleteRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // 檢查餐廳是否存在
    const existing = db.prepare('SELECT id FROM restaurants WHERE id = ? AND user_id = ?')
      .get(id, userId);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    // 由於有外鍵約束，相關資料會自動刪除
    db.prepare('DELETE FROM restaurants WHERE id = ?').run(id);

    res.json({ success: true, message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ success: false, error: 'Failed to delete restaurant' });
  }
};

export const searchPlaces = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.body;
    const { lat, lng } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    const location = (lat && lng) ? { lat: parseFloat(lat as string), lng: parseFloat(lng as string) } : undefined;
    const places = await GoogleMapsService.searchPlaces(query, location);

    res.json({ success: true, data: places });
  } catch (error) {
    console.error('Error searching places:', error);
    res.status(500).json({ success: false, error: 'Failed to search places' });
  }
};
