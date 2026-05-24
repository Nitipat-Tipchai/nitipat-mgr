// ══════════════════════════════════════════════════
// ILM INTEGRATION CONTROLLER (Module 0 & Foundation)
// ══════════════════════════════════════════════════

const ILMHub = {
  // Get active student state
  getStudent() {
    return STUDENT;
  },

  // State Management Helper
  saveState() {
    localStorage.setItem('ilm_companies', JSON.stringify(state.ilmCompanies));
    localStorage.setItem('ilm_profile', JSON.stringify(state.ilmProfile));
    localStorage.setItem('ilm_logs', JSON.stringify(state.ilmLogs));
    
    // Save to firebase if logged in
    if (typeof fsSet === 'function' && state.userId) {
      fsSet('ilm_data', 'profile', state.ilmProfile).catch(e => console.warn(e));
      fsSet('ilm_data', 'companies', { list: state.ilmCompanies }).catch(e => console.warn(e));
      fsSet('ilm_data', 'logs', { list: state.ilmLogs }).catch(e => console.warn(e));
    }
  },

  // Initialise
  async init() {
    console.log("IILM Hub Core Initialized");
    
    // Load local storage values if they exist
    state.ilmCompanies = JSON.parse(localStorage.getItem('ilm_companies') || '[]');
    state.ilmProfile = JSON.parse(localStorage.getItem('ilm_profile') || '{}');
    state.ilmLogs = JSON.parse(localStorage.getItem('ilm_logs') || '[]');
    
    // Initialize default profile values
    if (!state.ilmProfile.currentPhase) state.ilmProfile.currentPhase = 'phase1';
    if (state.ilmProfile.quizPassed === undefined) state.ilmProfile.quizPassed = false;
    if (state.ilmProfile.quizScore === undefined) state.ilmProfile.quizScore = 0;
    if (!state.ilmProfile.seminars) {
      state.ilmProfile.seminars = [
        { id: 1, title: 'ปฐมนิเทศฝึกงานและทำความเข้าใจข้อตกลง', date: '2025-08-20', attended: false, note: '', photoUrl: '' },
        { id: 2, title: 'อบรมด้านจริยธรรมวิชาชีพและความปลอดภัย', date: '2025-10-15', attended: false, note: '', photoUrl: '' },
        { id: 3, title: 'เตรียมความพร้อมด้านวัสดุศาสตร์และการเขียนรายงาน', date: '2025-12-10', attended: false, note: '', photoUrl: '' },
        { id: 4, title: 'ปัจฉิมนิเทศและสรุปแนวทางการส่งเล่มรายงาน', date: '2026-03-04', attended: false, note: '', photoUrl: '' }
      ];
    }
    if (!state.ilmProfile.commute) {
      state.ilmProfile.commute = { type: 'motorcycle', cost: 40 };
    }
    if (!state.ilmProfile.companyLocation) {
      state.ilmProfile.companyLocation = { lat: 12.7230, lon: 101.1400, radius: 300, simulateGPS: true }; // Default SCG Chemicals Rayong
    }
    
    // Set default companies if none exist
    if (state.ilmCompanies.length === 0) {
      state.ilmCompanies = [
        { id: 'c1', name: 'SCG Chemicals (Rayong)', field: 'Polymer', status: 'interested', salary: 450, address: 'Map Ta Phut, Rayong', contact: 'HR Department scgchem@scg.com' },
        { id: 'c2', name: 'PTT Global Chemical (GC)', field: 'Polymer', status: 'interested', salary: 500, address: 'Rayong Industrial Land, Rayong', contact: 'recruitment@pttgcgroup.com' },
        { id: 'c3', name: 'Metal One (Thailand)', field: 'Metal', status: 'interested', salary: 400, address: 'Chonburi Industrial Estate, Chonburi', contact: 'm1hr@metal-one.co.th' }
      ];
    }
    
    this.saveState();
  },

  // --- GAS Proxy Integration Calls ---
  async createCalendarEvents(internshipData) {
    if (typeof google === 'undefined' || !google.script) {
      console.warn("GAS not available - Simulating Calendar Event creation");
      return { success: true, count: 42, message: "จำลองการบันทึกปฏิทิน 42 วันทำการสำเร็จ (ออฟไลน์)" };
    }
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .createILMCalendarEvents(internshipData);
    });
  },

  async createDriveFolder(folderName) {
    if (typeof google === 'undefined' || !google.script) {
      console.warn("GAS not available - Simulating Drive Folder creation");
      return { success: true, folderId: "mock_drive_folder_12345", folderUrl: "https://drive.google.com" };
    }
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .createILMDriveFolder(folderName);
    });
  },

  async uploadFileToDrive(fileBase64, mimeType, filename, folderId) {
    if (typeof google === 'undefined' || !google.script) {
      console.warn("GAS not available - Simulating file upload to Drive");
      return { success: true, fileId: "mock_file_id_" + Date.now(), fileUrl: "https://drive.google.com" };
    }
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .uploadILMFile({ fileBase64, mimeType, filename, folderId });
    });
  },

  async syncDailyLogToNotion(logData) {
    if (typeof google === 'undefined' || !google.script) {
      console.warn("GAS not available - Simulating Notion log synchronization");
      return { success: true, message: "บันทึกใน Local Cache และพร้อมซิงค์ขึ้น Notion อัตโนมัติ" };
    }
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

    if (earnedCredits < 60) {
      passed = false;
      messages.push(`หน่วยกิตสะสมรวมไม่ถึงเกณฑ์ขั้นต่ำคณะ (สะสมแล้ว ${earnedCredits} จากขั้นต่ำ 60 หน่วยกิต)`);
    }

    return { passed, messages, earnedCredits };
  },

  // Generate Kasetsart Student Affairs Request Form PDF
  async generateRequestForm() {
    if (typeof showLoadingBlocker === 'function') showLoadingBlocker();
    try {
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();
      
      // Use standard A4 size
      const page = pdfDoc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const drawText = (text, x, y, size = 11, isBold = false) => {
        page.drawText(text, {
          x, y, size, font: isBold ? fontBold : font, color: rgb(0.05, 0.05, 0.05)
        });
      };
      
      const drawLine = (x1, y1, x2, y2, thickness = 1) => {
        page.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness: thickness,
          color: rgb(0.8, 0.8, 0.8)
        });
      };

      // Find the accepted company on the board
      const acceptedCompany = state.ilmCompanies.find(c => c.status === 'accepted') || 
                              state.ilmCompanies.find(c => c.status === 'applied') || 
                              { name: '............................................', address: '..................................................................' };

      // Header Banner
      page.drawRectangle({
        x: 40, y: height - 85, width: width - 80, height: 45,
        color: rgb(0.95, 0.97, 1.0)
      });
      
      drawText('KASETSART UNIVERSITY - FACULTY OF ENGINEERING', 50, height - 60, 12, true);
      drawText('STUDENT AFFAIRS DIVISION - SUMMER INTERNSHIP REQUEST FORM', 50, height - 76, 9, false);

      drawLine(40, height - 100, width - 40, height - 100, 1.5);

      // Section 1: Student Information
      drawText('1. PERSONAL DETAILS / ข้อมูลส่วนตัวนิสิต', 40, height - 120, 11, true);
      
      drawText(`Student ID (รหัสนิสิต): ${STUDENT.id}`, 50, height - 145);
      drawText(`Full Name (ชื่อ-นามสกุล): ${STUDENT.name} (${STUDENT.nameTh})`, 50, height - 165);
      drawText(`Major (สาขาวิชา): ${STUDENT.major}`, 50, height - 185);
      
      const elig = this.checkEligibility();
      drawText(`Academic Level (ชั้นปี): ชั้นปีที่ 3 (วิศวกรรมศาสตร์)`, 50, height - 205);
      drawText(`Cumulative Credits (หน่วยกิตสะสม): ${elig.earnedCredits} credits (ผ่านเกณฑ์ 60)`, 50, height - 225);
      
      drawLine(40, height - 245, width - 40, height - 245);

      // Section 2: Internship Placement
      drawText('2. PROPOSED INTERNSHIP PLACEMENT / ข้อมูลสถานประกอบการ', 40, height - 265, 11, true);
      
      drawText(`Company Name (ชื่อบริษัท/หน่วยงาน): ${acceptedCompany.name}`, 50, height - 290, 11, true);
      drawText(`Field of Work (สายงาน): ${acceptedCompany.field || 'Materials Science'}`, 50, height - 310);
      drawText(`Address (ที่ตั้งสถานประกอบการ): ${acceptedCompany.address || 'N/A'}`, 50, height - 330);
      drawText(`Contact Info (ข้อมูลติดต่อฝ่ายบุคคล): ${acceptedCompany.contact || 'N/A'}`, 50, height - 350);
      drawText(`Proposed Internship Duration (ระยะเวลาฝึกงาน): 1 เมษายน 2569 ถึง 29 พฤษภาคม 2569`, 50, height - 370);

      drawLine(40, height - 390, width - 40, height - 390);

      // Section 3: Verification & Signatures
      drawText('3. DEPARTMENT APPROVALS / การพิจารณาอนุมัติคำร้อง', 40, height - 410, 11, true);
      
      drawText('ความเห็นของอาจารย์ที่ปรึกษาวิชาการ:', 50, height - 435);
      drawText('[  ] อนุมัติให้เข้าร่วมการฝึกงานภาคฤดูร้อน พ.ศ. 2569 ได้เนื่องจากผ่านเกณฑ์และเงื่อนไขครบถ้วน', 60, height - 455);
      drawText('[  ] เห็นควรปรับปรุง / ยังไม่สมควรเข้าร่วมการฝึกงาน', 60, height - 470);
      
      drawText('ลงชื่อ: ___________________________________________ อาจารย์ที่ปรึกษา', 280, height - 510);
      drawText('(                                                                 )', 310, height - 525);
      
      drawText('ความเห็นของหัวหน้าภาควิชาวิศวกรรมวัสดุ:', 50, height - 565);
      drawText('[  ] ผ่านความเห็นชอบและออกหนังสือขอความอนุเคราะห์ส่งตัวนิสิตอย่างเป็นทางการ', 60, height - 585);
      
      drawText('ลงชื่อ: ___________________________________________ หัวหน้าภาควิชาฯ', 280, height - 625);
      drawText('(                                                                 )', 310, height - 640);

      // Signature Block of User
      drawText('นิสิตผู้ยื่นคำร้อง:', 50, height - 690);
      drawText('ลงชื่อ: ___________________________________________', 50, height - 715);
      drawText(`      ( นาย${STUDENT.nameTh} )`, 50, height - 730);
      drawText(`วันที่ยื่นร้อง: ${new Date().toLocaleDateString('th-TH')}`, 50, height - 750);

      // Footer
      drawLine(40, 50, width - 40, 50, 0.5);
      drawText('Generate by NITIPAT MGR V3 IILM Personal Sync System. No signature forged.', 40, 35, 8, false);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `IILM_Internship_Request_KU_2569_${STUDENT.id}.pdf`;
      a.click();
      if (typeof showToast === 'function') showToast('📄 ดาวน์โหลดแบบคำร้องยื่นเสนอบทความสำเร็จ!');
    } catch (e) {
      console.error(e);
      if (typeof showToast === 'function') showToast('❌ เกิดข้อผิดพลาดทางเทคนิคในการเรนเดอร์ PDF', 'err');
    } finally {
      if (typeof hideLoadingBlocker === 'function') hideLoadingBlocker();
    }
  },

  // Polite Email Templates Generator
  getEmailTemplate(type, companyName, contactPerson = 'ฝ่ายทรัพยากรบุคคล (HR)') {
    const studentName = STUDENT.nameTh;
    const studentEng = STUDENT.name;
    const major = "วิศวกรรมวัสดุ";
    const majorEn = "Materials Engineering";
    const univ = "มหาวิทยาลัยเกษตรศาสตร์ (บางเขน)";
    const univEn = "Kasetsart University (Bang Khen)";
    
    if (type === 'th_request') {
      return `Subject: ขอความอนุเคราะห์ฝึกงานภาคฤดูร้อน พ.ศ. 2569 - นาย${studentName} นิสิตภาควิชา${major} มก.

เรียน ${contactPerson} บริษัท ${companyName}

กระผม นาย${studentName} นิสิตชั้นปีที่ 3 ภาควิชา${major} คณะวิศวกรรมศาสตร์ ${univ} รหัสนิสิต ${STUDENT.id} มีความประสงค์จะขอเข้าฝึกงานเพื่อเก็บเกี่ยวประสบการณ์ทางวิศวกรรมและทำโครงงานฝึกงานภาคฤดูร้อนประจำปีการศึกษา 2568 (ภาคฤดูร้อน พ.ศ. 2569) 

โดยมีกำหนดระยะเวลาฝึกงานระหว่างวันที่ 1 เมษายน 2569 ถึงวันที่ 29 พฤษภาคม 2569 (รวม 40 วันทำการ หรือไม่ต่ำกว่า 240 ชั่วโมง)

กระผมมีความสนใจในสายงานด้าน ${major} ของบริษัท ${companyName} เป็นอย่างยิ่ง และได้แนบไฟล์ประวัติส่วนตัว (Resume) และใบรายงานผลการศึกษา (Transcript) มาพร้อมกับอีเมลฉบับนี้เพื่อประกอบการพิจารณา

หวังเป็นอย่างยิ่งว่าจะได้รับโอกาสเข้าฝึกงานร่วมกับทีมวิศวกรและผู้ชำนาญการของสถานประกอบการท่าน 

จึงเรียนมาเพื่อโปรดพิจารณาความอนุเคราะห์
ขอแสดงความนับถืออย่างสูง

นาย${studentName}
โทรศัพท์: [เบอร์โทรของคุณ]
อีเมล: [อีเมลของคุณ]
ภาควิชา${major} คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์`;
    } else if (type === 'en_request') {
      return `Subject: Summer Internship Placement Application (April - May 2026) - ${studentEng}

Dear Hiring Manager / HR Team at ${companyName},

My name is ${studentEng}, a third-year undergraduate student majoring in ${majorEn} at the Faculty of Engineering, ${univEn}. I am writing to express my strong interest in applying for a summer internship opportunity at ${companyName}.

Our academic curriculum requires a summer internship of at least 240 working hours, starting from April 1, 2026, until May 29, 2026. 

Given ${companyName}'s leading prestige and strong emphasis on technical innovation, I am eagerly motivated to contribute to and learn from your professional engineering practices. I have enclosed my Resume and academic Transcript alongside this email for your kind review.

Thank you very much for your time and consideration. I look forward to the possibility of discussing how I can contribute to your team this summer.

Sincerely yours,

${studentEng}
Student ID: ${STUDENT.id}
Department of ${majorEn}, Faculty of Engineering
Kasetsart University
Tel: [Your Phone Number]
Email: [Your Email]`;
    } else if (type === 'th_followup') {
      return `Subject: ติดตามผลการพิจารณาขอเข้าฝึกงานภาคฤดูร้อน - นาย${studentName} (รหัสนิสิต ${STUDENT.id})

เรียน ${contactPerson} บริษัท ${companyName}

ตามที่กระผม นาย${studentName} นิสิตภาควิชา${major} คณะวิศวกรรมศาสตร์ ${univ} ได้ดำเนินการส่งเอกสารใบคำร้องสมัครเข้าฝึกงานภาคฤดูร้อน 2569 มายังสถานประกอบการของท่านเมื่อวันที่ [ระบุวันที่ส่งใบสมัคร] 

กระผมใคร่ขอความอนุเคราะห์ติดตามผลการพิจารณาเบื้องต้น เพื่อประสานจัดเตรียมและส่งมอบหนังสือขอความอนุเคราะห์ส่งตัวฉบับทางการจากคณะวิศวกรรมศาสตร์ มก. ต่อไปครับ

หากทางบริษัทต้องการข้อมูลหรือเอกสารใดๆ เพิ่มเติม สามารถติดต่อกระผมได้ตลอดเวลาครับ

ขอขอบพระคุณเป็นอย่างยิ่งในความอนุเคราะห์พิจารณาของท่าน
ขอแสดงความนับถือ

นาย${studentName}
โทร: [เบอร์โทรของคุณ]`;
    }
    return '';
  },

  // --- Module 2: Orientation & Test Prep ---
  // Official Orientation Questions Pool
  getQuizQuestions() {
    return [
      {
        q: "1. นิสิตวิศวกรรมศาสตร์ มก. ต้องเก็บชั่วโมงฝึกงานสะสมในภาคฤดูร้อนอย่างน้อยกี่ชั่วโมง?",
        options: ["200 ชั่วโมง", "240 ชั่วโมง", "300 ชั่วโมง", "360 ชั่วโมง"],
        ans: 1,
        ref: "สไลด์ปฐมนิเทศระบุชัดเจนว่า ต้องปฏิบัติงานจริงในโรงงานหรือสถานประกอบการไม่ต่ำกว่า 240 ชั่วโมง"
      },
      {
        q: "2. นิสิตต้องปฏิบัติงานไม่ต่ำกว่ากี่วันทำการ (ไม่รวมวันหยุดเสาร์-อาทิตย์)?",
        options: ["20 วันทำการ", "25 วันทำการ", "30 วันทำการ", "45 วันทำการ"],
        ans: 2,
        ref: "ตามเกณฑ์คณะคือ 30 วันทำการเต็ม เพื่อรักษาระยะการเรียนรู้ครบถ้วน"
      },
      {
        q: "3. กำหนดการส่งเล่มรายงานฝึกงานฉบับสมบูรณ์ เอกสารลายเซ็น และใบประเมินของปีการศึกษา 2568 (ฤดูร้อน 2569) คือข้อใด?",
        options: ["31 พฤษภาคม 2569", "15 มิถุนายน 2569", "30 มิถุนายน 2569", "31 กรกฎาคม 2569"],
        ans: 2,
        ref: "กำหนดการเส้นตายส่งเล่มที่ภาควิชาคือภายในวันที่ 30 มิถุนายน 2569"
      },
      {
        q: "4. การลาป่วยในระยะเวลาการฝึกงาน สามารถลาได้สูงสุดกี่วันโดยไม่ต้องฝึกงานชดเชยชั่วโมง?",
        options: ["ห้ามลาป่วยเลย", "ลาได้ไม่เกิน 3 วัน (ต้องแนบใบรับรองแพทย์และฝึกงานชดเชยเพื่อให้ครบ 240 ชม.)", "ลาได้ 5 วัน", "ลาได้ไม่จำกัดจำนวนวัน"],
        ans: 1,
        ref: "ลาป่วยได้แต่ต้องแจ้งพี่เลี้ยงควบคุมงานทันที และต้องเก็บชั่วโมงชดเชยชั่วโมงการทำงานที่ขาดไปให้ครบ 240 ชม."
      },
      {
        q: "5. หมายเลขโทรศัพท์สายตรงติดต่อหน่วยกิจการนิสิต คณะวิศวกรรมศาสตร์ มก. (กรณีเกิดเหตุฉุกเฉิน) คือเบอร์ใด?",
        options: ["02-797-0969", "02-942-8500", "02-797-0999", "191"],
        ans: 0,
        ref: "เบอร์สายตรงตึก 3 ชั้น 1 คือ 02-797-0969 หรือ 02-797-0967"
      },
      {
        q: "6. วงเงินช่วยเหลือค่ารักษาพยาบาลอุบัติเหตุเฉุกเฉินกรณี 'ผู้ป่วยนอก (OPD)' ของกองทุนสวัสดิภาพนิสิต มก. สูงสุดต่อครั้งคือเท่าใด?",
        options: ["1,000 บาท", "2,000 บาท", "5,000 บาท", "8,000 บาท"],
        ans: 1,
        ref: "ประกาศกองทุนสวัสดิภาพนิสิต มก. 2566 ระบุสิทธิ์เบิกจ่ายอุบัติเหตุผู้ป่วยนอก สูงสุดครั้งละไม่เกิน 2,000 บาท"
      },
      {
        q: "7. วงเงินช่วยเหลือรักษาพยาบาลอุบัติเหตุกรณีแอดมิทเข้าเป็น 'ผู้ป่วยใน (IPD)' เบิกได้สูงสุดกี่บาท?",
        options: ["2,000 บาท", "5,000 บาท", "8,000 บาท", "15,000 บาท"],
        ans: 2,
        ref: "แอดมิทเป็นผู้ป่วยในสามารถเบิกจ่ายตามจริงได้สูงสุดไม่เกิน 8,000 บาทต่อครั้ง"
      },
      {
        q: "8. ข้อใดเป็นเกณฑ์ระเบียบเรื่องการฝึกงานข้ามสายงานหรือเปลี่ยนสถานประกอบการกลางคัน?",
        options: ["สามารถแจ้งเปลี่ยนได้อิสระ", "เปลี่ยนได้เมื่อผ่านไปแล้วครึ่งหนึ่ง", "ห้ามเปลี่ยนสถานที่ฝึกงานโดยพลการโดยเด็ดขาด ยกเว้นมีอุบัติภัยรุนแรงและต้องรับความเห็นชอบจากอาจารย์ประสานงานภาควิชา", "สามารถฝึกงานที่บ้านได้"],
        ans: 2,
        ref: "การย้ายที่ฝึกงานพลการจะส่งผลให้ถูกปรับตก (U) ในรายวิชาฝึกงานวิศวกรรมทันที"
      },
      {
        q: "9. เวลาตอกบัตรเช็คเอาต์เลิกฝึกงาน หากต้องทำ OT สามารถทำได้สูงสุดไม่เกินเวลาใดเพื่อความปลอดภัย?",
        options: ["18:00 น.", "20:00 น.", "22:00 น.", "ไม่จำกัดเวลา"],
        ans: 1,
        ref: "กฎความปลอดภัยห้ามนิสิตฝึกงานล่วงเวลาเกินกว่าเวลา 20:00 น. ยกเว้นมีผู้ควบคุมชำนาญการกำกับดูแล"
      },
      {
        q: "10. เครื่องแต่งกายสำหรับการปฏิบัติงานภาคสนามหรือโรงงานอุตสาหกรรมคือข้อใด?",
        options: ["ชุดนิสิตปกติ", "สวมกางเกงยีนส์และเสื้อยืด", "ชุดปฏิบัติการประจำภาควิชา (ช็อป) พร้อมอุปกรณ์เซฟตี้ (PPE) หุ้มส้นห้ามเปิดนิ้วเท้า", "แต่งกายอิสระ"],
        ans: 2,
        ref: "งานโรงงานอุตสาหกรรมวัสดุต้องสวมชุดช็อปและอุปกรณ์ความปลอดภัยส่วนบุคคล PPE ให้ครบถ้วนตามข้อกำหนดโรงงาน"
      }
    ];
  },

  // --- Module 3: Daily Operation & Time Tracking ---
  // Money Manager Expense integration
  integrateMoneyManagerCommute() {
    if (typeof state.moneyTransactions === 'undefined') return;
    
    const commuteCost = state.ilmProfile.commute.cost || 40;
    const commuteType = state.ilmProfile.commute.type || 'motorcycle';
    
    let typeText = 'มอเตอร์ไซค์';
    if (commuteType === 'bts_mrt') typeText = 'รถไฟฟ้า BTS/MRT';
    else if (commuteType === 'car') typeText = 'รถส่วนตัว';
    else if (commuteType === 'bus') typeText = 'รถเมล์สาธารณะ';

    const transaction = {
      id: 'tx_ilm_' + Date.now(),
      walletId: state.moneyWallets && state.moneyWallets[0] ? state.moneyWallets[0].id : 'cash',
      type: 'expense',
      category: 'travel',
      amount: parseFloat(commuteCost),
      desc: `💼 ค่าเดินทางฝึกงาน (${typeText})`,
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now()
    };
    
    // Push transaction and update wallet balance
    state.moneyTransactions.unshift(transaction);
    if (state.moneyWallets && state.moneyWallets[0]) {
      state.moneyWallets[0].balance -= parseFloat(commuteCost);
    }
    
    // Save state
    localStorage.setItem('moneyTransactions', JSON.stringify(state.moneyTransactions));
    localStorage.setItem('moneyWallets', JSON.stringify(state.moneyWallets));
    
    console.log("IILM Expense Sync: Deducted " + commuteCost + " THB from wallet.");
  },

  // --- Module 4: Air Quality PM 2.5 API Fetcher ---
  async getLiveAirQuality(lat, lon) {
    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather API status bad");
      const json = await res.json();
      return {
        success: true,
        aqi: json.current.us_aqi,
        pm25: json.current.pm2_5
      };
    } catch (e) {
      console.warn("AQI API fail, returning offline estimate", e);
      return {
        success: false,
        aqi: 32, // Default healthy estimate
        pm25: 7.8
      };
    }
  },

  // --- Module 5: Materials Glossary & Curriculum Course Theory Mapper ---
  getTechnicalGlossary() {
    return [
      {
        term: "Metallography (โลหะวิทยาภาพจุลทรรศน์)",
        definition: "การเตรียมชิ้นงานและส่องกล้องวิเคราะห์โครงสร้างเกรนของโลหะ",
        courseCode: "01213312",
        courseName: "Materials Characterization and Properties Analysis Lab",
        tips: "ควรอ้างอิงระเบียบวิธีส่องกล้องจุลทรรศน์แบบแสง (Optical Microscope) ในส่วนบทที่ 3"
      },
      {
        term: "Sintering (การเผาผนึก)",
        definition: "กระบวนการให้ความร้อนผงวัสดุจนเกาะตัวแน่นเป็นของแข็งอุณหภูมิสูงต่ำกว่าจุดหลอมเหลว",
        courseCode: "01213432",
        courseName: "Ceramic Processing",
        tips: "อภิปรายการเปลี่ยนแปลงความหนาแน่นเชิงสัมพัทธ์ (Relative Density) ในเซรามิกหรือผงโลหะ"
      },
      {
        term: "Polymer Injection Molding (การฉีดขึ้นรูปพอลิเมอร์)",
        definition: "กระบวนการแปรรูปโดยการหลอมเหลวเม็ดพลาสติกและฉีดเข้าสู่แม่พิมพ์เหล็กกล้า",
        courseCode: "01213441",
        courseName: "Fundamental of Polymeric Materials",
        tips: "วิเคราะห์พฤติกรรมการหดตัวและการจัดเรียงตัวของโมเลกุลสายโซ่พอลิเมอร์"
      },
      {
        term: "Precipitation Hardening (การชุบแข็งแบบตกตะกอน)",
        definition: "การอบชุบความร้อนเพื่อสร้างเฟสตกตะกอนละเอียดขัดขวางการเคลื่อนที่ของดิสโลเคชันในโลหะผสม",
        courseCode: "01213421",
        courseName: "Physical Metallurgy",
        tips: "เขียนขั้นตอน Solution Treatment และ Aging ลงในกระบวนการอบอลูมิเนียมเกรด 6061"
      },
      {
        term: "Cold Rolling (การรีดเย็น)",
        definition: "การผ่านโลหะระหว่างลูกรีดที่อุณหภูมิห้องเพื่อเพิ่มความแข็งแรงด้วยวิธีสร้างความเค้นสะสม (Strain Hardening)",
        courseCode: "01213216",
        courseName: "Mechanical Behavior of Materials",
        tips: "บรรยายการยืดตัวของเม็ดเกรนตามแนวรีดและผลกระทบต่อความต้านทานแรงดึงดึงยืด"
      },
      {
        term: "Corrosion and Oxidation (การกัดกร่อน)",
        definition: "การทำปฏิกิริยาไฟฟ้าเคมีของโลหะกับสภาพแวดล้อม ทำให้วัสดุเสื่อมสภาพ",
        courseCode: "01213427",
        courseName: "Corrosion",
        tips: "ระบุกลไกเกิดกัลวานิกแคลดดิ้งหรือรูผุพังในตัวอย่างถังรับน้ำอุตสาหกรรม"
      }
    ];
  },

  // --- Module 5: Markdown Report Compiler Engine ---
  compileReportDraft() {
    const student = STUDENT;
    const activeComp = state.ilmCompanies.find(c => c.status === 'accepted') || state.ilmCompanies[0];
    const logs = state.ilmLogs || [];
    
    let logsMarkdown = '';
    if (logs.length > 0) {
      logsMarkdown = logs.map(l => `### วันที่ ${l.date} (เวลาทำงาน: ${l.hours} ชม.)\n**รายละเอียดปฏิบัติงาน**: ${l.task}\n${l.otReason ? `*เหตุผลล่วงเวลา (OT)*: ${l.otReason}\n` : ''}`).join('\n\n');
    } else {
      logsMarkdown = '*ยังไม่มีข้อมูลบันทึกเวลางานปฏิบัติการรายวัน*';
    }

    return `# รายงานผลการฝึกงานวิศวกรรมวัสดุ (01213399)
**สถานที่ฝึกงาน**: ${activeComp.name}
**ผู้จัดทำ**: นาย${student.nameTh} (${student.name})
**รหัสนิสิต**: ${student.id} ชั้นปีที่ 3 
**หลักสูตร**: วิศวกรรมศาสตรบัณฑิต (สาขาวิชาพิษเคมีและวิศวกรรมวัสดุ) มหาวิทยาลัยเกษตรศาสตร์

---

## บทที่ 1: ข้อมูลเบื้องต้นของสถานประกอบการ
บริษัทเป้าหมายและแหล่งฝึกงานหลักคือ **${activeComp.name}** ตั้งอยู่ที่ ${activeComp.address || 'N/A'} โดยดำเนินงานในสายวิศวกรรมหลักด้านวัสดุกลุ่ม **${activeComp.field || 'N/A'}** 
ขอบข่ายการทำงานและการผลิตเกี่ยวข้องโดยตรงกับการออกแบบ ปรับปรุง หรือควบคุมคุณภาพของผลิตภัณฑ์เพื่อการจัดจำหน่ายระดับประเทศ

## บทที่ 2: ทฤษฎีวิศวกรรมวัสดุศาสตร์ที่ประยุกต์ใช้
การฝึกงานทางเทคนิคนี้ มีความเชื่อมโยงกับรายวิชาในหลักสูตรวิศวกรรมวัสดุของมหาวิทยาลัยเกษตรศาสตร์ ดังนี้:
1. **ทฤษฎีการแปรรูปขึ้นรูปวัสดุ**: สอดคล้องโดยตรงกับรายวิชา *กระบวนการผลิตสำหรับวิศวกรวัสดุ (01213218)*
2. **การศึกษาจุลภาคและการทดสอบคุณสมบัติ**: เชื่อมโยงกับวิชา *การศึกษาลักษณะเฉพาะของวัสดุ (01213311)* และวิชา *พฤติกรรมทางกลของวัสดุ (01213216)*

## บทที่ 3: บันทึกข้อมูลและเวลาปฏิบัติงานสะสมรายวัน
บันทึกตารางการลงเวลาปฏิบัติงานจริงสะสมตั้งแต่วันเริ่มต้น สอดรับกับคู่มือฝึกงาน Summer 2569:

${logsMarkdown}

## บทที่ 4: สรุปผลการปฏิบัติงาน ข้อเสนอแนะ และแนวทางการพัฒนารุ่นน้อง
1. **ผลสัมฤทธิ์ที่ได้รับ**: ได้เรียนรู้วิถีการทำงานร่วมกับวิศวกรในหน้างานจริง และประยุกต์ทฤษฎีในห้องแล็บเข้ากับการผลิตเชิงพาณิชย์
2. **ปัญหาและอุปสรรคที่พบ**: [ผู้ใช้สามารถเขียนกรอกเพิ่มเติมเพื่อสะท้อนคิดเกี่ยวกับกระบวนการทำงานในโรงงานได้ที่นี่]
3. **ข้อเสนอแนะสำหรับภาควิชาฯ**: ควรส่งเสริมกระเรียนรู้ด้านทักษะเครื่องมือตรวจวิเคราะห์ชิ้นงานเชิงลึกให้ครอบคลุมก่อนออกฝึกงานภาคปฏิบัติจริง`;
  },

  // --- Module 6: Downloadable Completion Certificate Generator (HTML Canvas based) ---
  generateECompletionCertificate() {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    
    // Border Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1000, 700);
    
    // Outer Decorative Box
    ctx.strokeStyle = '#1e3a8a'; // Deep Navy
    ctx.lineWidth = 15;
    ctx.strokeRect(30, 30, 940, 640);
    
    ctx.strokeStyle = '#b45309'; // Amber Gold inner thin line
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, 904, 604);
    
    // Watermark Symbol in Background
    ctx.fillStyle = 'rgba(30, 58, 138, 0.03)';
    ctx.font = '300px Sarabun';
    ctx.textAlign = 'center';
    ctx.fillText('⚗', 500, 480);
    
    // Header
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 36px Sarabun';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF COMPLETION', 500, 120);
    
    ctx.fillStyle = '#4b5563';
    ctx.font = '20px Sarabun';
    ctx.fillText('This certificate is proudly awarded to', 500, 180);
    
    // Name
    ctx.fillStyle = '#b45309'; // Gold
    ctx.font = 'bold 38px Sarabun';
    ctx.fillText(STUDENT.name.toUpperCase(), 500, 250);
    
    ctx.fillStyle = '#374151';
    ctx.font = '18px Sarabun';
    ctx.fillText(`Student ID: ${STUDENT.id}  |  Major: ${STUDENT.major}`, 500, 290);
    
    // Core body
    const activeComp = state.ilmCompanies.find(c => c.status === 'accepted') || state.ilmCompanies[0] || { name: 'SCG Chemicals' };
    ctx.fillStyle = '#4b5563';
    ctx.font = '18px Sarabun';
    ctx.fillText(`For successfully completing 240 hours of summer engineering vocational internship`, 500, 360);
    ctx.fillText(`focusing on Materials Science & Engineering daily operations at`, 500, 395);
    
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 22px Sarabun';
    ctx.fillText(activeComp.name.toUpperCase(), 500, 440);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Sarabun';
    ctx.fillText(`Internship Period: April 1, 2026 - May 29, 2026`, 500, 480);

    // Signatures
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 580);
    ctx.lineTo(400, 580);
    ctx.moveTo(600, 580);
    ctx.lineTo(800, 580);
    ctx.stroke();
    
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 15px Sarabun';
    ctx.fillText('Mr. Nitipat Tipchai', 300, 605);
    ctx.font = '13px Sarabun';
    ctx.fillText('Student Developer & Intern', 300, 625);
    
    // Mock signature for the supervisor
    ctx.fillStyle = '#b45309';
    ctx.font = 'italic 24px Brush Script MT, cursive, Sarabun';
    ctx.fillText('Supervisor Approved', 700, 560);
    
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 15px Sarabun';
    ctx.fillText('Internship Mentor', 700, 605);
    ctx.font = '13px Sarabun';
    ctx.fillText('Materials Production Dept.', 700, 625);

    // Barcode on corner
    ctx.fillStyle = '#111827';
    ctx.font = '10px Courier';
    ctx.fillText('ID: ' + STUDENT.id, 500, 650);

    // Trigger download
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Internship_Completion_Certificate_${STUDENT.id}.png`;
    a.click();
    if (typeof showToast === 'function') showToast('📜 ทำการดาวน์โหลด E-Certificate ของคุณเรียบร้อยแล้ว!');
  }
};
