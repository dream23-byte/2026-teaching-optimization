# handoff.md — 交接檔

## ⏯️ 目前做到哪
本次完成了美國領土 polygon 的驗證與修正，參照權威史料（Van Zandt 1976, Paullin 1932）修正了 5 個多邊形座標錯誤，並將參考來源寫入 Supabase 資料庫。

## 🚦 目前狀態
- 網站可正常運行
- 美國 8 個時段的領土 polygon 已修正並推送
- Tooltip 已加入年分範圍顯示
- 參考來源已寫入 sources 表（ID 1416+）

## ➡️ 下一步
1. 驗證其他國家（中國、日本、東南亞）的 polygon 座標是否正確
2. 歷史事件描述/butterfly effect 擴充（35 events 已完成）
3. UI/UX 持續優化

## ⚠️ 注意事項
- 美國領土 polygon 是硬編碼在前端 JS 中，不在 DB 裡
- DB 的 `sources` 表已新增美國領土相關參考來源（Van Zandt, Paullin, 條約彙編等）
- AI 模型固定為 `gemini-3.6-flash`（新帳號 only，gemini-2.5-flash 回 404）
- 預設 AI provider 改為 `gemini`（3 處）

## 🕐 最後更新
2026-08-20 opencode @ MYALY | Git push: ✅ 已推 (afb3a55)
