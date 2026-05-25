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
  if (typeof state === 'undefined') return;
  if (!document.fullscreenElement && state.isImmersiveFocus && state.pomodoroActive) {
    handleFocusDistraction("ออกจากโหมดเต็มหน้าจอ");
  }
});

document.addEventListener('visibilitychange', () => {
  if (typeof state === 'undefined') return;
  if (document.hidden && state.isImmersiveFocus && state.pomodoroActive) {
    handleFocusDistraction("มีการสลับหน้าจอ/แอป");
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

function getReflectionText(courseId) {
  const dateKey = new Date().toLocaleDateString('en-CA');
  const refData = state.reflections[courseId];
  if (!refData) return '';
  if (typeof refData === 'object') {
    return refData[dateKey] || refData.latest || '';
  }
  return refData; // legacy string
}
window.getReflectionText = getReflectionText;

async function saveReflectionData(courseId, val) {
  const dateKey = new Date().toLocaleDateString('en-CA');
  if (typeof state.reflections[courseId] !== 'object' || state.reflections[courseId] === null) {
    state.reflections[courseId] = {};
  }
  state.reflections[courseId][dateKey] = val;
  state.reflections[courseId].latest = val;
  localStorage.setItem('reflections', JSON.stringify(state.reflections));
  
  try {
    await fsSet('reflections', courseId, state.reflections[courseId]);
  } catch (e) {
    console.warn("Firestore reflection sync failed", e);
  }
}
window.saveReflectionData = saveReflectionData;

function getMissingReflections() {
  const now = new Date();
  const dateKey = now.toLocaleDateString('en-CA');
  const dayIdx = getTodayDayIndex();
  const currentTimeVal = now.getHours() + (now.getMinutes() / 60);
  const curSem = getCurrentSemester();
  if (!curSem) return [];

  const todayClasses = (state.courses[curSem.id] || []).flatMap(c =>
    (c.schedules || c.schedule || []).filter(s => s.day === dayIdx).map(s => ({ ...c, slot: s }))
  );

  return todayClasses.filter(c => {
    const text = getReflectionText(c.id);
    return currentTimeVal >= c.slot.endHour && text.trim().length < 10;
  });
}

function render() {
  if (state.isInitializing) return;

  // Intercept Public Shared document links
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('share')) {
    const shareVal = urlParams.get('share');
    if (shareVal && shareVal.startsWith('nitipat/')) {
      const slug = shareVal.substring(8); // Extract slug after 'nitipat/'
      renderPublicSharePortal(slug);
      return;
    }
  }

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
    <div class="fm-container">
      <div class="fm-header">
        <div class="fm-title-group">
          <div class="brand-orb sm">⚗</div>
          <div class="fm-brand-title">NITIPAT HUB</div>
        </div>
        <button class="icon-btn" id="closeMenuBtn">✕</button>
      </div>
      
      <div class="fm-sections-wrapper">
        <!-- 🎓 Academic Core Cluster -->
        <div class="fm-card-cluster cluster-academic">
          <div class="cluster-header">
            <span class="cluster-icon">🎓</span>
            <span class="cluster-title">Academic Core</span>
          </div>
          <div class="cluster-grid">
            <button class="fm-item-v2 ${state.view === 'dashboard' ? 'active' : ''}" data-nav="dashboard">
              <span class="fm-ic-v2">◈</span>
              <span class="fm-lbl-v2">Dashboard</span>
            </button>
            <button class="fm-item-v2 ${state.view === 'schedule' ? 'active' : ''}" data-nav="schedule">
              <span class="fm-ic-v2">📅</span>
              <span class="fm-lbl-v2">ตารางเรียนหลัก</span>
            </button>
            <button class="fm-item-v2 ${state.view === 'courses' ? 'active' : ''}" data-nav="courses">
              <span class="fm-ic-v2">📚</span>
              <span class="fm-lbl-v2">รายวิชาเรียน</span>
            </button>
            <button class="fm-item-v2 ${state.view === 'roadmap' ? 'active' : ''}" data-nav="roadmap">
              <span class="fm-ic-v2">🗺</span>
              <span class="fm-lbl-v2">Roadmap 4 ปี</span>
            </button>
            <button class="fm-item-v2 ${state.view === 'grades' ? 'active' : ''}" data-nav="grades">
              <span class="fm-ic-v2">🎓</span>
              <span class="fm-lbl-v2">เกรด & GPAX</span>
            </button>
            <button class="fm-item-v2 ${state.view === 'semesters' ? 'active' : ''}" data-nav="semesters">
              <span class="fm-ic-v2">🏫</span>
              <span class="fm-lbl-v2">เทอมการศึกษา</span>
            </button>
            <button class="fm-item-v2 ${state.view === 'trial-reg' ? 'active' : ''}" data-nav="trial-reg" style="grid-column: span 2;">
              <span class="fm-ic-v2">🎫</span>
              <span class="fm-lbl-v2">จำลองการลงทะเบียน (Simulator)</span>
            </button>
          </div>
        </div>

        <!-- 📝 Tasks & Performance Cluster -->
        <div class="fm-card-cluster cluster-tasks">
          <div class="cluster-header">
            <span class="cluster-icon">📝</span>
            <span class="cluster-title">Tasks & Focus</span>
          </div>
          <div class="cluster-grid">
            <button class="fm-item-v2 ${state.view === 'assignments' ? 'active' : ''}" data-nav="assignments">
              <span class="fm-ic-v2">📋</span>
              <span class="fm-lbl-v2">การบ้าน / งาน</span>
            </button>
            <button class="fm-item-v2 ${state.view === 'exams' ? 'active' : ''}" data-nav="exams">
              <span class="fm-ic-v2">📝</span>
              <span class="fm-lbl-v2">ตารางสอบ</span>
            </button>
            <button class="fm-item-v2 ${state.view === 'calendar' ? 'active' : ''}" data-nav="calendar">
              <span class="fm-ic-v2">🗓</span>
              <span class="fm-lbl-v2">ปฏิทินงานรวม</span>
            </button>
            <button class="fm-item-v2 ${state.view === 'club' ? 'active' : ''}" data-nav="club">
              <span class="fm-ic-v2">🏛</span>
              <span class="fm-lbl-v2">งานชุมนุม</span>
            </button>
            <button class="fm-item-v2 ${state.view === 'focus' ? 'active' : ''}" data-nav="focus">
              <span class="fm-ic-v2">🍅</span>
              <span class="fm-lbl-v2">โหมดสมาธิ (Focus)</span>
            </button>
            <button class="fm-item-v2 ${state.view === 'alarm' ? 'active' : ''}" data-nav="alarm">
              <span class="fm-ic-v2">🔔</span>
              <span class="fm-lbl-v2">ระบบนาฬิกาปลุก</span>
            </button>
          </div>
        </div>

        <!-- 💸 Student Life & Vault Cluster -->
        <div class="fm-card-cluster cluster-life">
          <div class="cluster-header">
            <span class="cluster-icon">💸</span>
            <span class="cluster-title">Student Life & Vault</span>
          </div>
          <div class="cluster-grid">
            <button class="fm-item-v2 ${state.view === 'money-pod' ? 'active' : ''}" data-nav="money-pod">
              <span class="fm-ic-v2">🐽</span>
              <span class="fm-lbl-v2">MoneyPod การเงิน</span>
            </button>
            <button class="fm-item-v2 ${state.view === 'ilm' ? 'active' : ''}" data-nav="ilm">
              <span class="fm-ic-v2">💼</span>
              <span class="fm-lbl-v2">ฝึกงาน & สิทธิ์ (ILM)</span>
            </button>
            <button class="fm-item-v2" onclick="showIDCardModal(); document.getElementById('fullMenu')?.classList.remove('show');">
              <span class="fm-ic-v2">🪪</span>
              <span class="fm-lbl-v2">บัตรนิสิต Digital ID</span>
            </button>
          </div>
        </div>

        <!-- ⚙️ App Hub & Preferences Cluster -->
        <div class="fm-card-cluster cluster-settings">
          <div class="cluster-header">
            <span class="cluster-icon">⚙️</span>
            <span class="cluster-title">Preferences</span>
          </div>
          <div class="cluster-grid">
            <button class="fm-item-v2 ${state.view === 'settings' ? 'active' : ''}" data-nav="settings" style="grid-column: span 3;">
              <span class="fm-ic-v2">⚙️</span>
              <span class="fm-lbl-v2">ตั้งค่าระบบ & โปรไฟล์</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`

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

function renderPublicSharePortal(slug) {
  const app = document.getElementById('app');
  if (!app) return;
  
  // Hide login gate immediately
  const gate = document.getElementById('login-gate');
  if (gate) gate.classList.add('inactive');
  
  // Show loading spinner while fetching from Firestore
  if (!state.ilmFilesLoadedFromServer) {
    app.innerHTML = `
      <div style="font-family:'Kanit', 'Sarabun', sans-serif; min-height:100vh; background:#0f172a; display:flex; align-items:center; justify-content:center; flex-direction:column; color:white;">
        <div class="spinner" style="margin-bottom:20px; width:40px; height:40px; border:4px solid rgba(255,255,255,0.1); border-top-color:#3b82f6; border-radius:50%; animation:spin 1s linear infinite;"></div>
        <style>@keyframes spin { 100% { transform:rotate(360deg); } }</style>
        <div style="font-weight:600; letter-spacing:1px; font-size:1.1rem; color:#94a3b8;">กำลังค้นหาเอกสารจากฐานข้อมูล...</div>
      </div>
    `;
    return;
  }
  
  // Initialize files state if empty
  if (!state.ilmFiles || state.ilmFiles.length === 0) {
    state.ilmFiles = JSON.parse(localStorage.getItem('ilm_files') || '[]');
  }
  
  const item = state.ilmFiles.find(f => f.slug === slug);
  
  if (!item) {
    app.innerHTML = `
      <div style="font-family:'Kanit', 'Sarabun', sans-serif; min-height:100vh; background:#0f172a; color:#f8fafc; display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;">
        <div class="glass-card" style="max-width:500px; width:100%; text-align:center; padding:40px 20px; border-radius:24px; border:1px solid rgba(255,255,255,0.1); background:rgba(30,41,59,0.7); backdrop-filter:blur(15px); box-sizing:border-box;">
          <div style="font-size:4rem; margin-bottom:20px;">🔍❌</div>
          <h3 style="font-size:1.4rem; font-weight:700; color:#fb7185; margin:0 0 10px 0;">ไม่พบเอกสารที่แชร์</h3>
          <p style="font-size:0.9rem; color:#94a3b8; line-height:1.6; margin-bottom:25px;">
            ลิงก์แชร์อาจจะไม่ถูกต้อง หรือเอกสารนี้ถูกเจ้าของบัญชี (นาย นิติพัฒน์ ทิพย์ชัย) ลบออกจากระบบคลังเอกสารฝึกงานเรียบร้อยแล้ว
          </p>
          <a href="${window.location.origin}${window.location.pathname}" style="display:inline-block; text-decoration:none; background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:white; padding:12px 30px; border-radius:30px; font-weight:700; font-size:0.9rem; box-shadow:0 8px 20px rgba(59,130,246,0.3);">เข้าสู่หน้าเข้าสู่ระบบหลัก</a>
        </div>
      </div>
    `;
    return;
  }
  
  state.ilmSharedUnlocked = state.ilmSharedUnlocked || {};
  
  const password = item.password || '';
  if (password && !state.ilmSharedUnlocked[item.id]) {
    app.innerHTML = `
      <div style="font-family:'Kanit', 'Sarabun', sans-serif; min-height:100vh; background:#0f172a; color:#f8fafc; display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;">
        <div class="glass-card" style="max-width:460px; width:100%; text-align:center; padding:40px 25px; border-radius:24px; border:1px solid rgba(255,255,255,0.1); background:rgba(30,41,59,0.7); backdrop-filter:blur(15px); box-shadow:0 15px 35px rgba(0,0,0,0.3); box-sizing:border-box;">
          <div style="font-size:3.5rem; margin-bottom:15px; animation: pulse 2s infinite;">🔐</div>
          <h3 style="font-size:1.3rem; font-weight:700; color:#f8fafc; margin:0 0 10px 0;">เอกสารได้รับการคุ้มครองความปลอดภัย</h3>
          <p style="font-size:0.85rem; color:#94a3b8; line-height:1.6; margin-bottom:25px;">
            เอกสารของ **นาย นิติพัฒน์ ทิพย์ชัย** ชิ้นนี้ได้รับการป้องกันสิทธิ์ส่วนบุคคล กรุณากรอกรหัสผ่านเพื่อตรวจสอบและรับชมตัวอย่างเอกสาร
          </p>
          
          <div style="margin-bottom:20px; text-align:left;">
            <label style="display:block; font-size:0.8rem; font-weight:600; color:#cbd5e1; margin-bottom:8px;">ป้อนรหัสผ่านสำหรับเอกสารนี้ (Document Password):</label>
            <input type="password" id="shared-pass-input" placeholder="กรอกรหัสผ่าน..." style="width:100%; padding:12px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.15); background:rgba(15,23,42,0.6); color:white; font-size:1rem; outline:none; text-align:center; font-family:monospace; letter-spacing:3px;">
          </div>
          
          <button onclick="unlockPublicSharedFile('${item.id}', '${password}')" style="width:100%; background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:white; border:none; padding:14px; border-radius:12px; font-weight:700; font-size:0.95rem; cursor:pointer; box-shadow:0 8px 20px rgba(59,130,246,0.3); transition:all 0.2s ease;">
            🔓 ปลดล็อคเข้าดูเอกสาร
          </button>
        </div>
      </div>
    `;
    return;
  }
  
  let previewHTML = '';
  const isPdf = item.name.toLowerCase().endsWith('.pdf') || item.mimeType === 'application/pdf';
  const isImage = item.name.toLowerCase().endsWith('.png') || item.name.toLowerCase().endsWith('.jpg') || item.mimeType.startsWith('image/');
  
  if (isImage) {
    if (item.data && item.data.startsWith('data:image')) {
      previewHTML = `<div style="text-align:center;"><img src="${item.data}" style="max-width:100%; max-height:450px; border-radius:12px; box-shadow:0 8px 25px rgba(0,0,0,0.15);"></div>`;
    } else {
      previewHTML = `
        <div style="border:1.5px dashed rgba(255,255,255,0.15); border-radius:16px; padding:40px 20px; text-align:center; background:rgba(15,23,42,0.4);">
          <div style="font-size:4rem; margin-bottom:15px;">📜</div>
          <h4 style="font-weight:700; color:#10b981; font-size:1.2rem; margin:0 0 10px 0;">ใบรับรองการอบรมกฎความปลอดภัยคลังเชื้อเพลิง</h4>
          <p style="font-size:0.85rem; color:#94a3b8; line-height:1.6; max-width:400px; margin:0 auto 20px auto;">ใบรับรองการผ่านการอบรมกฎระเบียบเซฟตี้พลังงาน 100% จากสถานีบริการและคลัง LPG ในเขต Energy Complex มก.</p>
          <div style="font-size:0.75rem; background:rgba(0,0,0,0.2); padding:12px; border-radius:10px; font-family:monospace; display:inline-block; text-align:left; border:1px solid rgba(255,255,255,0.05);">
            Verification Code: SEC-2569-KU-DOEB<br>
            ตรวจสอบแล้ว: Mr. Nitipat Tipchai<br>
            หน่วยงานยื่นรับรอง: กรมธุรกิจพลังงาน
          </div>
        </div>
      `;
    }
  } else if (isPdf) {
    if (item.data && item.data !== 'mock_pdf_resume_data' && item.data !== 'mock_pdf_transcript_data' && item.data !== 'large_file_placeholder_base64') {
      previewHTML = `
        <div style="text-align:center; width:100%;">
          <embed src="${item.data}" type="application/pdf" style="width:100%; height:450px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
        </div>
      `;
    } else if (item.id === 'f_resume' || item.data === 'mock_pdf_resume_data') {
      previewHTML = `
        <div style="background:#fff; color:#333; padding:25px; border-radius:16px; border:1px solid #ddd; font-family:Sarabun, sans-serif; font-size:0.85rem; line-height:1.5; max-height:420px; overflow-y:auto; box-shadow:0 10px 30px rgba(0,0,0,0.1); text-align:left; position:relative; box-sizing:border-box;">
          <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-30deg); font-size:4rem; font-weight:900; color:rgba(30,58,138,0.04); pointer-events:none; white-space:nowrap; text-align:center;">KASETSART UNIVERSITY<br>MATERIALS ENG</div>
          
          <div style="text-align:center; border-bottom:2px solid #1e3a8a; padding-bottom:12px; margin-bottom:18px;">
            <h3 style="margin:0 0 4px 0; color:#1e3a8a; font-weight:800; font-size:1.35rem; letter-spacing:0.5px;">NITIPAT TIPCHAI</h3>
            <p style="margin:0; font-size:0.8rem; color:#555; font-weight:600;">Materials Engineering Student | Kasetsart University</p>
            <p style="margin:4px 0 0 0; font-size:0.75rem; color:#777;">Tel: [เบอร์โทรของคุณ] | Email: doeb-hr@doeb.go.th</p>
          </div>
          <div style="margin-bottom:15px;">
            <h4 style="margin:0 0 6px 0; color:#1e3a8a; font-weight:700; font-size:0.95rem; border-bottom:1.5px solid #eee; padding-bottom:2px;">EDUCATION</h4>
            <strong>Kasetsart University</strong> — B.Eng. in Materials Engineering (Current GPAX: ${getCumGPA()})
          </div>
          <div style="margin-bottom:15px;">
            <h4 style="margin:0 0 6px 0; color:#1e3a8a; font-weight:700; font-size:0.95rem; border-bottom:1.5px solid #eee; padding-bottom:2px;">KEY COURSES</h4>
            Thermodynamics of Materials, Mechanical Behavior of Materials, Corrosion of Materials
          </div>
          <div style="margin-bottom:15px;">
            <h4 style="margin:0 0 6px 0; color:#1e3a8a; font-weight:700; font-size:0.95rem; border-bottom:1.5px solid #eee; padding-bottom:2px;">PROJECTS & COMPETENCIES</h4>
            * Cathodic Protection studies for Underground Pipelines<br>
            * Ultrasonic NDT simulation tests for steel pressure welds
          </div>
        </div>
      `;
    } else if (item.id === 'f_transcript' || item.data === 'mock_pdf_transcript_data') {
      previewHTML = `
        <div style="background:#fff; color:#333; padding:25px; border-radius:16px; border:1px solid #ddd; font-family:Sarabun, sans-serif; font-size:0.8rem; line-height:1.4; max-height:420px; overflow-y:auto; box-shadow:0 10px 30px rgba(0,0,0,0.1); text-align:left; position:relative; box-sizing:border-box;">
          <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-30deg); font-size:3.5rem; font-weight:900; color:rgba(180,83,9,0.04); pointer-events:none; white-space:nowrap; text-align:center;">KASETSART UNIVERSITY<br>OFFICIAL VERIFIED</div>
          
          <div style="text-align:center; border-bottom:2.5px solid #b45309; padding-bottom:10px; margin-bottom:15px;">
            <h4 style="margin:0 0 2px 0; color:#b45309; font-weight:800; font-size:1.2rem; letter-spacing:0.5px;">KASETSART UNIVERSITY TRANSCRIPT</h4>
            <p style="margin:0; font-size:0.75rem; color:#555; font-weight:600;">Official Grade Report - Mr. Nitipat Tipchai</p>
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:0.7rem;">
            <thead>
              <tr style="border-bottom:1.8px solid #333; font-weight:700;">
                <td style="padding:5px 0;">COURSE</td>
                <td style="padding:5px 0;">TITLE</td>
                <td style="padding:5px 0; text-align:center;">GRADE</td>
                <td style="padding:5px 0; text-align:center;">CREDITS</td>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(STUDENT.existingGrades).slice(0, 10).map(code => {
                const g = STUDENT.existingGrades[code];
                return `
                  <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:5px 0; font-family:monospace; font-weight:bold;">${code}</td>
                    <td style="padding:5px 0; color:#555;">Materials Course ${code}</td>
                    <td style="padding:5px 0; text-align:center; font-weight:800; color:#1e3a8a;">${g.grade}</td>
                    <td style="padding:5px 0; text-align:center;">${g.credits}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div style="border-top:1.8px solid #333; padding-top:8px; margin-top:12px; display:flex; justify-content:space-between; font-weight:800; font-size:0.75rem; color:#1e3a8a;">
            <span>TOTAL PASSED CREDITS: ${getTotalPassedCredits()} CR</span>
            <span>GPAX: ${getCumGPA()}</span>
          </div>
        </div>
      `;
    } else {
      previewHTML = `
        <div style="border:1.5px dashed rgba(255,255,255,0.15); border-radius:16px; padding:40px 20px; text-align:center; background:rgba(15,23,42,0.4);">
          <div style="font-size:4rem; margin-bottom:15px;">📂</div>
          <h4 style="font-weight:700; color:#3b82f6; font-size:1.2rem; margin:0 0 10px 0;">${item.name}</h4>
          <p style="font-size:0.85rem; color:#94a3b8; line-height:1.6; margin-bottom:10px;">ขนาดของไฟล์: ${item.size} | ประเภท: ${item.mimeType || 'เอกสารทั่วไป'}</p>
          <p style="font-size:0.75rem; color:#eab308; font-weight:600;">(เนื่องจากขนาดของไฟล์เกินขีดจำกัดความจำถาวรท้องถิ่น ระบบจะทำการตรวจสอบแบบลายน้ำเชิงลึกผ่าน metadata ส่วนกลาง)</p>
        </div>
      `;
    }
  } else {
    previewHTML = `
      <div style="border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:30px 15px; text-align:center; background:rgba(15,23,42,0.4);">
        <div style="font-size:3.5rem; margin-bottom:10px;">📝</div>
        <h4 style="font-weight:700; font-size:1.15rem; margin:0 0 5px 0; color:#f8fafc;">${item.name}</h4>
        <p style="font-size:0.85rem; color:#94a3b8;">${item.size} | ${item.mimeType || 'เอกสารทั่วไป'}</p>
      </div>
    `;
  }
  
  app.innerHTML = `
    <div style="font-family:'Kanit', 'Sarabun', sans-serif; min-height:100vh; background:#0f172a; color:#f8fafc; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:24px 16px; box-sizing:border-box;">
      
      <!-- Top identity bar -->
      <div style="max-width:640px; width:100%; display:flex; align-items:center; gap:14px; margin-bottom:20px; background:rgba(30,41,59,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:12px 16px; box-sizing:border-box; backdrop-filter:blur(12px);">
        <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#3b82f6,#1d4ed8); display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0;">👤</div>
        <div style="flex:1; text-align:left;">
          <div style="font-size:1rem; font-weight:800; color:#f8fafc;">นายนิติพัฒน์ ทิพย์ชัย</div>
          <div style="font-size:0.75rem; color:#94a3b8; margin-top:1px;">รหัสนิสิต 20067105527480 · วิศวกรรมวัสดุ ชั้นปีที่ 3</div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <div style="background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); color:#10b981; font-size:0.65rem; font-weight:700; padding:3px 8px; border-radius:6px; letter-spacing:0.5px;">✓ VERIFIED</div>
        </div>
      </div>

      <!-- Main Viewer Card -->
      <div style="max-width:640px; width:100%; padding:24px; border-radius:20px; border:1px solid rgba(255,255,255,0.1); background:rgba(30,41,59,0.65); backdrop-filter:blur(20px); box-shadow:0 20px 45px rgba(0,0,0,0.3); box-sizing:border-box;">
        
        <!-- File name header -->
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:18px; text-align:left;">
          <span style="font-size:1.8rem;">${item.name.toLowerCase().endsWith('.pdf') ? '📄' : (item.mimeType && item.mimeType.startsWith('image/') ? '🖼️' : '📝')}</span>
          <div>
            <div style="font-size:1rem; font-weight:800; color:#f8fafc; word-break:break-word;">${item.name}</div>
            <div style="font-size:0.72rem; color:#64748b; margin-top:2px;">${item.size}</div>
          </div>
        </div>

        <!-- Document Preview -->
        <div style="margin-bottom:20px;">
          ${previewHTML}
        </div>
        
        <!-- Download Button only -->
        <button onclick="downloadPublicSharedFileDirect('${item.id}', '${item.name}', '${item.mimeType}')" style="width:100%; background:linear-gradient(135deg, #10b981, #047857); color:white; border:none; padding:14px; border-radius:12px; font-weight:700; font-size:0.9rem; cursor:pointer; box-shadow:0 6px 15px rgba(16,185,129,0.3); transition:all 0.2s ease; display:flex; align-items:center; justify-content:center; gap:8px;">
          ⬇️ ดาวน์โหลดไฟล์ตัวจริง
        </button>
      </div>
    </div>
  `;
}

function unlockPublicSharedFile(itemId, password) {
  const val = document.getElementById('shared-pass-input').value.trim();
  if (val === password) {
    state.ilmSharedUnlocked = state.ilmSharedUnlocked || {};
    state.ilmSharedUnlocked[itemId] = true;
    render();
  } else {
    alert("❌ รหัสผ่านป้องกันเอกสารไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้งครับ");
  }
}

function downloadPublicSharedFileDirect(fileId, name, mimeType) {
  const item = state.ilmFiles.find(f => f.id === fileId);
  const a = document.createElement('a');
  if (item && item.data && item.data.startsWith('data:')) {
    a.href = item.data;
  } else {
    const blob = new Blob(["Simulated Document Data for Mr. Nitipat TIPCHAI - Materials Engineering, KU"], { type: mimeType || 'text/plain' });
    a.href = URL.createObjectURL(blob);
  }
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
    case 'ilm': return renderILMPage();
    case 'trial-reg': return renderTrialReg();

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
             <button class="nav-tab-btn ${tab === 'Notion' ? 'active' : ''}" onclick="state.activeHubTab='Notion'; render();">
               <div style="font-size:26px; ${tab !== 'Notion' ? 'opacity:0.8;' : 'margin-bottom:2px;'}">📓</div>
               ${tab === 'Notion' ? '<div class="tab-label">Notion</div>' : ''}
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
              tab === 'Notion' ? renderNotionTab(c) :
              tab === 'Grades' ? renderCourseProgress(c) :
              tab === 'Attendance' ? renderCourseAttendance(c) :
              renderCourseSettings(c)}
          </div>
        </div>
      `;
}

function renderNotionTab(c) {
  const isSynced = !!c.notionUrl;
  
  if (!state.notebooks[c.id] || state.notebooks[c.id].length === 0) {
    state.notebooks[c.id] = [
      {
        id: 'nb_default_' + c.id,
        name: 'สมุดหลัก: ' + c.nameTh,
        coverColor: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        driveUrl: c.driveUrl || '',
        notionUrl: c.notionUrl || ''
      }
    ];
    localStorage.setItem('notebooks', JSON.stringify(state.notebooks));
  }

  const notebooksList = state.notebooks[c.id] || [];

  return `
    <style>
      .bookshelf-container {
        padding: 24px;
        border-radius: 24px;
        background: rgba(255,255,255,0.75);
        border: 1px solid rgba(255,255,255,0.8);
        box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        font-family: 'Kanit', sans-serif;
      }
      .bookshelf-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 25px;
        padding: 24px 20px 20px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 20px;
        border: 1px dashed rgba(0, 0, 0, 0.08);
        min-height: 180px;
        align-items: flex-end;
        position: relative;
        margin-top: 15px;
      }
      .book-3d {
        width: 110px;
        height: 155px;
        border-radius: 4px 12px 12px 4px;
        position: relative;
        cursor: pointer;
        transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s ease;
        transform-style: preserve-3d;
        transform: perspective(600px) rotateY(-8deg);
        box-shadow: -4px 6px 12px rgba(0,0,0,0.15), inset 2px 0 3px rgba(255,255,255,0.3);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 14px 10px;
        color: white;
        user-select: none;
        background-size: cover !important;
        background-position: center !important;
      }
      .book-3d:hover {
        transform: perspective(600px) rotateY(15deg) translateZ(15px) translateY(-10px);
        box-shadow: -12px 18px 24px rgba(0,0,0,0.25);
      }
      .book-spine-shadow {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 10px;
        background: linear-gradient(to right, rgba(0,0,0,0.25), rgba(0,0,0,0) 90%);
        border-radius: 4px 0 0 4px;
      }
      .book-title-text {
        font-size: 11px;
        font-weight: 850;
        line-height: 1.3;
        margin-top: 5px;
        word-break: break-word;
        text-shadow: 0 1.5px 3px rgba(0,0,0,0.5);
      }
      .book-badge-icon {
        font-size: 9px;
        background: rgba(0,0,0,0.4);
        backdrop-filter: blur(4px);
        border-radius: 5px;
        padding: 2px 6px;
        font-weight: 700;
        align-self: flex-start;
        letter-spacing: 0.5px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }
    </style>

    <div class="notion-tab-container" style="padding: 0 20px 20px; font-family:'Kanit', sans-serif;">
      <div class="hub-grid" style="display:grid; grid-template-columns:1fr; gap:20px;">
        
        <!-- Shelf Card -->
        <div class="bookshelf-container">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <div style="text-align:left;">
              <h3 style="margin:0; font-size:17px; font-weight:900; color:#1f2937; display:flex; align-items:center; gap:8px;">
                <span>📚</span> ชั้นหนังสือเรียน 3D (Notion Bookshelf)
              </h3>
              <p style="margin:2px 0 0; font-size:11.5px; color:#6b7280;">รวมสมุดโน้ตเรียนและการบ้าน สามารถแบ่งได้หลายเล่ม</p>
            </div>
            <button class="btn-pastel-primary sm" onclick="window.mpCreateNotebook('${c.id}')" style="border-radius:10px; font-size:11px; padding:6px 14px;">+ สร้างสมุดใหม่</button>
          </div>

          <div class="bookshelf-grid">
            ${notebooksList.map(nb => {
              const bgStyle = nb.coverColor;
              return `
                <div class="book-3d" style="background:${bgStyle};" onclick="window.openNotebookOptions('${c.id}', '${nb.id}')">
                  <div class="book-spine-shadow"></div>
                  <div class="book-title-text">${nb.name}</div>
                  <div class="book-badge-icon">📓 Open</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Notion Hub Sync Control Card -->
        <div class="glass-card nb-card" style="padding:24px; border-radius:24px; background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.8); box-shadow:0 10px 30px rgba(0,0,0,0.02);">
          <h4 style="margin:0 0 15px; font-size:15px; font-weight:800; color:#1f2937; display:flex; align-items:center; gap:8px;">
            <span>⚙️</span> จัดการการเชื่อมโยงระบบ (Notion Settings)
          </h4>
          
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <button class="btn-glass sm" onclick="NotionHub.sync(true)" style="padding:12px; border-radius:14px; font-weight:700; font-size:12.5px;">
              🔄 สั่งซิงค์ Notion ทั้งหมด
            </button>
            <button class="btn-glass sm" onclick="NotionHub.checkConnection()" style="padding:12px; border-radius:14px; font-weight:700; font-size:12.5px;">
              🔍 ตรวจสอบการเชื่อมต่อ
            </button>
            <button class="btn-glass sm" onclick="NotionHub.setupTrigger()" style="padding:12px; border-radius:14px; font-weight:700; font-size:12.5px; grid-column: 1 / -1;">
              ⚡ เปิด-ปิด ระบบซิงค์อัตโนมัติ (Auto-Sync)
            </button>
            <button class="btn-glass sm" style="padding:12px; border-radius:14px; font-weight:700; font-size:12.5px; grid-column: 1 / -1; color:#ef4444; border-color:rgba(239,68,68,0.2); background:rgba(239,68,68,0.05);" onclick="NotionHub.forceResetSync()">
              ⚠️ บังคับยกเลิกและซิงค์ใหม่ (Force Reset)
            </button>
          </div>
          
          <div style="margin-top:20px; padding-top:15px; border-top:1px solid rgba(0,0,0,0.06); font-size:11.5px; color:#6b7280; display:flex; justify-content:space-between; align-items:center;">
            <span>อัปเดตล่าสุด: ${state.lastNotionSync ? new Date(state.lastNotionSync).toLocaleString() : 'ยังไม่เคยซิงค์'}</span>
            ${state.notionConnected ? `<span style="color:#22c55e; font-weight:700;">🟢 Online</span>` : `<span style="color:#ef4444; font-weight:700;">🔴 Offline</span>`}
          </div>
        </div>

      </div>
    </div>
  `;
}
window.renderNotionTab = renderNotionTab;

// ── 3D Bookshelf Notebook Management Handlers ──
window.mpCreateNotebook = function(courseId) {
  const name = prompt('💡 กรุณากรอกชื่อสมุดเล่มใหม่:');
  if (!name || !name.trim()) return;
  
  const presets = [
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
    'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)'
  ];
  const randomColor = presets[Math.floor(Math.random() * presets.length)];
  
  if (!state.notebooks[courseId]) state.notebooks[courseId] = [];
  
  const newNb = {
    id: 'nb_' + Date.now(),
    name: name.trim(),
    coverColor: randomColor,
    driveUrl: '',
    notionUrl: ''
  };
  
  state.notebooks[courseId].push(newNb);
  localStorage.setItem('notebooks', JSON.stringify(state.notebooks));
  render();
  showToast('📒 สร้างสมุดโน้ตสำเร็จ!');
};

window.openNotebookOptions = function(courseId, nbId) {
  const nb = state.notebooks[courseId].find(n => n.id === nbId);
  if (!nb) return;

  const presets = [
    { name: '🌅 Sunset', val: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { name: '🌲 Emerald', val: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
    { name: '🌌 Space', val: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)' },
    { name: '🌊 Ocean', val: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
    { name: '🔮 Lavender', val: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
    { name: '🌹 Crimson', val: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)' }
  ];

  let bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:14px; padding:10px; font-family:'Kanit', sans-serif;">
      <div class="fg">
        <label style="font-weight:700; font-size:12px; opacity:0.7;">ชื่อสมุดโน้ต</label>
        <input type="text" id="editNbName" class="glass-input sm full" style="width:100%; padding:8px 12px; border-radius:10px; border:1px solid #ddd;" value="${nb.name}">
      </div>
      
      <div class="fg">
        <label style="font-weight:700; font-size:12px; opacity:0.7;">เลือกสีปกสำเร็จรูป (Preset Gradient)</label>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-top:5px;">
          ${presets.map(p => `
            <button class="btn-glass sm" onclick="window.applyNbPresetCover('${courseId}', '${nbId}', '${p.val}')" style="background:${p.val}; color:white; border:none; text-shadow:0 1px 2px rgba(0,0,0,0.3); font-weight:700; height:32px; border-radius:8px; font-size:11px; cursor:pointer;">
              ${p.name}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="fg">
        <label style="font-weight:700; font-size:12px; opacity:0.7;">หรือ URL รูปหน้าปกกำหนดเอง (Custom Cover Image)</label>
        <input type="text" id="editNbCoverUrl" class="glass-input sm full" style="width:100%; padding:8px 12px; border-radius:10px; border:1px solid #ddd;" placeholder="https://example.com/image.jpg" value="${nb.coverColor.startsWith('url') ? nb.coverColor.slice(4, -1).replace(/"/g, '') : ''}" onchange="window.applyNbCustomCover('${courseId}', '${nbId}', this.value)">
      </div>

      <div class="fg">
        <label style="font-weight:700; font-size:12px; opacity:0.7;">🔗 ลิงก์ Notion</label>
        <input type="text" id="editNbNotionUrl" class="glass-input sm full" style="width:100%; padding:8px 12px; border-radius:10px; border:1px solid #ddd;" placeholder="https://notion.so/..." value="${nb.notionUrl || ''}">
      </div>

      <div class="fg">
        <label style="font-weight:700; font-size:12px; opacity:0.7;">📂 ลิงก์ Google Drive</label>
        <input type="text" id="editNbDriveUrl" class="glass-input sm full" style="width:100%; padding:8px 12px; border-radius:10px; border:1px solid #ddd;" placeholder="https://drive.google.com/..." value="${nb.driveUrl || ''}">
      </div>
      
      <div style="display:flex; gap:10px; margin-top:10px;">
        ${nb.notionUrl ? `<a href="${nb.notionUrl}" target="_blank" class="btn-pastel-primary" style="flex:1; text-align:center; padding:10px; text-decoration:none; border-radius:12px; font-weight:800; font-size:12px; display:flex; align-items:center; justify-content:center; gap:5px;">📓 เปิดใน Notion</a>` : ''}
        ${nb.driveUrl ? `<a href="${nb.driveUrl}" target="_blank" class="btn-glass-pastel" style="flex:1; text-align:center; padding:10px; text-decoration:none; border-radius:12px; font-weight:800; font-size:12px; display:flex; align-items:center; justify-content:center; gap:5px; border:1px solid #0f9d58; color:#0f9d58; background:rgba(15,157,88,0.05);">📂 เปิดใน Drive</a>` : ''}
      </div>
    </div>
  `;

  let footerHtml = `
    <div style="display:flex; justify-content:space-between; width:100%; align-items:center; font-family:'Kanit', sans-serif;">
      <button class="btn-glass-pastel" onclick="window.mpDeleteNotebook('${courseId}', '${nbId}')" style="padding: 8px 16px; border-radius:10px; color:#ef4444; border:1px solid #ef4444; background:rgba(239,68,68,0.05); font-size:12px; cursor:pointer;">🗑️ ลบสมุดเล่มนี้</button>
      <div style="display:flex; gap:8px;">
        <button class="btn-glass" onclick="closeModal()" style="padding: 8px 16px; border-radius:10px; font-size:12px; cursor:pointer; background:transparent; border:1px solid #ccc;">ยกเลิก</button>
        <button class="btn-pastel-primary" onclick="window.mpSaveNotebook('${courseId}', '${nbId}')" style="padding: 8px 20px; border-radius:10px; font-size:12px; cursor:pointer; border:none;">💾 บันทึก</button>
      </div>
    </div>
  `;

  openModal('📘 จัดการสมุดเรียน', bodyHtml, footerHtml);
};

window.applyNbPresetCover = function(courseId, nbId, coverVal) {
  const nb = state.notebooks[courseId].find(n => n.id === nbId);
  if (!nb) return;
  nb.coverColor = coverVal;
  localStorage.setItem('notebooks', JSON.stringify(state.notebooks));
  showToast('🎨 เปลี่ยนลายปกสมุดสำเร็จ!');
  const el = document.getElementById('editNbCoverUrl');
  if (el) el.value = '';
};

window.applyNbCustomCover = function(courseId, nbId, urlVal) {
  const nb = state.notebooks[courseId].find(n => n.id === nbId);
  if (!nb) return;
  if (urlVal.trim()) {
    nb.coverColor = `url("${urlVal.trim()}")`;
    localStorage.setItem('notebooks', JSON.stringify(state.notebooks));
    showToast('🖼️ ตั้งค่าหน้าปกแบบกำหนดเองสำเร็จ!');
  }
};

window.mpSaveNotebook = function(courseId, nbId) {
  const nb = state.notebooks[courseId].find(n => n.id === nbId);
  if (!nb) return;

  const newName = document.getElementById('editNbName').value.trim();
  const newNotion = document.getElementById('editNbNotionUrl').value.trim();
  const newDrive = document.getElementById('editNbDriveUrl').value.trim();

  if (!newName) {
    showToast('⚠️ กรุณาระบุชื่อสมุด', 'err');
    return;
  }

  nb.name = newName;
  nb.notionUrl = newNotion;
  nb.driveUrl = newDrive;

  localStorage.setItem('notebooks', JSON.stringify(state.notebooks));
  closeModal();
  render();
  showToast('✅ บันทึกข้อมูลสมุดสำเร็จ!');
};

window.mpDeleteNotebook = function(courseId, nbId) {
  if (confirm('⚠️ คุณแน่ใจที่จะลบสมุดเล่มนี้หรือไม่?\n(ข้อมูลลิงก์ที่บันทึกจะหายไป)')) {
    state.notebooks[courseId] = state.notebooks[courseId].filter(n => n.id !== nbId);
    localStorage.setItem('notebooks', JSON.stringify(state.notebooks));
    closeModal();
    render();
    showToast('🗑️ ลบสมุดเรียบร้อยแล้ว!');
  }
};

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
            <textarea id="reflInput_adv" class="nb-input" style="width:100%; min-height:80px; padding:10px; font-family:var(--font-body); font-size:13px;" placeholder="วันนี้เรียนรู้อะไรบ้าง?">${getReflectionText(courseId)}</textarea>
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
  try {
    await saveReflectionData(courseId, val);
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
  const previewUrl = `https://drive.google.com/file/d/${id}/preview`;

  let bodyHtml = `
    <div style="width: 100%; height: 65vh; border-radius: 12px; overflow: hidden; background: #f8fafc; border: 1px solid rgba(0,0,0,0.06); position: relative;">
      <iframe src="${previewUrl}" width="100%" height="100%" style="border: none; background: white;" allow="autoplay"></iframe>
    </div>
  `;

  openModal(name, bodyHtml, `
    <div style="display:flex; gap:10px; width:100%;">
      <button class="nb-btn-primary sm" style="flex:1;" onclick="window.open('${url || `https://drive.google.com/file/d/${id}/view`}', '_blank')">📂 เปิดใน Google Drive</button>
      <button class="nb-btn sm" style="flex:1;" onclick="downloadFileViaProxy('${id}', '${name.replace(/'/g, "\\'")}')">⬇ ดาวน์โหลด</button>
    </div>
  `);
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

