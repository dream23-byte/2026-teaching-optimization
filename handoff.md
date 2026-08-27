# handoff.md — 交接檔

## ⏯️ 目前做到哪
完成 RDQ 需求規格卡（班級系統升級），規格已確認（status: confirmed）。上次的 polygon 驗證、AI feedback、Empire toggle 等功能已完成。本次重點：地圖底圖切換、按鈕風格統一、班級面板位置調整、GAS 班級名稱修復、工具列 HTML 修復。

## 🚦 目前狀態
- 網站可正常運行，總計 100 個歷史事件 + 15 個 key_figures
- 6 條 track：世界（預設）、中國、日本、臺灣、歐洲、美洲
- 地圖底圖已從 CARTO（需 API key）切換為 Esri Dark Gray（免費免 key）
- 按鈕風格統一：氣候巨變/全球貿易/領土三顆按鈕 active/inactive 邊框切換一致
- 班級面板已從 AI 側邊欄移至左側 sidebar
- GAS `loadMyClasses` 已修復 className undefined 問題
- 匯出按鈕已改為教師專用
- class_artifact.html 工具列 HTML 巢狀結構已修復（地圖消失問題）
- GAS 已重新部署（新 URL）
- **RDQ 規格卡已確認**：班級系統升級（Google Classroom 風格），含班級卡片、沙龍 4 Tab、AI 探究分析、素材庫、成員管理

## ➡️ 下一步
1. **解除 Plan Mode** 後開始開發班級系統
2. **GAS 後端**：新增 materials sheet、拓展 Classes 欄位（unit/grade/subject/room/color）、新增 content_moderation 欄位
3. **前端重建**：班級卡片（隨機色板 8-10 組）、建立/加入班級表單、沙龍 4 Tab（訊息串/素材庫/探究紀錄/成員）
4. **AI 摘要**：Gemini API 生成學習分析 + 偏題偵測 + 主題相關度
5. **統計圖表**：Chart.js 渲染發問次數/主題分佈/活躍度
6. **匯出功能**：教師彙整班級討論 + 自動標記需關注學生
7. **素材庫**：歷史素材共享 + 學生作品展示，支援 URL/文字，標記出處授權
8. **內容審查**：Gemini API 安全設定 + System Prompt 指令 + 前端顯示過濾

## ⚠️ 注意事項
- **Plan Mode 仍在啟用中**：新 session 開工時需先解除，否則無法進行檔案修改
- **GAS 需手動部署**：Code.gs 要貼到 Apps Script 編輯器，建立新部署版本
- **OAuth redirect_uri**：class_artifact.html 還沒加到 Google Cloud Console OAuth 授權 URI
- **SUPER_ADMINS**：尚未在 Apps Script 設定 script property
- **RDQ 規格卡**：待存檔到 `rdq/RDQ-spec-class-system-20260827.md`
- 美國領土 polygon 是硬編碼在前端 JS 中，不在 DB 裡
- AI 模型固定為 `gemini-3.6-flash`
- AIFeedback sheet 自動建立（Timestamp, UserEmail, ConvId, MsgId, Emoji）
- `isInSEA` 已收窄至 lat 0-18, lng 95-120（僅跳過東南亞核心區域）
- 東亞 polygon 來源：aourednik/historical-basemaps（CC0 授權）

## 🕐 最後更新
2026-08-27 opencode @ ALYSSALGGRAM | Git push: ⚠️ 待推（Plan Mode 無法 commit）

## 📝 備註
- 本次在 Plan Mode（唯讀）下收工，L2 git push 未執行，L3 Obsidian 未更新
- 需求規格卡完整內容在對話中，待 Plan Mode 解除後存檔
