# X Clone - Full-Stack Social Media Platform

**Deploy Link:** https://wp1141-8fci.vercel.app

A full-featured Twitter/X clone built with Next.js, Fastify, and PostgreSQL, featuring real-time updates, OAuth authentication, and comprehensive social interactions.

---

## 📋 功能清單 (Features)

### 🔐 Authentication & User Management
- **OAuth 登入系統**
  - 支援 Google, GitHub, Facebook OAuth 登入
  - 首次登入自動導向註冊頁面設定 handle 和顯示名稱
  - JWT-based session management
  - 自動登入功能（session 未過期時）
  - 安全的登出機制

### 👤 個人檔案管理
- **個人資料頁面**
  - 顯示用戶資訊：大頭貼、顯示名稱、handle、簡介、位置
  - 顯示粉絲/追蹤數、貼文數
  - 分頁顯示：貼文、喜歡的貼文
- **編輯個人資料 (進階功能)**
  - 彈出式編輯視窗（Modal UI）
  - 可編輯：顯示名稱、個人簡介、位置、網站
  - 即時字數統計
  - 表單驗證（字數限制、URL 格式）
  - 儲存後自動更新顯示

### 📝 貼文功能
- **發文系統**
  - 280 字元限制
  - 即時字數計數器
  - 草稿自動儲存功能
  - 支援回覆其他貼文
- **互動功能**
  - 按讚 / 取消按讚
  - 轉發 (Repost) / 取消轉發
  - 回覆貼文
  - 點擊貼文查看完整對話串

### 💬 評論系統 (進階功能)
- **遞迴式評論串**
  - 無限層級的評論回覆
  - 點擊評論進入下一層對話
  - 麵包屑導航（左箭頭返回上一層）
  - 完整對話樹狀結構顯示
  - Thread view 遞迴渲染

### 📰 Timeline 功能
- **雙模式 Timeline**
  - **For You**: 顯示全平台所有貼文（按時間排序）
  - **Following**: 僅顯示追蹤用戶的貼文
- **即時更新**
  - React Query 自動重新整理
  - 無限滾動載入 (Infinite Scroll)
  - Optimistic UI updates

### 🔗 進階 UI 功能
- **超連結自動偵測**
  - 自動偵測貼文中的 URL
  - 自動轉換為可點擊連結
  - 在新分頁開啟外部連結
- **轉發顯示優化**
  - 個人頁面顯示轉發貼文
  - 轉發上方顯示 "You reposted" / "Username reposted"
  - 時間軸按轉發/發文時間混合排序
- **互動狀態同步**
  - 個人頁面也能按讚/轉發/取消
  - 即時更新按鈕狀態（已按讚會高亮）
  - 跨頁面狀態同步

### 🎨 UI/UX 特色
- 深色主題設計
- 響應式布局（支援手機、平板、桌面）
- 平滑動畫與過渡效果
- Loading 狀態與錯誤處理
- Toast 通知訊息

---

## 🏗️ 系統架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Vercel)                          │
│                     Next.js 15 (App Router)                      │
├─────────────────────────────────────────────────────────────────┤
│  Pages:              Components:           State Management:     │
│  • / (Home)          • Timeline            • React Query         │
│  • /login            • TweetCard           • useSession          │
│  • /register         • ProfileView         • Query Hooks         │
│  • /profile/[handle] • EditProfileModal    • Mutations           │
│  • /post             • Sidebar                                   │
│                                                                   │
│  Middleware:         Auth:                                       │
│  • Route Protection  • NextAuth.js                               │
│  • Handle Check      • OAuth Providers                           │
│                      • JWT Session                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTPS (Bearer JWT Token)
                 │
┌────────────────┴────────────────────────────────────────────────┐
│                    API SERVER (Railway/Render)                   │
│                      Fastify + TypeScript                        │
├─────────────────────────────────────────────────────────────────┤
│  Modules:                                                        │
│  • /api/timeline        → Timeline feeds                        │
│  • /api/posts           → CRUD, like, repost, reply            │
│  • /api/users           → Profile, update, posts, likes        │
│  • /api/drafts          → Draft management                      │
│  • /api/notifications   → Notifications                         │
│                                                                   │
│  Plugins:                                                        │
│  • auth.ts      → JWT verification, currentUserId              │
│  • prisma.ts    → Database client                               │
│                                                                   │
│  Serializers:                                                    │
│  • postSerializer.ts → Consistent post formatting              │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Prisma ORM
                 │
┌────────────────┴────────────────────────────────────────────────┐
│                   DATABASE (Neon PostgreSQL)                     │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                         │
│  • User         → 用戶資料、OAuth accounts                       │
│  • Post         → 貼文內容、回覆關係                             │
│  • PostStat     → 統計數據 (likes, reposts, replies)           │
│  • PostLike     → 按讚記錄                                       │
│  • PostRepost   → 轉發記錄                                       │
│  • Follow       → 追蹤關係                                       │
│  • Draft        → 草稿                                           │
│  • Notification → 通知                                           │
│  • Account      → NextAuth OAuth accounts                       │
│  • Session      → NextAuth sessions                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 資料流程

### 認證流程
```
1. User clicks OAuth provider
2. NextAuth redirects to OAuth provider
3. OAuth provider authenticates & returns
4. NextAuth creates/finds User in DB
5. If no handle → redirect to /register
6. User sets handle & display name → API updates DB
7. NextAuth creates JWT session
8. Frontend extracts JWT via /api/token
9. Frontend sends JWT as Bearer token to backend
10. Backend verifies JWT → grants access
```

### 貼文互動流程
```
1. User clicks like/repost button
2. Frontend sends API request with JWT
3. Backend verifies JWT → gets currentUserId
4. Backend creates/deletes Like/Repost record
5. Backend updates PostStat counters
6. React Query invalidates cache
7. UI automatically refetches & updates
```

### 評論遞迴流程
```
1. User clicks on post/comment
2. Frontend pushes postId to threadStack
3. Fetch thread data recursively from API
4. Render thread with comments as tree
5. User clicks "back" → pop from threadStack
6. Render previous level
```

---

## 🛠️ 技術棧

### Frontend
- **Framework**: Next.js 15 (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Authentication**: NextAuth.js v5
- **Icons**: Heroicons

### Backend
- **Framework**: Fastify
- **Language**: TypeScript (ESM)
- **ORM**: Prisma
- **Authentication**: JWT (jose library)
- **Validation**: Zod

### Database
- **Type**: PostgreSQL
- **Hosting**: Neon (Serverless Postgres)

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway / Render / Fly.io
- **Database**: Neon Cloud

---

## 📦 專案結構

```
hw5/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/auth/          # NextAuth routes & token endpoint
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── profile/[handle]/  # Dynamic profile pages
│   │   └── post/              # Post composer page
│   ├── components/            # React components
│   │   ├── Timeline.tsx       # Main timeline feed
│   │   ├── TweetCard.tsx      # Post display card
│   │   ├── ProfileView.tsx    # Profile page view
│   │   ├── EditProfileModal.tsx # Profile editing modal
│   │   └── Sidebar.tsx        # Navigation sidebar
│   ├── hooks/api/             # React Query hooks
│   ├── lib/
│   │   ├── api/               # API client & types
│   │   ├── auth/              # NextAuth configuration
│   │   └── prisma.ts          # Prisma client (frontend)
│   └── middleware.ts          # Route protection
│
└── server/
    ├── src/
    │   ├── modules/           # Feature modules
    │   │   ├── timeline/      # Timeline routes
    │   │   ├── posts/         # Post CRUD & interactions
    │   │   ├── users/         # User profiles & updates
    │   │   ├── drafts/        # Draft management
    │   │   └── notifications/ # Notifications
    │   ├── plugins/
    │   │   ├── auth.ts        # JWT authentication
    │   │   └── prisma.ts      # Database plugin
    │   └── lib/
    │       ├── env.ts         # Environment validation
    │       └── prisma.ts      # Prisma client (backend)
    └── prisma/
        ├── schema.prisma      # Database schema
        └── seed.ts            # Seed data
```

---

## 🚀 本地開發

### 前置需求
- Node.js 20+
- PostgreSQL (或使用 Neon)
- Google/GitHub/Facebook OAuth credentials

### 安裝與執行

```bash
# 1. Clone repository
git clone <repo-url>

# 2. Install dependencies
cd hw5
npm install
cd server
npm install

# 3. Setup environment variables
# Frontend (.env.local):
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<32-char-secret>
DATABASE_URL=<postgres-url>
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Backend (.env):
DATABASE_URL=<postgres-url>
NEXTAUTH_SECRET=<same-32-char-secret>
CLIENT_ORIGIN=http://localhost:3000
PORT=4000

# 4. Run database migrations
cd server
npx prisma migrate dev
npx prisma db seed

# 5. Start development servers
# Terminal 1 (Backend):
cd hw5/server
npm run dev

# Terminal 2 (Frontend):
cd hw5
npm run dev
```

訪問: http://localhost:3000

---

## 📝 重要筆記

### Authentication
- `NEXTAUTH_SECRET` 必須在前後端使用**完全相同**的 32 字元字串
- JWT token 透過 `/api/token` 端點從前端傳送到後端
- 後端使用 `jwtVerify` 驗證 signed JWT (HS256)

### Database
- 使用 Prisma migrations 管理 schema
- 前端需要 Prisma client 供 NextAuth 使用
- 後端需要 Prisma client 供 API 使用

### Deployment
- Frontend `.vercelignore` 排除 `server/` 資料夾
- 記得更新 OAuth redirect URLs 到正式環境
- 環境變數需在 Vercel 和 Railway 分別設定

---

## 👨‍💻 作者

Darrell Yu - NTU Web Programming 114-1

---

## 📄 授權

MIT License
