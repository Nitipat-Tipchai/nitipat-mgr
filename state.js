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
      
      // Inject Custom Roadmap Courses so they appear in Trial Registration
      try {
        const customCourses = JSON.parse(localStorage.getItem('nitipat_custom_roadmap') || '[]');
        customCourses.forEach(cc => {
          let cat = 'elective';
          if (cc.category === 'ศึกษาทั่วไป') cat = 'general';
          else if (cc.category === 'วิทยาศาสตร์') cat = 'science';
          else if (cc.category === 'วิศวกรรม') cat = 'engineering_basic';
          
          if (COURSE_DB[cat] && !COURSE_DB[cat].find(c => c.code === cc.code)) {
            COURSE_DB[cat].push({ code: cc.code, name: cc.name, credits: cc.cr, group: cc.category, isCustom: true });
          }
        });
      } catch(e) {}

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
var state = {
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
  moneyWallets: JSON.parse(localStorage.getItem('moneyWallets') || '[{"id":"cash","name":"เงินสด 💵","type":"cash","balance":0},{"id":"bank","name":"บัญชีธนาคาร 🏦","type":"bank","balance":0},{"id":"savings","name":"กระปุกออมเงิน 🐷","type":"savings","balance":0},{"id":"spaylater","name":"SPayLater 🛍️","type":"debt","balance":0,"limit":15000},{"id":"seasycash","name":"SEasyCash 💸","type":"debt","balance":0,"limit":20000}]'),
  moneyTransactions: JSON.parse(localStorage.getItem('moneyTransactions') || '[]'),
  moneyBudgets: JSON.parse(localStorage.getItem('moneyBudgets') || '{"food":0,"shopping":0,"travel":0}'),
  moneyGoals: JSON.parse(localStorage.getItem('moneyGoals') || '[]'),
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
  notebooks: JSON.parse(localStorage.getItem('notebooks') || '{}'),
  calendarSettings: JSON.parse(localStorage.getItem('calendar_settings') || '{}'),
  courseStructures: JSON.parse(localStorage.getItem('course_structures') || '{}'),
  targetGPA: parseFloat(localStorage.getItem('target_gpax') || '2.00'),
  isReflectionMandatory: true,
  lastReflectionCheck: null,
  driveBreadcrumbs: [],
  courseFiles: {},
  courseFilesCache: {},
  virtualFiles: JSON.parse(localStorage.getItem('virtual_files') || '{}'),
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
  notificationsGranted: (typeof Notification !== 'undefined') && Notification.permission === 'granted',
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
  idCardPhoto: localStorage.getItem('id_card_photo') || null,
  
  // ILM State
  ilmCompanies: JSON.parse(localStorage.getItem('ilm_companies') || '[]'),
  ilmProfile: JSON.parse(localStorage.getItem('ilm_profile') || '{}'),
  ilmLogs: JSON.parse(localStorage.getItem('ilm_logs') || '[]'),
  ilmFiles: JSON.parse(localStorage.getItem('ilm_files') || '[]'),
  ilmCurrentFolderId: 'root',
  ilmSelectedFileId: null
};

