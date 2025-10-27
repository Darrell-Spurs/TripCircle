import app from './app';
import { initializeDatabase } from './utils/db';

const PORT = process.env.PORT || 3000;

// 檢查環境變數
console.log('Environment check:');
console.log('- PORT:', PORT);
console.log('- GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Not set');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');

// 初始化資料庫
initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Debug: http://localhost:${PORT}/api/debug/env`);
});
