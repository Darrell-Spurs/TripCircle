# AI 食記助手 (AI Food Review Assistant)

A LINE Chatbot that helps users record and manage restaurant reviews. Users can send food review messages, and the bot extracts key information (restaurant name, rating, tags, price, meal type) using AI, then stores it in a database with a management dashboard.

## Features

- **LINE Bot Integration**: Receives food review messages from LINE users
- **AI-Powered Extraction**: Uses OpenAI to extract restaurant name, summary, tags, rating, price, and meal type from user messages
- **Follow-up Questions**: Asks users for missing information (price, meal type) when not provided
- **MongoDB Storage**: Stores all reviews, restaurants, and user statistics
- **Management Dashboard**: Next.js web interface to view:
  - All reviews with filtering options
  - Restaurant statistics and aggregated data
  - User statistics
  - Tag frequency and distribution
  - Price and meal type analytics
- **Real-time Updates**: Dashboard updates automatically with new reviews

## Prerequisites

- Node.js (v18 or higher recommended)
- LINE Developer Account and a LINE Bot channel
- OpenAI API key
- MongoDB Atlas account (free tier) - See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for setup instructions

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB Atlas

Follow the detailed guide in [MONGODB_SETUP.md](./MONGODB_SETUP.md) to:
1. Create a MongoDB Atlas account
2. Create a free cluster
3. Get your connection string

### 3. Configure Environment Variables

Create a `.env` file in the root directory based on `env.template`:

```bash
cp env.template .env
```

Fill in the following values:

- **LINE_CHANNEL_SECRET**: Get this from your LINE Developers Console (Channel Settings > Basic settings > Channel secret)
- **LINE_CHANNEL_ACCESS_TOKEN**: Get this from your LINE Developers Console (Messaging API > Channel access token)
- **MONGODB_URI**: Your MongoDB Atlas connection string (see MONGODB_SETUP.md)
- **OPENAI_API_KEY**: Get this from [OpenAI Platform](https://platform.openai.com/api-keys)
- **OPENAI_MODEL**: (Optional) The OpenAI model to use (default: `gpt-5-nano`)
- **OPENAI_MAX_COMPLETION_TOKENS**: (Optional) Maximum completion tokens for responses (default: `800`)

### 4. LINE Bot Configuration

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Create a new provider and channel (Messaging API)
3. In your channel settings:
   - Enable "Webhook"
   - Set the webhook URL to your deployed URL or ngrok URL: `https://your-domain.com/api/webhook`
   - Disable "Auto-reply messages" (optional, but recommended)
   - Enable "Webhook" in the Messaging API settings

### 5. Local Development with ngrok

For local development, you'll need to expose your local server to the internet:

```bash
# Install ngrok (if not already installed)
# Then run:
ngrok http 3000
```

Use the HTTPS URL provided by ngrok as your webhook URL in LINE Developers Console: `https://your-ngrok-url.ngrok-free.app/api/webhook`

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will start on `http://localhost:3000`

### Production Mode

```bash
npm run build
npm start
```

## How It Works

1. User sends a food review message to your LINE Bot (e.g., "今天去吃八方雲集，總共140元，鍋貼超好吃")
2. LINE sends a webhook event to `/api/webhook` endpoint
3. Server verifies the webhook signature
4. Server detects if the message is a food review
5. Server uses OpenAI to extract:
   - Restaurant name
   - Summary (50-100 characters)
   - Tags (好吃, 便宜, 服務佳, etc.)
   - Rating (1-5)
   - Price level (高/中/便宜)
   - Price amount (if mentioned)
   - Meal type (breakfast/lunch/dinner)
6. If information is missing, bot asks follow-up questions
7. Server saves the review to MongoDB
8. Server updates restaurant and user statistics
9. Server sends confirmation message back to user

## Database Schema

The application uses MongoDB to store:

- **Review**: Individual food reviews with restaurant name, summary, tags, rating, price, meal type
- **Restaurant**: Aggregated statistics per restaurant (total reviews, average rating, tag counts, price distribution)
- **UserStats**: User-specific statistics (total reviews, favorite tags)
- **Conversation**: Full conversation history for context
- **PendingReview**: Temporary storage for incomplete reviews during follow-up questions

## Project Structure

```
hw6/
├── app/
│   ├── api/
│   │   ├── webhook/          # LINE webhook handler
│   │   ├── reviews/          # Review CRUD endpoints
│   │   ├── restaurants/      # Restaurant endpoints
│   │   ├── stats/            # Statistics endpoints
│   │   ├── conversations/    # Conversation endpoints
│   │   └── users/            # User endpoints
│   ├── components/           # React components
│   ├── reviews/             # Reviews page
│   ├── restaurants/          # Restaurants page
│   ├── conversations/        # Conversations page
│   └── stats/               # Statistics page
├── lib/
│   ├── models/              # MongoDB models
│   ├── services/            # Business logic services
│   └── utils/               # Utility functions
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── env.template
├── MONGODB_SETUP.md
└── README.md
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/webhook` - LINE webhook endpoint
- `GET /api/reviews` - List reviews with filters
- `GET /api/reviews/[id]` - Get a specific review
- `GET /api/restaurants` - List all restaurants
- `GET /api/restaurants/[name]` - Get restaurant details
- `GET /api/stats/reviews` - Get review statistics
- `GET /api/stats` - Get conversation statistics
- `GET /api/tags` - Get tag frequency
- `GET /api/users` - List users
- `GET /api/users/[id]/reviews` - Get user's reviews
- `GET /api/conversations` - List conversations
- `GET /api/conversations/[id]` - Get conversation details

## Dashboard Pages

- `/` - Homepage with overview statistics
- `/reviews` - List all reviews with filtering
- `/restaurants` - List all restaurants with statistics
- `/restaurants/[name]` - Restaurant detail page
- `/conversations` - List all conversations
- `/conversations/[id]` - Conversation detail page
- `/stats` - Detailed statistics page

## Troubleshooting

### Webhook Verification Failed

- Make sure `LINE_CHANNEL_SECRET` is correct
- Ensure the webhook URL is accessible from the internet
- Check that the webhook is enabled in LINE Developers Console

### OpenAI API Errors

- Verify your `OPENAI_API_KEY` is valid
- Check your OpenAI account has sufficient credits
- Ensure the API key has the necessary permissions
- If using `gpt-5-nano`, note that it's a reasoning model that may use all tokens for reasoning

### Messages Not Being Received

- Verify the webhook URL is correctly set in LINE Developers Console
- Check server logs for incoming webhook events
- Ensure the LINE Bot is added as a friend in the LINE app

### MongoDB Connection Issues

- Verify `MONGODB_URI` is correctly set in `.env`
- Check that your IP address is whitelisted in MongoDB Atlas Network Access (use `0.0.0.0/0` for Vercel deployment)
- Ensure database user credentials are correct
- See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed setup instructions

## Deployment

### Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Make sure to whitelist `0.0.0.0/0` in MongoDB Atlas Network Access for Vercel deployment.

## License

ISC
