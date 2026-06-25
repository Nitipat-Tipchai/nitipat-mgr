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
