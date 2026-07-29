const S = {
  POSTS: "Posts", REPLIES: "Replies",
  LIKES: "PostLikes", COLLECTS: "PostCollects", REACTIONS: "ReplyReactions"
};

function onOpen() { ensureSheets(); }
function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const h = (n, hd) => { if (!ss.getSheetByName(n)) { const s = ss.insertSheet(n); s.appendRow(hd); } };
  h(S.POSTS, ["Timestamp","UserEmail","Author","Tag","Title","Content"]);
  h(S.REPLIES, ["Timestamp","UserEmail","Author","PostTitle","ReplyContent"]);
  h(S.LIKES, ["PostRow","UserEmail"]);
  h(S.COLLECTS, ["PostRow","UserEmail"]);
  h(S.REACTIONS, ["ReplyRow","UserEmail","Emoji"]);
}

function doGet(e) {
  try { ensureSheets(); } catch(ex) {}
  if (e && e.parameter && e.parameter.callback) {
    const data = buildData();
    return ContentService.createTextOutput(e.parameter.callback + "(" + JSON.stringify(data) + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  const email = Session.getActiveUser().getEmail();
  if (!email) return HtmlService.createHtmlOutput('<html><body style="font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;justify-content:center;align-items:center;height:100vh;"><div style="text-align:center;"><h1 style="color:#d4af37;">🔐 需要 Google 登入</h1></div></body></html>').setTitle("歷史沙龍");
  const t = HtmlService.createTemplateFromFile("Index");
  t.userEmail = email; t.appUrl = ScriptApp.getService().getUrl();
  return t.evaluate().setTitle("歷史沙龍").addMetaTag("viewport","width=device-width,initial-scale=1.0");
}

function doPost(e) {
  ensureSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const p = e.parameter;
  const u = p.userEmail || Session.getActiveUser().getEmail() || "";
  let msg = "";
  try {
    if (p.action === "addPost") {
      ss.getSheetByName(S.POSTS).appendRow([new Date(), u, p.author, p.tag, p.title, p.content]);
      msg = "✅ 發布成功";
    } else if (p.action === "addReply") {
      ss.getSheetByName(S.REPLIES).appendRow([new Date(), u, p.author, p.postTitle, p.replyContent]);
      msg = "✅ 回覆成功";
    } else if (p.action === "editPost") {
      const r = parseInt(p.row); const sh = ss.getSheetByName(S.POSTS);
      sh.getRange(r,4).setValue(p.tag); sh.getRange(r,5).setValue(p.title); sh.getRange(r,6).setValue(p.content);
      msg = "✅ 已更新";
    } else if (p.action === "deletePost") {
      ss.getSheetByName(S.POSTS).deleteRow(parseInt(p.row));
      msg = "✅ 已刪除";
    } else if (p.action === "editReply") {
      ss.getSheetByName(S.REPLIES).getRange(parseInt(p.row),5).setValue(p.replyContent);
      msg = "✅ 已更新";
    } else if (p.action === "deleteReply") {
      ss.getSheetByName(S.REPLIES).deleteRow(parseInt(p.row));
      msg = "✅ 已刪除";
    } else if (p.action === "likePost") {
      ss.getSheetByName(S.LIKES).appendRow([parseInt(p.row), u]);
      msg = "✅ 已按讚";
    } else if (p.action === "unlikePost") {
      const sh = ss.getSheetByName(S.LIKES);
      const rows = sh.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 0; i--) {
        if (Number(rows[i][0]) === Number(p.row) && String(rows[i][1]) === u) { sh.deleteRow(i + 1); break; }
      }
      msg = "✅ 已取消讚";
    } else if (p.action === "collectPost") {
      ss.getSheetByName(S.COLLECTS).appendRow([parseInt(p.row), u]);
      msg = "✅ 已收藏";
    } else if (p.action === "uncollectPost") {
      const sh = ss.getSheetByName(S.COLLECTS);
      const rows = sh.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 0; i--) {
        if (Number(rows[i][0]) === Number(p.row) && String(rows[i][1]) === u) { sh.deleteRow(i + 1); break; }
      }
      msg = "✅ 已取消收藏";
    } else if (p.action === "addReaction") {
      ss.getSheetByName(S.REACTIONS).appendRow([parseInt(p.replyRow), u, p.emoji]);
      msg = "✅ 已反應";
    } else if (p.action === "removeReaction") {
      const sh = ss.getSheetByName(S.REACTIONS);
      const rows = sh.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 0; i--) {
        if (Number(rows[i][0]) === Number(p.replyRow) && String(rows[i][1]) === u && String(rows[i][2]) === p.emoji) { sh.deleteRow(i + 1); break; }
      }
      msg = "✅ 已移除反應";
    } else { msg = "⚠️ 未知操作"; }
  } catch(err) { msg = "❌ " + err.message; }
  return HtmlService.createHtmlOutput('<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>body{font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;padding:20px;text-align:center;}h2{color:#d4af37;}</style></head><body><div><h2>' + msg + '</h2></div></body></html>');
}

function readSheet(name, cols) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() <= 1) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, cols).getValues();
}

function buildData() {
  const posts = readSheet(S.POSTS, 6).map((r,i) => ({ row: i+2, timestamp: String(r[0]), userEmail: String(r[1]), author: String(r[2]), tag: String(r[3]), title: String(r[4]), content: String(r[5]) }));
  const replies = readSheet(S.REPLIES, 5).map((r,i) => ({ row: i+2, timestamp: String(r[0]), userEmail: String(r[1]), author: String(r[2]), postTitle: String(r[3]), replyContent: String(r[4]) }));
  const likes = readSheet(S.LIKES, 2).map(r => ({ postRow: Number(r[0]), userEmail: String(r[1]) }));
  const collects = readSheet(S.COLLECTS, 2).map(r => ({ postRow: Number(r[0]), userEmail: String(r[1]) }));
  const reactions = readSheet(S.REACTIONS, 3).map(r => ({ replyRow: Number(r[0]), userEmail: String(r[1]), emoji: String(r[2]) }));
  return { posts, replies, likes, collects, reactions };
}

function getForumData() { return buildData(); }
