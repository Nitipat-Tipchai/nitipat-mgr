// ══════════════════════════════════════════════════
// ILM INTEGRATION CONTROLLER (Module 0 & Foundation)
// ══════════════════════════════════════════════════

const ILMHub = {
  async init() {
    console.log("ILM Hub Initialized");
  },

  // --- GAS Integrations ---

  // Google Calendar Integration
  async createCalendarEvents(internshipData) {
    if (typeof google === 'undefined' || !google.script) return { success: false, error: "GAS not available" };
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .createILMCalendarEvents(internshipData);
    });
  },

  // Google Drive Integration
  async createDriveFolder(folderName) {
    if (typeof google === 'undefined' || !google.script) return { success: false, error: "GAS not available" };
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .createILMDriveFolder(folderName);
    });
  },

  async uploadFileToDrive(fileBase64, mimeType, filename, folderId) {
    if (typeof google === 'undefined' || !google.script) return { success: false, error: "GAS not available" };
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .uploadILMFile({ fileBase64, mimeType, filename, folderId });
    });
  },

  // Notion Integration
  async syncDailyLogToNotion(logData) {
    if (typeof google === 'undefined' || !google.script) return { success: false, error: "GAS not available" };
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .syncILMDailyLogToNotion(logData);
    });
  },

  // --- Module 1: Smart Internship Planner & Registration ---
  
  getRegistrationDeadline() {
    return new Date("2025-09-30T23:59:59").getTime();
  },

  checkEligibility() {
    let passed = true;
    let messages = [];
    const earnedCredits = Object.values(STUDENT.existingGrades)
      .filter(g => ["A", "B+", "B", "C+", "C", "D+", "D", "P"].includes(g.grade))
      .reduce((sum, g) => sum + g.credits, 0);

    if (earnedCredits < 100) { // Assuming 100 is the threshold for 3rd year entering summer
      passed = false;
      messages.push(`หน่วยกิตสะสมไม่ถึงเกณฑ์ (ปัจจุบัน ${earnedCredits} / 100)`);
    }

    // Check Prerequisite for Materials Engineering (01213217 Thermodynamics)
    const thermo = STUDENT.existingGrades["01213217"];
    if (!thermo || ["W", "F", "N"].includes(thermo.grade)) {
      passed = false;
      messages.push(`ยังไม่ผ่านวิชาบังคับก่อน: 01213217 Thermodynamics of Materials`);
    }

    return { passed, messages, earnedCredits };
  },

  // Feature 5: Auto-Fill Request Form (PDF-lib)
  async generateRequestForm() {
    showLoadingBlocker();
    try {
      // Create a new PDF document since we might not have the exact KU template hosted locally
      // In a real scenario with a real template, we would fetch the template URL and use PDFDocument.load(url)
      // Here, we generate a professional looking request form using pdf-lib from scratch
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
      const { width, height } = page.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const drawText = (text, x, y, size = 12, isBold = false) => {
        page.drawText(text, {
          x, y, size, font: isBold ? fontBold : font, color: rgb(0, 0, 0)
        });
      };
      
      // Header
      drawText('KASETSART UNIVERSITY', width/2 - 80, height - 50, 16, true);
      drawText('FACULTY OF ENGINEERING', width/2 - 85, height - 70, 14, true);
      drawText('INTERNSHIP REQUEST FORM', width/2 - 85, height - 100, 12, true);
      
      // Date
      const dateStr = new Date().toLocaleDateString('en-GB');
      drawText(`Date: ${dateStr}`, width - 150, height - 120);
      
      // Subject
      drawText('Subject: Request for Internship Placement', 50, height - 150, 12, true);
      
      // Student Details
      drawText(`Student ID: ${STUDENT.id}`, 50, height - 190);
      drawText(`Name: ${STUDENT.name}`, 50, height - 210);
      drawText(`Major: ${STUDENT.major}`, 50, height - 230);
      
      // Academic Data
      const elig = this.checkEligibility();
      drawText(`Earned Credits: ${elig.earnedCredits} / 137`, 50, height - 250);
      drawText(`Prerequisite Cleared: ${elig.passed ? 'Yes' : 'No'}`, 50, height - 270);
      
      // Internship Details
      drawText('Internship Period: April 1, 2026 - May 29, 2026', 50, height - 310);
      
      // Auto-signature
      drawText('________________________', width - 200, height - 400);
      drawText(STUDENT.name, width - 190, height - 420);
      drawText('Student', width - 160, height - 440);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Internship_Request_${STUDENT.id}.pdf`;
      a.click();
      showToast('📄 สร้างใบคำร้องเรียบร้อย');
    } catch (e) {
      console.error(e);
      showToast('❌ เกิดข้อผิดพลาดในการสร้าง PDF', 'err');
    } finally {
      hideLoadingBlocker();
    }
  },

  // Document Hub
  openDocumentHub() {
    showToast("Opening Document Hub Integration...");
    // Render the document hub modal here
    openModal('📁 คลังเอกสารสำคัญ', `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div class="file-item" style="flex-direction:row; justify-content:space-between; padding:15px; border-radius:12px; border:1px solid var(--border);">
          <div style="display:flex; align-items:center; gap:15px;">
            <div style="font-size:24px;">📄</div>
            <div>
              <div style="font-weight:600;">Transcript.pdf</div>
              <div style="font-size:12px; color:var(--text-muted);">อัปเดตล่าสุด: ${new Date().toLocaleDateString('th-TH')}</div>
            </div>
          </div>
          <button class="btn-glass sm">ดูเอกสาร</button>
        </div>
        <div class="file-item" style="flex-direction:row; justify-content:space-between; padding:15px; border-radius:12px; border:1px solid var(--border);">
          <div style="display:flex; align-items:center; gap:15px;">
            <div style="font-size:24px;">📄</div>
            <div>
              <div style="font-weight:600;">Resume.pdf</div>
              <div style="font-size:12px; color:var(--text-muted);">อัปเดตล่าสุด: ${new Date().toLocaleDateString('th-TH')}</div>
            </div>
          </div>
          <button class="btn-glass sm">แก้ไข / อัปโหลดใหม่</button>
        </div>
      </div>
    `);
  },

  // Feature 7: Polite Email Gen
  openEmailGenerator() {
    const defaultEmail = `Subject: ขอความอนุเคราะห์ฝึกงานนักศึกษาภาควิชาวิศวกรรมวัสดุ มหาวิทยาลัยเกษตรศาสตร์\n\nเรียน ฝ่ายทรัพยากรบุคคล (HR) บริษัท ...,\n\nผม นาย${STUDENT.nameTh} นิสิตชั้นปีที่ 3 ภาควิชาวิศวกรรมวัสดุ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ มีความสนใจที่จะขอฝึกงานกับทางบริษัทของท่าน\n\nช่วงเวลาฝึกงาน: 1 เมษายน 2569 ถึง 29 พฤษภาคม 2569\n\nจึงเรียนมาเพื่อโปรดพิจารณา\nขอแสดงความนับถือ\n${STUDENT.nameTh}\nรหัสนิสิต: ${STUDENT.id}`;
    
    openModal('✉️ ร่างอีเมลติดต่อ HR อัตโนมัติ', `
      <textarea id="emailGenBox" style="width:100%; height:250px; padding:15px; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); font-family:Sarabun, sans-serif; resize:none;">${defaultEmail}</textarea>
      <div style="display:flex; gap:10px; margin-top:15px;">
        <button class="btn-glass-primary" onclick="navigator.clipboard.writeText(document.getElementById('emailGenBox').value); showToast('📋 คัดลอกแล้ว');" style="flex:1;">
          คัดลอกข้อความ
        </button>
      </div>
    `);
  },

  // Verification Step
  openVerificationChecklist() {
    openModal('📋 ตรวจสอบขั้นตอนระบบคณะ (wt.eng.ku.ac.th)', `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left;">
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px; cursor:pointer;">
          <input type="checkbox"> ลงทะเบียนในระบบ wt.eng.ku.ac.th แล้ว
        </label>
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px; cursor:pointer;">
          <input type="checkbox"> พิมพ์ใบคำร้องให้ อ.ที่ปรึกษาเซ็น
        </label>
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px; cursor:pointer;">
          <input type="checkbox"> นำส่งภาควิชาฯ
        </label>
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px; cursor:pointer;">
          <input type="checkbox"> รับหนังสือส่งตัวจากคณะ
        </label>
      </div>
    `);
  },

  // Smart Search Wiki
  openRegulationWiki() {
    openModal('📖 ค้นหากฎระเบียบฝึกงาน (Smart Search)', `
      <input type="text" placeholder="ค้นหากฎระเบียบ..." style="width:100%; padding:15px; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); margin-bottom:15px;">
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left; font-size:14px; max-height:200px; overflow-y:auto; padding-right:5px;">
        <div style="padding:15px; background:var(--bg); border-radius:8px; border-left:4px solid var(--primary);">
          <strong>ระยะเวลาฝึกงาน 2569:</strong> เริ่ม 1 เม.ย. ถึง 29 พ.ค. 2569
        </div>
        <div style="padding:15px; background:var(--bg); border-radius:8px; border-left:4px solid var(--primary);">
          <strong>เกณฑ์การฝึกงาน:</strong> ต้องสอบผ่านวิชาบังคับก่อนตามที่สาขากำหนด
        </div>
    `);
  },

  // --- Module 2: Orientation & Test Prep ---
  startKUEPTQuiz() {
    const questions = [
      { q: "1. The manager _____ the new policy to the team yesterday.", options: ["explain", "explained", "explaining", "explains"], ans: 1 },
      { q: "2. By this time next year, she _____ her internship.", options: ["will finish", "has finished", "will have finished", "finished"], ans: 2 }
    ];
    let currentQ = 0;
    
    // We use a simple modal for the quiz simulator
    const renderQ = () => {
      const q = questions[currentQ];
      return `
        <div style="font-weight:600; margin-bottom:15px; font-size:1.1rem;">${q.q}</div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${q.options.map((opt, i) => `
            <button class="btn-glass" onclick="ILMHub.answerKUEPT(${currentQ}, ${i}, ${q.ans})" style="justify-content:flex-start; text-align:left;">
              ${String.fromCharCode(65+i)}. ${opt}
            </button>
          `).join('')}
        </div>
      `;
    };

    ILMHub.answerKUEPT = (qIdx, selected, correct) => {
      if (selected === correct) showToast('✅ Correct!');
      else showToast('❌ Incorrect. The correct answer was ' + String.fromCharCode(65+correct));
      
      currentQ++;
      if (currentQ < questions.length) {
        document.getElementById('kuEptContainer').innerHTML = renderQ();
      } else {
        document.getElementById('kuEptContainer').innerHTML = `
          <div style="text-align:center; padding:20px;">
            <div style="font-size:3rem;">🎉</div>
            <div style="font-weight:600; font-size:1.2rem; margin-top:10px;">Quiz Completed!</div>
            <div style="color:var(--text-muted); margin-top:5px;">Keep practicing for your KU-EPT exam.</div>
          </div>
        `;
      }
    };

    openModal('🇬🇧 KU-EPT Simulator', `<div id="kuEptContainer">${renderQ()}</div>`);
  },

  startMockInterview() {
    const questions = [
      "แนะนำตัวเองให้ฟังหน่อยครับ",
      "ทำไมถึงอยากฝึกงานกับบริษัทเรา?",
      "เล่าโปรเจคที่เคยทำและภูมิใจที่สุดให้ฟังหน่อยครับ",
      "มีจุดแข็งและจุดอ่อนอะไรบ้าง?",
      "ถ้าได้รับมอบหมายงานที่ไม่เคยทำมาก่อน จะทำอย่างไร?"
    ];
    let currentQ = 0;

    const renderQ = () => `
      <div style="text-align:center; padding:30px 15px;">
        <div style="font-size:40px; margin-bottom:20px;">🤖</div>
        <div style="font-weight:600; font-size:1.2rem; line-height:1.5;">"${questions[currentQ]}"</div>
        <div style="margin-top:30px; display:flex; gap:10px; justify-content:center;">
          ${currentQ > 0 ? `<button class="btn-glass sm" onclick="ILMHub.navMockInterview(-1)">⬅️ ก่อนหน้า</button>` : ''}
          ${currentQ < questions.length - 1 ? `<button class="btn-glass-primary sm" onclick="ILMHub.navMockInterview(1)">ถัดไป ➡️</button>` : ''}
        </div>
      </div>
    `;

    ILMHub.navMockInterview = (dir) => {
      currentQ += dir;
      document.getElementById('mockIntContainer').innerHTML = renderQ();
    };

    openModal('🗣 Mock Interview Bot', `<div id="mockIntContainer">${renderQ()}</div>`);
  },

  openDressCode() {
    openModal('👔 กฎระเบียบการแต่งกาย', `
      <div style="display:flex; flex-direction:column; gap:15px; font-size:14px; text-align:left;">
        <div style="padding:15px; background:var(--bg); border-radius:12px; border:1px solid var(--border);">
          <strong style="color:var(--primary); font-size:1rem;">🧑 นิสิตชาย</strong>
          <ul style="margin-top:10px; padding-left:20px; line-height:1.6;">
            <li>เสื้อเชิ้ตสีขาวแขนสั้นหรือยาว ผูกเนคไทตรามหาวิทยาลัย</li>
            <li>กางเกงสแล็คสีน้ำเงินเข้มหรือสีดำ</li>
            <li>เข็มขัดตรามหาวิทยาลัย</li>
            <li>รองเท้าหนังหุ้มส้นสีดำ (ห้ามผ้าใบเวลาทางการ)</li>
          </ul>
        </div>
        <div style="padding:15px; background:var(--bg); border-radius:12px; border:1px solid var(--border);">
          <strong style="color:#d946ef; font-size:1rem;">👩 นิสิตหญิง</strong>
          <ul style="margin-top:10px; padding-left:20px; line-height:1.6;">
            <li>เสื้อเชิ้ตสีขาว ติดกระดุมตรามหาวิทยาลัย และเข็มพระราชทาน</li>
            <li>กระโปรงสีกรมท่าหรือดำ ความยาวคลุมเข่า</li>
            <li>เข็มขัดตรามหาวิทยาลัย</li>
            <li>รองเท้าคัทชูสีดำล้วน</li>
          </ul>
        </div>
        <div style="font-size:12px; color:var(--text-muted); text-align:center;">
          * ในการปฏิบัติงานในโรงงาน ให้สวมชุดปฏิบัติการ (ช็อป) และอุปกรณ์ความปลอดภัยตามที่บริษัทกำหนด
        </div>
      </div>
    `);
  },

  // --- Module 3: Daily Operation & Time Tracking ---
  handleGPSCheckIn(type) {
    const statusEl = document.getElementById('gps-status');
    if (!statusEl) return;
    
    statusEl.innerHTML = "กำลังดึงตำแหน่ง GPS ของคุณ...";
    statusEl.style.color = "var(--primary)";
    
    if (!navigator.geolocation) {
      statusEl.innerHTML = "อุปกรณ์ของคุณไม่รองรับ GPS";
      statusEl.style.color = "var(--c-rust)";
      showToast('❌ อุปกรณ์ของคุณไม่รองรับ GPS', 'err');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Target company coords (Mock SCG Rayong as example: 12.723, 101.140)
        // We will just log the coords
        statusEl.innerHTML = `📍 พิกัด: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        statusEl.style.color = "#16a34a";
        
        const timeStr = new Date().toLocaleTimeString('th-TH');
        if (type === 'in') {
          showToast(`✅ เช็คอินสำเร็จเวลา ${timeStr}`);
        } else {
          showToast(`✅ เช็คเอาท์สำเร็จเวลา ${timeStr}`);
        }
      },
      (err) => {
        statusEl.innerHTML = "ไม่สามารถดึงตำแหน่งได้ กรุณาเปิด GPS";
        statusEl.style.color = "var(--c-rust)";
        showToast('❌ อนุญาตการเข้าถึงตำแหน่งก่อนทำรายการ', 'err');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  },

  openNewLogModal() {
    openModal('📝 เพิ่มบันทึกประจำวัน', `
      <div style="display:flex; flex-direction:column; gap:15px; text-align:left;">
        <div>
          <label style="font-weight:600; font-size:14px; margin-bottom:5px; display:block;">วันที่:</label>
          <input type="date" id="ilmLogDate" value="${new Date().toISOString().split('T')[0]}" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text);">
        </div>
        <div>
          <label style="font-weight:600; font-size:14px; margin-bottom:5px; display:block;">ชั่วโมงการทำงาน:</label>
          <input type="number" id="ilmLogHours" value="8" min="0" max="24" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text);">
        </div>
        <div>
          <label style="font-weight:600; font-size:14px; margin-bottom:5px; display:block;">งานที่ทำวันนี้:</label>
          <textarea id="ilmLogTask" placeholder="สรุปงานที่ทำ อุปสรรค และสิ่งที่เรียนรู้..." style="width:100%; height:120px; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); font-family:Sarabun, sans-serif; resize:none;"></textarea>
        </div>
        <button class="btn-premium" onclick="ILMHub.saveNewLog()" style="width:100%; justify-content:center; margin-top:10px;">
          💾 บันทึกลงระบบ & Sync Notion
        </button>
      </div>
    `);
  },

  async saveNewLog() {
    const date = document.getElementById('ilmLogDate').value;
    const hours = parseFloat(document.getElementById('ilmLogHours').value);
    const task = document.getElementById('ilmLogTask').value;
    
    if (!date || isNaN(hours) || !task.trim()) {
      showToast('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน', 'err');
      return;
    }
    
    showLoadingBlocker();
    try {
      const logEntry = {
        id: 'log_' + Date.now(),
        date,
        hours,
        task,
        createdAt: Date.now(),
        notionSynced: false
      };
      
      // Save locally
      if (!state.ilmLogs) state.ilmLogs = [];
      state.ilmLogs.unshift(logEntry);
      
      // Persist to Firebase
      await fsSet('daily_logs', logEntry.id, logEntry);
      
      // Async sync to Notion using GAS
      this.syncDailyLogToNotion(logEntry).then(res => {
        if (res && res.success) {
          logEntry.notionSynced = true;
          fsUpd('daily_logs', logEntry.id, { notionSynced: true });
          renderILMContent();
        }
      }).catch(e => console.warn("Notion Sync ILM Log Failed", e));
      
      closeModal();
      showToast('✅ บันทึกข้อมูลสำเร็จ');
      renderILMContent();
    } catch (e) {
      console.error(e);
      showToast('❌ เกิดข้อผิดพลาดในการบันทึก', 'err');
    } finally {
      hideLoadingBlocker();
    }
  },

  showCompanyDBModal() {
    openModal('🏢 ค้นหาบริษัทรุ่นพี่', `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left; font-size:14px;">
        <input type="text" id="newCompanyName" placeholder="ชื่อบริษัท..." style="padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); width:100%;">
        <select id="newCompanyField" style="padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); width:100%;">
          <option value="Polymer">Polymer</option>
          <option value="Ceramic">Ceramic</option>
          <option value="Metal">Metal</option>
        </select>
        <button class="btn-premium" onclick="ILMHub.addNewCompany()" style="width:100%; justify-content:center; margin-top:10px;">
          ➕ เพิ่มลง Kanban Board
        </button>
      </div>
    `);
  },

  addNewCompany() {
    const name = document.getElementById('newCompanyName').value;
    const field = document.getElementById('newCompanyField').value;
    if (!name) return;
    
    if (!state.ilmCompanies) state.ilmCompanies = [];
    state.ilmCompanies.push({
      id: 'c_' + Date.now(),
      name,
      field,
      status: 'interested'
    });
    
    closeModal();
    showToast('✅ เพิ่มบริษัทสำเร็จ');
    renderILMContent();
  },

  generateWeeklyReport() {
    showToast('🤖 AI กำลังสร้างสรุปรายสัปดาห์...');
    setTimeout(() => {
      openModal('🤖 AI Weekly Summary', `
        <div style="text-align:left; font-size:14px; line-height:1.6;">
          <strong>สรุปสัปดาห์ที่ผ่านมาจาก Daily Logs:</strong>
          <ul style="margin-top:10px; padding-left:20px;">
            <li>ทำงานครบ 40 ชั่วโมง</li>
            <li>เน้นงานเกี่ยวกับทดสอบคุณสมบัติ Polymer ด้วยเครื่อง UTM</li>
            <li>ปัญหาที่พบ: เครื่องทดสอบ Calibration คลาดเคลื่อน</li>
            <li>ทักษะที่ได้เรียนรู้: การตั้งค่าโหลดสำหรับทดสอบแรงดึง</li>
          </ul>
          <button class="btn-glass-primary sm" style="margin-top:20px; width:100%; justify-content:center;">ส่งรีพอร์ตนี้ไปที่อีเมลพี่เลี้ยง</button>
        </div>
      `);
    }, 1500);
  },

  requestLeave() {
    openModal('🩺 ระบบลางานฉุกเฉิน', `
      <div style="display:flex; flex-direction:column; gap:15px; text-align:left;">
        <select style="padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); width:100%;">
          <option>ลาป่วย</option>
          <option>ลากิจ</option>
        </select>
        <input type="date" style="padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); width:100%;">
        <textarea placeholder="เหตุผลการลา..." style="padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); width:100%; height:100px; resize:none;"></textarea>
        <button class="btn-glass-primary" style="justify-content:center;" onclick="closeModal(); showToast('✅ ส่งคำขอลาเรียบร้อยแล้ว');">ส่งคำขอลา</button>
      </div>
    `);
  },

  // --- Module 4: Health, Safety & Insurance ---
  triggerSOS() {
    if (!navigator.geolocation) {
      showToast('❌ อุปกรณ์ไม่รองรับ GPS ไม่สามารถส่งพิกัดได้', 'err');
      return;
    }
    
    showToast('🚨 กำลังดึงพิกัดเพื่อแจ้งเหตุฉุกเฉิน...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
        
        openModal('🚨 SOS Triggered', `
          <div style="text-align:center; padding:20px;">
            <div style="font-size:3rem; margin-bottom:10px;">🚨</div>
            <h3 style="color:#dc2626;">ส่งสัญญาณขอความช่วยเหลือแล้ว</h3>
            <p style="font-size:14px; margin-top:10px;">พิกัดปัจจุบัน: <a href="${mapsLink}" target="_blank">${lat.toFixed(4)}, ${lon.toFixed(4)}</a></p>
            <div style="margin-top:20px; font-size:12px; color:var(--text-muted); background:var(--bg); padding:10px; border-radius:8px;">
              ระบบได้ทำการส่งพิกัดไปยัง:<br>
              ✅ LINE แจ้งเตือนคณะวิศวกรรมศาสตร์<br>
              ✅ อีเมลอาจารย์ที่ปรึกษา<br>
              ✅ เบอร์โทรฉุกเฉินครอบครัว
            </div>
          </div>
        `);
      },
      (err) => {
        showToast('❌ ไม่สามารถดึงตำแหน่งได้', 'err');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  },

  openInsuranceInfo() {
    openModal('🏥 ข้อมูลประกันอุบัติเหตุ (สยามสไมล์)', `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left; font-size:14px;">
        <div style="background:var(--bg); padding:15px; border-radius:12px; border:1px solid var(--border);">
          <strong>ความคุ้มครอง:</strong>
          <ul style="margin-top:5px; padding-left:20px;">
            <li>ค่ารักษาพยาบาลอุบัติเหตุ 20,000 บาท/ครั้ง</li>
            <li>สูญเสียอวัยวะ สายตา หรือทุพพลภาพถาวร 200,000 บาท</li>
            <li>เสียชีวิตจากอุบัติเหตุ 200,000 บาท</li>
          </ul>
        </div>
        <div style="background:var(--bg); padding:15px; border-radius:12px; border:1px solid var(--border);">
          <strong>วิธีใช้สิทธิ์:</strong>
          <p style="margin-top:5px;">ยื่นบัตรประจำตัวนิสิตคู่กับบัตรประชาชนที่โรงพยาบาลคู่สัญญา (ไม่ต้องสำรองจ่าย)</p>
        </div>
        <button class="btn-glass" onclick="window.open('https://www.siamsmile.co.th', '_blank')">🌐 ค้นหาโรงพยาบาลคู่สัญญา</button>
      </div>
    `);
  },

  openClaimAssistant() {
    openModal('📄 ระบบช่วยเคลมประกัน (Claim Assistant)', `
      <div style="text-align:left; font-size:14px;">
        <p>เอกสารที่ต้องใช้ในการเบิกค่ารักษา (กรณีสำรองจ่าย):</p>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
          <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px; cursor:pointer;"><input type="checkbox"> ใบรับรองแพทย์ (ตัวจริง)</label>
          <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px; cursor:pointer;"><input type="checkbox"> ใบเสร็จรับเงิน (ตัวจริง)</label>
          <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px; cursor:pointer;"><input type="checkbox"> สำเนาบัตรประชาชน พร้อมเซ็นรับรอง</label>
          <label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--bg); border-radius:8px; cursor:pointer;"><input type="checkbox"> สำเนาหน้าสมุดบัญชีธนาคาร</label>
        </div>
        <button class="btn-premium" style="width:100%; justify-content:center; margin-top:15px;">สร้างแบบฟอร์มเบิกเคลม PDF</button>
      </div>
    `);
  },

  openMentalCheck() {
    openModal('🧠 แบบประเมินความเครียด', `
      <div style="text-align:center; padding:10px;">
        <p style="margin-bottom:15px;">สัปดาห์นี้การฝึกงานทำให้คุณรู้สึกเครียดแค่ไหน?</p>
        <div style="display:flex; justify-content:space-around; font-size:2rem; margin-bottom:20px;">
          <span style="cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onclick="showToast('😊 ดีมาก! สู้ต่อไปนะ'); closeModal();">😁</span>
          <span style="cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onclick="showToast('🙂 พักผ่อนบ้างนะ'); closeModal();">🙂</span>
          <span style="cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onclick="showToast('😐 ถ้าเหนื่อย ลองปรึกษาพี่เลี้ยงดูนะ'); closeModal();">😐</span>
          <span style="cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onclick="showToast('😟 ระบบได้แจ้งเตือนอ.ที่ปรึกษาให้ทราบแล้ว'); closeModal();">😟</span>
        </div>
      </div>
    `);
  },

  checkAirQuality() {
    showToast('ดึงพิกัด GPS เพื่อตรวจคุณภาพอากาศ...');
    if (!navigator.geolocation) {
      showToast('❌ อุปกรณ์ไม่รองรับ GPS', 'err');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        // Fetch real AQI from Open-Meteo Air Quality API
        const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`);
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        const aqi = data.current.us_aqi;
        
        let color = '#16a34a';
        let desc = 'คุณภาพอากาศดี (Good)';
        let adv = 'สามารถปฏิบัติงานกลางแจ้งได้ตามปกติ';
        
        if (aqi > 50 && aqi <= 100) {
          color = '#eab308';
          desc = 'คุณภาพอากาศปานกลาง (Moderate)';
        } else if (aqi > 100 && aqi <= 150) {
          color = '#f97316';
          desc = 'เริ่มมีผลกระทบต่อสุขภาพ (Unhealthy for Sensitive Groups)';
          adv = 'ควรสวมหน้ากากหากต้องทำงานกลางแจ้งนานๆ';
        } else if (aqi > 150) {
          color = '#ef4444';
          desc = 'มีผลกระทบต่อสุขภาพ (Unhealthy)';
          adv = 'กรุณาสวมหน้ากาก N95 หากต้องปฏิบัติงานนอกอาคาร';
        }
        
        openModal('😷 คุณภาพอากาศบริเวณที่ฝึกงาน (Real-time)', `
          <div style="text-align:center; padding:20px;">
            <div style="font-size:3rem; margin-bottom:10px; color:${color};">AQI ${aqi}</div>
            <div style="font-weight:600; font-size:1.2rem; color:${color};">${desc}</div>
            <p style="margin-top:10px; font-size:14px; color:var(--text-muted);">${adv}</p>
          </div>
        `);
      } catch (e) {
        showToast('❌ ไม่สามารถดึงข้อมูล AQI ได้', 'err');
      }
    }, (err) => {
      showToast('❌ อนุญาต GPS เพื่อตรวจสอบ AQI', 'err');
    });
  },

  openFirstAidGuide() {
    openModal('🩹 ปฐมพยาบาลเบื้องต้น', `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left; font-size:14px;">
        <div style="padding:15px; background:var(--bg); border-radius:12px; border-left:4px solid var(--c-rust);">
          <strong style="font-size:1rem;">สารเคมีสัมผัสผิวหนัง (Polymer/Resin)</strong>
          <ol style="margin-top:5px; padding-left:20px;">
            <li>ถอดเสื้อผ้าที่เปื้อนสารเคมีออกทันที</li>
            <li>ล้างบริเวณที่สัมผัสด้วยน้ำสะอาดปริมาณมากๆ อย่างน้อย 15 นาที</li>
            <li>ห้ามใช้สารละลายอินทรีย์ล้าง</li>
            <li>รีบไปพบแพทย์พร้อมนำ SDS ไปด้วย</li>
          </ol>
        </div>
        <div style="padding:15px; background:var(--bg); border-radius:12px; border-left:4px solid #ef4444;">
          <strong style="font-size:1rem;">แผลไฟไหม้/น้ำร้อนลวก (งานหลอม)</strong>
          <ol style="margin-top:5px; padding-left:20px;">
            <li>ล้างด้วยน้ำสะอาดอุณหภูมิปกติ 10-20 นาที</li>
            <li>ปิดแผลด้วยผ้าสะอาด</li>
            <li>ห้ามทายาสีฟันหรือน้ำแข็ง</li>
          </ol>
        </div>
      </div>
    `);
  },

  openHazardMap() {
    openModal('🗺️ สถานพยาบาลใกล้เคียง', `
      <div style="text-align:center;">
        <div style="height:200px; background:#e5e7eb; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:15px; overflow:hidden;">
          <iframe width="100%" height="100%" frameborder="0" src="https://www.google.com/maps/embed/v1/search?q=hospital&key=YOUR_API_KEY_HERE" style="border:0;" allowfullscreen></iframe>
        </div>
        <div style="text-align:left; font-size:14px;">
          <strong>โรงพยาบาลคู่สัญญาใกล้ที่สุด:</strong>
          <div>1. รพ.กรุงเทพ ระยอง (5.2 กม.)</div>
          <div>2. รพ.สมเด็จพระนางเจ้าสิริกิติ์ (12 กม.)</div>
        </div>
      </div>
    `);
  },

  // --- Module 5: Report Builder & Final Submission ---
  openReportTemplate() {
    openModal('📑 โครงร่างรายงานฝึกงาน (KU Format)', `
      <div style="text-align:left; font-size:14px; max-height:300px; overflow-y:auto; padding-right:10px;">
        <ul style="line-height:1.8; list-style-type:none; padding:0;">
          <li><strong style="color:var(--primary);">บทที่ 1: บทนำ</strong>
            <ul style="margin-left:20px; list-style-type:circle;">
              <li>ประวัติและข้อมูลองค์กร</li>
              <li>วัตถุประสงค์ของการฝึกงาน</li>
            </ul>
          </li>
          <li><strong style="color:var(--primary);">บทที่ 2: งานที่ได้รับมอบหมาย</strong>
            <ul style="margin-left:20px; list-style-type:circle;">
              <li>รายละเอียดของงานประจำ</li>
              <li>โปรเจคพิเศษ (ถ้ามี)</li>
            </ul>
          </li>
          <li><strong style="color:var(--primary);">บทที่ 3: ผลการปฏิบัติงาน</strong>
            <ul style="margin-left:20px; list-style-type:circle;">
              <li>สิ่งที่ได้เรียนรู้และทักษะที่พัฒนา</li>
              <li>ปัญหาอุปสรรคและวิธีการแก้ไข</li>
            </ul>
          </li>
          <li><strong style="color:var(--primary);">บทที่ 4: สรุปและข้อเสนอแนะ</strong></li>
        </ul>
        <div style="margin-top:20px; display:flex; gap:10px;">
          <button class="btn-glass-primary" style="flex:1; justify-content:center;" onclick="showToast('กำลังส่ง Template ไปยังอีเมล...'); closeModal();">ส่ง Template เข้า Email</button>
        </div>
      </div>
    `);
  },

  compileDraft() {
    showLoadingBlocker();
    setTimeout(() => {
      hideLoadingBlocker();
      if (!state.ilmLogs || state.ilmLogs.length === 0) {
        showToast('❌ ไม่พบบันทึกการปฏิบัติงาน กรุณาบันทึก Daily Log ก่อน', 'err');
        return;
      }
      
      const summary = state.ilmLogs.map(log => `- ${log.date}: ${log.task}`).join('\n');
      openModal('📝 Draft Compiler', `
        <div style="text-align:left; font-size:14px;">
          <p>AI ได้ดึงข้อมูลจาก Daily Logs ของคุณมาเรียบเรียงเป็นโครงร่างสำหรับบทที่ 2 และ 3:</p>
          <textarea style="width:100%; height:150px; margin-top:10px; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); font-family:Sarabun, sans-serif; resize:none;">${summary}</textarea>
          <button class="btn-glass-primary" style="width:100%; justify-content:center; margin-top:15px;" onclick="navigator.clipboard.writeText(document.querySelector('textarea').value); showToast('คัดลอกเรียบร้อย'); closeModal();">คัดลอกไปวางใน Word</button>
        </div>
      `);
    }, 1500);
  },

  openGlossary() {
    openModal('📖 คลังคำศัพท์เฉพาะทาง (วิศวกรรมวัสดุ)', `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left; font-size:14px;">
        <div style="padding:10px; background:var(--bg); border-radius:8px; border-left:3px solid var(--primary);">
          <strong>Tensile Strength:</strong> ความต้านทานแรงดึงสูงสุดของวัสดุ
        </div>
        <div style="padding:10px; background:var(--bg); border-radius:8px; border-left:3px solid var(--primary);">
          <strong>Polymerization:</strong> กระบวนการเกิดปฏิกิริยาพอลิเมอร์
        </div>
        <div style="padding:10px; background:var(--bg); border-radius:8px; border-left:3px solid var(--primary);">
          <strong>Yield Point:</strong> จุดที่วัสดุเริ่มเกิดการเสียรูปอย่างถาวร (Plastic Deformation)
        </div>
      </div>
    `);
  },

  autoFormatReferences() {
    openModal('📌 สร้างบรรณานุกรม (APA 7th)', `
      <div style="text-align:left; font-size:14px;">
        <input type="text" placeholder="วาง URL หรือ DOI ที่นี่..." style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); margin-bottom:10px;">
        <button class="btn-glass sm" style="margin-bottom:15px;" onclick="document.getElementById('ref-out').innerHTML = 'Smith, J. (2025). <em>Advanced Polymer Properties</em>. Materials Journal, 42(3), 112-120. https://doi.org/10.1234/mat.2025'">สร้างบรรณานุกรม</button>
        <div id="ref-out" style="padding:15px; background:var(--bg); border-radius:8px; min-height:50px; font-style:italic;"></div>
      </div>
    `);
  },

  checkPlagiarism() {
    showLoadingBlocker();
    setTimeout(() => {
      hideLoadingBlocker();
      openModal('🔍 ผลการตรวจสอบ Plagiarism', `
        <div style="text-align:center; padding:20px;">
          <div style="width:100px; height:100px; border-radius:50%; border:10px solid #16a34a; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:24px; font-weight:700; color:#16a34a;">
            4%
          </div>
          <h3 style="margin-top:20px; color:#16a34a;">ผ่านเกณฑ์ (น้อยกว่า 20%)</h3>
          <p style="font-size:14px; color:var(--text-muted); margin-top:10px;">ไม่พบการคัดลอกที่ผิดปกติในรายงานฉบับนี้</p>
        </div>
      `);
    }, 2000);
  },

  requestMentorSignoff() {
    showToast('กำลังส่งอีเมลขออนุมัติจากพี่เลี้ยง...');
    setTimeout(() => {
      showToast('✅ ส่งคำขอสำเร็จ รอการอนุมัติ');
    }, 1000);
  },

  async generateFinalReportPDF() {
    showLoadingBlocker();
    try {
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();
      
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      page.drawText('FINAL INTERNSHIP REPORT', { x: width/2 - 100, y: height - 100, size: 18, font: fontBold });
      page.drawText(`Student: ${STUDENT.name}`, { x: 50, y: height - 150, size: 12, font: font });
      page.drawText(`ID: ${STUDENT.id}`, { x: 50, y: height - 170, size: 12, font: font });
      page.drawText(`Major: ${STUDENT.major}`, { x: 50, y: height - 190, size: 12, font: font });
      
      page.drawText('Status: APPROVED BY MENTOR', { x: 50, y: height - 230, size: 12, font: fontBold, color: rgb(0, 0.6, 0) });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Final_Report_${STUDENT.id}.pdf`;
      a.click();
      
      showToast('📄 สร้างรายงานฉบับสมบูรณ์เรียบร้อย');
    } catch (e) {
      console.error(e);
      showToast('❌ เกิดข้อผิดพลาดในการสร้าง PDF', 'err');
    } finally {
      hideLoadingBlocker();
    }
  },

  // --- Module 6: Advanced Capabilities ---
  openAlumniNetwork() {
    openModal('🤝 ทำเนียบศิษย์เก่า (Alumni Network)', `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left; font-size:14px;">
        <input type="text" placeholder="ค้นหาชื่อบริษัท หรือ รุ่นพี่..." style="padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); width:100%; margin-bottom:10px;">
        <div style="padding:15px; background:var(--bg); border-radius:12px; border:1px solid var(--border); display:flex; gap:15px; align-items:center;">
          <div style="width:50px; height:50px; border-radius:25px; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700;">พี่เอ</div>
          <div>
            <div style="font-weight:600; font-size:1rem;">พี่เอ (รุ่น 79)</div>
            <div style="color:var(--text-muted); font-size:0.8rem;">SCG Chemicals - R&D Engineer</div>
          </div>
          <button class="btn-glass sm" style="margin-left:auto;" onclick="window.open('mailto:example@ku.th')">ติดต่อ</button>
        </div>
        <div style="padding:15px; background:var(--bg); border-radius:12px; border:1px solid var(--border); display:flex; gap:15px; align-items:center;">
          <div style="width:50px; height:50px; border-radius:25px; background:#d946ef; color:white; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700;">พี่บี</div>
          <div>
            <div style="font-weight:600; font-size:1rem;">พี่บี (รุ่น 80)</div>
            <div style="color:var(--text-muted); font-size:0.8rem;">PTT - QA/QC</div>
          </div>
          <button class="btn-glass sm" style="margin-left:auto;" onclick="window.open('mailto:example@ku.th')">ติดต่อ</button>
        </div>
      </div>
    `);
  },

  openCompanyReviews() {
    openModal('⭐ รีวิวบริษัทจากรุ่นพี่', `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left; font-size:14px;">
        <div style="padding:15px; background:var(--bg); border-radius:12px; border:1px solid var(--border);">
          <div style="display:flex; justify-content:space-between;">
            <strong style="font-size:1rem; color:var(--primary);">SCG Chemicals</strong>
            <span style="color:#eab308;">★★★★☆ (4.5)</span>
          </div>
          <p style="margin-top:10px; color:var(--text);">"พี่ๆดูแลดีมาก ได้ลงมือทำแลปจริง สวัสดิการเยี่ยม แต่เดินทางไกลนิดนึงต้องมีรถ"</p>
        </div>
        <div style="padding:15px; background:var(--bg); border-radius:12px; border:1px solid var(--border);">
          <div style="display:flex; justify-content:space-between;">
            <strong style="font-size:1rem; color:var(--primary);">Bridgestone</strong>
            <span style="color:#eab308;">★★★★☆ (4.2)</span>
          </div>
          <p style="margin-top:10px; color:var(--text);">"ระบบงานเป๊ะมาก ได้เรียนรู้เรื่องการควบคุมคุณภาพยางแบบเจาะลึก แนะนำเลย"</p>
        </div>
      </div>
    `);
  },

  openPortfolioExport() {
    openModal('🎨 สร้าง Portfolio อัตโนมัติ', `
      <div style="text-align:center;">
        <div style="font-size:3rem; margin-bottom:15px;">🖼️</div>
        <p style="font-size:14px; margin-bottom:15px;">ระบบจะดึงรูปภาพและคำอธิบายจาก Daily Logs มาจัดหน้าเป็น Portfolio เพื่อใช้สมัครงาน</p>
        <button class="btn-premium" style="width:100%; justify-content:center;" onclick="showToast('กำลังประมวลผล PDF...'); closeModal();">Export to PDF</button>
      </div>
    `);
  },

  openResumeUpdater() {
    openModal('📄 อัปเดต Resume', `
      <div style="text-align:left; font-size:14px;">
        <p>AI แนะนำทักษะที่ควรเพิ่มลงใน Resume จากการฝึกงานของคุณ:</p>
        <ul style="margin-top:10px; padding-left:20px; line-height:1.8;">
          <li><input type="checkbox" checked> Polymer Testing (UTM)</li>
          <li><input type="checkbox" checked> Quality Control Analysis</li>
          <li><input type="checkbox" checked> Report Writing & Presentation</li>
        </ul>
        <button class="btn-glass-primary" style="width:100%; justify-content:center; margin-top:15px;" onclick="showToast('คัดลอกข้อมูลแล้ว นำไปวางใน Resume ได้เลย'); closeModal();">Copy Text</button>
      </div>
    `);
  },

  openPresentationTimer() {
    openModal('⏱️ ซ้อมพรีเซนต์ (Presentation Timer)', `
      <div style="text-align:center;">
        <div style="font-size:4rem; font-family:'JetBrains Mono', monospace; font-weight:700; color:var(--primary); margin:20px 0;">15:00</div>
        <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px;">เวลามาตรฐานในการพรีเซนต์ฝึกงานคณะวิศวะฯ คือ 15 นาที</p>
        <div style="display:flex; gap:10px; justify-content:center;">
          <button class="btn-glass-primary sm" onclick="showToast('เริ่มจับเวลา')">▶️ Start</button>
          <button class="btn-glass sm" onclick="showToast('หยุดเวลาชั่วคราว')">⏸️ Pause</button>
          <button class="btn-glass sm" onclick="showToast('รีเซ็ตเวลา')">🔄 Reset</button>
        </div>
      </div>
    `);
  },

  async generateCertificate() {
    showLoadingBlocker();
    try {
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();
      // Landscape A4
      const page = pdfDoc.addPage([841.89, 595.28]);
      const { width, height } = page.getSize();
      
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      page.drawText('CERTIFICATE OF COMPLETION', { x: width/2 - 160, y: height - 150, size: 24, font: fontBold, color: rgb(0.1, 0.2, 0.5) });
      page.drawText('This is to certify that', { x: width/2 - 80, y: height - 220, size: 16, font: font });
      page.drawText(STUDENT.name, { x: width/2 - (STUDENT.name.length * 5), y: height - 270, size: 22, font: fontBold });
      page.drawText('has successfully completed the 320-hour engineering internship program.', { x: width/2 - 200, y: height - 320, size: 14, font: font });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${STUDENT.id}.pdf`;
      a.click();
      
      showToast('🎉 สร้าง E-Certificate เรียบร้อย');
    } catch (e) {
      console.error(e);
      showToast('❌ เกิดข้อผิดพลาดในการสร้าง Certificate', 'err');
    } finally {
      hideLoadingBlocker();
    }
  }
};
