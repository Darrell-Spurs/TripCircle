# 美食探索 - 餐廳收藏及探索系統

## 📖 專案簡介

這是一個基於 **React + TypeScript + Material UI + Express + SQLite** 的餐廳收藏及探索系統，讓使用者可以：

- 🔍 使用 Google Places API 搜尋並收藏餐廳
- 📍 在地圖上視覺化餐廳位置
- 📝 記錄拜訪紀錄、評分與花費
- 📊 查看統計分析與趨勢
- 🏷️ 使用標籤分類管理餐廳

### 使用情境

1. **日常用餐規劃**：收藏想去的餐廳，記錄拜訪後的心得
2. **用餐習慣追蹤**：統計每月花費、最常去的餐廳類型
3. **社交分享**：查看評分最高或最常拜訪的餐廳
4. **地理探索**：在地圖上探索附近或特定區域的餐廳

---

## 🚀 快速開始

### 前置需求

- Node.js 18+ 
- npm 或 yarn
- Google Maps API Key（用於地圖與搜尋功能）

### 1. 安裝依賴

```bash
# 安裝前端依賴
cd client
npm install

# 安裝後端依賴
cd ../server
npm install
```

### 2. 設定環境變數

#### 後端環境變數 (`hw4/server/.env`)

建立 `.env` 檔案：

```env
# 伺服器設定
PORT=3000
NODE_ENV=development

# JWT 認證
JWT_SECRET=your-secret-key-change-in-production

# Google Maps API（必要）
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# 資料庫
DB_PATH=./database/restaurants.db
```

#### 前端環境變數 (`hw4/client/.env.local`)

建立 `.env.local` 檔案：

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:3000

# Google Maps API Key（必要）
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 3. 啟動服務

#### 啟動後端

```bash
cd server
npm run dev
```

後端將在 http://localhost:3000 運行

#### 啟動前端

```bash
cd client
npm run dev
```

前端將在 http://localhost:5173 運行

### 4. 開始使用

1. 打開瀏覽器訪問 http://localhost:5173
2. 註冊新帳號或登入
3. 開始搜尋並收藏餐廳！

---

## 🏗️ 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                         前端 (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React App  │  │ Context API  │  │  Material UI │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                     ┌──────▼──────┐                          │
│                     │ Axios Client│                          │
│                     └──────┬──────┘                          │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────▼─────────────────────────────────┐
│                     後端 (Express)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │→ │ Controllers  │→ │   Services   │      │
│  └──────────────┘  └──────┬───────┘  └──────┬───────┘      │
│                            │                  │              │
│                     ┌──────▼──────┐   ┌──────▼──────────┐   │
│                     │ Middleware  │   │ Google Maps API │   │
│                     │   (JWT)     │   │   (Places/      │   │
│                     └─────────────┘   │   Geocoding)    │   │
│                                       └─────────────────┘   │
│                            │                                 │
│                     ┌──────▼──────┐                          │
│                     │   SQLite    │                          │
│                     │  Database   │                          │
│                     └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### 技術棧

#### 前端
- **React 18** - UI 框架
- **TypeScript** - 型別安全
- **Vite** - 建置工具
- **Material UI** - UI 元件庫
- **React Router** - 路由
- **Axios** - HTTP 客戶端
- **Google Maps JavaScript API** - 地圖功能

#### 後端
- **Node.js** - 執行環境
- **Express** - Web 框架
- **TypeScript** - 型別安全
- **SQLite** - 資料庫（better-sqlite3）
- **JWT** - 認證（jsonwebtoken）
- **bcrypt** - 密碼雜湊
- **dotenv** - 環境變數
- **Google Maps Services** - Places API, Geocoding API

---

## 📝 API 文件

### 認證相關

#### 1. 使用者註冊

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**回應：**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

#### 2. 使用者登入

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**回應：**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

#### 3. 取得個人資料（需要認證）

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**回應：**
```json
{
  "id": "1",
  "username": "testuser",
  "email": "test@example.com"
}
```

### 餐廳相關

#### 4. 搜尋餐廳（Google Places）

```bash
curl -X POST http://localhost:3000/api/restaurants/search \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "query": "信義區餐廳"
  }'
```

**回應：**
```json
{
  "message": "Places found",
  "data": [
    {
      "placeId": "ChIJ...",
      "name": "一風堂拉麵",
      "address": "台北市信義區松仁路100號",
      "lat": 25.0330,
      "lng": 121.5654,
      "phone": "02-2345-6789",
      "rating": 4.5
    }
  ]
}
```

#### 5. 新增餐廳

```bash
curl -X POST http://localhost:3000/api/restaurants \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "一風堂拉麵",
    "address": "台北市信義區松仁路100號",
    "phone": "02-2345-6789",
    "website": "https://ippudo.com.tw",
    "description": "正統日式拉麵",
    "tags": ["拉麵", "日式"],
    "status": "want_to_visit"
  }'
```

**回應：**
```json
{
  "id": "1",
  "name": "一風堂拉麵",
  "address": "台北市信義區松仁路100號",
  "latitude": 25.0330,
  "longitude": 121.5654,
  "status": "want_to_visit",
  "tags": ["拉麵", "日式"],
  ...
}
```

### 完整授權流程範例

```bash
# 1. 註冊
TOKEN=$(curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "email": "demo@example.com",
    "password": "demo123"
  }' | jq -r '.token')

echo "Token: $TOKEN"

# 2. 使用 Token 搜尋餐廳
curl -X POST http://localhost:3000/api/restaurants/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "鼎泰豐"
  }'

# 3. 新增餐廳
curl -X POST http://localhost:3000/api/restaurants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "鼎泰豐",
    "address": "台北市大安區信義路二段194號",
    "tags": ["小籠包", "中式"],
    "status": "want_to_visit"
  }'

# 4. 取得所有餐廳
curl -X GET http://localhost:3000/api/restaurants \
  -H "Authorization: Bearer $TOKEN"
```

### API 端點總覽

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| POST | `/api/auth/register` | 註冊 | ❌ |
| POST | `/api/auth/login` | 登入 | ❌ |
| GET | `/api/auth/profile` | 個人資料 | ✅ |
| GET | `/api/restaurants` | 取得所有餐廳 | ✅ |
| GET | `/api/restaurants/:id` | 取得單一餐廳 | ✅ |
| POST | `/api/restaurants` | 新增餐廳 | ✅ |
| POST | `/api/restaurants/search` | 搜尋 Google Places | ✅ |
| PUT | `/api/restaurants/:id` | 更新餐廳 | ✅ |
| DELETE | `/api/restaurants/:id` | 刪除餐廳 | ✅ |
| GET | `/api/visits` | 取得所有拜訪紀錄 | ✅ |
| POST | `/api/visits` | 新增拜訪紀錄 | ✅ |
| GET | `/api/tags` | 取得所有標籤 | ✅ |

---

## 🔧 環境變數範例

### `.env.example` (後端)

```env
# 伺服器設定
PORT=3000
NODE_ENV=development

# JWT 認證（請在正式環境使用更複雜的密鑰）
JWT_SECRET=your-secret-key-change-in-production

# Google Maps API Key
# 取得方式：https://console.cloud.google.com/
GOOGLE_MAPS_API_KEY=AIzaSy...

# 資料庫路徑
DB_PATH=./database/restaurants.db
```

### `.env.local.example` (前端)

```env
# API 伺服器 URL
VITE_API_BASE_URL=http://localhost:3000

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
```

---

## 🎯 功能特色

### 📍 地圖功能
- Google Maps 整合顯示餐廳位置
- 不同顏色標記不同狀態（想去/去過/常去）
- 地圖與列表檢視切換

### 🍽️ 餐廳管理
- Google Places API 搜尋餐廳
- 自動將地址轉換為座標
- 三種狀態分類（想去/去過/常去）
- 自訂標籤系統
- 完整餐廳資訊（地址、電話、網站、描述）

### 📝 拜訪紀錄
- 記錄拜訪時間、評分、備註
- 花費記錄與統計
- 照片上傳（預留功能）

### 📊 統計分析
- 綜合統計（餐廳數、拜訪次數、總花費、平均評分）
- 排行榜（最常拜訪、評分最高、花費最多）
- 標籤分析
- 月度趨勢圖

### 📅 行事曆檢視
- 月曆形式顯示拜訪紀錄
- 點擊日期查看詳情
- 視覺化標記

### 🔍 搜尋與篩選
- 關鍵字搜尋
- 狀態/標籤/評分篩選
- 即時搜尋結果

---

## ⚠️ 已知問題

1. **Google Maps API 載入**：首次載入地圖可能需要等待 API 載入完成
2. **圖片上傳**：拜訪照片上傳功能尚未實作
3. **離線支援**：目前不支援離線模式
4. **狀態同步**：新增餐廳後需要小延遲以確保狀態同步

---

## 🔮 未來改進方向

### 短期目標
- [ ] 實作圖片上傳功能
- [ ] 加入餐廳評價與評論系統
- [ ] 優化搜尋速度與結果排序
- [ ] 加入餐廳分享功能
- [ ] 支援匯出資料（CSV/JSON）

### 中期目標
- [ ] 實作餐廳推薦系統
- [ ] 加入社交功能（追蹤其他使用者）
- [ ] 開發行動應用程式（React Native）
- [ ] 加入即時通知功能
- [ ] 實作進階統計與分析

### 長期目標
- [ ] 加入 AI 推薦引擎
- [ ] 整合外送平台 API
- [ ] 支援多語言介面
- [ ] 開發管理後台
- [ ] 加入數據視覺化儀表板

---

## 🔒 安全性風險說明

### Google Maps API Key 設定

⚠️ **重要**：如果使用 **Server Key** 且無 IP 限制，請注意以下風險：

#### 風險
1. **未授權存取**：任何人取得 API Key 都可能無限使用您的配額
2. **費用風險**：惡意使用者可能導致高額費用
3. **服務濫用**：過度使用可能導致 API 限流或暫停

#### 建議措施
1. **限制 HTTP 來源**（前端 Key）：
   - 在 Google Cloud Console 設定應用程式網域
   - 例如：`http://localhost:5173`, `https://yourdomain.com`

2. **限制 IP**（後端 Key）：
   - 僅允許您的伺服器 IP
   - 避免設為 0.0.0.0/0（允許所有 IP）

3. **設定配額限制**：
   - 在 Google Cloud Console 設定每日配額上限
   - 啟用計費告警

4. **定期輪換 Key**：
   - 定期更新 API Key
   - 移除不再使用的 Key

5. **不要提交到 Git**：
   - 確保 `.env` 在 `.gitignore` 中
   - 使用環境變數而非硬編碼

### 最佳實踐範例

```env
# ✅ 正確：使用環境變數
GOOGLE_MAPS_API_KEY=AIzaSy...

# ❌ 錯誤：硬編碼在程式碼中
const API_KEY = "AIzaSy..."; // 不安全！
```

---

## 📁 專案結構

```
hw4/
├── client/                    # 前端應用
│   ├── src/
│   │   ├── components/        # UI 元件
│   │   ├── pages/            # 頁面元件
│   │   ├── context/          # Context API
│   │   ├── services/         # API 服務
│   │   └── types/            # TypeScript 型別
│   ├── .env.local           # 前端環境變數
│   └── package.json
│
├── server/                   # 後端應用
│   ├── src/
│   │   ├── controllers/      # 控制器
│   │   ├── middleware/       # 中介軟體
│   │   ├── routes/          # 路由
│   │   ├── services/        # 業務邏輯
│   │   └── utils/           # 工具函數
│   ├── database/            # SQLite 資料庫
│   ├── .env                 # 後端環境變數
│   └── package.json
│
└── README.md                # 專案說明文件
```

---

## 📄 授權

此專案僅供學習使用。

---

## 📞 聯絡資訊

如有問題或建議，歡迎提出 Issue 或 Pull Request。
