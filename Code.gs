/**
 * STUDENT MANAGER V2 - BACKEND (Code.gs)
 * Google Apps Script for Drive Integration & App Serving
 */

const ROOT_FOLDER_ID = '13iUsIYgNnZQhC6hezwXJO06Re4zAZ8Ri';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('NITIPAT MANAGER')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  const args = data.args || [];
  
  try {
    const result = this[action].apply(this, args);
    return ContentService.createTextOutput(JSON.stringify({ success: true, result: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ════════════════════════════════════════════════════════════
 * NOTION PROXY & SYNC ENGINE
 * ════════════════════════════════════════════════════════════
 */

function callNotionAPI(endpoint, method, payload) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('NOTION_TOKEN');
  if (!token) return { success: false, error: "Notion Token not found" };

  const options = {
    method: method,
    headers: {
      "Authorization": "Bearer " + token,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };

  if (payload) options.payload = JSON.stringify(payload);

  try {
    const response = UrlFetchApp.fetch("https://api.notion.com/v1/" + endpoint, options);
    const result = JSON.parse(response.getContentText());
    return { success: response.getResponseCode() < 400, data: result, status: response.getResponseCode() };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function checkNotionConnection() {
  const res = callNotionAPI("users/me", "GET");
  if (res.success) {
    return { success: true, botName: res.data.name };
  }
  return { success: false, error: res.error || "Connection failed" };
}

/**
 * Sync Assignment to Notion (Bidirectional Support)
 */
function syncAssignmentToNotion(assignment) {
  const props = PropertiesService.getScriptProperties();
  const databaseId = props.getProperty('NOTION_DB_ASSIGNMENTS');
  if (!databaseId) return { success: false, error: "Notion Assignments DB ID not set" };

  const notionPageId = assignment.notionPageId;
  
  // Format properties for Notion
  const properties = {
    "Title": { title: [{ text: { content: assignment.title } }] },
    "Deadline": { date: { start: assignment.dueDate || new Date().toISOString() } },
    "Status": { status: { name: assignment.submitted ? "Done" : (assignment.status || "In Progress") } },
    "AppID": { rich_text: [{ text: { content: assignment.id || "" } }] },
    "Type": { select: { name: assignment.type || "Homework" } }
  };

  if (assignment.courseNotionPageId) {
    properties["Course"] = { relation: [{ id: assignment.courseNotionPageId }] };
  }

  const payload = {
    parent: { database_id: databaseId },
    properties: properties
  };

  if (notionPageId) {
    const res = callNotionAPI(`pages/${notionPageId}`, "PATCH", { properties: properties });
    if (res.success) return res;
    
    // Self-healing fallback if the page was deleted in Notion
    if (res.status === 404 || res.status === 400) {
      const createRes = callNotionAPI("pages", "POST", payload);
      if (createRes.success) return { success: true, pageId: createRes.data.id };
      return createRes;
    }
    return res;
  } else {
    const res = callNotionAPI("pages", "POST", payload);
    if (res.success) return { success: true, pageId: res.data.id };
    return res;
  }
}

/**
 * Sync Course to Notion
 */
function syncCourseToNotion(course) {
  const props = PropertiesService.getScriptProperties();
  const databaseId = props.getProperty('NOTION_DB_COURSES');
  const semDbId = props.getProperty('NOTION_DB_SEMESTERS');
  if (!databaseId) return { success: false, error: "Notion Courses DB ID not set" };

  // Helper to find/create Semester page (with Lock to prevent race condition duplicates)
  let semPageId = null;
  if (semDbId && course.semesterName) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000); // Wait up to 15 seconds for other concurrent threads
      
      const semSearch = callNotionAPI(`databases/${semDbId}/query`, "POST", {
        filter: { property: "Name", title: { equals: course.semesterName } }
      });
      
      if (semSearch.success && semSearch.data && semSearch.data.results && semSearch.data.results.length > 0) {
        semPageId = semSearch.data.results[0].id;
      } else {
        if (course.semesterName !== 'Unknown Semester') {
          const newSem = callNotionAPI("pages", "POST", {
            parent: { database_id: semDbId },
            properties: { "Name": { title: [{ text: { content: course.semesterName } }] } }
          });
          if (newSem.success && newSem.data) semPageId = newSem.data.id;
        }
      }
    } catch (e) {
      console.error("Lock error: " + e);
    } finally {
      lock.releaseLock();
    }
  }

  const notionPageId = course.notionPageId;
  const properties = {
    "Name": { title: [{ text: { content: `${course.code || ''} ${course.nameTh || course.name || ''}` } }] },
    "Code": { rich_text: [{ text: { content: course.code || "" } }] },
    "Credits": { number: parseInt(course.credits) || 0 },
    "Drive URL": { url: course.driveUrl || null },
    "AppID": { rich_text: [{ text: { content: course.id || "" } }] }
  };

  if (semPageId) properties["Semester"] = { relation: [{ id: semPageId }] };

  if (notionPageId) {
    const res = callNotionAPI(`pages/${notionPageId}`, "PATCH", { properties: properties });
    if (res.success) return { success: true, pageId: res.data.id, url: res.data.url };
    
    // Self-healing fallback if the page was deleted in Notion
    if (res.status === 404 || res.status === 400) {
      const createRes = callNotionAPI("pages", "POST", { parent: { database_id: databaseId }, properties: properties });
      if (createRes.success) return { success: true, pageId: createRes.data.id, url: createRes.data.url };
      return createRes;
    }
    return res;
  } else {
    const res = callNotionAPI("pages", "POST", { parent: { database_id: databaseId }, properties: properties });
    if (res.success) return { success: true, pageId: res.data.id, url: res.data.url };
    return res;
  }
}

/**
 * 📦 BATCH SYNC COURSES TO NOTION
 * Processes all courses in a single request to avoid Apps Script concurrent HTTP quota limits.
 */
function syncCoursesToNotionBatch(courses) {
  const props = PropertiesService.getScriptProperties();
  const databaseId = props.getProperty('NOTION_DB_COURSES');
  const semDbId = props.getProperty('NOTION_DB_SEMESTERS');
  if (!databaseId) return { success: false, error: "Notion Courses DB ID not set" };
  
  const results = [];
  
  for (const course of courses) {
    try {
      let semPageId = null;
      if (semDbId && course.semesterName) {
        const semSearch = callNotionAPI(`databases/${semDbId}/query`, "POST", {
          filter: { property: "Name", title: { equals: course.semesterName } }
        });
        
        if (semSearch.success && semSearch.data && semSearch.data.results && semSearch.data.results.length > 0) {
          semPageId = semSearch.data.results[0].id;
        } else {
          if (course.semesterName !== 'Unknown Semester') {
            const newSem = callNotionAPI("pages", "POST", {
              parent: { database_id: semDbId },
              properties: { "Name": { title: [{ text: { content: course.semesterName } }] } }
            });
            if (newSem.success && newSem.data) semPageId = newSem.data.id;
          }
        }
      }
      
      const notionPageId = course.notionPageId;
      const properties = {
        "Name": { title: [{ text: { content: `${course.code || ''} ${course.nameTh || course.name || ''}` } }] },
        "Code": { rich_text: [{ text: { content: course.code || "" } }] },
        "Credits": { number: parseInt(course.credits) || 0 },
        "Drive URL": { url: course.driveUrl || null },
        "AppID": { rich_text: [{ text: { content: course.id || "" } }] }
      };
      
      if (semPageId) properties["Semester"] = { relation: [{ id: semPageId }] };
      
      let res;
      if (notionPageId) {
        res = callNotionAPI(`pages/${notionPageId}`, "PATCH", { properties: properties });
        if (!res.success && (res.status === 404 || res.status === 400)) {
          res = callNotionAPI("pages", "POST", { parent: { database_id: databaseId }, properties: properties });
        }
      } else {
        res = callNotionAPI("pages", "POST", { parent: { database_id: databaseId }, properties: properties });
      }
      
      if (res.success && res.data) {
        results.push({ id: course.id, success: true, pageId: res.data.id, url: res.data.url });
      } else {
        results.push({ id: course.id, success: false, error: JSON.stringify(res.error || res.data) });
      }
    } catch (err) {
      results.push({ id: course.id, success: false, error: err.toString() });
    }
  }
  
  return { success: true, results: results };
}

/**
 * 📦 BATCH SYNC ASSIGNMENTS TO NOTION
 * Processes all assignments in a single request to avoid Apps Script concurrent HTTP quota limits.
 */
function syncAssignmentsToNotionBatch(assignments) {
  const props = PropertiesService.getScriptProperties();
  const databaseId = props.getProperty('NOTION_DB_ASSIGNMENTS');
  const courseDbId = props.getProperty('NOTION_DB_COURSES');
  if (!databaseId) return { success: false, error: "Notion Assignments DB ID not set" };
  
  const courseMap = {};
  if (courseDbId) {
    const courseRes = callNotionAPI(`databases/${courseDbId}/query`, "POST", {});
    if (courseRes.success && courseRes.data && courseRes.data.results) {
      for (const cPage of courseRes.data.results) {
        const appId = cPage.properties.AppID?.rich_text[0]?.plain_text;
        if (appId) courseMap[appId] = cPage.id;
      }
    }
  }
  
  const results = [];
  
  for (const assign of assignments) {
    try {
      const notionPageId = assign.notionPageId;
      const courseNotionPageId = assign.courseNotionPageId || courseMap[assign.courseId];
      
      const properties = {
        "Title": { title: [{ text: { content: assign.title } }] },
        "Deadline": { date: { start: assign.dueDate || new Date().toISOString() } },
        "Status": { status: { name: assign.submitted ? "Done" : (assign.status || "In Progress") } },
        "AppID": { rich_text: [{ text: { content: assign.id || "" } }] },
        "Type": { select: { name: assign.type || "Homework" } }
      };
      
      if (courseNotionPageId) {
        properties["Course"] = { relation: [{ id: courseNotionPageId }] };
      }
      
      const payload = {
        parent: { database_id: databaseId },
        properties: properties
      };
      
      let res;
      if (notionPageId) {
        res = callNotionAPI(`pages/${notionPageId}`, "PATCH", { properties: properties });
        if (!res.success && (res.status === 404 || res.status === 400)) {
          res = callNotionAPI("pages", "POST", payload);
        }
      } else {
        res = callNotionAPI("pages", "POST", payload);
      }
      
      if (res.success && res.data) {
        results.push({ id: assign.id, success: true, pageId: res.data.id });
      } else {
        results.push({ id: assign.id, success: false, error: JSON.stringify(res.error || res.data) });
      }
    } catch (err) {
      results.push({ id: assign.id, success: false, error: err.toString() });
    }
  }
  
  return { success: true, results: results };
}

/**
 * Sync Reflection to Course Page Content
 */
function syncReflectionToNotion(pageId, text) {
  if (!pageId) return { success: false, error: "No Notion Page ID" };
  
  // Appends reflection as a block to the course page
  const payload = {
    children: [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ text: { content: `Reflection (${new Date().toLocaleDateString()})` } }] }
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: text } }] }
      }
    ]
  };
  
  return callNotionAPI(`pages/${pageId}/children`, "PATCH", payload);
}

/**
 * Pull Updates from Notion
 */
function fetchNotionUpdates(lastSyncTime) {
  const props = PropertiesService.getScriptProperties();
  const databaseId = props.getProperty('NOTION_DB_ASSIGNMENTS');
  if (!databaseId) return [];

  const filter = lastSyncTime ? {
    filter: {
      timestamp: "last_edited_time",
      last_edited_time: { after: lastSyncTime }
    }
  } : {};
  
  const res = callNotionAPI(`databases/${databaseId}/query`, "POST", filter);
  if (!res.success) return [];
  
  return res.data.results.map(page => {
    const p = page.properties;
    return {
      notionPageId: page.id,
      lastEdited: page.last_edited_time,
      title: p.Title?.title[0]?.plain_text || p.Name?.title[0]?.plain_text,
      status: p.Status?.status?.name,
      appId: p.AppID?.rich_text[0]?.plain_text,
      deadline: p.Deadline?.date?.start
    };
  });
}

/**
 * Background Trigger Logic (Polled every 10 mins)
 */
function setupNotionTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'automatedNotionSync') ScriptApp.deleteTrigger(t);
  });
  
  ScriptApp.newTrigger('automatedNotionSync')
    .timeBased()
    .everyMinutes(10)
    .create();
    
  return { success: true, message: "10-minute sync trigger activated" };
}

function automatedNotionSync() {
  // This will be called by GAS every 10 mins.
  // Since we don't have Firestore here directly, we log the intent.
  // Real sync happens when the app is open OR if we implement Firestore REST.
  console.log("Automated Notion Sync Triggered at " + new Date());
}

/**
 * AUTO-SETUP: Creates Databases in Notion automatically
 */
function initializeNotionWorkspace(token) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('NOTION_TOKEN', token);
  
  // 1. Search for shared pages/databases to find a parent and existing structures
  const searchRes = callNotionAPI("search", "POST", {});
  if (!searchRes.success || !searchRes.data || !searchRes.data.results || searchRes.data.results.length === 0) {
    return { 
      success: false, 
      error: "ไม่พบข้อมูลที่แชร์กับ Integration นี้ กรุณากดปุ่ม 'Add Connection' ในหน้า Notion ที่ต้องการเชื่อมต่อ และเลือกบอทตัวนี้ก่อน!" 
    };
  }
  
  // Try to find a parent page in the shared items
  let parentPageId = null;
  for (const item of searchRes.data.results) {
    if (item.object === 'page') {
      parentPageId = item.id;
      break;
    }
  }
  
  if (!parentPageId && searchRes.data.results.length > 0) {
    const firstItem = searchRes.data.results[0];
    if (firstItem.parent && firstItem.parent.type === 'page_id') {
      parentPageId = firstItem.parent.page_id;
    } else {
      parentPageId = firstItem.id;
    }
  }
  
  if (!parentPageId) {
    return { 
      success: false, 
      error: "ไม่สามารถระบุ ID หน้าหลักของ Notion ได้ กรุณาสร้างหน้าเปล่า (Page) และแชร์มันเข้ามาในระบบบอทตัวนี้ครับ" 
    };
  }
  
  // 2. Discover existing NITIPAT databases to reuse them (making this setup fully idempotent)
  let semDbId = null;
  let courseDbId = null;
  let assignDbId = null;
  let notebookDbId = null;
  
  for (const item of searchRes.data.results) {
    if (item.object === 'database') {
      const titleText = item.title && item.title[0]?.plain_text ? item.title[0].plain_text : "";
      if (titleText.includes("Semesters")) semDbId = item.id;
      else if (titleText.includes("Courses")) courseDbId = item.id;
      else if (titleText.includes("Assignments")) assignDbId = item.id;
      else if (titleText.includes("Notebooks")) notebookDbId = item.id;
    }
  }
  
  // 3. Create or reuse Semesters Database
  if (!semDbId) {
    const semDbPayload = {
      parent: { type: "page_id", page_id: parentPageId },
      title: [{ type: "text", text: { content: "📅 NITIPAT Semesters" } }],
      properties: {
        "Name": { title: {} },
        "AppID": { rich_text: {} },
        "Academic Year": { select: { options: [] } }
      }
    };
    const semDbRes = callNotionAPI("databases", "POST", semDbPayload);
    if (!semDbRes.success) return { success: false, error: "สร้าง Database เทอมไม่สำเร็จ: " + JSON.stringify(semDbRes.data || semDbRes.error) };
    semDbId = semDbRes.data.id;
  }
  props.setProperty('NOTION_DB_SEMESTERS', semDbId);
  
  // 4. Create or reuse Courses Database
  if (!courseDbId) {
    const coursesDbPayload = {
      parent: { type: "page_id", page_id: parentPageId },
      title: [{ type: "text", text: { content: "📚 NITIPAT Courses" } }],
      properties: {
        "Name": { title: {} },
        "Code": { rich_text: {} },
        "Credits": { number: {} },
        "Semester": { 
          relation: { 
            database_id: semDbId, 
            type: "dual_property",
            dual_property: {
              synced_property_name: "📚 Courses"
            }
          } 
        },
        "Drive URL": { url: {} },
        "AppID": { rich_text: {} }
      }
    };
    const courseDbRes = callNotionAPI("databases", "POST", coursesDbPayload);
    if (!courseDbRes.success) return { success: false, error: "สร้าง Database วิชาไม่สำเร็จ: " + JSON.stringify(courseDbRes.data || courseDbRes.error) };
    courseDbId = courseDbRes.data.id;
  }
  props.setProperty('NOTION_DB_COURSES', courseDbId);
  
  // 5. Create or reuse Assignments Database
  if (!assignDbId) {
    const assignDbPayload = {
      parent: { type: "page_id", page_id: parentPageId },
      title: [{ type: "text", text: { content: "📋 NITIPAT Assignments" } }],
      properties: {
        "Title": { title: {} },
        "Deadline": { date: {} },
        "Status": { status: {} },
        "Type": { select: { options: [
          { name: "Homework", color: "blue" },
          { name: "Exam", color: "red" },
          { name: "Project", color: "green" }
        ] } },
        "AppID": { rich_text: {} },
        "Course": { 
          relation: { 
            database_id: courseDbId, 
            type: "dual_property",
            dual_property: {
              synced_property_name: "📋 Assignments"
            }
          } 
        }
      }
    };
    const assignDbRes = callNotionAPI("databases", "POST", assignDbPayload);
    if (!assignDbRes.success) return { success: false, error: "สร้าง Database การบ้านไม่สำเร็จ: " + JSON.stringify(assignDbRes.data || assignDbRes.error) };
    assignDbId = assignDbRes.data.id;
  }
  props.setProperty('NOTION_DB_ASSIGNMENTS', assignDbId);
  
  // 6. Create or reuse Notebooks Database
  if (!notebookDbId) {
    const notebookDbPayload = {
      parent: { type: "page_id", page_id: parentPageId },
      title: [{ type: "text", text: { content: "📒 NITIPAT Notebooks" } }],
      properties: {
        "Name": { title: {} },
        "Drive URL": { url: {} },
        "AppID": { rich_text: {} },
        "Course": { 
          relation: { 
            database_id: courseDbId, 
            type: "dual_property",
            dual_property: {
              synced_property_name: "📒 Notebooks"
            }
          } 
        }
      }
    };
    const notebookDbRes = callNotionAPI("databases", "POST", notebookDbPayload);
    if (notebookDbRes.success) {
      notebookDbId = notebookDbRes.data.id;
    }
  }
  if (notebookDbId) {
    props.setProperty('NOTION_DB_NOTEBOOKS', notebookDbId);
  }
  
  return { 
    success: true, 
    message: "เชื่อมต่อกับ Notion เรียบร้อยแล้ว! ตรวจพบและซิงค์เชื่อมโยง 4 ฐานข้อมูลหลักสำเร็จแล้วครับ" 
  };
}
/**
 * Sync Exam to Notion
 */
function syncExamToNotion(exam) {
  const props = PropertiesService.getScriptProperties();
  const databaseId = props.getProperty('NOTION_DB_EXAMS') || props.getProperty('NOTION_DB_ASSIGNMENTS'); 
  if (!databaseId) return { success: false, error: "Notion Exams/Assignments DB ID not set" };

  const notionPageId = exam.notionPageId;
  const properties = {
    "Title": { title: [{ text: { content: exam.title } }] },
    "Date": { date: { start: exam.date } },
    "Time": { rich_text: [{ text: { content: exam.time || "" } }] },
    "Room": { rich_text: [{ text: { content: exam.room || "" } }] },
    "CourseID": { rich_text: [{ text: { content: exam.courseId || "" } }] },
    "AppID": { rich_text: [{ text: { content: exam.id || "" } }] },
    "Type": { select: { name: "Exam" } }
  };

  const payload = {
    parent: { database_id: databaseId },
    properties: properties
  };

  if (notionPageId) {
    const res = callNotionAPI(`pages/${notionPageId}`, "PATCH", { properties: properties });
    if (res.success) return res;
    
    // Self-healing fallback if the page was deleted in Notion
    if (res.status === 404 || res.status === 400) {
      const createRes = callNotionAPI("pages", "POST", payload);
      if (createRes.success) return { success: true, pageId: createRes.data.id };
      return createRes;
    }
    return res;
  } else {
    const res = callNotionAPI("pages", "POST", payload);
    if (res.success) return { success: true, pageId: res.data.id };
    return res;
  }
}

/**
 * ════════════════════════════════════════════════════════════
 * DRIVE & PICKER MANAGEMENT
 * ════════════════════════════════════════════════════════════
 */

function getPickerToken() {
  return ScriptApp.getOAuthToken();
}

function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(folderName);
}

function uploadVaultFileToDrive(base64Data, filename) {
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const vaultFolder = getOrCreateFolder(rootFolder, "Vault_Shared_Files");
    
    let contentType = 'application/octet-stream';
    let dataStr = base64Data;
    
    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(';');
      contentType = parts[0].split(':')[1];
      dataStr = parts[1].split(',')[1];
    }
    
    const data = Utilities.base64Decode(dataStr);
    const blob = Utilities.newBlob(data, contentType, filename);
    
    const file = vaultFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { 
      success: true, 
      fileId: file.getId(), 
      url: file.getUrl()
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function uploadIDPhotoToDrive(base64) {
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const profileFolder = getOrCreateFolder(rootFolder, "00_Profile");
    
    const contentType = base64.substring(base64.indexOf(":") + 1, base64.indexOf(";"));
    const data = Utilities.base64Decode(base64.split(",")[1]);
    const blob = Utilities.newBlob(data, contentType, `Student_Photo_${new Date().getTime()}`);
    
    const file = profileFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { success: true, fileUrl: `https://drive.google.com/uc?id=${file.getId()}`, id: file.getId() };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function createDriveHierarchy(semesterName, courseName) {
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const semFolder = getOrCreateFolder(rootFolder, semesterName);
    const courseFolder = getOrCreateFolder(semFolder, courseName);
    
    const folders = {
      rootId: courseFolder.getId(),
      lecturesId: getOrCreateFolder(courseFolder, "01_Lectures").getId(),
      assignmentsId: getOrCreateFolder(courseFolder, "02_Assignments").getId(),
      examsId: getOrCreateFolder(courseFolder, "03_Exams").getId(),
      resourcesId: getOrCreateFolder(courseFolder, "04_Resources").getId()
    };
    
    courseFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { success: true, folderUrl: courseFolder.getUrl(), ...folders };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function listDriveFiles(folderId) {
  const cache = CacheService.getScriptCache();
  const cacheKey = `files_${folderId}`;
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = [];
    
    const folderIt = folder.getFolders();
    while (folderIt.hasNext()) {
      const f = folderIt.next();
      files.push({ id: f.getId(), name: f.getName(), isFolder: true, url: f.getUrl() });
    }
    
    const fileIt = folder.getFiles();
    while (fileIt.hasNext()) {
      const f = fileIt.next();
      files.push({ 
        id: f.getId(), name: f.getName(), isFolder: false, 
        url: f.getUrl(), mimeType: f.getMimeType(), size: f.getSize() 
      });
    }

    cache.put(cacheKey, JSON.stringify(files), 30); // 30s TTL
    return files;
  } catch (e) {
    throw new Error(e.toString());
  }
}

function getPickerConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    developerKey: props.getProperty('PICKER_DEVELOPER_KEY'),
    appId: props.getProperty('PICKER_APP_ID')
  };
}

function createAssignmentFolder(parentFolderId, assignmentTitle, type = "Assignment") {
  try {
    const parent = DriveApp.getFolderById(parentFolderId);
    const folder = parent.createFolder(`${type}_${assignmentTitle}`);
    return { success: true, folderId: folder.getId(), folderUrl: folder.getUrl() };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function createOrUpdateAssignmentFolder(course, assignment) {
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    let parentFolder = null;
    
    // 1. Try using course.driveAssignments if valid
    if (course.driveAssignments) {
      try {
        parentFolder = DriveApp.getFolderById(course.driveAssignments);
      } catch(err) {
        console.warn("Invalid course.driveAssignments ID:", course.driveAssignments);
      }
    }
    
    // 2. If parent folder is still not found, try to locate it under ROOT_FOLDER_ID
    if (!parentFolder) {
      const semesterName = course.semesterName || "Unknown Semester";
      const courseName = `${course.code || ''} ${course.nameTh || course.name || ''}`.trim();
      
      const semFolder = getOrCreateFolder(rootFolder, semesterName);
      const courseFolder = getOrCreateFolder(semFolder, courseName);
      
      // Set sharing for course folder
      courseFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      parentFolder = getOrCreateFolder(courseFolder, "02_Assignments");
    }
    
    const folderName = `${assignment.type || 'Assignment'}_${assignment.title}`;
    
    let folder = null;
    // 3. If assignment already has a folderId, rename the existing folder instead of creating a new one!
    if (assignment.folderId) {
      try {
        folder = DriveApp.getFolderById(assignment.folderId);
        folder.setName(folderName);
      } catch(err) {
        console.warn("Could not find existing assignment folder to rename, creating new one instead:", assignment.folderId);
      }
    }
    
    // 4. Create new folder if it doesn't exist yet
    if (!folder) {
      folder = parentFolder.createFolder(folderName);
    }
    
    return { 
      success: true, 
      folderId: folder.getId(), 
      folderUrl: folder.getUrl(),
      parentAssignmentsId: parentFolder.getId(),
      parentCourseId: parentFolder.getParentFolders().hasNext() ? parentFolder.getParentFolders().next().getId() : null
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function deleteAssignmentFolder(folderId) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    folder.setTrashed(true);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * ════════════════════════════════════════════════════════════
 * ACADEMIC SMART NOTIFICATIONS & PDF
 * ════════════════════════════════════════════════════════════
 */

function generateTraceablePDF(data) {
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const reportsFolder = getOrCreateFolder(rootFolder, "00_Reports");
    
    const dataString = JSON.stringify(data);
    const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, dataString)
      .map(function(byte) {
        let hex = (byte & 0xFF).toString(16);
        return (hex.length === 1 ? '0' + hex : hex);
      }).join('');
    
    const html = `
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
          .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { color: #4f46e5; font-size: 24px; font-weight: 700; margin: 0; }
          .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .summary-card { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
          .summary-value { font-size: 32px; font-weight: 700; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f3f4f6; padding: 10px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px; }
          td { padding: 8px; border: 1px solid #e5e7eb; font-size: 11px; }
          .footer { margin-top: 40px; padding: 15px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #6b7280; }
          .signature { font-family: monospace; background: #f8fafc; padding: 8px; border-radius: 4px; border: 1px solid #cbd5e1; word-break: break-all; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">NITIPAT ACADEMIC PERFORMANCE REPORT</h1>
          <div style="text-align: right; font-size: 10px; opacity: 0.7;">Official Digital Document</div>
        </div>
        <div class="student-info">
          <div class="info-box">
            <div style="font-weight: 700; font-size: 12px; color: #6b7280;">STUDENT IDENTITY</div>
            <div style="font-size: 16px; margin-top: 3px;">${data.student.nameTh}</div>
            <div style="font-size: 12px; opacity: 0.8;">${data.student.name}</div>
            <div style="margin-top: 5px; font-weight: 700;">ID: ${data.student.id}</div>
          </div>
          <div class="info-box">
            <div style="font-weight: 700; font-size: 12px; color: #6b7280;">ACADEMIC PROGRAM</div>
            <div style="font-size: 14px; margin-top: 3px;">${data.student.faculty}</div>
            <div style="font-size: 12px;">${data.student.major}</div>
          </div>
        </div>
        <div class="summary-card">
          <div style="font-size: 12px; opacity: 0.9;">Cumulative GPAX</div>
          <div class="summary-value">${data.gpax}</div>
          <div style="font-size: 12px; opacity: 0.9;">Credits: ${data.credits} / ${data.student.totalRequiredCredits}</div>
        </div>
        <h3>COURSE PERFORMANCE HISTORY</h3>
        <table>
          <thead>
            <tr><th>Code</th><th>Course Name</th><th style="text-align:center;">CR</th><th style="text-align:center;">Grade</th></tr>
          </thead>
          <tbody>
            ${Object.values(data.courses).flat().map(c => `
              <tr>
                <td style="font-weight: 700;">${c.code}</td>
                <td>${c.nameTh}</td>
                <td style="text-align: center;">${c.credits}</td>
                <td style="text-align: center; font-weight:700; color:#4f46e5;">${c.grade || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <div>This document is digitally signed and verifiable via NITIPAT MANAGER backend services.</div>
          <div style="margin-top: 10px; font-weight: 700;">SHA-256 DIGITAL TRACEABILITY SIGNATURE:</div>
          <div class="signature">${signature}</div>
          <div style="margin-top: 5px;">TIMESTAMP: ${data.timestamp}</div>
        </div>
      </body>
      </html>
    `;
    
    const blob = HtmlService.createHtmlOutput(html).getAs('application/pdf');
    blob.setName(`NITIPAT_REPORT_${data.student.id}_${new Date().getTime()}.pdf`);
    
    const file = reportsFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { success: true, url: file.getUrl(), id: file.getId() };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function checkAndSendNotifications() {
  const props = PropertiesService.getScriptProperties();
  const logs = JSON.parse(props.getProperty('NOTIF_LOGS') || '{}');

  const now = new Date();
  const timeStr = Utilities.formatDate(now, 'GMT+7', 'HH:mm');
  const [h, m] = timeStr.split(':').map(Number);
  const totalMin = h * 60 + m;
  const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1; 
  const todayKey = Utilities.formatDate(now, 'GMT+7', 'yyyy-MM-dd');

  const fired = (key) => logs[key] === todayKey;
  const mark = (key) => { logs[key] = todayKey; props.setProperty('NOTIF_LOGS', JSON.stringify(logs)); };

  const courses = fetchFirestoreCollection('courses');
  const allCourses = courses.filter(c => !c.isArchived);
  
  allCourses.forEach(c => {
    (c.schedules || []).forEach(s => {
      if (s.day !== dayIdx) return;
      const startMin = s.startHour * 60;
      const diffStart = startMin - totalMin;
      const base = `class_${c.id}_${startMin}_`;

      if (diffStart <= 30 && diffStart > 25 && !fired(base + '30')) {
        sendFcmNotification(`🏫 อีก 30 นาทีเริ่มเรียน`, `${c.nameTh} ห้อง ${c.room || 'N/A'}`);
        mark(base + '30');
      }
      if (diffStart <= 0 && diffStart > -5 && !fired(base + 'start')) {
        sendFcmNotification(`📍 ได้เวลาเรียนแล้ว!`, `อย่าลืมเช็คชื่อวิชา ${c.nameTh}`);
        mark(base + 'start');
      }
    });
  });
}

/**
 * ════════════════════════════════════════════════════════════
 * FIREBASE & UTILS
 * ════════════════════════════════════════════════════════════
 */

function getFcmAccessToken() {
  const props = PropertiesService.getScriptProperties();
  const serviceAccount = JSON.parse(props.getProperty('FCM_SERVICE_ACCOUNT'));
  if (!serviceAccount) return null;

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const base64Encode = (obj) => Utilities.base64EncodeWebSafe(JSON.stringify(obj)).replace(/=+$/, '');
  const payload = base64Encode(header) + '.' + base64Encode(claim);
  const signature = Utilities.computeRsaSha256Signature(payload, serviceAccount.private_key);
  const jwt = payload + '.' + Utilities.base64EncodeWebSafe(signature).replace(/=+$/, '');

  const options = {
    method: 'post',
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', options);
  return JSON.parse(response.getContentText()).access_token;
}

function sendFcmNotification(title, body, data = {}) {
  const props = PropertiesService.getScriptProperties();
  let tokens = JSON.parse(props.getProperty('FCM_TOKENS') || '[]');
  if (tokens.length === 0) return;

  const accessToken = getFcmAccessToken();
  if (!accessToken) return;

  const projectId = 'mat-e-db476';
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  tokens.forEach(token => {
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + accessToken },
      payload: JSON.stringify({
        message: {
          token: token,
          notification: { title: title, body: body },
          data: data,
          webpush: { fcm_options: { link: 'https://nitipat-mgr.vercel.app/' } }
        }
      }),
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch(url, options);
  });
}

function getFirebaseConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    apiKey: props.getProperty('FIREBASE_API_KEY'),
    authDomain: props.getProperty('FIREBASE_AUTH_DOMAIN'),
    projectId: props.getProperty('FIREBASE_PROJECT_ID'),
    storageBucket: props.getProperty('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: props.getProperty('FIREBASE_MESSAGING_SENDER_ID'),
    appId: props.getProperty('FIREBASE_APP_ID')
  };
}

function fetchFirestoreCollection(collectionName) {
  const projectId = 'mat-e-db476';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?pageSize=100`;
  const token = getFcmAccessToken();
  
  try {
    const res = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    const json = JSON.parse(res.getContentText());
    if (!json.documents) return [];
    
    return json.documents.map(doc => {
      const fields = doc.fields;
      const obj = { id: doc.name.split('/').pop() };
      for (let key in fields) {
        obj[key] = parseFirestoreField(fields[key]);
      }
      return obj;
    });
  } catch (e) {
    console.error('Firestore fetch failed:', e);
    return [];
  }
}

function parseFirestoreField(field) {
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  if (field.doubleValue !== undefined) return parseFloat(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.arrayValue !== undefined) {
    return (field.arrayValue.values || []).map(v => parseFirestoreField(v));
  }
  if (field.mapValue !== undefined) {
    const obj = {};
    const fields = field.mapValue.fields || {};
    for (let key in fields) {
      obj[key] = parseFirestoreField(fields[key]);
    }
    return obj;
  }
  if (field.timestampValue !== undefined) return field.timestampValue;
  return null;
}

function syncAcademicData(data) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('ACADEMIC_SUMMARY', JSON.stringify({
    gpa: data.projectedGPA,
    exp: data.dailyExp,
    alarms: data.alarms,
    updatedAt: data.timestamp
  }));
  return { success: true };
}

function getAppConfig() {
  const props = PropertiesService.getScriptProperties();
  return { 
    studentName: "NITIPAT", 
    version: "3.0.0-PRO", 
    pin: props.getProperty('GLOBAL_PIN'),
    features: ["NotionSync", "DrivePicker", "IDCard", "TraceablePDF"] 
  };
}

/**
 * 🎵 AUDIO DATA PROXY
 */
function getAudioDataProxy(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const base64 = Utilities.base64Encode(blob.getBytes());
    const contentType = blob.getContentType();
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    return null;
  }
}

/**
 * 🖼️ FILE DATA PROXY (for Student ID & Photos)
 */
function getFileDataBase64(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const base64 = Utilities.base64Encode(blob.getBytes());
    return { success: true, base64: `data:${blob.getContentType()};base64,${base64}` };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * 📒 SYNC NOTEBOOKS FROM NOTION TO GOOGLE DRIVE
 */
function syncNotebooksWithNotion() {
  const props = PropertiesService.getScriptProperties();
  let notebookDbId = props.getProperty('NOTION_DB_NOTEBOOKS');
  const courseDbId = props.getProperty('NOTION_DB_COURSES');
  
  if (!courseDbId) return { success: false, error: "Notion Courses DB ID not set" };
  
  // Self-Healing Setup Upgrade for existing workspaces!
  if (!notebookDbId) {
    const searchRes = callNotionAPI("search", "POST", {
      filter: { property: "object", value: "database" },
      query: "NITIPAT Notebooks"
    });
    
    if (searchRes.success && searchRes.data.results.length > 0) {
      notebookDbId = searchRes.data.results[0].id;
      props.setProperty('NOTION_DB_NOTEBOOKS', notebookDbId);
    } else {
      const searchParent = callNotionAPI("search", "POST", { filter: { property: "object", value: "page" } });
      if (searchParent.success && searchParent.data.results.length > 0) {
        const parentPageId = searchParent.data.results[0].id;
        const notebookDbPayload = {
          parent: { type: "page_id", page_id: parentPageId },
          title: [{ type: "text", text: { content: "📒 NITIPAT Notebooks" } }],
          properties: {
            "Name": { title: {} },
            "Course": { relation: { database_id: courseDbId, single_property: {} } },
            "Drive URL": { url: {} },
            "AppID": { rich_text: {} }
          }
        };
        const notebookDbRes = callNotionAPI("databases", "POST", notebookDbPayload);
        if (notebookDbRes.success) {
          notebookDbId = notebookDbRes.data.id;
          props.setProperty('NOTION_DB_NOTEBOOKS', notebookDbId);
        }
      }
    }
  }
  
  if (!notebookDbId) return { success: false, error: "Notion Notebooks DB not initialized" };
  
  const res = callNotionAPI(`databases/${notebookDbId}/query`, "POST", {});
  if (!res.success) return res;
  
  const notebooks = res.data.results;
  let syncCount = 0;
  
  for (const nb of notebooks) {
    const nbId = nb.id;
    const name = nb.properties.Name?.title[0]?.plain_text || "Untitled Notebook";
    const driveUrl = nb.properties["Drive URL"]?.url;
    const courseRelation = nb.properties.Course?.relation;
    if (driveUrl) {
      const match = driveUrl.match(/folders\/([a-zA-Z0-9-_]+)/);
      if (match) {
        const folderId = match[1];
        try {
          const folder = DriveApp.getFolderById(folderId);
          if (folder.getName() !== name) {
            folder.setName(name);
            console.log(`Renamed Drive folder for notebook ${name} to match Notion`);
          }
        } catch (e) {
          console.error("Error checking/renaming notebook folder: " + e);
        }
      }
      continue;
    }
    if (!courseRelation || courseRelation.length === 0) continue;
    
    const coursePageId = courseRelation[0].id;
    const courseRes = callNotionAPI(`pages/${coursePageId}`, "GET");
    if (!courseRes.success) continue;
    
    const courseData = courseRes.data;
    const courseDriveUrl = courseData.properties["Drive URL"]?.url;
    
    let courseFolderId = null;
    if (courseDriveUrl) {
      const match = courseDriveUrl.match(/folders\/([a-zA-Z0-9-_]+)/);
      if (match) courseFolderId = match[1];
    }
    
    if (!courseFolderId) continue;
    
    try {
      const parentFolder = DriveApp.getFolderById(courseFolderId);
      
      let notebooksFolder = null;
      const subFolders = parentFolder.getFoldersByName("03_Notebooks");
      if (subFolders.hasNext()) {
        notebooksFolder = subFolders.next();
      } else {
        notebooksFolder = parentFolder.createFolder("03_Notebooks");
      }
      
      const newNotebookFolder = notebooksFolder.createFolder(name);
      const newDriveUrl = newNotebookFolder.getUrl();
      
      callNotionAPI(`pages/${nbId}`, "PATCH", {
        properties: {
          "Drive URL": { url: newDriveUrl }
        }
      });
      
      syncCount++;
    } catch (err) {
      console.error("Error creating notebook folder: " + err);
    }
  }
  
  return { success: true, synced: syncCount };
}

/**
 * 🧹 CLEANUP DUPLICATE SEMESTERS IN NOTION
 * Remaps course relations to a single Master semester page and archives duplicate semester pages.
 */
function cleanupDuplicateSemesters() {
  const props = PropertiesService.getScriptProperties();
  const semDbId = props.getProperty('NOTION_DB_SEMESTERS');
  const courseDbId = props.getProperty('NOTION_DB_COURSES');
  if (!semDbId || !courseDbId) return { success: false, error: "Notion database IDs not configured" };
  
  // 1. Fetch all Semesters from Notion
  const semRes = callNotionAPI(`databases/${semDbId}/query`, "POST", {});
  if (!semRes.success || !semRes.data || !semRes.data.results) return { success: false, error: "Failed to query semesters" };
  
  const semesters = semRes.data.results;
  const semGroup = {}; // name -> array of pages
  
  for (const sem of semesters) {
    const name = sem.properties.Name?.title[0]?.plain_text || "";
    if (!name || name === 'Unknown Semester') continue;
    if (!semGroup[name]) semGroup[name] = [];
    semGroup[name].push(sem);
  }
  
  let mergedCount = 0;
  let deletedCount = 0;
  
  // 2. Fetch all Courses from Notion (so we can remap relations)
  const courseRes = callNotionAPI(`databases/${courseDbId}/query`, "POST", {});
  if (!courseRes.success || !courseRes.data || !courseRes.data.results) return { success: false, error: "Failed to query courses" };
  const courses = courseRes.data.results;
  
  for (const name in semGroup) {
    const list = semGroup[name];
    if (list.length <= 1) continue; // No duplicates for this semester name
    
    // The first one is the Master page
    const masterPage = list[0];
    const masterId = masterPage.id;
    
    // The rest are duplicates that need to be merged and deleted
    const duplicates = list.slice(1);
    const duplicateIds = duplicates.map(d => d.id);
    
    // 3. Find courses linked to any of the duplicate semester IDs and remap them
    for (const course of courses) {
      const courseSemRelation = course.properties.Semester?.relation;
      if (courseSemRelation && courseSemRelation.length > 0) {
        const linkedSemId = courseSemRelation[0].id;
        if (duplicateIds.indexOf(linkedSemId) !== -1) {
          // Remap course relation to Master ID
          callNotionAPI(`pages/${course.id}`, "PATCH", {
            properties: {
              "Semester": { relation: [{ id: masterId }] }
            }
          });
          mergedCount++;
        }
      }
    }
    
    // 4. Archive/Delete the duplicate semesters in Notion
    for (const dup of duplicates) {
      callNotionAPI(`pages/${dup.id}`, "PATCH", {
        archived: true
      });
      deletedCount++;
    }
  }
  
  return { 
    success: true, 
    message: `Deduplicated Semesters successfully! Merged ${mergedCount} course relations, deleted ${deletedCount} duplicate semesters.` 
  };
}

/**
 * 🎓 GOOGLE CALENDAR SYNCHRONIZATION ENGINE
 */
function syncAcademicMilestonesToCalendar(data) {
  try {
    let calendar = null;
    const cals = CalendarApp.getCalendarsByName("🎓 NITIPAT MANAGER");
    if (cals.length > 0) {
      calendar = cals[0];
    } else {
      calendar = CalendarApp.createCalendar("🎓 NITIPAT MANAGER", {
        summary: "ปฏิทินการเรียน สอบ และส่งการบ้าน ซิงค์อัตโนมัติจาก NITIPAT MANAGER"
      });
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 3 months ago
    const endTime = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);  // 6 months ahead
    const existingEvents = calendar.getEvents(startTime, endTime);

    const eventMap = {};
    existingEvents.forEach(evt => {
      const desc = evt.getDescription() || "";
      const match = desc.match(/\[NITIPAT_EVENT_ID:([a-zA-Z0-9-_:]+)\]/);
      if (match) {
        eventMap[match[1]] = evt;
      }
    });

    const seenIds = {};

    // 1. Sync Exams
    const exams = data.exams || [];
    exams.forEach(ex => {
      const uniqueId = `exam_${ex.id}`;
      seenIds[uniqueId] = true;

      const examDateStr = ex.date;
      let startHour = 9, startMin = 0, endHour = 12, endMin = 0;
      if (ex.time && ex.time.includes('-')) {
        const parts = ex.time.split('-');
        const startParts = parts[0].trim().split(':').map(Number);
        const endParts = parts[1].trim().split(':').map(Number);
        if (startParts.length === 2) { startHour = startParts[0]; startMin = startParts[1]; }
        if (endParts.length === 2) { endHour = endParts[0]; endMin = endParts[1]; }
      }

      const start = new Date(examDateStr + 'T' + String(startHour).padStart(2, '0') + ':' + String(startMin).padStart(2, '0') + ':00');
      const end = new Date(examDateStr + 'T' + String(endHour).padStart(2, '0') + ':' + String(endMin).padStart(2, '0') + ':00');

      const title = `📝 สอบ: ${ex.title}`;
      const desc = `📝 สอบวิชา ${ex.title}\n📍 ห้องสอบ: ${ex.room || 'N/A'}\n⏰ เวลา: ${ex.time || 'N/A'}\n[NITIPAT_EVENT_ID:${uniqueId}]`;

      const existing = eventMap[uniqueId];
      if (existing) {
        existing.setTitle(title);
        existing.setDescription(desc);
        existing.setTime(start, end);
        existing.setLocation(ex.room || 'N/A');
      } else {
        calendar.createEvent(title, start, end, {
          description: desc,
          location: ex.room || 'N/A'
        });
      }
    });

    // 2. Sync Assignments
    const assignments = data.assignments || [];
    assignments.forEach(ass => {
      const uniqueId = `assign_${ass.id}`;
      seenIds[uniqueId] = true;

      if (ass.status === 'completed' || ass.status === 'done') {
        return;
      }

      const dueDate = new Date(ass.dueDate);
      if (isNaN(dueDate.getTime())) return;

      const start = new Date(dueDate.getTime() - 60 * 60 * 1000);
      const end = dueDate;

      const title = `🚨 กำหนดส่ง: ${ass.title}`;
      const desc = `🚨 ส่งงาน: ${ass.title}\n📅 ครบกำหนด: ${dueDate.toLocaleString()}\n[NITIPAT_EVENT_ID:${uniqueId}]`;

      const existing = eventMap[uniqueId];
      if (existing) {
        existing.setTitle(title);
        existing.setDescription(desc);
        existing.setTime(start, end);
      } else {
        calendar.createEvent(title, start, end, {
          description: desc
        });
      }
    });

    // 3. Sync Course Schedules (for the current semester - next 16 weeks)
    const courses = data.courses || [];
    courses.forEach(c => {
      if (!c.schedules) return;

      c.schedules.forEach((sch, sIdx) => {
        const uniqueId = `course_${c.id}_${sIdx}`;
        seenIds[uniqueId] = true;

        const dayIdx = sch.day;
        const calDayIndex = dayIdx === 6 ? 0 : dayIdx + 1;

        const existing = eventMap[uniqueId];

        const startDate = new Date();
        const currentDay = startDate.getDay();
        const dayDiff = (calDayIndex + 7 - currentDay) % 7;
        startDate.setDate(startDate.getDate() + dayDiff);
        
        startDate.setHours(sch.startHour || 9, sch.startMin || 0, 0, 0);
        
        const endDate = new Date(startDate.getTime());
        endDate.setHours(sch.endHour || 12, sch.endMin || 0, 0, 0);

        const title = `🏫 เรียน: ${c.code} - ${c.nameTh || c.nameEn}`;
        const desc = `🏫 เรียนวิชา: ${c.nameTh || c.nameEn}\n📍 ห้องเรียน: ${c.room || 'N/A'}\n👤 ผู้สอน: ${c.instructor || 'N/A'}\n[NITIPAT_EVENT_ID:${uniqueId}]`;

        if (existing) {
          existing.setTitle(title);
          existing.setDescription(desc);
          existing.setTime(startDate, endDate);
          existing.setLocation(c.room || 'N/A');
        } else {
          const recurrence = CalendarApp.newRecurrence()
            .addWeeklyRule()
            .times(16);

          calendar.createEventSeries(title, startDate, endDate, recurrence, {
            description: desc,
            location: c.room || 'N/A'
          });
        }
      });
    });

    // 4. Cleanup old events that are not in the current active list
    for (const uniqueId in eventMap) {
      if (!seenIds[uniqueId]) {
        eventMap[uniqueId].deleteEvent();
        console.log(`Deleted deprecated Google Calendar event: ${uniqueId}`);
      }
    }

    return { success: true, message: "ซิงค์ปฏิทิน Google Calendar สำเร็จ!" };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * ════════════════════════════════════════════════════════════
 * IILM (INTEGRATED INTERNSHIP LIFECYCLE MANAGEMENT) BACKEND
 * ════════════════════════════════════════════════════════════
 */

function createILMDriveFolder(folderName) {
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const folder = getOrCreateFolder(rootFolder, folderName || "Internship_2570");
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { success: true, folderId: folder.getId(), folderUrl: folder.getUrl() };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function uploadILMFile(fileData) {
  try {
    const folderId = fileData.folderId || ROOT_FOLDER_ID;
    const folder = DriveApp.getFolderById(folderId);
    
    const base64 = fileData.fileBase64;
    const contentType = fileData.mimeType || base64.substring(base64.indexOf(":") + 1, base64.indexOf(";"));
    const data = Utilities.base64Decode(base64.split(",")[1]);
    const blob = Utilities.newBlob(data, contentType, fileData.filename || ("ILM_File_" + new Date().getTime()));
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { 
      success: true, 
      fileId: file.getId(), 
      fileUrl: file.getUrl(), 
      downloadUrl: "https://drive.google.com/uc?id=" + file.getId() 
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function createILMCalendarEvents(internshipData) {
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    // Internship Summer 2570: April 1, 2027 to May 28, 2027
    const startDay = new Date("2027-04-01");
    const endDay = new Date("2027-05-29"); // inclusive loop
    
    let currentDate = new Date(startDay.getTime());
    let count = 0;
    
    while (currentDate <= endDay) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Monday to Friday
        const start = new Date(currentDate.getTime());
        start.setHours(8, 0, 0, 0);
        const end = new Date(currentDate.getTime());
        end.setHours(17, 0, 0, 0);
        
        const dateKey = currentDate.toISOString().split('T')[0];
        const uniqueId = "ilm_" + dateKey;
        const title = "💼 ฝึกงาน: " + (internshipData.companyName || "บริษัทคู่สัญญา");
        const desc = "💼 บันทึกการฝึกงานประจำวัน\n📍 สถานที่: " + (internshipData.locationName || "โรงงาน/บริษัท") + "\n[NITIPAT_EVENT_ID:" + uniqueId + "]";
        
        // Find existing to avoid duplicates
        const existingEvents = calendar.getEvents(start, end);
        let exists = false;
        for (let i = 0; i < existingEvents.length; i++) {
          if ((existingEvents[i].getDescription() || "").indexOf(uniqueId) !== -1) {
            exists = true;
            break;
          }
        }
        
        if (!exists) {
          calendar.createEvent(title, start, end, {
            description: desc,
            location: internshipData.locationName || ""
          });
          count++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return { success: true, count: count, message: "สร้างตารางฝึกงานสำเร็จ " + count + " วันลงปฏิทิน!" };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function syncILMDailyLogToNotion(logData) {
  try {
    const props = PropertiesService.getScriptProperties();
    let databaseId = props.getProperty('NOTION_DB_ILM_LOGS');
    
    if (!databaseId) {
      const parentPageId = props.getProperty('NOTION_DB_COURSES') || props.getProperty('NOTION_DB_ASSIGNMENTS');
      if (parentPageId) {
        const payload = {
          parent: { type: "page_id", page_id: parentPageId },
          title: [{ type: "text", text: { content: "📝 NITIPAT ILM Daily Logs" } }],
          properties: {
            "Date": { title: {} },
            "Hours": { number: {} },
            "Task Summary": { rich_text: {} },
            "AppLogID": { rich_text: {} }
          }
        };
        const dbRes = callNotionAPI("databases", "POST", payload);
        if (dbRes.success && dbRes.data) {
          databaseId = dbRes.data.id;
          props.setProperty('NOTION_DB_ILM_LOGS', databaseId);
        }
      }
    }
    
    if (!databaseId) return { success: false, error: "Notion ILM Logs Database ID not configured." };
    
    const properties = {
      "Date": { title: [{ text: { content: logData.date } }] },
      "Hours": { number: parseFloat(logData.hours) || 8 },
      "Task Summary": { rich_text: [{ text: { content: logData.task || "" } }] },
      "AppLogID": { rich_text: [{ text: { content: logData.id || "" } }] }
    };
    
    // Check existing
    const searchRes = callNotionAPI("databases/" + databaseId + "/query", "POST", {
      filter: { property: "AppLogID", rich_text: { equals: logData.id } }
    });
    
    if (searchRes.success && searchRes.data && searchRes.data.results && searchRes.data.results.length > 0) {
      const pageId = searchRes.data.results[0].id;
      return callNotionAPI("pages/" + pageId, "PATCH", { properties: properties });
    } else {
      const payload = {
        parent: { database_id: databaseId },
        properties: properties
      };
      return callNotionAPI("pages", "POST", payload);
    }
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}





