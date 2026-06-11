// ══════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════
function renderSettings() {
  return `<div class="page-wrap">
    <div class="page-header"><h1 class="page-title">⚙️ ตั้งค่า</h1></div>
    <div class="settings-card">
    <div class="settings-label">
      <div style="font-weight:600; font-size:14px;">🛠 ระบบหลังบ้าน & Debug</div>
      <div style="font-size:12px; color:var(--c-muted); margin-top:4px;">ตรวจสอบการทำงานของ Trigger และปฏิทิน</div>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn-glass sm" onclick="checkSystemStatus()">🔍 เช็คระบบ</button>
      <button class="btn-glass sm" onclick="google.script.run.setupNotificationTrigger(); showToast('✅ รีเซ็ต Trigger แล้ว');">🔄 รีเซ็ต Trigger</button>
      <button class="btn-glass sm" onclick="testAlarmSound()">🔔 ทดสอบเสียงปลุก</button>
    </div>
  </div>

  <div class="settings-card" style="margin-bottom:15px; border-left: 4px solid #000;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div class="settings-label">
        <div style="font-weight:700; font-size:16px; display:flex; align-items:center; gap:8px;">
          <span style="background:#000; color:#fff; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:4px; font-size:14px;">N</span>
          Notion Integration
        </div>
        <div style="font-size:12px; color:var(--c-muted); margin-top:4px;">
          เชื่อมต่อข้อมูลรายวิชาและการบ้านกับ Notion Database ของคุณ
        </div>
      </div>
      <div class="status-badge ${state.notionConnected ? 'online' : 'offline'}" style="font-size:10px; padding:4px 8px; border-radius:12px; background:${state.notionConnected ? '#22c55e22' : '#ef444422'}; color:${state.notionConnected ? '#22c55e' : '#ef4444'};">
        ${state.notionConnected ? `Connected: ${state.notionBotName}` : 'Not Connected'}
      </div>
    </div>
    <div style="display:flex; gap:8px; margin-top:15px; flex-wrap:wrap;">
      <button class="btn-glass sm" onclick="NotionHub.checkConnection()">🔄 ตรวจเช็ค</button>
      <button class="btn-glass sm" onclick="NotionHub.sync(true)">⚡ ซิงก์ตอนนี้</button>
      <button class="btn-glass sm" onclick="NotionHub.setupTrigger()">⏰ เปิด Auto-Sync</button>
      <button class="btn-glass sm" style="color:var(--c-red); border-color:rgba(239,68,68,0.2); background:rgba(239,68,68,0.05);" onclick="NotionHub.forceResetSync()">🗑️ บังคับซิงก์ใหม่</button>
    </div>
    
    <div id="notionSetupArea" style="margin-top:15px; padding:10px; background:var(--c-accent)11; border-radius:8px; display:${state.notionConnected ? 'none' : 'block'};">
      <div style="font-size:11px; margin-bottom:8px; font-weight:600;">✨ ยังไม่เคยตั้งค่า? ใส่ Token เพื่อสร้างระบบอัตโนมัติ</div>
      <div style="display:flex; gap:8px;">
        <input type="password" id="notionTokenInput" class="glass-input sm" placeholder="secret_..." style="flex:1;">
        <button class="btn-glass-primary sm" onclick="NotionHub.runSetupWizard()">🚀 เริ่มตั้งค่า</button>
      </div>
    </div>

    <div style="margin-top:12px; font-size:11px; color:var(--c-muted);">
      Last Sync: ${state.lastNotionSync ? new Date(state.lastNotionSync).toLocaleString() : 'Never'}
    </div>
  </div>

  <div class="settings-card" style="margin-bottom:15px; border-left: 4px solid #4285f4;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
      <div class="settings-label" style="flex:1; min-width:200px;">
        <div style="font-weight:700; font-size:16px; display:flex; align-items:center; gap:8px;">
          <span style="font-size:18px;">📅</span>
          Google Calendar Integration
        </div>
        <div style="font-size:12px; color:var(--c-muted); margin-top:4px;">
          เชื่อมตารางเรียน สอบ และงานส่ง ไปยัง Google Calendar (สร้างปฏิทินแยกอัตโนมัติ)
        </div>
      </div>
      <button class="btn-glass-primary sm" onclick="window.syncToGoogleCalendar()" style="background:#4285f4; border-color:#4285f4; color:white; font-weight:700; border-radius:12px; padding:10px 18px;">
        ⚡ ซิงค์ตารางเรียน & งาน
      </button>
    </div>
  </div>

  <div class="settings-card" style="margin-bottom:15px;">
  <div style="font-size:16px; font-weight:700; margin-bottom:10px;">🔔 การแจ้งเตือนระบบ</div>
  <div class="settings-row" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
    <div class="settings-label">
      <div style="font-weight:600; font-size:14px;">Browser Push Notification</div>
      <div style="font-size:12px; color:var(--c-muted); margin-top:4px;">รับการแจ้งเตือนเดดไลน์และ GPA โดยตรงผ่านเบราว์เซอร์นี้</div>
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
    <div class="glass-card settings-block">
      <div class="setting-title">📅 จัดการปฏิทิน (Google Calendar)</div>
      <div style="font-size:11px; color:var(--c-muted); margin-bottom:10px;">ลบปฏิทินของเทอมเก่าๆ เพื่อเคลียร์พื้นที่ใน Google Calendar ของคุณ</div>
      ${state.semesters.map(s => `
        <div class="setting-row">
          <span>เทอม ${s.name}</span>
          <div style="display:flex; gap:8px;">
            <button class="btn-glass sm" onclick="syncAllToCalendar('${s.id}')">🔄 ซิงก์ทั้งหมด</button>
            <button class="btn-glass danger sm" onclick="deleteSemesterCalendar('${s.name}')">🗑 ลบ</button>
          </div>
        </div>
      `).join('') || '<div class="setting-row"><span class="muted">ไม่มีข้อมูลเทอม</span></div>'}

    <div class="glass-card settings-block" style="border: 1.5px solid rgba(139, 92, 246, 0.25); background: rgba(139, 92, 246, 0.04); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.05); margin-bottom:15px;">
      <div class="setting-title" style="color: #8b5cf6; font-weight:700;">🤖 AI Warden (Gemini)</div>
      <div class="setting-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
        <span style="font-size:12px; color:var(--c-muted);">ใส่ API Key จาก Google AI Studio เพื่อใช้งานผู้คุมสุดโหด</span>
        <div style="display:flex; gap:8px; width:100%;">
          <input type="password" id="geminiApiKeyInput" class="glass-input sm" style="flex:1;" value="${localStorage.getItem('gemini_api_key') || ''}" placeholder="AIzaSy...">
          <button class="btn-glass sm" onclick="localStorage.setItem('gemini_api_key', document.getElementById('geminiApiKeyInput').value); if(window.Warden) Warden.apiKey = document.getElementById('geminiApiKeyInput').value; showToast('✅ บันทึก API Key แล้ว')">💾 บันทึก</button>
        </div>
      </div>
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

