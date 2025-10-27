import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import db from '../utils/db';

export const getTags = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tags = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name').all(userId);
    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Error getting tags:', error);
    res.status(500).json({ success: false, error: 'Failed to get tags' });
  }
};

export const createTag = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Tag name is required' });
    }

    // 檢查標籤是否已存在
    const existing = db.prepare('SELECT * FROM tags WHERE user_id = ? AND name = ?').get(userId, name);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Tag already exists' });
    }

    const tagId = crypto.randomUUID();
    db.prepare('INSERT INTO tags (id, user_id, name, color) VALUES (?, ?, ?, ?)')
      .run(tagId, userId, name, color || '#FF5722');

    res.status(201).json({ success: true, data: { id: tagId }, message: 'Tag created successfully' });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ success: false, error: 'Failed to create tag' });
  }
};

export const deleteTag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // 檢查標籤是否存在且屬於該使用者
    const existing = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Tag not found' });
    }

    // 由於有外鍵約束，相關資料會自動刪除
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);

    res.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ success: false, error: 'Failed to delete tag' });
  }
};
