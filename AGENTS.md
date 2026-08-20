# AGENTS.md — 專案藍圖

## 專案概述
2026教學軟體優化：歷史探究式學習網站，含互動地圖、時間軸、AI 探究引擎、論壇

## 資料夾結構
```
├── code_artifact.html          # 主前端（~2557行）
├── cliopatria_features.js     # Seshat 歷史 empire GeoJSON（496 features）
├── cliopatria_index.js        # Seshat 索引
├── process_cliopatria.js      # Seshat 處理腳本
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

## 重要連結
- GitHub: https://github.com/dream23-byte/2026-teaching-optimization
- GitHub Pages: https://dream23-byte.github.io/2026-teaching-optimization/code_artifact.html
- Supabase: https://ushwjujxqvonyjumzgkp.supabase.co
