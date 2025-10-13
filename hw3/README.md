# 商品目錄系統 - HW3

一個純前端的商品目錄與暫存容器系統，使用 React + TypeScript 建構，資料來源為 CSV 檔案。

## ✨ 功能特色

- **項目瀏覽**：搜尋、分類篩選、價格與評分篩選、多種排序方式
- **暫存容器**：可新增、修改數量、備註、移除項目
- **送出記錄**：步驟化提交流程，記錄永久儲存
- **歷史記錄**：查看、匯出 JSON、複製為新容器
- **項目比較**：最多可比較 4 個項目，支援「只顯示差異」模式
- **CSV 熱更新**：修改 CSV 檔案後自動同步與重新載入

## 🛠️ 技術棧

- **前端框架**：React 18 + TypeScript
- **建構工具**：Vite
- **UI 框架**：Material UI (MUI)
- **路由**：React Router v6
- **狀態管理**：React Context + 自訂 Hooks
- **CSV 解析**：Papa Parse
- **持久化儲存**：localStorage
- **測試**：Vitest
- **程式碼品質**：ESLint + Prettier

## 📦 安裝

```bash
# 安裝依賴
npm install
```

## 🚀 啟動與使用

### 開發模式

```bash
npm run dev
```

啟動後會：
1. 自動將 `src/public/data/*.csv` 同步到 `public/data/`
2. 監看 CSV 檔案變更並自動同步
3. 啟動 Vite 開發伺服器（預設 http://localhost:5173）

### 建置生產版本

```bash
npm run build
```

### 預覽生產版本

```bash
npm run preview
```

### 執行測試

```bash
# 執行測試
npm test

# 測試 UI 模式
npm run test:ui
```

### 程式碼格式化

```bash
# 執行 Lint 檢查
npm run lint

# 格式化程式碼
npm run format
```

## 📁 專案結構

```
hw3/
├─ src/
│  ├─ public/
│  │  └─ data/              # CSV 檔案來源目錄（由此處同步至 public/data）
│  │     └─ items.csv       # 項目資料
│  ├─ components/           # React 元件
│  │  ├─ LayoutShell.tsx    # 主版面配置
│  │  ├─ ItemCard.tsx       # 項目卡片
│  │  ├─ ItemDetailsDialog.tsx
│  │  ├─ CatalogFilters.tsx # 篩選器
│  │  ├─ SortSelect.tsx     # 排序選擇器
│  │  ├─ ContainerPanel.tsx # 容器面板
│  │  ├─ ContainerSummary.tsx
│  │  ├─ SubmitStepper.tsx  # 送出步驟器
│  │  └─ CompareTable.tsx   # 比較表格
│  ├─ context/              # React Context
│  │  ├─ DataContext.tsx    # CSV 資料管理
│  │  ├─ ContainerContext.tsx # 容器狀態
│  │  └─ RecordsContext.tsx # 記錄管理
│  ├─ hooks/                # 自訂 Hooks
│  │  ├─ useFilters.ts      # 篩選與排序邏輯
│  │  ├─ useDebounce.ts     # Debounce
│  │  └─ useCompare.ts      # 比較功能
│  ├─ pages/                # 頁面元件
│  │  ├─ BrowsePage.tsx     # 瀏覽頁面
│  │  ├─ ContainerPage.tsx  # 容器頁面
│  │  ├─ SubmitPage.tsx     # 送出頁面
│  │  ├─ RecordsPage.tsx    # 記錄頁面
│  │  └─ ComparePage.tsx    # 比較頁面
│  ├─ types/                # TypeScript 型別定義
│  │  └─ index.ts
│  ├─ utils/                # 工具函式
│  │  ├─ csvParser.ts       # CSV 解析
│  │  ├─ filters.ts         # 篩選邏輯
│  │  └─ storage.ts         # localStorage 操作
│  ├─ App.tsx               # 主應用程式
│  └─ main.tsx              # 入口檔案
├─ public/
│  └─ data/                 # 同步後的 CSV（由 scripts 產生，不需手動修改）
├─ scripts/
│  └─ copy-data.mjs         # CSV 監看與同步腳本
├─ package.json
├─ vite.config.ts
├─ vitest.config.ts
├─ tsconfig.json
├─ .eslintrc.cjs
├─ .prettierrc.json
└─ README.md
```

## 📊 CSV 資料格式

### 必要欄位（建議）

| 欄位名稱 | 說明 | 範例 |
|---------|------|------|
| `id` | 唯一識別碼（若無，系統自動產生） | `1` |
| `name` | 項目名稱 | `無線藍牙耳機 Pro` |
| `category` | 分類 | `電子產品` |
| `description` | 簡述 | `高品質降噪藍牙耳機` |
| `image_url` | 圖片 URL（使用雲端連結） | `https://images.unsplash.com/photo-...` |
| `price` | 價格（數值） | `3990` |
| `rating` | 評分（數值） | `4.5` |
| `stock` | 庫存（數值） | `50` |

### 動態欄位

除了上述欄位，您可以新增任何欄位，系統會自動顯示：

```csv
id,name,category,price,brand,warranty,color
1,產品A,類別1,1000,品牌X,2年,黑色
```

### 如何更新資料

1. **開發模式**：直接編輯 `src/public/data/items.csv`，儲存後會自動同步並重新載入
2. **新增 CSV**：將新檔案放到 `src/public/data/`，檔名需為 `*.csv`
3. **多檔案**：若需載入多個 CSV，請修改 `src/context/DataContext.tsx` 的 `csvUrls` 參數

### 圖片資源

**重要**：請勿將大型圖片放入 repo。請使用：
- 雲端圖床（如 Imgur、Cloudinary）
- 免費圖片庫（如 Unsplash、Pexels）的直連 URL

範例：
```csv
image_url
https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400
https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?w=400
```

## 🗺️ 頁面說明

### 1. 瀏覽商品（`/`）

- 搜尋框（300ms debounce）
- 分類多選篩選
- 價格區間 slider
- 最低評分 slider
- 排序選擇（價格、評分、名稱、庫存）
- 分頁顯示（每頁 12 個項目）
- 「加入容器」與「查看詳情」按鈕
- 可勾選項目進行比較（最多 4 個）

### 2. 暫存容器（`/container`）

- 列出容器內所有項目
- 調整數量（+-）
- 新增備註
- 移除項目
- 顯示摘要（種類、總數、總金額）
- 「清空容器」與「送出記錄」按鈕

### 3. 送出記錄（`/submit`）

- 三步驟流程：
  1. 確認項目
  2. 最終檢查
  3. 完成送出
- 提交後清空容器並建立永久記錄
- 3 秒後自動導向記錄頁

### 4. 歷史記錄（`/records`）

- 表格列出所有記錄（最新在上）
- 可查看詳情（Dialog）
- 匯出單筆或全部記錄（JSON 格式）
- 複製記錄到容器（再次編輯）
- 刪除單筆或清除全部

### 5. 項目比較（`/compare`）

- 並排顯示 2-4 個項目
- 對照表格（欄位差異會 highlight）
- 「只顯示差異」模式切換

## 💾 資料持久化

所有資料儲存在瀏覽器的 `localStorage`：

- **容器（暫存）**：`catalog_container`
- **已送出記錄**：`catalog_records`

清除瀏覽器資料會遺失所有記錄。匯出功能可備份 JSON 檔案。

## 🔧 設定與客製化

### 更改 CSV 路徑

編輯 `src/context/DataContext.tsx`：

```tsx
<DataProvider csvUrls={['/data/items.csv', '/data/other.csv']}>
```

### 調整分頁數量

編輯 `src/pages/BrowsePage.tsx`：

```tsx
const ITEMS_PER_PAGE = 12; // 改為您需要的數量
```

### 更改主題色

編輯 `src/App.tsx`：

```tsx
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' }, // 主色
    secondary: { main: '#dc004e' }, // 輔色
  },
});
```

## 🧪 測試

已包含兩組單元測試：

1. **`src/utils/filters.test.ts`**：測試搜尋、篩選、排序邏輯
2. **`src/utils/csvParser.test.ts`**：測試 CSV 解析功能

執行測試：

```bash
npm test
```

## ♿ 無障礙支援（a11y）

- 所有互動元件含 `aria-label`
- 鍵盤可操作（Tab、Enter）
- 圖片含 `alt` 屬性
- 顏色對比符合 WCAG AA 標準（由 MUI 預設提供）

## 🎨 UI/UX 特色

- 響應式設計（手機、平板、桌面）
- Material Design 視覺語言
- Loading 狀態與錯誤提示
- 操作回饋（Badge、Snackbar）
- 流暢動畫（分頁切換、滾動）

## 📝 驗收條件確認

- ✅ CSV 更新 → 介面自動反映（HMR）
- ✅ 可搜尋/篩選/排序與比較
- ✅ 可加入/移出容器，容器有彙總/提示
- ✅ 可「送出記錄」，提交後行為與暫存不同
- ✅ 歷史記錄可檢視、匯出 JSON、複製為新容器
- ✅ 無登入/金流需求，流程有合理結尾
- ✅ 程式碼模組化（hooks/components/context/utils 分離）
- ✅ README 清楚、.gitignore 正確

## 🚧 已知限制

- 無後端驗證（純前端模擬）
- 無使用者驗證（不需登入）
- 資料儲存於 localStorage（清除瀏覽器會遺失）
- 僅支援 CSV 格式（不支援 Excel、JSON 等）

## 🎯 未來擴充建議

- [ ] 多語系支援（i18n）
- [ ] 雷達圖比較視覺化
- [ ] 無限卷動取代分頁
- [ ] PWA 離線支援
- [ ] 匯入 CSV 上傳功能
- [ ] 深色模式切換

## 📄 授權

MIT License

---

**開發者**：資深前端工程師  
**最後更新**：2025-10-07

