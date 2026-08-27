# handoff.md — 交接檔

## ⏯️ 目前做到哪
完成 polygon 驗證與補齊：修復退化 Hainan 三角形（7 個 feature），新增 13 個東亞朝代 polygon（漢/隋/唐/宋/遼/西夏/蒙古/清/匈奴/高句麗/新羅/百濟/高麗），收窄 `isInSEA` 過濾器讓東亞 polygon 可顯示。AI feedback 也已持久化到 GAS AIFeedback sheet。

## 🚦 目前狀態
- 網站可正常運行，總計 100 個歷史事件 + 15 個 key_figures
- 6 條 track：世界（預設）、中國、日本、臺灣、歐洲、美洲
- 地圖 polygon 現涵蓋中國主要朝代（漢/隋/唐/宋/元/清）+ 朝鮮三國 + 高麗
- AI 回饋（👍/👎）已持久化至 GAS AIFeedback sheet
- AI persona prompt 已重寫：蘇格拉底=純提問、比較=洞察式、角色扮演=融入人物

## ➡️ 下一步
1. 驗證日本 polygon（已有鐮倉/室町/德川等，確認顯示正常）
2. 歷史事件描述/butterfly effect 持續擴充
3. UI/UX 持續優化

## ⚠️ 注意事項
- 美國領土 polygon 是硬編碼在前端 JS 中，不在 DB 裡
- AI 模型固定為 `gemini-3.6-flash`
- 預設 AI provider 改為 `gemini`（3 處）
- DB 新增 `key_figures`（text）欄位，15 個事件已寫入
- AIFeedback sheet 自動建立（Timestamp, UserEmail, ConvId, MsgId, Emoji）
- `isInSEA` 已收窄至 lat 0-18, lng 95-120（僅跳過東南亞核心區域）
- 東亞 polygon 來源：aourednik/historical-basemaps（CC0 授權）

## 🕐 最後更新
2026-08-26 opencode @ ALYSSALGGRAM | Git push: ✅ 已推 (7584c89)

## 📝 備註
- 本次在無 Obsidian 的電腦收工，L3 筆記未更新
