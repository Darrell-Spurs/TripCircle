import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../database/restaurants.db');

// 確保 database 資料夾存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(DB_PATH);

// 啟用 WAL 模式以提升效能
db.pragma('journal_mode = WAL');

// 初始化資料庫
export function initializeDatabase() {
  const initSQL = fs.readFileSync(
    path.join(__dirname, '../../database/init.sql'),
    'utf-8'
  );
  
  db.exec(initSQL);
  console.log('✅ Database initialized successfully');
}

// 關閉資料庫連線
export function closeDatabase() {
  db.close();
}

export default db;
