# 餐廳收藏後端 API

## 技術棧

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT + bcrypt
- **Language**: TypeScript

## 專案結構

```
server/
├── src/
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中介軟體
│   ├── routes/         # 路由
│   ├── utils/          # 工具函數
│   ├── app.ts          # Express 應用
│   └── server.ts       # 伺服器啟動
├── database/
│   ├── init.sql        # 資料庫初始化
│   └── restaurants.db  # SQLite 資料庫
├── package.json
└── tsconfig.json
```

## 安裝與執行

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

建立 `.env` 檔案：

```env
PORT=3000
JWT_SECRET=your-secret-key
DB_PATH=./database/restaurants.db
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

伺服器將在 http://localhost:3000 運行

## API 端點

### 認證相關

#### 註冊
```
POST /api/auth/register
Body: { username, email, password }
```

#### 登入
```
POST /api/auth/login
Body: { email, password }
```

#### 取得個人資料
```
GET /api/auth/profile
Headers: { Authorization: Bearer <token> }
```

### 健康檢查

```
GET /api/health
```

## 資料庫 Schema

- **users**: 使用者資料
- **restaurants**: 餐廳資料
- **tags**: 標籤
- **visit_records**: 拜訪紀錄
- **dishes**: 餐點
- **restaurant_tags**: 餐廳標籤關聯

詳細 Schema 請參考 `database/init.sql`

## 開發指令

- `npm run dev` - 啟動開發伺服器 (nodemon + ts-node)
- `npm run build` - 編譯 TypeScript
- `npm start` - 執行編譯後的程式碼

## 安全性

- 密碼使用 bcrypt 雜湊 (10 rounds)
- JWT token 驗證
- SQL Injection 防護 (參數化查詢)
- CORS 設定

## 後續開發

即將添加的功能：
- 餐廳 CRUD API
- 拜訪紀錄 API
- Google Maps 整合
- 分頁與篩選
- 檔案上傳

