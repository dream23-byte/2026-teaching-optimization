# handoff.md — 交接檔

## ⏯️ 目前做到哪
班級系統核心功能已開發完成：GAS 後端拓展 Classes 欄位、新增 Materials 工作表；前端班級卡片（隨機色板 8-10 組）、建立/加入班級表單（含 unit/grade/subject/room/color）、沙龍 4 Tab（訊息串/素材庫/探究紀錄/成員）。後續又完成 AI 學習分析、統計圖表、討論匯出與內容審查（commit 6b022b0）。

本次（2026-08-28）新增 **AI 內容效度實作計畫**：`rdq/AI-內容效度實作計畫-20260828.md`。診斷確認目前無 RAG／無史料庫約束（前端只查 periods / historical_events 兩表，sources 1348 筆用不到），並列出 A1-A4（RAG 史料注入）＋ B1-B2（爭議議題一致化）＋ C（下一階段）＋ 驗收方式的完整實作順序。

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
1. **GAS 後端部署**：將 Code.gs 貼到 Apps Script 編輯器，建立新部署版本（若尚未部署）
2. **AI 內容效度實作**（依 `rdq/AI-內容效度實作計畫-20260828.md`）：A1 前端撈 event_sources+sources → A2 buildEventContext 注入史料 → A3 三 persona 統一史料約束指令（核心）→ B1 補 roleplay 爭議指令（補洞）→ B2 Gemini safetySettings（選，需驗證相容）→ A4 來源引用標記（加分）
3. **OAuth redirect_uri**：class_artifact.html 還沒加到 Google Cloud Console OAuth 授權 URI
4. **SUPER_ADMINS**：尚未在 Apps Script 設定 script property
5. 遺留未提交變更：class_artifact.html（移除 forum tab 切換）、摘要初稿_ICEI2026.md（學術文字修訂）——繪屬先前 session 產物，是否提交需確認

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
2026-08-28 opencode @ ALYSSALGGRAM | Git push: ✅ 已推 (dc5662e)

## 📝 備註
- 本次新增 `rdq/AI-內容效度實作計畫-20260828.md`（診斷＋實作順序，供下一個 session 開工直接參照）
- class_artifact.html / 摘要初稿_ICEI2026.md 有先前 session 的未提交變更（見下一步第 5 點）
