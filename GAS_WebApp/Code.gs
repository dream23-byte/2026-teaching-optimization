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
//   ?callback=xxx → 回傳 JSONP（跨域供 code_artifact.html 使用）
function doGet(e) {
  try { ensureSheetsExist(); } catch (ex) { /* 忽略 */ }

  // ── JSONP 模式 ──
  if (e && e.parameter && e.parameter.callback) {
    const data = buildForumData();
    const payload = JSON.stringify(data);
    return ContentService
      .createTextOutput(e.parameter.callback + "(" + payload + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // ── 網頁模式 ──
  const email = Session.getActiveUser().getEmail();
  if (!email) {
    return HtmlService.createHtmlOutput(
      '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">' +
      '<style>body{font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;padding:20px;text-align:center;}' +
      'h1{color:#d4af37;}p{max-width:400px;line-height:1.8;}' +
      '</style></head><body>' +
      '<div><h1>🔐 需要 Google 登入</h1>' +
      '<p>請使用您的 Google 帳號登入才能使用歷史沙龍。</p>' +
      '<p style="font-size:14px;color:#999;">👉 部署時請將「存取權」設為「任何人」<br>使用者第一次開啟時需選擇 Google 帳號</p></div></body></html>'
    ).setTitle("歷史沙龍 — 請登入");
  }

  // ── 設定部署網址供 Index.html 使用 ──
  const template = HtmlService.createTemplateFromFile("Index");
  template.userEmail = email;
  template.appUrl = ScriptApp.getService().getUrl();

  return template
    .evaluate()
    .setTitle("歷史沙龍 — 互動式歷史討論區")
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
}

// ─── doPost：處理表單送出 ─────────────────────
function doPost(e) {
  ensureSheetsExist();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userEmail = Session.getActiveUser().getEmail();
  const params = e.parameter;
  let msg = "";

  try {
    if (params.action === "addPost") {
      const sheet = ss.getSheetByName(SHEET_NAME_POSTS);
      sheet.appendRow([new Date(), userEmail, params.author, params.tag, params.title, params.content]);
      msg = "✅ 議題發布成功！";
    } else if (params.action === "addReply") {
      const sheet = ss.getSheetByName(SHEET_NAME_REPLIES);
      sheet.appendRow([new Date(), userEmail, params.author, params.postTitle, params.replyContent]);
      msg = "✅ 回覆發布成功！";
    } else {
      msg = "⚠️ 未知操作";
    }
  } catch (err) {
    msg = "❌ 寫入失敗：" + err.message;
  }

  return HtmlService.createHtmlOutput(
    '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<style>body{font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;padding:20px;text-align:center;}' +
    'h2{color:#d4af37;margin-bottom:20px;}' +
    '</style></head><body>' +
    '<div><h2>' + msg + '</h2></div></body></html>'
  );
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
