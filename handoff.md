# handoff.md — 交接檔

## ⏯️ 目前做到哪

**2026-10-26（本次）** 完成「AI 鷹架」一輪優化，主站與班級版同步、已推送（`04dd031`）：

1. **事件面板改名**：`蝴蝶效應 (連鎖影響)` → **`連鎖影響`**，並在描述下方加一行小字說明：「多數跨區域因果連結為史家詮釋，並非定論；多數影響由多重因素共同促成，並非單一事件所決定。」
2. **「換個立場想想」依 persona 分流**：原本不分模式一律要求完整立場卡，與蘇格拉底「只問 1-2 個問題、200 字內」及人物扮演「不要跳出角色」互相衝突；現在三種模式各有專屬指令。
3. **史料約束補強**：`SOURCE_CONSTRAINT` 增加「每個主要論點盡量對應至少一段檢索到的史料；未涵蓋的脈絡才用一般史識補充，並標明為『背景補充』；關聯薄弱就直說」。
4. **史學爭議標記**：新增 `CONTESTED_NOTES`（義和團、五四運動、二二八事件、馬關條約），事件面板出現琥珀色卡片（2～3 種觀點＋判定依據），AI prompt 自動注入【史學爭議】區塊。
5. **退役 `歷史互動實驗室.html`**（`130db67`）：該檔是 HTML 美化工具的損毀輸出（字串／屬性被插入換行、`</texta rea>` 等破損標籤），script 區塊自始無法執行，`index.html` 也從未連結。內容已由 `code_artifact.html` 取代。

## 🚦 目前狀態

- 網站可正常運行：100 個歷史事件、6 條 track（世界／中國／日本／臺灣／歐洲／美洲，預設只勾世界）
- 前端檔案只剩三支：`code_artifact.html`（主站）、`class_artifact.html`（班級版）、`index.html`（轉址）
- AI persona：蘇格拉底／歷史關鍵人物扮演／跨文明比較分析；三者皆含因果謹慎原則（禁用「導致／造成／決定／必然」）
- 班級版另保留 `filterInappropriateContent`（學生輸入與 AI 回覆皆過濾）
- 內建史料集：`source_texts` 114 列，114/114 帶 768 維向量，語意檢索 RPC `match_source_texts` 正常
- 地圖底圖 Esri Dark Gray（免費免 key）
- 本輪驗證方式：node 語法檢查（三支 script 0 錯誤）＋本機 HTTP server 開真實瀏覽器（DB 模式 100 事件）測 `selectEvent` / 面板卡片 / `buildEventContext` / 三 persona 換立場指令，console error 0 筆

## ⚠️ 兩個容易再踩的坑

1. **事件 id 兩套**：正式環境 `historyData` 來自 Supabase，id 是**流水號**（義和團＝41）；離線備援資料是**英文 slug**（`boxer`）。任何以 id 對照的對照表都應該先用 id、再退而用標題比對（`CONTESTED_NOTES` 就是這樣做的）。
2. **不要再把 HTML 丟進美化工具**產生副本，之前那次造成字串與屬性被硬斷行，整支檔案無法執行。

## ➡️ 下一步

1. **GAS 後端部署驗證**（Code.gs 手動貼到 Apps Script、建立新部署版本）；OAuth redirect_uri 尚未把 `class_artifact.html` 加進 Google Cloud Console；`SUPER_ADMINS` script property 尚未設定
2. **史料引用 tooltip 第二階段**：`source_texts.source_url` 0/114 有值 → `史料/_index.json` 加 `url` → `gen_import_sql.js` 帶入 → DB 回填 → 前端 `citeTooltip` 加「來源：⋯ ↗」
3. **爭議事件可再擴充**：目前只有 4 個，候選還有鴉片戰爭、甲午戰爭、文化大革命等；只需在 `CONTESTED_NOTES` 加一筆（key 用標題關鍵字）
4. 史料庫網站層／其他國家領土 polygon 驗證／事件描述擴充／UI/UX
5. **待決**：先前 session 遺留的未提交變更要不要進版控
   - ` M rdq/AI-內容效度實作計畫-20260828.md`
   - ` M 摘要初稿_ICEI2026.md`
   - `?? cnTemplate.060419b111349e01698a.docx`、`enTemplate.f807566e2dc349a120ff.docx`、`摘要定稿_ICEI2026.md`、`摘要英文_ICEI2026.md`、`摘要英文_ICEI2026_定稿.md`、`歷史互動實驗室 摘要Ian1 (已自動回復).docx`

## ⚠️ 注意事項

- AI 模型固定 `gemini-3.6-flash`，含 503 備援與延長退避
- 美國領土 polygon 硬編碼在前端（DB 無此資料），參照 Van Zandt (1976)
- 東亞 polygon 來源 aourednik/historical-basemaps（CC0）
- `cliopatria_features.js` 已加 CC BY 4.0 出處與改編聲明
- `isInSEA` 收窄至 lat 0-18, lng 95-120（僅跳過東南亞核心區域）
- 班級系統 AI 學習分析／統計圖表／討論匯出／內容審查：程式已完成，待 GAS 部署後驗證

## 🕐 最後更新

2026-10-26 opencode @ ALYSSALGGRAM | Git push: ✅ 已推 (130db67)

## 📝 備註

- 本輪兩個 commit：`04dd031`（AI 鷹架四項）、`130db67`（退役損毀檔案＋AGENTS.md 註記）
- AGENTS.md 路線圖與關鍵技術決策已同步更新（含退役說明）
