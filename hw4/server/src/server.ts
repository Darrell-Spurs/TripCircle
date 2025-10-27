import app from './app';
import { initializeDatabase } from './utils/db';

const PORT = process.env.PORT || 3000;

// 初始化資料庫
initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 API Health Check: http://localhost:${PORT}/api/health`);
});
