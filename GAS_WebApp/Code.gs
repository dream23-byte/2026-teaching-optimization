const S = {
  POSTS: "Posts", REPLIES: "Replies",
  LIKES: "PostLikes", COLLECTS: "PostCollects", REACTIONS: "ReplyReactions",
  CONVERSATIONS: "Conversations", AIFeedback: "AIFeedback",
  CLASSES: "Classes", CLASS_MEMBERS: "ClassMembers",
  MATERIALS: "Materials", INQUIRY_RECORDS: "InquiryRecords"
};

function onOpen() { ensureSheets(); }
function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const h = (n, hd) => { if (!ss.getSheetByName(n)) { const s = ss.insertSheet(n); s.appendRow(hd); } };
  h(S.POSTS, ["Timestamp","UserEmail","Author","Tag","Title","Content","ClassCode"]);
  h(S.REPLIES, ["Timestamp","UserEmail","Author","PostTitle","ReplyContent","ClassCode"]);
  h(S.LIKES, ["PostRow","UserEmail"]);
  h(S.COLLECTS, ["PostRow","UserEmail"]);
  h(S.REACTIONS, ["ReplyRow","UserEmail","Emoji"]);
  h(S.CONVERSATIONS, ["Timestamp","UserEmail","ConvId","Role","Message","PersonaKey","ClassCode"]);
  h(S.AIFeedback, ["Timestamp","UserEmail","ConvId","MsgId","Emoji","ClassCode"]);
  h(S.CLASSES, ["ClassCode","ClassName","TeacherEmail","CreatedAt","Unit","Grade","Subject","Room","Color"]);
  h(S.CLASS_MEMBERS, ["ClassCode","UserEmail","Role"]);
  h(S.MATERIALS, ["Timestamp","UserEmail","ClassCode","Title","Type","Url","Content","Author","Source","License","Tags"]);
  h(S.INQUIRY_RECORDS, ["Timestamp","UserEmail","ClassCode","ConvId","EventId","Questions","Summary","Score"]);
}

// 取得使用者角色: class owner / member / student / super-admin
function getUserClassRole(email, classCode) {
  if (!email || !classCode) return null;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // super admin check (from script properties)
  const admins = (PropertiesService.getScriptProperties().getProperty('SUPER_ADMINS') || '').split(',').map(s => s.trim().toLowerCase());
  if (admins.includes(email.toLowerCase())) return 'super-admin';
  // check teacher of this class
  const classes = readSheet(S.CLASSES, 4);
  const cls = classes.find(r => String(r[0]) === classCode);
  if (cls && String(cls[2]).toLowerCase() === email.toLowerCase()) return 'owner';
  // check member
  const members = readSheet(S.CLASS_MEMBERS, 3);
  const mem = members.find(r => String(r[0]) === classCode && String(r[1]).toLowerCase() === email.toLowerCase());
  return mem ? String(mem[2]) : null;
}

// 產生唯一班級代碼
function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function generateUniqueClassCode() {
  const classes = readSheet(S.CLASSES, 4).map(r => String(r[0]));
  let code;
  do { code = generateClassCode(); } while (classes.includes(code));
  return code;
}

// 建立班級 (教師)
function createClass(email, className, unit, grade, subject, room, color) {
  if (!email || !className) return "⚠️ 缺少班級名稱";
  const code = generateUniqueClassCode();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName(S.CLASSES).appendRow([code, className, email, new Date(), unit || '', grade || '', subject || '', room || '', color || '']);
  ss.getSheetByName(S.CLASS_MEMBERS).appendRow([code, email, 'owner']);
  return code;
}

// 加入班級 (學生輸入代碼)
function joinClass(email, classCode) {
  if (!email || !classCode) return "⚠️ 缺少班級代碼";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // check if class exists
  const classes = readSheet(S.CLASSES, 4);
  const cls = classes.find(r => String(r[0]).toUpperCase() === String(classCode).toUpperCase());
  if (!cls) return "❌ 班級代碼不存在";
  const realCode = String(cls[0]);
  // avoid duplicate join
  const members = readSheet(S.CLASS_MEMBERS, 3);
  const exists = members.some(r => String(r[0]) === realCode && String(r[1]).toLowerCase() === email.toLowerCase());
  if (exists) return "✅ 已加入班級";
  ss.getSheetByName(S.CLASS_MEMBERS).appendRow([realCode, email, 'student']);
  return "✅ 已加入班級 " + String(cls[1]);
}

// 查詢使用者的班級 (前端載入用)
function loadMyClasses(email) {
  if (!email) return [];
  const members = readSheet(S.CLASS_MEMBERS, 3);
  const rows = members.filter(r => String(r[1]).toLowerCase() === email.toLowerCase());
  const classes = readSheet(S.CLASSES, 9);
  return rows.map(r => {
    const code = String(r[0]);
    const cls = classes.find(c => String(c[0]) === code);
    return {
      classCode: code,
      className: cls ? String(cls[1]) : code,
      role: String(r[2]),
      unit: cls ? String(cls[4]) : '',
      grade: cls ? String(cls[5]) : '',
      subject: cls ? String(cls[6]) : '',
      room: cls ? String(cls[7]) : '',
      color: cls ? String(cls[8]) : ''
    };
  });
}

// 教師/管理員查詢某班級成員
function loadClassMembers(classCode, email) {
  const role = getUserClassRole(email, classCode);
  if (role !== 'owner' && role !== 'super-admin') return { error: '無權限' };
  const classes = readSheet(S.CLASSES, 4);
  const cls = classes.find(r => String(r[0]) === classCode) || {};
  const members = readSheet(S.CLASS_MEMBERS, 3).filter(r => String(r[0]) === classCode).map(r => ({ email: String(r[1]), role: String(r[2]) }));
  return { className: String(cls[1] || ''), teacher: String(cls[2] || ''), members };
}

function doGet(e) {
  try { ensureSheets(); } catch(ex) {}
  const p = (e && e.parameter) ? e.parameter : {};

  if (p.action && !p.callback) {
    return ContentService.createTextOutput(processAction(p));
  }

  if (p.callback) {
    if (p.mode === 'conversations' && p.email) {
      const convs = loadConversations(p.email);
      return ContentService.createTextOutput(p.callback + "(" + JSON.stringify(convs) + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    if (p.action === 'getMyClasses' && p.email) {
      return ContentService.createTextOutput(p.callback + "(" + JSON.stringify({ myClasses: loadMyClasses(p.email) }) + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    if (p.action === 'getClassMembers' && p.classCode && p.email) {
      return ContentService.createTextOutput(p.callback + "(" + JSON.stringify(loadClassMembers(p.classCode, p.email)) + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    if (p.action === 'getMaterials' && p.classCode) {
      const materials = readSheet(S.MATERIALS, 11).filter(r => String(r[2]) === p.classCode).map((r,i) => ({
        row: i+2, timestamp: String(r[0]), userEmail: String(r[1]), classCode: String(r[2]),
        title: String(r[3]), type: String(r[4]), url: String(r[5]), content: String(r[6]),
        author: String(r[7]), source: String(r[8]), license: String(r[9]), tags: String(r[10])
      }));
      return ContentService.createTextOutput(p.callback + "(" + JSON.stringify({ materials }) + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    const data = buildData(p.email, p.activeClass);
    return ContentService.createTextOutput(p.callback + "(" + JSON.stringify(data) + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  const email = Session.getActiveUser().getEmail();
  if (!email) return HtmlService.createHtmlOutput('<html><body style="font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;justify-content:center;align-items:center;height:100vh;"><div style="text-align:center;"><h1 style="color:#d4af37;">🔐 需要 Google 登入</h1></div></body></html>').setTitle("歷史沙龍");
  const t = HtmlService.createTemplateFromFile("Index");
  t.userEmail = email; t.appUrl = ScriptApp.getService().getUrl();
  return t.evaluate().setTitle("歷史沙龍").addMetaTag("viewport","width=device-width,initial-scale=1.0");
}

function doPost(e) {
  ensureSheets();
  const p = e.parameter;
  const msg = processAction(p);
  return HtmlService.createHtmlOutput('<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>body{font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;padding:20px;text-align:center;}h2{color:#d4af37;}</style></head><body><div><h2>' + msg + '</h2></div></body></html>');
}

function processAction(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const u = p.userEmail || Session.getActiveUser().getEmail() || "";
  let msg = "";
  try {
    if (p.action === "addPost") {
      ss.getSheetByName(S.POSTS).appendRow([new Date(), u, p.author, p.tag, p.title, p.content, p.classCode || ""]); msg = "✅ 發布成功";
    } else if (p.action === "addReply") {
      ss.getSheetByName(S.REPLIES).appendRow([new Date(), u, p.author, p.postTitle, p.replyContent, p.classCode || ""]); msg = "✅ 回覆成功";
    } else if (p.action === "editPost") {
      const r = parseInt(p.row); const sh = ss.getSheetByName(S.POSTS);
      sh.getRange(r,3).setValue(p.author); sh.getRange(r,4).setValue(p.tag); sh.getRange(r,5).setValue(p.title); sh.getRange(r,6).setValue(p.content); msg = "✅ 已更新";
    } else if (p.action === "deletePost") {
      ss.getSheetByName(S.POSTS).deleteRow(parseInt(p.row)); msg = "✅ 已刪除";
    } else if (p.action === "editReply") {
      ss.getSheetByName(S.REPLIES).getRange(parseInt(p.row),5).setValue(p.replyContent); msg = "✅ 已更新";
    } else if (p.action === "deleteReply") {
      ss.getSheetByName(S.REPLIES).deleteRow(parseInt(p.row)); msg = "✅ 已刪除";
    } else if (p.action === "likePost") {
      ss.getSheetByName(S.LIKES).appendRow([parseInt(p.row), u]); msg = "✅ 已按讚";
    } else if (p.action === "unlikePost") {
      const sh = ss.getSheetByName(S.LIKES); const rows = sh.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 0; i--) { if (Number(rows[i][0]) === Number(p.row) && String(rows[i][1]) === u) { sh.deleteRow(i + 1); break; } }
      msg = "✅ 已取消讚";
    } else if (p.action === "collectPost") {
      ss.getSheetByName(S.COLLECTS).appendRow([parseInt(p.row), u]); msg = "✅ 已收藏";
    } else if (p.action === "uncollectPost") {
      const sh = ss.getSheetByName(S.COLLECTS); const rows = sh.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 0; i--) { if (Number(rows[i][0]) === Number(p.row) && String(rows[i][1]) === u) { sh.deleteRow(i + 1); break; } }
      msg = "✅ 已取消收藏";
    } else if (p.action === "addReaction") {
      ss.getSheetByName(S.REACTIONS).appendRow([parseInt(p.replyRow), u, p.emoji]); msg = "✅ 已反應";
    } else if (p.action === "removeReaction") {
      const sh = ss.getSheetByName(S.REACTIONS); const rows = sh.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 0; i--) { if (Number(rows[i][0]) === Number(p.replyRow) && String(rows[i][1]) === u && String(rows[i][2]) === p.emoji) { sh.deleteRow(i + 1); break; } }
      msg = "✅ 已移除反應";
    } else if (p.action === "saveConversation") {
      ss.getSheetByName(S.CONVERSATIONS).appendRow([new Date(), u, p.convId, p.role, p.message, p.personaKey, p.classCode || ""]); msg = "ok";
    } else if (p.action === "saveFeedback") {
      ss.getSheetByName(S.AIFeedback).appendRow([new Date(), u, p.convId, p.msgId, p.emoji, p.classCode || ""]); msg = "ok";
    } else if (p.action === "createClass") {
      msg = createClass(u, p.className, p.unit, p.grade, p.subject, p.room, p.color);
    } else if (p.action === "joinClass") {
      msg = joinClass(u, p.classCode);
    } else if (p.action === "getMyClasses") {
      msg = JSON.stringify({ myClasses: loadMyClasses(u) });
    } else if (p.action === "getClassMembers") {
      msg = JSON.stringify(loadClassMembers(p.classCode, u));
    } else if (p.action === "deleteConversation") {
      const sh = ss.getSheetByName(S.CONVERSATIONS); const rows = sh.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 0; i--) { if (String(rows[i][1]) === u && String(rows[i][2]) === p.convId) { sh.deleteRow(i + 1); } }
      msg = "ok";
    } else if (p.action === "addMaterial") {
      ss.getSheetByName(S.MATERIALS).appendRow([new Date(), u, p.classCode || '', p.title || '', p.type || 'url', p.url || '', p.content || '', p.author || '', p.source || '', p.license || '', p.tags || '']);
      msg = "✅ 已新增素材";
    } else if (p.action === "deleteMaterial") {
      const sh = ss.getSheetByName(S.MATERIALS); const rows = sh.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 0; i--) { if (Number(rows[i][0]) === Number(p.row) && String(rows[i][1]) === u) { sh.deleteRow(i + 1); break; } }
      msg = "✅ 已刪除素材";
    } else if (p.action === "saveInquiryRecord") {
      ss.getSheetByName(S.INQUIRY_RECORDS).appendRow([new Date(), u, p.classCode || '', p.convId || '', p.eventId || '', p.questions || '', p.summary || '', p.score || '']);
      msg = "ok";
    } else { msg = "⚠️ 未知操作"; }
  } catch(err) { msg = "❌ " + err.message; }
  return msg;
}

function loadConversations(email) {
  if (!email) return [];
  const admins = (PropertiesService.getScriptProperties().getProperty('SUPER_ADMINS') || '').split(',').map(s => s.trim().toLowerCase());
  const isAdmin = admins.includes(email.toLowerCase());
  let all = readSheet(S.CONVERSATIONS, 7).map(r => ({
    timestamp: String(r[0]), userEmail: String(r[1]), convId: String(r[2]), role: String(r[3]), message: String(r[4]), personaKey: String(r[5]), classCode: String(r[6] || '')
  }));
  if (isAdmin) return all; // super admin sees everything
  // teacher: see their class(es) conversations + their own
  const myClasses = loadMyClasses(email);
  const ownedClasses = readSheet(S.CLASSES, 4).filter(r => String(r[2]).toLowerCase() === email.toLowerCase()).map(r => String(r[0]));
  const visibleClasses = new Set([...ownedClasses].filter(c => myClasses.some(m => m.classCode === c)));
  return all.filter(r => {
    if (String(r.userEmail).toLowerCase() === email.toLowerCase()) return true;
    if (visibleClasses.has(r.classCode)) return true;
    return false;
  });
}

function readSheet(name, cols) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() <= 1) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, cols).getValues();
}

function buildData(rawEmail, activeClass) {
  const admins = (PropertiesService.getScriptProperties().getProperty('SUPER_ADMINS') || '').split(',').map(s => s.trim().toLowerCase());
  const email = (rawEmail || '').toLowerCase();
  const isAdmin = email && admins.includes(email);
  // member classes of the requestor (if logged in) — used to decide forum visibility
  let userClasses = [];
  if (email && !isAdmin) userClasses = readSheet(S.CLASS_MEMBERS, 3).filter(r => String(r[1]).toLowerCase() === email).map(r => String(r[0]));

  // posts/replies now have 7 cols with ClassCode optional (public posts have empty class)
  let posts = readSheet(S.POSTS, 7).map((r,i) => ({ row: i+2, timestamp: String(r[0]), userEmail: String(r[1]), author: String(r[2]), tag: String(r[3]), title: String(r[4]), content: String(r[5]), classCode: String(r[6] || '') }));
  let replies = readSheet(S.REPLIES, 6).map((r,i) => ({ row: i+2, timestamp: String(r[0]), userEmail: String(r[1]), author: String(r[2]), postTitle: String(r[3]), replyContent: String(r[4]), classCode: String(r[5] || '') }));

  if (activeClass) {
    // class-scoped view: only public posts + posts from the requestor's membership in this class
    const canSeeClass = isAdmin || userClasses.includes(activeClass);
    const stdActive = activeClass.toUpperCase();
    if (canSeeClass) {
      posts = posts.filter(p => !p.classCode || p.classCode.toUpperCase() === stdActive);
      replies = replies.filter(r => !r.classCode || r.classCode.toUpperCase() === stdActive);
    } else {
      posts = posts.filter(p => !p.classCode); // non-member only sees public
      replies = replies.filter(r => !r.classCode);
    }
  }

  const likes = readSheet(S.LIKES, 2).map(r => ({ postRow: Number(r[0]), userEmail: String(r[1]) }));
  const collects = readSheet(S.COLLECTS, 2).map(r => ({ postRow: Number(r[0]), userEmail: String(r[1]) }));
  const reactions = readSheet(S.REACTIONS, 3).map(r => ({ replyRow: Number(r[0]), userEmail: String(r[1]), emoji: String(r[2]) }));
  return { posts, replies, likes, collects, reactions };
}

function getForumData() { return buildData(); }
