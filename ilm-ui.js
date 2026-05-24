// ══════════════════════════════════════════════════
// ILM UI COMPONENTS (Module 1 - 6)
// ══════════════════════════════════════════════════

// Ensure ILM logic is loaded
if (typeof ILMHub === 'undefined') {
  console.error('ilm-logic.js must be loaded before ilm-ui.js');
}

// State variables for UI
let ilmActiveTab = 'planner';

// Render the main ILM dashboard
function renderILMPage() {
  setTimeout(renderILMContent, 50); // Render content after DOM is updated

  // Apply some basic styles if not present
  if (!document.getElementById('ilm-styles')) {
    const style = document.createElement('style');
    style.id = 'ilm-styles';
    style.innerHTML = `
      .ilm-tabs-scroll {
        overflow-x: auto;
        white-space: nowrap;
        background: var(--surface);
        padding-bottom: 10px;
        position: sticky;
        top: 60px;
        z-index: 10;
        border-bottom: 1px solid var(--border);
      }
      .ilm-tabs-scroll::-webkit-scrollbar { display: none; }
      .ilm-card {
        background: var(--surface);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        margin-bottom: 20px;
        border: 1px solid var(--border);
      }
      .ilm-card h3 {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--primary);
      }
      .countdown-box {
        background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
        color: white;
        text-align: center;
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 8px 20px rgba(255, 65, 108, 0.3);
      }
      .countdown-time {
        font-family: 'JetBrains Mono', monospace;
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: 2px;
        margin: 10px 0;
      }
      .kanban-board {
        display: flex;
        gap: 15px;
        overflow-x: auto;
        padding-bottom: 15px;
      }
      .kanban-col {
        min-width: 250px;
        background: var(--bg);
        border-radius: 12px;
        padding: 15px;
        border: 1px solid var(--border);
      }
      .kanban-card {
        background: var(--surface);
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        cursor: grab;
        border-left: 4px solid var(--primary);
      }
      .eligibility-check {
        padding: 15px;
        border-radius: 12px;
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: #166534;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .eligibility-check.failed {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #991b1b;
      }
    `;
    document.head.appendChild(style);
  }

  return \`
    <div class="top-nav" style="margin-bottom: 15px; background: transparent; padding: 0;">
      <div class="nav-title" style="flex:1; font-size: 1.5rem;">Internship Lifecycle (ILM)</div>
    </div>

    <div class="ilm-tabs-scroll">
      <div class="hub-tabs">
        <button class="hub-tab \${ilmActiveTab === 'planner' ? 'active' : ''}" onclick="switchILMTab('planner')">Planner</button>
        <button class="hub-tab \${ilmActiveTab === 'prep' ? 'active' : ''}" onclick="switchILMTab('prep')">Prep</button>
        <button class="hub-tab \${ilmActiveTab === 'tracking' ? 'active' : ''}" onclick="switchILMTab('tracking')">Tracking</button>
        <button class="hub-tab \${ilmActiveTab === 'safety' ? 'active' : ''}" onclick="switchILMTab('safety')">Safety</button>
        <button class="hub-tab \${ilmActiveTab === 'report' ? 'active' : ''}" onclick="switchILMTab('report')">Report</button>
        <button class="hub-tab \${ilmActiveTab === 'extra' ? 'active' : ''}" onclick="switchILMTab('extra')">Extra</button>
      </div>
    </div>

    <div class="main-content" id="ilm-content" style="padding-top: 20px;">
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading ILM Module...</div>
    </div>
  \`;
}

function switchILMTab(tab) {
  ilmActiveTab = tab;
  render();
}
// ... removed style block since it's now in renderILMPage ...

function renderILMContent() {
  const content = document.getElementById('ilm-content');
  if (!content) return;

  if (ilmActiveTab === 'planner') {
    renderPlanner(content);
  } else if (ilmActiveTab === 'prep') {
    renderPrep(content);
  } else if (ilmActiveTab === 'tracking') {
    renderTracking(content);
  } else if (ilmActiveTab === 'safety') {
    renderSafety(content);
  } else if (ilmActiveTab === 'report') {
    renderReport(content);
  } else if (ilmActiveTab === 'extra') {
    renderExtra(content);
  }
}

// --- Module 1 Renderers ---

function renderPlanner(container) {
  // Feature 1: Countdown
  const deadline = ILMHub.getRegistrationDeadline();
  
  // Feature 2 & 9: Eligibility & Prerequisite
  const elig = ILMHub.checkEligibility();

  container.innerHTML = `
    <!-- Feature 1: Countdown to KU System Deadline -->
    <div class="ilm-card countdown-box" style="margin-bottom: 20px;">
      <div style="font-size: 0.9rem; opacity: 0.9;">⏳ นับถอยหลังปิดรับลงทะเบียน (wt.eng.ku.ac.th)</div>
      <div id="ilm-countdown" class="countdown-time">--:--:--:--</div>
      <div style="font-size: 0.8rem; opacity: 0.8;">30 กันยายน 2568 23:59:59</div>
    </div>

    <!-- Feature 2 & 9: Eligibility Check & Prerequisite Alert -->
    <div class="ilm-card">
      <h3><span>🎓</span> สถานะความพร้อมทางวิชาการ</h3>
      <div class="eligibility-check ${elig.passed ? '' : 'failed'}">
        <span style="font-size: 1.5rem;">${elig.passed ? '✅' : '❌'}</span>
        <div>
          <div style="font-weight: 600;">${elig.passed ? 'ผ่านเกณฑ์คณะวิศวกรรมศาสตร์' : 'ไม่ผ่านเกณฑ์บางประการ'}</div>
          <div style="font-size: 0.85rem; opacity: 0.8;">หน่วยกิตสะสม: ${elig.earnedCredits} | บังคับก่อน: Thermodynamics</div>
        </div>
      </div>
      ${!elig.passed ? `
        <div style="margin-top: 10px; font-size: 0.85rem; color: #991b1b;">
          ${elig.messages.map(m => `• ${m}`).join('<br>')}
        </div>
      ` : ''}
    </div>

    <!-- Feature 3 & 4: Historic Company DB & Kanban Board -->
    <div class="ilm-card" style="padding-bottom: 5px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0;"><span>🏢</span> ติดตามสถานะสมัครงาน</h3>
        <button class="btn-glass sm" onclick="ILMHub.showCompanyDBModal()">+ ค้นหาบริษัทรุ่นพี่</button>
      </div>
      <div class="kanban-board" id="ilm-kanban">
        <!-- Rendered via JS -->
      </div>
    </div>
    
    <!-- Feature 5 & 6: Document Hub & Auto-Fill Form -->
    <div class="ilm-card">
      <h3><span>📄</span> ศูนย์เอกสารและยื่นคำร้อง</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div class="quick-btn" onclick="ILMHub.generateRequestForm()" style="background: var(--bg); border: 1px solid var(--border); padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;">
          <div style="font-size: 1.5rem; margin-bottom: 5px;">📝</div>
          <div style="font-weight: 600; font-size: 0.9rem;">สร้างใบคำร้องส่งตัว</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Auto-Fill PDF</div>
        </div>
        <div class="quick-btn" onclick="ILMHub.openDocumentHub()" style="background: var(--bg); border: 1px solid var(--border); padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;">
          <div style="font-size: 1.5rem; margin-bottom: 5px;">📁</div>
          <div style="font-weight: 600; font-size: 0.9rem;">คลังเอกสารแนบ</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Resume & Transcript</div>
        </div>
      </div>
    </div>

    <!-- Feature 7, 8, 10: Email Gen, Verification, Wiki -->
    <div class="ilm-card">
      <h3><span>🛠</span> เครื่องมืออำนวยความสะดวก</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn-glass" onclick="ILMHub.openEmailGenerator()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">✉️</span> ร่างอีเมลติดต่อ HR อัตโนมัติ
        </button>
        <button class="btn-glass" onclick="ILMHub.openVerificationChecklist()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">📋</span> ตรวจสอบขั้นตอนระบบคณะ (wt.eng.ku.ac.th)
        </button>
        <button class="btn-glass" onclick="ILMHub.openRegulationWiki()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">📖</span> ค้นหากฎระเบียบฝึกงาน (Smart Search)
        </button>
      </div>
    </div>
  `;

  startILMCountdown(deadline);
  renderKanbanBoard();
}

let ilmCountdownTimer = null;
function startILMCountdown(deadline) {
  const el = document.getElementById('ilm-countdown');
  if (!el) return;
  
  if (ilmCountdownTimer) clearInterval(ilmCountdownTimer);
  
  ilmCountdownTimer = setInterval(() => {
    const elCheck = document.getElementById('ilm-countdown');
    if (!elCheck) {
      clearInterval(ilmCountdownTimer);
      return;
    }
    
    const now = new Date().getTime();
    const distance = deadline - now;
    
    if (distance < 0) {
      elCheck.innerHTML = "00:00:00:00";
      clearInterval(ilmCountdownTimer);
      return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    elCheck.innerHTML = `${days.toString().padStart(2, '0')}d:${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m:${seconds.toString().padStart(2, '0')}s`;
  }, 1000);
}

function renderKanbanBoard() {
  const kb = document.getElementById('ilm-kanban');
  if (!kb) return;

  const cols = [
    { id: 'interested', title: '💡 สนใจ' },
    { id: 'applied', title: '📤 ส่งใบสมัครแล้ว' },
    { id: 'interview', title: '🗣 นัดสัมภาษณ์' },
    { id: 'accepted', title: '🎉 ตอบรับ' },
    { id: 'rejected', title: '❌ ปฏิเสธ' }
  ];

  // Default data if empty
  if (!state.ilmCompanies || state.ilmCompanies.length === 0) {
    state.ilmCompanies = [
      { id: '1', name: 'SCG Chemicals', field: 'Polymer', status: 'interested' },
      { id: '2', name: 'PTT Global Chemical', field: 'Polymer', status: 'applied' }
    ];
  }

  kb.innerHTML = cols.map(c => {
    const cards = state.ilmCompanies.filter(comp => comp.status === c.id);
    return `
      <div class="kanban-col">
        <div style="font-weight: 600; margin-bottom: 10px; color: var(--text-muted); font-size: 0.9rem;">${c.title} (${cards.length})</div>
        ${cards.map(comp => `
          <div class="kanban-card" onclick="ILMHub.openCompanyDetails('${comp.id}')">
            <div style="font-weight: 600; font-size: 0.95rem;">${comp.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">สาย: ${comp.field}</div>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
}

// --- Module 2 Renderers ---
function renderPrep(container) {
  container.innerHTML = `
    <!-- Feature 13: Action Countdown -->
    <div class="ilm-card" style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white;">
      <div style="font-size: 0.9rem; opacity: 0.9; text-align: center;">⏰ นับถอยหลังปฐมนิเทศก่อนฝึกงาน</div>
      <div id="ilm-prep-countdown" class="countdown-time" style="text-align: center;">--:--:--:--</div>
      <div style="font-size: 0.8rem; opacity: 0.8; text-align: center;">คาดการณ์: มีนาคม 2569</div>
    </div>

    <!-- Feature 11, 15, 20: Test Prep & Simulation -->
    <div class="ilm-card">
      <h3><span>📝</span> ศูนย์เตรียมความพร้อม</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div class="quick-btn" onclick="ILMHub.startKUEPTQuiz()" style="background: var(--bg); border: 1px solid var(--border); padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;">
          <div style="font-size: 1.5rem; margin-bottom: 5px;">🇬🇧</div>
          <div style="font-weight: 600; font-size: 0.9rem;">จำลองสอบ KU-EPT</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">ฝึกฝนภาษาอังกฤษ</div>
        </div>
        <div class="quick-btn" onclick="ILMHub.startMockInterview()" style="background: var(--bg); border: 1px solid var(--border); padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;">
          <div style="font-size: 1.5rem; margin-bottom: 5px;">🗣</div>
          <div style="font-weight: 600; font-size: 0.9rem;">Mock Interview</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">จำลองสัมภาษณ์</div>
        </div>
      </div>
    </div>

    <!-- Feature 12, 19: Seminar Checklist & Form Tracker -->
    <div class="ilm-card">
      <h3><span>📋</span> Checklist ก่อนออกฝึกงาน</h3>
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left;">
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px; cursor:pointer;">
          <input type="checkbox"> เข้าร่วมสัมมนาเตรียมความพร้อม
        </label>
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px; cursor:pointer;">
          <input type="checkbox"> อบรมความปลอดภัยเบื้องต้น
        </label>
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px; cursor:pointer;">
          <input type="checkbox"> ส่งเอกสารรับรองตัว (ฟอร์ม 2-1)
        </label>
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px; cursor:pointer;">
          <input type="checkbox"> ทำแบบประเมินก่อนฝึกงาน (Pre-assessment)
        </label>
      </div>
    </div>

    <!-- Feature 14, 16, 17, 18: Dashboard & Resources -->
    <div class="ilm-card">
      <h3><span>📊</span> แหล่งความรู้ & การแจ้งเตือน</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn-glass" onclick="ILMHub.openDressCode()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">👔</span> กฎระเบียบการแต่งกาย
        </button>
        <button class="btn-glass" onclick="showToast('🔔 เปิดใช้งานการแจ้งเตือนแล้ว')" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">🔔</span> ตั้งค่าการแจ้งเตือน
        </button>
      </div>
    </div>
  `;
}

// --- Module 3 Renderers ---
function renderTracking(container) {
  // Mock data for hours if not exists
  const totalRequired = 320; // Example: 40 days * 8 hours
  const currentHours = state.ilmLogs ? state.ilmLogs.reduce((sum, log) => sum + (log.hours || 0), 0) : 0;
  const progressPercent = Math.min(100, Math.round((currentHours / totalRequired) * 100));

  container.innerHTML = `
    <!-- Feature 21, 23: GPS Geo-Fencing Check-in & Real-time Gauge -->
    <div class="ilm-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h3 style="margin-bottom: 5px;"><span>⏱</span> บันทึกเวลาปฏิบัติงาน</h3>
          <div style="font-size: 0.85rem; color: var(--text-muted);">ต้องฝึกงานไม่น้อยกว่า ${totalRequired} ชั่วโมง</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${currentHours} <span style="font-size: 1rem; color: var(--text-muted);">/ ${totalRequired} ชม.</span></div>
          <div style="font-size: 0.8rem; font-weight: 600; color: #16a34a;">${progressPercent}% Completed</div>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div style="height: 10px; background: var(--border); border-radius: 5px; overflow: hidden; margin-bottom: 20px;">
        <div style="height: 100%; width: ${progressPercent}%; background: var(--primary); border-radius: 5px; transition: width 0.5s ease;"></div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <button class="btn-premium" onclick="ILMHub.handleGPSCheckIn('in')" style="background: #16a34a; justify-content: center; box-shadow: 0 5px 15px rgba(22, 163, 74, 0.3);">
          📍 Check-in (เข้างาน)
        </button>
        <button class="btn-premium" onclick="ILMHub.handleGPSCheckIn('out')" style="background: #ef4444; justify-content: center; box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);">
          🏃 Check-out (ออกงาน)
        </button>
      </div>
      <div id="gps-status" style="margin-top: 10px; font-size: 0.8rem; text-align: center; color: var(--text-muted);">รอการเชื่อมต่อ GPS...</div>
    </div>

    <!-- Feature 22, 24, 25, 26: Timesheet & Daily Journal -->
    <div class="ilm-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0;"><span>📝</span> บันทึกประจำวัน (Daily Log)</h3>
        <button class="btn-glass sm" onclick="ILMHub.openNewLogModal()">+ เพิ่มบันทึก</button>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 10px;" id="ilm-log-list">
        ${renderLogList()}
      </div>
    </div>

    <!-- Feature 27-30: AI Summarizer, Feedback, Leave System -->
    <div class="ilm-card">
      <h3><span>🛠</span> ระบบจัดการเพิ่มเติม</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn-glass" onclick="ILMHub.generateWeeklyReport()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">🤖</span> สรุปผลรายสัปดาห์ด้วย AI (Notion Sync)
        </button>
        <button class="btn-glass" onclick="ILMHub.requestLeave()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">🩺</span> ระบบลางานฉุกเฉิน / ลาป่วย
        </button>
      </div>
    </div>
  `;
}

function renderLogList() {
  if (!state.ilmLogs || state.ilmLogs.length === 0) {
    return `<div style="text-align: center; padding: 20px; color: var(--text-muted); background: var(--bg); border-radius: 12px; border: 1px dashed var(--border);">ยังไม่มีบันทึกการฝึกงาน</div>`;
  }
  
  return state.ilmLogs.slice(0, 5).map(log => `
    <div style="padding: 15px; background: var(--bg); border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-weight: 600; color: var(--primary);">${log.date}</div>
        <div style="font-size: 0.8rem; background: var(--surface); padding: 2px 8px; border-radius: 8px; border: 1px solid var(--border);">${log.hours} ชม.</div>
      </div>
      <div style="font-size: 0.9rem; line-height: 1.5; color: var(--text);">${log.task}</div>
      ${log.notionSynced ? `<div style="font-size: 0.75rem; color: #16a34a; text-align: right;">✓ Synced to Notion</div>` : ''}
    </div>
  `).join('');
}

// --- Module 5 Renderers ---
function renderReport(container) {
  container.innerHTML = `
    <!-- Feature 41-43: Report Builder -->
    <div class="ilm-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0;"><span>📑</span> เครื่องมือจัดทำรายงาน (Report Builder)</h3>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div class="quick-btn" onclick="ILMHub.openReportTemplate()" style="background: var(--bg); border: 1px solid var(--border); padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;">
          <div style="font-size: 1.5rem; margin-bottom: 5px;">โครงร่าง</div>
          <div style="font-weight: 600; font-size: 0.9rem;">Template</div>
        </div>
        <div class="quick-btn" onclick="ILMHub.compileDraft()" style="background: var(--bg); border: 1px solid var(--border); padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;">
          <div style="font-size: 1.5rem; margin-bottom: 5px;">ดึง Logs</div>
          <div style="font-weight: 600; font-size: 0.9rem;">Draft Compiler</div>
        </div>
      </div>
    </div>

    <!-- Feature 44-46: Helpers -->
    <div class="ilm-card">
      <h3><span>📚</span> ตัวช่วยงานเขียน</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn-glass" onclick="ILMHub.openGlossary()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">📖</span> คลังคำศัพท์เฉพาะทาง (Glossary)
        </button>
        <button class="btn-glass" onclick="ILMHub.autoFormatReferences()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">📌</span> จัดรูปแบบบรรณานุกรมอัตโนมัติ
        </button>
        <button class="btn-glass" onclick="ILMHub.checkPlagiarism()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">🔍</span> ตรวจสอบการคัดลอก (Plagiarism)
        </button>
      </div>
    </div>

    <!-- Feature 47-50: Submission -->
    <div class="ilm-card" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; border: none;">
      <h3 style="color: white; margin-bottom: 15px;"><span>✅</span> ขั้นตอนส่งเล่มฝึกงาน</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn-glass" onclick="ILMHub.requestMentorSignoff()" style="width: 100%; justify-content: space-between; background: rgba(255,255,255,0.2); border: none; color: white;">
          <span>1. ขออนุมัติจากพี่เลี้ยง (Sign-off)</span>
          <span>⏳</span>
        </button>
        <button class="btn-glass" onclick="ILMHub.generateFinalReportPDF()" style="width: 100%; justify-content: space-between; background: rgba(255,255,255,0.2); border: none; color: white;">
          <span>2. สร้าง PDF ตามฟอร์มคณะ</span>
          <span>📄</span>
        </button>
        <button class="btn-glass" onclick="showToast('ส่งไฟล์เข้าระบบคณะสำเร็จ!')" style="width: 100%; justify-content: center; font-weight: 700; margin-top: 10px; background: white; color: #16a34a;">
          📤 Submit to wt.eng.ku.ac.th
        </button>
      </div>
    </div>
  `;
}

// --- Module 4 Renderers ---
function renderSafety(container) {
  container.innerHTML = `
    <!-- Feature 31: SOS Button -->
    <div class="ilm-card" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; border: none;">
      <h3 style="color: white; justify-content: center;">🚨 ระบบแจ้งเหตุฉุกเฉิน (SOS)</h3>
      <button class="btn-glass" onclick="ILMHub.triggerSOS()" style="width: 100%; justify-content: center; font-size: 1.5rem; padding: 20px; border-radius: 16px; font-weight: 700; background: rgba(255,255,255,0.2); box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
        กดเพื่อส่งพิกัดและแจ้งเหตุ
      </button>
      <div style="font-size: 0.8rem; text-align: center; margin-top: 10px; opacity: 0.8;">*ระบบจะส่งข้อมูลให้คณะ, อาจารย์ที่ปรึกษา และครอบครัว</div>
    </div>

    <!-- Feature 32-33: Insurance & Claim -->
    <div class="ilm-card">
      <h3><span>🛡️</span> ประกันอุบัติเหตุนิสิต (สยามสไมล์)</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div class="quick-btn" onclick="ILMHub.openInsuranceInfo()" style="background: var(--bg); border: 1px solid var(--border); padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;">
          <div style="font-size: 1.5rem; margin-bottom: 5px;">🏥</div>
          <div style="font-weight: 600; font-size: 0.9rem;">วงเงินประกัน</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">เช็คความคุ้มครอง</div>
        </div>
        <div class="quick-btn" onclick="ILMHub.openClaimAssistant()" style="background: var(--bg); border: 1px solid var(--border); padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;">
          <div style="font-size: 1.5rem; margin-bottom: 5px;">📄</div>
          <div style="font-weight: 600; font-size: 0.9rem;">สร้างใบเคลม</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">ช่วยเตรียมเอกสาร</div>
        </div>
      </div>
    </div>

    <!-- Feature 34-36: Health Trackers -->
    <div class="ilm-card">
      <h3><span>❤️</span> สุขภาพกาย & ใจ</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn-glass" onclick="ILMHub.openMentalCheck()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">🧠</span> ประเมินความเครียดรายสัปดาห์
        </button>
        <button class="btn-glass" onclick="ILMHub.checkAirQuality()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">😷</span> เช็คฝุ่น PM 2.5 บริเวณฝึกงาน
        </button>
      </div>
    </div>

    <!-- Feature 37-40: Safety Resources -->
    <div class="ilm-card">
      <h3><span>🦺</span> ทรัพยากรความปลอดภัยโรงงาน</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn-glass" onclick="ILMHub.openFirstAidGuide()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">🩹</span> ปฐมพยาบาลเบื้องต้น & สารเคมีรั่วไหล
        </button>
        <button class="btn-glass" onclick="ILMHub.openHazardMap()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">🗺️</span> แผนที่โรงพยาบาลใกล้เคียง
        </button>
      </div>
    </div>
  `;
}

function renderExtra(container) {
  container.innerHTML = `
    <!-- Feature 51-53: Network & Gamification -->
    <div class="ilm-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0;"><span>🎓</span> เครือข่ายศิษย์เก่า & Achievements</h3>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div class="quick-btn" onclick="ILMHub.openAlumniNetwork()" style="background: var(--bg); border: 1px solid var(--border); padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;">
          <div style="font-size: 1.5rem; margin-bottom: 5px;">🤝</div>
          <div style="font-weight: 600; font-size: 0.9rem;">ทำเนียบรุ่นพี่</div>
        </div>
        <div class="quick-btn" onclick="ILMHub.openCompanyReviews()" style="background: var(--bg); border: 1px solid var(--border); padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;">
          <div style="font-size: 1.5rem; margin-bottom: 5px;">⭐</div>
          <div style="font-weight: 600; font-size: 0.9rem;">รีวิวบริษัท</div>
        </div>
      </div>
      <div style="margin-top: 15px; padding: 15px; background: var(--bg); border-radius: 12px; border: 1px solid var(--border);">
        <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 10px; color: var(--primary);">Badges & Achievements</div>
        <div style="display: flex; gap: 10px;">
          <div style="font-size: 2rem; opacity: 0.5;" title="ยังไม่ปลดล็อค">🏅</div>
          <div style="font-size: 2rem; opacity: 1;" title="เตรียมพร้อมฝึกงาน">🔰</div>
          <div style="font-size: 2rem; opacity: 0.5;" title="ยังไม่ปลดล็อค">👑</div>
        </div>
      </div>
    </div>

    <!-- Feature 54-56: Post-Internship -->
    <div class="ilm-card">
      <h3><span>💼</span> เครื่องมือหลังฝึกงานจบ</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn-glass" onclick="ILMHub.openPortfolioExport()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">🎨</span> สร้าง Portfolio อัตโนมัติ (Export)
        </button>
        <button class="btn-glass" onclick="ILMHub.openResumeUpdater()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">📄</span> อัปเดต Resume ด้วยประสบการณ์ใหม่
        </button>
        <button class="btn-glass" onclick="ILMHub.openPresentationTimer()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">⏱️</span> Presentation Timer (ซ้อมพรีเซนต์)
        </button>
      </div>
    </div>

    <!-- Feature 57-60: Integrations -->
    <div class="ilm-card">
      <h3><span>⚙️</span> Integrations</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn-glass" onclick="state.view='money-pod'; render();" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">💰</span> เชื่อมต่อระบบบันทึกรายรับ-รายจ่าย (MoneyPod)
        </button>
        <button class="btn-glass" onclick="ILMHub.generateCertificate()" style="width: 100%; justify-content: flex-start;">
          <span style="margin-right: 10px;">📜</span> สร้าง E-Certificate อัตโนมัติ (Mock)
        </button>
      </div>
    </div>
  `;
}
