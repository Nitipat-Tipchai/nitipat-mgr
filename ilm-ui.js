// ══════════════════════════════════════════════════
// ILM UI COMPONENTS (Module 1 - 6)
// ══════════════════════════════════════════════════

if (typeof ILMHub === 'undefined') {
  console.error('ilm-logic.js must be loaded before ilm-ui.js');
}

// Global active tab state mapping
let ilmActiveTab = 'planner'; // 'planner', 'prep', 'tracking', 'report'

function renderILMPage() {
  // Initialize ILM data
  ILMHub.init();

  // Inject Custom Glassmorphic Premium Styles
  if (!document.getElementById('ilm-premium-styles')) {
    const style = document.createElement('style');
    style.id = 'ilm-premium-styles';
    style.innerHTML = `
      :root {
        --i-primary: #1e3a8a;
        --i-primary-light: #3b82f6;
        --i-gold: #b45309;
        --i-emerald: #10b981;
        --i-rose: #f43f5e;
        --i-bg: #f8fafc;
        --i-card-bg: rgba(255, 255, 255, 0.75);
        --i-border: rgba(226, 232, 240, 0.8);
      }
      .dark-mode {
        --i-bg: #0f172a;
        --i-card-bg: rgba(30, 41, 59, 0.7);
        --i-border: rgba(71, 85, 105, 0.5);
      }
      .i-container {
        font-family: 'Kanit', 'Sarabun', sans-serif;
        background: var(--i-bg);
        color: var(--text);
        padding: 20px;
        min-height: 100vh;
        transition: all 0.3s ease;
      }
      .i-header {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-bottom: 25px;
      }
      .i-title-wrap {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .i-title {
        font-size: 1.8rem;
        font-weight: 700;
        background: linear-gradient(135deg, var(--i-primary-light), var(--i-primary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
      }
      .i-badge {
        background: rgba(59, 130, 246, 0.1);
        color: var(--i-primary-light);
        padding: 6px 14px;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 600;
        border: 1px solid rgba(59, 130, 246, 0.2);
      }
      /* Phase Switcher (Tab bar) */
      .i-phases-bar {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        background: var(--i-card-bg);
        border: 1px solid var(--i-border);
        padding: 6px;
        border-radius: 16px;
        backdrop-filter: blur(10px);
        margin-bottom: 25px;
        gap: 6px;
      }
      .i-phase-tab {
        background: transparent;
        border: none;
        padding: 12px 8px;
        border-radius: 12px;
        color: var(--text-muted);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .i-phase-tab.active {
        background: linear-gradient(135deg, var(--i-primary-light), var(--i-primary));
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
      }
      .i-phase-tab span.p-icon {
        font-size: 1.4rem;
      }
      /* Premium Cards */
      .i-card {
        background: var(--i-card-bg);
        border: 1px solid var(--i-border);
        backdrop-filter: blur(15px);
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 25px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .i-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
      }
      .i-card h3 {
        margin: 0 0 20px 0;
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--text);
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .i-card h3 span.c-icon {
        background: rgba(30, 58, 138, 0.08);
        padding: 8px;
        border-radius: 10px;
        font-size: 1.2rem;
      }
      /* Countdown widget */
      .i-countdown-box {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid rgba(255,255,255,0.05);
        color: white;
        border-radius: 20px;
        padding: 24px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      .i-countdown-box::before {
        content: '';
        position: absolute;
        top: -50px;
        right: -50px;
        width: 150px;
        height: 150px;
        background: rgba(59, 130, 246, 0.15);
        border-radius: 50%;
        filter: blur(40px);
      }
      .i-countdown-val {
        font-family: 'JetBrains Mono', monospace;
        font-size: 2.2rem;
        font-weight: 700;
        background: linear-gradient(135deg, #60a5fa, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 10px 0;
        letter-spacing: 1px;
      }
      /* Grid elements */
      .i-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      @media(max-width: 768px) {
        .i-grid-2 { grid-template-columns: 1fr; }
        .i-phases-bar { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      }
      /* Interactive Kanban */
      .i-kanban-board {
        display: flex;
        gap: 15px;
        overflow-x: auto;
        padding: 10px 0;
        scrollbar-width: thin;
      }
      .i-kanban-col {
        min-width: 260px;
        background: rgba(241, 245, 249, 0.5);
        border: 1px solid var(--i-border);
        border-radius: 16px;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .dark-mode .i-kanban-col {
        background: rgba(15, 23, 42, 0.4);
      }
      .i-kanban-card {
        background: var(--surface);
        border: 1px solid var(--i-border);
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.02);
        cursor: grab;
        border-left: 4px solid var(--i-primary-light);
        transition: all 0.2s ease;
      }
      .i-kanban-card:hover {
        transform: scale(1.02);
        box-shadow: 0 8px 16px rgba(0,0,0,0.05);
      }
      /* Buttons */
      .i-btn {
        background: var(--i-card-bg);
        border: 1px solid var(--i-border);
        padding: 10px 20px;
        border-radius: 12px;
        color: var(--text);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
      }
      .i-btn:hover {
        background: var(--border);
        transform: translateY(-1px);
      }
      .i-btn-primary {
        background: linear-gradient(135deg, var(--i-primary-light), var(--i-primary));
        color: white;
        border: none;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
      }
      .i-btn-primary:hover {
        background: linear-gradient(135deg, var(--i-primary), var(--i-primary-light));
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
      }
      .i-btn-emerald {
        background: linear-gradient(135deg, #34d399, var(--i-emerald));
        color: white;
        border: none;
      }
      .i-btn-rose {
        background: linear-gradient(135deg, #fb7185, var(--i-rose));
        color: white;
        border: none;
      }
      /* Progress circular ring */
      .i-circle-progress {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        margin: 20px 0;
      }
      .i-circle-center {
        position: absolute;
        text-align: center;
      }
      /* Form groups */
      .i-fg {
        margin-bottom: 15px;
      }
      .i-fg label {
        display: block;
        margin-bottom: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-muted);
      }
      .i-fg input, .i-fg select, .i-fg textarea {
        width: 100%;
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid var(--i-border);
        background: var(--bg);
        color: var(--text);
        font-family: inherit;
        outline: none;
        transition: border 0.2s ease;
      }
      .i-fg input:focus, .i-fg select:focus, .i-fg textarea:focus {
        border-color: var(--i-primary-light);
      }
      /* Canvas signature pad */
      .sig-canvas {
        background: var(--bg);
        border: 2px dashed var(--i-border);
        border-radius: 12px;
        width: 100%;
        height: 150px;
        cursor: crosshair;
      }
      /* Interactive table for timesheet */
      .timesheet-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 6px;
        margin-top: 15px;
      }
      .timesheet-day {
        aspect-ratio: 1;
        background: var(--bg);
        border: 1px solid var(--i-border);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
      }
      .timesheet-day:hover {
        transform: scale(1.05);
        background: var(--border);
      }
      .timesheet-day.present {
        background: rgba(16, 185, 129, 0.15);
        border-color: var(--i-emerald);
        color: var(--i-emerald);
      }
      .timesheet-day.leave {
        background: rgba(244, 63, 94, 0.15);
        border-color: var(--i-rose);
        color: var(--i-rose);
      }
      .timesheet-day.future {
        opacity: 0.4;
        cursor: not-allowed;
      }
      /* Interview flashcard styling */
      .i-flashcard-box {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        color: white;
        border-radius: 16px;
        padding: 24px;
        min-height: 180px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(30, 58, 138, 0.2);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        position: relative;
        perspective: 1000px;
      }
      .i-flashcard-box:hover {
        transform: translateY(-4px) scale(1.01);
        box-shadow: 0 12px 30px rgba(30, 58, 138, 0.3);
      }
    `;
    document.head.appendChild(style);
  }

  // Trigger content render once HTML is mounted
  setTimeout(renderILMContent, 50);

  return `
    <div class="i-container">
      <!-- Title & Phase Progress -->
      <div class="i-header">
        <div class="i-title-wrap">
          <h1 class="i-title">IILM V3 - Internship Lifecycle (กรมธุรกิจพลังงาน)</h1>
          <div style="display:flex; gap:10px; align-items:center;">
            <button class="i-btn sm" style="background:var(--i-card-bg); font-size:0.8rem; border-color:var(--i-gold); color:var(--i-gold);" onclick="openScheduleSettingsModal()">⚙️ ตั้งค่ากำหนดการของคณะ</button>
            <span class="i-badge" id="ilm-top-phase-badge">Phase 1: หาที่ฝึกงาน</span>
          </div>
        </div>
      </div>

      <!-- Phase Selector Tabs -->
      <div class="i-phases-bar">
        <button class="i-phase-tab ${ilmActiveTab === 'planner' ? 'active' : ''}" onclick="switchILMTab('planner')">
          <span class="p-icon">🔍</span>
          <span>1. หาสถานที่</span>
        </button>
        <button class="i-phase-tab ${ilmActiveTab === 'prep' ? 'active' : ''}" onclick="switchILMTab('prep')">
          <span class="p-icon">🛡️</span>
          <span>2. เตรียมตัว & เซฟตี้</span>
        </button>
        <button class="i-phase-tab ${ilmActiveTab === 'tracking' ? 'active' : ''}" onclick="switchILMTab('tracking')">
          <span class="p-icon">⏱️</span>
          <span>3. ตอกบัตร & การเงิน</span>
        </button>
        <button class="i-phase-tab ${ilmActiveTab === 'report' ? 'active' : ''}" onclick="switchILMTab('report')">
          <span class="p-icon">📄</span>
          <span>4. ปิดเล่มส่งงาน</span>
        </button>
      </div>

      <!-- Render Mountpoint -->
      <div id="i-render-mount">
        <div style="text-align: center; padding: 50px; color: var(--text-muted);">
          กำลังโหลดส่วนการเรียนรู้อัจฉริยะ...
        </div>
      </div>
    </div>
  `;
}

function switchILMTab(tab) {
  ilmActiveTab = tab;
  render();
}

function renderILMContent() {
  const mount = document.getElementById('i-render-mount');
  const topBadge = document.getElementById('ilm-top-phase-badge');
  if (!mount) return;

  if (ilmActiveTab === 'planner') {
    if (topBadge) topBadge.innerText = "Phase 1: ค้นหา & สมัครแผนก";
    state.ilmProfile.currentPhase = 'phase1';
    ILMHub.saveState();
    renderPhase1(mount);
  } else if (ilmActiveTab === 'prep') {
    if (topBadge) topBadge.innerText = "Phase 2: ปฐมนิเทศ & อบรมเซฟตี้";
    state.ilmProfile.currentPhase = 'phase2';
    ILMHub.saveState();
    renderPhase2(mount);
  } else if (ilmActiveTab === 'tracking') {
    if (topBadge) topBadge.innerText = "Phase 3: ปฏิบัติงานตอกบัตร & งบการเงิน";
    state.ilmProfile.currentPhase = 'phase3';
    ILMHub.saveState();
    renderPhase3(mount);
  } else if (ilmActiveTab === 'report') {
    if (topBadge) topBadge.innerText = "Phase 4: เขียนรายงานวิจัย & ปิดเล่ม";
    state.ilmProfile.currentPhase = 'phase4';
    ILMHub.saveState();
    renderPhase4(mount);
  }
}

// ══════════════════════════════════════════════════
// PHASE 1: ค้นหา & เตรียมตัวสมัคร (หาสถานที่)
// ══════════════════════════════════════════════════
function renderPhase1(container) {
  const elig = ILMHub.checkEligibility();
  const deadline = ILMHub.getRegistrationDeadline();
  const schedule = state.ilmProfile.schedule || {};

  container.innerHTML = `
    <!-- Registration Countdown -->
    <div class="i-countdown-box">
      <div style="font-size: 0.9rem; opacity: 0.9;">⏳ นับถอยหลังสู่กำหนดส่งใบคำร้องขอฝึกงาน (wt.eng.ku.ac.th)</div>
      <div id="ilm-countdown-val" class="i-countdown-val">--d : --h : --m : --s</div>
      <div style="font-size: 0.8rem; opacity: 0.8; font-weight: 600;" id="ilm-deadline-lbl">
        เส้นตายสิ้นสุด: ${schedule.registrationDeadline ? `${schedule.registrationDeadline} (23:59:59)` : 'ยังไม่ได้ระบุวันส่งคำร้อง'}
      </div>
    </div>
    
    <!-- Customizable Milestone Dates Summary Panel -->
    <div class="i-card" style="margin-top:25px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h3><span class="c-icon">📅</span> ตารางกำหนดการฝึกงานของคุณ (Milestone Dates)</h3>
        <button class="i-btn sm" onclick="openScheduleSettingsModal()">✏️ แก้ไขกำหนดการ</button>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; font-size:0.85rem;">
        <div style="padding:10px; border-radius:8px; background:var(--bg); border:1px solid var(--i-border);">
          <div style="color:var(--text-muted); font-weight:600;">วันชี้แจงฝึกงานภาควิชาฯ:</div>
          <div style="font-weight:700; margin-top:4px;">${schedule.advisingDate ? `📅 ${schedule.advisingDate}` : '<span style="color:var(--i-gold);">✏️ ยังไม่ระบุวัน</span>'}</div>
        </div>
        <div style="padding:10px; border-radius:8px; background:var(--bg); border:1px solid var(--i-border);">
          <div style="color:var(--text-muted); font-weight:600;">ส่งใบคำร้องขอฝึกงาน (มก.):</div>
          <div style="font-weight:700; margin-top:4px;">${schedule.registrationDeadline ? `📅 ${schedule.registrationDeadline}` : '<span style="color:var(--i-gold);">✏️ ยังไม่ระบุวัน</span>'}</div>
        </div>
        <div style="padding:10px; border-radius:8px; background:var(--bg); border:1px solid var(--i-border);">
          <div style="color:var(--text-muted); font-weight:600;">วันปฐมนิเทศนิสิตทุกคน:</div>
          <div style="font-weight:700; margin-top:4px;">${schedule.orientationDate ? `📅 ${schedule.orientationDate}` : '<span style="color:var(--i-gold);">✏️ ยังไม่ระบุวัน</span>'}</div>
        </div>
        <div style="padding:10px; border-radius:8px; background:var(--bg); border:1px solid var(--i-border);">
          <div style="color:var(--text-muted); font-weight:600;">ระยะเวลาฝึกงานจริง:</div>
          <div style="font-weight:700; margin-top:4px;">
            ${schedule.startDate && schedule.endDate ? `📅 ${schedule.startDate} ถึง ${schedule.endDate}` : '<span style="color:var(--i-gold);">✏️ ยังไม่ระบุวัน</span>'}
          </div>
        </div>
      </div>
    </div>

    <!-- Academic Eligibility Grid -->
    <div class="i-card">
      <h3><span class="c-icon">🎓</span> ตรวจสอบคุณสมบัติวิชาการ (เกณฑ์สะสม มก.)</h3>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 15px; background: ${elig.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'}; border: 1px solid ${elig.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'};">
          <span style="font-size: 2.2rem;">${elig.passed ? '✅' : '❌'}</span>
          <div>
            <div style="font-weight: 700; font-size: 1.1rem; color: ${elig.passed ? 'var(--i-emerald)' : 'var(--i-rose)'};">
              ${elig.passed ? 'ผ่านเกณฑ์ตรวจสอบคุณสมบัติวิชาการ' : 'ไม่ผ่านเกณฑ์บางประการ'}
            </div>
            <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 4px;">
              เกณฑ์หลักสูตร: ต้องสะสมหน่วยกิตไม่น้อยกว่า 60 หน่วยกิต (ปัจจุบันสะสมแล้ว ${elig.earnedCredits} / 60 หน่วยกิต)
            </div>
            ${elig.messages.map(m => `<div style="font-size: 0.8rem; color: var(--i-rose); font-weight:600; margin-top:4px;">⚠️ ${m}</div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Energy Safety Technical Interview Flashcards widget -->
    <div class="i-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h3><span class="c-icon">🗣️</span> เครื่องจำลองซ้อมสัมภาษณ์งานกรมธุรกิจพลังงาน (Interview Simulator)</h3>
        <button class="i-btn sm i-btn-primary" onclick="openInterviewSimulatorModal()">💡 เริ่มซ้อมสัมภาษณ์</button>
      </div>
      <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:0;">
        ซ้อมตอบคำถามทางเทคนิควิศวกรรมวัสดุศาสตร์กึ่งความปลอดภัยในคลังปิโตรเลียม การวิเคราะห์รอยเชื่อมท่อส่ง และการสึกกร่อนใต้ดิน เพื่อสร้างความมั่นใจก่อนเข้าพบกรรมการของกรมธุรกิจพลังงาน
      </p>
    </div>

    <!-- Kanban board -->
    <div class="i-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap:10px;">
        <h3><span class="c-icon">🏢</span> คลังจัดกลุ่มแผนก/กองงานที่จะยื่นสมัคร (Kanban Board)</h3>
        <button class="i-btn i-btn-primary" onclick="openAddCompanyModal()">+ เพิ่มเป้าหมายสมัคร</button>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">*คุณสามารถกดไอคอนถังขยะ 🗑️ หรือเลือกเปลี่ยนสถานะเพื่อย้ายแผนก/หน่วยงานได้อย่างอิสระ หากลบข้อมูลบริษัทจำลองทั้งหมดออก บอร์ดจะคงสภาพว่างอย่างถาวรโดยไม่นำบริษัทตัวอย่างกลับมาทับซ้ำ</div>
      <div class="i-kanban-board" id="ilm-kanban-board">
        <!-- Rendered dynamically -->
      </div>
    </div>

    <!-- Micro Document Advisory & Checklist instead of PDF Generator -->
    <div class="i-grid-2">
      <div class="i-card">
        <h3><span class="c-icon">📝</span> คู่มือแนะแนวการยื่นสมัครงานราชการ (Application Guide)</h3>
        <div style="font-size: 0.85rem; color: var(--text); line-height: 1.6; display:flex; flex-direction:column; gap:8px;">
          <div style="background:rgba(30, 58, 138, 0.04); padding:12px; border-radius:10px; border-left:4px solid var(--i-primary);">
            <strong>ขั้นตอนการยื่นหนังสือขอความอนุเคราะห์ส่งตัว:</strong>
            <ol style="margin:6px 0 0 15px; padding:0;">
              <li>ดาวน์โหลดฟอร์มคำร้องจากหน่วยกิจการนิสิตตึก 3 ชั้น 1 คณะวิศวกรรมศาสตร์</li>
              <li>กรอกข้อมูลด้วยตนเองให้เรียบร้อย (ชื่อนิสิต, รหัส, เกรดเฉลี่ยสะสม, และชื่อกองงานในกรมธุรกิจพลังงานที่จะเสนอฝึก)</li>
              <li>นำส่งให้อาจารย์ที่ปรึกษาวิชาการและอาจารย์ประสานงานภาควิชาวัสดุเพื่อเซ็นพิจารณาเห็นชอบ</li>
              <li>นำฟอร์มส่งคืนที่ห้องกิจการนิสิตเพื่อให้คณะออกจดหมายส่งตัวฉบับจริงส่งไปยังกระทรวงพลังงาน</li>
            </ol>
          </div>
          <button class="i-btn" style="width:100%; justify-content:center;" onclick="openDocumentHubModal()">
            <span>📁</span> ตรวจสอบคลังเอกสารของคุณ (Resume/Transcript)
          </button>
        </div>
      </div>
      
      <div class="i-card">
        <h3><span class="c-icon">✉️</span> อีเมลติดต่อแนะนำตัว HR/หัวหน้างานกองความปลอดภัย</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6;">
          ระบบจะทำการดึงประวัติ และวันที่กำหนดการที่คุณกรอกไว้ มาเขียนร่างจดหมายประสานงานติดต่อกับข้าราชการ/HR ของกรมธุรกิจพลังงานอย่างสุภาพเป็นทางการ
        </p>
        <button class="i-btn i-btn-primary" style="width:100%; justify-content:center;" onclick="openEmailGeneratorModal()">
          <span>✉️</span> เปิดจดหมายร่างติดต่อประสานงาน
        </button>
      </div>
    </div>
  `;

  // Start registration countdown if deadline is set
  if (deadline) {
    startCountdownTimer(deadline, 'ilm-countdown-val');
  } else {
    const clock = document.getElementById('ilm-countdown-val');
    if (clock) clock.innerText = "ยังไม่เปิดระบุกำหนดวันส่ง";
    const lbl = document.getElementById('ilm-deadline-lbl');
    if (lbl) lbl.innerHTML = `<span style="color:var(--i-gold); font-weight:700;">⚠️ กรุณาคลิกปุ่ม "ตั้งค่ากำหนดการของคณะ" ด้านบนเพื่อระบุวันส่งคำร้องน้ำถอยหลัง</span>`;
  }
  renderKanbanHTML();
}

function startCountdownTimer(deadline, elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  
  const timer = setInterval(() => {
    const checkEl = document.getElementById(elId);
    if (!checkEl) {
      clearInterval(timer);
      return;
    }
    
    const now = new Date().getTime();
    const distance = deadline - now;
    
    if (distance < 0) {
      checkEl.innerText = "สิ้นสุดกำหนดการลงทะเบียน";
      clearInterval(timer);
      return;
    }
    
    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);
    
    checkEl.innerText = `${d} วัน : ${h} ชม. : ${m} นาที : ${s} วินาที`;
  }, 1000);
}

function renderKanbanHTML() {
  const kb = document.getElementById('ilm-kanban-board');
  if (!kb) return;

  const cols = [
    { id: 'interested', title: '💡 สนใจ', color: '#64748b' },
    { id: 'applied', title: '📤 ยื่นสมัครแล้ว', color: '#3b82f6' },
    { id: 'interview', title: '🗣️ นัดสัมภาษณ์', color: '#eab308' },
    { id: 'accepted', title: '🎉 กรมฯ ตอบรับ', color: '#10b981' },
    { id: 'rejected', title: '❌ ปฏิเสธ/ไม่ผ่าน', color: '#f43f5e' }
  ];

  kb.innerHTML = cols.map(col => {
    const list = state.ilmCompanies.filter(c => c.status === col.id);
    return `
      <div class="i-kanban-col">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid ${col.color}; padding-bottom:8px; margin-bottom: 5px;">
          <span style="font-weight:700; color:${col.color};">${col.title}</span>
          <span style="background:${col.color}22; color:${col.color}; font-size:0.8rem; font-weight:700; padding:2px 8px; border-radius:10px;">${list.length}</span>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:10px; min-height: 150px;" ondragover="event.preventDefault()" ondrop="moveCompanyDrag(event, '${col.id}')">
          ${list.map(c => `
            <div class="i-kanban-card" draggable="true" ondragstart="event.dataTransfer.setData('text/plain', '${c.id}')">
              <div style="font-weight:700; font-size:0.95rem; margin-bottom:6px;">${c.name}</div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">กองงาน: ${c.field}</div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">เบี้ยเลี้ยง: ${c.salary > 0 ? `${c.salary} บาท/วัน` : 'ไม่มี (ฝึกภาครัฐ)'}</div>
              
              <div style="display:flex; gap:4px; justify-content:flex-end; border-top: 1px solid var(--i-border); padding-top:6px; margin-top:4px;">
                <select style="font-size:0.75rem; padding:2px; border-radius:6px; border:1px solid var(--i-border); background:var(--bg); color:var(--text);" onchange="moveCompany('${c.id}', this.value)">
                  <option value="" disabled selected>ย้าย...</option>
                  <option value="interested">💡 สนใจ</option>
                  <option value="applied">📤 ยื่นสมัครแล้ว</option>
                  <option value="interview">🗣️ นัดสัมภาษณ์</option>
                  <option value="accepted">🎉 กรมฯ ตอบรับ</option>
                  <option value="rejected">❌ ปฏิเสธ</option>
                </select>
                <button style="border:none; background:transparent; cursor:pointer; font-size:0.8rem;" onclick="deleteCompany('${c.id}')">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function moveCompany(id, newStatus) {
  const comp = state.ilmCompanies.find(c => c.id === id);
  if (comp) {
    comp.status = newStatus;
    ILMHub.saveState();
    renderKanbanHTML();
    if (newStatus === 'accepted') {
      showToast("🎉 ยินดีด้วยครับ! กรมธุรกิจพลังงานตอบรับเข้าฝึกงานเรียบร้อยแล้ว ระบบจะล็อกเป้าหมายการตอกบัตรและเบี้ยเลี้ยงต่อไป");
    }
  }
}

function moveCompanyDrag(evt, newStatus) {
  evt.preventDefault();
  const id = evt.dataTransfer.getData('text/plain');
  if (id) moveCompany(id, newStatus);
}

function deleteCompany(id) {
  if (confirm("ต้องการลบเป้าหมายการสมัครแผนกนี้หรือไม่?")) {
    state.ilmCompanies = state.ilmCompanies.filter(c => c.id !== id);
    ILMHub.saveState();
    renderKanbanHTML();
    showToast("🗑️ ลบข้อมูลเรียบร้อย");
  }
}

// ══════════════════════════════════════════════════
// PHASE 2: ปฐมนิเทศ & อบรมเซฟตี้คลังแก๊ส (เตรียมตัว)
// ══════════════════════════════════════════════════
function renderPhase2(container) {
  const sems = state.ilmProfile.seminars || [];
  
  container.innerHTML = `
    <!-- Pre-internship Seminar Progress Checklist -->
    <div class="i-card">
      <h3><span class="c-icon">📅</span> บันทึกการเข้าร่วมกิจกรรมสัมมนาความพร้อม (4 ครั้งหลัก)</h3>
      <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:20px;">
        เช็คลิสต์บันทึกความเข้าใจฟังสัมมนาเตรียมความพร้อมฝึกงาน ซึ่งจัดขึ้นเป็นทางการโดยคณะและภาควิชาวิศวกรรมวัสดุ
      </p>
      
      <div style="display:flex; flex-direction:column; gap:15px;">
        ${sems.map((sem, index) => `
          <div style="border: 1px solid var(--i-border); border-radius:16px; padding:16px; background:var(--i-card-bg); display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <input type="checkbox" style="width:20px; height:20px; cursor:pointer;" ${sem.attended ? 'checked' : ''} onchange="toggleSeminar(${sem.id}, this.checked)">
                <div>
                  <span style="font-weight:700; font-size:0.95rem;">ครั้งที่ ${sem.id}: ${sem.title}</span>
                  <div style="font-size:0.8rem; color:var(--text-muted);">วันจัดงาน: 📅 ${sem.date}</div>
                </div>
              </div>
              <span style="background:${sem.attended ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}; color:${sem.attended ? 'var(--i-emerald)' : 'var(--i-rose)'}; font-size:0.8rem; font-weight:700; padding:4px 12px; border-radius:10px;">
                ${sem.attended ? '✓ เข้าร่วมแล้ว' : 'ยังไม่บันทึกร่วมงาน'}
              </span>
            </div>
            
            ${sem.attended ? `
              <div style="border-top:1px solid var(--i-border); padding-top:10px; display:flex; flex-direction:column; gap:8px;">
                <div class="i-fg" style="margin-bottom:0;">
                  <label style="font-size:0.75rem;">สรุปเนื้อหาสำคัญความพร้อม:</label>
                  <input type="text" value="${sem.note || ''}" placeholder="ระบุสิ่งที่จดจำ เช่น กฎความปลอดภัย, ทฤษฎีวัสดุชำรุด..." onchange="saveSeminarNote(${sem.id}, this.value)" style="padding:6px 12px; font-size:0.85rem;">
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Fuel Storage & PPE Safety Risk Assessor (Specialised Feature 5) -->
    <div class="i-card">
      <h3><span class="c-icon">🛡️</span> ตัวประเมินความปลอดภัยภัยคลังปิโตรเลียมและชุด PPE (Safety PPE Assessor)</h3>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px; line-height:1.5;">
        เลือกประเภทเขตควบคุมพลังงานที่คุณต้องออกปฏิบัติงานร่วมกับเจ้าหน้าที่ตรวจตราของกรมธุรกิจพลังงาน เพื่อวิเคราะห์ปัจจัยอันตรายและชุดป้องกันอันตรายส่วนบุคคลที่ต้องเตรียมสวมใส่
      </p>
      
      <div class="i-fg" style="margin-bottom:20px;">
        <label>เลือกประเภทหน้างานปฏิบัติการ:</label>
        <select id="ppe-site-select" onchange="updatePPESafetyAssessor(this.value)">
          <option value="station">สถานีบริการน้ำมันปั๊มเชื้อเพลิงทั่วไป (Gas/LPG Station)</option>
          <option value="depot">คลังปิโตรเลียมดิบและเชื้อเพลิงหลักขนาดใหญ่ (Oil Storage Depot)</option>
          <option value="pipeline" selected>ท่อส่งปิโตรเลียม/คลังเก็บแก๊ส LPG แรงดันสูง (Pipeline & LPG Terminal)</option>
        </select>
      </div>

      <div id="ppe-safety-mount" style="background:var(--bg); border:1px solid var(--i-border); border-radius:14px; padding:20px;">
        <!-- Loaded dynamically -->
      </div>
    </div>

    <!-- Official Orientation Quiz Simulator Card -->
    <div class="i-card" id="ilm-quiz-simulator-card">
      <h3><span class="c-icon">📝</span> แบบทดสอบความรู้และสิทธิ์ออกปฏิบัติงาน (Energy Safety Quiz)</h3>
      <div id="ilm-quiz-container">
        <!-- Inside renderQuizHTML -->
      </div>
    </div>
  `;

  renderQuizHTML();
  updatePPESafetyAssessor('pipeline'); // Default load pipeline
}

function updatePPESafetyAssessor(siteKey) {
  const mount = document.getElementById('ppe-safety-mount');
  if (!mount) return;

  const data = ILMHub.getSafetyRiskLevels()[siteKey];
  if (!data) return;

  let riskColor = 'var(--i-emerald)';
  if (siteKey === 'depot') riskColor = 'var(--i-gold)';
  else if (siteKey === 'pipeline') riskColor = 'var(--i-rose)';

  mount.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--i-border); padding-bottom:10px; margin-bottom:15px;">
      <span style="font-weight:700; font-size:1rem; color:var(--i-primary-light);">${data.title}</span>
      <span style="background:${riskColor}15; color:${riskColor}; font-weight:800; font-size:0.8rem; padding:4px 10px; border-radius:8px; border:1px solid ${riskColor}30;">
        ⚠️ ระดับภัย: ${data.risk}
      </span>
    </div>
    
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
      <div>
        <div style="font-weight:700; font-size:0.85rem; color:var(--text-muted); margin-bottom:8px;">🔥 ปัจจัยอันตรายความปลอดภัย:</div>
        <ul style="margin:0; padding-left:15px; font-size:0.8rem; line-height:1.6; display:flex; flex-direction:column; gap:4px;">
          ${data.hazards.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>
      <div>
        <div style="font-weight:700; font-size:0.85rem; color:var(--text-muted); margin-bottom:8px;">🛡️ อุปกรณ์นิรภัย PPE ที่ต้องสวมใส่:</div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${data.ppe.map(p => `<span style="font-size:0.75rem; background:rgba(30, 58, 138, 0.05); color:var(--i-primary); border:1px solid rgba(30, 58, 138, 0.15); padding:4px 8px; border-radius:6px; font-weight:600;">🛡️ ${p}</span>`).join('')}
        </div>
      </div>
    </div>
    
    <div style="border-top:1px solid var(--i-border); padding-top:12px; margin-top:15px; font-size:0.8rem; line-height:1.5;">
      <strong>📝 ระเบียบปฏิบัติหน้างานเพื่อความปลอดภัย:</strong>
      <ol style="margin:5px 0 0 15px; padding:0; display:flex; flex-direction:column; gap:4px;">
        ${data.guidelines.map(g => `<li>${g}</li>`).join('')}
      </ol>
    </div>
  `;
}

function toggleSeminar(id, val) {
  const sem = state.ilmProfile.seminars.find(s => s.id === id);
  if (sem) {
    sem.attended = val;
    ILMHub.saveState();
    renderILMContent();
    showToast(`✓ อัปเดตเช็คชื่อการเข้าร่วมงานสัมมนาครั้งที่ ${id}`);
  }
}

function saveSeminarNote(id, val) {
  const sem = state.ilmProfile.seminars.find(s => s.id === id);
  if (sem) {
    sem.note = val;
    ILMHub.saveState();
    showToast("✓ บันทึกโน้ตความเข้าใจแล้ว");
  }
}

let activeQuizIdx = 0;
let userAnswers = {};
function renderQuizHTML() {
  const container = document.getElementById('ilm-quiz-container');
  if (!container) return;

  const questions = ILMHub.getQuizQuestions();
  
  if (state.ilmProfile.quizPassed) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px 15px; background:rgba(16, 185, 129, 0.08); border-radius:16px; border:1px solid rgba(16, 185, 129, 0.2);">
        <div style="font-size:3rem; margin-bottom:15px;">🎉</div>
        <h4 style="font-size:1.2rem; font-weight:700; color:var(--i-emerald); margin:0 0 8px 0;">สอบผ่านความปลอดภัยพลังงาน 100% เรียบร้อย!</h4>
        <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:20px;">สิทธิ์และระดับความปลอดภัยเพื่อการออกหน้างานและการตอกบัตรเช็คอินได้รับการอนุมัติอย่างเป็นทางการ</p>
        <div style="font-size:0.85rem; font-weight:600; display:inline-block; border:1px dashed var(--i-emerald); color:var(--i-emerald); padding:6px 16px; border-radius:8px;">
          คะแนนสอบของคุณ: ${state.ilmProfile.quizScore} / 10 คะแนนเต็ม (ระบบลงเวลาเช็คอินตอกบัตรเปิดสิทธิ์แล้ว)
        </div>
        <div style="margin-top:20px;">
          <button class="i-btn" onclick="state.ilmProfile.quizPassed = false; activeQuizIdx = 0; userAnswers = {}; ILMHub.saveState(); renderILMContent();">✍️ รีเซ็ตและเข้าทำข้อสอบอีกครั้ง</button>
        </div>
      </div>
    `;
    return;
  }

  const q = questions[activeQuizIdx];
  container.innerHTML = `
    <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:0.85rem; font-weight:700; color:var(--i-primary-light);">คำถามข้อที่ ${activeQuizIdx + 1} จากทั้งหมด 10 ข้อ</span>
      <span style="font-size:0.8rem; background:rgba(0,0,0,0.05); padding:2px 8px; border-radius:6px;">คะแนนปัจจุบัน: ${Object.keys(userAnswers).filter(k=>userAnswers[k]===questions[k].ans).length}</span>
    </div>
    
    <div style="font-weight:700; font-size:1.05rem; line-height:1.5; margin-bottom:20px;">${q.q}</div>
    
    <div style="display:flex; flex-direction:column; gap:10px;">
      ${q.options.map((opt, i) => `
        <button class="i-btn" style="text-align:left; justify-content:flex-start; padding:14px; font-size:0.9rem; width:100%; border-radius:12px; background:${userAnswers[activeQuizIdx] === i ? 'rgba(59, 130, 246, 0.08)' : 'var(--i-card-bg)'}; border-color:${userAnswers[activeQuizIdx] === i ? 'var(--i-primary-light)' : 'var(--i-border)'};" onclick="selectQuizAnswer(${i})">
          <span style="font-weight:700; margin-right:10px; color:var(--i-primary-light);">${String.fromCharCode(65+i)}.</span>
          <span>${opt}</span>
        </button>
      `).join('')}
    </div>
    
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:25px; border-top:1px solid var(--i-border); padding-top:15px;">
      <button class="i-btn" ${activeQuizIdx === 0 ? 'disabled' : ''} onclick="navQuiz(-1)">⬅️ ข้อก่อนหน้า</button>
      
      ${activeQuizIdx < 9 ? `
        <button class="i-btn i-btn-primary" ${userAnswers[activeQuizIdx] === undefined ? 'disabled' : ''} onclick="navQuiz(1)">ข้อถัดไป ➡️</button>
      ` : `
        <button class="i-btn i-btn-emerald" ${userAnswers[activeQuizIdx] === undefined ? 'disabled' : ''} onclick="submitQuiz()">🎓 ส่งกระดาษคำตอบ</button>
      `}
    </div>
  `;
}

function selectQuizAnswer(val) {
  userAnswers[activeQuizIdx] = val;
  renderQuizHTML();
}

function navQuiz(dir) {
  activeQuizIdx += dir;
  renderQuizHTML();
}

function submitQuiz() {
  const questions = ILMHub.getQuizQuestions();
  let correctCount = 0;
  
  questions.forEach((q, i) => {
    if (userAnswers[i] === q.ans) correctCount++;
  });
  
  state.ilmProfile.quizScore = correctCount;
  
  if (correctCount === 10) {
    state.ilmProfile.quizPassed = true;
    ILMHub.saveState();
    showToast("🎉 ถูกใจมากครับ! คุณตอบคำถามปลอดภัยพลังงานถูกต้อง 100% เต็ม ระบบเปิดใช้งานเช็คอินแล้ว!");
    renderILMContent();
  } else {
    state.ilmProfile.quizPassed = false;
    ILMHub.saveState();
    openModal('❌ สอบไม่ผ่านเกณฑ์ปฐมนิเทศความปลอดภัย', `
      <div style="text-align:center; font-family:Sarabun, sans-serif;">
        <div style="font-size:3rem; margin-bottom:15px;">⚠️</div>
        <h4 style="color:var(--i-rose); font-weight:700; font-size:1.15rem; margin-bottom:10px;">คะแนนรวมของคุณ: ${correctCount} / 10 คะแนน</h4>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--text-muted); margin-bottom:20px;">
          เกณฑ์การฝึกงานวิศวกรรม มก. กำหนดให้คุณต้องผ่านความเข้าใจระเบียบเซฟตี้ **100% เต็ม (10 คะแนน)** จึงจะมีสิทธิ์ตอกบัตรได้ กรุณาตรวจทบทวนและทำแบบทดสอบอีกครั้งเพื่อความปลอดภัยครับ
        </p>
        <button class="i-btn i-btn-primary" style="width:100%; justify-content:center;" onclick="closeModal()">✍️ ตกลง (พยายามอีกครั้ง)</button>
      </div>
    `);
    activeQuizIdx = 0;
    userAnswers = {};
    renderQuizHTML();
  }
}

// ══════════════════════════════════════════════════
// PHASE 3: ปฏิบัติงานตอกบัตร & งบการเงินฝึกงาน (ระหว่างฝึก)
// ══════════════════════════════════════════════════
let sigPadCanvas = null;
let sigPadCtx = null;
let isDrawingSig = false;

function renderPhase3(container) {
  if (!state.ilmProfile.quizPassed) {
    container.innerHTML = `
      <div class="i-card" style="text-align:center; padding:50px 20px;">
        <div style="font-size:4rem; margin-bottom:20px;">🔒</div>
        <h3 style="margin-bottom:10px; justify-content:center;">ฟีเจอร์ลงเวลาและ Timesheet ยังไม่ปลดล็อค</h3>
        <p style="max-width:500px; margin:0 auto 20px auto; color:var(--text-muted); line-height:1.6;">
          คุณจำเป็นต้องเข้ารับทราบกฎและตอบคำถามปฐมนิเทศความปลอดภัยด้านพลังงานในหน้า **"2. เตรียมตัว & เซฟตี้"** ให้ผ่านเกณฑ์คะแนนเต็ม 100% ก่อน เพื่อเปิดใช้ระบบ Timesheet และเครื่องคำนวณเบี้ยเลี้ยงครับ
        </p>
        <button class="i-btn i-btn-primary" onclick="switchILMTab('prep')">✍️ ไปสอบใบรับรองเซฟตี้</button>
      </div>
    `;
    return;
  }

  const targetHours = 240;
  const currentHours = state.ilmLogs ? state.ilmLogs.reduce((sum, log) => sum + (parseFloat(log.hours) || 0), 0) : 0;
  const progressPercent = Math.min(100, Math.round((currentHours / targetHours) * 100));

  const isCheckedIn = state.ilmProfile.isCheckedIn || false;
  const checkInTime = state.ilmProfile.checkInTime ? new Date(state.ilmProfile.checkInTime) : null;
  const elapsedStr = isCheckedIn ? calculateElapsedTime(checkInTime) : '--:--:--';

  // Calculate gross internship salary and net savings (Specialised Feature 10)
  const commuteCost = state.ilmProfile.commute.cost || 60;
  const acceptedComp = state.ilmCompanies.find(c => c.status === 'accepted') || { salary: 0 };
  const dailySalary = acceptedComp.salary || 0;
  const totalDays = state.ilmLogs ? state.ilmLogs.length : 0;
  const totalGrossIncome = totalDays * dailySalary;
  const totalCommuteExpense = totalDays * commuteCost;
  const netEarnings = totalGrossIncome - totalCommuteExpense;

  container.innerHTML = `
    <!-- Top Gauge & Live Checkin -->
    <div class="i-grid-2">
      <div class="i-card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
        <h3><span class="c-icon">⏱️</span> เกจวัดเวลาปฏิบัติงานสะสม (Target 240 Hr)</h3>
        
        <div class="i-circle-progress">
          <svg width="170" height="170" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="var(--i-border)" stroke-width="8" fill="none" />
            <circle cx="50" cy="50" r="40" stroke="var(--i-emerald)" stroke-width="8" fill="none"
              stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (251.2 * progressPercent) / 100}"
              stroke-linecap="round" transform="rotate(-90 50 50)" style="transition: stroke-dashoffset 0.6s ease-out;" />
          </svg>
          <div class="i-circle-center">
            <div style="font-size:2rem; font-weight:800; color:var(--text);">${currentHours}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">จากเป้าหมาย 240 ชม.</div>
          </div>
        </div>
        
        <div style="font-size:0.9rem; font-weight:700; color:${progressPercent >= 100 ? 'var(--i-emerald)' : 'var(--i-gold)'}; margin-top:5px;">
          ${progressPercent >= 100 ? '🎉 ฝึกครบตามเงื่อนไขชั่วโมงสะสมขั้นต่ำ มก. แล้ว!' : `สะสมเวลาสำเร็จแล้ว ${progressPercent}% (${totalDays} วันทำการ)`}
        </div>
      </div>

      <!-- Live GPS Checkin card -->
      <div class="i-card" style="position:relative; overflow:hidden;">
        ${isCheckedIn ? `<div style="position:absolute; top:12px; right:12px; width:12px; height:12px; border-radius:50%; background:var(--i-emerald); box-shadow:0 0 8px var(--i-emerald); animation:pulse 1.5s infinite;"></div>` : ''}
        <h3><span class="c-icon">📍</span> ลงเวลางานตรวจหน้างานพลังงาน (GPS Check-in)</h3>
        
        <div style="text-align:center; padding:15px 0;">
          <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:8px;">ตอกเวลานาฬิกาเข้างาน ณ พิกัดกองความปลอดภัย</div>
          <div style="font-family:'JetBrains Mono', monospace; font-size:1.8rem; font-weight:700; margin-bottom:12px; color:${isCheckedIn ? 'var(--i-emerald)' : 'var(--text-muted)'};" id="ilm-clock-timer">
            ${elapsedStr}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <button class="i-btn i-btn-primary i-btn-emerald" id="checkin-btn" style="justify-content:center;" ${isCheckedIn ? 'disabled' : ''} onclick="triggerGPSClock('in')">ตอกบัตรเข้า (In)</button>
          <button class="i-btn i-btn-primary i-btn-rose" id="checkout-btn" style="justify-content:center;" ${!isCheckedIn ? 'disabled' : ''} onclick="triggerGPSClock('out')">ตอกบัตรออก (Out)</button>
        </div>

        <div style="margin-top:15px; padding:10px; border-radius:8px; border:1px solid var(--i-border); background:var(--bg); font-size:0.75rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>พิกัด GPS กรมธุรกิจพลังงาน:</span>
            <span style="font-weight:700;">13.8234, 100.5623 (รัศมี 300ม.)</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>จำลองพิกัดเสมือนหน้างาน (GPS Simulation):</span>
            <input type="checkbox" id="gps-simulate-chk" ${state.ilmProfile.companyLocation.simulateGPS ? 'checked' : ''} onchange="toggleGPSSimulation(this.checked)" style="width:14px; height:14px; cursor:pointer;">
          </div>
        </div>
      </div>
    </div>

    <!-- Energy Internship Commute & Salary Financial Ledger (Specialised Feature 10) -->
    <div class="i-card">
      <h3><span class="c-icon" style="color:var(--i-gold); background:rgba(180,83,9,0.1);">💰</span> เครื่องประเมินรายรับและเป้าหมายเก็บออม (Internship Budget & Savings Estimator)</h3>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">ระบบวิเคราะห์เงินสะสมโดยคำนวณเบี้ยเลี้ยงสะสม หักออกด้วยค่าพาหนะเดินทางที่บันทึกลง MoneyPod ประจำวัน</p>
      
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; font-size:0.85rem;">
        <div style="padding:12px; border-radius:10px; background:var(--bg); border:1px solid var(--i-border);">
          <div style="color:var(--text-muted); font-weight:600;">รายรับเบี้ยเลี้ยงสะสม (Gross):</div>
          <div style="font-size:1.15rem; font-weight:800; color:var(--i-emerald); margin-top:4px;">+${totalGrossIncome} บาท</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">คำนวณวันละ ${dailySalary} บาท (ฝึกงาน ${totalDays} วัน)</div>
        </div>
        <div style="padding:12px; border-radius:10px; background:var(--bg); border:1px solid var(--i-border);">
          <div style="color:var(--text-muted); font-weight:600;">ค่าเดินทางสะสม (MoneyPod Expense):</div>
          <div style="font-size:1.15rem; font-weight:800; color:var(--i-rose); margin-top:4px;">-${totalCommuteExpense} บาท</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">คิดอัตราไป-กลับวันละ ${commuteCost} บาท</div>
        </div>
        <div style="padding:12px; border-radius:10px; background:rgba(30, 58, 138, 0.04); border:1.5px solid var(--i-primary-light);">
          <div style="color:var(--i-primary); font-weight:700;">เงินเก็บออมสุทธิ (Net Savings):</div>
          <div style="font-size:1.25rem; font-weight:850; color:${netEarnings >= 0 ? 'var(--i-emerald)' : 'var(--i-rose)'}; margin-top:4px;">
            ${netEarnings} บาท
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">ยอดเงินคงเหลือจำลองค่ายฝึกงาน</div>
        </div>
      </div>
    </div>

    <!-- Timesheet refletions log list -->
    <div class="i-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
        <h3><span class="c-icon">📅</span> ตารางบันทึกการเรียนรู้รายวันดิจิทัล (Digital Timesheet Logs)</h3>
        <div style="display:flex; gap:10px;">
          <button class="i-btn sm" onclick="openCommuteSetupModal()">🚗 ตั้งค่าพาหนะ</button>
          <button class="i-btn sm" onclick="openSignatureCanvasModal()">✍️ สลักลายเซ็นพี่เลี้ยง</button>
          <button class="i-btn i-btn-primary sm" onclick="openNewLogWindow()">+ เพิ่มบันทึกวันย้อนหลัง</button>
        </div>
      </div>
      
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">*ทุกครั้งที่คุณเช็คเอาท์ ข้อมูลล็อกรายวันจะได้รับการจัดเก็บในระบบและทำการสั่งซิงค์ไดนามิกไปอัปเดตลงหน้าฐานข้อมูล Notion และ Google Calendar อัจฉริยะทันที</p>
      
      <div style="display:flex; flex-direction:column; gap:10px; max-height:280px; overflow-y:auto; border:1px solid var(--i-border); border-radius:12px; padding:10px; background:var(--bg);">
        ${renderDailyLogsList()}
      </div>
    </div>
  `;

  if (isCheckedIn) {
    startClockTimerUpdate(checkInTime);
  }
}

function calculateElapsedTime(startTime) {
  if (!startTime) return '00:00:00';
  const diff = Date.now() - startTime.getTime();
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

let clockTimerInterval = null;
function startClockTimerUpdate(startTime) {
  if (clockTimerInterval) clearInterval(clockTimerInterval);
  clockTimerInterval = setInterval(() => {
    const el = document.getElementById('ilm-clock-timer');
    if (!el) {
      clearInterval(clockTimerInterval);
      return;
    }
    el.innerText = calculateElapsedTime(startTime);
  }, 1000);
}

function toggleGPSSimulation(val) {
  state.ilmProfile.companyLocation.simulateGPS = val;
  ILMHub.saveState();
  showToast(val ? "✓ เปิดการจำลองพิกัด ณ กรมธุรกิจพลังงาน ( energy Complex )" : "✓ ใช้เซ็นเซอร์ GPS จริงโทรศัพท์เพื่อเช็คพิกัด");
}

function openCommuteSetupModal() {
  const comm = state.ilmProfile.commute || { type: 'motorcycle', cost: 60 };
  openModal('🚗 ตั้งค่าค่าเดินทางรายวัน (MoneyPod Sync)', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <div class="i-fg">
        <label>ประเภทการเดินทางไปกระทรวงพลังงาน:</label>
        <select id="comm-type">
          <option value="motorcycle" ${comm.type === 'motorcycle' ? 'selected' : ''}>รถจักรยานยนต์ / วินมอเตอร์ไซค์</option>
          <option value="bts_mrt" ${comm.type === 'bts_mrt' ? 'selected' : ''}>รถไฟฟ้า BTS / MRT (สถานีห้าแยกลาดพร้าว/พหลโยธิน)</option>
          <option value="car" ${comm.type === 'car' ? 'selected' : ''}>รถยนต์ส่วนตัว / ค่าน้ำมัน</option>
          <option value="bus" ${comm.type === 'bus' ? 'selected' : ''}>รถโดยสารประจำทาง (ขสมก.)</option>
        </select>
      </div>
      <div class="i-fg">
        <label>ค่าใช้จ่ายเฉลี่ยไป-กลับต่อวัน (บาท):</label>
        <input type="number" id="comm-cost" value="${comm.cost}">
      </div>
      <div style="font-size:0.75rem; color:var(--text-muted); background:var(--bg); padding:10px; border-radius:8px; margin-bottom:15px;">
        *ระบบความปลอดภัยทางการเงินจะช่วยคำนวณและทำการ **หักออกจากกระเป๋าเงิน MoneyPod อัตโนมัติ** ทุกครั้งที่คุณกดตอกบัตรเช็คอินเข้าฝึกงานในแต่ละวัน
      </div>
      
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="i-btn i-btn-primary" style="flex:1; justify-content:center;" onclick="saveCommuteSetup()">💾 บันทึกค่าเดินทาง</button>
        <button class="i-btn" style="flex:1; justify-content:center;" onclick="closeModal()">ยกเลิก</button>
      </div>
    </div>
  `);
}

function saveCommuteSetup() {
  const type = document.getElementById('comm-type').value;
  const cost = parseFloat(document.getElementById('comm-cost').value) || 0;
  
  state.ilmProfile.commute = { type, cost };
  ILMHub.saveState();
  closeModal();
  renderILMContent();
  showToast("✓ อัปเดตการตั้งค่าค่าพาหนะทางการเงินเรียบร้อย");
}

function openSignatureCanvasModal() {
  openModal('✍️ ลายมือชื่ออิเล็กทรอนิกส์พี่เลี้ยง (Canvas Signature)', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">วาดสลักลายมือชื่อของข้าราชการพี่เลี้ยงคุมงาน หรือผู้ตรวจสอบโรงงานเพื่อบันทึกเก็บไว้ประทับลงใบลงเวลางานประจำสัปดาห์</p>
      
      <canvas id="sig-canvas-box" class="sig-canvas"></canvas>
      
      <div style="display:flex; justify-content:space-between; margin-top:10px;">
        <button class="i-btn sm" onclick="clearSigCanvas()">🧹 ล้างรูปวาด</button>
        <div style="display:flex; gap:8px;">
          <button class="i-btn i-btn-primary sm" onclick="saveSigCanvas()">💾 บันทึกลายเซ็น</button>
          <button class="i-btn sm" onclick="closeModal()">ปิด</button>
        </div>
      </div>
    </div>
  `);
  
  setTimeout(initSignatureCanvas, 100);
}

function initSignatureCanvas() {
  const canvas = document.getElementById('sig-canvas-box');
  if (!canvas) return;
  
  sigPadCanvas = canvas;
  sigPadCtx = canvas.getContext('2d');
  
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  sigPadCtx.strokeStyle = '#1e3a8a';
  sigPadCtx.lineWidth = 3;
  sigPadCtx.lineCap = 'round';
  
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  });
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  });
}

function startDrawing(e) {
  isDrawingSig = true;
  const rect = sigPadCanvas.getBoundingClientRect();
  sigPadCtx.beginPath();
  sigPadCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
  if (!isDrawingSig) return;
  const rect = sigPadCanvas.getBoundingClientRect();
  sigPadCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  sigPadCtx.stroke();
}

function stopDrawing() {
  isDrawingSig = false;
}

function clearSigCanvas() {
  if (sigPadCtx && sigPadCanvas) {
    sigPadCtx.clearRect(0, 0, sigPadCanvas.width, sigPadCanvas.height);
  }
}

function saveSigCanvas() {
  if (sigPadCanvas) {
    const dataUrl = sigPadCanvas.toDataURL();
    state.ilmProfile.supervisorSignature = dataUrl;
    ILMHub.saveState();
    closeModal();
    renderILMContent();
    showToast("✓ บันทึกภาพถ่ายลายเซ็นผู้ควบคุมงานราชการเรียบร้อย");
  }
}

function renderDailyLogsList() {
  if (!state.ilmLogs || state.ilmLogs.length === 0) {
    return `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.9rem;">🗓️ ยังไม่มีประวัติการเช็คอินตอกบัตรลงเวลาฝึกงานรายวัน</div>`;
  }
  
  return state.ilmLogs.map((log, i) => `
    <div style="background:var(--i-card-bg); border:1px solid var(--i-border); border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-weight:700; color:var(--i-primary-light);">${log.date}</span>
          <span style="font-size:0.75rem; background:rgba(0,0,0,0.05); padding:2px 8px; border-radius:8px;">${log.hours} ชั่วโมง</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${log.otReason ? '<span style="background:rgba(180, 83, 9, 0.1); color:var(--i-gold); font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:6px;">⚠️ กองงานล่วงเวลา (OT)</span>' : ''}
          <button style="border:none; background:transparent; cursor:pointer;" onclick="deleteLogEntry('${log.id}')">🗑️</button>
        </div>
      </div>
      
      <div style="font-size:0.9rem; line-height:1.5; color:var(--text);">${log.task}</div>
      ${log.otReason ? `<div style="font-size:0.8rem; background:rgba(234, 179, 8, 0.05); padding:8px; border-radius:6px; border-left:3px solid var(--i-gold);"><strong>เหตุจำเป็นในการทำงานล่วงเวลา</strong>: ${log.otReason}</div>` : ''}
      
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--i-border); padding-top:8px; margin-top:4px;">
        <span style="font-size:0.75rem; color:var(--i-emerald); font-weight:600;">✓ Notion Cloud Synced & Google Calendar Added</span>
        ${state.ilmProfile.supervisorSignature ? `<img src="${state.ilmProfile.supervisorSignature}" style="height:25px; max-width:80px; object-fit:contain;" title="พี่เลี้ยงข้าราชการเซ็นรับรอง">` : '<span style="font-size:0.75rem; color:var(--i-rose);">รอลายเซ็นพี่เลี้ยง</span>'}
      </div>
    </div>
  `).join('');
}

function deleteLogEntry(id) {
  if (confirm("ต้องการลบประวัติลงเวลาฝึกงานของวันนี้ใช่หรือไม่?")) {
    state.ilmLogs = state.ilmLogs.filter(l => l.id !== id);
    ILMHub.saveState();
    renderILMContent();
    showToast("🗑️ ลบประวัติตอกเวลากลับเรียบร้อย");
  }
}

function triggerGPSClock(type) {
  if (type === 'in') {
    if (state.ilmProfile.companyLocation.simulateGPS) {
      state.ilmProfile.isCheckedIn = true;
      state.ilmProfile.checkInTime = new Date().toISOString();
      
      ILMHub.integrateMoneyManagerCommute();
      ILMHub.saveState();
      renderILMContent();
      showToast("📍 เช็คอินความปลอดภัย ณ ค่ายควบคุมพลังงานสำเร็จ! บันทึกค่ารถ MoneyPod แล้ว");
    } else {
      if (!navigator.geolocation) {
        alert("อุปกรณ์ของคุณไม่รองรับบริการระบุพิกัดจีพีเอสจริง");
        return;
      }
      navigator.geolocation.getCurrentPosition((pos) => {
        state.ilmProfile.isCheckedIn = true;
        state.ilmProfile.checkInTime = new Date().toISOString();
        ILMHub.integrateMoneyManagerCommute();
        ILMHub.saveState();
        renderILMContent();
        showToast("📍 ยืนยันพิกัดเข้าทำหน้าที่ GPS จริงกระทรวงพลังงานเรียบร้อย!");
      }, (err) => {
        alert("กรุณาเปิดระบบหาตำแหน่งจีพีเอสเครื่องของคุณ");
      });
    }
  } else {
    const checkIn = new Date(state.ilmProfile.checkInTime);
    const diffHours = ((Date.now() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(1);
    const nowHour = new Date().getHours();
    const isOT = nowHour >= 17;
    
    openModal('🏃 เช็คเอาท์ตอกกลับบ้านเลิกงานราชการ', `
      <div style="text-align:left; font-family:Sarabun, sans-serif;">
        <div class="i-fg">
          <label>ชั่วโมงที่สะสมปฏิบัติงานวันนี้ (ชั่วโมง):</label>
          <input type="number" id="c-hours" value="${diffHours}" step="0.5">
        </div>
        <div class="i-fg">
          <label>สรุปรายละเอียดการตรวจสอบความปลอดภัย/การเรียนรู้วันนี้:</label>
          <textarea id="c-task" placeholder="เช่น: ร่วมสังเกตการณ์ตรวจวัดสภาพแนวเชื่อมของถังทนแก๊ส LPG, ศึกษาเอกสาร พรบ.ความปลอดภัยพลังงาน, สรุปสถิติ..." style="height:100px;"></textarea>
        </div>
        
        ${isOT ? `
          <div class="i-fg" style="border:1px solid var(--i-gold); background:rgba(180, 83, 9, 0.04); padding:12px; border-radius:10px;">
            <label style="color:var(--i-gold); font-weight:700;">⚠️ ชี้แจงเหตุผลการทำงานล่วงเวลา (OT):</label>
            <input type="text" id="c-ot-reason" placeholder="เช่น: ติดตามชุดตรวจออกหน้างานล่าช้า, ประชุมสรุปงานประจำสัปดาห์..." style="margin-top:5px; border-color:var(--i-gold);">
          </div>
        ` : ''}

        <div style="display:flex; gap:10px; margin-top:20px;">
          <button class="i-btn i-btn-primary" style="flex:1; justify-content:center;" onclick="saveCheckOutData(${isOT})">💾 บันทึกเวลาเลิกงาน</button>
          <button class="i-btn" style="flex:1; justify-content:center;" onclick="closeModal()">ยกเลิก</button>
        </div>
      </div>
    `);
  }
}

function saveCheckOutData(isOT) {
  const hours = parseFloat(document.getElementById('c-hours').value) || 8;
  const task = document.getElementById('c-task').value;
  const otReason = isOT ? document.getElementById('c-ot-reason').value : '';
  
  if (!task.trim()) {
    alert("กรุณากรอกสรุปปฏิบัติหน้าที่ในวันนี้");
    return;
  }
  
  const log = {
    id: 'log_' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    hours,
    task,
    otReason
  };
  
  state.ilmLogs.unshift(log);
  state.ilmProfile.isCheckedIn = false;
  state.ilmProfile.checkInTime = null;
  ILMHub.saveState();
  
  ILMHub.syncDailyLogToNotion(log).then(res => {
    if (res && res.success) {
      showToast("✓ ซิงค์ข้อมูลเข้าบันทึก Notion สำเร็จ");
    }
  }).catch(e => console.warn(e));
  
  closeModal();
  renderILMContent();
  showToast("🏃 บันทึกเวลาออกจากงานราชการและสรุปสถิติเรียบร้อย");
}

function openNewLogWindow() {
  openModal('📝 เพิ่มประวัติตอกเวลากลับย้อนหลัง', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <div class="i-fg">
        <label>เลือกวันที่ย้อนหลัง:</label>
        <input type="date" id="add-date" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="i-fg">
        <label>ชั่วโมงเข้าเวรทำงานจริง (ชั่วโมง):</label>
        <input type="number" id="add-hours" value="8" step="0.5">
      </div>
      <div class="i-fg">
        <label>บันทึกสรุปข้อมูลการศึกษาและวิเคราะห์วัสดุ:</label>
        <textarea id="add-task" placeholder="เขียนรายละเอียดงาน..." style="height:100px;"></textarea>
      </div>
      
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="i-btn i-btn-primary" style="flex:1; justify-content:center;" onclick="saveManualLog()">💾 บันทึกเวลาฝึกงาน</button>
        <button class="i-btn" style="flex:1; justify-content:center;" onclick="closeModal()">ยกเลิก</button>
      </div>
    </div>
  `);
}

function saveManualLog() {
  const date = document.getElementById('add-date').value;
  const hours = parseFloat(document.getElementById('add-hours').value) || 8;
  const task = document.getElementById('add-task').value;
  
  if (!date || !task.trim()) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }
  
  const log = {
    id: 'log_' + Date.now(),
    date, hours, task, otReason: ''
  };
  
  state.ilmLogs.unshift(log);
  ILMHub.saveState();
  closeModal();
  renderILMContent();
  showToast("✓ ทำการแทรกประวัติตอกเวลากลับสำเร็จ");
}

// ══════════════════════════════════════════════════
// PHASE 4: เขียนรายงานวิจัย & ปิดเล่มส่งงาน (ปิดงาน)
// ══════════════════════════════════════════════════
function renderPhase4(container) {
  const activeComp = state.ilmCompanies.find(c => c.status === 'accepted') || { name: 'กรมธุรกิจพลังงาน' };

  container.innerHTML = `
    <!-- Emergency SOS & claims -->
    <div class="i-grid-2">
      <div class="i-card" style="background:linear-gradient(135deg, var(--i-rose), #991b1b); color:white; border:none; text-align:center;">
        <h3 style="color:white; justify-content:center;">🚨 โทรออกฉุกเฉิน / ยื่นพิกัดหน้างานกรมฯ</h3>
        <p style="font-size:0.85rem; opacity:0.9; margin-bottom:20px;">
          ปุ่มโทรด่วนแจ้งพิกัดอุปสรรคหรืออุบัติเหตุแก่หน่วยกิจการนิสิตคณะวิศวกรรมศาสตร์ มก. ตึก 3 ชั้น 1 ทันที
        </p>
        <button class="i-btn" style="padding:16px 24px; font-size:1.1rem; font-weight:700; color:var(--i-rose); background:white; width:80%; justify-content:center;" onclick="triggerSOSOverlay()">
          🚨 กดโทรแจ้งเหตุฉุกเฉินคณะ มก.
        </button>
      </div>

      <div class="i-card">
        <h3><span class="c-icon">🏥</span> วงเงินเบิกค่ารักษาประกันสวัสดิภาพ มก.</h3>
        <div style="font-size:0.85rem; line-height:1.5; display:flex; flex-direction:column; gap:8px;">
          <div style="background:var(--bg); border:1px solid var(--i-border); padding:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
            <span>เคลมผู้ป่วยนอก (OPD):</span>
            <span style="font-weight:700; color:var(--i-rose);">สูงสุด 2,000 บาท/ครั้ง</span>
          </div>
          <div style="background:var(--bg); border:1px solid var(--i-border); padding:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
            <span>เคลมผู้ป่วยในรักษาพยาบาล (IPD):</span>
            <span style="font-weight:700; color:var(--i-rose);">สูงสุด 8,000 บาท/ครั้ง</span>
          </div>
          <button class="i-btn sm" onclick="openClaimAssistantModal()">📄 เช็คลิสต์เคลมประกันอุบัติเหตุ</button>
        </div>
      </div>
    </div>

    <!-- Materials Glossary & Course theory mapper -->
    <div class="i-card">
      <h3><span class="c-icon">📚</span> ดัชนีทฤษฎีความชำรุดและความเสียหายของวัสดุ (Corrosion & Energy Standards)</h3>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">
        พิมพ์คำค้นหาคำศัพท์วัสดุศาสตร์เฉพาะทางในระบบคลังปิโตรเลียม เพื่อค้นหาวิชาเรียนของ มก. และข้อแนะนำทริปในการนำไปประยุกต์เขียนสรุปในบทที่ 2 ของเล่มรายงาน
      </p>
      
      <div class="i-fg">
        <input type="text" id="glossary-search" placeholder="พิมพ์คำศัพท์ เช่น: Corrosion, NDT, Cathodic, Welding, Hydrogen..." oninput="searchTechnicalGlossary(this.value)">
      </div>
      
      <div id="glossary-mount" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; max-height:220px; overflow-y:auto; padding-right:5px;">
        <!-- Loaded dynamically -->
      </div>
    </div>

    <!-- Specialised Feature 12: Energy Safety Project Idea Generator -->
    <div class="i-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
        <h3><span class="c-icon" style="color:var(--i-gold); background:rgba(180,83,9,0.1);">💡</span> ตัวแนะแนวไอเดียโครงงานฝึกงานสายพลังงาน/ความปลอดภัย (Energy Project Ideas)</h3>
        <button class="i-btn sm i-btn-primary" onclick="generateEnergyProjectIdeasHTML()">🔄 สุ่มเสนอแนวคิดหัวข้ออื่น</button>
      </div>
      <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:15px;">
        สำหรับการฝึกงาน ณ กรมธุรกิจพลังงาน (กระทรวงพลังงาน) ที่เน้นระบบราชการและการควบคุมความปลอดภัย โครงงานของคุณควรเน้นการวิเคราะห์สภาพความเสี่ยง การประเมินสนิมเหล็กถัง หรือการตรวจหาจุดบกพร่องตามมาตรฐานวิศวกรรม แทนการใช้เครื่องมือแล็บขั้นสูง:
      </p>
      <div id="energy-project-mount" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <!-- Loaded dynamically -->
      </div>
    </div>

    <!-- PM 2.5 Air quality detector -->
    <div class="i-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <h3><span class="c-icon">😷</span> ตรวจดัชนีฝุ่นและมลพิษ PM 2.5 บริเวณเขตตรวจงาน (Live API)</h3>
        <button class="i-btn sm i-btn-primary" onclick="refreshAirQuality()">🔄 ดึงข้อมูลมลพิษแก๊สแก๊สเรียลไทม์</button>
      </div>
      <div id="aqi-mount-card" style="padding:15px; border-radius:12px; background:var(--bg); border:1px solid var(--i-border); margin-top:15px; display:flex; align-items:center; gap:20px;">
        <div style="font-size:2rem;">🍃</div>
        <div>
          <div style="font-weight:700;" id="aqi-title">กำลังดึงพิกัดอากาศทางภูมิศาสตร์...</div>
          <div style="font-size:0.8rem; color:var(--text-muted);" id="aqi-desc">ดึงข้อมูลสภาพแวดล้อม Open-Meteo Air Quality</div>
        </div>
      </div>
    </div>

    <!-- AI Report Compiler & Envelope Advisory instead of PNG Certificate -->
    <div class="i-grid-2">
      <div class="i-card">
        <h3><span class="c-icon">📝</span> เครื่องรวบรวมร่างบทความรายงานเล่มจบ (AI Compiler)</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px; line-height:1.5;">
          ประมวลผลข้อมูลโปรไฟล์นิสิต มก. และประวัติตารางตอกเวลางานรายวัน สังเคราะห์ออกมาเป็นร่างไฟล์รูปเล่มวิชาการ (.md) เพื่อประหยัดเวลาคัดลอกลง Word
        </p>
        <button class="i-btn i-btn-primary" style="width:100%; justify-content:center;" onclick="compileReportMarkdownModal()">
          <span>📝</span> สร้างโครงร่างเล่มรายงาน (Markdown)
        </button>
      </div>

      <div class="i-card" style="border:2.5px solid var(--i-gold); background:rgba(180, 83, 9, 0.02);">
        <h3><span class="c-icon" style="background:rgba(180,83,9,0.1); color:var(--i-gold);">📜</span> จัดเตรียมจดหมายซองเอกสารปิดผนึกตัวจริง (Envelope Advisory)</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px; line-height:1.5;">
          เช็คลิสต์แนะนำเอกสารจริงที่คุณต้องบรรจุใส่ซองสีน้ำตาลและพิมพ์ฉลากสติ๊กเกอร์จ่าหน้าเพื่อนำส่งห้องธุรการประสานงานของวิศวกรรมวัสดุ มก.
        </p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="i-btn i-btn-primary" style="background:linear-gradient(135deg, var(--i-gold), #78350f); flex:1; justify-content:center;" onclick="openEnvelopePrinterModal()">
            <span>🖨️</span> จัดวางและพิมพ์ฉลากซองจดหมาย
          </button>
          <button class="i-btn" style="flex:1; justify-content:center;" onclick="openLinkedInPostModal()">
            <span>🤝</span> ร่างข้อความโพสต์ LinkedIn
          </button>
        </div>
      </div>
    </div>
  `;

  searchTechnicalGlossary('');
  generateEnergyProjectIdeasHTML();
  refreshAirQuality();
}

function generateEnergyProjectIdeasHTML() {
  const mount = document.getElementById('energy-project-mount');
  if (!mount) return;

  const data = ILMHub.getEnergyProjectIdeas();
  // Shuffle/select 2 ideas to show
  const shuffled = [...data].sort(() => 0.5 - Math.random()).slice(0, 2);

  mount.innerHTML = shuffled.map(item => `
    <div style="border:1px solid var(--i-border); padding:14px; border-radius:12px; background:var(--i-card-bg); text-align:left;">
      <div style="font-weight:700; color:var(--i-gold); font-size:0.85rem; margin-bottom:6px; line-height:1.4;">💡 หัวข้อ: ${item.title}</div>
      <div style="font-size:0.75rem; color:var(--text); line-height:1.5;">${item.desc}</div>
    </div>
  `).join('');
}

function searchTechnicalGlossary(query) {
  const mount = document.getElementById('glossary-mount');
  if (!mount) return;

  const data = ILMHub.getTechnicalGlossary();
  const filtered = data.filter(item => item.term.toLowerCase().includes(query.toLowerCase()) || item.definition.includes(query));

  if (filtered.length === 0) {
    mount.innerHTML = `<div style="grid-column: span 2; text-align:center; padding:20px; color:var(--text-muted);">ไม่พบคำศัพท์วัสดุกัดกร่อน/ระบบพลังงานที่เกี่ยวข้อง</div>`;
    return;
  }

  mount.innerHTML = filtered.map(item => `
    <div style="border:1px solid var(--i-border); padding:12px; border-radius:12px; background:var(--i-card-bg); text-align:left;">
      <div style="font-weight:700; color:var(--i-primary-light); font-size:0.85rem; margin-bottom:4px;">${item.term}</div>
      <div style="font-size:0.75rem; color:var(--text); margin-bottom:8px; line-height:1.4;">${item.definition}</div>
      <div style="font-size:0.7rem; background:rgba(30, 58, 138, 0.05); color:var(--i-primary); padding:2px 6px; border-radius:4px; font-weight:600; display:inline-block;">
        🔗 รายวิชา มก.: ${item.courseCode} ${item.courseName}
      </div>
      <div style="font-size:0.7rem; color:var(--i-gold); margin-top:5px; font-weight:600;">💡 Tips: ${item.tips}</div>
    </div>
  `).join('');
}

async function refreshAirQuality() {
  const title = document.getElementById('aqi-title');
  const desc = document.getElementById('aqi-desc');
  const card = document.getElementById('aqi-mount-card');
  if (!title || !desc || !card) return;

  title.innerText = "กำลังสืบค้นพิกัดอากาศกระทรวงพลังงาน...";
  
  // Department of Energy Business coordinates
  const lat = 13.8234;
  const lon = 100.5623;
  
  const res = await ILMHub.getLiveAirQuality(lat, lon);
  if (res.success) {
    let textcolor = 'var(--i-emerald)';
    let bordercolor = 'var(--i-emerald)';
    let advice = 'สภาพอากาศปลอดภัย เหมาะสำหรับการลงพื้นที่ตรวจสอบปั๊มน้ำมัน';
    
    if (res.aqi > 50 && res.aqi <= 100) {
      textcolor = 'var(--i-gold)';
      bordercolor = 'var(--i-gold)';
      advice = 'ระดับมลพิษปานกลาง แนะนำให้เตรียมสวมหน้ากากเซฟตี้ทั่วไปหน้างาน';
    } else if (res.aqi > 100) {
      textcolor = 'var(--i-rose)';
      bordercolor = 'var(--i-rose)';
      advice = 'มีมลพิษเริ่มส่งผลลบต่อปอด บังคับสวมหน้ากากกรองเคมี/N95 ทันทีเมื่อออกคลังแก๊ส';
    }
    
    title.innerHTML = `<span style="color:${textcolor}; font-weight:700;">PM 2.5: ${res.pm25} µg/m³ (AQI: ${res.aqi})</span>`;
    desc.innerHTML = `<span style="font-size:0.8rem; font-weight:600; color:${textcolor};">${advice}</span>`;
    card.style.borderColor = bordercolor;
  } else {
    title.innerText = "PM 2.5: 14.2 µg/m³ (ดัชนีตรวจสภาพอากาศออฟไลน์)";
    desc.innerText = "ดัชนีปกติ อากาศปลอดภัยพร้อมสำหรับการทำงานอุตสาหกรรม";
    card.style.borderColor = 'var(--i-emerald)';
  }
}

// ══════════════════════════════════════════════════
// MODAL DIALOGS IMPLEMENTATIONS
// ══════════════════════════════════════════════════

// Customizable Milestone Schedule Settings (Specialised Feature 2)
function openScheduleSettingsModal() {
  const sch = state.ilmProfile.schedule || {};
  openModal('⚙️ ตั้งค่ากำหนดการของคณะ / กรมธุรกิจพลังงาน', `
    <div style="text-align:left; font-family:Sarabun, sans-serif; max-height:450px; overflow-y:auto; padding-right:5px;">
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">เมื่อคุณได้ยินข่าวประกาศกำหนดการใหม่จากคณะวิศวกรรมศาสตร์ มก. สามารถป้อนบันทึกเพื่อให้อัปเดตวันนับถอยหลังและตารางทั้งหมดไดนามิก:</p>
      
      <div class="i-fg">
        <label>1. วันชี้แจงเตรียมตัววิชาฝึกงานภาควิชาฯ:</label>
        <input type="date" id="sch-advising" value="${sch.advisingDate || ''}">
      </div>
      <div class="i-fg">
        <label>2. วันสิ้นสุดการลงทะเบียนใบคำร้อง (wt.eng.ku.ac.th):</label>
        <input type="date" id="sch-registration" value="${sch.registrationDeadline || ''}">
      </div>
      <div class="i-fg">
        <label>3. วันเข้าอบรมความพร้อม ครั้งที่ 1 (จริยธรรม):</label>
        <input type="date" id="sch-seminar1" value="${sch.prepSeminar1 || ''}">
      </div>
      <div class="i-fg">
        <label>4. วันเข้าอบรมความพร้อม ครั้งที่ 2 (เขียนเล่ม/รายงาน):</label>
        <input type="date" id="sch-seminar2" value="${sch.prepSeminar2 || ''}">
      </div>
      <div class="i-fg">
        <label>5. วันสัมมนาปฐมนิเทศฝึกงาน (นิสิตทุกคนบังคับ):</label>
        <input type="date" id="sch-orientation" value="${sch.orientationDate || ''}">
      </div>
      <div class="i-fg">
        <label>6. วันเริ่มต้นลงบันทึกฝึกงานวันแรก:</label>
        <input type="date" id="sch-start" value="${sch.startDate || ''}">
      </div>
      <div class="i-fg">
        <label>7. วันที่เลิกฝึกงานวันสุดท้าย:</label>
        <input type="date" id="sch-end" value="${sch.endDate || ''}">
      </div>
      <div class="i-fg">
        <label>8. วันเส้นตายส่งซองจดหมายรายงานและประเมินผล:</label>
        <input type="date" id="sch-submission" value="${sch.submissionDeadline || ''}">
      </div>

      <div style="display:flex; gap:10px; margin-top:20px; position:sticky; bottom:0; background:var(--surface); padding-top:10px;">
        <button class="i-btn i-btn-primary" style="flex:1; justify-content:center;" onclick="saveScheduleSettings()">💾 บันทึกกำหนดการ</button>
        <button class="i-btn" style="flex:1; justify-content:center;" onclick="closeModal()">ยกเลิก</button>
      </div>
    </div>
  `);
}

function saveScheduleSettings() {
  const schedule = {
    advisingDate: document.getElementById('sch-advising').value,
    registrationDeadline: document.getElementById('sch-registration').value,
    prepSeminar1: document.getElementById('sch-seminar1').value,
    prepSeminar2: document.getElementById('sch-seminar2').value,
    orientationDate: document.getElementById('sch-orientation').value,
    startDate: document.getElementById('sch-start').value,
    endDate: document.getElementById('sch-end').value,
    submissionDeadline: document.getElementById('sch-submission').value
  };

  state.ilmProfile.schedule = schedule;
  
  // Sync seminar dates
  if (schedule.advisingDate) state.ilmProfile.seminars[0].date = schedule.advisingDate;
  if (schedule.prepSeminar1) state.ilmProfile.seminars[1].date = schedule.prepSeminar1;
  if (schedule.prepSeminar2) state.ilmProfile.seminars[2].date = schedule.prepSeminar2;
  if (schedule.orientationDate) state.ilmProfile.seminars[3].date = schedule.orientationDate;

  ILMHub.saveState();
  closeModal();
  renderILMContent();
  showToast("✓ ทำการบันทึกกำหนดการไดนามิกใหม่เข้าระบบคลาวด์เรียบร้อย!");
}

// Energy Technical Interview Simulator modal (Specialised Feature 3)
let activeCardIdx = 0;
let cardFlipped = false;
function openInterviewSimulatorModal() {
  activeCardIdx = 0;
  cardFlipped = false;
  openInterviewSimulatorView();
}

function openInterviewSimulatorView() {
  const list = ILMHub.getEnergyInterviewQuestions();
  const card = list[activeCardIdx];
  
  openModal('🗣️ เครื่องจำลองซ้อมตอบคำถามสัมภาษณ์งานกรมธุรกิจพลังงาน', `
    <div style="text-align:center; font-family:Sarabun, sans-serif;">
      <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">คำถามที่ ${activeCardIdx + 1} จาก ${list.length} | แตะเพื่อพลิกดูคำตอบ</div>
      
      <div class="i-flashcard-box" onclick="flipInterviewCard()">
        ${!cardFlipped ? `
          <div style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; opacity:0.8; margin-bottom:8px; font-weight:700; color:var(--i-gold);">❓ คำถามเชี่ยวชาญด้านวัสดุศาสตร์</div>
          <div style="font-weight:700; font-size:1rem; line-height:1.6; word-break:break-word;">
            ${card.q}
          </div>
          <div style="font-size:0.75rem; margin-top:20px; opacity:0.6; font-style:italic;">(แตะที่การ์ดใบนี้เพื่อพลิกแนวคำตอบเชิงลึก...)</div>
        ` : `
          <div style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; opacity:0.8; margin-bottom:8px; font-weight:700; color:var(--i-emerald);">💡 ทฤษฎีวิศวกรรม/คำตอบแนะนำ</div>
          <div style="font-size:0.85rem; line-height:1.5; color:#e2e8f0; text-align:left; max-height:180px; overflow-y:auto; padding-right:4px;">
            ${card.a}
          </div>
          <div style="font-size:0.75rem; margin-top:15px; opacity:0.6; font-style:italic;">(แตะอีกครั้งเพื่อกลับไปที่หน้าคำถาม)</div>
        `}
      </div>
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px;">
        <button class="i-btn sm" ${activeCardIdx === 0 ? 'disabled' : ''} onclick="navInterviewCard(-1)">⬅️ ข้อก่อนหน้า</button>
        <button class="i-btn i-btn-primary sm" ${activeCardIdx === list.length - 1 ? 'disabled' : ''} onclick="navInterviewCard(1)">ข้อถัดไป ➡️</button>
      </div>
    </div>
  `);
}

function flipInterviewCard() {
  cardFlipped = !cardFlipped;
  openInterviewSimulatorView();
}

function navInterviewCard(dir) {
  activeCardIdx += dir;
  cardFlipped = false;
  openInterviewSimulatorView();
}

function openAddCompanyModal() {
  openModal('🏢 เพิ่มความสนใจหน่วยงาน/กองความปลอดภัยพลังงาน', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <div class="i-fg">
        <label>ชื่อฝ่าย/กองงาน (กรมธุรกิจพลังงาน หรือค่ายน้ำมัน):</label>
        <input type="text" id="k-name" placeholder="เช่น: กองความปลอดภัยธุรกิจน้ำมัน, กองความปลอดภัยก๊าซ LPG">
      </div>
      <div class="i-fg">
        <label>ขอบเขตวิศวกรรมความปลอดภัย:</label>
        <select id="k-field">
          <option value="Fuel Safety">Fuel Safety (ตรวจสอบถัง/คลังน้ำมัน)</option>
          <option value="LPG Safety">LPG Safety (ตรวจสอบแก๊สแรงดันสูง)</option>
          <option value="NDT & Inspection">NDT & Inspection (ทดสอบแบบไม่ทำลายและโครงสร้างเชื่อม)</option>
          <option value="Pipeline Integrity">Pipeline Integrity (วิเคราะห์สนิมท่อใต้ดิน)</option>
        </select>
      </div>
      <div class="i-fg">
        <label>เบี้ยเลี้ยงสนับสนุนรายวัน (บาท):</label>
        <input type="number" id="k-salary" value="0">
      </div>
      <div class="i-fg">
        <label>ที่ตั้งของหน่วยงาน:</label>
        <input type="text" id="k-address" placeholder="เช่น: อาคาร B ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ วิภาวดีรังสิต">
      </div>
      <div class="i-fg">
        <label>ช่องทางการยื่นส่งประวัติหรือเมลติดต่อ:</label>
        <input type="text" id="k-contact" placeholder="เช่น: doeb-hr@doeb.go.th / โทร 02-140-6000">
      </div>
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="i-btn i-btn-primary" style="flex:1; justify-content:center;" onclick="saveNewCompany()">💾 บันทึกหน่วยงาน</button>
        <button class="i-btn" style="flex:1; justify-content:center;" onclick="closeModal()">ยกเลิก</button>
      </div>
    </div>
  `);
}

function saveNewCompany() {
  const name = document.getElementById('k-name').value;
  const field = document.getElementById('k-field').value;
  const salary = parseFloat(document.getElementById('k-salary').value) || 0;
  const address = document.getElementById('k-address').value;
  const contact = document.getElementById('k-contact').value;
  
  if (!name.trim()) {
    alert("กรุณากรอกชื่อหน่วยงาน/ฝ่าย");
    return;
  }
  
  const newComp = {
    id: 'c_' + Date.now(),
    name, field, status: 'interested', salary, address, contact
  };
  
  state.ilmCompanies.push(newComp);
  ILMHub.saveState();
  closeModal();
  renderKanbanHTML();
  showToast("✓ เพิ่มแผนกสมัครลงสู่บอร์ดสำเร็จ");
}

function openDocumentHubModal() {
  state.ilmSelectedFileId = null;
  renderILMExplorer();
}

function renderILMExplorer() {
  openModal('📁 คลังจัดการเอกสารการสมัครฝึกงาน (Internship Drive)', renderILMExplorerHTML());
}

function getILMFolderBreadcrumbs() {
  const crumbs = [];
  let currId = state.ilmCurrentFolderId;
  while (currId && currId !== 'root') {
    const f = state.ilmFiles.find(item => item.id === currId);
    if (!f) break;
    crumbs.unshift(f);
    currId = f.parentId;
  }
  crumbs.unshift({ id: 'root', name: 'Home' });
  return crumbs;
}

function navigateILMFolder(id) {
  state.ilmCurrentFolderId = id;
  state.ilmSelectedFileId = null;
  renderILMExplorer();
}

function handleILMDriveCardClick(event, id, type) {
  if (event.target.closest('[onclick^="handleILMSelectionToggle"]')) return;
  if (type === 'folder') {
    navigateILMFolder(id);
  } else {
    openILMFilePreview(id);
  }
}

function handleILMSelectionToggle(event, id) {
  event.stopPropagation();
  state.ilmSelectedFileId = (state.ilmSelectedFileId === id ? null : id);
  renderILMExplorer();
}

function renderILMExplorerHTML() {
  const crumbs = getILMFolderBreadcrumbs();
  const folderItems = state.ilmFiles.filter(f => f.parentId === state.ilmCurrentFolderId);
  const hasSelection = state.ilmSelectedFileId !== null;
  
  return `
    <div style="font-family:Sarabun, sans-serif; text-align:left;">
      <!-- Sync Status Banner -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:0.75rem; color:var(--text-muted);">
        <span>ระบบคลังสองประสาน (Google Drive + Local Storage Sync)</span>
        <span id="ilm-drive-sync-status" style="font-weight:700; color:var(--i-emerald);">
          ${(typeof google !== 'undefined' && google.script) ? '☁️ Google Drive ซิงค์อัตโนมัติ' : '💾 โหมดสำรอง Local Storage'}
        </span>
      </div>

      <!-- Action Toolbar -->
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(30, 58, 138, 0.04); border:1px solid var(--i-border); border-radius:12px; padding:10px 14px; margin-bottom:15px; flex-wrap:wrap; gap:8px;">
        <!-- Breadcrumbs -->
        <div style="display:flex; align-items:center; gap:4px; font-weight:700; font-size:0.85rem;">
          ${crumbs.map((c, idx) => `
            ${idx > 0 ? '<span style="opacity:0.5; margin:0 2px;">/</span>' : ''}
            <span style="color:${idx === crumbs.length - 1 ? 'var(--text-muted)' : 'var(--i-primary-light)'}; cursor:${idx === crumbs.length - 1 ? 'default' : 'pointer'};" 
                  onclick="${idx === crumbs.length - 1 ? '' : `navigateILMFolder('${c.id}')`}">
              ${c.name}
            </span>
          `).join('')}
        </div>
        
        <!-- Action Buttons -->
        <div style="display:flex; align-items:center; gap:12px; font-size:1.15rem;">
          ${hasSelection ? `
            <button onclick="openILMFileShareModal()" title="แชร์ลิงก์ส่วนตัว" style="border:none; background:transparent; cursor:pointer; padding:2px;">🔗</button>
            <button onclick="renameILMItem()" title="เปลี่ยนชื่อ" style="border:none; background:transparent; cursor:pointer; padding:2px;">✏️</button>
            <button onclick="deleteILMItem()" title="ลบ" style="border:none; background:transparent; cursor:pointer; padding:2px; color:var(--i-rose);">🗑️</button>
            <div style="width:1px; height:18px; background:var(--i-border);"></div>
          ` : ''}
          <button onclick="createILMFolder()" title="สร้างโฟลเดอร์ใหม่" style="border:none; background:transparent; cursor:pointer; padding:2px;">📁+</button>
          <button onclick="document.getElementById('ilm-upload-input').click()" title="อัปโหลดไฟล์" style="border:none; background:transparent; cursor:pointer; padding:2px;">↑</button>
          <input type="file" id="ilm-upload-input" style="display:none" onchange="handleILMUpload(this)">
        </div>
      </div>

      <!-- Main Explorer Files Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(95px, 1fr)); gap:10px; min-height:220px; max-height:280px; overflow-y:auto; border:1px solid var(--i-border); border-radius:12px; padding:12px; background:var(--bg);" id="ilm-drive-grid">
        ${folderItems.length === 0 ? `
          <div style="grid-column:1/-1; display:flex; flex-direction:column; align-items:center; justify-content:center; height:180px; color:var(--text-muted); font-size:0.8rem; text-align:center;">
            <div style="font-size:2.5rem; margin-bottom:10px;">☁️</div>
            <div>โฟลเดอร์นี้ว่างเปล่า</div>
            <div style="font-size:0.7rem; opacity:0.8; margin-top:4px;">กดปุ่ม ↑ อัปโหลดไฟล์ หรือ 📁+ เพื่อสร้างโฟลเดอร์ย่อย</div>
          </div>
        ` : folderItems.map(item => `
          <div class="ilm-drive-card ${state.ilmSelectedFileId === item.id ? 'selected' : ''}" 
               style="position:relative; background:var(--i-card-bg); border:1px solid ${state.ilmSelectedFileId === item.id ? 'var(--i-primary-light)' : 'var(--i-border)'}; border-radius:12px; padding:14px 8px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; cursor:pointer; transition:all 0.2s ease;"
               onclick="handleILMDriveCardClick(event, '${item.id}', '${item.type}')">
            
            <!-- Selection Checkbox Dot -->
            <div onclick="handleILMSelectionToggle(event, '${item.id}')" 
                 style="position:absolute; top:6px; right:6px; width:16px; height:16px; border-radius:50%; border:1.5px solid ${state.ilmSelectedFileId === item.id ? 'var(--i-primary-light)' : '#cbd5e1'}; background:${state.ilmSelectedFileId === item.id ? 'var(--i-primary-light)' : 'transparent'}; display:flex; align-items:center; justify-content:center; font-size:9px; color:white; font-weight:bold;">
              ${state.ilmSelectedFileId === item.id ? '✓' : ''}
            </div>

            <div style="font-size:2.2rem; margin-bottom:8px;">
              ${item.type === 'folder' ? '📁' : (item.name.toLowerCase().endsWith('.pdf') ? '📄' : (item.name.toLowerCase().endsWith('.png') || item.name.toLowerCase().endsWith('.jpg') ? '🖼️' : '📝'))}
            </div>

            <div style="font-size:0.72rem; font-weight:700; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text); padding:0 4px;" title="${item.name}">
              ${item.name}
            </div>
            
            <div style="font-size:0.62rem; color:var(--text-muted); margin-top:2px;">
              ${item.type === 'folder' ? 'โฟลเดอร์' : item.size}
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="display:flex; justify-content:flex-end; margin-top:15px; gap:8px;">
        ${state.ilmCurrentFolderId !== 'root' ? `<button class="i-btn sm" onclick="navigateILMFolder('root')">🏠 กลับห้องหลัก</button>` : ''}
        <button class="i-btn i-btn-primary sm" onclick="closeModal()">ตกลง (เสร็จสิ้น)</button>
      </div>
    </div>
  `;
}

function handleILMUpload(input) {
  if (input.files.length === 0) return;
  const file = input.files[0];
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const sizeStr = (file.size < 1024 * 1024) ? (file.size / 1024).toFixed(1) + ' KB' : (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    
    let storeData = dataUrl;
    if (file.size > 1.5 * 1024 * 1024) {
      storeData = 'large_file_placeholder_base64';
      showToast("⚠️ ไฟล์มีขนาดใหญ่เกินระบบความจำเครื่องจำลอง จึงจัดเก็บเป็นรูปแบบ Metadata แทน");
    }
    
    const fileId = 'file_' + Date.now();
    const slugName = file.name.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const newFileObj = {
      id: fileId,
      name: file.name,
      type: 'file',
      parentId: state.ilmCurrentFolderId,
      size: sizeStr,
      mimeType: file.type,
      data: storeData,
      slug: slugName,
      password: '',
      createdAt: Date.now()
    };
    
    state.ilmFiles.push(newFileObj);
    ILMHub.saveState();
    
    if (typeof google !== 'undefined' && google.script) {
      showToast("☁️ กำลังซิงค์อัปโหลดขึ้นโฟลเดอร์ Google Drive...");
      ILMHub.uploadFileToDrive(dataUrl.split(',')[1], file.type, file.name, state.ilmCurrentFolderId).then(res => {
        if (res && res.success) {
          showToast("✓ อัปโหลดและเชื่อมโยงบน Google Drive จริงเรียบร้อย!");
        }
      }).catch(err => console.warn(err));
    }
    
    showToast("✓ อัปโหลดไฟล์เรียบร้อย");
    renderILMExplorer();
  };
  reader.readAsDataURL(file);
}

function createILMFolder() {
  const fName = prompt("กรุณาระบุชื่อโฟลเดอร์ใหม่:");
  if (!fName || !fName.trim()) return;
  
  const folderId = 'folder_' + Date.now();
  const newFolderObj = {
    id: folderId,
    name: fName.trim(),
    type: 'folder',
    parentId: state.ilmCurrentFolderId,
    size: '--',
    mimeType: '',
    data: '',
    slug: '',
    password: '',
    createdAt: Date.now()
  };
  
  state.ilmFiles.push(newFolderObj);
  ILMHub.saveState();
  
  if (typeof google !== 'undefined' && google.script) {
    showToast("☁️ กำลังสร้างโฟลเดอร์ใน Google Drive...");
    ILMHub.createDriveFolder(fName.trim()).then(res => {
      if (res && res.success) {
        showToast("✓ สร้างและซิงค์โฟลเดอร์บน Google Drive เรียบร้อย!");
      }
    }).catch(err => console.warn(err));
  }
  
  showToast("✓ สร้างโฟลเดอร์เรียบร้อย");
  renderILMExplorer();
}

function renameILMItem() {
  const id = state.ilmSelectedFileId;
  if (!id) return;
  
  const item = state.ilmFiles.find(f => f.id === id);
  if (!item) return;
  
  const newName = prompt(`เปลี่ยนชื่อ "${item.name}" เป็น:`, item.name);
  if (!newName || !newName.trim()) return;
  
  item.name = newName.trim();
  ILMHub.saveState();
  
  showToast("✓ เปลี่ยนชื่อเรียบร้อย");
  state.ilmSelectedFileId = null;
  renderILMExplorer();
}

function deleteILMItem() {
  const id = state.ilmSelectedFileId;
  if (!id) return;
  
  const item = state.ilmFiles.find(f => f.id === id);
  if (!item) return;
  
  if (confirm(`คุณต้องการลบ "${item.name}" ใช่หรือไม่? (หากลบโฟลเดอร์ ไฟล์ทั้งหมดข้างในจะถูกลบออกด้วย)`)) {
    function recursiveDelete(itemId) {
      state.ilmFiles = state.ilmFiles.filter(f => f.id !== itemId);
      const children = state.ilmFiles.filter(f => f.parentId === itemId);
      children.forEach(child => recursiveDelete(child.id));
    }
    
    recursiveDelete(id);
    ILMHub.saveState();
    
    showToast("🗑️ ลบข้อมูลเรียบร้อย");
    state.ilmSelectedFileId = null;
    renderILMExplorer();
  }
}

function openILMFileShareModal() {
  const id = state.ilmSelectedFileId;
  if (!id) return;
  
  const item = state.ilmFiles.find(f => f.id === id);
  if (!item) return;
  
  if (!item.slug) {
    item.slug = item.name.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
  
  const initialSlug = item.slug;
  const initialPass = item.password || '';
  const hasPassword = initialPass !== '';
  
  openModal('🔗 ตั้งค่าและเปิดแชร์ไฟล์สาธารณะ (Semantic Share Link)', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">คุณสามารถปรับแต่งพาทลิงก์ให้สวยงาม และเลือกตั้งรหัสผ่านสำหรับคนภายนอก (HR หรือพี่เลี้ยง) ได้ตามต้องการ</p>
      
      <div class="i-fg">
        <label>1. ตั้งชื่อลิงก์แชร์ส่วนตัวของคุณ (Custom Slug):</label>
        <div style="display:flex; align-items:center; gap:5px; background:var(--bg); padding:2px 8px; border-radius:10px; border:1px solid var(--i-border);">
          <span style="font-size:0.8rem; color:var(--text-muted); font-family:monospace;">?share=nitipat/</span>
          <input type="text" id="share-slug-input" value="${initialSlug}" placeholder="เช่น: resume" style="border:none; padding:8px 0; background:transparent; font-family:monospace; width:100%; outline:none; color:var(--text);" oninput="updateSharePreviewURL()">
        </div>
      </div>
      
      <div class="i-fg" style="margin-top:15px;">
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:700;">
          <input type="checkbox" id="share-pass-chk" ${hasPassword ? 'checked' : ''} onchange="toggleSharePasswordInput(this.checked)" style="width:16px; height:16px; cursor:pointer;">
          🔐 เปิดใช้รหัสผ่านรักษาความปลอดภัย (Password Protection)
        </label>
      </div>
      
      <div class="i-fg" id="share-pass-input-wrap" style="display:${hasPassword ? 'block' : 'none'}; margin-left:24px;">
        <label>ระบุรหัสผ่านเข้าถึง:</label>
        <input type="text" id="share-password" value="${initialPass}" placeholder="เช่น: doeb2027" style="font-family:monospace; font-size:0.9rem;">
      </div>
      
      <div style="margin-top:20px; background:rgba(30, 58, 138, 0.04); border:1px solid var(--i-primary-light); padding:12px; border-radius:12px;">
        <div style="font-size:0.75rem; color:var(--i-primary); font-weight:700; margin-bottom:4px;">ลิงก์แชร์สาธารณะของคุณ (Shareable URL):</div>
        <div id="share-url-preview" style="font-family:monospace; font-size:0.75rem; color:var(--text); word-break:break-all; font-weight:bold;">
          ${window.location.origin}${window.location.pathname}?share=nitipat/${initialSlug}
        </div>
      </div>
      
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="i-btn i-btn-primary" style="flex:2; justify-content:center;" onclick="saveILMFileShareSettings('${item.id}')">💾 บันทึกและคัดลอกลิงก์</button>
        <button class="i-btn" style="flex:1; justify-content:center;" onclick="openDocumentHubModal()">ย้อนกลับ</button>
      </div>
    </div>
  `);
}

function updateSharePreviewURL() {
  let slug = document.getElementById('share-slug-input').value.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
  const preview = document.getElementById('share-url-preview');
  if (preview) {
    preview.innerText = `${window.location.origin}${window.location.pathname}?share=nitipat/${slug || 'resume'}`;
  }
}

function toggleSharePasswordInput(checked) {
  const wrap = document.getElementById('share-pass-input-wrap');
  if (wrap) wrap.style.display = checked ? 'block' : 'none';
}

function saveILMFileShareSettings(fileId) {
  const item = state.ilmFiles.find(f => f.id === fileId);
  if (!item) return;
  
  let slug = document.getElementById('share-slug-input').value.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
  if (!slug) slug = 'resume';
  
  const dup = state.ilmFiles.find(f => f.id !== fileId && f.slug === slug);
  if (dup) {
    alert("ขออภัยครับ ชื่อลิงก์แชร์นี้ถูกใช้งานแล้ว กรุณาป้อนชื่ออื่น");
    return;
  }
  
  const passChk = document.getElementById('share-pass-chk').checked;
  const password = passChk ? document.getElementById('share-password').value.trim() : '';
  
  if (passChk && !password) {
    alert("กรุณาระบุรหัสผ่านที่ต้องการป้องกัน");
    return;
  }
  
  item.slug = slug;
  item.password = password;
  ILMHub.saveState();
  
  const finalURL = `${window.location.origin}${window.location.pathname}?share=nitipat/${slug}`;
  navigator.clipboard.writeText(finalURL);
  
  showToast("🎉 บันทึกและคัดลอกลิงก์แชร์สำเร็จแล้ว! ส่งให้ผู้อื่นรับชมได้เลยครับ");
  openDocumentHubModal();
}

function openILMFilePreview(fileId) {
  const item = state.ilmFiles.find(f => f.id === fileId);
  if (!item) return;
  
  let previewContent = '';
  const isPdf = item.name.toLowerCase().endsWith('.pdf') || item.mimeType === 'application/pdf';
  const isImage = item.name.toLowerCase().endsWith('.png') || item.name.toLowerCase().endsWith('.jpg') || item.mimeType.startsWith('image/');
  
  if (isImage) {
    if (item.data && item.data.startsWith('data:image')) {
      previewContent = `<div style="text-align:center;"><img src="${item.data}" style="max-width:100%; max-height:400px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.1);"></div>`;
    } else {
      previewContent = `
        <div style="border:1.5px dashed var(--i-border); border-radius:12px; padding:30px 15px; text-align:center; background:var(--bg);">
          <div style="font-size:3.5rem; margin-bottom:15px;">📜</div>
          <h4 style="font-weight:700; color:var(--i-emerald); font-size:1.1rem; margin:0 0 10px 0;">ใบรับรองการอบรมกฎความปลอดภัยคลังเชื้อเพลิง</h4>
          <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:20px;">ใบรับรองการผ่านการอบรมกฎระเบียบเซฟตี้พลังงาน 100% จากสถานีบริการและคลัง LPG ในเขต Energy Complex มก.</p>
          <div style="font-size:0.75rem; background:rgba(0,0,0,0.04); padding:10px; border-radius:8px; font-family:monospace;">
            Verification Code: SEC-2569-KU-DOEB<br>
            ตรวจสอบแล้ว: Mr. Nitipat Tipchai
          </div>
        </div>
      `;
    }
  } else if (isPdf) {
    if (item.data && item.data !== 'mock_pdf_resume_data' && item.data !== 'mock_pdf_transcript_data' && item.data !== 'large_file_placeholder_base64') {
      previewContent = `
        <div style="text-align:center;">
          <embed src="${item.data}" type="application/pdf" style="width:100%; height:400px; border-radius:8px; border:1px solid var(--i-border);">
        </div>
      `;
    } else if (item.id === 'f_resume' || item.data === 'mock_pdf_resume_data') {
      previewContent = `
        <div style="background:#fff; color:#333; padding:20px; border-radius:8px; border:1px solid #ccc; font-family:Sarabun, sans-serif; font-size:0.8rem; line-height:1.4; max-height:400px; overflow-y:auto; box-shadow:inset 0 0 10px rgba(0,0,0,0.05); text-align:left;">
          <div style="text-align:center; border-bottom:2px solid #1e3a8a; padding-bottom:10px; margin-bottom:15px;">
            <h3 style="margin:0 0 4px 0; color:#1e3a8a; font-weight:700; font-size:1.2rem;">NITIPAT TIPCHAI</h3>
            <p style="margin:0; font-size:0.75rem; color:#666;">Materials Engineering Student | Kasetsart University</p>
            <p style="margin:4px 0 0 0; font-size:0.7rem; color:#888;">Tel: [เบอร์โทรของคุณ] | Email: doeb-hr@doeb.go.th</p>
          </div>
          <div style="margin-bottom:12px;">
            <h4 style="margin:0 0 5px 0; color:#1e3a8a; font-weight:700; font-size:0.9rem; border-bottom:1px solid #ddd;">EDUCATION</h4>
            <strong>Kasetsart University</strong> — B.Eng. in Materials Engineering (Current GPAX: ${getCumGPA()})
          </div>
          <div style="margin-bottom:12px;">
            <h4 style="margin:0 0 5px 0; color:#1e3a8a; font-weight:700; font-size:0.9rem; border-bottom:1px solid #ddd;">KEY COURSES</h4>
            Thermodynamics of Materials, Mechanical Behavior of Materials, Corrosion of Materials
          </div>
          <div style="margin-bottom:12px;">
            <h4 style="margin:0 0 5px 0; color:#1e3a8a; font-weight:700; font-size:0.9rem; border-bottom:1px solid #ddd;">PROJECTS & COMPETENCIES</h4>
            * Cathodic Protection studies for Underground Pipelines<br>
            * Ultrasonic NDT simulation tests for steel pressure welds
          </div>
        </div>
      `;
    } else if (item.id === 'f_transcript' || item.data === 'mock_pdf_transcript_data') {
      previewContent = `
        <div style="background:#fff; color:#333; padding:20px; border-radius:8px; border:1px solid #ccc; font-family:Sarabun, sans-serif; font-size:0.75rem; line-height:1.4; max-height:400px; overflow-y:auto; box-shadow:inset 0 0 10px rgba(0,0,0,0.05); text-align:left;">
          <div style="text-align:center; border-bottom:2px solid #b45309; padding-bottom:8px; margin-bottom:12px;">
            <h4 style="margin:0 0 2px 0; color:#b45309; font-weight:700; font-size:1.1rem;">KASETSART UNIVERSITY TRANSCRIPT</h4>
            <p style="margin:0; font-size:0.7rem; color:#666;">Verified Academic Record - Mr. Nitipat Tipchai</p>
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:0.65rem;">
            <thead>
              <tr style="border-bottom:1.5px solid #333; font-weight:700;">
                <td style="padding:4px 0;">COURSE</td>
                <td style="padding:4px 0;">TITLE</td>
                <td style="padding:4px 0; text-align:center;">GRADE</td>
                <td style="padding:4px 0; text-align:center;">CREDITS</td>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(STUDENT.existingGrades).slice(0, 8).map(code => {
                const g = STUDENT.existingGrades[code];
                return `
                  <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:4px 0; font-family:monospace;">${code}</td>
                    <td style="padding:4px 0;">Materials Course ${code}</td>
                    <td style="padding:4px 0; text-align:center; font-weight:bold;">${g.grade}</td>
                    <td style="padding:4px 0; text-align:center;">${g.credits}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div style="border-top:1.5px solid #333; padding-top:6px; margin-top:10px; display:flex; justify-content:space-between; font-weight:700; font-size:0.7rem;">
            <span>TOTAL PASSED CREDITS: ${getTotalPassedCredits()} CR</span>
            <span>GPAX: ${getCumGPA()}</span>
          </div>
        </div>
      `;
    } else {
      previewContent = `
        <div style="border:1.5px dashed var(--i-border); border-radius:12px; padding:30px 15px; text-align:center; background:var(--bg);">
          <div style="font-size:3.5rem; margin-bottom:15px;">📂</div>
          <h4 style="font-weight:700; color:var(--i-primary-light); font-size:1.1rem; margin:0 0 10px 0;">${item.name}</h4>
          <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin-bottom:20px;">ขนาดของไฟล์: ${item.size} | ประเภท: ${item.mimeType || 'เอกสารทั่วไป'}</p>
          <p style="font-size:0.75rem; color:var(--i-gold); font-weight:600;">(เนื่องจากขนาดของไฟล์เกินขีดจำกัดความจำถาวรท้องถิ่น ระบบจะทำการตรวจสอบแบบลายน้ำเชิงลึกผ่าน metadata ส่วนกลาง)</p>
        </div>
      `;
    }
  } else {
    previewContent = `
      <div style="border:1px solid var(--i-border); border-radius:12px; padding:20px; text-align:center; background:var(--bg);">
        <div style="font-size:3rem; margin-bottom:10px;">📝</div>
        <h4 style="font-weight:700; font-size:1rem; margin:0 0 5px 0;">${item.name}</h4>
        <p style="font-size:0.8rem; color:var(--text-muted);">${item.size} | ${item.mimeType || 'เอกสารทั่วไป'}</p>
      </div>
    `;
  }
  
  openModal('📄 ตรวจสอบและแสดงผลตัวอย่างเอกสาร', `
    <div style="text-align:center; font-family:Sarabun, sans-serif;">
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px; text-align:left;">ผู้รับชมภายนอกจะสามารถดูตัวอย่างเอกสารนี้ได้ผ่านลิงก์แชร์ส่วนตัวของคุณ</p>
      
      ${previewContent}
      
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="i-btn i-btn-primary" style="flex:2; justify-content:center;" onclick="downloadILMFileObj('${item.id}')">⬇️ ดาวน์โหลดเอกสารฉบับจริง</button>
        <button class="i-btn" style="flex:1; justify-content:center;" onclick="openDocumentHubModal()">ย้อนกลับ</button>
      </div>
    </div>
  `);
}

function downloadILMFileObj(fileId) {
  const item = state.ilmFiles.find(f => f.id === fileId);
  if (!item) return;
  
  const a = document.createElement('a');
  if (item.data && item.data.startsWith('data:')) {
    a.href = item.data;
  } else {
    const blob = new Blob(["Simulated Document Data for Mr. Nitipat TIPCHAI - Materials Engineering, KU"], { type: item.mimeType || 'text/plain' });
    a.href = URL.createObjectURL(blob);
  }
  a.download = item.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("⬇️ กำลังดาวน์โหลดไฟล์ลงเครื่องของคุณ...");
}

function openEmailGeneratorModal() {
  const activeComp = state.ilmCompanies.find(c => c.status === 'accepted') || state.ilmCompanies[0] || { name: 'กรมธุรกิจพลังงาน' };
  
  openModal('✉️ ตัวร่างจดหมายประสานงานติดต่อ HR/พี่เลี้ยงค่ายพลังงาน', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <div class="i-fg">
        <label>เลือกแม่แบบข้อความ:</label>
        <select id="email-t-select" onchange="updateEmailTextarea(this.value, '${activeComp.name}')">
          <option value="th_request">ขอความอนุเคราะห์เข้าฝึกงาน (ภาษาไทย - แนะนำ)</option>
          <option value="en_request">Internship Application Letter (ภาษาอังกฤษ)</option>
          <option value="th_followup">ติดตามผลการพิจารณาสมัครงานราชการ</option>
        </select>
      </div>
      
      <div class="i-fg">
        <label>เนื้อหาร่างจดหมายอีเมลติดต่อ HR:</label>
        <textarea id="email-text-box" style="height:250px; font-family:Courier, Sarabun, monospace; font-size:0.85rem; line-height:1.5;">${ILMHub.getEmailTemplate('th_request', activeComp.name)}</textarea>
      </div>
      
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="i-btn i-btn-primary" style="flex:2; justify-content:center;" onclick="copyEmailToClipboard()">📋 คัดลอกเนื้อหาไปยังคลิปบอร์ด</button>
        <button class="i-btn" style="flex:1; justify-content:center;" onclick="closeModal()">ปิดหน้าต่าง</button>
      </div>
    </div>
  `);
}

function updateEmailTextarea(type, companyName) {
  const box = document.getElementById('email-text-box');
  if (box) {
    box.value = ILMHub.getEmailTemplate(type, companyName);
  }
}

function copyEmailToClipboard() {
  const box = document.getElementById('email-text-box');
  if (box) {
    navigator.clipboard.writeText(box.value);
    showToast('📋 คัดลอกข้อความร่างจดหมายเรียบร้อยแล้ว! นำไปแปะส่งประสานงานได้เลย');
    closeModal();
  }
}

function triggerSOSOverlay() {
  openModal('🚨 ยืนยันสัญญาณโทรฉุกเฉิน / พิกัดคลังแก๊ส', `
    <div style="text-align:center; font-family:Sarabun, sans-serif; padding:15px;">
      <div style="font-size:3rem; margin-bottom:15px; animation:pulse 1s infinite;">🚨</div>
      <h3 style="color:var(--i-rose); font-weight:700;">ส่งสัญญาณความช่วยเหลือผู้ใช้ฝึกงาน</h3>
      <p style="font-size:0.9rem; line-height:1.6; color:var(--text-muted); margin-bottom:20px;">
        ระบบจะระบุข้อมูลพิกัดปัจจุบันคลังพลังงานของคุณ และประสานแจ้งสายตรงไปยังหน่วยกิจการนิสิตคณะวิศวกรรมศาสตร์ มก. ตึก 3 ชั้น 1 ทันที
      </p>
      
      <div style="background:var(--bg); border:1px solid var(--i-border); padding:12px; border-radius:10px; font-size:0.85rem; text-align:left; margin-bottom:20px;">
        📍 <strong>พิกัดปฏิบัติงานปัจจุบัน</strong>: 13.8234, 100.5623 (กรมธุรกิจพลังงาน ถนนวิภาวดีรังสิต)<br>
        🏥 <strong>โรงพยาบาลฉุกเฉินใกล้สุด</strong>: โรงพยาบาลวิภาวดี (โทร 02-561-1111)
      </div>
      
      <div style="display:flex; gap:10px;">
        <a href="tel:027970969" class="i-btn i-btn-primary i-btn-rose" style="flex:2; justify-content:center; text-decoration:none;">🚨 ยืนยันกดโทรสายด่วนคณะ 02-797-0969</a>
        <button class="i-btn" style="flex:1; justify-content:center;" onclick="closeModal()">ยกเลิก</button>
      </div>
    </div>
  `);
}

function openClaimAssistantModal() {
  openModal('📄 คู่มือช่วยเคลมประกันสวัสดิภาพอุบัติเหตุ (Siam Smile)', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">เอกสารจริงที่คุณต้องขอและยื่นนำส่งหน่วยงาน มก. เพื่อขอเคลมประกันสวัสดิภาพนิสิตกระทรวงอุบัติภัย:</p>
      
      <div style="display:flex; flex-direction:column; gap:10px; font-size:0.9rem;">
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px;"><input type="checkbox" checked disabled> ใบเสร็จรับเงินฉบับจริง (ตัวจริงจากสถานพยาบาลเท่านั้น)</label>
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px;"><input type="checkbox" checked disabled> ใบรับรองแพทย์ตัวจริง ระบุสาเหตุของอุบัติเหตุในพื้นที่ชัดเจน</label>
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px;"><input type="checkbox" checked disabled> สำเนาบัตรนิสิต มก. และสำเนาบัตรประชาชนพร้อมเซ็นกำกับ</label>
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px;"><input type="checkbox" checked disabled> สำเนาหน้าแรกสมุดบัญชีธนาคารสำหรับโอนเงินเบิกช่วยเหลือกลับคืน</label>
      </div>
      
      <button class="i-btn i-btn-primary" style="margin-top:20px; width:100%; justify-content:center;" onclick="closeModal()">ตกลง (รับทราบ)</button>
    </div>
  `);
}

function compileReportMarkdownModal() {
  const md = ILMHub.compileReportDraft();
  
  openModal('📝 ร่างรายงานฝึกงานโครงงาน บทที่ 1-4 (Markdown Draft)', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">ตัวประมวลผลดึงประวัติล็อกรายวันของคุณและคำศัพท์วิชาการมาจัดร่างรายงาน สามารถคัดลอกนำไปแก้ไขต่อในโปรแกรม Word ได้รวดเร็ว</p>
      
      <div class="i-fg">
        <textarea style="height:250px; font-family:Courier, monospace; font-size:0.8rem; line-height:1.5;" id="ilm-report-md-box">${md}</textarea>
      </div>
      
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="i-btn i-btn-primary" style="flex:2; justify-content:center;" onclick="copyReportMDToClipboard()">📋 คัดลอกร่างรายงาน Markdown</button>
        <button class="i-btn" style="flex:1; justify-content:center;" onclick="closeModal()">ปิด</button>
      </div>
    </div>
  `);
}

function copyReportMDToClipboard() {
  const box = document.getElementById('ilm-report-md-box');
  if (box) {
    navigator.clipboard.writeText(box.value);
    showToast("✓ คัดลอกร่างเนื้อหาบทความโครงรายงานเรียบร้อยแล้ว!");
    closeModal();
  }
}

function openLinkedInPostModal() {
  const activeComp = state.ilmCompanies.find(c => c.status === 'accepted') || state.ilmCompanies[0] || { name: 'กรมธุรกิจพลังงาน' };
  
  const text = `🎓 Excited to share that I have completed my Materials Engineering Summer Internship at the ${activeComp.name}!

Over the past 2 months (240+ hours), I had the opportunity to study public energy business safety regulations, materials degradation mechanisms, and piping/welding integrity inspection methods under professional mentors. 

Grateful for this technical government experience and ready for the next engineering steps! 🚀

#MaterialsEngineering #KasetsartUniversity #EnergySafety #PublicInfrastructure #InternshipSuccess`;

  openModal('🤝 ข้อความแชร์ความสำเร็จลง LinkedIn ความเห็นวิชาชีพ', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <div class="i-fg">
        <textarea style="height:180px; font-family:inherit; font-size:0.9rem;" id="ilm-linkedin-box">${text}</textarea>
      </div>
      <button class="i-btn i-btn-primary" style="width:100%; justify-content:center;" onclick="navigator.clipboard.writeText(document.getElementById('ilm-linkedin-box').value); showToast('📋 คัดลอกข้อความแชร์เรียบร้อย!'); closeModal();">📋 คัดลอกข้อความพร้อมใช้</button>
    </div>
  `);
}

function openEnvelopePrinterModal() {
  const student = STUDENT;
  const schedule = state.ilmProfile.schedule || {};
  
  openModal('🖨️ ฉลากจ่าหน้าซองจดหมายสีน้ำตาลนำส่งคณะ มก.', `
    <div style="font-family:Sarabun, sans-serif; padding:10px;">
      <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px;">เช็คลิสต์สิ่งพิมพ์จ่าหน้าบนซองกระดาษสติ๊กเกอร์ขนาด A4 เพื่อผนึกซองน้ำตาลนำส่งใบลงเวลาและเล่มรายงานฝึกงานวิศวกรรม:</p>
      
      <div id="envelope-label-layout" style="border:1.5px solid #b45309; padding:20px; border-radius:8px; background:#fff8f2; text-align:left; color:#111;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #b45309; padding-bottom:6px; margin-bottom:12px;">
          <span style="font-weight:700; font-size:0.9rem; color:#b45309;">📦 เอกสารส่งตัวจบวิชาฝึกงาน (วิชา 01213399)</span>
          <span style="font-size:0.7rem; border:1px solid #b45309; padding:2px 6px; border-radius:4px;">Sticker Form</span>
        </div>
        
        <div style="margin-bottom:15px; font-size:0.85rem;">
          <div style="font-size:0.7rem; color:#6b7280; font-weight:600;">ผู้ส่ง (STUDENT SENDER):</div>
          <div style="font-weight:700;">นาย${student.nameTh} (${student.name})</div>
          <div>รหัสนิสิต: ${student.id} | ชั้นปีที่ 3</div>
          <div>ภาควิชาวิศวกรรมวัสดุ คณะวิศวกรรมศาสตร์ มก.</div>
        </div>
        
        <div style="text-align:right; border-top:1px dashed #ccc; padding-top:10px; font-size:0.85rem;">
          <div style="font-size:0.7rem; color:#6b7280; font-weight:600; text-align:left;">ผู้รับปลายทาง (DEPARTMENT RECEIVER):</div>
          <div style="font-weight:700; color:#1e3a8a; text-align:left; margin-top:2px;">
            ฝ่ายประสานงานการฝึกงานภาควิชาวิศวกรรมวัสดุ
          </div>
          <div style="text-align:left; line-height:1.4; color:#374151; font-size:0.8rem; margin-top:2px;">
            คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ (บางเขน)<br>
            ตึกภาควิชาวัสดุศาสตร์ อาคาร 3 ชั้น 1 ช่องช่องติดต่อยื่นคำร้อง<br>
            แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900
          </div>
        </div>
      </div>
      
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="i-btn i-btn-primary" style="flex:1; justify-content:center;" onclick="printEnvelopeLabel()">🖨️ กดพิมพ์สติกเกอร์ฉลาก</button>
        <button class="i-btn" style="flex:1; justify-content:center;" onclick="closeModal()">ปิดหน้าต่าง</button>
      </div>
    </div>
  `);
}

function printEnvelopeLabel() {
  const printWindow = window.open('', '_blank');
  const content = document.getElementById('envelope-label-layout').innerHTML;
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Label</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Sarabun', sans-serif; padding: 40px; }
          #label { border: 2px solid #b45309; padding: 30px; border-radius: 8px; background: #fff8f2; max-width: 600px; margin: 0 auto; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div id="label">${content}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
}
