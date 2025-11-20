# MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas (free tier) for the LINE Chatbot project.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" or "Sign Up"
3. Create an account (you can use Google/GitHub to sign up)

## Step 2: Create a Cluster

1. After signing in, you'll be prompted to create a cluster
2. Choose **FREE** tier (M0 Sandbox)
3. Select a cloud provider and region (choose one closest to you)
4. Click "Create Cluster"
5. Wait 3-5 minutes for the cluster to be created

## Step 3: Create Database User

1. In the left sidebar, go to **Database Access**
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username and password (save these!)
5. Under "Database User Privileges", select "Atlas admin" or "Read and write to any database"
6. Click "Add User"

## Step 4: Configure Network Access

1. In the left sidebar, go to **Network Access**
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - ⚠️ For production, restrict to specific IPs
4. Click "Confirm"

## Step 5: Get Connection String

1. In the left sidebar, go to **Database**
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as the driver
5. Copy the connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)

## Step 6: Update Your .env File

1. Open your `.env` file in the project root
2. Replace the connection string with your actual credentials:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/line_chatbot?retryWrites=true&w=majority
```

**Important:**
- Replace `YOUR_USERNAME` with your database username
- Replace `YOUR_PASSWORD` with your database password (URL-encode special characters)
- Replace `cluster0.xxxxx` with your actual cluster name
- Add `/line_chatbot` before the `?` to specify the database name

## Step 7: Test Connection

1. Start your server: `npm run dev`
2. Check the console - you should see: `[DB] ✅ Connected to MongoDB`
3. If you see an error, check:
   - Username and password are correct
   - Network access is configured
   - Connection string is properly formatted

## Troubleshooting

### Connection Timeout
- Check that your IP address is whitelisted in Network Access
- Verify the connection string is correct

### Authentication Failed
- Double-check username and password
- Make sure special characters in password are URL-encoded (e.g., `@` becomes `%40`)

### Database Not Found
- The database will be created automatically when you first save data
- Make sure the database name in the connection string is correct

## URL Encoding Special Characters

If your password contains special characters, encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

Example: If your password is `P@ssw0rd#123`, the connection string should use `P%40ssw0rd%23123`

