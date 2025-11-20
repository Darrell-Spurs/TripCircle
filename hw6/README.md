# LINE Chatbot Server with OpenAI Integration

A backend server for a LINE Chatbot that uses OpenAI's API to generate intelligent responses to user messages.

## Features

- Receives messages from LINE Chatbot via webhook
- Processes text messages using OpenAI API
- Maintains conversation context and history
- Stores all conversations in MongoDB
- Sends AI-generated responses back to LINE users
- Handles webhook signature verification for security
- Graceful error handling with rate limit and quota management

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
- **OPENAI_MODEL**: (Optional) The OpenAI model to use (default: `gpt-3.5-turbo`)
- **OPENAI_MAX_TOKENS**: (Optional) Maximum tokens for responses (default: `500`)
- **OPENAI_SYSTEM_PROMPT**: (Optional) Custom system prompt for the AI

### 4. LINE Bot Configuration

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Create a new provider and channel (Messaging API)
3. In your channel settings:
   - Enable "Webhook"
   - Set the webhook URL to: `https://323f071ed0f9.ngrok-free.app/webhook`
   - Disable "Auto-reply messages" (optional, but recommended)
   - Enable "Webhook" in the Messaging API settings

### 5. Local Development with ngrok

For local development, you'll need to expose your local server to the internet:

```bash
# Install ngrok (if not already installed)
# Then run:
ngrok http 3000
```

Use the HTTPS URL provided by ngrok as your webhook URL in LINE Developers Console.

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /webhook` - LINE webhook endpoint (receives messages from LINE)

## How It Works

1. User sends a message to your LINE Bot
2. LINE sends a webhook event to `/webhook` endpoint
3. Server verifies the webhook signature
4. Server saves the user message to MongoDB
5. Server retrieves conversation history from MongoDB (last 10 messages)
6. Server sends the message + history to OpenAI API for context-aware responses
7. Server receives the AI-generated response
8. Server saves the AI response to MongoDB
9. Server sends the response back to the user via LINE Messaging API

## Database Schema

The application uses MongoDB to store conversations:

- **Conversation**: Contains user ID and array of messages
- **Message**: Contains role (user/assistant), content, and timestamp

Conversation history is automatically limited to the last 20 messages to manage token usage.

## Project Structure

```
hw6/
├── src/
│   ├── app.ts                    # Express app setup
│   ├── server.ts                 # Server entry point
│   ├── routes/
│   │   └── webhook.routes.ts     # LINE webhook handler
│   ├── services/
│   │   ├── openai.service.ts     # OpenAI API integration
│   │   └── conversation.service.ts # Conversation/DB operations
│   ├── models/
│   │   ├── Conversation.ts       # MongoDB Conversation model
│   │   └── Message.ts            # MongoDB Message model
│   ├── utils/
│   │   └── db.ts                 # MongoDB connection utility
│   └── middleware/
│       └── error.middleware.ts   # Error handling
├── package.json
├── tsconfig.json
├── env.template                  # Environment variables template
├── MONGODB_SETUP.md             # MongoDB Atlas setup guide
└── README.md
```

## Troubleshooting

### Webhook Verification Failed

- Make sure `LINE_CHANNEL_SECRET` is correct
- Ensure the webhook URL is accessible from the internet
- Check that the webhook is enabled in LINE Developers Console

### OpenAI API Errors

- Verify your `OPENAI_API_KEY` is valid
- Check your OpenAI account has sufficient credits
- Ensure the API key has the necessary permissions

### Messages Not Being Received

- Verify the webhook URL is correctly set in LINE Developers Console
- Check server logs for incoming webhook events
- Ensure the LINE Bot is added as a friend in the LINE app

### MongoDB Connection Issues

- Verify `MONGODB_URI` is correctly set in `.env`
- Check that your IP address is whitelisted in MongoDB Atlas Network Access
- Ensure database user credentials are correct
- See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed setup instructions

## License

ISC

