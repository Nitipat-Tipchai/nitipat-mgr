// ══════════════════════════════════════════════════
// INTERACTIVE CURRICULUM MAP
// ══════════════════════════════════════════════════

const CURRICULUM_DATA = [
  {
    id: "y1s1", year: 1, term: 1, label: "ปี 1 ต้น", credits: 21,
    courses: [
      { id: '01999xxx_1', code: '01999xxx', cr: 3, label: 'L', type: 'gened' },
      { id: '01355xxx_1', code: '01355xxx', cr: 3, label: '', type: 'gened' },
      { id: '01208111', code: '01208111', cr: 3, label: '', type: 'core' },
      { id: '01417167', code: '01417167', cr: 3, label: '', type: 'sci' },
      { id: '01420111', code: '01420111', cr: 3, label: '', type: 'sci' },
      { id: '01420113', code: '01420113', cr: 1, label: '', type: 'sci' },
      { id: '01999111', code: '01999111', cr: 2, label: 'L', type: 'gened' },
      { id: 'free_1a', code: '', cr: 2, label: '', type: 'free' },
      { id: 'free_1b', code: '', cr: 1, label: '', type: 'free' }
    ]
  },
  {
    id: "y1s2", year: 1, term: 2, label: "ปี 1 ปลาย", credits: 20,
    courses: [
      { id: '01200101', code: '01200101', cr: 3, label: '', type: 'core' },
      { id: '01204111', code: '01204111', cr: 3, label: '', type: 'core' },
      { id: '01213211', code: '01213211', cr: 3, label: '', type: 'major' },
      { id: '01417168', code: '01417168', cr: 3, label: '', type: 'sci' },
      { id: '01420112', code: '01420112', cr: 3, label: '', type: 'sci' },
      { id: '01420114', code: '01420114', cr: 1, label: '', type: 'sci' },
      { id: '01403117', code: '01403117', cr: 3, label: '', type: 'sci' },
      { id: '01403114', code: '01403114', cr: 1, label: '', type: 'sci' }
    ]
  },
  {
    id: "y2s1", year: 2, term: 1, label: "ปี 2 ต้น", credits: 22,
    courses: [
      { id: '01206221', code: '01206221', cr: 3, label: '', type: 'core' },
      { id: '01208221', code: '01208221', cr: 3, label: '', type: 'core' },
      { id: '01213212', code: '01213212', cr: 4, label: '', type: 'major' },
      { id: '01213213', code: '01213213', cr: 4, label: '', type: 'major' },
      { id: '01213214', code: '01213214', cr: 1, label: '', type: 'major' },
      { id: '01175xxx', code: '01175xxx', cr: 1, label: '', type: 'gened' },
      { id: '01355xxx_2', code: '01355xxx', cr: 3, label: '', type: 'gened' },
      { id: 'free_2', code: '', cr: 3, label: 'W', type: 'gened' }
    ]
  },
  {
    id: "y2s2", year: 2, term: 2, label: "ปี 2 ปลาย", credits: 21,
    courses: [
      { id: '01205201', code: '01205201', cr: 3, label: '', type: 'core' },
      { id: '01213216', code: '01213216', cr: 4, label: '', type: 'major' },
      { id: '01213217', code: '01213217', cr: 3, label: '', type: 'major' },
      { id: '01213218', code: '01213218', cr: 3, label: '', type: 'major' },
      { id: '01213219', code: '01213219', cr: 1, label: '', type: 'major' },
      { id: '01208281', code: '01208281', cr: 1, label: '', type: 'core' },
      { id: '01417267', code: '01417267', cr: 3, label: '', type: 'sci' },
      { id: 'free_3', code: '', cr: 3, label: 'W', type: 'gened' }
    ]
  },
  {
    id: "y3s1", year: 3, term: 1, label: "ปี 3 ต้น", credits: 14,
    courses: [
      { id: '01205202', code: '01205202', cr: 1, label: '', type: 'core' },
      { id: '01208381', code: '01208381', cr: 1, label: 'ปฏิบัติการวิศวกรรมเครื่องกล I', type: 'core' },
      { id: '01213311', code: '01213311', cr: 3, label: '', type: 'major' },
      { id: '01213312', code: '01213312', cr: 1, label: '', type: 'major' },
      { id: '01213313', code: '01213313', cr: 4, label: '', type: 'major' },
      { id: '01213314', code: '01213314', cr: 3, label: '', type: 'major' },
      { id: '01213395', code: '01213395', cr: 1, label: '', type: 'major' }
    ]
  },
  {
    id: "y3s2", year: 3, term: 2, label: "ปี 3 ปลาย", credits: 20,
    courses: [
      { id: '01213316', code: '01213316', cr: 1, label: '', type: 'major' },
      { id: '01213497', code: '01213497', cr: 1, label: '', type: 'major' },
      { id: '01355xxx_3', code: '01355xxx', cr: 3, label: 'EE', type: 'gened' },
      { id: 'free_4', code: '', cr: 3, label: 'EE', type: 'major_elec' },
      { id: 'free_5', code: '', cr: 3, label: 'EE', type: 'major_elec' },
      { id: 'free_6', code: '', cr: 3, label: 'FE', type: 'free' },
      { id: 'free_7', code: '', cr: 3, label: 'A', type: 'gened' }
    ]
  },
  {
    id: "y4s1", year: 4, term: 1, label: "ปี 4 ต้น", credits: 10,
    courses: [
      { id: '01213399', code: '01213399', cr: 1, label: '', type: 'major' },
      { id: 'free_8', code: '', cr: 3, label: 'EE', type: 'major_elec' },
      { id: 'free_9', code: '', cr: 3, label: 'EE', type: 'major_elec' },
      { id: 'free_10', code: '', cr: 3, label: 'FE', type: 'free' }
    ]
  },
  {
    id: "y4s2", year: 4, term: 2, label: "ปี 4 ปลาย", credits: 9,
    courses: [
      { id: '01213411', code: '01213411', cr: 3, label: '', type: 'major' },
      { id: '01213412', code: '01213412', cr: 3, label: '', type: 'major' },
      { id: '01213499', code: '01213499', cr: 3, label: '', type: 'major' }
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
  { from: '01213217', to: '01213313', type: 'solid' },
  { from: '01205202', to: '01213316', type: 'solid' },
  { from: '01208381', to: '01213497', type: 'solid' },
  { from: '01213312', to: '01213311', type: 'dashed' },
  { from: '01213412', to: '01213411', type: 'dashed' }
];

let resizeListenerMap = null;
let currentZoom = 1;

function initCurriculumMapping() {
  if (!state.curriculumMapping) {
    try {
      state.curriculumMapping = JSON.parse(localStorage.getItem('nitipat_curriculum_mapping') || '{}');
    } catch(e) {
      state.curriculumMapping = {};
    }
  }
}

function saveCurriculumMapping() {
  localStorage.setItem('nitipat_curriculum_mapping', JSON.stringify(state.curriculumMapping));
}

function renderCurriculumMap() {
  initCurriculumMapping();
  
  const passedCodes = new Set();
  const inProgCodes = new Set();
  
  state.semesters.forEach(s => {
    (state.courses[s.id] || []).forEach(c => {
      if (c.grade && c.grade !== 'F' && c.grade !== 'W' && c.grade !== 'N') passedCodes.add(c.code);
      else if (!c.grade) inProgCodes.add(c.code);
    });
  });

  setTimeout(() => {
    if (state.currViewMode !== 'roadmap') {
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
    }
  }, 100);

  // Roadmap Data
  // Create a deep copy to prevent modifying COURSE_DB directly
  const sections = [
    { label: '📖 หมวดวิชาศึกษาทั่วไป (30 cr)', courses: typeof COURSE_DB !== 'undefined' ? JSON.parse(JSON.stringify(COURSE_DB.general)) : [], target: 30 },
    { label: '🔬 พื้นฐานทางวิทยาศาสตร์ (21 cr)', courses: typeof COURSE_DB !== 'undefined' ? JSON.parse(JSON.stringify(COURSE_DB.science)) : [], target: 21 },
    { label: '⚙️ พื้นฐานทางวิศวกรรม (27 cr)', courses: typeof COURSE_DB !== 'undefined' ? JSON.parse(JSON.stringify(COURSE_DB.engineering_basic)) : [], target: 27 },
    { label: '🏗 วิชาบังคับทางวิศวกรรม (37 cr)', courses: typeof COURSE_DB !== 'undefined' ? JSON.parse(JSON.stringify(COURSE_DB.core)) : [], target: 37 },
    { label: '🔧 วิชาเลือกทางวิศวกรรม (16 cr)', courses: typeof COURSE_DB !== 'undefined' ? JSON.parse(JSON.stringify(COURSE_DB.elective)) : [], target: 16 },
  ];

  if (state.customRoadmapCourses) {
    state.customRoadmapCourses.forEach(cc => {
      const sec = sections.find(s => s.label.includes(cc.category));
      if (sec && !sec.courses.find(c => c.code === cc.code)) {
        sec.courses.push({ code: cc.code, name: cc.name, credits: cc.cr, isCustom: true, category: cc.category });
      }
    });
  }

  const isMap = state.currViewMode !== 'roadmap';

  return `<div class="page-wrap">
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 10px;">
      <h1 class="page-title">🗺 แผนผังหลักสูตร & Roadmap</h1>
      <div style="display:flex; gap:10px; align-items: center;">
        <div class="toggle-group" style="display:flex; background:rgba(0,0,0,0.2); border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.1);">
          <button onclick="state.currViewMode='map'; render();" style="padding:8px 15px; border:none; cursor:pointer; background:${isMap ? 'var(--c-accent)' : 'transparent'}; color:white; font-weight:600;">ผังต้นไม้</button>
          <button onclick="state.currViewMode='roadmap'; render();" style="padding:8px 15px; border:none; cursor:pointer; background:${!isMap ? 'var(--c-accent)' : 'transparent'}; color:white; font-weight:600;">Roadmap</button>
        </div>
        ${isMap ? `
        <div style="background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:8px; display:flex; overflow:hidden;">
          <button onclick="changeCurrZoom(-0.1)" style="padding:8px 12px; border:none; background:transparent; cursor:pointer; border-right:1px solid var(--glass-border);">-</button>
          <div id="currZoomDisplay" style="padding:8px 12px; font-weight:600; min-width:50px; text-align:center;">${Math.round(currentZoom*100)}%</div>
          <button onclick="changeCurrZoom(0.1)" style="padding:8px 12px; border:none; background:transparent; cursor:pointer; border-left:1px solid var(--glass-border);">+</button>
        </div>
        <button onclick="exportCurriculumMap()" style="padding:8px 15px; border-radius:8px; border:none; background:var(--c-accent); color:white; font-weight:600; cursor:pointer;">
          📸 Save
        </button>
        ` : `
        <button onclick="openAddCustomCourseModal()" style="padding:8px 15px; border-radius:8px; border:none; background:var(--c-green); color:white; font-weight:600; cursor:pointer;">
          ➕ เพิ่มวิชา
        </button>
        `}
      </div>
    </div>
    
    ${isMap ? `
    <div style="overflow-x:auto; width:100%; padding-bottom:40px;">
      <div class="curriculum-container" id="curriculumContainer" style="position:relative; width:max-content; min-width:100%; transform-origin: top left; transform: scale(${currentZoom}); transition: transform 0.2s ease;">
        <svg id="curriculumCanvas" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0;"></svg>
        <div style="display:flex; gap:30px; position:relative; z-index:1; padding: 20px;">
          ${CURRICULUM_DATA.map(term => `
            <div class="curr-column" style="width:180px; display:flex; flex-direction:column; gap:20px;">
              <div class="curr-term-header" style="text-align:center; padding-bottom:10px; border-bottom:3px solid var(--glass-border); margin-bottom:10px;">
                <div style="font-weight:800; color:var(--text); font-size:16px;">${term.label}</div>
                <div style="font-size:12px; color:var(--text-muted);">${term.credits} หน่วยกิต</div>
              </div>
              ${term.courses.map(c => {
                const isPlaceholder = !c.code || c.code.includes('xxx');
                let actualCode = c.code;
                let actualName = c.label;
                let actualCr = c.cr;
                
                if (isPlaceholder && state.curriculumMapping && state.curriculumMapping[c.id]) {
                  actualCode = state.curriculumMapping[c.id];
                  if (typeof ALL_COURSES !== 'undefined') {
                    const found = ALL_COURSES.find(ac => ac.code === actualCode);
                    if (found) {
                      actualName = found.nameTh || found.name;
                      actualCr = found.credits;
                    }
                  } else {
                     actualName = "Mapped Course";
                  }
                } else if (!isPlaceholder && typeof ALL_COURSES !== 'undefined') {
                   const found = ALL_COURSES.find(ac => ac.code === actualCode);
                   if (found) actualName = found.nameTh || found.name;
                }
                
                const isPassed = !!actualCode && passedCodes.has(actualCode);
                const isInProg = !!actualCode && inProgCodes.has(actualCode);
                
                let boxClass = 'curr-box';
                if (isPassed) boxClass += ' passed';
                else if (isInProg) boxClass += ' in-progress';
                else if (isPlaceholder && (!state.curriculumMapping || !state.curriculumMapping[c.id])) boxClass += ' empty-placeholder';
                else boxClass += ' pending';

                if (c.type === 'core') boxClass += ' type-core';
                if (c.type === 'major') boxClass += ' type-major';
                if (c.type === 'sci') boxClass += ' type-sci';
                if (c.type === 'gened') boxClass += ' type-gened';

                const displayCode = actualCode || c.label || 'วิชาเลือก';
                
                let onClickStr = '';
                if (isPlaceholder) {
                  onClickStr = `openMapCourseModal('${c.id}', '${c.label}', '${c.code}')`;
                } else if (actualCode) {
                  onClickStr = `showCourseDetailsModal('${actualCode}')`;
                }

                return `
                  <div class="${boxClass}" id="node-${c.id}" data-code="${c.code}" data-actual="${actualCode}"
                       onmouseenter="highlightArrows('${c.id}', '${c.code}')" 
                       onmouseleave="resetArrows()"
                       onclick="${onClickStr}"
                       style="display:flex; flex-direction:column; background:var(--glass-bg); border:2px solid var(--glass-border); border-radius:10px; padding:10px; cursor:pointer; box-shadow:0 4px 6px rgba(0,0,0,0.05); transition:all 0.2s; position:relative; z-index:10;">
                    
                    ${isPlaceholder ? '<div style="position:absolute; top:-8px; right:-8px; background:var(--c-accent); color:white; width:20px; height:20px; border-radius:10px; font-size:10px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.2);">✏️</div>' : ''}
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:5px; margin-bottom:5px;">
                       <div style="font-weight:800; font-family:monospace; font-size:14px; letter-spacing:0.5px;">${displayCode}</div>
                       <div style="font-size:12px; font-weight:700; background:rgba(0,0,0,0.05); padding:2px 6px; border-radius:4px;">${actualCr}</div>
                    </div>
                    <div style="font-size:11px; opacity:0.7; line-height:1.2; text-align:center; min-height:26px; display:flex; align-items:center; justify-content:center; word-break:break-word;">
                       ${actualName || '-'}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    
    <div class="glass-card" style="margin-top:20px;">
      <h3 style="margin-bottom:10px;">คำอธิบายสัญลักษณ์และวิธีใช้งาน</h3>
      <div style="display:flex; gap:20px; flex-wrap:wrap; font-size:13px; margin-bottom:15px;">
        <div style="display:flex; align-items:center; gap:8px;"><div style="width:16px;height:16px;background:var(--c-mint);border-radius:4px;"></div> ผ่านแล้ว</div>
        <div style="display:flex; align-items:center; gap:8px;"><div style="width:16px;height:16px;background:var(--c-sun);border-radius:4px;"></div> กำลังเรียน</div>
        <div style="display:flex; align-items:center; gap:8px;"><div style="width:16px;height:16px;background:var(--glass-bg);border:2px solid var(--glass-border);border-radius:4px;"></div> รอเรียน (บังคับ)</div>
        <div style="display:flex; align-items:center; gap:8px;"><div style="width:16px;height:16px;background:var(--glass-bg);border:2px dashed #94a3b8;border-radius:4px;"></div> รอลงทะเบียน (วิชาเลือก)</div>
        <div style="display:flex; align-items:center; gap:8px;"><svg width="30" height="10"><line x1="0" y1="5" x2="30" y2="5" stroke="#ef4444" stroke-width="2" marker-end="url(#arrowhead)"/></svg> วิชาบังคับก่อน</div>
        <div style="display:flex; align-items:center; gap:8px;"><svg width="30" height="10"><line x1="0" y1="5" x2="30" y2="5" stroke="#ef4444" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrowhead)"/></svg> เรียนพร้อมกัน</div>
      </div>
      <div style="font-size:13px; color:var(--text-muted); background:var(--bg-color); padding:10px; border-radius:8px;">
        💡 <strong>เคล็ดลับ:</strong> กล่องที่มีไอคอน ✏️ มุมขวาบน คือหมวดวิชาเลือก/ศึกษาทั่วไป (EE, FE, W, L, A) <strong>คุณสามารถคลิกที่กล่องเพื่อกำหนดรหัสวิชาที่คุณลงเรียนจริงลงไปได้เลย</strong> เพื่อให้แสดงสถานะเกรดอย่างถูกต้อง
      </div>
    </div>
    ` : `
    <div class="roadmap-wrap">
      ${sections.map(sec => {
        const passed = sec.courses.filter(c => passedCodes.has(c.code));
        const passedCr = passed.reduce((s, c) => s + (c.credits || c.cr || 0), 0);
        const pct = Math.min(100, (passedCr / sec.target * 100)).toFixed(0);
        return `<div class="glass-card roadmap-section">
          <div class="rm-sec-hd">
            <span>${sec.label}</span>
            <span class="rm-pct">${pct}%</span>
          </div>
          <div class="prog-bar-bg sm"><div class="prog-bar-fill" style="width:${pct}%"></div></div>
          <div class="rm-courses">
            ${sec.courses.map(c => {
              const isPassed = state.courses && Object.values(state.courses).flat().some(x => x.code === c.code && ['A','B+','B','C+','C','D+','D','S'].includes(x.grade));
              const boxClass = isPassed ? 'curr-box passed' : 'curr-box pending';
              
              return `
                <div class="${boxClass}" id="node-${c.id || c.code}" style="padding:12px; border-radius:10px; background:var(--glass-bg); border:1px solid var(--glass-border); display:flex; flex-direction:column; gap:4px; position:relative; cursor:pointer;" onclick="showCourseDetailsModal('${c.code}')">
                  ${c.isCustom ? `
                    <div style="position:absolute; top:8px; right:8px; display:flex; gap:5px; z-index:2;">
                      <button class="icon-btn-sm" onclick="event.stopPropagation(); window.openEditCustomCourseModal('${c.code}', '${c.name}', ${c.credits}, '${c.category}')" style="padding:4px; font-size:12px; cursor:pointer;">✏️</button>
                      <button class="icon-btn-sm" onclick="event.stopPropagation(); window.deleteCustomCourse('${c.code}')" style="padding:4px; font-size:12px; color:var(--c-rust); cursor:pointer;">🗑️</button>
                    </div>
                  ` : ''}
                  <div style="font-weight:700; color:var(--text);">${c.code}</div>
                  <div style="font-size:12px; color:var(--text-muted); line-height:1.3; padding-right:${c.isCustom ? '40px' : '0'};">${c.name || c.label || ''}</div>
                  <div style="font-size:11px; opacity:0.6; margin-top:4px;">${c.credits || c.cr || 3} หน่วยกิต</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>
    `}
  </div>
  
  <!-- Map Course Modal -->
  <div class="modal-overlay" id="mapCourseModal" style="display:none;">
    <div class="modal-content" style="max-width:500px;">
      <h2 style="margin-bottom:10px;">เลือกวิชาแทนที่ (<span id="mapModalLabel"></span>)</h2>
      <p style="font-size:13px; color:var(--text-muted); margin-bottom:20px;">
        กรุณากรอกรหัสวิชาที่คุณเรียนผ่าน หรือวางแผนจะเรียน ในหมวดหมู่นี้
      </p>
      <input type="hidden" id="mapModalTargetId">
      
      <div class="form-group">
        <label>ค้นหารหัสวิชา (เช่น 01355113, 01999011)</label>
        <input type="text" id="mapModalSearch" class="form-control" placeholder="พิมพ์รหัสวิชา 8 หลัก..." onkeyup="searchMapCourse()">
        <div id="mapModalResults" style="margin-top:10px; max-height:200px; overflow-y:auto; background:var(--bg-color); border-radius:8px;"></div>
      </div>
      
      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
        <button class="btn btn-secondary" onclick="document.getElementById('mapCourseModal').style.display='none'">ยกเลิก</button>
        <button class="btn btn-danger" onclick="clearMappedCourse()">ล้างข้อมูลวิชานี้ (Clear)</button>
      </div>
    </div>
  </div>

  <!-- Add Custom Course to Roadmap Modal -->
  <div class="modal-overlay" id="addCustomCourseModal" style="display:none;">
    <div class="modal-content" style="max-width:500px;">
      <h2 style="margin-bottom:10px;">เพิ่มวิชาใน Roadmap</h2>
      <p style="font-size:13px; color:var(--text-muted); margin-bottom:20px;">
        เพิ่มรายวิชาที่ไม่มีในระบบ เพื่อให้คำนวณใน Roadmap หมวดวิชาได้ถูกต้อง
      </p>
      
      <input type="hidden" id="addCustomOriginalCode" value="">
      <div class="form-group">
        <label>รหัสวิชา</label>
        <input type="text" id="addCustomCode" class="form-control" placeholder="เช่น 01208xxx">
      </div>
      <div class="form-group">
        <label>ชื่อวิชา</label>
        <input type="text" id="addCustomName" class="form-control" placeholder="ชื่อวิชา (ภาษาไทยหรืออังกฤษ)">
      </div>
      <div class="form-group">
        <label>หน่วยกิต</label>
        <input type="number" id="addCustomCr" class="form-control" value="3" min="1" max="6">
      </div>
      <div class="form-group">
        <label>หมวดวิชา</label>
        <select id="addCustomCategory" class="form-control" style="background:var(--bg-color); color:var(--text); border:1px solid var(--glass-border); padding:10px; border-radius:8px;">
          <option value="ศึกษาทั่วไป">ศึกษาทั่วไป (General)</option>
          <option value="วิทยาศาสตร์">วิทยาศาสตร์ (Science)</option>
          <option value="วิศวกรรม">วิศวกรรม (Engineering)</option>
          <option value="เลือกทางวิศวกรรม">เลือกทางวิศวกรรม (Elective)</option>
        </select>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
        <button class="btn btn-secondary" onclick="document.getElementById('addCustomCourseModal').style.display='none'">ยกเลิก</button>
        <button class="btn btn-primary" onclick="saveCustomCourse()">บันทึกวิชา</button>
      </div>
    </div>
  </div>

  <style>
    .curr-box { position: relative; z-index: 10; }
    .curr-box::before { content: ""; position: absolute; inset: 0; background: var(--bg-color); z-index: -1; border-radius: 8px; }
    .curr-box.passed { background: rgba(34, 197, 94, 0.1) !important; border-color: var(--c-mint) !important; color: var(--c-mint); }
    .curr-box.in-progress { background: rgba(234, 179, 8, 0.1) !important; border-color: var(--c-sun) !important; color: var(--c-sun); }
    .curr-box.empty-placeholder { border-style: dashed !important; border-color: #94a3b8 !important; opacity: 0.8; }
    .curr-box.pending { background: #f8fafc !important; }
    
    .curr-box.type-core { border-left-color: #3b82f6 !important; border-left-width: 6px !important; }
    .curr-box.type-major { border-left-color: #8b5cf6 !important; border-left-width: 6px !important; }
    .curr-box.type-sci { border-left-color: #06b6d4 !important; border-left-width: 6px !important; }
    .curr-box.type-gened { border-left-color: #f59e0b !important; border-left-width: 6px !important; }
    
    .curr-box:hover { transform: translateY(-4px) !important; box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important; border-right-color: var(--c-accent) !important; }
    .curr-box.highlight { box-shadow: 0 0 0 3px var(--c-accent) !important; background: rgba(99, 102, 241, 0.05) !important; }
    
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(5px);
    }
    .modal-content {
      background: var(--bg); border-radius: 12px; padding: 20px;
      width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      border: 1px solid var(--glass-border);
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  `;
}

window.changeCurrZoom = function(delta) {
  currentZoom += delta;
  if (currentZoom < 0.5) currentZoom = 0.5;
  if (currentZoom > 2.0) currentZoom = 2.0;
  
  document.getElementById('currZoomDisplay').innerText = Math.round(currentZoom * 100) + '%';
  document.getElementById('curriculumContainer').style.transform = `scale(${currentZoom})`;
  
  // Re-draw arrows when zooming
  setTimeout(drawCurriculumArrows, 250);
}

function drawCurriculumArrows() {
  const container = document.getElementById('curriculumContainer');
  const svg = document.getElementById('curriculumCanvas');
  if (!container || !svg) return;

  const rectContainer = container.getBoundingClientRect();
  
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

  // Scale factor to adjust points because bounding boxes are scaled but SVG space is inside the scaled container
  const scale = currentZoom;

  CURRICULUM_ARROWS.forEach((arrow) => {
    const fromNodes = Array.from(document.querySelectorAll(`[data-code="${arrow.from}"]`));
    const toNodes = Array.from(document.querySelectorAll(`[data-code="${arrow.to}"]`));

    if (fromNodes.length > 0 && toNodes.length > 0) {
      const fromEl = fromNodes[0];
      const toEl = toNodes[0];

      const r1 = fromEl.getBoundingClientRect();
      const r2 = toEl.getBoundingClientRect();

      // We must divide by currentZoom to get unscaled coordinates inside the SVG
      const cx1 = (r1.left + r1.width / 2 - rectContainer.left) / scale;
      const cy1 = (r1.top + r1.height / 2 - rectContainer.top) / scale;
      const cx2 = (r2.left + r2.width / 2 - rectContainer.left) / scale;
      const cy2 = (r2.top + r2.height / 2 - rectContainer.top) / scale;

      let x1, y1, x2, y2, pathD;

      if (Math.abs(cx1 - cx2) < 50) {
        // Same column
        x1 = cx1; x2 = cx2;
        if (cy1 < cy2) {
           y1 = (r1.bottom - rectContainer.top) / scale;
           y2 = (r2.top - rectContainer.top) / scale;
        } else {
           y1 = (r1.top - rectContainer.top) / scale;
           y2 = (r2.bottom - rectContainer.top) / scale;
        }
        pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
      } else {
        // Different columns
        x1 = (r1.right - rectContainer.left) / scale;
        y1 = cy1;
        x2 = (r2.left - rectContainer.left) / scale;
        y2 = cy2;
        
        if (x2 < x1) {
           // Flow backwards (wrap around)
           pathD = `M ${x1} ${y1} C ${x1+40} ${y1}, ${x2-40} ${y2}, ${x2} ${y2}`;
        } else if (Math.abs(y1 - y2) < 25) {
           // Straight line horizontal
           pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else {
           // S-curve
           const mx = x1 + (x2 - x1) / 2;
           pathD = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
        }
      }

      const dash = arrow.type === 'dashed' ? 'stroke-dasharray="4,4"' : '';
      svgContent += `
        <path id="arrow-${arrow.from}-${arrow.to}" 
              d="${pathD}" 
              fill="none" 
              stroke="#ef4444" 
              stroke-width="2" 
              marker-end="url(#arrowhead)" 
              ${dash} 
              opacity="0.5"
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
      path.setAttribute('stroke-width', '3');
      path.setAttribute('opacity', '1');
      path.setAttribute('marker-end', 'url(#arrowhead-highlight)');
      
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
    path.setAttribute('stroke-width', '2');
    path.setAttribute('opacity', '0.5');
    path.setAttribute('marker-end', 'url(#arrowhead)');
  });
  document.querySelectorAll('.curr-box').forEach(box => {
    box.classList.remove('highlight');
  });
};

// --- MAPPING MODAL ---
window.openMapCourseModal = function(id, label, defaultCode) {
  document.getElementById('mapModalLabel').innerText = label || defaultCode;
  document.getElementById('mapModalTargetId').value = id;
  document.getElementById('mapModalSearch').value = '';
  document.getElementById('mapModalResults').innerHTML = '';
  document.getElementById('mapCourseModal').style.display = 'flex';
  
  setTimeout(() => document.getElementById('mapModalSearch').focus(), 100);
}

window.searchMapCourse = function() {
  const query = document.getElementById('mapModalSearch').value.trim().toLowerCase();
  const resDiv = document.getElementById('mapModalResults');
  if (query.length < 2) {
    resDiv.innerHTML = '';
    return;
  }
  
  if (typeof ALL_COURSES === 'undefined') return;
  
  const matches = ALL_COURSES.filter(c => c.code.toLowerCase().includes(query) || (c.nameTh && c.nameTh.toLowerCase().includes(query))).slice(0, 10);
  
  if (matches.length === 0) {
    resDiv.innerHTML = '<div style="padding:10px; color:var(--text-muted);">ไม่พบวิชาที่ค้นหา</div>';
    return;
  }
  
  resDiv.innerHTML = matches.map(c => `
    <div style="padding:10px; border-bottom:1px solid var(--glass-border); cursor:pointer;" class="hover-bg" onclick="selectMapCourse('${c.code}')">
      <div style="font-weight:700; color:var(--c-accent);">${c.code}</div>
      <div style="font-size:12px;">${c.nameTh || c.name}</div>
    </div>
  `).join('');
}

window.selectMapCourse = function(code) {
  const id = document.getElementById('mapModalTargetId').value;
  state.curriculumMapping[id] = code;
  saveCurriculumMapping();
  document.getElementById('mapCourseModal').style.display = 'none';
  render(); // Re-render the whole page
}

window.clearMappedCourse = function() {
  const id = document.getElementById('mapModalTargetId').value;
  delete state.curriculumMapping[id];
  saveCurriculumMapping();
  document.getElementById('mapCourseModal').style.display = 'none';
  render();
}

// --- EXPORT TO IMAGE ---
window.exportCurriculumMap = async function() {
  if (typeof html2canvas === 'undefined') {
    showToast("กำลังโหลดโมดูลแคปเจอร์ภาพ...", "wait");
    return;
  }
  
  const container = document.getElementById('curriculumContainer');
  const origTransform = container.style.transform;
  
  // Temporarily reset scale for clean export
  container.style.transform = 'scale(1)';
  showToast("กำลังบันทึกแผนผังเป็นรูปภาพ...", "wait");
  
  // Wait a bit for DOM to update
  await new Promise(r => setTimeout(r, 200));
  drawCurriculumArrows();
  
  try {
    const canvas = await html2canvas(container, {
      scale: 2, // High resolution
      backgroundColor: '#f8fafc',
      logging: false
    });
    
    // Restore scale
    container.style.transform = origTransform;
    drawCurriculumArrows();
    
    // Download
    const link = document.createElement('a');
    link.download = `curriculum_map_${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast("บันทึกรูปภาพสำเร็จ!", "ok");
  } catch(e) {
    console.error(e);
    container.style.transform = origTransform;
    showToast("เกิดข้อผิดพลาดในการแคปเจอร์", "err");
  }
}


// Custom Roadmap Courses
window.openAddCustomCourseModal = function() {
  document.getElementById('addCustomOriginalCode').value = '';
  document.getElementById('addCustomCode').value = '';
  document.getElementById('addCustomName').value = '';
  document.getElementById('addCustomCr').value = '3';
  document.getElementById('addCustomCourseModal').style.display = 'flex';
};

window.openEditCustomCourseModal = function(code, name, cr, category) {
  document.getElementById('addCustomOriginalCode').value = code;
  document.getElementById('addCustomCode').value = code;
  document.getElementById('addCustomName').value = name;
  document.getElementById('addCustomCr').value = cr;
  document.getElementById('addCustomCategory').value = category;
  document.getElementById('addCustomCourseModal').style.display = 'flex';
};

window.deleteCustomCourse = function(code) {
  if (confirm('คุณต้องการลบวิชานี้ออกจาก Roadmap ใช่หรือไม่?')) {
    if (state.customRoadmapCourses) {
      state.customRoadmapCourses = state.customRoadmapCourses.filter(c => c.code !== code);
      localStorage.setItem('mgr_state', JSON.stringify(state));
      if (state.user && typeof syncStateToCloud === 'function') syncStateToCloud();
      showToast('ลบวิชาสำเร็จ', 'ok');
      render();
    }
  }
};

window.saveCustomCourse = function() {
  const originalCode = document.getElementById('addCustomOriginalCode').value;
  const code = document.getElementById('addCustomCode').value.trim();
  const name = document.getElementById('addCustomName').value.trim();
  const cr = parseInt(document.getElementById('addCustomCr').value);
  const category = document.getElementById('addCustomCategory').value;

  if (!code || !name) {
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    return;
  }

  if (!state.customRoadmapCourses) {
    state.customRoadmapCourses = [];
  }

  if (originalCode) {
    const idx = state.customRoadmapCourses.findIndex(c => c.code === originalCode);
    if (idx !== -1) {
      state.customRoadmapCourses[idx] = { code, name, cr, category };
    }
  } else {
    // Check for duplicates
    if (state.customRoadmapCourses.find(c => c.code === code)) {
      showToast('รหัสวิชานี้มีอยู่แล้ว', 'error');
      return;
    }
    state.customRoadmapCourses.push({ code, name, cr, category });
  }
  
  // Save state locally
  localStorage.setItem('mgr_state', JSON.stringify(state));
  if (state.user && typeof syncStateToCloud === 'function') syncStateToCloud();
  
  document.getElementById('addCustomCourseModal').style.display = 'none';
  showToast('บันทึกวิชาใน Roadmap เรียบร้อย', 'ok');
  render();
};
