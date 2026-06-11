// ══════════════════════════════════════════════════
// INTERACTIVE CURRICULUM MAP
// ══════════════════════════════════════════════════

const CURRICULUM_DATA = [
  {
    id: "y1s1", year: 1, term: 1, label: "ปี 1 ต้น", credits: 21,
    courses: [
      { id: '01999xxx_1', code: '01999xxx', cr: 3, label: 'L' },
      { id: '01355xxx_1', code: '01355xxx', cr: 3, label: '' },
      { id: '01208111', code: '01208111', cr: 3, label: '' },
      { id: '01417167', code: '01417167', cr: 3, label: '' },
      { id: '01420111', code: '01420111', cr: 3, label: '' },
      { id: '01420113', code: '01420113', cr: 1, label: '' },
      { id: '01999111', code: '01999111', cr: 2, label: 'L' },
      { id: 'free_1', code: '', cr: 3, label: '' }
    ]
  },
  {
    id: "y1s2", year: 1, term: 2, label: "ปี 1 ปลาย", credits: 20,
    courses: [
      { id: '01200101', code: '01200101', cr: 3, label: '' },
      { id: '01204111', code: '01204111', cr: 3, label: '' },
      { id: '01213211', code: '01213211', cr: 3, label: '' },
      { id: '01417168', code: '01417168', cr: 3, label: '' },
      { id: '01420112', code: '01420112', cr: 3, label: '' },
      { id: '01420114', code: '01420114', cr: 1, label: '' },
      { id: '01403117', code: '01403117', cr: 3, label: '' },
      { id: '01403114', code: '01403114', cr: 1, label: '' }
    ]
  },
  {
    id: "y2s1", year: 2, term: 1, label: "ปี 2 ต้น", credits: 22,
    courses: [
      { id: '01206221', code: '01206221', cr: 3, label: '' },
      { id: '01208221', code: '01208221', cr: 3, label: '' },
      { id: '01213212', code: '01213212', cr: 4, label: '' },
      { id: '01213213', code: '01213213', cr: 4, label: '' },
      { id: '01213214', code: '01213214', cr: 1, label: '' },
      { id: '01175xxx', code: '01175xxx', cr: 1, label: '' },
      { id: '01355xxx_2', code: '01355xxx', cr: 3, label: '' },
      { id: 'free_2', code: '', cr: 3, label: 'W' }
    ]
  },
  {
    id: "y2s2", year: 2, term: 2, label: "ปี 2 ปลาย", credits: 21,
    courses: [
      { id: '01205201', code: '01205201', cr: 3, label: '' },
      { id: '01213216', code: '01213216', cr: 4, label: '' },
      { id: '01213217', code: '01213217', cr: 3, label: '' },
      { id: '01213218', code: '01213218', cr: 3, label: '' },
      { id: '01213219', code: '01213219', cr: 1, label: '' },
      { id: '01208281', code: '01208281', cr: 1, label: '' },
      { id: '01417267', code: '01417267', cr: 3, label: '' },
      { id: 'free_3', code: '', cr: 3, label: 'W' }
    ]
  },
  {
    id: "y3s1", year: 3, term: 1, label: "ปี 3 ต้น", credits: 14,
    courses: [
      { id: '01205202', code: '01205202', cr: 1, label: '' },
      { id: '01208381', code: '01208381', cr: 1, label: '' },
      { id: '01213311', code: '01213311', cr: 3, label: '' },
      { id: '01213312', code: '01213312', cr: 1, label: '' },
      { id: '01213313', code: '01213313', cr: 4, label: '' },
      { id: '01213314', code: '01213314', cr: 3, label: '' },
      { id: '01213395', code: '01213395', cr: 1, label: '' }
    ]
  },
  {
    id: "y3s2", year: 3, term: 2, label: "ปี 3 ปลาย", credits: 20,
    courses: [
      { id: '01213316', code: '01213316', cr: 1, label: '' },
      { id: '01213497', code: '01213497', cr: 1, label: '' },
      { id: '01355xxx_3', code: '01355xxx', cr: 3, label: 'EE' },
      { id: 'free_4', code: '', cr: 3, label: 'EE' },
      { id: 'free_5', code: '', cr: 3, label: 'EE' },
      { id: 'free_6', code: '', cr: 3, label: 'FE' },
      { id: 'free_7', code: '', cr: 3, label: 'A' }
    ]
  },
  {
    id: "y4s1", year: 4, term: 1, label: "ปี 4 ต้น", credits: 10,
    courses: [
      { id: '01213399', code: '01213399', cr: 1, label: '' },
      { id: 'free_8', code: '', cr: 3, label: 'EE' },
      { id: 'free_9', code: '', cr: 3, label: 'EE' },
      { id: 'free_10', code: '', cr: 3, label: 'FE' }
    ]
  },
  {
    id: "y4s2", year: 4, term: 2, label: "ปี 4 ปลาย", credits: 9,
    courses: [
      { id: '01213411', code: '01213411', cr: 3, label: '' },
      { id: '01213412', code: '01213412', cr: 3, label: '' },
      { id: '01213499', code: '01213499', cr: 3, label: '' }
    ]
  }
];

const CURRICULUM_ARROWS = [
  { from: '01417167', to: '01417168', type: 'solid' },
  { from: '01417168', to: '01417267', type: 'solid' },
  { from: '01420111', to: '01420112', type: 'solid' },
  { from: '01420113', to: '01420114', type: 'solid' },
  { from: '01213211', to: '01213212', type: 'solid' },
  { from: '01213211', to: '01213213', type: 'solid' },
  { from: '01213212', to: '01213216', type: 'solid' },
  { from: '01213213', to: '01213217', type: 'solid' },
  { from: '01213214', to: '01213218', type: 'solid' },
  { from: '01213214', to: '01213219', type: 'solid' },
  { from: '01205201', to: '01205202', type: 'solid' },
  { from: '01205202', to: '01208381', type: 'solid' },
  { from: '01213311', to: '01213316', type: 'solid' },
  { from: '01213395', to: '01213497', type: 'solid' },
  { from: '01213497', to: '01213499', type: 'solid' },
  { from: '01213212', to: '01213314', type: 'solid' },
  { from: '01213213', to: '01213313', type: 'solid' },
  { from: '01205202', to: '01213316', type: 'solid' },
  { from: '01208381', to: '01213497', type: 'solid' },
  
  // Co-requisites (dashed)
  { from: '01213312', to: '01213311', type: 'dashed' },
  { from: '01213412', to: '01213411', type: 'dashed' }
];

let resizeListenerMap = null;

function renderCurriculumMap() {
  const passedCodes = new Set();
  const inProgCodes = new Set();
  
  // Collect status
  state.semesters.forEach(s => {
    (state.courses[s.id] || []).forEach(c => {
      if (c.grade && c.grade !== 'F' && c.grade !== 'W' && c.grade !== 'N') passedCodes.add(c.code);
      else if (!c.grade) inProgCodes.add(c.code);
    });
  });

  setTimeout(() => {
    drawCurriculumArrows();
    if (!resizeListenerMap) {
      resizeListenerMap = () => {
        if (document.getElementById('curriculumCanvas')) {
          drawCurriculumArrows();
        } else {
          window.removeEventListener('resize', resizeListenerMap);
          resizeListenerMap = null;
        }
      };
      window.addEventListener('resize', resizeListenerMap);
    }
  }, 100);

  return `<div class="page-wrap">
    <div class="page-header"><h1 class="page-title">🗺 แผนผังหลักสูตรวิศวกรรมวัสดุ (Interactive)</h1></div>
    <div class="curriculum-container" id="curriculumContainer" style="position:relative; width:100%; overflow-x:auto; padding-bottom:40px;">
      <svg id="curriculumCanvas" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0;"></svg>
      <div style="display:flex; gap:20px; min-width:max-content; position:relative; z-index:1; padding: 20px;">
        ${CURRICULUM_DATA.map(term => `
          <div class="curr-column" style="width:160px; display:flex; flex-direction:column; gap:15px;">
            <div class="curr-term-header" style="text-align:center; padding-bottom:10px; border-bottom:2px solid var(--glass-border); margin-bottom:10px;">
              <div style="font-weight:700; color:var(--text);">${term.label}</div>
              <div style="font-size:12px; color:var(--text-muted);">${term.credits} หน่วยกิต</div>
            </div>
            ${term.courses.map(c => {
              const hasCode = !!c.code;
              const isPassed = hasCode && passedCodes.has(c.code);
              const isInProg = hasCode && inProgCodes.has(c.code);
              
              // Status Class
              let boxClass = 'curr-box';
              if (isPassed) boxClass += ' passed';
              else if (isInProg) boxClass += ' in-progress';
              else if (!hasCode) boxClass += ' empty-box';

              // Inner Label
              let innerHtml = '';
              if (hasCode) {
                innerHtml = `
                  <div class="curr-cr">${c.cr}</div>
                  <div class="curr-code">${c.code}</div>
                `;
              } else {
                innerHtml = `
                  <div class="curr-cr">${c.cr}</div>
                  <div class="curr-code" style="color:var(--text-muted); font-size:12px;">${c.label}</div>
                `;
              }

              return `
                <div class="${boxClass}" id="node-${c.id}" data-code="${c.code}" 
                     onmouseenter="highlightArrows('${c.id}', '${c.code}')" 
                     onmouseleave="resetArrows()"
                     onclick="${hasCode ? `showCourseDetailsModal('${c.code}')` : ''}"
                     style="display:flex; background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:8px; padding:6px; cursor:${hasCode ? 'pointer':'default'}; box-shadow:0 4px 6px rgba(0,0,0,0.05); transition:all 0.2s;">
                  <div style="width:24px; border-right:1px solid var(--glass-border); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">${c.cr}</div>
                  <div style="flex:1; text-align:center; font-weight:600; font-family:monospace; font-size:14px; display:flex; align-items:center; justify-content:center;">${c.code || c.label}</div>
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="glass-card" style="margin-top:20px;">
      <h3 style="margin-bottom:10px;">คำอธิบายสัญลักษณ์</h3>
      <div style="display:flex; gap:20px; flex-wrap:wrap; font-size:13px;">
        <div style="display:flex; align-items:center; gap:8px;"><div style="width:16px;height:16px;background:var(--c-mint);border-radius:4px;"></div> ผ่านแล้ว</div>
        <div style="display:flex; align-items:center; gap:8px;"><div style="width:16px;height:16px;background:var(--c-sun);border-radius:4px;"></div> กำลังเรียน</div>
        <div style="display:flex; align-items:center; gap:8px;"><div style="width:16px;height:16px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:4px;"></div> รอเรียน</div>
        <div style="display:flex; align-items:center; gap:8px;"><svg width="30" height="10"><line x1="0" y1="5" x2="30" y2="5" stroke="#ef4444" stroke-width="2" marker-end="url(#arrowhead)"/></svg> วิชาบังคับก่อน</div>
        <div style="display:flex; align-items:center; gap:8px;"><svg width="30" height="10"><line x1="0" y1="5" x2="30" y2="5" stroke="#ef4444" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrowhead)"/></svg> เรียนพร้อมกัน</div>
      </div>
      <div style="margin-top:15px; font-size:12px; opacity:0.7;">
        W = หมวดอยู่ดีมีสุข, E = หมวดศาสตร์แห่งผู้ประกอบการ, T = หมวดพลเมืองไทย, L = หมวดภาษา, A = หมวดสุนทรียศาสตร์<br>
        EE = วิชาเลือกทางวิศวกรรม, FE = วิชาเลือกเสรี
      </div>
    </div>
  </div>
  <style>
    .curr-box.passed { background: rgba(34, 197, 94, 0.1) !important; border-color: var(--c-mint) !important; color: var(--c-mint); }
    .curr-box.in-progress { background: rgba(234, 179, 8, 0.1) !important; border-color: var(--c-sun) !important; color: var(--c-sun); }
    .curr-box:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.1) !important; border-color: var(--c-accent) !important; }
    .curr-box.empty-box { opacity: 0.7; }
    .curr-box.highlight { box-shadow: 0 0 0 2px var(--c-accent) !important; background: rgba(99, 102, 241, 0.1) !important; }
  </style>`;
}

function drawCurriculumArrows() {
  const container = document.getElementById('curriculumContainer');
  const svg = document.getElementById('curriculumCanvas');
  if (!container || !svg) return;

  const rectContainer = container.getBoundingClientRect();
  
  // Create defs for arrowhead
  let svgContent = `
    <defs>
      <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
        <polygon points="0 0, 6 2, 0 4" fill="#ef4444" />
      </marker>
      <marker id="arrowhead-highlight" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
        <polygon points="0 0, 6 2, 0 4" fill="#6366f1" />
      </marker>
    </defs>
  `;

  CURRICULUM_ARROWS.forEach((arrow, idx) => {
    // Find DOM nodes
    // Arrow from could be an ID (like 01417167) but multiple might exist if retaken. 
    // We search by data-code. Since there are unique IDs in our layout, we use those.
    const fromNodes = Array.from(document.querySelectorAll(`[data-code="${arrow.from}"]`));
    const toNodes = Array.from(document.querySelectorAll(`[data-code="${arrow.to}"]`));

    if (fromNodes.length > 0 && toNodes.length > 0) {
      const fromEl = fromNodes[0];
      const toEl = toNodes[0];

      const r1 = fromEl.getBoundingClientRect();
      const r2 = toEl.getBoundingClientRect();

      // Calculate relative to SVG container
      const x1 = r1.right - rectContainer.left;
      const y1 = r1.top + (r1.height / 2) - rectContainer.top;
      
      const x2 = r2.left - rectContainer.left;
      const y2 = r2.top + (r2.height / 2) - rectContainer.top;

      let pathD = '';
      
      // If on same line or next column, straight curve
      if (Math.abs(y1 - y2) < 20) {
        pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
      } else {
        // Curve
        const mx = x1 + (x2 - x1) / 2;
        pathD = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
      }

      // Draw path
      const dash = arrow.type === 'dashed' ? 'stroke-dasharray="4,4"' : '';
      svgContent += `
        <path id="arrow-${arrow.from}-${arrow.to}" 
              d="${pathD}" 
              fill="none" 
              stroke="#ef4444" 
              stroke-width="1.5" 
              marker-end="url(#arrowhead)" 
              ${dash} 
              opacity="0.4"
              class="curr-arrow"
              data-from="${arrow.from}"
              data-to="${arrow.to}"
        />
      `;
    }
  });

  svg.innerHTML = svgContent;
}

window.highlightArrows = function(id, code) {
  if (!code) return;
  document.querySelectorAll('.curr-arrow').forEach(path => {
    if (path.getAttribute('data-from') === code || path.getAttribute('data-to') === code) {
      path.setAttribute('stroke', '#6366f1');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('opacity', '1');
      path.setAttribute('marker-end', 'url(#arrowhead-highlight)');
      
      // Highlight the connected nodes
      const targetCode = path.getAttribute('data-from') === code ? path.getAttribute('data-to') : path.getAttribute('data-from');
      const targetNode = document.querySelector(`[data-code="${targetCode}"]`);
      if (targetNode) targetNode.classList.add('highlight');
    } else {
      path.setAttribute('opacity', '0.1');
    }
  });
};

window.resetArrows = function() {
  document.querySelectorAll('.curr-arrow').forEach(path => {
    path.setAttribute('stroke', '#ef4444');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('opacity', '0.4');
    path.setAttribute('marker-end', 'url(#arrowhead)');
  });
  document.querySelectorAll('.curr-box').forEach(box => {
    box.classList.remove('highlight');
  });
};
