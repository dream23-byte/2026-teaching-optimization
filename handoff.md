# handoff.md — 交接檔

## ⏯️ 目前做到哪
班級系統核心功能已開發完成：GAS 後端拓展 Classes 欄位、新增 Materials 工作表；前端班級卡片（隨機色板 8-10 組）、建立/加入班級表單（含 unit/grade/subject/room/color）、沙龍 4 Tab（訊息串/素材庫/探究紀錄/成員）。

## 🚦 目前狀態
- 網站可正常運行，總計 100 個歷史事件 + 15 個 key_figures
- 6 條 track：世界（預設）、中國、日本、臺灣、歐洲、美洲
- 地圖底圖：Esri Dark Gray（免費免 key）
- 按鈕風格統一：氣候巨變/全球貿易/領土 active/inactive 邊框切換一致
- 班級面板：左側 sidebar，Google Classroom 風格
- GAS 後端：Classes 欄位已拓展（ClassCode/ClassName/TeacherEmail/CreatedAt/Unit/Grade/Subject/Room/Color）
- GAS 後端：新增 Materials 工作表（Timestamp/UserEmail/ClassCode/Title/Type/Url/Content/Author/Source/License/Tags）
- GAS 後端：新增 InquiryRecords 工作表（Timestamp/UserEmail/ClassCode/ConvId/EventId/Questions/Summary/Score）
- 前端：班級卡片隨機色板（10 組顏色，依 classCode hash 選色）
- 前端：建立班級表單含新欄位（unit/grade/subject/room/color）
- 前端：沙龍 4 Tab（訊息串/素材庫/探究紀錄/成員）
- 前端：素材庫 Modal（支援 URL/文字/圖片，標記出處授權）

## ➡️ 下一步
1. **GAS 後端部署**：將 Code.gs 貼到 Apps Script 編輯器，建立新部署版本
2. **AI 摘要**：Gemini API 生成學習分析 + 偏題偵測 + 主題相關度
3. **統計圖表**：Chart.js 渲染發問次數/主題分佈/活躍度
4. **匯出功能**：教師彙整班級討論 + 自動標記需關注學生
5. **內容審查**：Gemini API 安全設定 + System Prompt 指令 + 前端顯示過濾
6. **OAuth redirect_uri**：class_artifact.html 還沒加到 Google Cloud Console OAuth 授權 URI
7. **SUPER_ADMINS**：尚未在 Apps Script 設定 script property

## ⚠️ 注意事項
- **GAS 需手動部署**：Code.gs 要貼到 Apps Script 編輯器，建立新部署版本
- **OAuth redirect_uri**：class_artifact.html 還沒加到 Google Cloud Console OAuth 授權 URI
- **SUPER_ADMINS**：尚未在 Apps Script 設定 script property
- 美國領土 polygon 是硬編碼在前端 JS 中，不在 DB 裡
- AI 模型固定為 `gemini-3.6-flash`
- AIFeedback sheet 自動建立（Timestamp, UserEmail, ConvId, MsgId, Emoji）
- `isInSEA` 已收窄至 lat 0-18, lng 95-120（僅跳過東南亞核心區域）
- 東亞 polygon 來源：aourednik/historical-basemaps（CC0 授權）

## 🕐 最後更新
2026-08-27 opencode @ ALYSSALGGRAM | Git push: 待執行

## 📝 備註
- 本次開發完成班級系統核心功能，待 GAS 部署後測試
- 需求規格卡完整內容在對話中，待存檔
