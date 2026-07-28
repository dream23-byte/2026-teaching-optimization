/**
 * Google Apps Script — 歷史沙龍後端
 * 工作表一「Posts」：Timestamp | UserEmail | Author | Tag | Title | Content
 * 工作表二「Replies」：Timestamp | UserEmail | Author | PostTitle | ReplyContent
 */

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const postsSheet = ss.getSheetByName("Posts");
  const repliesSheet = ss.getSheetByName("Replies");

  const posts = [];
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

  const payload = JSON.stringify({ posts, replies });

  // 支援 JSONP（callback 參數）
  if (e && e.parameter && e.parameter.callback) {
    return ContentService
      .createTextOutput(e.parameter.callback + '(' + payload + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const raw = e.parameter.payload || e.postData.contents;
  const params = JSON.parse(raw);
  const action = params.action;
  const data = params.data;

  if (action === 'addPost') {
    const sheet = ss.getSheetByName("Posts");
    sheet.appendRow([
      new Date(),
      data.userEmail || '',
      data.author,
      data.tag,
      data.title,
      data.content
    ]);
  } else if (action === 'addReply') {
    const sheet = ss.getSheetByName("Replies");
    sheet.appendRow([
      new Date(),
      data.userEmail || '',
      data.author,
      data.postTitle,
      data.replyContent
    ]);
  }

  // form POST 目標為 iframe，回傳空白 HTML 避免錯誤
  return HtmlService.createHtmlOutput('<html><body></body></html>');
}
