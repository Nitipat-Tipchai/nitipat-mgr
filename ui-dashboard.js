// ══════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════
function renderDashboardInternshipPhaseWidget() {
  if (typeof state.ilmProfile === 'undefined') {
    state.ilmProfile = { currentPhase: 'phase1' };
  }
  
  const activePhase = state.ilmProfile.currentPhase || 'phase1';
  let phaseTitle = '';
  let phaseDescription = '';
  let progressPercent = 0;
  
  // Custom stats for contextual helper text
  const totalLogsHours = state.ilmLogs ? state.ilmLogs.reduce((sum, log) => sum + (parseFloat(log.hours) || 0), 0) : 0;
  const quizPassed = state.ilmProfile.quizPassed || false;
  const acceptedCompany = state.ilmCompanies ? state.ilmCompanies.find(c => c.status === 'accepted') : null;
  
  switch (activePhase) {
    case 'phase1':
      phaseTitle = 'Phase 1: ค้นหา & สมัครแผนกฝึกงาน';
      phaseDescription = acceptedCompany 
        ? `ยินดีด้วย! กรมธุรกิจพลังงานตอบรับเข้าฝึกงานในแผนก <strong>${acceptedCompany.field}</strong> แล้ว เตรียมตัวสู่ขั้นตอนปฐมนิเทศ` 
        : 'อยู่ระหว่างพิจารณาติดต่อ กรมธุรกิจพลังงาน (doeb.go.th) | คลิกเพื่อจัดการแผนกเป้าหมายใน Kanban';
      progressPercent = 25;
      break;
    case 'phase2':
      phaseTitle = 'Phase 2: ปฐมนิเทศ & อบรมเซฟตี้คลังแก๊ส';
      phaseDescription = quizPassed
        ? '✓ สอบผ่านเกณฑ์เซฟตี้พลังงาน 100% แล้ว! มีสิทธิ์เข้าตอกบัตรและฝึกงาน ณ สถานประกอบการจริง'
        : '⚠️ กรุณาเข้าทำแบบทดสอบกฎความปลอดภัยคลังเชื้อเพลิง LPG/NGV (ต้องได้ 10/10 คะแนนเพื่อปลดล็อคบันทึกเวลา)';
      progressPercent = 50;
      break;
    case 'phase3':
      phaseTitle = 'Phase 3: ปฏิบัติงานตอกบัตร & งบการเงิน';
      phaseDescription = `สะสมเวลาตรวจหน้างานแล้ว <strong>${totalLogsHours} / 240 ชั่วโมง</strong> | เงินเก็บออมสุทธิซิงค์กับ MoneyPod เรียบร้อย`;
      progressPercent = 75;
      break;
    case 'phase4':
      phaseTitle = 'Phase 4: เขียนรายงานวิจัย & ปิดเล่มส่งงาน';
      phaseDescription = 'เตรียมจัดทำโครงร่างเล่มรายงานวิชาการ (.md) และตรวจสอบคู่มือจัดเอกสารจริงใส่ซองสีน้ำตาลส่งภาควิชา มก.';
      progressPercent = 100;
      break;
    default:
      phaseTitle = 'Phase 1: ค้นหา & สมัครแผนกฝึกงาน';
      phaseDescription = 'อยู่ระหว่างวางแผนและค้นหาสถานที่ฝึกงานวิศวกรรมวัสดุ';
      progressPercent = 25;
  }

  return `
    <style>
      @keyframes pulse-green {
        0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
      .ilm-dash-widget {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        padding: 20px;
        margin: 0 20px 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
        position: relative;
        overflow: hidden;
      }
      .dark-mode .ilm-dash-widget {
        background: rgba(30, 41, 59, 0.4);
        border-color: rgba(71, 85, 105, 0.3);
      }
    </style>
    
    <div class="ilm-dash-widget">
      <!-- Glow bubble -->
      <div style="position: absolute; top: -50px; right: -50px; width: 120px; height: 120px; background: rgba(59, 130, 246, 0.12); border-radius: 50%; filter: blur(35px);"></div>
      
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 15px; position: relative; z-index: 1;">
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.5px;">📍 ติดตามสิทธิ์และการเตรียมฝึกงาน (กรมธุรกิจพลังงาน)</div>
          <h3 style="margin: 4px 0 0 0; font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 8px; color: var(--text);">
            <span>💼</span> ${phaseTitle}
          </h3>
        </div>
        <button class="i-btn sm i-btn-primary" onclick="state.view = 'ilm'; render();" style="font-size: 0.8rem; padding: 6px 14px; border-radius: 10px; font-weight: 700; background: linear-gradient(135deg, #3b82f6, #1e3a8a); color: white; border: none; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.25); cursor: pointer; transition: all 0.2s ease;">
          จัดการการฝึกงาน 💼
        </button>
      </div>

      <!-- Description / Contextual help -->
      <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0 0 15px 0; position: relative; z-index: 1;">
        ${phaseDescription}
      </p>

      <!-- Progress Track -->
      <div style="position: relative; margin-top: 15px; z-index: 1;">
        <div style="height: 8px; background: rgba(0, 0, 0, 0.05); border-radius: 9999px; overflow: hidden; display: flex;">
          <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #10b981); border-radius: 9999px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
        </div>
        <!-- pulsing node -->
        <div style="position: absolute; left: calc(${progressPercent}% - 6px); top: -2px; width: 12px; height: 12px; border-radius: 50%; background: #10b981; border: 2px solid white; box-shadow: 0 0 8px #10b981; animation: pulse-green 1.5s infinite;"></div>
      </div>

      <!-- Horizontal stage guides -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 12px; font-size: 0.75rem; font-weight: 700; text-align: center; position: relative; z-index: 1;">
        <div style="color: ${activePhase === 'phase1' ? '#3b82f6' : 'var(--text-muted)'}; opacity: ${activePhase === 'phase1' ? '1' : '0.6'};">1. หาสถานที่</div>
        <div style="color: ${activePhase === 'phase2' ? '#3b82f6' : 'var(--text-muted)'}; opacity: ${activePhase === 'phase2' ? '1' : '0.6'};">2. เตรียมตัว/เซฟตี้</div>
        <div style="color: ${activePhase === 'phase3' ? '#3b82f6' : 'var(--text-muted)'}; opacity: ${activePhase === 'phase3' ? '1' : '0.6'};">3. ปฏิบัติงาน</div>
        <div style="color: ${activePhase === 'phase4' ? '#3b82f6' : 'var(--text-muted)'}; opacity: ${activePhase === 'phase4' ? '1' : '0.6'};">4. ปิดเล่มรายงาน</div>
      </div>
    </div>
  `;
}

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
      <div class="glass-card interactive" onclick="state.view = 'academic-report'; render();" style="display:flex; align-items:center; gap:12px; padding:15px; background:rgba(79, 70, 229, 0.05); border-left:4px solid #4f46e5;">
        <div style="font-size:24px;">📄</div>
        <div>
          <div style="font-weight:700; font-size:13px; color:#4f46e5;">Academic Report</div>
          <div style="font-size:11px; opacity:0.7;">Signed Traceable PDF</div>
        </div>
      </div>
    </div>
    
    ${renderDashboardInternshipPhaseWidget()}


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
              <div class="s2-val">${(() => {
                if (!curSem) return 0;
                const semCourseIds = (state.courses[curSem.id] || []).map(c => c.id);
                const currentAssignments = Object.values(state.assignments).flat().filter(a => semCourseIds.includes(a.courseId));
                return currentAssignments.filter(a => !a.submitted).length;
              })()}</div>
              <div class="s2-lbl">งานที่ค้างอยู่ (เทอมนี้)</div>
           </div>
        </div>
        
        <div class="widget-header" style="margin-top:20px;"><div class="widget-title"><span>📝</span> สอบที่ใกล้ที่สุด (เทอมนี้)</div></div>
        ${curSem ? (state.exams[curSem.id] || []).filter(e => getDaysUntil(e.date) >= 0).sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date)).slice(0, 1).map(e => {
    const course = findCourseById(e.courseId);
    return `
           <div class="exam-widget-item" style="padding:15px; background:rgba(0,0,0,0.03); border-radius:16px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div class="e-name" style="font-weight:800; font-size:14px;">${e.title || 'สอบ'}</div>
                <div class="e-meta" style="font-size:11px; opacity:0.6;">${course ? course.code : 'N/A'} | ${e.date}</div>
              </div>
              <div style="background:var(--c-rust); color:#fff; padding:4px 10px; border-radius:8px; font-weight:800; font-size:12px;">ใน ${getDaysUntil(e.date)} วัน</div>
           </div>
        `}).join('') : ''}
        ${!curSem || (state.exams[curSem.id] || []).filter(e => getDaysUntil(e.date) >= 0).length === 0 ? '<div class="empty-sm">ไม่มีการสอบเร็วๆ นี้</div>' : ''}
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
        <input type="text" class="nb-input" id="courseLocalSearch" placeholder="Search a course" style="padding-left:40px; border-radius:10px; background:#fff;" value="${state.courseSearch || ''}" oninput="state.courseSearch = this.value;">
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
            <div class="folder-card add-folder" style="--folder-bg: #f1f5f9; border-style: dashed; justify-content:center; align-items:center;" onclick="openAddCourseForm(null, '${sem.id}')">
               <span style="font-size:30px; opacity:0.3;">+</span>
            </div>
          </div>
        </div>`;
  }).join('') || `<div class="empty-hero"><div class="empty-icon">${isArchiveView ? '🗄' : '📚'}</div><h3>Empty</h3></div>`}
  </div>`;
}
