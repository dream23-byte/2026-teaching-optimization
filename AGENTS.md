# AGENTS.md — 專案藍圖

## 專案概述
2026教學軟體優化：歷史探究式學習網站，含互動地圖、時間軸、AI 探究引擎、論壇

## 資料夾結構
```
├── code_artifact.html          # 主前端（~2625行）
├── cliopatria_features.js     # Seshat 歷史 empire GeoJSON（496 features）
├── cliopatria_index.js        # Seshat 索引
├── process_cliopatria.js      # Seshat 處理腳本
├── GAS_WebApp/Code.gs         # 論壇+班級系統 GAS 後端
├── rdq/                       # RDQ 需求規格卡 + 實作計畫
├── 史料/                       # 歷史資料參考文件
└── .gitignore
```

## 路線圖 Checklist
- [x] Phase 1: Schema + 資料匯入（88 events, 111 periods）
- [x] Phase 2: Supabase SDK + 動態資料載入
- [x] Phase 3: DB 驅動 polygon 渲染 + AI prompt 增強
- [x] Gemini API 整合（模型 gemini-3.6-flash）
- [x] 論壇系統（GAS + Sheets）
- [x] 聊天訊息編輯功能
- [x] 對話選單（重新命名/刪除）
- [x] AI 回饋按鈕（👍/👎）
- [x] Persona 折疊圖示
- [x] 美國領土 polygon 修正（參照 Van Zandt 1976 權威來源）
- [x] 美國史料加入 Supabase 資料庫
- [x] 6 區域 track 系統（世界/中國/日本/臺灣/歐洲/美洲）
- [x] 新增 12 個歐美事件（歐洲 9 件 + 美洲 3 件）
- [x] DB region_tags 欄位 + 所有事件標記
- [x] 地圖底圖切換（CARTO→Esri Dark Gray，免費免 key）
- [x] 按鈕風格統一（氣候/貿易/領土 active/inactive 切換）
- [x] 班級面板移至左側 sidebar
- [x] GAS loadMyClasses 修復 className undefined
- [x] 匯出按鈕改為教師專用
- [x] RDQ 需求規格卡完成（班級系統升級）
- [x] 班級系統開發（Google Classroom 風格）
- [ ] 班級系統 AI 學習分析 / 統計圖表 / 討論匯出 / 內容審查（GAS 部署後測試）— 實作完成，待部署驗證
- [ ] **AI 內容效度實作**（RAG／史料庫約束／爭議議題；計畫：`rdq/AI-內容效度實作計畫-20260828.md`，依 A1→A2→A3→B1→B2→A4 順序）
- [ ] 其他國家領土 polygon 驗證
- [ ] 歷史事件描述/butterfly effect 擴充
- [ ] UI/UX 持續優化

## 關鍵技術決策
- **前端**: 單一 HTML 檔案（code_artifact.html）
- **資料庫**: Supabase（PostgreSQL）
- **AI**: Google Gemini（gemini-3.6-flash, ?key= 認證）
- **論壇**: Google Apps Script + Sheets
- **地圖**: Leaflet.js + Cliopatria/Seshat 歷史 empire 資料
- **美國領土**: 硬編碼 polygon（DB 無此資料），參照 Van Zandt (1976) 權威來源
- **區域篩選**: DB `region_tags` 陣列欄位，前端6 track checkbox，預設只勾「世界」

## 重要連結
- GitHub: https://github.com/dream23-byte/2026-teaching-optimization
- GitHub Pages: https://dream23-byte.github.io/2026-teaching-optimization/code_artifact.html
- GitHub Pages 班級版: https://dream23-byte.github.io/2026-teaching-optimization/class_artifact.html
- Supabase: https://ushwjujxqvonyjumzgkp.supabase.co
