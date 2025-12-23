# [114-1] Web Programming Final – TripCircle (第 55 組)

**(Group 55) TripCircle - 旅遊規劃與分享平台**
### Demo 影片
尚未提供（請於提交前更新 Demo 連結）

### 服務簡介
TripCircle 提供旅遊行程的建立、每日活動規劃與拖曳排序，內含時間衝突提示與交通時間估算。使用者可邀請成員協作，並可將行程發布到公開動態牆，讓其他人瀏覽、留言與匯入。亦可透過 Google Places 探索景點、收藏並加入行程。
### Deployed 連結
https://trip-circle.vercel.app/
### 使用／操作方式
1) 於上方連結註冊或登入（支援 email/password 與 Google OAuth）。  
2) 在 Dashboard 建立行程，新增／拖曳每日活動並設定時間與地點。  
3) 邀請成員、設定角色；在活動中調整參與者、留言、費用分攤與偏好。  
4) 前往 Explore 搜尋景點、存入資料夾或直接加入行程；可分享／匯入資料夾。  
5) 發布行程至動態牆供瀏覽／匯入；相簿可上傳並選擇公開照片作封面。
### 其他說明
- 帳號可自行註冊。

### 使用與參考之框架／模組
- 前端：React (Vite + TypeScript)、React Router、i18n 套件、Google Maps JS API、Google Places Autocomplete、Amplitude SDK  
- 後端：Express (TypeScript)、Prisma、PostgreSQL、JWT、bcrypt、multer/base64 處理、Google Maps/Places API、Amplitude SDK  
- 工具：ESLint/Prettier、npm scripts  
使用之第三方套件、框架、程式碼：同上（詳見本文「第三方與框架」段落）
### 專題製作心得
詹文淵：雖然之前修過不少 web 課，但這門課可能是我大學以來最依賴 AI 的一次。建構網站的流程與以往完全不同：一邊熟悉 AI 工具，一邊也扎實補強了 web 基礎。感謝課程提供的 Cursor credit，讓我能在實作中快速試錯並迭代，也更理解何時該信任模型、何時要回到文件與原始碼。這段經歷讓我真正意識到 AI 是加速器而非替代品：需求分析、模組邏輯、資料流程與錯誤處理仍需要自己判斷；AI 的產出必須被審核、重構，才能融入可維護的架構。此外，與隊友協作時，我們會先討論介面與資料契約，再用 AI 協助生成重複樣板或測試，效率顯著提升。也因 AI 讓迭代成本變低，我更願意嘗試不同的 UI/UX 變化並快速驗證。最後，這門課讓我累積了更完整的「AI 輔助開發 workflow」心智模型：先定義目標與限制，再讓 AI 生成草稿，接著人工審查、微調、補測試，並將學到的模式沉澱成可重用的片段。  
吳政霖：使用 AI 工具讓效率大幅提高，雖然自己手刻網站很有成就感，但 Cursor 讓我能嘗試更多想做的功能；遇到問題時也能快速參考程式碼與回應。這門課讓我對使用 AI 的 workflow 有更深刻的體驗，也學會在速度與架構可維護性之間取得平衡。更重要的是，我體會到「對 AI 提問的品質決定輸出的品質」：描述清楚需求、上下文、限制與期望格式，能讓生成結果更貼近目標，也減少返工。實作過程中，我常把 AI 當作 pair programmer，一起檢查邏輯缺口、討論資料結構，或是產出初稿再由我親自調整風格與最佳化效能。當 AI 給出的程式碼與實際需求有落差時，我會回到文件、型別定義與既有模組重新對齊，確保可維護性不被犧牲。這次專案也促使我建立一套「AI 使用守則」：先拆解問題、分階段詢問、逐步驗證，再將穩定的解法收斂成共用工具。總結來說，AI 讓我更快完成更多功能，但真正的價值在於它逼我思考如何設計一個讓人與工具都能高效合作的開發流程。  
游至捷：這次 Final Project 中，我最大的收穫是實際和其他同學共同製作一個 Web App其中要溝通及分工的過程。和個人作業不同的是我們沒辦法再隨意的 git push，要考慮版本控制以及內容的分工，避免程式內容衝突；我們也需要在實作功能前用 cursor plan mode 先計畫，而不是像個人製作一樣想改就改，這樣可以方便有效率地不斷新增我們要的功能，而不易造成衝突。另外，我也學會整合這學期學會的各種工具，全部用在專案裡，我認為這樣的過程很有趣，能看到專案從簡單到複雜不斷的擴充，最終實作組合出一個功能完整且實用的 App。

---

## 專題簡介
TripCircle 是一個旅遊規劃與分享的網頁應用。使用者可建立行程、依日期規劃每日活動、邀請夥伴並分配角色、將行程發布至公開動態牆、匯入分享行程、管理相簿，以及透過 Google Places 探索與收藏景點。系統支援中英雙語與分析追蹤。

### 主要功能（測試重點）
- 行程建立／編輯：日期區間行程、每日活動拖曳排序、時間衝突檢查、交通時間估算（Google Directions）。
- 協作：成員角色（Owner/Editor/Viewer）、活動參與者、留言、費用分攤、偏好、標籤、歷史記錄。
- 社群：發布行程到動態牆、搜尋／篩選、行程留言、匯入分享行程、分享連結。
- 媒體：行程相簿、URL/檔案上傳（base64）、公開照片作為動態封面。
- 探索與收藏：Google Places 搜尋、儲存景點、資料夾管理、資料夾分享／匯入、加入行程。
- 後台／分析：指標端點與 Amplitude 事件記錄。
- i18n：完整 UI 翻譯、地區化日期時間格式、語言切換。

---

## 部署連結
- 線上前端：https://trip-circle.vercel.app/
- 線上後端 Base：{{TODO: 若與上方不同請填；若同源請註明「Vercel 後端代理同源」}}
- Demo 影片：{{TODO: URL}}

---

## 本機安裝與測試

### 0) Prerequisites
- Node.js 18+
- npm（隨 Node 附帶）
- PostgreSQL 14+（本機可連線）
- Google API 金鑰（Maps/Places），Amplitude 金鑰可選

### 1) 取得程式碼與定位目錄
```bash
git clone git@github.com:Darrell-Spurs/wp1141.git
cd final-project
```

### 2) 後端設定
```bash
cd backend
npm install
```

建立 `backend/.env`：
```env
DATABASE_URL=postgresql://{{user}}:{{password}}@localhost:5432/tripcircle
JWT_SECRET={{TODO: strong secret}}
GOOGLE_CLIENT_ID={{TODO}}
GOOGLE_CLIENT_SECRET={{TODO}}
GOOGLE_PLACES_API_KEY={{TODO}}
AMPLITUDE_API_KEY={{optional}}
PORT=8000
```
> 若密碼含特殊字元請 URL 編碼（例：`#` -> `%23`）。

初始化資料庫（產生 Prisma client 並套用 migration）：
```bash
npx prisma generate
npx prisma migrate dev --name init
```

啟動後端（開發模式）：
```bash
npm run dev
# 服務執行於 http://localhost:8000
```

### 3) 前端設定
```bash
cd ../frontend
npm install
```

建立 `frontend/.env`：
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY={{TODO}}
VITE_AMPLITUDE_API_KEY={{optional}}
```

啟動前端（Vite）：
```bash
npm run dev
# Vite dev server: http://localhost:3000 （需要時代理 API 至 8000）
```

### 4) 帳號與測試資料
- 支援 email/password (`/auth/register`) 與 Google OAuth。

### 5) 建議驗證的主要流程
- 建立行程、加入活動（含時間／地點）、拖曳排序、檢查時間衝突。
- 邀請成員、設定角色、調整活動參與者。
- 新增費用、等額與自訂分攤。
- 活動留言、偏好、標籤、歷史紀錄檢視。
- 發布行程到動態牆、查看公開頁面、匯入行程。
- 上傳行程照片（URL/檔案）、設定公開照片與動態封面。
- Explore 分頁：Google 搜尋、存入資料夾、分享／匯入資料夾、加入行程。
- 語言切換（EN/繁中）、在地化時間格式。

### 6) 與正式環境一致性
- 上傳大小：後端接受 base64 圖片最高 15MB。
- SPA 路由：Vercel `vercel.json` 重寫，巢狀路由重新整理可用。
- 伺服器端已設定 body parser 限制與 payload 驗證。

---

## 系統架構（簡述）
- 前端：Vite + React + TypeScript；以 hooks 為主的 API client；React Router；i18n。
- 後端：Express + TypeScript；Prisma ORM；PostgreSQL；JWT 驗證；Google Maps/Places；Amplitude。
- 認證：Email/Password + Google OAuth；登入後保留 return URL。
- 部署：前端 Vercel；後端設定 15MB payload；SPA 重寫啟用。

---

## 第三方與框架
- 前端：React、Vite、TypeScript、React Router、i18n 套件、Google Maps JS API、Google Places Autocomplete、Amplitude SDK。
- 後端：Express、TypeScript、Prisma、PostgreSQL、JWT、bcrypt、multer/base64 處理、Google Maps/Places API、Amplitude SDK。
- 工具：ESLint/Prettier（專案預設）、npm scripts。

---

## 分工（第 55 組）
請填入姓名與具體貢獻，並註明是否有外部協助與原因。

| 成員 | 貢獻職責 | 備註（外部協助如有） |
|------|----------|----------------------|
| {{TODO: 成員 A}} | {{TODO: 例：後端認證、Prisma schema、行程/活動路由}} | {{TODO 或 N/A}} |
| {{TODO: 成員 B}} | {{TODO: 例：前端行程 UI、拖曳、i18n}} | {{TODO 或 N/A}} |
| {{TODO: 成員 C}} | {{TODO: 例：動態牆/發布、照片、Explore/資料夾、分析}} | {{TODO 或 N/A}} |

---

## 課程回饋
- AI/LLM 教學與示範很實用，讓我們能建立「先定義需求、再用 AI 生成草稿、最後人工審查與補測試」的 workflow；建議未來課程可提供更多「好提示／壞提示」對照與常見陷阱。  
- Cursor credit 對快速迭代幫助大，若能在期中前再補充一波 credit 或提供節省 token 的實務技巧說明，能讓同學更敢嘗試。  
- 希望增加AI 產出程式碼的可維護性檢查案例，例如如何檢查資料流、型別一致性、邊界條件與效能，協助同學在速度與品質之間取得平衡。  

---

## 常用指令（參考）
- Backend：`npm run dev`, `npm run build`, `npm start`, `npx prisma migrate dev`, `npx prisma generate`
- Frontend：`npm run dev`, `npm run build`, `npm run preview`

---

## 快速連結
- 線上服務：https://trip-circle.vercel.app/
- 本機 API Base：http://localhost:8000
- 規格文件：`PROJECT_SPEC.md`
