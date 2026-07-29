/**
 * 歷史沙龍 — Google Apps Script Web App
 * 工作表一「Posts」：Timestamp | UserEmail | Author | Tag | Title | Content
 * 工作表二「Replies」：Timestamp | UserEmail | Author | PostTitle | ReplyContent
 */

const SHEET_NAME_POSTS = "Posts";
const SHEET_NAME_REPLIES = "Replies";

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

function doGet(e) {
  try { ensureSheetsExist(); } catch (ex) {}

  if (e && e.parameter && e.parameter.callback) {
    const data = buildForumData();
    const payload = JSON.stringify(data);
    return ContentService
      .createTextOutput(e.parameter.callback + "(" + payload + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  const email = Session.getActiveUser().getEmail();
  if (!email) {
    return HtmlService.createHtmlOutput(
      '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">' +
      '<style>body{font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;padding:20px;text-align:center;}' +
      'h1{color:#d4af37;}p{max-width:400px;line-height:1.8;}' +
      '</style></head><body>' +
      '<div><h1>🔐 需要 Google 登入</h1><p>請使用您的 Google 帳號登入才能使用歷史沙龍。</p></div></body></html>'
    ).setTitle("歷史沙龍 — 請登入");
  }

  const template = HtmlService.createTemplateFromFile("Index");
  template.userEmail = email;
  template.appUrl = ScriptApp.getService().getUrl();

  return template
    .evaluate()
    .setTitle("歷史沙龍 — 互動式歷史討論區")
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
}

function doPost(e) {
  ensureSheetsExist();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const params = e.parameter;
  const userEmail = params.userEmail || Session.getActiveUser().getEmail() || "";
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
    } else if (params.action === "editPost") {
      const sheet = ss.getSheetByName(SHEET_NAME_POSTS);
      const row = parseInt(params.row);
      sheet.getRange(row, 4).setValue(params.tag);
      sheet.getRange(row, 5).setValue(params.title);
      sheet.getRange(row, 6).setValue(params.content);
      msg = "✅ 議題已更新！";
    } else if (params.action === "deletePost") {
      const sheet = ss.getSheetByName(SHEET_NAME_POSTS);
      sheet.deleteRow(parseInt(params.row));
      msg = "✅ 議題已刪除！";
    } else if (params.action === "editReply") {
      const sheet = ss.getSheetByName(SHEET_NAME_REPLIES);
      const row = parseInt(params.row);
      sheet.getRange(row, 5).setValue(params.replyContent);
      msg = "✅ 回覆已更新！";
    } else if (params.action === "deleteReply") {
      const sheet = ss.getSheetByName(SHEET_NAME_REPLIES);
      sheet.deleteRow(parseInt(params.row));
      msg = "✅ 回覆已刪除！";
    } else {
      msg = "⚠️ 未知操作";
    }
  } catch (err) {
    msg = "❌ 操作失敗：" + err.message;
  }

  return HtmlService.createHtmlOutput(
    '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<style>body{font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;padding:20px;text-align:center;}' +
    'h2{color:#d4af37;margin-bottom:20px;}' +
    '</style></head><body><div><h2>' + msg + '</h2></div></body></html>'
  );
}

function buildForumData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const utc = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd HH:mm:ss");

  const posts = [];
  const postsSheet = ss.getSheetByName(SHEET_NAME_POSTS);
  if (postsSheet && postsSheet.getLastRow() > 1) {
    const rows = postsSheet.getRange(2, 1, postsSheet.getLastRow() - 1, 6).getValues();
    rows.forEach((r, i) => {
      posts.push({
        row: i + 2,
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
    rows.forEach((r, i) => {
      replies.push({
        row: i + 2,
        timestamp: String(r[0]),
        userEmail: String(r[1]),
        author: String(r[2]),
        postTitle: String(r[3]),
        replyContent: String(r[4])
      });
    });
  }

  return { posts, replies, serverTime: utc };
}

function getForumData() {
  return buildForumData();
}
