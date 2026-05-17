import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, where }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

let db, messaging;

/**
 * 🔐 LOGIN GATE CONTROLLER
 */
const LoginGate = {
  el: null,
  statusEl: null,
  pinContainer: null,
  correctPinHash: null,
  inputPin: "",

  async init() {
    this.el = document.getElementById('login-gate');
    this.statusEl = document.getElementById('gate-status');
    this.pinContainer = document.getElementById('pin-container');
    
    this.statusEl.textContent = "ESTABLISHING SECURE CONNECTION...";
    try {
      await this.sync(false);
      this.statusEl.textContent = "IDENTITY VERIFICATION REQUIRED";
      this.renderPinPad();
    } catch (e) {
      console.error(e);
      this.statusEl.textContent = "CONNECTION FAILURE. RETRYING...";
      setTimeout(() => this.init(), 3000);
    }
  },

  async sync(showToastMsg = true) {
    if (showToastMsg) this.statusEl.textContent = "SYNCING SECURITY VAULT...";
    const config = await this.getSecurityConfig();
    this.correctPinSalt = config.pinSalt || 'NITIPAT_SALT_DEFAULT';
    if (config.pin && config.pin.length > 20) {
      this.correctPinHash = config.pin;
    } else {
      this.correctPinHash = await hashPIN(config.pin || "111111", this.correctPinSalt);
    }
    if (showToastMsg) this.statusEl.textContent = "VAULT SYNCED. TRY AGAIN.";
  },

  getSecurityConfig() {
    if (typeof google === 'undefined' || !google.script || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.warn("Using local security fallback");
      return Promise.resolve({ pin: "111111" });
    }
    return new Promise((res, rej) => {
      google.script.run.withSuccessHandler(res).withFailureHandler(rej).getAppConfig();
    });
  },

  renderPinPad() {
    if (this.pinContainer) this.pinContainer.classList.remove('hidden');
    this.pinContainer.innerHTML = `
      <div class="pin-display">
        ${[1, 2, 3, 4, 5, 6].map(i => `<div class="pin-dot" id="dot-${i}"></div>`).join('')}
      </div>
      <div class="pin-pad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="pin-btn" onclick="LoginGate.press('${n}')">${n}</button>`).join('')}
        <button class="pin-btn" onclick="LoginGate.clear()" style="font-size:14px; opacity:0.6;">CLR</button>
        <button class="pin-btn" onclick="LoginGate.press('0')">0</button>
        <button class="pin-btn" onclick="LoginGate.press('DEL')" style="font-size:20px; opacity:0.6;">⌫</button>
      </div>
      <div class="gate-actions" style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
        <button class="btn-glass sm" onclick="LoginGate.sync()"><span style="margin-right:5px;">🔄</span>Sync PIN</button>
        <button class="btn-glass sm" onclick="LoginGate.showIdCard()"><span style="margin-right:5px;">🪪</span>ดูบัตร</button>
      </div>
    `;
  },

  showIdCard() {
    const photo = state.idCardPhoto || "https://img2.pic.in.th/pic/Student_Photo_Placeholder.png";
    const studentId = "20067105527480";
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    overlay.innerHTML = `
      <div class="card-modal">
        <button class="card-close" onclick="this.parentElement.parentElement.remove()">✕</button>
        <div class="card-title">STUDENT IDENTIFICATION</div>
        <div class="card-body">
          <img src="${photo}" class="card-photo" onerror="this.src='https://img2.pic.in.th/pic/Student_Photo_Placeholder.png'">
          <div class="card-info">
            <div class="card-name">${STUDENT.nameTh}</div>
            <div class="card-id">${studentId}</div>
            <div class="card-major">${STUDENT.major}</div>
          </div>
          <div class="barcode-container">
            <svg id="barcode"></svg>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    // Generate Barcode
    setTimeout(() => {
      JsBarcode("#barcode", studentId, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 16,
        font: "JetBrains Mono",
        background: "transparent",
        lineColor: "#000"
      });
    }, 100);
  },

  press(val) {
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
    if (val === 'DEL') {
      this.inputPin = this.inputPin.slice(0, -1);
    } else if (this.inputPin.length < 6) {
      this.inputPin += val;
    }
    this.updateDots();
    if (this.inputPin.length === 6) this.verify();
  },

  updateDots() {
    for (let i = 1; i <= 6; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (dot) {
        if (i <= this.inputPin.length) dot.classList.add('active');
        else dot.classList.remove('active');
      }
    }
  },

  clear() {
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
    this.inputPin = "";
    this.updateDots();
  },

  async verify() {
    const activeHash = state.pin || this.correctPinHash;
    const activeSalt = state.pinSalt || this.correctPinSalt || 'NITIPAT_SALT_DEFAULT';

    const isValid = await verifyPIN(this.inputPin, activeHash, activeSalt);
    if (isValid) {
      this.statusEl.textContent = "ACCESS GRANTED. SYNCING DATA...";
      sessionStorage.setItem('unlocked', 'true');
      sessionStorage.setItem('unlocked_at', Date.now().toString());
      state.isLocked = false;
      this.el.classList.add('inactive');
      await startAppCore();
    } else {
      // Problem 5: Auto-sync once on failure
      this.statusEl.textContent = "VERIFYING WITH REMOTE VAULT...";
      await this.sync(false);
      const activeHashRetry = state.pin || this.correctPinHash;
      const activeSaltRetry = state.pinSalt || this.correctPinSalt || 'NITIPAT_SALT_DEFAULT';
      
      const isValidRetry = await verifyPIN(this.inputPin, activeHashRetry, activeSaltRetry);
      
      if (isValidRetry) {
        this.verify(); // Success after sync
        return;
      }

      this.statusEl.textContent = "INCORRECT PIN. ACCESS DENIED.";
      this.inputPin = "";
      this.updateDots();
      this.pinContainer.style.animation = 'none';
      this.pinContainer.offsetHeight;
      this.pinContainer.style.animation = 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both';
      if (window.navigator.vibrate) window.navigator.vibrate(200);
    }
  }
};

window.LoginGate = LoginGate;

// Entry point unified into DOMContentLoaded

async function startAppCore() {
  try {
    let firebaseConfig;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.warn("Using local mock Firebase config");
      firebaseConfig = {
        apiKey: "LOCAL_MOCK_KEY",
        authDomain: "local-mock.firebaseapp.com",
        projectId: "local-mock",
        storageBucket: "local-mock.appspot.com",
        messagingSenderId: "123456",
        appId: "1:123456:web:123456"
      };
    } else {
      firebaseConfig = await new Promise((res, rej) => {
        google.script.run.withSuccessHandler(res).withFailureHandler(rej).getFirebaseConfig();
      });
    }

    if (!firebaseConfig.apiKey) {
      console.error("Firebase API Key is missing.");
      return;
    }

    const app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      experimentalForceLongPolling: true
    });

    messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.image || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
      });
    });

    await loadAll();
    startHyperNotifications();
    scheduleAllNotifications();
    
    // Notion Initial Sync
    setTimeout(() => NotionHub.sync(), 2000);
    if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
      initWebPush();
    }
    render();
  } catch (err) {
    console.error("App initialization failed:", err);
  }
}

// ═════════// COURSE DATABASE — วิชาทั้งหมดในหลักสูตร 137 หน่วยกิต (Loaded dynamically from courses_db.json)
// ══════════════════════════════════════════════════
let COURSE_DB = { general: [], science: [], engineering_basic: [], core: [], elective: [] };
let ALL_COURSES = [];

async function loadCourseDatabase() {
  try {
    const res = await fetch('./courses_db.json');
    if (res.ok) {
      const data = await res.json();
      COURSE_DB = data;
      ALL_COURSES = [
        ...COURSE_DB.general,
        ...COURSE_DB.science,
        ...COURSE_DB.engineering_basic,
        ...COURSE_DB.core,
        ...COURSE_DB.elective
      ];
    }
  } catch (e) {
    console.error("Failed to load courses_db.json:", e);
  }
}

// ══════════════════════════════════════════════════
// ACADEMIC CALENDAR 2568-2569 (embedded)
// ══════════════════════════════════════════════════
const ACADEMIC_CALENDAR = {
  "2568_1": {
    name: "ภาคต้น 2568", year: 2568, term: 1,
    start: "2025-06-23", end: "2025-11-02",
    midterm_start: "2025-08-09", midterm_end: "2025-08-17",
    final_start: "2025-10-19", final_end: "2025-10-31",
    reg_start: "2025-06-02", reg_end: "2025-06-13",
    reg_date_67: "2025-06-19",
    add_drop_end: "2025-07-21",
    withdraw_w_start: "2025-07-22", withdraw_w_end: "2025-08-20",
    fee_start: "2025-06-02", fee_end: "2025-06-15"
  },
  "2568_2": {
    name: "ภาคปลาย 2568", year: 2568, term: 2,
    start: "2025-11-24", end: "2026-03-29",
    midterm_start: "2026-01-10", midterm_end: "2026-01-18",
    final_start: "2026-03-15", final_end: "2026-03-27",
    reg_start: "2025-11-03", reg_end: "2025-11-14",
    reg_date_67: "2025-11-20",
    add_drop_end: "2025-12-22",
    withdraw_w_start: "2025-12-23", withdraw_w_end: "2026-01-21",
    fee_start: "2025-11-03", fee_end: "2025-11-16"
  },
  "2568_s": {
    name: "ภาคฤดูร้อน 2568", year: 2568, term: 3,
    start: "2026-04-20", end: "2026-06-01",
    midterm_start: null, midterm_end: null,
    final_start: "2026-05-30", final_end: "2026-06-01"
  },
  "2569_1": {
    name: "ภาคต้น 2569", year: 2569, term: 1,
    start: "2026-06-22", end: "2026-11-02",
    midterm_start: "2026-08-15", midterm_end: "2026-08-23",
    final_start: "2026-10-19", final_end: "2026-10-30",
    reg_start: "2026-05-25", reg_end: "2026-06-12",
    reg_date_67: "2026-06-17",
    add_drop_end: "2026-07-21",
    withdraw_w_start: "2026-07-22", withdraw_w_end: "2026-08-20"
  }
};

// ══════════════════════════════════════════════════
// STUDENT DATA (ดึงจาก transcript)
// ══════════════════════════════════════════════════
const STUDENT = {
  id: "20067105527480",
  name: "Mr. Nitipat TIPCHAI",
  nameTh: "นิติพัฒน์ ทิพย์ชัย",
  faculty: "Engineering",
  major: "Materials Engineering",
  degree: "B.Eng. (Materials Engineering)",
  dob: "March 22, 2006",
  admitted: "June 24, 2024",
  code: "67", 
  totalRequiredCredits: 137,
  existingGrades: {
    "01208111": { grade: "D", credits: 3 }, "01355101": { grade: "P", credits: 3 },
    "01355102": { grade: "D+", credits: 3 }, "01371111": { grade: "A", credits: 1 },
    "01417167": { grade: "F", credits: 3 }, "01420111": { grade: "W", credits: 3 },
    "01420113": { grade: "B+", credits: 1 }, "01999021": { grade: "B", credits: 3 },
    "01999023": { grade: "A", credits: 2 }, "01999111": { grade: "A", credits: 2 },
    "01200101": { grade: "A", credits: 3 }, "01204111": { grade: "F", credits: 3 },
    "01213211": { grade: "D", credits: 3 }, "01385223": { grade: "A", credits: 3 },
    "01403114": { grade: "C+", credits: 1 }, "01403117": { grade: "W", credits: 3 },
    "01417167b": { grade: "W", credits: 3 }, "01420111b": { grade: "F", credits: 3 },
    "01385261": { grade: "A", credits: 3 }, "01387101": { grade: "B+", credits: 3 },
    "01417167c": { grade: "D", credits: 3 },
    "01208221": { grade: "W", credits: 3 }, "01213212": { grade: "D", credits: 4 },
    "01213213": { grade: "D+", credits: 4 }, "01213214": { grade: "A", credits: 1 },
    "01213216": { grade: "D", credits: 4 }, "01208281": { grade: "A", credits: 1 },
    "01213217": { grade: "W", credits: 3 }, "01213218": { grade: "C", credits: 3 },
    "01213219": { grade: "A", credits: 1 }, "01420111c": { grade: "C+", credits: 3 },
    "01403117b": { grade: "N", credits: 3 },
    "01205201": { grade: "D+", credits: 3 }, "01417168": { grade: "D", credits: 3 },
    "01355103": { grade: "D", credits: 3 }
  },
  photoUrl: localStorage.getItem('student_photo') || "https://img2.pic.in.th/pic/Student_Photo_Placeholder.png"
};

// ══════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════
let state = {
  view: 'dashboard',
  isLocked: sessionStorage.getItem('unlocked') !== 'true',
  pin: null,
  pinSalt: 'NITIPAT_SALT_DEFAULT',
  semesters: [], courses: {}, assignments: {}, exams: {}, grades: {},
  habits: [], expenses: [], sleep: [], moods: [], notes: [],
  clubTasks: JSON.parse(localStorage.getItem('clubTasks') || '[]'),
  focusSessions: JSON.parse(localStorage.getItem('focusSessions') || '[]'),
  focusActive: false, focusEndTime: null, focusTimer: null,
  pomodoroWork: parseInt(localStorage.getItem('pomodoroWork') || '25'),
  pomodoroBreak: parseInt(localStorage.getItem('pomodoroBreak') || '5'),
  pomodoroActive: false, pomodoroEndTime: null, pomodoroTimer: null, pomodoroPhase: 'work',
  pomodoroCount: 0,

  // MoneyPod State
  moneyWallets: JSON.parse(localStorage.getItem('moneyWallets') || '[{"id":"cash","name":"เงินสด 💵","type":"cash","balance":1500},{"id":"bank","name":"บัญชีธนาคาร 🏦","type":"bank","balance":8500},{"id":"savings","name":"กระปุกออมเงิน 🐷","type":"savings","balance":5000},{"id":"spaylater","name":"SPayLater 🛍️","type":"debt","balance":0,"limit":15000},{"id":"seasycash","name":"SEasyCash 💸","type":"debt","balance":0,"limit":20000}]'),
  moneyTransactions: JSON.parse(localStorage.getItem('moneyTransactions') || '[]'),
  moneyBudgets: JSON.parse(localStorage.getItem('moneyBudgets') || '{"food":5000,"shopping":3000,"travel":2000}'),
  moneyGoals: JSON.parse(localStorage.getItem('moneyGoals') || '[{"id":"g1","name":"เที่ยวญี่ปุ่น 🇯🇵","target":45000,"saved":5000},{"id":"g2","name":"ซื้อ iPad Pro 📱","target":32000,"saved":8000}]'),
  moneyInstallments: JSON.parse(localStorage.getItem('moneyInstallments') || '[]'),
  moneyTheme: localStorage.getItem('moneyTheme') || 'theme-mint',
  moneyDailyBudget: parseFloat(localStorage.getItem('moneyDailyBudget') || '300'),

  modal: null,
  selectedSemester: null,
  darkMode: localStorage.getItem('darkMode') === 'true',
  focusBlacklist: JSON.parse(localStorage.getItem('focusBlacklist') || '["youtube.com","facebook.com","instagram.com","twitter.com","tiktok.com","netflix.com"]'),
  searchQuery: '',
  tree: JSON.parse(localStorage.getItem('focusTree') || '{"level":0,"alive":true,"sessions":0}'),
  badges: JSON.parse(localStorage.getItem('badges') || '[]'),
  totalFocusHours: parseFloat(localStorage.getItem('totalFocusHours') || '0'),
  focusScore: parseInt(localStorage.getItem('focusScore') || '100'),
  selectedFocusCourseId: null,
  isImmersiveFocus: false,
  quickLinks: JSON.parse(localStorage.getItem('quickLinks') || '[{"name":"MyKU","url":"https://my.ku.th","icon":"🎓"},{"name":"ทะเบียน","url":"https://stdregis.ku.ac.th","icon":"📋"},{"name":"Maps","url":"https://www.google.com/maps?q=kasetsart+university","icon":"🗺"}]'),
  profilePic: localStorage.getItem('profile_pic') || null,
  idCard: JSON.parse(localStorage.getItem('id_card_config') || `{
        "color": "#e0f2fe",
        "name": "${STUDENT.nameTh}",
        "studentId": "20067105527480",
        "major": "Materials Engineering",
        "birthday": "22-03-2006",
        "logoType": "SSC"
      }`),
  attendanceReasons: JSON.parse(localStorage.getItem('att_reasons') || '{}'),
  reflections: JSON.parse(localStorage.getItem('reflections') || '{}'),
  calendarSettings: JSON.parse(localStorage.getItem('calendar_settings') || '{}'),
  courseStructures: JSON.parse(localStorage.getItem('course_structures') || '{}'),
  targetGPA: parseFloat(localStorage.getItem('target_gpax') || '2.00'),
  isReflectionMandatory: true,
  lastReflectionCheck: null,
  driveBreadcrumbs: [],
  courseFiles: {},
  courseFilesCache: {},
  driveViewMode: localStorage.getItem('drive_view_mode') || 'grid',
  drivePickerConfig: null,
  topicMastery: JSON.parse(localStorage.getItem('topic_mastery') || '{}'),
  attendanceHistory: JSON.parse(localStorage.getItem('attendance_history') || '{}'),
  pomodoroTimeRemaining: 0,
  customMusicUrls: JSON.parse(localStorage.getItem('custom_music_urls') || '[]'),
  courseFocusStats: JSON.parse(localStorage.getItem('course_focus_stats') || '{}'),
  lastScoreReset: localStorage.getItem('last_score_reset') || '',
  deviceId: Math.random().toString(36).substring(7),
  activeCourseId: null,
  currentFolderId: null,
  selectedItems: new Set(),
  isRenaming: null,
  links: JSON.parse(localStorage.getItem('course_links') || '{}'), // courseId -> [{name, url}]
  alarms: JSON.parse(localStorage.getItem('alarms') || '[]'),
  sleepMode: false,
  notifiedEvents: new Set(),
  hyperNotifInterval: null,
  hyperSyncInterval: null,
  hyperAlarmInterval: null,
  assignmentNagInterval: null,
  notificationTimeouts: [],
  notificationsGranted: Notification.permission === 'granted',
  notionConnected: false,
  notionSyncing: false,
  lastNotionSync: localStorage.getItem('last_notion_sync') || null,
  notionBotName: localStorage.getItem('notion_bot_name') || null,
  alarmRinging: false,
  currentAlarmId: null,
  wakeLock: null,
  sleepClockInterval: null,
  alarmSoundInterval: null,
  alarmVibrateInterval: null,
  alarmAudioCtx: null,
  idCardPhoto: localStorage.getItem('id_card_photo') || null
};

const FOCUS_PRESETS = [
  { name: 'Pomodoro', work: 25, break: 5, icon: '🍅' },
  { name: 'Deep Work', work: 50, break: 10, icon: '⚡' },
  { name: 'Long Focus', work: 90, break: 15, icon: '🧘' }
];

/**
 * 📀 MGR Audio Database (Google Drive IDs)
 */
const MGR_AUDIO_DATABASE = {
  morning: ["1x1umD0OX2uFJukPKgvi1O5K1mE0Zb2zN", "180L3lpxTNrVgFsGIprEbqUSc8kurKvFJ", "1Pk1nw_e276Vx3xy5fvHIMi7Gp1D80284", "1Pf_y2W6MOPk2Ky-jyuHIX6g20HOhYSji", "1_8hQVqoAdDTEoJ8PDgf7Dzue81INnX3n", "1yH8t3UBrp2_OVI8LDoD5nrEwcTfMDQQk", "1FBQKNJ19589rh68ojFwL92Azv3PWf4Jb"],
  afternoon: ["1loLOrzrzQNKvwPdy7wBNG1Pax3CYeD52", "1bjKsBuL0o-MMFq3bPqy13OaD6laF8dE7", "1636AP2tsWZlhbFEfq8LfszsRwotQUzOR", "1nrGZavcWfGhAx8fep12teR7b1qqmssii", "1oQowQgQiBCTIFs4hvop8bb4s4Z1i-h6k", "1EBoajtvqdzC8grasBUb0_zzQB0CSpCK3", "1pbxKmKdl_N5n7VIZcx0MUrG7LValmBaq"],
  night: ["1xUNr9oz0vRg2YT_sB7NJQBsiEEaOMfm1", "1LKykxZWMiuJ7nAHKwfaNjmk_KNRTzLAJ", "1A5SePiU0snXti4tRWSDZ_qx_71xru3Yw", "1XgnxOjTM4KRXHN44d_4x_cE9N1BNhxbZ", "1xD1pWpM9arPPYetVFRbEfluCt4GwRG8v", "14xeeWwXY0F288XqGlcFAXBzvsvhel8Dd", "1D9SGkMoMKebFJqvKjnGIpB3hkAlQZkwp", "1CdbgKRLfMW30EIg_LSeQCKH4JMdxqwiA"],
  start: ["11vII4lmTi1UBYg14iuWxV_okY1lFHzjg", "1aZGx5bgFf6rWAg1rYp4bV-Eq2j_EtFIA", "11d8ADTh7_eA72k964h_gkQYccXvQh47c"],
  pause: ["1LPFV4giMm4VGdrlDNH6yH6qBQMZ1n_Sw", "1FYMWoUyyXQPEqQEjYFvMupBYso1tms7x"],
  complete: ["1PR4T7FayCGKHdGL3OpFhFYl__T7vHCku", "1j9OysfFjZPMyOvDFGtqGXKSGsJ0zar_U", "1Io5uQTcnkgrtd-kS2KQnnp5Vn8jIXo3u"],
  lofi: ["https://www.dropbox.com/scl/fi/0rge299tcx5tuz0t1jesx/Ytmp3.gg_YouTube_45-Minute-Timer-Lofi_Media_rGXWHmb9vEQ_009_128k.mp3?rlkey=5xt97s6fmild8ellrnoz6s0ak&st=4g3864q0&dl=1"],
  groove: ["https://www.dropbox.com/scl/fi/m9wfjxbog3mqub56lbuzg/GROOVE-POP-laid-back-Vol.13-A-Groove-That-Lifts-Your-Mood-grgr_playlist-128k.mp3?rlkey=5rfmqtievcm60vzyezgstxd2c&st=j94ekyh8&dl=1"]
};

class RadioController {
  constructor() {
    this.musicAudio = new Audio();
    this.djAudio = new Audio();
    this.triggerAudio = new Audio();
    this.playedTracks = new Set();
    this.audioCache = {};
    this.interruptionTimer = null;
    this.musicTrackCount = 0;
    this.mode = 'lofi';
    this.isPlaying = false; // Flag ตรวจสอบสถานะการเล่นจริง

    this.musicAudio.volume = 0.6;
    this.djAudio.volume = 0.8;
    this.triggerAudio.volume = 0.9;

    this.musicAudio.onended = () => {
      if (!this.isPlaying) return;
      this.musicTrackCount++;
      if (this.musicTrackCount >= 2) {
        this.musicTrackCount = 0;
        this.playDJInterrupt();
      } else {
        this.playMusic();
      }
    };

    // Pre-create some context to help mobile
    this.silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFWm51bQAAAAADAAEAgD4AAIA+AAABAAgAZGF0YQAAAAA=');
  }

  async warmUp() {
    console.log("🔊 DJ Brain: Warming up audio context...");
    try {
      const warm = async (a) => { a.play().then(() => a.pause()).catch(() => { }); };
      await warm(this.musicAudio);
      await warm(this.djAudio);
      await warm(this.triggerAudio);
      await warm(this.silentAudio);
    } catch (e) { console.warn("Warmup failed", e); }
  }

  async init() {
    console.log("🎙️ DJ Brain: Pre-caching critical sounds...");
    const criticalCategories = ['start', 'pause', 'complete'];
    for (const cat of criticalCategories) {
      this.preCacheCategory(cat);
    }
    // 2. โหลดเสียงดีเจตามช่วงเวลาปัจจุบัน
    const h = new Date().getHours();
    let currentDJ = 'night';
    if (h >= 6 && h < 12) currentDJ = 'morning';
    else if (h >= 12 && h < 18) currentDJ = 'afternoon';
    this.preCacheCategory(currentDJ);
  }

  async preCacheCategory(category) {
    const ids = MGR_AUDIO_DATABASE[category];
    if (!ids) return;
    for (const id of ids) {
      if (!this.audioCache[id]) {
        this.loadAudioSource(id).then(dataUri => {
          if (dataUri) this.audioCache[id] = dataUri;
        });
      }
    }
  }

  async loadAudioSource(id) {
    // ถ้าเป็น URL ตรงๆ (เช่น Dropbox) ให้ส่งกลับไปเลย ไม่ต้องผ่าน Proxy
    if (id.startsWith('http')) return id;

    if (this.audioCache[id]) return this.audioCache[id];
    return new Promise((resolve) => {
      google.script.run
        .withSuccessHandler(dataUri => {
          if (!dataUri) {
            console.warn("⚠️ ไฟล์ใหญ่อาจเกิน 50MB (Proxy ล้มเหลว) ลองใช้ Direct URL แทน:", id);
            resolve(`https://drive.google.com/uc?export=download&id=${id}`);
          } else {
            resolve(dataUri);
          }
        })
        .withFailureHandler(err => {
          console.warn("⚠️ Proxy Error:", err);
          resolve(`https://drive.google.com/uc?export=download&id=${id}`);
        })
        .getAudioDataProxy(id);
    });
  }

  pickRandomId(category) {
    let ids = MGR_AUDIO_DATABASE[category];
    if (category === 'lofi' || category === 'groove') {
      // Inject custom URLs
      ids = [...ids, ...(state.customMusicUrls || [])];
    }
    if (!ids || ids.length === 0) return null;
    const available = ids.filter(id => !this.playedTracks.has(id));
    if (available.length === 0) {
      ids.forEach(id => this.playedTracks.delete(id));
      return this.pickRandomId(category);
    }
    const id = available[Math.floor(Math.random() * available.length)];
    this.playedTracks.add(id);
    return id;
  }

  async fadeVolume(audio, target, duration = 1500) {
    const startVol = audio.volume;
    const steps = 30;
    const interval = duration / steps;
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, interval));
      audio.volume = startVol + (target - startVol) * (i / steps);
    }
    audio.volume = target;
  }

  async playMusic() {
    if (!this.isPlaying) return;
    const id = this.pickRandomId(this.mode);
    if (id) {
      const dataUri = await this.loadAudioSource(id);
      if (dataUri && this.isPlaying) {
        this.musicAudio.src = dataUri;
        this.musicAudio.play().then(() => {
          this.resetInterruptionTimer();
        }).catch(e => {
          console.error("❌ Music Playback Error (ข้ามไปเพลงถัดไป):", e);
          // ข้ามไปเล่นเพลงถัดไปถ้าเล่นไม่ได้ (เช่นติด CSP หรือไฟล์พัง)
          setTimeout(() => this.playMusic(), 1000);
        });
      } else if (!dataUri && this.isPlaying) {
        setTimeout(() => this.playMusic(), 1000);
      }
    }
  }

  resetInterruptionTimer() {
    if (this.interruptionTimer) clearTimeout(this.interruptionTimer);
    if (!this.isPlaying) return;
    const delay = (15 + Math.random() * 5) * 60 * 1000;
    this.interruptionTimer = setTimeout(() => this.playDJInterrupt(), delay);
  }

  async playDJInterrupt() {
    if (!this.isPlaying) return;
    const h = new Date().getHours();
    let cat = 'night';
    if (h >= 6 && h < 12) cat = 'morning';
    else if (h >= 12 && h < 18) cat = 'afternoon';

    const id = this.pickRandomId(cat);
    if (!id) return this.playMusic();

    const dataUri = await this.loadAudioSource(id);
    if (!dataUri || !this.isPlaying) {
      if (this.isPlaying && this.musicAudio.paused) this.playMusic();
      return;
    }

    await this.fadeVolume(this.musicAudio, 0.1, 1500);
    if (!this.isPlaying) return;
    this.djAudio.src = dataUri;
    this.djAudio.play().catch(e => {
      console.error("❌ DJ Playback Error:", e);
      this.fadeVolume(this.musicAudio, 0.6, 1000);
      this.resetInterruptionTimer();
    });
    this.djAudio.onended = async () => {
      if (!this.isPlaying) return;
      await this.fadeVolume(this.musicAudio, 0.6, 2000);
      if (this.musicAudio.paused && this.isPlaying) this.playMusic();
      else this.resetInterruptionTimer();
    };
  }

  async playTrigger(type) {
    const id = this.pickRandomId(type);
    if (id) {
      const dataUri = await this.loadAudioSource(id);
      if (dataUri) {
        this.triggerAudio.src = dataUri;
        this.triggerAudio.play().catch(() => { });
      }
    }
  }

  onPomodoroStart() {
    this.isPlaying = true;
    this.stopAll(false);
    this.playTrigger('start').then(() => {
      this.triggerAudio.onended = () => {
        if (this.isPlaying) this.playMusic();
      }
    });
  }

  async onPomodoroPause() {
    this.isPlaying = false;
    if (this.interruptionTimer) clearTimeout(this.interruptionTimer);
    await this.fadeVolume(this.musicAudio, 0, 1000);
    this.musicAudio.pause();
    this.playTrigger('pause');
  }

  onResume() {
    this.isPlaying = true;
    if (this.musicAudio.src) {
      this.musicAudio.volume = 0.6;
      this.musicAudio.play().catch(() => this.playMusic());
      this.resetInterruptionTimer();
    } else {
      this.playMusic();
    }
  }

  onPomodoroComplete() {
    this.isPlaying = false;
    this.stopAll();
    this.playTrigger('complete');
  }

  stopAll(resetIsPlaying = true) {
    if (resetIsPlaying) this.isPlaying = false;
    this.musicAudio.pause();
    this.djAudio.pause();
    this.triggerAudio.pause();
    this.silentAudio.pause();
    if (this.interruptionTimer) clearTimeout(this.interruptionTimer);
  }
}

const Radio = new RadioController();

// ══════════════════════════════════════════════════
// ADVANCED LOGIC: GEOLOCATION & HAVERSINE
// ══════════════════════════════════════════════════
// ══════════════════════════════════════════════════


// ══════════════════════════════════════════════════
// 📝 NOTION SYNC ENGINE (2-WAY)
// ══════════════════════════════════════════════════
const NotionSync = {
  async syncAll() {
    showToast("Syncing with Notion...", "wait");
    try {
      // Step 1: Sync Assignments
      const allAssign = Object.values(state.assignments).flat();
      for (const a of allAssign) {
        if (a.needsSync) {
          await this.syncAssignment(a);
        }
      }
      showToast("Notion Sync Complete", "ok");
    } catch (e) {
      console.error("Notion Sync Failed:", e);
      showToast("Notion Sync Failed", "err");
    }
  },

  async syncAssignment(assignment) {
    return new Promise((res, rej) => {
      google.script.run
        .withSuccessHandler(res)
        .withFailureHandler(rej)
        .syncAssignmentToNotion(assignment);
    });
  }
};

window.NotionSync = NotionSync;

// ══════════════════════════════════════════════════
// 📍 GPS & CHECK-IN MANAGER
// ══════════════════════════════════════════════════
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const GPSManager = {
  hasCheckedInToday(courseId) {
    const history = state.attendanceHistory[courseId] || [];
    if (history.length === 0) return false;
    const today = new Date().toDateString();
    return history.some(record => new Date(record.timestamp).toDateString() === today);
  },

  async checkInSuggestion() {
    const curClass = this.getCurrentClass();
    if (!curClass) return;

    if (this.hasCheckedInToday(curClass.id)) return;

    try {
      const coords = await this.getCurrentPosition();
      let targetLat = 14.065, targetLng = 100.606; // Default KU
      if (curClass.targetCoords) {
        const [lat, lng] = curClass.targetCoords.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          targetLat = lat;
          targetLng = lng;
        }
      }
      const distance = getDistance(coords.lat, coords.lng, targetLat, targetLng);

      if (distance <= 200) { // 200m
        this.showCheckInPrompt(curClass, true);
      } else {
        this.showCheckInPrompt(curClass, false); // Suggest Online
      }
    } catch (e) {
      console.warn("Could not retrieve geolocation: ", e);
    }
  },

  getCurrentClass() {
    const now = new Date();
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const h = now.getHours();
    const all = Object.values(state.courses).flat();
    return all.find(c => (c.schedules || []).some(s => s.day === day && s.startHour <= h && (s.endHour || s.startHour + 3) > h));
  },

  getCurrentPosition() {
    return new Promise((res, rej) => {
      navigator.geolocation.getCurrentPosition(
        p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        e => rej(e),
        { enableHighAccuracy: true }
      );
    });
  },

  showCheckInPrompt(course, isNearby) {
    openModal("Check-in Suggestion", `
      <div style="text-align:center;">
        <div style="font-size:40px; margin-bottom:15px;">📍</div>
        <p>คุณกำลังเรียนวิชา <strong>${course.nameTh}</strong> หรือไม่?</p>
        <p style="font-size:12px; color:var(--c-muted);">${isNearby ? "ตรวจพบว่าคุณอยู่ที่ห้องเรียน" : "คุณอยู่นอกพื้นที่ห้องเรียน (เรียนออนไลน์?)"}</p>
      </div>
    `, `
      <button class="nb-btn" onclick="GPSManager.confirmCheckIn('${course.id}', '${isNearby ? 'On-site' : 'Online'}')">ยืนยันเช็คชื่อ</button>
      <button class="nb-btn-danger" onclick="closeModal()">ไม่เรียน / ข้าม</button>
    `);
  },

  confirmCheckIn(courseId, mode) {
    const now = new Date().toISOString();
    if (!state.attendanceHistory[courseId]) state.attendanceHistory[courseId] = [];
    state.attendanceHistory[courseId].push({ timestamp: now, mode: mode });
    localStorage.setItem('attendance_history', JSON.stringify(state.attendanceHistory));
    showToast(`เช็คชื่อ ${mode} สำเร็จ!`, "ok");
    closeModal();
    render();
  }
};

window.GPSManager = GPSManager;

function suggestGradesForTarget(targetGPA) {
  const allPast = [];
  state.semesters.forEach(s => {
    (state.courses[s.id] || []).forEach(c => {
      if (c.grade && GRADE_PTS[c.grade] !== null) allPast.push(c);
    });
  });

  const curSem = getCurrentSemester();
  if (!curSem) return { error: 'ไม่มีเทอมปัจจุบัน' };
  const currentCourses = (state.courses[curSem.id] || []).filter(c => !c.grade);
  if (currentCourses.length === 0) return { error: 'ไม่มีวิชาที่กำลังเรียน' };

  let pastPts = 0, pastCr = 0;
  allPast.forEach(c => { pastPts += GRADE_PTS[c.grade] * c.credits; pastCr += c.credits; });

  const currentTotalCr = currentCourses.reduce((sum, c) => sum + c.credits, 0);
  const totalCr = pastCr + currentTotalCr;
  const neededTotalPts = targetGPA * totalCr;
  const neededCurPts = neededTotalPts - pastPts;

  const targetAvg = neededCurPts / currentTotalCr;
  if (targetAvg > 4) return { error: 'เป้าหมายสูงเกินความเป็นไปได้ (ต้องการเกรดเฉลี่ย > 4.00)' };

  // Simple heuristic: suggest grades
  const grades = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D'];
  let suggestion = [];
  currentCourses.forEach(c => {
    let best = 'F';
    for (let g of grades) { if (GRADE_PTS[g] >= targetAvg) best = g; }
    suggestion.push({ code: c.code, suggest: best });
  });
  return { avg: targetAvg.toFixed(2), suggestion };
}

// ══════════════════════════════════════════════════
// ADVANCED LOGIC: SOS ANALYZER
// ══════════════════════════════════════════════════
function analyzeSOS(courseId) {
  const all = [];
  let targetCourse = null;
  state.semesters.forEach(s => {
    (state.courses[s.id] || []).forEach(c => {
      if (c.id === courseId) targetCourse = c;
      if (c.grade && GRADE_PTS[c.grade] !== null) all.push(c);
    });
  });

  if (!targetCourse) return null;

  const currentGPA = parseFloat(calcGPAFromList(all));

  // Option 1: Keep and get D/F
  const withD = [...all, { ...targetCourse, grade: 'D' }];
  const withF = [...all, { ...targetCourse, grade: 'F' }];
  const gpaD = calcGPAFromList(withD);
  const gpaF = calcGPAFromList(withF);

  // Option 2: Withdraw (W)
  const gpaW = currentGPA; // W doesn't affect GPA

  return {
    current: currentGPA,
    ifD: gpaD,
    ifF: gpaF,
    ifW: gpaW,
    recommend: (gpaF < 2.0 && gpaW >= 2.0) ? 'ถอน (Withdraw) เพื่อรักษา GPAX' : 'สู้ต่อ (Keep Fighting)'
  };
}

// ══════════════════════════════════════════════════
// GRADE UTILS
// ══════════════════════════════════════════════════
const GRADE_PTS = { A: 4, 'B+': 3.5, B: 3, 'C+': 2.5, C: 2, 'D+': 1.5, D: 1, F: 0, W: null, 'W-Late': null, N: null, I: null, P: null };
const GRADE_COLORS = {
  A: '#84cc16', 'B+': '#84cc16', B: '#84cc16', 'C+': '#84cc16', C: '#84cc16', 'D+': '#84cc16', D: '#84cc16',
  F: '#e11d48', W: '#e11d48', 'W-Late': '#e11d48', N: '#94a3b8', '-': '#6366f1'
};

function renderTopicMastery(courseId, parentId = null) {
  const allTopics = state.topicMastery[courseId] || [];
  const topics = allTopics.filter(t => t.parentId === parentId);
  const total = allTopics.length;
  const mastered = allTopics.filter(t => t.level === 'mastered').length;
  const progressPct = total > 0 ? ((mastered / total) * 100).toFixed(0) : 0;
  let html = '';

  // FIX 3: Mastery Summary Bar
  if (parentId === null && total > 0) {
    html += `
          <div class="glass-card nb-card" style="margin-bottom:15px; background:rgba(132,204,22,0.05); border-color:var(--c-lime);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
               <div style="font-size:14px; font-weight:800; color:var(--c-lime);">📊 Mastery Progress</div>
               <div style="font-size:14px; font-weight:800;">${progressPct}%</div>
            </div>
            <div class="progress-bar-v2" style="height:12px;"><div class="pb-fill" style="width:${progressPct}%; background:var(--c-lime);"></div></div>
            <div style="font-size:11px; margin-top:6px; font-weight:600; opacity:0.7;">เชี่ยวชาญแล้ว ${mastered}/${total} หัวข้อ</div>
          </div>
        `;
  }

  // Course-wide Linked Files (from Drive Toolbar)
  if (parentId === null) {
    const c = findCourseById(courseId);
    if (c && c.linkedFiles && c.linkedFiles.length > 0) {
      html += `
        <div class="glass-card nb-card" style="margin-bottom:15px; background:rgba(99,102,241,0.05); border-color:var(--c-indigo); padding: 15px;">
          <div style="font-size:14px; font-weight:800; color:var(--c-indigo); margin-bottom:8px; display:flex; align-items:center; gap:6px;">📚 เอกสารประกอบรายวิชา (Linked Files)</div>
          <div style="display:flex; flex-wrap:wrap; gap:5px;">
            ${c.linkedFiles.map(f => `
              <div class="file-tag" style="background:white; padding:4px 10px; border-radius:6px; font-size:11px; display:flex; align-items:center; gap:5px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <span onclick="previewFile('${f.id}', '${f.name}', '${f.url}', '${f.mimeType}')" style="cursor:pointer; font-weight:600;">📄 ${f.name}</span>
                <span onclick="unlinkFileFromCourse('${courseId}', '${f.id}')" style="cursor:pointer; color:var(--c-red); font-weight:800; margin-left:3px;">✕</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  if (topics.length === 0 && parentId === null) {
    return html + `<div class="empty-sm">ยังไม่มีหัวข้อที่เรียน <br> <button class="nb-btn sm" style="margin-top:10px;" onclick="addTopic('${courseId}', null)">➕ เพิ่มหัวข้อหลัก</button></div>`;
  }

  html += `<div class="${parentId ? 'topic-branch' : ''}">
        ${topics.map((t, idx) => `
          <div style="margin-bottom:12px;">
            <div class="topic-item nb-card" style="padding:10px 15px; background:white;">
              <div style="display:flex; align-items:center; gap:10px; flex:1;">
                 <div class="topic-lvl-badge" style="width:10px; height:10px; background:${t.level === 'mastered' ? 'var(--c-lime)' : t.level === 'ok' ? 'var(--c-indigo)' : 'var(--c-rust)'}; border:1.5px solid black;"></div>
                 <div style="font-weight:700; font-size:13px; color:black;">${t.name}</div>
              </div>
              <div class="topic-meta" style="display:flex; gap:6px;">
                <button class="mastery-btn ${t.level === 'review' ? 'active' : ''}" style="background:var(--c-rust);" title="Review" onclick="setTopicLevel('${courseId}', '${t.id}', 'review')">❓ ทวน</button>
                <button class="mastery-btn ${t.level === 'ok' ? 'active' : ''}" style="background:var(--c-indigo);" title="OK" onclick="setTopicLevel('${courseId}', '${t.id}', 'ok')">📖 พอได้</button>
                <button class="mastery-btn ${t.level === 'mastered' ? 'active' : ''}" style="background:var(--c-lime);" title="Mastered" onclick="setTopicLevel('${courseId}', '${t.id}', 'mastered')">⭐ แม่น</button>
                <button class="tool-btn sm" style="font-size:10px; width:auto; padding:0 8px; border:1px solid black; border-radius:6px;" title="Link File" onclick="PickerManager.openPicker('${courseId}', null, (docs) => linkFilesToTopic('${courseId}', '${t.id}', docs))">🔗</button>
                <button class="tool-btn sm" style="font-size:10px; width:auto; padding:0 8px; border:1px solid black; border-radius:6px;" title="เพิ่มหัวข้อย่อย" onclick="addTopic('${courseId}', '${t.id}')">➕ ย่อย</button>
                <button class="btn-text-danger" style="font-size:14px; font-weight:800;" onclick="deleteTopic('${courseId}', '${t.id}')">✕</button>
              </div>
            </div>
            ${t.files && t.files.length > 0 ? `
              <div class="topic-files" style="margin-left: 25px; margin-top: 5px; margin-bottom: 5px; display: flex; flex-wrap: wrap; gap: 5px;">
                ${t.files.map(f => `
                  <div class="file-tag" style="background:#f1f5f9; padding:2px 8px; border-radius:6px; font-size:11px; display:flex; align-items:center; gap:5px; border:1px solid #e2e8f0;">
                    <span onclick="previewFile('${f.id}', '${f.name}', '${f.url}', '${f.mimeType}')" style="cursor:pointer;">📄 ${f.name}</span>
                    <span onclick="unlinkFileFromTopic('${courseId}', '${t.id}', '${f.id}')" style="cursor:pointer; color:var(--c-red); font-weight:800;">✕</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${renderTopicMastery(courseId, t.id)}
          </div>
        `).join('')}
        ${!parentId ? `<button class="nb-btn sm" style="width:100%; margin-top:5px; background:#f8fafc;" onclick="addTopic('${courseId}', null)">➕ เพิ่มหัวข้อหลัก</button>` : ''}
      </div>`;
  return html;
}

function calcGPAFromList(list) {
  let pts = 0, cr = 0;
  list.forEach(c => {
    const g = GRADE_PTS[c.grade];
    if (g !== null && g !== undefined && c.grade !== 'W' && c.grade !== 'W-Late' && c.grade !== 'P' && c.grade !== 'N') { pts += g * c.credits; cr += c.credits; }
  });
  return cr > 0 ? (pts / cr).toFixed(2) : '-';
}

// ══════════════════════════════════════════════════
// MICRO-GRADE & WHAT-IF LOGIC
// ══════════════════════════════════════════════════
function renderGradeStructure(courseId) {
  const structure = state.courseStructures[courseId] || { components: [] };
  if (structure.components.length === 0) {
    return `<div class="empty-sm" style="background:rgba(255,255,255,0.05); padding:12px; border-radius:12px; border:1px dashed var(--glass-border);">
      ยังไม่มีโครงสร้างคะแนน <br> <button class="btn-glass sm" style="margin-top:8px;" id="setupGradeBtn">🛠 ตั้งค่าโครงสร้าง</button>
    </div>`;
  }

  let totalWeight = 0;
  let earnedPct = 0;
  let html = `<div class="grade-rows" style="display:flex; flex-direction:column; gap:8px;">`;
  structure.components.forEach((comp, idx) => {
    const score = parseFloat(comp.earned) || 0;
    const max = parseFloat(comp.max) || 100;
    const weight = parseFloat(comp.weight) || 0;
    const contribution = (score / max) * weight;
    totalWeight += weight;
    earnedPct += contribution;
    html += `
      <div class="grade-row-item">
        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
          <span>${comp.name} (${weight}%)</span>
          <span style="font-weight:600;">${score}/${max} (${contribution.toFixed(1)}%)</span>
        </div>
        <div class="prog-bar-bg" style="height:6px; background:rgba(255,255,255,0.1);"><div class="prog-bar-fill" style="width:${(score / max) * 100}%; background:var(--c-accent); box-shadow:0 0 10px var(--c-accent);"></div></div>
      </div>`;
  });

  const remainingWeight = 100 - totalWeight;
  html += `</div>
    <div style="margin-top:12px; padding:12px; background:rgba(79,70,229,0.1); border-radius:12px; border:1px solid rgba(79,70,229,0.2);">
      <div style="font-size:14px; font-weight:700; color:var(--c-accent);">คะแนนปัจจุบัน: ${earnedPct.toFixed(1)} / ${totalWeight}%</div>
      ${remainingWeight > 0 ? `
        <div style="font-size:11px; margin-top:4px; opacity:0.7;">เหลือคะแนนอีก ${remainingWeight}% ที่ยังไม่ได้ประกาศ</div>
        <div class="what-if-results" style="margin-top:10px; font-size:10px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div class="glass-card-sm" style="padding:8px; border:1px solid rgba(132,204,22,0.3);">
            <div style="color:var(--c-lime); font-weight:700;">เป้าหมายเกรด A (80%)</div>
            <div>ต้องได้อีก: <strong>${Math.max(0, 80 - earnedPct).toFixed(1)}%</strong></div>
          </div>
          <div class="glass-card-sm" style="padding:8px; border:1px solid rgba(249,115,22,0.3);">
            <div style="color:var(--c-rust); font-weight:700;">เป้าหมายเกรด C (60%)</div>
            <div>ต้องได้อีก: <strong>${Math.max(0, 60 - earnedPct).toFixed(1)}%</strong></div>
          </div>
        </div>
      ` : ''}
    </div>
    <button class="btn-text-sm" style="margin-top:10px; width:100%;" id="editGradeStructureBtn">✏️ แก้ไขคะแนนย่อย</button>`;
  return html;
}

function setupGradeStructure(courseId) {
  const structure = state.courseStructures[courseId] || { components: [] };
  let tempComponents = [...structure.components];

  const renderTemp = () => tempComponents.map((c, i) => `
    <div class="glass-card-sm" style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr 30px; gap:8px; align-items:center; margin-bottom:8px; padding:10px;">
      <input class="glass-input sm f-comp-name" placeholder="ชื่อ (เช่น Midterm)" value="${c.name}" data-idx="${i}">
      <input type="number" class="glass-input sm f-comp-earned" placeholder="ได้" value="${c.earned}" data-idx="${i}">
      <input type="number" class="glass-input sm f-comp-max" placeholder="เต็ม" value="${c.max}" data-idx="${i}">
      <input type="number" class="glass-input sm f-comp-weight" placeholder="นน.%" value="${c.weight}" data-idx="${i}">
      <button class="btn-text-danger" onclick="tempComponents.splice(${i},1); window.updateCompUI();">✕</button>
    </div>
  `).join('');

  openModal('ตั้งค่าโครงสร้างคะแนน', `
    <div class="form-grid">
      <div id="compList">${renderTemp()}</div>
      <button class="btn-glass sm" id="addCompBtn">+ เพิ่มรายการ</button>
      <div style="font-size:11px; color:var(--c-muted);">* รวมค่าน้ำหนัก (%) ทั้งหมดควรเท่ากับ 100</div>
    </div>
  `, `<button class="btn-glass-primary" id="saveCompBtn">บันทึกโครงสร้าง</button>`);

  window.updateCompUI = () => {
    const list = document.getElementById('compList');
    if (list) {
      list.innerHTML = renderTemp();
      attachCompEvents();
    }
  };
  const attachCompEvents = () => {
    document.querySelectorAll('.f-comp-name').forEach(el => el.onchange = (e) => tempComponents[e.target.dataset.idx].name = e.target.value);
    document.querySelectorAll('.f-comp-earned').forEach(el => el.onchange = (e) => tempComponents[e.target.dataset.idx].earned = e.target.value);
    document.querySelectorAll('.f-comp-max').forEach(el => el.onchange = (e) => tempComponents[e.target.dataset.idx].max = e.target.value);
    document.querySelectorAll('.f-comp-weight').forEach(el => el.onchange = (e) => tempComponents[e.target.dataset.idx].weight = e.target.value);
  };
  document.getElementById('addCompBtn').onclick = () => { tempComponents.push({ name: '', earned: 0, max: 100, weight: 0 }); window.updateCompUI(); };
  attachCompEvents();

  document.getElementById('saveCompBtn').onclick = async () => {
    state.courseStructures[courseId] = { components: tempComponents };
    localStorage.setItem('course_structures', JSON.stringify(state.courseStructures));

    showToast('⏳ กำลังซิงก์ข้อมูลโครงสร้างคะแนน...');
    await fsSet('course_structures', courseId, { components: tempComponents });

    showToast('✅ บันทึกโครงสร้างคะแนนเรียบร้อย');
    closeModal();
    render();
  };
}

function getCumGPA() {
  const all = [];
  state.semesters.forEach(s => { (state.courses[s.id] || []).forEach(c => { if (c.grade) all.push(c); }); });
  return calcGPAFromList(all);
}

function getTotalPassedCredits() {
  let t = 0;
  state.semesters.forEach(s => {
    (state.courses[s.id] || []).forEach(c => {
      if (c.grade && c.grade !== 'F' && c.grade !== 'W' && c.grade !== 'W-Late' && c.grade !== 'N' && c.grade !== 'I') t += c.credits;
    });
  });
  return t;
}

function getProStatus(gpa) {
  const g = parseFloat(gpa);
  if (isNaN(g) || gpa === '-') return null;
  if (g < 1.5) return 'expelled';
  if (g < 1.75) return 'pro-high';
  if (g < 2.0) return 'pro-low';
  return 'safe';
}

function getDaysUntil(d) { return Math.ceil((new Date(d) - new Date()) / (864e5)); }

// ══════════════════════════════════════════════════
// ⏱️ LIVE CLASS HUB (DASHBOARD COMPONENT)
// ══════════════════════════════════════════════════
const LiveClassHub = {
  active: false,
  courseId: null,
  startTime: null,
  worker: null,
  elapsed: 0,

  initWorker() {
    if (this.worker) return;
    const workerCode = `
      let timer;
      let start;
      self.onmessage = function(e) {
        if (e.data.cmd === 'start') {
          start = e.data.start;
          if (timer) clearInterval(timer);
          timer = setInterval(() => {
            self.postMessage({ cmd: 'tick', elapsed: Date.now() - start });
          }, 1000);
        } else if (e.data.cmd === 'stop') {
          clearInterval(timer);
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    this.worker.onmessage = (e) => {
      if (e.data.cmd === 'tick') {
        this.elapsed = e.data.elapsed;
        this.updateUI();
      }
    };
  },

  start(courseId) {
    this.active = true;
    this.courseId = courseId;
    this.startTime = Date.now();
    this.initWorker();
    this.worker.postMessage({ cmd: 'start', start: this.startTime });
    this.elapsed = 0;
    render();
    showToast('🚀 เริ่มบันทึกเวลาเรียนแล้ว');
  },

  stop() {
    if (!this.active) return;
    const durationMin = Math.round(this.elapsed / 60000);
    this.active = false;
    if (this.worker) this.worker.postMessage({ cmd: 'stop' });
    this.saveSession(durationMin);
    render();
  },

  updateUI() {
    const el = document.getElementById('live-timer-display');
    if (el) {
      const s = Math.floor(this.elapsed / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      el.textContent = `${h.toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    }
  },

  saveSession(min) {
    const c = findCourseById(this.courseId);
    openModal('📝 สรุปการเรียนวันนี้', `
      <div style="padding:10px;">
        <h3 style="margin-bottom:10px;">${c?.nameTh || 'ไม่ทราบวิชา'}</h3>
        <p style="font-size:14px; opacity:0.7; margin-bottom:20px;">บันทึกเวลาเรียนไป ${min} นาที</p>
        <div class="fg full">
          <label>สิ่งที่คุณได้เรียนรู้วันนี้ (Reflection)</label>
          <textarea id="liveReflection" class="glass-textarea" placeholder="วันนี้เรียนเรื่องอะไร? มีอะไรสำคัญ?..." style="height:120px;"></textarea>
        </div>
      </div>
    `, `
      <button class="btn-glass-primary full" onclick="LiveClassHub.finalSave()">💾 บันทึกความก้าวหน้า</button>
    `);
  },

  async finalSave() {
    const text = document.getElementById('liveReflection').value;
    if (text.length < 10) { showToast('⚠️ โปรดเขียนสรุปสั้นๆ (อย่างน้อย 10 ตัวอักษร)', 'warn'); return; }
    
    showToast('⏳ กำลังบันทึก...');
    const sessionData = {
        courseId: this.courseId,
        date: new Date().toISOString(),
        duration: Math.round(this.elapsed / 60000),
        reflection: text
    };
    await fsSet('reflections', `${this.courseId}_${Date.now()}`, sessionData);
    
    closeModal();
    showToast('✅ บันทึก Reflection สำเร็จ');
    this.courseId = null;
    render();
  }
};

window.LiveClassHub = LiveClassHub;

// ══════════════════════════════════════════════════
// 📄 PDF TRACEABILITY MANAGER
// ══════════════════════════════════════════════════
const PDFManager = {
  async generateTranscriptReport() {
    showToast("Generating Traceable PDF...", "wait");
    const data = {
      student: STUDENT,
      gpax: getCumGPA(),
      credits: getTotalPassedCredits(),
      courses: state.courses,
      timestamp: new Date().toISOString()
    };

    google.script.run
      .withSuccessHandler((res) => {
        if (res && res.success && res.id) {
          showToast("✅ PDF Generated Successfully. Downloading...", "ok");
          downloadFileViaProxy(res.id, `NITIPAT_TRANSCRIPT_${STUDENT.id}.pdf`);
        } else if (res && typeof res === 'string') {
          const match = res.match(/\/d\/(.*?)\//);
          const fileId = match ? match[1] : null;
          if (fileId) {
            showToast("✅ PDF Generated Successfully. Downloading...", "ok");
            downloadFileViaProxy(fileId, `NITIPAT_TRANSCRIPT_${STUDENT.id}.pdf`);
          } else {
            window.open(res, '_blank');
            showToast("PDF Generated Successfully", "ok");
          }
        } else {
          showToast("❌ PDF Generation Failed", "err");
        }
      })
      .withFailureHandler(() => showToast("PDF Generation Failed", "err"))
      .generateTraceablePDF(data);
  }
};

window.PDFManager = PDFManager;

function getCurrentSemester() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  return state.semesters.find(s => dateStr >= s.start && dateStr <= s.end);
}

// ══════════════════════════════════════════════════
// FIREBASE CRUD
// ══════════════════════════════════════════════════
function showLoadingBlocker() {
  let b = document.getElementById('globalLoadingBlocker');
  if (!b) {
    b = document.createElement('div');
    b.id = 'globalLoadingBlocker';
    b.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(255,255,255,0.4); z-index:99999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(3px); cursor:wait;';
    b.innerHTML = '<div style="background:var(--text); color:white; padding:15px 30px; border-radius:12px; font-weight:600; box-shadow:0 10px 25px rgba(0,0,0,0.1); display:flex; align-items:center; gap:10px;"><div class="spinner"></div>กำลังบันทึกข้อมูล...</div>';
    const style = document.createElement('style');
    style.innerHTML = '.spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; } @keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    document.body.appendChild(b);
  }
  b.style.display = 'flex';
}
function hideLoadingBlocker() {
  const b = document.getElementById('globalLoadingBlocker');
  if (b) b.style.display = 'none';
}

async function fsSet(col, id, data) {
  saveToLocalStorage();
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return;
  }
  try {
    const plainData = JSON.parse(JSON.stringify(data));
    setDoc(doc(db, col, id), { ...plainData, _t: serverTimestamp() })
      .catch(e => handleFirebaseError(e, 'fsSet'));
    
    // Notion Sync Trigger (only for main data objects)
    if ((col === 'assignments' || col === 'exams') && !data._notion_syncing && typeof google !== 'undefined' && google.script) {
      const syncFunc = col === 'assignments' ? 'syncAssignmentToNotion' : 'syncExamToNotion';
      google.script.run.withSuccessHandler(res => {
        if (res && res.success && res.pageId && !data.notionPageId) {
          fsUpd(col, id, { notionPageId: res.pageId, _notion_syncing: true });
        }
      })[syncFunc](plainData);
    }
  } catch (e) {
    handleFirebaseError(e, 'fsSet');
  }
}
async function fsDel(col, id) {
  saveToLocalStorage();
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return;
  }
  try {
    deleteDoc(doc(db, col, id))
      .catch(e => handleFirebaseError(e, 'fsDel'));
  } catch (e) {
    handleFirebaseError(e, 'fsDel');
  }
}
async function fsUpd(col, id, data) {
  saveToLocalStorage();
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return;
  }
  try {
    const plainData = JSON.parse(JSON.stringify(data));
    updateDoc(doc(db, col, id), plainData)
      .catch(e => handleFirebaseError(e, 'fsUpd'));
    
    // Trigger Notion Update if relevant
    if ((col === 'assignments' || col === 'exams') && !data._notion_syncing && typeof google !== 'undefined' && google.script) {
      // Need full data for Notion sync
      getDoc(doc(db, col, id)).then(fullDoc => {
        if (fullDoc.exists()) {
          const fullData = fullDoc.data();
          const syncFunc = col === 'assignments' ? 'syncAssignmentToNotion' : 'syncExamToNotion';
          google.script.run.withSuccessHandler(res => {
            if (res && res.success && res.pageId && !fullData.notionPageId) {
               fsUpd(col, id, { notionPageId: res.pageId, _notion_syncing: true });
            }
          })[syncFunc](fullData);
        }
      }).catch(e => console.error("Notion sync document fetch failed", e));
    }
  } catch (e) {
    handleFirebaseError(e, 'fsUpd');
  }
}

function handleFirebaseError(e, source) {
  console.warn(`Firebase Error (${source}):`, e.message);
  if (e.message.toLowerCase().includes('blocked') || e.message.toLowerCase().includes('failed to fetch') || e.code === 'unavailable') {
    showToast('⚠️ การเชื่อมต่อฐานข้อมูลล้มเหลว กรุณาปิด Brave Shields หรือ AdBlocker สำหรับเว็บไซต์นี้', 'err');
  }
}

// ── โหลดข้อมูลจาก localStorage ก่อน (fast) แล้วค่อย sync Firebase ──
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('nitipat_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.semesters) state.semesters = parsed.semesters;
      if (parsed.courses) state.courses = parsed.courses;
      if (parsed.assignments) state.assignments = parsed.assignments;
      if (parsed.exams) state.exams = parsed.exams;
      if (parsed.topicMastery) state.topicMastery = parsed.topicMastery;
      if (parsed.attendanceHistory) state.attendanceHistory = parsed.attendanceHistory;
    }
    const pin = localStorage.getItem('user_pin');
    if (pin) {
      state.pin = pin;
      state.isLocked = true;
    }
  } catch (e) { console.warn('localStorage load error:', e); }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('nitipat_state', JSON.stringify({
      semesters: state.semesters,
      courses: state.courses,
      assignments: state.assignments,
      exams: state.exams,
      topicMastery: state.topicMastery,
      attendanceHistory: state.attendanceHistory
    }));
  } catch (e) { console.warn('localStorage save error:', e); }
}

function saveMoneyPod() {
  try {
    localStorage.setItem('moneyWallets', JSON.stringify(state.moneyWallets));
    localStorage.setItem('moneyTransactions', JSON.stringify(state.moneyTransactions));
    localStorage.setItem('moneyBudgets', JSON.stringify(state.moneyBudgets));
    localStorage.setItem('moneyGoals', JSON.stringify(state.moneyGoals));
    localStorage.setItem('moneyInstallments', JSON.stringify(state.moneyInstallments));
    localStorage.setItem('moneyTheme', state.moneyTheme);
    localStorage.setItem('moneyDailyBudget', state.moneyDailyBudget.toString());
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return;
    }
    
    if (db) {
      setDoc(doc(db, "app_settings", "money_pod"), {
        wallets: state.moneyWallets,
        transactions: state.moneyTransactions,
        budgets: state.moneyBudgets,
        goals: state.moneyGoals,
        installments: state.moneyInstallments,
        theme: state.moneyTheme,
        dailyBudget: state.moneyDailyBudget
      }).catch(e => console.warn("MoneyPod Firestore save error:", e));
    }
  } catch (e) {
    console.warn("MoneyPod save error:", e);
  }
}

async function loadAll() {
  state.isInitializing = true;
  loadFromLocalStorage();

  const today = new Date().toDateString();
  if (state.lastScoreReset !== today) {
    state.focusScore = 100;
    state.lastScoreReset = today;
    localStorage.setItem('focusScore', 100);
    localStorage.setItem('last_score_reset', today);
  }
  render();

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.warn("Local offline mode: Bypassing Firebase Sync");
    state.isInitializing = false;
    if (!state.modal) render();
    return;
  }

  try {
    const [sSnap, cSnap, aSnap, eSnap, secSnap, mastSnap, structSnap, reflSnap, profSnap] = await Promise.all([
      getDocs(collection(db, "semesters")),
      getDocs(collection(db, "courses")),
      getDocs(collection(db, "assignments")),
      getDocs(collection(db, "exams")),
      getDoc(doc(db, "app_settings", "security")),
      getDocs(collection(db, "topic_mastery")),
      getDocs(collection(db, "course_structures")),
      getDocs(collection(db, "reflections")),
      getDoc(doc(db, "app_settings", "profile"))
    ]);

    if (secSnap.exists()) {
      state.pin = secSnap.data().global_pin;
      state.pinSalt = secSnap.data().pin_salt || 'NITIPAT_SALT_DEFAULT';
      if (state.pin && sessionStorage.getItem('unlocked') !== 'true') state.isLocked = true;
      else state.isLocked = false;
    }

    if (profSnap.exists()) {
      const profData = profSnap.data();
      if (profData.idCardPhoto) {
        state.idCardPhoto = profData.idCardPhoto;
        localStorage.setItem('id_card_photo', state.idCardPhoto);
      } else if (state.idCardPhoto) {
        fsSet('app_settings', 'profile', {
          idCardPhoto: state.idCardPhoto,
          studentPhoto: STUDENT.photoUrl
        });
      }
      if (profData.studentPhoto) {
        STUDENT.photoUrl = profData.studentPhoto;
        localStorage.setItem('student_photo', STUDENT.photoUrl);
      }
    } else if (state.idCardPhoto) {
      fsSet('app_settings', 'profile', {
        idCardPhoto: state.idCardPhoto,
        studentPhoto: STUDENT.photoUrl
      });
    }

    state.semesters = sSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.order - b.order);
    state.courses = {};
    cSnap.docs.forEach(d => { const c = { id: d.id, ...d.data() }; if (!state.courses[c.semId]) state.courses[c.semId] = []; state.courses[c.semId].push(c); });
    state.assignments = {};
    aSnap.docs.forEach(d => { const a = { id: d.id, ...d.data() }; if (!state.assignments[a.courseId]) state.assignments[a.courseId] = []; state.assignments[a.courseId].push(a); });
    state.exams = {};
    eSnap.docs.forEach(d => { const e = { id: d.id, ...d.data() }; if (!state.exams[e.courseId]) state.exams[e.courseId] = []; state.exams[e.courseId].push(e); });

    // Cloud Sync for specialized collections
    mastSnap.docs.forEach(d => { state.topicMastery[d.id] = d.data().topics || []; });
    structSnap.docs.forEach(d => { state.courseStructures[d.id] = d.data() || { components: [] }; });
    reflSnap.docs.forEach(d => { state.reflections[d.id] = d.data().text || d.data().reflection || ""; });

    // Sync to LocalStorage as backup
    localStorage.setItem('topic_mastery', JSON.stringify(state.topicMastery));
    localStorage.setItem('course_structures', JSON.stringify(state.courseStructures));
    localStorage.setItem('reflections', JSON.stringify(state.reflections));

    // Focus Sync Listener
    onSnapshot(doc(db, 'app_state', 'focus_session'), (snap) => {
      const data = snap.data();
      if (data && data.active) {
        if (!state.pomodoroActive && data.initiatorId !== state.deviceId) {
          state.pomodoroPhase = data.phase;
          state.pomodoroWork = data.work;
          state.pomodoroBreak = data.break;
          state.selectedFocusCourseId = data.courseId;
          state.lastInitiatorId = data.initiatorId;
          const elapsed = (Date.now() - data.startTime) / 1000;
          const total = (data.phase === 'work' ? data.work : data.break) * 60;
          state.pomodoroTimeRemaining = Math.max(0, total - elapsed);
          startPomodoro(true);
        }
      } else if (state.pomodoroActive && state.lastInitiatorId && state.lastInitiatorId !== state.deviceId) {
        stopPomodoro(false);
      }
    });

    onSnapshot(collection(db, 'attendance_history'), (snap) => {
      let updated = false;
      snap.forEach(doc => {
        const courseId = doc.id;
        const data = doc.data();
        if (data.history) {
          state.attendanceHistory[courseId] = data.history;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('attendance_history', JSON.stringify(state.attendanceHistory));
        if (state.activeHubTab === 'Attendance') render();
      }
    });

    try {
      const mpSnap = await getDoc(doc(db, "app_settings", "money_pod"));
      if (mpSnap.exists()) {
        const mpData = mpSnap.data();
        if (mpData.wallets) state.moneyWallets = mpData.wallets;
        if (mpData.transactions) state.moneyTransactions = mpData.transactions;
        if (mpData.budgets) state.moneyBudgets = mpData.budgets;
        if (mpData.goals) state.moneyGoals = mpData.goals;
        if (mpData.installments) state.moneyInstallments = mpData.installments;
        if (mpData.theme) state.moneyTheme = mpData.theme;
        if (mpData.dailyBudget) state.moneyDailyBudget = mpData.dailyBudget;
        
        localStorage.setItem('moneyWallets', JSON.stringify(state.moneyWallets));
        localStorage.setItem('moneyTransactions', JSON.stringify(state.moneyTransactions));
        localStorage.setItem('moneyBudgets', JSON.stringify(state.moneyBudgets));
        localStorage.setItem('moneyGoals', JSON.stringify(state.moneyGoals));
        localStorage.setItem('moneyInstallments', JSON.stringify(state.moneyInstallments));
        localStorage.setItem('moneyTheme', state.moneyTheme);
        localStorage.setItem('moneyDailyBudget', state.moneyDailyBudget.toString());
      }
    } catch (err) {
      console.warn("Error loading MoneyPod data from Firestore:", err);
    }

    saveToLocalStorage();
    await autoArchiveCourses();
    state.isInitializing = false;
    scheduleAllNotifications();
    if (!state.modal) render();
  } catch (e) {
    state.isInitializing = false;
    handleFirebaseError(e, 'loadAll');
  }
}

async function autoArchiveCourses() {
  const today = new Date();
  let changed = false;
  state.semesters.forEach(s => {
    const endD = new Date(s.endDate);
    if (today > endD) {
      const courses = state.courses[s.id] || [];
      courses.forEach(c => {
        if (!c.isArchived && c.grade && c.grade !== '-' && c.grade !== 'I' && c.grade !== 'N' && c.grade !== 'P' && c.grade !== 'F') {
          c.isArchived = true;
          fsUpd('courses', c.id, { isArchived: true });
          changed = true;
        }
      });
    }
  });
  if (changed) saveToLocalStorage();
}

// ══════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════



// ══════════════════════════════════════════════════
// POMODORO / FOCUS
// ══════════════════════════════════════════════════
async function startPomodoro(isRemote = false) {
  if (!isRemote) {
    await Radio.warmUp();
    // Sync to Firestore
    const settings = {
      active: true,
      phase: state.pomodoroPhase,
      work: state.pomodoroWork,
      break: state.pomodoroBreak,
      courseId: state.selectedFocusCourseId,
      initiatorId: state.deviceId,
      startTime: Date.now()
    };
    await fsSet('app_state', 'focus_session', settings);
  }

  state.pomodoroActive = true;

  if (state.pomodoroTimeRemaining <= 0) {
    const mins = state.pomodoroPhase === 'work' ? state.pomodoroWork : state.pomodoroBreak;
    state.pomodoroTimeRemaining = mins * 60;
  }

  state.pomodoroEndTime = Date.now() + (state.pomodoroTimeRemaining * 1000);

  if (state.pomodoroPhase === 'work') {
    state.isImmersiveFocus = true;
    // Only play audio on the device that initiated the session (or if forced)
    if (!isRemote || state.deviceId === state.lastInitiatorId) {
      Radio.onPomodoroStart();
    }
  }

  state.pomodoroTimer = setInterval(async () => {
    const now = Date.now();
    state.pomodoroTimeRemaining = Math.max(0, Math.round((state.pomodoroEndTime - now) / 1000));

    if (now >= state.pomodoroEndTime) {
      clearInterval(state.pomodoroTimer);
      state.pomodoroTimeRemaining = 0;

      if (state.pomodoroPhase === 'work') {
        state.pomodoroCount++;
        const focusedMins = state.pomodoroWork;
        state.totalFocusHours += (focusedMins / 60);

        if (state.selectedFocusCourseId) {
          state.courseFocusStats[state.selectedFocusCourseId] = (state.courseFocusStats[state.selectedFocusCourseId] || 0) + focusedMins;
          localStorage.setItem('course_focus_stats', JSON.stringify(state.courseFocusStats));
          fsSet('course_focus_stats', state.selectedFocusCourseId, { minutes: state.courseFocusStats[state.selectedFocusCourseId] });
        }

        state.focusScore = Math.min(100, state.focusScore + 10);
        localStorage.setItem('focusScore', state.focusScore);
        localStorage.setItem('totalFocusHours', state.totalFocusHours.toFixed(2));

        checkBadges();
        state.pomodoroPhase = 'break';
        showToast('✅ Focus Complete!', 'info');
        Radio.onPomodoroComplete();
        growTree();

        // Auto-start break
        startPomodoro(isRemote);
      } else {
        state.pomodoroPhase = 'work';
        showToast('☕ Break Over', 'info');
        // Auto-start next work session
        startPomodoro(isRemote);
      }
    } else {
      updateFocusProgressUI();
    }
  }, 1000);
  render();
}

async function stopPomodoro(manual = true) {
  clearInterval(state.pomodoroTimer);
  state.pomodoroActive = false;
  state.isImmersiveFocus = false;
  state.pomodoroTimeRemaining = 0;
  Radio.stopAll();
  if (document.fullscreenElement) try { document.exitFullscreen(); } catch (e) { }

  if (manual) {
    await fsSet('app_state', 'focus_session', { active: false });
    if (state.pomodoroPhase === 'work') {
      handleFocusDistraction("เซสชันถูกยกเลิกด้วยตัวเอง");
    }
  }

  state.pomodoroPhase = 'work';
  render();
}

function handleFocusDistraction(reason) {
  state.focusScore = Math.max(0, state.focusScore - 5);
  localStorage.setItem('focusScore', state.focusScore);
  showToast(`⚠️ ${reason}! คะแนน Focus -5`, 'err');

  // Visual feedback for distraction
  document.body.classList.add('distraction-flash');
  setTimeout(() => document.body.classList.remove('distraction-flash'), 1000);
}

function updateFocusProgressUI() {
  const rem = state.pomodoroTimeRemaining;
  const total = (state.pomodoroPhase === 'work' ? state.pomodoroWork : state.pomodoroBreak) * 60;
  const progress = (1 - rem / total) * 100;

  const ring = document.getElementById('pomRingProgress');
  if (ring) {
    const dash = 377; // 2 * pi * 60
    ring.style.strokeDashoffset = dash - (progress / 100) * dash;
  }
  const timeEl = document.getElementById('pomTimeDisplay');
  if (timeEl) timeEl.textContent = fmtTime(rem);
}

function findCourseById(id) {
  return Object.values(state.courses).flat().find(c => c.id === id);
}

// Anti-Distraction Listeners
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && state.isImmersiveFocus && state.pomodoroActive) {
    handleFocusDistraction("ออกจากโหมดเต็มหน้าจอ");
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.isImmersiveFocus && state.pomodoroActive) {
    handleFocusDistraction("มีการสลับหน้าจอ/แอป");
    // Auto pause or just deduct points? User said "หยุดเวลาชั่วคราว"
    // To keep it simple, we just deduct and keep running, or we can pause.
    // Let's pause as requested.
    clearInterval(state.pomodoroTimer);
    state.pomodoroActive = false;
    Radio.onPomodoroPause();
    render();
  }
});

function growTree() {
  state.tree.sessions++;
  state.tree.level = Math.floor(state.tree.sessions / 3);
  state.tree.alive = true;
  localStorage.setItem('focusTree', JSON.stringify(state.tree));
}

function checkBadges() {
  const h = state.totalFocusHours;
  const newBadges = [];
  if (h >= 1 && !state.badges.includes('first_hour')) newBadges.push('first_hour');
  if (h >= 10 && !state.badges.includes('10h')) newBadges.push('10h');
  if (h >= 25 && !state.badges.includes('25h')) newBadges.push('25h');
  if (h >= 100 && !state.badges.includes('100h')) newBadges.push('100h');
  if (state.pomodoroCount >= 10 && !state.badges.includes('10pomo')) newBadges.push('10pomo');
  newBadges.forEach(b => {
    state.badges.push(b);
    const labels = { 'first_hour': '🏅 ชั่วโมงแรก!', '10h': '🥈 10 ชั่วโมงโฟกัส', '25h': '🥇 25 ชั่วโมง Warrior', '100h': '🏆 100h Legend', '10pomo': '🍅 Pomodoro Pro' };
    showToast('🎉 ได้ Badge ใหม่: ' + labels[b], 'success');
  });
  localStorage.setItem('badges', JSON.stringify(state.badges));
}

function getPomodoroRemaining() {
  if (!state.pomodoroActive) return state.pomodoroWork * 60;
  return Math.max(0, Math.ceil((state.pomodoroEndTime - Date.now()) / 1000));
}

function fmtTime(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }

// ══════════════════════════════════════════════════
// TREE EMOJI
// ══════════════════════════════════════════════════
function getTreeEmoji() {
  const lvl = state.tree.level;
  if (!state.tree.alive) return '🪨';
  if (lvl === 0) return '🌱';
  if (lvl === 1) return '🌿';
  if (lvl === 2) return '🌳';
  if (lvl >= 3) return '🌲';
}

function getTreeSVG() {
  const lvl = state.tree.level;
  if (!state.tree.alive) return `<svg width="120" height="120" viewBox="0 0 100 100"><path d="M30 80 Q50 60 70 80 Z" fill="#6b7280"/></svg>`;
  if (lvl === 0) return `<svg width="120" height="120" viewBox="0 0 100 100"><path d="M50 80 L50 60 Q60 50 70 55" stroke="#22c55e" stroke-width="6" stroke-linecap="round" fill="none"/></svg>`;
  if (lvl === 1) return `<svg width="120" height="120" viewBox="0 0 100 100"><path d="M50 80 L50 40 Q70 30 75 40 M50 60 Q30 50 35 60" stroke="#22c55e" stroke-width="8" stroke-linecap="round" fill="none"/></svg>`;
  if (lvl === 2) return `<svg width="120" height="120" viewBox="0 0 100 100"><path d="M44 60 h12 v25 h-12 z" fill="#78350f"/><circle cx="50" cy="45" r="25" fill="#22c55e"/></svg>`;
  return `<svg width="120" height="120" viewBox="0 0 100 100" style="filter:drop-shadow(0 8px 16px rgba(21,128,61,0.3))"><path d="M42 50 h16 v35 h-16 z" fill="#78350f"/><circle cx="50" cy="35" r="30" fill="#15803d"/><circle cx="30" cy="45" r="20" fill="#16a34a"/><circle cx="70" cy="45" r="20" fill="#16a34a"/></svg>`;
}


// ══════════════════════════════════════════════════
// DARK QUOTES
// ══════════════════════════════════════════════════
const QUOTES = [
  '"เกรด 1.98 กับเส้นโปร 2.00 ห่างกันแค่ A เดียว" – ขอให้ได้',
  '"วิศวะไม่ได้ฆ่าคน มันแค่ทำให้คนแข็งแกร่งขึ้น" – บางครั้งก็ไม่แน่ใจ',
  '"ถ้าผ่านวิชา Mechanical Behavior ได้ อะไรก็ผ่านได้" – รุ่นพี่วิศวะวัสดุ',
  '"จงทนอยู่ตราบที่พ่อแม่ยังรอ" – สติที่แท้จริง',
  '"F ไม่ใช่จุดสิ้นสุด มันแค่ทำให้เส้นโค้ง GPA ลาดชัน" – ทฤษฎีล้วนๆ',
  '"ทุกวิชาที่ยากคือ Story ที่คุณจะเล่าให้ลูกฟังวันหนึ่ง" – ถ้าได้จบ',
  '"Sleep ก็ต้องการ Prerequisite: ปิดโทรศัพท์" – บทเรียนชีวิต',
  '"หน่วยกิตทุก Credit ที่ผ่านมาคือชัยชนะ" – เริ่มนับจาก 1',
];

function getTodayQuote() { return QUOTES[new Date().getDate() % QUOTES.length]; }

// ══════════════════════════════════════════════════
// WHAT-IF CALCULATOR
// ══════════════════════════════════════════════════
function calcWhatIf(changes) {
  // changes = [{courseId, grade}]
  const overrides = {};
  changes.forEach(c => overrides[c.courseId] = c.grade);
  let pts = 0, cr = 0;
  state.semesters.forEach(s => {
    (state.courses[s.id] || []).forEach(c => {
      const g = GRADE_PTS[overrides[c.id] ?? c.grade];
      if (g !== null && g !== undefined && (overrides[c.id] ?? c.grade) !== 'W' && (overrides[c.id] ?? c.grade) !== 'P') {
        pts += g * c.credits; cr += c.credits;
      }
    });
  });
  return cr > 0 ? (pts / cr).toFixed(2) : '-';
}

function neededGPA(targetGPA) {
  // คำนวณว่าต้องได้ GPA เทอมนี้เท่าไหร่เพื่อให้ GPAX ถึง target
  const curSem = getCurrentSemester();
  if (!curSem) return null;
  const curCourses = state.courses[curSem.id] || [];
  const curCr = curCourses.reduce((s, c) => s + c.credits, 0);
  // GPAX_new = (GPAX_old * cr_old + GPA_new * cr_new) / (cr_old+cr_new)
  let oldPts = 0, oldCr = 0;
  state.semesters.forEach(s => {
    if (s.id === curSem.id) return;
    (state.courses[s.id] || []).forEach(c => {
      const g = GRADE_PTS[c.grade];
      if (g !== null && g !== undefined && c.grade !== 'W' && c.grade !== 'P') { oldPts += g * c.credits; oldCr += c.credits; }
    });
  });
  if (curCr === 0) return null;
  const needed = (parseFloat(targetGPA) * (oldCr + curCr) - oldPts) / curCr;
  return needed.toFixed(2);
}

// ══════════════════════════════════════════════════
// SEARCH
// ══════════════════════════════════════════════════
function globalSearch(q) {
  if (!q) return [];
  q = q.toLowerCase();
  const results = [];
  Object.values(state.courses).flat().forEach(c => {
    if (c.code?.toLowerCase().includes(q) || c.nameTh?.toLowerCase().includes(q) || c.nameEn?.toLowerCase().includes(q))
      results.push({ type: 'course', item: c, label: `📚 ${c.code} — ${c.nameTh}` });
  });
  Object.values(state.assignments).flat().forEach(a => {
    if (a.title?.toLowerCase().includes(q)) results.push({ type: 'assign', item: a, label: `📋 ${a.title} — ${a.courseName}` });
  });
  Object.values(state.exams).flat().forEach(e => {
    if (e.title?.toLowerCase().includes(q)) results.push({ type: 'exam', item: e, label: `📝 ${e.title}` });
  });
  ALL_COURSES.forEach(c => {
    if (c.code?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q) || c.nameEn?.toLowerCase().includes(q))
      results.push({ type: 'db_course', item: c, label: `🗃 ${c.code} — ${c.name} (ฐานข้อมูล)` });
  });
  return results.slice(0, 12);
}

// ══════════════════════════════════════════════════
// PREREQUISITE CHECKER
// ══════════════════════════════════════════════════
function checkPrereqs(courseCode) {
  const dbCourse = ALL_COURSES.find(c => c.code === courseCode);
  if (!dbCourse || !dbCourse.prereq || dbCourse.prereq.length === 0) return { ok: true, missing: [] };
  const passedCodes = new Set();
  state.semesters.forEach(s => {
    (state.courses[s.id] || []).forEach(c => {
      if (c.grade && c.grade !== 'F' && c.grade !== 'W' && c.grade !== 'N') passedCodes.add(c.code);
    });
  });
  const missing = dbCourse.prereq.filter(p => !passedCodes.has(p));
  return { ok: missing.length === 0, missing };
}

// ══════════════════════════════════════════════════
// AUTO-COMPLETE for course search
// ══════════════════════════════════════════════════
function searchCourseDB(q) {
  if (!q || q.length < 2) return [];
  q = q.toLowerCase();
  return ALL_COURSES.filter(c => c.code?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q) || c.nameEn?.toLowerCase().includes(q)).slice(0, 8);
}

function getLockScreenTemplate() {
  return `
    <div class="numpad-container">
      <div class="num-grid">
        <button class="num-btn" data-num="1"><span class="n">1</span><span class="l"></span></button>
        <button class="num-btn" data-num="2"><span class="n">2</span><span class="l">ABC</span></button>
        <button class="num-btn" data-num="3"><span class="n">3</span><span class="l">DEF</span></button>
        <button class="num-btn" data-num="4"><span class="n">4</span><span class="l">GHI</span></button>
        <button class="num-btn" data-num="5"><span class="n">5</span><span class="l">JKL</span></button>
        <button class="num-btn" data-num="6"><span class="n">6</span><span class="l">MNO</span></button>
        <button class="num-btn" data-num="7"><span class="n">7</span><span class="l">PQRS</span></button>
        <button class="num-btn" data-num="8"><span class="n">8</span><span class="l">TUV</span></button>
        <button class="num-btn" data-num="9"><span class="n">9</span><span class="l">WXYZ</span></button>
        <button class="num-btn" data-num="0" style="grid-column: span 3;"><span class="n">0</span></button>
      </div>
      <div style="margin-top: 30px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
        <button id="showIdOnLock" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 16px 32px; border-radius: 50px; font-weight: 600; width: 100%; max-width: 260px; cursor: pointer; transition: all 0.3s;">
          🪪 Digital Student ID
        </button>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════
// GRADE REPORT EXPORT
// ══════════════════════════════════════════════════
function exportGradeReport() {
  const gpa = getCumGPA();
  const pro = getProStatus(gpa);
  const proLabels = { safe: 'ปลอดภัย ✅', 'pro-low': 'ติดโปรต่ำ ⚠️', 'pro-high': 'ติดโปรสูง 🚨', 'expelled': 'พ้นสภาพ ❌' };
  let html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><style>
    body{font-family:Sarabun,sans-serif;padding:32px;color:#111;max-width:700px;margin:auto;}
    h1{color:#1a56db;font-size:22px;} h2{color:#374151;font-size:16px;margin:20px 0 8px;}
    .gpax{font-size:32px;font-weight:700;color:#1a56db;} .pro{font-weight:600;font-size:18px;}
    .warn{color:#c00;} table{width:100%;border-collapse:collapse;font-size:13px;}
    th,td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left;}
    th{background:#f9fafb;font-weight:600;} .badge{display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;}
    .A{background:#dcfce7;color:#15803d;} .Bplus,.B{background:#dbeafe;color:#1d4ed8;}
    .Cplus,.C{background:#fef9c3;color:#b45309;} .D{background:#ffedd5;color:#c2410c;} .F{background:#fee2e2;color:#b91c1c;}
    @media print{body{padding:16px;}}
    /* --- Course Hub Premium Header --- */
    .hub-hero {
      position: relative;
      padding: 40px 20px;
      background: linear-gradient(135deg, var(--c-indigo), #9333ea);
      color: white;
      border-radius: 0 0 32px 32px;
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .hub-hero::before {
      content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: drift 20s infinite linear;
    }
    @keyframes drift { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    
    .hub-hero-content { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 20px; }
    .hub-hero-badge {
      width: 80px; height: 80px; border-radius: 24px; background: rgba(255,255,255,0.2);
      backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 800; border: 1px solid rgba(255,255,255,0.3);
    }
    .hub-hero-text h1 { font-family: var(--font-heading); font-size: 28px; line-height: 1.2; margin-bottom: 4px; }
    .hub-hero-text p { opacity: 0.8; font-size: 14px; }

    /* --- Mini Drive Advanced --- */
    .drive-container { display: flex; flex-direction: column; gap: 15px; height: 100%; padding: 0 20px 20px; }
    .drive-toolbar {
      display: flex; justify-content: space-between; align-items: center; padding: 12px 20px;
      background: var(--glass-bg); backdrop-filter: blur(12px); border-radius: 16px; border: 1px solid var(--glass-border);
      gap: 10px; flex-wrap: wrap; margin-bottom: 10px;
    }
    .drive-tools { display: flex; gap: 8px; }
    .tool-btn {
      width: 40px; height: 40px; border-radius: 10px; border: none; background: rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer;
      transition: all 0.2s; color: inherit;
    }
    .tool-btn:hover { background: var(--c-accent); color: white; transform: translateY(-2px); }
    .tool-btn.danger:hover { background: var(--c-rust); }
    
    .explorer-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px;
      padding: 10px 0; overflow-y: auto;
    }
    .file-item {
      position: relative; background: var(--glass-bg); border: 1px solid var(--glass-border);
      border-radius: 16px; padding: 20px 10px; display: flex; flex-direction: column;
      align-items: center; text-align: center; gap: 10px; transition: all 0.2s; cursor: pointer;
    }
    .file-item:hover { transform: translateY(-5px); border-color: var(--c-accent); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
    .file-item.selected { background: rgba(99, 102, 241, 0.1); border-color: var(--c-accent); }
    .file-icon { font-size: 40px; }
    .file-name { font-size: 12px; font-weight: 600; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    
    .sel-checkbox {
      position: absolute; top: 10px; right: 10px; width: 18px; height: 18px;
      border-radius: 4px; border: 2px solid var(--glass-border); background: white;
      display: flex; align-items: center; justify-content: center; font-size: 12px; color: white;
    }
    .file-item.selected .sel-checkbox { background: var(--c-accent); border-color: var(--c-accent); }
    .file-item.selected .sel-checkbox::after { content: '✓'; }

    /* --- Nested Topic Mastery --- */
    .topic-branch { border-left: 2px solid var(--glass-border); margin-left: 10px; padding-left: 15px; display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .topic-item {
      display: flex; justify-content: space-between; align-items: center; background: var(--glass-bg);
      border: 1px solid var(--glass-border); padding: 12px 15px; border-radius: 12px;
    }
    .topic-meta { display: flex; gap: 8px; align-items: center; }
    .topic-lvl-badge { width: 8px; height: 8px; border-radius: 50%; }

    /* --- File Preview Modal --- */
    .preview-frame { width: 100%; height: 70vh; border-radius: 12px; border: none; background: white; }

    /* --- Glass Buttons --- */
    .btn-premium {
      background: var(--c-accent); color: white; border: none; padding: 12px 24px;
      border-radius: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 20px var(--c-accent-glow);
      transition: all 0.3s; display: flex; align-items: center; gap: 8px;
    }
    .btn-premium:hover { transform: scale(1.05); filter: brightness(1.1); }
  </style></head><body>
  <h1>⚗ ใบสรุปผลการเรียน — ${STUDENT.nameTh}</h1>
  <p>รหัสนิสิต: ${STUDENT.id} | สาขา: วิศวกรรมวัสดุ | ม.เกษตรศาสตร์</p>
  <p>GPAX สะสม: <span class="gpax">${gpa}</span> &nbsp;
  <span class="pro ${pro === 'safe' ? '' : ' warn'}">${pro ? proLabels[pro] : '-'}</span></p>
  <p>หน่วยกิตที่ผ่าน: ${getTotalPassedCredits()} / 137 หน่วยกิต</p>`;

  state.semesters.forEach(s => {
    const courses = state.courses[s.id] || [];
    const semGPA = calcGPAFromList(courses);
    html += `<h2>${s.name} — GPA: ${semGPA}</h2>
    <table><tr><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>หน่วยกิต</th><th>เกรด</th></tr>
    ${courses.map(c => `<tr><td style="font-family:monospace">${c.code}</td><td>${c.nameTh}</td><td style="text-align:center">${c.credits}</td>
    <td style="text-align:center"><span class="badge ${c.grade?.replace('+', 'plus') || ''}">${c.grade || '-'}</span></td></tr>`).join('')}
    </table>`;
  });
  html += `<p style="margin-top:24px;font-size:12px;color:#6b7280">สร้างโดย NITIPAT MANAGER • ${new Date().toLocaleDateString('th-TH')}</p></body></html>`;
  const b = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `grade_report_${Date.now()}.html`; a.click();
  showToast('📄 ดาวน์โหลดใบสรุปเกรดแล้ว');
}

// ══════════════════════════════════════════════════
// CANVAS SCHEDULE EXPORT
// ══════════════════════════════════════════════════
function exportScheduleAsImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  // Background gradient
  const grd = ctx.createLinearGradient(0, 0, 0, 1920);
  grd.addColorStop(0, '#e0e7ff'); grd.addColorStop(1, '#f0f4ff');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 1080, 1920);
  // Title
  ctx.fillStyle = '#1a1a2e'; ctx.font = 'bold 48px Kanit'; ctx.textAlign = 'center';
  ctx.fillText('ตารางเรียนของฉัน', 540, 80);
  const curSem = state.selectedSemester ? state.semesters.find(s => s.id === state.selectedSemester) : getCurrentSemester();
  if (curSem) { ctx.font = '32px Kanit'; ctx.fillStyle = '#4f46e5'; ctx.fillText(curSem.name, 540, 130); }
  // Days header
  const days = ['จ', 'อ', 'พ', 'พฤ', 'ศ'];
  const cellW = 200, cellH = 80, startX = 80, startY = 170;
  ctx.font = 'bold 28px Kanit'; ctx.fillStyle = '#312e81';
  days.forEach((d, i) => { ctx.textAlign = 'center'; ctx.fillText(d, startX + (i + 0.5) * cellW, startY + 40); });
  // Hours
  for (let h = 8; h <= 19; h++) {
    const y = startY + 60 + (h - 8) * cellH;
    ctx.font = '22px JetBrains Mono'; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'right';
    ctx.fillText(`${h}:00`, startX - 8, y + cellH / 2 + 8);
    // Grid lines
    ctx.strokeStyle = '#e0e7ff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(startX + 5 * cellW, y); ctx.stroke();
  }
  // Courses
  const courses = curSem ? (state.courses[curSem.id] || []) : [];
  courses.forEach(c => {
    (c.schedule || []).forEach(slot => {
      const x = startX + slot.day * cellW;
      const y = startY + 60 + (slot.startHour - 8) * cellH;
      const h = (slot.endHour - slot.startHour) * cellH;
      ctx.fillStyle = (c.color || '#4f46e5') + 'cc';
      roundRect(ctx, x + 2, y + 2, cellW - 4, h - 4, 12);
      ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Kanit'; ctx.textAlign = 'center';
      ctx.fillText(c.code, x + cellW / 2, y + h / 2);
    });
  });
  ctx.font = '20px Kanit'; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'center';
  ctx.fillText('NITIPAT MANAGER • ม.เกษตรศาสตร์', 540, 1880);
  canvas.toBlob(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'schedule.png'; a.click(); });
  showToast('📸 บันทึกตารางเรียนเป็นรูปแล้ว');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

// ══════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════
function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
}

// ══════════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════════
function openModal(title, body, footer = '') {
  state.modal = { title, body, footer }; render();
  setTimeout(() => document.querySelector('.modal')?.classList.add('show'), 10);
}
function closeModal() { state.modal = null; render(); }

// ══════════════════════════════════════════════════
// RENDER ENGINE & LAYOUT REDESIGN
// ══════════════════════════════════════════════════
function getTodayDayIndex() {
  return (new Date().getDay() + 6) % 7; // 0=Mon, 1=Tue...
}

function getMissingReflections() {
  const now = new Date();
  const dayIdx = getTodayDayIndex();
  const currentTimeVal = now.getHours() + (now.getMinutes() / 60);
  const curSem = getCurrentSemester();
  if (!curSem) return [];

  const todayClasses = (state.courses[curSem.id] || []).flatMap(c =>
    (c.schedules || c.schedule || []).filter(s => s.day === dayIdx).map(s => ({ ...c, slot: s }))
  );

  return todayClasses.filter(c => {
    const reflection = state.reflections[c.id] || "";
    return currentTimeVal >= c.slot.endHour && reflection.trim().length < 10;
  });
}

function render() {
  if (state.isInitializing) return;
  // FIX 2: 30-minute Auto-Lock Security Check
  const unlockedAt = sessionStorage.getItem('unlocked_at');
  if (unlockedAt && Date.now() - parseInt(unlockedAt) > 1800000) { // 1800000ms = 30 mins
    sessionStorage.removeItem('unlocked');
    sessionStorage.removeItem('unlocked_at');
    state.isLocked = true;
  }

  const app = document.getElementById('app');
  if (!app) return;

  document.body.classList.toggle('is-focus-immersive', state.isImmersiveFocus && state.pomodoroActive);

  if (state.isLocked) {
    const gate = document.getElementById('login-gate');
    if (gate && gate.classList.contains('inactive')) {
      gate.classList.remove('inactive');
      LoginGate.init();
    }
    app.innerHTML = '<div style="height:100vh; background:var(--bg);"></div>'; 
    return;
  }

  const gpa = getCumGPA();
  const pro = getProStatus(gpa);
  const curSem = getCurrentSemester();

  // Save scroll positions of all scrollable containers in the app
  const scrollPositions = {};
  const scrollableElements = app.querySelectorAll('*');
  scrollableElements.forEach((el, idx) => {
    if (el.scrollTop > 0 || el.scrollLeft > 0) {
      scrollPositions[idx] = { top: el.scrollTop, left: el.scrollLeft };
    }
  });
  const windowScrollTop = window.scrollY;
  const windowScrollLeft = window.scrollX;

  app.innerHTML = `
    <div class="app-container">
      ${renderStatusBanner()}
      ${renderTopNav(gpa, pro, curSem)}
      <div class="page-content" id="pageContent">
        ${renderPage(gpa, pro, curSem)}
      </div>
      ${renderFloatingNav()}
    </div>
    ${renderFAB()}
    ${state.modal ? renderModal() : ''}
  `;

  // Restore scroll positions of all scrollable containers
  const newScrollableElements = app.querySelectorAll('*');
  newScrollableElements.forEach((el, idx) => {
    if (scrollPositions[idx]) {
      el.scrollTop = scrollPositions[idx].top;
      el.scrollLeft = scrollPositions[idx].left;
    }
  });
  window.scrollTo(windowScrollLeft, windowScrollTop);

  attachAllEvents();
  if (state.pomodoroActive) updatePomodoroDisplay();
  if (state.view === 'dashboard') renderGPAXChart();
}


function renderStatusBanner() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const currentTimeVal = h + (m / 60);
  const curSem = getCurrentSemester();

  let activeClass = null;
  let nextClass = null;

  if (curSem) {
    const adjustedDay = getTodayDayIndex();
    const todayClasses = (state.courses[curSem.id] || []).flatMap(c =>
      (c.schedules || c.schedule || []).filter(s => s.day === adjustedDay).map(s => ({ ...c, slot: s }))
    ).sort((a, b) => a.slot.startHour - b.slot.startHour);

    activeClass = todayClasses.find(c => currentTimeVal >= c.slot.startHour && currentTimeVal < c.slot.endHour);
    nextClass = todayClasses.find(c => c.slot.startHour > currentTimeVal);
  }

  if (activeClass) {
    const remainingMins = Math.round((activeClass.slot.endHour - currentTimeVal) * 60);
    return `
      <div class="status-banner live" onclick="renderCourseHub('${activeClass.id}')">
        <span class="sb-icon">📖</span>
        <span class="sb-text">กำลังเรียน: <strong>${activeClass.code}</strong> (เหลือ ${remainingMins} นาที)</span>
        <span class="sb-arrow">→</span>
      </div>`;
  } else if (nextClass) {
    const diffMins = Math.round((nextClass.slot.startHour - currentTimeVal) * 60);
    const diffHours = Math.floor(diffMins / 60);
    const displayTime = diffHours > 0 ? `${diffHours} ชม. ${diffMins % 60} นาที` : `${displayTime} นาที`;
    return `
      <div class="status-banner next">
        <span class="sb-icon">⏳</span>
        <span class="sb-text">คลาสถัดไป: <strong>${nextClass.code}</strong> ในอีก ${displayTime}</span>
      </div>`;
  }
  return '';
}

window.showCourseDetailsModal = (code) => {
  const c = ALL_COURSES.find(x => x.code === code);
  if (!c) return;
  openModal(`📘 รายละเอียดวิชา: ${c.code}`, `
    <div style="padding:10px;">
      <h3 style="margin-bottom:10px;">${c.name}</h3>
      <p style="font-size:14px; opacity:0.8; margin-bottom:15px;">${c.nameEn || ''}</p>
      <div style="display:flex; gap:10px; margin-bottom:20px;">
        <span class="badge" style="background:var(--c-indigo); color:white; padding:4px 10px; border-radius:8px;">${c.credits} หน่วยกิต</span>
        <span class="badge" style="background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:8px;">${c.group || 'หมวดหลัก'}</span>
      </div>
      <div style="font-size:14px; line-height:1.6; background:rgba(0,0,0,0.03); padding:15px; border-radius:12px;">
        <strong>คำอธิบายรายวิชา:</strong><br>
        ${c.description || 'ไม่มีข้อมูลคำอธิบายรายวิชาในระบบ'}
      </div>
      ${c.prereq && c.prereq.length > 0 ? `<div style="margin-top:15px; font-size:13px; color:var(--c-rust); font-weight:700;">วิชาที่ต้องเรียนมาก่อน: ${c.prereq.join(', ')}</div>` : ''}
    </div>
  `);
};


function renderGPAXChart() {
  const container = document.getElementById('gpaxChart');
  if (!container) return;

  const semesters = state.semesters.filter(s => (state.courses[s.id] || []).some(c => c.grade));
  if (semesters.length < 1) {
    container.innerHTML = '<div class="empty-sm">ข้อมูลไม่เพียงพอในการสร้างกราฟ</div>';
    return;
  }

  const data = semesters.map(s => parseFloat(calcGPAFromList(state.courses[s.id] || [])));
  const labels = semesters.map(s => s.name);

  const width = container.clientWidth || 300;
  const height = 120;
  const padding = 20;

  const xStep = (width - padding * 2) / (Math.max(1, data.length - 1));
  const getY = (val) => height - padding - ((val / 4) * (height - padding * 2));

  let points = data.map((v, i) => `${padding + i * xStep},${getY(v)}`).join(' ');

  const thresholdY2 = getY(2.0);
  const thresholdY175 = getY(1.75);

  container.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%; height:${height}px;">
      <line x1="${padding}" y1="${thresholdY2}" x2="${width - padding}" y2="${thresholdY2}" stroke="#22c55e" stroke-dasharray="4" stroke-opacity="0.5" />
      <line x1="${padding}" y1="${thresholdY175}" x2="${width - padding}" y2="${thresholdY175}" stroke="#ef4444" stroke-dasharray="4" stroke-opacity="0.5" />
      <polyline points="${points}" fill="none" stroke="var(--c-accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      ${data.map((v, i) => `
        <circle cx="${padding + i * xStep}" cy="${getY(v)}" r="4" fill="var(--c-accent)" />
        <text x="${padding + i * xStep}" y="${height - 5}" text-anchor="middle" font-size="8" fill="var(--text)" opacity="0.6">${labels[i].substring(0, 6)}</text>
      `).join('')}
    </svg>`;
}

function renderLockScreen() {
  return `<style>
    .realistic-lock { background: rgba(10, 10, 10, 0.75) !important; backdrop-filter: blur(30px) saturate(150%); -webkit-backdrop-filter: blur(30px) saturate(150%); color: white; display: flex !important; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; align-items: center; justify-content: center; }
    .realistic-lock .lock-content { text-align: center; width: 100%; max-width: 320px; padding: 20px; animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    .realistic-pin { display: flex; justify-content: center; gap: 20px; margin: 25px 0 45px; }
    .realistic-pin .pin-dot { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid rgba(255, 255, 255, 1); background: transparent; transition: all 0.15s ease-out; }
    .realistic-pin .pin-dot.active { background: white; border-color: white; transform: scale(1.1); }
    .realistic-numpad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px 25px; place-items: center; }
    .realistic-numpad .num-btn { width: 75px; height: 75px; border-radius: 50%; background: rgba(255, 255, 255, 0.15); border: none; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.1s; padding: 0; -webkit-tap-highlight-color: transparent; }
    .realistic-numpad .num-btn:active { background: rgba(255, 255, 255, 0.4); transform: scale(0.92); }
    .realistic-numpad .num-btn .n { font-size: 34px; font-weight: 400; line-height: 1; margin-top: 4px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .realistic-numpad .num-btn .l { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; margin-top: 3px; opacity: 0.8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .realistic-numpad .num-btn.action { background: transparent; font-size: 16px; font-weight: 500; }
    .realistic-numpad .num-btn.action:active { background: transparent; opacity: 0.4; transform: scale(0.92); }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .lock-content.shake { animation: shakeLock 0.4s; }
    @keyframes shakeLock { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
      </style>
      <div class="lock-screen realistic-lock">
    <div class="lock-content">
      <div class="lock-icon" style="margin: 0 auto 15px; display: flex; justify-content: center; align-items: center; color: white;">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </div>
      <h2 style="margin-bottom:6px; font-size: 20px; font-weight: 500; color: white;">ป้อนรหัส</h2>
      <p style="font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 25px;">NITIPAT MANAGER</p>
      <div class="pin-display realistic-pin">
        <span class="pin-dot"></span><span class="pin-dot"></span><span class="pin-dot"></span>
        <span class="pin-dot"></span><span class="pin-dot"></span><span class="pin-dot"></span>
      </div>
      <div class="numpad realistic-numpad">
        <button class="num-btn" data-num="1"><span class="n">1</span><span class="l">&nbsp;</span></button>
        <button class="num-btn" data-num="2"><span class="n">2</span><span class="l">A B C</span></button>
        <button class="num-btn" data-num="3"><span class="n">3</span><span class="l">D E F</span></button>
        <button class="num-btn" data-num="4"><span class="n">4</span><span class="l">G H I</span></button>
        <button class="num-btn" data-num="5"><span class="n">5</span><span class="l">J K L</span></button>
        <button class="num-btn" data-num="6"><span class="n">6</span><span class="l">M N O</span></button>
        <button class="num-btn" data-num="7"><span class="n">7</span><span class="l">P Q R S</span></button>
        <button class="num-btn" data-num="8"><span class="n">8</span><span class="l">T U V</span></button>
        <button class="num-btn" data-num="9"><span class="n">9</span><span class="l">W X Y Z</span></button>
        <button class="num-btn action" id="pinClear">ยกเลิก</button>
        <button class="num-btn" data-num="0"><span class="n">0</span><span class="l">&nbsp;</span></button>
        <button class="num-btn action" id="pinDel">ลบ</button>
      </div>
      <div style="margin-top: 45px; display: flex; flex-direction: column; align-items: center; gap: 15px;">
        <button class="btn-glass-primary full" id="showIdOnLock" style="padding: 18px 40px; border-radius: 40px; font-weight: 700; width: 100%; max-width: 280px; box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);">
          🪪 Digital Student ID
        </button>
        <p style="font-size: 11px; opacity: 0.5; color: white;">กดเพื่อแสดง Barcode เข้าห้องสมุด</p>
      </div>
    </div>
  </div>`;
}

function attachLockScreenEvents() {
  const pins = document.querySelectorAll('.pin-dot');
  const numPad = document.querySelectorAll('.num-btn[data-num]');
  const pinClear = document.getElementById('pinClear');
  const pinDel = document.getElementById('pinDel');
  const showIdBtn = document.getElementById('showIdOnLock');
  let currentInput = "";

  const updateDots = () => {
    pins.forEach((dot, i) => {
      dot.classList.toggle('active', i < currentInput.length);
    });
  };

  numPad.forEach(btn => {
    btn.onclick = async () => {
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
      if (currentInput.length < 6) {
        currentInput += btn.dataset.num;
        updateDots();
        if (currentInput.length === 6) {
          const isValid = await verifyPIN(currentInput, state.pin, state.pinSalt);
          if (isValid) {
            sessionStorage.setItem('unlocked', 'true');
            sessionStorage.setItem('unlocked_at', Date.now().toString());
            state.isLocked = false;
            showToast('🔓 ยินดีต้อนรับกลับมา');
            render();
          } else {
            showToast('❌ รหัส PIN ไม่ถูกต้อง', 'err');
            currentInput = "";
            updateDots();
          }
        }
      }
    };
  });

  if (pinClear) pinClear.onclick = () => { 
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
    currentInput = ""; 
    updateDots(); 
  };
  if (pinDel) pinDel.onclick = () => { 
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
    currentInput = currentInput.slice(0, -1); 
    updateDots(); 
  };

  if (showIdBtn) showIdBtn.onclick = () => {
    openModal('🪪 บัตรนิสิต (Digital ID)', `
      <div style="text-align:center; padding:20px;">
        <div style="font-size:18px; font-weight:800; margin-bottom:10px;">${STUDENT.nameTh}</div>
        <div style="font-size:14px; opacity:0.7; margin-bottom:20px;">${STUDENT.id}</div>
        <div style="background:white; padding:15px; border-radius:12px; border:2px solid black;">
          <img src="https://barcode.tec-it.com/barcode.ashx?data=${STUDENT.id}&code=Code128&translate-esc=true" 
               style="width:100%; height:auto; max-height:100px;" alt="Barcode">
        </div>
        <div style="margin-top:15px; font-size:12px; font-weight:700; color:var(--c-rust);">* ใช้สำหรับสแกนเข้าห้องสมุดหรือติดต่อธุรการ</div>
      </div>
    `);
  };

  document.getElementById('modalX')?.addEventListener('click', closeModal);
  document.getElementById('modalBd')?.addEventListener('click', e => { if (e.target.id === 'modalBd') closeModal(); });
}
function renderTopNav(gpa, pro, curSem) {
  const proColors = { safe: '#22c55e', 'pro-low': '#eab308', 'pro-high': '#f97316', 'expelled': '#ef4444' };
  const statusColor = pro ? proColors[pro] : '#94a3b8';
  return `<nav class="top-nav glass">
    <div class="tn-left">
      <div class="brand-orb sm">⚗</div>
      <div class="tn-brand">NITIPAT</div>
    </div>
    <div class="tn-center search-bar-wrap">
      <div class="search-glass">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="globalSearch" placeholder="ค้นหาวิชา งาน สอบ..." value="${state.searchQuery}">
        ${state.searchQuery ? `<button class="search-clear" id="clearSearch">✕</button>` : ''}
      </div>
      ${state.searchQuery ? `<div class="search-results" id="searchResults">
        ${globalSearch(state.searchQuery).map(r => `<div class="search-result-item" data-type="${r.type}" data-id="${r.item.id || r.item.code}">${r.label}</div>`).join('') || '<div class="search-empty">ไม่พบผลลัพธ์</div>'}
      </div>`: ''}
    </div>
    <div class="tn-right">
      <button class="icon-btn ${state.notionConnected ? 'active' : ''}" onclick="NotionHub.sync(true)" title="Notion Sync" style="position:relative;">
        <span style="font-size:16px;">${state.notionSyncing ? '⌛' : 'N'}</span>
        ${state.notionConnected ? '<span style="position:absolute; bottom:0; right:0; width:6px; height:6px; background:#22c55e; border-radius:50%;"></span>' : ''}
      </button>
      <button class="icon-btn" onclick="showIDCardModal()" style="font-size:18px;">🪪</button>
      <div class="gpa-pill" style="border-color:${statusColor}55; background:${statusColor}11;">
        <span class="gp-lbl">GPAX</span>
        <span class="gp-val" style="color:${statusColor}">${gpa}</span>
      </div>
      <button class="icon-btn" id="navMenuBtn">☰</button>
    </div>
  </nav>
  <div class="fullscreen-menu glass-heavy" id="fullMenu">
    <div class="fm-header"><button class="icon-btn" id="closeMenuBtn">✕</button></div>
    <div class="fm-grid">
      ${[
      { id: 'dashboard', icon: '◈', label: 'Dashboard' }, { id: 'semesters', icon: '📅', label: 'เทอมการศึกษา' },
      { id: 'courses', icon: '📚', label: 'รายวิชา' }, { id: 'schedule', icon: '▦', label: 'ตารางเรียน' },
      { id: 'assignments', icon: '📋', label: 'การบ้าน' }, { id: 'exams', icon: '📝', label: 'ตารางสอบ' },
      { id: 'grades', icon: '🎓', label: 'เกรด & GPA' }, { id: 'roadmap', icon: '🗺', label: 'Roadmap 4 ปี' },
      { id: 'focus', icon: '🍅', label: 'Focus Mode' }, { id: 'club', icon: '🏛', label: 'งานชุมนุม' },
      { id: 'calendar', icon: '🗓', label: 'ปฏิทินการศึกษา' },
      { id: 'money-pod', icon: '🐽', label: 'MoneyPod' },
      { id: 'settings', icon: '⚙️', label: 'ตั้งค่า' }
    ].map(n => `<button class="fm-item ${state.view === n.id ? 'active' : ''}" data-nav="${n.id}">
        <span class="fm-ic">${n.icon}</span><span class="fm-lbl">${n.label}</span>
      </button>`).join('')}
    </div>
  </div>`;
}

function renderFloatingNav() {
  const items = [
    { id: 'dashboard', icon: '◈' }, { id: 'courses', icon: '📚' },
    { id: 'assignments', icon: '📋' }, { id: 'money-pod', icon: '🐽' }, { id: 'focus', icon: '🍅' }
  ];
  return `<nav class="floating-dock glass">
    ${items.map(n => `<button class="dock-item ${state.view === n.id ? 'active' : ''}" data-nav="${n.id}">
      <span class="dock-icon">${n.icon}</span>
    </button>`).join('')}
  </nav>`;
}

function renderFAB() {
  return `<div class="fab-wrap">
    <button class="fab-main" id="fabBtn">+</button>
    <div class="fab-menu" id="fabMenu">
      <button class="fab-item" data-quick="assignment">📋 การบ้าน</button>
      <button class="fab-item" data-quick="exam">📝 การสอบ</button>
      <button class="fab-item" data-quick="course">📚 วิชา</button>
      <button class="fab-item" data-quick="club">🏛 งานชุมนุม</button>
    </div>
  </div>`;
}

function renderModal() {
  return `<div class="modal-backdrop" id="modalBd">
    <div class="modal glass-heavy">
      <div class="modal-hd">
        <div class="modal-title">${state.modal.title}</div>
        <button class="modal-x" id="modalX">✕</button>
      </div>
      <div class="modal-body">${state.modal.body}</div>
      ${state.modal.footer ? `<div class="modal-ft">${state.modal.footer}</div>` : ''}
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════
// PAGE RENDERER
// ══════════════════════════════════════════════════
function renderPage(gpa, pro, curSem) {
  switch (state.view) {
    case 'dashboard': return renderDashboard(gpa, pro, curSem);
    case 'semesters': return renderSemesters();
    case 'courses': return renderCourses();
    case 'schedule': return renderSchedule();
    case 'assignments': return renderAssignments();
    case 'exams': return renderExams();
    case 'grades': return renderGrades(gpa, pro);
    case 'roadmap': return renderRoadmap();
    case 'focus': return renderFocus();
    case 'club': return renderClub();
    case 'money-pod': return renderMoneyPod();
    case 'calendar': return renderCalendar();
    case 'settings': return renderSettings();
    case 'course-hub': return renderCourseHubPage();
    case 'alarm': return renderAlarmPage();
    default: return renderDashboard(gpa, pro, curSem);
  }
}

function renderCourseHubPage() {
  const c = findCourseById(state.activeCourseId);
  if (!c) { state.view = 'courses'; return renderCourses(); }
  const tab = state.activeHubTab || 'Files';

  const history = state.attendanceHistory[c.id] || {};
  const dates = Object.keys(history);
  const totalAtt = dates.length;
  let attendCount = 0;
  Object.values(history).forEach(h => {
    if (!h.status.includes('ขาดเรียน')) attendCount++;
  });
  const attRate = totalAtt > 0 ? ((attendCount / totalAtt) * 100).toFixed(0) : 0;
  const pendingAss = Object.values(state.assignments).flat().filter(a => a.courseId === c.id && a.status !== 'completed' && a.status !== 'done').length;
  const upcomingExams = Object.values(state.exams).flat().filter(e => e.courseId === c.id && new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)));
  let nextExamDays = '--';
  if (upcomingExams.length > 0) {
    upcomingExams.sort((a, b) => new Date(a.date) - new Date(b.date));
    const d = Math.ceil((new Date(upcomingExams[0].date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    nextExamDays = d <= 0 ? 'วันนี้!' : `${d} วัน`;
  }
  const currentGrade = c.grade && c.grade !== '-' && c.grade !== 'I' ? c.grade : (state.scores?.[c.id]?.reduce((a, b) => a + (b.score || 0), 0) || 0) + '%';

  return `
        <div class="course-hub-premium" style="background:transparent; min-height:100vh; font-family:'Kanit', sans-serif;">
          <div class="hub-hero" style="padding: 20px 20px 15px; position:relative; z-index:10;">
            <button class="tool-btn sm" style="position:absolute; top:20px; left:10px; background:transparent; border:none; color:#1e293b; font-size:24px; box-shadow:none; padding:5px; line-height:1;" onclick="state.view='courses'; render();">←</button>
            
            <div class="hub-hero-text" style="width: 100%; margin-top:35px; color:#1e293b;">
              <p style="font-size:16px; margin-bottom:2px; font-weight:500; color:#0f172a;">01</p>
              <p style="font-size:16px; margin-bottom:5px; font-weight:500; color:#0f172a;">${c.code}</p>
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h1 style="font-size:32px; font-weight:700; margin-bottom:5px; color:#0f172a; letter-spacing:-0.5px; flex:1;">${c.nameTh || c.nameEn}</h1>
                ${LiveClassHub.active && LiveClassHub.courseId === c.id ? `
                  <div class="live-status-pill" style="background:#ef4444; color:white; padding:8px 16px; border-radius:100px; font-weight:800; display:flex; align-items:center; gap:8px; animation: pulse 2s infinite;">
                    <span style="width:8px; height:8px; background:white; border-radius:50%;"></span>
                    LIVE: <span id="live-timer-display">00:00:00</span>
                  </div>
                ` : ''}
              </div>
              <p style="font-size:15px; color:#334155; margin-bottom:20px; font-weight:500;">${c.instructor || 'นายธนสิน น้ำไพศาล, นายธรรนินทร์ ทับศรี'}</p>
              
              <div class="hide-scrollbar" style="display:flex; gap:10px; font-size:12px; font-weight:700; overflow-x:auto; padding-bottom:5px; margin:0 -20px; padding:0 20px;">
                 <div style="background:#fef3c7; color:#92400e; padding:8px 14px; border-radius:12px; border:1px solid #fde68a; white-space:nowrap; display:flex; align-items:center; gap:5px;"><span style="color:#d97706;">📍</span> Attendance: ${attRate}% (${attendCount}/${totalAtt})</div>
                 <div style="background:#e0f2fe; color:#0369a1; padding:8px 14px; border-radius:12px; border:1px solid #bae6fd; white-space:nowrap; display:flex; align-items:center; gap:5px;"><span style="color:#0284c7;">📈</span> Current Grade: ${currentGrade}</div>
                 <div style="background:#f3e8ff; color:#7e22ce; padding:8px 14px; border-radius:12px; border:1px solid #e9d5ff; white-space:nowrap; display:flex; align-items:center; gap:5px;"><span style="color:#9333ea;">📝</span> Assignments: ${pendingAss}</div>
                 <div style="background:#ffe4e6; color:#be123c; padding:8px 14px; border-radius:12px; border:1px solid #fecdd3; white-space:nowrap; display:flex; align-items:center; gap:5px;"><span style="color:#e11d48;">⏰</span> Next Exam: ${nextExamDays}</div>
              </div>

              <div style="display:flex; gap:10px; margin-top:15px;">
                 ${c.link ? `<a href="${c.link}" target="_blank" class="nb-btn sm" style="flex:1; text-align:center; background:#fff; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px; font-size:12px; border:2px solid black;"><span>📹</span> ห้องเรียน</a>` : ''}
                 ${LiveClassHub.active && LiveClassHub.courseId === c.id ? 
                   `<button class="nb-btn sm danger" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; font-size:12px; border:2px solid black; background:#fee2e2; color:#b91c1c;" onclick="LiveClassHub.stop()"><span>⏹</span> จบคลาสเรียน</button>` : 
                   `<button class="nb-btn sm" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; font-size:12px; border:2px solid black; background:#ecfdf5; color:#059669;" onclick="LiveClassHub.start('${c.id}')"><span>🚀</span> เริ่มจดเลคเชอร์</button>`
                 }
                 <a href="${c.folderUrl || '#'}" target="_blank" class="nb-btn sm" style="flex:1; text-align:center; background:#fff; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px; font-size:12px; border:2px solid black;"><span>📁</span> Drive</a>
                  ${c.notionUrl ? `<a href="${c.notionUrl}" target="_blank" class="nb-btn sm" style="flex:1; text-align:center; background:#000; color:#fff; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px; font-size:12px; border:2px solid black;"><span>N</span> Notion</a>` : ''}
              </div>
            </div>
          </div>

          <div class="hub-tabs-premium" style="margin: 10px 20px 25px; display:flex; gap:12px; justify-content:center; align-items:stretch; background:rgba(255,255,255,0.4); padding:10px; border-radius:24px; backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.6);">
              <button class="nav-tab-btn ${tab === 'Files' ? 'active' : ''}" onclick="state.activeHubTab='Files'; render();">
                <div style="font-size:26px; ${tab !== 'Files' ? 'opacity:0.8;' : 'margin-bottom:2px;'}">☁️</div>
                ${tab === 'Files' ? '<div class="tab-label">Files</div>' : ''}
             </button>
             <button class="nav-tab-btn ${tab === 'Grades' ? 'active' : ''}" onclick="state.activeHubTab='Grades'; render();">
               <div style="font-size:26px; ${tab !== 'Grades' ? 'opacity:0.8;' : 'margin-bottom:2px;'}">📊</div>
               ${tab === 'Grades' ? '<div class="tab-label">Progress</div>' : ''}
             </button>
             <button class="nav-tab-btn ${tab === 'Attendance' ? 'active' : ''}" onclick="state.activeHubTab='Attendance'; render();">
               <div style="font-size:26px; ${tab !== 'Attendance' ? 'opacity:0.8;' : 'margin-bottom:2px;'}">📋</div>
               ${tab === 'Attendance' ? '<div class="tab-label">Attendance</div>' : ''}
             </button>
             <button class="nav-tab-btn ${tab === 'Settings' ? 'active' : ''}" onclick="state.activeHubTab='Settings'; render();">
               <div style="font-size:26px; ${tab !== 'Settings' ? 'opacity:0.8;' : 'margin-bottom:2px;'}">⚙️</div>
               ${tab === 'Settings' ? '<div class="tab-label">Settings</div>' : ''}
             </button>
          </div>

          <div class="hub-container">
            ${tab === 'Files' ? renderMiniDrive(c) :
      tab === 'Grades' ? renderCourseProgress(c) :
        tab === 'Attendance' ? renderCourseAttendance(c) :
          renderCourseSettings(c)}
          </div>
        </div>
      `;
}

function isGAS() {
  return window.location.hostname.includes('script.google.com') || window.location.hostname.includes('script.googleusercontent.com');
}

function isDriveSupported() {
  return isGAS();
}

function refreshExplorerOnly(courseId) {
  const exp = document.getElementById('driveExplorer');
  if (exp) {
    const c = findCourseById(courseId);
    if (c) {
      const key = state.currentFolderId || c.driveId;
      const data = state.courseFiles?.[key];
      if (data) exp.innerHTML = renderExplorerUI(courseId);
      else exp.innerHTML = '<div class="drive-loader" style="text-align:center; padding:40px;"><div class="spinner"></div><p>กำลังโหลดไฟล์...</p></div>';
    }
  }
}

async function downloadFileViaProxy(fileId, fileName) {
  showToast('⏳ กำลังเตรียมไฟล์ดาวน์โหลด...');
  google.script.run
    .withSuccessHandler(res => {
      if (res && res.success && res.base64) {
        try {
          const base64Data = res.base64;
          const parts = base64Data.split(',');
          const mime = parts[0].match(/:(.*?);/)[1];
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          
          const blob = new Blob([u8arr], { type: mime });
          const urlObj = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = urlObj;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          
          document.body.removeChild(a);
          URL.revokeObjectURL(urlObj);
          showToast('✅ ดาวน์โหลดสำเร็จ!');
        } catch (e) {
          console.error("Download conversion failed:", e);
          showToast('❌ ดาวน์โหลดไม่สำเร็จ: แปลงไฟล์ล้มเหลว', 'err');
        }
      } else {
        showToast('❌ ดาวน์โหลดไม่สำเร็จ: ' + (res?.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์'), 'err');
      }
    })
    .withFailureHandler(err => {
      showToast('❌ ดาวน์โหลดล้มเหลว: ' + err.message, 'err');
    })
    .getFileDataBase64(fileId);
}

window.downloadFileViaProxy = downloadFileViaProxy;

function renderMiniDrive(c) {
  const filesData = state.courseFiles?.[state.currentFolderId || c.driveId];
  const hasSelection = state.selectedItems.size > 0;
  const gasDisabled = !isDriveSupported() ? 'disabled style="opacity:0.5; cursor:not-allowed;" title="ต้องใช้ผ่าน Google Apps Script/Proxy"' : '';

  return `
        <div class="drive-container" style="padding: 0 20px;">
          <div class="drive-toolbar" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div class="drive-breadcrumbs" style="font-weight:600; font-size:18px; color:#1e293b; display:flex; align-items:center;">
              ${state.driveBreadcrumbs.map((b, idx) => `
                ${idx > 0 ? '<span class="breadcrumb-sep" style="margin:0 5px; opacity:0.5;">/</span>' : ''}
                <span class="breadcrumb-item" style="cursor:pointer; ${idx === state.driveBreadcrumbs.length - 1 ? 'opacity:0.5; pointer-events:none;' : ''}" onclick="gotoFolder('${c.id}', '${b.id}', '${b.name}')">${b.name === 'Root' ? 'Home' : b.name}</span>
              `).join('')}
            </div>
            <div class="drive-tools" style="display:flex; gap:12px; font-size:16px; color:#64748b;">
              ${hasSelection ? `
                <button class="icon-btn-minimal" onclick="shareSelectedItems()" title="Share">🔗</button>
                <button class="icon-btn-minimal" onclick="printSelectedItems()" title="Print">🖨</button>
                <button class="icon-btn-minimal" onclick="renameSelectedItem()" title="Rename" ${gasDisabled}>✏️</button>
                <button class="icon-btn-minimal" style="color:#ef4444;" onclick="deleteSelectedItems()" title="Delete" ${gasDisabled}>🗑</button>
                <div style="width:1px; height:20px; background:#cbd5e1; margin: 0 5px;"></div>
              ` : ''}
              <button class="icon-btn-minimal" onclick="PickerManager.openPicker('${c.id}', '${c.driveId}', (docs) => handleLinkedFiles(docs, '${c.id}'))" title="Link Study Materials" ${gasDisabled}>➕🔗</button>
              <button class="icon-btn-minimal" onclick="state.driveViewMode = state.driveViewMode === 'list' ? 'grid' : 'list'; render();" title="Toggle View">${state.driveViewMode === 'list' ? '⊞' : '☰'}</button>
              <button class="icon-btn-minimal" onclick="handleCreateFolder('${c.id}')" title="New Folder" ${gasDisabled}>📁+</button>
              <button class="icon-btn-minimal" onclick="handleFileUpload('${c.id}')" title="Upload" ${gasDisabled}>↑</button>
              <button class="icon-btn-minimal" onclick="refreshDriveFiles('${c.id}')" title="Refresh" ${gasDisabled}>🔄</button>
            </div>
          </div>
          
          <div class="drive-explorer" id="driveExplorer">
            ${c.driveId ? (filesData ? renderExplorerUI(c.id) : '<div class="drive-loader" style="text-align:center; padding:40px;"><div class="spinner"></div><p>กำลังโหลดไฟล์...</p></div>') : `
              <div style="display:flex; justify-content:center; padding:10px 0;">
                <div style="background:rgba(255,255,255,0.7); backdrop-filter:blur(20px); border-radius:24px; padding:40px 20px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.02); border:1px solid rgba(255,255,255,1); width:100%; position:relative; overflow:hidden;">
                  <div style="position:relative; z-index:1;">
                    <div style="width:110px; height:110px; background:linear-gradient(180deg, #e0e7ff, #c7d2fe); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; box-shadow:0 10px 35px rgba(99,102,241,0.3); border:4px solid white;">
                      <span style="font-size:55px; text-shadow:0 4px 10px rgba(0,0,0,0.1);">☁️</span>
                    </div>
                    <h3 style="font-size:22px; color:#1e293b; margin-bottom:10px; font-weight:700;">ยังไม่ได้เชื่อมต่อ Google Drive ของคุณ</h3>
                    <p style="color:#64748b; margin-bottom:30px; font-size:15px;">คลิกปุ่มด้านล่างเพื่อสร้างโฟลเดอร์สำหรับวิชานี้อัตโนมัติ</p>
                    <button style="background:linear-gradient(135deg, #6366f1, #8b5cf6); color:white; border:none; padding:15px 30px; border-radius:30px; font-size:16px; font-weight:600; cursor:pointer; box-shadow:0 10px 25px rgba(99,102,241,0.4); display:flex; align-items:center; justify-content:center; gap:10px; width:fit-content; margin: 0 auto; transition: transform 0.2s;" onclick="automateDriveFolder('${c.id}')" ${gasDisabled}>➕ สร้างโฟลเดอร์ให้ฉันอัตโนมัติ</button>
                  </div>
                </div>
              </div>
            `}
          </div>
        </div>
      `;
}

function renderCourseProgress(c) {
  return `
        <div class="hub-scroll-area">
          <div class="hub-grid">
            <div class="glass-card nb-card">
              <div class="section-hd">📊 คะแนนสะสม (Grade Structure) <button class="icon-btn-sm" style="float:right;" onclick="setupGradeStructure('${c.id}')">✏️</button></div>
              ${renderGradeStructure(c.id)}
            </div>
            <div class="glass-card nb-card">
              <div class="section-hd">🎯 ความเข้าใจรายหัวข้อ (Topic Mastery)</div>
              ${renderTopicMastery(c.id)}
            </div>
          </div>
        </div>
      `;
}

function renderCourseAttendance(c) {
  return `
        <div class="hub-scroll-area">
          <div class="hub-grid">
            <div class="glass-card nb-card" style="grid-column: 1 / -1;">
              <div class="section-hd">📍 ระบบเช็คอินและประวัติการเข้าเรียน</div>
              ${renderAttendanceSummary(c.id)}
            </div>
          </div>
        </div>
      `;
}

function renderCourseSettings(c) {
  const links = state.links[c.id] || [];
  return `
        <div class="hub-scroll-area" style="padding:0 20px 20px;">
          <div class="hub-grid">
            <div class="settings-form glass-card nb-card">
              <div class="section-hd">⚙️ ตั้งค่ารายวิชา</div>
              <div class="form-grid">
                <div class="fg"><label>ชื่อวิชา (ภาษาไทย)</label><input type="text" class="glass-input" id="set-name-th" value="${c.nameTh || ''}"></div>
                <div class="fg"><label>ชื่อวิชา (English)</label><input type="text" class="glass-input" id="set-name-en" value="${c.nameEn || ''}"></div>
                <div class="form-row">
                  <div class="fg"><label>รหัสวิชา</label><input type="text" class="glass-input" id="set-code" value="${c.code || ''}"></div>
                  <div class="fg"><label>หน่วยกิต</label><input type="number" class="glass-input" id="set-credits" value="${c.credits || 0}"></div>
                </div>
                <div class="fg"><label>ผู้สอน</label><input type="text" class="glass-input" id="set-instructor" value="${c.instructor || ''}"></div>
                <div class="fg">
                  <label>สีประจำวิชา</label>
                  <div class="color-picker-row">
                    ${['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'].map(color => `
                      <div class="cpick ${c.color === color ? 'sel' : ''}" style="background:${color}" onclick="updateSetColor('${color}', this)"></div>
                    `).join('')}
                    <input type="hidden" id="set-color" value="${c.color || '#4f46e5'}">
                  </div>
                </div>
                <div class="fg"><label>ลิงก์ห้องเรียน / LMS</label><input type="text" class="glass-input" id="set-link" value="${c.link || ''}"></div>
                <div class="fg"><label>Google Drive Folder ID</label><input type="text" class="glass-input" id="set-drive-id" value="${c.driveId || ''}"></div>
              </div>
            </div>
                <div style="margin-top:20px; display:flex; gap:10px;">
                  <button class="nb-btn-primary full" onclick="saveCourseSettings('${c.id}')">💾 บันทึกการตั้งค่า</button>
                </div>
              </div>
            </div>

            <div class="glass-card nb-card">
              <div class="section-hd">🔗 ลิงก์ห้องเรียน / แหล่งเรียนรู้</div>
              <div id="linkManagerList" style="display:flex; flex-direction:column; gap:8px;">
                ${links.map((l, idx) => `
                  <div class="glass-card-sm" style="display:flex; justify-content:space-between; align-items:center; padding:10px;">
                    <div>
                      <div style="font-weight:700; font-size:13px;">${l.name}</div>
                      <div style="font-size:11px; opacity:0.6; text-decoration:underline;">${l.url}</div>
                    </div>
                    <button class="btn-text-danger" onclick="removeCourseLink('${c.id}', ${idx})">✕</button>
                  </div>
                `).join('')}
                ${links.length === 0 ? '<div class="empty-sm">ยังไม่มีลิงก์เสริม</div>' : ''}
              </div>
              <div class="form-grid" style="margin-top:15px; border-top:1px solid var(--glass-border); padding-top:15px;">
                <input class="glass-input sm" id="new-link-name" placeholder="ชื่อลิงก์ (เช่น เข้าเรียน Zoom)">
                <input class="glass-input sm" id="new-link-url" placeholder="URL (https://...)">
                <button class="nb-btn sm" onclick="addCourseLink('${c.id}')">+ เพิ่มลิงก์</button>
              </div>
            </div>

            <div class="glass-card nb-card">
              <div class="section-hd">🛠 ตั้งค่าโครงสร้างคะแนน</div>
              <p style="font-size:12px; margin-bottom:15px; opacity:0.7;">ระบุสัดส่วนคะแนนสะสมของรายวิชาเพื่อให้ระบบคำนวณ Progress</p>
              <button class="nb-btn sm full" onclick="setupGradeStructure('${c.id}')">⚙️ จัดการโครงสร้างคะแนน</button>
            </div>

            <div class="glass-card nb-card">
              <div class="section-hd">📂 Google Drive Folder</div>
              <div class="fg">
                <label>Folder ID (Auto-assigned)</label>
                <div style="display:flex; gap:8px;">
                   <input type="text" class="glass-input sm" id="set-drive-id" value="${c.driveId || ''}" readonly>
                   <button class="nb-btn sm" onclick="automateDriveFolder('${c.id}')" ${!isDriveSupported() ? 'disabled style="opacity:0.5; cursor:not-allowed;" title="ต้องใช้ผ่าน Google Apps Script/Proxy"' : ''}>🔄 เชื่อมต่ออัตโนมัติ</button>
                </div>
              </div>
              <button class="nb-btn-danger sm" style="margin-top:25px; width:100%;" onclick="if(confirm('คุณแน่ใจหรือไม่ว่าจะลบวิชานี้?')) { if(confirm('ยืนยันอีกครั้ง! ข้อมูลทั้งหมดจะหายไป')) deleteCourse('${c.id}') }">🗑 ลบวิชานี้จากระบบ</button>
            </div>
          </div>
        </div>
      `;
}

function renderAttendanceSummary(courseId) {
  const history = state.attendanceHistory[courseId] || {};
  const dates = Object.keys(history).sort((a, b) => new Date(b) - new Date(a));
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayRecord = history[todayStr];
  const isOnline = state.classMode === 'online';

  const counts = { 'ปกติ': 0, 'สาย': 0, 'ขาด': 0 };
  Object.values(history).forEach(h => {
    if (h.status.includes('ปกติ')) counts['ปกติ']++;
    else if (h.status.includes('สาย')) counts['สาย']++;
    else counts['ขาด']++;
  });

  let html = `
        <div class="att-controls" style="margin-bottom:20px; display:flex; flex-direction:column; gap:12px;">
          <div class="glass-card nb-card" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:10px 15px;">
             <div style="font-weight:800; font-size:13px;">📡 โหมดการเรียน</div>
             <div style="display:flex; background:#e2e8f0; padding:3px; border-radius:10px; border:2px solid black;">
                <button class="nb-btn sm ${!isOnline ? 'active' : ''}" style="padding:4px 10px; border:none; box-shadow:none; font-size:11px; background:${!isOnline ? 'var(--c-indigo)' : 'transparent'}; color:${!isOnline ? 'white' : 'black'};" onclick="state.classMode='onsite'; render();">Onsite</button>
                <button class="nb-btn sm ${isOnline ? 'active' : ''}" style="padding:4px 10px; border:none; box-shadow:none; font-size:11px; background:${isOnline ? 'var(--c-indigo)' : 'transparent'}; color:${isOnline ? 'white' : 'black'};" onclick="state.classMode='online'; render();">Online</button>
             </div>
          </div>

          <div class="att-status-card glass-card nb-card" style="background:#fff;">
            <div style="font-weight:800; font-size:14px; margin-bottom:10px;">📍 เช็คอินวันนี้ (${new Date().toLocaleDateString('th-TH')})</div>
            ${(() => {
      const now = new Date();
      const adjustedDay = getTodayDayIndex();
      const currentTimeVal = now.getHours() + (now.getMinutes() / 60);
      const curSem = getCurrentSemester();
      const course = findCourseById(courseId);
      const schedules = (course?.schedules || course?.schedule || []);
      const activeSlot = schedules.find(s => s.day === adjustedDay && currentTimeVal >= s.startHour && currentTimeVal < s.endHour);

      if (todayRecord) {
        return `
                  <div style="background:var(--c-lime)11; border:2px solid var(--c-lime); padding:12px; border-radius:12px; display:flex; align-items:center; gap:10px;">
                    <span style="font-size:20px;">✅</span>
                    <div>
                      <div style="font-weight:800; color:var(--c-lime); font-size:13px;">เช็คชื่อเรียบร้อยแล้ว</div>
                      <div style="font-size:11px; opacity:0.7;">เวลา: ${todayRecord.timestamp?.split('T')[1].substring(0, 5) || '-'} | สถานะ: ${todayRecord.status}</div>
                    </div>
                  </div>`;
      } else if (activeSlot) {
        return `
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <button class="nb-btn sm nb-btn-primary" onclick="setAttendanceStatus('${courseId}', 'เข้าเรียนปกติ')">✅ เข้าเรียน</button>
                    <button class="nb-btn sm nb-btn-danger" onclick="setAttendanceStatus('${courseId}', 'มาสาย')">⏳ สาย</button>
                  </div>`;
      } else {
        return `<div class="glass-warn" style="text-align:center; padding:12px; border-radius:12px; font-size:13px;">⌛ ยังไม่ถึงเวลาคลาสเรียน (กดได้เฉพาะเวลาเรียน)</div>`;
      }
    })()}
          </div>

          <div class="reflection-card glass-card nb-card" style="background:#fff;">
            <div style="font-weight:800; font-size:14px; margin-bottom:8px;">📝 Reflection หลังเลิกคลาส</div>
            <textarea id="reflInput_adv" class="nb-input" style="width:100%; min-height:80px; padding:10px; font-family:var(--font-body); font-size:13px;" placeholder="วันนี้เรียนรู้อะไรบ้าง?">${state.reflections[courseId] || ''}</textarea>
            <button class="nb-btn sm nb-btn-primary" style="width:100%; margin-top:8px;" onclick="window.saveReflection('${courseId}')">💾 บันทึก Reflection</button>
          </div>
        </div>

        <div class="att-history-list" style="display:flex; flex-direction:column; gap:8px;">
          <div style="font-weight:800; font-size:13px; opacity:0.5; margin-bottom:4px;">ประวัติย้อนหลัง (${counts['ปกติ']} มา, ${counts['สาย']} สาย, ${counts['ขาด']} ขาด)</div>
          ${dates.map(d => {
      const r = history[d];
      const isPresent = r.status.includes('ปกติ');
      const isLate = r.status.includes('สาย');
      return `
              <div class="glass-card" style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border:1px solid var(--glass-border);">
                <div>
                  <div style="font-weight:700; font-size:12px;">${new Date(d).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                  <div style="font-size:10px; opacity:0.5;">${r.timestamp?.split('T')[1].substring(0, 5) || '-'}</div>
                </div>
                <div class="nb-chip" style="background:${isPresent ? 'var(--c-lime)22' : isLate ? 'var(--c-rust)22' : 'var(--c-red)22'}; color:${isPresent ? 'var(--c-lime)' : isLate ? 'var(--c-rust)' : 'var(--c-red)'}; border-color:${isPresent ? 'var(--c-lime)' : isLate ? 'var(--c-rust)' : 'var(--c-red)'}">${r.status}</div>
              </div>
            `;
    }).join('') || '<div class="empty-sm">ยังไม่มีประวัติ</div>'}
        </div>
      `;
  return html;
}

window.saveReflection = async (courseId) => {
  const el = document.getElementById('reflInput_adv');
  if (!el) return;
  const val = el.value.trim();
  if (!val) { showToast('⚠️ กรุณากรอกเนื้อหา', 'err'); return; }

  showToast('⏳ กำลังบันทึก Reflection...');
  state.reflections[courseId] = val;
  localStorage.setItem('reflections', JSON.stringify(state.reflections));

  try {
    await fsSet('reflections', courseId, { text: val, updatedAt: new Date().toISOString() });
    showToast('✅ บันทึก Reflection สำเร็จ!');
    
    // Push to Notion
    NotionHub.pushReflection(courseId, val);
    
    render();
  } catch (e) {
    showToast('❌ บันทึกล้มเหลว: ' + e.message, 'err');
  }
};



function renderExplorerUI(courseId) {
  state.courseFiles = state.courseFiles || {};
  const c = findCourseById(courseId);
  if (!c) return '<div class="empty-sm">ไม่พบวิชา</div>';
  const key = state.currentFolderId || c.driveId;
  if (!key) return '<div class="empty-sm">ยังไม่ได้เชื่อมต่อ Google Drive</div>';
  const data = state.courseFiles[key];

  const breadcrumbs = `
    <div class="drive-breadcrumbs" style="margin-bottom:15px; font-size:13px; font-weight:600; color:var(--c-accent); display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
      <div style="display:flex; gap:5px; flex-wrap:wrap; flex:1;">
        ${state.driveBreadcrumbs.map((b, i) => `
          <span class="bc-item" onclick="gotoFolder('${courseId}', '${b.id}', '${b.name}')" style="cursor:pointer; ${i === state.driveBreadcrumbs.length - 1 ? 'opacity:0.5; pointer-events:none;' : ''}">${b.name}</span>
          ${i < state.driveBreadcrumbs.length - 1 ? '<span style="opacity:0.3">/</span>' : ''}
        `).join('')}
      </div>
      ${c.notionUrl ? `<a href="${c.notionUrl}" target="_blank" style="text-decoration:none; background:#000; color:#fff; width:22px; height:22px; display:flex; align-items:center; justify-content:center; border-radius:4px; font-size:11px; font-weight:800;" title="Open in Notion">N</a>` : ''}
    </div>
  `;

  if (!data) return breadcrumbs + '<div class="drive-loader" style="text-align:center; padding:20px;"><div class="spinner"></div><p>กำลังโหลดไฟล์...</p></div>';

  const allItems = [
    ...data.folders.map(f => ({ ...f, isFolder: true })),
    ...data.files.map(f => ({ ...f, isFolder: false }))
  ];

  if (allItems.length === 0) return breadcrumbs + '<div class="empty-hero" style="min-height:200px;"><div class="empty-icon">📂</div><h3>ยังไม่มีไฟล์ในโฟลเดอร์นี้</h3></div>';

  return breadcrumbs + `
        <div class="explorer-${state.driveViewMode || 'grid'}" style="display:${state.driveViewMode === 'list' ? 'block' : 'grid'}; gap:15px;">
          ${allItems.map(item => {
    const isSel = state.selectedItems.has(item.id);
    const icon = item.isFolder ? '📁' : getFileIcon(item.mimeType);
    return `
              <div class="file-item ${isSel ? 'selected' : ''}" style="${state.driveViewMode === 'list' ? 'display:flex; align-items:center; justify-content:flex-start; margin-bottom:5px; padding:10px;' : 'position:relative;'}" onclick="${item.isFolder ? `gotoFolder('${courseId}', '${item.id}', '${item.name}')` : `previewFile('${item.id}', '${item.name}', '${item.url}', '${item.mimeType}')`}">
                <div class="file-icon" style="${state.driveViewMode === 'list' ? 'margin-bottom:0; margin-right:15px;' : ''}">${icon}</div>
                <div class="file-name" style="${state.driveViewMode === 'list' ? 'flex:1; text-align:left; margin-bottom:0;' : ''}" title="${item.name}">${item.name}</div>
                <div style="font-size:9px; opacity:0.5; ${state.driveViewMode === 'list' ? 'margin-right:40px;' : ''}">${item.isFolder ? 'Folder' : formatSize(item.size)}</div>
                <button class="icon-btn-sm" style="position:absolute; right:5px; top:50%; transform:translateY(-50%);" onclick="event.stopPropagation(); toggleItemSelection('${item.id}', event);">⋮</button>
              </div>
            `;
  }).join('')}
        </div>
      `;
}

function getFileIcon(mime) {
  if (mime.includes('pdf')) return '📕';
  if (mime.includes('image')) return '🖼️';
  if (mime.includes('word')) return '📘';
  if (mime.includes('sheet')) return '📗';
  if (mime.includes('presentation')) return '📙';
  if (mime.includes('video')) return '🎬';
  if (mime.includes('audio')) return '🎵';
  return '📄';
}

function formatSize(bytes) {
  if (!bytes) return '';
  const s = ['B', 'KB', 'MB', 'GB'];
  const e = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, e)).toFixed(1) + ' ' + s[e];
}

function toggleItemSelection(id, event) {
  const el = event.currentTarget.closest('.file-item');
  if (state.selectedItems.has(id)) {
    state.selectedItems.delete(id);
    if (el) el.classList.remove('selected');
  } else {
    state.selectedItems.add(id);
    if (el) el.classList.add('selected');
  }
}

async function handleCreateFolder(courseId, parentId) {
  if (!isDriveSupported()) { alert("ฟีเจอร์นี้ต้องใช้ผ่าน Google Apps Script URL หรือ Proxy"); return; }
  const c = findCourseById(courseId);
  const targetParentId = state.currentFolderId || parentId || (c ? c.driveId : null);

  if (!targetParentId) {
    showToast('❌ ไม่สามารถระบุโฟลเดอร์ปลายทางได้', 'err');
    return;
  }

  const name = prompt('ชื่อโฟลเดอร์ใหม่:');
  if (!name) return;

  showToast('📂 กำลังสร้างโฟลเดอร์ใหม่...');
  google.script.run
    .withSuccessHandler((res) => {
      if (res && res.success) {
        showToast('✅ สร้างโฟลเดอร์แล้ว');
        if (state.courseFilesCache) delete state.courseFilesCache[targetParentId];
        refreshDriveFiles(courseId, targetParentId, true);
      } else {
        showToast(`❌ สร้างไม่สำเร็จ: ${res?.error || 'Unknown'}`, 'err');
      }
    })
    .withFailureHandler(err => showToast(`❌ สร้างไม่สำเร็จ: ${err.message}`, 'err'))
    .createFolder(targetParentId, name);
}

async function renameSelectedItem() {
  if (!isDriveSupported()) { alert("ฟีเจอร์นี้ต้องใช้ผ่าน Google Apps Script URL หรือ Proxy"); return; }
  const id = Array.from(state.selectedItems)[0];
  const newName = prompt('ชื่อใหม่:');
  if (!newName || !id) return;
  showToast('✏️ กำลังเปลี่ยนชื่อ...');
  google.script.run
    .withSuccessHandler(() => {
      showToast('✅ เปลี่ยนชื่อแล้ว');
      state.selectedItems.clear();
      if (state.courseFilesCache) delete state.courseFilesCache[state.currentFolderId];
      refreshDriveFiles(state.activeCourseId, state.currentFolderId, true);
    })
    .withFailureHandler(err => showToast(`❌ เปลี่ยนชื่อไม่สำเร็จ: ${err.message}`, 'err'))
    .renameItem(id, newName);
}

async function deleteSelectedItems() {
  if (!isDriveSupported()) { alert("ฟีเจอร์นี้ต้องใช้ผ่าน Google Apps Script URL หรือ Proxy"); return; }
  if (!confirm(`ยืนยันการลบ ${state.selectedItems.size} รายการ?`)) return;
  showToast('🗑 กำลังลบ...');
  google.script.run
    .withSuccessHandler(() => {
      showToast('✅ ลบเรียบร้อย');
      state.selectedItems.clear();
      if (state.courseFilesCache) delete state.courseFilesCache[state.currentFolderId];
      refreshDriveFiles(state.activeCourseId, state.currentFolderId, true);
    })
    .withFailureHandler(err => showToast(`❌ ลบไม่สำเร็จ: ${err.message}`, 'err'))
    .deleteItems(Array.from(state.selectedItems));
}

function shareSelectedItems() {
  const ids = Array.from(state.selectedItems);
  const links = ids.map(id => `https://drive.google.com/open?id=${id}`).join('\n');
  copyToClipboard(links);
  showToast('📋 คัดลอกลิงก์แชร์แล้ว');
}

function printSelectedItems() {
  const ids = Array.from(state.selectedItems);
  showToast('🖨 กำลังเปิดหน้าต่างพิมพ์...');
  ids.forEach(id => {
    window.open(`https://drive.google.com/file/d/${id}/view`, '_blank');
  });
}

async function previewFile(id, name, url, mimeType = '') {
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(name) || mimeType.includes('image');
  const isPDF = name.toLowerCase().endsWith('.pdf') || mimeType.includes('pdf');

  // Loading skeleton UI (Pulse Animation)
  let loadingHtml = `
    <div class="preview-skeleton" style="display: flex; flex-direction: column; gap: 15px; padding: 10px;">
      <div style="height: 20px; background: rgba(0,0,0,0.05); border-radius: 4px; width: 45%; animation: preview-pulse 1.5s infinite;"></div>
      <div style="height: 380px; background: rgba(0,0,0,0.05); border-radius: 12px; animation: preview-pulse 1.5s infinite; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px;">
        <div class="spinner"></div>
        <p style="font-size: 13px; opacity: 0.7; margin-top: 10px;">กำลังเตรียมไฟล์แบบ Native...</p>
      </div>
    </div>
    <style>
      @keyframes preview-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
    </style>
  `;
  
  // Make print function globally accessible in module context
  window.printPdf = () => {
    const iframe = document.getElementById('pdfPreviewIframe');
    if (iframe) {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.warn("Cross-origin or iframe print error, printing main window:", e);
        window.print();
      }
    } else {
      window.print();
    }
  };

  // Helper to show fallback options if GAS fails
  const showFallbackUI = (container) => {
    container.innerHTML = `
      <div class="empty-hero" style="min-height:280px; text-align:center; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="font-size:50px; color:var(--c-rust); margin-bottom: 10px;">⚠️</div>
        <h3 style="font-weight:700; margin-bottom:8px;">ไม่สามารถดึงข้อมูลไฟล์ได้</h3>
        <p style="font-size:13px; opacity:0.7; margin-bottom:25px; max-width: 320px;">เกิดข้อผิดพลาดหรือเซิร์ฟเวอร์ตอบสนองช้าเกินไป (ไฟล์อาจมีขนาดใหญ่เกินขีดจำกัด)</p>
        <div style="display:flex; gap:12px; justify-content:center; width: 100%; max-width: 320px;">
          <button class="nb-btn-primary sm" style="flex: 1;" onclick="window.open('${url || `https://drive.google.com/open?id=${id}`}', '_blank')">📂 เปิดใน Drive</button>
          <button class="nb-btn sm" style="flex: 1;" onclick="downloadFileViaProxy('${id}', '${name.replace(/'/g, "\\'")}')">⬇ Download</button>
        </div>
      </div>
    `;
  };

  // Open Modal with loading skeleton
  openModal(name, `<div id="preview-container">${loadingHtml}</div>`, `
    <div style="display:flex; gap:10px; width:100%;">
      <button class="nb-btn sm" style="flex:1;" onclick="downloadFileViaProxy('${id}', '${name.replace(/'/g, "\\'")}')">⬇ Download</button>
      <button id="modalPrintBtn" class="nb-btn sm" style="flex:1; opacity:0.5; cursor:not-allowed;" onclick="window.printPdf()" disabled>🖨 Print</button>
    </div>
  `);

  let loaded = false;

  // Timeout Warning: ถ้าโหลดเกิน 10 วินาที ให้ขึ้นเตือนและปุ่มลัดไป Google Drive
  const timeoutId = setTimeout(() => {
    if (!loaded) {
      const container = document.getElementById('preview-container');
      if (container) {
        container.innerHTML = `
          <div style="text-align:center; padding: 40px 20px; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1.5px dashed rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 380px;">
            <div class="spinner" style="margin-bottom: 20px;"></div>
            <h4 style="margin: 0 0 8px; font-weight:700; color:var(--c-rust); font-size: 16px;">ไฟล์ขนาดใหญ่ กำลังโหลด...</h4>
            <p style="font-size:12px; opacity:0.7; margin-bottom:25px; max-width: 280px; line-height: 1.5;">เอกสารกำลังถูกดึงและดาวน์โหลดเป็น Base64 ในพื้นหลัง หากรอนานเกินไป คุณสามารถเปิดดูโดยตรงได้ทันที</p>
            <button class="nb-btn-primary sm" onclick="window.open('${url || `https://drive.google.com/open?id=${id}`}', '_blank')">📂 เปิดดูโดยตรงบน Google Drive</button>
          </div>
        `;
      }
    }
  }, 10000);

  if (isImage) {
    google.script.run
      .withSuccessHandler(res => {
        loaded = true;
        clearTimeout(timeoutId);
        const container = document.getElementById('preview-container');
        if (!container) return;

        if (res && res.success) {
          container.innerHTML = `<img src="${res.base64}" style="width:100%; border-radius:12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">`;
          
          // Enable and redirect Print button to print the main page/image
          const printBtn = document.getElementById('modalPrintBtn');
          if (printBtn) {
            printBtn.removeAttribute('disabled');
            printBtn.style.opacity = '1';
            printBtn.style.cursor = 'pointer';
            printBtn.onclick = () => window.print();
          }
        } else {
          showFallbackUI(container);
        }
      })
      .withFailureHandler(() => {
        loaded = true;
        clearTimeout(timeoutId);
        const container = document.getElementById('preview-container');
        if (container) showFallbackUI(container);
      })
      .getFileDataBase64(id);

  } else if (isPDF) {
    google.script.run
      .withSuccessHandler(res => {
        loaded = true;
        clearTimeout(timeoutId);
        const container = document.getElementById('preview-container');
        if (!container) return;

        if (res && res.success) {
          // Double Fallback rendering: Option A (Iframe) -> Option B (Embed)
          container.innerHTML = `
            <iframe id="pdfPreviewIframe" src="${res.base64}" width="100%" height="500px" style="border:none; border-radius:8px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);" onerror="this.outerHTML='<embed type=\"application/pdf\" src=\"${res.base64}\" width=\"100%\" height=\"500px\" style=\"border-radius:8px;\">'">
              <embed type="application/pdf" src="${res.base64}" width="100%" height="500px" style="border-radius:8px;">
            </iframe>
          `;

          // Enable Print Button
          const printBtn = document.getElementById('modalPrintBtn');
          if (printBtn) {
            printBtn.removeAttribute('disabled');
            printBtn.style.opacity = '1';
            printBtn.style.cursor = 'pointer';
          }
        } else {
          showFallbackUI(container);
        }
      })
      .withFailureHandler(() => {
        loaded = true;
        clearTimeout(timeoutId);
        const container = document.getElementById('preview-container');
        if (container) showFallbackUI(container);
      })
      .getFileDataBase64(id);

  } else {
    // Non-previewable files fallback
    clearTimeout(timeoutId);
    const container = document.getElementById('preview-container');
    if (container) {
      container.innerHTML = `
        <div class="empty-hero" style="min-height:280px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-size:50px; margin-bottom: 12px;">📄</div>
          <h3 style="font-weight: 700; margin-bottom: 6px;">ไม่รองรับการพรีวิวแบบ Native</h3>
          <p style="font-size: 13px; opacity: 0.7; margin-bottom: 25px;">ประเภทไฟล์นี้ยังไม่เปิดใช้งานฟังก์ชันพรีวิวโดยตรงบนระบบ</p>
          <a href="${url || `https://drive.google.com/open?id=${id}`}" target="_blank" class="nb-btn-primary" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; padding: 12px 24px; border-radius: 20px;">📂 เปิดดูบน Google Drive</a>
        </div>
      `;
    }
  }
}

async function automateDriveFolder(courseId) {
  if (!isDriveSupported()) { alert("ฟีเจอร์นี้ต้องใช้ผ่าน Google Apps Script URL หรือ Proxy"); return; }
  const c = findCourseById(courseId);
  const sem = state.semesters.find(s => state.courses[s.id]?.find(x => x.id === courseId));
  showToast('🤖 กำลังจัดการโฟลเดอร์อัตโนมัติ...');
  google.script.run
    .withSuccessHandler(async (res) => {
      if (res.success) {
        await fsUpd('courses', courseId, { driveId: res.id });
        c.driveId = res.id;
        showToast('✅ เชื่อมต่อ Drive แล้ว');
        render();
      } else {
        showToast(`❌ เกิดข้อผิดพลาด: ${res.error}`, 'err');
      }
    })
    .withFailureHandler(err => showToast(`❌ ล้มเหลว: ${err.message}`, 'err'))
    .getOrCreateCourseFolder(sem.name, c.code, c.nameTh);
}

function addCourseLink(courseId) {
  const name = document.getElementById('new-link-name').value;
  const url = document.getElementById('new-link-url').value;
  if (!name || !url) return;
  if (!state.links[courseId]) state.links[courseId] = [];
  state.links[courseId].push({ name, url });
  localStorage.setItem('course_links', JSON.stringify(state.links));
  render();
}

function removeCourseLink(courseId, idx) {
  state.links[courseId].splice(idx, 1);
  localStorage.setItem('course_links', JSON.stringify(state.links));
  render();
}

function addTopic(courseId, parentId) {
  openModal('เพิ่มหัวข้อย่อย', `
        <div class="form-grid">
          <div class="fg full">
            <label>ชื่อหัวข้อ</label>
            <input type="text" class="glass-input" id="newTopicName" placeholder="เช่น บทที่ 1...">
          </div>
          <div class="fg full">
            <label>ระดับความเข้าใจเริ่มต้น</label>
            <select class="glass-select" id="newTopicLevel">
              <option value="review">🔴 ยังไม่เข้าใจ (Review)</option>
              <option value="ok">🟡 เข้าใจบ้าง (OK)</option>
              <option value="mastered">🟢 เชี่ยวชาญ (Mastered)</option>
            </select>
          </div>
        </div>
      `, `
        <button class="nb-btn-primary full" onclick="saveNewTopic('${courseId}', '${parentId || ''}')">บันทึก</button>
      `);
}

window.saveNewTopic = async (courseId, parentIdStr) => {
  const parentId = parentIdStr === '' ? null : parentIdStr;
  const name = document.getElementById('newTopicName').value;
  const level = document.getElementById('newTopicLevel').value;
  if (!name) return;
  const id = 't_' + Math.random().toString(36).substring(2, 9);
  if (!state.topicMastery[courseId]) state.topicMastery[courseId] = [];
  state.topicMastery[courseId].push({ id, name, parentId, level });
  localStorage.setItem('topic_mastery', JSON.stringify(state.topicMastery));
  closeModal();
  render();
  await fsSet('topic_mastery', courseId, { topics: state.topicMastery[courseId] });
};

async function setTopicLevel(courseId, topicId, level) {
  const t = state.topicMastery[courseId].find(x => x.id === topicId);
  if (t) t.level = level;
  localStorage.setItem('topic_mastery', JSON.stringify(state.topicMastery));
  render();
  await fsSet('topic_mastery', courseId, { topics: state.topicMastery[courseId] });
}

async function linkFilesToTopic(courseId, topicId, docs) {
  if (!docs || docs.length === 0) return;
  const t = state.topicMastery[courseId].find(x => x.id === topicId);
  if (!t) return;
  if (!t.files) t.files = [];
  docs.forEach(d => {
    if (!t.files.find(f => f.id === d.id)) {
      t.files.push({ id: d.id, name: d.name, url: d.url, mimeType: d.mimeType });
    }
  });
  localStorage.setItem('topic_mastery', JSON.stringify(state.topicMastery));
  await fsSet('topic_mastery', courseId, { topics: state.topicMastery[courseId] });
  render();
  showToast(`✅ Linked ${docs.length} files to topic`);
}

async function unlinkFileFromTopic(courseId, topicId, fileId) {
  const t = state.topicMastery[courseId].find(x => x.id === topicId);
  if (t && t.files) {
    t.files = t.files.filter(f => f.id !== fileId);
    localStorage.setItem('topic_mastery', JSON.stringify(state.topicMastery));
    await fsSet('topic_mastery', courseId, { topics: state.topicMastery[courseId] });
    render();
  }
}

async function handleLinkedFiles(docs, courseId) {
    if (!docs || docs.length === 0) return;
    showToast(`🔗 Linking ${docs.length} files to course...`);
    const course = findCourseById(courseId);
    if (!course) return;
    
    if (!course.linkedFiles) course.linkedFiles = [];
    docs.forEach(d => {
      if (!course.linkedFiles.find(f => f.id === d.id)) {
        course.linkedFiles.push({ id: d.id, name: d.name, url: d.url, mimeType: d.mimeType });
      }
    });
    
    await fsUpd('courses', courseId, { linkedFiles: course.linkedFiles });
    showToast(`✅ Linked ${docs.length} files to ${course.code}`);
    render();
    refreshDriveFiles(courseId, course.driveId);
}

async function unlinkFileFromCourse(courseId, fileId) {
  if (!confirm('ยืนยันการยกเลิกลิงก์ไฟล์นี้จากวิชา?')) return;
  const course = findCourseById(courseId);
  if (course && course.linkedFiles) {
    course.linkedFiles = course.linkedFiles.filter(f => f.id !== fileId);
    await fsUpd('courses', courseId, { linkedFiles: course.linkedFiles });
    showToast('✅ ยกเลิกลิงก์ไฟล์สำเร็จ');
    render();
  }
}
window.unlinkFileFromCourse = unlinkFileFromCourse;


async function deleteTopic(courseId, topicId) {
  if (!confirm('ยืนยันการลบหัวข้อนี้และหัวข้อย่อย?')) return;
  const removeRecursive = (id) => {
    const subs = state.topicMastery[courseId].filter(x => x.parentId === id);
    subs.forEach(s => removeRecursive(s.id));
    state.topicMastery[courseId] = state.topicMastery[courseId].filter(x => x.id !== id);
  };
  removeRecursive(topicId);
  localStorage.setItem('topic_mastery', JSON.stringify(state.topicMastery));
  render();
  await fsSet('topic_mastery', courseId, { topics: state.topicMastery[courseId] });
}

async function saveCourseSettings(courseId) {
  const updated = {
    nameTh: document.getElementById('set-name-th')?.value || '',
    nameEn: document.getElementById('set-name-en')?.value || '',
    code: document.getElementById('set-code')?.value || '',
    credits: parseInt(document.getElementById('set-credits')?.value) || 0,
    instructor: document.getElementById('set-instructor')?.value || '',
    link: document.getElementById('set-link')?.value || '',
    driveId: document.getElementById('set-drive-id')?.value || '',
    color: document.getElementById('set-color')?.value || ''
  };

  showToast('⏳ กำลังบันทึก...');
  await fsUpd('courses', courseId, updated);
  const semId = findSemIdByCourseId(courseId);
  if (semId) {
    const cIdx = state.courses[semId].findIndex(x => x.id === courseId);
    state.courses[semId][cIdx] = { ...state.courses[semId][cIdx], ...updated };
  }
  showToast('✅ บันทึกเรียบร้อย');
  render();
}

function findSemIdByCourseId(courseId) {
  for (const semId in state.courses) {
    if (state.courses[semId].find(c => c.id === courseId)) return semId;
  }
  return null;
}

function updateSetColor(color, el) {
  document.getElementById('set-color').value = color;
  document.querySelectorAll('.cpick').forEach(p => p.classList.remove('sel'));
  el.classList.add('sel');
}

async function deleteCourse(courseId) {
  if (!confirm('ยืนยันการลบวิชานี้? ข้อมูลทั้งหมดรวมถึงคะแนนจะหายไป')) return;
  showToast('🗑 กำลังลบ...');
  await fsDel('courses', courseId);
  state.view = 'courses';
  await loadAll();
}

// ══════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════
function renderDashboard(gpaVal, proVal, curSemVal) {
  const gpa = gpaVal || getCumGPA();
  const pro = proVal || getProStatus(gpa);
  const curSem = curSemVal || getCurrentSemester();
  const cr = getTotalPassedCredits();
  const pct = Math.min(100, (cr / 137 * 100)).toFixed(1);
  const missingReflections = getMissingReflections();

  const proAlerts = {
    'pro-low': `<div class="alert glass-warn" style="border-left:8px solid var(--c-rust);">⚠️ <strong>ติดโปรต่ำ</strong> GPAX ${gpa} (1.75–1.99) — ต้องให้อาจารย์ที่ปรึกษาปลดล็อค</div>`,
    'pro-high': `<div class="alert glass-danger" style="border-left:8px solid var(--c-rust); background:rgba(225,29,72,0.1);">🚨 <strong>ติดโปรสูง</strong> GPAX ${gpa} (1.50–1.74) — ระวังพ้นสภาพ!</div>`,
    'expelled': `<div class="alert glass-danger" style="border:3px solid var(--c-rust); background:var(--c-rust)22;">❌ <strong>GPAX ต่ำกว่า 1.50</strong> — กรุณาติดต่อฝ่ายวิชาการด่วน</div>`,
  };

  const now = new Date();
  const adjustedDay = getTodayDayIndex();
  let todayClasses = [];
  if (curSem) {
    todayClasses = (state.courses[curSem.id] || []).flatMap(c => {
      const sch = c.schedules || c.schedule || [];
      return sch.filter(s => s.day === adjustedDay).map(s => ({ ...c, slot: s }));
    }).sort((a, b) => a.slot.startHour - b.slot.startHour);
  }
  const currentTimeVal = now.getHours() + (now.getMinutes() / 60);
  const activeClass = todayClasses.find(c => currentTimeVal >= c.slot.startHour && currentTimeVal < c.slot.endHour);

  const hour = now.getHours();
  let greeting = "สวัสดีตอนเช้า";
  if (hour >= 12) greeting = "สวัสดีตอนบ่าย";
  if (hour >= 17) greeting = "สวัสดีตอนเย็น";
  if (hour >= 21) greeting = "ราตรีสวัสดิ์";

  return `<div class="page-wrap dashboard-v2">
    <!-- Hero Section -->
    <div class="dash-hero">
      <div class="hero-main">
        <div class="hero-greet">${greeting}, ${STUDENT.nameTh.split(' ')[0]} 👋</div>
        <div class="hero-status">วันนี้คุณมีเรียน ${todayClasses.length} คลาส | ${activeClass ? 'กำลังเรียนอยู่ 1 วิชา' : 'พร้อมสำหรับการเรียนรู้!'}</div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat-item">
          <div class="h-val">${gpa}</div>
          <div class="h-lbl">GPAX</div>
        </div>
        <div class="hero-stat-item">
          <div class="h-val">${cr}</div>
          <div class="h-lbl">Credits</div>
        </div>
      </div>
    </div>
    
    <!-- Phase 4: Compliance & Reporting Quick Actions -->
    <div class="dash-grid-v2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 0 20px 20px;">
      <div class="glass-card interactive" onclick="GPSManager.checkInSuggestion()" style="display:flex; align-items:center; gap:12px; padding:15px; background:rgba(34, 197, 94, 0.05); border-left:4px solid #22c55e;">
        <div style="font-size:24px;">📍</div>
        <div>
          <div style="font-weight:700; font-size:13px; color:#22c55e;">Attendance</div>
          <div style="font-size:11px; opacity:0.7;">Check-in Nearby</div>
        </div>
      </div>
      <div class="glass-card interactive" onclick="PDFManager.generateTranscriptReport()" style="display:flex; align-items:center; gap:12px; padding:15px; background:rgba(79, 70, 229, 0.05); border-left:4px solid #4f46e5;">
        <div style="font-size:24px;">📄</div>
        <div>
          <div style="font-weight:700; font-size:13px; color:#4f46e5;">Academic Report</div>
          <div style="font-size:11px; opacity:0.7;">Signed Traceable PDF</div>
        </div>
      </div>
    </div>


    ${missingReflections.length > 0 ? `
      <div class="glass-card reflection-banner-v2" onclick="openPendingReflectionsModal()">
        <div class="rb-icon">🚨</div>
        <div class="rb-body">
          <div class="rb-title">มี Reflection ที่ยังไม่ได้สรุป! (${missingReflections.length} วิชา)</div>
          <div class="rb-list">ตรวจพบงานค้างที่ยังไม่ได้บันทึกความเข้าใจ</div>
        </div>
        <button class="nb-btn sm">จัดการเลย ✍️</button>
      </div>
    ` : ''}

    <div class="widget-grid">
      <!-- Widget: Today's Timeline -->
      <div class="glass-card widget-card nb-card">
        <div class="widget-header">
          <div class="widget-title"><span>📅</span> ตารางเรียนวันนี้</div>
          <div class="widget-action">${now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <div class="today-timeline">
          ${todayClasses.length > 0 ? todayClasses.map(c => {
    const isLive = activeClass && activeClass.id === c.id && activeClass.slot.startHour === c.slot.startHour;
    const isPast = currentTimeVal > c.slot.endHour;
    return `
              <div class="timeline-item ${isLive ? 'live' : ''} ${isPast ? 'past' : ''}">
                <div class="t-time">${c.slot.startHour}:00 - ${c.slot.endHour}:00</div>
                <div class="t-indicator"><div class="t-dot"></div><div class="t-line"></div></div>
                <div class="t-info" onclick="renderCourseHub('${c.id}')">
                  <div class="t-code" style="color:${c.color || 'var(--c-accent)'}">${c.code}</div>
                  <div class="t-name">${c.nameTh}</div>
                  <div class="t-meta">📍 ${c.room || 'N/A'} | ${c.mode || 'Onsite'}</div>
                  ${isLive ? '<div class="live-badge">กำลังเรียน</div>' : ''}
                </div>
              </div>
            `;
  }).join('') : `
            <div class="empty-state-v2">
              <div class="es-icon">🎉</div>
              <div class="es-text">วันนี้ไม่มีคลาสเรียน! พักผ่อนให้เต็มที่</div>
            </div>
          `}
        </div>
      </div>

      <!-- Widget: Progress & Stats -->
      <div class="glass-card widget-card nb-card">
        <div class="widget-header"><div class="widget-title"><span>📈</span> ความก้าวหน้า</div></div>
        <div class="stats-v2-grid">
           <div class="s2-item">
              <div class="s2-val">${pct}%</div>
              <div class="s2-lbl">สำเร็จแล้ว (137 นก.)</div>
              <div class="progress-bar-v2"><div class="pb-fill" style="width:${pct}%"></div></div>
           </div>
           <div class="s2-item">
              <div class="s2-val">${state.totalFocusHours.toFixed(1)}h</div>
              <div class="s2-lbl">เวลา Focus รวม</div>
           </div>
           <div class="s2-item">
              <div class="s2-val">${Object.values(state.assignments).flat().filter(a => !a.submitted).length}</div>
              <div class="s2-lbl">งานที่ค้างอยู่</div>
           </div>
        </div>
        
        <div class="widget-header" style="margin-top:20px;"><div class="widget-title"><span>📝</span> สอบที่ใกล้ที่สุด</div></div>
        ${Object.values(state.exams).flat().filter(e => getDaysUntil(e.date) >= 0).sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date)).slice(0, 1).map(e => {
    const course = findCourseById(e.courseId);
    return `
           <div class="exam-widget-item" style="padding:15px; background:rgba(0,0,0,0.03); border-radius:16px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div class="e-name" style="font-weight:800; font-size:14px;">${e.title || 'สอบ'}</div>
                <div class="e-meta" style="font-size:11px; opacity:0.6;">${course ? course.code : 'N/A'} | ${e.date}</div>
              </div>
              <div style="background:var(--c-rust); color:#fff; padding:4px 10px; border-radius:8px; font-weight:800; font-size:12px;">ใน ${getDaysUntil(e.date)} วัน</div>
           </div>
        `}).join('') || '<div class="empty-sm">ไม่มีการสอบเร็วๆ นี้</div>'}
      </div>

      <!-- Widget: Radio DJ Brain -->
      <div class="glass-card widget-card nb-card" style="background: rgba(79, 70, 229, 0.05);">
        <div class="widget-header"><div class="widget-title"><span>📻</span> MGR Radio</div></div>
        <div class="radio-widget-body">
            <div class="radio-disc ${Radio.isPlaying ? 'spinning' : ''}">💿</div>
            <div class="radio-info">
               <div class="r-status">${Radio.isPlaying ? 'NOW PLAYING' : 'OFFLINE'}</div>
               <div class="r-mode">${Radio.mode.toUpperCase()} MIX</div>
            </div>
            <button class="radio-toggle-btn ${Radio.isPlaying ? 'playing' : ''}" id="radioToggleBtn">
               ${Radio.isPlaying ? '⏹ STOP' : '▶ START'}
            </button>
         </div>
      </div>
    </div>
    
    <!-- Pro alerts -->
    ${pro ? proAlerts[pro] || '' : ''}

    <div class="quote-card glass nb-card" style="margin-top:20px; font-style:italic; text-align:center; padding:20px;">"${getTodayQuote()}"</div>
  </div>`;
}

function renderSemesters() {
  return `<div class="page-wrap">
    <div class="page-header-row">
      <h1 class="page-title">📅 เทอมการศึกษา</h1>
      <div class="hdr-acts">
        <button class="btn-glass-primary" id="importCalBtn">📥 นำเข้าปฏิทิน</button>
        <button class="btn-glass-primary" id="addSemBtn">+ เพิ่มเทอม</button>
      </div>
    </div>
    <div class="card-list">
      ${state.semesters.length === 0 ? `<div class="empty-hero"><div class="empty-icon">📅</div><h3>ยังไม่มีเทอมการศึกษา</h3><p>กด "+ เพิ่มเทอม" หรือ "นำเข้าปฏิทิน" เพื่อเริ่มต้น</p></div>` :
      state.semesters.map(sem => {
        const courses = state.courses[sem.id] || [];
        const semGPA = calcGPAFromList(courses);
        const isActive = getCurrentSemester()?.id === sem.id;
        const cr = courses.reduce((s, c) => s + (parseInt(c.credits) || 0), 0);
        return `<div class="glass-card sem-card ${isActive ? 'sem-active' : ''}">
            <div class="sem-top">
              <div>
                <div class="sem-name">${sem.name} ${isActive ? '<span class="badge-live">● ปัจจุบัน</span>' : ''}</div>
                <div class="sem-dates">📅 ${sem.startDate ? new Date(sem.startDate).toLocaleDateString('th-TH') : ''} — ${sem.endDate ? new Date(sem.endDate).toLocaleDateString('th-TH') : ''}</div>
              </div>
              <div class="sem-stats">
                <div class="sem-gpa-big" style="color:${GRADE_COLORS[semGPA] || 'var(--c-accent)'}">${semGPA}</div>
                <div class="sem-cr-lbl">${cr} หน่วยกิต</div>
              </div>
            </div>
            <div class="course-tags">
              ${courses.map(c => `<span class="ctag" style="border-color:${c.color || 'var(--c-accent)'}44;background:${c.color || 'var(--c-accent)'}11">
                ${c.code}${c.grade ? ` <span class="ctag-grade" style="background:${GRADE_COLORS[c.grade] || '#94a3b8'}33;color:${GRADE_COLORS[c.grade] || '#94a3b8'}">${c.grade}</span>` : ''}
              </span>`).join('') || '<span class="empty-tags">ยังไม่มีวิชา</span>'}
            </div>
            <div class="card-actions">
              <button class="btn-text-sm" data-edit-sem="${sem.id}">✏️ แก้ไข</button>
              <button class="btn-text-sm" data-view-sem="${sem.id}">📋 รายวิชา</button>
              <button class="btn-text-danger" data-del-sem="${sem.id}">🗑 ลบ</button>
            </div>
          </div>`;
      }).join('')}
    </div>
  </div>`;
}

function renderCourses() {
  const isArchiveView = state.courseView === 'archive';
  const filteredSemesters = state.semesters.filter(s => !state.selectedSemester || s.id === state.selectedSemester);

  const pastelMap = {
    '#4f46e5': '#dbeafe', '#0891b2': '#ecfeff', '#059669': '#f0fdf4',
    '#d97706': '#fefce8', '#dc2626': '#fee2e2', '#7c3aed': '#f5f3ff',
    '#db2777': '#fdf2f8', '#ea580c': '#fff7ed'
  };

  return `<div class="page-wrap">
    <div class="page-header-row">
      <h1 class="page-title" style="font-family: 'Playfair Display', serif; font-size: 36px; color: #000; -webkit-text-fill-color: initial;">Courses</h1>
      <div class="hdr-acts">
        <button class="btn-glass ${!isArchiveView ? 'active' : ''}" id="viewCurrentCourseBtn">Active</button>
        <button class="btn-glass ${isArchiveView ? 'active' : ''}" id="viewArchiveCourseBtn">Archive</button>
        <select class="glass-select" id="semFilterCourse">
          <option value="">— All Terms —</option>
          ${state.semesters.map(s => `<option value="${s.id}" ${state.selectedSemester === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="search-bar-modern" style="margin-bottom: 25px; display:flex; gap:10px;">
      <div style="position:relative; flex:1;">
        <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); opacity:0.5;">🔍</span>
        <input type="text" class="nb-input" id="courseLocalSearch" placeholder="Search a course" style="padding-left:40px; border-radius:10px; background:#fff;" value="${state.courseSearch || ''}" oninput="state.courseSearch = this.value; render();">
      </div>
      <select class="glass-select" onchange="state.courseStatusFilter = this.value; render();">
        <option value="all" ${state.courseStatusFilter === 'all' ? 'selected' : ''}>— All Status —</option>
        <option value="active" ${state.courseStatusFilter === 'active' ? 'selected' : ''}>📖 กำลังเรียน</option>
        <option value="done" ${state.courseStatusFilter === 'done' ? 'selected' : ''}>✅ เสร็จสิ้น</option>
      </select>
    </div>

    ${filteredSemesters.map(sem => {
    let courses = state.courses[sem.id] || [];
    courses = courses.filter(c => isArchiveView ? c.isArchived : !c.isArchived);

    if (state.courseStatusFilter === 'active') courses = courses.filter(c => !c.grade || c.grade === '-' || c.grade === 'I');
    if (state.courseStatusFilter === 'done') courses = courses.filter(c => c.grade && c.grade !== '-' && c.grade !== 'I');

    if (state.courseSearch) {
      const q = state.courseSearch.toLowerCase();
      courses = courses.filter(c => c.code.toLowerCase().includes(q) || c.nameTh.toLowerCase().includes(q) || (c.nameEn && c.nameEn.toLowerCase().includes(q)));
    }

    if (courses.length === 0) return '';

    return `
        <div class="sem-group-block">
          <div class="sem-group-hd" style="margin-top:20px;">${sem.name}</div>
          <div class="course-grid">
            ${courses.map(c => {
      const history = state.attendanceHistory[c.id] || {};
      const totalAtt = Object.keys(history).length;
      let attendCount = 0;
      let todayCheckedIn = false;
      const todayStr = new Date().toLocaleDateString('en-CA');
      Object.entries(history).forEach(([d, h]) => {
        if (!h.status.includes('ขาดเรียน')) attendCount++;
        if (d === todayStr) todayCheckedIn = true;
      });
      const attRate = totalAtt > 0 ? ((attendCount / totalAtt) * 100).toFixed(0) : '-';
      const attColor = attRate >= 80 || attRate === '-' ? 'var(--c-lime)' : 'var(--c-rust)';

      return `
              <div class="folder-card" style="--folder-bg: ${pastelMap[c.color] || c.color + '22'}; position:relative;" onclick="renderCourseHub('${c.id}')">
                <div style="position:absolute; top:10px; right:10px; display:flex; gap:5px; align-items:center;">
                   ${todayCheckedIn ? '<div style="background:var(--c-lime); color:white; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:bold;">✅ วันนี้เช็คแล้ว</div>' : ''}
                   ${attRate !== '-' ? `<div style="background:${attColor}; color:white; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:bold;">📍 ${attRate}%</div>` : ''}
                   <button class="icon-btn-sm" onclick="event.stopPropagation(); openAddCourseForm(${JSON.stringify(c).replace(/"/g, '&quot;')})">✏️</button>
                </div>
                <div class="folder-content" style="margin-top:15px;">
                  <div style="font-weight:900; font-size:16px; margin-bottom:8px; line-height:1.1;">${c.code}</div>
                  <div class="folder-label">${c.nameTh.substring(0, 15)}${c.nameTh.length > 15 ? '...' : ''}</div>
                </div>
              </div>
            `;
    }).join('')}
            <div class="folder-card add-folder" style="--folder-bg: #f1f5f9; border-style: dashed; justify-content:center; align-items:center;" onclick="openAddCourseForm()">
               <span style="font-size:30px; opacity:0.3;">+</span>
            </div>
          </div>
        </div>`;
  }).join('') || `<div class="empty-hero"><div class="empty-icon">${isArchiveView ? '🗄' : '📚'}</div><h3>Empty</h3></div>`}
  </div>`;
}

// ══════════════════════════════════════════════════
// SCHEDULE
// ══════════════════════════════════════════════════
function renderSchedule() {
  const daysShort = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const curSem = state.selectedSemester ? state.semesters.find(s => s.id === state.selectedSemester) : (getCurrentSemester() || state.semesters[state.semesters.length - 1]);
  const courses = curSem ? (state.courses[curSem.id] || []) : [];

  return `<div class="page-wrap">
    <div class="page-header-row">
      <h1 class="page-title">Precision Timetable</h1>
      <div class="hdr-acts">
        <select class="glass-select" id="schedSemFilter" onchange="state.selectedSemester=this.value; render();">
          <option value="">— All Terms —</option>
          ${state.semesters.map(s => `<option value="${s.id}" ${curSem?.id === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
        <button class="btn-glass" id="exportSchedBtn">📸 Save</button>
      </div>
    </div>

    <div class="tt-container glass-card" id="timetable">
      <div class="tt-grid">
        <div class="tt-corner"></div>
        ${(() => {
      const now = new Date();
      const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const currentHour = now.getHours() + (now.getMinutes() / 60);

      let html = daysShort.map((d, i) => `<div class="tt-header ${i === currentDay ? 'current-day' : ''}">${d}</div>`).join('');

      html += Array.from({ length: 13 }, (_, i) => 8 + i).map(h => `
            <div class="tt-time-label" style="grid-row: ${((h - 8) * 2) + 2}">${h}:00</div>
          `).join('');

      html += courses.flatMap(c => (c.schedules || c.schedule || []).map(s => {
        const rowStart = Math.floor((s.startHour - 8) * 2) + 2;
        const rowEnd = Math.ceil((s.endHour - 8) * 2) + 2;
        const isActive = s.day === currentDay && currentHour >= s.startHour && currentHour < s.endHour;
        const boxStyle = isActive ? `border-color: var(--c-lime); background: rgba(132,204,22,0.2); box-shadow: 0 0 10px rgba(132,204,22,0.4);` : `border-color: ${c.color}; background: ${c.color}22;`;

        return `<div class="tt-entry" data-course-id="${c.id}" onclick="renderCourseHub('${c.id}')" style="grid-column: ${s.day + 2}; grid-row: ${rowStart} / ${rowEnd}; ${boxStyle} cursor:pointer; position:relative;" title="ผู้สอน: ${c.instructor || '-'}\nห้อง: ${c.room || 'ไม่ระบุ'}">
                <div class="tt-code" style="color: ${isActive ? 'var(--c-lime)' : c.color}">${c.code}</div>
                <div class="tt-name">${c.nameTh}</div>
                <div style="font-size: 9px; opacity: 0.8; margin-top: 4px;">📍 ${c.room || 'Online'}</div>
                ${isActive ? `<div style="position:absolute; top:4px; right:4px; width:8px; height:8px; background:var(--c-lime); border-radius:50%; animation: pulse 1.5s infinite;"></div>` : ''}
              </div>`;
      })).join('');

      return html;
    })()}
      </div>
    </div>
  </div>`;
}

function renderIDCardPreview() {
  const photo = state.idCardPhoto || "https://img2.pic.in.th/pic/Student_Photo_Placeholder.png";
  return `
      <div class="glass-card nb-card" style="padding:20px; text-align:center; background:white; border:2px solid #ccc; max-width: 320px; margin: 0 auto; border-radius: 16px;">
        <div style="font-weight:900; font-size:16px; margin-bottom:15px; letter-spacing:1px; color:#1e293b; font-family:Kanit;">STUDENT IDENTIFICATION</div>
        
        <div style="margin-bottom:15px;">
          <img src="${photo}" style="width:120px; height:160px; object-fit:cover; border-radius:8px; border:2.5px solid #eee; box-shadow:0 4px 10px rgba(0,0,0,0.1);" onerror="this.src='https://img2.pic.in.th/pic/Student_Photo_Placeholder.png'">
        </div>

        <div style="font-size:16px; font-weight:700; color:#333; margin-bottom:4px; font-family:Kanit;">${STUDENT.nameTh}</div>
        <div style="font-size:12px; color:#666; margin-bottom:15px; font-family:Kanit;">${STUDENT.major}</div>

        <div style="margin: 0 auto 10px; width:fit-content; background:white; padding:5px; border:1px solid #eee; border-radius:6px;">
           <svg id="idBarcodePreview"></svg>
        </div>
        <div style="font-family:'JetBrains Mono', monospace; font-size:18px; font-weight:800; letter-spacing:3px; color:#1e293b;">
          ${STUDENT.id}
        </div>
        <div style="margin-top:10px; font-size:10px; font-weight:700; opacity:0.5; text-transform:uppercase;">
          Kasetsart University | Materials Engineering
        </div>
      </div>`;
}

function showIDCardModal() {
  openModal('🪪 My Student ID', `
        <div style="padding:10px;">
          ${renderIDCardPreview()}
          <p style="margin-top:20px; font-size:13px; text-align:center; opacity:0.6;">ใช้สำหรับสแกนเข้าห้องสมุดหรือติดต่อเจ้าหน้าที่</p>
        </div>
      `, `
        <button class="nb-btn-primary full" onclick="closeModal()">ปิดหน้าต่าง</button>
      `);
  renderIDBarcode();
}

function renderIDBarcode() {
  setTimeout(() => {
    const el = document.getElementById('idBarcodePreview');
    if (el) {
      JsBarcode("#idBarcodePreview", state.idCard.studentId || "20067105527480", {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 40,
        displayValue: false,
        margin: 0
      });
    }
  }, 50);
}

window.updateIDCard = (key, val) => {
  state.idCard[key] = val;
  document.getElementById('idCardPreviewWrap').innerHTML = renderIDCardPreview();
  renderIDBarcode();
};

window.saveIDCardConfig = async () => {
  localStorage.setItem('id_card_config', JSON.stringify(state.idCard));
  await fsSet('app_settings', 'id_card', state.idCard);
  showToast('✅ บันทึกข้อมูลบัตรและซิงก์สำเร็จ!');
  closeModal();
};

window.exportIDCard = async () => {
  const el = document.getElementById('idCardPreviewWrap');
  if (!el || typeof html2canvas === 'undefined') {
    showToast('❌ ไม่สามารถสร้างรูปได้ (html2canvas not loaded)', 'err');
    return;
  }

  showToast('⏳ กำลังเตรียมไฟล์รูปภาพ...');

  // FIX: If photoBase64 is missing (e.g. after reload), fetch it via server proxy
  if (state.idCard.fileId && !state.idCard.photoBase64) {
    showToast('⏳ กำลังดึงข้อมูลรูปภาพจาก Drive...');
    await new Promise((resolve) => {
      google.script.run.withSuccessHandler(res => {
        if (res.success) {
          state.idCard.photoBase64 = res.base64;
          updateIDCard('photoBase64', res.base64); // Update UI
          resolve();
        } else {
          showToast('⚠️ ไม่สามารถดึงรูปภาพแบบ CORS-safe ได้', 'warn');
          resolve();
        }
      }).getFileDataBase64(state.idCard.fileId);
    });
  }

  // Wait a bit for images/barcode to settle
  await new Promise(r => setTimeout(r, 600));

  try {
    const canvas = await html2canvas(el, {
      backgroundColor: null,
      scale: 3,
      useCORS: true,
      logging: false,
      allowTaint: true
    });
    const link = document.createElement('a');
    link.download = `Student_ID_${state.idCard.studentId || 'card'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('✅ บันทึกบัตรนิสิตสำเร็จ');
  } catch (e) {
    showToast('❌ เกิดข้อผิดพลาดในการสร้างรูป: ' + e.message, 'err');
    console.error(e);
  }
};

window.deleteSemesterCalendar = async (semName) => {
  if (!confirm(`ยืนยันที่จะลบปฏิทิน Google Calendar ของเทอม ${semName} ใช่หรือไม่?\n\n(การกระทำนี้จะลบ event ทั้งหมดที่เกี่ยวข้องกับเทอมนี้ออกจาก Google Calendar เท่านั้น แต่ข้อมูลในแอปยังคงอยู่)`)) return;

  if (typeof google !== 'undefined' && google.script) {
    showToast(`⏳ กำลังลบปฏิทิน...`);
    google.script.run.withSuccessHandler(res => {
      if (res && res.success) {
        showToast(`✅ ลบปฏิทิน ${semName} สำเร็จ`);
      } else {
        showToast(`❌ เกิดข้อผิดพลาด: ${res?.error || 'Unknown error'}`, 'err');
      }
    }).deleteCalendar(`NITIPAT MANAGER - ${semName}`);
  } else {
    showToast('❌ ไม่สามารถติดต่อ Google Script ได้', 'err');
  }
};

window.checkFcmStatus = () => {
  if (typeof google !== 'undefined' && google.script) {
    showToast('⌛ กำลังตรวจสอบจำนวนอุปกรณ์...');
    google.script.run.withSuccessHandler(res => {
      openModal('📱 สถานะการแจ้งเตือน', `
        <div style="text-align:center; padding:20px;">
          <div style="font-size:40px; margin-bottom:15px;">📡</div>
          <div style="font-size:18px; font-weight:700;">ลงทะเบียนไว้ ${res.count} อุปกรณ์</div>
          <p style="font-size:13px; color:var(--c-muted); margin-top:10px;">
            หากเปลี่ยนเครื่องใหม่ หรือล้างแคช เบราว์เซอร์จะลงทะเบียนรหัสใหม่ให้อัตโนมัติครับ
          </p>
          <div style="margin-top:20px; font-family:monospace; font-size:11px; opacity:0.6; text-align:left; background:rgba(0,0,0,0.05); padding:10px; border-radius:8px;">
            Tokens (Snippets):<br>
            ${res.tokens.map(t => `• ${t}`).join('<br>')}
          </div>
          <button class="btn-glass danger full" style="margin-top:20px;" onclick="resetFcmTokens()">🗑 ล้างข้อมูลอุปกรณ์ทั้งหมด</button>
        </div>
      `, '<button class="nb-btn nb-btn-primary full" onclick="closeModal()">รับทราบ</button>');
    }).getFcmStatus();
  } else {
    showToast('❌ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'err');
  }
};

window.checkSystemStatus = () => {
  if (typeof google !== 'undefined' && google.script) {
    showToast('⌛ กำลังตรวจสอบระบบ...');
    google.script.run.withSuccessHandler(res => {
      openModal('🛠 สถานะระบบหลังบ้าน', `
        <div style="padding:16px; font-size:13px;">
          <div class="stat-row"><strong>สถานะ Trigger:</strong> ${res.triggerActive ? '✅ ทำงานปกติ' : '❌ ดับอยู่'}</div>
          <div class="stat-row"><strong>จำนวนอุปกรณ์ (FCM):</strong> ${res.tokensCount} เครื่อง</div>
          <div class="stat-row"><strong>ทำงานล่าสุดเมื่อ:</strong> ${res.lastRun}</div>
          <div class="stat-row" style="margin-top:12px;"><strong>รายการ Trigger:</strong><br>${res.triggers.join(', ') || 'ไม่มี'}</div>
          <hr style="margin:12px 0; opacity:0.1">
          <button class="nb-btn sm full" onclick="testCalendarPermission()">🧪 ทดสอบสิทธิ์สร้างปฏิทิน</button>
        </div>
      `, '<button class="nb-btn nb-btn-primary full" onclick="closeModal()">ปิด</button>');
    }).getSystemStatus();
  }
};

window.testCalendarPermission = () => {
  showToast('⏳ กำลังทดสอบสร้างปฏิทิน...');
  google.script.run.withSuccessHandler(res => {
    if (res.success) showToast('✅ สิทธิ์ปฏิทินปกติ!');
    else alert('❌ ปัญหาปฏิทิน: ' + res.error);
  }).testCalendar();
};

window.testAlarmSound = async () => {
  showToast('🔊 กำลังทดสอบเสียงปลุก...');
  if (!state.alarmAudioCtx) {
    state.alarmAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.alarmAudioCtx.state === 'suspended') await state.alarmAudioCtx.resume();

  triggerAlarm({ id: 'test', label: '📢 ทดสอบระบบปลุก', repeat: [] });
  setTimeout(() => dismissAlarm(), 5000);
};

window.resetFcmTokens = async () => {
  if (!confirm('⚠️ ยืนยันที่จะล้างข้อมูลอุปกรณ์ทั้งหมดใช่หรือไม่?\n\n(ทุกเครื่องจะต้องกด "เปิดใช้งาน" ใหม่เพื่อรับแจ้งเตือนอีกครั้ง)')) return;

  if (typeof google !== 'undefined' && google.script) {
    showToast('⏳ กำลังล้างข้อมูล...');
    google.script.run.withSuccessHandler(async () => {
      closeModal();
      showToast('✅ ล้างข้อมูลสำเร็จ! กรุณากดลงทะเบียนใหม่');
      // ล้าง Firestore ด้วยเพื่อความสะอาด
      try {
        const snap = await getDocs(query(collection(db, 'fcm_tokens'), where('userId', '==', STUDENT.id)));
        for (const d of snap.docs) await deleteDoc(d.ref);
      } catch (e) { }
    }).resetFcmTokens();
  }
};

window.syncAllToCalendar = async (semId) => {
  const sem = state.semesters.find(s => s.id === semId);
  if (!sem) return;

  // กรองงานและสอบเฉพาะของเทอมนี้
  const semCourses = state.courses[semId] || [];
  const courseIds = semCourses.map(c => c.id);

  const assignments = Object.values(state.assignments).flat().filter(a => courseIds.includes(a.courseId));
  const exams = Object.values(state.exams).flat().filter(e => courseIds.includes(e.courseId));

  if (assignments.length === 0 && exams.length === 0) {
    showToast('⚠️ ไม่พบข้อมูลงานหรือการสอบในเทอมนี้', 'warn');
    return;
  }

  showToast(`⏳ กำลังซิงก์ข้อมูล ${assignments.length + exams.length} รายการไปยัง Google Calendar...`);

  let successCount = 0;
  const total = assignments.length + exams.length;

  const handleRes = async (item, type, res) => {
    if (res && res.success) {
      item.calendarEventId = res.eventId;
      await fsSet(type === 'assignment' ? 'assignments' : 'exams', item.id, item);
      successCount++;
      if (successCount === total) showToast(`✅ ซิงก์ข้อมูลทั้งหมดสำเร็จ!`);
    }
  };

  assignments.forEach(a => {
    google.script.run.withSuccessHandler(res => handleRes(a, 'assignment', res)).syncCalendarEvent(`NITIPAT MANAGER - ${sem.name}`, 'assignment', a);
  });
  exams.forEach(e => {
    google.script.run.withSuccessHandler(res => handleRes(e, 'exam', res)).syncCalendarEvent(`NITIPAT MANAGER - ${sem.name}`, 'exam', e);
  });
};

// ══════════════════════════════════════════════════
// ASSIGNMENTS
// ══════════════════════════════════════════════════
function renderAssignments() {
  const allCourses = Object.values(state.courses).flat();
  const allA = Object.entries(state.assignments).flatMap(([cid, arr]) => {
    const c = allCourses.find(x => x.id === cid);
    return arr.map(a => ({ ...a, courseName: c?.code || cid, courseColor: c?.color }));
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const pending = allA.filter(a => !a.submitted);
  const done = allA.filter(a => a.submitted);
  return `<div class="page-wrap">
    <div class="page-header-row">
      <h1 class="page-title">📋 การบ้าน / งาน</h1>
      <div class="hdr-acts">
        <button class="btn-glass ${state.assignView === 'list' ? 'active' : ''}" data-assign-view="list">≡ List</button>
        <button class="btn-glass ${state.assignView === 'kanban' ? 'active' : ''}" data-assign-view="kanban">⊞ Kanban</button>
        <button class="btn-glass ${state.assignView === 'cal' ? 'active' : ''}" data-assign-view="cal">📅 ปฏิทิน</button>
        <button class="btn-glass-primary" id="addAssignBtn">+ เพิ่มงาน</button>
      </div>
    </div>
    ${state.assignView === 'kanban' ? renderKanban(allA) : state.assignView === 'cal' ? renderAssignCal(allA) : renderAssignList(pending, done)}
  </div>`;
}

function renderAssignCal(allA) {
  return `<div class="glass-card" style="padding:20px;">
        <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:5px; text-align:center;">
          ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<strong>${d}</strong>`).join('')}
          ${Array.from({ length: 35 }, (_, i) => {
    const d = new Date(); d.setDate(i - 2);
    const dateStr = d.toISOString().split('T')[0];
    const tasks = allA.filter(a => a.dueDate === dateStr);
    return `<div style="min-height:80px; border:1px solid #eee; padding:5px; font-size:10px;">
              ${d.getDate()}<br>${tasks.map(t => `<div style="background:${t.courseColor}; color:#fff; border-radius:3px; margin-top:2px;">${t.title}</div>`).join('')}
            </div>`;
  }).join('')}
        </div>
      </div>`;
}

function renderAssignList(pending, done) {
  return `
    <div class="section-hd">📋 รอส่ง (${pending.length})</div>
    ${pending.length === 0 ? '<div class="empty-sm">✨ ส่งหมดแล้ว! ยอดเยี่ยมมาก</div>' :
      pending.map(a => renderAssignCard(a)).join('')}
    <div class="section-hd mt-4">✅ ส่งแล้ว (${done.length})</div>
    ${done.map(a => renderAssignCard(a, true)).join('') || '<div class="empty-sm muted">ยังไม่มีงานที่ส่งแล้ว</div>'}`;
}

function renderAssignCard(a, done = false) {
  const d = getDaysUntil(a.dueDate);
  const urgColor = !done && (d <= 0 ? 'var(--c-red)' : d <= 1 ? 'var(--c-orange)' : d <= 3 ? 'var(--c-yellow)' : 'var(--c-muted)');
  const remaining = d * 86400;
  const hours = Math.abs(d) * 24;
  return `<div class="assign-card glass-card ${done ? 'done' : ''}">
    <div class="ac-left">
      <button class="check-circle ${done ? 'checked' : ''}" data-toggle-assign="${a.id}">${done ? '✓' : ''}</button>
      <div class="ac-body">
        <div class="ac-title ${done ? 'strike' : ''}">${a.title}</div>
        <div class="ac-meta" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
          <span class="badge-course" style="background:${a.courseColor || 'var(--c-accent)'}22;color:${a.courseColor || 'var(--c-accent)'}">${a.courseName}</span>
          <span>📅 ${new Date(a.dueDate).toLocaleDateString('th-TH')} ${a.dueTime || ''}</span>
          ${a.maxScore ? `<span>💯 ${a.maxScore} คะแนน</span>` : ''}
          ${a.type ? `<span class="assign-type-badge">${a.type}</span>` : ''}
          ${a.folderUrl ? `
            <a href="${a.folderUrl}" target="_blank" class="badge-course" style="text-decoration:none; background:rgba(99,102,241,0.1); color:rgb(99,102,241); display:inline-flex; align-items:center; gap:4px; font-weight:600; border:1px solid rgba(99,102,241,0.2);">
              📂 โฟลเดอร์เก็บงาน
            </a>
          ` : ''}
        </div>
        ${a.note ? `<div class="ac-note">${a.note}</div>` : ''}
        ${!done && d <= 3 && d >= 0 ? `<div class="countdown-mini" style="color:${urgColor}">
          ⏱ เหลือ ${d === 0 ? 'วันสุดท้าย!' : d + 'วัน ' + hours % 24 + ' ชม.'}
        </div>`: ''}
        ${!done && d < 0 ? `<div class="countdown-mini" style="color:var(--c-red)">🔴 เลยกำหนดมา ${Math.abs(d)} วันแล้ว!</div>` : ''}
        ${a.subtasks?.length ? `<div class="subtask-bar">
          ${a.subtasks.map(st => `<div class="subtask-item ${st.done ? 'done' : ''}">
            <button class="st-check" data-toggle-st="${a.id}" data-st-idx="${a.subtasks.indexOf(st)}">${st.done ? '✓' : ''}</button>
            <span>${st.name}</span>
          </div>`).join('')}
        </div>`: ''}
      </div>
    </div>
    <div class="ac-right">
      ${!done ? `<span class="days-pill" style="background:${urgColor}22;color:${urgColor};border:1px solid ${urgColor}44">
        ${d === 0 ? 'วันนี้!' : d < 0 ? `เลย ${Math.abs(d)}วัน` : `${d} วัน`}
      </span>`: ''}
      <button class="icon-btn" data-add-subtask="${a.id}" title="เพิ่มงานย่อย">➕</button>
      <button class="icon-btn" data-edit-assign="${a.id}" title="แก้ไข">✏️</button>
      <button class="icon-btn danger" data-del-assign="${a.id}">🗑</button>
    </div>
  </div>`;
}

function renderKanban(all) {
  const statuses = ['ยังไม่เริ่ม', 'กำลังทำ', 'รอตรวจทาน', 'ส่งแล้ว'];
  const statusIcons = ['🔴', '🟡', '🔵', '✅'];
  return `<div class="kanban-board">
    ${statuses.map((s, si) => {
    const items = all.filter(a => (a.status || 'ยังไม่เริ่ม') === s);
    return `<div class="kanban-col glass-card" 
                 ondragover="window.handleDragOver(event)" 
                 ondragleave="window.handleDragLeave(event)"
                 ondrop="window.handleDrop(event, '${s}')">
        <div class="kanban-hd">${statusIcons[si]} ${s} <span class="kanbadge">${items.length}</span></div>
        ${items.map(a => `<div class="kanban-item" draggable="true" 
                               ondragstart="window.handleDragStart(event, '${a.id}')"
                               ondragend="window.handleDragEnd(event)">
          <div class="ki-title">${a.title}</div>
          <div class="ki-meta">${a.courseName} • ${getDaysUntil(a.dueDate)} วัน</div>
        </div>`).join('')}
      </div>`;
  }).join('')}
  </div>`;
}

// Drag & Drop Handlers
window.handleDragStart = (e, id) => {
  e.dataTransfer.setData('text/plain', id);
  e.target.classList.add('dragging');
};

window.handleDragEnd = (e) => {
  e.target.classList.remove('dragging');
};

window.handleDragOver = (e) => {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
};

window.handleDragLeave = (e) => {
  e.currentTarget.classList.remove('drag-over');
};

window.handleDrop = async (e, newStatus) => {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const id = e.dataTransfer.getData('text/plain');

  // Find assignment across all courses
  let assignment = null;
  let courseId = null;
  for (const cid in state.assignments) {
    const found = state.assignments[cid].find(a => a.id === id);
    if (found) {
      assignment = found;
      courseId = cid;
      break;
    }
  }

  if (assignment && assignment.status !== newStatus) {
    assignment.status = newStatus;
    // Auto-update 'submitted' flag if moved to 'ส่งแล้ว'
    if (newStatus === 'ส่งแล้ว') assignment.submitted = true;
    else if (newStatus === 'ยังไม่เริ่ม') assignment.submitted = false;

    showToast(`📦 ย้ายงานไปที่ [${newStatus}]`);
    localStorage.setItem('assignments', JSON.stringify(state.assignments));
    render();

    try {
      await fsSet('assignments', courseId, { assignments: state.assignments[courseId] });
    } catch (err) {
      console.warn("Firebase Kanban sync failed", err);
    }
  }
};

// ══════════════════════════════════════════════════
// EXAMS
// ══════════════════════════════════════════════════
function renderExams() {
  const allCourses = Object.values(state.courses).flat();
  const allE = Object.entries(state.exams).flatMap(([cid, arr]) => {
    const c = allCourses.find(x => x.id === cid);
    return arr.map(e => ({ ...e, courseName: c?.code || e.courseName || cid, courseColor: c?.color }));
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcoming = allE.filter(e => getDaysUntil(e.date) >= 0);
  const past = allE.filter(e => getDaysUntil(e.date) < 0);
  return `<div class="page-wrap">
    <div class="page-header-row">
      <h1 class="page-title">📝 ตารางสอบ</h1>
      <button class="btn-glass-primary" id="addExamBtn">+ เพิ่มการสอบ</button>
    </div>
    ${upcoming.length > 0 ? `<div class="exam-survival-banner glass-warn">
      🏥 Exam Survival — <strong>${upcoming.length}</strong> การสอบที่กำลังจะมาถึง
      ${upcoming[0] ? `| สอบใกล้สุด: <strong>${upcoming[0].title}</strong> อีก ${getDaysUntil(upcoming[0].date)} วัน` : ''}
    </div>`: ''}
    <div class="section-hd">📝 กำลังจะมาถึง (${upcoming.length})</div>
    ${upcoming.length === 0 ? '<div class="empty-sm">✨ ไม่มีการสอบที่กำลังจะมาถึง</div>' :
      upcoming.map(e => `<div class="exam-card glass-card">
        <div class="exam-countdown-box ${getDaysUntil(e.date) <= 3 ? 'urgent' : ''}">
          <div class="ex-days">${getDaysUntil(e.date)}</div>
          <div class="ex-days-lbl">วัน</div>
        </div>
        <div class="exam-info">
          <div class="exam-title">${e.title}</div>
          <div class="exam-meta">
            <span class="badge-course" style="background:${e.courseColor || 'var(--c-accent)'}22;color:${e.courseColor || 'var(--c-accent)'}">${e.courseName}</span>
            <span>📅 ${new Date(e.date).toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            ${e.time ? `<span>⏰ ${e.time}</span>` : ''}
            ${e.room ? `<span>📍 ${e.room}</span>` : ''}
            ${e.maxScore ? `<span>💯 ${e.maxScore} คะแนน</span>` : ''}
          </div>
          ${e.scope ? `<div class="exam-scope">📖 ขอบเขต: ${e.scope}</div>` : ''}
          ${e.notes ? `<div class="exam-scope">📝 ${e.notes}</div>` : ''}
        </div>
        <div style="display: flex; gap: 4px; margin-top: 8px;">
          <button class="icon-btn" data-edit-exam="${e.id}" title="แก้ไข">✏️</button>
          <button class="icon-btn danger" data-del-exam="${e.id}">🗑</button>
        </div>
      </div>`).join('')}
    <div class="section-hd mt-4">🗂 ที่ผ่านมา (${past.length})</div>
    ${past.slice(0, 5).map(e => `<div class="exam-card glass-card past-exam">
      <div class="exam-countdown-box past"><div class="ex-days">✓</div></div>
      <div class="exam-info"><div class="exam-title">${e.title}</div>
      <div class="exam-meta"><span class="badge-course">${e.courseName}</span></div></div>
    </div>`).join('')}
  </div>`;
}

// ══════════════════════════════════════════════════
// GRADES
// ══════════════════════════════════════════════════
function renderGrades(gpa, pro) {
  const proColors = { safe: '#22c55e', 'pro-low': '#eab308', 'pro-high': '#f97316', 'expelled': '#ef4444' };
  const proLabels = { safe: 'ปลอดภัย ✅', 'pro-low': 'ติดโปรต่ำ ⚠️', 'pro-high': 'ติดโปรสูง 🚨', 'expelled': 'พ้นสภาพ ❌' };
  const proMsgs = { safe: 'GPAX อยู่ในเกณฑ์ดี ต่อไปให้ได้ 2.00+', 'pro-low': 'GPAX 1.75–1.99 ต้องให้อาจารย์ที่ปรึกษาปลดล็อคก่อนลงทะเบียน', 'pro-high': 'GPAX 1.50–1.74 ระวัง! ติดต่อกัน 2 เทอม = ถูกไล่ออก', 'expelled': 'GPAX < 1.50 ติดต่อฝ่ายวิชาการทันที' };
  const statusColor = pro ? proColors[pro] : '#94a3b8';
  const lowGrades = Object.values(state.courses).flat().filter(c => c.grade && (c.grade === 'D' || c.grade === 'D+' || c.grade === 'F'));
  return `<div class="page-wrap">
    <div class="page-header-row">
      <h1 class="page-title">🎓 เกรด & GPA</h1>
      <div class="hdr-acts">
        <button class="btn-glass" id="exportGradeBtn">📄 ออกใบสรุป</button>
      </div>
    </div>

    <div class="gpa-hero glass-card" style="border:2px solid ${statusColor}44">
      <div class="gpa-hero-num" style="color:${statusColor}">${gpa}</div>
      <div class="gpa-hero-label">GPAX สะสม</div>
      <div class="gpa-hero-status" style="color:${statusColor}">${pro ? proLabels[pro] : '-'}</div>
      <div class="gpa-hero-msg">${pro ? proMsgs[pro] : ''}</div>
    </div>

    <div class="widget-grid">
      <div class="glass-card tool-card">
        <div class="tool-title">🎯 Reverse GPA (Target Mode)</div>
        <div class="tool-body" style="flex-direction:column; gap:10px;">
          <label style="font-size:11px;">ต้องการ GPAX สะสมเท่าไหร่?</label>
          <div style="display:flex; gap:8px;">
            <input type="number" class="glass-input sm" id="targetGPA" value="2.00" min="0" max="4" step="0.01">
            <button class="btn-glass-primary sm" id="calcTargetBtn">วิเคราะห์</button>
          </div>
        </div>
        <div id="targetResult" class="tool-result"></div>
      </div>
      <div class="glass-card tool-card">
        <div class="tool-title">🧮 Quick Simulation</div>
        <div class="tool-body">
          <div id="quickSimList" style="display:flex; flex-direction:column; gap:6px; max-height:200px; overflow-y:auto; margin-bottom:10px;">
            ${Object.values(state.courses).flat().map(c => `<div class="sim-row" data-cid="${c.id}">
              <span style="font-size:10px">${c.code}</span>
              <select class="glass-select sm">${Object.keys(GRADE_PTS).map(g => `<option ${c.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select>
            </div>`).join('')}
          </div>
          <button class="btn-glass-primary sm full" id="simBtn">คำนวณผล GPAX</button>
        </div>
        <div id="simResult"></div>
      </div>
    </div>

    ${lowGrades.length > 0 ? `<div class="glass-card low-grades-block">
      <div class="lg-title">📊 วิชาที่ควรพิจารณาลงเรียนใหม่ (Re-grade)</div>
      ${lowGrades.map(c => `<div class="lg-row">
        <span class="lg-code">${c.code}</span><span class="lg-name">${c.nameTh}</span>
        <span class="grade-badge-sm" style="background:${GRADE_COLORS[c.grade]}22;color:${GRADE_COLORS[c.grade]}">${c.grade}</span>
      </div>`).join('')}
    </div>`: ''}

    ${state.semesters.map(sem => {
    const courses = state.courses[sem.id] || [];
    const semGPA = calcGPAFromList(courses);
    return `<div class="glass-card grades-table-block">
        <div class="gt-header"><span>${sem.name}</span><span class="gt-gpa">GPA: ${semGPA}</span></div>
        <table class="grade-table">
          <thead><tr><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>หน่วยกิต</th><th>เกรด</th><th>เปลี่ยน</th></tr></thead>
          <tbody>
            ${courses.map(c => `<tr>
              <td class="mono-sm">${c.code}</td>
              <td class="name-cell">${c.nameTh}</td>
              <td class="center-cell">${c.credits}</td>
              <td class="center-cell">
                <span class="grade-badge-sm" style="background:${GRADE_COLORS[c.grade] || '#94a3b8'}22;color:${GRADE_COLORS[c.grade] || '#94a3b8'}">${c.grade || '—'}</span>
              </td>
              <td class="center-cell">
                <select class="grade-select-inline" data-course-id="${c.id}">
                  <option value="">-</option>
                  ${Object.keys(GRADE_PTS).map(g => `<option value="${g}" ${c.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
                </select>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }).join('')}
  </div>`;
}

// ══════════════════════════════════════════════════
// ROADMAP
// ══════════════════════════════════════════════════
function renderRoadmap() {
  const passedCodes = new Set();
  state.semesters.forEach(s => (state.courses[s.id] || []).forEach(c => { if (c.grade && c.grade !== 'F' && c.grade !== 'W' && c.grade !== 'N') passedCodes.add(c.code); }));
  const sections = [
    { label: '📖 หมวดวิชาศึกษาทั่วไป (30 cr)', courses: COURSE_DB.general, target: 30 },
    { label: '🔬 พื้นฐานทางวิทยาศาสตร์ (21 cr)', courses: COURSE_DB.science, target: 21 },
    { label: '⚙️ พื้นฐานทางวิศวกรรม (27 cr)', courses: COURSE_DB.engineering_basic, target: 27 },
    { label: '🏗 วิชาบังคับทางวิศวกรรม (37 cr)', courses: COURSE_DB.core, target: 37 },
    { label: '🔧 วิชาเลือกทางวิศวกรรม (16 cr)', courses: COURSE_DB.elective, target: 16 },
  ];
  return `<div class="page-wrap">
    <div class="page-header"><h1 class="page-title">🗺 Roadmap 4 ปี</h1></div>
    <div class="roadmap-wrap">
      ${sections.map(sec => {
    const passed = sec.courses.filter(c => passedCodes.has(c.code));
    const passedCr = passed.reduce((s, c) => s + c.credits, 0);
    const pct = Math.min(100, (passedCr / sec.target * 100)).toFixed(0);
    return `<div class="glass-card roadmap-section">
          <div class="rm-sec-hd">
            <span>${sec.label}</span>
            <span class="rm-pct">${pct}%</span>
          </div>
          <div class="prog-bar-bg sm"><div class="prog-bar-fill" style="width:${pct}%"></div></div>
          <div class="rm-courses">
            ${sec.courses.map(c => {
      const isPassed = passedCodes.has(c.code);
      const inProgress = Object.values(state.courses).flat().find(x => x.code === c.code && !x.grade);
      const prereqOk = checkPrereqs(c.code);
      return `<div class="rm-course-item ${isPassed ? 'passed' : inProgress ? 'in-progress' : !prereqOk.ok ? 'locked' : ''}" 
                   onclick="showCourseDetailsModal('${c.code}')" style="cursor:pointer;">
                <div class="rm-course-code">${c.code}</div>
                <div class="rm-course-name">${c.name}</div>
                <div class="rm-course-cr">${c.credits} cr</div>
                ${isPassed ? '<span class="rm-badge passed">✓ ผ่าน</span>' : inProgress ? '<span class="rm-badge inprog">📖 กำลังเรียน</span>' : !prereqOk.ok ? `<span class="rm-badge locked">🔒 ยังขาด: ${prereqOk.missing.join(', ')}</span>` : '<span class="rm-badge pending">รอเรียน</span>'}
              </div>`;
    }).join('')}
          </div>
        </div>`;
  }).join('')}
  </div>`;
}

// ══════════════════════════════════════════════════
// CALENDAR SETTINGS
// ══════════════════════════════════════════════════
function renderCalendar() {
  const settings = state.calendarSettings || {};
  return `<div class="page-wrap">
    <div class="page-header"><h1 class="page-title">🗓 ตั้งค่าปฏิทินการศึกษา</h1></div>
    
    <div class="glass-card">
      <div class="form-grid">
        <div class="fg"><label>วันเปิดเทอม (Start Semester)</label>
          <input type="date" class="glass-input" id="cal-start" value="${settings.semesterStart || ''}"></div>
        <div class="fg"><label>วันถอนวิชา (Withdraw Deadline)</label>
          <input type="date" class="glass-input" id="cal-withdraw" value="${settings.withdrawDeadline || ''}"></div>
        <div class="fg"><label>วันเริ่มสอบกลางภาค (Midterm Start)</label>
          <input type="date" class="glass-input" id="cal-midterm" value="${settings.midtermStart || ''}"></div>
        <div class="fg"><label>วันเริ่มสอบปลายภาค (Final Start)</label>
          <input type="date" class="glass-input" id="cal-final" value="${settings.finalStart || ''}"></div>
      </div>
      <div style="margin-top:20px;">
        <button class="btn-glass-primary full" id="saveCalendarBtn">💾 บันทึกการตั้งค่าปฏิทิน</button>
      </div>
    </div>

    <div class="glass-card" style="margin-top:20px;">
      <div class="widget-title">⏳ นับถอยหลัง</div>
      <div class="countdown-row">
        ${settings.withdrawDeadline ? `<div>📌 ถอนรายวิชาใน: <strong>${getDaysUntil(settings.withdrawDeadline)} วัน</strong></div>` : ''}
        ${settings.finalStart ? `<div>📝 สอบปลายภาคใน: <strong>${getDaysUntil(settings.finalStart)} วัน</strong></div>` : ''}
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════
// FOCUS MODE
// ══════════════════════════════════════════════════
function renderFocus() {
  if (state.isImmersiveFocus) {
    return renderImmersiveFocus();
  }

  const curSem = getCurrentSemester();
  const courses = curSem ? (state.courses[curSem.id] || []) : [];

  return `<div class="page-wrap">
    <div class="page-header"><h1 class="page-title">🍅 Focus Mode</h1></div>

    <div class="pomodoro-setup-card glass-card">
      <div class="focus-score-badge">Focus Score: ${state.focusScore}</div>
      <div class="st-v" style="font-size:3rem; margin-bottom:10px;">${getTreeEmoji()}</div>
      <h3>พร้อมโฟกัสหรือยัง?</h3>
      <p style="font-size:0.9rem; opacity:0.7; margin-bottom:20px;">คะแนนปัจจุบัน: ${state.focusScore}</p>

      <div class="fg full" style="text-align:left; margin-bottom:16px;">
        <label>คุณกำลังจะทำวิชาอะไร? (แนะนำให้เลือกเพื่อเก็บสถิติ)</label>
        <select class="glass-select full" id="focusCourseSelect">
          <option value="">— ไม่ระบุวิชา —</option>
          ${courses.map(c => `<option value="${c.id}" ${state.selectedFocusCourseId === c.id ? 'selected' : ''}>${c.code} — ${c.nameTh}</option>`).join('')}
        </select>
      </div>

      <div class="preset-grid">
        ${FOCUS_PRESETS.map(p => `
          <div class="preset-btn ${state.pomodoroWork === p.work ? 'active' : ''}" data-work="${p.work}" data-break="${p.break}">
            <div class="preset-icon">${p.icon}</div>
            <div class="preset-time">${p.work}m / ${p.break}m</div>
            <div class="preset-name">${p.name}</div>
          </div>
        `).join('')}
      </div>

      <div class="ambient-row">
        <button class="ambient-btn ${audioCtx ? 'active' : ''}" id="focusRainBtn" title="เสียงฝน">🌧</button>
        <button class="ambient-btn ${audioCtx ? 'active' : ''}" id="focusCafeBtn" title="เสียงคาเฟ่">☕</button>
        <button class="ambient-btn" id="focusStopNoiseBtn" title="หยุดเสียง">⏹</button>
      </div>

      <div class="fg full" style="margin-top:16px;">
        <label>🎙️ MGR Radio Channel</label>
        <div style="display:flex; gap:10px; margin-top:5px;">
           <button class="nb-btn sm ${Radio.mode === 'lofi' ? 'active' : ''}" onclick="Radio.mode='lofi'; render();">📻 LOFI Station</button>
           <button class="nb-btn sm ${Radio.mode === 'groove' ? 'active' : ''}" onclick="Radio.mode='groove'; render();">🎷 GROOVE Mix</button>
        </div>
      </div>

      <div style="margin-top:20px;">
        <button class="btn-glass-primary full" id="startImmersiveFocusBtn" style="padding:16px; font-size:1.1rem; border-radius:16px;">🚀 เริ่มจับเวลา (เข้าสู่โหมดเต็มหน้าจอ)</button>
      </div>
    </div>

    <div class="focus-stats glass-card" style="margin-top:20px;">
      <div class="fs-title">📊 สถิติการโฟกัสสะสม</div>
      <div class="fs-grid">
        <div class="fs-item">
          <div class="fs-val">${state.totalFocusHours.toFixed(1)}</div>
          <div class="fs-lbl">ชั่วโมงรวม</div>
        </div>
        <div class="fs-item">
          <div class="fs-val">${state.pomodoroCount}</div>
          <div class="fs-lbl">รอบที่สำเร็จ</div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderImmersiveFocus() {
  const rem = getPomodoroRemaining();
  const total = (state.pomodoroPhase === 'work' ? state.pomodoroWork : state.pomodoroBreak) * 60;
  const progress = (1 - rem / total) * 100;
  const dash = 377;
  const dashOffset = dash - (progress / 100) * dash;
  const treeSVG = getTreeSVG();

  return `<div class="focus-immersive-overlay">
    <div class="focus-score-badge">Focus Score: ${state.focusScore}</div>
    
    <div style="transform:scale(0.8); opacity:0.6; margin-bottom:-40px;">${treeSVG}</div>

    <div class="pom-ring-immersive">
      <svg class="pom-ring-svg" viewBox="0 0 140 140">
        <circle class="pom-ring-bg" cx="70" cy="70" r="60" fill="none" stroke-width="4"/>
        <circle class="pom-ring-progress" id="pomRingProgress" cx="70" cy="70" r="60" fill="none" 
          stroke-width="6" stroke-dasharray="${dash}" style="stroke-dashoffset: ${dashOffset}"/>
      </svg>
      <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; width:100%;">
        <div class="pom-phase-lbl" style="font-size:1rem; opacity:0.6; letter-spacing:2px; text-transform:uppercase;">
          ${state.pomodoroPhase === 'work' ? 'Deep Work' : 'Break Time'}
        </div>
        <div class="pom-time-big" id="pomTimeDisplay">${fmtTime(rem)}</div>
      </div>
    </div>

    <div class="focus-controls">
      <button class="btn-glass sm" id="pausePomBtn">${state.pomodoroActive ? '⏸ Pause' : '▶️ Resume'}</button>
      <button class="btn-glass danger sm" id="stopPomBtn">⏹ End Session</button>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════
// CLUB
// ══════════════════════════════════════════════════
function renderClub() {
  const tasks = state.clubTasks || [];
  return `<div class="page-wrap">
    <div class="page-header-row">
      <div>
        <h1 class="page-title">🏛 งานประธานชุมนุม</h1>
        <div class="page-sub">บันทึกรายการงานที่ต้องจัดการ</div>
      </div>
      <button class="btn-glass-primary" id="addClubTaskBtn">+ เพิ่มงาน</button>
    </div>

    <div class="glass-card nb-card" style="padding:20px;">
      <div style="font-weight:800; font-size:16px; margin-bottom:15px; border-bottom:2px solid black; padding-bottom:10px;">📋 รายการงาน (Checklist)</div>
      <div class="club-task-list" style="display:flex; flex-direction:column; gap:10px;">
        ${tasks.map((t, i) => `
          <div class="club-task-row ${t.done ? 'done' : ''}" style="display:flex; align-items:center; gap:12px; padding:12px; background:white; border:1.5px solid black; border-radius:12px;">
            <button class="check-circle sm ${t.done ? 'checked' : ''}" data-toggle-club="${i}" style="width:28px; height:28px; border-radius:50%; border:2px solid black; background:${t.done ? 'var(--c-indigo)' : 'white'}; color:white; display:flex; align-items:center; justify-content:center; font-weight:800;">${t.done ? '✓' : ''}</button>
            <div style="flex:1;">
              <div style="font-weight:700; font-size:14px; text-decoration:${t.done ? 'line-through' : 'none'}; opacity:${t.done ? 0.5 : 1};">${t.title}</div>
              ${t.note ? `<div style="font-size:11px; opacity:0.6;">${t.note}</div>` : ''}
              ${t.due ? `<div style="font-size:11px; color:var(--c-rust); font-weight:700; margin-top:2px;">📅 กำหนด: ${t.due}</div>` : ''}
            </div>
            <button class="icon-btn danger sm" data-del-club="${i}" style="background:transparent; border:none; color:var(--c-red); font-size:16px;">🗑</button>
          </div>
        `).join('')}
        ${tasks.length === 0 ? '<div class="empty-sm" style="padding:40px;">ยังไม่มีงานที่จดไว้</div>' : ''}
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════
// MONEYPOD STATE PERSISTENCE
// ══════════════════════════════════════════════════
window.saveMoneyPod = saveMoneyPod;

window.mpSearchTags = function() {
  const q = document.getElementById('reportTagSearch')?.value.trim();
  if (!q) return;
  const matches = state.moneyTransactions.filter(t => t.tags && t.tags.includes(q));
  const html = matches.map(t => `<div style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between;"><span>${t.notes} (${t.date})</span><b style="color: #ef4444;">฿${t.amount}</b></div>`).join('');
  openModal('🔍 ผลลัพธ์สำหรับแท็ก ' + q, html || '<div style="padding: 30px; text-align: center; color: #94a3b8;">ไม่พบประวัติสำหรับแท็กนี้</div>');
};

window.mpOpenWalletEditor = function() {
  let bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:16px; max-height: 400px; overflow-y: auto; padding-right: 5px;">
      <p style="font-size:12px; color:#64748b; margin:0 0 8px 0; line-height:1.5;">คุณสามารถปรับเปลี่ยนชื่อกระเป๋าเงิน ยอดเงินคงเหลือปัจจุบัน หรือขีดจำกัดวงเงินเครดิตสำหรับการบันทึกหนี้สิน/ผ่อนชำระ (SPayLater & SEasyCash)</p>
  `;
  
  state.moneyWallets.forEach((w, index) => {
    const isDebt = w.type === 'debt';
    bodyHtml += `
      <div style="background: rgba(0,0,0,0.02); padding: 14px; border-radius: 14px; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 13px; font-weight: 900; color: var(--primary);">${w.type === 'debt' ? '💳 บัญชีวงเงินสินเชื่อ (หนี้สิน)' : '💰 บัญชีเงินเก็บ (สินทรัพย์)'}</span>
          <span style="font-size: 11px; font-weight: 700; color: #94a3b8;">ID: ${w.id.toUpperCase()}</span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="font-size: 10px; font-weight: 800; color: #64748b; display: block; margin-bottom: 4px;">ชื่อบัญชี</label>
            <input type="text" class="glass-input sm" id="editWalletName_${index}" value="${w.name}" style="width: 100%; border-radius: 10px; padding: 6px 10px;">
          </div>
          <div>
            <label style="font-size: 10px; font-weight: 800; color: #64748b; display: block; margin-bottom: 4px;">
              ${isDebt ? 'ยอดใช้ไปแล้ว (บาท)' : 'ยอดเงินคงเหลือ (บาท)'}
            </label>
            <input type="number" class="glass-input sm" id="editWalletBalance_${index}" value="${w.balance}" style="width: 100%; border-radius: 10px; padding: 6px 10px;">
          </div>
        </div>
        
        ${isDebt ? `
        <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
          <div>
            <label style="font-size: 10px; font-weight: 800; color: #64748b; display: block; margin-bottom: 4px;">วงเงินสูงสุด (บาท)</label>
            <input type="number" class="glass-input sm" id="editWalletLimit_${index}" value="${w.limit || 0}" style="width: 100%; border-radius: 10px; padding: 6px 10px;">
          </div>
        </div>
        ` : ''}
      </div>
    `;
  });
  
  bodyHtml += `</div>`;
  
  const footerHtml = `
    <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
      <button class="btn-glass-pastel" onclick="closeModal()" style="padding: 8px 16px; border-radius:10px; font-size:12px;">ยกเลิก</button>
      <button class="btn-pastel-primary" onclick="mpSaveWallets()" style="padding: 8px 20px; border-radius:10px; font-size:12px;">💾 บันทึกข้อมูล</button>
    </div>
  `;
  
  openModal('✏️ ปรับแต่งกระเป๋าเงิน & วงเงิน', bodyHtml, footerHtml);
};

window.mpSaveWallets = function() {
  try {
    state.moneyWallets.forEach((w, index) => {
      const nameInput = document.getElementById(`editWalletName_${index}`);
      const balanceInput = document.getElementById(`editWalletBalance_${index}`);
      const limitInput = document.getElementById(`editWalletLimit_${index}`);
      
      if (nameInput) w.name = nameInput.value.trim() || w.name;
      if (balanceInput) w.balance = parseFloat(balanceInput.value) || 0;
      if (w.type === 'debt' && limitInput) w.limit = parseFloat(limitInput.value) || 0;
    });
    
    saveMoneyPod();
    render();
    closeModal();
    showToast('💾 ปรับแต่งกระเป๋าเงินและวงเงินเรียบร้อยแล้ว!', 'success');
  } catch (e) {
    console.error("Failed to save wallets:", e);
    showToast('❌ เกิดข้อผิดพลาดในการบันทึกกระเป๋าเงิน', 'err');
  }
};

// ══════════════════════════════════════════════════
// MONEYPOD (PERSONAL FINANCE HUB)
// ══════════════════════════════════════════════════
function renderMoneyPod() {
  const subView = state.moneySubView || 'overview';
  const selectedWalletId = state.moneySelectedWalletId || null;
  const themeClass = state.moneyTheme || 'theme-mint';
  
  const scopedStyle = `
    <style>
      .mp-wrap {
        --primary: #10b981;
        --accent: #6ee7b7;
        --bg-grad: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        --card-bg: rgba(255, 255, 255, 0.7);
        font-family: 'Outfit', 'Inter', 'Kanit', sans-serif;
        padding: 24px;
        border-radius: 28px;
        color: #1e293b;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 20px 40px rgba(0,0,0,0.03);
        margin-bottom: 90px;
        position: relative;
        overflow: hidden;
      }
      
      .mp-wrap.theme-mint {
        --primary: #10b981;
        --accent: #6ee7b7;
        --bg-grad: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        --card-bg: rgba(255, 255, 255, 0.75);
      }
      .mp-wrap.theme-peach {
        --primary: #f97316;
        --accent: #fdba74;
        --bg-grad: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
        --card-bg: rgba(255, 255, 255, 0.8);
      }
      .mp-wrap.theme-pink {
        --primary: #ec4899;
        --accent: #fbcfe8;
        --bg-grad: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
        --card-bg: rgba(255, 255, 255, 0.8);
      }
      .mp-wrap.theme-lavender {
        --primary: #a855f7;
        --accent: #e9d5ff;
        --bg-grad: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
        --card-bg: rgba(255, 255, 255, 0.75);
      }
      
      .mp-wrap {
        background: var(--bg-grad);
      }
      
      .mp-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        flex-wrap: wrap;
        gap: 15px;
      }
      
      .mp-title-section h1 {
        font-size: 28px;
        font-weight: 900;
        background: linear-gradient(120deg, var(--primary), #1e293b);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .mp-theme-picker {
        display: flex;
        gap: 8px;
        background: rgba(255,255,255,0.6);
        padding: 6px;
        border-radius: 20px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.02);
      }
      
      .theme-dot {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        transition: transform 0.2s ease;
      }
      .theme-dot:hover {
        transform: scale(1.2);
      }
      .theme-dot.mint { background: #10b981; }
      .theme-dot.peach { background: #f97316; }
      .theme-dot.pink { background: #ec4899; }
      .theme-dot.lavender { background: #a855f7; }
      
      .mp-subview-tabs {
        display: flex;
        background: rgba(0,0,0,0.03);
        padding: 5px;
        border-radius: 18px;
        margin-bottom: 25px;
        gap: 4px;
        overflow-x: auto;
      }
      
      .mp-tab-btn {
        flex: 1;
        padding: 10px 16px;
        border: none;
        background: none;
        font-size: 13px;
        font-weight: 700;
        color: #64748b;
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      
      .mp-tab-btn.active {
        background: white;
        color: var(--primary);
        box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      }
      
      .mp-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
      }
      @media(min-width: 768px) {
        .mp-grid {
          grid-template-columns: 350px 1fr;
        }
      }
      
      .mp-card {
        background: var(--card-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255,255,255,0.4);
        border-radius: 24px;
        padding: 22px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.01);
        margin-bottom: 20px;
        position: relative;
      }
      
      .networth-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%);
      }
      
      .nw-val {
        font-size: 34px;
        font-weight: 950;
        color: var(--primary);
        margin: 6px 0;
        letter-spacing: -0.5px;
      }
      
      .circle-progress-wrap {
        position: relative;
        width: 110px;
        height: 110px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .circle-progress-svg {
        transform: rotate(-90deg);
        width: 110px;
        height: 110px;
      }
      .circle-bg {
        fill: none;
        stroke: rgba(0,0,0,0.04);
        stroke-width: 8;
      }
      .circle-fg {
        fill: none;
        stroke: var(--primary);
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.6s ease;
      }
      .circle-text {
        position: absolute;
        font-size: 13px;
        font-weight: 850;
        color: #1e293b;
        text-align: center;
      }
      
      .wallets-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .wallet-card {
        padding: 14px;
        border-radius: 16px;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.01);
        border: 2px solid transparent;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 95px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .wallet-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 18px rgba(0,0,0,0.03);
      }
      .wallet-card.active {
        border-color: var(--primary);
        background: rgba(255, 255, 255, 0.95);
      }
      .wallet-name {
        font-size: 12px;
        font-weight: 800;
        color: #64748b;
      }
      .wallet-bal {
        font-size: 16px;
        font-weight: 900;
        color: #1e293b;
      }
      .wallet-limit {
        font-size: 9px;
        color: #94a3b8;
        margin-top: 1px;
      }
      
      .scanner-window {
        position: relative;
        border: 2px dashed var(--primary);
        border-radius: 20px;
        height: 220px;
        background: rgba(255,255,255,0.4);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        margin-bottom: 15px;
      }
      .scanner-window img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 10px;
      }
      .scan-laser {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 6px;
        background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.8), transparent);
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.9);
        display: none;
      }
      .scanner-window.scanning .scan-laser {
        display: block;
        animation: laserScan 1.5s infinite ease-in-out;
      }
      @keyframes laserScan {
        0% { top: 0%; }
        50% { top: 100%; }
        100% { top: 0%; }
      }
      
      .goal-progress-bar {
        height: 8px;
        background: rgba(0,0,0,0.05);
        border-radius: 4px;
        overflow: hidden;
        margin: 8px 0;
      }
      .goal-progress-fill {
        height: 100%;
        background: var(--primary);
        border-radius: 4px;
        transition: width 0.5s ease;
      }
      
      .tx-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: white;
        border-radius: 16px;
        margin-bottom: 10px;
        border: 1px solid rgba(0,0,0,0.02);
        box-shadow: 0 2px 8px rgba(0,0,0,0.01);
        transition: all 0.2s ease;
      }
      .tx-row:hover {
        transform: scale(1.01);
      }
      .tx-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .tx-icon {
        font-size: 20px;
        background: rgba(0,0,0,0.03);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
      }
      .tx-details {
        display: flex;
        flex-direction: column;
      }
      .tx-desc {
        font-size: 13px;
        font-weight: 700;
        color: #1e293b;
      }
      .tx-sub {
        font-size: 10px;
        color: #94a3b8;
        margin-top: 2px;
      }
      .tx-amount {
        font-weight: 900;
        font-size: 14px;
      }
      .tx-amount.income { color: #10b981; }
      .tx-amount.expense { color: #ef4444; }
      .tx-amount.transfer { color: #3b82f6; }
      
      .pill-badge {
        font-size: 9px;
        padding: 2px 6px;
        border-radius: 8px;
        font-weight: 700;
        margin-right: 4px;
        display: inline-block;
      }
      
      .btn-glass-pastel {
        background: white;
        border: 1px solid rgba(0,0,0,0.04);
        border-radius: 14px;
        padding: 10px 14px;
        font-weight: 700;
        font-size: 12px;
        color: #1e293b;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s ease;
      }
      .btn-glass-pastel:hover {
        background: rgba(255,255,255,0.8);
        transform: translateY(-1px);
      }
    </style>
  `;

  // Bind the global MoneyPod event and action handlers once on window
  if (!window.mpHandlersInitialized) {
    window.mpSetView = function(view) {
      state.moneySubView = view;
      render();
    };

    window.mpSetTheme = function(theme) {
      state.moneyTheme = theme;
      saveMoneyPod();
      render();
    };

    window.mpSetSelectedWallet = function(walletId) {
      state.moneySelectedWalletId = state.moneySelectedWalletId === walletId ? null : walletId;
      render();
    };

    window.mpEditDailyBudget = function() {
      const bStr = prompt("💸 ตั้งค่างบประมาณใช้จ่ายรายวัน (บาท):", state.moneyDailyBudget);
      const budget = parseFloat(bStr);
      if (!isNaN(budget) && budget >= 0) {
        state.moneyDailyBudget = budget;
        saveMoneyPod();
        render();
        showToast("💰 อัปเดตงบประมาณรายวันเรียบร้อยแล้ว");
      }
    };

    window.mpHandlePhotoUpload = function(input) {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          state.mpUploadedPhoto = e.target.result;
          document.getElementById('txPhotoPreview').innerHTML = `<img src="${state.mpUploadedPhoto}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; border:1px solid #ddd;">`;
          showToast('📸 แนบรูปใบเสร็จ/สลิปเรียบร้อย');
        };
        reader.readAsDataURL(file);
      }
    };

    window.mpSelectMockReceipt = function(type) {
      state.mpSelectedMockReceiptType = type;
      const mockImage = document.getElementById('receiptPreviewImage');
      const details = document.getElementById('mockReceiptDetails');
      if (type === 'seven') {
        mockImage.src = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80';
        details.innerHTML = '📄 ใบเสร็จ 7-Eleven (ข้าวผัด + น้ำดื่ม) — ยอด ฿187';
      } else if (type === 'starbucks') {
        mockImage.src = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80';
        details.innerHTML = '☕ ใบเสร็จ Starbucks (Latte + Croissant) — ยอด ฿340';
      } else if (type === 'shabu') {
        mockImage.src = 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80';
        details.innerHTML = '🍲 บิลร้านชาบูบุฟเฟต์ — ยอด ฿499';
      }
    };

    window.mpScanMockFallback = function(type, win, detailsEl) {
      if (win) win.classList.remove('scanning');
      
      let amount = 187;
      let desc = '7-Eleven อาหารมื้อเบา';
      let cat = '🍔 อาหาร & เครื่องดื่ม';
      let tags = '#seven #snacks';
      
      if (type === 'starbucks') {
        amount = 340;
        desc = 'Starbucks Coffee มื้อสาย';
        cat = '🍔 อาหาร & เครื่องดื่ม';
        tags = '#coffee #starbucks';
      } else if (type === 'shabu') {
        amount = 499;
        desc = 'ชาบูบุฟเฟต์มื้อเย็นฉลองหลังสอบ';
        cat = '🍔 อาหาร & เครื่องดื่ม';
        tags = '#shabu #buffet';
      }
      
      if (detailsEl) detailsEl.innerHTML = `📄 ดึงข้อมูลสำเร็จ: ${desc} — ยอด ฿${amount.toLocaleString()}`;
      
      state.moneySubView = 'overview';
      render();
      
      setTimeout(() => {
        if(document.getElementById('txType')) document.getElementById('txType').value = 'expense';
        if(document.getElementById('txAmount')) document.getElementById('txAmount').value = amount;
        if(document.getElementById('txCategory')) document.getElementById('txCategory').value = cat;
        if(document.getElementById('txNotes')) document.getElementById('txNotes').value = desc;
        if(document.getElementById('txTags')) document.getElementById('txTags').value = tags;
        if(document.getElementById('txWallet')) document.getElementById('txWallet').value = 'cash';
        
        triggerConfetti();
        showToast('✨ AI ดึงข้อมูลใบเสร็จและจำแนกอัตโนมัติสำเร็จแล้ว!');
      }, 120);
    };

    window.mpScanReceiptStart = async function() {
      const type = state.mpSelectedMockReceiptType || 'seven';
      const win = document.getElementById('scannerWin');
      if (!win) return;
      
      win.classList.add('scanning');
      const detailsEl = document.getElementById('mockReceiptDetails');
      if (detailsEl) detailsEl.innerHTML = '⌛ AI กำลังเตรียมโมเดลและปรับแต่งภาพ...';
      showToast('⌛ กำลังวิเคราะห์ใบเสร็จด้วย AI OCR...');

      if (type === 'custom_uploaded' && typeof Tesseract !== 'undefined') {
        try {
          const fileInput = document.getElementById('aiPhotoUpload');
          const file = fileInput?.files?.[0];
          if (!file) {
            win.classList.remove('scanning');
            showToast('⚠️ ไม่พบรูปภาพใบเสร็จ กรุณาอัปโหลดรูปภาพใหม่อีกครั้ง', 'err');
            return;
          }

          const result = await Tesseract.recognize(
            file,
            'eng+tha',
            { 
              logger: m => {
                if (m.status === 'recognizing' && detailsEl) {
                  detailsEl.innerHTML = `⌛ AI กำลังจำแนกตัวอักษร... (${Math.round(m.progress * 100)}%)`;
                }
              }
            }
          );

          const text = result.data.text;
          console.log("OCR Extracted Text:\n", text);

          let amount = 0;
          let desc = 'ใบเสร็จสแกนผ่าน AI';
          let cat = '🍔 อาหาร & เครื่องดื่ม';
          let tags = '#ocr #receipt';

          const lines = text.split('\n');
          let parsedAmounts = [];
          
          lines.forEach(line => {
            const lowerLine = line.toLowerCase();
            const cleanLine = lowerLine.replace(/\s+/g, '');
            
            // Check for total keywords with OCR misspelling tolerances
            const isTotal = ['total', 'net', 'sum', 'ยอด', 'สุทธิ', 'รวม', 'ราคา', 'amount', 'baht', 'บาท', 'ฑธ', 'ขั้น', 'สุทธ'].some(kw => cleanLine.includes(kw));
            const isReceived = ['cash', 'เงินสด', 'รับเงิน', 'จ่าย', 'receive', 'pay', 'เสต'].some(kw => cleanLine.includes(kw));
            const isChange = ['ทอน', 'change'].some(kw => cleanLine.includes(kw));

            // 1. Decimal numbers with strict word boundaries to avoid tax ID collisions (e.g. 71.50, 5.50)
            const decimalRegex = /\b([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\b/g;
            const matches = line.match(decimalRegex);
            
            if (matches) {
              matches.forEach(m => {
                const val = parseFloat(m.replace(/,/g, ''));
                if (!isNaN(val) && val > 0) {
                  let priority = 1;
                  if (isTotal) priority = 4;        // Highest priority for Net Total decimal candidates
                  else if (isReceived) priority = 2; // Cash Received (e.g. 100.00)
                  else if (isChange) priority = 1;   // Change (e.g. 28.50)
                  
                  parsedAmounts.push({ val: val, priority: priority, isDecimal: true });
                }
              });
            } else {
              // 2. Fallback to standalone integers with strict word boundaries to avoid long ID collisions (e.g. 71)
              const intRegex = /\b([0-9]{1,4})\b/g;
              const intMatches = line.match(intRegex);
              if (intMatches) {
                intMatches.forEach(m => {
                  const val = parseFloat(m);
                  if (!isNaN(val) && val > 0) {
                    let priority = 0; // Standalone integer is lower priority than decimal
                    if (isTotal) priority = 3;
                    
                    parsedAmounts.push({ val: val, priority: priority, isDecimal: false });
                  }
                });
              }
            }
          });

          if (parsedAmounts.length > 0) {
            // Sort by priority first (highest to lowest), then prefer decimals, then sort values descending to find the correct Net Total on the total line
            parsedAmounts.sort((a, b) => {
              if (b.priority !== a.priority) return b.priority - a.priority;
              if (b.isDecimal !== a.isDecimal) return b.isDecimal ? 1 : -1;
              return b.val - a.val;
            });
            amount = parsedAmounts[0].val;
          }

          if (amount === 0) amount = 150;

          const lowerText = text.toLowerCase();
          if (lowerText.includes('seven') || lowerText.includes('7-eleven') || lowerText.includes('7-11')) {
            desc = 'ร้านสะดวกซื้อ 7-Eleven';
            tags += ' #seven #convenience';
          } else if (lowerText.includes('starbucks')) {
            desc = 'Starbucks Coffee';
            tags += ' #coffee #starbucks';
          } else if (lowerText.includes('shabu') || lowerText.includes('ชาบู') || lowerText.includes('buffet')) {
            desc = 'ร้านชาบูบุฟเฟ่ต์';
            tags += ' #shabu #buffet';
          } else if (lowerText.includes('lotus') || lowerText.includes('โลตัส')) {
            desc = 'Lotus Supermarket';
            tags += ' #lotus #grocery';
          } else if (lowerText.includes('big c') || lowerText.includes('บิ๊กซี')) {
            desc = 'Big C Supercenter';
            tags += ' #bigc #grocery';
          } else {
            const firstLine = lines.map(l => l.trim()).find(l => l.length > 3 && !/[0-9]/.test(l));
            if (firstLine) {
              desc = firstLine.substring(0, 30);
            }
          }

          if (lowerText.match(/(food|eat|restaurant|shabu|buffet|coffee|cafe|tea|ชาบู|อาหาร|กาแฟ|น้ำดื่ม|อร่อย)/)) {
            cat = '🍔 อาหาร & เครื่องดื่ม';
            tags += ' #food';
          } else if (lowerText.match(/(taxi|bts|mrt|gas|fuel|oil|รถไฟฟ้า|เดินทาง|น้ำมัน|รถเมล์)/)) {
            cat = '🚗 เดินทาง';
            tags += ' #travel';
          } else if (lowerText.match(/(clothes|shoes|shopping|mall|ห้าง|เสื้อผ้า|รองเท้า|ช็อปปิ้ง)/)) {
            cat = '🛍️ ช็อปปิ้ง';
            tags += ' #shopping';
          } else {
            cat = '🍔 อาหาร & เครื่องดื่ม';
          }

          win.classList.remove('scanning');
          if (detailsEl) detailsEl.innerHTML = `📄 ดึงข้อมูลสำเร็จ: ${desc} — ยอด ฿${amount.toLocaleString()}`;
          
          state.moneySubView = 'overview';
          render();
          
          setTimeout(() => {
            if(document.getElementById('txType')) document.getElementById('txType').value = 'expense';
            if(document.getElementById('txAmount')) document.getElementById('txAmount').value = amount;
            if(document.getElementById('txCategory')) document.getElementById('txCategory').value = cat;
            if(document.getElementById('txNotes')) document.getElementById('txNotes').value = desc;
            if(document.getElementById('txTags')) document.getElementById('txTags').value = tags;
            if(document.getElementById('txWallet')) document.getElementById('txWallet').value = 'cash';
            
            triggerConfetti();
            showToast('✨ AI วิเคราะห์และสแกนใบเสร็จจริงสำเร็จแล้ว!');
          }, 120);

        } catch (e) {
          console.error("AI OCR parsing error:", e);
          win.classList.remove('scanning');
          showToast('⚠️ การวิเคราะห์ OCR ล้มเหลว จะใช้ค่าจำลองแทน', 'err');
          mpScanMockFallback(type, win, detailsEl);
        }
      } else {
        setTimeout(() => {
          mpScanMockFallback(type, win, detailsEl);
        }, 1800);
      }
    };

    window.mpAddTransaction = function() {
      const type = document.getElementById('txType').value;
      const amount = parseFloat(document.getElementById('txAmount').value);
      const category = document.getElementById('txCategory').value;
      const walletId = document.getElementById('txWallet')?.value;
      const fromWalletId = document.getElementById('txFromWallet')?.value;
      const toWalletId = document.getElementById('txToWallet')?.value;
      const notes = document.getElementById('txNotes').value;
      const tags = document.getElementById('txTags').value;
      const photo = state.mpUploadedPhoto || null;
      const isInstallment = document.getElementById('txIsInstallment')?.checked || false;
      const instMonths = parseInt(document.getElementById('txInstMonths')?.value || '3');
      const instInterest = parseFloat(document.getElementById('txInstInterest')?.value || '1.2');

      if (isNaN(amount) || amount <= 0) {
        showToast('⚠️ กรุณากรอกจำนวนเงินให้ถูกต้อง', 'err');
        return;
      }

      const newTx = {
        id: 'tx_' + Date.now(),
        type,
        amount,
        category,
        walletId,
        fromWalletId,
        toWalletId,
        notes: notes || (type === 'transfer' ? 'โอนเงินข้ามบัญชี' : category),
        tags: tags || '',
        photo,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now()
      };

      if (type === 'income') {
        const w = state.moneyWallets.find(x => x.id === walletId);
        if (w) w.balance += amount;
      } else if (type === 'expense') {
        const w = state.moneyWallets.find(x => x.id === walletId);
        if (w) {
          if (w.type === 'debt') w.balance += amount; // เพิ่มยอดหนี้
          else w.balance -= amount; // หักสินทรัพย์
        }
        
        // ผูกสัญญากับผ่อนชำระ
        if (isInstallment && (walletId === 'spaylater' || walletId === 'seasycash')) {
          const interestAmt = amount * (instInterest / 100) * instMonths;
          const totalPayable = amount + interestAmt;
          const monthlyPay = totalPayable / instMonths;
          
          state.moneyInstallments.push({
            id: 'inst_' + Date.now(),
            name: notes || `ผ่อนชำระ ${category}`,
            walletId,
            principal: amount,
            interestRate: instInterest,
            totalPayable,
            monthlyPayment: monthlyPay,
            remainingMonths: instMonths,
            totalMonths: instMonths,
            paidMonths: 0,
            tags
          });
        }
      } else if (type === 'transfer') {
        const fromW = state.moneyWallets.find(x => x.id === fromWalletId);
        const toW = state.moneyWallets.find(x => x.id === toWalletId);
        if (fromW && toW) {
          if (fromW.type === 'debt') fromW.balance += amount;
          else fromW.balance -= amount;
          
          if (toW.type === 'debt') toW.balance -= amount;
          else toW.balance += amount;
        }
      }

      state.moneyTransactions.unshift(newTx);
      state.mpUploadedPhoto = null;
      saveMoneyPod();
      render();
      showToast('✅ บันทึกรายการลงกระเป๋าเงินสำเร็จ!');
    };

    window.mpDeleteTransaction = function(txId) {
      if (confirm('ต้องการลบรายการนี้ใช่หรือไม่? (ยอดเงินจะไม่ได้รับการแก้ไขย้อนกลับ)')) {
        state.moneyTransactions = state.moneyTransactions.filter(t => t.id !== txId);
        saveMoneyPod();
        render();
        showToast('🗑 ลบรายการเรียบร้อยแล้ว');
      }
    };

    window.mpPayInstallment = function(instId) {
      const inst = state.moneyInstallments.find(i => i.id === instId);
      if (!inst) return;
      
      if (confirm(`ชำระงวดประจำเดือนสำหรับ "${inst.name}" จำนวน ฿${inst.monthlyPayment.toFixed(2)} ใช่หรือไม่?\n(ยอดจะชำระจาก บัญชีธนาคาร 🏦)`)) {
        const bank = state.moneyWallets.find(w => w.id === 'bank');
        if (!bank || bank.balance < inst.monthlyPayment) {
          showToast('⚠️ ยอดเงินในบัญชีธนาคารไม่เพียงพอ', 'err');
          return;
        }
        
        bank.balance -= inst.monthlyPayment;
        const debtW = state.moneyWallets.find(w => w.id === inst.walletId);
        if (debtW) {
          const principalPayment = inst.principal / inst.totalMonths;
          debtW.balance = Math.max(0, debtW.balance - principalPayment);
        }
        
        state.moneyTransactions.unshift({
          id: 'tx_' + Date.now(),
          type: 'expense',
          amount: inst.monthlyPayment,
          category: '🐽 การเงิน & หนี้สิน',
          walletId: 'bank',
          notes: `ชำระงวด ${inst.name} (${inst.paidMonths + 1}/${inst.totalMonths})`,
          tags: `#installment #payment ${inst.tags || ''}`,
          date: new Date().toISOString().split('T')[0],
          timestamp: Date.now()
        });
        
        inst.paidMonths += 1;
        inst.remainingMonths -= 1;
        
        if (inst.remainingMonths <= 0) {
          state.moneyInstallments = state.moneyInstallments.filter(i => i.id !== instId);
          showToast('🎉 ยอดผ่อนชำระรายการนี้ถูกจ่ายหมดสิ้นสมบูรณ์แล้ว!');
        } else {
          showToast(`✅ ชำระงวดประจำเดือนสำเร็จ ฿${inst.monthlyPayment.toFixed(2)}`);
        }
        
        saveMoneyPod();
        render();
        triggerConfetti();
      }
    };

    window.mpAddGoal = function() {
      const name = document.getElementById('newGoalName').value;
      const target = parseFloat(document.getElementById('newGoalTarget').value);
      if (!name || isNaN(target) || target <= 0) {
        showToast('⚠️ กรุณากรอกข้อมูลเป้าหมายให้ถูกต้อง', 'err');
        return;
      }
      
      state.moneyGoals.push({
        id: 'goal_' + Date.now(),
        name,
        target,
        saved: 0
      });
      
      saveMoneyPod();
      render();
      showToast('🎯 สร้างเป้าหมายการออมใหม่เรียบร้อย!');
    };

    window.mpDepositGoal = function(goalId) {
      const goal = state.moneyGoals.find(g => g.id === goalId);
      if (!goal) return;
      
      const amtStr = prompt(`ฝากเงินเข้าเป้าหมาย "${goal.name}" (เป้าหมาย ฿${goal.target} | ออมแล้ว ฿${goal.saved})\nจำนวนเงินออม (บาท):`);
      const amount = parseFloat(amtStr);
      if (isNaN(amount) || amount <= 0) {
        if (amtStr !== null) showToast('⚠️ กรุณากรอกจำนวนเงินให้ถูกต้อง', 'err');
        return;
      }
      
      const bank = state.moneyWallets.find(w => w.id === 'bank');
      if (!bank || bank.balance < amount) {
        showToast('⚠️ ยอดเงินในบัญชีธนาคารไม่เพียงพอต่อการออม', 'err');
        return;
      }
      
      bank.balance -= amount;
      const savingsW = state.moneyWallets.find(w => w.id === 'savings');
      if (savingsW) savingsW.balance += amount;
      
      goal.saved += amount;
      
      state.moneyTransactions.unshift({
        id: 'tx_' + Date.now(),
        type: 'transfer',
        amount,
        category: '🐷 ออมเงิน',
        fromWalletId: 'bank',
        toWalletId: 'savings',
        notes: `ออมเงินสะสม: ${goal.name}`,
        tags: '#savings #goal',
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now()
      });
      
      saveMoneyPod();
      render();
      triggerConfetti();
      showToast(`🎉 ออมเงินสะสม ฿${amount} เข้าเป้าหมาย "${goal.name}"!`);
    };

    window.mpExportCSV = function() {
      if (state.moneyTransactions.length === 0) {
        showToast('⚠️ ไม่มีประวัติบันทึกทางการเงินที่จะส่งออก', 'err');
        return;
      }
      
      let csv = "\uFEFF"; // UTF-8 BOM
      csv += "วันที่,ประเภท,จำนวนเงิน(บาท),หมวดหมู่,จากกระเป๋า,ไปยังกระเป๋า,โน้ต,แท็ก\n";
      
      state.moneyTransactions.forEach(t => {
        const fromW = t.fromWalletId ? (state.moneyWallets.find(w => w.id === t.fromWalletId)?.name || t.fromWalletId) : "";
        const toW = t.toWalletId ? (state.moneyWallets.find(w => w.id === t.toWalletId)?.name || t.toWalletId) : "";
        const wallet = t.walletId ? (state.moneyWallets.find(w => w.id === t.walletId)?.name || t.walletId) : "";
        
        const row = [
          t.date,
          t.type === 'income' ? 'รายรับ' : (t.type === 'expense' ? 'รายจ่าย' : 'โอนเงิน'),
          t.amount,
          t.category,
          t.type === 'transfer' ? fromW : wallet,
          t.type === 'transfer' ? toW : "",
          `"${(t.notes || '').replace(/"/g, '""')}"`,
          `"${(t.tags || '').replace(/"/g, '""')}"`
        ].join(",");
        csv += row + "\n";
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `MoneyPod_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('📥 ส่งออกไฟล์รายงาน CSV สู่เครื่องสำเร็จ');
    };

    window.mpHandlersInitialized = true;
  }

  // Calculate Net Worth values
  const assets = state.moneyWallets.filter(w => w.type !== 'debt').reduce((s, w) => s + w.balance, 0);
  const debts = state.moneyWallets.filter(w => w.type === 'debt').reduce((s, w) => s + w.balance, 0);
  const netWorth = assets - debts;
  
  // Calculate Daily Spent
  const today = new Date().toISOString().split('T')[0];
  const spentToday = state.moneyTransactions
    .filter(t => t.date === today && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  
  const dailyProgPercent = Math.min(100, (spentToday / state.moneyDailyBudget) * 100);
  const strokeDash = 2 * Math.PI * 51;
  const strokeOffset = strokeDash - (dailyProgPercent / 100) * strokeDash;

  // Wallet filter logic
  const filteredTxs = selectedWalletId 
    ? state.moneyTransactions.filter(t => t.walletId === selectedWalletId || t.fromWalletId === selectedWalletId || t.toWalletId === selectedWalletId)
    : state.moneyTransactions;

  let mainContent = '';
  
  if (subView === 'overview') {
    mainContent = `
      <div class="mp-grid">
        <!-- Left Side: Balances & Wallets -->
        <div>
          <div class="glass-card networth-box mp-card">
            <span style="font-size:12px; font-weight:700; color:#64748b; letter-spacing:0.5px;">💰 ความมั่งคั่งสุทธิ (Net Worth)</span>
            <div class="nw-val">฿${netWorth.toLocaleString()}</div>
            <div style="display:flex; justify-content:space-between; width:100%; font-size:11px; margin-top:5px; border-top:1px solid rgba(0,0,0,0.05); padding-top:8px;">
              <span style="color:#10b981; font-weight:750;">ทรัพย์สิน: ฿${assets.toLocaleString()}</span>
              <span style="color:#ef4444; font-weight:750;">หนี้สิน: ฿${debts.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="mp-card" style="display:flex; align-items:center; justify-content:space-between;">
            <div class="circle-progress-wrap">
              <svg class="circle-progress-svg">
                <circle class="circle-bg" cx="55" cy="55" r="51"></circle>
                <circle class="circle-fg" cx="55" cy="55" r="51" style="stroke-dasharray: ${strokeDash}; stroke-dashoffset: ${strokeOffset}; stroke: ${spentToday > state.moneyDailyBudget ? '#ef4444' : 'var(--primary)'}"></circle>
              </svg>
              <div class="circle-text">
                <div style="font-size:10px; color:#64748b;">ใช้วันนี้</div>
                <div style="font-size:14px; font-weight:900;">${Math.round(dailyProgPercent)}%</div>
              </div>
            </div>
            <div style="flex:1; margin-left:20px; display:flex; flex-direction:column; justify-content:center;">
              <span style="font-size:12px; font-weight:700; color:#64748b;">งบประมาณวันนี้</span>
              <span style="font-size:18px; font-weight:950; color:#1e293b; margin:2px 0;">฿${spentToday} / ฿${state.moneyDailyBudget}</span>
              <button class="btn-glass-pastel" onclick="mpEditDailyBudget()" style="margin-top:4px; padding:4px 10px; align-self:flex-start; font-size:10px;">⚙️ ปรับเปลี่ยนงบ</button>
            </div>
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="font-size:14px; font-weight:800; color:#64748b; margin:0; letter-spacing:0.5px;">👛 กระเป๋าเงินของฉัน</h3>
            <button class="btn-glass-pastel" onclick="mpOpenWalletEditor()" style="padding:4px 10px; font-size:10px;">✏️ แก้ไขกระเป๋า & วงเงิน</button>
          </div>
          <div class="wallets-grid">
            ${state.moneyWallets.map(w => {
              const isActive = selectedWalletId === w.id;
              const displayVal = w.type === 'debt' ? `หนี้: ฿${w.balance.toLocaleString()}` : `฿${w.balance.toLocaleString()}`;
              return `
                <div class="wallet-card ${isActive ? 'active' : ''}" onclick="mpSetSelectedWallet('${w.id}')">
                  <span class="wallet-name">${w.name}</span>
                  <div class="wallet-bal">${displayVal}</div>
                  ${w.type === 'debt' ? `<span class="wallet-limit">วงเงินคงเหลือ ฿${(w.limit - w.balance).toLocaleString()}</span>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- Right Side: Quick Logger & Transactions Feed -->
        <div>
          <div class="mp-card">
            <h3 style="margin-top:0; font-size:15px; font-weight:850; display:flex; align-items:center; gap:6px;"><span style="font-size:18px;">📝</span> บันทึกรายการใหม่</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">ประเภท</label>
                <select class="glass-input sm" id="txType" onchange="
                  const type = this.value;
                  document.getElementById('txWWrap').style.display = type === 'transfer' ? 'none' : 'block';
                  document.getElementById('txTWrap').style.display = type === 'transfer' ? 'grid' : 'none';
                  document.getElementById('txInstToggleWrap').style.display = 'none';
                " style="width:100%; border-radius:12px;">
                  <option value="expense">รายจ่าย 💸</option>
                  <option value="income">รายรับ 📈</option>
                  <option value="transfer">โอนเงิน 🔄</option>
                </select>
              </div>
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">จำนวนเงิน (บาท)</label>
                <input type="number" class="glass-input sm" id="txAmount" placeholder="฿" style="width:100%; border-radius:12px;" min="0">
              </div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">หมวดหมู่</label>
                <select class="glass-input sm" id="txCategory" style="width:100%; border-radius:12px;">
                  <option value="🍔 อาหาร & เครื่องดื่ม">🍔 อาหาร & เครื่องดื่ม</option>
                  <option value="🛍️ ช้อปปิ้ง">🛍️ ช้อปปิ้ง</option>
                  <option value="🚗 เดินทาง & รถยนต์">🚗 เดินทาง & รถยนต์</option>
                  <option value="🏠 ที่พัก & ค่าเช่า">🏠 ที่พัก & ค่าเช่า</option>
                  <option value="💡 ค่าสาธารณูปโภค">💡 ค่าสาธารณูปโภค</option>
                  <option value="🎮 สันทนาการ & เกม">🎮 สันทนาการ & เกม</option>
                  <option value="🎓 การศึกษา & ตราหนังสือ">🎓 การศึกษา & ตราหนังสือ</option>
                  <option value="🐽 การเงิน & หนี้สิน">🐽 การเงิน & หนี้สิน</option>
                  <option value="➕ อื่นๆ">➕ อื่นๆ</option>
                </select>
              </div>
              <div id="txWWrap">
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">ใช้จากกระเป๋า</label>
                <select class="glass-input sm" id="txWallet" onchange="
                  const w = this.value;
                  const isExp = document.getElementById('txType').value === 'expense';
                  document.getElementById('txInstToggleWrap').style.display = (isExp && (w === 'spaylater' || w === 'seasycash')) ? 'block' : 'none';
                " style="width:100%; border-radius:12px;">
                  ${state.moneyWallets.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
                </select>
              </div>
            </div>
            
            <div id="txTWrap" style="display:none; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">จากกระเป๋า</label>
                <select class="glass-input sm" id="txFromWallet" style="width:100%; border-radius:12px;">
                  ${state.moneyWallets.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">ไปยังกระเป๋า</label>
                <select class="glass-input sm" id="txToWallet" style="width:100%; border-radius:12px;">
                  ${state.moneyWallets.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
                </select>
              </div>
            </div>
            
            <div id="txInstToggleWrap" style="display:none; background:rgba(255,255,255,0.5); padding:10px; border-radius:12px; margin-bottom:10px; border:1px solid var(--accent);">
              <label style="display:flex; align-items:center; gap:8px; font-size:11px; font-weight:750; color:#1e293b; cursor:pointer;">
                <input type="checkbox" id="txIsInstallment" onchange="document.getElementById('txInstDetails').style.display = this.checked ? 'grid' : 'none';"> 
                🛍️ ตั้งการผ่อนชำระรายเดือน (SPayLater/SEasyCash)
              </label>
              
              <div id="txInstDetails" style="display:none; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;">
                <div>
                  <label style="font-size:9px; font-weight:750; color:#64748b; display:block; margin-bottom:2px;">จำนวนงวด (เดือน)</label>
                  <select class="glass-input sm" id="txInstMonths" style="width:100%; font-size:10px;" onchange="
                    const amt = parseFloat(document.getElementById('txAmount').value) || 0;
                    const months = parseInt(this.value);
                    const rate = parseFloat(document.getElementById('txInstInterest').value);
                    const total = amt + (amt * (rate / 100) * months);
                    document.getElementById('txInstPreview').innerText = 'ผ่อนงวดละ: ฿' + (total/months).toFixed(2);
                  ">
                    <option value="1">1 เดือน</option>
                    <option value="3">3 เดือน</option>
                    <option value="6">6 เดือน</option>
                    <option value="12">12 เดือน</option>
                  </select>
                </div>
                <div>
                  <label style="font-size:9px; font-weight:750; color:#64748b; display:block; margin-bottom:2px;">ดอกเบี้ยต่อเดือน (%)</label>
                  <input type="number" class="glass-input sm" id="txInstInterest" value="1.2" step="0.1" style="width:100%; font-size:10px;" oninput="
                    const amt = parseFloat(document.getElementById('txAmount').value) || 0;
                    const months = parseInt(document.getElementById('txInstMonths').value);
                    const rate = parseFloat(this.value) || 0;
                    const total = amt + (amt * (rate / 100) * months);
                    document.getElementById('txInstPreview').innerText = 'ผ่อนงวดละ: ฿' + (total/months).toFixed(2);
                  ">
                </div>
                <div style="grid-column: span 2; font-size:9.5px; font-weight:800; color:var(--primary); text-align:right;" id="txInstPreview">
                  ผ่อนงวดละ: ฿0.00
                </div>
              </div>
            </div>
            
            <div style="margin-bottom:12px;">
              <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">โน้ต / บันทึกความจำ</label>
              <input type="text" class="glass-input sm" id="txNotes" placeholder="เช่น ซื้อชาบูเย็นนี้, ถอนเงินสด" style="width:100%; border-radius:12px;">
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px; align-items:center;">
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">แท็กติดตาม (เช่น #เที่ยว #ขนม)</label>
                <input type="text" class="glass-input sm" id="txTags" placeholder="#tag" style="width:100%; border-radius:12px;">
              </div>
              <div style="display:flex; gap:10px; align-items:center;">
                <input type="file" id="txPhotoUpload" accept="image/*" style="display:none;" onchange="mpHandlePhotoUpload(this)">
                <button class="btn-glass-pastel" onclick="document.getElementById('txPhotoUpload').click()" style="padding:6px 12px;"><span style="font-size:14px;">📸</span> แนบสลิป</button>
                <div id="txPhotoPreview"></div>
              </div>
            </div>
            
            <button class="btn-pastel-primary" onclick="mpAddTransaction()" style="width:100%; border-radius:14px; padding:12px;">💾 บันทึกรายการลงบัญชี</button>
          </div>
          
          <h3 style="font-size:14px; font-weight:850; color:#64748b; margin:20px 0 10px 0; display:flex; justify-content:space-between; align-items:center;">
            <span>${selectedWalletId ? `🔍 ประวัติสำหรับ ${state.moneyWallets.find(w => w.id === selectedWalletId)?.name}` : '📋 ประวัติธุรกรรมล่าสุด'}</span>
            ${selectedWalletId ? '<button onclick="mpSetSelectedWallet(null)" style="font-size:10px; border:none; background:none; color:var(--primary); font-weight:800; cursor:pointer;">ดูทั้งหมด</button>' : ''}
          </h3>
          
          <div style="max-height: 400px; overflow-y: auto;">
            ${filteredTxs.map(t => {
              let categoryIcon = '🐽';
              if (t.category.includes('🍔')) categoryIcon = '🍔';
              else if (t.category.includes('🛍️')) categoryIcon = '🛍️';
              else if (t.category.includes('🚗')) categoryIcon = '🚗';
              else if (t.category.includes('🏠')) categoryIcon = '🏠';
              else if (t.category.includes('💡')) categoryIcon = '💡';
              else if (t.category.includes('🎮')) categoryIcon = '🎮';
              else if (t.category.includes('🎓')) categoryIcon = '🎓';
              else if (t.category.includes('🐽')) categoryIcon = '🐽';
              
              const isInc = t.type === 'income';
              const isTrf = t.type === 'transfer';
              const amtSign = isInc ? '+' : (isTrf ? '⇆' : '-');
              const amtClass = isInc ? 'income' : (isTrf ? 'transfer' : 'expense');
              
              return `
                <div class="tx-row">
                  <div class="tx-left">
                    <div class="tx-icon">${categoryIcon}</div>
                    <div class="tx-details">
                      <span class="tx-desc">${t.notes}</span>
                      <div style="display:flex; align-items:center; gap:5px; margin-top:2px;">
                        <span class="tx-sub">${t.date}</span>
                        ${t.tags ? t.tags.split(' ').map(tag => `<span class="pill-badge" style="background:#e2e8f0; color:#475569;">${tag}</span>`).join('') : ''}
                        ${t.photo ? `<span onclick="openModal('📄 รูปแนบหลักฐาน', '<img src=\\\x22${t.photo}\\\x22 style=\\\x22width:100%; border-radius:12px;\\\x22>')\" style="font-size:10px; cursor:pointer; color:var(--primary); text-decoration:underline; font-weight:750;">🖼️ สลิป</span>` : ''}
                      </div>
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:10px;">
                    <span class="tx-amount ${amtClass}">${amtSign}฿${t.amount.toLocaleString()}</span>
                    <button class="icon-btn danger sm" onclick="mpDeleteTransaction('${t.id}')" style="background:transparent; border:none; color:#ef4444; font-size:14px;">✕</button>
                  </div>
                </div>
              `;
            }).join('')}
            ${filteredTxs.length === 0 ? '<div class="empty-sm" style="padding:40px; text-align:center; color:#94a3b8;">ยังไม่มีประวัติธุรกรรม</div>' : ''}
          </div>
        </div>
      </div>
    `;
  } else if (subView === 'scanner') {
    mainContent = `
      <div class="mp-card" style="text-align:center;">
        <h2 style="margin-top:0; font-size:18px; font-weight:900; color:var(--primary);">🌅 AI Receipt Scanner — สแกนใบเสร็จอัจฉริยะ</h2>
        <p style="font-size:12px; color:#64748b; margin-top:4px; max-width:500px; margin-left:auto; margin-right:auto;">ไม่ต้องเสียเวลาพิมพ์! ถ่ายรูปสลิปหรืออัปโหลดใบเสร็จ ระบบ AI จะทำการวิเคราะห์จำนวนเงิน, รายละเอียดร้านค้า และแยกประเภทบัญชีให้คุณโดยอัตโนมัติ</p>
        
        <div style="display:flex; justify-content:center; gap:8px; margin-bottom:15px;">
          <button class="btn-glass-pastel" onclick="mpSelectMockReceipt('seven')">🍙 ใบเสร็จ 7-Eleven</button>
          <button class="btn-glass-pastel" onclick="mpSelectMockReceipt('starbucks')">☕ ใบเสร็จ Starbucks</button>
          <button class="btn-glass-pastel" onclick="mpSelectMockReceipt('shabu')">🍲 บิลร้านชาบู</button>
        </div>
        
        <div class="scanner-window" id="scannerWin">
          <div class="scan-laser"></div>
          <img id="receiptPreviewImage" src="https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80" alt="Receipt Preview">
        </div>
        <div id="mockReceiptDetails" style="font-size:11.5px; font-weight:800; color:#475569; margin-bottom:15px;">
          📄 ใบเสร็จ 7-Eleven (ข้าวผัด + น้ำดื่ม) — ยอด ฿187
        </div>
        
        <div style="display:flex; justify-content:center; gap:12px;">
          <input type="file" id="aiPhotoUpload" accept="image/*" style="display:none;" onchange="
            const file = this.files[0];
            if(file) {
              const reader = new FileReader();
              reader.onload = function(e) {
                document.getElementById('receiptPreviewImage').src = e.target.result;
                document.getElementById('mockReceiptDetails').innerHTML = '📄 ใบเสร็จที่ผู้ใช้อัปโหลด (วิเคราะห์ด้วย OCR-AI)';
                state.mpSelectedMockReceiptType = 'custom_uploaded';
              };
              reader.readAsDataURL(file);
            }
          ">
          <button class="btn-pastel" onclick="document.getElementById('aiPhotoUpload').click()"><span style="font-size:14px;">📤</span> อัปโหลดรูปใบเสร็จจริง</button>
          <button class="btn-pastel-primary" onclick="mpScanReceiptStart()" style="padding:10px 25px;">⚡ เริ่มสแกนด้วย AI</button>
        </div>
      </div>
    `;
  } else if (subView === 'installments') {
    mainContent = `
      <div class="mp-grid">
        <!-- Installment Settings and Debts summary -->
        <div>
          <div class="mp-card">
            <h3 style="margin-top:0; font-size:14px; font-weight:850; color:#64748b;">🛍️ สรุปขีดจำกัดสินเชื่อ (Credit Limits)</h3>
            <div style="margin-top:15px;">
              ${(() => {
                const w = state.moneyWallets.find(x => x.id === 'spaylater');
                const limitVal = w.limit || 15000;
                const pct = Math.min(100, Math.max(0, (w.balance / (limitVal || 1)) * 100));
                return `
                  <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:750; color:#475569; margin-bottom:4px;">
                    <span>${w.name}</span>
                    <span>฿${w.balance.toLocaleString()} / ฿${limitVal.toLocaleString()}</span>
                  </div>
                  <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${pct}%; background:#ea580c;"></div>
                  </div>
                `;
              })()}
            </div>
            <div style="margin-top:15px;">
              ${(() => {
                const w = state.moneyWallets.find(x => x.id === 'seasycash');
                const limitVal = w.limit || 20000;
                const pct = Math.min(100, Math.max(0, (w.balance / (limitVal || 1)) * 100));
                return `
                  <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:750; color:#475569; margin-bottom:4px;">
                    <span>${w.name}</span>
                    <span>฿${w.balance.toLocaleString()} / ฿${limitVal.toLocaleString()}</span>
                  </div>
                  <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${pct}%; background:#ef4444;"></div>
                  </div>
                `;
              })()}
            </div>
          </div>
          
          <div class="mp-card">
            <h3 style="margin-top:0; font-size:14px; font-weight:850; color:#1e293b; margin-bottom:12px;">➕ บันทึกหนี้สินทั่วไป</h3>
            <div style="margin-bottom:8px;">
              <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:2px;">ชื่อหนี้สิน / การซื้อ</label>
              <input type="text" class="glass-input sm" id="debtName" placeholder="เช่น ผ่อนมอเตอร์ไซค์" style="width:100%;">
            </div>
            <div style="margin-bottom:8px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:2px;">ยอดผ่อนงวดละ (บาท)</label>
                <input type="number" class="glass-input sm" id="debtPay" placeholder="฿" style="width:100%;">
              </div>
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:2px;">จำนวนงวดที่เหลือ</label>
                <input type="number" class="glass-input sm" id="debtMonths" value="6" style="width:100%;">
              </div>
            </div>
            <button class="btn-pastel-primary sm" onclick="
              const name = document.getElementById('debtName').value;
              const pay = parseFloat(document.getElementById('debtPay').value);
              const m = parseInt(document.getElementById('debtMonths').value);
              if(!name || isNaN(pay) || isNaN(m)) { showToast('⚠️ ข้อมูลไม่ครบถ้วน', 'err'); return; }
              state.moneyInstallments.push({
                id: 'inst_' + Date.now(),
                name,
                walletId: 'cash',
                principal: pay * m,
                interestRate: 0,
                totalPayable: pay * m,
                monthlyPayment: pay,
                remainingMonths: m,
                totalMonths: m,
                paidMonths: 0,
                tags: '#general'
              });
              saveMoneyPod(); render(); showToast('✅ บันทึกยอดหนี้สินเรียบร้อย');
            " style="width:100%; margin-top:8px;">💾 บันทึกสัญญานี้</button>
          </div>
        </div>
        
        <!-- Active Installments & Scheduler -->
        <div class="mp-card">
          <h3 style="margin-top:0; font-size:15px; font-weight:900; color:var(--primary); margin-bottom:15px;">📊 รายการสัญญาผ่อนชำระที่ทำงานอยู่ (Active Installments)</h3>
          
          ${state.moneyInstallments.map(i => {
            const progress = (i.paidMonths / i.totalMonths) * 100;
            const wName = i.walletId === 'spaylater' ? '🛍️ SPayLater' : (i.walletId === 'seasycash' ? '💸 S EasyCash' : '💵 หนี้ทั่วไป');
            return `
              <div style="background:white; border-radius:18px; padding:16px; border:1px solid rgba(0,0,0,0.04); margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.01);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                  <div>
                    <span style="font-size:14px; font-weight:850; color:#1e293b;">${i.name}</span>
                    <div style="font-size:10px; font-weight:750; color:#64748b; margin-top:2px;">ผ่านระบบบัญชี: ${wName}</div>
                  </div>
                  <div style="text-align:right;">
                    <span style="font-size:14px; font-weight:900; color:#ef4444;">฿${i.monthlyPayment.toFixed(0)} / ด.</span>
                    <div style="font-size:9.5px; color:#94a3b8; margin-top:1px;">ยอดเต็มผ่อนชำระ: ฿${i.totalPayable.toFixed(0)}</div>
                  </div>
                </div>
                
                <div style="display:flex; justify-content:space-between; font-size:10px; color:#64748b; margin-top:8px;">
                  <span>งวดปัจจุบัน: ${i.paidMonths} / ${i.totalMonths} เดือน</span>
                  <span>ความก้าวหน้า ${Math.round(progress)}%</span>
                </div>
                <div class="goal-progress-bar">
                  <div class="goal-progress-fill" style="width: ${progress}%;"></div>
                </div>
                
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
                  <button class="btn-glass-pastel" onclick="mpPayInstallment('${i.id}')" style="padding:6px 12px; border-color:var(--primary); color:var(--primary); font-size:11px;">💳 ชำระงวดประจำเดือน</button>
                </div>
              </div>
            `;
          }).join('')}
          ${state.moneyInstallments.length === 0 ? '<div style="padding:50px; text-align:center; color:#94a3b8; font-size:12.5px;">🎉 ยินดีด้วยครับ! ไม่มีสัญญาหรือหนี้สินผ่อนชำระค้างในระบบ</div>' : ''}
        </div>
      </div>
    `;
  } else if (subView === 'goals') {
    mainContent = `
      <div class="mp-grid">
        <!-- New Goal Maker -->
        <div class="mp-card">
          <h3 style="margin-top:0; font-size:14px; font-weight:850; color:#1e293b; margin-bottom:12px;">🎯 ตั้งเป้าหมายเก็บเงินใหม่</h3>
          <div style="margin-bottom:8px;">
            <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:2px;">ระบุเป้าหมาย (เช่น เที่ยวทะเล, ซื้อกล้อง)</label>
            <input type="text" class="glass-input sm" id="newGoalName" placeholder="เช่น เงินสำรองฉุกเฉิน 🚨" style="width:100%;">
          </div>
          <div style="margin-bottom:12px;">
            <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:2px;">จำนวนเงินเป้าหมาย (บาท)</label>
            <input type="number" class="glass-input sm" id="newGoalTarget" placeholder="฿" style="width:100%;">
          </div>
          <button class="btn-pastel-primary sm" onclick="mpAddGoal()" style="width:100%;">💾 บันทึกเป้าหมาย</button>
        </div>
        
        <!-- Active Savings Goals list -->
        <div class="mp-card">
          <h3 style="margin-top:0; font-size:15px; font-weight:900; color:var(--primary); margin-bottom:15px;">🐷 ติดตามความคืบหน้าการเก็บเงิน (Savings Goals)</h3>
          
          <div style="display:grid; grid-template-columns:1fr; gap:12px;">
            ${state.moneyGoals.map(g => {
              const pct = Math.min(100, (g.saved / g.target) * 100);
              return `
                <div style="background:white; border-radius:18px; padding:16px; border:1px solid rgba(0,0,0,0.03); box-shadow:0 2px 8px rgba(0,0,0,0.01);">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:14px; font-weight:850; color:#1e293b;">${g.name}</span>
                    <span style="font-size:14px; font-weight:900; color:var(--primary);">฿${g.saved.toLocaleString()} / ฿${g.target.toLocaleString()}</span>
                  </div>
                  
                  <div style="display:flex; justify-content:space-between; font-size:10px; color:#64748b; margin-top:8px;">
                    <span>เป้าหมายความสำเร็จ</span>
                    <span>${Math.round(pct)}%</span>
                  </div>
                  <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${pct}%;"></div>
                  </div>
                  
                  <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
                    <button class="btn-glass-pastel" onclick="mpDepositGoal('${g.id}')" style="padding:6px 12px; font-size:11px; border-color:var(--primary); color:var(--primary);">💰 ฝากเงินเข้าออม</button>
                  </div>
                </div>
              `;
            }).join('')}
            ${state.moneyGoals.length === 0 ? '<div style="padding:50px; text-align:center; color:#94a3b8; font-size:12.5px;">ยังไม่มีเป้าหมายการออม ให้เริ่มต้นสร้างเป้าหมายกันเถอะครับ!</div>' : ''}
          </div>
        </div>
      </div>
    `;
  } else if (subView === 'reports') {
    const categoryTotals = {};
    let totalSpent = 0;
    state.moneyTransactions.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      totalSpent += t.amount;
    });
    
    mainContent = `
      <div class="mp-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
          <h2 style="margin:0; font-size:16px; font-weight:900; color:#1e293b;">📊 สถิติแบ่งตามหมวดหมู่ค่าใช้จ่าย (Expense Statistics)</h2>
          <button class="btn-glass-pastel" onclick="mpExportCSV()"><span style="font-size:14px;">📥</span> ส่งออกรายงาน Excel (CSV)</button>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr; gap:15px; margin-bottom:25px;">
          ${Object.entries(categoryTotals).map(([cat, amt]) => {
            const pct = Math.round((amt / totalSpent) * 100);
            return `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:750; color:#475569; margin-bottom:4px;">
                  <span>${cat} (${pct}%)</span>
                  <span style="font-weight:900; color:#ef4444;">฿${amt.toLocaleString()}</span>
                </div>
                <div class="goal-progress-bar">
                  <div class="goal-progress-fill" style="width: ${pct}%; background:var(--primary);"></div>
                </div>
              </div>
            `;
          }).join('')}
          ${Object.keys(categoryTotals).length === 0 ? '<div style="padding:50px; text-align:center; color:#94a3b8; font-size:12.5px;">ยังไม่มีสถิติรายจ่ายในฐานข้อมูลการเงินขณะนี้</div>' : ''}
        </div>
        
        <div style="border-top:1px solid rgba(0,0,0,0.05); padding-top:20px;">
          <h3 style="margin-top:0; font-size:13.5px; font-weight:800; color:#64748b;">🏷️ ค้นหาด่วนด้วยแฮชแท็ก (#Hashtags)</h3>
          <div style="display:flex; gap:8px; margin-bottom:15px;">
            <input type="text" class="glass-input sm" id="reportTagSearch" placeholder="ระบุแฮชแท็ก เช่น #seven, #shabu" style="flex:1;">
            <button class="btn-pastel-primary sm" onclick="mpSearchTags()">ค้นหา</button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    ${scopedStyle}
    <div class="mp-wrap ${themeClass}">
      <div class="mp-header">
        <div class="mp-title-section">
          <h1>🐽 MoneyPod Dashboard</h1>
          <p>เครื่องมือจัดการการเงินอัจฉริยะแบบบูรณาการ: สแกนใบเสร็จ, ผ่อนชำระ SPayLater/SEasyCash & ออมเงิน</p>
        </div>
        
        <div class="mp-theme-picker">
          <div class="theme-dot mint" onclick="mpSetTheme('theme-mint')" title="Mint Fresh"></div>
          <div class="theme-dot peach" onclick="mpSetTheme('theme-peach')" title="Honey Peach"></div>
          <div class="theme-dot pink" onclick="mpSetTheme('theme-pink')" title="Bubblegum Pink"></div>
          <div class="theme-dot lavender" onclick="mpSetTheme('theme-lavender')" title="Lavender Cream"></div>
        </div>
      </div>
      
      <div class="mp-subview-tabs">
        <button class="mp-tab-btn ${subView === 'overview' ? 'active' : ''}" onclick="mpSetView('overview')">💵 แผงภาพรวมบัญชี</button>
        <button class="mp-tab-btn ${subView === 'scanner' ? 'active' : ''}" onclick="mpSetView('scanner')">📸 สแกนใบเสร็จด้วย AI</button>
        <button class="mp-tab-btn ${subView === 'installments' ? 'active' : ''}" onclick="mpSetView('installments')">🛍️ ผ่อนชำระ & หนี้สิน</button>
        <button class="mp-tab-btn ${subView === 'goals' ? 'active' : ''}" onclick="mpSetView('goals')">🎯 เป้าหมายการออม</button>
        <button class="mp-tab-btn ${subView === 'reports' ? 'active' : ''}" onclick="mpSetView('reports')">📊 สถิติ & ส่งออก</button>
      </div>
      
      ${mainContent}
    </div>
  `;
}

// ══════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════
function renderSettings() {
  return `<div class="page-wrap">
    <div class="page-header"><h1 class="page-title">⚙️ ตั้งค่า</h1></div>
    <div class="settings-card">
    <div class="settings-label">
      <div style="font-weight:600; font-size:14px;">🛠 ระบบหลังบ้าน & Debug</div>
      <div style="font-size:12px; color:var(--c-muted); margin-top:4px;">ตรวจสอบการทำงานของ Trigger และปฏิทิน</div>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn-glass sm" onclick="checkSystemStatus()">🔍 เช็คระบบ</button>
      <button class="btn-glass sm" onclick="google.script.run.setupNotificationTrigger(); showToast('✅ รีเซ็ต Trigger แล้ว');">🔄 รีเซ็ต Trigger</button>
      <button class="btn-glass sm" onclick="testAlarmSound()">🔔 ทดสอบเสียงปลุก</button>
    </div>
  </div>

  <div class="settings-card" style="margin-bottom:15px; border-left: 4px solid #000;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div class="settings-label">
        <div style="font-weight:700; font-size:16px; display:flex; align-items:center; gap:8px;">
          <span style="background:#000; color:#fff; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:4px; font-size:14px;">N</span>
          Notion Integration
        </div>
        <div style="font-size:12px; color:var(--c-muted); margin-top:4px;">
          เชื่อมต่อข้อมูลรายวิชาและการบ้านกับ Notion Database ของคุณ
        </div>
      </div>
      <div class="status-badge ${state.notionConnected ? 'online' : 'offline'}" style="font-size:10px; padding:4px 8px; border-radius:12px; background:${state.notionConnected ? '#22c55e22' : '#ef444422'}; color:${state.notionConnected ? '#22c55e' : '#ef4444'};">
        ${state.notionConnected ? `Connected: ${state.notionBotName}` : 'Not Connected'}
      </div>
    </div>
    <div style="display:flex; gap:8px; margin-top:15px; flex-wrap:wrap;">
      <button class="btn-glass sm" onclick="NotionHub.checkConnection()">🔄 ตรวจเช็ค</button>
      <button class="btn-glass sm" onclick="NotionHub.sync(true)">⚡ ซิงก์ตอนนี้</button>
      <button class="btn-glass sm" onclick="NotionHub.setupTrigger()">⏰ เปิด Auto-Sync</button>
      <button class="btn-glass sm" style="color:var(--c-red); border-color:rgba(239,68,68,0.2); background:rgba(239,68,68,0.05);" onclick="NotionHub.forceResetSync()">🗑️ บังคับซิงก์ใหม่</button>
    </div>
    
    <div id="notionSetupArea" style="margin-top:15px; padding:10px; background:var(--c-accent)11; border-radius:8px; display:${state.notionConnected ? 'none' : 'block'};">
      <div style="font-size:11px; margin-bottom:8px; font-weight:600;">✨ ยังไม่เคยตั้งค่า? ใส่ Token เพื่อสร้างระบบอัตโนมัติ</div>
      <div style="display:flex; gap:8px;">
        <input type="password" id="notionTokenInput" class="glass-input sm" placeholder="secret_..." style="flex:1;">
        <button class="btn-glass-primary sm" onclick="NotionHub.runSetupWizard()">🚀 เริ่มตั้งค่า</button>
      </div>
    </div>

    <div style="margin-top:12px; font-size:11px; color:var(--c-muted);">
      Last Sync: ${state.lastNotionSync ? new Date(state.lastNotionSync).toLocaleString() : 'Never'}
    </div>
  </div>

  <div class="settings-card" style="margin-bottom:15px;">
  <div style="font-size:16px; font-weight:700; margin-bottom:10px;">🔔 การแจ้งเตือนระบบ</div>
  <div class="settings-row" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
    <div class="settings-label">
      <div style="font-weight:600; font-size:14px;">Browser Push Notification</div>
      <div style="font-size:12px; color:var(--c-muted); margin-top:4px;">รับการแจ้งเตือนเดดไลน์และ GPA โดยตรงผ่านเบราว์เซอร์นี้</div>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn-glass sm" onclick="checkFcmStatus()">🔍 เช็คสถานะ</button>
      <button class="btn-glass-primary sm" onclick="requestNotificationPermission()">เปิดใช้งาน</button>
    </div>
  </div>
</div>

    <div class="glass-card settings-block">
      <div class="setting-row">
        <span>🌙 Dark Mode</span>
        <button class="toggle-btn ${state.darkMode ? 'on' : ''}" id="settingDarkMode">${state.darkMode ? 'ON' : 'OFF'}</button>
      </div>
      <div class="setting-row">
        <span>🔒 ตั้งรหัส PIN (6 หลัก)</span>
        <div class="pin-setup-row">
          <input type="password" class="glass-input sm" id="pinInput" placeholder="รหัส 6 หลัก" maxlength="6" value="${state.pin || ''}">
          <button class="btn-glass sm" id="savePinBtn">💾</button>
          ${state.pin ? `<button class="btn-glass danger sm" id="removePinBtn">ลบ</button>` : ''}
        </div>
      </div>
    </div>

    <div class="glass-card settings-block">
      <div class="setting-title">🪪 บัตรประจำตัวนักเรียน</div>
      <div style="font-size:11px; color:var(--c-muted); margin-bottom:12px;">อัปโหลดรูปหน้าบัตรเพื่อใช้แสดงในหน้าล็อกและตรวจสอบข้อมูล</div>
      <div class="setting-row" style="flex-direction:column; align-items:flex-start; gap:10px;">
        <div style="display:flex; gap:10px; width:100%; align-items:center;">
          <input type="file" id="idCardUpload" accept="image/*" style="display:none;" onchange="handleIdCardUpload(this)">
          <button class="btn-glass-primary full sm" onclick="document.getElementById('idCardUpload').click()">📤 อัปโหลดรูปบัตร</button>
          ${state.idCardPhoto ? `<button class="btn-glass danger sm" onclick="removeIdCard()">🗑</button>` : ''}
        </div>
        ${state.idCardPhoto ? `<img src="${state.idCardPhoto}" style="width:100%; border-radius:8px; border:1px solid var(--c-border); margin-top:5px;">` : ''}
      </div>
    </div>
    <div class="glass-card settings-block">
      <div class="setting-title">📤 ข้อมูล</div>
      <div class="setting-row"><button class="btn-glass" id="exportAllBtn">📥 Export JSON</button></div>
      <div class="setting-row"><button class="btn-glass danger" id="clearCacheBtn">🗑 ล้างข้อมูล Local Cache</button></div>
    </div>
    <div class="glass-card settings-block">
      <div class="setting-title">📅 จัดการปฏิทิน (Google Calendar)</div>
      <div style="font-size:11px; color:var(--c-muted); margin-bottom:10px;">ลบปฏิทินของเทอมเก่าๆ เพื่อเคลียร์พื้นที่ใน Google Calendar ของคุณ</div>
      ${state.semesters.map(s => `
        <div class="setting-row">
          <span>เทอม ${s.name}</span>
          <div style="display:flex; gap:8px;">
            <button class="btn-glass sm" onclick="syncAllToCalendar('${s.id}')">🔄 ซิงก์ทั้งหมด</button>
            <button class="btn-glass danger sm" onclick="deleteSemesterCalendar('${s.name}')">🗑 ลบ</button>
          </div>
        </div>
      `).join('') || '<div class="setting-row"><span class="muted">ไม่มีข้อมูลเทอม</span></div>'}
    </div>
    <div class="glass-card settings-block" style="border: 1.5px solid rgba(239, 68, 68, 0.25); background: rgba(239, 68, 68, 0.04); box-shadow: 0 4px 15px rgba(239,68,68,0.05);">
      <div class="setting-title" style="color: #ef4444; font-weight:700;">🚪 บัญชีผู้ใช้งาน</div>
      <div class="setting-row" style="margin-top: 5px;">
        <button class="btn-glass danger full" onclick="logoutApp()" style="font-weight:700; width:100%; border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.1); color: #ef4444; text-shadow:none;">🚪 ออกจากระบบ (ล็อกแอป)</button>
      </div>
    </div>
    <div class="glass-card settings-block">
      <div class="setting-title">ℹ️ เกี่ยวกับระบบ</div>
      <div class="setting-row"><span>นิสิต</span><span>${STUDENT.nameTh}</span></div>
      <div class="setting-row"><span>รหัสนิสิต</span><span class="mono-sm">${STUDENT.id}</span></div>
      <div class="setting-row"><span>สาขา</span><span>${STUDENT.major}</span></div>
      <div class="setting-row"><span>NITIPAT MANAGER</span><span>v2.0 — Firebase Edition</span></div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════
// CSS OVERRIDES & HELPERS
// ══════════════════════════════════════════════════
const styleBlock = `
    <style>
    .widget-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    @media (max-width: 600px) {
      .widget-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Student ID Card CSS */
    .card-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      animation: fadeIn 0.3s ease;
    }
    .card-modal {
      background: white; width: 90%; max-width: 400px; border-radius: 20px;
      overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      position: relative; animation: slideUp 0.3s ease;
    }
    .card-close {
      position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.1);
      border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
    }
    .card-title {
      background: #003366; color: white; padding: 15px; text-align: center;
      font-weight: 700; font-family: Kanit; letter-spacing: 1px;
    }
    .card-body {
      padding: 20px; text-align: center;
    }
    .card-photo {
      width: 150px; height: 200px; object-fit: cover; border-radius: 10px;
      border: 3px solid #eee; margin-bottom: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .card-info {
      margin-bottom: 20px; font-family: Kanit;
    }
    .card-name { font-size: 18px; font-weight: 700; color: #333; }
    .card-id { font-size: 16px; font-weight: 600; color: #666; font-family: 'JetBrains Mono'; }
    .card-major { font-size: 13px; color: #888; }
    .barcode-container {
      background: #f9f9f9; padding: 15px; border-radius: 10px;
      display: flex; justify-content: center; border: 1px dashed #ccc;
    }
    #barcode { width: 100%; height: auto; }
    </style>`;
document.head.insertAdjacentHTML('beforeend', styleBlock);

// ══════════════════════════════════════════════════
// FORMS
// ══════════════════════════════════════════════════
function openAddSemesterForm(existing = null) {
  const calOptions = Object.entries(ACADEMIC_CALENDAR).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');
  openModal(existing ? 'แก้ไขเทอม' : 'เพิ่มเทอมการศึกษา', `
    <div class="form-grid">
      <div class="fg">
        <label>นำเข้าจากปฏิทิน 2568-2569</label>
        <select class="glass-select full" id="calImport"><option value="">— หรือกรอกเอง —</option>${calOptions}</select>
      </div>
      <div class="fg"><label>ชื่อเทอม <span class="req">*</span></label>
        <input class="glass-input" id="f-sName" placeholder="เช่น ภาคต้น 2568" value="${existing?.name || ''}"></div>
      <div class="fg"><label>วันเริ่มเทอม</label>
        <input type="date" class="glass-input" id="f-sStart" value="${existing?.startDate || ''}"></div>
      <div class="fg"><label>วันสิ้นสุดเทอม</label>
        <input type="date" class="glass-input" id="f-sEnd" value="${existing?.endDate || ''}"></div>
      <div class="fg"><label>ลำดับ</label>
        <input type="number" class="glass-input" id="f-sOrd" value="${existing?.order || state.semesters.length + 1}"></div>
    </div>`,
    `<button class="btn-glass-primary" id="saveSemBtn">${existing ? 'บันทึก' : 'เพิ่มเทอม'}</button>`
  );
  document.getElementById('calImport')?.addEventListener('change', e => {
    const cal = ACADEMIC_CALENDAR[e.target.value];
    if (cal) {
      document.getElementById('f-sName').value = cal.name;
      document.getElementById('f-sStart').value = cal.start || '';
      document.getElementById('f-sEnd').value = cal.end || '';
    }
  });
  document.getElementById('saveSemBtn').onclick = async () => {
    const data = {
      id: existing?.id || `sem_${Date.now()}`, name: document.getElementById('f-sName').value,
      startDate: document.getElementById('f-sStart').value, endDate: document.getElementById('f-sEnd').value,
      order: parseInt(document.getElementById('f-sOrd').value) || 0
    };
    if (!data.name) { showToast('⚠️ กรอกชื่อเทอม', 'err'); return; }
    await fsSet('semesters', data.id, data);
    closeModal(); await loadAll(); showToast('✅ บันทึกเทอมสำเร็จ');
  };
}

const COURSE_COLORS_LIST = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#ea580c'];

function openAddCourseForm(existing = null) {
  const curSem = getCurrentSemester() || state.semesters[state.semesters.length - 1];
  const semOptions = state.semesters.map(s => `<option value="${s.id}" ${(existing ? existing.semId === s.id : curSem?.id === s.id) ? 'selected' : ''}>${s.name}</option>`).join('');

  let slots = existing?.schedules || [{ day: 0, start: "09:00", end: "12:00" }];

  const renderSlots = () => slots.map((s, i) => `
    <div class="slot-row glass-card-sm" style="display:flex; gap:8px; align-items:center; margin-bottom:8px; padding:8px;">
      <select class="glass-select sm f-slot-day" data-idx="${i}">
        ${['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((d, v) => `<option value="${v}" ${s.day == v ? 'selected' : ''}>${d}</option>`).join('')}
      </select>
      <input type="time" class="glass-input sm f-slot-start" data-idx="${i}" value="${s.start}">
      <span>-</span>
      <input type="time" class="glass-input sm f-slot-end" data-idx="${i}" value="${s.end}">
      ${i > 0 ? `<button class="icon-btn sm btn-slot-del" data-idx="${i}">✕</button>` : ''}
    </div>
  `).join('');

  openModal(existing ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชา', `
    <div class="form-grid">
      <div class="fg full"><label>เทอม <span class="req">*</span></label><select class="glass-select" id="f-cSem">${semOptions}</select></div>
      <div class="fg full">
        <label>ค้นหาจากฐานข้อมูลวิชา</label>
        <input class="glass-input" id="f-cSearch" placeholder="พิมพ์รหัส หรือชื่อวิชา...">
        <div id="courseSearchResults" class="search-results-inline"></div>
      </div>
      <div class="fg"><label>รหัสวิชา <span class="req">*</span></label><input class="glass-input" id="f-cCode" placeholder="เช่น 01213212" value="${existing?.code || ''}"></div>
      <div class="fg full"><label>ชื่อวิชา (ไทย) <span class="req">*</span></label><input class="glass-input" id="f-cNameTh" placeholder="ชื่อวิชา" value="${existing?.nameTh || ''}"></div>
      <div class="fg full"><label>ชื่อวิชา (อังกฤษ)</label><input class="glass-input" id="f-cNameEn" value="${existing?.nameEn || ''}"></div>
      <div class="fg"><label>หน่วยกิต</label><input type="number" class="glass-input" id="f-cCr" min="1" max="9" value="${existing?.credits || 3}"></div>
      <div class="fg"><label>รูปแบบ</label>
        <select class="glass-select" id="f-cMode">
          <option value="onsite" ${existing?.mode === 'onsite' ? 'selected' : ''}>🏫 Onsite</option>
          <option value="online" ${existing?.mode === 'online' ? 'selected' : ''}>🌐 Online</option>
          <option value="hybrid" ${existing?.mode === 'hybrid' ? 'selected' : ''}>🔀 Hybrid</option>
        </select></div>
      
      <div class="fg full">
        <label>วันเวลาเรียน (รองรับหลายช่วงเวลา)</label>
        <div id="slotsContainer">${renderSlots()}</div>
        <button class="btn-glass sm" id="addSlotBtn" style="width:100%; margin-top:4px;">+ เพิ่มวัน/เวลาเรียน</button>
      </div>

      <div class="fg full"><label>อาจารย์ผู้สอน</label><input class="glass-input" id="f-cInstr" placeholder="ชื่ออาจารย์" value="${existing?.instructor || ''}"></div>
      <div class="fg full"><label>ห้องเรียน / อาคาร / พิกัด (สำหรับเช็คชื่อ)</label>
        <input class="glass-input" id="f-cRoom" placeholder="เช่น อาคาร E6-301" value="${existing?.room || ''}">
        <div class="map-picker-controls">
          <input class="glass-input sm" id="f-cCoords" placeholder="พิกัด Lat,Lon" value="${existing?.targetCoords || existing?.coords || ''}" readonly style="font-size:11px;">
          <button class="btn-glass sm" id="mapLocateBtn">📍 ปักหมุดที่นี่</button>
        </div>
        <div id="map"></div>
      </div>
      <div class="fg full"><label>ลิงก์ห้องเรียน / LMS (Zoom, MS Teams, Google Classroom)</label><input class="glass-input" id="f-cLink" placeholder="https://..." value="${existing?.link || ''}"></div>
      <div class="fg full"><label>การตัดเกรด</label><input class="glass-input" id="f-cGrading" placeholder="เช่น กลางภาค 30% ปลายภาค 50% งาน 20%" value="${existing?.grading || ''}"></div>
      <div class="fg"><label>เกรดที่ได้</label>
        <select class="glass-select" id="f-cGrade">
          <option value="" ${!existing?.grade ? 'selected' : ''}>- ยังไม่มีเกรด -</option>
          ${Object.keys(GRADE_PTS).map(g => `<option value="${g}" ${existing?.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
        </select>
      </div>
      <div class="fg">
        <label>สี</label>
        <div class="color-picker-row">
          ${COURSE_COLORS_LIST.map(c => `<div class="cpick ${existing?.color === c ? 'sel' : ''}" style="background:${c}" data-color="${c}"></div>`).join('')}
        </div>
      </div>
    </div>`,
    `<button class="btn-glass-primary" id="saveCourseBtn">${existing ? 'บันทึก' : 'เพิ่มวิชา'}</button>`
  );

  const updateSlotsUI = () => { document.getElementById('slotsContainer').innerHTML = renderSlots(); attachSlotEvents(); };
  const attachSlotEvents = () => {
    document.querySelectorAll('.btn-slot-del').forEach(b => b.onclick = () => { slots.splice(b.dataset.idx, 1); updateSlotsUI(); });
    document.querySelectorAll('.f-slot-day').forEach(s => s.onchange = () => { slots[s.dataset.idx].day = parseInt(s.value); });
    document.querySelectorAll('.f-slot-start').forEach(s => s.onchange = () => { slots[s.dataset.idx].start = s.value; });
    document.querySelectorAll('.f-slot-end').forEach(s => s.onchange = () => { slots[s.dataset.idx].end = s.value; });
  };
  document.getElementById('addSlotBtn').onclick = () => { slots.push({ day: 0, start: "09:00", end: "12:00" }); updateSlotsUI(); };
  attachSlotEvents();
  let selColor = existing?.color || COURSE_COLORS_LIST[0];
  document.querySelectorAll('.cpick').forEach(d => { d.onclick = () => { document.querySelectorAll('.cpick').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); selColor = d.dataset.color; }; });

  document.getElementById('f-cSearch')?.addEventListener('input', e => {
    const res = searchCourseDB(e.target.value);
    const container = document.getElementById('courseSearchResults');
    if (container) {
      container.innerHTML = res.map(c => `<div class="csr-item" data-code="${c.code}" data-name="${c.name}" data-nameen="${c.nameEn || ''}" data-cr="${c.credits}">${c.code} — ${c.name} (${c.credits} cr)</div>`).join('');
      container.querySelectorAll('.csr-item').forEach(item => {
        item.onclick = () => {
          document.getElementById('f-cCode').value = item.dataset.code;
          document.getElementById('f-cNameTh').value = item.dataset.name;
          document.getElementById('f-cNameEn').value = item.dataset.nameen;
          document.getElementById('f-cCr').value = item.dataset.cr;
          container.innerHTML = '';
          const p = checkPrereqs(item.dataset.code);
          if (!p.ok) showToast(`⚠️ ยังขาด Prerequisite: ${p.missing.join(', ')}`, 'err');
        };
      });
    }
  });

  setTimeout(() => {
    const defaultCoords = [13.8476, 100.5696];
    const map = L.map('map').setView(defaultCoords, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    let marker = null;
    if (existing?.coords) {
      const [lat, lon] = existing.coords.split(',').map(Number);
      marker = L.marker([lat, lon]).addTo(map);
      map.setView([lat, lon], 17);
    }

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng]).addTo(map);
      document.getElementById('f-cCoords').value = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    });

    document.getElementById('mapLocateBtn').onclick = () => {
      map.locate({ setView: true, maxZoom: 17 });
    };

    map.on('locationfound', (e) => {
      const { lat, lng } = e.latlng;
      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng]).addTo(map);
      document.getElementById('f-cCoords').value = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    });
  }, 500);

  document.getElementById('saveCourseBtn').onclick = async () => {
    const semId = document.getElementById('f-cSem').value;
    const sem = state.semesters.find(s => s.id === semId);

    const processedSlots = slots.map(s => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return {
        day: s.day,
        start: s.start,
        end: s.end,
        startHour: sh + (sm / 60),
        endHour: eh + (em / 60)
      };
    });

    const data = {
      id: existing?.id || `c_${Date.now()}`, semId,
      code: document.getElementById('f-cCode').value,
      nameTh: document.getElementById('f-cNameTh').value,
      nameEn: document.getElementById('f-cNameEn').value,
      credits: parseInt(document.getElementById('f-cCr').value) || 3,
      mode: document.getElementById('f-cMode').value,
      instructor: document.getElementById('f-cInstr').value,
      schedules: processedSlots,
      room: document.getElementById('f-cRoom').value,
      targetCoords: document.getElementById('f-cCoords').value,
      link: document.getElementById('f-cLink').value,
      grading: document.getElementById('f-cGrading').value,
      color: selColor,
      grade: document.getElementById('f-cGrade').value || null,
      attendance: existing?.attendance || 0,
      maxAttendance: existing?.maxAttendance || 15,
      isArchived: existing?.isArchived || false,
      driveUrl: existing?.driveUrl || null
    };
    if (!data.code || !data.nameTh) { showToast('⚠️ กรอกรหัสและชื่อวิชา', 'err'); return; }

    await fsSet('courses', data.id, data);

    const isPastSem = sem && new Date(sem.endDate) < new Date();
    if (!isPastSem && !data.isArchived && typeof google !== 'undefined' && google.script && google.script.run) {
      showToast('📂 กำลังสร้างโครงสร้างโฟลเดอร์ใน Google Drive...');
      google.script.run.withSuccessHandler(res => {
        if (res && res.success) {
          showToast('✅ สร้างโครงสร้าง Drive สำเร็จ');
          fsUpd('courses', data.id, { 
            driveId: res.rootId, 
            driveUrl: res.folderUrl,
            driveLectures: res.lecturesId,
            driveAssignments: res.assignmentsId,
            driveExams: res.examsId,
            driveResources: res.resourcesId
          });
        } else {
          showToast('❌ สร้างโฟลเดอร์ล้มเหลว: ' + (res?.error || 'Unknown error'), 'err');
        }
      }).createDriveHierarchy(sem ? sem.name : 'Unknown_Semester', `${data.code}_${data.nameEn || data.nameTh}`);
    }
    closeModal(); await loadAll(); showToast('✅ บันทึกวิชาสำเร็จ');
  };
}

function openAddAssignmentForm(a = null) {
  const allCourses = Object.values(state.courses).flat();
  const curSem = getCurrentSemester() || state.semesters[state.semesters.length - 1];
  const activeCourses = curSem ? (state.courses[curSem.id] || []) : allCourses;
  openModal(a ? 'แก้ไขการบ้าน / งาน' : 'เพิ่มการบ้าน / งาน', `
    <div class="form-grid">
      <div class="fg full"><label>วิชา <span class="req">*</span></label>
        <select class="glass-select" id="f-aCourse">${activeCourses.map(c => `<option value="${c.id}" ${a && a.courseId === c.id ? 'selected' : ''}>${c.code} — ${c.nameTh}</option>`).join('')}</select></div>
      <div class="fg full"><label>ชื่องาน <span class="req">*</span></label><input class="glass-input" id="f-aTitle" placeholder="ชื่องาน / การบ้าน" value="${a ? a.title : ''}"></div>
      <div class="fg"><label>ประเภท</label>
        <select class="glass-select" id="f-aType">
          ${['การบ้าน', 'รายงาน', 'โปรเจกต์', 'Quiz', 'Lab', 'งานกลุ่ม', 'อื่นๆ'].map(t => `<option ${a && a.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select></div>
      <div class="fg"><label>กำหนดส่ง <span class="req">*</span></label><input type="date" class="glass-input" id="f-aDue" value="${a ? a.dueDate : ''}"></div>
      <div class="fg"><label>เวลาส่ง</label><input type="time" class="glass-input" id="f-aTime" value="${a ? a.dueTime || '' : ''}"></div>
      <div class="fg"><label>คะแนนเต็ม</label><input type="number" class="glass-input" id="f-aScore" placeholder="เช่น 10" value="${a ? a.maxScore || '' : ''}"></div>
      <div class="fg full"><label>บันทึกช่วยจำ (ที่อาจารย์สั่งปากเปล่า)</label>
        <textarea class="glass-textarea" id="f-aNote" rows="2" placeholder="รายละเอียด...">${a ? a.note || '' : ''}</textarea></div>
    </div>`,
    `<button class="btn-glass-primary" id="saveAssignBtn">${a ? 'บันทึกแก้ไข' : 'เพิ่มการบ้าน'}</button>`
  );
  document.getElementById('saveAssignBtn').onclick = async () => {
    const cid = document.getElementById('f-aCourse').value;
    const course = allCourses.find(c => c.id === cid);
    const data = {
      id: a ? a.id : `a_${Date.now()}`,
      calendarEventId: a ? a.calendarEventId : null,
      courseId: cid, courseName: course?.code || '',
      title: document.getElementById('f-aTitle').value,
      type: document.getElementById('f-aType').value,
      dueDate: document.getElementById('f-aDue').value,
      dueTime: document.getElementById('f-aTime').value,
      maxScore: document.getElementById('f-aScore').value,
      note: document.getElementById('f-aNote').value,
      status: a ? a.status : 'ยังไม่เริ่ม',
      submitted: a ? a.submitted : false,
      subtasks: a ? a.subtasks || [] : [],
      folderId: a ? a.folderId || null : null,
      folderUrl: a ? a.folderUrl || null : null
    };
    if (!data.title || !data.dueDate) { showToast('⚠️ กรอกชื่องานและกำหนดส่ง', 'err'); return; }
    await fsSet('assignments', data.id, data);

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      showToast(`📂 กำลังซิงก์พื้นที่เก็บงานใน Google Drive...`);
      const sem = state.semesters.find(s => s.id === course?.semId);
      const courseWithSem = {
        ...course,
        semesterName: sem ? sem.name : 'Unknown Semester'
      };
      google.script.run.withSuccessHandler(async res => {
        if (res && res.success) {
          showToast(a ? '✅ ซิงก์ชื่อโฟลเดอร์ใน Drive สำเร็จ' : '✅ สร้างโฟลเดอร์สำหรับงานสำเร็จ');
          await fsUpd('assignments', data.id, {
            folderId: res.folderId,
            folderUrl: res.folderUrl
          });
          const arr = state.assignments[data.courseId] || [];
          const item = arr.find(x => x.id === data.id);
          if (item) {
            item.folderId = res.folderId;
            item.folderUrl = res.folderUrl;
          }
          
          // Self-heal course folder references if created/repaired
          const courseUpdates = {};
          if (res.parentAssignmentsId && !course.driveAssignments) {
            courseUpdates.driveAssignments = res.parentAssignmentsId;
            course.driveAssignments = res.parentAssignmentsId;
          }
          if (res.parentCourseId && !course.driveId) {
            courseUpdates.driveId = res.parentCourseId;
            course.driveId = res.parentCourseId;
          }
          if (Object.keys(courseUpdates).length > 0) {
            await fsUpd('courses', course.id, courseUpdates);
          }
          render();
        } else {
          showToast('❌ การสร้างโฟลเดอร์ใน Drive ขัดข้อง: ' + (res?.error || 'Unknown error'), 'err');
        }
      }).createOrUpdateAssignmentFolder(courseWithSem, {
        id: data.id,
        title: data.title,
        type: data.type,
        folderId: data.folderId
      });
    }

    if (typeof google !== 'undefined' && google.script) {
      const semName = curSem ? curSem.name : 'Unknown';
      google.script.run.withSuccessHandler(async res => {
        if (res && res.success) {
          data.calendarEventId = res.eventId;
          await fsSet('assignments', data.id, data);
        }
      }).syncCalendarEvent(`NITIPAT MANAGER - ${semName}`, 'assignment', data);
    }

    closeModal(); await loadAll(); showToast(a ? '✅ บันทึกแก้ไขสำเร็จ' : '✅ เพิ่มการบ้านสำเร็จ');
  };
}

function openAddExamForm(e = null) {
  const allCourses = Object.values(state.courses).flat();
  const curSem = getCurrentSemester() || state.semesters[state.semesters.length - 1];
  const activeCourses = curSem ? (state.courses[curSem.id] || []) : allCourses;
  openModal(e ? 'แก้ไขการสอบ' : 'เพิ่มการสอบ', `
    <div class="form-grid">
      <div class="fg full"><label>วิชา <span class="req">*</span></label>
        <select class="glass-select" id="f-eCourse">${activeCourses.map(c => `<option value="${c.id}" ${e && e.courseId === c.id ? 'selected' : ''}>${c.code} — ${c.nameTh}</option>`).join('')}</select></div>
      <div class="fg full"><label>ชื่อการสอบ <span class="req">*</span></label><input class="glass-input" id="f-eTitle" placeholder="เช่น สอบกลางภาค, Quiz 1" value="${e ? e.title : ''}"></div>
      <div class="fg"><label>ประเภท</label>
        <select class="glass-select" id="f-eType">
          ${['สอบกลางภาค', 'สอบปลายภาค', 'Quiz', 'สอบย่อย'].map(t => `<option ${e && e.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select></div>
      <div class="fg"><label>วันสอบ <span class="req">*</span></label><input type="date" class="glass-input" id="f-eDate" value="${e ? e.date : ''}"></div>
      <div class="fg"><label>เวลาสอบ</label><input type="time" class="glass-input" id="f-eTime" value="${e ? e.time || '' : ''}"></div>
      <div class="fg"><label>ห้องสอบ</label><input class="glass-input" id="f-eRoom" placeholder="เช่น E6-201" value="${e ? e.room || '' : ''}"></div>
      <div class="fg"><label>คะแนนเต็ม</label><input type="number" class="glass-input" id="f-eScore" value="${e ? e.maxScore || '' : ''}"></div>
      <div class="fg full"><label>ขอบเขตที่สอบ</label>
        <textarea class="glass-textarea" id="f-eScope" rows="2" placeholder="เนื้อหาที่ออกสอบ...">${e ? e.scope || '' : ''}</textarea></div>
      <div class="fg full"><label>บันทึก / Tips สำหรับสอบ</label>
        <textarea class="glass-textarea" id="f-eNotes" rows="2">${e ? e.notes || '' : ''}</textarea></div>
    </div>`,
    `<button class="btn-glass-primary" id="saveExamBtn">${e ? 'บันทึกแก้ไข' : 'เพิ่มการสอบ'}</button>`
  );
  document.getElementById('saveExamBtn').onclick = async () => {
    const cid = document.getElementById('f-eCourse').value;
    const course = allCourses.find(c => c.id === cid);
    const data = {
      id: e ? e.id : `e_${Date.now()}`,
      calendarEventId: e ? e.calendarEventId : null,
      courseId: cid, courseName: course?.code || '',
      title: document.getElementById('f-eTitle').value,
      type: document.getElementById('f-eType').value,
      date: document.getElementById('f-eDate').value,
      time: document.getElementById('f-eTime').value,
      room: document.getElementById('f-eRoom').value,
      maxScore: document.getElementById('f-eScore').value,
      scope: document.getElementById('f-eScope').value,
      notes: document.getElementById('f-eNotes').value
    };
    if (!data.title || !data.date) { showToast('⚠️ กรอกชื่อสอบและวันสอบ', 'err'); return; }

    if (!e) {
      const conflictExam = Object.values(state.exams).flat().find(ex => ex.date === data.date && ex.id !== data.id && ex.time === data.time);
      if (conflictExam) {
        if (!confirm(`⚠️ วันและเวลาสอบนี้ซ้อนกับวิชา ${conflictExam.courseName} (${conflictExam.title}) ยืนยันที่จะบันทึกหรือไม่?`)) return;
      }

      if (state.calendarSettings) {
        if (state.calendarSettings.midtermStart && data.date === state.calendarSettings.midtermStart) {
          showToast('ℹ️ ข้อสังเกต: จัดสอบวันเดียวกับวันเริ่มสอบกลางภาค', 'info');
        }
      }
    }

    await fsSet('exams', data.id, data);

    if (typeof google !== 'undefined' && google.script) {
      const semName = curSem ? curSem.name : 'Unknown';
      google.script.run.withSuccessHandler(async res => {
        if (res && res.success) {
          data.calendarEventId = res.eventId;
          await fsSet('exams', data.id, data);
        }
      }).syncCalendarEvent(`NITIPAT MANAGER - ${semName}`, 'exam', data);
    }

    closeModal(); await loadAll(); showToast(e ? '✅ บันทึกแก้ไขสำเร็จ' : '✅ เพิ่มการสอบสำเร็จ');
    startHyperNotifications();
  };
}

function openAddClubTaskForm() {
  openModal('เพิ่มงานชุมนุม', `
    <div class="form-grid">
      <div class="fg full"><label>ชื่องาน <span class="req">*</span></label><input class="glass-input" id="f-ctTitle" placeholder="สิ่งที่ต้องทำ..."></div>
      <div class="fg"><label>หมวดหมู่</label>
        <select class="glass-select" id="f-ctCat">
          <option>เอกสาร</option><option>ประสานงาน</option><option>กิจกรรม</option><option>ประชุม</option><option>อื่นๆ</option>
        </select></div>
      <div class="fg"><label>ความสำคัญ</label>
        <select class="glass-select" id="f-ctPri">
          <option value="normal">ปกติ</option><option value="mid">ปานกลาง</option><option value="high">เร่งด่วน</option>
        </select></div>
      <div class="fg"><label>กำหนด</label><input type="date" class="glass-input" id="f-ctDue"></div>
      <div class="fg full"><label>มอบหมายให้</label><input class="glass-input" id="f-ctAssign" placeholder="ชื่อคนรับผิดชอบ"></div>
      <div class="fg full"><label>หมายเหตุ</label><textarea class="glass-textarea" id="f-ctNote" rows="2"></textarea></div>
    </div>`,
    `<button class="btn-glass-primary" id="saveClubTaskBtn">เพิ่มงาน</button>`
  );
  document.getElementById('saveClubTaskBtn').onclick = () => {
    const t = {
      title: document.getElementById('f-ctTitle').value, cat: document.getElementById('f-ctCat').value,
      priority: document.getElementById('f-ctPri').value, due: document.getElementById('f-ctDue').value,
      assignTo: document.getElementById('f-ctAssign').value, note: document.getElementById('f-ctNote').value, done: false
    };
    if (!t.title) { showToast('⚠️ กรอกชื่องาน', 'err'); return; }
    state.clubTasks.push(t);
    localStorage.setItem('clubTasks', JSON.stringify(state.clubTasks));
    closeModal(); render(); showToast('✅ เพิ่มงานชุมนุมแล้ว');
  };
}

function updatePomodoroDisplay() {
  const rem = getPomodoroRemaining();
  const timeEl = document.querySelector('.pom-ring text:first-of-type');
  if (timeEl) timeEl.textContent = fmtTime(rem);
}

let audioCtx = null, noiseNodes = [];
function playWhiteNoise(type) {
  stopWhiteNoise();
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (type === 'rain') {
    const bufferSize = 2 * audioCtx.sampleRate, noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate), output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) { const white = Math.random() * 2 - 1; output[i] = (lastOut + (0.02 * white)) / 1.02; lastOut = output[i]; output[i] *= 3.5; }
    const node = audioCtx.createBufferSource(); node.buffer = noiseBuffer; node.loop = true;
    const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 400;
    const gain = audioCtx.createGain(); gain.gain.value = 0.5;
    node.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    node.start(); noiseNodes.push(node);
    showToast('🌧 เสียงฝนตก เริ่มแล้ว');
  } else if (type === 'cafe') {
    const bufferSize = 2 * audioCtx.sampleRate, noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate), output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) { const white = Math.random() * 2 - 1; output[i] = (lastOut + (0.02 * white)) / 1.02; lastOut = output[i]; output[i] *= 3.5; }
    const node = audioCtx.createBufferSource(); node.buffer = noiseBuffer; node.loop = true;
    const filter1 = audioCtx.createBiquadFilter(); filter1.type = 'lowpass'; filter1.frequency.value = 200;
    const gain1 = audioCtx.createGain(); gain1.gain.value = 0.3;
    node.connect(filter1); filter1.connect(gain1); gain1.connect(audioCtx.destination);
    const filter2 = audioCtx.createBiquadFilter(); filter2.type = 'bandpass'; filter2.frequency.value = 1000; filter2.Q.value = 0.5;
    const gain2 = audioCtx.createGain(); gain2.gain.value = 0.15;
    node.connect(filter2); filter2.connect(gain2); gain2.connect(audioCtx.destination);
    node.start(); noiseNodes.push(node);
    showToast('☕ เสียงคาเฟ่ เริ่มแล้ว');
  } else if (type === 'lofi') {
    [261.63, 329.63, 392.00, 493.88].forEach(freq => {
      const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      const gain = audioCtx.createGain(); gain.gain.value = 0.05;
      const lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.1;
      const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain); lfoGain.connect(gain.gain);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); lfo.start(); noiseNodes.push(osc, lfo);
    });
    const bufferSize = 2 * audioCtx.sampleRate, noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate), output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() > 0.99 ? Math.random() * 0.5 : 0; }
    const crackle = audioCtx.createBufferSource(); crackle.buffer = noiseBuffer; crackle.loop = true;
    const crackleGain = audioCtx.createGain(); crackleGain.gain.value = 0.08;
    crackle.connect(crackleGain); crackleGain.connect(audioCtx.destination);
    crackle.start(); noiseNodes.push(crackle);
    showToast('🎵 เสียงดนตรี Lo-fi เริ่มแล้ว');
  }
}
function stopWhiteNoise() {
  noiseNodes.forEach(n => { try { n.stop(); } catch (e) { } }); noiseNodes = [];
  if (audioCtx) try { audioCtx.close(); audioCtx = null; } catch (e) { }
}



window.renderCourseHubUI_Original = (courseId) => {
  const allCourses = Object.values(state.courses).flat();
  const c = allCourses.find(x => x.id === courseId);
  if (!c) return;

  const now = new Date();
  const dayIdx = now.getDay();
  const h = now.getHours();
  const m = now.getMinutes();
  const currentTimeVal = h + (m / 60);
  const activeSlot = (c.schedules || []).find(s => s.day === dayIdx && currentTimeVal >= s.startHour && currentTimeVal < s.endHour);
  const timeSinceStartMins = activeSlot ? (currentTimeVal - activeSlot.startHour) * 60 : -1;
  const attToday = state.attendanceHistory[courseId]?.[now.toISOString().split('T')[0]];
  const sos = analyzeSOS(courseId);
  const reflection = state.reflections[courseId] || '';

  let attUI = '';
  if (!activeSlot) {
    attUI = `<div class="glass-warn nb-card" style="text-align:center; padding:20px;">⌛ ยังไม่ถึงเวลาคลาสเรียน</div>`;
  } else if (attToday) {
    attUI = `<div class="nb-card" style="background:var(--c-lime); color:white; text-align:center; padding:20px;">✅ เช็คชื่อเรียบร้อย! (${attToday.status})</div>`;
  } else if (timeSinceStartMins <= 15) {
    attUI = `<button class="nb-btn-primary full" style="padding:15px;" id="finalCheckinBtn">🚀 ยืนยันการเข้าเรียน (Smart Check-in)</button>`;
  } else {
    attUI = `<div class="nb-card" style="padding:15px; border-color:var(--c-rust); text-align:center;">🚨 เลยเวลา 15 นาทีแล้ว! (สาย)</div>`;
  }

  openModal(`Advanced: ${c.code}`, `
        <div class="form-grid">
          <div class="section-hd">📍 Attendance Control</div>
          ${attUI}
          <div class="section-hd">🟢 Topic Mastery</div>
          <div class="glass-card nb-card" style="padding:15px;">${renderTopicMastery(courseId)}</div>
          <div class="section-hd">📉 Grade Impact Analysis</div>
          <div class="glass-card nb-card" style="padding:15px;">
            <div id="gradeStructureArea">${renderGradeStructure(courseId)}</div>
            <div style="margin-top:10px; font-weight:700;">Strategic Recommendation: ${sos?.recommend}</div>
          </div>
          <div class="section-hd">🚨 Persistence Reflection</div>
          <textarea class="refl-box nb-input" id="reflInput_adv" style="min-height:100px;">${reflection}</textarea>
        </div>
      `, `<button class="nb-btn-primary full" id="saveAdvHubBtn">บันทึก & กลับ</button>`);

  const finalBtn = document.getElementById('finalCheckinBtn');
  if (finalBtn) {
    finalBtn.onclick = async () => {
      if (c.mode === 'onsite') {
        showToast('⏳ กำลังตรวจสอบพิกัด...');
        if (!navigator.geolocation) {
          showToast('⚠️ ไม่สามารถใช้ GPS ได้', 'err');
          return;
        }
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          const target = c.targetCoords || "13.8476,100.5696"; // KU Def
          const [tLat, tLon] = target.split(',').map(Number);
          const dist = getDistance(lat, lon, tLat, tLon);
          if (dist <= 200) {
            await setAttendanceStatus(courseId, 'มาเรียน (Onsite)');
            showToast('✅ เช็คชื่อสำเร็จ! คุณอยู่ในพื้นที่');
            renderCourseHub(courseId);
          } else {
            showToast(`📍 คุณอยู่นอกพื้นที่! (ห่าง ${dist.toFixed(0)}ม.)`, 'err');
          }
        }, () => showToast('⚠️ ไม่สามารถเข้าถึงตำแหน่งได้', 'err'));
      } else {
        await setAttendanceStatus(courseId, 'มาเรียน (Online)');
        showToast('✅ เช็คชื่อ Online สำเร็จ!');
        renderCourseHub(courseId);
      }
    };
  }

  document.getElementById('saveAdvHubBtn').onclick = async () => {
    const val = document.getElementById('reflInput_adv').value;
    state.reflections[courseId] = val;
    localStorage.setItem('reflections', JSON.stringify(state.reflections));
    await fsSet('reflections', courseId, { text: val, updatedAt: new Date().toISOString() });
    showToast('✅ บันทึก Reflection สำเร็จ!');
    renderCourseHub(courseId);
  };
}

function startHyperNotifications() {
  if (state.hyperNotifInterval) clearInterval(state.hyperNotifInterval);
  state.notifiedEvents = state.notifiedEvents || new Set();
  
  state.hyperNotifInterval = setInterval(() => {
    const now = new Date();
    const todayIdx = (now.getDay() + 6) % 7; // Mon=0
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const todayKey = now.toLocaleDateString('en-CA');

    // 1. Academic Events (Courses)
    Object.values(state.courses).flat().forEach(c => {
      (c.schedules || []).forEach(s => {
        if (s.day !== todayIdx) return;
        const startMin = Math.floor(s.startHour * 60);
        const endMin = Math.floor((s.endHour || s.startHour + 3) * 60);
        const diff = startMin - nowMin;

        // 30-minute warning
        if (diff === 30) {
          pushNotif(`📅 อีก 30 นาทีเรียน: ${c.nameTh}`, `📍 ห้อง ${c.room || 'ไม่ระบุ'}`);
        }
        // 10-minute urgent
        if (diff === 10) {
          pushNotif(`⚡ ด่วน! อีก 10 นาทีเข้าเรียน: ${c.nameTh}`, `เตรียมตัวให้พร้อมนะครับ`);
        }
        // Start time
        const eventKeyStart = `start_${c.id}_${todayKey}`;
        if (diff === 0 && !state.notifiedEvents.has(eventKeyStart)) {
          pushNotif(`📍 ถึงเวลาเรียน ${c.nameTh}`, `เปิดแอปเพื่อเช็คชื่อ (Smart Check-in)`);
          showCheckinBanner(c);
          state.notifiedEvents.add(eventKeyStart);
        }

        // Mid-class Reflection Preparation (10 min before end)
        if (nowMin === endMin - 10) {
          pushNotif(`📝 เตรียม Reflection: ${c.nameTh}`, `อีก 10 นาทีหมดคาบ สรุปสิ่งที่ได้เรียนรู้กันครับ`);
        }

        // Class Ended
        const eventKeyEnd = `end_${c.id}_${todayKey}`;
        if (nowMin === endMin && !state.notifiedEvents.has(eventKeyEnd)) {
          pushNotif(`✅ จบการเรียน: ${c.nameTh}`, `อย่าลืมบันทึก Reflection เพื่อเก็บคะแนน Topic Mastery`);
          state.notifiedEvents.add(eventKeyEnd);
        }

        // Persistent Reminder (30 min after end if no reflection)
        if (nowMin === endMin + 30) {
          const refl = state.reflections[c.id];
          if (!refl) {
            pushNotif(`⚠️ ยังไม่ได้บันทึก Reflection: ${c.nameTh}`, `รีบบันทึกตอนนี้ก่อนจะลืมเนื้อหานะครับ`);
          }
        }

        // Auto-Check-in Banner
        if (diff <= 0 && nowMin < endMin) {
          const attended = state.attendanceHistory?.[c.id]?.[todayKey];
          if (!attended) showCheckinBanner(c);
        }
      });
    });

    // 2. High Frequency Day-0 Reminders
    if (now.getMinutes() % 20 === 0) { // Every 20 mins
      Object.values(state.exams).flat()
        .filter(e => getDaysUntil(e.date) === 0)
        .forEach(e => {
          const [h, m] = (e.time || '23:59').split(':').map(Number);
          if (nowMin < (h * 60 + m)) {
            pushNotif(`⏰ สอบวันนี้! ${e.name}`, `เวลา ${e.time} น. เตรียมตัวให้พร้อม`);
          }
        });
    }
  }, 60000); // Check every minute

  if (state.hyperAlarmInterval) clearInterval(state.hyperAlarmInterval);
  state.hyperAlarmInterval = setInterval(() => checkAlarms(), 30000);

  if (state.hyperSyncInterval) clearInterval(state.hyperSyncInterval);
  state.hyperSyncInterval = setInterval(() => syncDataToBackend(), 1800000);
}

function syncDataToBackend() {
  let projectedGPA = 0;
  let totalCredits = 0;
  let totalPoints = 0;
  const GRADE_MAP = { 'A': 4, 'B+': 3.5, 'B': 3, 'C+': 2.5, 'C': 2, 'D+': 1.5, 'D': 1, 'F': 0 };

  Object.values(state.courses || {}).flat().forEach(function (c) {
    if (c.grade && GRADE_MAP[c.grade] !== undefined) {
      const cr = parseInt(c.credits) || 3;
      totalPoints += GRADE_MAP[c.grade] * cr;
      totalCredits += cr;
    }
  });
  if (totalCredits > 0) projectedGPA = totalPoints / totalCredits;

  const todayStr = new Date().toDateString();
  const todayExp = (state.expenses || [])
    .filter(function (e) { return new Date(e.date).toDateString() === todayStr; })
    .reduce(function (sum, e) { return sum + (e.amount || 0); }, 0);

  const payload = {
    projectedGPA,
    dailyExp: todayExp,
    alarms: (state.alarms || []).filter(a => a.enabled && !a.isSnooze)
      .map(a => ({ id: a.id, time: a.time, label: a.label, repeat: a.repeat || [] })),
    gpaGoal: parseFloat(state.gpaGoal) || 3.5,
    budget: parseFloat(state.dailyBudget) || 200,
    timestamp: Date.now()
  };

  if (typeof google !== 'undefined' && google.script) {
    google.script.run
      .withFailureHandler(function (e) { console.warn('sync failed:', e); })
      .syncAcademicData(payload);
  }
}

function attachAllEvents() {
  document.getElementById('saveCalendarBtn')?.addEventListener('click', async () => {
    const settings = {
      semesterStart: document.getElementById('cal-start')?.value,
      withdrawDeadline: document.getElementById('cal-withdraw')?.value,
      midtermStart: document.getElementById('cal-midterm')?.value,
      finalStart: document.getElementById('cal-final')?.value
    };
    await fsSet('app_settings', 'calendar', settings);
    state.calendarSettings = settings;
    showToast('✅ บันทึกปฏิทินแล้ว');
  });

  document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
    state.view = b.dataset.nav;
    document.getElementById('fullMenu')?.classList.remove('show');
    render();
  });

  document.getElementById('navMenuBtn')?.addEventListener('click', () => document.getElementById('fullMenu')?.classList.add('show'));
  document.getElementById('closeMenuBtn')?.addEventListener('click', () => document.getElementById('fullMenu')?.classList.remove('show'));

  document.getElementById('modalX')?.addEventListener('click', closeModal);
  document.getElementById('modalBd')?.addEventListener('click', e => { if (e.target.id === 'modalBd') closeModal(); });
  document.getElementById('darkToggle')?.addEventListener('click', () => {
    state.darkMode = !state.darkMode; localStorage.setItem('darkMode', state.darkMode);
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light'); render();
  });

  let fabOpen = false;
  document.getElementById('fabBtn')?.addEventListener('click', () => {
    fabOpen = !fabOpen;
    document.getElementById('fabMenu')?.classList.toggle('open', fabOpen);
  });
  document.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => {
    fabOpen = false; document.getElementById('fabMenu')?.classList.remove('open');
    if (b.dataset.quick === 'assignment') openAddAssignmentForm();
    else if (b.dataset.quick === 'exam') openAddExamForm();
    else if (b.dataset.quick === 'course') { if (state.semesters.length === 0) { showToast('⚠️ เพิ่มเทอมก่อนนะ', 'err'); return; } openAddCourseForm(); }
    else if (b.dataset.quick === 'club') openAddClubTaskForm();
  });

  document.getElementById('globalSearch')?.addEventListener('input', e => { state.searchQuery = e.target.value; render(); });
  document.getElementById('clearSearch')?.addEventListener('click', () => { state.searchQuery = ''; render(); });

  document.getElementById('addSemBtn')?.addEventListener('click', () => openAddSemesterForm());
  document.getElementById('importCalBtn')?.addEventListener('click', () => openAddSemesterForm());
  document.querySelectorAll('[data-edit-sem]').forEach(b => b.onclick = () => { const s = state.semesters.find(x => x.id === b.dataset.editSem); openAddSemesterForm(s); });
  document.querySelectorAll('[data-del-sem]').forEach(b => b.onclick = async () => { if (confirm('ลบเทอมนี้?')) { await fsDel('semesters', b.dataset.delSem); await loadAll(); showToast('🗑 ลบเทอมแล้ว'); } });
  document.querySelectorAll('[data-view-sem]').forEach(b => b.onclick = () => { state.selectedSemester = b.dataset.viewSem; state.view = 'courses'; render(); });

  document.getElementById('viewCurrentCourseBtn')?.addEventListener('click', () => { state.courseView = 'current'; render(); });
  document.getElementById('viewArchiveCourseBtn')?.addEventListener('click', () => { state.courseView = 'archive'; render(); });
  document.getElementById('courseLocalSearch')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.folder-card:not(.add-folder)').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? 'flex' : 'none';
    });
  });
  document.getElementById('semFilterCourse')?.addEventListener('change', e => { state.selectedSemester = e.target.value; render(); });

  document.getElementById('schedSemFilter')?.addEventListener('change', e => { state.selectedSemester = e.target.value; render(); });
  document.getElementById('exportSchedBtn')?.addEventListener('click', async () => {
    const el = document.getElementById('timetable');
    if (el && typeof html2canvas !== 'undefined') {
      showToast('⏳ กำลังประมวลผลรูปภาพ...');
      const canvas = await html2canvas(el, { backgroundColor: '#1a1a2e', scale: 2 });
      const link = document.createElement('a');
      link.download = `Schedule_${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      showToast('✅ บันทึกตารางเรียนแล้ว');
    } else {
      showToast('❌ ไม่สามารถสร้างรูปได้ (html2canvas not loaded)', 'err');
    }
  });

  document.getElementById('addAssignBtn')?.addEventListener('click', () => { if (Object.values(state.courses).flat().length === 0) { showToast('⚠️ เพิ่มวิชาก่อนนะ', 'err'); return; } openAddAssignmentForm(); });
  document.querySelectorAll('[data-toggle-assign]').forEach(b => b.onclick = async () => {
    const id = b.dataset.toggleAssign;
    const a = Object.values(state.assignments).flat().find(x => x.id === id);
    if (a) { await fsUpd('assignments', id, { submitted: !a.submitted, status: !a.submitted ? 'ส่งแล้ว' : 'ยังไม่เริ่ม' }); await loadAll(); }
  });
  document.querySelectorAll('[data-del-assign]').forEach(b => b.onclick = async () => {
    const id = b.dataset.delAssign;
    const a = Object.values(state.assignments).flat().find(x => x.id === id);
    if (confirm('ลบงานนี้?')) {
      if (a?.calendarEventId && typeof google !== 'undefined' && google.script) {
        const curSem = getCurrentSemester() || state.semesters[state.semesters.length - 1];
        if (curSem) google.script.run.deleteCalendarEvent(`NITIPAT MANAGER - ${curSem.name}`, a.calendarEventId);
      }
      if (a?.folderId && typeof google !== 'undefined' && google.script && google.script.run) {
        showToast('🗑️ กำลังลบโฟลเดอร์การบ้านใน Google Drive...');
        google.script.run.deleteAssignmentFolder(a.folderId);
      }
      await fsDel('assignments', id); await loadAll();
    }
  });
  document.querySelectorAll('[data-edit-assign]').forEach(b => b.onclick = () => {
    const a = Object.values(state.assignments).flat().find(x => x.id === b.dataset.editAssign);
    if (a) openAddAssignmentForm(a);
  });
  document.querySelectorAll('[data-assign-view]').forEach(b => b.onclick = () => { state.assignView = b.dataset.assignView; render(); });
  document.getElementById('addExamBtn')?.addEventListener('click', () => { if (Object.values(state.courses).flat().length === 0) { showToast('⚠️ เพิ่มวิชาก่อนนะ', 'err'); return; } openAddExamForm(); });
  document.querySelectorAll('[data-del-exam]').forEach(b => b.onclick = async () => {
    const id = b.dataset.delExam;
    const e = Object.values(state.exams).flat().find(x => x.id === id);
    if (confirm('ลบการสอบนี้?')) {
      if (e?.calendarEventId && typeof google !== 'undefined' && google.script) {
        const curSem = getCurrentSemester() || state.semesters[state.semesters.length - 1];
        if (curSem) google.script.run.deleteCalendarEvent(`NITIPAT MANAGER - ${curSem.name}`, e.calendarEventId);
      }
      await fsDel('exams', id); await loadAll();
    }
  });
  document.querySelectorAll('[data-edit-exam]').forEach(b => b.onclick = () => {
    const e = Object.values(state.exams).flat().find(x => x.id === b.dataset.editExam);
    if (e) openAddExamForm(e);
  });

  document.getElementById('exportGradeBtn')?.addEventListener('click', exportGradeReport);
  document.querySelectorAll('.grade-select-inline').forEach(sel => sel.onchange = async () => {
    await fsUpd('courses', sel.dataset.courseId, { grade: sel.value }); await loadAll();
  });

  document.getElementById('calcTargetBtn')?.addEventListener('click', () => {
    const target = parseFloat(document.getElementById('targetGPA')?.value);
    if (isNaN(target)) return;
    const res = suggestGradesForTarget(target);
    const el = document.getElementById('targetResult');
    if (res.error) el.innerHTML = `<div class="glass-danger" style="font-size:12px; margin-top:8px;">❌ ${res.error}</div>`;
    else {
      el.innerHTML = `
        <div class="glass-card" style="margin-top:10px; background:rgba(132,204,22,0.05); border-left:4px solid var(--c-lime);">
          <div style="font-size:12px; font-weight:700;">ต้องทำเกรดเฉลี่ยเทอมนี้ให้ได้: <span style="color:var(--c-lime); font-size:16px;">${res.avg}</span></div>
          <div style="font-size:11px; margin-top:6px; opacity:0.8;">
            ${res.suggestion.map(s => `• ${s.code}: อย่างน้อยเกรด <strong>${s.suggest}</strong>`).join('<br>')}
          </div>
        </div>`;
    }
  });
  document.getElementById('simBtn')?.addEventListener('click', () => {
    const simRows = document.querySelectorAll('.sim-row');
    const simulated = Array.from(simRows).map(row => ({
      courseId: row.dataset.cid,
      grade: row.querySelector('select').value
    }));
    const newGPA = calcWhatIf(simulated);
    const el = document.getElementById('simResult');
    el.innerHTML = `<div style="font-size:24px; font-weight:800; color:var(--c-accent); text-align:center;">${newGPA}</div>`;
  });

  document.getElementById('radioToggleBtn')?.addEventListener('click', () => {
    if (Radio.isPlaying) {
      Radio.stopAll();
    } else {
      Radio.onPomodoroStart();
    }
    render();
  });

  document.getElementById('focusCourseSelect')?.addEventListener('change', e => {
    state.selectedFocusCourseId = e.target.value;
  });
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.onclick = () => {
      state.pomodoroWork = parseInt(btn.dataset.work);
      state.pomodoroBreak = parseInt(btn.dataset.break);
      localStorage.setItem('pomodoroWork', state.pomodoroWork);
      localStorage.setItem('pomodoroBreak', state.pomodoroBreak);
      render();
    };
  });
  document.getElementById('focusRainBtn')?.addEventListener('click', () => playWhiteNoise('rain'));
  document.getElementById('focusCafeBtn')?.addEventListener('click', () => playWhiteNoise('cafe'));
  document.getElementById('focusStopNoiseBtn')?.addEventListener('click', () => stopWhiteNoise());
  // Remove old file input logic

  document.getElementById('startImmersiveFocusBtn')?.addEventListener('click', async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => console.warn("Fullscreen denied"));
      }
    } catch (e) { console.warn("Fullscreen not supported"); }
    await startPomodoro();
  });
  document.getElementById('pausePomBtn')?.addEventListener('click', () => {
    if (state.pomodoroTimer) {
      const now = Date.now();
      state.pomodoroTimeRemaining = Math.max(0, Math.round((state.pomodoroEndTime - now) / 1000));
      clearInterval(state.pomodoroTimer);
      state.pomodoroTimer = null;
      state.pomodoroActive = false;
      Radio.onPomodoroPause();
    } else {
      startPomodoro();
      if (state.pomodoroPhase === 'work') Radio.onResume();
    }
    render();
  });
  document.getElementById('stopPomBtn')?.addEventListener('click', () => {
    if (window.customFocusAudio) { window.customFocusAudio.pause(); window.customFocusAudio = null; }
    stopPomodoro(true);
  });

  document.getElementById('addClubTaskBtn')?.addEventListener('click', openAddClubTaskForm);
  document.querySelectorAll('[data-toggle-club]').forEach(b => b.onclick = () => {
    const idx = parseInt(b.dataset.toggleClub);
    state.clubTasks[idx].done = !state.clubTasks[idx].done;
    localStorage.setItem('clubTasks', JSON.stringify(state.clubTasks)); render();
    if (!state.clubTasks[idx].done && Object.values(state.clubTasks).every(t => t.done)) {
      triggerConfetti();
    }
  });
  document.querySelectorAll('[data-del-club]').forEach(b => b.onclick = () => {
    state.clubTasks.splice(parseInt(b.dataset.delClub), 1);
    localStorage.setItem('clubTasks', JSON.stringify(state.clubTasks)); render();
  });
  document.getElementById('restModeBtn')?.addEventListener('click', () => { state.view = 'dashboard'; render(); showToast('😴 พักร่างประธานแล้ว'); });
  document.getElementById('editBudgetBtn')?.addEventListener('click', () => {
    const cur = JSON.parse(localStorage.getItem('clubBudget') || '{"in":0,"out":0}');
    openModal('แก้ไขงบประมาณชุมนุม', `
      <div class="form-grid">
        <div class="fg"><label>รายรับ (฿)</label><input type="number" class="glass-input" id="f-bIn" value="${cur.in}"></div>
        <div class="fg"><label>รายจ่าย (฿)</label><input type="number" class="glass-input" id="f-bOut" value="${cur.out}"></div>
      </div>`,
      `<button class="btn-glass-primary" id="saveBudgetClubBtn">บันทึก</button>`
    );
    document.getElementById('saveBudgetClubBtn').onclick = () => {
      localStorage.setItem('clubBudget', JSON.stringify({ in: parseFloat(document.getElementById('f-bIn').value) || 0, out: parseFloat(document.getElementById('f-bOut').value) || 0 }));
      closeModal(); render(); showToast('✅ บันทึกงบแล้ว');
    };
  });



  document.getElementById('addMusicBtn')?.addEventListener('click', () => {
    const url = document.getElementById('newMusicUrl').value.trim();
    if (url && url.includes('dropbox.com')) {
      const finalUrl = url.replace('dl=0', 'dl=1');
      state.customMusicUrls.push(finalUrl);
      localStorage.setItem('custom_music_urls', JSON.stringify(state.customMusicUrls));
      render();
      showToast('✅ เพิ่มเพลงเรียบร้อย');
    } else {
      showToast('⚠️ กรุณาใช้ลิงก์ Dropbox', 'err');
    }
  });
  window.removeCustomMusic = (idx) => {
    state.customMusicUrls.splice(idx, 1);
    localStorage.setItem('custom_music_urls', JSON.stringify(state.customMusicUrls));
    render();
  };

  document.getElementById('settingDarkMode')?.addEventListener('click', () => { state.darkMode = !state.darkMode; localStorage.setItem('darkMode', state.darkMode); document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light'); render(); });


  document.getElementById('savePinBtn')?.addEventListener('click', async () => {
    const pin = document.getElementById('pinInput')?.value;
    if (pin && pin.length === 6) {
      // Generate a cryptographically secure random 16-byte salt
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      const salt = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const hashed = await hashPIN(pin, salt);
      setDoc(doc(db, 'app_settings', 'security'), { 
        global_pin: hashed,
        pin_salt: salt
      }).then(() => {
        state.pin = hashed;
        state.pinSalt = salt;
        showToast('🔒 ตั้งรหัส PIN (PBKDF2 Secured) สำเร็จแล้ว');
        render();
      });
    } else {
      showToast('⚠️ กรุณากรอกรหัส PIN ให้ครบ 6 หลัก', 'err');
    }
  });
  document.getElementById('removePinBtn')?.addEventListener('click', () => {
    if (confirm('ต้องการยกเลิกรหัส PIN ใช่หรือไม่?')) {
      setDoc(doc(db, 'app_settings', 'security'), { global_pin: null, pin_salt: null }).then(() => {
        state.pin = null;
        state.pinSalt = 'NITIPAT_SALT_DEFAULT';
        state.isLocked = false;
        showToast('🔓 ยกเลิกรหัส PIN แล้ว');
        render();
      });
    }
  });
  document.getElementById('exportAllBtn')?.addEventListener('click', () => {
    const data = { semesters: state.semesters, courses: state.courses, assignments: state.assignments, exams: state.exams };
    const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `nitipat_backup_${Date.now()}.json`; a.click();
  });
  document.getElementById('clearCacheBtn')?.addEventListener('click', () => { if (confirm('ล้าง local cache? (ข้อมูล Firebase ยังอยู่)')) localStorage.clear(); showToast('🗑 ล้าง cache แล้ว'); });

  // Panic Button
  document.getElementById('panicBtn')?.addEventListener('click', () => {
    openModal('🆘 Panic Button', `
      <div class="panic-screen">
        <div class="panic-icon">💙</div>
        <div class="panic-msg">หายใจเข้าลึกๆ คุณผ่านมาถึงตรงนี้ได้แล้ว<br>นั่นแปลว่าคุณแข็งแกร่งกว่าที่คิด</div>
        <div class="panic-contacts">
          <a href="tel:02-5620188" class="panic-contact-btn">📞 กองแนะแนว มก. 02-562-0188</a>
          <a href="tel:1323" class="panic-contact-btn">📞 กรมสุขภาพจิต 1323</a>
          <a href="tel:02-7136793" class="panic-contact-btn">📞 สายด่วนวัยรุ่น 02-713-6793</a>
        </div>
        <div class="panic-quote">"${getTodayQuote()}"</div>
      </div>`
    );
  });

  // Club & Rest Mode Listeners
  document.getElementById('addClubTaskBtn')?.addEventListener('click', openAddClubTaskForm);
  document.querySelectorAll('[data-toggle-club]').forEach(b => b.onclick = () => {
    const idx = parseInt(b.dataset.toggleClub);
    state.clubTasks[idx].done = !state.clubTasks[idx].done;
    localStorage.setItem('clubTasks', JSON.stringify(state.clubTasks)); render();
    if (!state.clubTasks[idx].done && Object.values(state.clubTasks).every(t => t.done)) triggerConfetti();
  });
  document.querySelectorAll('[data-del-club]').forEach(b => b.onclick = () => {
    state.clubTasks.splice(parseInt(b.dataset.delClub), 1);
    localStorage.setItem('clubTasks', JSON.stringify(state.clubTasks)); render();
  });
  document.getElementById('restModeBtn')?.addEventListener('click', () => { state.view = 'dashboard'; render(); showToast('😴 พักร่างประธานแล้ว'); });
  document.getElementById('editBudgetBtn')?.addEventListener('click', () => {
    const cur = JSON.parse(localStorage.getItem('clubBudget') || '{"in":0,"out":0}');
    openModal('แก้ไขงบประมาณชุมนุม', `
          <div class="form-grid">
            <div class="fg"><label>รายรับ (฿)</label><input type="number" class="glass-input" id="f-bIn" value="${cur.in}"></div>
            <div class="fg"><label>รายจ่าย (฿)</label><input type="number" class="glass-input" id="f-bOut" value="${cur.out}"></div>
          </div>`,
      `<button class="btn-glass-primary" id="saveBudgetClubBtn">บันทึก</button>`
    );
    document.getElementById('saveBudgetClubBtn').onclick = () => {
      localStorage.setItem('clubBudget', JSON.stringify({ in: parseFloat(document.getElementById('f-bIn').value) || 0, out: parseFloat(document.getElementById('f-bOut').value) || 0 }));
      closeModal(); render(); showToast('✅ บันทึกงบแล้ว');
    };
  });

}

function renderCourseHub(courseId) {
  state.activeCourseId = courseId;
  state.view = 'course-hub';
  state.activeHubTab = 'Files';
  state.driveBreadcrumbs = [];
  state.currentFolderId = null;
  render();

  const c = findCourseById(courseId);
  if (c && c.driveId) {
    refreshDriveFiles(courseId, c.driveId);
  }
}
// ══════════════════════════════════════════════════
// CONFETTI
// ══════════════════════════════════════════════════
function triggerConfetti() {
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `left:${Math.random() * 100}vw;background:hsl(${Math.random() * 360},90%,60%);animation-duration:${0.8 + Math.random()}s;animation-delay:${Math.random() * 0.5}s;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}



// Course Hub functions have been moved up and integrated with the hierarchical system.

async function setAttendanceStatus(courseId, status, skipGPS = false) {
  const c = findCourseById(courseId);
  let distMeters = null;

  const recordAttendance = async (finalStatus) => {
    const now = new Date();
    const dateKey = now.toLocaleDateString('en-CA');
    state.attendanceHistory[courseId] = state.attendanceHistory[courseId] || {};
    state.attendanceHistory[courseId][dateKey] = { status: finalStatus, timestamp: now.toISOString(), distanceMeters: distMeters };
    localStorage.setItem('attendance_history', JSON.stringify(state.attendanceHistory));
    showToast(`✅ บันทึกสถานะ [${finalStatus}] แล้ว`);
    render();
    try {
      await fsSet('attendance_history', courseId, { history: state.attendanceHistory[courseId] });
    } catch (e) { console.warn("Firebase att sync failed", e); }
  };

  if (c?.targetCoords && !skipGPS && status !== 'ขาดเรียน') {
    try {
      showToast('📍 กำลังตรวจสอบตำแหน่ง GPS...');
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const [tLat, tLon] = c.targetCoords.split(',').map(Number);
      const dist = getDistance(pos.coords.latitude, pos.coords.longitude, tLat, tLon);
      distMeters = Math.round(dist * 1000);

      if (dist > 0.2) { // 200 เมตร
        openModal('📍 อยู่นอกพื้นที่ห้องเรียน', `
              <div style="text-align:center; padding:10px;">
                <p>คุณอยู่ห่างจากห้องเรียน <strong>${distMeters} เมตร</strong></p>
                <p>กรุณาระบุเหตุผลการเช็คอิน:</p>
                <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
                  <button class="nb-btn full" onclick="closeModal(); setAttendanceStatus('${courseId}', 'เรียนออนไลน์', true)">💻 เรียนออนไลน์</button>
                  <button class="nb-btn full" onclick="closeModal(); setAttendanceStatus('${courseId}', 'อาจารย์เปลี่ยนห้อง', true)">🚪 อาจารย์เปลี่ยนห้อง</button>
                  <button class="nb-btn full" onclick="closeModal(); setAttendanceStatus('${courseId}', 'เรียนนอกสถานที่', true)">🌍 เรียนนอกสถานที่</button>
                  <button class="nb-btn-danger full" onclick="closeModal()">❌ ยกเลิก</button>
                </div>
              </div>
            `);
        return;
      }
    } catch (err) {
      openModal('⚠️ ไม่สามารถเข้าถึง GPS ได้', `
              <div style="text-align:center; padding:10px;">
                <p>ระบบไม่สามารถตรวจสอบพิกัดได้ (${err.message})</p>
                <p>กรุณาระบุเหตุผลการเช็คอิน:</p>
                <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
                  <button class="nb-btn full" onclick="closeModal(); setAttendanceStatus('${courseId}', 'เรียนออนไลน์', true)">💻 เรียนออนไลน์</button>
                  <button class="nb-btn full" onclick="closeModal(); setAttendanceStatus('${courseId}', 'อาจารย์เปลี่ยนห้อง', true)">🚪 อาจารย์เปลี่ยนห้อง</button>
                  <button class="nb-btn full" onclick="closeModal(); setAttendanceStatus('${courseId}', 'เรียนนอกสถานที่', true)">🌍 เรียนนอกสถานที่</button>
                  <button class="nb-btn-danger full" onclick="closeModal()">❌ ยกเลิก</button>
                </div>
              </div>
            `);
      return;
    }
  }

  await recordAttendance(status);
}

function promptAbsenceReason(courseId) {
  const reason = prompt("กรุณาระบุเหตุผลที่ขาดเรียน (เช่น เจ็บป่วย, ลากิจ, อื่นๆ):");
  if (reason === null) return;
  const status = reason.trim() === "" ? "ขาดเรียน" : `ขาดเรียน (${reason.trim()})`;
  setAttendanceStatus(courseId, status, true);
}

// ══════════════════════════════════════════════════
// EXPOSE TO WINDOW (Fix for iOS/Safari & Module Scoping)
// ══════════════════════════════════════════════════
window.render = render;
window.addTopic = addTopic;
window.setTopicLevel = setTopicLevel;
window.deleteTopic = deleteTopic;
window.setAttendanceStatus = setAttendanceStatus;
window.promptAbsenceReason = promptAbsenceReason;
window.renderCourseHub = renderCourseHub;
window.logoutApp = () => {
  if (confirm('ต้องการออกจากระบบ (ล็อกแอป) ใช่หรือไม่?')) {
    sessionStorage.removeItem('unlocked');
    sessionStorage.removeItem('unlocked_at');
    state.isLocked = true;
    showToast('🔒 ออกจากระบบและล็อกแอปสำเร็จ');
    render();
  }
};

window.showIDCardModal = showIDCardModal;
window.closeModal = closeModal;
window.setupGradeStructure = setupGradeStructure;
window.openModal = openModal;
window.openAddSemesterForm = openAddSemesterForm;
window.openAddCourseForm = openAddCourseForm;
window.openAddAssignmentForm = openAddAssignmentForm;
window.openAddExamForm = openAddExamForm;
window.triggerConfetti = triggerConfetti;
window.refreshDriveFiles = refreshDriveFiles;
window.handleFileUpload = handleFileUpload;
window.initAttendanceMap = initAttendanceMap;
window.state = state;
window.Radio = Radio;

// Mini-drive exports
window.previewFile = previewFile;
window.toggleItemSelection = toggleItemSelection;
window.automateDriveFolder = automateDriveFolder;
window.gotoFolder = gotoFolder;
window.shareSelectedItems = shareSelectedItems;
window.printSelectedItems = printSelectedItems;
window.renameSelectedItem = renameSelectedItem;
window.deleteSelectedItems = deleteSelectedItems;
window.handleCreateFolder = handleCreateFolder;
window.addCourseLink = addCourseLink;
window.removeCourseLink = removeCourseLink;
window.deleteCourse = deleteCourse;
window.saveCourseSettings = async function (id) {
  const form = document.getElementById('courseHubForm');
  if (!form) return;
  const updates = {
    'hubConfig.structure': form.querySelector('#f-hubStructure')?.value || '',
    'hubConfig.understanding': form.querySelector('#f-hubUnderstanding')?.value || '',
    'hubConfig.score': form.querySelector('#f-hubScore')?.value || '',
    'hubConfig.notes': form.querySelector('#f-hubNotes')?.value || ''
  };
  try {
    await updateDoc(doc(db, 'courses', id), updates);
    showToast('✅ บันทึกข้อมูลวิชาเรียบร้อย');
    await loadAll();
  } catch (e) {
    console.error(e);
    showToast('❌ บันทึกไม่สำเร็จ', 'err');
  }
};
async function hashPIN(pin, salt = 'NITIPAT_SALT_DEFAULT', iterations = 10000) {
  try {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: iterations,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const exported = await crypto.subtle.exportKey('raw', derivedKey);
    const hashArray = Array.from(new Uint8Array(exported));
    return 'pbkdf2$' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Cryptographic fallback to salted SHA-256 if subtle is unavailable or fails
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256$' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

async function verifyPIN(inputPin, storedHash, salt = 'NITIPAT_SALT_DEFAULT') {
  if (!storedHash) return false;
  
  if (storedHash.startsWith('pbkdf2$')) {
    const hashedInput = await hashPIN(inputPin, salt);
    return hashedInput === storedHash;
  }
  
  if (storedHash.startsWith('sha256$')) {
    const hashedInput = await hashPIN(inputPin, salt);
    return hashedInput === storedHash;
  }
  
  // Legacy plain SHA-256 (no prefix)
  const encoder = new TextEncoder();
  const data = encoder.encode(inputPin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const legacyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return legacyHash === storedHash;
}

function startInactivityTracker() {
  const resetTimer = () => {
    if (sessionStorage.getItem('unlocked') === 'true') {
      sessionStorage.setItem('unlocked_at', Date.now().toString());
    }
  };
  
  ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetTimer, { passive: true });
  });
  
  setInterval(() => {
    if (sessionStorage.getItem('unlocked') === 'true') {
      const unlockedAt = sessionStorage.getItem('unlocked_at');
      if (unlockedAt && (Date.now() - parseInt(unlockedAt) > 1800000)) {
        sessionStorage.removeItem('unlocked');
        sessionStorage.removeItem('unlocked_at');
        state.isLocked = true;
        showToast('🔒 เซสชันหมดอายุเนื่องจากไม่มีความเคลื่อนไหว', 'err');
        LoginGate.init();
        render();
      }
    }
  }, 10000);
}

window.updateSetColor = updateSetColor;

async function initApp() {
  try {
    startInactivityTracker();
    await loadCourseDatabase();
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
    loadFromLocalStorage();
    
    // Check initial unlock state
    const unlocked = sessionStorage.getItem('unlocked');
    const unlockedAt = sessionStorage.getItem('unlocked_at');
    const isTimeout = unlockedAt && Date.now() - parseInt(unlockedAt) > 1800000;

    if (unlocked === 'true' && !isTimeout) {
      state.isLocked = false;
      document.getElementById('login-gate')?.classList.add('inactive');
      await startAppCore();
    } else {
      state.isLocked = true;
      sessionStorage.removeItem('unlocked');
      sessionStorage.removeItem('unlocked_at');
      LoginGate.init(); // Fallback to classic gate for initialization
    }

    render();

    if (typeof Radio !== 'undefined') {
      Radio.init();
    }

    // Dynamic background GPS check-in tracker (runs every 5 minutes)
    setInterval(() => {
      if (!state.isLocked && !state.modal) {
        GPSManager.checkInSuggestion().catch(err => console.error("Background GPS check failed: ", err));
      }
    }, 300000);

    setInterval(() => { if (!state.modal) render(); }, 30000);
  } catch (e) {
    console.error("Initialization failed:", e);
    render();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Page Visibility API — kill tree if unfocused during pomodoro
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.pomodoroActive && state.pomodoroPhase === 'work') {
    state.tree.alive = false;
    localStorage.setItem('focusTree', JSON.stringify(state.tree));
    showToast('🪨 ต้นไม้ตายแล้ว! อย่าออกจากหน้าจอระหว่างโฟกัส', 'err');
  }
});
/**
 * ══════════════════════════════════════════════════
 * SMART DRIVE SYSTEM (Google Picker API Integration)
 * ══════════════════════════════════════════════════
 */

const PickerManager = {
  gapiLoaded: false,
  pickerLoaded: false,

  async init() {
    if (this.gapiLoaded && this.pickerLoaded) return;
    
    await new Promise((res) => gapi.load('client:picker', res));
    this.gapiLoaded = true;
    this.pickerLoaded = true;
    
    // Fetch Picker Config (DeveloperKey, AppId) from backend
    if (!state.drivePickerConfig) {
      state.drivePickerConfig = await new Promise((res) => {
        google.script.run.withSuccessHandler(res).getPickerConfig();
      });
    }
  },

  async getAccessToken() {
    return new Promise((res) => {
      google.script.run.withSuccessHandler(res).getPickerToken();
    });
  },

  async openPicker(courseId, parentId, onSelect) {
    await this.init();
    const token = await this.getAccessToken();
    const config = state.drivePickerConfig;

    if (!token || !config?.developerKey) {
      showToast('❌ ไม่สามารถเข้าถึงสิทธิ์ Google Drive ได้', 'err');
      return;
    }

    const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setParent(parentId)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true);

    const uploadView = new google.picker.DocsUploadView()
      .setParent(parentId);

    const picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(config.appId)
      .setOAuthToken(token)
      .setDeveloperKey(config.developerKey)
      .addView(view)
      .addView(uploadView)
      .setCallback((data) => {
        if (data.action === google.picker.Action.PICKED) {
          onSelect(data.docs);
        }
      })
      .build();
    
    picker.setVisible(true);
  }
};

window.PickerManager = PickerManager;

/**
 * SMART COURSE HUB: DRIVE EXPLORER
 */
async function refreshDriveFiles(courseId, folderId, force = false) {
  const c = findCourseById(courseId);
  if (!c) return;

  const targetFolderId = folderId || state.currentFolderId || c.driveId;
  if (!targetFolderId) return;

  // Initialize breadcrumbs if at root
  if (targetFolderId === c.driveId && state.driveBreadcrumbs.length === 0) {
    state.driveBreadcrumbs = [{ id: targetFolderId, name: 'Root' }];
  }
  state.currentFolderId = targetFolderId;

  state.courseFiles = state.courseFiles || {};
  state.selectedItems.clear();
  refreshExplorerOnly(courseId);

  google.script.run
    .withSuccessHandler(files => {
      state.courseFiles[targetFolderId] = {
        folders: files.filter(f => f.isFolder),
        files: files.filter(f => !f.isFolder)
      };
      refreshExplorerOnly(courseId);
    })
    .withFailureHandler(err => {
      showToast(`❌ โหลดไฟล์ล้มเหลว: ${err.message}`, 'err');
    })
    .listDriveFiles(targetFolderId);
}

async function handleFileUpload(courseId, folderId) {
  const c = findCourseById(courseId);
  const targetFolderId = state.currentFolderId || folderId || (c ? c.driveId : null);
  if (!targetFolderId) return;

  PickerManager.openPicker(courseId, targetFolderId, (docs) => {
    showToast(`✅ อัปโหลด ${docs.length} รายการสำเร็จ (Direct to Drive)`);
    refreshDriveFiles(courseId, targetFolderId, true);
  });
}

function gotoFolder(courseId, folderId, folderName) {
  const existingIdx = state.driveBreadcrumbs.findIndex(b => b.id === folderId);
  if (existingIdx !== -1) {
    state.driveBreadcrumbs = state.driveBreadcrumbs.slice(0, existingIdx + 1);
  } else {
    state.driveBreadcrumbs.push({ id: folderId, name: folderName });
  }
  refreshDriveFiles(courseId, folderId);
}

window.saveCourseCoords = async (courseId) => {
  if (!state.tempCoords) return;
  try {
    await fsUpd('courses', courseId, { targetCoords: state.tempCoords });
    const c = findCourseById(courseId);
    if (c) c.targetCoords = state.tempCoords;
    showToast('✅ บันทึกพิกัดห้องเรียนสำเร็จ');
  } catch (e) {
    showToast('❌ ไม่สามารถบันทึกพิกัดได้', 'err');
  }
};

function initAttendanceMap(courseId, targetCoords) {
  setTimeout(() => {
    const mapEl = document.getElementById('attMap');
    if (!mapEl) return;

    let [lat, lon] = [13.8476, 100.5696]; // Default KU
    const c = findCourseById(courseId);
    const savedCoords = targetCoords || (c && c.targetCoords);
    if (savedCoords) {
      [lat, lon] = savedCoords.split(',').map(Number);
    }

    const map = L.map('attMap').setView([lat, lon], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    let marker = L.marker([lat, lon], { draggable: true }).addTo(map)
      .bindPopup(`ตึกเรียนของคุณ${savedCoords ? ' (บันทึกแล้ว)' : ''} (ลากเพื่อย้าย)`).openPopup();

    marker.on('dragend', function (e) {
      const newPos = marker.getLatLng();
      const coordsStr = `${newPos.lat.toFixed(6)},${newPos.lng.toFixed(6)}`;
      state.tempCoords = coordsStr;
      marker.getPopup().setContent(`
            พิกัดใหม่: ${coordsStr}<br>
            <button onclick="saveCourseCoords('${courseId}')" style="margin-top:8px; padding:4px 8px; background:#4f46e5; color:white; border:none; border-radius:4px; cursor:pointer;">💾 บันทึกพิกัด</button>
          `).openOn(map);
    });

    window.useCurrentLocation = () => {
      if (!navigator.geolocation) return showToast('ไม่รองรับ GPS');
      navigator.geolocation.getCurrentPosition(pos => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        map.setView(p, 17);
        marker.setLatLng(p);
        state.tempCoords = `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
      });
    };
  }, 100);
}
// ── Web Push & Notification Logic ──
async function initWebPush() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('firebase-messaging-sw.js');
      console.log('Firebase Service Worker registered');

      // อัปเดต Token อัตโนมัติถ้าเคยอนุญาตแล้ว
      if (Notification.permission === 'granted' && typeof getToken !== 'undefined') {
        const registration = await navigator.serviceWorker.ready;
        const currentToken = await getToken(messaging, {
          vapidKey: 'BGJJHyr07SwrKxHuo1w8HDRYCb6R-p6kZsk6yRaq-ho-iQ-7S0YdfTgz9KKDFW95jyQ927xCY51r6Wml84TonF4'.trim(),
          serviceWorkerRegistration: registration
        });
        if (currentToken) {
          google.script.run.saveFcmToken(currentToken);
        }
      }
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
    }
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน");
    return;
  }

  let permission = await Notification.requestPermission();
  if (permission === "granted") {
    try {
      const registration = await navigator.serviceWorker.ready;
      const currentToken = await getToken(messaging, {
        vapidKey: 'BGJJHyr07SwrKxHuo1w8HDRYCb6R-p6kZsk6yRaq-ho-iQ-7S0YdfTgz9KKDFW95jyQ927xCY51r6Wml84TonF4'.trim(),
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // ใช้ ID เครื่อง (deviceId) หรือ Hash ของ Token เพื่อไม่ให้ทับกัน
        const tokenHash = currentToken.substring(currentToken.length - 20);
        await setDoc(doc(db, 'fcm_tokens', tokenHash), {
          token: currentToken,
          updatedAt: serverTimestamp(),
          userId: STUDENT.id,
          platform: navigator.platform,
          userAgent: navigator.userAgent
        });
        google.script.run.withSuccessHandler(res => {
          showToast(`✅ ลงทะเบียนสำเร็จ! (อุปกรณ์ที่ ${res.count})`);
        }).saveFcmToken(currentToken);

        showToast("✅ เปิดการแจ้งเตือน FCM สำเร็จ!");
        new Notification("NITIPAT MANAGER", {
          body: "ระบบลงทะเบียนแจ้งเตือนแบบ Native สำเร็จแล้ว!",
          icon: "https://img1.pic.in.th/images/Gemini_Generated_Image_k0lkzwk0lkzwk0lk.png"
        });
      } else {
        showToast("⚠️ ไม่สามารถรับรหัสลงทะเบียนได้", "err");
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
      let errorMsg = "❌ เกิดข้อผิดพลาดในการลงทะเบียน FCM";

      if (err.name === 'AbortError' || err.message.includes('push service error')) {
        errorMsg = "⚠️ ไม่สามารถติดต่อบริการ Push ได้\n\n(หากใช้ iPhone/iPad ต้อง 'เพิ่มไปยังหน้าจอโฮม' ก่อน หรืออาจเกิดจากบล็อกโฆษณา/VPN)";
      } else if (err.code === 'messaging/permission-blocked') {
        errorMsg = "⚠️ คุณบล็อกการแจ้งเตือนไว้ กรุณาปลดล็อกในตั้งค่าเบราว์เซอร์";
      }

      showToast(errorMsg, "err");
    }
  } else {
    showToast("⚠️ คุณยังไม่ได้อนุญาตการแจ้งเตือน", "err");
  }
}

window.requestNotificationPermission = requestNotificationPermission;

window.openPendingReflectionsModal = () => {
  const missing = getMissingReflections();
  if (missing.length === 0) { showToast('🎉 ไม่มีงาน Reflection ค้างแล้ว'); return; }

  openModal('📝 สรุปการเรียนที่ค้างอยู่', `
    <div style="padding:10px;">
      <p style="font-size:13px; margin-bottom:15px; color:var(--c-rust); font-weight:700;">⚠️ ตรวจพบงานที่ค้างเกิน 24 ชม. (หลอกระบบหรือเปล่า? ทำไมเข้าเรียนแต่ไม่บันทึก!)</p>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${missing.map(c => `
          <div class="glass-card" style="padding:15px; border:1.5px solid black; background:white;">
            <div style="font-weight:800;">${c.code} - ${c.nameTh}</div>
            <textarea id="refl_${c.id}" class="nb-input" style="width:100%; margin-top:10px; min-height:60px;" placeholder="วันนี้เรียนรู้อะไรบ้าง..."></textarea>
            <button class="nb-btn-primary sm full" style="margin-top:10px;" onclick="saveSingleReflection('${c.id}')">บันทึกวิชานี้</button>
          </div>
        `).join('')}
      </div>
    </div>
  `);
};

window.saveSingleReflection = async (id) => {
  const val = document.getElementById(`refl_${id}`)?.value;
  if (!val) { showToast('⚠️ กรุณากรอกเนื้อหา', 'err'); return; }

  state.reflections[id] = val;
  localStorage.setItem('reflections', JSON.stringify(state.reflections));
  await fsSet('reflections', id, { text: val, updatedAt: new Date().toISOString() });
  showToast('✅ บันทึกสำเร็จ!');
  const remaining = getMissingReflections();
  if (remaining.length > 0) openPendingReflectionsModal();
  else closeModal();
  render();
};
// ── Notification Logic ──
function pushNotif(title, body, delay = 0) {
  if (!state.notificationsGranted) return;
  if (delay <= 0) {
    new Notification(title, { body, icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" });
  } else {
    const tid = setTimeout(() => {
      new Notification(title, { body, icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" });
    }, delay);
    state.notificationTimeouts.push(tid);
  }
}

function clearAllNotificationTimeouts() {
  state.notificationTimeouts.forEach(clearTimeout);
  state.notificationTimeouts = [];
}

function scheduleAllNotifications() {
  if (!state.notificationsGranted) return;
  clearAllNotificationTimeouts();

  function delayUntil(hour, min = 0) {
    const now = new Date();
    const t = new Date(now);
    t.setHours(hour, min, 0, 0);
    if (t < now) return -1; // Already past for today
    return t.getTime() - now.getTime();
  }

  const assignments = Object.values(state.assignments).flat().filter(a => !a.submitted);
  const exams = Object.values(state.exams).flat();

  assignments.forEach(a => {
    const days = getDaysUntil(a.dueDate);
    if (days === 7) {
      [8, 19].forEach(hr => {
        const d = delayUntil(hr);
        if (d >= 0) pushNotif(`⏳ อีก 7 วันส่ง: ${a.title}`, `เช้า/เย็นอย่าลืมวางแผนทำนะ!`, d);
      });
    } else if (days === 3) {
      [8, 12, 16, 20].forEach(hr => {
        const d = delayUntil(hr);
        if (d >= 0) pushNotif(`⚠️ อีก 3 วันส่ง!! ${a.title}`, `ต้องเริ่มลงมือทำจริงจังแล้วนะ`, d);
      });
    } else if (days === 1) {
      const msgs = ['เริ่มเช้าวันใหม่กับงาน!', 'โอกาสสุดท้ายของเช้านี้', 'ช่วงบ่ายต้องคืบหน้า', 'เย็นนี้ต้องใกล้เสร็จ', 'ค่ำคืนแห่งการปั่นงาน', '2 ชั่วโมงสุดท้ายก่อนเที่ยงคืน?', 'ยังไม่นอนใช่ไหม? ปั่นต่อ!'];
      [7, 10, 13, 16, 19, 21, 23].forEach((hr, i) => {
        const d = delayUntil(hr);
        if (d >= 0) pushNotif(`🚨 พรุ่งนี้ต้องส่งแล้ว!!: ${a.title}`, msgs[i], d);
      });
    }
  });

  exams.forEach(e => {
    const days = getDaysUntil(e.date);
    const tips = ["ทบทวน Mind Map", "ทำโจทย์ย้อนหลัง 3 ปี", "สรุปประเด็นสำคัญใน 1 หน้า"];
    if (days === 5) {
      [9, 14, 19].forEach((hr, i) => {
        const d = delayUntil(hr);
        if (d >= 0) pushNotif(`📖 อีก 5 วันสอบ: ${e.title}`, `Study Tip: ${tips[i]}`, d);
      });
    } else if (days === 1) {
      for (let hr = 8; hr <= 22; hr += 2) {
        const d = delayUntil(hr);
        if (d >= 0) pushNotif(`🔥 พรุ่งนี้สอบ!!: ${e.title}`, `Priority สูงสุด! ทบทวนโค้งสุดท้าย`, d);
      }
    }
  });
}



function showCheckinBanner(course) {
  let banner = document.getElementById('checkinBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'checkinBanner';
    banner.style.cssText = `
      position:fixed; top:0; left:0; right:0; z-index:9999;
      background:linear-gradient(135deg,#4f46e5,#7c3aed);
      color:white; padding:12px 16px;
      display:flex; align-items:center; justify-content:space-between;
      font-family:Kanit; font-size:14px;
      box-shadow:0 4px 20px rgba(79,70,229,0.4);
      animation: slideDown 0.3s ease;
    `;
    document.getElementById('app').prepend(banner);
  }
  banner.innerHTML = `
    <div>
      <div style="font-weight:600">📍 กำลังเรียน: ${course.nameTh}</div>
      <div style="font-size:12px;opacity:0.85">ห้อง ${course.room || 'ไม่ระบุ'} — เช็คชื่อด้วยนะ!</div>
    </div>
    <button onclick="setAttendanceStatus('${course.id}','เข้าเรียน');hideCheckinBanner()"
      style="background:white;color:#4f46e5;border:none;padding:8px 16px;
             border-radius:20px;font-family:Kanit;font-size:13px;
             font-weight:600;cursor:pointer;white-space:nowrap">
      ✅ เช็คชื่อเลย
    </button>
  `;
}

function hideCheckinBanner() {
  document.getElementById('checkinBanner')?.remove();
}

// ── Smart Alarm System ──
function renderAlarmPage() {
  const alarms = [...state.alarms].sort((a, b) => a.time.localeCompare(b.time));
  const nextAlarm = alarms.find(a => a.enabled);

  return `
    <div class="page-container">
      <div class="page-header">
        <h2>⏰ นาฬิกาปลุก</h2>
        ${nextAlarm ? `<div class="next-alarm-pill">ปลุกครั้งถัดไป ${nextAlarm.time}</div>` : ''}
      </div>

      <div class="quick-add-strip">
        <div class="quick-label">เพิ่มชุดปลุกด่วน:</div>
        <button onclick="quickAddAlarms(5,5)" class="nb-btn sm">5×5นาที</button>
        <button onclick="quickAddAlarms(3,10)" class="nb-btn sm">3×10นาที</button>
        <button onclick="quickAddAlarms(7,5)" class="nb-btn sm">7×5นาที</button>
        <button onclick="openQuickAddModal()" class="nb-btn sm nb-btn-primary">กำหนดเอง</button>
      </div>

      <div class="alarm-list">
        ${alarms.length === 0 ? `
          <div class="empty-state">
            <div style="font-size:48px">⏰</div>
            <div>ยังไม่มีนาฬิกาปลุก</div>
            <div style="font-size:13px;opacity:0.6">กดปุ่มด้านล่างเพื่อเพิ่ม</div>
          </div>
        ` : alarms.map(a => `
          <div class="alarm-card ${a.enabled ? '' : 'disabled'}" id="alarm-${a.id}">
            <div class="alarm-main">
              <div class="alarm-time">${a.time}</div>
              <div class="alarm-meta">
                <div class="alarm-label">${a.label || 'นาฬิกาปลุก'}</div>
                <div class="alarm-repeat">
                  ${a.repeat?.length > 0 ? a.repeat.map(d => ({
    mon: 'จ', tue: 'อ', wed: 'พ', thu: 'พฤ', fri: 'ศ', sat: 'ส', sun: 'อา'
  }[d] || d)).join(' ') : 'วันเดียว'}
                  • snooze ${a.snoozeMin || 5} นาที
                </div>
              </div>
            </div>
            <div class="alarm-actions">
              <label class="toggle-switch">
                <input type="checkbox" ${a.enabled ? 'checked' : ''} 
                  onchange="toggleAlarm('${a.id}', this.checked)">
                <span class="toggle-slider"></span>
              </label>
              <button onclick="deleteAlarm('${a.id}')" class="alarm-delete-btn">🗑</button>
            </div>
          </div>
        `).join('')}
      </div>

      <button onclick="openAddAlarmModal()" class="add-alarm-btn">
        + เพิ่มนาฬิกาปลุก
      </button>

      ${alarms.filter(a => a.enabled).length > 0 ? `
        <button onclick="enterSleepMode()" class="sleep-mode-btn">
          🌙 โหมดนอน — เปิดหน้าจอนาฬิกา
        </button>
        <button onclick="sendAlarmsToShortcuts()" class="shortcuts-btn">
          🍎 ส่งไป iPhone Shortcuts
        </button>
      ` : ''}
    </div>
  `;
}

function openAddAlarmModal(prefillTime = '') {
  const now = new Date();
  const defaultTime = prefillTime ||
    `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  openModal('⏰ เพิ่มนาฬิกาปลุก', `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div>
        <label class="form-label">เวลาปลุก</label>
        <input type="time" id="alarmTime" value="${defaultTime}"
          style="font-size:32px;font-family:JetBrains Mono;width:100%;
                 padding:12px;border-radius:12px;border:1px solid var(--border);
                 background:var(--bg);color:var(--text);text-align:center">
      </div>
      <div>
        <label class="form-label">ป้ายชื่อ (optional)</label>
        <input type="text" id="alarmLabel" class="nb-input"
          placeholder="เช่น ตื่นไปเรียน, ตื่นส่งงาน" value="ตื่นไปเรียน">
      </div>
      <div>
        <label class="form-label">เลื่อนปลุก (Snooze)</label>
        <select id="alarmSnooze" class="nb-input">
          <option value="5">5 นาที</option>
          <option value="10">10 นาที</option>
          <option value="15">15 นาที</option>
        </select>
      </div>
      <div>
        <label class="form-label">ทำซ้ำ</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${[['mon', 'จ'], ['tue', 'อ'], ['wed', 'พ'], ['thu', 'พฤ'],
    ['fri', 'ศ'], ['sat', 'ส'], ['sun', 'อา']].map(([v, l]) => `
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
              <input type="checkbox" value="${v}" class="alarm-repeat-cb"> ${l}
            </label>
          `).join('')}
        </div>
      </div>
    </div>
  `, `
    <button onclick="addAlarmFromModal()" class="nb-btn nb-btn-primary full">
      ⏰ บันทึกนาฬิกาปลุก
    </button>
  `);
}

async function addAlarmFromModal() {
  const time = document.getElementById('alarmTime')?.value;
  const label = document.getElementById('alarmLabel')?.value || 'นาฬิกาปลุก';
  const snoozeMin = parseInt(document.getElementById('alarmSnooze')?.value || '5');
  const repeat = [...document.querySelectorAll('.alarm-repeat-cb:checked')]
    .map(cb => cb.value);

  if (!time) { showToast('⚠️ กรุณาเลือกเวลา', 'warn'); return; }
  await addAlarm(time, label, snoozeMin, repeat);
  closeModal();
}

async function addAlarm(time, label, snoozeMin = 5, repeat = []) {
  const alarm = {
    id: Date.now().toString(),
    time, label,
    enabled: true,
    snoozeMin,
    repeat,
    isSnooze: false
  };
  state.alarms.push(alarm);
  state.alarms.sort((a, b) => a.time.localeCompare(b.time));
  localStorage.setItem('alarms', JSON.stringify(state.alarms));
  try { await fsSet('alarms', 'list', { alarms: state.alarms }); } catch (e) { }
  render();
  showToast(`⏰ ตั้งปลุก ${time} แล้ว`);
  syncDataToBackend();
}

function openQuickAddModal() {
  openModal('⚡ Quick Add ชุดปลุก', `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div>
        <label class="form-label">เวลาเริ่มต้น</label>
        <input type="time" id="qaStartTime" value="07:00"
          style="font-size:28px;font-family:JetBrains Mono;width:100%;
                 padding:12px;border-radius:12px;border:1px solid var(--border);
                 background:var(--bg);color:var(--text);text-align:center">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label class="form-label">จำนวนครั้ง</label>
          <input type="number" id="qaCount" class="nb-input" value="5" min="1" max="20">
        </div>
        <div>
          <label class="form-label">ห่างกัน (นาที)</label>
          <input type="number" id="qaInterval" class="nb-input" value="5" min="1" max="60">
        </div>
      </div>
    </div>
  `, `
    <button onclick="quickAddFromModal()" class="nb-btn nb-btn-primary full">
      ⚡ สร้างชุดปลุก
    </button>
  `);
}

async function quickAddFromModal() {
  const startTime = document.getElementById('qaStartTime')?.value || '07:00';
  const count = parseInt(document.getElementById('qaCount')?.value || '5');
  const interval = parseInt(document.getElementById('qaInterval')?.value || '5');
  await quickAddAlarms(count, interval, startTime);
  closeModal();
}

async function quickAddAlarms(count, intervalMin, startTime = '07:00') {
  const [h, m] = startTime.split(':').map(Number);
  for (let i = 0; i < count; i++) {
    const totalMin = h * 60 + m + i * intervalMin;
    const nh = Math.floor(totalMin / 60) % 24;
    const nm = totalMin % 60;
    const time = `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
    await addAlarm(time, `ปลุกครั้งที่ ${i + 1}`, 5, []);
    await new Promise(r => setTimeout(r, 50));
  }
  showToast(`⏰ สร้าง ${count} นาฬิกาปลุกแล้ว`);
}

function toggleAlarm(id, enabled) {
  const alarm = state.alarms.find(a => a.id === id);
  if (alarm) {
    alarm.enabled = enabled;
    localStorage.setItem('alarms', JSON.stringify(state.alarms));
    fsSet('alarms', 'list', { alarms: state.alarms }).catch(() => { });
    showToast(enabled ? `⏰ เปิดปลุก ${alarm.time}` : `🔕 ปิดปลุก ${alarm.time}`);
    syncDataToBackend();
  }
}

function deleteAlarm(id) {
  state.alarms = state.alarms.filter(a => a.id !== id);
  localStorage.setItem('alarms', JSON.stringify(state.alarms));
  fsSet('alarms', 'list', { alarms: state.alarms }).catch(() => { });
  render();
  showToast('🗑 ลบนาฬิกาปลุกแล้ว');
  syncDataToBackend();
}

async function enterSleepMode() {
  if (!state.alarmAudioCtx) {
    state.alarmAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.alarmAudioCtx.state === 'suspended') {
    await state.alarmAudioCtx.resume();
  }
  let hideTimer;
  // 1. Web Worker Timer: ระบบจับเวลาที่จะไม่หยุดเดินแม้ดับหน้าจอ
  if (!state.timerWorker) {
    const workerCode = `
      let timer;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          timer = setInterval(() => self.postMessage('tick'), 1000);
        } else if (e.data === 'stop') {
          clearInterval(timer);
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    state.timerWorker = new Worker(URL.createObjectURL(blob));
    state.timerWorker.onmessage = () => {
      if (state.sleepMode) {
        updateSleepClock();
        checkAlarms();
      }
    };
  }
  state.timerWorker.postMessage('start');

  // 2. Media Session & Silent Audio: ใช้ไฟล์ MP3 เงียบมาตรฐานจาก URL จริง (เพื่อให้ iOS ยอมรับ)
  if (!state.keepAliveAudio) {
    // ใช้ไฟล์เงียบมาตรฐานความยาว 250ms ที่นิยมใช้ประคองชีพ PWA
    state.keepAliveAudio = new Audio('https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3');
    state.keepAliveAudio.loop = true;
    state.keepAliveAudio.volume = 0.05;
  }

  const startAudio = () => {
    state.keepAliveAudio.play().then(() => {
      console.log("✅ iOS Keep-Alive Audio Playing");
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    }).catch(e => {
      console.log("❌ Audio Play Failed:", e);
      showToast('⚠️ โปรดแตะหน้าจอหนึ่งครั้งเพื่อเปิดระบบเสียง', 'warn');
    });
  };

  startAudio();

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'NITIPAT Alarms Active',
      artist: 'System Protection',
      album: 'Keep-Alive Mode'
    });
    navigator.mediaSession.playbackState = 'playing';
  }

  state.sleepMode = true;
  const screen = document.createElement('div');
  screen.id = 'sleepModeScreen';
  screen.style.cssText = `
    position:fixed; inset:0; z-index:99999;
    background:#000; color:#fff;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    font-family:'JetBrains Mono',monospace;
    cursor:pointer; user-select:none;
  `;
  screen.innerHTML = `
    <div id="sleepClock" style="font-size:72px;font-weight:600;letter-spacing:4px;
      text-shadow:0 0 40px rgba(255,255,255,0.3)">00:00</div>
    <div id="sleepDate" style="font-size:16px;opacity:0.5;margin-top:8px;
      font-family:Kanit"></div>
    <div id="sleepNextAlarm" style="margin-top:32px;font-size:14px;
      opacity:0.4;font-family:Kanit;text-align:center"></div>
    <div id="keepAlivePulse" style="margin-top:16px; width:6px; height:6px; background:#0f0; border-radius:50%; opacity:0.8; animation: pulse 2s infinite"></div>
    <div id="iosAudioHint" style="font-size:10px; color:#444; margin-top:20px; font-family:Kanit">หากปัด Control Center แล้วไม่เห็นชื่อแอป ให้กดที่นี่หนึ่งครั้ง</div>
    <div style="margin-top:12px;">
       <button onclick="state.keepAliveAudio.play()" style="background:none; border:1px solid #333; color:#555; padding:4px 12px; border-radius:12px; font-size:11px; font-family:Kanit">🔔 ทดสอบระบบเสียง</button>
    </div>
    <div id="sleepControls" style="position:fixed;bottom:40px;right:24px;
      opacity:0;transition:opacity 0.3s">
      <button onclick="exitSleepMode()" style="background:rgba(255,255,255,0.1);
        color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.2);
        padding:10px 20px;border-radius:20px;font-family:Kanit;font-size:13px;
        cursor:pointer">ออกจากโหมดนอน</button>
    </div>
  `;

  screen.addEventListener('click', () => {
    // ทุกครั้งที่กดหน้าจอ ให้ช่วย Re-sync เสียงเผื่อ iOS หลุด
    if (state.keepAliveAudio && state.keepAliveAudio.paused) {
      state.keepAliveAudio.play().catch(() => { });
    }
    const ctrl = document.getElementById('sleepControls');
    if (ctrl) {
      ctrl.style.opacity = '1';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { if (ctrl) ctrl.style.opacity = '0'; }, 3000);
    }
  });

  document.body.appendChild(screen);
  updateSleepClock();

  // ในโหมดนอน ถ้ามีนาฬิกาปลุก ให้ส่งไป Shortcuts ทันที (Native Alarms)
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    const enabled = state.alarms.filter(a => a.enabled && !a.isSnooze);
    if (enabled.length > 0) {
      // ส่งไป Shortcuts ทันทีโดยไม่รอถาม เพื่อความรวดเร็วตามความต้องการผู้ใช้
      setTimeout(() => {
        sendAlarmsToShortcuts(true); // true = auto-trigger URL
      }, 800);
    }
  }

  try {
    state.wakeLock = await navigator.wakeLock.request('screen');
  } catch (e) { console.warn('Wake Lock not supported'); }
}

function updateSleepClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');

  const clockEl = document.getElementById('sleepClock');
  if (clockEl) clockEl.textContent = `${h}:${m}:${s}`;

  const dateEl = document.getElementById('sleepDate');
  if (dateEl) {
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
    dateEl.textContent = `${days[now.getDay()]} ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear() + 543}`;
  }

  const nextAlarmEl = document.getElementById('sleepNextAlarm');
  if (nextAlarmEl) {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const enabled = state.alarms.filter(a => a.enabled).sort((a, b) => a.time.localeCompare(b.time));
    const next = enabled.find(a => {
      const [ah, am] = a.time.split(':').map(Number);
      return ah * 60 + am > nowMin;
    }) || enabled[0];

    if (next) {
      const [ah, am] = next.time.split(':').map(Number);
      let diff = ah * 60 + am - nowMin;
      if (diff < 0) diff += 24 * 60;
      const dh = Math.floor(diff / 60), dm = diff % 60;
      nextAlarmEl.textContent = `⏰ ปลุก ${next.time} น. — อีก ${dh > 0 ? dh + 'ชม.' : ''}${dm}นาที`;
    } else {
      nextAlarmEl.textContent = 'ไม่มีนาฬิกาปลุกที่เปิดอยู่';
    }
  }
}

function checkAlarms() {
  if (state.alarmRinging) return;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayMap[now.getDay()];

  state.alarms.forEach(alarm => {
    if (!alarm.enabled || alarm.time !== timeStr) return;
    if (alarm.repeat.length > 0 && !alarm.repeat.includes(today)) return;
    const lastRing = localStorage.getItem('alarm_rang_' + alarm.id);
    if (lastRing === timeStr) return;

    triggerAlarm(alarm);
    localStorage.setItem('alarm_rang_' + alarm.id, timeStr);

    if (alarm.repeat.length === 0 && !alarm.isSnooze) {
      alarm.enabled = false;
      localStorage.setItem('alarms', JSON.stringify(state.alarms));
    }
    if (alarm.isSnooze) {
      state.alarms = state.alarms.filter(a => a.id !== alarm.id);
      localStorage.setItem('alarms', JSON.stringify(state.alarms));
    }
  });
}

function triggerAlarm(alarm) {
  state.alarmRinging = true;
  state.currentAlarmId = alarm.id;

  // หากอยู่ในโหมดนอน ให้ใช้ keepAliveAudio เล่นเสียงปลุกแทนเพื่อความชัวร์บน iOS
  if (state.sleepMode && state.keepAliveAudio) {
    // เปลี่ยนจาก .ogg เป็น .mp3 (iOS รองรับ)
    state.keepAliveAudio.src = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.mp3';
    state.keepAliveAudio.volume = 1.0;
    state.keepAliveAudio.play().catch(() => { });
  }

  async function playAlarmSound() {
    try {
      if (!state.alarmAudioCtx) {
        state.alarmAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = state.alarmAudioCtx;
      if (ctx.state === 'suspended') await ctx.resume();

      function beep(freq, startTime, duration, vol = 0.3) {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc2.type = 'sine';
        osc.frequency.value = freq; osc2.frequency.value = freq * 2;
        osc.connect(gain); osc2.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime); osc2.start(startTime);
        osc.stop(startTime + duration); osc2.stop(startTime + duration);
      }

      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const base = now + i * 1.5;
        const v = Math.min(0.2 + i * 0.1, 0.6);
        beep(880, base, 0.2, v);
        beep(880, base + 0.25, 0.2, v);
      }
    } catch (e) { console.warn('Audio error:', e); }
  }

  playAlarmSound();
  state.alarmSoundInterval = setInterval(playAlarmSound, 6000);

  if ('vibrate' in navigator) {
    navigator.vibrate([500, 150, 500, 150, 500, 150, 1000, 300, 1000]);
    state.alarmVibrateInterval = setInterval(() => {
      navigator.vibrate([500, 150, 500, 150, 1000]);
    }, 3500);
  }
  showAlarmOverlay(alarm);
}

function showAlarmOverlay(alarm) {
  let overlay = document.getElementById('alarmOverlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'alarmOverlay';
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:999999;
    background:linear-gradient(180deg,#0f0f1a 0%,#1a0f2e 100%);
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    font-family:Kanit; color:white;
    animation: alarmFadeIn 0.5s ease;
  `;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  overlay.innerHTML = `
    <div style="text-align:center;padding:0 24px">
      <div style="font-size:16px;opacity:0.5;margin-bottom:8px;font-family:JetBrains Mono">ALARM</div>
      <div style="font-size:80px;font-family:JetBrains Mono;font-weight:600;animation:alarmPulse 1s infinite;text-shadow:0 0 60px rgba(239,68,68,0.8)">${timeStr}</div>
      <div style="font-size:22px;margin-top:16px;font-weight:500">${alarm.label || 'นาฬิกาปลุก'}</div>
      <div style="margin-top:48px;display:flex;flex-direction:column;gap:16px;width:100%;max-width:280px">
        <button onclick="dismissAlarm()" style="padding:20px;font-size:18px;font-weight:700;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:24px;cursor:pointer;font-family:Kanit;box-shadow:0 8px 32px rgba(239,68,68,0.5);animation:alarmPulse 1s infinite">⛔ หยุดปลุก</button>
        <button onclick="snoozeAlarm(${alarm.snoozeMin || 5})" style="padding:16px;font-size:16px;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.2);border-radius:20px;cursor:pointer;font-family:Kanit">💤 เลื่อน ${alarm.snoozeMin || 5} นาที</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function dismissAlarm() {
  state.alarmRinging = false;
  clearInterval(state.alarmSoundInterval);
  clearInterval(state.alarmVibrateInterval);
  try { navigator.vibrate(0); } catch (e) { }
  try { state.alarmAudioCtx?.close(); } catch (e) { }
  state.alarmAudioCtx = null;
  document.getElementById('alarmOverlay')?.remove();
  showToast('✅ หยุดปลุกแล้ว');
}

async function snoozeAlarm(minutes) {
  dismissAlarm();
  const snoozeTime = new Date(Date.now() + minutes * 60000);
  const h = snoozeTime.getHours().toString().padStart(2, '0');
  const m = snoozeTime.getMinutes().toString().padStart(2, '0');
  await addAlarm(`${h}:${m}`, `💤 Snooze (${h}:${m})`, minutes, []);
  const snoozed = state.alarms.find(a => a.time === `${h}:${m}`);
  if (snoozed) { snoozed.isSnooze = true; localStorage.setItem('alarms', JSON.stringify(state.alarms)); }
  showToast(`💤 เลื่อนปลุก ${minutes} นาที (${h}:${m})`);
}

function exitSleepMode() {
  state.sleepMode = false;
  if (state.timerWorker) state.timerWorker.postMessage('stop');
  if (state.keepAliveAudio) { state.keepAliveAudio.pause(); }
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';

  clearInterval(state.sleepClockInterval);
  if (state.keepAliveOsc) {
    try { state.keepAliveOsc.stop(); state.keepAliveOsc.disconnect(); } catch (e) { }
    state.keepAliveOsc = null;
  }
  const v = document.getElementById('iosWakeLockVideo');
  if (v) { v.pause(); v.remove(); }

  try { state.wakeLock?.release(); } catch (e) { }
  state.wakeLock = null;
  document.getElementById('sleepModeScreen')?.remove();
  render();
}

function sendAlarmsToShortcuts(autoTrigger = false) {
  const enabled = state.alarms.filter(a => a.enabled && !a.isSnooze);
  if (enabled.length === 0) {
    if (!autoTrigger) showToast('⚠️ ไม่มีนาฬิกาปลุกที่เปิดอยู่', 'warn');
    return;
  }

  // ส่งข้อมูลเป็น JSON แบบมี Key ครอบเพื่อให้ Shortcut จัดการได้ง่ายขึ้น
  const payload = JSON.stringify({
    alarms: enabled.map((a, idx) => ({
      time: a.time,
      label: `ปลุกครั้งที่ ${idx + 1} (${a.label || 'NITIPAT'})`
    }))
  });

  const url = `shortcuts://run-shortcut?name=NITIPAT_ALARM&input=${encodeURIComponent(payload)}`;

  if (autoTrigger) {
    window.location.href = url;
    return;
  }

  openModal('🍎 ซิงก์นาฬิกาปลุกไป iPhone', `
    <div style="display:flex;flex-direction:column;gap:12px;font-size:14px;font-family:Kanit">
      <div style="background:var(--bg-solid);padding:12px;border-radius:12px;border:1px solid var(--border-color)">
        <div style="font-weight:600;margin-bottom:8px">เตรียมซิงก์ ${enabled.length} รายการ:</div>
        ${enabled.map(a => `<div style="font-size:13px; opacity:0.8">⏰ ${a.time} — ${a.label}</div>`).join('')}
      </div>
      <div style="color:var(--accent);font-size:12px; font-weight:500">
        💡 ระบบจะลบนาฬิกาปลุก (NITIPAT) อันเก่าในเครื่องคุณออกก่อน และสร้างอันใหม่ให้ตามรายการนี้ครับ
      </div>
    </div>
  `, `
    <button onclick="window.location.href='${url}'; closeModal();" class="nb-btn nb-btn-primary full">🚀 เริ่มส่งข้อมูล</button>
  `);
}


// Expose Alarm & Notification functions to window for HTML onclick handlers
window.quickAddAlarms = quickAddAlarms;
window.openQuickAddModal = openQuickAddModal;
window.toggleAlarm = toggleAlarm;
window.deleteAlarm = deleteAlarm;
window.openAddAlarmModal = openAddAlarmModal;
window.enterSleepMode = enterSleepMode;
window.sendAlarmsToShortcuts = sendAlarmsToShortcuts;
window.quickAddFromModal = quickAddFromModal;
window.addAlarmFromModal = addAlarmFromModal;
window.dismissAlarm = dismissAlarm;
window.snoozeAlarm = snoozeAlarm;
window.exitSleepMode = exitSleepMode;
window.hideCheckinBanner = hideCheckinBanner;

window.handleIdCardUpload = (input) => {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (re) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        state.idCardPhoto = compressedBase64;
        localStorage.setItem('id_card_photo', state.idCardPhoto);

        // Optimistically set in Firestore
        fsSet('app_settings', 'profile', {
          idCardPhoto: state.idCardPhoto,
          studentPhoto: STUDENT.photoUrl
        }).then(() => {
          showToast('✅ อัปโหลดและซิงก์รูปบัตรแล้ว');
          render();
        }).catch(err => {
          console.error("Profile sync failed:", err);
          showToast('⚠️ อัปโหลดแล้ว แต่ซิงก์คลาวด์ขัดข้อง', 'err');
          render();
        });
      };
      img.src = re.target.result;
    };
    reader.readAsDataURL(file);
  }
};

window.removeIdCard = () => {
  if (confirm('ลบรูปบัตรใช่หรือไม่?')) {
    state.idCardPhoto = null;
    localStorage.removeItem('id_card_photo');
    fsSet('app_settings', 'profile', {
      idCardPhoto: null,
      studentPhoto: STUDENT.photoUrl
    }).then(() => {
      showToast('✅ ลบรูปบัตรและซิงก์คลาวด์แล้ว');
      render();
    }).catch(err => {
      console.error("Profile sync failed:", err);
      render();
    });
  }
};

/**
 * ════════════════════════════════════════════════════════════
 * NOTION INTEGRATION HUB
 * ════════════════════════════════════════════════════════════
 */
const NotionHub = {
  async checkConnection() {
    showToast('⏳ กำลังตรวจสอบ Notion...');
    try {
      const res = await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).checkNotionConnection());
      if (res.success) {
        state.notionConnected = true;
        state.notionBotName = res.botName;
        localStorage.setItem('notion_bot_name', res.botName);
        showToast(`✅ เชื่อมต่อ Notion สำเร็จ: ${res.botName}`);
      } else {
        state.notionConnected = false;
        showToast(`❌ เชื่อมต่อล้มเหลว: ${res.error}`, 'err');
      }
      render();
    } catch (e) {
      console.error(e);
      showToast('❌ เกิดข้อผิดพลาดในการเรียก API', 'err');
    }
  },

  async sync(manual = false) {
    if (state.notionSyncing) return;
    state.notionSyncing = true;
    if (manual) showToast('🔄 เริ่มการซิงก์ข้อมูลกับ Notion...');
    render();

    try {
      // 0. Automatically clean up and deduplicate Semesters in Notion first!
      try {
        await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).cleanupDuplicateSemesters());
      } catch (err) {
        console.error("Error deduplicating semesters:", err);
      }

      // 1. Sync Courses (Subjects) in one batch
      const courses = Object.values(state.courses).flat();
      const coursesToSync = courses.filter(c => !c.notionPageId || !c.notionUrl || manual).map(course => {
        const sem = state.semesters.find(s => String(s.id) === String(course.semId));
        return {
          ...course,
          semesterName: sem ? sem.name : 'Unknown Semester'
        };
      });

      if (coursesToSync.length > 0) {
        try {
          const res = await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).syncCoursesToNotionBatch(coursesToSync));
          if (res && res.success && res.results) {
            for (const item of res.results) {
              if (item.success) {
                const localCourse = courses.find(c => c.id === item.id);
                if (localCourse) {
                  localCourse.notionPageId = item.pageId;
                  localCourse.notionUrl = item.url;
                  await fsUpd('courses', localCourse.id, { notionPageId: item.pageId, notionUrl: item.url });
                }
              } else {
                console.error(`Failed to batch sync course ${item.id}:`, item.error);
              }
            }
          }
        } catch (err) {
          console.error("Error in course batch sync:", err);
        }
      }

      // 2. Sync Assignments in one batch
      const assignments = Object.values(state.assignments).flat();
      const assignmentsToSync = assignments.filter(assign => !assign.notionPageId || (assign.updatedAt && assign.updatedAt > state.lastNotionSync)).map(assign => {
        const course = Object.values(state.courses).flat().find(c => String(c.id) === String(assign.courseId));
        return {
          ...assign,
          courseNotionPageId: course ? course.notionPageId : null
        };
      });
      
      if (assignmentsToSync.length > 0) {
        try {
          const res = await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).syncAssignmentsToNotionBatch(assignmentsToSync));
          if (res && res.success && res.results) {
            for (const item of res.results) {
              if (item.success) {
                const localAssign = assignments.find(a => a.id === item.id);
                if (localAssign) {
                  localAssign.notionPageId = item.pageId;
                  await fsUpd('assignments', localAssign.id, { notionPageId: item.pageId });
                }
              } else {
                console.error(`Failed to batch sync assignment ${item.id}:`, item.error);
              }
            }
          }
        } catch (err) {
          console.error("Error in assignment batch sync:", err);
        }
      }

      // 3. Sync Notebooks (Notion -> Google Drive)
      try {
        await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).syncNotebooksWithNotion());
      } catch (err) {
        console.error("Error syncing notebooks with Notion:", err);
      }

      // 4. Pull Updates from Notion (Assignments Database)
      try {
        const lastSync = manual ? null : state.lastNotionSync; // If manual sync, pull all updates!
        const updates = await new Promise((res, rej) => {
          google.script.run
            .withSuccessHandler(res)
            .withFailureHandler(rej)
            .fetchNotionUpdates(lastSync);
        });
        
        if (updates && updates.length > 0) {
          let pullCount = 0;
          for (const item of updates) {
            let assign = null;
            if (item.appId) {
              assign = Object.values(state.assignments).flat().find(a => a.id === item.appId);
            }
            if (!assign) {
              assign = Object.values(state.assignments).flat().find(a => a.notionPageId === item.notionPageId);
            }
            
            if (assign) {
              let changed = false;
              if (item.status && item.status !== (assign.submitted ? 'Done' : assign.status)) {
                assign.submitted = (item.status === 'Done');
                if (item.status !== 'Done') assign.status = item.status;
                changed = true;
              }
              if (item.title && item.title !== assign.title) {
                assign.title = item.title;
                changed = true;
              }
              if (item.deadline && item.deadline !== assign.dueDate) {
                assign.dueDate = item.deadline;
                changed = true;
              }
              
              if (changed) {
                await fsUpd('assignments', assign.id, {
                  submitted: assign.submitted,
                  status: assign.status || 'In Progress',
                  title: assign.title,
                  dueDate: assign.dueDate
                });
                pullCount++;
              }
            }
          }
          if (pullCount > 0 && manual) {
            showToast(`📥 ดึงข้อมูลอัปเดต ${pullCount} รายการจาก Notion เรียบร้อย!`);
          }
        }
      } catch (err) {
        console.error("Error pulling updates from Notion:", err);
      }

      state.lastNotionSync = new Date().toISOString();
      localStorage.setItem('last_notion_sync', state.lastNotionSync);
      state.notionConnected = true;
      
      if (manual) showToast('✅ ซิงก์ Notion สำเร็จ!');
    } catch (e) {
      console.error("Notion Sync Error:", e);
      if (manual) showToast('❌ การซิงก์ล้มเหลว', 'err');
    } finally {
      state.notionSyncing = false;
      render();
    }
  },

  async runSetupWizard() {
    const token = document.getElementById('notionTokenInput')?.value.trim();
    if (!token) return showToast('⚠️ กรุณาใส่ Token', 'err');
    
    showToast('⏳ กำลังเนรมิตฐานข้อมูล Notion...');
    try {
      const res = await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).initializeNotionWorkspace(token));
      if (res.success) {
        showToast(`✨ ${res.message}`);
        state.notionConnected = true;
        this.sync(true); // Run initial sync
      } else {
        showToast(`❌ ${res.error}`, 'err');
      }
    } catch (e) {
      showToast('❌ การตั้งค่าล้มเหลว', 'err');
    }
  },

  async setupTrigger() {
    try {
      const res = await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).setupNotionTrigger());
      if (res.success) showToast(`✅ ${res.message}`);
    } catch (e) {
      showToast('❌ ไม่สามารถเปิด Auto-Sync ได้', 'err');
    }
  },

  async pushReflection(courseId, text) {
    const course = findCourseById(courseId);
    if (!course || !course.notionPageId) return;
    
    try {
      await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).syncReflectionToNotion(course.notionPageId, text));
      showToast('📤 ส่ง Reflection ไปยัง Notion แล้ว');
    } catch (e) {
      console.error("Reflection sync failed", e);
    }
  },

  async forceResetSync() {
    if (!confirm("⚠️ คำเตือน: ระบบจะล้างรหัสประวัติการซิงก์วิชาและการบ้านเดิมทั้งหมดในฐานข้อมูล Firestore เพื่อบังคับให้วิชาเรียนและการบ้านทั้งหมดในแอปถูกส่งขึ้นไปสร้างใหม่ในฐานข้อมูล Notion ชุดใหม่โดยสมบูรณ์\n\nการกระทำนี้จะช่วยแก้ปัญหากรณีฐานข้อมูลบน Notion โดนสร้างใหม่แล้วแอปยังจำค่า ID เก่า\n\nคุณต้องการบังคับซิงก์ใหม่ทั้งหมดตอนนี้หรือไม่?")) {
      return;
    }
    
    showToast("⏳ กำลังเตรียมการล้างประวัติการซิงก์เดิม...");
    try {
      const courses = Object.values(state.courses).flat();
      for (const course of courses) {
        course.notionPageId = null;
        course.notionUrl = null;
        await fsUpd('courses', course.id, { notionPageId: null, notionUrl: null });
      }
      
      const assignments = Object.values(state.assignments).flat();
      for (const assign of assignments) {
        assign.notionPageId = null;
        await fsUpd('assignments', assign.id, { notionPageId: null });
      }
      
      const exams = Object.values(state.exams).flat();
      for (const exam of exams) {
        exam.notionPageId = null;
        await fsUpd('exams', exam.id, { notionPageId: null });
      }
      
      state.lastNotionSync = null;
      localStorage.removeItem('last_notion_sync');
      
      showToast("🔄 ล้างค่าเชื่อมโยงเดิมสำเร็จ! กำลังอัปโหลดวิชาเรียนและการบ้านชุดใหม่ทั้งหมดขึ้น Notion...");
      await this.sync(true);
    } catch (e) {
      console.error("Force Re-Sync Error:", e);
      showToast("❌ การบังคับซิงก์ใหม่ล้มเหลว", "err");
    }
  }
};

window.NotionHub = NotionHub;
