// ══════════════════════════════════════════════════
// SCHEDULE
// ══════════════════════════════════════════════════
function renderSchedule() {
  const daysShort = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const curSem = state.selectedSemester ? state.semesters.find(s => s.id === state.selectedSemester) : (getCurrentSemester() || state.semesters[state.semesters.length - 1]);
  const courses = curSem ? (state.courses[curSem.id] || []) : [];

  return `<div class="page-wrap">
    <div class="page-header-row">
      <h1 class="page-title">Precision Timetable</h1>
      <div class="hdr-acts">
        <select class="glass-select" id="schedSemFilter" onchange="state.selectedSemester=this.value; render();">
          <option value="">— All Terms —</option>
          ${state.semesters.map(s => `<option value="${s.id}" ${curSem?.id === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
        <button class="btn-glass" id="exportSchedBtn">📸 Save</button>
      </div>
    </div>

    <div class="tt-container glass-card" id="timetable">
      <div class="tt-grid">
        <div class="tt-corner"></div>
        ${(() => {
      const now = new Date();
      const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const currentHour = now.getHours() + (now.getMinutes() / 60);

      let html = daysShort.map((d, i) => `<div class="tt-header ${i === currentDay ? 'current-day' : ''}">${d}</div>`).join('');

      html += Array.from({ length: 13 }, (_, i) => 8 + i).map(h => `
            <div class="tt-time-label" style="grid-row: ${((h - 8) * 2) + 2}">${h}:00</div>
          `).join('');

      html += courses.flatMap(c => (c.schedules || c.schedule || []).map(s => {
        const rowStart = Math.floor((s.startHour - 8) * 2) + 2;
        const rowEnd = Math.ceil((s.endHour - 8) * 2) + 2;
        const isActive = s.day === currentDay && currentHour >= s.startHour && currentHour < s.endHour;
        const boxStyle = isActive ? `border-color: var(--c-lime); background: rgba(132,204,22,0.2); box-shadow: 0 0 10px rgba(132,204,22,0.4);` : `border-color: ${c.color}; background: ${c.color}22;`;

        return `<div class="tt-entry" data-course-id="${c.id}" onclick="renderCourseHub('${c.id}')" style="grid-column: ${s.day + 2}; grid-row: ${rowStart} / ${rowEnd}; ${boxStyle} cursor:pointer; position:relative;" title="ผู้สอน: ${c.instructor || '-'}nห้อง: ${c.room || 'ไม่ระบุ'}">
                <div class="tt-code" style="color: ${isActive ? 'var(--c-lime)' : c.color}">${c.code}</div>
                <div class="tt-name">${c.nameTh}</div>
                <div style="font-size: 9px; opacity: 0.8; margin-top: 4px;">📍 ${c.room || 'Online'}</div>
                ${isActive ? `<div style="position:absolute; top:4px; right:4px; width:8px; height:8px; background:var(--c-lime); border-radius:50%; animation: pulse 1.5s infinite;"></div>` : ''}
              </div>`;
      })).join('');

      return html;
    })()}
      </div>
    </div>
  </div>`;
}

function renderIDCardPreview() {
  const photo = state.idCardPhoto || "https://img2.pic.in.th/pic/Student_Photo_Placeholder.png";
  return `
      <div class="glass-card nb-card" style="padding:20px; text-align:center; background:white; border:2px solid #ccc; max-width: 320px; margin: 0 auto; border-radius: 16px;">
        <div style="font-weight:900; font-size:16px; margin-bottom:15px; letter-spacing:1px; color:#1e293b; font-family:Kanit;">STUDENT IDENTIFICATION</div>
        
        <div style="margin-bottom:15px;">
          <img src="${photo}" style="width:120px; height:160px; object-fit:cover; border-radius:8px; border:2.5px solid #eee; box-shadow:0 4px 10px rgba(0,0,0,0.1);" onerror="this.src='https://img2.pic.in.th/pic/Student_Photo_Placeholder.png'">
        </div>

        <div style="font-size:16px; font-weight:700; color:#333; margin-bottom:4px; font-family:Kanit;">${STUDENT.nameTh}</div>
        <div style="font-size:12px; color:#666; margin-bottom:15px; font-family:Kanit;">${STUDENT.major}</div>

        <div style="margin: 0 auto 10px; width:fit-content; background:white; padding:5px; border:1px solid #eee; border-radius:6px;">
           <svg id="idBarcodePreview"></svg>
        </div>
        <div style="font-family:'JetBrains Mono', monospace; font-size:18px; font-weight:800; letter-spacing:3px; color:#1e293b;">
          ${STUDENT.id}
        </div>
        <div style="margin-top:10px; font-size:10px; font-weight:700; opacity:0.5; text-transform:uppercase;">
          Kasetsart University | Materials Engineering
        </div>
      </div>`;
}

function showIDCardModal() {
  openModal('🪪 My Student ID', `
        <div style="padding:10px;">
          ${renderIDCardPreview()}
          <p style="margin-top:20px; font-size:13px; text-align:center; opacity:0.6;">ใช้สำหรับสแกนเข้าห้องสมุดหรือติดต่อเจ้าหน้าที่</p>
        </div>
      `, `
        <button class="nb-btn-primary full" onclick="closeModal()">ปิดหน้าต่าง</button>
      `);
  renderIDBarcode();
}

function renderIDBarcode() {
  setTimeout(() => {
    const el = document.getElementById('idBarcodePreview');
    if (el) {
      JsBarcode("#idBarcodePreview", state.idCard.studentId || "20067105527480", {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 40,
        displayValue: false,
        margin: 0
      });
    }
  }, 50);
}

window.updateIDCard = (key, val) => {
  state.idCard[key] = val;
  document.getElementById('idCardPreviewWrap').innerHTML = renderIDCardPreview();
  renderIDBarcode();
};

window.saveIDCardConfig = async () => {
  localStorage.setItem('id_card_config', JSON.stringify(state.idCard));
  await fsSet('app_settings', 'id_card', state.idCard);
  showToast('✅ บันทึกข้อมูลบัตรและซิงก์สำเร็จ!');
  closeModal();
};

window.exportIDCard = async () => {
  const el = document.getElementById('idCardPreviewWrap');
  if (!el || typeof html2canvas === 'undefined') {
    showToast('❌ ไม่สามารถสร้างรูปได้ (html2canvas not loaded)', 'err');
    return;
  }

  showToast('⏳ กำลังเตรียมไฟล์รูปภาพ...');

  // FIX: If photoBase64 is missing (e.g. after reload), fetch it via server proxy
  if (state.idCard.fileId && !state.idCard.photoBase64) {
    showToast('⏳ กำลังดึงข้อมูลรูปภาพจาก Drive...');
    await new Promise((resolve) => {
      google.script.run.withSuccessHandler(res => {
        if (res.success) {
          state.idCard.photoBase64 = res.base64;
          updateIDCard('photoBase64', res.base64); // Update UI
          resolve();
        } else {
          showToast('⚠️ ไม่สามารถดึงรูปภาพแบบ CORS-safe ได้', 'warn');
          resolve();
        }
      }).getFileDataBase64(state.idCard.fileId);
    });
  }

  // Wait a bit for images/barcode to settle
  await new Promise(r => setTimeout(r, 600));

  try {
    const canvas = await html2canvas(el, {
      backgroundColor: null,
      scale: 3,
      useCORS: true,
      logging: false,
      allowTaint: true
    });
    const link = document.createElement('a');
    link.download = `Student_ID_${state.idCard.studentId || 'card'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('✅ บันทึกบัตรนิสิตสำเร็จ');
  } catch (e) {
    showToast('❌ เกิดข้อผิดพลาดในการสร้างรูป: ' + e.message, 'err');
    console.error(e);
  }
};

window.deleteSemesterCalendar = async (semName) => {
  if (!confirm(`ยืนยันที่จะลบปฏิทิน Google Calendar ของเทอม ${semName} ใช่หรือไม่?nn(การกระทำนี้จะลบ event ทั้งหมดที่เกี่ยวข้องกับเทอมนี้ออกจาก Google Calendar เท่านั้น แต่ข้อมูลในแอปยังคงอยู่)`)) return;

  if (typeof google !== 'undefined' && google.script) {
    showToast(`⏳ กำลังลบปฏิทิน...`);
    google.script.run.withSuccessHandler(res => {
      if (res && res.success) {
        showToast(`✅ ลบปฏิทิน ${semName} สำเร็จ`);
      } else {
        showToast(`❌ เกิดข้อผิดพลาด: ${res?.error || 'Unknown error'}`, 'err');
      }
    }).deleteCalendar(`NITIPAT MANAGER - ${semName}`);
  } else {
    showToast('❌ ไม่สามารถติดต่อ Google Script ได้', 'err');
  }
};

window.checkFcmStatus = async () => {
  showToast('⌛ กำลังตรวจสอบจำนวนอุปกรณ์...');
  try {
    const q = query(collection(db, 'fcm_tokens'), where('userId', '==', STUDENT.id));
    const snap = await getDocs(q);
    const count = snap.size;
    const tokens = [];
    
    snap.forEach(d => {
      const data = d.data();
      if (data.token) {
        const snippet = data.token.substring(0, 10) + '...' + data.token.substring(data.token.length - 10);
        const platform = data.platform || 'Unknown';
        tokens.push(`${snippet} (${platform})`);
      }
    });

    openModal('📱 สถานะการแจ้งเตือน PWA', `
      <div style="text-align:center; padding:20px;">
        <div style="font-size:40px; margin-bottom:15px;">📡</div>
        <div style="font-size:18px; font-weight:700;">ลงทะเบียนไว้ ${count} อุปกรณ์</div>
        <p style="font-size:12px; color:#64748b; margin-top:10px; line-height:1.5;">
          หากเปลี่ยนเครื่องใหม่ หรือล้างแคช เบราว์เซอร์จะลงทะเบียนรหัสการแจ้งเตือนใหม่ให้อัตโนมัติครับ
        </p>
        <div style="margin-top:20px; font-family:monospace; font-size:11px; opacity:0.7; text-align:left; background:rgba(0,0,0,0.05); padding:12px; border-radius:10px; max-height:150px; overflow-y:auto; line-height:1.6;">
          <strong>อุปกรณ์เปิดใช้งานทั้งหมด (${count}):</strong><br>
          ${tokens.map(t => `• ${t}`).join('<br>')}
          ${tokens.length === 0 ? '<i>ไม่มีอุปกรณ์เปิดใช้งาน</i>' : ''}
        </div>
        <button class="btn-glass danger full" style="margin-top:20px; width: 100%;" onclick="resetFcmTokens()">🗑 ล้างข้อมูลอุปกรณ์ทั้งหมด</button>
      </div>
    `, '<button class="nb-btn nb-btn-primary full" onclick="closeModal()">รับทราบ</button>');

  } catch (err) {
    console.error("Firestore FCM check failed:", err);
    showToast('❌ เกิดข้อผิดพลาดในการดึงข้อมูลอุปกรณ์', 'err');
  }
};



window.resetFcmTokens = async () => {
  if (!confirm('⚠️ ยืนยันที่จะล้างข้อมูลอุปกรณ์ทั้งหมดใช่หรือไม่?nn(ทุกเครื่องจะต้องกด "เปิดใช้งาน" ใหม่เพื่อรับแจ้งเตือนอีกครั้ง)')) return;

  showToast('⏳ กำลังล้างข้อมูลอุปกรณ์...');
  try {
    const q = query(collection(db, 'fcm_tokens'), where('userId', '==', STUDENT.id));
    const snap = await getDocs(q);
    const promises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(promises);
    
    closeModal();
    showToast('✅ ล้างข้อมูลสำเร็จ! กรุณากดลงทะเบียนใหม่');
  } catch (e) {
    console.error("Firestore FCM reset failed:", e);
    showToast('❌ เกิดข้อผิดพลาดในการล้างข้อมูลคลาวด์', 'err');
  }

  if (typeof google !== 'undefined' && google.script) {
    try {
      google.script.run.withFailureHandler(() => {}).resetFcmTokens();
    } catch (e) {}
  }
};

window.syncAllToCalendar = async (semId) => {
  const sem = state.semesters.find(s => s.id === semId);
  if (!sem) return;

  // กรองงานและสอบเฉพาะของเทอมนี้
  const semCourses = state.courses[semId] || [];
  const courseIds = semCourses.map(c => c.id);

  const assignments = Object.values(state.assignments).flat().filter(a => courseIds.includes(a.courseId));
  const exams = Object.values(state.exams).flat().filter(e => courseIds.includes(e.courseId));

  if (assignments.length === 0 && exams.length === 0) {
    showToast('⚠️ ไม่พบข้อมูลงานหรือการสอบในเทอมนี้', 'warn');
    return;
  }

  showToast(`⏳ กำลังซิงก์ข้อมูล ${assignments.length + exams.length} รายการไปยัง Google Calendar...`);

  let successCount = 0;
  const total = assignments.length + exams.length;

  const handleRes = async (item, type, res) => {
    if (res && res.success) {
      item.calendarEventId = res.eventId;
      await fsSet(type === 'assignment' ? 'assignments' : 'exams', item.id, item);
      successCount++;
      if (successCount === total) showToast(`✅ ซิงก์ข้อมูลทั้งหมดสำเร็จ!`);
    }
  };

  assignments.forEach(a => {
    google.script.run.withSuccessHandler(res => handleRes(a, 'assignment', res)).syncCalendarEvent(`NITIPAT MANAGER - ${sem.name}`, 'assignment', a);
  });
  exams.forEach(e => {
    google.script.run.withSuccessHandler(res => handleRes(e, 'exam', res)).syncCalendarEvent(`NITIPAT MANAGER - ${sem.name}`, 'exam', e);
  });
};
