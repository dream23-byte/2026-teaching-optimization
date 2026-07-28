/**
 * 歷史沙龍 — Google Apps Script Web App
 * 工作表一「Posts」：Timestamp | UserEmail | Author | Tag | Title | Content
 * 工作表二「Replies」：Timestamp | UserEmail | Author | PostTitle | ReplyContent
 */

// ─── 設定區 ───────────────────────────────────
const SHEET_NAME_POSTS = "Posts";
const SHEET_NAME_REPLIES = "Replies";

// ─── 部署檢查：確定工作表存在 ─────────────────
function onOpen() {
  ensureSheetsExist();
}

function ensureSheetsExist() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(SHEET_NAME_POSTS)) {
    ss.insertSheet(SHEET_NAME_POSTS);
    ss.getSheetByName(SHEET_NAME_POSTS).appendRow(["Timestamp", "UserEmail", "Author", "Tag", "Title", "Content"]);
  }
  if (!ss.getSheetByName(SHEET_NAME_REPLIES)) {
    ss.insertSheet(SHEET_NAME_REPLIES);
    ss.getSheetByName(SHEET_NAME_REPLIES).appendRow(["Timestamp", "UserEmail", "Author", "PostTitle", "ReplyContent"]);
  }
}

// ─── doGet：雙模式 ─────────────────────────────
//   無參數 → 顯示網頁介面（需 Google 登入）
//   ?mode=json → 回傳 JSON（給 code_artifact.html 用）
//   ?callback=xxx → 回傳 JSONP（跨域使用）
function doGet(e) {
  ensureSheetsExist();

  // ── JSON / JSONP 模式（供外部頁面讀取資料）──
  if (e && e.parameter && (e.parameter.mode === "json" || e.parameter.callback)) {
    const data = buildForumData();
    const payload = JSON.stringify(data);
    if (e.parameter.callback) {
      return ContentService
        .createTextOutput(e.parameter.callback + "(" + payload + ")")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService
      .createTextOutput(payload)
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── 網頁模式 ──
  const template = HtmlService.createTemplateFromFile("Index");
  template.userEmail = Session.getActiveUser().getEmail();

  // 如果取不到使用者（未登入或權限不足）
  if (!template.userEmail || template.userEmail === "") {
    return HtmlService.createHtmlOutput(
      '<html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a2e;color:#eee;"><div style="text-align:center;max-width:400px;"><h1 style="color:#d4af37;">🔐 需要 Google 登入</h1><p style="font-size:18px;margin:20px 0;">請使用您的 Google 帳號登入才能使用歷史沙龍。</p><p style="font-size:14px;color:#999;">請點按右上角「選擇帳戶」或重新整理頁面。</p></div></body></html>'
    ).setTitle("歷史沙龍 — 請登入");
  }

  return template
    .evaluate()
    .setTitle("歷史沙龍 — 互動式歷史討論區")
    .setFaviconUrl("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📜</text></svg>")
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
}

// ─── doPost：處理表單送出 ─────────────────────
function doPost(e) {
  ensureSheetsExist();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userEmail = Session.getActiveUser().getEmail();
  const params = e.parameter;

  if (params.action === "addPost") {
    const sheet = ss.getSheetByName(SHEET_NAME_POSTS);
    sheet.appendRow([
      new Date(),
      userEmail,
      params.author,
      params.tag,
      params.title,
      params.content
    ]);
    return HtmlService.createHtmlOutput(
      '<html><body><script>window.top.location.href="' + ScriptApp.getService().getUrl() + '";</script></body></html>'
    );
  }

  if (params.action === "addReply") {
    const sheet = ss.getSheetByName(SHEET_NAME_REPLIES);
    sheet.appendRow([
      new Date(),
      userEmail,
      params.author,
      params.postTitle,
      params.replyContent
    ]);
    return HtmlService.createHtmlOutput(
      '<html><body><script>window.top.location.href="' + ScriptApp.getService().getUrl() + '";</script></body></html>'
    );
  }

  return HtmlService.createHtmlOutput('<html><body>未知操作</body></html>');
}

// ─── 共用：讀取試算表資料 ─────────────────────
function buildForumData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const posts = [];
  const postsSheet = ss.getSheetByName(SHEET_NAME_POSTS);
  if (postsSheet && postsSheet.getLastRow() > 1) {
    const rows = postsSheet.getRange(2, 1, postsSheet.getLastRow() - 1, 6).getValues();
    rows.forEach(r => {
      posts.push({
        timestamp: String(r[0]),
        userEmail: String(r[1]),
        author: String(r[2]),
        tag: String(r[3]),
        title: String(r[4]),
        content: String(r[5])
      });
    });
  }

  const replies = [];
  const repliesSheet = ss.getSheetByName(SHEET_NAME_REPLIES);
  if (repliesSheet && repliesSheet.getLastRow() > 1) {
    const rows = repliesSheet.getRange(2, 1, repliesSheet.getLastRow() - 1, 5).getValues();
    rows.forEach(r => {
      replies.push({
        timestamp: String(r[0]),
        userEmail: String(r[1]),
        author: String(r[2]),
        postTitle: String(r[3]),
        replyContent: String(r[4])
      });
    });
  }

  return { posts, replies };
}

// ─── 網頁前端用（google.script.run）───────────
function getForumData() {
  return buildForumData();
}
