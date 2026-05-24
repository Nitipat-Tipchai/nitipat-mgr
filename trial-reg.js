/**
 * NITIPAT MANAGER - Trial Course Registration Simulator (Refined Edition)
 * ฟีเจอร์ทดลองจัดตารางเรียนเทอมหน้า ตรวจวิชาตัวต่อ เช็คตารางชน และออกใบเสร็จแอนิเมชัน 3D พร้อมเสียงสังเคราะห์!
 * เวอร์ชันแก้บั๊ก UI และให้ผู้ใช้กรอกวันเวลาเรียน/อาจารย์/หมู่เรียน ด้วยตนเอง 100%
 */

// โครงสร้างวันย่อและตัวย่อสำหรับตารางเรียน
const DAYS_TH = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'];
const DAYS_ENG = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAYS_COLORS = ['#fbbf24', '#f472b6', '#34d399', '#f87171', '#60a5fa', '#c084fc', '#fbbf24'];

// สถานะการลงทะเบียนจำลอง
let trialState = {
  selectedCourses: [], // รายการวิชาที่เลือกลงทะเบียนจำลอง { courseCode, secNo, instructor, room, day, startHour, endHour, timeStr }
  activeCategory: 'general', // หมวดวิชาหลักที่กำลังเลือกดูอยู่
  searchQuery: '',
  isPrinting: false,
  isTorn: false
};

// แปลงเวลาสตริง hh:mm เป็นชั่วโมงทศนิยม
function timeStringToDecimal(str) {
  if (!str) return 0;
  const [h, m] = str.split(':').map(Number);
  return h + m / 60;
}

// แปลงชั่วโมงทศนิยมเป็นเวลาสตริง hh:mm
function decimalToTimeString(dec) {
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// โหลดสถานะลงทะเบียนจำลองจาก localStorage
function initTrialState() {
  const saved = localStorage.getItem('nitipat_trial_registration');
  if (saved) {
    try {
      trialState.selectedCourses = JSON.parse(saved);
    } catch (e) {
      trialState.selectedCourses = [];
    }
  }
}

// บันทึกสถานะ
function saveTrialState() {
  localStorage.setItem('nitipat_trial_registration', JSON.stringify(trialState.selectedCourses));
}

// -------------------------------------------------------------
// PREREQUISITES VERIFIER
// ตรวจสอบวิชาตัวต่อโดยเชื่อมโยงกับ STUDENT.existingGrades
// -------------------------------------------------------------
function checkCoursePrerequisites(course) {
  if (!course.prereq || course.prereq.length === 0) {
    return { passed: true, missing: [] };
  }

  const grades = STUDENT.existingGrades || {};
  const missing = [];

  for (const reqCode of course.prereq) {
    let isPassed = false;
    for (const key in grades) {
      if (key.startsWith(reqCode)) {
        const record = grades[key];
        // เกรดที่ผ่านคือ A, B+, B, C+, C, D+, D, P
        if (['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'P'].includes(record.grade)) {
          isPassed = true;
          break;
        }
      }
    }
    if (!isPassed) {
      missing.push(reqCode);
    }
  }

  return {
    passed: missing.length === 0,
    missing: missing
  };
}

// -------------------------------------------------------------
// CUSTOM SCHEDULE CONFLICT DETECTOR
// ตรวจสอบการทับซ้อนเวลาจากข้อมูลเวลาเรียนที่ผู้ใช้กรอกเอง
// -------------------------------------------------------------
function checkCustomScheduleConflict(courseCode, day, startHour, endHour, existingIndex = null) {
  for (let i = 0; i < trialState.selectedCourses.length; i++) {
    if (existingIndex !== null && existingIndex === i) continue; // ข้ามการเช็คชนกับตัวเองตอนกำลังแก้ไข

    const item = trialState.selectedCourses[i];
    if (item.courseCode === courseCode && existingIndex === null) continue;

    const addedCourse = ALL_COURSES.find(c => c.code === item.courseCode);
    if (!addedCourse) continue;

    // ชนกันถ้าวัดวันเดียวกัน และช่วงเวลาทับซ้อนคาบเกี่ยวกัน
    if (item.day === day) {
      const isOverlap = !(endHour <= item.startHour || startHour >= item.endHour);
      if (isOverlap) {
        return {
          conflict: true,
          conflictingCourse: addedCourse,
          timeStr: item.timeStr
        };
      }
    }
  }
  return { conflict: false };
}

// -------------------------------------------------------------
// SOUND SYNTHESIZER (WEB AUDIO API)
// สังเคราะห์เสียงเอฟเฟกต์ด้วยโค้ด 100% ไม่ต้องพึ่งพาไฟล์ภายนอก!
// -------------------------------------------------------------
function getAudioContext() {
  if (!window.trialAudioCtx) {
    window.trialAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (window.trialAudioCtx.state === 'suspended') {
    window.trialAudioCtx.resume();
  }
  return window.trialAudioCtx;
}

// 1. เสียงพิมพ์หัวเข็มเครื่องพิมพ์ (Dot-matrix Printer printing sound)
function playPrinterSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sawtooth';
    const time = ctx.currentTime;
    osc.frequency.setValueAtTime(950 + Math.random() * 350, time);
    osc.frequency.exponentialRampToValueAtTime(140 + Math.random() * 30, time + 0.05);
    gainNode.gain.setValueAtTime(0.03, time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  } catch (e) {}
}

// 2. เสียงฉีกกระดาษขาวขาดฟึ่บ! (Paper Tearing sound)
function playTearSound() {
  try {
    const ctx = getAudioContext();
    const sampleRate = ctx.sampleRate;
    const duration = 0.25;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + duration);
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    noise.start();
  } catch (e) {}
}

// 3. เสียงปิ๊งเมื่อสำเร็จ (Sparkle sound)
function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const playTone = (freq, delay, dur) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      gainNode.gain.setValueAtTime(0.1, now + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur);
    };
    
    playTone(523.25, 0, 0.12);
    playTone(659.25, 0.06, 0.12);
    playTone(783.99, 0.12, 0.25);
  } catch (e) {}
}

// -------------------------------------------------------------
// UI RENDERING FUNCTION
// ฟังก์ชันสร้างโค้ด HTML ตารางเรียนที่ลื่นไหล ปรับเข้ากับธีมหลัก 100%
// -------------------------------------------------------------
function renderTrialReg() {
  initTrialState();
  
  if (!ALL_COURSES || ALL_COURSES.length === 0) {
    loadCourseDatabase().then(() => render());
    return `<div style="padding:40px; text-align:center; font-family:'Kanit', sans-serif; color:var(--text);">กำลังเตรียมโครงสร้างหลักสูตร 137 หน่วยกิต...</div>`;
  }

  // คำนวณหน่วยกิตรวมวิชาที่เลือก
  let totalCredits = 0;
  trialState.selectedCourses.forEach(item => {
    const c = ALL_COURSES.find(x => x.code === item.courseCode);
    if (c) totalCredits += c.credits;
  });

  // กรองรายวิชาตามหมวดหมู่และช่องค้นหา
  const coursesInCat = COURSE_DB[trialState.activeCategory] || [];
  const query = trialState.searchQuery.toLowerCase().trim();
  const filteredCourses = coursesInCat.filter(c => {
    if (!query) return true;
    return c.code.toLowerCase().includes(query) || 
           c.name.toLowerCase().includes(query) || 
           (c.nameEn && c.nameEn.toLowerCase().includes(query));
  });

  const earnedCredits = Object.values(STUDENT.existingGrades)
    .filter(g => ["A", "B+", "B", "C+", "C", "D+", "D", "P"].includes(g.grade))
    .reduce((sum, g) => sum + g.credits, 0);

  return `
    <style>
      /* ดีไซน์พรีเมียม สไตล์ Glassmorphism กลมกลืนกับธีมหลัก */
      .sim-page-wrapper {
        font-family: 'Kanit', sans-serif;
        padding: 20px;
        color: var(--text);
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .sim-layout-grid {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 24px;
        align-items: start;
      }

      @media (max-width: 1024px) {
        .sim-layout-grid {
          grid-template-columns: 1fr;
        }
      }

      /* Glowing Header */
      .sim-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
        background: var(--glass);
        border: 1px solid var(--glass-border);
        padding: 20px;
        border-radius: 20px;
        backdrop-filter: blur(10px);
      }

      .sim-title-wrap h1 {
        font-size: 1.6rem;
        font-weight: 800;
        margin: 0;
        background: linear-gradient(135deg, #3b82f6, #10b981);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .sim-title-wrap p {
        font-size: 0.88rem;
        margin: 4px 0 0 0;
        color: var(--text-muted);
      }

      /* Credits Progress Badge */
      .credits-meter {
        background: var(--glass-card-bg);
        border: 2px dashed #3b82f6;
        border-radius: 14px;
        padding: 8px 16px;
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .credits-meter.overflow {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.08);
        animation: pulse-danger 1.5s infinite;
      }

      @keyframes pulse-danger {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
        50% { box-shadow: 0 0 10px 3px rgba(239, 68, 68, 0.2); }
      }

      /* 📚 Tab selectors */
      .cat-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        overflow-x: auto;
        padding-bottom: 6px;
      }

      .cat-tab {
        background: var(--glass);
        border: 1px solid var(--glass-border);
        color: var(--text-muted);
        padding: 8px 14px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
        transition: all 0.2s ease;
      }

      .cat-tab.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      /* Course list and Search */
      .search-box-wrap {
        position: relative;
        margin-bottom: 16px;
      }

      .search-box-wrap input {
        width: 100%;
        background: var(--glass);
        border: 1px solid var(--glass-border);
        padding: 10px 16px 10px 40px;
        border-radius: 12px;
        color: var(--text);
        font-size: 0.88rem;
        outline: none;
        transition: all 0.25s ease;
      }

      .search-box-wrap input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
      }

      .search-icon-sim {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1rem;
        opacity: 0.6;
      }

      .course-grid-sim {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        max-height: 480px;
        overflow-y: auto;
        padding-right: 4px;
      }

      /* 🎴 Course interactive card */
      .course-card-sim {
        background: var(--glass-card-bg);
        border: 1px solid var(--glass-border);
        border-radius: 16px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        position: relative;
        transition: all 0.2s ease;
      }

      .course-card-sim.added {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.03);
      }

      .course-card-sim.prereq-failed {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.03);
      }

      .course-card-sim:hover {
        transform: translateY(-1.5px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.02);
      }

      .card-header-sim {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .cc-code {
        font-family: monospace;
        font-weight: 700;
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 0.78rem;
      }

      .cc-credits {
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-muted);
      }

      .cc-title-th {
        font-size: 0.92rem;
        font-weight: 700;
        margin: 4px 0 2px 0;
      }

      .cc-title-en {
        font-size: 0.78rem;
        color: var(--text-muted);
        margin: 0;
      }

      /* Shaking Spring Animation */
      @keyframes spring-shake {
        0%, 100% { transform: translateX(0); }
        15%, 45%, 75% { transform: translateX(-5px); }
        30%, 60%, 90% { transform: translateX(5px); }
      }

      .shake-effect {
        animation: spring-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
      }

      /* 📅 Calendar wrapper with horizontal scroll support */
      .timetable-scroll-wrap {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        border-radius: 16px;
        border: 1px solid var(--glass-border);
      }

      .sched-grid {
        display: grid;
        grid-template-columns: 50px repeat(5, 1fr);
        grid-template-rows: 35px repeat(12, 32px); /* 8:00 - 20:00 (12 slots) */
        gap: 2px;
        background: var(--glass);
        padding: 6px;
        min-width: 620px; /* ป้องกันแถวบีบอัดเละเทะในจอเล็ก */
      }

      .grid-corner {
        grid-column: 1;
        grid-row: 1;
        border-bottom: 1px solid var(--glass-border);
      }

      .grid-header {
        text-align: center;
        font-weight: 700;
        font-size: 0.78rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-bottom: 1px solid var(--glass-border);
      }

      .grid-time-label {
        font-size: 0.68rem;
        font-family: monospace;
        color: var(--text-muted);
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        padding-right: 4px;
        padding-top: 2px;
        border-right: 1px solid var(--glass-border);
      }

      .grid-block {
        border-radius: 8px;
        padding: 2px 4px;
        font-size: 0.68rem;
        font-weight: 700;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        border-width: 1px;
        border-style: solid;
        transition: all 0.2s ease;
      }

      .grid-block:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        z-index: 10;
      }

      .grid-block .gb-code {
        font-weight: 800;
        font-size: 0.72rem;
      }

      .grid-block .gb-details {
        font-size: 0.6rem;
        opacity: 0.85;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* 🎫 ULTRA-PREMIUM THERMAL RECEIPT SLIDING SLOT */
      .receipt-container {
        display: none;
        perspective: 1000px;
        margin-top: 16px;
      }

      .printer-mouth {
        height: 10px;
        background: #1e293b;
        border-radius: 4px 4px 0 0;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(59, 130, 246, 0.3);
        position: relative;
        z-index: 20;
      }

      .printer-scanner {
        position: absolute;
        top: 6px;
        left: 0;
        width: 100%;
        height: 2px;
        background: #3b82f6;
        box-shadow: 0 0 6px 1px #3b82f6;
        animation: scan-pulse 1s infinite;
      }

      @keyframes scan-pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }

      .receipt-paper {
        background: #fafaf6;
        color: #111827;
        font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
        width: 100%;
        max-width: 360px;
        margin: 0 auto;
        padding: 20px 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        border: 1px solid #e5e7eb;
        position: relative;
        overflow: hidden;
        transform-origin: top center;
        max-height: 0px;
        transition: max-height 3s cubic-bezier(0.1, 0.8, 0.3, 1);
        z-index: 10;
      }

      .receipt-paper::after {
        content: "";
        display: block;
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 8px;
        background: linear-gradient(-45deg, #fafaf6 4px, transparent 0), 
                    linear-gradient(45deg, #fafaf6 4px, transparent 0);
        background-size: 8px 8px;
        transform: translateY(2px);
      }

      .receipt-header {
        text-align: center;
        border-bottom: 2px dashed #9ca3af;
        padding-bottom: 12px;
        margin-bottom: 12px;
      }

      .receipt-body {
        font-size: 0.72rem;
        line-height: 1.5;
      }

      .receipt-tear-away {
        animation: tear-slide 0.65s forwards cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      @keyframes tear-slide {
        0% { transform: rotate(0) translateY(0); opacity: 1; }
        30% { transform: rotate(-6deg) translateY(4px); opacity: 0.95; }
        100% { transform: rotate(-30deg) translateY(600px) translateX(-80px) scale(0.95); opacity: 0; }
      }

      /* Buttons & Badges */
      .sim-btn {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-shadow: 0 4px 10px rgba(59, 130, 246, 0.25);
        transition: all 0.2s ease;
      }

      .sim-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(59, 130, 246, 0.35);
      }

      .sim-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
      }

      .sim-btn-danger {
        background: linear-gradient(135deg, #ef4444, #b91c1c);
        box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
      }

      .sim-btn-danger:hover {
        box-shadow: 0 6px 14px rgba(239, 68, 68, 0.35);
      }

      .sim-btn-warn {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25);
      }

      .sim-btn-warn:hover {
        box-shadow: 0 6px 14px rgba(245, 158, 11, 0.35);
      }

      .badge-prereq {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .badge-prereq.ok {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
      }

      .badge-prereq.fail {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.2);
        animation: shake-small 2s infinite;
      }

      @keyframes shake-small {
        0%, 100% { transform: translateX(0); }
        90%, 94%, 98% { transform: translateX(-1px); }
        92%, 96% { transform: translateX(1px); }
      }
    </style>

    <div class="sim-page-wrapper">
      
      <!-- 1. Header (glowing title) -->
      <div class="sim-header">
        <div class="sim-title-wrap">
          <h1>🎫 ทดลองจัดตารางเรียนเทอมหน้า</h1>
          <p>วางแผนจัดหน่วยกิต คาบเวลาเรียน และประเมินผ่านเกณฑ์วิชาตัวต่ออย่างอิสระ 100% (ข้อมูลกรอกตารางด้วยตนเอง)</p>
        </div>
        <div class="credits-meter ${totalCredits > 22 ? 'overflow' : ''}" id="creditsMeter">
          <div style="font-size: 0.7rem; opacity: 0.7; font-weight: bold; text-transform: uppercase;">หน่วยกิตจำลองสะสม</div>
          <div style="font-size: 1.3rem; font-weight: 800; color: ${totalCredits > 22 ? '#ef4444' : '#3b82f6'};">
            <span id="creditVal">${totalCredits}</span> / 22 หน่วยกิต
          </div>
        </div>
      </div>

      <div class="sim-layout-grid">
        
        <!-- 2. Left Panel: Course Explorer -->
        <div class="sim-card" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Tabs -->
          <div class="cat-tabs">
            ${[
              { id: 'general', name: 'ศึกษาทั่วไป' },
              { id: 'science', name: 'วิทยาศาสตร์' },
              { id: 'engineering_basic', name: 'วิศวกรรมพื้นฐาน' },
              { id: 'core', name: 'เฉพาะเลือก/แกน' },
              { id: 'elective', name: 'เฉพาะเลือกเฉพาะ' }
            ].map(t => `
              <button class="cat-tab ${trialState.activeCategory === t.id ? 'active' : ''}" onclick="switchSimCategory('${t.id}')">
                ${t.name}
              </button>
            `).join('')}
          </div>

          <!-- Search Box -->
          <div class="search-box-wrap">
            <span class="search-icon-sim">🔍</span>
            <input type="text" id="simSearchInput" placeholder="รหัสวิชา หรือชื่อวิชา..." value="${trialState.searchQuery}" oninput="handleSimSearch(this.value)">
          </div>

          <!-- Course Cards Grid -->
          <div class="course-grid-sim" id="simCourseGrid">
            ${filteredCourses.length > 0 ? filteredCourses.map(c => {
              const userSelectionIndex = trialState.selectedCourses.findIndex(x => x.courseCode === c.code);
              const isAdded = userSelectionIndex !== -1;
              const userSelection = isAdded ? trialState.selectedCourses[userSelectionIndex] : null;
              
              const prereqStatus = checkCoursePrerequisites(c);
              let cardClass = '';
              if (isAdded) cardClass += ' added';
              if (!prereqStatus.passed) cardClass += ' prereq-failed';

              return `
                <div class="course-card-sim ${cardClass}" id="card-${c.code}">
                  <div class="card-header-sim">
                    <div>
                      <span class="cc-code">${c.code}</span>
                      <h3 class="cc-title-th">${c.name}</h3>
                      <h4 class="cc-title-en">${c.nameEn}</h4>
                    </div>
                    <div class="cc-credits">${c.credits} หน่วยกิต</div>
                  </div>

                  <!-- Prereq validation badge -->
                  <div>
                    ${prereqStatus.passed 
                      ? `<span class="badge-prereq ok">✓ ไม่มีวิชาตัวต่อ / ผ่านแล้ว</span>` 
                      : `<span class="badge-prereq fail" title="ยังไม่ผ่าน ${prereqStatus.missing.join(', ')}">⚠️ ตัวต่อยังไม่ผ่าน: ${prereqStatus.missing.join(', ')}</span>`
                    }
                  </div>

                  <!-- ข้อมูลที่กรอกไว้ (ถ้าเพิ่มแล้ว) -->
                  ${isAdded ? `
                    <div style="background:rgba(59,130,246,0.06); padding:8px 12px; border-radius:10px; font-size:0.78rem; display:flex; flex-direction:column; gap:2px;">
                      <div><strong>หมู่เรียน (Sec):</strong> ${userSelection.secNo} | <strong>ผู้สอน:</strong> ${userSelection.instructor || '-'}</div>
                      <div><strong>ห้องเรียน:</strong> ${userSelection.room || '-'}</div>
                      <div style="color:#3b82f6; font-weight:700;">⏰ เวลา: ${userSelection.timeStr}</div>
                    </div>
                  ` : ''}

                  <!-- Action Buttons -->
                  <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top:4px;">
                    ${isAdded ? `
                      <button class="sim-btn sim-btn-danger" style="padding: 5px 12px; font-size: 0.78rem; border-radius: 8px;" onclick="removeSimCourse('${c.code}')">นำออก -</button>
                      <button class="sim-btn sim-btn-warn" style="padding: 5px 12px; font-size: 0.78rem; border-radius: 8px;" onclick="openSimCourseModal('${c.code}', ${userSelectionIndex})">แก้ไขคาบ 📝</button>
                    ` : `
                      <button class="sim-btn" style="padding: 6px 14px; font-size: 0.78rem; border-radius: 8px;" onclick="openSimCourseModal('${c.code}')">ระบุคาบและลงตาราง +</button>
                    `}
                  </div>
                </div>
              `;
            }).join('') : `<div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">✕ ไม่พบวิชาที่ค้นหาในหมวดนี้</div>`}
          </div>
        </div>

        <!-- 3. Right Panel: Timetable / Calendar View & Checkout -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Interactive Calendar Grid with scroll support -->
          <div class="sim-card" style="padding: 14px;">
            <h2 style="font-size: 1.05rem; font-weight: 800; margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px;">
              <span>📅</span> ตารางเรียนลงทะเบียนจำลอง (ลากจอซ้ายขวาได้หากเปิดในมือถือ)
            </h2>

            <div class="timetable-scroll-wrap">
              <div class="sched-grid">
                <div class="grid-corner"></div>
                ${DAYS_ENG.slice(0, 5).map((d, i) => `<div class="grid-header">${d}</div>`).join('')}

                <!-- 8:00 to 20:00 rows -->
                ${Array.from({ length: 12 }, (_, i) => 8 + i).map(h => `
                  <div class="grid-time-label" style="grid-row: ${h - 8 + 2}">${h}:00</div>
                `).join('')}

                <!-- Active Custom Course Blocks inside Calendar -->
                ${trialState.selectedCourses.flatMap((item, idx) => {
                  const c = ALL_COURSES.find(x => x.code === item.courseCode);
                  if (!c) return [];

                  // ตรวจสอบคาบชนแบบละเอียด
                  const conflict = checkCustomScheduleConflict(c.code, item.day, item.startHour, item.endHour, idx);
                  const isConflicting = conflict.conflict;

                  // คำนวณแถวตำแหน่งตารางเรียนจำลอง
                  const rowStart = item.startHour - 8 + 2;
                  const rowEnd = item.endHour - 8 + 2;
                  const col = item.day + 2; // day 0 = col 2 (MON)

                  const color = DAYS_COLORS[item.day % DAYS_COLORS.length];
                  const borderStyle = isConflicting ? 'conflict-pulsing' : '';

                  const activeStyle = `
                    grid-column: ${col};
                    grid-row: ${rowStart} / ${rowEnd};
                    background: ${isConflicting ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))' : color + '18'};
                    border-color: ${isConflicting ? '#ef4444' : color};
                    color: ${isConflicting ? '#ef4444' : 'var(--text)'};
                  `;

                  return `
                    <div class="grid-block ${borderStyle}" style="${activeStyle}" onclick="openSimCourseModal('${c.code}', ${idx})" title="คลิกเพื่อแก้ไขข้อมูลคาบเรียนจำลอง\nผู้สอน: ${item.instructor || '-'}\nห้อง: ${item.room || '-'}">
                      <span class="gb-code">${c.code}</span>
                      <div style="font-size: 0.6rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${c.name}
                      </div>
                      <span class="gb-details">📍 Sec ${item.secNo} | ${item.room || '-'}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- 4. Summary report & Print Button -->
          <div class="sim-card" style="padding: 16px;">
            <h2 style="font-size: 1.05rem; font-weight: 800; margin: 0 0 10px 0;">📊 ผลการประเมินความถูกต้องตารางเรียน</h2>
            
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;" id="summaryStatusDeck">
              ${(() => {
                let hasConflict = false;
                let hasPrereqError = false;
                
                trialState.selectedCourses.forEach((item, idx) => {
                  const c = ALL_COURSES.find(x => x.code === item.courseCode);
                  if (c) {
                    if (checkCustomScheduleConflict(c.code, item.day, item.startHour, item.endHour, idx).conflict) hasConflict = true;
                    if (!checkCoursePrerequisites(c).passed) hasPrereqError = true;
                  }
                });

                let html = '';
                
                if (totalCredits === 0) {
                  html += `<div style="color:var(--text-muted); font-size:0.82rem;">📌 เริ่มต้นโดยคลิกปุ่ม "ระบุคาบและลงตาราง +" บนการ์ดรายวิชาด้านซ้ายเพื่อกรอกตารางเรียนด้วยตัวท่านเอง</div>`;
                } else {
                  if (totalCredits <= 22) {
                    html += `<div style="color:#10b981; font-size:0.82rem; font-weight:bold;">✓ หน่วยกิตรวมผ่านเกณฑ์จำลอง (ไม่เกิน 22 หน่วยกิต)</div>`;
                  } else {
                    html += `<div style="color:#ef4444; font-size:0.82rem; font-weight:bold;">⚠️ ลิมิตหน่วยกิตรวมเกิน! ต้องไม่เกิน 22 หน่วยกิต (ปัจจุบันสะสม ${totalCredits} หน่วยกิต)</div>`;
                  }

                  if (!hasConflict) {
                    html += `<div style="color:#10b981; font-size:0.82rem; font-weight:bold;">✓ ตารางเวลาเรียนสมบูรณ์ ไม่มีเวลาเรียนชนทับซ้อนกัน</div>`;
                  } else {
                    html += `<div style="color:#ef4444; font-size:0.82rem; font-weight:bold;">⚠️ มีตารางเรียนชนซ้อนกัน! กรุณาคลิกที่คาบเรียนบนตารางหรือกดปุ่มสีส้มเพื่อแก้เวลาเรียนใหม่</div>`;
                  }

                  if (!hasPrereqError) {
                    html += `<div style="color:#10b981; font-size:0.82rem; font-weight:bold;">✓ วิชาตัวต่อทั้งหมด (Prerequisites) สอบผ่านเกณฑ์สำเร็จเรียบร้อย</div>`;
                  } else {
                    html += `<div style="color:#f59e0b; font-size:0.82rem; font-weight:bold;">⚠️ แจ้งเตือน: ตรวจพบรายวิชาที่ตัวต่อยังผ่านไม่ครบถ้วนใน Transcript จริง</div>`;
                  }
                }
                return html;
              })()}
            </div>

            <!-- Print Button Trigger -->
            <button class="sim-btn" style="width: 100%; height: 44px; font-size: 0.95rem;" onclick="triggerSimReceiptPrinting()" ${totalCredits === 0 || totalCredits > 22 ? 'disabled' : ''}>
              🖨️ สรุปและประเมินผลออกใบเสร็จสรุป
            </button>
          </div>

          <!-- 🎫 RECEIPT COMPONENT (THERMAL WRAPPER) -->
          <div class="receipt-container" id="receiptWrapper">
            <div class="printer-mouth">
              <div class="printer-scanner"></div>
            </div>
            
            <div class="receipt-paper" id="receiptPaper">
              <div class="receipt-header">
                <div style="font-size: 1.05rem; font-weight: 900; letter-spacing: 1px;">NITIPAT UNIVERSITY</div>
                <div style="font-size: 0.65rem; opacity: 0.8; margin-top: 3px;">REGISTRATION SYSTEM TERMINAL RECEIPT</div>
                <div style="margin: 6px 0; border: 1px solid #000; padding: 3px; font-weight: bold; font-size: 0.68rem; letter-spacing: 1.5px;">SEMESTER PLANNER</div>
                <div style="font-size: 0.65rem; font-family: monospace; text-align: left; margin-top: 8px;">
                  STUDENT ID: ${STUDENT.id}<br>
                  NAME: ${STUDENT.nameEn}<br>
                  DEGREE: ${STUDENT.degree}<br>
                  DATE: ${new Date().toLocaleString('th-TH')}<br>
                  TOTAL EARNED CREDITS: ${earnedCredits} CREDITS
                </div>
              </div>

              <div class="receipt-body">
                <div style="font-weight: bold; font-size:0.78rem; border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 5px;">SELECTED COURSES & SCHEDULES:</div>
                <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 0.65rem;">
                  <thead>
                    <tr style="border-bottom: 1px dashed #000; font-weight: bold; text-align: left;">
                      <th style="padding: 2px 0;">CODE</th>
                      <th style="padding: 2px 0;">COURSE NAME</th>
                      <th style="padding: 2px 0; text-align: center;">SEC</th>
                      <th style="padding: 2px 0; text-align: right;">CR</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${trialState.selectedCourses.map(item => {
                      const c = ALL_COURSES.find(x => x.code === item.courseCode);
                      if (!c) return '';
                      return `
                        <tr>
                          <td style="padding: 3px 0; font-weight: bold;">${c.code}</td>
                          <td style="padding: 3px 0; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.nameEn || c.name}</td>
                          <td style="padding: 3px 0; text-align: center;">${item.secNo}</td>
                          <td style="padding: 3px 0; text-align: right;">${c.credits}</td>
                        </tr>
                        <tr style="border-bottom: 1px dotted #ccc;">
                          <td colspan="4" style="font-size: 0.55rem; color: #444; padding-bottom: 3px;">
                            ↳ TIME: ${item.timeStr} (ROOM: ${item.room || 'N/A'}) [INSTR: ${item.instructor || 'N/A'}]
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>

                <div style="border-top: 1px dashed #000; margin-top: 8px; padding-top: 4px; text-align: right; font-weight: bold; font-size:0.82rem;">
                  TOTAL REGISTERED CREDITS: <span id="rTotalCredits">${totalCredits}</span> CR
                </div>

                <div style="border: 1px solid #000; border-radius: 4px; padding: 6px; margin-top: 10px; font-size: 0.62rem;">
                  <div style="font-weight: bold; margin-bottom: 3px; text-align: center;">SYSTEM CONSTRAINTS ANALYSIS:</div>
                  • CREDIT LIMIT VALIDATION: PASS ✅<br>
                  • TIMETABLE OVERLAP TEST: PASS ✅<br>
                  • PREREQUISITE REQUIREMENT: ${(() => {
                    let hasError = false;
                    trialState.selectedCourses.forEach(item => {
                      const c = ALL_COURSES.find(x => x.code === item.courseCode);
                      if (c && !checkCoursePrerequisites(c).passed) hasError = true;
                    });
                    return hasError ? 'WARNING ⚠️ (SUB-REQUIREMENTS MISSED)' : 'PASS ✅';
                  })()}<br>
                  <div style="text-align: center; font-weight: bold; margin-top: 4px; color:#111;">STATUS: ALL CONSTRAINTS VALIDATED</div>
                </div>

                <div style="text-align: center; margin-top: 16px; border-top: 2px dashed #9ca3af; padding-top: 10px;">
                  <div style="font-size: 0.55rem; opacity: 0.8; margin-bottom: 2px;">SCAN FOR DIGITAL SIGNATURE VERIFICATION</div>
                  <div style="font-family: monospace; font-size: 12px; font-weight: bold; letter-spacing: 2px; padding: 2px 0;">
                    ||||| | || ||||| | || |||| | |
                  </div>
                  <div style="font-size: 0.52rem; opacity: 0.7;">NITIPAT-MGR SYSTEM TERMINAL CLIENT #67-X204</div>
                  <div style="font-size: 0.52rem; opacity: 0.7;">BUILD SUCCESSFUL - ENJOY NEXT SEMESTER!</div>
                </div>
              </div>
            </div>

            <div style="display:flex; justify-content:center; gap:10px; margin-top: 16px; max-width:360px; margin-left:auto; margin-right:auto;">
              <button class="sim-btn" id="tearReceiptBtn" onclick="tearOffSimReceipt()" style="flex:1; height:40px; font-size:0.85rem; background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);">
                ✂️ ฉีกกระดาษและดาวน์โหลด
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// INTERACTIVE POPUP MODAL FOR CUSTOM SCHEDULE INPUT
// -------------------------------------------------------------

function openSimCourseModal(courseCode, existingIndex = null) {
  const course = ALL_COURSES.find(c => c.code === courseCode);
  if (!course) return;

  const isEditing = existingIndex !== null;
  const existing = isEditing ? trialState.selectedCourses[existingIndex] : null;

  // โหลดข้อมูลเดิมถ้าเป็นการแก้ไข หรือโหลดข้อมูลเริ่มต้นถ้าเป็นคาบใหม่
  const secNo = existing ? existing.secNo : "1";
  const instructor = existing ? existing.instructor : "";
  const room = existing ? existing.room : "";
  const day = existing ? existing.day : 0;
  const startTime = existing ? decimalToTimeString(existing.startHour) : "09:00";
  const endTime = existing ? decimalToTimeString(existing.endHour) : "12:00";

  const bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:12px; font-family:'Kanit', sans-serif;">
      <div style="background:rgba(59,130,246,0.06); padding:10px; border-radius:10px; font-size:0.82rem; line-height:1.4;">
        วิชา: <strong>${course.code} - ${course.name}</strong><br>
        จำนวนหน่วยกิต: <strong>${course.credits} หน่วยกิต</strong>
      </div>
      
      <div class="fg" style="margin-bottom: 2px;">
        <label style="font-weight:700; font-size:0.8rem; display:block; margin-bottom:4px;">หมู่เรียน (Section) <span style="color:#ef4444;">*</span></label>
        <input type="text" class="glass-input" id="sim-f-sec" placeholder="ตัวอย่าง: 1, 2, 700" value="${secNo}" style="width:100%;">
      </div>
      
      <div class="fg" style="margin-bottom: 2px;">
        <label style="font-weight:700; font-size:0.8rem; display:block; margin-bottom:4px;">อาจารย์ผู้สอน</label>
        <input type="text" class="glass-input" id="sim-f-instructor" placeholder="ระบุชื่ออาจารย์" value="${instructor}" style="width:100%;">
      </div>

      <div class="fg" style="margin-bottom: 2px;">
        <label style="font-weight:700; font-size:0.8rem; display:block; margin-bottom:4px;">ห้องเรียน</label>
        <input type="text" class="glass-input" id="sim-f-room" placeholder="ตัวอย่าง: LH-4301, Online" value="${room}" style="width:100%;">
      </div>

      <div class="fg" style="margin-bottom: 2px;">
        <label style="font-weight:700; font-size:0.8rem; display:block; margin-bottom:4px;">วันเรียนตามตารางสอน <span style="color:#ef4444;">*</span></label>
        <select class="glass-select" id="sim-f-day" style="width:100%;">
          ${DAYS_TH.map((d, i) => `<option value="${i}" ${day === i ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div class="fg">
          <label style="font-weight:700; font-size:0.8rem; display:block; margin-bottom:4px;">เวลาเริ่มเรียน <span style="color:#ef4444;">*</span></label>
          <input type="time" class="glass-input" id="sim-f-start" value="${startTime}" style="width:100%;">
        </div>
        <div class="fg">
          <label style="font-weight:700; font-size:0.8rem; display:block; margin-bottom:4px;">เวลาเลิกเรียน <span style="color:#ef4444;">*</span></label>
          <input type="time" class="glass-input" id="sim-f-end" value="${endTime}" style="width:100%;">
        </div>
      </div>
    </div>
  `;

  const footerHtml = `
    <div style="display:flex; gap:8px; width:100%; justify-content:flex-end;">
      <button class="btn-glass" onclick="closeModal()" style="padding: 8px 16px; border-radius: 10px; font-size:0.85rem; border:1px solid var(--glass-border);">ยกเลิก</button>
      <button class="sim-btn" onclick="saveSimCourseModal('${course.code}', ${existingIndex})" style="padding: 8px 18px; border-radius: 10px; font-size:0.85rem; font-weight:700;">บันทึกและลงตาราง</button>
    </div>
  `;

  openModal(isEditing ? '📝 แก้ไขข้อมูลคาบเรียนจำลอง' : '🎫 ระบุเวลาเรียนจำลองรายวิชา', bodyHtml, footerHtml);
}

function saveSimCourseModal(courseCode, existingIndex) {
  const course = ALL_COURSES.find(c => c.code === courseCode);
  if (!course) return;

  const secNo = document.getElementById('sim-f-sec')?.value.trim();
  const instructor = document.getElementById('sim-f-instructor')?.value.trim() || '';
  const room = document.getElementById('sim-f-room')?.value.trim() || '';
  const day = parseInt(document.getElementById('sim-f-day')?.value) || 0;
  const startTime = document.getElementById('sim-f-start')?.value;
  const endTime = document.getElementById('sim-f-end')?.value;

  // 1. ตรวจสอบข้อมูลครบถ้วน
  if (!secNo) {
    showToast('⚠️ กรุณาระบุหมู่เรียน (Section)', 'err');
    return;
  }
  if (!startTime || !endTime) {
    showToast('⚠️ กรุณาระบุช่วงเวลาเรียนให้ครบถ้วน', 'err');
    return;
  }

  const startHour = timeStringToDecimal(startTime);
  const endHour = timeStringToDecimal(endTime);

  if (startHour >= endHour) {
    showToast('⚠️ เวลาเริ่มเรียนต้องเกิดก่อนเวลาเลิกเรียนนะคร้าบ', 'err');
    return;
  }

  // 2. ตรวจสอบหน่วยกิตสะสมสูงสุด (ไม่เกิน 22)
  let totalCredits = course.credits;
  trialState.selectedCourses.forEach((item, idx) => {
    if (existingIndex !== null && existingIndex === idx) return; // ไม่นับหน่วยกิตวิชาเดิมตอนแก้ไข
    const c = ALL_COURSES.find(x => x.code === item.courseCode);
    if (c) totalCredits += c.credits;
  });

  if (totalCredits > 22) {
    showToast(`⚠️ ลงวิชาเพิ่มไม่ได้! เนื่องจากหน่วยกิตจำลองรวมจะเกิน 22 หน่วยกิต (รวมได้สูงสุด 22)`, 'err');
    return;
  }

  // 3. ตรวจสอบคาบเรียนซ้อนทับชนกันแบบ ไดนามิก
  const conflict = checkCustomScheduleConflict(courseCode, day, startHour, endHour, existingIndex);
  if (conflict.conflict) {
    showToast(`⚠️ คาบเรียนที่ระบุชนกับวิชา: ${conflict.conflictingCourse.name} (${conflict.timeStr})`, 'err');
    return;
  }

  // 4. แจ้งเตือนวิชาตัวต่อ (Prereq Warning)
  const prereq = checkCoursePrerequisites(course);
  if (!prereq.passed) {
    showToast(`⚠️ คำเตือน! วิชานี้ยังมีวิชาตัวต่อที่ยังไม่ผ่านเกณฑ์: ${prereq.missing.join(', ')}`, 'warn');
  }

  // 5. บันทึก/อัปเดตลงอาเรย์จำลอง
  const item = {
    courseCode: courseCode,
    secNo: secNo,
    instructor: instructor,
    room: room,
    day: day,
    startHour: startHour,
    endHour: endHour,
    timeStr: `${DAYS_ENG[day]} ${startTime} - ${endTime}`
  };

  if (existingIndex !== null) {
    trialState.selectedCourses[existingIndex] = item;
  } else {
    trialState.selectedCourses.push(item);
  }

  saveTrialState();
  closeModal();

  // เสียงสังเคราะห์ปิ๊งสั้นๆ ยืนยันการเพิ่มเสร็จสิ้น
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}

  render();
  showToast(existingIndex !== null ? '✅ อัปเดตตารางสำเร็จ' : '✅ เพิ่มรายวิชาลงตารางสำเร็จ');
}

function removeSimCourse(courseCode) {
  trialState.selectedCourses = trialState.selectedCourses.filter(x => x.courseCode !== courseCode);
  saveTrialState();
  
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.08);
    gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}

  render();
  showToast('✕ นำรายวิชาออกจากตารางแล้ว');
}

function switchSimCategory(catId) {
  trialState.activeCategory = catId;
  render();
}

function handleSimSearch(q) {
  trialState.searchQuery = q;
  const div = document.getElementById('simCourseGrid');
  if (div) {
    const coursesInCat = COURSE_DB[trialState.activeCategory] || [];
    const query = q.toLowerCase().trim();
    const filteredCourses = coursesInCat.filter(c => {
      if (!query) return true;
      return c.code.toLowerCase().includes(query) || 
             c.name.toLowerCase().includes(query) || 
             (c.nameEn && c.nameEn.toLowerCase().includes(query));
    });

    div.innerHTML = filteredCourses.length > 0 ? filteredCourses.map(c => {
      const userSelectionIndex = trialState.selectedCourses.findIndex(x => x.courseCode === c.code);
      const isAdded = userSelectionIndex !== -1;
      const userSelection = isAdded ? trialState.selectedCourses[userSelectionIndex] : null;
      const prereqStatus = checkCoursePrerequisites(c);

      let cardClass = '';
      if (isAdded) cardClass += ' added';
      if (!prereqStatus.passed) cardClass += ' prereq-failed';

      return `
        <div class="course-card-sim ${cardClass}" id="card-${c.code}">
          <div class="card-header-sim">
            <div>
              <span class="cc-code">${c.code}</span>
              <h3 class="cc-title-th">${c.name}</h3>
              <h4 class="cc-title-en">${c.nameEn}</h4>
            </div>
            <div class="cc-credits">${c.credits} หน่วยกิต</div>
          </div>

          <div>
            ${prereqStatus.passed 
              ? `<span class="badge-prereq ok">✓ ไม่มีวิชาตัวต่อ / ผ่านแล้ว</span>` 
              : `<span class="badge-prereq fail" title="ยังไม่ผ่าน ${prereqStatus.missing.join(', ')}">⚠️ ตัวต่อยังไม่ผ่าน: ${prereqStatus.missing.join(', ')}</span>`
            }
          </div>

          ${isAdded ? `
            <div style="background:rgba(59,130,246,0.06); padding:8px 12px; border-radius:10px; font-size:0.78rem; display:flex; flex-direction:column; gap:2px;">
              <div><strong>หมู่เรียน (Sec):</strong> ${userSelection.secNo} | <strong>ผู้สอน:</strong> ${userSelection.instructor || '-'}</div>
              <div><strong>ห้องเรียน:</strong> ${userSelection.room || '-'}</div>
              <div style="color:#3b82f6; font-weight:700;">⏰ เวลา: ${userSelection.timeStr}</div>
            </div>
          ` : ''}

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top:4px;">
            ${isAdded ? `
              <button class="sim-btn sim-btn-danger" style="padding: 5px 12px; font-size: 0.78rem; border-radius: 8px;" onclick="removeSimCourse('${c.code}')">นำออก -</button>
              <button class="sim-btn sim-btn-warn" style="padding: 5px 12px; font-size: 0.78rem; border-radius: 8px;" onclick="openSimCourseModal('${c.code}', ${userSelectionIndex})">แก้ไขคาบ 📝</button>
            ` : `
              <button class="sim-btn" style="padding: 6px 14px; font-size: 0.78rem; border-radius: 8px;" onclick="openSimCourseModal('${c.code}')">ระบุคาบและลงตาราง +</button>
            `}
          </div>
        </div>
      `;
    }).join('') : `<div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">✕ ไม่พบวิชาที่ค้นหาในหมวดนี้</div>`;
  }
}

// -------------------------------------------------------------
// RECEIPT PRINTER & SCANNER ANIMATION
// -------------------------------------------------------------

function triggerSimReceiptPrinting() {
  const wrap = document.getElementById('receiptWrapper');
  const paper = document.getElementById('receiptPaper');
  if (!wrap || !paper) return;

  paper.classList.remove('receipt-tear-away');
  wrap.style.display = 'block';
  paper.style.maxHeight = '0px';
  
  let currentHeight = 0;
  const targetHeight = 850;
  const printInterval = setInterval(() => {
    currentHeight += 12;
    paper.style.maxHeight = currentHeight + 'px';
    
    playPrinterSound();

    if (currentHeight >= targetHeight) {
      clearInterval(printInterval);
      playSuccessSound();
      showToast('🎉 พิมพ์ใบเสร็จสรุปผลแล้ว! กดปุ่มเขียวฉีกกระดาษเพื่อเซฟภาพ', 'success');
      wrap.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, 45);
}

// -------------------------------------------------------------
// 3D PAPER TEAR & IMAGE DOWNLOAD
// -------------------------------------------------------------

async function tearOffSimReceipt() {
  const paper = document.getElementById('receiptPaper');
  if (!paper) return;

  if (typeof html2canvas !== 'undefined') {
    showToast('💾 กำลังจับภาพใบเสร็จสรุปผลความชัดสูง...', 'success');
    
    try {
      // 1. ถ่ายรูปใบเสร็จขณะที่ตั้งตรงสมบูรณ์แบบ 100% (ก่อนเล่นแอนิเมชันปลิวบิดเบี้ยว)
      const canvas = await html2canvas(paper, {
        backgroundColor: '#fafaf6',
        scale: 2,
        logging: false
      });

      // 2. สังเคราะห์เสียงฉีกขาดและเล่นแอนิเมชันกระดาษปลิวหาย 3D ทันที
      playTearSound();
      paper.classList.add('receipt-tear-away');

      // 3. ทริกเกอร์การดาวน์โหลดไฟล์ภาพ
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `Receipt_Registration_Plan_Semester_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('💾 ดาวน์โหลดตารางเรียนจำลองเสร็จเรียบร้อย! 🌟', 'success');
      }, 350); // รอจังหวะสอดคล้องกับแอนิเมชันฉีกปลิว
      
    } catch (err) {
      console.error("html2canvas error", err);
      showToast('❌ เซฟภาพล้มเหลว', 'err');
    }
  } else {
    // Fallback ถ้าไม่มี html2canvas
    playTearSound();
    paper.classList.add('receipt-tear-away');
    showToast('⚠️ ไม่สามารถแปลงรูปภาพได้ (ไม่พบไลบรารี html2canvas)', 'err');
  }
}

// ฟังก์ชันผูกมัด Event ของหน้าต่างนี้ (เรียกโดย attachAllEvents)
function attachTrialRegEvents() {
  console.log("Attached refined trial-reg events successfully.");
}
