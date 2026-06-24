// ══════════════════════════════════════════════════
// FORMS
// ══════════════════════════════════════════════════

window.showCheckinBanner = function(c) {
  openModal(`📍 ถึงเวลาเรียน ${c.nameTh}`, `
    <div style="text-align:center; padding: 20px;">
       <div style="font-size:40px; margin-bottom:10px;">🕒</div>
       <div style="font-size:16px; font-weight:700; margin-bottom:10px;">ถึงเวลาเข้าเรียนวิชา ${c.nameTh} แล้วครับ!</div>
       <p style="margin-bottom:20px; color:#666;">ระบบต้องการให้คุณยืนยันการเข้าเรียนตอนนี้ เพื่อบันทึก Attendance ของวันนี้</p>
       <button class="btn-pastel-primary full" style="border-radius:10px; padding:12px; margin-bottom:10px;" onclick="closeModal(); setAttendanceStatus('${c.id}', 'เข้าเรียน (Onsite)')">📍 เข้าเรียน (Onsite) - เปิด GPS</button>
       <button class="btn-glass full" style="border-radius:10px; padding:12px;" onclick="closeModal(); setAttendanceStatus('${c.id}', 'เข้าเรียน (Online)')">💻 เข้าเรียน (Online) - ไม่ใช้ GPS</button>
    </div>
  `);
}
function openAddSemesterForm(existing = null) {
  const calOptions = Object.entries(ACADEMIC_CALENDAR).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');
  openModal(existing ? 'แก้ไขเทอม' : 'เพิ่มเทอมการศึกษา', `
    <div class="form-grid">
      <div class="fg">
        <label>นำเข้าจากปฏิทิน 2568-2569</label>
        <select class="glass-select full" id="calImport"><option value="">— หรือกรอกเอง —</option>${calOptions}</select>
      </div>
      <div class="fg"><label>ชื่อเทอม <span class="req">*</span></label>
        <input class="glass-input" id="f-sName" placeholder="เช่น ภาคต้น 2568" value="${existing?.name || ''}"></div>
      <div class="fg"><label>วันเริ่มเทอม</label>
        <input type="date" class="glass-input" id="f-sStart" value="${existing?.startDate || ''}"></div>
      <div class="fg"><label>วันสิ้นสุดเทอม</label>
        <input type="date" class="glass-input" id="f-sEnd" value="${existing?.endDate || ''}"></div>
      <div class="fg"><label>ลำดับ</label>
        <input type="number" class="glass-input" id="f-sOrd" value="${existing?.order || state.semesters.length + 1}"></div>
    </div>`,
    `<button class="btn-glass-primary" id="saveSemBtn">${existing ? 'บันทึก' : 'เพิ่มเทอม'}</button>`
  );
  document.getElementById('calImport')?.addEventListener('change', e => {
    const cal = ACADEMIC_CALENDAR[e.target.value];
    if (cal) {
      document.getElementById('f-sName').value = cal.name;
      document.getElementById('f-sStart').value = cal.start || '';
      document.getElementById('f-sEnd').value = cal.end || '';
    }
  });
  document.getElementById('saveSemBtn').onclick = async () => {
    const data = {
      id: existing?.id || `sem_${Date.now()}`, name: document.getElementById('f-sName').value,
      startDate: document.getElementById('f-sStart').value, endDate: document.getElementById('f-sEnd').value,
      order: parseInt(document.getElementById('f-sOrd').value) || 0
    };
    if (!data.name) { showToast('⚠️ กรอกชื่อเทอม', 'err'); return; }
    await fsSet('semesters', data.id, data);
    closeModal(); await loadAll(); showToast('✅ บันทึกเทอมสำเร็จ');
  };
}

const COURSE_COLORS_LIST = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#ea580c'];

function openAddCourseForm(existing = null, targetSemId = null) {
  const curSem = getCurrentSemester() || state.semesters[state.semesters.length - 1];
  const defaultSemId = existing ? existing.semId : (targetSemId || curSem?.id);
  const semOptions = state.semesters.map(s => `<option value="${s.id}" ${defaultSemId === s.id ? 'selected' : ''}>${s.name}</option>`).join('');

  let slots = existing?.schedules || [{ day: 0, start: "09:00", end: "12:00" }];

  const renderSlots = () => slots.map((s, i) => `
    <div class="slot-row glass-card-sm" style="display:flex; gap:8px; align-items:center; margin-bottom:8px; padding:8px;">
      <select class="glass-select sm f-slot-day" data-idx="${i}">
        ${['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((d, v) => `<option value="${v}" ${s.day == v ? 'selected' : ''}>${d}</option>`).join('')}
      </select>
      <input type="time" class="glass-input sm f-slot-start" data-idx="${i}" value="${s.start}">
      <span>-</span>
      <input type="time" class="glass-input sm f-slot-end" data-idx="${i}" value="${s.end}">
      ${i > 0 ? `<button class="icon-btn sm btn-slot-del" data-idx="${i}">✕</button>` : ''}
    </div>
  `).join('');

  openModal(existing ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชา', `
    <div class="form-grid">
      <div class="fg full"><label>เทอม <span class="req">*</span></label><select class="glass-select" id="f-cSem">${semOptions}</select></div>
      <div class="fg full">
        <label>ค้นหาจากฐานข้อมูลวิชา</label>
        <input class="glass-input" id="f-cSearch" placeholder="พิมพ์รหัส หรือชื่อวิชา...">
        <div id="courseSearchResults" class="search-results-inline"></div>
      </div>
      <div class="fg"><label>รหัสวิชา <span class="req">*</span></label><input class="glass-input" id="f-cCode" placeholder="เช่น 01213212" value="${existing?.code || ''}"></div>
      <div class="fg full"><label>ชื่อวิชา (ไทย) <span class="req">*</span></label><input class="glass-input" id="f-cNameTh" placeholder="ชื่อวิชา" value="${existing?.nameTh || ''}"></div>
      <div class="fg full"><label>ชื่อวิชา (อังกฤษ)</label><input class="glass-input" id="f-cNameEn" value="${existing?.nameEn || ''}"></div>
      <div class="fg"><label>หน่วยกิต</label><input type="number" class="glass-input" id="f-cCr" min="1" max="9" value="${existing?.credits || 3}"></div>
      <div class="fg"><label>รูปแบบ</label>
        <select class="glass-select" id="f-cMode">
          <option value="onsite" ${existing?.mode === 'onsite' ? 'selected' : ''}>🏫 Onsite</option>
          <option value="online" ${existing?.mode === 'online' ? 'selected' : ''}>🌐 Online</option>
          <option value="hybrid" ${existing?.mode === 'hybrid' ? 'selected' : ''}>🔀 Hybrid</option>
        </select></div>
      
      <div class="fg full">
        <label>วันเวลาเรียน (รองรับหลายช่วงเวลา)</label>
        <div id="slotsContainer">${renderSlots()}</div>
        <button class="btn-glass sm" id="addSlotBtn" style="width:100%; margin-top:4px;">+ เพิ่มวัน/เวลาเรียน</button>
      </div>

      <div class="fg full"><label>อาจารย์ผู้สอน</label><input class="glass-input" id="f-cInstr" placeholder="ชื่ออาจารย์" value="${existing?.instructor || ''}"></div>
      <div class="fg full"><label>ห้องเรียน / อาคาร / พิกัด (สำหรับเช็คชื่อ)</label>
        <input class="glass-input" id="f-cRoom" placeholder="เช่น อาคาร E6-301" value="${existing?.room || ''}">
        <div class="map-picker-controls">
          <input class="glass-input sm" id="f-cCoords" placeholder="พิกัด Lat,Lon" value="${existing?.targetCoords || existing?.coords || ''}" readonly style="font-size:11px;">
          <button class="btn-glass sm" id="mapLocateBtn">📍 ปักหมุดที่นี่</button>
        </div>
        <div id="map"></div>
      </div>
      <div class="fg full"><label>ลิงก์ห้องเรียน / LMS (Zoom, MS Teams, Google Classroom)</label><input class="glass-input" id="f-cLink" placeholder="https://..." value="${existing?.link || ''}"></div>
      <div class="fg full"><label>การตัดเกรด</label><input class="glass-input" id="f-cGrading" placeholder="เช่น กลางภาค 30% ปลายภาค 50% งาน 20%" value="${existing?.grading || ''}"></div>
      <div class="fg"><label>เกรดที่ได้</label>
        <select class="glass-select" id="f-cGrade">
          <option value="" ${!existing?.grade ? 'selected' : ''}>- ยังไม่มีเกรด -</option>
          ${Object.keys(GRADE_PTS).map(g => `<option value="${g}" ${existing?.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
        </select>
      </div>
      <div class="fg">
        <label>สี</label>
        <div class="color-picker-row">
          ${COURSE_COLORS_LIST.map(c => `<div class="cpick ${existing?.color === c ? 'sel' : ''}" style="background:${c}" data-color="${c}"></div>`).join('')}
        </div>
      </div>
    </div>`,
    `<button class="btn-glass-primary" id="saveCourseBtn">${existing ? 'บันทึก' : 'เพิ่มวิชา'}</button>`
  );

  const updateSlotsUI = () => { document.getElementById('slotsContainer').innerHTML = renderSlots(); attachSlotEvents(); };
  const attachSlotEvents = () => {
    document.querySelectorAll('.btn-slot-del').forEach(b => b.onclick = () => { slots.splice(b.dataset.idx, 1); updateSlotsUI(); });
    document.querySelectorAll('.f-slot-day').forEach(s => s.onchange = () => { slots[s.dataset.idx].day = parseInt(s.value); });
    document.querySelectorAll('.f-slot-start').forEach(s => s.onchange = () => { slots[s.dataset.idx].start = s.value; });
    document.querySelectorAll('.f-slot-end').forEach(s => s.onchange = () => { slots[s.dataset.idx].end = s.value; });
  };
  document.getElementById('addSlotBtn').onclick = () => { slots.push({ day: 0, start: "09:00", end: "12:00" }); updateSlotsUI(); };
  attachSlotEvents();
  let selColor = existing?.color || COURSE_COLORS_LIST[0];
  document.querySelectorAll('.cpick').forEach(d => { d.onclick = () => { document.querySelectorAll('.cpick').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); selColor = d.dataset.color; }; });

  document.getElementById('f-cSearch')?.addEventListener('input', e => {
    const res = searchCourseDB(e.target.value);
    const container = document.getElementById('courseSearchResults');
    if (container) {
      container.innerHTML = res.map(c => `<div class="csr-item" data-code="${c.code}" data-name="${c.name}" data-nameen="${c.nameEn || ''}" data-cr="${c.credits}">${c.code} — ${c.name} (${c.credits} cr)</div>`).join('');
      container.querySelectorAll('.csr-item').forEach(item => {
        item.onclick = () => {
          document.getElementById('f-cCode').value = item.dataset.code;
          document.getElementById('f-cNameTh').value = item.dataset.name;
          document.getElementById('f-cNameEn').value = item.dataset.nameen;
          document.getElementById('f-cCr').value = item.dataset.cr;
          container.innerHTML = '';
          const p = checkPrereqs(item.dataset.code);
          if (!p.ok) showToast(`⚠️ ยังขาด Prerequisite: ${p.missing.join(', ')}`, 'err');
        };
      });
    }
  });

  setTimeout(() => {
    const defaultCoords = [13.8476, 100.5696];
    const map = L.map('map').setView(defaultCoords, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    let marker = null;
    if (existing?.coords) {
      const [lat, lon] = existing.coords.split(',').map(Number);
      marker = L.marker([lat, lon]).addTo(map);
      map.setView([lat, lon], 17);
    }

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng]).addTo(map);
      document.getElementById('f-cCoords').value = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    });

    document.getElementById('mapLocateBtn').onclick = () => {
      map.locate({ setView: true, maxZoom: 17 });
    };

    map.on('locationfound', (e) => {
      const { lat, lng } = e.latlng;
      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng]).addTo(map);
      document.getElementById('f-cCoords').value = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    });
  }, 500);

  document.getElementById('saveCourseBtn').onclick = async () => {
    const semId = document.getElementById('f-cSem').value;
    const sem = state.semesters.find(s => s.id === semId);

    const processedSlots = slots.map(s => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return {
        day: s.day,
        start: s.start,
        end: s.end,
        startHour: sh + (sm / 60),
        endHour: eh + (em / 60)
      };
    });

    const data = {
      id: existing?.id || `c_${Date.now()}`, semId,
      code: document.getElementById('f-cCode').value,
      nameTh: document.getElementById('f-cNameTh').value,
      nameEn: document.getElementById('f-cNameEn').value,
      credits: parseInt(document.getElementById('f-cCr').value) || 3,
      mode: document.getElementById('f-cMode').value,
      instructor: document.getElementById('f-cInstr').value,
      schedules: processedSlots,
      room: document.getElementById('f-cRoom').value,
      targetCoords: document.getElementById('f-cCoords').value,
      link: document.getElementById('f-cLink').value,
      grading: document.getElementById('f-cGrading').value,
      color: selColor,
      grade: document.getElementById('f-cGrade').value || null,
      attendance: existing?.attendance || 0,
      maxAttendance: existing?.maxAttendance || 15,
      isArchived: existing?.isArchived || false,
      driveUrl: existing?.driveUrl || null
    };
    if (!data.code || !data.nameTh) { showToast('⚠️ กรอกรหัสและชื่อวิชา', 'err'); return; }

    await fsSet('courses', data.id, data);

    const isPastSem = sem && new Date(sem.endDate) < new Date();
    if (!isPastSem && !data.isArchived && typeof google !== 'undefined' && google.script && google.script.run) {
      showToast('📂 กำลังสร้างโครงสร้างโฟลเดอร์ใน Google Drive...');
      google.script.run.withSuccessHandler(res => {
        if (res && res.success) {
          showToast('✅ สร้างโครงสร้าง Drive สำเร็จ');
          fsUpd('courses', data.id, { 
            driveId: res.rootId, 
            driveUrl: res.folderUrl,
            driveLectures: res.lecturesId,
            driveAssignments: res.assignmentsId,
            driveExams: res.examsId,
            driveResources: res.resourcesId
          });
        } else {
          showToast('❌ สร้างโฟลเดอร์ล้มเหลว: ' + (res?.error || 'Unknown error'), 'err');
        }
      }).createDriveHierarchy(sem ? sem.name : 'Unknown_Semester', `${data.code}_${data.nameEn || data.nameTh}`);
    }
    closeModal(); await loadAll(); showToast('✅ บันทึกวิชาสำเร็จ');
  };
}

function openAddAssignmentForm(a = null) {
  const allCourses = Object.values(state.courses).flat();
  const curSem = getCurrentSemester() || state.semesters[state.semesters.length - 1];
  const activeCourses = curSem ? (state.courses[curSem.id] || []) : allCourses;
  openModal(a ? 'แก้ไขการบ้าน / งาน' : 'เพิ่มการบ้าน / งาน', `
    <div class="form-grid">
      <div class="fg full"><label>วิชา <span class="req">*</span></label>
        <select class="glass-select" id="f-aCourse">${activeCourses.map(c => `<option value="${c.id}" ${a && a.courseId === c.id ? 'selected' : ''}>${c.code} — ${c.nameTh}</option>`).join('')}</select></div>
      <div class="fg full"><label>ชื่องาน <span class="req">*</span></label><input class="glass-input" id="f-aTitle" placeholder="ชื่องาน / การบ้าน" value="${a ? a.title : ''}"></div>
      <div class="fg"><label>ประเภท</label>
        <select class="glass-select" id="f-aType">
          ${['การบ้าน', 'รายงาน', 'โปรเจกต์', 'Quiz', 'Lab', 'งานกลุ่ม', 'อื่นๆ'].map(t => `<option ${a && a.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select></div>
      <div class="fg"><label>กำหนดส่ง <span class="req">*</span></label><input type="date" class="glass-input" id="f-aDue" value="${a ? a.dueDate : ''}"></div>
      <div class="fg"><label>เวลาส่ง</label><input type="time" class="glass-input" id="f-aTime" value="${a ? a.dueTime || '' : ''}"></div>
      <div class="fg"><label>คะแนนเต็ม</label><input type="number" class="glass-input" id="f-aScore" placeholder="เช่น 10" value="${a ? a.maxScore || '' : ''}"></div>
      <div class="fg full"><label>บันทึกช่วยจำ (ที่อาจารย์สั่งปากเปล่า)</label>
        <textarea class="glass-textarea" id="f-aNote" rows="2" placeholder="รายละเอียด...">${a ? a.note || '' : ''}</textarea></div>
    </div>`,
    `<button class="btn-glass-primary" id="saveAssignBtn">${a ? 'บันทึกแก้ไข' : 'เพิ่มการบ้าน'}</button>`
  );
  document.getElementById('saveAssignBtn').onclick = async () => {
    const cid = document.getElementById('f-aCourse').value;
    const course = allCourses.find(c => c.id === cid);
    const data = {
      id: a ? a.id : `a_${Date.now()}`,
      calendarEventId: a ? a.calendarEventId : null,
      courseId: cid, courseName: course?.code || '',
      title: document.getElementById('f-aTitle').value,
      type: document.getElementById('f-aType').value,
      dueDate: document.getElementById('f-aDue').value,
      dueTime: document.getElementById('f-aTime').value,
      maxScore: document.getElementById('f-aScore').value,
      note: document.getElementById('f-aNote').value,
      status: a ? a.status : 'ยังไม่เริ่ม',
      submitted: a ? a.submitted : false,
      subtasks: a ? a.subtasks || [] : [],
      folderId: a ? a.folderId || null : null,
      folderUrl: a ? a.folderUrl || null : null
    };
    if (!data.title || !data.dueDate) { showToast('⚠️ กรอกชื่องานและกำหนดส่ง', 'err'); return; }
    await fsSet('assignments', data.id, data);

    // --- Native Google Drive Folder Creation ---
    requestDriveAccess(async () => {
      showToast(`📂 กำลังสร้าง/อัปเดตโฟลเดอร์งานใน Google Drive...`);
      const courseWithSem = course || { driveId: null };
      
      const res = await NativeGoogleDrive.createAssignmentFolder(courseWithSem.code || 'Unknown', data.title, courseWithSem.driveId);
      if (res.success) {
        showToast(a ? '✅ ซิงก์ชื่อโฟลเดอร์ใน Drive สำเร็จ' : '✅ สร้างโฟลเดอร์สำหรับงานสำเร็จ');
        await fsUpd('assignments', data.id, {
          folderId: res.folderId,
          folderUrl: res.folderUrl
        });
        const arr = state.assignments[data.courseId] || [];
        const item = arr.find(x => x.id === data.id);
        if (item) {
          item.folderId = res.folderId;
          item.folderUrl = res.folderUrl;
        }
        render();
      } else {
        showToast('❌ การสร้างโฟลเดอร์ใน Drive ขัดข้อง: ' + res.error, 'err');
      }
    });

    if (typeof google !== 'undefined' && google.script) {
      const semName = curSem ? curSem.name : 'Unknown';
      google.script.run.withSuccessHandler(async res => {
        if (res && res.success) {
          data.calendarEventId = res.eventId;
          await fsSet('assignments', data.id, data);
        }
      }).syncCalendarEvent(`NITIPAT MANAGER - ${semName}`, 'assignment', data);
    }

    closeModal(); await loadAll(); showToast(a ? '✅ บันทึกแก้ไขสำเร็จ' : '✅ เพิ่มการบ้านสำเร็จ');
  };
}

function openAddExamForm(e = null) {
  const allCourses = Object.values(state.courses).flat();
  const curSem = getCurrentSemester() || state.semesters[state.semesters.length - 1];
  const activeCourses = curSem ? (state.courses[curSem.id] || []) : allCourses;
  openModal(e ? 'แก้ไขการสอบ' : 'เพิ่มการสอบ', `
    <div class="form-grid">
      <div class="fg full"><label>วิชา <span class="req">*</span></label>
        <select class="glass-select" id="f-eCourse">${activeCourses.map(c => `<option value="${c.id}" ${e && e.courseId === c.id ? 'selected' : ''}>${c.code} — ${c.nameTh}</option>`).join('')}</select></div>
      <div class="fg full"><label>ชื่อการสอบ <span class="req">*</span></label><input class="glass-input" id="f-eTitle" placeholder="เช่น สอบกลางภาค, Quiz 1" value="${e ? e.title : ''}"></div>
      <div class="fg"><label>ประเภท</label>
        <select class="glass-select" id="f-eType">
          ${['สอบกลางภาค', 'สอบปลายภาค', 'Quiz', 'สอบย่อย'].map(t => `<option ${e && e.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select></div>
      <div class="fg"><label>วันสอบ <span class="req">*</span></label><input type="date" class="glass-input" id="f-eDate" value="${e ? e.date : ''}"></div>
      <div class="fg"><label>เวลาสอบ</label><input type="time" class="glass-input" id="f-eTime" value="${e ? e.time || '' : ''}"></div>
      <div class="fg"><label>ห้องสอบ</label><input class="glass-input" id="f-eRoom" placeholder="เช่น E6-201" value="${e ? e.room || '' : ''}"></div>
      <div class="fg"><label>คะแนนเต็ม</label><input type="number" class="glass-input" id="f-eScore" value="${e ? e.maxScore || '' : ''}"></div>
      <div class="fg full"><label>ขอบเขตที่สอบ</label>
        <textarea class="glass-textarea" id="f-eScope" rows="2" placeholder="เนื้อหาที่ออกสอบ...">${e ? e.scope || '' : ''}</textarea></div>
      <div class="fg full"><label>บันทึก / Tips สำหรับสอบ</label>
        <textarea class="glass-textarea" id="f-eNotes" rows="2">${e ? e.notes || '' : ''}</textarea></div>
    </div>`,
    `<button class="btn-glass-primary" id="saveExamBtn">${e ? 'บันทึกแก้ไข' : 'เพิ่มการสอบ'}</button>`
  );
  document.getElementById('saveExamBtn').onclick = async () => {
    const cid = document.getElementById('f-eCourse').value;
    const course = allCourses.find(c => c.id === cid);
    const data = {
      id: e ? e.id : `e_${Date.now()}`,
      calendarEventId: e ? e.calendarEventId : null,
      courseId: cid, courseName: course?.code || '',
      title: document.getElementById('f-eTitle').value,
      type: document.getElementById('f-eType').value,
      date: document.getElementById('f-eDate').value,
      time: document.getElementById('f-eTime').value,
      room: document.getElementById('f-eRoom').value,
      maxScore: document.getElementById('f-eScore').value,
      scope: document.getElementById('f-eScope').value,
      notes: document.getElementById('f-eNotes').value
    };
    if (!data.title || !data.date) { showToast('⚠️ กรอกชื่อสอบและวันสอบ', 'err'); return; }

    if (!e) {
      const conflictExam = Object.values(state.exams).flat().find(ex => ex.date === data.date && ex.id !== data.id && ex.time === data.time);
      if (conflictExam) {
        if (!confirm(`⚠️ วันและเวลาสอบนี้ซ้อนกับวิชา ${conflictExam.courseName} (${conflictExam.title}) ยืนยันที่จะบันทึกหรือไม่?`)) return;
      }

      if (state.calendarSettings) {
        if (state.calendarSettings.midtermStart && data.date === state.calendarSettings.midtermStart) {
          showToast('ℹ️ ข้อสังเกต: จัดสอบวันเดียวกับวันเริ่มสอบกลางภาค', 'info');
        }
      }
    }

    await fsSet('exams', data.id, data);

    if (typeof google !== 'undefined' && google.script) {
      const semName = curSem ? curSem.name : 'Unknown';
      google.script.run.withSuccessHandler(async res => {
        if (res && res.success) {
          data.calendarEventId = res.eventId;
          await fsSet('exams', data.id, data);
        }
      }).syncCalendarEvent(`NITIPAT MANAGER - ${semName}`, 'exam', data);
    }

    closeModal(); await loadAll(); showToast(e ? '✅ บันทึกแก้ไขสำเร็จ' : '✅ เพิ่มการสอบสำเร็จ');
    startHyperNotifications();
  };
}

function openAddClubTaskForm() {
  openModal('เพิ่มงานชุมนุม', `
    <div class="form-grid">
      <div class="fg full"><label>ชื่องาน <span class="req">*</span></label><input class="glass-input" id="f-ctTitle" placeholder="สิ่งที่ต้องทำ..."></div>
      <div class="fg"><label>หมวดหมู่</label>
        <select class="glass-select" id="f-ctCat">
          <option>เอกสาร</option><option>ประสานงาน</option><option>กิจกรรม</option><option>ประชุม</option><option>อื่นๆ</option>
        </select></div>
      <div class="fg"><label>ความสำคัญ</label>
        <select class="glass-select" id="f-ctPri">
          <option value="normal">ปกติ</option><option value="mid">ปานกลาง</option><option value="high">เร่งด่วน</option>
        </select></div>
      <div class="fg"><label>กำหนด</label><input type="date" class="glass-input" id="f-ctDue"></div>
      <div class="fg full"><label>มอบหมายให้</label><input class="glass-input" id="f-ctAssign" placeholder="ชื่อคนรับผิดชอบ"></div>
      <div class="fg full"><label>หมายเหตุ</label><textarea class="glass-textarea" id="f-ctNote" rows="2"></textarea></div>
    </div>`,
    `<button class="btn-glass-primary" id="saveClubTaskBtn">เพิ่มงาน</button>`
  );
  document.getElementById('saveClubTaskBtn').onclick = () => {
    const t = {
      title: document.getElementById('f-ctTitle').value, cat: document.getElementById('f-ctCat').value,
      priority: document.getElementById('f-ctPri').value, due: document.getElementById('f-ctDue').value,
      assignTo: document.getElementById('f-ctAssign').value, note: document.getElementById('f-ctNote').value, done: false
    };
    if (!t.title) { showToast('⚠️ กรอกชื่องาน', 'err'); return; }
    state.clubTasks.push(t);
    localStorage.setItem('clubTasks', JSON.stringify(state.clubTasks));
    closeModal(); render(); showToast('✅ เพิ่มงานชุมนุมแล้ว');
  };
}

function updatePomodoroDisplay() {
  const rem = getPomodoroRemaining();
  const timeEl = document.querySelector('.pom-ring text:first-of-type');
  if (timeEl) timeEl.textContent = fmtTime(rem);
}

let audioCtx = null, noiseNodes = [];
function playWhiteNoise(type) {
  stopWhiteNoise();
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (type === 'rain') {
    const bufferSize = 2 * audioCtx.sampleRate, noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate), output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) { const white = Math.random() * 2 - 1; output[i] = (lastOut + (0.02 * white)) / 1.02; lastOut = output[i]; output[i] *= 3.5; }
    const node = audioCtx.createBufferSource(); node.buffer = noiseBuffer; node.loop = true;
    const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 400;
    const gain = audioCtx.createGain(); gain.gain.value = 0.5;
    node.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    node.start(); noiseNodes.push(node);
    showToast('🌧 เสียงฝนตก เริ่มแล้ว');
  } else if (type === 'cafe') {
    const bufferSize = 2 * audioCtx.sampleRate, noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate), output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) { const white = Math.random() * 2 - 1; output[i] = (lastOut + (0.02 * white)) / 1.02; lastOut = output[i]; output[i] *= 3.5; }
    const node = audioCtx.createBufferSource(); node.buffer = noiseBuffer; node.loop = true;
    const filter1 = audioCtx.createBiquadFilter(); filter1.type = 'lowpass'; filter1.frequency.value = 200;
    const gain1 = audioCtx.createGain(); gain1.gain.value = 0.3;
    node.connect(filter1); filter1.connect(gain1); gain1.connect(audioCtx.destination);
    const filter2 = audioCtx.createBiquadFilter(); filter2.type = 'bandpass'; filter2.frequency.value = 1000; filter2.Q.value = 0.5;
    const gain2 = audioCtx.createGain(); gain2.gain.value = 0.15;
    node.connect(filter2); filter2.connect(gain2); gain2.connect(audioCtx.destination);
    node.start(); noiseNodes.push(node);
    showToast('☕ เสียงคาเฟ่ เริ่มแล้ว');
  } else if (type === 'lofi') {
    [261.63, 329.63, 392.00, 493.88].forEach(freq => {
      const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      const gain = audioCtx.createGain(); gain.gain.value = 0.05;
      const lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.1;
      const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain); lfoGain.connect(gain.gain);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); lfo.start(); noiseNodes.push(osc, lfo);
    });
    const bufferSize = 2 * audioCtx.sampleRate, noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate), output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() > 0.99 ? Math.random() * 0.5 : 0; }
    const crackle = audioCtx.createBufferSource(); crackle.buffer = noiseBuffer; crackle.loop = true;
    const crackleGain = audioCtx.createGain(); crackleGain.gain.value = 0.08;
    crackle.connect(crackleGain); crackleGain.connect(audioCtx.destination);
    crackle.start(); noiseNodes.push(crackle);
    showToast('🎵 เสียงดนตรี Lo-fi เริ่มแล้ว');
  }
}
function stopWhiteNoise() {
  noiseNodes.forEach(n => { try { n.stop(); } catch (e) { } }); noiseNodes = [];
  if (audioCtx) try { audioCtx.close(); audioCtx = null; } catch (e) { }
}



window.renderCourseHubUI_Original = (courseId) => {
  const allCourses = Object.values(state.courses).flat();
  const c = allCourses.find(x => x.id === courseId);
  if (!c) return;

  const now = new Date();
  const dayIdx = now.getDay();
  const h = now.getHours();
  const m = now.getMinutes();
  const currentTimeVal = h + (m / 60);
  const activeSlot = (c.schedules || []).find(s => s.day === dayIdx && currentTimeVal >= s.startHour && currentTimeVal < s.endHour);
  const timeSinceStartMins = activeSlot ? (currentTimeVal - activeSlot.startHour) * 60 : -1;
  const attToday = state.attendanceHistory[courseId]?.[now.toISOString().split('T')[0]];
  const sos = analyzeSOS(courseId);
  const reflection = getReflectionText(courseId);

  let attUI = '';
  if (!activeSlot) {
    attUI = `<div class="glass-warn nb-card" style="text-align:center; padding:20px;">⌛ ยังไม่ถึงเวลาคลาสเรียน</div>`;
  } else if (attToday) {
    attUI = `<div class="nb-card" style="background:var(--c-lime); color:white; text-align:center; padding:20px;">✅ เช็คชื่อเรียบร้อย! (${attToday.status})</div>`;
  } else if (timeSinceStartMins <= 15) {
    attUI = `<button class="nb-btn-primary full" style="padding:15px;" id="finalCheckinBtn">🚀 ยืนยันการเข้าเรียน (Smart Check-in)</button>`;
  } else {
    attUI = `<div class="nb-card" style="padding:15px; border-color:var(--c-rust); text-align:center;">🚨 เลยเวลา 15 นาทีแล้ว! (สาย)</div>`;
  }

  openModal(`Advanced: ${c.code}`, `
        <div class="form-grid">
          <div class="section-hd">📍 Attendance Control</div>
          ${attUI}
          <div class="section-hd">🟢 Topic Mastery</div>
          <div class="glass-card nb-card" style="padding:15px;">${renderTopicMastery(courseId)}</div>
          <div class="section-hd">📉 Grade Impact Analysis</div>
          <div class="glass-card nb-card" style="padding:15px;">
            <div id="gradeStructureArea">${renderGradeStructure(courseId)}</div>
            <div style="margin-top:10px; font-weight:700;">Strategic Recommendation: ${sos?.recommend}</div>
          </div>
          <div class="section-hd">🚨 Persistence Reflection</div>
          <textarea class="refl-box nb-input" id="reflInput_adv" style="min-height:100px;">${reflection}</textarea>
        </div>
      `, `<button class="nb-btn-primary full" id="saveAdvHubBtn">บันทึก & กลับ</button>`);

  const finalBtn = document.getElementById('finalCheckinBtn');
  if (finalBtn) {
    finalBtn.onclick = async () => {
      if (c.mode === 'hybrid') {
        openModal('🤔 เลือกรูปแบบการเข้าเรียน', `
          <div style="text-align:center; padding:15px;">
            <p style="margin-bottom:20px; color:var(--text-main);">วิชานี้เป็นแบบ Hybrid วันนี้คุณเข้าเรียนรูปแบบใด?</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <button class="btn-pastel-primary full" style="border-radius:10px; padding:12px;" onclick="closeModal(); setAttendanceStatus('${courseId}', 'เข้าเรียน (Onsite)')">📍 เข้าเรียน (Onsite) - เปิด GPS</button>
              <button class="btn-glass full" style="border-radius:10px; padding:12px;" onclick="closeModal(); setAttendanceStatus('${courseId}', 'เข้าเรียน (Online)')">💻 เข้าเรียน (Online) - ไม่ใช้ GPS</button>
            </div>
          </div>
        `);
      } else if (c.mode === 'onsite') {
        await setAttendanceStatus(courseId, 'เข้าเรียน (Onsite)');
      } else {
        await setAttendanceStatus(courseId, 'เข้าเรียน (Online)');
      }
    };
  }

  document.getElementById('saveAdvHubBtn').onclick = async () => {
    const val = document.getElementById('reflInput_adv').value.trim();
    if (!val) { showToast('⚠️ กรุณากรอกเนื้อหา', 'err'); return; }
    await saveReflectionData(courseId, val);
    showToast('✅ บันทึก Reflection สำเร็จ!');
    renderCourseHub(courseId);
  };
}

function startHyperNotifications() {
  if (state.hyperNotifInterval) clearInterval(state.hyperNotifInterval);
  state.notifiedEvents = state.notifiedEvents || new Set();
  
  state.hyperNotifInterval = setInterval(() => {
    const now = new Date();
    const todayIdx = (now.getDay() + 6) % 7; // Mon=0
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const todayKey = now.toLocaleDateString('en-CA');

    // 1. Academic Events (Courses)
    const currentSem = typeof getCurrentSemester === 'function' ? getCurrentSemester() : null;
    const activeCourses = currentSem && state.courses[currentSem.id] ? state.courses[currentSem.id] : [];
    activeCourses.forEach(c => {
      (c.schedules || []).forEach(s => {
        if (s.day !== todayIdx) return;
        const startMin = Math.floor(s.startHour * 60);
        const endMin = Math.floor((s.endHour || s.startHour + 3) * 60);
        const diff = startMin - nowMin;

        // 30-minute warning
        if (diff === 30) {
          pushNotif(`📅 อีก 30 นาทีเรียน: ${c.nameTh}`, `📍 ห้อง ${c.room || 'ไม่ระบุ'}`);
        }
        // 10-minute urgent
        if (diff === 10) {
          pushNotif(`⚡ ด่วน! อีก 10 นาทีเข้าเรียน: ${c.nameTh}`, `เตรียมตัวให้พร้อมนะครับ`);
        }
        // Start time
        const eventKeyStart = `start_${c.id}_${todayKey}`;
        if (diff === 0 && !state.notifiedEvents.has(eventKeyStart)) {
          pushNotif(`📍 ถึงเวลาเรียน ${c.nameTh}`, `เปิดแอปเพื่อเช็คชื่อ (Smart Check-in)`);
          window.showCheckinBanner(c);
          state.notifiedEvents.add(eventKeyStart);
        }

        // Mid-class Reflection Preparation (10 min before end)
        if (nowMin === endMin - 10) {
          pushNotif(`📝 เตรียม Reflection: ${c.nameTh}`, `อีก 10 นาทีหมดคาบ สรุปสิ่งที่ได้เรียนรู้กันครับ`);
        }

        // Class Ended
        const eventKeyEnd = `end_${c.id}_${todayKey}`;
        if (nowMin === endMin && !state.notifiedEvents.has(eventKeyEnd)) {
          pushNotif(`✅ จบการเรียน: ${c.nameTh}`, `อย่าลืมบันทึก Reflection เพื่อเก็บคะแนน Topic Mastery`);
          state.notifiedEvents.add(eventKeyEnd);
        }

        // Persistent Reminder (30 min after end if no reflection)
        if (nowMin === endMin + 30) {
          const refl = getReflectionText(c.id);
          if (!refl || refl.trim().length < 10) {
            pushNotif(`⚠️ ยังไม่ได้บันทึก Reflection: ${c.nameTh}`, `รีบบันทึกตอนนี้ก่อนจะลืมเนื้อหานะครับ`);
          }
        }

        // Auto-Check-in Banner
        if (diff <= 0 && nowMin < endMin) {
          const attended = state.attendanceHistory?.[c.id]?.[todayKey];
          if (!attended) window.showCheckinBanner(c);
        }
      });
    });

    // 2. High Frequency Day-0 Reminders
    if (now.getMinutes() % 20 === 0) { // Every 20 mins
      Object.values(state.exams).flat()
        .filter(e => getDaysUntil(e.date) === 0)
        .forEach(e => {
          const [h, m] = (e.time || '23:59').split(':').map(Number);
          if (nowMin < (h * 60 + m)) {
            pushNotif(`⏰ สอบวันนี้! ${e.name}`, `เวลา ${e.time} น. เตรียมตัวให้พร้อม`);
          }
        });
    }
  }, 60000); // Check every minute


  if (state.hyperSyncInterval) clearInterval(state.hyperSyncInterval);
  state.hyperSyncInterval = setInterval(() => syncDataToBackend(), 1800000);
}

function syncDataToBackend() {
  let projectedGPA = 0;
  let totalCredits = 0;
  let totalPoints = 0;
  const GRADE_MAP = { 'A': 4, 'B+': 3.5, 'B': 3, 'C+': 2.5, 'C': 2, 'D+': 1.5, 'D': 1, 'F': 0 };

  Object.values(state.courses || {}).flat().forEach(function (c) {
    if (c.grade && GRADE_MAP[c.grade] !== undefined) {
      const cr = parseInt(c.credits) || 3;
      totalPoints += GRADE_MAP[c.grade] * cr;
      totalCredits += cr;
    }
  });
  if (totalCredits > 0) projectedGPA = totalPoints / totalCredits;

  const todayStr = new Date().toDateString();
  const todayExp = (state.expenses || [])
    .filter(function (e) { return new Date(e.date).toDateString() === todayStr; })
    .reduce(function (sum, e) { return sum + (e.amount || 0); }, 0);

  const payload = {
    projectedGPA,
    dailyExp: todayExp,
    alarms: (state.alarms || []).filter(a => a.enabled && !a.isSnooze)
      .map(a => ({ id: a.id, time: a.time, label: a.label, repeat: a.repeat || [] })),
    gpaGoal: parseFloat(state.gpaGoal) || 3.5,
    budget: parseFloat(state.dailyBudget) || 200,
    timestamp: Date.now()
  };

  if (typeof google !== 'undefined' && google.script) {
    google.script.run
      .withFailureHandler(function (e) { console.warn('sync failed:', e); })
      .syncAcademicData(payload);
  }
}

function attachAllEvents() {
  document.getElementById('saveCalendarBtn')?.addEventListener('click', async () => {
    const settings = {
      semesterStart: document.getElementById('cal-start')?.value,
      withdrawDeadline: document.getElementById('cal-withdraw')?.value,
      midtermStart: document.getElementById('cal-midterm')?.value,
      finalStart: document.getElementById('cal-final')?.value
    };
    await fsSet('app_settings', 'calendar', settings);
    state.calendarSettings = settings;
    localStorage.setItem('calendar_settings', JSON.stringify(settings));
    showToast('✅ บันทึกปฏิทินแล้ว');
    render();
  });

  document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
    state.view = b.dataset.nav;
    document.getElementById('fullMenu')?.classList.remove('show');
    render();
  });

  document.getElementById('navMenuBtn')?.addEventListener('click', () => document.getElementById('fullMenu')?.classList.add('show'));
  document.getElementById('closeMenuBtn')?.addEventListener('click', () => document.getElementById('fullMenu')?.classList.remove('show'));

  document.getElementById('modalX')?.addEventListener('click', closeModal);
  document.getElementById('modalBd')?.addEventListener('click', e => { if (e.target.id === 'modalBd') closeModal(); });
  document.getElementById('darkToggle')?.addEventListener('click', () => {
    state.darkMode = !state.darkMode; localStorage.setItem('darkMode', state.darkMode);
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light'); render();
  });

  let fabOpen = false;
  document.getElementById('fabBtn')?.addEventListener('click', () => {
    fabOpen = !fabOpen;
    document.getElementById('fabMenu')?.classList.toggle('open', fabOpen);
  });
  document.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => {
    fabOpen = false; document.getElementById('fabMenu')?.classList.remove('open');
    if (b.dataset.quick === 'assignment') openAddAssignmentForm();
    else if (b.dataset.quick === 'exam') openAddExamForm();
    else if (b.dataset.quick === 'course') { if (state.semesters.length === 0) { showToast('⚠️ เพิ่มเทอมก่อนนะ', 'err'); return; } openAddCourseForm(); }
    else if (b.dataset.quick === 'planner') openAddPlannerTask();
  });

  document.getElementById('globalSearch')?.addEventListener('input', e => { state.searchQuery = e.target.value; render(); });
  document.getElementById('clearSearch')?.addEventListener('click', () => { state.searchQuery = ''; render(); });

  document.getElementById('addSemBtn')?.addEventListener('click', () => openAddSemesterForm());
  document.getElementById('importCalBtn')?.addEventListener('click', () => openAddSemesterForm());
  document.querySelectorAll('[data-edit-sem]').forEach(b => b.onclick = () => { const s = state.semesters.find(x => x.id === b.dataset.editSem); openAddSemesterForm(s); });
  document.querySelectorAll('[data-del-sem]').forEach(b => b.onclick = async () => { if (confirm('ลบเทอมนี้?')) { await fsDel('semesters', b.dataset.delSem); await loadAll(); showToast('🗑 ลบเทอมแล้ว'); } });
  document.querySelectorAll('[data-view-sem]').forEach(b => b.onclick = () => { state.selectedSemester = b.dataset.viewSem; state.view = 'courses'; render(); });

  document.getElementById('viewCurrentCourseBtn')?.addEventListener('click', () => { state.courseView = 'current'; render(); });
  document.getElementById('viewArchiveCourseBtn')?.addEventListener('click', () => { state.courseView = 'archive'; render(); });
  document.getElementById('courseLocalSearch')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.folder-card:not(.add-folder)').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? 'flex' : 'none';
    });
  });
  document.getElementById('semFilterCourse')?.addEventListener('change', e => { state.selectedSemester = e.target.value; render(); });

  document.getElementById('schedSemFilter')?.addEventListener('change', e => { state.selectedSemester = e.target.value; render(); });
  document.getElementById('exportSchedBtn')?.addEventListener('click', async () => {
    const el = document.getElementById('timetable');
    if (el && typeof html2canvas !== 'undefined') {
      showToast('⏳ กำลังประมวลผลรูปภาพ...');
      el.classList.add('export-mode'); // Apply solid colors for clean export
      // Wait a moment for styles to apply
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(el, { backgroundColor: '#0f172a', scale: 3, useCORS: true, logging: false });
      el.classList.remove('export-mode');
      
      const link = document.createElement('a');
      link.download = `Schedule_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('✅ บันทึกตารางเรียนแล้ว');
    } else {
      showToast('❌ ไม่สามารถสร้างรูปได้ (html2canvas not loaded)', 'err');
    }
  });

  document.getElementById('addAssignBtn')?.addEventListener('click', () => { if (Object.values(state.courses).flat().length === 0) { showToast('⚠️ เพิ่มวิชาก่อนนะ', 'err'); return; } openAddAssignmentForm(); });
  document.querySelectorAll('[data-toggle-assign]').forEach(b => b.onclick = async () => {
    const id = b.dataset.toggleAssign;
    const a = Object.values(state.assignments).flat().find(x => x.id === id);
    if (a) { await fsUpd('assignments', id, { submitted: !a.submitted, status: !a.submitted ? 'ส่งแล้ว' : 'ยังไม่เริ่ม' }); await loadAll(); }
  });
  document.querySelectorAll('[data-del-assign]').forEach(b => b.onclick = async () => {
    const id = b.dataset.delAssign;
    const a = Object.values(state.assignments).flat().find(x => x.id === id);
    if (confirm('ลบงานนี้?')) {
      if (a?.calendarEventId && typeof google !== 'undefined' && google.script) {
        const curSem = getCurrentSemester() || state.semesters[state.semesters.length - 1];
        if (curSem) google.script.run.deleteCalendarEvent(`NITIPAT MANAGER - ${curSem.name}`, a.calendarEventId);
      }
      if (a?.folderId && typeof google !== 'undefined' && google.script && google.script.run) {
        showToast('🗑️ กำลังลบโฟลเดอร์การบ้านใน Google Drive...');
        google.script.run.deleteAssignmentFolder(a.folderId);
      }
      await fsDel('assignments', id); await loadAll();
    }
  });
  document.querySelectorAll('[data-edit-assign]').forEach(b => b.onclick = () => {
    const a = Object.values(state.assignments).flat().find(x => x.id === b.dataset.editAssign);
    if (a) openAddAssignmentForm(a);
  });
  document.querySelectorAll('[data-assign-view]').forEach(b => b.onclick = () => { state.assignView = b.dataset.assignView; render(); });
  document.getElementById('addExamBtn')?.addEventListener('click', () => { if (Object.values(state.courses).flat().length === 0) { showToast('⚠️ เพิ่มวิชาก่อนนะ', 'err'); return; } openAddExamForm(); });
  document.querySelectorAll('[data-del-exam]').forEach(b => b.onclick = async () => {
    const id = b.dataset.delExam;
    const e = Object.values(state.exams).flat().find(x => x.id === id);
    if (confirm('ลบการสอบนี้?')) {
      if (e?.calendarEventId && typeof google !== 'undefined' && google.script) {
        const curSem = getCurrentSemester() || state.semesters[state.semesters.length - 1];
        if (curSem) google.script.run.deleteCalendarEvent(`NITIPAT MANAGER - ${curSem.name}`, e.calendarEventId);
      }
      await fsDel('exams', id); await loadAll();
    }
  });
  document.querySelectorAll('[data-edit-exam]').forEach(b => b.onclick = () => {
    const e = Object.values(state.exams).flat().find(x => x.id === b.dataset.editExam);
    if (e) openAddExamForm(e);
  });

  document.getElementById('exportGradeBtn')?.addEventListener('click', exportGradeReport);
  document.querySelectorAll('.grade-select-inline').forEach(sel => sel.onchange = async () => {
    await fsUpd('courses', sel.dataset.courseId, { grade: sel.value }); await loadAll();
  });

  document.getElementById('calcTargetBtn')?.addEventListener('click', () => {
    const target = parseFloat(document.getElementById('targetGPA')?.value);
    if (isNaN(target)) return;
    const res = suggestGradesForTarget(target);
    const el = document.getElementById('targetResult');
    if (res.error) el.innerHTML = `<div class="glass-danger" style="font-size:12px; margin-top:8px;">❌ ${res.error}</div>`;
    else {
      el.innerHTML = `
        <div class="glass-card" style="margin-top:10px; background:rgba(132,204,22,0.05); border-left:4px solid var(--c-lime);">
          <div style="font-size:12px; font-weight:700;">ต้องทำเกรดเฉลี่ยเทอมนี้ให้ได้: <span style="color:var(--c-lime); font-size:16px;">${res.avg}</span></div>
          <div style="font-size:11px; margin-top:6px; opacity:0.8;">
            ${res.suggestion.map(s => `• ${s.code}: อย่างน้อยเกรด <strong>${s.suggest}</strong>`).join('<br>')}
          </div>
        </div>`;
    }
  });
  document.getElementById('simBtn')?.addEventListener('click', () => {
    const simRows = document.querySelectorAll('.sim-row');
    const simulated = Array.from(simRows).map(row => ({
      courseId: row.dataset.cid,
      grade: row.querySelector('select').value
    }));
    const newGPA = calcWhatIf(simulated);
    const el = document.getElementById('simResult');
    el.innerHTML = `<div style="font-size:24px; font-weight:800; color:var(--c-accent); text-align:center;">${newGPA}</div>`;
  });

  document.getElementById('radioToggleBtn')?.addEventListener('click', () => {
    if (Radio.isPlaying) {
      Radio.stopAll();
    } else {
      Radio.onPomodoroStart();
    }
    render();
  });

  document.getElementById('focusCourseSelect')?.addEventListener('change', e => {
    state.selectedFocusCourseId = e.target.value;
  });
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.onclick = () => {
      state.pomodoroWork = parseInt(btn.dataset.work);
      state.pomodoroBreak = parseInt(btn.dataset.break);
      localStorage.setItem('pomodoroWork', state.pomodoroWork);
      localStorage.setItem('pomodoroBreak', state.pomodoroBreak);
      render();
    };
  });
  document.getElementById('focusRainBtn')?.addEventListener('click', () => playWhiteNoise('rain'));
  document.getElementById('focusCafeBtn')?.addEventListener('click', () => playWhiteNoise('cafe'));
  document.getElementById('focusStopNoiseBtn')?.addEventListener('click', () => stopWhiteNoise());
  // Remove old file input logic

  document.getElementById('startImmersiveFocusBtn')?.addEventListener('click', async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => console.warn("Fullscreen denied"));
      }
    } catch (e) { console.warn("Fullscreen not supported"); }
    await startPomodoro();
  });
  document.getElementById('pausePomBtn')?.addEventListener('click', () => {
    if (state.pomodoroTimer) {
      const now = Date.now();
      state.pomodoroTimeRemaining = Math.max(0, Math.round((state.pomodoroEndTime - now) / 1000));
      clearInterval(state.pomodoroTimer);
      state.pomodoroTimer = null;
      state.pomodoroActive = false;
      Radio.onPomodoroPause();
    } else {
      startPomodoro();
      if (state.pomodoroPhase === 'work') Radio.onResume();
    }
    render();
  });
  document.getElementById('stopPomBtn')?.addEventListener('click', () => {
    if (confirm("⚠️ EXTREME WARDEN WARNING ⚠️\\nการกดยกเลิกกลางคัน จะถูกปรับลด Focus Score -50 และหักเงิน MoneyPod 100 บาท!\\nยืนยันจะยอมแพ้และเสียเงินหรือไม่?")) {
      state.focusScore = (state.focusScore || 0) - 50;
      if (!state.expenses) state.expenses = [];
      state.expenses.push({ id: 'pom_fail_' + Date.now().toString(), amount: 100, category: 'penalty', date: new Date().toISOString(), note: 'ค่าปรับยอมแพ้ Focus' });
      localStorage.setItem('expenses', JSON.stringify(state.expenses));
      showToast('❌ คุณยอมแพ้! ถูกหัก 100 บาท', 'err');
      if (window.customFocusAudio) { window.customFocusAudio.pause(); window.customFocusAudio = null; }
      stopPomodoro(true);
    }
  });




  document.getElementById('addMusicBtn')?.addEventListener('click', () => {
    const url = document.getElementById('newMusicUrl').value.trim();
    if (url && url.includes('dropbox.com')) {
      const finalUrl = url.replace('dl=0', 'dl=1');
      state.customMusicUrls.push(finalUrl);
      localStorage.setItem('custom_music_urls', JSON.stringify(state.customMusicUrls));
      render();
      showToast('✅ เพิ่มเพลงเรียบร้อย');
    } else {
      showToast('⚠️ กรุณาใช้ลิงก์ Dropbox', 'err');
    }
  });
  window.removeCustomMusic = (idx) => {
    state.customMusicUrls.splice(idx, 1);
    localStorage.setItem('custom_music_urls', JSON.stringify(state.customMusicUrls));
    render();
  };

  document.getElementById('settingDarkMode')?.addEventListener('click', () => { state.darkMode = !state.darkMode; localStorage.setItem('darkMode', state.darkMode); document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light'); render(); });


  document.getElementById('savePinBtn')?.addEventListener('click', async () => {
    const pin = document.getElementById('pinInput')?.value;
    if (pin && pin.length === 6) {
      // Generate a cryptographically secure random 16-byte salt
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      const salt = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const hashed = await hashPIN(pin, salt);
      setDoc(doc(db, 'app_settings', 'security'), { 
        global_pin: hashed,
        pin_salt: salt
      }).then(() => {
        state.pin = hashed;
        state.pinSalt = salt;
        showToast('🔒 ตั้งรหัส PIN (PBKDF2 Secured) สำเร็จแล้ว');
        render();
      });
    } else {
      showToast('⚠️ กรุณากรอกรหัส PIN ให้ครบ 6 หลัก', 'err');
    }
  });
  document.getElementById('removePinBtn')?.addEventListener('click', () => {
    if (confirm('ต้องการยกเลิกรหัส PIN ใช่หรือไม่?')) {
      setDoc(doc(db, 'app_settings', 'security'), { global_pin: null, pin_salt: null }).then(() => {
        state.pin = null;
        state.pinSalt = 'NITIPAT_SALT_DEFAULT';
        state.isLocked = false;
        showToast('🔓 ยกเลิกรหัส PIN แล้ว');
        render();
      });
    }
  });
  document.getElementById('exportAllBtn')?.addEventListener('click', () => {
    const data = { semesters: state.semesters, courses: state.courses, assignments: state.assignments, exams: state.exams };
    const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `nitipat_backup_${Date.now()}.json`; a.click();
  });
  document.getElementById('clearCacheBtn')?.addEventListener('click', () => { if (confirm('ล้าง local cache? (ข้อมูล Firebase ยังอยู่)')) localStorage.clear(); showToast('🗑 ล้าง cache แล้ว'); });

  // Panic Button
  document.getElementById('panicBtn')?.addEventListener('click', () => {
    openModal('🆘 Panic Button', `
      <div class="panic-screen">
        <div class="panic-icon">💙</div>
        <div class="panic-msg">หายใจเข้าลึกๆ คุณผ่านมาถึงตรงนี้ได้แล้ว<br>นั่นแปลว่าคุณแข็งแกร่งกว่าที่คิด</div>
        <div class="panic-contacts">
          <a href="tel:02-5620188" class="panic-contact-btn">📞 กองแนะแนว มก. 02-562-0188</a>
          <a href="tel:1323" class="panic-contact-btn">📞 กรมสุขภาพจิต 1323</a>
          <a href="tel:02-7136793" class="panic-contact-btn">📞 สายด่วนวัยรุ่น 02-713-6793</a>
        </div>
        <div class="panic-quote">"${getTodayQuote()}"</div>
      </div>`
    );
  });


  if (state.view === 'trial-reg') {
    if (typeof attachTrialRegEvents === 'function') {
      attachTrialRegEvents();
    }
  }
}

function renderCourseHub(courseId) {
  state.activeCourseId = courseId;
  state.view = 'course-hub';
  state.activeHubTab = 'Grades';
  state.driveBreadcrumbs = [];
  state.currentFolderId = null;
  render();

  const c = findCourseById(courseId);
  if (c && c.driveId) {
    if (typeof refreshDriveFiles === 'function') {
      refreshDriveFiles(courseId, c.driveId);
    }
  }
}