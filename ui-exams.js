// ══════════════════════════════════════════════════
// EXAMS
// ══════════════════════════════════════════════════
function renderExams() {
  const curSemId = state.selectedSemester || (getCurrentSemester()?.id) || (state.semesters.length ? state.semesters[state.semesters.length - 1].id : null);
  const semCourseIds = (state.courses[curSemId] || []).map(c => c.id);
  const allCourses = Object.values(state.courses).flat();
  const allE = Object.entries(state.exams).flatMap(([cid, arr]) => {
    if (!semCourseIds.includes(cid)) return [];
    const c = allCourses.find(x => x.id === cid);
    return arr.map(e => ({ ...e, courseName: c?.code || cid, courseColor: c?.color }));
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

