// google-api.js
// ══════════════════════════════════════════════════
// Google Drive & Calendar API Manager (Native JS)
// Replaces Google Apps Script (GAS)
// ══════════════════════════════════════════════════

// ใช้ Client ID เดียวกันกับ ui-planner.js
const CLIENT_ID = localStorage.getItem('google_client_id') || '986910230630-09pgqj27lsaevmv21jc2imqf0ia688t7.apps.googleusercontent.com';
const API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';

// Scopes สำหรับ Drive และ Calendar
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events';
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
];

let tokenClient;
let gapiInited = false;
let gisInited = false;
let driveAccessToken = null;

// โหลดระบบ Google API
window.onloadGapi = function() {
  gapi.load('client', initializeGapiClient);
};

async function initializeGapiClient() {
  try {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    });
    gapiInited = true;
    checkAuthReady();
  } catch (e) {
    console.warn("GAPI init failed", e);
  }
}

window.onloadGis = function() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      if (tokenResponse.error !== undefined) {
        throw (tokenResponse);
      }
      driveAccessToken = tokenResponse.access_token;
      showToast('✅ เชื่อมต่อ Google Drive สำเร็จ');
      if (window.onAuthSuccessCallback) {
        window.onAuthSuccessCallback();
        window.onAuthSuccessCallback = null;
      }
    },
  });
  gisInited = true;
  checkAuthReady();
};

function checkAuthReady() {
  if (gapiInited && gisInited) {
    console.log("Google APIs Ready (Native)");
  }
}

// ฟังก์ชันสำหรับบังคับล็อกอินเพื่อขอ Token
function requestDriveAccess(callback) {
  if (!CLIENT_ID) {
    alert("⚠️ ไม่สามารถใช้ Google Drive ได้!\nไม่พบ Client ID กรุณาตั้งค่าก่อน");
    return;
  }
  
  if (driveAccessToken) {
    callback();
    return;
  }
  
  window.onAuthSuccessCallback = callback;
  tokenClient.requestAccessToken({prompt: ''});
}

// ── Native Drive Functions ──

window.NativeGoogleDrive = {
  getAccessToken: () => driveAccessToken,
  
  // จำลองฟังก์ชัน listDriveFiles ของเดิม
  async listDriveFiles(folderId) {
    if (!driveAccessToken) throw new Error("No Drive Access Token");
    try {
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, webViewLink, iconLink)',
        pageSize: 100
      });
      return response.result.files.map(f => ({
        id: f.id,
        name: f.name,
        isFolder: f.mimeType === 'application/vnd.google-apps.folder',
        url: f.webViewLink,
        icon: f.iconLink || (f.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄')
      }));
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // สร้างโฟลเดอร์สำหรับส่งงาน
  async createAssignmentFolder(courseName, assignmentTitle, parentFolderId) {
    if (!driveAccessToken) throw new Error("No Drive Access Token");
    const folderName = `${assignmentTitle} - ${courseName}`;
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : []
    };
    try {
      const res = await gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id, webViewLink'
      });
      return {
        success: true,
        folderId: res.result.id,
        folderUrl: res.result.webViewLink
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  
  // ลบโฟลเดอร์
  async deleteFolder(folderId) {
    if (!driveAccessToken) return;
    try {
      await gapi.client.drive.files.delete({ fileId: folderId });
      return true;
    } catch (e) { return false; }
  }
};
