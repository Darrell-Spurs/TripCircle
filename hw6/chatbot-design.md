# Food Tracker - 對話/功能設計

## 1. 主題

### 部署連結
- LINE Bot URL: https://line.me/R/ti/p/@650lylgo
- Line Bot QR Code:
![Line Bot QR Code](img/qrcode.png)
- 管理後台的 Production URL: https://wp1141-kappa-nine.vercel.app/


**Food Tracker**是一個整合 LINE Messaging API 的智慧聊天機器人，專注於幫助使用者記錄、管理和查詢餐廳食記。使用者可以透過自然語言分享用餐體驗，系統會使用 OpenAI LLM 自動提取關鍵資訊（餐廳名稱、評分、標籤、價格、餐點類型等），並提供友善的互動介面與統計分析功能。

### 核心價值
- **簡化記錄流程**：使用者只需用自然語言描述用餐體驗，AI 自動提取結構化資訊
- **智能互動**：當資訊不完整時，系統會主動詢問，確保資料完整性
- **豐富查詢功能**：可查看個人食記、餐廳資訊、統計數據與網站
- **優雅降級**：當 LLM 服務不可用時，提供明確的錯誤訊息與替代方案

---

## 2. 功能列表

### 2.1 核心功能

#### 📝 記錄食記
- **觸發方式**：使用者直接分享用餐體驗（例如：「今天去吃八方雲集，總共140元，鍋貼超好吃」）
- **處理流程**：
  1. 使用 LLM 提取餐廳名稱、摘要、標籤、評分、價格、餐點類型
  2. 檢查資訊完整性（價格、餐點類型）
  3. 如有缺失，詢問後續問題
  4. 儲存至 MongoDB 並更新統計資料
  5. 回傳確認訊息

#### 📋 我的食記
- **觸發方式**：使用者輸入「我的食記」或點擊 Quick Reply
- **功能**：顯示使用者所有食記的 Carousel 模板
- **顯示內容**：餐廳名稱、評分、價格、餐點類型、標籤、日期
- **互動選項**：每個 card 包含「查看餐廳詳情」和「主選單」兩個按鈕

#### 🍽️ 餐廳查詢
- **觸發方式**：使用者輸入「餐廳查詢 [餐廳名稱]」或「查看 [餐廳名稱] 的詳情」
- **功能**：顯示餐廳詳細資訊
- **顯示內容**：平均評分、總評論數、熱門標籤、價格分布、餐點分布
- **互動選項**：查看評論、回到我的食記、主選單

#### 📊 統計資訊
- **觸發方式**：使用者輸入「統計資訊」或「統計」
- **功能**：顯示整體統計數據
- **顯示內容**：總食記數、總餐廳數、平均評分、熱門標籤、熱門餐廳
- **互動選項**：我的食記、主選單

#### 🌐 查看網站
- **觸發方式**：使用者輸入「查看網站」或「網站」
- **功能**：顯示網站連結按鈕
- **顯示格式**：Buttons Template with URI Action
- **連結**：
  - 開發環境：`http://localhost:3000`
  - 生產環境：`https://wp1141-kappa-nine.vercel.app`

#### ❓ 幫助
- **觸發方式**：使用者輸入「幫助」或「help」
- **功能**：顯示使用說明與功能介紹
- **顯示格式**：Buttons Template

### 2.2 輔助功能

#### 主選單
- **觸發方式**：首次使用、輸入「主選單」或「menu」
- **功能**：顯示所有主要功能的 Quick Reply 選項

#### 歡迎訊息
- **觸發時機**：使用者首次加入 Bot（follow 事件）
- **內容**：歡迎訊息 + 主選單 Quick Reply

---

## 3. 對話腳本

### 3.1 文字訊息

#### 一般聊天回應
- **情境**：使用者發送非命令、非食記的一般訊息
- **處理方式**：
  1. 檢查是否有對話歷史
  2. 如有歷史，使用 LLM 生成回應（維持上下文）
  3. 如無歷史，顯示主選單
  4. 回應後附加 Quick Reply 選項

#### 食記記錄確認
- **格式**：
```
✅ 已記錄你的食記！

🍽️ 餐廳：[餐廳名稱]
💰 價格：[高/中/便宜]
🍴 餐點：[早餐/午餐/晚餐]
⭐ 評分：[X]/5
📝 [摘要]

感謝分享！
```

#### 後續問題詢問
- **格式範例**：
```
請問這家餐廳的價格如何？(高/中/便宜)
請問這是晚餐嗎？(早餐/午餐/晚餐)
```
- **附加**：Quick Reply 選項（高、中、便宜、早餐、午餐、晚餐）

### 3.2 LINE Reply Templates

#### Quick Reply（快速回覆）
- **使用場景**：
  - 主選單選項
  - 食記記錄後的快速操作
  - 後續問題的選項
  - 一般聊天回應的快捷功能
- **範例**：
```typescript
{
  type: 'text',
  text: '我可以幫你：...',
  quickReply: {
    items: [
      { label: '📝 記錄食記', text: '記錄食記' },
      { label: '📋 我的食記', text: '我的食記' },
      { label: '🍽️ 餐廳查詢', text: '餐廳查詢' },
      { label: '📊 統計資訊', text: '統計資訊' },
      { label: '🌐 查看網站', text: '查看網站' },
      { label: '❓ 幫助', text: '幫助' }
    ]
  }
}
```

#### Buttons Template（按鈕模板）
- **使用場景**：
  - 餐廳資訊顯示
  - 統計資訊顯示
  - 幫助說明
- **限制**：
  - title: 最多 40 字元
  - text: 最多 120 字元
  - actions: 最多 4 個按鈕
- **範例**：
```typescript
{
  type: 'template',
  altText: '餐廳資訊',
  template: {
    type: 'buttons',
    title: '🍽️ 八方雲集',
    text: '⭐4.0/5 📝2則\n🏷️便宜、好吃\n💰高0 中0 便宜2',
    actions: [
      { type: 'message', label: '👥 查看評論', text: '查看 八方雲集 的評論' },
      { type: 'message', label: '🍱回到我的食記', text: '我的食記' },
      { type: 'message', label: '🔙 主選單', text: '主選單' }
    ]
  }
}
```

#### Carousel Template（輪播模板）
- **使用場景**：
  - 我的食記列表
  - 餐廳評論列表
- **限制**：
  - 最多 10 個 columns
  - 每個 column 最多 3 個 actions
  - 每個 column 的 text 最多 100 字元（考慮 emoji 計數差異）
- **範例**：
```typescript
{
  type: 'template',
  altText: '我的食記',
  template: {
    type: 'carousel',
    columns: [
      {
        title: '八方雲集',
        text: '⭐5/5 💰便宜 🍴晚餐\n🏷️好吃、便宜\n📅2024/01/15',
        actions: [
          { type: 'message', label: '查看餐廳詳情', text: '查看 八方雲集 的詳情' },
          { type: 'message', label: '🔙 主選單', text: '主選單' }
        ]
      },
      // ...
    ]
  }
}
```

### 3.3 對話流程圖

```
使用者發送訊息
    ↓
檢查是否有待處理的食記（follow-up question）
    ↓ 是
處理後續回答 → 完成食記記錄 → 顯示確認訊息
    ↓ 否
檢查是否為命令（關鍵字匹配）
    ↓ 是
執行對應命令 → 返回模板（Carousel/Buttons/Quick Reply）
    ↓ 否
檢查是否為食記（關鍵字匹配）
    ↓ 是
使用 LLM 提取資訊 → 檢查完整性 → 如有缺失詢問 → 儲存
    ↓ 否
一般聊天 → 檢查對話歷史 → 使用 LLM 生成回應 → 附加 Quick Reply
```

### 3.4 錯誤處理腳本

#### LLM 服務錯誤
- **情境**：OpenAI API 無法使用
- **回應**：
  - Rate Limit (429): "我現在收到太多請求，請稍後再試。"
  - Quota Exceeded (402): "服務配額已用盡，請稍後再試。"
  - Server Error (500+): "AI 服務暫時無法使用，請稍後再試。"
  - Network Error: "無法連接到 AI 服務，請檢查網路連線。"
- **降級方案**：顯示主選單，讓使用者可以繼續使用其他功能

#### 資料庫錯誤
- **情境**：MongoDB 連接失敗
- **處理**：記錄錯誤，繼續處理訊息（不中斷使用者體驗）

---

## 4. 對話脈絡：維持上下文

### 4.1 對話歷史管理

#### 儲存機制
- **模型**：`Conversation` (MongoDB)
- **結構**：
  ```typescript
  {
    userId: string,
    messages: [
      {
        role: 'user' | 'assistant',
        content: string,
        timestamp: Date
      }
    ]
  }
  ```
- **限制**：最多保留最近 20 條訊息（避免 token 限制）

#### 上下文使用
- **一般聊天**：使用最近 10 條訊息作為上下文
- **LLM 輸入格式**：
  ```typescript
  [
    { role: 'system', content: 'System prompt' },
    ...conversationHistory,  // 最近 10 條訊息
    { role: 'user', content: 'Current message' }
  ]
  ```

### 4.2 狀態管理

#### Pending Review（待處理食記）
- **用途**：儲存未完成的食記記錄
- **觸發**：當食記資訊不完整時（缺少價格或餐點類型）
- **結構**：
  ```typescript
  {
    userId: string,
    extractedData: {
      restaurantName: string,
      summary: string,
      // ... 其他欄位
    },
    missingFields: ['price', 'mealType'],
    createdAt: Date
  }
  ```

#### Follow-up 流程
1. 使用者發送食記訊息
2. LLM 提取資訊，發現缺少價格或餐點類型
3. 儲存為 Pending Review
4. 詢問後續問題（附加 Quick Reply）
5. 使用者回答
6. 處理回答，更新 Pending Review
7. 如資訊完整，儲存為正式 Review
8. 顯示確認訊息

---

## 5. LLM Prompt Template 設計

### 5.1 食記資訊提取 Prompt

**檔案位置**：`lib/services/review-extraction.service.ts`

**Prompt 內容**：
```
從餐廳評論提取資訊，回傳JSON。

提取：餐廳名稱(必填)、摘要(50字以內)、標籤(好吃/便宜/服務佳/推薦/CP值高/環境好/微雷/服務差/價格高/不推薦/等太久/普通)、評分(1-5)、價格等級(高/中/便宜/null)、價格金額(數字/null)、餐點類型(breakfast/lunch/dinner/null)。

規則：
- 餐廳名稱必須提取，找不到時用關鍵字推斷
- priceAmount有值時，price必須推斷：<100=便宜, 100-299=中, >=300=高
- needsPriceInfo=true僅當price和priceAmount都為null
- needsMealTypeInfo=true僅當mealType為null

格式：
{"restaurantName":"名稱","summary":"摘要","tags":["標籤"],"rating":4,"price":"便宜"|"中"|"高"|null,"priceAmount":140|null,"mealType":"breakfast"|"lunch"|"dinner"|null,"needsPriceInfo":false,"needsMealTypeInfo":true}

範例：「今天去吃八方雲集，總共140元，鍋貼超好吃」→ {"restaurantName":"八方雲集","summary":"八方雲集鍋貼好吃，價格實惠140元","tags":["好吃","便宜"],"rating":5,"price":"便宜","priceAmount":140,"mealType":null,"needsPriceInfo":false,"needsMealTypeInfo":true}

只回傳JSON，無其他文字。
```

**設計考量**：
- 使用繁體中文，符合使用者語言習慣
- 明確指定輸出格式（JSON）
- 提供範例幫助 LLM 理解
- 明確規則避免歧義
- 使用 `response_format: { type: 'json_object' }` 確保 JSON 輸出

### 5.2 一般聊天 Prompt

**檔案位置**：`lib/services/openai.service.ts`

**System Prompt**（可透過環境變數自訂）：
```
You are a helpful and friendly assistant. Respond concisely and naturally in a conversational tone.
```

**預設 System Prompt**：
- 友善、簡潔、自然的對話風格
- 可透過 `OPENAI_SYSTEM_PROMPT` 環境變數自訂

**輸入格式**：
```typescript
[
  { role: 'system', content: systemPrompt },
  ...conversationHistory,  // 維持上下文
  { role: 'user', content: userMessage }
]
```

### 5.3 Prompt 優化策略

#### Token 管理
- **限制**：`max_completion_tokens: 2500`（可透過環境變數調整）
- **對話歷史**：最多 10 條訊息（避免超出 token 限制）
- **Fallback**：當 token 用盡時，使用手動提取作為備案

#### 錯誤處理
- **Token Limit**：當 `finish_reason: "length"` 時，使用 fallback 提取
- **API Error**：捕獲並轉換為友善錯誤訊息
- **無回應**：檢查 `content` 是否為空，提供 fallback

---

## 6. 回應設計：包裝與格式化

### 6.1 回應類型

#### 文字訊息（Text Message）
- **使用場景**：簡單回應、確認訊息、錯誤訊息
- **格式**：
```typescript
{
  type: 'text',
  text: '訊息內容'
}
```

#### 文字訊息 + Quick Reply
- **使用場景**：需要快速選項的回應
- **格式**：
```typescript
{
  type: 'text',
  text: '訊息內容',
  quickReply: {
    items: [
      {
        type: 'action',
        action: {
          type: 'message',
          label: '選項標籤',
          text: '選項文字'
        }
      }
    ]
  }
}
```

#### Template Message（Buttons/Carousel）
- **使用場景**：需要豐富互動的場景
- **格式**：見 3.2 節

### 6.2 回應包裝邏輯

#### 命令回應
- **流程**：
  1. 識別命令（關鍵字匹配）
  2. 調用對應的資料庫服務
  3. 使用模板函數生成回應
  4. 返回 Template Message 或 Text Message

#### 食記記錄回應
- **流程**：
  1. LLM 提取資訊
  2. 檢查完整性
  3. 如有缺失：生成後續問題 + Quick Reply
  4. 如完整：格式化確認訊息 + Quick Reply

#### 一般聊天回應
- **流程**：
  1. 獲取對話歷史
  2. 調用 LLM 生成回應
  3. 附加 Quick Reply 選項
  4. 儲存回應至資料庫

### 6.3 格式化函數

#### 食記確認訊息
**檔案位置**：`app/api/webhook/route.ts` - `formatReviewConfirmation()`

**格式**：
```
✅ 已記錄你的食記！

🍽️ 餐廳：[名稱]
💰 價格：[高/中/便宜]
🍴 餐點：[早餐/午餐/晚餐]
⭐ 評分：[X]/5
📝 [摘要]

感謝分享！
```

#### 後續問題
**檔案位置**：`lib/services/follow-up.service.ts` - `generateFollowUpQuestion()`

**格式範例**：
```
請問這家餐廳的價格如何？(高/中/便宜)
請問這是晚餐嗎？(早餐/午餐/晚餐)
```

### 6.4 錯誤回應

#### LLM 錯誤
- **處理**：使用 `getErrorMessage()` 轉換為友善訊息
- **格式**：文字訊息 + 主選單 Quick Reply

#### 資料庫錯誤
- **處理**：記錄錯誤，返回一般錯誤訊息
- **格式**：文字訊息

---

## 7. 技術實作細節

### 7.1 命令識別

**方式**：關鍵字匹配（`includes()`）

**支援的命令**：
- `幫助` / `help` → 顯示幫助訊息
- `主選單` / `menu` → 顯示主選單
- `我的食記` → 顯示我的食記
- `餐廳查詢` / `查詢餐廳` → 餐廳查詢
- `查看 [餐廳名] 的詳情/詳細` → 顯示餐廳詳細資訊
- `查看 [餐廳名] 的評論` → 顯示餐廳所有評論
- `統計資訊` / `統計` → 統計資訊
- `查看網站` / `網站` → 顯示網站連結
- `記錄食記` → 記錄食記提示

**優點**：快速、無需調用 LLM、成本低

**缺點**：可能誤判（例如「我不想看我的食記」也會觸發）

### 7.2 食記意圖識別

**方式**：關鍵字匹配

**關鍵字**：
- `去吃`、`吃了`、`餐廳`、`推薦`、`好吃`、`雷`、`食記`、`用餐`、`點餐`、`點`、`元`、`塊`、`價格`、`貴`、`便宜`、`早餐`、`午餐`、`晚餐`

**流程**：
1. 檢查是否為命令
2. 檢查是否為食記（關鍵字匹配）
3. 如都不是，視為一般聊天

### 7.3 資料流程

```
LINE Webhook
    ↓
驗證簽名
    ↓
解析事件
    ↓
處理訊息
    ↓
儲存使用者訊息至資料庫
    ↓
判斷訊息類型
    ├─ 命令 → 執行命令 → 返回模板
    ├─ 食記 → LLM 提取 → 檢查完整性 → 儲存/詢問
    └─ 一般 → LLM 生成 → 返回回應
    ↓
儲存 Bot 回應至資料庫
    ↓
回傳給 LINE API
```

---

## 8. 使用者體驗設計

### 8.1 首次使用體驗

1. **加入 Bot**：自動發送歡迎訊息 + 主選單
2. **引導**：主選單提供所有功能選項
3. **範例**：幫助訊息提供使用範例

### 8.2 互動流暢性

- **Quick Reply**：減少輸入負擔
- **自動顯示選單**：即使未輸入「Menu」也會顯示選項
- **上下文維持**：記住對話歷史，回應更連貫
- **即時回饋**：所有操作都有明確的回應

### 8.3 錯誤處理體驗

- **友善訊息**：所有錯誤都有清楚的中文說明
- **降級方案**：LLM 錯誤時仍可使用其他功能
- **引導**：錯誤時提供主選單，讓使用者繼續操作

---

## 9. 未來改進方向

### 9.1 功能擴充
- 使用 LLM 進行意圖識別（取代關鍵字匹配）
- 支援圖片上傳（食物照片）
- 支援語音訊息
- 餐廳推薦功能

### 9.2 體驗優化
- 更智能的後續問題（根據上下文推斷）
- 個人化推薦
- 食記分享功能

### 9.3 技術優化
- 使用 WebSocket 實現真正的即時更新
- 加入快取機制減少資料庫查詢
- 實現速率限制防止濫用

---

## 10. 總結

AI 食記助手透過結合預設腳本與 LLM 能力，提供流暢的食記記錄與查詢體驗。系統設計注重使用者體驗、錯誤處理與資料完整性，確保在各種情況下都能提供穩定的服務。

**核心特色**：
- ✅ 自然語言輸入，自動提取結構化資訊
- ✅ 豐富的 LINE 模板（Quick Reply、Buttons、Carousel、URI Action）
- ✅ 維持對話上下文，回應更連貫
- ✅ 優雅的錯誤處理與降級機制
- ✅ 完整的資料管理與統計功能
- ✅ 網站連結整合，提供完整的使用體驗

