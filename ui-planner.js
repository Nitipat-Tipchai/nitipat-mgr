// ══════════════════════════════════════════════════
// PLANNER & CALENDAR SYNC (PHASE 1)
// ══════════════════════════════════════════════════
function renderPlanner() {
  const cal = state.calendarConfig || { syncEnabled: false, calendarId: null };
  const v = state.plannerView || 'list';
  
  return `<div class="page-wrap" style="background: linear-gradient(135deg, #f8fafc, #eff6ff); min-height: 100vh; padding: 20px; border-radius: 24px;">
    <div class="page-header-row" style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:25px;">
      <div>
        <h1 class="page-title" style="font-size:32px; font-weight:900; background: linear-gradient(135deg, var(--c-indigo), #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin:0;">⚡ Pro Planner</h1>
        <div class="page-sub" style="font-size:14px; color:#64748b; font-weight:600; margin-top:5px;">ศูนย์บัญชาการชีวิต & จัดการเวลา</div>
      </div>
      <button class="btn-glass-primary" onclick="openAddPlannerTask()" style="padding: 12px 24px; font-size:15px; font-weight:800; border-radius:16px; box-shadow: 0 8px 25px rgba(59,130,246,0.3); transition: 0.2s;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='translateY(0)';">+ เพิ่มงาน</button>
    </div>

    <!-- Google Calendar Sync Status -->
    <div class="glass-card" style="padding:20px 25px; margin-bottom:25px; border-radius: 20px; background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 10px 30px rgba(0,0,0,0.03); display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center; gap:15px;">
        <div style="font-size:30px; background: rgba(59,130,246,0.1); padding: 10px; border-radius: 16px;">🗓️</div>
        <div>
          <div style="font-weight:800; font-size:16px; display:flex; align-items:center; gap:8px; color: var(--c-slate);">
            Google Calendar Auto-Sync
            ${cal.syncEnabled ? '<span style="background:var(--c-green); color:white; font-size:11px; padding:4px 8px; border-radius:12px; font-weight:700; box-shadow: 0 4px 10px rgba(16,185,129,0.2);">เชื่อมต่อแล้ว</span>' : '<span style="background:#e2e8f0; color:#64748b; font-size:11px; padding:4px 8px; border-radius:12px; font-weight:700;">ยังไม่เชื่อมต่อ</span>'}
          </div>
          <div style="font-size:13px; color:#64748b; margin-top:4px; font-weight:500;">ซิงค์ตารางเรียนไปยัง Google Calendar อัตโนมัติ (รับแจ้งเตือนได้แม้ปิดแอป)</div>
        </div>
      </div>
      <div>
        ${cal.syncEnabled 
          ? `<div style="display:flex; gap:10px;">
               <button class="btn-glass-secondary sm" onclick="forceSyncCalendar()" style="border-radius:12px; font-weight:700;">🔄 ซิงค์ทันที</button>
               <button class="icon-btn danger sm" onclick="disconnectCalendar()" style="background:rgba(239,68,68,0.1); border:none; color:var(--c-red); font-size:16px; border-radius:12px; transition:0.2s;" onmouseover="this.style.background='var(--c-red)'; this.style.color='white';" onmouseout="this.style.background='rgba(239,68,68,0.1)'; this.style.color='var(--c-red)';">⏏️</button>
             </div>` 
          : `<button class="btn-glass-primary sm" onclick="connectGoogleCalendar()" style="border-radius:12px; font-weight:700; box-shadow: 0 4px 15px rgba(59,130,246,0.2);">🔗 เชื่อมต่อ Google</button>`}
      </div>
    </div>

    <!-- Sub Tabs -->
    <div style="display:flex; gap:10px; margin-bottom:25px; overflow-x:auto; padding-bottom:10px; padding-top: 5px;">
      <style>
        .planner-tab-btn {
          padding: 12px 20px; font-size: 14px; font-weight: 700; border-radius: 16px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.6); color: var(--c-slate);
          backdrop-filter: blur(10px); white-space: nowrap; display:flex; align-items:center; gap:8px;
        }
        .planner-tab-btn:hover { background: rgba(255,255,255,0.9); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .planner-tab-btn.active {
          background: linear-gradient(135deg, var(--c-indigo), #3b82f6); color: white; border: none; box-shadow: 0 6px 20px rgba(79,70,229,0.3); transform: translateY(-2px);
        }
      </style>
      <button class="planner-tab-btn ${v === 'list' ? 'active' : ''}" onclick="state.plannerView='list'; render()">📋 Master List</button>
      <button class="planner-tab-btn ${v === 'kanban' ? 'active' : ''}" onclick="state.plannerView='kanban'; render()">📊 Kanban Board</button>
      <button class="planner-tab-btn ${v === 'matrix' ? 'active' : ''}" onclick="state.plannerView='matrix'; render()">⏱️ Eisenhower Matrix</button>
      <button class="planner-tab-btn ${v === 'project' ? 'active' : ''}" onclick="state.plannerView='project'; render()">🏛️ งานชุมนุม & โปรเจกต์</button>
    </div>

    <div style="animation: fade-in 0.3s ease-out;">
      ${v === 'list' ? renderPlannerList() : ''}
      ${v === 'kanban' ? renderPlannerKanban() : ''}
      ${v === 'matrix' ? renderPlannerMatrix() : ''}
      ${v === 'project' ? renderPlannerProject() : ''}
    </div>
  </div>`;
}

function renderPlannerList() {
  const tasks = state.plannerTasks || [];
  return `
    <div class="glass-card" style="padding:25px; border-radius: 20px; background: rgba(255,255,255,0.7); backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 15px 35px rgba(0,0,0,0.04);">
      <div style="font-weight:800; font-size:18px; margin-bottom:20px; border-bottom: 2px solid rgba(0,0,0,0.05); padding-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
        <span style="color: var(--c-slate); display:flex; align-items:center; gap:8px;"><div style="background:#f1f5f9; padding:6px; border-radius:10px;">📋</div> Master To-Do List</span>
        <span style="font-size:13px; font-weight:600; background:rgba(79,70,229,0.1); color:var(--c-indigo); padding:4px 10px; border-radius:20px;">${tasks.filter(t=>!t.done).length} งานที่ต้องทำ</span>
      </div>
      
      <div class="planner-task-list" style="display:flex; flex-direction:column; gap:12px;">
        ${tasks.map((t, i) => {
          const tagIcons = {
            'class': '📚 คลาส', 'assignment': '📝 งาน', 'exam': '🚨 สอบ', 'study': '📖 อ่านหนังสือ',
            'research': '🔬 วิจัย', 'internship': '🏢 ฝึกงาน', 'meeting': '💼 ประชุม', 'club': '🏛️ กิจกรรม',
            'fitness': '🏋️ ฟิตเนส', 'health': '🏥 สุขภาพ', 'social': '🎉 สังสรรค์', 'finance': '💵 การเงิน',
            'shopping': '🛒 ซื้อของ', 'chores': '🧹 งานบ้าน', 'personal_project': '💡 โปรเจกต์', 'other': '✨ อื่นๆ'
          };
          const tagText = tagIcons[t.tag] || (t.project ? `📁 ${t.project}` : '');
          
          let timeText = '';
          if (t.startTime) {
            timeText += t.startTime;
            if (t.endTime) timeText += ` - ${t.endTime}`;
          }
          
          return `
          <div class="planner-task-row ${t.done ? 'done' : ''}" style="display:flex; align-items:flex-start; gap:15px; padding:16px; background: ${t.done ? 'rgba(248,250,252,0.6)' : 'white'}; border: 1px solid ${t.done ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.08)'}; border-radius:16px; transition: all 0.2s ease; box-shadow: ${t.done ? 'none' : '0 4px 15px rgba(0,0,0,0.02)'}; transform: scale(1);" onmouseover="this.style.transform='scale(1.01)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.05)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='${t.done ? 'none' : '0 4px 15px rgba(0,0,0,0.02)'}';">
            <button class="check-circle sm ${t.done ? 'checked' : ''}" data-toggle-planner="${i}" style="width:28px; height:28px; border-radius:50%; border: 2px solid ${t.done ? 'var(--c-indigo)' : '#cbd5e1'}; background:${t.done ? 'var(--c-indigo)' : 'white'}; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; cursor:pointer; transition: 0.2s; margin-top:2px;">${t.done ? '✓' : ''}</button>
            <div style="flex:1;">
              <div style="font-weight:700; font-size:15px; text-decoration:${t.done ? 'line-through' : 'none'}; opacity:${t.done ? 0.5 : 1}; color: var(--c-slate);">${t.title}</div>
              ${t.note ? `<div style="font-size:12px; opacity:0.6; margin-top:4px; line-height:1.4;">${t.note}</div>` : ''}
              <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
                ${t.due ? `<span style="font-size:10px; background:rgba(239,68,68,0.1); color:var(--c-rust); font-weight:700; padding:4px 8px; border-radius:6px; display:flex; align-items:center; gap:4px;">📅 ${t.due} ${timeText ? '⏱️ '+timeText : ''}</span>` : ''}
                ${t.courseId ? `<span style="font-size:10px; background:rgba(79,70,229,0.1); color:var(--c-indigo); font-weight:600; padding:4px 8px; border-radius:6px; display:flex; align-items:center; gap:4px;">📚 ${getCourseCodeById(t.courseId) || 'วิชา'}</span>` : ''}
                ${tagText ? `<span style="font-size:10px; background:#f1f5f9; color:#475569; font-weight:600; padding:4px 8px; border-radius:6px; display:flex; align-items:center; gap:4px;">${tagText}</span>` : ''}
                ${t.urgency && t.urgency !== 'Not Urgent' ? `<span style="font-size:10px; background:rgba(245,158,11,0.15); color:#b45309; font-weight:700; padding:4px 8px; border-radius:6px; display:flex; align-items:center; gap:4px;">🔥 ${t.urgency}</span>` : ''}
              </div>
            </div>
            <button class="icon-btn danger sm" data-del-planner="${i}" style="background:rgba(239,68,68,0.08); border:none; color:var(--c-red); font-size:14px; cursor:pointer; width:32px; height:32px; border-radius:10px; transition:0.2s;" onmouseover="this.style.background='var(--c-red)'; this.style.color='white';" onmouseout="this.style.background='rgba(239,68,68,0.08)'; this.style.color='var(--c-red)';">✕</button>
          </div>
          `;
        }).join('')}
        ${tasks.length === 0 ? '<div class="empty-sm" style="padding:50px; text-align:center; color:#94a3b8;"><div style="font-size:40px; margin-bottom:10px;">🎉</div>ไม่มีงานค้าง เยี่ยมมาก!</div>' : ''}
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
  
  const colColors = {
    'To Do': { bg: 'rgba(79,70,229,0.05)', headBg: 'var(--c-indigo)', text: 'white', border: 'rgba(79,70,229,0.2)' },
    'In Progress': { bg: 'rgba(245,158,11,0.05)', headBg: 'var(--c-yellow)', text: 'white', border: 'rgba(245,158,11,0.2)' },
    'Done': { bg: 'rgba(16,185,129,0.05)', headBg: 'var(--c-green)', text: 'white', border: 'rgba(16,185,129,0.2)' }
  };
  
  let html = `<div style="display:flex; gap:20px; overflow-x:auto; padding-bottom:15px; min-height: 70vh;">`;
  cols.forEach(col => {
    const colTasks = tasks.map((t, i) => ({...t, origIdx: i})).filter(t => (t.kanbanStage || 'To Do') === col);
    const theme = colColors[col] || { bg: 'rgba(0,0,0,0.02)', headBg: '#64748b', text: 'white', border: 'rgba(0,0,0,0.1)' };
    
    html += `
      <div style="flex: 0 0 300px; background: ${theme.bg}; border: 1px solid ${theme.border}; border-radius: 20px; display:flex; flex-direction:column; max-height: 75vh; box-shadow: 0 10px 30px rgba(0,0,0,0.02); backdrop-filter: blur(20px);">
        <div style="padding:16px 20px; font-weight:800; font-size:15px; background: ${theme.headBg}; color: ${theme.text}; border-radius: 20px 20px 0 0; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <span>${col}</span>
          <span style="font-size:12px; background:rgba(255,255,255,0.2); padding:2px 10px; border-radius:12px;">${colTasks.length}</span>
        </div>
        <div style="padding:15px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:12px; min-height:100px; transition: 0.2s;" 
             ondragover="event.preventDefault(); this.style.background='rgba(0,0,0,0.05)';" 
             ondragleave="this.style.background='transparent';"
             ondrop="event.preventDefault(); this.style.background='transparent'; moveKanbanTask(event.dataTransfer.getData('text/plain'), '${col}')">
          ${colTasks.map(t => {
            const tagIcons = {
              'class': '📚 คลาส', 'assignment': '📝 งาน', 'exam': '🚨 สอบ', 'study': '📖 อ่านหนังสือ',
              'research': '🔬 วิจัย', 'internship': '🏢 ฝึกงาน', 'meeting': '💼 ประชุม', 'club': '🏛️ กิจกรรม',
              'fitness': '🏋️ ฟิตเนส', 'health': '🏥 สุขภาพ', 'social': '🎉 สังสรรค์', 'finance': '💵 การเงิน',
              'shopping': '🛒 ซื้อของ', 'chores': '🧹 งานบ้าน', 'personal_project': '💡 โปรเจกต์', 'other': '✨ อื่นๆ'
            };
            const tagText = tagIcons[t.tag] || (t.project ? `📁 ${t.project}` : '');
            
            let timeText = '';
            if (t.startTime) {
              timeText += t.startTime;
              if (t.endTime) timeText += ` - ${t.endTime}`;
            }

            return `
            <div draggable="true" ondragstart="event.dataTransfer.setData('text/plain', ${t.origIdx}); this.style.opacity='0.5';" ondragend="this.style.opacity='1';" style="background:white; border: 1px solid rgba(0,0,0,0.05); border-radius:14px; padding:15px; cursor:grab; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.06)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.03)';">
              <div style="font-weight:700; font-size:14px; margin-bottom:8px; color: var(--c-slate); line-height: 1.4;">${t.title}</div>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                 ${t.due ? `<span style="font-size:10px; background:rgba(239,68,68,0.1); color:var(--c-rust); padding:4px 8px; border-radius:6px; font-weight:600;">📅 ${t.due} ${timeText ? '⏱️ '+timeText : ''}</span>` : ''}
                 ${t.courseId ? `<span style="font-size:10px; background:rgba(79,70,229,0.1); color:var(--c-indigo); padding:4px 8px; border-radius:6px; font-weight:600;">📚 ${getCourseCodeById(t.courseId) || 'วิชา'}</span>` : ''}
                 ${tagText ? `<span style="font-size:10px; background:#f1f5f9; color:#475569; padding:4px 8px; border-radius:6px; font-weight:600;">${tagText}</span>` : ''}
                 ${t.urgency && t.urgency !== 'Not Urgent' ? `<span style="font-size:10px; background:rgba(245,158,11,0.15); color:#b45309; padding:4px 8px; border-radius:6px; font-weight:600;">🔥 ${t.urgency}</span>` : ''}
              </div>
            </div>
            `;
          }).join('')}
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
  if (typeof window.autoSyncCalendar === 'function') window.autoSyncCalendar();
};

function renderPlannerMatrix() {
  const tasks = (state.plannerTasks || []).map((t, i) => ({...t, origIdx: i})).filter(t => !t.done);
  const q1 = tasks.filter(t => t.urgency === 'Urgent' && t.importance === 'Important');
  const q2 = tasks.filter(t => t.urgency !== 'Urgent' && t.importance === 'Important');
  const q3 = tasks.filter(t => t.urgency === 'Urgent' && t.importance !== 'Important');
  const q4 = tasks.filter(t => t.urgency !== 'Urgent' && t.importance !== 'Important');
  
  const renderQ = (title, items, color, bgGradient, u, i) => `
    <div style="background: rgba(255,255,255,0.6); border: 1px solid ${color}; border-radius: 20px; display:flex; flex-direction:column; min-height: 250px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); backdrop-filter: blur(20px); overflow:hidden;"
         ondragover="event.preventDefault(); this.style.transform='scale(1.02)';" 
         ondragleave="this.style.transform='scale(1)';"
         ondrop="event.preventDefault(); this.style.transform='scale(1)'; moveMatrixTask(event.dataTransfer.getData('text/plain'), '${u}', '${i}')">
      <div style="background: ${bgGradient}; color: white; font-weight: 800; font-size: 15px; padding: 16px 20px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">${title} (${items.length})</div>
      <div style="padding:15px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:10px;">
        ${items.map(t => `
          <div draggable="true" ondragstart="event.dataTransfer.setData('text/plain', ${t.origIdx});" style="font-size:13px; padding:12px; background:white; border: 1px solid rgba(0,0,0,0.05); border-radius:12px; cursor:grab; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.05)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.02)';">
            <div style="font-weight:700; color:var(--c-slate); line-height:1.4;">${t.title}</div>
            ${t.due ? `<div style="font-size:10px; color:var(--c-rust); font-weight:600; background:rgba(239,68,68,0.1); display:inline-block; padding:3px 6px; border-radius:6px; margin-top:6px;">📅 ${t.due}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  return `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
      ${renderQ('Q1: Do First (ด่วน & สำคัญ)', q1, 'rgba(239,68,68,0.3)', 'linear-gradient(135deg, #ef4444, #dc2626)', 'Urgent', 'Important')}
      ${renderQ('Q2: Schedule (ไม่ด่วน แต่สำคัญ)', q2, 'rgba(59,130,246,0.3)', 'linear-gradient(135deg, #3b82f6, #2563eb)', 'Not Urgent', 'Important')}
      ${renderQ('Q3: Delegate (ด่วน แต่ไม่สำคัญ)', q3, 'rgba(245,158,11,0.3)', 'linear-gradient(135deg, #f59e0b, #d97706)', 'Urgent', 'Not Important')}
      ${renderQ("Q4: Don't Do (ไม่ด่วน & ไม่สำคัญ)", q4, 'rgba(148,163,184,0.3)', 'linear-gradient(135deg, #94a3b8, #64748b)', 'Not Urgent', 'Not Important')}
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
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
      <div class="glass-card" style="padding:25px; border-radius:24px; background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
         <div style="font-weight:800; font-size:16px; margin-bottom:15px; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:10px; color: var(--c-slate); display:flex; align-items:center; gap:8px;">
           <div style="background: rgba(16,185,129,0.1); padding: 8px; border-radius: 12px; color: var(--c-green);">💰</div> Project Budget Tracker
         </div>
         <div style="display:flex; flex-direction:column; gap:12px;">
           ${budgets.map(b => `
             <div style="border:1px solid rgba(0,0,0,0.05); border-radius:16px; padding:16px; background:white; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.04)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.02)';">
               <div style="font-weight:800; font-size:15px; color:var(--c-slate);">${b.name}</div>
               <div style="font-size:12px; color:#64748b; margin-bottom:8px;">งบประมาณรวม: ฿${b.budget}</div>
               <div style="display:flex; justify-content:space-between; font-size:12px; font-weight: 600; padding: 8px 12px; background: #f8fafc; border-radius: 8px;">
                 <span>รายรับ: <span style="color:var(--c-green)">฿${b.income}</span></span>
                 <span>รายจ่าย: <span style="color:var(--c-red)">฿${b.expense}</span></span>
               </div>
               <div style="margin-top:10px; font-size:14px; font-weight:800; text-align:right; color: ${(b.income - b.expense) >= 0 ? 'var(--c-green)' : 'var(--c-red)'};">
                 คงเหลือ: ฿${b.income - b.expense}
               </div>
             </div>
           `).join('')}
           ${budgets.length === 0 ? '<div style="padding:20px; text-align:center; color:#94a3b8; font-size:13px;">ยังไม่มีกระเป๋างบประมาณ</div>' : ''}
           <button class="btn-glass-primary" style="margin-top:5px; box-shadow: 0 4px 15px rgba(59,130,246,0.2);" onclick="openAddBudgetModal()">+ เพิ่มกระเป๋างบ</button>
         </div>
      </div>
      
      <div class="glass-card" style="padding:25px; border-radius:24px; background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
         <div style="font-weight:800; font-size:16px; margin-bottom:15px; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:10px; color: var(--c-slate); display:flex; align-items:center; gap:8px;">
           <div style="background: rgba(79,70,229,0.1); padding: 8px; border-radius: 12px; color: var(--c-indigo);">👥</div> Meeting Organizer
         </div>
         <div style="display:flex; flex-direction:column; gap:12px;">
           ${meetings.map(m => `
             <div style="border:1px solid rgba(0,0,0,0.05); border-radius:16px; padding:16px; background:white; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.04)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.02)';">
               <div style="font-weight:800; font-size:15px; color:var(--c-slate);">${m.topic}</div>
               <div style="font-size:12px; color:var(--c-indigo); margin-top:6px; background:rgba(79,70,229,0.05); padding:6px 10px; border-radius:8px; display:inline-block; font-weight:600;">
                 📅 ${m.date} | 📍 ${m.location}
               </div>
             </div>
           `).join('')}
           ${meetings.length === 0 ? '<div style="padding:20px; text-align:center; color:#94a3b8; font-size:13px;">ยังไม่มีการนัดหมายประชุม</div>' : ''}
           <button class="btn-glass-primary" style="margin-top:5px; box-shadow: 0 4px 15px rgba(59,130,246,0.2);" onclick="openAddMeetingModal()">+ สร้างวาระการประชุม</button>
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
        <label style="font-size:12px; font-weight:700;">ชื่องาน / กิจกรรม</label>
        <input type="text" id="pTaskTitle" class="glass-input sm" style="width:100%" placeholder="เช่น ทำสไลด์พรีเซนต์...">
      </div>
      <div>
        <label style="font-size:12px; font-weight:700;">รายละเอียด (ใส่หรือไม่ใส่ก็ได้)</label>
        <input type="text" id="pTaskNote" class="glass-input sm" style="width:100%">
      </div>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div>
          <label style="font-size:12px; font-weight:700;">วันที่ / Deadline</label>
          <input type="date" id="pTaskDue" class="glass-input sm" style="width:100%">
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px;">
          <div>
             <label style="font-size:12px; font-weight:700;">เวลาเริ่ม</label>
             <input type="time" id="pTaskStartTime" class="glass-input sm" style="width:100%">
          </div>
          <div>
             <label style="font-size:12px; font-weight:700;">เวลาสิ้นสุด</label>
             <input type="time" id="pTaskEndTime" class="glass-input sm" style="width:100%">
          </div>
        </div>
      </div>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:5px;">
        <div>
          <label style="font-size:12px; font-weight:700;">หมวดหมู่ (Tag)</label>
          <select id="pTaskTag" class="glass-input sm" style="width:100%">
            <optgroup label="📚 การเรียนและสอบ (Classes & Exams)">
              <option value="class">📚 เข้าเรียน / คลาสเสริม (Classes)</option>
              <option value="assignment">📝 การบ้าน / รายงาน (Assignments)</option>
              <option value="exam">🚨 สอบกลางภาค / ปลายภาค (Exams)</option>
              <option value="study">📖 อ่านหนังสือเตรียมสอบ (Study)</option>
            </optgroup>
            <optgroup label="💼 งานและโปรเจกต์ (Projects & Internship)">
              <option value="research">🔬 โครงงาน / วิจัย (Research)</option>
              <option value="internship">🏢 นัดหมายฝึกงาน (Internship)</option>
              <option value="meeting">💼 ประชุมงาน (Meetings)</option>
              <option value="club">🏛️ กิจกรรมมหาลัย/ชุมนุม (Club Events)</option>
            </optgroup>
            <optgroup label="✨ ส่วนตัว (Personal)">
              <option value="fitness">🏋️ ออกกำลังกาย (Fitness)</option>
              <option value="health">🏥 สุขภาพ / หาหมอ (Health)</option>
              <option value="social">🎉 สังสรรค์ / พักผ่อน (Social)</option>
              <option value="finance">💵 จ่ายบิล / การเงิน (Finance)</option>
              <option value="shopping">🛒 ซื้อของ (Shopping)</option>
              <option value="chores">🧹 งานบ้าน (Chores)</option>
              <option value="personal_project">💡 โปรเจกต์ส่วนตัว (Personal Projects)</option>
              <option value="other">✨ อื่นๆ (Others)</option>
            </optgroup>
          </select>
        </div>
        <div>
          <label style="font-size:12px; font-weight:700; color:var(--c-indigo);">📚 เชื่อมโยงรายวิชา</label>
          <select id="pTaskCourse" class="glass-input sm" style="width:100%">
            <option value="">-- ไม่เชื่อมโยง --</option>
            ${latestCourses.map(c => `<option value="${c.id}">${c.code} ${c.nameTh}</option>`).join('')}
          </select>
        </div>
      </div>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:5px;">
        <div>
          <label style="font-size:12px; font-weight:700;">สถานะ (Kanban)</label>
          <select id="pTaskStage" class="glass-input sm" style="width:100%">
            ${(state.kanbanColumns || ['To Do', 'In Progress', 'Done']).map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px; font-weight:700;">ความเร่งด่วน</label>
          <select id="pTaskUrg" class="glass-input sm" style="width:100%">
            <option value="Not Urgent">ไม่ด่วน (Not Urgent)</option>
            <option value="Urgent">ด่วนมาก (Urgent)</option>
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
  openModal('⚡ เพิ่มงาน/กิจกรรมลง Planner', html, footer);
};

window.savePlannerTask = function() {
  const t = document.getElementById('pTaskTitle')?.value.trim();
  if (!t) return showToast('กรุณาใส่ชื่องาน', 'err');
  
  if (!state.plannerTasks) state.plannerTasks = [];
  state.plannerTasks.push({
    id: 'ptask_' + Date.now() + Math.floor(Math.random()*1000),
    title: t,
    note: document.getElementById('pTaskNote')?.value.trim() || '',
    due: document.getElementById('pTaskDue')?.value || '',
    startTime: document.getElementById('pTaskStartTime')?.value || '',
    endTime: document.getElementById('pTaskEndTime')?.value || '',
    tag: document.getElementById('pTaskTag')?.value || 'other',
    courseId: document.getElementById('pTaskCourse')?.value || null,
    kanbanStage: document.getElementById('pTaskStage')?.value || 'To Do',
    urgency: document.getElementById('pTaskUrg')?.value || 'Not Urgent',
    done: false,
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem('plannerTasks', JSON.stringify(state.plannerTasks));
  closeModal();
  render();
  showToast('✅ เพิ่มงานลง Planner แล้ว');
  if (typeof window.autoSyncCalendar === 'function') window.autoSyncCalendar();
};

window.openAddBudgetModal = function() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:15px; padding:10px 0;">
      <div>
        <label style="font-size:12px; font-weight:700;">ชื่อกระเป๋างบประมาณ</label>
        <input type="text" id="pBudgetName" class="glass-input sm" style="width:100%" placeholder="เช่น งานกีฬาสี, โปรเจกต์จบ">
      </div>
      <div>
        <label style="font-size:12px; font-weight:700;">งบประมาณที่ตั้งไว้ (บาท)</label>
        <input type="number" id="pBudgetTotal" class="glass-input sm" style="width:100%" placeholder="0">
      </div>
    </div>
  `;
  const footer = `
    <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
      <button class="btn-glass-pastel" onclick="closeModal()">ยกเลิก</button>
      <button class="btn-pastel-primary" onclick="saveBudget()">+ สร้างกระเป๋า</button>
    </div>
  `;
  openModal('💰 สร้างกระเป๋างบโปรเจกต์ใหม่', html, footer);
};

window.saveBudget = function() {
  const name = document.getElementById('pBudgetName')?.value.trim();
  const total = parseFloat(document.getElementById('pBudgetTotal')?.value) || 0;
  if (!name) return showToast('กรุณาใส่ชื่อกระเป๋า', 'err');
  
  if (!state.projectBudgets) state.projectBudgets = [];
  state.projectBudgets.push({
    name: name,
    budget: total,
    income: 0,
    expense: 0
  });
  localStorage.setItem('projectBudgets', JSON.stringify(state.projectBudgets));
  closeModal();
  render();
  showToast('✅ สร้างกระเป๋างบประมาณแล้ว');
};

window.openAddMeetingModal = function() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:15px; padding:10px 0;">
      <div>
        <label style="font-size:12px; font-weight:700;">หัวข้อการประชุม</label>
        <input type="text" id="pMeetingTopic" class="glass-input sm" style="width:100%" placeholder="เช่น ประชุมวางแผนงานชุมนุม">
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div>
          <label style="font-size:12px; font-weight:700;">วันที่-เวลา</label>
          <input type="datetime-local" id="pMeetingDate" class="glass-input sm" style="width:100%">
        </div>
        <div>
          <label style="font-size:12px; font-weight:700;">สถานที่/ลิงก์</label>
          <input type="text" id="pMeetingLocation" class="glass-input sm" style="width:100%" placeholder="Google Meet / ห้องสมุด">
        </div>
      </div>
    </div>
  `;
  const footer = `
    <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
      <button class="btn-glass-pastel" onclick="closeModal()">ยกเลิก</button>
      <button class="btn-pastel-primary" onclick="saveMeeting()">+ สร้างวาระการประชุม</button>
    </div>
  `;
  openModal('👥 สร้างวาระการประชุมใหม่', html, footer);
};

window.saveMeeting = function() {
  const topic = document.getElementById('pMeetingTopic')?.value.trim();
  const date = document.getElementById('pMeetingDate')?.value;
  const location = document.getElementById('pMeetingLocation')?.value.trim();
  
  if (!topic) return showToast('กรุณาใส่หัวข้อการประชุม', 'err');
  
  if (!state.meetings) state.meetings = [];
  
  // Format date a bit nicer if it exists
  let displayDate = date;
  if(date) {
    const d = new Date(date);
    displayDate = d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
  }

  state.meetings.push({
    topic: topic,
    date: displayDate || 'ยังไม่กำหนดเวลา',
    location: location || 'ยังไม่กำหนดสถานที่'
  });
  localStorage.setItem('meetings', JSON.stringify(state.meetings));
  closeModal();
  render();
  showToast('✅ สร้างวาระการประชุมแล้ว');
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
      if (typeof window.autoSyncCalendar === 'function') window.autoSyncCalendar();
    }
  }
  
  const delBtn = e.target.closest('[data-del-planner]');
  if (delBtn) {
    const idx = parseInt(delBtn.dataset.delPlanner);
    if(confirm('ลบงานนี้หรือไม่?')) {
      state.plannerTasks.splice(idx, 1);
      localStorage.setItem('plannerTasks', JSON.stringify(state.plannerTasks));
      render();
      if (typeof window.autoSyncCalendar === 'function') window.autoSyncCalendar();
    }
  }
});


// ══════════════════════════════════════════════════
// GOOGLE CALENDAR SYNC LOGIC (PHASE 1)
// ══════════════════════════════════════════════════
var plannerTokenClient;
var plannerGapiInited = false;
var plannerGisInited = false;
var CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar';

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

window._autoSyncTimer = null;
window._isSyncingCalendar = false;

window.autoSyncCalendar = function() {
  if (state.calendarConfig?.syncEnabled) {
    if (window._autoSyncTimer) clearTimeout(window._autoSyncTimer);
    window._autoSyncTimer = setTimeout(() => {
      if (typeof window.forceSyncCalendar === 'function') {
        window.forceSyncCalendar(true); // silent mode
      }
    }, 2500); // Wait for loadAll and batch updates
  }
};

window.forceSyncCalendar = async function(isSilent = false) {
  if (!state.calendarConfig.syncEnabled || !state.calendarConfig.accessToken) {
    if (!isSilent) return showToast('กรุณาเชื่อมต่อ Google Calendar ก่อน', 'err');
    return;
  }
  
  if (window._isSyncingCalendar) {
    console.log("Calendar sync already in progress. Skipping.");
    if (!isSilent) showToast('กำลังประมวลผลอยู่ กรุณารอสักครู่...', 'info');
    return;
  }
  
  window._isSyncingCalendar = true;
  
  if (!isSilent) showToast('กำลังประมวลผลข้อมูลปฏิทิน...', 'info');
  try {
    const term = state.selectedSemester || (typeof getCurrentSemester === 'function' ? getCurrentSemester()?.id : null) || (state.semesters && state.semesters.length ? state.semesters[state.semesters.length - 1].id : null);
    const courses = state.courses[term] || [];
    const settings = state.calendarSettings || {};
    
    if (!settings.semesterStart || !settings.semesterEnd) {
      return showToast('กรุณาระบุ วันเปิดเทอม และ วันสิ้นสุดเทอม ในหน้า "ตั้งค่าปฏิทินการศึกษา" ก่อนซิงก์ครับ', 'err');
    }
    
    const endTermDate = new Date(settings.semesterEnd);
    endTermDate.setHours(23, 59, 59, 0);
    const untilStr = endTermDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    // Initialize categorised events array
    const categorizedEvents = {
      classes: [],
      assignments: [],
      projects: [],
      personal: []
    };
    
    // 1. CLASSES
    courses.forEach(c => {
      if (!c.schedules) return;
      c.schedules.forEach(s => {
        const dayMap = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
        const byDay = dayMap[s.day];
        const baseUrl = window.location.origin + window.location.pathname;
        const checkinLink = `${baseUrl}#checkin=${c.id}`;
        categorizedEvents.classes.push({
          summary: `[${c.code || 'ไม่มีรหัส'}] ${c.nameTh || c.nameEn || 'ไม่ระบุชื่อวิชา'}`,
          location: c.room || 'ไม่ระบุห้อง',
          description: `อาจารย์: ${c.instructor || '-'}\nหมวดหมู่: ${c.mode || 'Onsite'}\n\n📍 <a href="${checkinLink}">กดที่นี่เพื่อเช็คชื่อเข้าเรียน</a>`,
          start: { dateTime: getFirstClassDate(settings.semesterStart, s.day, s.startHour), timeZone: 'Asia/Bangkok' },
          end: { dateTime: getFirstClassDate(settings.semesterStart, s.day, s.endHour), timeZone: 'Asia/Bangkok' },
          recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${untilStr}`]
        });
      });
    });

    // 2. ASSIGNMENTS & EXAMS
    const allAssignments = Object.values(state.assignments || {}).flat();
    allAssignments.forEach(a => {
      if(!a.deadline) return;
      const isDone = a.submitted || a.status === 'ส่งแล้ว';
      const prefix = isDone ? '✅ ' : '📝 ';
      const cCode = getCourseCodeById(a.courseId) || '';
      categorizedEvents.assignments.push({
        summary: `${prefix}[${cCode}] ${a.title}`,
        description: `สถานะ: ${a.status}\n\n${a.desc || ''}`,
        start: { date: a.deadline },
        end: { date: a.deadline }
      });
    });

    const allExams = Object.values(state.exams || {}).flat();
    allExams.forEach(e => {
      if(!e.date) return;
      // if time exists, we have to provide end time as well to Google Calendar API
      // Let's assume exam is 2 hours long if time is provided
      let endDateTime = '';
      if (e.time) {
        const d = new Date(`${e.date}T${e.time}:00`);
        d.setHours(d.getHours() + 2);
        const pad = n => String(n).padStart(2, '0');
        endDateTime = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      }
      
      categorizedEvents.assignments.push({
        summary: `🚨 สอบ ${e.type}: [${e.courseName}] ${e.title}`,
        location: e.room || '',
        description: `ขอบเขต: ${e.scope || '-'}\nหมายเหตุ: ${e.notes || '-'}`,
        start: e.time ? { dateTime: `${e.date}T${e.time}:00`, timeZone: 'Asia/Bangkok' } : { date: e.date },
        end: e.time ? { dateTime: endDateTime, timeZone: 'Asia/Bangkok' } : { date: e.date }
      });
    });

    // 3. TASKS
    const tasks = state.plannerTasks || [];
    tasks.forEach(t => {
      const isDone = t.done;
      const prefix = isDone ? '✅ ' : '';
      
      let targetCat = 'personal';
      if (['research', 'internship', 'meeting', 'club'].includes(t.tag)) targetCat = 'projects';
      else if (['class', 'assignment', 'exam', 'study'].includes(t.tag)) targetCat = 'assignments';
      
      const evt = {
        summary: `${prefix}${t.title}`,
        description: `${t.note || ''}\n\nแท็ก: ${t.tag}\nสถานะ: ${t.kanbanStage}`,
      };
      
      if (t.due && t.startTime && t.endTime) {
        evt.start = { dateTime: `${t.due}T${t.startTime}:00`, timeZone: 'Asia/Bangkok' };
        evt.end = { dateTime: `${t.due}T${t.endTime}:00`, timeZone: 'Asia/Bangkok' };
      } else if (t.due) {
        evt.start = { date: t.due };
        evt.end = { date: t.due };
      } else {
        return; // Skip tasks without due date
      }
      
      categorizedEvents[targetCat].push(evt);
    });

    if (!state.calendarConfig.multiCalendarIds) {
      state.calendarConfig.multiCalendarIds = {};
    }

    const calNames = {
      classes: "📚 NITIPAT - ตารางเรียน",
      assignments: "🚨 NITIPAT - การบ้านและสอบ",
      projects: "💼 NITIPAT - งานและโปรเจกต์",
      personal: "✨ NITIPAT - ส่วนตัว"
    };

    let totalSuccessCount = 0;

    for (const cat of ['classes', 'assignments', 'projects', 'personal']) {
      const events = categorizedEvents[cat];
      if (events.length === 0) continue;

      let calId = state.calendarConfig.multiCalendarIds[cat];
      
      // Create if not exists
      if (!calId) {
        if (!isSilent) showToast(`กำลังสร้างปฏิทิน ${calNames[cat]}...`, 'info');
        const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${state.calendarConfig.accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: calNames[cat], timeZone: "Asia/Bangkok" })
        });
        if (createRes.ok) {
          const calData = await createRes.json();
          calId = calData.id;
          state.calendarConfig.multiCalendarIds[cat] = calId;
          localStorage.setItem('calendarConfig', JSON.stringify(state.calendarConfig));
        } else {
          calId = 'primary';
        }
      }

      // Wipe old events
      try {
        const listRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?maxResults=2500`, {
          headers: { 'Authorization': `Bearer ${state.calendarConfig.accessToken}` }
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.items && listData.items.length > 0) {
            const deletePromises = listData.items.map(ev => 
              fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${ev.id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${state.calendarConfig.accessToken}` }
              })
            );
            await Promise.all(deletePromises);
          }
        }
      } catch (err) { console.error("Error clearing old events", err); }

      // Sync new events
      for (const ev of events) {
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${state.calendarConfig.accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(ev)
        });
        if (res.ok) totalSuccessCount++;
        else if (res.status === 401) {
          if (!isSilent) showToast('Token หมดอายุ กรุณาเชื่อมต่อใหม่', 'err');
          state.calendarConfig.syncEnabled = false;
          render();
          return;
        }
      }
    }
    
    if (!isSilent) showToast(`✅ ซิงค์เสร็จสิ้น ${totalSuccessCount} รายการ!`);
    else console.log(`Auto sync completed: ${totalSuccessCount} items`);
    
  } catch (err) {
    console.error(err);
    if (!isSilent) showToast('เกิดข้อผิดพลาดในการซิงค์', 'err');
  } finally {
    window._isSyncingCalendar = false;
  }
};

function getFirstClassDate(termStartStr, dayOfWeek, hourFloat) {
  let d = new Date(termStartStr);
  const day = d.getDay(); // 0=SU, 1=MO...
  const targetDay = (dayOfWeek + 1) % 7; // Convert 0=MO... to JS standard 0=SU...
  let diff = targetDay - day;
  if (diff < 0) {
    diff += 7;
  }
  d.setDate(d.getDate() + diff);
  
  const h = Math.floor(hourFloat);
  const m = Math.round((hourFloat - h) * 60);
  d.setHours(h, m, 0, 0);
  
  const pad = n => String(n).padStart(2, '0');
  const localStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  return localStr;
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

