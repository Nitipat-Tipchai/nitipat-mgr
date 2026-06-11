// ══════════════════════════════════════════════════
// CLUB
// ══════════════════════════════════════════════════
function renderClub() {
  const tasks = state.clubTasks || [];
  return `<div class="page-wrap">
    <div class="page-header-row">
      <div>
        <h1 class="page-title">🏛 งานประธานชุมนุม</h1>
        <div class="page-sub">บันทึกรายการงานที่ต้องจัดการ</div>
      </div>
      <button class="btn-glass-primary" id="addClubTaskBtn">+ เพิ่มงาน</button>
    </div>

    <div class="glass-card nb-card" style="padding:20px;">
      <div style="font-weight:800; font-size:16px; margin-bottom:15px; border-bottom:2px solid black; padding-bottom:10px;">📋 รายการงาน (Checklist)</div>
      <div class="club-task-list" style="display:flex; flex-direction:column; gap:10px;">
        ${tasks.map((t, i) => `
          <div class="club-task-row ${t.done ? 'done' : ''}" style="display:flex; align-items:center; gap:12px; padding:12px; background:white; border:1.5px solid black; border-radius:12px;">
            <button class="check-circle sm ${t.done ? 'checked' : ''}" data-toggle-club="${i}" style="width:28px; height:28px; border-radius:50%; border:2px solid black; background:${t.done ? 'var(--c-indigo)' : 'white'}; color:white; display:flex; align-items:center; justify-content:center; font-weight:800;">${t.done ? '✓' : ''}</button>
            <div style="flex:1;">
              <div style="font-weight:700; font-size:14px; text-decoration:${t.done ? 'line-through' : 'none'}; opacity:${t.done ? 0.5 : 1};">${t.title}</div>
              ${t.note ? `<div style="font-size:11px; opacity:0.6;">${t.note}</div>` : ''}
              ${t.due ? `<div style="font-size:11px; color:var(--c-rust); font-weight:700; margin-top:2px;">📅 กำหนด: ${t.due}</div>` : ''}
            </div>
            <button class="icon-btn danger sm" data-del-club="${i}" style="background:transparent; border:none; color:var(--c-red); font-size:16px;">🗑</button>
          </div>
        `).join('')}
        ${tasks.length === 0 ? '<div class="empty-sm" style="padding:40px;">ยังไม่มีงานที่จดไว้</div>' : ''}
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════
// MONEYPOD STATE PERSISTENCE
// ══════════════════════════════════════════════════
window.saveMoneyPod = saveMoneyPod;

window.mpSearchTags = function() {
  const q = document.getElementById('reportTagSearch')?.value.trim();
  if (!q) return;
  const matches = state.moneyTransactions.filter(t => t.tags && t.tags.includes(q));
  const html = matches.map(t => `<div style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between;"><span>${t.notes} (${t.date})</span><b style="color: #ef4444;">฿${t.amount}</b></div>`).join('');
  openModal('🔍 ผลลัพธ์สำหรับแท็ก ' + q, html || '<div style="padding: 30px; text-align: center; color: #94a3b8;">ไม่พบประวัติสำหรับแท็กนี้</div>');
};

window.mpOpenWalletEditor = function() {
  let bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:16px; max-height: 400px; overflow-y: auto; padding-right: 5px;">
      <p style="font-size:12px; color:#64748b; margin:0 0 8px 0; line-height:1.5;">คุณสามารถปรับเปลี่ยนชื่อกระเป๋าเงิน ยอดเงินคงเหลือปัจจุบัน หรือขีดจำกัดวงเงินเครดิตสำหรับการบันทึกหนี้สิน/ผ่อนชำระ (SPayLater & SEasyCash)</p>
  `;
  
  state.moneyWallets.forEach((w, index) => {
    const isDebt = w.type === 'debt';
    bodyHtml += `
      <div style="background: rgba(0,0,0,0.02); padding: 14px; border-radius: 14px; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 13px; font-weight: 900; color: var(--primary);">${w.type === 'debt' ? '💳 บัญชีวงเงินสินเชื่อ (หนี้สิน)' : '💰 บัญชีเงินเก็บ (สินทรัพย์)'}</span>
          <span style="font-size: 11px; font-weight: 700; color: #94a3b8;">ID: ${w.id.toUpperCase()}</span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="font-size: 10px; font-weight: 800; color: #64748b; display: block; margin-bottom: 4px;">ชื่อบัญชี</label>
            <input type="text" class="glass-input sm" id="editWalletName_${index}" value="${w.name}" style="width: 100%; border-radius: 10px; padding: 6px 10px;">
          </div>
          <div>
            <label style="font-size: 10px; font-weight: 800; color: #64748b; display: block; margin-bottom: 4px;">
              ${isDebt ? 'ยอดใช้ไปแล้ว (บาท)' : 'ยอดเงินคงเหลือ (บาท)'}
            </label>
            <input type="number" class="glass-input sm" id="editWalletBalance_${index}" value="${w.balance}" style="width: 100%; border-radius: 10px; padding: 6px 10px;">
          </div>
        </div>
        
        ${isDebt ? `
        <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
          <div>
            <label style="font-size: 10px; font-weight: 800; color: #64748b; display: block; margin-bottom: 4px;">วงเงินสูงสุด (บาท)</label>
            <input type="number" class="glass-input sm" id="editWalletLimit_${index}" value="${w.limit || 0}" style="width: 100%; border-radius: 10px; padding: 6px 10px;">
          </div>
        </div>
        ` : ''}
      </div>
    `;
  });
  
  bodyHtml += `</div>`;
  
  const footerHtml = `
    <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
      <button class="btn-glass-pastel" onclick="closeModal()" style="padding: 8px 16px; border-radius:10px; font-size:12px;">ยกเลิก</button>
      <button class="btn-pastel-primary" onclick="mpSaveWallets()" style="padding: 8px 20px; border-radius:10px; font-size:12px;">💾 บันทึกข้อมูล</button>
    </div>
  `;
  
  openModal('✏️ ปรับแต่งกระเป๋าเงิน & วงเงิน', bodyHtml, footerHtml);
};

window.mpSaveWallets = function() {
  try {
    state.moneyWallets.forEach((w, index) => {
      const nameInput = document.getElementById(`editWalletName_${index}`);
      const balanceInput = document.getElementById(`editWalletBalance_${index}`);
      const limitInput = document.getElementById(`editWalletLimit_${index}`);
      
      if (nameInput) w.name = nameInput.value.trim() || w.name;
      if (balanceInput) w.balance = parseFloat(balanceInput.value) || 0;
      if (w.type === 'debt' && limitInput) w.limit = parseFloat(limitInput.value) || 0;
    });
    
    saveMoneyPod();
    render();
    closeModal();
    showToast('💾 ปรับแต่งกระเป๋าเงินและวงเงินเรียบร้อยแล้ว!', 'success');
  } catch (e) {
    console.error("Failed to save wallets:", e);
    showToast('❌ เกิดข้อผิดพลาดในการบันทึกกระเป๋าเงิน', 'err');
  }
};
