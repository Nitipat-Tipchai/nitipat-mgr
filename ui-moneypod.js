// ══════════════════════════════════════════════════
// MONEYPOD (PERSONAL FINANCE HUB)
// ══════════════════════════════════════════════════
function renderMoneyPod() {
  const subView = state.moneySubView || 'overview';
  const selectedWalletId = state.moneySelectedWalletId || null;
  const themeClass = state.moneyTheme || 'theme-mint';
  
  const scopedStyle = `
    <style>
      .mp-wrap {
        --primary: #10b981;
        --accent: #6ee7b7;
        --bg-grad: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        --card-bg: rgba(255, 255, 255, 0.7);
        font-family: 'Outfit', 'Inter', 'Kanit', sans-serif;
        padding: 24px;
        border-radius: 28px;
        color: #1e293b;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 20px 40px rgba(0,0,0,0.03);
        margin-bottom: 90px;
        position: relative;
        overflow: hidden;
      }
      
      .mp-wrap.theme-mint {
        --primary: #10b981;
        --accent: #6ee7b7;
        --bg-grad: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        --card-bg: rgba(255, 255, 255, 0.75);
      }
      .mp-wrap.theme-peach {
        --primary: #f97316;
        --accent: #fdba74;
        --bg-grad: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
        --card-bg: rgba(255, 255, 255, 0.8);
      }
      .mp-wrap.theme-pink {
        --primary: #ec4899;
        --accent: #fbcfe8;
        --bg-grad: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
        --card-bg: rgba(255, 255, 255, 0.8);
      }
      .mp-wrap.theme-lavender {
        --primary: #a855f7;
        --accent: #e9d5ff;
        --bg-grad: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
        --card-bg: rgba(255, 255, 255, 0.75);
      }
      
      .mp-wrap {
        background: var(--bg-grad);
      }
      
      .mp-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        flex-wrap: wrap;
        gap: 15px;
      }
      
      .mp-title-section h1 {
        font-size: 28px;
        font-weight: 900;
        background: linear-gradient(120deg, var(--primary), #1e293b);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .mp-theme-picker {
        display: flex;
        gap: 8px;
        background: rgba(255,255,255,0.6);
        padding: 6px;
        border-radius: 20px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.02);
      }
      
      .theme-dot {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        transition: transform 0.2s ease;
      }
      .theme-dot:hover {
        transform: scale(1.2);
      }
      .theme-dot.mint { background: #10b981; }
      .theme-dot.peach { background: #f97316; }
      .theme-dot.pink { background: #ec4899; }
      .theme-dot.lavender { background: #a855f7; }
      
      .mp-subview-tabs {
        display: flex;
        background: rgba(0,0,0,0.03);
        padding: 5px;
        border-radius: 18px;
        margin-bottom: 25px;
        gap: 4px;
        overflow-x: auto;
      }
      
      .mp-tab-btn {
        flex: 1;
        padding: 10px 16px;
        border: none;
        background: none;
        font-size: 13px;
        font-weight: 700;
        color: #64748b;
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      
      .mp-tab-btn.active {
        background: white;
        color: var(--primary);
        box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      }
      
      .mp-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
      }
      @media(min-width: 768px) {
        .mp-grid {
          grid-template-columns: 350px 1fr;
        }
      }
      
      .mp-card {
        background: var(--card-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255,255,255,0.4);
        border-radius: 24px;
        padding: 22px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.01);
        margin-bottom: 20px;
        position: relative;
      }
      
      .networth-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%);
      }
      
      .nw-val {
        font-size: 34px;
        font-weight: 950;
        color: var(--primary);
        margin: 6px 0;
        letter-spacing: -0.5px;
      }
      
      .circle-progress-wrap {
        position: relative;
        width: 110px;
        height: 110px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .circle-progress-svg {
        transform: rotate(-90deg);
        width: 110px;
        height: 110px;
      }
      .circle-bg {
        fill: none;
        stroke: rgba(0,0,0,0.04);
        stroke-width: 8;
      }
      .circle-fg {
        fill: none;
        stroke: var(--primary);
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.6s ease;
      }
      .circle-text {
        position: absolute;
        font-size: 13px;
        font-weight: 850;
        color: #1e293b;
        text-align: center;
      }
      
      .wallets-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .wallet-card {
        padding: 14px;
        border-radius: 16px;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.01);
        border: 2px solid transparent;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 95px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .wallet-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 18px rgba(0,0,0,0.03);
      }
      .wallet-card.active {
        border-color: var(--primary);
        background: rgba(255, 255, 255, 0.95);
      }
      .wallet-name {
        font-size: 12px;
        font-weight: 800;
        color: #64748b;
      }
      .wallet-bal {
        font-size: 16px;
        font-weight: 900;
        color: #1e293b;
      }
      .wallet-limit {
        font-size: 9px;
        color: #94a3b8;
        margin-top: 1px;
      }
      
      .scanner-window {
        position: relative;
        border: 2px dashed var(--primary);
        border-radius: 20px;
        height: 220px;
        background: rgba(255,255,255,0.4);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        margin-bottom: 15px;
      }
      .scanner-window img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 10px;
      }
      .scan-laser {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 6px;
        background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.8), transparent);
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.9);
        display: none;
      }
      .scanner-window.scanning .scan-laser {
        display: block;
        animation: laserScan 1.5s infinite ease-in-out;
      }
      @keyframes laserScan {
        0% { top: 0%; }
        50% { top: 100%; }
        100% { top: 0%; }
      }
      
      .goal-progress-bar {
        height: 8px;
        background: rgba(0,0,0,0.05);
        border-radius: 4px;
        overflow: hidden;
        margin: 8px 0;
      }
      .goal-progress-fill {
        height: 100%;
        background: var(--primary);
        border-radius: 4px;
        transition: width 0.5s ease;
      }
      
      .tx-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: white;
        border-radius: 16px;
        margin-bottom: 10px;
        border: 1px solid rgba(0,0,0,0.02);
        box-shadow: 0 2px 8px rgba(0,0,0,0.01);
        transition: all 0.2s ease;
      }
      .tx-row:hover {
        transform: scale(1.01);
      }
      .tx-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .tx-icon {
        font-size: 20px;
        background: rgba(0,0,0,0.03);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
      }
      .tx-details {
        display: flex;
        flex-direction: column;
      }
      .tx-desc {
        font-size: 13px;
        font-weight: 700;
        color: #1e293b;
      }
      .tx-sub {
        font-size: 10px;
        color: #94a3b8;
        margin-top: 2px;
      }
      .tx-amount {
        font-weight: 900;
        font-size: 14px;
      }
      .tx-amount.income { color: #10b981; }
      .tx-amount.expense { color: #ef4444; }
      .tx-amount.transfer { color: #3b82f6; }
      
      .pill-badge {
        font-size: 9px;
        padding: 2px 6px;
        border-radius: 8px;
        font-weight: 700;
        margin-right: 4px;
        display: inline-block;
      }
      
      .btn-glass-pastel {
        background: white;
        border: 1px solid rgba(0,0,0,0.04);
        border-radius: 14px;
        padding: 10px 14px;
        font-weight: 700;
        font-size: 12px;
        color: #1e293b;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s ease;
      }
      .btn-glass-pastel:hover {
        background: rgba(255,255,255,0.8);
        transform: translateY(-1px);
      }
    </style>
  `;

  // Bind the global MoneyPod event and action handlers once on window
  if (!window.mpHandlersInitialized) {
    window.mpSetView = function(view) {
      state.moneySubView = view;
      render();
    };

    window.mpSetTheme = function(theme) {
      state.moneyTheme = theme;
      saveMoneyPod();
      render();
    };

    window.mpSetSelectedWallet = function(walletId) {
      state.moneySelectedWalletId = state.moneySelectedWalletId === walletId ? null : walletId;
      render();
    };

    window.mpEditDailyBudget = function() {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0'; overlay.style.left = '0';
      overlay.style.width = '100vw'; overlay.style.height = '100vh';
      overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '99999';

      const box = document.createElement('div');
      box.style.background = '#fff';
      box.style.padding = '20px';
      box.style.borderRadius = '16px';
      box.style.textAlign = 'center';
      box.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
      box.innerHTML = `
        <h3 style="margin-top:0; color:#1e293b;">💸 ตั้งค่างบประมาณ (บาท)</h3>
        <input type="number" id="budgetInputCustom" value="${state.moneyDailyBudget}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; font-size:16px; margin-bottom:15px; box-sizing:border-box;">
        <div style="display:flex; gap:10px; justify-content:center;">
          <button id="btnCancelBudget" style="padding:8px 16px; border:none; border-radius:8px; background:#f1f5f9; color:#64748b; font-weight:bold; cursor:pointer;">ยกเลิก</button>
          <button id="btnSaveBudget" style="padding:8px 16px; border:none; border-radius:8px; background:#10b981; color:#fff; font-weight:bold; cursor:pointer;">บันทึก</button>
        </div>
      `;
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      document.getElementById('btnCancelBudget').onclick = () => {
        document.body.removeChild(overlay);
      };
      document.getElementById('btnSaveBudget').onclick = () => {
        const bStr = document.getElementById('budgetInputCustom').value;
        const budget = parseFloat(bStr);
        if (!isNaN(budget) && budget >= 0) {
          state.moneyDailyBudget = budget;
          saveMoneyPod();
          render();
          showToast("💰 อัปเดตงบประมาณรายวันเรียบร้อยแล้ว");
        }
        document.body.removeChild(overlay);
      };
    };

    window.mpHandlePhotoUpload = function(input) {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          state.mpUploadedPhoto = e.target.result;
          document.getElementById('txPhotoPreview').innerHTML = `<img src="${state.mpUploadedPhoto}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; border:1px solid #ddd;">`;
          showToast('📸 แนบรูปใบเสร็จ/สลิปเรียบร้อย');
        };
        reader.readAsDataURL(file);
      }
    };

    window.mpSelectMockReceipt = function(type) {
      state.mpSelectedMockReceiptType = type;
      const mockImage = document.getElementById('receiptPreviewImage');
      const details = document.getElementById('mockReceiptDetails');
      if (type === 'seven') {
        mockImage.src = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80';
        details.innerHTML = '📄 ใบเสร็จ 7-Eleven (ข้าวผัด + น้ำดื่ม) — ยอด ฿187';
      } else if (type === 'starbucks') {
        mockImage.src = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80';
        details.innerHTML = '☕ ใบเสร็จ Starbucks (Latte + Croissant) — ยอด ฿340';
      } else if (type === 'shabu') {
        mockImage.src = 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80';
        details.innerHTML = '🍲 บิลร้านชาบูบุฟเฟต์ — ยอด ฿499';
      }
    };

    window.mpScanMockFallback = function(type, win, detailsEl) {
      if (win) win.classList.remove('scanning');
      
      let amount = 187;
      let desc = '7-Eleven อาหารมื้อเบา';
      let cat = '🍔 อาหาร & เครื่องดื่ม';
      let tags = '#seven #snacks';
      
      if (type === 'starbucks') {
        amount = 340;
        desc = 'Starbucks Coffee มื้อสาย';
        cat = '🍔 อาหาร & เครื่องดื่ม';
        tags = '#coffee #starbucks';
      } else if (type === 'shabu') {
        amount = 499;
        desc = 'ชาบูบุฟเฟต์มื้อเย็นฉลองหลังสอบ';
        cat = '🍔 อาหาร & เครื่องดื่ม';
        tags = '#shabu #buffet';
      }
      
      if (detailsEl) detailsEl.innerHTML = `📄 ดึงข้อมูลสำเร็จ: ${desc} — ยอด ฿${amount.toLocaleString()}`;
      
      state.moneySubView = 'overview';
      render();
      
      setTimeout(() => {
        if(document.getElementById('txType')) document.getElementById('txType').value = 'expense';
        if(document.getElementById('txAmount')) document.getElementById('txAmount').value = amount;
        if(document.getElementById('txCategory')) document.getElementById('txCategory').value = cat;
        if(document.getElementById('txNotes')) document.getElementById('txNotes').value = desc;
        if(document.getElementById('txTags')) document.getElementById('txTags').value = tags;
        if(document.getElementById('txWallet')) document.getElementById('txWallet').value = 'cash';
        
        triggerConfetti();
        showToast('✨ AI ดึงข้อมูลใบเสร็จและจำแนกอัตโนมัติสำเร็จแล้ว!');
      }, 120);
    };

    window.mpScanReceiptStart = async function() {
      const type = state.mpSelectedMockReceiptType || 'seven';
      const win = document.getElementById('scannerWin');
      if (!win) return;
      
      win.classList.add('scanning');
      const detailsEl = document.getElementById('mockReceiptDetails');
      if (detailsEl) detailsEl.innerHTML = '⌛ AI กำลังเตรียมโมเดลและปรับแต่งภาพ...';
      showToast('⌛ กำลังวิเคราะห์ใบเสร็จด้วย AI OCR...');

      if (type === 'custom_uploaded' && typeof Tesseract !== 'undefined') {
        try {
          const fileInput = document.getElementById('aiPhotoUpload');
          const file = fileInput?.files?.[0];
          if (!file) {
            win.classList.remove('scanning');
            showToast('⚠️ ไม่พบรูปภาพใบเสร็จ กรุณาอัปโหลดรูปภาพใหม่อีกครั้ง', 'err');
            return;
          }

          const result = await Tesseract.recognize(
            file,
            'eng+tha',
            { 
              logger: m => {
                if (m.status === 'recognizing' && detailsEl) {
                  detailsEl.innerHTML = `⌛ AI กำลังจำแนกตัวอักษร... (${Math.round(m.progress * 100)}%)`;
                }
              }
            }
          );

          const text = result.data.text;
          console.log("OCR Extracted Text:n", text);

          let amount = 0;
          let desc = 'ใบเสร็จสแกนผ่าน AI';
          let cat = '🍔 อาหาร & เครื่องดื่ม';
          let tags = '#ocr #receipt';

          const lines = text.split('n');
          let parsedAmounts = [];
          
          lines.forEach(line => {
            const lowerLine = line.toLowerCase();
            const cleanLine = lowerLine.replace(/s+/g, '');
            
            // Check for total keywords with OCR misspelling tolerances
            const isTotal = ['total', 'net', 'sum', 'ยอด', 'สุทธิ', 'รวม', 'ราคา', 'amount', 'baht', 'บาท', 'ฑธ', 'ขั้น', 'สุทธ'].some(kw => cleanLine.includes(kw));
            const isReceived = ['cash', 'เงินสด', 'รับเงิน', 'จ่าย', 'receive', 'pay', 'เสต'].some(kw => cleanLine.includes(kw));
            const isChange = ['ทอน', 'change'].some(kw => cleanLine.includes(kw));

            // 1. Decimal numbers with strict word boundaries to avoid tax ID collisions (e.g. 71.50, 5.50)
            const decimalRegex = /b([0-9]{1,3}(?:,[0-9]{3})*.[0-9]{2})b/g;
            const matches = line.match(decimalRegex);
            
            if (matches) {
              matches.forEach(m => {
                const val = parseFloat(m.replace(/,/g, ''));
                if (!isNaN(val) && val > 0) {
                  let priority = 1;
                  if (isTotal) priority = 4;        // Highest priority for Net Total decimal candidates
                  else if (isReceived) priority = 2; // Cash Received (e.g. 100.00)
                  else if (isChange) priority = 1;   // Change (e.g. 28.50)
                  
                  parsedAmounts.push({ val: val, priority: priority, isDecimal: true });
                }
              });
            } else {
              // 2. Fallback to standalone integers with strict word boundaries to avoid long ID collisions (e.g. 71)
              const intRegex = /b([0-9]{1,4})b/g;
              const intMatches = line.match(intRegex);
              if (intMatches) {
                intMatches.forEach(m => {
                  const val = parseFloat(m);
                  if (!isNaN(val) && val > 0) {
                    let priority = 0; // Standalone integer is lower priority than decimal
                    if (isTotal) priority = 3;
                    
                    parsedAmounts.push({ val: val, priority: priority, isDecimal: false });
                  }
                });
              }
            }
          });

          if (parsedAmounts.length > 0) {
            // Sort by priority first (highest to lowest), then prefer decimals, then sort values descending to find the correct Net Total on the total line
            parsedAmounts.sort((a, b) => {
              if (b.priority !== a.priority) return b.priority - a.priority;
              if (b.isDecimal !== a.isDecimal) return b.isDecimal ? 1 : -1;
              return b.val - a.val;
            });
            amount = parsedAmounts[0].val;
          }

          if (amount === 0) amount = 150;

          const lowerText = text.toLowerCase();
          if (lowerText.includes('seven') || lowerText.includes('7-eleven') || lowerText.includes('7-11')) {
            desc = 'ร้านสะดวกซื้อ 7-Eleven';
            tags += ' #seven #convenience';
          } else if (lowerText.includes('starbucks')) {
            desc = 'Starbucks Coffee';
            tags += ' #coffee #starbucks';
          } else if (lowerText.includes('shabu') || lowerText.includes('ชาบู') || lowerText.includes('buffet')) {
            desc = 'ร้านชาบูบุฟเฟ่ต์';
            tags += ' #shabu #buffet';
          } else if (lowerText.includes('lotus') || lowerText.includes('โลตัส')) {
            desc = 'Lotus Supermarket';
            tags += ' #lotus #grocery';
          } else if (lowerText.includes('big c') || lowerText.includes('บิ๊กซี')) {
            desc = 'Big C Supercenter';
            tags += ' #bigc #grocery';
          } else {
            const firstLine = lines.map(l => l.trim()).find(l => l.length > 3 && !/[0-9]/.test(l));
            if (firstLine) {
              desc = firstLine.substring(0, 30);
            }
          }

          if (lowerText.match(/(food|eat|restaurant|shabu|buffet|coffee|cafe|tea|ชาบู|อาหาร|กาแฟ|น้ำดื่ม|อร่อย)/)) {
            cat = '🍔 อาหาร & เครื่องดื่ม';
            tags += ' #food';
          } else if (lowerText.match(/(taxi|bts|mrt|gas|fuel|oil|รถไฟฟ้า|เดินทาง|น้ำมัน|รถเมล์)/)) {
            cat = '🚗 เดินทาง';
            tags += ' #travel';
          } else if (lowerText.match(/(clothes|shoes|shopping|mall|ห้าง|เสื้อผ้า|รองเท้า|ช็อปปิ้ง)/)) {
            cat = '🛍️ ช็อปปิ้ง';
            tags += ' #shopping';
          } else {
            cat = '🍔 อาหาร & เครื่องดื่ม';
          }

          win.classList.remove('scanning');
          if (detailsEl) detailsEl.innerHTML = `📄 ดึงข้อมูลสำเร็จ: ${desc} — ยอด ฿${amount.toLocaleString()}`;
          
          state.moneySubView = 'overview';
          render();
          
          setTimeout(() => {
            if(document.getElementById('txType')) document.getElementById('txType').value = 'expense';
            if(document.getElementById('txAmount')) document.getElementById('txAmount').value = amount;
            if(document.getElementById('txCategory')) document.getElementById('txCategory').value = cat;
            if(document.getElementById('txNotes')) document.getElementById('txNotes').value = desc;
            if(document.getElementById('txTags')) document.getElementById('txTags').value = tags;
            if(document.getElementById('txWallet')) document.getElementById('txWallet').value = 'cash';
            
            triggerConfetti();
            showToast('✨ AI วิเคราะห์และสแกนใบเสร็จจริงสำเร็จแล้ว!');
          }, 120);

        } catch (e) {
          console.error("AI OCR parsing error:", e);
          win.classList.remove('scanning');
          showToast('⚠️ การวิเคราะห์ OCR ล้มเหลว จะใช้ค่าจำลองแทน', 'err');
          mpScanMockFallback(type, win, detailsEl);
        }
      } else {
        setTimeout(() => {
          mpScanMockFallback(type, win, detailsEl);
        }, 1800);
      }
    };

    window.mpAddTransaction = function() {
      const type = document.getElementById('txType').value;
      const amount = parseFloat(document.getElementById('txAmount').value);
      const category = document.getElementById('txCategory').value;
      const walletId = document.getElementById('txWallet')?.value;
      const fromWalletId = document.getElementById('txFromWallet')?.value;
      const toWalletId = document.getElementById('txToWallet')?.value;
      const notes = document.getElementById('txNotes').value;
      const tags = document.getElementById('txTags').value;
      const photo = state.mpUploadedPhoto || null;
      const isInstallment = document.getElementById('txIsInstallment')?.checked || false;
      const instMonths = parseInt(document.getElementById('txInstMonths')?.value || '3');
      const instInterest = parseFloat(document.getElementById('txInstInterest')?.value || '1.2');

      if (isNaN(amount) || amount <= 0) {
        showToast('⚠️ กรุณากรอกจำนวนเงินให้ถูกต้อง', 'err');
        return;
      }

      const newTx = {
        id: 'tx_' + Date.now(),
        type,
        amount,
        category,
        walletId,
        fromWalletId,
        toWalletId,
        notes: notes || (type === 'transfer' ? 'โอนเงินข้ามบัญชี' : category),
        tags: tags || '',
        photo,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now()
      };

      if (type === 'income') {
        const w = state.moneyWallets.find(x => x.id === walletId);
        if (w) w.balance += amount;
      } else if (type === 'expense') {
        const w = state.moneyWallets.find(x => x.id === walletId);
        if (w) {
          if (w.type === 'debt') w.balance += amount; // เพิ่มยอดหนี้
          else w.balance -= amount; // หักสินทรัพย์
        }
        
        // ผูกสัญญากับผ่อนชำระ
        if (isInstallment && (walletId === 'spaylater' || walletId === 'seasycash')) {
          const interestAmt = amount * (instInterest / 100) * instMonths;
          const totalPayable = amount + interestAmt;
          const monthlyPay = totalPayable / instMonths;
          
          state.moneyInstallments.push({
            id: 'inst_' + Date.now(),
            name: notes || `ผ่อนชำระ ${category}`,
            walletId,
            principal: amount,
            interestRate: instInterest,
            totalPayable,
            monthlyPayment: monthlyPay,
            remainingMonths: instMonths,
            totalMonths: instMonths,
            paidMonths: 0,
            tags
          });
        }
      } else if (type === 'transfer') {
        const fromW = state.moneyWallets.find(x => x.id === fromWalletId);
        const toW = state.moneyWallets.find(x => x.id === toWalletId);
        if (fromW && toW) {
          if (fromW.type === 'debt') fromW.balance += amount;
          else fromW.balance -= amount;
          
          if (toW.type === 'debt') toW.balance -= amount;
          else toW.balance += amount;
        }
      }

      state.moneyTransactions.unshift(newTx);
      state.mpUploadedPhoto = null;
      saveMoneyPod();
      render();
      showToast('✅ บันทึกรายการลงกระเป๋าเงินสำเร็จ!');
    };

    window.mpDeleteTransaction = function(txId) {
      if (confirm('ต้องการลบรายการนี้ใช่หรือไม่? (ยอดเงินจะไม่ได้รับการแก้ไขย้อนกลับ)')) {
        state.moneyTransactions = state.moneyTransactions.filter(t => t.id !== txId);
        saveMoneyPod();
        render();
        showToast('🗑 ลบรายการเรียบร้อยแล้ว');
      }
    };

    window.mpPayInstallment = function(instId) {
      const inst = state.moneyInstallments.find(i => i.id === instId);
      if (!inst) return;
      
      if (confirm(`ชำระงวดประจำเดือนสำหรับ "${inst.name}" จำนวน ฿${inst.monthlyPayment.toFixed(2)} ใช่หรือไม่?n(ยอดจะชำระจาก บัญชีธนาคาร 🏦)`)) {
        const bank = state.moneyWallets.find(w => w.id === 'bank');
        if (!bank || bank.balance < inst.monthlyPayment) {
          showToast('⚠️ ยอดเงินในบัญชีธนาคารไม่เพียงพอ', 'err');
          return;
        }
        
        bank.balance -= inst.monthlyPayment;
        const debtW = state.moneyWallets.find(w => w.id === inst.walletId);
        if (debtW) {
          const principalPayment = inst.principal / inst.totalMonths;
          debtW.balance = Math.max(0, debtW.balance - principalPayment);
        }
        
        state.moneyTransactions.unshift({
          id: 'tx_' + Date.now(),
          type: 'expense',
          amount: inst.monthlyPayment,
          category: '🐽 การเงิน & หนี้สิน',
          walletId: 'bank',
          notes: `ชำระงวด ${inst.name} (${inst.paidMonths + 1}/${inst.totalMonths})`,
          tags: `#installment #payment ${inst.tags || ''}`,
          date: new Date().toISOString().split('T')[0],
          timestamp: Date.now()
        });
        
        inst.paidMonths += 1;
        inst.remainingMonths -= 1;
        
        if (inst.remainingMonths <= 0) {
          state.moneyInstallments = state.moneyInstallments.filter(i => i.id !== instId);
          showToast('🎉 ยอดผ่อนชำระรายการนี้ถูกจ่ายหมดสิ้นสมบูรณ์แล้ว!');
        } else {
          showToast(`✅ ชำระงวดประจำเดือนสำเร็จ ฿${inst.monthlyPayment.toFixed(2)}`);
        }
        
        saveMoneyPod();
        render();
        triggerConfetti();
      }
    };

    window.mpAddGoal = function() {
      const name = document.getElementById('newGoalName').value;
      const target = parseFloat(document.getElementById('newGoalTarget').value);
      if (!name || isNaN(target) || target <= 0) {
        showToast('⚠️ กรุณากรอกข้อมูลเป้าหมายให้ถูกต้อง', 'err');
        return;
      }
      
      state.moneyGoals.push({
        id: 'goal_' + Date.now(),
        name,
        target,
        saved: 0
      });
      
      saveMoneyPod();
      render();
      showToast('🎯 สร้างเป้าหมายการออมใหม่เรียบร้อย!');
    };

    window.mpDeleteGoal = function(goalId) {
      if (!confirm('⚠️ ยืนยันที่จะลบเป้าหมายการออมนี้ใช่หรือไม่?')) return;
      state.moneyGoals = state.moneyGoals.filter(g => g.id !== goalId);
      saveMoneyPod();
      render();
      showToast('🗑️ ลบเป้าหมายการออมเรียบร้อย!');
    };

    window.mpDepositGoal = function(goalId) {
      const goal = state.moneyGoals.find(g => g.id === goalId);
      if (!goal) return;
      
      const amtStr = prompt(`ฝากเงินเข้าเป้าหมาย "${goal.name}" (เป้าหมาย ฿${goal.target} | ออมแล้ว ฿${goal.saved})nจำนวนเงินออม (บาท):`);
      const amount = parseFloat(amtStr);
      if (isNaN(amount) || amount <= 0) {
        if (amtStr !== null) showToast('⚠️ กรุณากรอกจำนวนเงินให้ถูกต้อง', 'err');
        return;
      }
      
      const bank = state.moneyWallets.find(w => w.id === 'bank');
      if (!bank || bank.balance < amount) {
        showToast('⚠️ ยอดเงินในบัญชีธนาคารไม่เพียงพอต่อการออม', 'err');
        return;
      }
      
      bank.balance -= amount;
      const savingsW = state.moneyWallets.find(w => w.id === 'savings');
      if (savingsW) savingsW.balance += amount;
      
      goal.saved += amount;
      
      state.moneyTransactions.unshift({
        id: 'tx_' + Date.now(),
        type: 'transfer',
        amount,
        category: '🐷 ออมเงิน',
        fromWalletId: 'bank',
        toWalletId: 'savings',
        notes: `ออมเงินสะสม: ${goal.name}`,
        tags: '#savings #goal',
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now()
      });
      
      saveMoneyPod();
      render();
      triggerConfetti();
      showToast(`🎉 ออมเงินสะสม ฿${amount} เข้าเป้าหมาย "${goal.name}"!`);
    };

    window.mpExportCSV = function() {
      if (state.moneyTransactions.length === 0) {
        showToast('⚠️ ไม่มีประวัติบันทึกทางการเงินที่จะส่งออก', 'err');
        return;
      }
      
      let csv = "uFEFF"; // UTF-8 BOM
      csv += "วันที่,ประเภท,จำนวนเงิน(บาท),หมวดหมู่,จากกระเป๋า,ไปยังกระเป๋า,โน้ต,แท็กn";
      
      state.moneyTransactions.forEach(t => {
        const fromW = t.fromWalletId ? (state.moneyWallets.find(w => w.id === t.fromWalletId)?.name || t.fromWalletId) : "";
        const toW = t.toWalletId ? (state.moneyWallets.find(w => w.id === t.toWalletId)?.name || t.toWalletId) : "";
        const wallet = t.walletId ? (state.moneyWallets.find(w => w.id === t.walletId)?.name || t.walletId) : "";
        
        const row = [
          t.date,
          t.type === 'income' ? 'รายรับ' : (t.type === 'expense' ? 'รายจ่าย' : 'โอนเงิน'),
          t.amount,
          t.category,
          t.type === 'transfer' ? fromW : wallet,
          t.type === 'transfer' ? toW : "",
          `"${(t.notes || '').replace(/"/g, '""')}"`,
          `"${(t.tags || '').replace(/"/g, '""')}"`
        ].join(",");
        csv += row + "n";
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `MoneyPod_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('📥 ส่งออกไฟล์รายงาน CSV สู่เครื่องสำเร็จ');
    };

    window.mpEditTransaction = function(txId) {
      const tx = state.moneyTransactions.find(t => t.id === txId);
      if (!tx) return;

      const categories = ['🍔 อาหาร & เครื่องดื่ม', '🚗 เดินทาง & ยานพาหนะ', '🐽 การเงิน & หนี้สิน', '🏠 บ้าน & ที่พักอาศัย', '🛍️ ช้อปปิ้ง & ไลฟ์สไตล์', '🎮 ความบันเทิง & เกม', '📚 การศึกษา & หนังสือ', '💊 สุขภาพ & ยา', '💼 การงาน & ธุรกิจ', '🎁 ของขวัญ & ทำบุญ', '🌐 อื่นๆ'];

      let bodyHtml = `
        <div style="display:flex; flex-direction:column; gap:12px; padding:10px;">
          <div class="fg">
            <label>ประเภทรายการ</label>
            <select id="editTxType" class="glass-select sm full">
              <option value="expense" ${tx.type === 'expense' ? 'selected' : ''}>💸 รายจ่าย</option>
              <option value="income" ${tx.type === 'income' ? 'selected' : ''}>💰 รายรับ</option>
            </select>
          </div>
          <div class="fg">
            <label>จำนวนเงิน (บาท)</label>
            <input type="number" id="editTxAmount" class="glass-input sm full" value="${tx.amount}" step="0.01">
          </div>
          <div class="fg">
            <label>หมวดหมู่</label>
            <select id="editTxCategory" class="glass-select sm full">
              ${categories.map(c => `<option value="${c}" ${tx.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="fg">
            <label>บัญชีเงิน/เครดิตที่ใช้</label>
            <select id="editTxWallet" class="glass-select sm full">
              ${state.moneyWallets.map(w => `<option value="${w.id}" ${tx.walletId === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
            </select>
          </div>
          <div class="fg">
            <label>บันทึกช่วยจำ (Notes)</label>
            <input type="text" id="editTxNotes" class="glass-input sm full" value="${tx.notes || ''}">
          </div>
          <div class="fg">
            <label>แท็ก (Tags, คั่นด้วยเว้นวรรค เช่น #อาหาร)</label>
            <input type="text" id="editTxTags" class="glass-input sm full" value="${tx.tags || ''}">
          </div>
          <div class="fg">
            <label>วันที่</label>
            <input type="date" id="editTxDate" class="glass-input sm full" value="${tx.date || new Date().toISOString().split('T')[0]}">
          </div>
        </div>
      `;

      const footerHtml = `
        <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
          <button class="btn-glass-pastel" onclick="closeModal()" style="padding: 8px 16px; border-radius:10px; font-size:12px;">ยกเลิก</button>
          <button class="btn-pastel-primary" onclick="mpSaveEditedTransaction('${txId}')" style="padding: 8px 20px; border-radius:10px; font-size:12px;">💾 บันทึกการแก้ไข</button>
        </div>
      `;

      openModal('✏️ แก้ไขรายการธุรกรรม', bodyHtml, footerHtml);
    };

    window.mpSaveEditedTransaction = function(txId) {
      const tx = state.moneyTransactions.find(t => t.id === txId);
      if (!tx) return;

      const oldAmount = tx.amount;
      const oldType = tx.type;
      const oldWalletId = tx.walletId;

      const newType = document.getElementById('editTxType').value;
      const newAmount = parseFloat(document.getElementById('editTxAmount').value);
      const newCategory = document.getElementById('editTxCategory').value;
      const newWalletId = document.getElementById('editTxWallet').value;
      const newNotes = document.getElementById('editTxNotes').value.trim();
      const newTags = document.getElementById('editTxTags').value.trim();
      const newDate = document.getElementById('editTxDate').value;

      if (isNaN(newAmount) || newAmount <= 0) {
        showToast('⚠️ กรุณากรอกจำนวนเงินให้ถูกต้อง', 'err');
        return;
      }

      // Delta balance adjustment
      const oldWallet = state.moneyWallets.find(w => w.id === oldWalletId);
      if (oldWallet) {
        if (oldType === 'expense') {
          oldWallet.balance += oldAmount;
        } else {
          oldWallet.balance -= oldAmount;
        }
      }

      const newWallet = state.moneyWallets.find(w => w.id === newWalletId);
      if (newWallet) {
        if (newType === 'expense') {
          newWallet.balance -= newAmount;
        } else {
          newWallet.balance += newAmount;
        }
      }

      tx.type = newType;
      tx.amount = newAmount;
      tx.category = newCategory;
      tx.walletId = newWalletId;
      tx.notes = newNotes;
      tx.tags = newTags;
      tx.date = newDate;

      saveMoneyPod();
      closeModal();
      render();
      showToast('✅ แก้ไขรายการเรียบร้อยแล้ว!');
    };

    window.mpEditGoal = function(goalId) {
      const goal = state.moneyGoals.find(g => g.id === goalId);
      if (!goal) return;

      const bodyHtml = `
        <div style="display:flex; flex-direction:column; gap:12px; padding:10px;">
          <div class="fg">
            <label>ชื่อเป้าหมาย</label>
            <input type="text" id="editGoalName" class="glass-input sm full" value="${goal.name}">
          </div>
          <div class="fg">
            <label>จำนวนเงินเป้าหมาย (บาท)</label>
            <input type="number" id="editGoalTarget" class="glass-input sm full" value="${goal.target}" step="0.01">
          </div>
          <div class="fg">
            <label>จำนวนเงินออมสะสมปัจจุบัน (บาท)</label>
            <input type="number" id="editGoalSaved" class="glass-input sm full" value="${goal.saved}" step="0.01">
          </div>
        </div>
      `;

      const footerHtml = `
        <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
          <button class="btn-glass-pastel" onclick="closeModal()" style="padding: 8px 16px; border-radius:10px; font-size:12px;">ยกเลิก</button>
          <button class="btn-pastel-primary" onclick="mpSaveEditedGoal('${goalId}')" style="padding: 8px 20px; border-radius:10px; font-size:12px;">💾 บันทึกการแก้ไข</button>
        </div>
      `;

      openModal('✏️ แก้ไขเป้าหมายการออม', bodyHtml, footerHtml);
    };

    window.mpSaveEditedGoal = function(goalId) {
      const goal = state.moneyGoals.find(g => g.id === goalId);
      if (!goal) return;

      const newName = document.getElementById('editGoalName').value.trim();
      const newTarget = parseFloat(document.getElementById('editGoalTarget').value);
      const newSaved = parseFloat(document.getElementById('editGoalSaved').value);

      if (!newName || isNaN(newTarget) || newTarget <= 0 || isNaN(newSaved) || newSaved < 0) {
        showToast('⚠️ กรุณากรอกข้อมูลให้ถูกต้อง', 'err');
        return;
      }

      goal.name = newName;
      goal.target = newTarget;
      goal.saved = newSaved;

      saveMoneyPod();
      closeModal();
      render();
      showToast('✅ แก้ไขเป้าหมายสำเร็จ!');
    };

    window.mpEditInstallment = function(instId) {
      const inst = state.moneyInstallments.find(i => i.id === instId);
      if (!inst) return;

      const bodyHtml = `
        <div style="display:flex; flex-direction:column; gap:12px; padding:10px;">
          <div class="fg">
            <label>ชื่อรายการผ่อนชำระ/หนี้สิน</label>
            <input type="text" id="editInstName" class="glass-input sm full" value="${inst.name}">
          </div>
          <div class="fg">
            <label>ยอดผ่อนชำระต่อเดือน (บาท)</label>
            <input type="number" id="editInstMonthly" class="glass-input sm full" value="${inst.monthlyPayment}" step="0.01">
          </div>
          <div class="fg">
            <label>จำนวนงวดทั้งหมด (เดือน)</label>
            <input type="number" id="editInstTotal" class="glass-input sm full" value="${inst.totalMonths}">
          </div>
          <div class="fg">
            <label>จำนวนงวดที่จ่ายไปแล้ว (เดือน)</label>
            <input type="number" id="editInstPaid" class="glass-input sm full" value="${inst.paidMonths}">
          </div>
          <div class="fg">
            <label>ยอดเงินเต็มผ่อนชำระรวมดอกเบี้ย (บาท)</label>
            <input type="number" id="editInstTotalPayable" class="glass-input sm full" value="${inst.totalPayable}" step="0.01">
          </div>
        </div>
      `;

      const footerHtml = `
        <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
          <button class="btn-glass-pastel" onclick="closeModal()" style="padding: 8px 16px; border-radius:10px; font-size:12px;">ยกเลิก</button>
          <button class="btn-pastel-primary" onclick="mpSaveEditedInstallment('${instId}')" style="padding: 8px 20px; border-radius:10px; font-size:12px;">💾 บันทึกการแก้ไข</button>
        </div>
      `;

      openModal('✏️ แก้ไขสัญญาผ่อนชำระ', bodyHtml, footerHtml);
    };

    window.mpSaveEditedInstallment = function(instId) {
      const inst = state.moneyInstallments.find(i => i.id === instId);
      if (!inst) return;
      
      const name = document.getElementById('editInstName').value.trim();
      const monthly = parseFloat(document.getElementById('editInstMonthly').value);
      const total = parseInt(document.getElementById('editInstTotal').value);
      const paid = parseInt(document.getElementById('editInstPaid').value);
      const payable = parseFloat(document.getElementById('editInstTotalPayable').value);
      
      if (!name || isNaN(monthly) || monthly <= 0 || isNaN(total) || total <= 0 || isNaN(paid) || paid < 0 || isNaN(payable) || payable <= 0) {
        showToast('⚠️ กรุณากรอกข้อมูลให้ถูกต้อง', 'err');
        return;
      }
      
      inst.name = name;
      inst.monthlyPayment = monthly;
      inst.totalMonths = total;
      inst.paidMonths = paid;
      inst.remainingMonths = Math.max(0, total - paid);
      inst.totalPayable = payable;
      
      saveMoneyPod();
      closeModal();
      render();
      showToast('✅ แก้ไขข้อมูลสัญญาสำเร็จ!');
    };

    window.mpDeleteInstallment = function(instId) {
      if (confirm('⚠️ คุณแน่ใจที่จะยกเลิกและลบสัญญาผ่อนชำระนี้ใช่หรือไม่?n(ยอดคงเหลือในบัญชีจะไม่ได้รับผลกระทบ)')) {
        state.moneyInstallments = state.moneyInstallments.filter(i => i.id !== instId);
        saveMoneyPod();
        render();
        showToast('🗑️ ลบสัญญาผ่อนชำระเรียบร้อย!');
      }
    };

    window.mpHandlersInitialized = true;
  }

  // Calculate Net Worth values
  const assets = state.moneyWallets.filter(w => w.type !== 'debt').reduce((s, w) => s + w.balance, 0);
  const debts = state.moneyWallets.filter(w => w.type === 'debt').reduce((s, w) => s + w.balance, 0);
  const netWorth = assets - debts;
  
  // Calculate Daily Spent
  const today = new Date().toISOString().split('T')[0];
  const spentToday = state.moneyTransactions
    .filter(t => t.date === today && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  
  const dailyProgPercent = Math.min(100, (spentToday / state.moneyDailyBudget) * 100);
  const strokeDash = 2 * Math.PI * 51;
  const strokeOffset = strokeDash - (dailyProgPercent / 100) * strokeDash;

  // Wallet filter logic
  const filteredTxs = selectedWalletId 
    ? state.moneyTransactions.filter(t => t.walletId === selectedWalletId || t.fromWalletId === selectedWalletId || t.toWalletId === selectedWalletId)
    : state.moneyTransactions;

  let mainContent = '';
  
  if (subView === 'overview') {
    mainContent = `
      <div class="mp-grid">
        <!-- Left Side: Balances & Wallets -->
        <div>
          <div class="glass-card networth-box mp-card">
            <span style="font-size:12px; font-weight:700; color:#64748b; letter-spacing:0.5px;">💰 ความมั่งคั่งสุทธิ (Net Worth)</span>
            <div class="nw-val">฿${netWorth.toLocaleString()}</div>
            <div style="display:flex; justify-content:space-between; width:100%; font-size:11px; margin-top:5px; border-top:1px solid rgba(0,0,0,0.05); padding-top:8px;">
              <span style="color:#10b981; font-weight:750;">ทรัพย์สิน: ฿${assets.toLocaleString()}</span>
              <span style="color:#ef4444; font-weight:750;">หนี้สิน: ฿${debts.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="mp-card" style="display:flex; align-items:center; justify-content:space-between;">
            <div class="circle-progress-wrap">
              <svg class="circle-progress-svg">
                <circle class="circle-bg" cx="55" cy="55" r="51"></circle>
                <circle class="circle-fg" cx="55" cy="55" r="51" style="stroke-dasharray: ${strokeDash}; stroke-dashoffset: ${strokeOffset}; stroke: ${spentToday > state.moneyDailyBudget ? '#ef4444' : 'var(--primary)'}"></circle>
              </svg>
              <div class="circle-text">
                <div style="font-size:10px; color:#64748b;">ใช้วันนี้</div>
                <div style="font-size:14px; font-weight:900;">${Math.round(dailyProgPercent)}%</div>
              </div>
            </div>
            <div style="flex:1; margin-left:20px; display:flex; flex-direction:column; justify-content:center;">
              <span style="font-size:12px; font-weight:700; color:#64748b;">งบประมาณวันนี้</span>
              <span style="font-size:18px; font-weight:950; color:#1e293b; margin:2px 0;">฿${spentToday} / ฿${state.moneyDailyBudget}</span>
              <button class="btn-glass-pastel" onclick="mpEditDailyBudget()" style="margin-top:4px; padding:4px 10px; align-self:flex-start; font-size:10px;">⚙️ ปรับเปลี่ยนงบ</button>
            </div>
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="font-size:14px; font-weight:800; color:#64748b; margin:0; letter-spacing:0.5px;">👛 กระเป๋าเงินของฉัน</h3>
            <button class="btn-glass-pastel" onclick="mpOpenWalletEditor()" style="padding:4px 10px; font-size:10px;">✏️ แก้ไขกระเป๋า & วงเงิน</button>
          </div>
          <div class="wallets-grid">
            ${state.moneyWallets.map(w => {
              const isActive = selectedWalletId === w.id;
              const displayVal = w.type === 'debt' ? `หนี้: ฿${w.balance.toLocaleString()}` : `฿${w.balance.toLocaleString()}`;
              return `
                <div class="wallet-card ${isActive ? 'active' : ''}" onclick="mpSetSelectedWallet('${w.id}')">
                  <span class="wallet-name">${w.name}</span>
                  <div class="wallet-bal">${displayVal}</div>
                  ${w.type === 'debt' ? `<span class="wallet-limit">วงเงินคงเหลือ ฿${(w.limit - w.balance).toLocaleString()}</span>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- Right Side: Quick Logger & Transactions Feed -->
        <div>
          <div class="mp-card">
            <h3 style="margin-top:0; font-size:15px; font-weight:850; display:flex; align-items:center; gap:6px;"><span style="font-size:18px;">📝</span> บันทึกรายการใหม่</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">ประเภท</label>
                <select class="glass-input sm" id="txType" onchange="
                  const type = this.value;
                  document.getElementById('txWWrap').style.display = type === 'transfer' ? 'none' : 'block';
                  document.getElementById('txTWrap').style.display = type === 'transfer' ? 'grid' : 'none';
                  document.getElementById('txInstToggleWrap').style.display = 'none';
                " style="width:100%; border-radius:12px;">
                  <option value="expense">รายจ่าย 💸</option>
                  <option value="income">รายรับ 📈</option>
                  <option value="transfer">โอนเงิน 🔄</option>
                </select>
              </div>
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">จำนวนเงิน (บาท)</label>
                <input type="number" class="glass-input sm" id="txAmount" placeholder="฿" style="width:100%; border-radius:12px;" min="0">
              </div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">หมวดหมู่</label>
                <select class="glass-input sm" id="txCategory" style="width:100%; border-radius:12px;">
                  <option value="🍔 อาหาร & เครื่องดื่ม">🍔 อาหาร & เครื่องดื่ม</option>
                  <option value="🛍️ ช้อปปิ้ง">🛍️ ช้อปปิ้ง</option>
                  <option value="🚗 เดินทาง & รถยนต์">🚗 เดินทาง & รถยนต์</option>
                  <option value="🏠 ที่พัก & ค่าเช่า">🏠 ที่พัก & ค่าเช่า</option>
                  <option value="💡 ค่าสาธารณูปโภค">💡 ค่าสาธารณูปโภค</option>
                  <option value="🎮 สันทนาการ & เกม">🎮 สันทนาการ & เกม</option>
                  <option value="🎓 การศึกษา & ตราหนังสือ">🎓 การศึกษา & ตราหนังสือ</option>
                  <option value="🐽 การเงิน & หนี้สิน">🐽 การเงิน & หนี้สิน</option>
                  <option value="➕ อื่นๆ">➕ อื่นๆ</option>
                </select>
              </div>
              <div id="txWWrap">
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">ใช้จากกระเป๋า</label>
                <select class="glass-input sm" id="txWallet" onchange="
                  const w = this.value;
                  const isExp = document.getElementById('txType').value === 'expense';
                  document.getElementById('txInstToggleWrap').style.display = (isExp && (w === 'spaylater' || w === 'seasycash')) ? 'block' : 'none';
                " style="width:100%; border-radius:12px;">
                  ${state.moneyWallets.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
                </select>
              </div>
            </div>
            
            <div id="txTWrap" style="display:none; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">จากกระเป๋า</label>
                <select class="glass-input sm" id="txFromWallet" style="width:100%; border-radius:12px;">
                  ${state.moneyWallets.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">ไปยังกระเป๋า</label>
                <select class="glass-input sm" id="txToWallet" style="width:100%; border-radius:12px;">
                  ${state.moneyWallets.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
                </select>
              </div>
            </div>
            
            <div id="txInstToggleWrap" style="display:none; background:rgba(255,255,255,0.5); padding:10px; border-radius:12px; margin-bottom:10px; border:1px solid var(--accent);">
              <label style="display:flex; align-items:center; gap:8px; font-size:11px; font-weight:750; color:#1e293b; cursor:pointer;">
                <input type="checkbox" id="txIsInstallment" onchange="document.getElementById('txInstDetails').style.display = this.checked ? 'grid' : 'none';"> 
                🛍️ ตั้งการผ่อนชำระรายเดือน (SPayLater/SEasyCash)
              </label>
              
              <div id="txInstDetails" style="display:none; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;">
                <div>
                  <label style="font-size:9px; font-weight:750; color:#64748b; display:block; margin-bottom:2px;">จำนวนงวด (เดือน)</label>
                  <select class="glass-input sm" id="txInstMonths" style="width:100%; font-size:10px;" onchange="
                    const amt = parseFloat(document.getElementById('txAmount').value) || 0;
                    const months = parseInt(this.value);
                    const rate = parseFloat(document.getElementById('txInstInterest').value);
                    const total = amt + (amt * (rate / 100) * months);
                    document.getElementById('txInstPreview').innerText = 'ผ่อนงวดละ: ฿' + (total/months).toFixed(2);
                  ">
                    <option value="1">1 เดือน</option>
                    <option value="3">3 เดือน</option>
                    <option value="6">6 เดือน</option>
                    <option value="12">12 เดือน</option>
                  </select>
                </div>
                <div>
                  <label style="font-size:9px; font-weight:750; color:#64748b; display:block; margin-bottom:2px;">ดอกเบี้ยต่อเดือน (%)</label>
                  <input type="number" class="glass-input sm" id="txInstInterest" value="1.2" step="0.1" style="width:100%; font-size:10px;" oninput="
                    const amt = parseFloat(document.getElementById('txAmount').value) || 0;
                    const months = parseInt(document.getElementById('txInstMonths').value);
                    const rate = parseFloat(this.value) || 0;
                    const total = amt + (amt * (rate / 100) * months);
                    document.getElementById('txInstPreview').innerText = 'ผ่อนงวดละ: ฿' + (total/months).toFixed(2);
                  ">
                </div>
                <div style="grid-column: span 2; font-size:9.5px; font-weight:800; color:var(--primary); text-align:right;" id="txInstPreview">
                  ผ่อนงวดละ: ฿0.00
                </div>
              </div>
            </div>
            
            <div style="margin-bottom:12px;">
              <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">โน้ต / บันทึกความจำ</label>
              <input type="text" class="glass-input sm" id="txNotes" placeholder="เช่น ซื้อชาบูเย็นนี้, ถอนเงินสด" style="width:100%; border-radius:12px;">
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px; align-items:center;">
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:4px;">แท็กติดตาม (เช่น #เที่ยว #ขนม)</label>
                <input type="text" class="glass-input sm" id="txTags" placeholder="#tag" style="width:100%; border-radius:12px;">
              </div>
              <div style="display:flex; gap:10px; align-items:center;">
                <input type="file" id="txPhotoUpload" accept="image/*" style="display:none;" onchange="mpHandlePhotoUpload(this)">
                <button class="btn-glass-pastel" onclick="document.getElementById('txPhotoUpload').click()" style="padding:6px 12px;"><span style="font-size:14px;">📸</span> แนบสลิป</button>
                <div id="txPhotoPreview"></div>
              </div>
            </div>
            
            <button class="btn-pastel-primary" onclick="mpAddTransaction()" style="width:100%; border-radius:14px; padding:12px;">💾 บันทึกรายการลงบัญชี</button>
          </div>
          
          <h3 style="font-size:14px; font-weight:850; color:#64748b; margin:20px 0 10px 0; display:flex; justify-content:space-between; align-items:center;">
            <span>${selectedWalletId ? `🔍 ประวัติสำหรับ ${state.moneyWallets.find(w => w.id === selectedWalletId)?.name}` : '📋 ประวัติธุรกรรมล่าสุด'}</span>
            ${selectedWalletId ? '<button onclick="mpSetSelectedWallet(null)" style="font-size:10px; border:none; background:none; color:var(--primary); font-weight:800; cursor:pointer;">ดูทั้งหมด</button>' : ''}
          </h3>
          
          <div style="max-height: 400px; overflow-y: auto;">
            ${filteredTxs.map(t => {
              let categoryIcon = '🐽';
              if (t.category.includes('🍔')) categoryIcon = '🍔';
              else if (t.category.includes('🛍️')) categoryIcon = '🛍️';
              else if (t.category.includes('🚗')) categoryIcon = '🚗';
              else if (t.category.includes('🏠')) categoryIcon = '🏠';
              else if (t.category.includes('💡')) categoryIcon = '💡';
              else if (t.category.includes('🎮')) categoryIcon = '🎮';
              else if (t.category.includes('🎓')) categoryIcon = '🎓';
              else if (t.category.includes('🐽')) categoryIcon = '🐽';
              
              const isInc = t.type === 'income';
              const isTrf = t.type === 'transfer';
              const amtSign = isInc ? '+' : (isTrf ? '⇆' : '-');
              const amtClass = isInc ? 'income' : (isTrf ? 'transfer' : 'expense');
              
              return `
                <div class="tx-row">
                  <div class="tx-left">
                    <div class="tx-icon">${categoryIcon}</div>
                    <div class="tx-details">
                      <span class="tx-desc">${t.notes}</span>
                      <div style="display:flex; align-items:center; gap:5px; margin-top:2px;">
                        <span class="tx-sub">${t.date}</span>
                        ${t.tags ? t.tags.split(' ').map(tag => `<span class="pill-badge" style="background:#e2e8f0; color:#475569;">${tag}</span>`).join('') : ''}
                        ${t.photo ? `<span onclick="openModal('📄 รูปแนบหลักฐาน', '<img src=x22${t.photo}x22 style=x22width:100%; border-radius:12px;x22>')" style="font-size:10px; cursor:pointer; color:var(--primary); text-decoration:underline; font-weight:750;">🖼️ สลิป</span>` : ''}
                      </div>
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:10px;">
                    <span class="tx-amount ${amtClass}">${amtSign}฿${t.amount.toLocaleString()}</span>
                    <button class="icon-btn sm" onclick="mpEditTransaction('${t.id}')" style="background:transparent; border:none; color:#4f46e5; font-size:14px; margin-right:4px;">✏️</button>
                    <button class="icon-btn danger sm" onclick="mpDeleteTransaction('${t.id}')" style="background:transparent; border:none; color:#ef4444; font-size:14px;">✕</button>
                  </div>
                </div>
              `;
            }).join('')}
            ${filteredTxs.length === 0 ? '<div class="empty-sm" style="padding:40px; text-align:center; color:#94a3b8;">ยังไม่มีประวัติธุรกรรม</div>' : ''}
          </div>
        </div>
      </div>
    `;
  } else if (subView === 'installments') {
    mainContent = `
      <div class="mp-grid">
        <!-- Installment Settings and Debts summary -->
        <div>
          <div class="mp-card">
            <h3 style="margin-top:0; font-size:14px; font-weight:850; color:#64748b;">🛍️ สรุปขีดจำกัดสินเชื่อ (Credit Limits)</h3>
            <div style="margin-top:15px;">
              ${(() => {
                const w = state.moneyWallets.find(x => x.id === 'spaylater');
                const limitVal = w.limit || 15000;
                const pct = Math.min(100, Math.max(0, (w.balance / (limitVal || 1)) * 100));
                return `
                  <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:750; color:#475569; margin-bottom:4px;">
                    <span>${w.name}</span>
                    <span>฿${w.balance.toLocaleString()} / ฿${limitVal.toLocaleString()}</span>
                  </div>
                  <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${pct}%; background:#ea580c;"></div>
                  </div>
                `;
              })()}
            </div>
            <div style="margin-top:15px;">
              ${(() => {
                const w = state.moneyWallets.find(x => x.id === 'seasycash');
                const limitVal = w.limit || 20000;
                const pct = Math.min(100, Math.max(0, (w.balance / (limitVal || 1)) * 100));
                return `
                  <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:750; color:#475569; margin-bottom:4px;">
                    <span>${w.name}</span>
                    <span>฿${w.balance.toLocaleString()} / ฿${limitVal.toLocaleString()}</span>
                  </div>
                  <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${pct}%; background:#ef4444;"></div>
                  </div>
                `;
              })()}
            </div>
          </div>
          
          <div class="mp-card">
            <h3 style="margin-top:0; font-size:14px; font-weight:850; color:#1e293b; margin-bottom:12px;">➕ บันทึกหนี้สินทั่วไป</h3>
            <div style="margin-bottom:8px;">
              <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:2px;">ชื่อหนี้สิน / การซื้อ</label>
              <input type="text" class="glass-input sm" id="debtName" placeholder="เช่น ผ่อนมอเตอร์ไซค์" style="width:100%;">
            </div>
            <div style="margin-bottom:8px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:2px;">ยอดผ่อนงวดละ (บาท)</label>
                <input type="number" class="glass-input sm" id="debtPay" placeholder="฿" style="width:100%;">
              </div>
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:2px;">จำนวนงวดที่เหลือ</label>
                <input type="number" class="glass-input sm" id="debtMonths" value="6" style="width:100%;">
              </div>
            </div>
            <button class="btn-pastel-primary sm" onclick="
              const name = document.getElementById('debtName').value;
              const pay = parseFloat(document.getElementById('debtPay').value);
              const m = parseInt(document.getElementById('debtMonths').value);
              if(!name || isNaN(pay) || isNaN(m)) { showToast('⚠️ ข้อมูลไม่ครบถ้วน', 'err'); return; }
              state.moneyInstallments.push({
                id: 'inst_' + Date.now(),
                name,
                walletId: 'cash',
                principal: pay * m,
                interestRate: 0,
                totalPayable: pay * m,
                monthlyPayment: pay,
                remainingMonths: m,
                totalMonths: m,
                paidMonths: 0,
                tags: '#general'
              });
              saveMoneyPod(); render(); showToast('✅ บันทึกยอดหนี้สินเรียบร้อย');
            " style="width:100%; margin-top:8px;">💾 บันทึกสัญญานี้</button>
          </div>
        </div>
        
        <!-- Active Installments & Scheduler -->
        <div class="mp-card">
          <h3 style="margin-top:0; font-size:15px; font-weight:900; color:var(--primary); margin-bottom:15px;">📊 รายการสัญญาผ่อนชำระที่ทำงานอยู่ (Active Installments)</h3>
          
          ${state.moneyInstallments.map(i => {
            const progress = (i.paidMonths / i.totalMonths) * 100;
            const wName = i.walletId === 'spaylater' ? '🛍️ SPayLater' : (i.walletId === 'seasycash' ? '💸 S EasyCash' : '💵 หนี้ทั่วไป');
            return `
              <div style="background:white; border-radius:18px; padding:16px; border:1px solid rgba(0,0,0,0.04); margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.01);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                  <div>
                    <span style="font-size:14px; font-weight:850; color:#1e293b;">${i.name}</span>
                    <div style="font-size:10px; font-weight:750; color:#64748b; margin-top:2px;">ผ่านระบบบัญชี: ${wName}</div>
                  </div>
                  <div style="text-align:right;">
                    <span style="font-size:14px; font-weight:900; color:#ef4444;">฿${i.monthlyPayment.toFixed(0)} / ด.</span>
                    <div style="font-size:9.5px; color:#94a3b8; margin-top:1px;">ยอดเต็มผ่อนชำระ: ฿${i.totalPayable.toFixed(0)}</div>
                  </div>
                </div>
                
                <div style="display:flex; justify-content:space-between; font-size:10px; color:#64748b; margin-top:8px;">
                  <span>งวดปัจจุบัน: ${i.paidMonths} / ${i.totalMonths} เดือน</span>
                  <span>ความก้าวหน้า ${Math.round(progress)}%</span>
                </div>
                <div class="goal-progress-bar">
                  <div class="goal-progress-fill" style="width: ${progress}%;"></div>
                </div>
                
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
                  <button class="btn-glass-pastel" onclick="mpEditInstallment('${i.id}')" style="padding:6px 12px; border-color:#4f46e5; color:#4f46e5; font-size:11px;">✏️ แก้ไขสัญญา</button>
                  <button class="btn-glass-pastel" onclick="mpDeleteInstallment('${i.id}')" style="padding:6px 12px; border-color:#ef4444; color:#ef4444; font-size:11px;">🗑️ ลบสัญญา</button>
                  <button class="btn-glass-pastel" onclick="mpPayInstallment('${i.id}')" style="padding:6px 12px; border-color:var(--primary); color:var(--primary); font-size:11px;">💳 ชำระงวดประจำเดือน</button>
                </div>
              </div>
            `;
          }).join('')}
          ${state.moneyInstallments.length === 0 ? '<div style="padding:50px; text-align:center; color:#94a3b8; font-size:12.5px;">🎉 ยินดีด้วยครับ! ไม่มีสัญญาหรือหนี้สินผ่อนชำระค้างในระบบ</div>' : ''}
        </div>
      </div>
    `;
  } else if (subView === 'goals') {
    mainContent = `
      <div class="mp-grid">
        <!-- New Goal Maker -->
        <div class="mp-card">
          <h3 style="margin-top:0; font-size:14px; font-weight:850; color:#1e293b; margin-bottom:12px;">🎯 ตั้งเป้าหมายเก็บเงินใหม่</h3>
          <div style="margin-bottom:8px;">
            <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:2px;">ระบุเป้าหมาย (เช่น เที่ยวทะเล, ซื้อกล้อง)</label>
            <input type="text" class="glass-input sm" id="newGoalName" placeholder="เช่น เงินสำรองฉุกเฉิน 🚨" style="width:100%;">
          </div>
          <div style="margin-bottom:12px;">
            <label style="font-size:10px; font-weight:800; color:#64748b; display:block; margin-bottom:2px;">จำนวนเงินเป้าหมาย (บาท)</label>
            <input type="number" class="glass-input sm" id="newGoalTarget" placeholder="฿" style="width:100%;">
          </div>
          <button class="btn-pastel-primary sm" onclick="mpAddGoal()" style="width:100%;">💾 บันทึกเป้าหมาย</button>
        </div>
        
        <!-- Active Savings Goals list -->
        <div class="mp-card">
          <h3 style="margin-top:0; font-size:15px; font-weight:900; color:var(--primary); margin-bottom:15px;">🐷 ติดตามความคืบหน้าการเก็บเงิน (Savings Goals)</h3>
          
          <div style="display:grid; grid-template-columns:1fr; gap:12px;">
            ${state.moneyGoals.map(g => {
              const pct = Math.min(100, (g.saved / g.target) * 100);
              return `
                <div style="background:white; border-radius:18px; padding:16px; border:1px solid rgba(0,0,0,0.03); box-shadow:0 2px 8px rgba(0,0,0,0.01);">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:14px; font-weight:850; color:#1e293b;">${g.name}</span>
                    <span style="font-size:14px; font-weight:900; color:var(--primary);">฿${g.saved.toLocaleString()} / ฿${g.target.toLocaleString()}</span>
                  </div>
                  
                  <div style="display:flex; justify-content:space-between; font-size:10px; color:#64748b; margin-top:8px;">
                    <span>เป้าหมายความสำเร็จ</span>
                    <span>${Math.round(pct)}%</span>
                  </div>
                  <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${pct}%;"></div>
                  </div>
                  
                  <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
                    <button class="btn-glass-pastel" onclick="mpEditGoal('${g.id}')" style="padding:6px 12px; font-size:11px; border-color:#4f46e5; color:#4f46e5;">✏️ แก้ไขเป้าหมาย</button>
                    <button class="btn-glass-pastel" onclick="mpDeleteGoal('${g.id}')" style="padding:6px 12px; font-size:11px; border-color:#ef4444; color:#ef4444; background:rgba(239, 68, 68, 0.05);">🗑️ ลบเป้าหมาย</button>
                    <button class="btn-glass-pastel" onclick="mpDepositGoal('${g.id}')" style="padding:6px 12px; font-size:11px; border-color:var(--primary); color:var(--primary);">💰 ฝากเงินเข้าออม</button>
                  </div>
                </div>
              `;
            }).join('')}
            ${state.moneyGoals.length === 0 ? '<div style="padding:50px; text-align:center; color:#94a3b8; font-size:12.5px;">ยังไม่มีเป้าหมายการออม ให้เริ่มต้นสร้างเป้าหมายกันเถอะครับ!</div>' : ''}
          </div>
        </div>
      </div>
    `;
  } else if (subView === 'reports') {
    const categoryTotals = {};
    let totalSpent = 0;
    state.moneyTransactions.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      totalSpent += t.amount;
    });
    
    mainContent = `
      <div class="mp-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
          <h2 style="margin:0; font-size:16px; font-weight:900; color:#1e293b;">📊 สถิติแบ่งตามหมวดหมู่ค่าใช้จ่าย (Expense Statistics)</h2>
          <button class="btn-glass-pastel" onclick="mpExportCSV()"><span style="font-size:14px;">📥</span> ส่งออกรายงาน Excel (CSV)</button>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr; gap:15px; margin-bottom:25px;">
          ${Object.entries(categoryTotals).map(([cat, amt]) => {
            const pct = Math.round((amt / totalSpent) * 100);
            return `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:750; color:#475569; margin-bottom:4px;">
                  <span>${cat} (${pct}%)</span>
                  <span style="font-weight:900; color:#ef4444;">฿${amt.toLocaleString()}</span>
                </div>
                <div class="goal-progress-bar">
                  <div class="goal-progress-fill" style="width: ${pct}%; background:var(--primary);"></div>
                </div>
              </div>
            `;
          }).join('')}
          ${Object.keys(categoryTotals).length === 0 ? '<div style="padding:50px; text-align:center; color:#94a3b8; font-size:12.5px;">ยังไม่มีสถิติรายจ่ายในฐานข้อมูลการเงินขณะนี้</div>' : ''}
        </div>
        
        <div style="border-top:1px solid rgba(0,0,0,0.05); padding-top:20px;">
          <h3 style="margin-top:0; font-size:13.5px; font-weight:800; color:#64748b;">🏷️ ค้นหาด่วนด้วยแฮชแท็ก (#Hashtags)</h3>
          <div style="display:flex; gap:8px; margin-bottom:15px;">
            <input type="text" class="glass-input sm" id="reportTagSearch" placeholder="ระบุแฮชแท็ก เช่น #seven, #shabu" style="flex:1;">
            <button class="btn-pastel-primary sm" onclick="mpSearchTags()">ค้นหา</button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    ${scopedStyle}
    <div class="mp-wrap ${themeClass}">
      <div class="mp-header">
        <div class="mp-title-section">
          <h1>🐽 MoneyPod Dashboard</h1>
          <p>เครื่องมือจัดการการเงินอัจฉริยะแบบบูรณาการ: ผ่อนชำระ SPayLater/SEasyCash & ออมเงิน</p>
        </div>
        
        <div class="mp-theme-picker">
          <div class="theme-dot mint" onclick="mpSetTheme('theme-mint')" title="Mint Fresh"></div>
          <div class="theme-dot peach" onclick="mpSetTheme('theme-peach')" title="Honey Peach"></div>
          <div class="theme-dot pink" onclick="mpSetTheme('theme-pink')" title="Bubblegum Pink"></div>
          <div class="theme-dot lavender" onclick="mpSetTheme('theme-lavender')" title="Lavender Cream"></div>
        </div>
      </div>
      
      <div class="mp-subview-tabs">
        <button class="mp-tab-btn ${subView === 'overview' ? 'active' : ''}" onclick="mpSetView('overview')">💵 แผงภาพรวมบัญชี</button>
        <button class="mp-tab-btn ${subView === 'installments' ? 'active' : ''}" onclick="mpSetView('installments')">🛍️ ผ่อนชำระ & หนี้สิน</button>
        <button class="mp-tab-btn ${subView === 'goals' ? 'active' : ''}" onclick="mpSetView('goals')">🎯 เป้าหมายการออม</button>
        <button class="mp-tab-btn ${subView === 'reports' ? 'active' : ''}" onclick="mpSetView('reports')">📊 สถิติ & ส่งออก</button>
      </div>
      
      ${mainContent}
    </div>
  `;
}
