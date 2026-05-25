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
      <div class="glass-card interactive" onclick="PDFManager.generateTranscriptReport()" style="display:flex; align-items:center; gap:12px; padding:15px; background:rgba(79, 70, 229, 0.05); border-left:4px solid #4f46e5;">
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

window.checkFcmStatus = async () => {
  showToast('⌛ กำลังตรวจสอบจำนวนอุปกรณ์...');
  try {
    const q = query(collection(db, 'fcm_tokens'), where('userId', '==', STUDENT.id));
    const snap = await getDocs(q);
    const count = snap.size;
    const tokens = [];
    
    snap.forEach(d => {
      const data = d.data();
      if (data.token) {
        const snippet = data.token.substring(0, 10) + '...' + data.token.substring(data.token.length - 10);
        const platform = data.platform || 'Unknown';
        tokens.push(`${snippet} (${platform})`);
      }
    });

    openModal('📱 สถานะการแจ้งเตือน PWA', `
      <div style="text-align:center; padding:20px;">
        <div style="font-size:40px; margin-bottom:15px;">📡</div>
        <div style="font-size:18px; font-weight:700;">ลงทะเบียนไว้ ${count} อุปกรณ์</div>
        <p style="font-size:12px; color:#64748b; margin-top:10px; line-height:1.5;">
          หากเปลี่ยนเครื่องใหม่ หรือล้างแคช เบราว์เซอร์จะลงทะเบียนรหัสการแจ้งเตือนใหม่ให้อัตโนมัติครับ
        </p>
        <div style="margin-top:20px; font-family:monospace; font-size:11px; opacity:0.7; text-align:left; background:rgba(0,0,0,0.05); padding:12px; border-radius:10px; max-height:150px; overflow-y:auto; line-height:1.6;">
          <strong>อุปกรณ์เปิดใช้งานทั้งหมด (${count}):</strong><br>
          ${tokens.map(t => `• ${t}`).join('<br>')}
          ${tokens.length === 0 ? '<i>ไม่มีอุปกรณ์เปิดใช้งาน</i>' : ''}
        </div>
        <button class="btn-glass danger full" style="margin-top:20px; width: 100%;" onclick="resetFcmTokens()">🗑 ล้างข้อมูลอุปกรณ์ทั้งหมด</button>
      </div>
    `, '<button class="nb-btn nb-btn-primary full" onclick="closeModal()">รับทราบ</button>');

  } catch (err) {
    console.error("Firestore FCM check failed:", err);
    if (typeof google !== 'undefined' && google.script) {
      google.script.run.withSuccessHandler(res => {
        openModal('📱 สถานะการแจ้งเตือน', `
          <div style="text-align:center; padding:20px;">
            <div style="font-size:40px; margin-bottom:15px;">📡</div>
            <div style="font-size:18px; font-weight:700;">ลงทะเบียนไว้ ${res.count} อุปกรณ์</div>
            <button class="btn-glass danger full" style="margin-top:20px;" onclick="resetFcmTokens()">🗑 ล้างข้อมูลอุปกรณ์ทั้งหมด</button>
          </div>
        `, '<button class="nb-btn nb-btn-primary full" onclick="closeModal()">รับทราบ</button>');
      }).withFailureHandler(e => {
        showToast('❌ ไม่สามารถดึงข้อมูลอุปกรณ์ได้: ' + e, 'err');
      }).getFcmStatus();
    } else {
      showToast('❌ เกิดข้อผิดพลาดในการดึงข้อมูลอุปกรณ์', 'err');
    }
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

  showToast('⏳ กำลังล้างข้อมูลอุปกรณ์...');
  try {
    const q = query(collection(db, 'fcm_tokens'), where('userId', '==', STUDENT.id));
    const snap = await getDocs(q);
    const promises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(promises);
    
    closeModal();
    showToast('✅ ล้างข้อมูลสำเร็จ! กรุณากดลงทะเบียนใหม่');
  } catch (e) {
    console.error("Firestore FCM reset failed:", e);
    showToast('❌ เกิดข้อผิดพลาดในการล้างข้อมูลคลาวด์', 'err');
  }

  if (typeof google !== 'undefined' && google.script) {
    try {
      google.script.run.withFailureHandler(() => {}).resetFcmTokens();
    } catch (e) {}
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

  const curSem = getCurrentSemester();
  const curSemId = curSem ? curSem.id : (state.semesters[state.semesters.length - 1]?.id || '');

  // ── Credit Check: ≥60 หน่วยกิต ถึง ภาคฤดูร้อน ปี 2 ──
  const CREDIT_CHECK_MAX_ORDER = 6; // Y1T1=1, Y1T2=2, Y1Sum=3, Y2T1=4, Y2T2=5, Y2Sum=6
  const EXCLUDED_GRADES_CC = ['F', 'I', 'W', 'W-Late'];
  const sortedSems = [...state.semesters].sort((a, b) => (a.order || 0) - (b.order || 0));
  const eligibleSems = sortedSems.filter(s => (s.order || 0) <= CREDIT_CHECK_MAX_ORDER);
  let creditCheckTotal = 0;
  const creditCheckBySem = eligibleSems.map(sem => {
    const courses = (state.courses[sem.id] || []);
    const counted = courses.filter(c => c.grade && !EXCLUDED_GRADES_CC.includes(c.grade));
    const cr = counted.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);
    creditCheckTotal += cr;
    return { sem, cr, counted };
  });
  const CREDIT_REQUIRED = 60;
  const creditCheckPassed = creditCheckTotal >= CREDIT_REQUIRED;
  const creditRemaining = Math.max(0, CREDIT_REQUIRED - creditCheckTotal);

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

    <div class="glass-card" style="
      border: 2px solid ${creditCheckPassed ? '#22c55e' : '#f59e0b'}44;
      background: ${creditCheckPassed ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)'};
      border-radius: 20px; padding: 20px; margin-bottom: 4px;
    ">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:14px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="font-size:28px;">${creditCheckPassed ? '✅' : '⏳'}</div>
          <div>
            <div style="font-size:14px; font-weight:800; color:${creditCheckPassed ? '#22c55e' : '#f59e0b'};">
              เกณฑ์หน่วยกิต ≥ ${CREDIT_REQUIRED} หน่วยกิต
            </div>
            <div style="font-size:11px; color:var(--c-muted); margin-top:2px;">
              นับถึง ภาคฤดูร้อน ปี 2 (ไม่นับ F, I, W)
            </div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:28px; font-weight:900; font-family:'JetBrains Mono',monospace; color:${creditCheckPassed ? '#22c55e' : '#f59e0b'};">
            ${creditCheckTotal}<span style="font-size:14px; font-weight:600; opacity:0.7;">/${CREDIT_REQUIRED}</span>
          </div>
          <div style="font-size:11px; font-weight:600; color:${creditCheckPassed ? '#22c55e' : '#f59e0b'};">
            ${creditCheckPassed ? 'ผ่านเกณฑ์ 🎉' : `ขาดอีก ${creditRemaining} หน่วยกิต`}
          </div>
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.08); border-radius:99px; height:10px; overflow:hidden; margin-bottom:14px;">
        <div style="
          height:100%; border-radius:99px;
          width:${Math.min(100, (creditCheckTotal / CREDIT_REQUIRED) * 100).toFixed(1)}%;
          background: ${creditCheckPassed
            ? 'linear-gradient(90deg,#22c55e,#4ade80)'
            : 'linear-gradient(90deg,#f59e0b,#fbbf24)'};
          transition: width 0.6s cubic-bezier(.4,0,.2,1);
        "></div>
      </div>
      <details style="cursor:pointer;">
        <summary style="font-size:12px; font-weight:700; color:var(--c-muted); user-select:none; list-style:none; display:flex; align-items:center; gap:6px;">
          <span>📋 ดูรายละเอียดแต่ละภาคการศึกษา</span>
          <span style="font-size:10px; background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:99px;">${eligibleSems.length} ภาค</span>
        </summary>
        <div style="margin-top:12px; display:flex; flex-direction:column; gap:6px;">
          ${creditCheckBySem.length === 0
            ? `<div style="text-align:center;font-size:12px;color:var(--c-muted);padding:12px;">ยังไม่มีข้อมูลภาคการศึกษา order 1–6</div>`
            : creditCheckBySem.map(({ sem, cr }) => `
            <div style="display:flex; justify-content:space-between; align-items:center;
              background:rgba(255,255,255,0.05); border-radius:10px; padding:8px 12px;">
              <div>
                <span style="font-size:12px; font-weight:700;">${sem.name}</span>
                <span style="font-size:10px; color:var(--c-muted); margin-left:6px;">ลำดับที่ ${sem.order}</span>
              </div>
              <span style="font-size:13px; font-weight:800; font-family:'JetBrains Mono',monospace;
                color:${cr > 0 ? '#84cc16' : 'var(--c-muted)'};">
                +${cr} <span style="font-size:10px; font-weight:500;">หน่วยกิต</span>
              </span>
            </div>`).join('')
          }
          <div style="display:flex; justify-content:space-between; align-items:center;
            background:${creditCheckPassed ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'};
            border-radius:10px; padding:10px 12px; margin-top:4px;
            border:1px solid ${creditCheckPassed ? '#22c55e44' : '#f59e0b44'};">
            <span style="font-size:13px; font-weight:800;">รวมทั้งสิ้น</span>
            <span style="font-size:16px; font-weight:900; font-family:'JetBrains Mono',monospace;
              color:${creditCheckPassed ? '#22c55e' : '#f59e0b'};">
              ${creditCheckTotal} <span style="font-size:11px;">/ ${CREDIT_REQUIRED} หน่วยกิต</span>
            </span>
          </div>
          ${!creditCheckPassed ? `
          <div style="background:rgba(245,158,11,0.1); border:1px solid #f59e0b33; border-radius:10px;
            padding:10px 12px; font-size:11px; color:#fbbf24; line-height:1.6;">
            ⚠️ <strong>ยังไม่ถึงเกณฑ์ 60 หน่วยกิต</strong><br>
            หน่วยกิตที่นับ: ได้แก่ วิชาที่มีเกรด A, B+, B, C+, C, D+, D, P, N<br>
            ไม่นับ: F (สอบตก), I (ไม่สมบูรณ์), W / W-Late (ถอน)
          </div>` : `
          <div style="background:rgba(34,197,94,0.1); border:1px solid #22c55e33; border-radius:10px;
            padding:10px 12px; font-size:11px; color:#86efac; line-height:1.6;">
            🎓 <strong>ผ่านเกณฑ์หน่วยกิต 60 หน่วยกิตแล้ว!</strong><br>
            ครบตามข้อกำหนดสำหรับการฝึกงาน/สหกิจศึกษา ในภาคฤดูร้อน ปี 2
          </div>`}
        </div>
      </details>
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
        <div class="tool-title">🧮 Quick Simulation (${curSem ? curSem.name : 'เทอมปัจจุบัน'})</div>
        <div class="tool-body">
          <div id="quickSimList" style="display:flex; flex-direction:column; gap:6px; max-height:200px; overflow-y:auto; margin-bottom:10px;">
            ${(state.courses[curSemId] || []).map(c => `<div class="sim-row" data-cid="${c.id}">
              <span style="font-size:11px; font-weight:600;">${c.code} - ${c.nameTh}</span>
              <select class="glass-select sm">${Object.keys(GRADE_PTS).map(g => `<option ${c.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select>
            </div>`).join('')}
            ${(state.courses[curSemId] || []).length === 0 ? `<div style="text-align:center; padding:20px; font-size:12px; color:var(--c-muted);">ไม่มีรายวิชาในเทอมปัจจุบัน</div>` : ''}
          </div>
          <button class="btn-glass-primary sm full" id="simBtn" ${(state.courses[curSemId] || []).length === 0 ? 'disabled' : ''}>คำนวณผล GPAX</button>
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
                <select class="grade-select-inline" data-course-id="${c.id}" ${sem.id !== curSemId ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
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

    window.mpDeleteGoal = function(goalId) {
      if (!confirm('⚠️ ยืนยันที่จะลบเป้าหมายการออมนี้ใช่หรือไม่?')) return;
      state.moneyGoals = state.moneyGoals.filter(g => g.id !== goalId);
      saveMoneyPod();
      render();
      showToast('🗑️ ลบเป้าหมายการออมเรียบร้อย!');
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

    window.mpEditTransaction = function(txId) {
      const tx = state.moneyTransactions.find(t => t.id === txId);
      if (!tx) return;

      const categories = ['🍔 อาหาร & เครื่องดื่ม', '🚗 เดินทาง & ยานพาหนะ', '🐽 การเงิน & หนี้สิน', '🏠 บ้าน & ที่พักอาศัย', '🛍️ ช้อปปิ้ง & ไลฟ์สไตล์', '🎮 ความบันเทิง & เกม', '📚 การศึกษา & หนังสือ', '💊 สุขภาพ & ยา', '💼 การงาน & ธุรกิจ', '🎁 ของขวัญ & ทำบุญ', '🌐 อื่นๆ'];

      let bodyHtml = `
        <div style="display:flex; flex-direction:column; gap:12px; padding:10px;">
          <div class="fg">
            <label>ประเภทรายการ</label>
            <select id="editTxType" class="glass-select sm full">
              <option value="expense" ${tx.type === 'expense' ? 'selected' : ''}>💸 รายจ่าย</option>
              <option value="income" ${tx.type === 'income' ? 'selected' : ''}>💰 รายรับ</option>
            </select>
          </div>
          <div class="fg">
            <label>จำนวนเงิน (บาท)</label>
            <input type="number" id="editTxAmount" class="glass-input sm full" value="${tx.amount}" step="0.01">
          </div>
          <div class="fg">
            <label>หมวดหมู่</label>
            <select id="editTxCategory" class="glass-select sm full">
              ${categories.map(c => `<option value="${c}" ${tx.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="fg">
            <label>บัญชีเงิน/เครดิตที่ใช้</label>
            <select id="editTxWallet" class="glass-select sm full">
              ${state.moneyWallets.map(w => `<option value="${w.id}" ${tx.walletId === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
            </select>
          </div>
          <div class="fg">
            <label>บันทึกช่วยจำ (Notes)</label>
            <input type="text" id="editTxNotes" class="glass-input sm full" value="${tx.notes || ''}">
          </div>
          <div class="fg">
            <label>แท็ก (Tags, คั่นด้วยเว้นวรรค เช่น #อาหาร)</label>
            <input type="text" id="editTxTags" class="glass-input sm full" value="${tx.tags || ''}">
          </div>
          <div class="fg">
            <label>วันที่</label>
            <input type="date" id="editTxDate" class="glass-input sm full" value="${tx.date || new Date().toISOString().split('T')[0]}">
          </div>
        </div>
      `;

      const footerHtml = `
        <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
          <button class="btn-glass-pastel" onclick="closeModal()" style="padding: 8px 16px; border-radius:10px; font-size:12px;">ยกเลิก</button>
          <button class="btn-pastel-primary" onclick="mpSaveEditedTransaction('${txId}')" style="padding: 8px 20px; border-radius:10px; font-size:12px;">💾 บันทึกการแก้ไข</button>
        </div>
      `;

      openModal('✏️ แก้ไขรายการธุรกรรม', bodyHtml, footerHtml);
    };

    window.mpSaveEditedTransaction = function(txId) {
      const tx = state.moneyTransactions.find(t => t.id === txId);
      if (!tx) return;

      const oldAmount = tx.amount;
      const oldType = tx.type;
      const oldWalletId = tx.walletId;

      const newType = document.getElementById('editTxType').value;
      const newAmount = parseFloat(document.getElementById('editTxAmount').value);
      const newCategory = document.getElementById('editTxCategory').value;
      const newWalletId = document.getElementById('editTxWallet').value;
      const newNotes = document.getElementById('editTxNotes').value.trim();
      const newTags = document.getElementById('editTxTags').value.trim();
      const newDate = document.getElementById('editTxDate').value;

      if (isNaN(newAmount) || newAmount <= 0) {
        showToast('⚠️ กรุณากรอกจำนวนเงินให้ถูกต้อง', 'err');
        return;
      }

      // Delta balance adjustment
      const oldWallet = state.moneyWallets.find(w => w.id === oldWalletId);
      if (oldWallet) {
        if (oldType === 'expense') {
          oldWallet.balance += oldAmount;
        } else {
          oldWallet.balance -= oldAmount;
        }
      }

      const newWallet = state.moneyWallets.find(w => w.id === newWalletId);
      if (newWallet) {
        if (newType === 'expense') {
          newWallet.balance -= newAmount;
        } else {
          newWallet.balance += newAmount;
        }
      }

      tx.type = newType;
      tx.amount = newAmount;
      tx.category = newCategory;
      tx.walletId = newWalletId;
      tx.notes = newNotes;
      tx.tags = newTags;
      tx.date = newDate;

      saveMoneyPod();
      closeModal();
      render();
      showToast('✅ แก้ไขรายการเรียบร้อยแล้ว!');
    };

    window.mpEditGoal = function(goalId) {
      const goal = state.moneyGoals.find(g => g.id === goalId);
      if (!goal) return;

      const bodyHtml = `
        <div style="display:flex; flex-direction:column; gap:12px; padding:10px;">
          <div class="fg">
            <label>ชื่อเป้าหมาย</label>
            <input type="text" id="editGoalName" class="glass-input sm full" value="${goal.name}">
          </div>
          <div class="fg">
            <label>จำนวนเงินเป้าหมาย (บาท)</label>
            <input type="number" id="editGoalTarget" class="glass-input sm full" value="${goal.target}" step="0.01">
          </div>
          <div class="fg">
            <label>จำนวนเงินออมสะสมปัจจุบัน (บาท)</label>
            <input type="number" id="editGoalSaved" class="glass-input sm full" value="${goal.saved}" step="0.01">
          </div>
        </div>
      `;

      const footerHtml = `
        <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
          <button class="btn-glass-pastel" onclick="closeModal()" style="padding: 8px 16px; border-radius:10px; font-size:12px;">ยกเลิก</button>
          <button class="btn-pastel-primary" onclick="mpSaveEditedGoal('${goalId}')" style="padding: 8px 20px; border-radius:10px; font-size:12px;">💾 บันทึกการแก้ไข</button>
        </div>
      `;

      openModal('✏️ แก้ไขเป้าหมายการออม', bodyHtml, footerHtml);
    };

    window.mpSaveEditedGoal = function(goalId) {
      const goal = state.moneyGoals.find(g => g.id === goalId);
      if (!goal) return;

      const newName = document.getElementById('editGoalName').value.trim();
      const newTarget = parseFloat(document.getElementById('editGoalTarget').value);
      const newSaved = parseFloat(document.getElementById('editGoalSaved').value);

      if (!newName || isNaN(newTarget) || newTarget <= 0 || isNaN(newSaved) || newSaved < 0) {
        showToast('⚠️ กรุณากรอกข้อมูลให้ถูกต้อง', 'err');
        return;
      }

      goal.name = newName;
      goal.target = newTarget;
      goal.saved = newSaved;

      saveMoneyPod();
      closeModal();
      render();
      showToast('✅ แก้ไขเป้าหมายสำเร็จ!');
    };

    window.mpEditInstallment = function(instId) {
      const inst = state.moneyInstallments.find(i => i.id === instId);
      if (!inst) return;

      const bodyHtml = `
        <div style="display:flex; flex-direction:column; gap:12px; padding:10px;">
          <div class="fg">
            <label>ชื่อรายการผ่อนชำระ/หนี้สิน</label>
            <input type="text" id="editInstName" class="glass-input sm full" value="${inst.name}">
          </div>
          <div class="fg">
            <label>ยอดผ่อนชำระต่อเดือน (บาท)</label>
            <input type="number" id="editInstMonthly" class="glass-input sm full" value="${inst.monthlyPayment}" step="0.01">
          </div>
          <div class="fg">
            <label>จำนวนงวดทั้งหมด (เดือน)</label>
            <input type="number" id="editInstTotal" class="glass-input sm full" value="${inst.totalMonths}">
          </div>
          <div class="fg">
            <label>จำนวนงวดที่จ่ายไปแล้ว (เดือน)</label>
            <input type="number" id="editInstPaid" class="glass-input sm full" value="${inst.paidMonths}">
          </div>
          <div class="fg">
            <label>ยอดเงินเต็มผ่อนชำระรวมดอกเบี้ย (บาท)</label>
            <input type="number" id="editInstTotalPayable" class="glass-input sm full" value="${inst.totalPayable}" step="0.01">
          </div>
        </div>
      `;

      const footerHtml = `
        <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
          <button class="btn-glass-pastel" onclick="closeModal()" style="padding: 8px 16px; border-radius:10px; font-size:12px;">ยกเลิก</button>
          <button class="btn-pastel-primary" onclick="mpSaveEditedInstallment('${instId}')" style="padding: 8px 20px; border-radius:10px; font-size:12px;">💾 บันทึกการแก้ไข</button>
        </div>
      `;

      openModal('✏️ แก้ไขสัญญาผ่อนชำระ', bodyHtml, footerHtml);
    };

    window.mpSaveEditedInstallment = function(instId) {
      const inst = state.moneyInstallments.find(i => i.id === instId);
      if (!inst) return;
      
      const name = document.getElementById('editInstName').value.trim();
      const monthly = parseFloat(document.getElementById('editInstMonthly').value);
      const total = parseInt(document.getElementById('editInstTotal').value);
      const paid = parseInt(document.getElementById('editInstPaid').value);
      const payable = parseFloat(document.getElementById('editInstTotalPayable').value);
      
      if (!name || isNaN(monthly) || monthly <= 0 || isNaN(total) || total <= 0 || isNaN(paid) || paid < 0 || isNaN(payable) || payable <= 0) {
        showToast('⚠️ กรุณากรอกข้อมูลให้ถูกต้อง', 'err');
        return;
      }
      
      inst.name = name;
      inst.monthlyPayment = monthly;
      inst.totalMonths = total;
      inst.paidMonths = paid;
      inst.remainingMonths = Math.max(0, total - paid);
      inst.totalPayable = payable;
      
      saveMoneyPod();
      closeModal();
      render();
      showToast('✅ แก้ไขข้อมูลสัญญาสำเร็จ!');
    };

    window.mpDeleteInstallment = function(instId) {
      if (confirm('⚠️ คุณแน่ใจที่จะยกเลิกและลบสัญญาผ่อนชำระนี้ใช่หรือไม่?\n(ยอดคงเหลือในบัญชีจะไม่ได้รับผลกระทบ)')) {
        state.moneyInstallments = state.moneyInstallments.filter(i => i.id !== instId);
        saveMoneyPod();
        render();
        showToast('🗑️ ลบสัญญาผ่อนชำระเรียบร้อย!');
      }
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
                    <button class="icon-btn sm" onclick="mpEditTransaction('${t.id}')" style="background:transparent; border:none; color:#4f46e5; font-size:14px; margin-right:4px;">✏️</button>
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
                  <button class="btn-glass-pastel" onclick="mpEditInstallment('${i.id}')" style="padding:6px 12px; border-color:#4f46e5; color:#4f46e5; font-size:11px;">✏️ แก้ไขสัญญา</button>
                  <button class="btn-glass-pastel" onclick="mpDeleteInstallment('${i.id}')" style="padding:6px 12px; border-color:#ef4444; color:#ef4444; font-size:11px;">🗑️ ลบสัญญา</button>
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
                    <button class="btn-glass-pastel" onclick="mpEditGoal('${g.id}')" style="padding:6px 12px; font-size:11px; border-color:#4f46e5; color:#4f46e5;">✏️ แก้ไขเป้าหมาย</button>
                    <button class="btn-glass-pastel" onclick="mpDeleteGoal('${g.id}')" style="padding:6px 12px; font-size:11px; border-color:#ef4444; color:#ef4444; background:rgba(239, 68, 68, 0.05);">🗑️ ลบเป้าหมาย</button>
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
          <p>เครื่องมือจัดการการเงินอัจฉริยะแบบบูรณาการ: ผ่อนชำระ SPayLater/SEasyCash & ออมเงิน</p>
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

  <div class="settings-card" style="margin-bottom:15px; border-left: 4px solid #4285f4;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
      <div class="settings-label" style="flex:1; min-width:200px;">
        <div style="font-weight:700; font-size:16px; display:flex; align-items:center; gap:8px;">
          <span style="font-size:18px;">📅</span>
          Google Calendar Integration
        </div>
        <div style="font-size:12px; color:var(--c-muted); margin-top:4px;">
          เชื่อมตารางเรียน สอบ และงานส่ง ไปยัง Google Calendar (สร้างปฏิทินแยกอัตโนมัติ)
        </div>
      </div>
      <button class="btn-glass-primary sm" onclick="window.syncToGoogleCalendar()" style="background:#4285f4; border-color:#4285f4; color:white; font-weight:700; border-radius:12px; padding:10px 18px;">
        ⚡ ซิงค์ตารางเรียน & งาน
      </button>
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

function openAddCourseForm(existing = null, targetSemId = null) {
  const curSem = getCurrentSemester() || state.semesters[state.semesters.length - 1];
  const defaultSemId = existing ? existing.semId : (targetSemId || curSem?.id);
  const semOptions = state.semesters.map(s => `<option value="${s.id}" ${defaultSemId === s.id ? 'selected' : ''}>${s.name}</option>`).join('');

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
  const reflection = getReflectionText(courseId);

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
      if (c.mode === 'hybrid') {
        openModal('🤔 เลือกรูปแบบการเข้าเรียน', `
          <div style="text-align:center; padding:15px;">
            <p style="margin-bottom:20px; color:var(--text-main);">วิชานี้เป็นแบบ Hybrid วันนี้คุณเข้าเรียนรูปแบบใด?</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <button class="btn-pastel-primary full" style="border-radius:10px; padding:12px;" onclick="closeModal(); setAttendanceStatus('${courseId}', 'เข้าเรียน (Onsite)')">📍 เข้าเรียน (Onsite) - เปิด GPS</button>
              <button class="btn-glass full" style="border-radius:10px; padding:12px;" onclick="closeModal(); setAttendanceStatus('${courseId}', 'เข้าเรียน (Online)')">💻 เข้าเรียน (Online) - ไม่ใช้ GPS</button>
            </div>
          </div>
        `);
      } else if (c.mode === 'onsite') {
        await setAttendanceStatus(courseId, 'เข้าเรียน (Onsite)');
      } else {
        await setAttendanceStatus(courseId, 'เข้าเรียน (Online)');
      }
    };
  }

  document.getElementById('saveAdvHubBtn').onclick = async () => {
    const val = document.getElementById('reflInput_adv').value.trim();
    if (!val) { showToast('⚠️ กรุณากรอกเนื้อหา', 'err'); return; }
    await saveReflectionData(courseId, val);
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
          const refl = getReflectionText(c.id);
          if (!refl || refl.trim().length < 10) {
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

  if (state.view === 'trial-reg') {
    if (typeof attachTrialRegEvents === 'function') {
      attachTrialRegEvents();
    }
  }
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
    if (typeof renderCourseHub === 'function' && document.getElementById('hubModal')) {
      renderCourseHub(courseId);
    }
    try {
      await fsSet('attendance_history', courseId, { history: state.attendanceHistory[courseId] });
    } catch (e) { console.warn("Firebase att sync failed", e); }
  };

  if (skipGPS || status.includes('Online') || status.includes('ขาดเรียน') || !c?.targetCoords) {
    if (!skipGPS && !confirm(`ต้องการเช็คชื่อสถานะ [${status}] ของวิชานี้ใช่หรือไม่?`)) return;
    await recordAttendance(status);
    return;
  }

  // Open modal with map
  openModal('📍 ตรวจสอบตำแหน่งเช็คชื่อ', `
    <div style="text-align:center; padding:10px;">
      <p id="gpsStatusText" style="font-weight:bold; margin-bottom:10px;">⏳ กำลังค้นหาตำแหน่ง GPS ของคุณ...</p>
      <div id="checkinMap" style="height: 250px; width: 100%; border-radius: 8px; border: 1px solid var(--border); background: #f0f0f0;"></div>
      <div id="checkinActions" style="margin-top:15px; display:none;"></div>
    </div>
  `);

  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, enableHighAccuracy: true })
    );
    const { latitude: lat, longitude: lon } = pos.coords;
    const [tLat, tLon] = c.targetCoords.split(',').map(Number);
    const dist = getDistance(lat, lon, tLat, tLon);
    distMeters = Math.round(dist * 1000);

    const isInside = dist <= 0.5;

    document.getElementById('gpsStatusText').innerHTML = \`
      คุณอยู่ห่างจากห้องเรียน <strong>\${distMeters} เมตร</strong><br>
      <span style="color:\${isInside ? '#10b981' : '#ef4444'}; font-size:14px;">
        \${isInside ? '✅ อยู่ในรัศมีที่กำหนด (500ม.)' : '❌ นอกรัศมีที่กำหนด (500ม.)'}
      </span>
    \`;

    setTimeout(() => {
      const mapEl = document.getElementById('checkinMap');
      if (mapEl && typeof L !== 'undefined') {
        const map = L.map('checkinMap').setView([lat, lon], 16);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        L.marker([lat, lon]).addTo(map).bindPopup('📍 ตำแหน่งของคุณ').openPopup();
        L.circle([tLat, tLon], {
          color: 'var(--primary)',
          fillColor: 'var(--primary)',
          fillOpacity: 0.2,
          radius: 500
        }).addTo(map).bindPopup('🏫 ห้องเรียน');

        map.fitBounds(L.latLngBounds([[lat, lon], [tLat, tLon]]), { padding: [20, 20] });
      }
    }, 200);

    const actionDiv = document.getElementById('checkinActions');
    actionDiv.style.display = 'flex';
    actionDiv.style.flexDirection = 'column';
    actionDiv.style.gap = '10px';

    if (isInside) {
      actionDiv.innerHTML = \`
        <button class="btn-pastel-primary full" id="confirmCheckinBtn" style="border-radius:10px;">✅ ยืนยันการเช็คชื่อเข้าเรียน</button>
      \`;
      document.getElementById('confirmCheckinBtn').onclick = async () => {
        closeModal();
        await recordAttendance(status);
      };
    } else {
      actionDiv.innerHTML = \`
        <p style="font-weight:700; margin:0; text-align:left;">กรุณาระบุเหตุผลเพื่อความโปร่งใส:</p>
        <textarea id="outOfGeofenceReason" class="glass-input full" placeholder="ทำไมถึงเช็คชื่อนอกบริเวณนี้? (เช่น ติดธุระ, เปลี่ยนห้องเรียน)" style="height:60px; border-radius:10px; font-size:12px; padding:10px; resize:none;"></textarea>
        <button class="btn-pastel-primary full" id="confirmCheckinBtn" style="border-radius:10px;">💾 ส่งเหตุผลและเช็คชื่อ</button>
      \`;
      document.getElementById('confirmCheckinBtn').onclick = async () => {
        const reason = document.getElementById('outOfGeofenceReason').value.trim();
        if (!reason) return showToast('⚠️ กรุณาระบุเหตุผล', 'err');
        closeModal();
        await recordAttendance(\`\${status} (นอกพื้นที่: \${reason})\`);
      };
    }

  } catch (err) {
    document.getElementById('gpsStatusText').innerHTML = \`<span style="color:#ef4444;">⚠️ ไม่สามารถเข้าถึง GPS ได้ (\${err.message})</span>\`;
    document.getElementById('checkinMap').style.display = 'none';
    const actionDiv = document.getElementById('checkinActions');
    actionDiv.style.display = 'flex';
    actionDiv.style.flexDirection = 'column';
    actionDiv.style.gap = '10px';
    actionDiv.innerHTML = \`
      <p style="font-weight:700; margin:0; text-align:left;">ระบุเหตุผลเพื่อเช็คชื่อแบบแมนนวล:</p>
      <textarea id="outOfGeofenceReason" class="glass-input full" placeholder="เหตุผลที่ระบบดึงพิกัดไม่ได้ (เช่น ไม่มีสัญญาณ, ไม่ได้เปิดพิกัด)" style="height:60px; border-radius:10px; font-size:12px; padding:10px; resize:none;"></textarea>
      <button class="btn-pastel-primary full" id="confirmCheckinBtn" style="border-radius:10px;">💾 เช็คชื่อแมนนวลพร้อมเหตุผล</button>
    \`;
    document.getElementById('confirmCheckinBtn').onclick = async () => {
      const reason = document.getElementById('outOfGeofenceReason').value.trim();
      if (!reason) return showToast('⚠️ กรุณาระบุเหตุผล', 'err');
      closeModal();
      await recordAttendance(\`\${status} (ระบุแมนนวล: \${reason})\`);
    };
  }
}

window.submitCustomCheckinReason = async function(courseId, status) {
  const reasonText = document.getElementById('outOfGeofenceReason')?.value.trim();
  if (!reasonText) {
    showToast('⚠️ กรุณากรอกเหตุผลก่อนทำการเช็คชื่อ', 'err');
    return;
  }
  closeModal();
  const finalStatus = `${status} (นอกพื้นที่: ${reasonText})`;
  await setAttendanceStatus(courseId, finalStatus, true);
};

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
window.showToast = showToast;
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
window.state = typeof state !== 'undefined' ? state : {};
window.Radio = typeof Radio !== 'undefined' ? Radio : null;

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
    
    const urlParams = new URLSearchParams(window.location.search);
    const isShareLink = urlParams.has('share');

    if (isShareLink) {
      state.isLocked = false;
      document.getElementById('login-gate')?.classList.add('inactive');
      if (typeof startAppPublic === 'function') {
        await startAppPublic();
      }
    } else if (unlocked === 'true' && !isTimeout) {
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

    setInterval(() => {
      if (state.modal) return;
      if (document.activeElement && (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' || 
        document.activeElement.hasAttribute('contenteditable')
      )) {
        return; // Skip background re-rendering while the student is actively typing to prevent input focus loss and cursor jumping!
      }
      render();
    }, 30000);
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
  if (typeof state === 'undefined') return;
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
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && typeof getToken !== 'undefined') {
        const registration = await navigator.serviceWorker.ready;
        try {
          const currentToken = await getToken(messaging, {
            vapidKey: 'BGJJHyr07SwrKxHuo1w8HDRYCb6R-p6kZsk6yRaq-ho-iQ-7S0YdfTgz9KKDFW95jyQ927xCY51r6Wml84TonF4'.trim(),
            serviceWorkerRegistration: registration
          });
          if (currentToken) {
            if (typeof google !== 'undefined' && google.script) {
              try {
                google.script.run.withFailureHandler(() => {}).saveFcmToken(currentToken);
              } catch (e) {}
            }
          }
        } catch (tokenErr) {
          console.warn('FCM token auto-update skipped: Push service connection is currently unavailable or blocked (VPN/AdBlocker/network). Using local notifications fallback.');
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
        const tokenHash = currentToken.substring(currentToken.length - 20);
        await setDoc(doc(db, 'fcm_tokens', tokenHash), {
          token: currentToken,
          updatedAt: serverTimestamp(),
          userId: STUDENT.id,
          platform: navigator.platform,
          userAgent: navigator.userAgent
        });
        
        if (typeof google !== 'undefined' && google.script) {
          google.script.run.withSuccessHandler(res => {
            showToast(`✅ ลงทะเบียนสำเร็จ! (อุปกรณ์ที่ ${res?.count || 1})`);
          }).withFailureHandler(err => {
            console.warn("GAS saveFcmToken failed (falling back silently to Firestore):", err);
            showToast(`✅ ลงทะเบียนแจ้งเตือนสำเร็จ (เชื่อมต่อคลาวด์)`);
          }).saveFcmToken(currentToken);
        } else {
          showToast(`✅ ลงทะเบียนแจ้งเตือนสำเร็จ (เชื่อมต่อคลาวด์)`);
        }

        showToast("✅ เปิดการแจ้งเตือน FCM สำเร็จ!");
        state.notificationsGranted = true;
        new Notification("NITIPAT MANAGER", {
          body: "ระบบลงทะเบียนแจ้งเตือนแบบ Native สำเร็จแล้ว!",
          icon: "https://img1.pic.in.th/images/Gemini_Generated_Image_k0lkzwk0lkzwk0lk.png"
        });
      } else {
        showToast("⚠️ ไม่สามารถรับรหัสลงทะเบียนได้", "err");
      }
    } catch (err) {
      console.warn('FCM token retrieval failed: Push service unavailable, activating Local notifications fallback.', err);
      
      // Since browser notification permission is granted, local notifications WILL work perfectly!
      state.notificationsGranted = true;
      
      showToast("📢 เปิดใช้งาน 'ระบบแจ้งเตือนจำลองในหน้าต่างแอป' ให้คุณแล้ว!\n(เนื่องจากเครือข่าย/VPN บล็อกระบบ Push ของบราวเซอร์)", "success");
      
      new Notification("NITIPAT MANAGER", {
        body: "เปิดใช้งานระบบการแจ้งเตือนจำลอง (Local Notifications) เรียบร้อยแล้ว!",
        icon: "https://img1.pic.in.th/images/Gemini_Generated_Image_k0lkzwk0lkzwk0lk.png"
      });
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
  const val = document.getElementById(`refl_${id}`)?.value.trim();
  if (!val) { showToast('⚠️ กรุณากรอกเนื้อหา', 'err'); return; }

  await saveReflectionData(id, val);
  showToast('✅ บันทึกสำเร็จ!');
  const remaining = getMissingReflections();
  if (remaining.length > 0) openPendingReflectionsModal();
  else closeModal();
  render();
};
// ── Notification Logic ──
function pushNotif(title, body, delay = 0) {
  if (!state.notificationsGranted || typeof Notification === 'undefined') return;
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

  const todayStr = new Date().toDateString();
  let notifiedMap = { date: '', events: [] };
  try { notifiedMap = JSON.parse(localStorage.getItem('nitipat_notified') || '{"date":"","events":[]}'); } catch(e){}
  if (notifiedMap.date !== todayStr) {
    notifiedMap.date = todayStr;
    notifiedMap.events = [];
  }

  function scheduleOrPush(id, title, body, hour, min = 0) {
    const eventId = `${id}_${hour}_${min}`;
    if (notifiedMap.events.includes(eventId)) return;

    const now = new Date();
    const t = new Date(now);
    t.setHours(hour, min, 0, 0);
    
    if (now >= t) {
      pushNotif(title, body, 0);
      notifiedMap.events.push(eventId);
      localStorage.setItem('nitipat_notified', JSON.stringify(notifiedMap));
    } else {
      const delay = t.getTime() - now.getTime();
      const tid = setTimeout(() => {
        pushNotif(title, body, 0);
        notifiedMap.events.push(eventId);
        localStorage.setItem('nitipat_notified', JSON.stringify(notifiedMap));
      }, delay);
      state.notificationTimeouts.push(tid);
    }
  }

  const assignments = Object.values(state.assignments).flat().filter(a => !a.submitted);
  const exams = Object.values(state.exams).flat();

  assignments.forEach(a => {
    const days = getDaysUntil(a.dueDate);
    if (days === 7) {
      [8, 19].forEach(hr => scheduleOrPush(a.id, `⏳ อีก 7 วันส่ง: ${a.title}`, `เช้า/เย็นอย่าลืมวางแผนทำนะ!`, hr));
    } else if (days === 3) {
      [8, 12, 16, 20].forEach(hr => scheduleOrPush(a.id, `⚠️ อีก 3 วันส่ง!! ${a.title}`, `ต้องเริ่มลงมือทำจริงจังแล้วนะ`, hr));
    } else if (days === 1) {
      const msgs = ['เริ่มเช้าวันใหม่กับงาน!', 'โอกาสสุดท้ายของเช้านี้', 'ช่วงบ่ายต้องคืบหน้า', 'เย็นนี้ต้องใกล้เสร็จ', 'ค่ำคืนแห่งการปั่นงาน', '2 ชั่วโมงสุดท้ายก่อนเที่ยงคืน?', 'ยังไม่นอนใช่ไหม? ปั่นต่อ!'];
      [7, 10, 13, 16, 19, 21, 23].forEach((hr, i) => scheduleOrPush(a.id, `🚨 พรุ่งนี้ต้องส่งแล้ว!!: ${a.title}`, msgs[i], hr));
    }
  });

  exams.forEach(e => {
    const days = getDaysUntil(e.date);
    const tips = ["ทบทวน Mind Map", "ทำโจทย์ย้อนหลัง 3 ปี", "สรุปประเด็นสำคัญใน 1 หน้า"];
    if (days === 5) {
      [9, 14, 19].forEach((hr, i) => scheduleOrPush(e.id, `📖 อีก 5 วันสอบ: ${e.title}`, `Study Tip: ${tips[i]}`, hr));
    } else if (days === 1) {
      for (let hr = 8; hr <= 22; hr += 2) {
        scheduleOrPush(e.id, `🔥 พรุ่งนี้สอบ!!: ${e.title}`, `Priority สูงสุด! ทบทวนโค้งสุดท้าย`, hr);
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

// ── Google Calendar Sync Frontend Integration ──
window.syncToGoogleCalendar = function() {
  showToast('⏳ กำลังซิงค์ข้อมูลกับ Google Calendar...');
  
  const exams = Object.values(state.exams || {}).flat();
  const assignments = Object.values(state.assignments || {}).flat();
  const courses = Object.values(state.courses || []).filter(c => !c.isArchived);

  const payload = {
    exams: exams,
    assignments: assignments,
    courses: courses
  };

  google.script.run
    .withSuccessHandler(res => {
      if (res && res.success) {
        showToast('✅ ' + res.message);
      } else {
        showToast('❌ ' + (res.error || 'การซิงค์ล้มเหลว'), 'err');
      }
    })
    .withFailureHandler(err => {
      showToast('❌ เกิดข้อผิดพลาด: ' + err.message, 'err');
    })
    .syncAcademicMilestonesToCalendar(payload);
};

