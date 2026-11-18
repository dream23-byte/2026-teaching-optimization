# handoff.md — 交接檔

## ⏯️ 目前做到哪

**2026-11-18（本次）** 完成 **ICEI 2026 摘要定稿**（稿件 FCA94，口頭發表）的最後修正與時程確認。本次改的都是 **OneDrive 裡的 Word 檔，專案 repo 內沒有程式碼變動**：

1. `FCA94 中文摘要.docx`：單位修正為 **國立清華大學中文學系／教育與學習科技學系**（原本誤寫「教育與學習科技學習系」多一個「學習」，且未列中文學系）
2. `FCA94 English Abstract.docx`：`Meng Ying Lee` → **`Meng-Ying Lee`**；拿掉 `(Second Major)` 改列兩個系所；`Keywords：` 全形冒號改半形
3. 兩檔皆依大會範本：摘要**單一段落**、無表格圖片、關鍵詞 5 個；中文 888 字／英文 411 words
4. 查證大會網站（最後更新 10-22，颱風順延）：定稿上傳 10/26、繳費與報名 **11/06**、早鳥 10/21–**10/30**（學生發表者 NTD 1,500，一般 NTD 2,000）

> ⚠️ 今天是 **11/18**，上述期限皆已過去；研討會 **11/20–21**（本週五、六）於清華竹師教育學院 B109。若投稿或繳費有漏，需直接寫信 `icei@gapp.nthu.edu.tw`。

## 🚦 目前狀態

- 網站可正常運行：100 個歷史事件、6 條 track（世界／中國／日本／臺灣／歐洲／美洲，預設只勾世界）
- 前端三支：`code_artifact.html`（主站）、`class_artifact.html`（班級版）、`index.html`（轉址）
- AI persona：蘇格拉底／歷史關鍵人物扮演／跨文明比較分析；三者皆含因果謹慎原則（禁用「導致／造成／決定／必然」）
- 內建史料集：`source_texts` 114 列，114/114 帶 768 維向量，`match_source_texts` 語意檢索正常
- 疆域圖例（CC BY 4.0，預設收合）與「史家詮釋並非定論」說明行已完成（`7a7bfb7`，2026-11-05）
- Git：`master`，最新 commit `7a7bfb7`（2026-11-05）。**請注意 handoff 上一版寫的 `130db67` 已過期**

## ⚠️ 兩個容易再踩的坑

1. **事件 id 兩套**：正式環境 id 是 Supabase **流水號**（義和團＝41）；離線備援是**英文 slug**（`boxer`）。對照表要先用 id、再退而用標題比對（`CONTESTED_NOTES` 已這樣做）。
2. **不要把 HTML 丟進美化工具**：曾造成字串與屬性被硬斷行，整支檔案無法執行；`歷史互動實驗室.html` 已因此退役。

## ➡️ 下一步

1. **研討會當天（11/20–21）**：口頭發表；發表證明須本人全程參與該場次後現場領取，不可代領
2. **GAS 後端部署驗證**：Code.gs 貼到 Apps Script、建立新部署；OAuth redirect_uri 尚未加 `class_artifact.html`；`SUPER_ADMINS` script property 未設
3. **史料引用 tooltip 第二階段**：`source_texts.source_url` 0/114 有值 → `史料/_index.json` 加 `url` → `gen_import_sql.js` 帶入 → DB 回填 → `citeTooltip` 加「來源：⋯ ↗」
4. **爭議事件擴充**：目前 4 個（義和團、五四、二二八、馬關條約），候選還有鴉片戰爭、甲午戰爭、文化大革命；在 `CONTESTED_NOTES` 加一筆即可
5. 史料庫網站層／其他國家領土 polygon 驗證／事件描述擴充／UI/UX

## 📦 待決定是否進版控（先前 session 遺留，本次未動）

- 已追蹤但修改未提交：`rdq/AI-內容效度實作計畫-20260828.md`（狀態改為已完成）、`摘要初稿_ICEI2026.md`（方法與發現段重寫）
- 未追蹤：`cnTemplate*.docx`、`enTemplate*.docx`、`摘要定稿_ICEI2026.md`、`摘要英文_ICEI2026.md`、`摘要英文_ICEI2026_定稿.md`、`歷史互動實驗室 摘要Ian1 (已自動回復).docx`
- 本次 `AGENTS.md`／`handoff.md` 更新亦尚未提交

## ⚠️ 注意事項

- AI 模型固定 `gemini-3.6-flash`，含 503 備援與延長退避
- 美國領土 polygon 硬編碼在前端（DB 無此資料），參照 Van Zandt (1976)
- 東亞 polygon 來源 aourednik/historical-basemaps（CC0）；`cliopatria_features.js` 已加 CC BY 4.0 出處與改編聲明
- Cliopatria 是**資料來源**；Seshat 僅為概念參考，摘要與說明不可混寫
- `isInSEA` 收窄至 lat 0-18, lng 95-120（僅跳過東南亞核心區域）
- 班級系統 AI 學習分析／統計圖表／討論匯出／內容審查：程式已完成，待 GAS 部署後驗證
- 本次在 **無 Obsidian MCP／AGENTS.md 未登記 vault 路徑** 的環境收工，L3 筆記未更新

## 🕐 最後更新

2026-11-18 Big Pickle opencode @ ALYSSALGGRAM | Git push: ✅ 已推 (`master`，commit 標題「docs: 更新 AGENTS.md 與 handoff.md 的 ICEI 投稿與收工紀錄」)
