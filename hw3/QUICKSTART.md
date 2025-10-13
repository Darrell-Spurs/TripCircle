# 🚀 快速啟動指南

## 第一次使用

### 1. 安裝依賴

```bash
cd hw3
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

這會自動：
- ✅ 同步 CSV 檔案到 public/data/
- ✅ 監看 CSV 變更
- ✅ 啟動 Vite 開發伺服器

預設網址：http://localhost:5173

## 📝 常用指令速查

```bash
# 開發
npm run dev          # 啟動開發伺服器（含 CSV 監看）

# 建置
npm run build        # 建置生產版本
npm run preview      # 預覽生產版本

# 測試
npm test            # 執行測試
npm run test:ui     # 測試 UI 模式

# 程式碼品質
npm run lint        # ESLint 檢查
npm run format      # Prettier 格式化
```

## 🎯 首次使用流程

1. **瀏覽項目**（首頁 `/`）
   - 查看範例商品
   - 使用搜尋與篩選功能
   - 點擊「加入」將項目加入容器

2. **暫存容器**（`/container`）
   - 調整數量
   - 新增備註
   - 查看總覽

3. **送出記錄**（`/submit`）
   - 按下「送出記錄」按鈕
   - 完成三步驟流程
   - 自動導向歷史記錄

4. **查看記錄**（`/records`）
   - 檢視已送出的記錄
   - 匯出 JSON
   - 複製到容器進行修改

5. **比較功能**（`/compare`）
   - 在瀏覽頁面勾選項目
   - 點擊「比較」按鈕
   - 查看並排對照表

## 📊 修改 CSV 資料

### 方法一：編輯現有檔案

1. 開啟 `src/public/data/items.csv`
2. 修改內容後儲存
3. 開發伺服器會自動重新載入

### 方法二：新增檔案

1. 在 `src/public/data/` 建立新的 `.csv` 檔案
2. 編輯 `src/context/DataContext.tsx`：
   ```tsx
   <DataProvider csvUrls={['/data/items.csv', '/data/your-file.csv']}>
   ```

### CSV 欄位說明

| 必要欄位 | 說明 |
|---------|------|
| `name` | 項目名稱（必填） |
| `id` | 唯一 ID（可選，自動產生） |
| `category` | 分類（用於篩選） |
| `price` | 價格（用於排序與篩選） |
| `rating` | 評分（用於篩選） |
| `stock` | 庫存 |
| `description` | 描述 |
| `image_url` | 圖片網址（雲端連結） |

其他欄位會自動顯示在詳情中。

## 🐛 常見問題

### Q: 畫面空白或報錯？
A: 檢查：
1. CSV 檔案格式是否正確
2. `src/public/data/items.csv` 是否存在
3. 瀏覽器 Console 是否有錯誤訊息

### Q: CSV 修改後沒有更新？
A: 
1. 確認開發伺服器正在執行
2. 手動點擊頁面右上角的「重新載入」按鈕
3. 重啟開發伺服器：`Ctrl+C` → `npm run dev`

### Q: 圖片無法顯示？
A: 確認 `image_url` 是有效的網路連結，例如：
- ✅ `https://images.unsplash.com/photo-...`
- ❌ `./images/photo.jpg`（本地路徑不支援）

### Q: 容器或記錄消失了？
A: 資料儲存在 `localStorage`，清除瀏覽器資料會遺失。建議定期匯出 JSON 備份。

## 🎨 客製化提示

### 更改主題顏色

編輯 `src/App.tsx`：
```tsx
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' }, // 改為您的品牌色
  },
});
```

### 調整每頁顯示數量

編輯 `src/pages/BrowsePage.tsx`：
```tsx
const ITEMS_PER_PAGE = 12; // 改為 8、16、20 等
```

### 多語系文案

所有文案目前為繁體中文硬編碼。若需多語系，建議整合 `react-i18next`。

## 📚 延伸閱讀

- [完整 README](./README.md)
- [Material UI 文件](https://mui.com/)
- [React Router 文件](https://reactrouter.com/)
- [Papa Parse 文件](https://www.papaparse.com/)

---

**祝您使用愉快！** 🎉

有任何問題請參考 README.md 或查看原始碼註解。

