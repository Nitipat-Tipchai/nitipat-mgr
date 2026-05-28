// ══════════════════════════════════════════════════
// CALENDAR SETTINGS
// ══════════════════════════════════════════════════
function renderCalendar() {
  const settings = state.calendarSettings || {};
  return `<div class="page-wrap">
    <div class="page-header"><h1 class="page-title">🗓 ตั้งค่าปฏิทินการศึกษา</h1></div>
    
    <div class="glass-card">
      <div class="form-grid">
        <div class="fg"><label>วันเปิดเทอม (Start Semester)</label>
          <input type="date" class="glass-input" id="cal-start" value="${settings.semesterStart || ''}"></div>
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
}
