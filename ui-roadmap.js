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
