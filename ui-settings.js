// ══════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════
function renderSettings() {
  return `<div class="page-wrap">
    <div class="page-header"><h1 class="page-title">⚙️ ตั้งค่า</h1></div>

  <div class="settings-card" style="margin-bottom:15px; border-left: 4px solid #000;">
    <div style="font-weight:700; font-size:16px; margin-bottom:10px;">การตั้งค่าระบบ</div>

  <div class="settings-card" style="margin-bottom:15px;">
    <div style="font-size:16px; font-weight:700; margin-bottom:10px;">🔔 การแจ้งเตือนระบบ</div>
    <div class="settings-row" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
      <div class="settings-label">
        <div style="font-weight:600; font-size:14px;">Browser Push Notification</div>
        <div style="font-size:12px; color:var(--c-muted); margin-top:4px;">รับการแจ้งเตือนเดดไลน์และสอบ (Local & Web Push)</div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn-glass sm" onclick="checkFcmStatus()">🔍 เช็คสถานะ</button>
        <button class="btn-glass-primary sm" onclick="requestNotificationPermission()">เปิดใช้งาน</button>
      </div>
    </div>
  </div>

    <div class="glass-card settings-block">
      <div class="setting-row">
        <span>🌙 Dark Mode</span>
        <button class="toggle-btn ${state.darkMode ? 'on' : ''}" id="settingDarkMode">${state.darkMode ? 'ON' : 'OFF'}</button>
      </div>
      <div class="setting-row">
        <span>🔒 ตั้งรหัส PIN (6 หลัก)</span>
        <div class="pin-setup-row">
          <input type="password" class="glass-input sm" id="pinInput" placeholder="รหัส 6 หลัก" maxlength="6" value="${state.pin || ''}">
          <button class="btn-glass sm" id="savePinBtn">💾</button>
          ${state.pin ? `<button class="btn-glass danger sm" id="removePinBtn">ลบ</button>` : ''}
        </div>
      </div>
    </div>

    <div class="glass-card settings-block">
      <div class="setting-title">🪪 บัตรประจำตัวนักเรียน</div>
      <div style="font-size:11px; color:var(--c-muted); margin-bottom:12px;">อัปโหลดรูปหน้าบัตรเพื่อใช้แสดงในหน้าล็อกและตรวจสอบข้อมูล</div>
      <div class="setting-row" style="flex-direction:column; align-items:flex-start; gap:10px;">
        <div style="display:flex; gap:10px; width:100%; align-items:center;">
          <input type="file" id="idCardUpload" accept="image/*" style="display:none;" onchange="handleIdCardUpload(this)">
          <button class="btn-glass-primary full sm" onclick="document.getElementById('idCardUpload').click()">📤 อัปโหลดรูปบัตร</button>
          ${state.idCardPhoto ? `<button class="btn-glass danger sm" onclick="removeIdCard()">🗑</button>` : ''}
        </div>
        ${state.idCardPhoto ? `<img src="${state.idCardPhoto}" style="width:100%; border-radius:8px; border:1px solid var(--c-border); margin-top:5px;">` : ''}
      </div>
    </div>
    <div class="glass-card settings-block">
      <div class="setting-title">📤 ข้อมูล</div>
      <div class="setting-row"><button class="btn-glass" id="exportAllBtn">📥 Export JSON</button></div>
      <div class="setting-row"><button class="btn-glass danger" id="clearCacheBtn">🗑 ล้างข้อมูล Local Cache</button></div>
    </div>


    <div class="glass-card settings-block" style="border: 1.5px solid rgba(239, 68, 68, 0.25); background: rgba(239, 68, 68, 0.04); box-shadow: 0 4px 15px rgba(239,68,68,0.05);">
      <div class="setting-title" style="color: #ef4444; font-weight:700;">🚪 บัญชีผู้ใช้งาน</div>
      <div class="setting-row" style="margin-top: 5px;">
        <button class="btn-glass danger full" onclick="logoutApp()" style="font-weight:700; width:100%; border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.1); color: #ef4444; text-shadow:none;">🚪 ออกจากระบบ (ล็อกแอป)</button>
      </div>
    </div>
    <div class="glass-card settings-block">
      <div class="setting-title">ℹ️ เกี่ยวกับระบบ</div>
      <div class="setting-row"><span>นิสิต</span><span>${STUDENT.nameTh}</span></div>
      <div class="setting-row"><span>รหัสนิสิต</span><span class="mono-sm">${STUDENT.id}</span></div>
      <div class="setting-row"><span>สาขา</span><span>${STUDENT.major}</span></div>
      <div class="setting-row"><span>NITIPAT MANAGER</span><span>v2.0 — Firebase Edition</span></div>
    </div>
  </div>`;
}

window.handleIdCardUpload = async (input) => {
  const file = input.files[0];
  if (!file) return;
  if (!window.uploadToFirebaseStorage) {
    alert("Firebase Storage ไม่พร้อมใช้งาน");
    return;
  }

  showToast('📤 กำลังอัปโหลดรูปบัตร...', 'info');
  try {
    const ext = file.name.split('.').pop();
    const path = `idcards/${Date.now()}_idcard.${ext}`;
    const url = await window.uploadToFirebaseStorage(file, path);
    state.idCardPhoto = url;
    await fsSet('app_settings', 'profile', { idCardPhoto: url, studentPhoto: STUDENT.photoUrl });
    showToast('✅ อัปโหลดรูปบัตรสำเร็จ');
    render();
  } catch (err) {
    showToast(`❌ อัปโหลดไม่สำเร็จ: ${err.message}`, 'err');
  }
};

window.removeIdCard = async () => {
  if (!confirm('ยืนยันลบรูปบัตรนิสิต?')) return;
  showToast('🗑 กำลังลบรูปบัตร...', 'info');
  try {
    if (state.idCardPhoto && window.deleteFromFirebaseStorage) {
      await window.deleteFromFirebaseStorage(state.idCardPhoto);
    }
    state.idCardPhoto = null;
    await fsSet('app_settings', 'profile', { idCardPhoto: null, studentPhoto: STUDENT.photoUrl });
    showToast('✅ ลบรูปบัตรแล้ว');
    render();
  } catch (err) {
    showToast(`❌ ลบไม่สำเร็จ: ${err.message}`, 'err');
  }
};


window.renderCalendar = function() {
  const settings = state.calendarSettings || {};
  return `<div class="page-wrap">
    <div class="page-header"><h1 class="page-title">🗓 ตั้งค่าปฏิทินการศึกษา</h1></div>
    
    <div class="glass-card">
      <div class="form-grid">
        <div class="fg"><label>วันเปิดเทอม (Start Semester)</label>
          <input type="date" class="glass-input" id="cal-start" value="${settings.semesterStart || ''}"></div>
        <div class="fg"><label>วันสิ้นสุดเทอม (End Semester)</label>
          <input type="date" class="glass-input" id="cal-end" value="${settings.semesterEnd || ''}"></div>
        <div class="fg"><label>วันถอนวิชา (Withdraw Deadline)</label>
          <input type="date" class="glass-input" id="cal-withdraw" value="${settings.withdrawDeadline || ''}"></div>
        <div class="fg"><label>วันเริ่มสอบกลางภาค (Midterm Start)</label>
          <input type="date" class="glass-input" id="cal-midterm" value="${settings.midtermStart || ''}"></div>
        <div class="fg"><label>วันเริ่มสอบปลายภาค (Final Start)</label>
          <input type="date" class="glass-input" id="cal-final" value="${settings.finalStart || ''}"></div>
      </div>
      <div style="margin-top:20px;">
        <button class="btn-glass-primary full" id="saveCalendarBtn">💾 บันทึกการตั้งค่าปฏิทิน</button>
      </div>
    </div>

    <div class="glass-card" style="margin-top:20px;">
      <div class="widget-title">⏳ นับถอยหลัง</div>
      <div class="countdown-row">
        ${settings.withdrawDeadline ? `<div>📌 ถอนรายวิชาใน: <strong>${getDaysUntil(settings.withdrawDeadline)} วัน</strong></div>` : ''}
        ${settings.finalStart ? `<div>📝 สอบปลายภาคใน: <strong>${getDaysUntil(settings.finalStart)} วัน</strong></div>` : ''}
      </div>
    </div>
  </div>`;
};
