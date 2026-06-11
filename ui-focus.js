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
        <div style="display:flex; gap:10px; margin-top:5px; flex-wrap:wrap;">
           <button class="nb-btn sm ${Radio.mode === 'lofi' ? 'active' : ''}" onclick="Radio.mode='lofi'; render();">📻 LOFI Station</button>
           <button class="nb-btn sm ${Radio.mode === 'groove' ? 'active' : ''}" onclick="Radio.mode='groove'; render();">🎷 GROOVE Mix</button>
        </div>
        <div style="margin-top:10px;">
          <input type="file" id="customRadioUpload" accept="audio/mpeg, audio/mp3, audio/wav" style="display:none;" onchange="handleCustomRadioUpload(this)">
          <button class="nb-btn sm" onclick="document.getElementById('customRadioUpload').click()">🎵 เพิ่มเพลงของคุณเอง</button>
          ${state.customMusicUrls && state.customMusicUrls.length > 0 ? `<div style="font-size:12px; color:#64748b; margin-top:5px;">เพิ่มแล้ว ${state.customMusicUrls.length} เพลง <button class="icon-btn-sm" onclick="clearCustomRadio()" style="color:#ef4444;">🗑️</button></div>` : ''}
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

window.handleCustomRadioUpload = async (input) => {
  const file = input.files[0];
  if (!file) return;
  if (!window.uploadToFirebaseStorage) {
    alert("Firebase Storage ไม่พร้อมใช้งาน");
    return;
  }
  showToast('📤 กำลังอัปโหลดเพลง...', 'info');
  try {
    const ext = file.name.split('.').pop();
    const path = `radio/${Date.now()}_${file.name}`;
    const url = await window.uploadToFirebaseStorage(file, path);
    if (!state.customMusicUrls) state.customMusicUrls = [];
    state.customMusicUrls.push(url);
    await fsSet('app_settings', 'radio', { customMusicUrls: state.customMusicUrls });
    showToast('✅ อัปโหลดเพลงสำเร็จ');
    render();
  } catch (err) {
    showToast(`❌ อัปโหลดเพลงไม่สำเร็จ: ${err.message}`, 'err');
  }
};

window.clearCustomRadio = async () => {
  if (!confirm("ยืนยันลบเพลงที่อัปโหลดเองทั้งหมด?")) return;
  showToast('🗑 กำลังลบเพลง...', 'info');
  try {
    if (window.deleteFromFirebaseStorage && state.customMusicUrls) {
      for (const url of state.customMusicUrls) {
        await window.deleteFromFirebaseStorage(url);
      }
    }
    state.customMusicUrls = [];
    await fsSet('app_settings', 'radio', { customMusicUrls: state.customMusicUrls });
    showToast('✅ ลบเพลงทั้งหมดแล้ว');
    render();
  } catch (err) {
    showToast(`❌ ลบเพลงไม่สำเร็จ: ${err.message}`, 'err');
  }
};
