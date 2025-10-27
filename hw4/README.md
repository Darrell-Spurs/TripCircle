# 美食探索 - 餐廳收藏及探索系統

這是一個基於 React + TypeScript + Material UI 的餐廳收藏及探索系統，讓使用者可以收藏餐廳、記錄拜訪、評分和統計分析。

## 📁 專案結構

```
hw4/
├── client/              # 前端 (React + TypeScript + Vite)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── server/              # 後端 (Node.js + Express + SQLite)
│   ├── src/
│   ├── database/
│   ├── package.json
│   └── ...
└── README.md
```

## 🚀 功能特色

### 📍 地圖功能
- **Google Maps 整合**：顯示餐廳位置
- **地圖標記**：不同顏色標記不同狀態的餐廳
- **地圖互動**：點擊標記查看餐廳資訊
- **地圖檢視切換**：支援地圖和列表檢視切換

### 🍽️ 餐廳管理
- **餐廳收藏**：新增、編輯、刪除餐廳
- **狀態分類**：想去、去過、常去三種狀態
- **標籤系統**：自訂標籤分類（午餐、西式、拉麵等）
- **詳細資訊**：地址、電話、網站、描述等

### 📝 拜訪紀錄
- **拜訪記錄**：記錄拜訪時間、評分、備註
- **餐點記錄**：記錄餐點名稱、價格、評分
- **照片上傳**：支援拜訪照片（預留功能）
- **花費統計**：自動計算總花費

### 📊 統計分析
- **綜合統計**：總餐廳數、拜訪次數、總花費、平均評分
- **排行榜**：最常拜訪、評分最高、花費最多餐廳
- **標籤分析**：最受歡迎標籤統計
- **月度趨勢**：最近6個月拜訪趨勢

### 📅 行事曆檢視
- **月曆顯示**：以月曆形式顯示拜訪紀錄
- **日期詳情**：點擊日期查看當日拜訪詳情
- **視覺化標記**：有拜訪的日期顯示評分和餐廳名稱

### 🔍 搜尋與篩選
- **關鍵字搜尋**：搜尋餐廳名稱、地址、標籤
- **狀態篩選**：依餐廳狀態篩選
- **標籤篩選**：依標籤篩選餐廳
- **評分篩選**：依評分範圍篩選

## 🛠️ 技術棧

### 前端
- **React 18** - 使用者介面框架
- **TypeScript** - 型別安全的 JavaScript
- **Vite** - 快速建置工具
- **Material UI** - UI 元件庫
- **React Router** - 前端路由
- **Google Maps JavaScript API** - 地圖功能

### 後端
- **Node.js** - JavaScript 執行環境
- **Express** - Web 應用程式框架
- **SQLite** - 輕量級資料庫
- **JWT** - 使用者認證
- **bcrypt** - 密碼雜湊

### 狀態管理
- **React Context** - 全域狀態管理
- **自定義 Hooks** - 邏輯重用

### 資料結構
- **TypeScript Interfaces** - 強型別資料定義
- **Mock Data** - 假資料測試
- **SQLite Database** - 資料庫儲存

## 📁 專案結構

```
hw4/
├── src/
│   ├── components/          # 共用元件
│   │   ├── Layout.tsx      # 主要布局
│   │   └── GoogleMap.tsx   # 地圖元件
│   ├── pages/              # 頁面元件
│   │   ├── HomePage.tsx    # 首頁
│   │   ├── RestaurantListPage.tsx    # 餐廳列表
│   │   ├── RestaurantDetailPage.tsx  # 餐廳詳情
│   │   ├── VisitRecordsPage.tsx      # 拜訪紀錄
│   │   ├── CalendarPage.tsx          # 行事曆
│   │   └── StatsPage.tsx             # 統計頁面
│   ├── context/            # Context 狀態管理
│   │   └── AppContext.tsx  # 應用程式狀態
│   ├── types/              # TypeScript 型別定義
│   │   └── index.ts        # 所有型別定義
│   ├── data/               # 資料相關
│   │   └── mockData.ts     # 假資料
│   ├── App.tsx             # 主應用程式元件
│   └── main.tsx            # 應用程式入口點
├── package.json            # 專案依賴
└── README.md              # 專案說明
```

## 🚀 快速開始

### 前端 (Client)

#### 安裝依賴
```bash
cd client
npm install
```

#### 啟動開發伺服器
```bash
npm run dev
```

#### 建置專案
```bash
npm run build
```

### 後端 (Server)

#### 安裝依賴
```bash
cd server
npm install
```

#### 設定環境變數
建立 `server/.env` 檔案：
```env
PORT=3000
JWT_SECRET=your-secret-key
```

#### 啟動開發伺服器
```bash
npm run dev
```

伺服器將在 http://localhost:3000 運行

## 🔧 環境設定

### Google Maps API Key
要啟用地圖功能，需要設定 Google Maps API Key：

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 Google Maps JavaScript API
4. 建立 API Key
5. 在 `src/components/GoogleMap.tsx` 中設定 API Key

```typescript
// 在 GoogleMap.tsx 中載入 API
const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
```

## 📱 頁面功能

### 首頁 (/)
- 顯示統計摘要
- 最近拜訪的餐廳
- 常去餐廳快速檢視

### 餐廳列表 (/restaurants)
- 所有餐廳的卡片檢視
- 搜尋和篩選功能
- 地圖/列表檢視切換
- 新增餐廳按鈕

### 餐廳詳情 (/restaurants/:id)
- 餐廳完整資訊
- 地圖顯示位置
- 拜訪紀錄列表
- 新增拜訪功能

### 拜訪紀錄 (/visits)
- 所有拜訪紀錄列表
- 搜尋和篩選功能
- 統計資訊顯示

### 行事曆 (/calendar)
- 月曆檢視拜訪紀錄
- 點擊日期查看詳情
- 月度統計資訊

### 統計資料 (/stats)
- 綜合統計分析
- 排行榜顯示
- 標籤統計
- 月度趨勢

## 🎨 UI/UX 特色

- **響應式設計**：支援桌面和行動裝置
- **Material Design**：現代化 UI 設計
- **直觀導航**：側邊欄導航選單
- **視覺化資料**：圖表、評分、標籤等視覺元素
- **互動式地圖**：Google Maps 整合

## 🔮 未來功能

- [ ] 使用者認證系統
- [ ] 後端 API 整合
- [ ] 資料庫儲存
- [ ] 照片上傳功能
- [ ] 社交分享功能
- [ ] 推薦系統
- [ ] 離線支援
- [ ] 推播通知

## 📄 授權

此專案僅供學習使用。