# LeetLens - Backend

This is the robust Express & TypeScript backend that powers LeetLens. It acts as a secure proxy to fetch LeetCode data via GraphQL, manages user accounts, handles AI insight generation, and caches heavy requests using Redis to ensure blazing-fast performance.

## 🚀 Features

- **LeetCode GraphQL Proxy**: Securely fetches and processes complex LeetCode statistics.
- **Redis Caching**: Highly optimized Upstash Redis integration to cache external API responses and minimize latency.
- **Authentication & Security**: 
  - JWT Access/Refresh Token architecture (stored in secure HTTP-only cookies).
  - Google OAuth2.0 Integration.
  - LeetCode profile ownership verification (via bio tokens).
  - Password reset flows via email (Resend API).
- **AI Integration**: Connects to OpenRouter/Gemini to generate personalized learning insights based on LeetCode data.
- **Rate Limiting**: Built-in proxy-aware rate limiting to prevent spam and abuse.

## 🛠️ Tech Stack

- **Framework**: Node.js, Express.js
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose)
- **Caching**: Redis (via ioredis)
- **Security**: Helmet, Express Rate Limit, CORS, bcrypt, jsonwebtoken
- **Email**: Resend API

## ⚙️ Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
CLIENT_URL=http://localhost:5173

# Database & Caching
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_upstash_redis_url

# JWT Secrets
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Third Party APIs
GOOGLE_CLIENT_ID=your_google_client_id
OPENROUTER_API_KEY=your_openrouter_api_key
RESEND_API_KEY=your_resend_api_key
```

## 📦 Installation & Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile TypeScript and start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Start production server:
   ```bash
   npm start
   ```

## 🌐 Deployment

This backend is optimized for deployment on **Render** (Web Service). 
Ensure your Render environment variables are correctly mapped, specifically `CLIENT_URL` pointing to your deployed Vercel frontend.

---
*Made with ❤️ by Rishabh Jha*
