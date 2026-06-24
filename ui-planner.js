// ══════════════════════════════════════════════════
// PLANNER & CALENDAR SYNC (PHASE 1)
// ══════════════════════════════════════════════════
function renderPlanner() {
  const cal = state.calendarConfig || { syncEnabled: false, calendarId: null };
  const v = state.plannerView || 'list';
  
  return `<div class="page-wrap">
    <div class="page-header-row">
      <div>
        <h1 class="page-title">⚡ Pro Planner</h1>
        <div class="page-sub">ศูนย์บัญชาการชีวิต & จัดการเวลา</div>
      </div>
      <button class="btn-glass-primary" onclick="openAddPlannerTask()">+ เพิ่มงาน</button>
    </div>

    <!-- Google Calendar Sync Status -->
    <div class="glass-card nb-card" style="padding:20px; margin-bottom:20px; border-left: 5px solid var(--c-blue);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:800; font-size:16px; display:flex; align-items:center; gap:8px;">
            🗓️ Google Calendar Auto-Sync
            ${cal.syncEnabled ? '<span style="background:var(--c-green); color:white; font-size:10px; padding:2px 6px; border-radius:10px;">เชื่อมต่อแล้ว</span>' : '<span style="background:#e2e8f0; color:#64748b; font-size:10px; padding:2px 6px; border-radius:10px;">ยังไม่เชื่อมต่อ</span>'}
          </div>
          <div style="font-size:12px; color:#64748b; margin-top:4px;">ซิงค์ตารางเรียนไปยัง Google Calendar อัตโนมัติ (รับแจ้งเตือนได้แม้ปิดแอป)</div>
        </div>
        <div>
          ${cal.syncEnabled 
            ? `<button class="btn-glass-secondary sm" onclick="forceSyncCalendar()">🔄 ซิงค์ทันที</button>
               <button class="icon-btn danger sm" onclick="disconnectCalendar()" style="background:transparent; border:none; color:var(--c-red); font-size:16px;">⏏️</button>` 
            : `<button class="btn-glass-primary sm" onclick="connectGoogleCalendar()">🔗 เชื่อมต่อ Google</button>`}
        </div>
      </div>
    </div>

    <!-- Sub Tabs -->
    <div style="display:flex; gap:8px; margin-bottom:20px; overflow-x:auto; padding-bottom:5px;">
      <button class="btn-glass-secondary sm ${v === 'list' ? 'active-tab' : ''}" onclick="state.plannerView='list'; render()" style="${v==='list'?'background:var(--c-indigo); color:white; border-color:var(--c-indigo);':''}">📋 Master List</button>
      <button class="btn-glass-secondary sm ${v === 'kanban' ? 'active-tab' : ''}" onclick="state.plannerView='kanban'; render()" style="${v==='kanban'?'background:var(--c-indigo); color:white; border-color:var(--c-indigo);':''}">📋 Kanban Board</button>
      <button class="btn-glass-secondary sm ${v === 'matrix' ? 'active-tab' : ''}" onclick="state.plannerView='matrix'; render()" style="${v==='matrix'?'background:var(--c-indigo); color:white; border-color:var(--c-indigo);':''}">⏱️ Eisenhower Matrix</button>
      <button class="btn-glass-secondary sm ${v === 'project' ? 'active-tab' : ''}" onclick="state.plannerView='project'; render()" style="${v==='project'?'background:var(--c-indigo); color:white; border-color:var(--c-indigo);':''}">🏛️ งานชุมนุม & โปรเจกต์</button>
    </div>

    ${v === 'list' ? renderPlannerList() : ''}
    ${v === 'kanban' ? renderPlannerKanban() : ''}
    ${v === 'matrix' ? renderPlannerMatrix() : ''}
    ${v === 'project' ? renderPlannerProject() : ''}
  </div>`;
}

function renderPlannerList() {
  const tasks = state.plannerTasks || [];
  return `
    <div class="glass-card nb-card" style="padding:20px;">
      <div style="font-weight:800; font-size:16px; margin-bottom:15px; border-bottom:2px solid black; padding-bottom:10px; display:flex; justify-content:space-between;">
        <span>📋 Master To-Do List</span>
      </div>
      
      <div class="planner-task-list" style="display:flex; flex-direction:column; gap:10px;">
        ${tasks.map((t, i) => `
          <div class="planner-task-row ${t.done ? 'done' : ''}" style="display:flex; align-items:center; gap:12px; padding:12px; background:white; border:1.5px solid black; border-radius:12px;">
            <button class="check-circle sm ${t.done ? 'checked' : ''}" data-toggle-planner="${i}" style="width:28px; height:28px; border-radius:50%; border:2px solid black; background:${t.done ? 'var(--c-indigo)' : 'white'}; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; cursor:pointer;">${t.done ? '✓' : ''}</button>
            <div style="flex:1;">
              <div style="font-weight:700; font-size:14px; text-decoration:${t.done ? 'line-through' : 'none'}; opacity:${t.done ? 0.5 : 1};">${t.title}</div>
              ${t.note ? `<div style="font-size:11px; opacity:0.6;">${t.note}</div>` : ''}
              <div style="display:flex; gap:8px; margin-top:6px; flex-wrap:wrap;">
                ${t.due ? `<span style="font-size:10px; background:#fee2e2; color:var(--c-rust); font-weight:700; padding:2px 6px; border-radius:4px;">📅 ${t.due}</span>` : ''}
                ${t.courseId ? `<span style="font-size:10px; background:#e0e7ff; color:var(--c-indigo); padding:2px 6px; border-radius:4px;">📚 ${getCourseCodeById(t.courseId) || 'วิชา'}</span>` : ''}
                ${t.project ? `<span style="font-size:10px; background:#f1f5f9; padding:2px 6px; border-radius:4px;">📁 ${t.project}</span>` : ''}
                ${t.urgency ? `<span style="font-size:10px; background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px;">🔥 ${t.urgency}</span>` : ''}
              </div>
            </div>
            <button class="icon-btn danger sm" data-del-planner="${i}" style="background:transparent; border:none; color:var(--c-red); font-size:16px; cursor:pointer;">🗑</button>
          </div>
        `).join('')}
        ${tasks.length === 0 ? '<div class="empty-sm" style="padding:40px;">ไม่มีงานค้าง เยี่ยมมาก! 🎉</div>' : ''}
      </div>
    </div>`;
}

function getCourseCodeById(courseId) {
  for(let sid in state.courses) {
    let c = state.courses[sid].find(x => x.id === courseId);
    if(c) return c.code;
  }
  return null;
}

function renderPlannerKanban() {
  const tasks = state.plannerTasks || [];
  const cols = state.kanbanColumns || ['To Do', 'In Progress', 'Done'];
  
  let html = `<div style="display:flex; gap:15px; overflow-x:auto; padding-bottom:15px;">`;
  cols.forEach(col => {
    const colTasks = tasks.map((t, i) => ({...t, origIdx: i})).filter(t => (t.kanbanStage || 'To Do') === col);
    html += `
      <div style="flex: 0 0 280px; background:rgba(255,255,255,0.5); border:2px solid black; border-radius:12px; display:flex; flex-direction:column; max-height: 60vh;">
        <div style="padding:15px; font-weight:800; border-bottom:2px solid black; background:var(--c-indigo); color:white; border-radius:10px 10px 0 0; display:flex; justify-content:space-between; align-items:center;">
          <span>${col}</span>
          <span style="font-size:12px; background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:10px;">${colTasks.length}</span>
        </div>
        <div style="padding:10px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:10px; min-height:100px;" 
             ondragover="event.preventDefault(); this.style.background='rgba(0,0,0,0.05)';" 
             ondragleave="this.style.background='transparent';"
             ondrop="event.preventDefault(); this.style.background='transparent'; moveKanbanTask(event.dataTransfer.getData('text/plain'), '${col}')">
          ${colTasks.map(t => `
            <div draggable="true" ondragstart="event.dataTransfer.setData('text/plain', ${t.origIdx}); this.style.opacity='0.5';" ondragend="this.style.opacity='1';" style="background:white; border:1.5px solid black; border-radius:8px; padding:10px; cursor:grab; box-shadow: 2px 2px 0px rgba(0,0,0,0.1);">
              <div style="font-weight:700; font-size:13px; margin-bottom:4px;">${t.title}</div>
              <div style="display:flex; gap:5px; flex-wrap:wrap;">
                 ${t.due ? `<span style="font-size:9px; background:#fee2e2; color:var(--c-rust); padding:2px 4px; border-radius:4px;">${t.due}</span>` : ''}
                 ${t.courseId ? `<span style="font-size:9px; background:#e0e7ff; color:var(--c-indigo); padding:2px 4px; border-radius:4px;">${getCourseCodeById(t.courseId) || 'วิชา'}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

window.moveKanbanTask = function(idxStr, newStage) {
  const idx = parseInt(idxStr);
  if(isNaN(idx)) return;
  state.plannerTasks[idx].kanbanStage = newStage;
  if(newStage === 'Done') state.plannerTasks[idx].done = true;
  else state.plannerTasks[idx].done = false;
  localStorage.setItem('plannerTasks', JSON.stringify(state.plannerTasks));
  render();
};

function renderPlannerMatrix() {
  const tasks = (state.plannerTasks || []).map((t, i) => ({...t, origIdx: i})).filter(t => !t.done);
  const q1 = tasks.filter(t => t.urgency === 'Urgent' && t.importance === 'Important');
  const q2 = tasks.filter(t => t.urgency !== 'Urgent' && t.importance === 'Important');
  const q3 = tasks.filter(t => t.urgency === 'Urgent' && t.importance !== 'Important');
  const q4 = tasks.filter(t => t.urgency !== 'Urgent' && t.importance !== 'Important');
  
  const renderQ = (title, items, color, u, i) => `
    <div style="background:white; border:2px solid ${color}; border-radius:12px; display:flex; flex-direction:column; min-height:200px;"
         ondragover="event.preventDefault(); this.style.opacity='0.8';" 
         ondragleave="this.style.opacity='1';"
         ondrop="event.preventDefault(); this.style.opacity='1'; moveMatrixTask(event.dataTransfer.getData('text/plain'), '${u}', '${i}')">
      <div style="background:${color}; color:white; font-weight:800; padding:10px; border-radius:8px 8px 0 0; text-align:center;">${title} (${items.length})</div>
      <div style="padding:10px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:8px;">
        ${items.map(t => `
          <div draggable="true" ondragstart="event.dataTransfer.setData('text/plain', ${t.origIdx});" style="font-size:12px; padding:8px; border:1px solid #e2e8f0; border-radius:6px; cursor:grab;">
            <div style="font-weight:700;">${t.title}</div>
            ${t.due ? `<div style="font-size:9px; color:#64748b; margin-top:2px;">📅 ${t.due}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  return `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
      ${renderQ('Q1: Do First (ด่วน & สำคัญ)', q1, 'var(--c-rust)', 'Urgent', 'Important')}
      ${renderQ('Q2: Schedule (ไม่ด่วน แต่สำคัญ)', q2, 'var(--c-blue)', 'Not Urgent', 'Important')}
      ${renderQ('Q3: Delegate (ด่วน แต่ไม่สำคัญ)', q3, 'var(--c-yellow)', 'Urgent', 'Not Important')}
      ${renderQ("Q4: Don't Do (ไม่ด่วน & ไม่สำคัญ)", q4, '#94a3b8', 'Not Urgent', 'Not Important')}
    </div>
  `;
}

window.moveMatrixTask = function(idxStr, urgency, importance) {
  const idx = parseInt(idxStr);
  if(isNaN(idx)) return;
  state.plannerTasks[idx].urgency = urgency;
  state.plannerTasks[idx].importance = importance;
  localStorage.setItem('plannerTasks', JSON.stringify(state.plannerTasks));
  render();
};

function renderPlannerProject() {
  const budgets = state.projectBudgets || [];
  const meetings = state.meetings || [];
  return `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
      <div class="glass-card nb-card" style="padding:20px;">
         <div style="font-weight:800; font-size:16px; margin-bottom:15px; border-bottom:2px solid black; padding-bottom:10px;">
           💰 Project Budgeting
         </div>
         <div style="display:flex; flex-direction:column; gap:10px;">
           ${budgets.map(b => `
             <div style="border:1.5px solid black; border-radius:8px; padding:12px; background:white;">
               <div style="font-weight:700;">${b.name}</div>
               <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:12px;">
                 <span>รายรับ: <span style="color:var(--c-green)">฿${b.income}</span></span>
                 <span>รายจ่าย: <span style="color:var(--c-red)">฿${b.expense}</span></span>
               </div>
               <div style="margin-top:5px; font-size:12px; font-weight:800; text-align:right;">คงเหลือ: ฿${b.income - b.expense}</div>
             </div>
           `).join('')}
           <button class="btn-glass-secondary sm" onclick="alert('Coming soon: สร้างกระเป๋างบโปรเจกต์ใหม่')">+ เพิ่มกระเป๋างบ</button>
         </div>
      </div>
      
      <div class="glass-card nb-card" style="padding:20px;">
         <div style="font-weight:800; font-size:16px; margin-bottom:15px; border-bottom:2px solid black; padding-bottom:10px;">
           👥 Meeting Organizer
         </div>
         <div style="display:flex; flex-direction:column; gap:10px;">
           ${meetings.map(m => `
             <div style="border:1.5px solid black; border-radius:8px; padding:12px; background:white;">
               <div style="font-weight:700;">${m.topic}</div>
               <div style="font-size:11px; color:#64748b;">📅 ${m.date} | 📍 ${m.location}</div>
             </div>
           `).join('')}
           <button class="btn-glass-secondary sm" onclick="alert('Coming soon: จัดการประชุมใหม่')">+ สร้างวาระการประชุม</button>
         </div>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════
// COURSE INTEGRATION (PHASE 2)
// ══════════════════════════════════════════════════
window.renderCourseTasks = function(course) {
  const tasks = (state.plannerTasks || []).filter(t => t.courseId === course.id);
  const doneTasks = tasks.filter(t => t.done);
  const pendingTasks = tasks.filter(t => !t.done);
  
  return `
    <div class="hub-scroll-area">
      <div class="glass-card nb-card">
        <div class="section-hd" style="display:flex; justify-content:space-between; align-items:center;">
          <span>⚡ งานของรายวิชานี้ (${pendingTasks.length} รอดำเนินการ)</span>
          <button class="btn-glass-primary sm" onclick="state.view='planner'; state.plannerView='list'; render(); setTimeout(()=>openAddPlannerTask(), 100);">+ เพิ่มงานใหม่</button>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
          ${pendingTasks.map(t => `
            <div style="display:flex; align-items:center; gap:12px; padding:12px; background:white; border:1.5px solid black; border-radius:12px;">
              <div style="flex:1;">
                <div style="font-weight:700; font-size:14px;">${t.title}</div>
                ${t.note ? `<div style="font-size:11px; opacity:0.6;">${t.note}</div>` : ''}
                <div style="display:flex; gap:8px; margin-top:6px; flex-wrap:wrap;">
                  ${t.due ? `<span style="font-size:10px; background:#fee2e2; color:var(--c-rust); font-weight:700; padding:2px 6px; border-radius:4px;">📅 ${t.due}</span>` : ''}
                  ${t.kanbanStage ? `<span style="font-size:10px; background:#f1f5f9; padding:2px 6px; border-radius:4px;">📋 ${t.kanbanStage}</span>` : ''}
                  ${t.urgency ? `<span style="font-size:10px; background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px;">🔥 ${t.urgency}</span>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
          ${pendingTasks.length === 0 ? '<div style="text-align:center; padding:20px; color:#64748b; font-size:13px;">ไม่มีงานค้าง เยี่ยมมาก!</div>' : ''}
        </div>
        
        ${doneTasks.length > 0 ? `
          <div style="margin-top:20px; font-weight:700; font-size:14px; border-top:1px dashed #cbd5e1; padding-top:15px;">งานที่เสร็จแล้ว (${doneTasks.length})</div>
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
            ${doneTasks.map(t => `
              <div style="font-size:12px; opacity:0.6; text-decoration:line-through;">✓ ${t.title}</div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}


// ══════════════════════════════════════════════════
// PLANNER FUNCTIONS (PHASE 1)
// ══════════════════════════════════════════════════
window.openAddPlannerTask = function() {
  let latestCourses = [];
  if (state.semesters && state.semesters.length > 0) {
    const latestSem = state.semesters[state.semesters.length - 1];
    latestCourses = state.courses[latestSem.id] || [];
  }
  
  const html = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div>
        <label style="font-size:12px; font-weight:700;">ชื่องาน</label>
        <input type="text" id="pTaskTitle" class="glass-input sm" style="width:100%" placeholder="เช่น ทำสไลด์พรีเซนต์...">
      </div>
      <div>
        <label style="font-size:12px; font-weight:700;">รายละเอียด (ใส่หรือไม่ใส่ก็ได้)</label>
        <input type="text" id="pTaskNote" class="glass-input sm" style="width:100%">
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div>
          <label style="font-size:12px; font-weight:700;">วันครบกำหนด</label>
          <input type="date" id="pTaskDue" class="glass-input sm" style="width:100%">
        </div>
        <div>
          <label style="font-size:12px; font-weight:700;">โปรเจกต์/ชุมนุม</label>
          <input type="text" id="pTaskProj" class="glass-input sm" style="width:100%" placeholder="เช่น งานกลุ่ม, ส่วนตัว">
        </div>
      </div>
      
      <!-- New Fields for Phase 2 -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:5px;">
        <div>
          <label style="font-size:12px; font-weight:700; color:var(--c-indigo);">📚 เชื่อมโยงรายวิชา (เทอมล่าสุด)</label>
          <select id="pTaskCourse" class="glass-input sm" style="width:100%">
            <option value="">-- ไม่เชื่อมโยง --</option>
            ${latestCourses.map(c => `<option value="${c.id}">${c.code} ${c.nameTh}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px; font-weight:700;">สถานะงาน (Kanban)</label>
          <select id="pTaskStage" class="glass-input sm" style="width:100%">
            ${(state.kanbanColumns || ['To Do', 'In Progress', 'Done']).map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
      </div>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:5px;">
        <div>
          <label style="font-size:12px; font-weight:700;">ความเร่งด่วน (Urgency)</label>
          <select id="pTaskUrg" class="glass-input sm" style="width:100%">
            <option value="Not Urgent">ไม่ด่วน (Not Urgent)</option>
            <option value="Urgent">ด่วนมาก (Urgent)</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px; font-weight:700;">ความสำคัญ (Importance)</label>
          <select id="pTaskImp" class="glass-input sm" style="width:100%">
            <option value="Important">สำคัญ (Important)</option>
            <option value="Not Important">ไม่สำคัญ (Not Important)</option>
          </select>
        </div>
      </div>

    </div>
  `;
  const footer = `
    <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
      <button class="btn-glass-pastel" onclick="closeModal()">ยกเลิก</button>
      <button class="btn-pastel-primary" onclick="savePlannerTask()">+ บันทึกงาน</button>
    </div>
  `;
  openModal('⚡ เพิ่มงานใหม่ลง Planner', html, footer);
};

window.savePlannerTask = function() {
  const t = document.getElementById('pTaskTitle')?.value.trim();
  if (!t) return showToast('กรุณาใส่ชื่องาน', 'err');
  
  if (!state.plannerTasks) state.plannerTasks = [];
  state.plannerTasks.push({
    title: t,
    note: document.getElementById('pTaskNote')?.value.trim() || '',
    due: document.getElementById('pTaskDue')?.value || '',
    project: document.getElementById('pTaskProj')?.value.trim() || '',
    courseId: document.getElementById('pTaskCourse')?.value || null,
    kanbanStage: document.getElementById('pTaskStage')?.value || 'To Do',
    urgency: document.getElementById('pTaskUrg')?.value || 'Not Urgent',
    importance: document.getElementById('pTaskImp')?.value || 'Important',
    done: false,
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem('plannerTasks', JSON.stringify(state.plannerTasks));
  closeModal();
  render();
  showToast('✅ เพิ่มงานลง Planner แล้ว');
};

document.addEventListener('click', e => {
  const toggleBtn = e.target.closest('[data-toggle-planner]');
  if (toggleBtn) {
    const idx = parseInt(toggleBtn.dataset.togglePlanner);
    if(state.plannerTasks[idx]) {
      state.plannerTasks[idx].done = !state.plannerTasks[idx].done;
      localStorage.setItem('plannerTasks', JSON.stringify(state.plannerTasks));
      render();
      if(state.plannerTasks[idx].done && Object.values(state.plannerTasks).every(x=>x.done)) triggerConfetti();
    }
  }
  
  const delBtn = e.target.closest('[data-del-planner]');
  if (delBtn) {
    const idx = parseInt(delBtn.dataset.delPlanner);
    if(confirm('ลบงานนี้หรือไม่?')) {
      state.plannerTasks.splice(idx, 1);
      localStorage.setItem('plannerTasks', JSON.stringify(state.plannerTasks));
      render();
    }
  }
});


// ══════════════════════════════════════════════════
// GOOGLE CALENDAR SYNC LOGIC (PHASE 1)
// ══════════════════════════════════════════════════
var plannerTokenClient;
var plannerGapiInited = false;
var plannerGisInited = false;
var CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar.events';

function getGoogleClientId() {
  return localStorage.getItem('google_client_id') || '';
}

window.connectGoogleCalendar = function() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    const html = `
      <div style="font-size:12px; color:#64748b; margin-bottom:10px;">
        เนื่องจากเหตุผลด้านความปลอดภัยและการเป็นแอปที่รันบนบราวเซอร์ (PWA) คุณจำเป็นต้องสร้าง <b>Google Cloud OAuth Client ID</b> ของตัวเองและนำมาใส่ที่นี่ครับ
      </div>
      <label style="font-size:12px; font-weight:700;">Client ID</label>
      <input type="text" id="gcpClientId" class="glass-input sm" style="width:100%" placeholder="123456789-xxxx.apps.googleusercontent.com">
      <div style="font-size:11px; margin-top:8px; color:var(--c-blue); cursor:pointer; text-decoration:underline;" onclick="window.open('https://developers.google.com/calendar/api/quickstart/js', '_blank')">📖 วิธีการสร้าง Client ID</div>
    `;
    openModal('🔑 ตั้งค่า Google Client ID', html, `
      <button class="btn-glass-primary" onclick="saveGoogleClientId()">บันทึก & เชื่อมต่อ</button>
    `);
    return;
  }
  
  if (!plannerTokenClient) {
    plannerTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: CALENDAR_SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          state.calendarConfig.syncEnabled = true;
          state.calendarConfig.accessToken = tokenResponse.access_token;
          localStorage.setItem('calendarConfig', JSON.stringify(state.calendarConfig));
          showToast('✅ เชื่อมต่อ Google Calendar สำเร็จ!');
          render();
        }
      },
    });
  }
  plannerTokenClient.requestAccessToken({prompt: 'consent'});
};

window.saveGoogleClientId = function() {
  const id = document.getElementById('gcpClientId').value.trim();
  if (!id) return showToast('กรุณาใส่ Client ID', 'err');
  localStorage.setItem('google_client_id', id);
  closeModal();
  connectGoogleCalendar();
};

window.disconnectCalendar = function() {
  if (confirm('ยกเลิกการเชื่อมต่อ Google Calendar หรือไม่?')) {
    state.calendarConfig.syncEnabled = false;
    delete state.calendarConfig.accessToken;
    localStorage.setItem('calendarConfig', JSON.stringify(state.calendarConfig));
    render();
    showToast('🔴 ยกเลิกการเชื่อมต่อแล้ว');
  }
};

window.forceSyncCalendar = async function() {
  if (!state.calendarConfig.syncEnabled || !state.calendarConfig.accessToken) {
    return showToast('กรุณาเชื่อมต่อ Google Calendar ก่อน', 'err');
  }
  
  showToast('กำลังเตรียมข้อมูลซิงค์...', 'info');
  try {
    const eventsToSync = [];
    const term = state.activeSemester;
    const courses = state.courses[term] || [];
    
    // In Phase 1: We will just push the classes to the primary calendar
    // Mapping our schedule logic to Google Calendar Event logic
    courses.forEach(c => {
      if (!c.schedules) return;
      c.schedules.forEach(s => {
        const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const byDay = dayMap[s.day];
        const event = {
          summary: `[${c.id}] ${c.name}`,
          location: c.room || 'ไม่ระบุห้อง',
          description: `อาจารย์: ${c.teacher || '-'}\nหมวดหมู่: ${s.type || 'Lecture'}`,
          start: {
            dateTime: getNextDayOfWeek(s.day, s.startHour),
            timeZone: 'Asia/Bangkok'
          },
          end: {
            dateTime: getNextDayOfWeek(s.day, s.endHour),
            timeZone: 'Asia/Bangkok'
          },
          recurrence: [
            `RRULE:FREQ=WEEKLY;BYDAY=${byDay}` // Simple recurrence (Can be improved with END date in future)
          ],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 }
            ]
          }
        };
        eventsToSync.push(event);
      });
    });

    if (eventsToSync.length === 0) return showToast('ไม่มีตารางเรียนให้ซิงค์', 'err');

    let successCount = 0;
    for (const ev of eventsToSync) {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.calendarConfig.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ev)
      });
      if (res.ok) successCount++;
      else if (res.status === 401) {
        showToast('Token หมดอายุ กรุณาเชื่อมต่อใหม่', 'err');
        state.calendarConfig.syncEnabled = false;
        render();
        return;
      }
    }
    
    showToast(`✅ ซิงค์เสร็จสิ้น ${successCount} รายการ!`);
    
  } catch (err) {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการซิงค์', 'err');
  }
};

function getNextDayOfWeek(dayOfWeek, hourFloat) {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 && dayOfWeek !== 0 ? -6 : 1) + dayOfWeek - 1; // adjust when day is sunday
  const nextDate = new Date(date.setDate(diff));
  if (nextDate < new Date()) {
    nextDate.setDate(nextDate.getDate() + 7);
  }
  const h = Math.floor(hourFloat);
  const m = Math.round((hourFloat - h) * 60);
  nextDate.setHours(h, m, 0, 0);
  return nextDate.toISOString();
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

