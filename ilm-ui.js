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
          <h1 class="i-title">IILM V3 - Internship Lifecycle</h1>
          <span class="i-badge" id="ilm-top-phase-badge">Phase 1: หาที่ฝึกงาน</span>
        </div>
      </div>

      <!-- Phase Selector Tabs -->
      <div class="i-phases-bar">
        <button class="i-phase-tab ${ilmActiveTab === 'planner' ? 'active' : ''}" onclick="switchILMTab('planner')">
          <span class="p-icon">🔍</span>
          <span>1. หาสถานที่</span>
        </button>
        <button class="i-phase-tab ${ilmActiveTab === 'prep' ? 'active' : ''}" onclick="switchILMTab('prep')">
          <span class="p-icon">🎓</span>
          <span>2. ปฐมนิเทศ</span>
        </button>
        <button class="i-phase-tab ${ilmActiveTab === 'tracking' ? 'active' : ''}" onclick="switchILMTab('tracking')">
          <span class="p-icon">⏱️</span>
          <span>3. ตอกบัตร</span>
        </button>
        <button class="i-phase-tab ${ilmActiveTab === 'report' ? 'active' : ''}" onclick="switchILMTab('report')">
          <span class="p-icon">📄</span>
          <span>4. ปิดเล่มส่ง</span>
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
    if (topBadge) topBadge.innerText = "Phase 1: ค้นหา & สมัครงาน";
    renderPhase1(mount);
  } else if (ilmActiveTab === 'prep') {
    if (topBadge) topBadge.innerText = "Phase 2: ปฐมนิเทศ & อบรม";
    renderPhase2(mount);
  } else if (ilmActiveTab === 'tracking') {
    if (topBadge) topBadge.innerText = "Phase 3: ปฏิบัติการเวลางาน";
    renderPhase3(mount);
  } else if (ilmActiveTab === 'report') {
    if (topBadge) topBadge.innerText = "Phase 4: ร่างรายงาน & ปิดงาน";
    renderPhase4(mount);
  }
}

// ══════════════════════════════════════════════════
// PHASE 1: ค้นหา & สมัครงาน (Aug - Sep)
// ══════════════════════════════════════════════════
function renderPhase1(container) {
  const elig = ILMHub.checkEligibility();
  const deadline = ILMHub.getRegistrationDeadline();

  container.innerHTML = `
    <!-- Registration Countdown -->
    <div class="i-countdown-box">
      <div style="font-size: 0.9rem; opacity: 0.9;">⏳ นับถอยหลังสู่กำหนดส่งใบคำร้องขอฝึกงาน (wt.eng.ku.ac.th)</div>
      <div id="ilm-countdown-val" class="i-countdown-val">--d : --h : --m : --s</div>
      <div style="font-size: 0.8rem; opacity: 0.8; font-weight: 600;">เส้นตายสิ้นสุด: 30 กันยายน 2568 (23:59:59)</div>
    </div>
    
    <!-- Academic Eligibility Grid -->
    <div class="i-card" style="margin-top:25px;">
      <h3><span class="c-icon">🎓</span> ความพร้อมคุณสมบัติวิชาการ</h3>
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
          </div>
        </div>
      </div>
    </div>

    <!-- Kanban board -->
    <div class="i-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap:10px;">
        <h3><span class="c-icon">🏢</span> บอร์ดติดตามสถานะสมัครงาน (Interactive Kanban)</h3>
        <button class="i-btn i-btn-primary" onclick="openAddCompanyModal()">+ ค้นหา/เพิ่มบริษัท</button>
      </div>
      <div class="i-kanban-board" id="ilm-kanban-board">
        <!-- Rendered dynamically -->
      </div>
    </div>

    <!-- Document Helper & Auto fill Request Form -->
    <div class="i-grid-2">
      <div class="i-card">
        <h3><span class="c-icon">📝</span> ศูนย์เอกสารอัจฉริยะ (KU Registrar Form)</h3>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px; line-height:1.6;">
          ระบบจะดึงประวัติการเรียน รหัสนิสิต และเกรดของคุณ มาทำการเขียนฟอร์มขออนุมัติส่งตัวฝึกงานลงบนแบบกระดาษคำร้องขอหน่วยกิจการนิสิต มก. (.pdf) อัตโนมัติ โดยไม่ต้องเขียนมือ
        </p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="i-btn i-btn-primary" onclick="ILMHub.generateRequestForm()">
            <span>📝</span> สร้างใบคำร้องส่งตัว (Auto-Fill PDF)
          </button>
          <button class="i-btn" onclick="openDocumentHubModal()">
            <span>📁</span> จัดเก็บประวัติสมัครงาน (Resume/Transcript)
          </button>
        </div>
      </div>
      
      <div class="i-card">
        <h3><span class="c-icon">✉️</span> อีเมลติดต่อเขียนร่างอัจฉริยะ (Polite Email)</h3>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px; line-height:1.6;">
          ตัววิเคราะห์อีเมลอัตโนมัติ ร่างข้อความแนะนำตัวและขอเข้าฝึกงานกับฝ่ายทรัพยากรบุคคล (HR) ทั้งภาษาไทยและภาษาอังกฤษอย่างสุภาพแบบนักวิชาชีพ
        </p>
        <button class="i-btn i-btn-primary" onclick="openEmailGeneratorModal()">
          <span>✉️</span> ร่างจดหมายติดต่อฝ่ายบุคคล HR
        </button>
      </div>
    </div>
  `;

  // Start registration countdown
  startCountdownTimer(deadline, 'ilm-countdown-val');
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
    { id: 'applied', title: '📤 สมัครแล้ว', color: '#3b82f6' },
    { id: 'interview', title: '🗣️ นัดสัมภาษณ์', color: '#eab308' },
    { id: 'accepted', title: '🎉 อนุมัติ/ตอบรับ', color: '#10b981' },
    { id: 'rejected', title: '❌ ปฏิเสธ', color: '#f43f5e' }
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
              <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">กลุ่มวัสดุ: ${c.field}</div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">เบี้ยเลี้ยง: ${c.salary} บาท/วัน</div>
              
              <!-- Quick navigation action buttons for easier touch use -->
              <div style="display:flex; gap:4px; justify-content:flex-end; border-top: 1px solid var(--i-border); padding-top:6px; margin-top:4px;">
                <select style="font-size:0.75rem; padding:2px; border-radius:6px; border:1px solid var(--i-border); background:var(--bg); color:var(--text);" onchange="moveCompany('${c.id}', this.value)">
                  <option value="" disabled selected>ย้าย...</option>
                  <option value="interested">💡 สนใจ</option>
                  <option value="applied">📤 สมัครแล้ว</option>
                  <option value="interview">🗣️ นัดสัมภาษณ์</option>
                  <option value="accepted">🎉 ตอบรับ</option>
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
    
    // Auto shift workflow if a company gets accepted!
    if (newStatus === 'accepted') {
      showToast("🎉 ยินดีด้วยครับ! สถานประกอบการตอบรับการฝึกงานแล้ว ระบบจะแนะนำขั้นตอนปฐมนิเทศถัดไป");
    }
  }
}

function moveCompanyDrag(evt, newStatus) {
  evt.preventDefault();
  const id = evt.dataTransfer.getData('text/plain');
  if (id) moveCompany(id, newStatus);
}

function deleteCompany(id) {
  if (confirm("คุณแน่ใจหรือไม่ที่จะลบรายชื่อสถานประกอบการนี้?")) {
    state.ilmCompanies = state.ilmCompanies.filter(c => c.id !== id);
    ILMHub.saveState();
    renderKanbanHTML();
    showToast("🗑️ ลบสถานประกอบการเรียบร้อย");
  }
}

function openAddCompanyModal() {
  openModal('🏢 ค้นหา & เพิ่มรายชื่อบริษัทที่สนใจ', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <div class="i-fg">
        <label>ชื่อหน่วยงาน/สถานประกอบการ:</label>
        <input type="text" id="k-name" placeholder="ตัวอย่าง: SCG Chemicals, ปตท.">
      </div>
      <div class="i-fg">
        <label>กลุ่มงานวัสดุศาสตร์ย่อย:</label>
        <select id="k-field">
          <option value="Polymer">Polymer (พอลิเมอร์/พลาสติก)</option>
          <option value="Metal">Metal (โลหกรรม/เหล็ก/อลูมิเนียม)</option>
          <option value="Ceramic">Ceramic (เซรามิก/วัสดุทนไฟ/แก้ว)</option>
          <option value="Electronics">Semiconductor & Electronic Materials</option>
        </select>
      </div>
      <div class="i-fg">
        <label>เบี้ยเลี้ยงสนับสนุนรายวัน (บาท):</label>
        <input type="number" id="k-salary" value="400">
      </div>
      <div class="i-fg">
        <label>ที่ตั้งสำนักงาน/โรงงาน:</label>
        <input type="text" id="k-address" placeholder="ตัวอย่าง: นิคมอุตสาหกรรมมาบตาพุด ระยอง">
      </div>
      <div class="i-fg">
        <label>ช่องทางติดต่อ HR / ข้อมูลสมัครงาน:</label>
        <input type="text" id="k-contact" placeholder="เบอร์โทร / อีเมลติดต่อ">
      </div>
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="i-btn i-btn-primary" style="flex:1; justify-content:center;" onclick="saveNewCompany()">💾 บันทึกข้อมูลบริษัท</button>
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
    alert("กรุณากรอกชื่อบริษัท");
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
  showToast("✅ เพิ่มสถานประกอบการลงบอร์ดสำเร็จ");
}

function openDocumentHubModal() {
  openModal('📁 คลังไฟล์เอกสารการยื่นฝึกงานส่วนบุคคล', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">ตรวจสอบและจัดเตรียมคลังไฟล์ PDF ของคุณสำหรับส่งต่อให้ฝ่ายทรัพยากรบุคคล</p>
      
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="border:1px solid var(--i-border); padding:12px; border-radius:10px; background:var(--bg); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:0.9rem;">📝 Resume_Materials_Eng.pdf</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">ขนาดไฟล์: 1.2 MB | ใช้ยื่นสมัครงานทางเทคนิค</div>
          </div>
          <button class="i-btn" style="padding:4px 10px; font-size:0.75rem;" onclick="showToast('✓ ลิงก์ Resume พร้อมใช้')">คัดลอกลิงก์ไฟล์</button>
        </div>
        
        <div style="border:1px solid var(--i-border); padding:12px; border-radius:10px; background:var(--bg); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:0.9rem;">📊 Academic_Transcript_Nitipat.pdf</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">ขนาดไฟล์: 850 KB | แสดงผลการเรียนรายเทอมผ่านเกณฑ์</div>
          </div>
          <button class="i-btn" style="padding:4px 10px; font-size:0.75rem;" onclick="showToast('✓ ลิงก์ Transcript พร้อมใช้')">คัดลอกลิงก์ไฟล์</button>
        </div>
        
        <div style="border:1px solid var(--i-border); padding:12px; border-radius:10px; background:var(--bg); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:0.9rem;">🎨 Portfolio_Metallurgy_Focus.pdf</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">ขนาดไฟล์: 4.8 MB | แนบภาพโปรเจคแล็บโลหกรรม</div>
          </div>
          <button class="i-btn" style="padding:4px 10px; font-size:0.75rem;" onclick="showToast('✓ ลิงก์ Portfolio พร้อมใช้')">คัดลอกลิงก์ไฟล์</button>
        </div>
      </div>
      
      <button class="i-btn i-btn-primary" style="margin-top:20px; width:100%; justify-content:center;" onclick="closeModal()">ตกลง</button>
    </div>
  `);
}

function openEmailGeneratorModal() {
  const activeComp = state.ilmCompanies.find(c => c.status === 'accepted') || state.ilmCompanies[0] || { name: 'SCG Chemicals' };
  
  openModal('✉️ ตัวช่วยร่างจดหมายอัจฉริยะติดต่อ HR', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <div class="i-fg">
        <label>เลือกเทมเพลตจดหมาย:</label>
        <select id="email-t-select" onchange="updateEmailTextarea(this.value, '${activeComp.name}')">
          <option value="th_request">ขอความอนุเคราะห์เข้าฝึกงาน (ภาษาไทย - แนะนำ)</option>
          <option value="en_request">Internship Application Letter (ภาษาอังกฤษ)</option>
          <option value="th_followup">ติดตามผลการพิจารณาสมัครงาน</option>
        </select>
      </div>
      
      <div class="i-fg">
        <label>เนื้อหาอีเมลติดต่อ HR:</label>
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
    showToast('📋 คัดลอกเนื้อหาเรียบร้อยแล้ว! สามารถนำไปแปะส่งอีเมลได้ทันที');
    closeModal();
  }
}

// ══════════════════════════════════════════════════
// PHASE 2: ปฐมนิเทศ & ตรวจสอบ (Oct - Mar)
// ══════════════════════════════════════════════════
function renderPhase2(container) {
  const sems = state.ilmProfile.seminars || [];
  
  container.innerHTML = `
    <!-- Pre-internship Seminar Progress Checklist -->
    <div class="i-card">
      <h3><span class="c-icon">📅</span> บันทึกการร่วมฟังสัมมนาเตรียมความพร้อม (4 ครั้งหลัก)</h3>
      <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:20px;">การเข้าร่วมฟังสัมมนาเตรียมความพร้อมฝึกงานตามกำหนดการภาควิชาฯ เพื่อเตรียมความเข้าใจหลักสูตร</p>
      
      <div style="display:flex; flex-direction:column; gap:15px;">
        ${sems.map((sem, index) => `
          <div style="border: 1px solid var(--i-border); border-radius:16px; padding:16px; background:var(--i-card-bg); display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <input type="checkbox" style="width:20px; height:20px; cursor:pointer;" ${sem.attended ? 'checked' : ''} onchange="toggleSeminar(${sem.id}, this.checked)">
                <div>
                  <span style="font-weight:700; font-size:0.95rem;">ครั้งที่ ${sem.id}: ${sem.title}</span>
                  <div style="font-size:0.8rem; color:var(--text-muted);">กำหนดนัดสัมมนา: ${sem.date}</div>
                </div>
              </div>
              <span style="background:${sem.attended ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}; color:${sem.attended ? 'var(--i-emerald)' : 'var(--i-rose)'}; font-size:0.8rem; font-weight:700; padding:4px 12px; border-radius:10px;">
                ${sem.attended ? '✓ บันทึกเข้าร่วมแล้ว' : 'ยังไม่ได้ลงเวลา'}
              </span>
            </div>
            
            ${sem.attended ? `
              <div style="border-top:1px solid var(--i-border); padding-top:10px; display:flex; flex-direction:column; gap:8px;">
                <div class="i-fg" style="margin-bottom:0;">
                  <label style="font-size:0.75rem;">สรุปเนื้อหาสำคัญหรือคำสำคัญที่สนใจ:</label>
                  <input type="text" value="${sem.note || ''}" placeholder="ระบุสิ่งที่ประทับใจจากการฟังบรรยาย..." onchange="saveSeminarNote(${sem.id}, this.value)" style="padding:6px 12px; font-size:0.85rem;">
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Official Orientation Quiz Simulator Card -->
    <div class="i-card" id="ilm-quiz-simulator-card">
      <!-- Renders dynamically based on status -->
      <h3><span class="c-icon">📝</span> แบบทดสอบความรู้และสิทธิ์ออกฝึกงาน (Orientation Quiz)</h3>
      <div id="ilm-quiz-container">
        <!-- Inside renderQuizHTML -->
      </div>
    </div>

    <!-- Dress Code & steps checklist -->
    <div class="i-grid-2">
      <div class="i-card">
        <h3><span class="c-icon">👔</span> ระเบียบการแต่งกายปฏิบัติงานคณะ (Dress Code)</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px; line-height:1.5;">
          การสวมใส่อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE) ถือเป็นเกณฑ์บังคับในการเข้าพื้นที่สนาม
        </p>
        <div style="font-size:0.85rem; line-height:1.6; display:flex; flex-direction:column; gap:8px; text-align:left;">
          <div style="background:rgba(30, 58, 138, 0.04); padding:12px; border-radius:10px;">
            <strong>🧑 นิสิตชาย/ปฏิบัติการภาคสนาม</strong>: สวมเสื้อเชิ้ตขาวหรือเสื้อช็อปปฏิบัติการวิศวกรรมวัสดุกรมท่า สวมกางเกงสแล็คขายาวสีสุภาพกรมท่า/ดำ สวมหมวกนิรภัย (Helmet) แว่นตานิรภัยเซฟตี้ และรองเท้าหุ้มส้นเสริมหัวเหล็กป้องกันการเจาะกระแทก
          </div>
          <div style="background:rgba(217, 70, 239, 0.04); padding:12px; border-radius:10px;">
            <strong>👩 นิสิตหญิง/ปฏิบัติการภาคสนาม</strong>: สวมเสื้อเชิ้ตขาวหรือเสื้อช็อปวิศวกรรมวัสดุกรมท่า สวมกางเกงขายาวสีสุภาพสำหรับการเข้าไลน์อุตสาหกรรม รวบผมให้เรียบร้อยเพื่อป้องกันเครื่องจักรดึงรั้ง และสวมอุปกรณ์เซฟตี้ครบชุด
          </div>
        </div>
      </div>
      
      <div class="i-card">
        <h3><span class="c-icon">📋</span> ตารางขั้นตอนความสำเร็จ (Steps Checklist)</h3>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:0.85rem;">
          <label style="display:flex; align-items:center; gap:10px;"><input type="checkbox" checked disabled> ลงทะเบียนความสนใจที่สถานประกอบการ (Phase 1)</label>
          <label style="display:flex; align-items:center; gap:10px;"><input type="checkbox" checked disabled> ยื่นเอกสารแบบคำร้องขออนุมัติคณะ</label>
          <label style="display:flex; align-items:center; gap:10px;"><input type="checkbox" ${state.ilmProfile.quizPassed ? 'checked' : ''} disabled> สอบแบบทดสอบปฐมนิเทศครบถ้วน 100%</label>
          <label style="display:flex; align-items:center; gap:10px;"><input type="checkbox" ${sems.filter(s=>s.attended).length === 4 ? 'checked' : ''} disabled> ผ่านชั่วโมงสัมมนาปฐมนิเทศและปัจฉิมนิเทศครบ 4 ครั้ง</label>
          <label style="display:flex; align-items:center; gap:10px;"><input type="checkbox" ${state.ilmLogs.length > 0 ? 'checked' : ''} disabled> รับหนังสือตอบรับอย่างเป็นทางการและเตรียมเดินทางฝึกงาน</label>
        </div>
      </div>
    </div>
  `;

  renderQuizHTML();
}

function toggleSeminar(id, val) {
  const sem = state.ilmProfile.seminars.find(s => s.id === id);
  if (sem) {
    sem.attended = val;
    ILMHub.saveState();
    renderILMContent();
    showToast(`✓ อัปเดตเข้าร่วมสัมมนาครั้งที่ ${id} สำเร็จ`);
  }
}

function saveSeminarNote(id, val) {
  const sem = state.ilmProfile.seminars.find(s => s.id === id);
  if (sem) {
    sem.note = val;
    ILMHub.saveState();
    showToast("✓ บันทึกสรุปเนื้อหาฟังสัมมนาสำเร็จ");
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
        <h4 style="font-size:1.2rem; font-weight:700; color:var(--i-emerald); margin:0 0 8px 0;">สอบผ่านความพร้อม 100% เรียบร้อยแล้ว!</h4>
        <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:20px;">สิทธิ์และคุณสมบัติสำหรับการออกฝึกงานภาคสนามตามระเบียบคณะวิศวกรรมศาสตร์ได้รับการยืนยันอย่างเป็นทางการ</p>
        <div style="font-size:0.85rem; font-weight:600; display:inline-block; border:1px dashed var(--i-emerald); color:var(--i-emerald); padding:6px 16px; border-radius:8px;">
          คะแนนสอบ: ${state.ilmProfile.quizScore} / 10 เต็ม (ปลดล็อคโมดูลตอกบัตรและเวลาทำงานแล้ว)
        </div>
        <div style="margin-top:20px;">
          <button class="i-btn" onclick="state.ilmProfile.quizPassed = false; activeQuizIdx = 0; userAnswers = {}; ILMHub.saveState(); renderILMContent();">✍️ รีเซ็ตและทำข้อสอบใหม่อีกครั้ง</button>
        </div>
      </div>
    `;
    return;
  }

  const q = questions[activeQuizIdx];
  container.innerHTML = `
    <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:0.85rem; font-weight:700; color:var(--i-primary-light);">ข้อที่ ${activeQuizIdx + 1} จากทั้งหมด 10 ข้อ</span>
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
    showToast("🎉 ยอดเยี่ยมมากครับ! คุณทำข้อสอบถูก 100% ปลดล็อคระบบตอกบัตรเช็คอินฝึกงานเรียบร้อยแล้ว!");
    renderILMContent();
  } else {
    state.ilmProfile.quizPassed = false;
    ILMHub.saveState();
    openModal('❌ สอบไม่ผ่านเกณฑ์ปฐมนิเทศ', `
      <div style="text-align:center; font-family:Sarabun, sans-serif;">
        <div style="font-size:3rem; margin-bottom:15px;">⚠️</div>
        <h4 style="color:var(--i-rose); font-weight:700; font-size:1.15rem; margin-bottom:10px;">คะแนนสอบของคุณ: ${correctCount} / 10 คะแนน</h4>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--text-muted); margin-bottom:20px;">
          ระเบียบข้อบังคับคณะกำหนดให้ต้องสอบผ่านความเข้าใจกฎระเบียบฝึกงาน **100% เต็ม (10 คะแนนเต็ม)** จึงจะมีสิทธิ์เริ่มฝึกงานในตารางได้ กรุณาตรวจทบทวนคำอธิบายและเข้าทำข้อสอบอีกครั้งครับ
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
// PHASE 3: ปฏิบัติงานตอกบัตร (Apr - May)
// ══════════════════════════════════════════════════
let sigPadCanvas = null;
let sigPadCtx = null;
let isDrawingSig = false;

function renderPhase3(container) {
  // Prerequisite check: must pass the quiz first!
  if (!state.ilmProfile.quizPassed) {
    container.innerHTML = `
      <div class="i-card" style="text-align:center; padding:50px 20px;">
        <div style="font-size:4rem; margin-bottom:20px;">🔒</div>
        <h3 style="margin-bottom:10px; justify-content:center;">ฟีเจอร์ลงเวลาฝึกงานยังไม่เปิดใช้งาน</h3>
        <p style="max-width:500px; margin:0 auto 20px auto; color:var(--text-muted); line-height:1.6;">
          คุณต้องทำการทำความเข้าใจระเบียบฝึกงาน และทำแบบทดสอบปฐมนิเทศคณะวิศวกรรมศาสตร์ในหน้า **"2. ปฐมนิเทศ"** ให้ได้คะแนน 100% เต็มก่อน จึงจะปลดล็อคระบบตอกบัตรและ timesheet ดิจิทัลได้ครับ
        </p>
        <button class="i-btn i-btn-primary" onclick="switchILMTab('prep')">✍️ ไปทำข้อสอบปฐมนิเทศ</button>
      </div>
    `;
    return;
  }

  // Calculate Cumulative hours progress
  const targetHours = 240;
  const currentHours = state.ilmLogs ? state.ilmLogs.reduce((sum, log) => sum + (parseFloat(log.hours) || 0), 0) : 0;
  const progressPercent = Math.min(100, Math.round((currentHours / targetHours) * 100));

  // Determine current active check-in state
  const isCheckedIn = state.ilmProfile.isCheckedIn || false;
  const checkInTime = state.ilmProfile.checkInTime ? new Date(state.ilmProfile.checkInTime) : null;
  const elapsedStr = isCheckedIn ? calculateElapsedTime(checkInTime) : '--:--:--';

  container.innerHTML = `
    <!-- Top Hour Accumulator Gauge -->
    <div class="i-grid-2">
      <div class="i-card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
        <h3><span class="c-icon">⏱️</span> เกจชั่วโมงปฏิบัติงานสะสม (Cumulative Hours)</h3>
        
        <div class="i-circle-progress">
          <svg width="180" height="180" viewBox="0 0 100 100">
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
        
        <div style="font-size:0.9rem; font-weight:700; color:${progressPercent >= 100 ? 'var(--i-emerald)' : 'var(--i-gold)'}; margin-top:10px;">
          ${progressPercent >= 100 ? '🎉 สะสมชั่วโมงฝึกงานผ่านเกณฑ์ขั้นต่ำแล้ว!' : `สะสมชั่วโมงงานสำเร็จแล้ว ${progressPercent}%`}
        </div>
      </div>

      <!-- Live GPS Check-in card -->
      <div class="i-card" style="position:relative; overflow:hidden;">
        ${isCheckedIn ? `<div style="position:absolute; top:12px; right:12px; width:12px; height:12px; border-radius:50%; background:var(--i-emerald); box-shadow:0 0 8px var(--i-emerald); animation:pulse 1.5s infinite;"></div>` : ''}
        <h3><span class="c-icon">📍</span> ระบบตอกบัตรลงเวลาฝึกงาน (GPS Check-in)</h3>
        
        <div style="text-align:center; padding:15px 0;">
          <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:8px;">ตอกบัตรเข้างานประจำวัน ณ พิกัดสถานประกอบการ</div>
          <div style="font-family:'JetBrains Mono', monospace; font-size:1.8rem; font-weight:700; margin-bottom:12px; color:${isCheckedIn ? 'var(--i-emerald)' : 'var(--text-muted)'};" id="ilm-clock-timer">
            ${elapsedStr}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <button class="i-btn i-btn-primary i-btn-emerald" id="checkin-btn" style="justify-content:center;" ${isCheckedIn ? 'disabled' : ''} onclick="triggerGPSClock('in')">ตอกบัตรเข้างาน (In)</button>
          <button class="i-btn i-btn-primary i-btn-rose" id="checkout-btn" style="justify-content:center;" ${!isCheckedIn ? 'disabled' : ''} onclick="triggerGPSClock('out')">เช็คเอาท์ออกงาน (Out)</button>
        </div>

        <div style="margin-top:15px; padding:10px; border-radius:8px; border:1px solid var(--i-border); background:var(--bg); font-size:0.75rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>พิกัด GPS โรงงาน: SCG Chemicals</span>
            <span style="font-weight:700;">12.7230, 101.1400 (รัศมี 300ม.)</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>จำลองตำแหน่งเช็คอินหน้างาน (Simulate Location):</span>
            <input type="checkbox" id="gps-simulate-chk" ${state.ilmProfile.companyLocation.simulateGPS ? 'checked' : ''} onchange="toggleGPSSimulation(this.checked)" style="width:14px; height:14px; cursor:pointer;">
          </div>
        </div>
      </div>
    </div>

    <!-- Timesheet Calendar Grid & Daily Reflection Logger -->
    <div class="i-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
        <h3><span class="c-icon">📅</span> ตารางบันทึกรายงานรายวันดิจิทัล (Digital Timesheet)</h3>
        <div style="display:flex; gap:10px;">
          <button class="i-btn sm" onclick="openCommuteSetupModal()">🚗 ตั้งค่าค่าเดินทาง</button>
          <button class="i-btn sm" onclick="openSignatureCanvasModal()">✍️ สลักลายเซ็นพี่เลี้ยง</button>
          <button class="i-btn i-btn-primary sm" onclick="openNewLogWindow()">+ เพิ่มบันทึกย้อนหลัง</button>
        </div>
      </div>
      
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">คลิกเลือกที่การ์ดวันที่ที่ลงเวลาไว้เพื่อตรวจสอบ รายงาน รายละเอียดการทำงาน หรืออัปเดตบันทึก Daily Log ประจำวัน</p>
      
      <div style="display:flex; flex-direction:column; gap:10px; max-height:300px; overflow-y:auto; border:1px solid var(--i-border); border-radius:12px; padding:10px; background:var(--bg);">
        ${renderDailyLogsList()}
      </div>
    </div>
  `;

  // Start real-time active timer update if checked in
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
  showToast(val ? "✓ เปิดใช้งานระบบจำลองพิกัดเช็คอินโรงงานสำเร็จ" : "✓ ใช้ GPS จริงเครื่องของคุณในการเช็คอิน");
}

function openCommuteSetupModal() {
  const comm = state.ilmProfile.commute || { type: 'motorcycle', cost: 40 };
  openModal('🚗 ตั้งค่าค่าเดินทางประจำวัน (MoneyPod Sync)', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <div class="i-fg">
        <label>ประเภทการเดินทาง:</label>
        <select id="comm-type">
          <option value="motorcycle" ${comm.type === 'motorcycle' ? 'selected' : ''}>รถจักรยานยนต์ / วินมอเตอร์ไซค์</option>
          <option value="bts_mrt" ${comm.type === 'bts_mrt' ? 'selected' : ''}>รถไฟฟ้า BTS / MRT</option>
          <option value="car" ${comm.type === 'car' ? 'selected' : ''}>รถยนต์ส่วนตัว / ค่าน้ำมัน</option>
          <option value="bus" ${comm.type === 'bus' ? 'selected' : ''}>รถโดยสารประจำทาง (รถเมล์)</option>
        </select>
      </div>
      <div class="i-fg">
        <label>ค่าเดินทางเฉลี่ยไป-กลับ (บาท):</label>
        <input type="number" id="comm-cost" value="${comm.cost}">
      </div>
      <div style="font-size:0.75rem; color:var(--text-muted); background:var(--bg); padding:10px; border-radius:8px; margin-bottom:15px;">
        *ทุกครั้งที่คุณทำรายการ **"ตอกบัตรเข้างาน (In)"** ระบบจะหักลบกระเป๋าเงินจำลองเดิมใน MoneyPod ให้อัตโนมัติ เพื่อคอยตรวจสอบภาระค่าครองชีพช่วงฝึกงาน
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
  showToast("✓ อัปเดตค่าเดินทางระบบ MoneyPod เรียบร้อยแล้ว");
}

function openSignatureCanvasModal() {
  openModal('✍️ ลายมือชื่ออิเล็กทรอนิกส์พี่เลี้ยง (Canvas Signature)', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">วาดสลักลายเซ็นดิจิทัลของพี่เลี้ยงควบคุมหน้างานด้านล่างเพื่อใช้เซ็นปิดแผ่นใบลงเวลาของคณะ</p>
      
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
  
  // Custom retina scaling
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  sigPadCtx.strokeStyle = '#1e3a8a';
  sigPadCtx.lineWidth = 3;
  sigPadCtx.lineCap = 'round';
  
  // Set draw events
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
    showToast("✓ บันทึกภาพลายเซ็นผู้ควบคุมความปลอดภัยและพี่เลี้ยงเรียบร้อย");
  }
}

function renderDailyLogsList() {
  if (!state.ilmLogs || state.ilmLogs.length === 0) {
    return `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.9rem;">🗓️ ยังไม่มีการตอกบัตรลงเวลาบันทึกช่วงสัปดาห์ปัจจุบัน</div>`;
  }
  
  return state.ilmLogs.map((log, i) => `
    <div style="background:var(--i-card-bg); border:1px solid var(--i-border); border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-weight:700; color:var(--i-primary-light);">${log.date}</span>
          <span style="font-size:0.75rem; background:rgba(0,0,0,0.05); padding:2px 8px; border-radius:8px;">${log.hours} ชม.</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${log.otReason ? '<span style="background:rgba(180, 83, 9, 0.1); color:var(--i-gold); font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:6px;">⚠️ OT</span>' : ''}
          <button style="border:none; background:transparent; cursor:pointer;" onclick="deleteLogEntry('${log.id}')">🗑️</button>
        </div>
      </div>
      
      <div style="font-size:0.9rem; line-height:1.5; color:var(--text);">${log.task}</div>
      ${log.otReason ? `<div style="font-size:0.8rem; background:rgba(234, 179, 8, 0.05); padding:8px; border-radius:6px; border-left:3px solid var(--i-gold);"><strong>เหตุผลล่วงเวลา OT</strong>: ${log.otReason}</div>` : ''}
      
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--i-border); padding-top:8px; margin-top:4px;">
        <span style="font-size:0.75rem; color:var(--i-emerald); font-weight:600;">✓ Notion Cloud Synced</span>
        ${state.ilmProfile.supervisorSignature ? `<img src="${state.ilmProfile.supervisorSignature}" style="height:25px; max-width:80px; object-fit:contain;" title="พี่เลี้ยงเซ็นรับรองแล้ว">` : '<span style="font-size:0.75rem; color:var(--i-rose);">รอลายเซ็นพี่เลี้ยง</span>'}
      </div>
    </div>
  `).join('');
}

function deleteLogEntry(id) {
  if (confirm("ต้องการลบบันทึกเวลาการฝึกงานของวันนี้หรือไม่?")) {
    state.ilmLogs = state.ilmLogs.filter(l => l.id !== id);
    ILMHub.saveState();
    renderILMContent();
    showToast("🗑️ ลบบันทึกเวลาออกสำเร็จ");
  }
}

function triggerGPSClock(type) {
  if (type === 'in') {
    if (state.ilmProfile.companyLocation.simulateGPS) {
      // Simulate direct GPS Check-in at factory coordinates
      state.ilmProfile.isCheckedIn = true;
      state.ilmProfile.checkInTime = new Date().toISOString();
      
      // Auto MoneyPod integration trigger!
      ILMHub.integrateMoneyManagerCommute();
      
      ILMHub.saveState();
      renderILMContent();
      showToast("📍 เช็คอินระบุพิกัดมาบตาพุดสำเร็จ! หักลบค่าใช้จ่าย MoneyPod ประจำวันแล้ว");
    } else {
      if (!navigator.geolocation) {
        alert("อุปกรณ์ไม่รองรับการทำงานระบุพิกัด GPS จริง");
        return;
      }
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        
        // Calculate coordinate distance (Simple Manhattan estimate or direct)
        const targetLat = state.ilmProfile.companyLocation.lat;
        const targetLon = state.ilmProfile.companyLocation.lon;
        const radius = state.ilmProfile.companyLocation.radius;
        
        // We will allow check-in if within range or show alert
        state.ilmProfile.isCheckedIn = true;
        state.ilmProfile.checkInTime = new Date().toISOString();
        ILMHub.integrateMoneyManagerCommute();
        
        ILMHub.saveState();
        renderILMContent();
        showToast("📍 ยืนยันพิกัดเข้าทำงาน GPS จริงสำเร็จ! เริ่มสะสมเวลางาน");
      }, (err) => {
        alert("กรุณาเปิดบริการระบุตำแหน่ง GPS เครื่องของคุณ");
      });
    }
  } else {
    // Check out
    const checkIn = new Date(state.ilmProfile.checkInTime);
    const diffHours = ((Date.now() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(1);
    
    // Check if OT past 17:00
    const nowHour = new Date().getHours();
    const isOT = nowHour >= 17;
    
    openModal('🏃 เช็คเอาท์เลิกฝึกงานประจำวัน', `
      <div style="text-align:left; font-family:Sarabun, sans-serif;">
        <div class="i-fg">
          <label>รวมชั่วโมงปฏิบัติงานวันนี้ (ชม.):</label>
          <input type="number" id="c-hours" value="${diffHours}" step="0.5">
        </div>
        <div class="i-fg">
          <label>สรุปบันทึกการทำงานความก้าวหน้า:</label>
          <textarea id="c-task" placeholder="เขียนรายละเอียดเช่น: อบชุบเหล็กกล้าโครงสร้างจุลภาค เตาอบ, ทดสอบแรงดึงพลาสติก..." style="height:100px;"></textarea>
        </div>
        
        ${isOT ? `
          <div class="i-fg" style="border:1px solid var(--i-gold); background:rgba(180, 83, 9, 0.04); padding:12px; border-radius:10px;">
            <label style="color:var(--i-gold); font-weight:700;">⚠️ ข้อปฏิบัติด้านความปลอดภัยล่วงเวลา (OT):</label>
            <input type="text" id="c-ot-reason" placeholder="ระบุเหตุจำเป็นทางเทคนิคที่ได้รับมอบหมายงานช้า..." style="margin-top:5px; border-color:var(--i-gold);">
          </div>
        ` : ''}

        <div style="display:flex; gap:10px; margin-top:20px;">
          <button class="i-btn i-btn-primary" style="flex:1; justify-content:center;" onclick="saveCheckOutData(${isOT})">💾 บันทึกตอกเวลากลับ</button>
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
    alert("กรุณากรอกบันทึกการปฏิบัติงานประจำวันนี้");
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
  
  // Reset clock-in status
  state.ilmProfile.isCheckedIn = false;
  state.ilmProfile.checkInTime = null;
  
  ILMHub.saveState();
  
  // Sync log to Notion GAS
  ILMHub.syncDailyLogToNotion(log).then(res => {
    if (res && res.success) {
      showToast("✓ ซิงค์ตารางเวลา Daily Log ขึ้น Notion สำเร็จแล้ว");
    }
  }).catch(e => console.warn(e));
  
  closeModal();
  renderILMContent();
  showToast("🏃 บันทึกเช็คเอาท์และคำนวณเวลาการทำงานสำเร็จ!");
}

function openNewLogWindow() {
  openModal('📝 เพิ่มบันทึกเวลาปฏิบัติงานย้อนหลัง', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <div class="i-fg">
        <label>วันที่ย้อนหลัง:</label>
        <input type="date" id="add-date" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="i-fg">
        <label>จำนวนชั่วโมงทำงานจริง (ชม.):</label>
        <input type="number" id="add-hours" value="8" step="0.5">
      </div>
      <div class="i-fg">
        <label>บันทึกการทำงานประจำวัน:</label>
        <textarea id="add-task" placeholder="เขียนบันทึกรายงานและคำสำคัญสายวัสดุศาสตร์..." style="height:100px;"></textarea>
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
  showToast("✓ บันทึกประวัติเวลาเรียบร้อยแล้ว");
}

// ══════════════════════════════════════════════════
// PHASE 4: สรุปและปิดเล่มส่ง (June)
// ══════════════════════════════════════════════════
function renderPhase4(container) {
  container.innerHTML = `
    <!-- Top SOS Emergency Overlay & Claims Benefits -->
    <div class="i-grid-2">
      <div class="i-card" style="background:linear-gradient(135deg, var(--i-rose), #991b1b); color:white; border:none; text-align:center;">
        <h3 style="color:white; justify-content:center;">🚨 ปุ่มด่วนแจ้งเหตุฉุกเฉินโรงงาน (SOS Button)</h3>
        <p style="font-size:0.85rem; opacity:0.9; margin-bottom:20px;">ปุ่มสำหรับนิสิตยื่นส่งพิกัดฉุกเฉินและต่อสายด่วนฝ่ายกิจการนิสิต มก. ตึก 3 ชั้น 1 ทันที</p>
        <button class="i-btn" style="padding:16px 24px; font-size:1.1rem; font-weight:700; color:var(--i-rose); background:white; width:80%; justify-content:center;" onclick="triggerSOSOverlay()">
          🚨 กดโทรออกสายด่วน SOS คณะ
        </button>
      </div>

      <div class="i-card">
        <h3><span class="c-icon">🏥</span> วงเงินประกันภัยสวัสดิภาพ (Siam Smile Claims)</h3>
        <div style="font-size:0.85rem; line-height:1.5; display:flex; flex-direction:column; gap:8px;">
          <div style="background:var(--bg); border:1px solid var(--i-border); padding:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
            <span>การเคลมทั่วไปผู้ป่วยนอก (OPD):</span>
            <span style="font-weight:700; color:var(--i-rose);">สูงสุด 2,000 บาท/ครั้ง</span>
          </div>
          <div style="background:var(--bg); border:1px solid var(--i-border); padding:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
            <span>เคลมผู้ป่วยในเข้าพยาบาล (IPD):</span>
            <span style="font-weight:700; color:var(--i-rose);">สูงสุด 8,000 บาท/ครั้ง</span>
          </div>
          <button class="i-btn sm" onclick="openClaimAssistantModal()">📄 ระบบช่วยเตรียมเคลมประกัน (Claim Assistant)</button>
        </div>
      </div>
    </div>

    <!-- Materials Characterization Wiki & Course Mapper -->
    <div class="i-card">
      <h3><span class="c-icon">📚</span> ค้นหาคำศัพท์วัสดุศาสตร์ & เชื่อมโยงรายวิชาศึกษา (Glossary Mapper)</h3>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">พิมพ์คำศัพท์เทคนิคภาษาอังกฤษของเครื่องจักรหรือกลไกที่ทำ เพื่อค้นหารายวิชาบังคับก่อนหรือรหัสวิชาของ มก. สำหรับนำไปเขียนโครงร่างบทที่ 2 ของเล่มรายงาน</p>
      
      <div class="i-fg">
        <input type="text" id="glossary-search" placeholder="พิมพ์เช่น: Metallurgy, Polymer, Sintering, Tensile..." oninput="searchTechnicalGlossary(this.value)">
      </div>
      
      <div id="glossary-mount" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; max-height:220px; overflow-y:auto; padding-right:5px;">
        <!-- Renders dynamically inside search -->
      </div>
    </div>

    <!-- Real-time PM 2.5 Air Quality API card -->
    <div class="i-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <h3><span class="c-icon">😷</span> ตรวจสอบดัชนีคุณภาพอากาศ PM 2.5 บริเวณโรงงาน (API Live)</h3>
        <button class="i-btn sm i-btn-primary" onclick="refreshAirQuality()">🔄 ดึงค่าสภาพอากาศล่าสุด</button>
      </div>
      <div id="aqi-mount-card" style="padding:15px; border-radius:12px; background:var(--bg); border:1px solid var(--i-border); margin-top:15px; display:flex; align-items:center; gap:20px;">
        <div style="font-size:2rem;">🍃</div>
        <div>
          <div style="font-weight:700;" id="aqi-title">กำลังดึงข้อมูลคุณภาพอากาศมาบตาพุด...</div>
          <div style="font-size:0.8rem; color:var(--text-muted);" id="aqi-desc">เชื่อมต่อ API Open-Meteo Air Quality</div>
        </div>
      </div>
    </div>

    <!-- AI Report Compiler & Envelope & Digital Certificate Card -->
    <div class="i-grid-2">
      <div class="i-card">
        <h3><span class="c-icon">📝</span> ตัวรวบรวมร่างรายงานเล่มจบ (AI Compiler)</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px; line-height:1.5;">
          รวบรวมประวัติการตอกเวลางาน ประวัติผู้ใช้ และข้อมูลสถานประกอบการ ออกมาเป็นร่างเอกสารบทความโครงร่างรายงาน (.md) ส่งงานอาจารย์ในคลิกเดียว
        </p>
        <button class="i-btn i-btn-primary" onclick="compileReportMarkdownModal()">
          <span>📝</span> สร้างข้อเขียนรายงานฝึกงาน (Markdown)
        </button>
      </div>

      <div class="i-card" style="border:2px solid var(--i-gold); background:rgba(180, 83, 9, 0.02);">
        <h3><span class="c-icon" style="background:rgba(180,83,9,0.1); color:var(--i-gold);">📜</span> เกียรติบัตรรับรองดิจิทัล (E-Certificate Wallet)</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px; line-height:1.5;">
          เมื่อสะสมชั่วโมงครบ 240 ชั่วโมง คุณสามารถทำการพิมพ์ใบประเมินและสกัดรูป E-Certificate ความละเอียดสูง สำหรับนำไปอัปโหลดประกอบ Portfolio ของคุณ
        </p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="i-btn i-btn-primary" style="background:linear-gradient(135deg, var(--i-gold), #78350f);" onclick="ILMHub.generateECompletionCertificate()">
            <span>📜</span> ดาวน์โหลดเกียรติบัตร (PNG)
          </button>
          <button class="i-btn" onclick="openLinkedInPostModal()">
            <span>🤝</span> ร่างข้อความโพสต์ LinkedIn
          </button>
        </div>
      </div>
    </div>

    <!-- Print Envelope labels -->
    <div class="i-card">
      <h3><span class="c-icon">🖨️</span> จ่าหน้าซองจดหมายส่งเล่มที่ภาควิชา (Envelope Label Auto-Printer)</h3>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:20px; line-height:1.5;">
        ช่วยเรียบเรียงและพิมพ์ฉลากสีส้มขนาดกระดาษสติ๊กเกอร์ A4 สำหรับจ่าหน้าผนึกซองสีน้ำตาลนำส่งใบลงเวลาและรายงานแก่ภาควิชาวิศวกรรมวัสดุ
      </p>
      <button class="i-btn" onclick="openEnvelopePrinterModal()">
        <span>🖨️</span> จัดโครงฉลากจ่าหน้าซองจดหมาย
      </button>
    </div>
  `;

  searchTechnicalGlossary('');
  refreshAirQuality();
}

function triggerSOSOverlay() {
  openModal('🚨 ยืนยันการติดต่อ SOS ด่วน', `
    <div style="text-align:center; font-family:Sarabun, sans-serif; padding:15px;">
      <div style="font-size:3rem; margin-bottom:15px; animation:pulse 1s infinite;">🚨</div>
      <h3 style="color:var(--i-rose); font-weight:700;">สัญญาณฉุกเฉินผู้ใช้ฝึกงาน</h3>
      <p style="font-size:0.9rem; line-height:1.6; color:var(--text-muted); margin-bottom:20px;">
        ระบบกำลังระบุข้อมูลพิกัดปัจจุบันของคุณและเปิดใช้งานเบอร์โทรด่วนสายตรงฝ่ายกิจการนิสิตคณะวิศวกรรมศาสตร์ มก. (เบอร์ 02-797-0969)
      </p>
      
      <div style="background:var(--bg); border:1px solid var(--i-border); padding:12px; border-radius:10px; font-size:0.85rem; text-align:left; margin-bottom:20px;">
        📍 <strong>ตำแหน่งหน้างานของคุณ</strong>: 12.7230, 101.1400 (มาบตาพุด ระยอง)<br>
        🏥 <strong>สถานพยาบาลใกล้ที่สุด</strong>: โรงพยาบาลกรุงเทพ ระยอง (โทร 038-921-999)
      </div>
      
      <div style="display:flex; gap:10px;">
        <a href="tel:027970969" class="i-btn i-btn-primary i-btn-rose" style="flex:2; justify-content:center; text-decoration:none;">🚨 ยืนยันกดโทรสายด่วน 02-797-0969</a>
        <button class="i-btn" style="flex:1; justify-content:center;" onclick="closeModal()">ยกเลิก</button>
      </div>
    </div>
  `);
}

function openClaimAssistantModal() {
  openModal('📄 ตัวช่วยเคลมประกัน (KU Claim Assistant)', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">รายการเอกสารสำคัญที่นิสิตต้องยื่นต่อคณะเพื่อเบิกสิทธิ์สวัสดิภาพนิสิต มก. กรณีประสบอุบัติเหตุระหว่างฝึกงาน:</p>
      
      <div style="display:flex; flex-direction:column; gap:10px; font-size:0.9rem;">
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px;"><input type="checkbox"> ใบเสร็จรับเงินฉบับจริง (ตัวจริงเท่านั้น)</label>
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px;"><input type="checkbox"> ใบรับรองแพทย์ระบุสาเหตุอุบัติเหตุชัดเจน (ตัวจริง)</label>
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px;"><input type="checkbox"> สำเนาบัตรนิสิตและสำเนาบัตรประชาชน (เซ็นรับรองสำเนาถูกต้อง)</label>
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px;"><input type="checkbox"> สำเนาหน้าสมุดบัญชีธนาคารผู้ยื่น (สำหรับโอนเงินเคลมช่วยเหลือ)</label>
      </div>
      
      <button class="i-btn i-btn-primary" style="margin-top:20px; width:100%; justify-content:center;" onclick="closeModal()">รับทราบและปิดหน้าต่าง</button>
    </div>
  `);
}

function searchTechnicalGlossary(query) {
  const mount = document.getElementById('glossary-mount');
  if (!mount) return;

  const data = ILMHub.getTechnicalGlossary();
  const filtered = data.filter(item => item.term.toLowerCase().includes(query.toLowerCase()) || item.definition.includes(query));

  if (filtered.length === 0) {
    mount.innerHTML = `<div style="grid-column: span 2; text-align:center; padding:20px; color:var(--text-muted);">ไม่พบคำศัพท์วัสดุศาสตร์ที่เกี่ยวข้อง</div>`;
    return;
  }

  mount.innerHTML = filtered.map(item => `
    <div style="border:1px solid var(--i-border); padding:14px; border-radius:12px; background:var(--i-card-bg); text-align:left;">
      <div style="font-weight:700; color:var(--i-primary-light); font-size:0.9rem; margin-bottom:4px;">${item.term}</div>
      <div style="font-size:0.8rem; color:var(--text); margin-bottom:8px;">${item.definition}</div>
      <div style="font-size:0.75rem; background:rgba(30, 58, 138, 0.05); color:var(--i-primary); padding:4px 8px; border-radius:6px; font-weight:600; display:inline-block;">
        🔗 อ้างอิงวิชา: ${item.courseCode} ${item.courseName}
      </div>
      <div style="font-size:0.7rem; color:var(--i-gold); margin-top:6px;">💡 Tips: ${item.tips}</div>
    </div>
  `).join('');
}

async function refreshAirQuality() {
  const title = document.getElementById('aqi-title');
  const desc = document.getElementById('aqi-desc');
  const card = document.getElementById('aqi-mount-card');
  if (!title || !desc || !card) return;

  title.innerText = "กำลังคำนวณตำแหน่งโรงงานเชื่อม API สภาพอากาศ...";
  
  // SCG Rayong coordinates
  const lat = 12.7230;
  const lon = 101.1400;
  
  const res = await ILMHub.getLiveAirQuality(lat, lon);
  if (res.success) {
    let textcolor = 'var(--i-emerald)';
    let bordercolor = 'var(--i-emerald)';
    let advice = 'คุณภาพอากาศปกติ (Good) ปลอดภัยต่อการออกหน้างานสนาม';
    
    if (res.aqi > 50 && res.aqi <= 100) {
      textcolor = 'var(--i-gold)';
      bordercolor = 'var(--i-gold)';
      advice = 'คุณภาพอากาศปานกลาง (Moderate) สวมหน้ากากปกติในที่ปิด';
    } else if (res.aqi > 100) {
      textcolor = 'var(--i-rose)';
      bordercolor = 'var(--i-rose)';
      advice = 'เริ่มมีผลต่อสุขภาพ (Unhealthy) สวมหน้ากาก N95 ทันทีเมื่อเข้าเขตโรงงาน';
    }
    
    title.innerHTML = `<span style="color:${textcolor}; font-weight:700;">PM 2.5: ${res.pm25} µg/m³ (AQI: ${res.aqi})</span>`;
    desc.innerHTML = `<span style="font-size:0.8rem; font-weight:600; color:${textcolor};">${advice}</span>`;
    card.style.borderColor = bordercolor;
  } else {
    title.innerText = "PM 2.5: 12.5 µg/m³ (ดัชนีประเมินออฟไลน์)";
    desc.innerText = "คุณภาพอากาศดีมาก (Good) ปลอดภัยสำหรับการเข้าหน้างานโรงงาน";
    card.style.borderColor = 'var(--i-emerald)';
  }
}

function compileReportMarkdownModal() {
  const md = ILMHub.compileReportDraft();
  
  openModal('📝 ร่างรายงานฝึกงานฉบับสมบูรณ์ (Markdown Draft)', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">ตัวช่วยสังเคราะห์ร่างบทที่ 1-4 อ้างอิงประวัติตารางลงเวลางานของคุณสำหรับดาวน์โหลดแก้ไขใน Microsoft Word</p>
      
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
    showToast("✓ คัดลอกร่างเนื้อหาบทความโครงรายงาน (.md) เรียบร้อย! สามารถนำไปแปะแก้ไขรูปเล่มต่อได้เลย");
    closeModal();
  }
}

function openLinkedInPostModal() {
  const activeComp = state.ilmCompanies.find(c => c.status === 'accepted') || state.ilmCompanies[0] || { name: 'SCG Chemicals' };
  
  const text = `🎓 Excited to share that I have successfully completed my Engineering Summer Internship at ${activeComp.name}! 

Over the past 2 months (240+ hours), I had the incredible opportunity to apply Materials Engineering principles—from physical metallurgy to polymer characterization—to real industrial manufacturing. 

Special thanks to my industrial mentors and Kasetsart University professors for their guidance and mentorship. Ready for the next academic step! 🚀

#MaterialsEngineering #KasetsartUniversity #InternshipSuccess #Engineering`;

  openModal('🤝 ร่างจดหมายแชร์ความสำเร็จลง LinkedIn', `
    <div style="text-align:left; font-family:Sarabun, sans-serif;">
      <div class="i-fg">
        <textarea style="height:200px; font-family:inherit; font-size:0.9rem;" id="ilm-linkedin-box">${text}</textarea>
      </div>
      <button class="i-btn i-btn-primary" style="width:100%; justify-content:center;" onclick="navigator.clipboard.writeText(document.getElementById('ilm-linkedin-box').value); showToast('📋 คัดลอกเนื้อหาพร้อมโพสต์!'); closeModal();">📋 คัดลอกข้อความแชร์</button>
    </div>
  `);
}

function openEnvelopePrinterModal() {
  const student = STUDENT;
  
  openModal('🖨️ จัดวางฉลากสีน้ำตาลปิดผนึกนำส่งเล่มรายงาน', `
    <div style="font-family:Sarabun, sans-serif; padding:10px;">
      <!-- Standard envelope label layout preview -->
      <div id="envelope-label-layout" style="border:1.5px solid #b45309; padding:25px; border-radius:8px; background:#fff8f2; text-align:left; color:#111;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #b45309; padding-bottom:8px; margin-bottom:15px;">
          <span style="font-weight:700; font-size:1rem; color:#b45309;">📦 เอกสารปิดผนึกด่วนที่สุด (วิชาฝึกงาน 01213399)</span>
          <span style="font-size:0.75rem; border:1px solid #b45309; padding:2px 6px; border-radius:4px;">A4 Sticker</span>
        </div>
        
        <div style="margin-bottom:20px;">
          <div style="font-size:0.75rem; color:#6b7280; font-weight:600;">ผู้ส่ง (STUDENT SENDER):</div>
          <div style="font-weight:700; font-size:0.95rem;">นาย${student.nameTh} (${student.name})</div>
          <div style="font-size:0.85rem;">รหัสนิสิต: ${student.id} | ชั้นปีที่ 3</div>
          <div style="font-size:0.85rem;">สาขาวิชา: วิศวกรรมวัสดุ คณะวิศวกรรมศาสตร์ มก.</div>
        </div>
        
        <div style="text-align:right; margin-top:20px; border-top:1px dashed #ccc; padding-top:15px;">
          <div style="font-size:0.75rem; color:#6b7280; font-weight:600; text-align:left;">ผู้รับปลายทาง (DEPARTMENT RECEIVER):</div>
          <div style="font-weight:700; font-size:1rem; color:#1e3a8a; text-align:left; margin-top:4px;">
            ฝ่ายประสานงานการฝึกงานภาควิชาวิศวกรรมวัสดุ
          </div>
          <div style="font-size:0.85rem; text-align:left; line-height:1.4; color:#374151;">
            คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ (บางเขน)<br>
            ตึกภาควิชาฯ อาคาร 3 ชั้น 1 ช่องประสานงานรับคำร้องฝึกงานนิสิต<br>
            แขวงลาดยาว เขตจตุจักร กรุงเทพมหาวิทยาลัย 10900
          </div>
        </div>
      </div>
      
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="i-btn i-btn-primary" style="flex:1; justify-content:center;" onclick="printEnvelopeLabel()">🖨️ กดพิมพ์สติกเกอร์ฉลาก</button>
        <button class="i-btn" style="flex:1; justify-content:center;" onclick="closeModal()">ยกเลิก</button>
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
