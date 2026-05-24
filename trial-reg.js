/**
 * NITIPAT MANAGER - Trial Course Registration Simulator
 * ฟีเจอร์ทดลองจัดตารางเรียนเทอมหน้า ตรวจวิชาตัวต่อ เช็คตารางชน และออกใบเสร็จแอนิเมชัน 3D พร้อมเสียงสังเคราะห์!
 */

// โครงสร้างวันย่อและตัวย่อสำหรับตารางเรียน
const DAYS_TH = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
const DAYS_ENG = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAYS_COLORS = ['#fbbf24', '#f472b6', '#34d399', '#f87171', '#60a5fa', '#c084fc', '#f472b6'];

// สถานะการลงทะเบียนจำลอง
let trialState = {
  selectedCourses: [], // รายการวิชาที่เลือกลงทะเบียนจำลอง { courseCode, sectionIndex }
  activeCategory: 'general', // หมวดวิชาหลักที่กำลังเลือกดูอยู่
  searchQuery: '',
  isPrinting: false,
  isTorn: false
};

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
// DETERMINISTIC MOCK SCHEDULE GENERATOR
// สร้างตารางเรียนจำลองสำหรับทุกคอร์สให้มีความสมจริง
// -------------------------------------------------------------
function getCourseSections(course) {
  // สร้างตารางสอนจำลองโดยคำนวณจากรหัสวิชา (เพื่อความคงที่ของตารางสอน)
  const codeNum = parseInt(course.code) || 0;
  
  // Section 1
  const day1 = codeNum % 5; // วันจันทร์ - ศุกร์ (0 - 4)
  const startHour1 = 9 + ((codeNum >> 1) % 3) * 3; // 9:00, 12:00, 15:00
  const duration = course.credits === 1 ? 2 : 3; // 1 หน่วยกิตเรียน 2 ชม. (Lab), 3 หน่วยกิตเรียน 3 ชม.
  const endHour1 = startHour1 + duration;

  // Section 2
  const day2 = (day1 + 2) % 5;
  const startHour2 = 13 - ((codeNum >> 2) % 2) * 4; // 9:00 หรือ 13:00
  const endHour2 = startHour2 + duration;

  return [
    {
      secNo: 1,
      instructor: course.instructor || "อ.ดร. นิติพัฒน์ ทิพย์ชัย",
      room: course.room || `LH-4${codeNum % 10}01`,
      day: day1,
      startHour: startHour1,
      endHour: endHour1,
      timeStr: `${DAYS_ENG[day1]} ${startHour1}:00 - ${endHour1}:00`
    },
    {
      secNo: 2,
      instructor: course.instructor || "ศ.ดร. สุขสันต์ พลังงานวัสดุ",
      room: course.room || `Engineering Building ${codeNum % 5 + 1}`,
      day: day2,
      startHour: startHour2,
      endHour: endHour2,
      timeStr: `${DAYS_ENG[day2]} ${startHour2}:00 - ${endHour2}:00`
    }
  ];
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
    // หาวิชาที่มีโค้ดขึ้นต้นด้วย reqCode ในประวัติการเรียน (เช่น 01417167, 01417167b, 01417167c)
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
// SCHEDULE CONFLICT DETECTOR
// ตรวจสอบเวลาเรียนซ้อนทับกัน
// -------------------------------------------------------------
function checkScheduleConflict(newCourse, newSecNo) {
  const sections = getCourseSections(newCourse);
  const newSec = sections.find(s => s.secNo === newSecNo) || sections[0];

  for (const item of trialState.selectedCourses) {
    if (item.courseCode === newCourse.code) continue; // ข้ามวิชาตัวเอง

    // ค้นหาวิชาเต็ม
    const addedCourse = ALL_COURSES.find(c => c.code === item.courseCode);
    if (!addedCourse) continue;

    const addedSecs = getCourseSections(addedCourse);
    const addedSec = addedSecs.find(s => s.secNo === item.secNo) || addedSecs[0];

    // ตรวจสอบการทับซ้อน (ชนกันถ้าวัดวันเดียวกัน และเวลาคาบเกี่ยวกัน)
    if (newSec.day === addedSec.day) {
      const isOverlap = !(newSec.endHour <= addedSec.startHour || newSec.startHour >= addedSec.endHour);
      if (isOverlap) {
        return {
          conflict: true,
          conflictingCourse: addedCourse,
          timeStr: addedSec.timeStr
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

// 1. เสียงกระแทกหัวเข็มเครื่องพิมพ์ (Dot-matrix Printer printing sound)
function playPrinterSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // ตั้งค่าประเภทคลื่นเป็น Sawtooth หรือ Triangle เพื่อความทุ้มและแหลมแบบเครื่องกล
    osc.type = 'sawtooth';
    
    // สร้างช่วงความถี่ของหัวเข็มกวาดอย่างรวดเร็ว (Frequency Sweep)
    const time = ctx.currentTime;
    osc.frequency.setValueAtTime(900 + Math.random() * 400, time);
    osc.frequency.exponentialRampToValueAtTime(120 + Math.random() * 40, time + 0.06);
    
    // ระดับความดังค่อยๆ จางหายไปอย่างรวดเร็ว (Exponential Decay)
    gainNode.gain.setValueAtTime(0.04, time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.07);
  } catch (e) {
    console.error("Audio Synthesis error", e);
  }
}

// 2. เสียงฉีกกระดาษขาวขาดฟึ่บ! (Paper Tearing sound)
function playTearSound() {
  try {
    const ctx = getAudioContext();
    const sampleRate = ctx.sampleRate;
    const duration = 0.28; // ระยะเวลาเสียงฉีกขาด
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    // สร้าง White Noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // กรองเสียงย่านต่ำออกด้วย Highpass Filter เพื่อให้เสียงแหลมกรอบคล้ายเสียงฉีกกระดาษ
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + duration);
    
    // คุมความดังกระดาษขาดแบบกระโชกโฮกฮาก
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    noise.start();
  } catch (e) {
    console.error("Audio Tear Synthesis error", e);
  }
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
      
      gainNode.gain.setValueAtTime(0.12, now + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur);
    };
    
    // โน้ตเพลงสดใส 3 ตัวไล่เสียงขึ้น
    playTone(523.25, 0, 0.15); // C5
    playTone(659.25, 0.08, 0.15); // E5
    playTone(783.99, 0.16, 0.3); // G5
  } catch (e) {}
}

// -------------------------------------------------------------
// UI RENDERING FUNCTION
// ฟังก์ชันสร้างโค้ด HTML แบบ Custom UI จุกๆ
// -------------------------------------------------------------
function renderTrialReg() {
  initTrialState();
  
  // โหลดรายวิชาทั้งหมดให้แน่ใจก่อน
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

  // แยกรายชื่อวิชาที่ผ่านแล้วของนักศึกษาออกมา
  const earnedCredits = Object.values(STUDENT.existingGrades)
    .filter(g => ["A", "B+", "B", "C+", "C", "D+", "D", "P"].includes(g.grade))
    .reduce((sum, g) => sum + g.credits, 0);

  return `
    <style>
      :root {
        --sim-primary: #3b82f6;
        --sim-primary-glow: rgba(59, 130, 246, 0.4);
        --sim-accent: #10b981;
        --sim-error: #ef4444;
        --sim-warning: #f59e0b;
        --sim-glass: rgba(255, 255, 255, 0.08);
        --sim-glass-border: rgba(255, 255, 255, 0.15);
      }
      
      .dark-mode {
        --sim-glass: rgba(15, 23, 42, 0.4);
        --sim-glass-border: rgba(255, 255, 255, 0.08);
      }

      .sim-page-wrapper {
        font-family: 'Kanit', 'Sarabun', sans-serif;
        padding: 20px;
        min-height: calc(100vh - 100px);
        background: radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.06) 0%, transparent 40%),
                    radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 40%);
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 24px;
        color: var(--text);
      }

      @media (max-width: 1024px) {
        .sim-page-wrapper {
          grid-template-columns: 1fr;
        }
      }

      /* 💡 Cyber Glass Cards */
      .sim-card {
        background: var(--sim-glass);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--sim-glass-border);
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.03);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .sim-card:hover {
        border-color: rgba(59, 130, 246, 0.3);
        box-shadow: 0 16px 48px rgba(59, 130, 246, 0.05);
      }

      /* Glowing Header */
      .sim-header {
        grid-column: 1 / -1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .sim-title-wrap h1 {
        font-size: 1.8rem;
        font-weight: 800;
        margin: 0;
        background: linear-gradient(135deg, var(--sim-primary), var(--sim-accent));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .sim-title-wrap p {
        font-size: 0.9rem;
        margin: 4px 0 0 0;
        color: var(--text-muted);
      }

      /* Credits Progress Badge */
      .credits-meter {
        background: rgba(59, 130, 246, 0.08);
        border: 1.5px dashed var(--sim-primary);
        border-radius: 16px;
        padding: 10px 18px;
        text-align: right;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;
      }

      .credits-meter.overflow {
        border-color: var(--sim-error);
        background: rgba(239, 68, 68, 0.08);
        animation: pulse-danger 1.5s infinite;
      }

      @keyframes pulse-danger {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
        50% { box-shadow: 0 0 12px 4px rgba(239, 68, 68, 0.2); }
      }

      /* 📚 Tab selectors */
      .cat-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
        overflow-x: auto;
        padding-bottom: 4px;
      }

      .cat-tab {
        background: rgba(0, 0, 0, 0.03);
        border: 1px solid transparent;
        color: var(--text-muted);
        padding: 10px 16px;
        border-radius: 14px;
        cursor: pointer;
        font-size: 0.88rem;
        font-weight: 600;
        white-space: nowrap;
        transition: all 0.2s ease;
      }

      .dark-mode .cat-tab {
        background: rgba(255, 255, 255, 0.03);
      }

      .cat-tab.active {
        background: var(--sim-primary);
        color: white;
        box-shadow: 0 6px 16px var(--sim-primary-glow);
      }

      /* Course list and Search */
      .search-box-wrap {
        position: relative;
        margin-bottom: 20px;
      }

      .search-box-wrap input {
        width: 100%;
        background: rgba(0, 0, 0, 0.02);
        border: 1px solid var(--sim-glass-border);
        padding: 12px 18px 12px 44px;
        border-radius: 16px;
        color: var(--text);
        font-size: 0.9rem;
        outline: none;
        transition: all 0.25s ease;
      }

      .dark-mode .search-box-wrap input {
        background: rgba(255, 255, 255, 0.02);
      }

      .search-box-wrap input:focus {
        border-color: var(--sim-primary);
        background: white;
        box-shadow: 0 0 0 4px var(--sim-primary-glow);
      }

      .dark-mode .search-box-wrap input:focus {
        background: rgba(15, 23, 42, 0.6);
      }

      .search-icon-sim {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1.1rem;
        opacity: 0.5;
      }

      .course-grid-sim {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        max-height: 520px;
        overflow-y: auto;
        padding-right: 6px;
      }

      /* 🎴 Course interactive card */
      .course-card-sim {
        background: rgba(255, 255, 255, 0.5);
        border: 1.5px solid var(--sim-glass-border);
        border-radius: 20px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        position: relative;
        transition: all 0.25s ease;
      }

      .dark-mode .course-card-sim {
        background: rgba(30, 41, 59, 0.25);
      }

      .course-card-sim.added {
        border-color: var(--sim-primary);
        background: rgba(59, 130, 246, 0.03);
      }

      .course-card-sim.prereq-failed {
        border-color: var(--sim-warning);
        background: rgba(245, 158, 11, 0.03);
      }

      .course-card-sim:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.02);
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
        color: var(--sim-primary);
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.8rem;
      }

      .cc-credits {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--text-muted);
      }

      .cc-title-th {
        font-size: 0.98rem;
        font-weight: 700;
        margin: 4px 0 2px 0;
      }

      .cc-title-en {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin: 0;
      }

      .sec-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 0, 0, 0.02);
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 0.85rem;
      }

      .dark-mode .sec-row {
        background: rgba(255, 255, 255, 0.02);
      }

      .sec-select {
        background: transparent;
        border: none;
        outline: none;
        font-weight: 700;
        cursor: pointer;
        color: var(--sim-primary);
      }

      /* Shaking Spring Animation */
      @keyframes spring-shake {
        0%, 100% { transform: translateX(0); }
        15%, 45%, 75% { transform: translateX(-6px); }
        30%, 60%, 90% { transform: translateX(6px); }
      }

      .shake-effect {
        animation: spring-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
      }

      /* 📅 Calendar CSS grid */
      .sched-grid {
        display: grid;
        grid-template-columns: 50px repeat(5, 1fr);
        grid-template-rows: 40px repeat(12, 35px); /* 8:00 - 20:00 (12 slots) */
        gap: 3px;
        background: rgba(0, 0, 0, 0.02);
        padding: 8px;
        border-radius: 20px;
        border: 1px solid var(--sim-glass-border);
        overflow: hidden;
      }

      .dark-mode .sched-grid {
        background: rgba(255, 255, 255, 0.01);
      }

      .grid-corner {
        grid-column: 1;
        grid-row: 1;
        border-bottom: 1px solid var(--sim-glass-border);
      }

      .grid-header {
        text-align: center;
        font-weight: 700;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-bottom: 1px solid var(--sim-glass-border);
      }

      .grid-time-label {
        font-size: 0.72rem;
        font-family: monospace;
        color: var(--text-muted);
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        padding-right: 6px;
        padding-top: 4px;
        border-right: 1px solid var(--sim-glass-border);
      }

      .grid-block {
        border-radius: 10px;
        padding: 4px 6px;
        font-size: 0.72rem;
        font-weight: 700;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        border-width: 1.5px;
        border-style: solid;
        transition: all 0.2s ease;
      }

      .grid-block:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 10;
      }

      .grid-block .gb-code {
        font-weight: 800;
        font-size: 0.75rem;
      }

      .grid-block .gb-room {
        font-size: 0.65rem;
        opacity: 0.75;
      }

      /* Overlapping Pulse */
      .grid-block.conflict-pulsing {
        border-color: var(--sim-error) !important;
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(239, 68, 68, 0.15)) !important;
        animation: pulse-danger-block 1s infinite alternate;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
      }

      @keyframes pulse-danger-block {
        0% { transform: scale(1); }
        100% { transform: scale(0.98); filter: brightness(1.1); }
      }

      /* 🎫 ULTRA-PREMIUM THERMAL RECEIPT SLIDING SLOT */
      .receipt-container {
        display: none;
        perspective: 1000px;
        margin-top: 24px;
      }

      .printer-mouth {
        height: 12px;
        background: #1e293b;
        border-radius: 6px 6px 0 0;
        box-shadow: inset 0 2px 5px rgba(0,0,0,0.5), 0 0 12px var(--sim-primary-glow);
        position: relative;
        z-index: 20;
      }

      /* Scanner light */
      .printer-scanner {
        position: absolute;
        top: 8px;
        left: 0;
        width: 100%;
        height: 2px;
        background: var(--sim-primary);
        box-shadow: 0 0 8px 1px var(--sim-primary);
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
        max-width: 380px;
        margin: 0 auto;
        padding: 24px 20px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        border: 1px solid #e5e7eb;
        position: relative;
        overflow: hidden;
        transform-origin: top center;
        max-height: 0px; /* ค่อยๆ เลื่อนลงมา */
        transition: max-height 3.5s cubic-bezier(0.1, 0.8, 0.3, 1);
        z-index: 10;
      }

      /* ขอบหยักฉีกกระดาษฟันซิกแซก */
      .receipt-paper::after {
        content: "";
        display: block;
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 10px;
        background: linear-gradient(-45deg, #fafaf6 5px, transparent 0), 
                    linear-gradient(45deg, #fafaf6 5px, transparent 0);
        background-size: 10px 10px;
        transform: translateY(2px);
      }

      .receipt-header {
        text-align: center;
        border-bottom: 2px dashed #9ca3af;
        padding-bottom: 16px;
        margin-bottom: 16px;
      }

      .receipt-body {
        font-size: 0.78rem;
        line-height: 1.6;
      }

      /* 3D Paper Tear off anim */
      .receipt-tear-away {
        animation: tear-slide 0.7s forwards cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      @keyframes tear-slide {
        0% { transform: rotate(0) translateY(0); opacity: 1; }
        30% { transform: rotate(-8deg) translateY(4px); opacity: 0.95; }
        100% { transform: rotate(-35deg) translateY(600px) translateX(-100px) scale(0.9); opacity: 0; }
      }

      /* Buttons & Badges */
      .sim-btn {
        background: linear-gradient(135deg, var(--sim-primary), #1d4ed8);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 16px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
        transition: all 0.2s ease;
      }

      .sim-btn:hover {
        transform: translateY(-1.5px);
        box-shadow: 0 6px 18px rgba(59, 130, 246, 0.45);
      }

      .sim-btn-danger {
        background: linear-gradient(135deg, var(--sim-error), #b91c1c);
        box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
      }

      .sim-btn-danger:hover {
        box-shadow: 0 6px 18px rgba(239, 68, 68, 0.45);
      }

      .badge-prereq {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .badge-prereq.ok {
        background: rgba(16, 185, 129, 0.1);
        color: var(--sim-accent);
      }

      .badge-prereq.fail {
        background: rgba(245, 158, 11, 0.1);
        color: var(--sim-warning);
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
          <p>จำลองจัดตารางหลักสูตร 137 หน่วยกิต (Materials Engineering) เช็คตัวต่อ และเวลาเรียนชนกันได้อย่างอิสระ</p>
        </div>
        <div class="credits-meter ${totalCredits > 22 ? 'overflow' : ''}" id="creditsMeter">
          <div style="font-size: 0.72rem; opacity: 0.65; font-weight: bold; text-transform: uppercase;">สะสมหน่วยกิตจำลอง</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: ${totalCredits > 22 ? 'var(--sim-error)' : 'var(--sim-primary)'};">
            <span id="creditVal">${totalCredits}</span> / 22 หน่วยกิต
          </div>
        </div>
      </div>

      <!-- 2. Left Panel: Course Explorer -->
      <div class="sim-card" style="display: flex; flex-direction: column;">
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
          <input type="text" id="simSearchInput" placeholder="ค้นหาตามรหัสวิชา หรือชื่อวิชา..." value="${trialState.searchQuery}" oninput="handleSimSearch(this.value)">
        </div>

        <!-- Course Cards Grid -->
        <div class="course-grid-sim" id="simCourseGrid">
          ${filteredCourses.length > 0 ? filteredCourses.map(c => {
            const isAdded = trialState.selectedCourses.some(x => x.courseCode === c.code);
            const userSelection = trialState.selectedCourses.find(x => x.courseCode === c.code);
            const activeSec = userSelection ? userSelection.secNo : 1;
            
            const prereqStatus = checkCoursePrerequisites(c);
            const conflictStatus = checkScheduleConflict(c, activeSec);
            const sections = getCourseSections(c);

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

                <!-- Prereq validation view -->
                <div>
                  ${prereqStatus.passed 
                    ? `<span class="badge-prereq ok">✓ ไม่มีวิชาตัวต่อ / ผ่านแล้ว</span>` 
                    : `<span class="badge-prereq fail" title="ยังไม่ผ่าน ${prereqStatus.missing.join(', ')}">⚠️ ตัวต่อยังไม่ผ่าน: ${prereqStatus.missing.join(', ')}</span>`
                  }
                </div>

                <!-- Section and mock schedule select -->
                <div class="sec-row">
                  <div>
                    <span>เซคชัน:</span>
                    <select class="sec-select" id="sec-select-${c.code}" onchange="changeSimCourseSection('${c.code}', this.value)" ${isAdded ? '' : ''}>
                      <option value="1" ${activeSec === 1 ? 'selected' : ''}>หมู่ 1 - อ.นิติพัฒน์</option>
                      <option value="2" ${activeSec === 2 ? 'selected' : ''}>หมู่ 2 - อ.สุขอัญญะ</option>
                    </select>
                  </div>
                  <div style="font-family: monospace; font-weight: 700; color: var(--text-muted);">
                    ⏰ ${sections[activeSec - 1].timeStr}
                  </div>
                </div>

                <!-- Action Button -->
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                  ${isAdded 
                    ? `<button class="sim-btn sim-btn-danger" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 10px;" onclick="removeSimCourse('${c.code}')">นำออก -</button>` 
                    : `<button class="sim-btn" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 10px;" onclick="addSimCourse('${c.code}')">ลงตารางเรียน +</button>`
                  }
                </div>
              </div>
            `;
          }).join('') : `<div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">✕ ไม่พบวิชาที่ค้นหาในหมวดนี้</div>`}
        </div>
      </div>

      <!-- 3. Right Panel: Timetable / Calendar View & Checkout -->
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Interactive Calendar Grid -->
        <div class="sim-card" style="padding: 16px;">
          <h2 style="font-size: 1.15rem; font-weight: 800; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
            <span>📅</span> ตารางเรียนลงทะเบียนจำลองของคุณ
          </h2>

          <div class="sched-grid">
            <div class="grid-corner"></div>
            ${DAYS_ENG.slice(0, 5).map((d, i) => `<div class="grid-header">${d}</div>`).join('')}

            <!-- 8:00 to 20:00 rows -->
            ${Array.from({ length: 12 }, (_, i) => 8 + i).map(h => `
              <div class="grid-time-label" style="grid-row: ${h - 8 + 2}">${h}:00</div>
            `).join('')}

            <!-- Active Course Blocks inside Calendar -->
            ${trialState.selectedCourses.flatMap(item => {
              const c = ALL_COURSES.find(x => x.code === item.courseCode);
              if (!c) return [];

              const secList = getCourseSections(c);
              const sec = secList.find(s => s.secNo === item.secNo) || secList[0];

              // หากทับซ้อนเวลาชนกันกับใบใดก็ตาม ให้เปิดโหมดสั่นกะพริบ
              const conflict = checkScheduleConflict(c, item.secNo);
              const isConflicting = conflict.conflict;

              // คำนวณแถวตำแหน่ง
              const rowStart = sec.startHour - 8 + 2;
              const rowEnd = sec.endHour - 8 + 2;
              const col = sec.day + 2; // day 0 = col 2 (MON)

              const color = DAYS_COLORS[sec.day % DAYS_COLORS.length];
              const borderStyle = isConflicting 
                ? 'conflict-pulsing' 
                : '';

              const activeStyle = `
                grid-column: ${col};
                grid-row: ${rowStart} / ${rowEnd};
                background: ${isConflicting ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))' : color + '18'};
                border-color: ${isConflicting ? 'var(--sim-error)' : color};
                color: ${isConflicting ? 'var(--sim-error)' : 'var(--text)'};
              `;

              return `
                <div class="grid-block ${borderStyle}" style="${activeStyle}" onclick="removeSimCourse('${c.code}')" title="กดเพื่อถอนรายวิชาจำลอง\nผู้สอน: ${sec.instructor}\nห้อง: ${sec.room}">
                  <span class="gb-code">${c.code}</span>
                  <div style="font-size: 0.65rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${c.name}
                  </div>
                  <span class="gb-room">📍 ${sec.room} (${sec.secNo})</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 4. Timetable check summary & Print Button -->
        <div class="sim-card" style="padding: 20px;">
          <h2 style="font-size: 1.15rem; font-weight: 800; margin: 0 0 12px 0;">📊 สรุปประเมินความถูกต้อง</h2>
          
          <!-- ตรวจสถานะทั้งหมด -->
          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;" id="summaryStatusDeck">
            ${(() => {
              let hasConflict = false;
              let hasPrereqError = false;
              
              trialState.selectedCourses.forEach(item => {
                const c = ALL_COURSES.find(x => x.code === item.courseCode);
                if (c) {
                  if (checkScheduleConflict(c, item.secNo).conflict) hasConflict = true;
                  if (!checkCoursePrerequisites(c).passed) hasPrereqError = true;
                }
              });

              let html = '';
              
              // 1. เช็คหน่วยกิต
              if (totalCredits === 0) {
                html += `<div style="color:var(--text-muted); font-size:0.88rem;">📌 กรุณาเพิ่มรายวิชาเพื่อเริ่มต้นจำลองตารางเรียน</div>`;
              } else {
                if (totalCredits <= 22) {
                  html += `<div style="color:var(--sim-accent); font-size:0.88rem; font-weight:bold;">✓ หน่วยกิตรวมสมเหตุสมผล (ไม่เกิน 22 หน่วยกิต)</div>`;
                } else {
                  html += `<div style="color:var(--sim-error); font-size:0.88rem; font-weight:bold;">⚠️ ลิมิตหน่วยกิตรวมเกิน! ต้องไม่เกิน 22 หน่วยกิต (ปัจจุบัน ${totalCredits})</div>`;
                }

                // 2. เช็คตารางชน
                if (!hasConflict) {
                  html += `<div style="color:var(--sim-accent); font-size:0.88rem; font-weight:bold;">✓ ตารางเวลาเรียนสมบูรณ์ ไม่มีคาบเวลาทับซ้อนกัน</div>`;
                } else {
                  html += `<div style="color:var(--sim-error); font-size:0.88rem; font-weight:bold;">⚠️ ตารางเรียนทับซ้อนกัน! กรุณาเปลี่ยนเซคชันหรือถอนวิชาออก</div>`;
                }

                // 3. เช็ควิชาต่อ
                if (!hasPrereqError) {
                  html += `<div style="color:var(--sim-accent); font-size:0.88rem; font-weight:bold;">✓ วิชาตัวต่อได้รับการอนุญาตและผ่านเกณฑ์สมบูรณ์แล้ว</div>`;
                } else {
                  html += `<div style="color:var(--sim-warning); font-size:0.88rem; font-weight:bold;">⚠️ ตรวจพบวิชาที่วิชาตัวต่อยังไม่ผ่าน (ควรตรวจสอบและถอนวิชา)</div>`;
                }
              }
              return html;
            })()}
          </div>

          <!-- Print Button Trigger -->
          <button class="sim-btn" style="width: 100%; height: 50px; font-size: 1.05rem;" onclick="triggerSimReceiptPrinting()" ${totalCredits === 0 || totalCredits > 22 ? 'disabled' : ''}>
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
              <div style="font-size: 1.1rem; font-weight: 900; letter-spacing: 1px;">NITIPAT UNIVERSITY</div>
              <div style="font-size: 0.65rem; opacity: 0.8; margin-top: 4px;">REGISTRATION SYSTEM TERMINAL RECEIPT</div>
              <div style="margin: 8px 0; border: 1px solid #000; padding: 4px; font-weight: bold; font-size: 0.72rem; letter-spacing: 2px;">SEMESTER PLANNER</div>
              <div style="font-size: 0.68rem; font-family: monospace; text-align: left; margin-top: 10px;">
                STUDENT ID: ${STUDENT.id}<br>
                NAME: ${STUDENT.nameEn}<br>
                DEGREE: ${STUDENT.degree}<br>
                DATE: ${new Date().toLocaleString('th-TH')}<br>
                TOTAL COMPLETED CREDITS: ${earnedCredits} CREDITS
              </div>
            </div>

            <div class="receipt-body">
              <div style="font-weight: bold; font-size:0.82rem; border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 6px;">SELECTED COURSES & SCHEDULES:</div>
              <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 0.68rem;">
                <thead>
                  <tr style="border-bottom: 1px dashed #000; font-weight: bold; text-align: left;">
                    <th style="padding: 4px 0;">CODE</th>
                    <th style="padding: 4px 0;">COURSE NAME</th>
                    <th style="padding: 4px 0; text-align: center;">SEC</th>
                    <th style="padding: 4px 0; text-align: right;">CR</th>
                  </tr>
                </thead>
                <tbody>
                  ${trialState.selectedCourses.map(item => {
                    const c = ALL_COURSES.find(x => x.code === item.courseCode);
                    if (!c) return '';
                    const secList = getCourseSections(c);
                    const sec = secList.find(s => s.secNo === item.secNo) || secList[0];
                    return `
                      <tr>
                        <td style="padding: 4px 0; font-weight: bold;">${c.code}</td>
                        <td style="padding: 4px 0; max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.nameEn || c.name}</td>
                        <td style="padding: 4px 0; text-align: center;">${item.secNo}</td>
                        <td style="padding: 4px 0; text-align: right;">${c.credits}</td>
                      </tr>
                      <tr style="border-bottom: 1px dotted #ccc;">
                        <td colspan="4" style="font-size: 0.58rem; color: #555; padding-bottom: 4px;">
                          ↳ SCHEDULE: ${sec.timeStr} (ROOM: ${sec.room})
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>

              <!-- Total values -->
              <div style="border-top: 1px dashed #000; margin-top: 10px; padding-top: 6px; text-align: right; font-weight: bold; font-size:0.88rem;">
                TOTAL REGISTERED CREDITS: <span id="rTotalCredits">${totalCredits}</span> CR
              </div>

              <!-- ข้อความแสดงผลการวิเคราะห์ -->
              <div style="border: 1px solid #000; border-radius: 4px; padding: 8px; margin-top: 12px; font-size: 0.65rem;">
                <div style="font-weight: bold; margin-bottom: 4px; text-align: center;">SYSTEM CONSTRAINTS ANALYSIS:</div>
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
                <div style="text-align: center; font-weight: bold; margin-top: 6px; color:#111;">STATUS: ALL CONSTRAINTS VALIDATED</div>
              </div>

              <!-- Barcode & footer -->
              <div style="text-align: center; margin-top: 20px; border-top: 2px dashed #9ca3af; padding-top: 14px;">
                <div style="font-size: 0.58rem; opacity: 0.8; margin-bottom: 4px;">SCAN FOR DIGITAL SIGNATURE VERIFICATION</div>
                <div style="font-family: monospace; font-size: 14px; font-weight: bold; letter-spacing: 2px; padding: 4px 0;">
                  ||||| | || ||||| | || |||| | |
                </div>
                <div style="font-size: 0.55rem; opacity: 0.7;">NITIPAT-MGR SYSTEM TERMINAL CLIENT #67-X204</div>
                <div style="font-size: 0.55rem; opacity: 0.7;">BUILD SUCCESSFUL - ENJOY NEXT SEMESTER!</div>
              </div>
            </div>
          </div>

          <!-- Action buttons for receipt -->
          <div style="display:flex; justify-content:center; gap:12px; margin-top: 20px; max-width:380px; margin-left:auto; margin-right:auto;">
            <button class="sim-btn" id="tearReceiptBtn" onclick="tearOffSimReceipt()" style="flex:1; height:44px; font-size:0.9rem; background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              ✂️ ฉีกกระดาษและดาวน์โหลด
            </button>
          </div>
        </div>

      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// EVENT HANDLERS & SIMULATOR LOGIC
// -------------------------------------------------------------

function switchSimCategory(catId) {
  trialState.activeCategory = catId;
  render();
}

function handleSimSearch(q) {
  trialState.searchQuery = q;
  // อัปเดตรายการการ์ดวิชาด้านซ้ายเท่านั้นโดยไม่สูญเสียโฟกัส
  const div = document.getElementById('simCourseGrid');
  if (div) {
    // โหลดวิชากรองใหม่
    const coursesInCat = COURSE_DB[trialState.activeCategory] || [];
    const query = q.toLowerCase().trim();
    const filteredCourses = coursesInCat.filter(c => {
      if (!query) return true;
      return c.code.toLowerCase().includes(query) || 
             c.name.toLowerCase().includes(query) || 
             (c.nameEn && c.nameEn.toLowerCase().includes(query));
    });

    div.innerHTML = filteredCourses.length > 0 ? filteredCourses.map(c => {
      const isAdded = trialState.selectedCourses.some(x => x.courseCode === c.code);
      const userSelection = trialState.selectedCourses.find(x => x.courseCode === c.code);
      const activeSec = userSelection ? userSelection.secNo : 1;
      
      const prereqStatus = checkCoursePrerequisites(c);
      const sections = getCourseSections(c);

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

          <div class="sec-row">
            <div>
              <span>เซคชัน:</span>
              <select class="sec-select" id="sec-select-${c.code}" onchange="changeSimCourseSection('${c.code}', this.value)">
                <option value="1" ${activeSec === 1 ? 'selected' : ''}>หมู่ 1 - อ.นิติพัฒน์</option>
                <option value="2" ${activeSec === 2 ? 'selected' : ''}>หมู่ 2 - อ.สุขอัญญะ</option>
              </select>
            </div>
            <div style="font-family: monospace; font-weight: 700; color: var(--text-muted);">
              ⏰ ${sections[activeSec - 1].timeStr}
            </div>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            ${isAdded 
              ? `<button class="sim-btn sim-btn-danger" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 10px;" onclick="removeSimCourse('${c.code}')">นำออก -</button>` 
              : `<button class="sim-btn" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 10px;" onclick="addSimCourse('${c.code}')">ลงตารางเรียน +</button>`
            }
          </div>
        </div>
      `;
    }).join('') : `<div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">✕ ไม่พบวิชาที่ค้นหาในหมวดนี้</div>`;
  }
}

function addSimCourse(courseCode) {
  const course = ALL_COURSES.find(c => c.code === courseCode);
  if (!course) return;

  // 1. เช็คหน่วยกิตเกิน 22
  let totalCredits = course.credits;
  trialState.selectedCourses.forEach(item => {
    const c = ALL_COURSES.find(x => x.code === item.courseCode);
    if (c) totalCredits += c.credits;
  });

  if (totalCredits > 22) {
    showToast(`⚠️ ลงวิชาเพิ่มไม่ได้! เนื่องจากหน่วยกิตจำลองรวมจะเกิน 22 หน่วยกิต`, 'err');
    
    // Spring shaking effect
    const meter = document.getElementById('creditsMeter');
    if (meter) {
      meter.classList.add('shake-effect');
      setTimeout(() => meter.classList.remove('shake-effect'), 500);
    }
    return;
  }

  // 2. ดึงค่าเซกชันที่เลือกอยู่
  const secSelect = document.getElementById(`sec-select-${courseCode}`);
  const secNo = secSelect ? parseInt(secSelect.value) : 1;

  // 3. เช็คตารางเรียนชนกัน
  const conflict = checkScheduleConflict(course, secNo);
  if (conflict.conflict) {
    showToast(`⚠️ คาบเรียนชนกับวิชา: ${conflict.conflictingCourse.name} (${conflict.timeStr})`, 'err');
    
    // เอฟเฟกต์การสั่นที่การ์ดตัวปัญหา
    const card = document.getElementById(`card-${courseCode}`);
    if (card) {
      card.classList.add('shake-effect');
      setTimeout(() => card.classList.remove('shake-effect'), 500);
    }
    return;
  }

  // 4. เช็ควิชาตัวต่อ
  const prereq = checkCoursePrerequisites(course);
  if (!prereq.passed) {
    showToast(`⚠️ คำเตือน! วิชานี้ยังมีวิชาตัวต่อที่ยังไม่ผ่านเกณฑ์: ${prereq.missing.join(', ')}`, 'warn');
  }

  // เพิ่มวิชาเข้าตาราง
  trialState.selectedCourses.push({
    courseCode: course.code,
    secNo: secNo
  });
  
  saveTrialState();
  
  // เสียงปิ๊งเบาๆ เมื่อเพิ่มสำเร็จ
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
    gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}

  render();
}

function removeSimCourse(courseCode) {
  trialState.selectedCourses = trialState.selectedCourses.filter(x => x.courseCode !== courseCode);
  saveTrialState();
  
  // เสียงเบาๆ เมือนำออก
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}

  render();
}

function changeSimCourseSection(courseCode, secValue) {
  const secNo = parseInt(secValue);
  const userSelectIdx = trialState.selectedCourses.findIndex(x => x.courseCode === courseCode);
  
  if (userSelectIdx !== -1) {
    // เช็คก่อนว่าเซกชันใหม่ชนไหม
    const course = ALL_COURSES.find(c => c.code === courseCode);
    const conflict = checkScheduleConflict(course, secNo);
    
    if (conflict.conflict) {
      showToast(`⚠️ คาบเรียนเซคชัน 2 ชนกับวิชา: ${conflict.conflictingCourse.name} (${conflict.timeStr})`, 'err');
      
      // ย้อนเซกกลับไปค่าเดิม
      render();
      return;
    }
    
    trialState.selectedCourses[userSelectIdx].secNo = secNo;
    saveTrialState();
    render();
  } else {
    // ถ้ายังไม่ได้เพิ่มวิชาลงตาราง แค่อัปเดตการแสดงผลในหน้าจอ Explorer
    const sections = getCourseSections(ALL_COURSES.find(c => c.code === courseCode));
    const label = document.querySelector(`#card-${courseCode} .sec-row div:last-child`);
    if (label) {
      label.textContent = `⏰ ${sections[secNo - 1].timeStr}`;
    }
  }
}

// -------------------------------------------------------------
// RECEIPT PRINTER & SCANNER ANIMATION
// -------------------------------------------------------------

function triggerSimReceiptPrinting() {
  const wrap = document.getElementById('receiptWrapper');
  const paper = document.getElementById('receiptPaper');
  if (!wrap || !paper) return;

  // เคลียร์สถานะฉีก
  paper.classList.remove('receipt-tear-away');
  wrap.style.display = 'block';
  paper.style.maxHeight = '0px';
  
  // เริ่มเสียงฟึ่ดฟึ่ดของหัวเข็มเครื่องพิมพ์
  let currentHeight = 0;
  const targetHeight = 850; // ความสูงคาดการณ์ของเอกสารใบเสร็จทั้งหมด
  const printInterval = setInterval(() => {
    currentHeight += 12;
    paper.style.maxHeight = currentHeight + 'px';
    
    // เล่นเสียง Printer หัวเข็มดึ๊ดดึ๊ดเป็นช่วงๆ
    playPrinterSound();

    if (currentHeight >= targetHeight) {
      clearInterval(printInterval);
      playSuccessSound();
      showToast('🎉 พิมพ์ใบสรุปการลงทะเบียนเรียนสำเร็จ! คลิกปุ่มด้านล่างเพื่อฉีกกระดาษครับ', 'success');
      
      // เลื่อนจอไปหาใบเสร็จให้สวยงาม
      wrap.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, 50);
}

// -------------------------------------------------------------
// 3D PAPER TEAR & IMAGE DOWNLOAD
// -------------------------------------------------------------

async function tearOffSimReceipt() {
  const paper = document.getElementById('receiptPaper');
  if (!paper) return;

  // 1. สังเคราะห์เสียงฉีกกระดาษฟั่บ!
  playTearSound();

  // 2. สั่นหน้าจอสร้างความฉีกขาดจริงแบบ Haptic visual
  paper.classList.add('receipt-tear-away');

  // 3. เริ่มจับภาพ Canvas และแปลงไฟล์ส่งออก
  if (typeof html2canvas !== 'undefined') {
    showToast('💾 กำลังฉีกและเรนเดอร์ใบเสร็จสวยงาม...', 'success');
    
    setTimeout(async () => {
      try {
        // เรนเดอร์ Element ใบสรุปผลด้วยสเกลความชัดสูง
        const canvas = await html2canvas(paper, {
          backgroundColor: '#fafaf6',
          scale: 2,
          logging: false
        });

        // สร้างลิงก์ดาวน์โหลด
        const link = document.createElement('a');
        link.download = `Receipt_Registration_Plan_Semester_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showToast('💾 ดาวน์โหลดไฟล์แผนสรุปเรียนเสร็จเรียบร้อย! ขอให้โชคดีในเทอมหน้าครับ 🌟', 'success');
      } catch (err) {
        console.error("html2canvas error", err);
        showToast('❌ การเซฟภาพล้มเหลว', 'err');
      }
    }, 450); // รอจังหวะแอนิเมชันกระดาษปลิวพริ้วปลิว
  } else {
    showToast('⚠️ ไม่สามารถแปลงรูปภาพได้ (ไม่พบไลบรารี html2canvas)', 'err');
  }
}

// ฟังก์ชันผูกมัด Event ของหน้าต่างนี้ (เรียกโดย attachAllEvents)
function attachTrialRegEvents() {
  console.log("Attached trial-reg events successfully.");
}
