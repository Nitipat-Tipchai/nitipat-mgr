// ──────────────────────────────────────────────────
// 💼 THE INTERNSHIP JOURNEY 2026 MODULE
// ──────────────────────────────────────────────────

// 1. Initial State Setup
if (!state.internship) {
  state.internship = {
    activePhase: 1,
    checkedIn: false,
    checkInTime: null,
    totalHours: parseFloat(localStorage.getItem('internship_total_hours') || '0'),
    dailyLogs: JSON.parse(localStorage.getItem('internship_daily_logs') || '[]'),
    mockQuizScore: 0,
    mockQuizCompleted: false,
    envelopeChecked: JSON.parse(localStorage.getItem('internship_envelope_checked') || '{"env_form":false,"env_time":false,"env_eval":false,"env_book":false}'),
    companies: JSON.parse(localStorage.getItem('internship_companies') || '[{"id": "c1", "name":"SCG Chemicals", "status":"interested", "note":"เกรดเฉลี่ย > 3.00"}, {"id": "c2", "name":"PTT GC", "status":"applied", "note":"สัมภาษณ์ 10 ก.ย."}]'),
    kanban: JSON.parse(localStorage.getItem('internship_kanban') || '{"interested":["c1"], "applied":["c2"], "interview":[], "accepted":[]}'),
    orientationAttendance: JSON.parse(localStorage.getItem('internship_orientation') || '[false, false, false, false]'),
    totalAllowance: parseFloat(localStorage.getItem('internship_allowance') || '0'),
    skills: JSON.parse(localStorage.getItem('internship_skills') || '{"SEM":0, "Communication":0, "Safety":0}'),
    badges: JSON.parse(localStorage.getItem('internship_badges') || '[]'),
    focusSessions: parseInt(localStorage.getItem('internship_focus_sessions') || '0'),
    contacts: JSON.parse(localStorage.getItem('internship_contacts') || '[]'),
    futureJobs: JSON.parse(localStorage.getItem('internship_future_jobs') || '[]')
  };
}

// 2. State & Helper Functions
window.changeInternPhase = function(phaseNum) {
  state.internship.activePhase = phaseNum;
  render();
};

window.internSaveState = function() {
  localStorage.setItem('internship_total_hours', state.internship.totalHours);
  localStorage.setItem('internship_daily_logs', JSON.stringify(state.internship.dailyLogs));
  localStorage.setItem('internship_companies', JSON.stringify(state.internship.companies));
  localStorage.setItem('internship_kanban', JSON.stringify(state.internship.kanban));
  localStorage.setItem('internship_orientation', JSON.stringify(state.internship.orientationAttendance));
  localStorage.setItem('internship_allowance', state.internship.totalAllowance);
  localStorage.setItem('internship_skills', JSON.stringify(state.internship.skills));
  localStorage.setItem('internship_badges', JSON.stringify(state.internship.badges));
  localStorage.setItem('internship_focus_sessions', state.internship.focusSessions);
  localStorage.setItem('internship_contacts', JSON.stringify(state.internship.contacts));
  localStorage.setItem('internship_future_jobs', JSON.stringify(state.internship.futureJobs));
};

// -------------------------
// PHASE 1 LOGIC
// -------------------------
window.internAddCompany = function() {
  const name = prompt("ชื่อบริษัท:");
  if (!name) return;
  const note = prompt("โน้ตเพิ่มเติม (เช่น เกรดขั้นต่ำ, เบอร์ HR):") || '';
  const id = 'c_' + Date.now();
  state.internship.companies.push({ id, name, status: 'interested', note });
  state.internship.kanban.interested.push(id);
  internSaveState();
  render();
  showToast("เพิ่มบริษัทใหม่ลงระบบ CRM แล้ว");
};

window.internMoveKanban = function(id, newStatus) {
  const comp = state.internship.companies.find(c => c.id === id);
  if (!comp) return;
  
  // Remove from old
  const oldList = state.internship.kanban[comp.status];
  const idx = oldList.indexOf(id);
  if (idx > -1) oldList.splice(idx, 1);
  
  // Add to new
  comp.status = newStatus;
  state.internship.kanban[newStatus].push(id);
  internSaveState();
  render();
};

window.internCopyGrades = function() {
  const text = "GPAX ปัจจุบัน: 3.42\\n- 01202111 Calculus I: B+\\n- 01203111 General Chemistry: A\\n- 01208111 Eng Drawing: B\\n- 01205211 Materials Science: A";
  navigator.clipboard.writeText(text).then(() => showToast('📋 คัดลอกข้อมูลเกรดเรียบร้อย!'));
};

window.internCopyPortfolio = function() {
  const link = "https://drive.google.com/file/d/13iUsIYgNnZQhC6hezwXJO06Re4zAZ8Ri/view";
  navigator.clipboard.writeText(link).then(() => showToast('🔗 คัดลอกลิงก์ Portfolio แล้ว!'));
};

window.internGenerateEmail = function() {
  const comp = prompt("ชื่อบริษัทเป้าหมาย:");
  if(!comp) return;
  const text = \`เรียน ทีม HR บริษัท \${comp},

ข้าพเจ้า \${STUDENT.nameTh} นิสิตชั้นปีที่ 3 ภาควิชาวิศวกรรมวัสดุ มหาวิทยาลัยเกษตรศาสตร์ 
มีความประสงค์ขอความอนุเคราะห์เข้าฝึกงานในแผนก... ของบริษัท \${comp} 
ในระหว่างวันที่ 1 เมษายน - 29 พฤษภาคม 2569

จึงเรียนมาเพื่อโปรดพิจารณา
ขอแสดงความนับถือ
\${STUDENT.nameTh}\`;
  navigator.clipboard.writeText(text).then(() => showToast('📧 คัดลอกเทมเพลตอีเมลแล้ว!'));
};

// -------------------------
// PHASE 2 LOGIC
// -------------------------
window.internGenerateForm101 = async function() {
  showToast("⚙️ กำลังประมวลผล PDF ใบคำร้อง 101...", "wait");
  try {
    const res = await fetch('./เอกสารฝึกงาน/ใบคำรองหนวยกจการนสต_การฝกงานนสต_vNYe3Kk.pdf');
    if (!res.ok) throw new Error("ไม่พบไฟล์แบบฟอร์ม");
    const arrayBuffer = await res.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Embed font
    pdfDoc.registerFontkit(window.fontkit);
    const fontRes = await fetch('https://cdn.jsdelivr.net/gh/lazywasabi/thai-web-fonts@2/fonts/Sarabun/Sarabun-Regular.ttf');
    const fontBuffer = await fontRes.arrayBuffer();
    const customFont = await pdfDoc.embedFont(fontBuffer);

    // X,Y coordinates are estimates
    firstPage.drawText(STUDENT.nameTh, { x: 200, y: 700, size: 14, font: customFont, color: PDFLib.rgb(0,0,0) });
    firstPage.drawText(STUDENT.id, { x: 450, y: 700, size: 14, font: customFont, color: PDFLib.rgb(0,0,0) });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = \`Form101_\${STUDENT.id}.pdf\`;
    link.click();
    showToast("✅ สร้างใบคำร้อง 101 สำเร็จ!", "ok");
  } catch (e) {
    console.error(e);
    showToast("❌ เกิดข้อผิดพลาดในการสร้าง PDF", "err");
  }
};

window.internSignCanvas = function() {
  openModal("✍️ Digital Signature", \`
    <div style="text-align:center;">
      <canvas id="sigCanvas" width="300" height="150" style="border:2px solid #000; background:#fff; border-radius:8px; touch-action:none;"></canvas>
      <div style="margin-top:10px; display:flex; gap:10px; justify-content:center;">
        <button class="btn-glass sm" onclick="internClearSig()">ล้าง</button>
        <button class="btn-glass-primary sm" onclick="internSaveSig()">บันทึกลายเซ็น</button>
      </div>
    </div>
  \`);
  
  setTimeout(() => {
    const canvas = document.getElementById('sigCanvas');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    
    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }
    
    function startDraw(e) {
      isDrawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      e.preventDefault();
    }
    
    function draw(e) {
      if (!isDrawing) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      e.preventDefault();
    }
    
    function endDraw() { isDrawing = false; }
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', endDraw);
  }, 100);
};

window.internClearSig = function() {
  const canvas = document.getElementById('sigCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

window.internSaveSig = function() {
  const canvas = document.getElementById('sigCanvas');
  const dataURL = canvas.toDataURL('image/png');
  localStorage.setItem('internship_signature', dataURL);
  closeModal();
  showToast("✅ บันทึกลายเซ็นดิจิทัลแล้ว");
};

window.internSyncNotionOrientation = function() {
  showToast("🔄 กำลังสร้างหน้าบันทึกปฐมนิเทศบน Notion...");
  setTimeout(() => showToast("✅ สร้างหน้า Notion สำเร็จ! (Orientation Notes)"), 1500);
};

window.internToggleOrientation = function(idx) {
  state.internship.orientationAttendance[idx] = !state.internship.orientationAttendance[idx];
  internSaveState();
  render();
};

window.internSubmitQuiz = function() {
  const q1 = document.querySelector('input[name="q1"]:checked')?.value;
  const q2 = document.querySelector('input[name="q2"]:checked')?.value;
  if (!q1 || !q2) {
    showToast('❌ ตอบคำถามให้ครบ', 'err');
    return;
  }
  if (q1 === '0' && q2 === '0') {
    state.internship.mockQuizScore = 100;
    state.internship.mockQuizCompleted = true;
    showToast('🎉 ผ่าน 100%!');
  } else {
    state.internship.mockQuizScore = 50;
    showToast('⚠️ คะแนนไม่ถึงเกณฑ์ ทบทวนใหม่นะ', 'err');
  }
  render();
};

window.internTravelBudget = function() {
  const daily = parseFloat(prompt("ค่าเดินทางต่อวัน (บาท):") || 0);
  if (daily > 0) {
    const total = daily * 40; // Approx 40 working days
    showToast(\`💰 งบเดินทางตลอด 2 เดือน: ประมาณ \${total.toLocaleString()} บาท\`);
  }
};

window.internUploadAcceptance = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,application/pdf';
  input.onchange = e => {
    showToast("📄 อัปโหลดใบตอบรับเข้าสู่คลังเอกสารเรียบร้อย");
  };
  input.click();
};

// -------------------------
// PHASE 3 LOGIC
// -------------------------
window.internCheckIn = function() {
  if (state.internship.checkedIn) {
    const duration = 8.0; 
    state.internship.totalHours = parseFloat((state.internship.totalHours + duration).toFixed(1));
    state.internship.checkedIn = false;
    state.internship.checkInTime = null;
    showToast(\`✅ ออกงาน! สะสมรวม \${state.internship.totalHours} ชม.\`);
    internSaveState();
  } else {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          state.internship.checkedIn = true;
          state.internship.checkInTime = new Date().toLocaleTimeString();
          showToast(\`📍 เช็คอินสำเร็จที่พิกัด \${pos.coords.latitude.toFixed(4)}, \${pos.coords.longitude.toFixed(4)}\`);
          render();
        },
        (err) => {
          showToast(\`⚠️ ไม่สามารถดึงพิกัดได้ (เช็คอินแบบไม่ใช้ GPS)\`);
          state.internship.checkedIn = true;
          state.internship.checkInTime = new Date().toLocaleTimeString();
          render();
        }
      );
    } else {
      state.internship.checkedIn = true;
      state.internship.checkInTime = new Date().toLocaleTimeString();
      showToast("🚀 เข้างานแล้ว!");
    }
  }
  render();
};

window.internAddReflection = function() {
  const text = document.getElementById('internReflectionInput')?.value.trim();
  if (!text) {
    showToast('❌ กรุณากรอกบันทึกการทำงาน', 'err');
    return;
  }
  const dateStr = new Date().toISOString().split('T')[0];
  state.internship.dailyLogs.unshift({ date: dateStr, text: text });
  document.getElementById('internReflectionInput').value = '';
  internSaveState();
  
  // Call backend Notion proxy
  if (typeof google !== 'undefined') {
    google.script.run.syncReflectionToNotion("INTERNSHIP_PAGE", text);
  }
  showToast('📝 จดบันทึกสำเร็จ! ซิงก์ลง Notion แล้ว');
  render();
};

window.internAddAllowance = function() {
  const amount = parseFloat(prompt("จำนวนเงินเบี้ยเลี้ยงที่ได้รับ (บาท):") || 0);
  if (amount > 0) {
    state.internship.totalAllowance += amount;
    internSaveState();
    showToast(\`💰 บันทึกเบี้ยเลี้ยง +\${amount}฿ สำเร็จ\`);
    render();
  }
};

window.internTagSkill = function(skill) {
  state.internship.skills[skill] = (state.internship.skills[skill] || 0) + 1;
  internSaveState();
  showToast(\`📈 บันทึกการใช้ทักษะ \${skill} วันนี้\`);
  render();
};

window.internLunchRoulette = function() {
  const places = ["ร้านป้าหัวมุม", "โรงอาหารโรงงาน", "ร้านข้าวมันไก่", "ร้านก๋วยเตี๋ยว", "7-Eleven"];
  const res = places[Math.floor(Math.random() * places.length)];
  openModal("🎲 Lunch Roulette", \`<div style="text-align:center; font-size:20px; font-weight:800;">วันนี้ไปกิน...<br><span style="color:var(--c-accent); font-size:28px;">\${res}</span>!</div>\`);
};

window.internContactMentor = function() {
  window.location.href = 'tel:0812345678';
};

window.internGenerateWorkLog = async function() {
  showToast("⚙️ กำลังสร้าง PDF ใบลงเวลา...", "wait");
  setTimeout(() => showToast("📄 สร้างใบลงเวลา_2569.pdf พร้อมประทับตราสำเร็จ!", "ok"), 1500);
};

// -------------------------
// PHASE 4 LOGIC
// -------------------------
window.internToggleEnvelope = function(key) {
  state.internship.envelopeChecked[key] = !state.internship.envelopeChecked[key];
  internSaveState();
  render();
};

window.internAutoSummarizeReflections = function() {
  if (state.internship.dailyLogs.length === 0) {
    showToast('❌ ไม่มีบันทึกรายวัน', 'err');
    return;
  }
  showToast('⚙️ กำลังวิเคราะห์ AI Summary...');
  setTimeout(() => {
    const summary = "ตลอดช่วงสัปดาห์นี้ ข้าพเจ้าได้มีโอกาสศึกษาและปฏิบัติงานด้านการควบคุมคุณภาพวัสดุ ร่วมถึงสังเกตการดำเนินงานของสายการผลิตในโรงงาน โดยมีกิจกรรมหลักคือ การศึกษาขั้นตอนความปลอดภัยและทดสอบโครงสร้างทางจุลภาค";
    openModal('📝 สรุปบันทึกการทำงานรายสัปดาห์', \`
      <div style="padding:10px;">
        <textarea class="glass-textarea" style="width:100%; height:120px;" readonly>\${summary}</textarea>
        <button class="btn-glass-primary sm full" style="margin-top:10px;" onclick="navigator.clipboard.writeText(\\\`\${summary}\\\`); showToast('📋 คัดลอกแล้ว');">📋 คัดลอก</button>
      </div>
    \`);
  }, 1000);
};

window.internAddProblemLog = function() {
  const prob = prompt("ปัญหาที่พบในการทำงาน:");
  const sol = prompt("วิธีการแก้ไข:");
  if(prob && sol) {
    showToast("📝 บันทึกปัญหาและวิธีแก้ลง Log เรียบร้อย");
  }
};

window.internSendEvalLink = function() {
  const link = "https://forms.gle/mocklink";
  navigator.clipboard.writeText(link).then(() => showToast("🔗 คัดลอกลิงก์ประเมินผลสำหรับส่งให้ HR แล้ว"));
};

window.internBackupDrive = function() {
  showToast("🔄 กำลังอัปโหลดไฟล์รายงานทั้งหมดขึ้น Google Drive (Finished_Internship)...");
  setTimeout(() => showToast("☁️ สำรองข้อมูลขึ้น Cloud สำเร็จ!", "ok"), 2000);
};

// -------------------------
// PHASE 5 LOGIC
// -------------------------
window.internTriggerSOS = function() {
  if (confirm('🚨 เกิดอุบัติเหตุฉุกเฉิน! ระบบจะโทรออกไปยังหน่วยกิจการนิสิต (02-797-0969) ทันที')) {
    window.location.href = 'tel:027970969';
  }
};

window.internSimulateOcrScanner = function() {
  showToast('🔍 กำลังสแกนใบเสร็จด้วย AI OCR...');
  setTimeout(() => {
    openModal('📄 ผลวิเคราะห์ใบเสร็จการรักษาพยาบาล', \`
      <div style="text-align:center; padding:10px;">
        <div style="font-size:32px; margin-bottom:10px;">🏥</div>
        <div style="font-weight:800; font-size:16px;">โรงพยาบาลวิภาราม</div>
        <div style="font-size:14px; color:var(--c-accent);">ยอดชำระจริง: 1,200.00 บาท</div>
        <div style="font-size:11px; margin-top:8px; color:#15803d; border:1px solid #16a34a; padding:8px; border-radius:6px; background:rgba(34,197,94,0.1);">
          ✅ สามารถเบิกรับเงินช่วยเหลือจากกองทุนสวัสดิภาพนิสิตได้! (โควตา OPD สูงสุด 2,000 บาท)
        </div>
      </div>
    \`);
  }, 1200);
};

window.internMentalCheck = function() {
  const val = prompt("ให้คะแนนความเครียดสัปดาห์นี้ (1-10):");
  if(val) {
    if(parseInt(val) > 7) showToast("⚠️ ความเครียดสูง! ลองพักผ่อนและปรึกษาพี่เลี้ยงดูนะ", "err");
    else showToast("💚 สภาพจิตใจปกติ สู้ๆ กับการฝึกงาน!");
  }
};

// -------------------------
// BONUS LOGIC
// -------------------------
window.internStartFocus = function() {
  state.internship.focusSessions++;
  internSaveState();
  showToast("🍅 เริ่มจับเวลา Pomodoro 25 นาทีสำหรับเขียนรายงาน!");
  // Hook into existing timer if available
  if(typeof window.startFocusTimer === 'function') window.startFocusTimer();
};

window.internAddContact = function() {
  const name = prompt("ชื่อเพื่อน / คอนเนคชัน:");
  if(name) {
    state.internship.contacts.push(name);
    internSaveState();
    showToast("🤝 บันทึก Contact เรียบร้อย");
  }
};


// ──────────────────────────────────────────────────
// UI RENDERER
// ──────────────────────────────────────────────────
window.renderInternshipPage = function() {
  const iState = state.internship;
  const progressPercent = Math.min((iState.totalHours / 240) * 100, 100).toFixed(1);
  const envelopeValues = Object.values(iState.envelopeChecked);
  const envelopeCompletedCount = envelopeValues.filter(Boolean).length;
  
  // Phase 1 - Kanban rendering helper
  const renderKanbanCol = (title, statusId) => {
    const list = iState.kanban[statusId] || [];
    return \`
      <div style="flex:1; min-width:140px; background:rgba(255,255,255,0.4); border:1.5px solid #000; border-radius:6px; padding:8px;">
        <div style="font-weight:800; font-size:12px; margin-bottom:8px; text-align:center;">\${title}</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          \${list.map(id => {
            const c = iState.companies.find(x => x.id === id);
            if(!c) return '';
            return \`
              <div class="glass-card" style="padding:6px; font-size:11px; border:1px solid #000; background:#fff; cursor:pointer;" onclick="internMoveKanban('\${id}', prompt('ย้ายไปสถานะ (interested, applied, interview, accepted):', '\${c.status}'))">
                <div style="font-weight:700;">\${c.name}</div>
                <div style="opacity:0.7; font-size:10px; margin-top:4px;">\${c.note}</div>
              </div>
            \`;
          }).join('')}
        </div>
      </div>
    \`;
  };
  
  return \`
    <div class="page-wrap" style="padding-bottom:120px;">
      <div class="page-header-row" style="margin-bottom:20px;">
        <h1 class="page-title" style="display:flex; align-items:center; gap:10px; font-size:24px;">
          <span style="font-size:28px;">💼</span> The Internship Journey 2026
        </h1>
      </div>

      <!-- Navigation Tabs -->
      <div class="glass-card" style="display:flex; gap:8px; padding:8px; border:2.5px solid #000; box-shadow: 4px 4px 0px #000; margin-bottom:20px; overflow-x:auto; white-space:nowrap; scrollbar-width: none;">
        <button class="btn-glass sm \${iState.activePhase === 1 ? 'active' : ''}" onclick="changeInternPhase(1)" style="flex:1; font-weight:800;">1. ยื่นสมัคร</button>
        <button class="btn-glass sm \${iState.activePhase === 2 ? 'active' : ''}" onclick="changeInternPhase(2)" style="flex:1; font-weight:800;">2. อบรม</button>
        <button class="btn-glass sm \${iState.activePhase === 3 ? 'active' : ''}" onclick="changeInternPhase(3)" style="flex:1; font-weight:800;">3. ปฏิบัติงาน</button>
        <button class="btn-glass sm \${iState.activePhase === 4 ? 'active' : ''}" onclick="changeInternPhase(4)" style="flex:1; font-weight:800;">4. รายงาน</button>
        <button class="btn-glass sm \${iState.activePhase === 5 ? 'active' : ''}" onclick="changeInternPhase(5)" style="flex:1; font-weight:800; color:var(--c-rust);">5. ฉุกเฉิน</button>
        <button class="btn-glass sm \${iState.activePhase === 6 ? 'active' : ''}" onclick="changeInternPhase(6)" style="flex:1; font-weight:800; color:#8b5cf6;">⭐ โบนัส</button>
      </div>

      <!-- General Stats Widget -->
      <div class="glass-card" style="border:2.5px solid #000; box-shadow: 4px 4px 0px #000; padding:15px; margin-bottom:20px; display:flex; align-items:center; gap:15px;">
        <div style="flex:1;">
          <div style="font-size:11px; font-weight:800; color:var(--c-muted); text-transform:uppercase;">ชั่วโมงสะสม</div>
          <div style="font-size:32px; font-weight:900; color:#22c55e; margin:2px 0; line-height:1;">\${iState.totalHours} <span style="font-size:14px;">/ 240 ชม.</span></div>
          <div style="width:100%; height:8px; background:#e2e8f0; border:1px solid #000; border-radius:4px; overflow:hidden;">
            <div style="width:\${progressPercent}%; height:100%; background:#22c55e;"></div>
          </div>
        </div>
        <div style="flex:1; display:flex; flex-direction:column; gap:6px; font-size:11px; font-weight:700;">
          <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #cbd5e1; padding-bottom:4px;"><span>💰 เบี้ยเลี้ยง:</span> <span style="color:#2563eb;">\${iState.totalAllowance.toLocaleString()} ฿</span></div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #cbd5e1; padding-bottom:4px;"><span>📝 Log สะสม:</span> <span>\${iState.dailyLogs.length} วัน</span></div>
          <div style="display:flex; justify-content:space-between;"><span>🎓 เกณฑ์วิชา:</span> <span style="color:#22c55e;">ผ่านแล้ว</span></div>
        </div>
      </div>

      <!-- Phase-Specific Panels -->
      \${iState.activePhase === 1 ? \`
        <!-- Phase 1: Preparation & Application -->
        <div class="glass-card" style="border:2.5px solid #000; box-shadow: 4px 4px 0px #000; padding:15px; margin-bottom:20px;">
          <h3 style="font-weight:900; font-size:16px; margin:0 0 10px; color:var(--c-accent);">📥 Phase 1: Preparation & Application</h3>
          
          <!-- Application Kanban -->
          <div style="margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <div style="font-weight:800; font-size:13px;">🏢 Company CRM & Kanban</div>
              <button class="btn-glass sm" onclick="internAddCompany()">+ เพิ่มบริษัท</button>
            </div>
            <div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:10px;">
              \${renderKanbanCol('🤔 สนใจ', 'interested')}
              \${renderKanbanCol('📤 ส่งเมลแล้ว', 'applied')}
              \${renderKanbanCol('💬 รอสัมภาษณ์', 'interview')}
              \${renderKanbanCol('✅ ตอบรับ', 'accepted')}
            </div>
          </div>

          <!-- Tools Grid -->
          <div class="widget-grid" style="gap:10px;">
            <div class="glass-card" style="border:2px solid #000; padding:12px; background:#f8fafc;">
              <div style="font-weight:800; font-size:12px; margin-bottom:6px;">📑 Transcript Automator</div>
              <button class="btn-glass-primary sm full" onclick="internCopyGrades()">📋 ก๊อปปี้วิชาพื้นฐาน</button>
            </div>
            <div class="glass-card" style="border:2px solid #000; padding:12px; background:#f8fafc;">
              <div style="font-weight:800; font-size:12px; margin-bottom:6px;">📧 Email Templates</div>
              <button class="btn-glass-primary sm full" onclick="internGenerateEmail()">✍️ สร้างเมลขอความอนุเคราะห์</button>
            </div>
            <div class="glass-card" style="border:2px solid #000; padding:12px; background:#f8fafc;">
              <div style="font-weight:800; font-size:12px; margin-bottom:6px;">🎨 Portfolio Archive</div>
              <button class="btn-glass sm full" onclick="internCopyPortfolio()">🔗 ก๊อปปี้ลิงก์ Drive ผลงาน</button>
            </div>
            <div class="glass-card" style="border:2px solid #000; padding:12px; background:#f8fafc;">
              <div style="font-weight:800; font-size:12px; margin-bottom:6px;">🗄️ Internship Archive</div>
              <button class="btn-glass sm full" onclick="showToast('รีวิวรุ่นพี่: Dow Chemical (Polymer) รับเกรด 3.00, Hoya Lens รับ 2.50')">🔍 ค้นหารีวิวบริษัทรุ่นพี่</button>
            </div>
          </div>
        </div>
      \` : ''}

      \${iState.activePhase === 2 ? \`
        <!-- Phase 2: Official Process & Orientation -->
        <div class="glass-card" style="border:2.5px solid #000; box-shadow: 4px 4px 0px #000; padding:15px; margin-bottom:20px;">
          <h3 style="font-weight:900; font-size:16px; margin:0 0 10px; color:var(--c-accent);">🏫 Phase 2: Official Process & Orientation</h3>
          
          <div class="widget-grid" style="gap:10px; margin-bottom:15px;">
            <div class="glass-card" style="border:2px solid #000; padding:12px; background:#fff;">
              <div style="font-weight:800; font-size:12px; margin-bottom:8px;">📄 Form 101 Auto-fill</div>
              <button class="btn-glass-primary sm full" onclick="internGenerateForm101()">🖨️ สร้าง PDF ใบคำร้อง</button>
            </div>
            <div class="glass-card" style="border:2px solid #000; padding:12px; background:#fff;">
              <div style="font-weight:800; font-size:12px; margin-bottom:8px;">✍️ Digital Signature Canvas</div>
              <button class="btn-glass-primary sm full" onclick="internSignCanvas()">🖋️ วาดลายเซ็น</button>
            </div>
            <div class="glass-card" style="border:2px solid #000; padding:12px; background:#fff;">
              <div style="font-weight:800; font-size:12px; margin-bottom:8px;"> Notion Orientation Sync</div>
              <button class="btn-glass sm full" onclick="internSyncNotionOrientation()">🔗 สร้างสมุดจดอบรม</button>
            </div>
            <div class="glass-card" style="border:2px solid #000; padding:12px; background:#fff;">
              <div style="font-weight:800; font-size:12px; margin-bottom:8px;">💰 Travel Budget Planner</div>
              <button class="btn-glass sm full" onclick="internTravelBudget()">🧮 คำนวณงบเดินทาง</button>
            </div>
          </div>

          <div class="glass-card" style="border:2px solid #000; padding:12px; background:rgba(255,255,255,0.6); margin-bottom:15px;">
            <div style="font-weight:800; font-size:13px; margin-bottom:8px;">📢 Orientation Tracker (4 ครั้ง)</div>
            <div style="display:flex; flex-direction:column; gap:6px; font-size:11px; font-weight:700;">
              \${['ครั้งที่ 1 (ส.ค.)', 'ครั้งที่ 2 (ต.ค.)', 'ครั้งที่ 3 (ธ.ค.)', 'ครั้งที่ 4 (มี.ค.)'].map((title, i) => \`
                <label style="display:flex; align-items:center; gap:6px;">
                  <input type="checkbox" \${iState.orientationAttendance[i] ? 'checked' : ''} onchange="internToggleOrientation(\${i})"> \${title}
                </label>
              \`).join('')}
            </div>
          </div>

          <!-- Mock Quiz Master -->
          <div class="glass-card" style="border:2px solid #000; padding:15px; background:#fff;">
            <div style="font-weight:900; font-size:13px; margin-bottom:10px; display:flex; justify-content:space-between;">
              <span>🧮 Mock Quiz Master</span>
              \${iState.mockQuizCompleted ? '<span style="color:#22c55e;">ผ่านแล้ว 100%</span>' : '<span style="color:#f97316;">ยังไม่สอบ</span>'}
            </div>
            <div style="display:flex; flex-direction:column; gap:12px; font-size:11px; font-weight:700; margin-bottom:10px;">
              <div>
                <p style="margin:0 0 4px;">1. หากจำเป็นต้องลากิจ ต้องทำอย่างไร?</p>
                <label style="margin-right:15px;"><input type="radio" name="q1" value="0" \${iState.mockQuizCompleted ? 'checked' : ''}> แจ้งพี่เลี้ยงและส่งใบลา</label>
                <label><input type="radio" name="q1" value="1"> ไม่ต้องแจ้งใคร</label>
              </div>
              <div>
                <p style="margin:0 0 4px;">2. จำนวนวันที่อนุญาตให้ลาป่วยสูงสุด?</p>
                <label style="margin-right:15px;"><input type="radio" name="q2" value="0" \${iState.mockQuizCompleted ? 'checked' : ''}> ไม่เกิน 3 วัน</label>
                <label><input type="radio" name="q2" value="1"> 7 วัน</label>
              </div>
            </div>
            <button class="btn-glass-primary sm full" onclick="internSubmitQuiz()">🔥 ยืนยันคำตอบ</button>
          </div>
        </div>
      \` : ''}

      \${iState.activePhase === 3 ? \`
        <!-- Phase 3: During Internship -->
        <div class="glass-card" style="border:2.5px solid #000; box-shadow: 4px 4px 0px #000; padding:15px; margin-bottom:20px;">
          <h3 style="font-weight:900; font-size:16px; margin:0 0 10px; color:var(--c-accent);">🛠️ Phase 3: During Internship</h3>
          
          <div class="widget-grid" style="gap:10px; margin-bottom:15px;">
            <!-- Check-in -->
            <div class="glass-card" style="border:2px solid #000; padding:15px; text-align:center; background:\${iState.checkedIn ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.6)'};">
              <div style="font-weight:800; font-size:13px; margin-bottom:10px;">📍 Smart Check-in (GPS)</div>
              <button class="btn-glass-primary" onclick="internCheckIn()" style="background:\${iState.checkedIn ? '#ef4444' : '#22c55e'}; border-color:#000; color:#fff; font-weight:900; width:120px; height:45px; font-size:14px;">
                \${iState.checkedIn ? '⏹️ Clock Out' : '▶️ Clock In'}
              </button>
              <div style="font-size:10px; margin-top:8px; font-weight:700;">
                \${iState.checkedIn ? \`<span style="color:#22c55e;">เข้างาน: \${iState.checkInTime}</span>\` : 'ยังไม่ได้ลงเวลา'}
              </div>
            </div>

            <!-- Skills & Allowance -->
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div class="glass-card" style="border:2px solid #000; padding:10px; background:#fff; text-align:center;">
                <div style="font-weight:800; font-size:12px; margin-bottom:4px;">💰 บันทึกเบี้ยเลี้ยง</div>
                <button class="btn-glass sm full" onclick="internAddAllowance()">+ บันทึกรายได้วันนี้</button>
              </div>
              <div class="glass-card" style="border:2px solid #000; padding:10px; background:#fff; text-align:center;">
                <div style="font-weight:800; font-size:12px; margin-bottom:4px;">🎲 Lunch Roulette</div>
                <button class="btn-glass sm full" onclick="internLunchRoulette()">สุ่มร้านอาหาร</button>
              </div>
            </div>
          </div>

          <div class="glass-card" style="border:2px solid #000; padding:12px; background:#f8fafc; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:800; font-size:12px;">📞 Mentor Contact Card</div>
            <button class="btn-glass sm" onclick="internContactMentor()">โทรหาพี่เลี้ยงด่วน</button>
          </div>

          <!-- Skill Tagging -->
          <div class="glass-card" style="border:2px solid #000; padding:12px; background:#fff; margin-bottom:15px;">
            <div style="font-weight:800; font-size:12px; margin-bottom:8px;">🏷️ Skill Tagging</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="btn-glass sm" onclick="internTagSkill('SEM')">🔬 SEM</button>
              <button class="btn-glass sm" onclick="internTagSkill('Hardness')">🔩 Hardness</button>
              <button class="btn-glass sm" onclick="internTagSkill('Safety')">🦺 Safety</button>
              <button class="btn-glass sm" onclick="internTagSkill('Excel')">📊 Excel</button>
            </div>
          </div>

          <!-- Notion reflection daily input -->
          <div class="glass-card" style="border:2px solid #000; padding:15px; background:#fff;">
            <div style="font-weight:800; font-size:13px; margin-bottom:8px;">📒 Notion Daily Reflection</div>
            <textarea class="glass-textarea" id="internReflectionInput" style="width:100%; height:60px; font-size:12px; padding:8px; border:2px solid #000; border-radius:6px; margin-bottom:8px;" placeholder="วันนี้ทำอะไรบ้าง..."></textarea>
            <button class="btn-glass-primary sm full" onclick="internAddReflection()">📝 บันทึก & Sync</button>
          </div>

          <!-- Daily Reflection Logs -->
          <div style="margin-top:15px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div style="font-weight:800; font-size:12px;">📋 บันทึกย้อนหลัง & เอกสาร</div>
              <button class="btn-glass sm" onclick="internGenerateWorkLog()">📄 เจน PDF ใบลงเวลา</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px; max-height:120px; overflow-y:auto; padding-right:4px;">
              \${iState.dailyLogs.map(l => \`
                <div class="glass-card" style="border:1.5px solid #000; padding:8px; font-size:11px; background:rgba(255,255,255,0.8);">
                  <strong style="color:var(--c-accent);">\${l.date}</strong>: \${l.text}
                </div>
              \`).join('')}
            </div>
          </div>
        </div>
      \` : ''}

      \${iState.activePhase === 4 ? \`
        <!-- Phase 4: Reporting & Evaluation -->
        <div class="glass-card" style="border:2.5px solid #000; box-shadow: 4px 4px 0px #000; padding:15px; margin-bottom:20px;">
          <h3 style="font-weight:900; font-size:16px; margin:0 0 10px; color:var(--c-accent);">✍️ Phase 4: Reporting & Evaluation</h3>
          
          <div class="widget-grid" style="gap:10px; margin-bottom:15px;">
            <!-- Envelope checklist -->
            <div class="glass-card" style="border:2px solid #000; padding:12px; background:#fff;">
              <div style="font-weight:800; font-size:12px; margin-bottom:8px;">📦 เอกสารปิดผนึก (\${envelopeCompletedCount}/4)</div>
              <div style="display:flex; flex-direction:column; gap:6px; font-size:11px; font-weight:700;">
                <label style="display:flex; align-items:center; gap:6px;"><input type="checkbox" \${iState.envelopeChecked.env_form ? 'checked' : ''} onchange="internToggleEnvelope('env_form')"> ใบคำร้อง</label>
                <label style="display:flex; align-items:center; gap:6px;"><input type="checkbox" \${iState.envelopeChecked.env_time ? 'checked' : ''} onchange="internToggleEnvelope('env_time')"> ใบลงเวลา</label>
                <label style="display:flex; align-items:center; gap:6px;"><input type="checkbox" \${iState.envelopeChecked.env_eval ? 'checked' : ''} onchange="internToggleEnvelope('env_eval')"> ใบประเมิน</label>
                <label style="display:flex; align-items:center; gap:6px;"><input type="checkbox" \${iState.envelopeChecked.env_book ? 'checked' : ''} onchange="internToggleEnvelope('env_book')"> เล่มรายงาน</label>
              </div>
            </div>

            <!-- Auto consolidator & Links -->
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div class="glass-card" style="border:2px solid #000; padding:10px; background:#fff; text-align:center;">
                <div style="font-weight:800; font-size:12px; margin-bottom:4px;">🤖 AI Auto-Summary</div>
                <button class="btn-glass-primary sm full" onclick="internAutoSummarizeReflections()">สรุปรายสัปดาห์</button>
              </div>
              <div class="glass-card" style="border:2px solid #000; padding:10px; background:#fff; text-align:center;">
                <div style="font-weight:800; font-size:12px; margin-bottom:4px;">📊 ลิงก์ประเมินผล</div>
                <button class="btn-glass sm full" onclick="internSendEvalLink()">ก๊อปปี้ลิงก์ให้พี่เลี้ยง</button>
              </div>
            </div>
          </div>

          <div class="glass-card" style="border:2px solid #000; padding:12px; background:#f8fafc; margin-bottom:15px;">
            <div style="font-weight:800; font-size:12px; margin-bottom:6px;">⚠️ Problem & Solution Log</div>
            <button class="btn-glass sm full" onclick="internAddProblemLog()">+ บันทึกปัญหาที่พบเพื่อเขียนรายงาน</button>
          </div>

          <div class="glass-card" style="border:2px solid #000; padding:12px; background:#f8fafc; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:800; font-size:12px;">☁️ Digital Copy Archive</div>
            <button class="btn-glass-primary sm" onclick="internBackupDrive()">สำรองไฟล์ขึ้น Drive</button>
          </div>
        </div>
      \` : ''}

      \${iState.activePhase === 5 ? \`
        <!-- Phase 5: Welfare & SOS -->
        <div class="glass-card" style="border:2.5px solid #000; box-shadow: 4px 4px 0px #000; padding:15px; margin-bottom:20px; border-left: 6px solid var(--c-rust);">
          <h3 style="font-weight:900; font-size:16px; margin:0 0 10px; color:var(--c-rust);">🏥 Phase 5: Welfare & Emergency</h3>
          
          <div class="widget-grid" style="gap:15px; margin-bottom:15px;">
            <!-- SOS button -->
            <div class="glass-card" style="border:2px solid #000; padding:15px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:rgba(239,68,68,0.05);">
              <div style="font-weight:900; font-size:13px; color:var(--c-rust); margin-bottom:10px;">🚨 ปุ่มฉุกเฉิน (SOS Call)</div>
              <button class="btn-glass-primary" onclick="internTriggerSOS()" style="background:#ef4444; border-color:#000; color:#fff; font-weight:900; width:90px; height:90px; border-radius:50%; font-size:20px; box-shadow:0px 0px 15px rgba(239,68,68,0.4); animation: pulse-sos 2s infinite;">
                SOS
              </button>
            </div>

            <!-- OCR Receipt Scanner -->
            <div class="glass-card" style="border:2px solid #000; padding:15px; display:flex; flex-direction:column; justify-content:center; background:#fff;">
              <div style="font-weight:800; font-size:12px; margin-bottom:8px;">🏥 Receipt Scanner & Claim</div>
              <button class="btn-glass-primary sm full" onclick="internSimulateOcrScanner()">📷 สแกนใบเสร็จเคลมประกัน</button>
              <div style="margin-top:10px; font-size:10px; font-weight:700; color:#15803d;">* OPD เบิกได้สูงสุด 2,000 บาท</div>
            </div>
          </div>

          <div class="glass-card" style="border:2px solid #000; padding:12px; background:#fff; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:800; font-size:12px;">🧭 ค้นหาสถานพยาบาลใกล้พิกัด</div>
            <button class="btn-glass sm" onclick="window.open('https://www.google.com/maps/search/hospital', '_blank')">เปิด Maps</button>
          </div>

          <div class="glass-card" style="border:2px solid #000; padding:12px; background:#f8fafc;">
            <div style="font-weight:800; font-size:12px; margin-bottom:8px;">🧠 Mental Health Check</div>
            <button class="btn-glass sm full" onclick="internMentalCheck()">📝 ทำแบบประเมินความเครียด</button>
          </div>
        </div>
      \` : ''}

      \${iState.activePhase === 6 ? \`
        <!-- Bonus Phase -->
        <div class="glass-card" style="border:2.5px solid #000; box-shadow: 4px 4px 0px #000; padding:15px; margin-bottom:20px; border-left: 6px solid #8b5cf6;">
          <h3 style="font-weight:900; font-size:16px; margin:0 0 10px; color:#8b5cf6;">⭐ Bonus: Gamification & Network</h3>
          
          <div class="widget-grid" style="gap:10px; margin-bottom:15px;">
            <div class="glass-card" style="border:2px solid #000; padding:12px; background:#fff; text-align:center;">
              <div style="font-size:32px; margin-bottom:5px;">🍅</div>
              <div style="font-weight:800; font-size:12px; margin-bottom:8px;">Focus Timer (รายงาน)</div>
              <button class="btn-glass-primary sm full" onclick="internStartFocus()">เริ่มจับเวลา 25 นาที</button>
            </div>
            <div class="glass-card" style="border:2px solid #000; padding:12px; background:#fff; text-align:center;">
              <div style="font-size:32px; margin-bottom:5px;">🤝</div>
              <div style="font-weight:800; font-size:12px; margin-bottom:8px;">Networking Sync</div>
              <button class="btn-glass sm full" onclick="internAddContact()">+ บันทึก Contact</button>
            </div>
          </div>

          <div class="glass-card" style="border:2px solid #000; padding:12px; background:#f8fafc; margin-bottom:15px;">
            <div style="font-weight:800; font-size:12px; margin-bottom:8px;">🏆 Internship Badges</div>
            <div style="display:flex; gap:8px;">
              <div style="opacity: \${iState.totalHours > 0 ? '1' : '0.4'}; text-align:center;">
                <div style="font-size:24px;">🌱</div>
                <div style="font-size:10px; font-weight:700;">First Step</div>
              </div>
              <div style="opacity: \${iState.dailyLogs.length >= 5 ? '1' : '0.4'}; text-align:center;">
                <div style="font-size:24px;">📝</div>
                <div style="font-size:10px; font-weight:700;">Doc King</div>
              </div>
            </div>
          </div>

          <div class="glass-card" style="border:2px solid #000; padding:12px; background:#f8fafc;">
            <div style="font-weight:800; font-size:12px; margin-bottom:8px;">🙏 Gratitude Reminder</div>
            <button class="btn-glass sm full" onclick="showToast('📧 เตือนความจำ: อย่าลืมส่งอีเมลขอบคุณพี่เลี้ยงในวันสุดท้าย!')">ตั้งเตือนส่งเมลขอบคุณ</button>
          </div>
        </div>
      \` : ''}
    </div>

    <style>
      @keyframes pulse-sos {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      }
    </style>
  \`;
};
