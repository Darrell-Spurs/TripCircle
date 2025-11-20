import app from './app';
import { connectDB } from './utils/db';

const PORT = process.env.PORT || 3000;

// Check environment variables
console.log('Environment check:');
console.log('- PORT:', PORT);
console.log('- LINE_CHANNEL_SECRET:', process.env.LINE_CHANNEL_SECRET ? '✅ Set' : '❌ Not set');
console.log('- LINE_CHANNEL_ACCESS_TOKEN:', process.env.LINE_CHANNEL_ACCESS_TOKEN ? '✅ Set' : '❌ Not set');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');

// Connect to database and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 LINE Chatbot server is running on http://localhost:${PORT}`);
      console.log(`📝 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

