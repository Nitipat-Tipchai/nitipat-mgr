// ══════════════════════════════════════════════════
// ASSIGNMENTS
// ══════════════════════════════════════════════════
function renderAssignments() {
  const curSemId = state.selectedSemester || (getCurrentSemester()?.id) || (state.semesters.length ? state.semesters[state.semesters.length - 1].id : null);
  const semCourseIds = (state.courses[curSemId] || []).map(c => c.id);
  const allCourses = Object.values(state.courses).flat();
  
  const allA = Object.entries(state.assignments).flatMap(([cid, arr]) => {
    if (!semCourseIds.includes(cid)) return [];
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
