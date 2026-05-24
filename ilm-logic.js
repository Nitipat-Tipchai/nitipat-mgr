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
    localStorage.setItem('ilm_files', JSON.stringify(state.ilmFiles));
    
    // Save to firebase if logged in
    if (typeof fsSet === 'function' && state.userId) {
      fsSet('ilm_data', 'profile', state.ilmProfile).catch(e => console.warn(e));
      fsSet('ilm_data', 'companies', { list: state.ilmCompanies }).catch(e => console.warn(e));
      fsSet('ilm_data', 'logs', { list: state.ilmLogs }).catch(e => console.warn(e));
      fsSet('ilm_data', 'files', { list: state.ilmFiles }).catch(e => console.warn(e));
    }
  },

  // Initialise
  async init() {
    console.log("IILM Hub Core Initialized");
    
    // Load local storage values if they exist
    state.ilmCompanies = JSON.parse(localStorage.getItem('ilm_companies') || '[]');
    state.ilmProfile = JSON.parse(localStorage.getItem('ilm_profile') || '{}');
    state.ilmLogs = JSON.parse(localStorage.getItem('ilm_logs') || '[]');
    state.ilmFiles = JSON.parse(localStorage.getItem('ilm_files') || '[]');

    
    // Initialize default profile values
    if (!state.ilmProfile.currentPhase) state.ilmProfile.currentPhase = 'phase1';
    if (state.ilmProfile.quizPassed === undefined) state.ilmProfile.quizPassed = false;
    if (state.ilmProfile.quizScore === undefined) state.ilmProfile.quizScore = 0;
    
    // Initialize customizable schedule milestones if none exist
    if (!state.ilmProfile.schedule) {
      state.ilmProfile.schedule = {
        advisingDate: '',          // วันชี้แจงฝึกงานภาควิชาฯ
        registrationDeadline: '',  // กำหนดส่งใบคำร้องขอฝึกงาน (wt.eng.ku.ac.th)
        prepSeminar1: '',          // สัมมนาเตรียมความพร้อมครั้งที่ 1 (จริยธรรม)
        prepSeminar2: '',          // สัมมนาเตรียมความพร้อมครั้งที่ 2 (เขียนเล่ม)
        orientationDate: '',       // วันปฐมนิเทศฝึกงานนิสิตทุกคน มก.
        startDate: '',             // วันเริ่มต้นฝึกงาน
        endDate: '',               // วันสิ้นสุดฝึกงาน
        submissionDeadline: ''     // วันส่งรายงานและใบลงเวลาที่ภาควิชาฯ
      };
    }

    // Set default seminars based on customized schedule (if configured) or fallback
    const targetSeminars = [
      { id: 1, title: 'ชี้แจงฝึกงานและทำความเข้าใจข้อตกลง (หลักสูตรปกติ/พิเศษ/IDDP)', date: state.ilmProfile.schedule.advisingDate || '2026-07-15', attended: false, note: '', photoUrl: '' },
      { id: 2, title: 'อบรมด้านจริยธรรมวิชาชีพและความปลอดภัย (เตรียมความพร้อม)', date: state.ilmProfile.schedule.prepSeminar1 || '2026-10-15', attended: false, note: '', photoUrl: '' },
      { id: 3, title: 'เตรียมความพร้อมด้านวัสดุศาสตร์และการเขียนรายงาน', date: state.ilmProfile.schedule.prepSeminar2 || '2026-12-10', attended: false, note: '', photoUrl: '' },
      { id: 4, title: 'สัมมนาปฐมนิเทศนิสิตฝึกงานทุกคน (บังคับเข้าร่วม)', date: state.ilmProfile.schedule.orientationDate || '2027-03-03', attended: false, note: '', photoUrl: '' }
    ];

    if (!state.ilmProfile.seminars || state.ilmProfile.seminars.length !== 4 || (state.ilmProfile.seminars[0].date.startsWith('2025') && !state.ilmProfile.schedule.advisingDate)) {
      if (state.ilmProfile.seminars && state.ilmProfile.seminars.length === 4) {
        targetSeminars.forEach((ts, idx) => {
          ts.attended = state.ilmProfile.seminars[idx].attended || false;
          ts.note = state.ilmProfile.seminars[idx].note || '';
          ts.photoUrl = state.ilmProfile.seminars[idx].photoUrl || '';
        });
      }
      state.ilmProfile.seminars = targetSeminars;
    }
    
    // Always sync seminar dates with customized schedule if user changed them
    if (state.ilmProfile.schedule.advisingDate) state.ilmProfile.seminars[0].date = state.ilmProfile.schedule.advisingDate;
    if (state.ilmProfile.schedule.prepSeminar1) state.ilmProfile.seminars[1].date = state.ilmProfile.schedule.prepSeminar1;
    if (state.ilmProfile.schedule.prepSeminar2) state.ilmProfile.seminars[2].date = state.ilmProfile.schedule.prepSeminar2;
    if (state.ilmProfile.schedule.orientationDate) state.ilmProfile.seminars[3].date = state.ilmProfile.schedule.orientationDate;

    if (!state.ilmProfile.commute) {
      state.ilmProfile.commute = { type: 'motorcycle', cost: 60 };
    }
    
    // Default company location: Department of Energy Business (กรมธุรกิจพลังงาน ถนนวิภาวดีรังสิต)
    if (!state.ilmProfile.companyLocation) {
      state.ilmProfile.companyLocation = { lat: 13.8234, lon: 100.5623, radius: 300, simulateGPS: true }; 
    }
    
    // Set default companies ONLY if never initialized in LocalStorage (Fixing the deletion bug)
    if (localStorage.getItem('ilm_companies') === null) {
      state.ilmCompanies = [
        { id: 'c1', name: 'กรมธุรกิจพลังงาน (กองความปลอดภัยธุรกิจน้ำมัน)', field: 'Fuel Safety', status: 'interested', salary: 0, address: 'อาคารศูนย์เอนเนอร์ยี่คอมเพล็กซ์ วิภาวดีรังสิต', contact: 'ฝ่ายบุคคล doeb@doeb.go.th' },
        { id: 'c2', name: 'กองความปลอดภัยธุรกิจก๊าซปิโตรเลียมเหลว', field: 'LPG Safety', status: 'interested', salary: 0, address: 'ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ อาคาร B ชั้น 12', contact: 'lpg-safety@doeb.go.th' },
        { id: 'c3', name: 'สถาบันพัฒนาเทคนิคพลังงาน (ชลบุรี)', field: 'NDT & Inspection', status: 'interested', salary: 0, address: 'อำเภอศรีราชา ชลบุรี', contact: 'training-division@doeb.go.th' }
      ];
      localStorage.setItem('ilm_companies', JSON.stringify(state.ilmCompanies));
    }
    
    // Set default files ONLY if never initialized in LocalStorage
    if (localStorage.getItem('ilm_files') === null) {
      state.ilmFiles = [
        { id: 'f_resume', name: 'Resume_Nitipat_Tipchai.pdf', type: 'file', parentId: 'root', size: '1.2 MB', mimeType: 'application/pdf', data: 'mock_pdf_resume_data', slug: 'resume', password: '', createdAt: Date.now() - 86400000 * 5 },
        { id: 'f_transcript', name: 'Transcript_KU_Year3.pdf', type: 'file', parentId: 'root', size: '850 KB', mimeType: 'application/pdf', data: 'mock_pdf_transcript_data', slug: 'transcript', password: '', createdAt: Date.now() - 86400000 * 5 },
        { id: 'f_portfolio', name: 'ผลงานโครงงานคลังพลังงาน (LPG)', type: 'folder', parentId: 'root', size: '--', mimeType: '', data: '', slug: '', password: '', createdAt: Date.now() - 86400000 * 2 },
        { id: 'f_safety_cert', name: 'ใบรับรองความปลอดภัยคลังแก๊ส.png', type: 'file', parentId: 'f_portfolio', size: '420 KB', mimeType: 'image/png', data: 'mock_image_cert_data', slug: 'safety-certificate', password: '', createdAt: Date.now() - 86400000 * 1 }
      ];
      localStorage.setItem('ilm_files', JSON.stringify(state.ilmFiles));
    }
    
    this.saveState();
  },

  // --- GAS Proxy Integration Calls ---
  async createCalendarEvents(internshipData) {
    if (typeof google === 'undefined' || !google.script) {
      console.warn("GAS not available - Simulating Calendar Event creation");
      return { success: true, count: 40, message: "จำลองการบันทึกปฏิทินสำเร็จ (ออฟไลน์)" };
    }
    
    // Pass user custom dates if available
    const payload = {
      ...internshipData,
      startDate: state.ilmProfile.schedule.startDate || "2027-04-01",
      endDate: state.ilmProfile.schedule.endDate || "2027-05-28"
    };

    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .createILMCalendarEvents(payload);
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
    if (state.ilmProfile.schedule && state.ilmProfile.schedule.registrationDeadline) {
      return new Date(state.ilmProfile.schedule.registrationDeadline + "T23:59:59").getTime();
    }
    return null; // Let the UI display setup instruction
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

    // Check Materials Thermodynamics prerequisite (Course 01213217)
    const thermoGrade = STUDENT.existingGrades["01213217"];
    if (!thermoGrade || ["F", "W", "N"].includes(thermoGrade.grade)) {
      passed = false;
      messages.push("ยังไม่ผ่านรายวิชาบังคับก่อนหลักสูตร: 01213217 Thermodynamics of Materials (เกรดวิชานี้ต้องไม่เป็น F, W หรือ N)");
    }

    return { passed, messages, earnedCredits };
  },

  // Polite Email Templates Generator
  getEmailTemplate(type, companyName, contactPerson = 'ฝ่ายทรัพยากรบุคคล (HR)') {
    const studentName = STUDENT.nameTh;
    const studentEng = STUDENT.name;
    const major = "วิศวกรรมวัสดุ";
    const majorEn = "Materials Engineering";
    const univ = "มหาวิทยาลัยเกษตรศาสตร์ (บางเขน)";
    const univEn = "Kasetsart University (Bang Khen)";
    const startDateStr = state.ilmProfile.schedule.startDate ? new Date(state.ilmProfile.schedule.startDate).toLocaleDateString('th-TH') : '[ระบุวันเริ่ม]';
    const endDateStr = state.ilmProfile.schedule.endDate ? new Date(state.ilmProfile.schedule.endDate).toLocaleDateString('th-TH') : '[ระบุวันสิ้นสุด]';
    const sDateEn = state.ilmProfile.schedule.startDate || '[Start Date]';
    const eDateEn = state.ilmProfile.schedule.endDate || '[End Date]';
    
    if (type === 'th_request') {
      return `Subject: ขอความอนุเคราะห์สมัครฝึกงานภาคฤดูร้อน พ.ศ. 2570 - นาย${studentName} นิสิตภาควิชา${major} มก.

เรียน ${contactPerson} ${companyName}

กระผม นาย${studentName} นิสิตชั้นปีที่ 3 ภาควิชา${major} คณะวิศวกรรมศาสตร์ ${univ} รหัสนิสิต ${STUDENT.id} มีความประสงค์จะขอความอนุเคราะห์เข้าฝึกงานเพื่อศึกษาและเพิ่มประสบการณ์ทางวิชาชีพในช่วงภาคฤดูร้อน ประจำปีการศึกษา 2569 (ภาคฤดูร้อน พ.ศ. 2570) 

โดยมีระยะเวลากำหนดฝึกงานระหว่างวันที่ ${startDateStr} ถึงวันที่ ${endDateStr} (ไม่ต่ำกว่า 30 วันทำการ และเก็บชั่วโมงสะสมปฏิบัติหน้าที่ขั้นต่ำ 240 ชั่วโมงตามเกณฑ์วิชาบังคับคณะ)

กระผมมีความประสงค์และสนใจที่จะเข้าร่วมปฏิบัติงานในสายวิเคราะห์งานความปลอดภัย ความแข็งแรงทางวัสดุ และมาตรฐานอุตสาหกรรมในกองงานของ ${companyName} เป็นอย่างยิ่ง และได้แนบประวัติส่วนตัว (Resume) พร้อมทั้งใบแสดงผลการเรียน (Transcript) มาเพื่อประกอบการพิจารณาครับ

หวังเป็นอย่างยิ่งว่าจะได้รับการประสานงานและโอกาสพิจารณาให้กระผมเข้าฝึกฝนวิชาชีพในหน่วยงานของท่าน

จึงเรียนมาเพื่อโปรดพิจารณาความอนุเคราะห์
ขอแสดงความนับถืออย่างสูง

นาย${studentName}
โทรศัพท์: [เบอร์โทรของคุณ]
อีเมล: [อีเมลของคุณ]`;
    } else if (type === 'en_request') {
      return `Subject: Summer Internship Placement Application (April - May 2027) - ${studentEng}

Dear Hiring Manager / Coordinator at ${companyName},

My name is ${studentEng}, a third-year undergraduate student majoring in ${majorEn} at the Faculty of Engineering, ${univEn}. I am writing to formally apply for a summer engineering internship placement opportunity in your department.

Our academic curriculum requires a vocational summer internship of at least 240 working hours, starting from ${sDateEn} until ${eDateEn}.

Given ${companyName}'s technical expertise and standard-setting reputation, I am highly motivated to learn and contribute in fields related to materials degradation, structural safety testing, and inspection workflows under your supervisor's mentorship. I have attached my Resume and Academic Transcript for your kind review.

Thank you very much for your time and kind consideration. I look forward to hearing from you soon.

Sincerely yours,

${studentEng}
Student ID: ${STUDENT.id}
Department of ${majorEn}, Faculty of Engineering
Kasetsart University
Tel: [Your Phone]`;
    } else if (type === 'th_followup') {
      return `Subject: ติดตามผลการพิจารณาขอเข้าฝึกงานภาคฤดูร้อน - นาย${studentName} (รหัสนิสิต ${STUDENT.id})

เรียน ${contactPerson} ${companyName}

ตามที่กระผม นาย${studentName} นิสิตภาควิชา${major} คณะวิศวกรรมศาสตร์ ${univ} ได้ดำเนินการส่งหนังสือแสดงความจำนงสมัครเข้าฝึกงานภาคฤดูร้อน พ.ศ. 2570 มายังหน่วยงานเมื่อวันที่ [ระบุวันที่ส่งเมลครั้งแรก]

กระผมใคร่ขอความอนุเคราะห์ติดตามผลการพิจารณาเบื้องต้น เพื่อประสานจัดเตรียมและส่งมอบหนังสือขอความอนุเคราะห์ส่งตัวฉบับทางการจากคณะวิศวกรรมศาสตร์ มก. ให้ตรงตามกำหนดการถัดไปครับ

หากมีเอกสารหรือข้อมูลประวัติส่วนใดที่ต้องการเพิ่มเติม สามารถติดต่อกระผมได้โดยตรงทางอีเมลหรือหมายเลขโทรศัพท์นี้ครับ

ขอแสดงความนับถืออย่างสูง

นาย${studentName}
โทร: [เบอร์โทรของคุณ]`;
    }
    return '';
  },

  // --- Module 2: Orientation & Test Prep ---
  // Official Orientation Questions Pool (Department of Energy & Safety context)
  getQuizQuestions() {
    return [
      {
        q: "1. นิสิตวิศวกรรมวัสดุ มก. ต้องเก็บชั่วโมงปฏิบัติงานสะสมในการฝึกงานภาคฤดูร้อนอย่างน้อยกี่ชั่วโมง?",
        options: ["200 ชั่วโมง", "240 ชั่วโมง", "280 ชั่วโมง", "300 ชั่วโมง"],
        ans: 1,
        ref: "เกณฑ์ข้อบังคับระบุชัดเจนว่า นิสิตต้องปฏิบัติหน้าที่ไม่น้อยกว่า 240 ชั่วโมง"
      },
      {
        q: "2. หากเกิดอุบัติเหตุระหว่างตรวจคลังปิโตรเลียมจนต้องเข้าโรงพยาบาลในฐานะ 'ผู้ป่วยนอก (OPD)' วงเงินคุ้มครองประกันสวัสดิภาพ มก. จ่ายจริงสูงสุดครั้งละเท่าใด?",
        options: ["1,000 บาท", "2,000 บาท", "5,000 บาท", "ไม่จำกัดวงเงิน"],
        ans: 1,
        ref: "สิทธิ์เบิกจ่ายอุบัติเหตุกรณีผู้ป่วยนอกสูงสุด 2,000 บาทต่อครั้งตามเกณฑ์กองทุนนิสิต"
      },
      {
        q: "3. กำหนดการเส้นตายสุดท้ายในการส่งเล่มรายงานฝึกงาน ใบลงเวลาสะสม และใบประเมินจริงของปีการศึกษา 2569 คือข้อใด?",
        options: ["31 พฤษภาคม 2570", "15 มิถุนายน 2570", "30 มิถุนายน 2570", "31 กรกฎาคม 2570"],
        ans: 2,
        ref: "กำหนดการปิดซองส่งเอกสารที่ภาควิชาคือภายในวันที่ 30 มิถุนายน 2570"
      },
      {
        q: "4. หากมีความจำเป็นต้องลากิจหรือลาป่วยกระทันหันในชั่วโมงการฝึกงาน ข้อใดคือระเบียบที่ถูกต้อง?",
        options: ["ลาได้เลยโดยไม่ต้องแจ้งผู้ใด", "ต้องแจ้งพี่เลี้ยงข้าราชการคุมงานทันที และปฏิบัติชั่วโมงชดเชยภายหลังเพื่อให้ครบ 240 ชั่วโมง", "สามารถหักลบชั่วโมงและให้เพื่อนเซ็นแทนได้", "ไม่สามารถลาป่วยได้เลยทุกกรณี"],
        ans: 1,
        ref: "การลาต้องได้รับอนุมัติจากพี่เลี้ยงหน้างาน และสะสมชั่วโมงชดเชยให้ครบตามเกณฑ์ มก."
      },
      {
        q: "5. เครื่องแต่งกายสำหรับนิสิตออกฝึกงานภาคสนามในคลังพลังงานหรือท่อส่งเชื้อเพลิงแรงดันสูงคือข้อใด?",
        options: ["สวมชุดช็อปภาควิชา แว่นนิรภัย และรองเท้าเซฟตี้ต้านไฟฟ้าสถิตหัวเหล็กหุ้มส้น", "เสื้อยืดกางเกงยีนส์และรองเท้าแตะเพื่อความคล่องตัว", "ชุดนิสิตเต็มยศและรองเท้าหนังแฟชั่น", "เสื้อแจ็กเกตหนังและหมวกแก๊ปธรรมดา"],
        ans: 0,
        ref: "เขตหน้างานอุตสาหกรรมพลังงานต้องสวมชุดช็อปและอุปกรณ์ PPE ครบชุดต้านประกายไฟอย่างเคร่งครัด"
      },
      {
        q: "6. เบอร์โทรสายตรงติดต่อประสานงานฉุกเฉินฝ่ายกิจการนิสิต คณะวิศวกรรมศาสตร์ มก. คือเบอร์ใด?",
        options: ["02-797-0969", "02-942-8500", "191", "199"],
        ans: 0,
        ref: "เบอร์สายด่วนหน่วยกิจการนิสิต ตึก 3 ชั้น 1 คือ 02-797-0969"
      },
      {
        q: "7. เกรดประเมินผลที่จะปรากฏใน Transcript วิชาฝึกงานวิชาชีพวิศวกรรมวัสดุ (01213399) คือเกรดข้อใด?",
        options: ["A, B, C, D", "เกรด S (Satisfactory) / U (Unsatisfactory)", "Pass / Fail เท่านั้น", "ไม่มีการลงเกรด"],
        ans: 1,
        ref: "ประเมินผลการเรียนการศึกษาเป็นแบบผ่าน (S) หรือไม่ผ่าน (U)"
      },
      {
        q: "8. ในการฝึกงานคลังแก๊สปิโตรเลียม การทดสอบความสมบูรณ์ของรอยเชื่อมโลหะโดยไม่ทำลาย (NDT) มีเป้าหมายสูงสุดคือข้อใด?",
        options: ["เพื่อทดสอบความยืดหยุ่นของสีเคลือบภายนอก", "เพื่อค้นหารอยแตกหักระดับลึก ป้องกันการแตกร้าวแบบฉับพลันจากแรงดันแก๊สสะสม", "เพื่อลดต้นทุนการก่อสร้างท่อส่ง", "เพื่อเพิ่มความสว่างให้กับแนวรอยต่อโลหะ"],
        ans: 1,
        ref: "การตรวจ NDT ค้นหา Sub-surface defects ป้องกัน Brittle Fracture จากความเค้นดันก๊าซ"
      },
      {
        q: "9. อุปกรณ์ PPE ชนิดใดที่มีความจำจำเป็นสูงสุดเมื่อนิสิตต้องร่วมเดินตรวจคลังน้ำมันปิโตรเลียมขนาดใหญ่?",
        options: ["หน้ากากกรองกลิ่นทั่วไป", "เครื่องตรวจจับก๊าซรั่วพกพา (Multi-gas Detector) แว่นนิรภัย และรองเท้าต้านไฟฟ้าสถิตหัวเหล็ก", "ร่มกันแดดและถุงมือผ้าถักธรรมดา", "หมวกเซฟตี้พลาสติกสีแฟชั่น"],
        ans: 1,
        ref: "คลังสารเคมีไวไฟต้องการอุปกรณ์ต้านไฟฟ้าสถิต ป้องกันแรงดันแก๊ส และเครื่องตรวจสภาพอากาศแจ้งเตือนรั่วไหล"
      },
      {
        q: "10. ข้อใดระบุเกณฑ์การฝึกงานย้ายสถานที่หรือข้ามสายงานอุตสาหกรรมในระหว่างฝึกงานได้ถูกต้อง?",
        options: ["นิสิตสามารถทำเรื่องย้ายค่ายย้ายแผนกได้ตามอำเภอใจในสัปดาห์ที่ 3", "ห้ามย้ายสถานประกอบการโดยพลการอย่างเด็ดขาด ยกเว้นได้รับความเห็นชอบจากอาจารย์ประสานงานภาควิชาจากอุบัติภัยร้ายแรง", "สามารถย้ายไปทำที่บ้านได้", "สามารถหยุดกลางคันแล้วค่อยกลับมาฝึกต่อปีหน้าได้เลยไม่ต้องแจ้งคณะ"],
        ans: 1,
        ref: "การย้ายที่ฝึกงานโดยพละการจะส่งผลให้ถูกปรับตกเกรด U ในทันที"
      }
    ];
  },

  // --- Module 3: Daily Operation & Time Tracking ---
  // Money Manager Expense integration
  integrateMoneyManagerCommute() {
    if (typeof state.moneyTransactions === 'undefined') return;
    
    const commuteCost = state.ilmProfile.commute.cost || 60;
    const commuteType = state.ilmProfile.commute.type || 'motorcycle';
    
    let typeText = 'มอเตอร์ไซค์';
    if (commuteType === 'bts_mrt') typeText = 'รถไฟฟ้า BTS/MRT ไปกระทรวงพลังงาน';
    else if (commuteType === 'car') typeText = 'รถยนต์ส่วนตัว / ค่าน้ำมัน';
    else if (commuteType === 'bus') typeText = 'รถประจำทาง';

    const transaction = {
      id: 'tx_ilm_' + Date.now(),
      walletId: state.moneyWallets && state.moneyWallets[0] ? state.moneyWallets[0].id : 'cash',
      type: 'expense',
      category: 'travel',
      amount: parseFloat(commuteCost),
      desc: `💼 ค่าเดินทางตรวจคลังแก๊ส (${typeText})`,
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now()
    };
    
    state.moneyTransactions.unshift(transaction);
    if (state.moneyWallets && state.moneyWallets[0]) {
      state.moneyWallets[0].balance -= parseFloat(commuteCost);
    }
    
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
        aqi: 35,
        pm25: 8.2
      };
    }
  },

  // --- Specialized Government & Energy Safety Datasets ---
  getEnergyInterviewQuestions() {
    return [
      {
        q: "เหล็กกล้าคาร์บอนในถังเก็บน้ำมันเชื้อเพลิงใต้ดิน (Underground Fuel Storage Tank) มักพบกลไกเสื่อมสภาพ (Material Degradation) รูปแบบใดมากที่สุด และป้องกันอย่างไร?",
        a: "ปัญหากลไกที่พบบ่อยที่สุดคือ การกัดกร่อนจากไฟฟ้าเคมีในดิน (Underground Electro-chemical Corrosion) เนื่องจากเหล็กสัมผัสความชื้น สารละลายเกลือ และอากาศในดิน ป้องกันได้โดยการเคลือบผิวต้านสนิม เช่น อีพ็อกซีหนาพิเศษ ร่วมกับระบบการป้องกัน Cathodic Protection (ระบบสลักโลหะกันกร่อน Sacrificial Anode หรือใช้กระแสตรง Impressed Current)"
      },
      {
        q: "ในการคัดเลือกท่อเหล็กเพื่อขนส่งก๊าซหุงต้มปิโตรเลียมเหลว (LPG) ความดันสูง จำเป็นต้องใช้การทดสอบแบบไม่ทำลาย (NDT) ชนิดใดบ้างถึงจะปลอดภัยและมั่นใจสูงสุด?",
        a: "รอยเชื่อมของท่อและถัง LPG ต้องตรวจรอยแตกฝังลึกภายใน (Sub-surface) ด้วยการทดสอบคลื่นความถี่สูง Ultrasonic Testing (UT) หรือถ่ายภาพรังสี Radiographic Testing (RT) และตรวจจับรอยร้าวรอยแยกที่ผิวตื้นด้วยผงแม่เหล็ก Magnetic Particle Testing (MT) หรือสารแทรกซึม Dye Penetrant Testing (PT) เพื่อต้านทานแรงเค้นดันดันพุ่ง"
      },
      {
        q: "นิสิตคิดว่าจะใช้วิชา 'Mechanical Behavior of Materials' ในการตรวจสอบท่อส่งแก๊สธรรมชาติ (High-Pressure Pipeline) เพื่อป้องกันอุบัติภัยได้อย่างไร?",
        a: "ประยุกต์ใช้ในการคำนวณและประเมินขีดจำกัดความเค้นดึงทนยืด (Yield & Tensile Strength) และวิเคราะห์พฤติกรรมการแตกร้าวแบบฉับพลันจากความเค้นล้า (Fatigue Stress) จากแรงบีบสั่นสะเทือนของคอมเพรสเซอร์ปั๊ม เพื่อวางแผนตรวจสอบจุดบกพร่องตามโค้ดมาตรฐาน API 5L หรือ ASME B31.8"
      },
      {
        q: "ปัญหาการเปราะจากไฮโดรเจน (Hydrogen Embrittlement) มีกลไกเกิดอย่างไรต่อโครงสร้างโลหะทนความดันสูง?",
        a: "กลไกเกิดจากอะตอมของแก๊สไฮโดรเจนแพร่ซึมเข้าไปแทรกอยู่ตามรอยกักหรือขอบเกรน (Grain Boundaries) ของเหล็กขัดขวางการจัดตัวคริสตัล ส่งผลให้เหล็กสูญเสียความเหนียว (Ductility) และพร้อมเกิดการแตกร้าวแบบฉับพลันอย่างไร้สัญญาณเตือน (Brittle Fracture) เมื่อถูกความเค้นเชิงกลกระทำ"
      }
    ];
  },

  getSafetyRiskLevels() {
    return {
      station: {
        title: "สถานีบริการน้ำมันและสถานีบรรจุแก๊สปิโตรเลียม (Gas & LPG Station Service)",
        risk: "ระดับปานกลาง (Moderate)",
        hazards: [
          "การสูดดมสารระเหยไวไฟ (VOCs - Volatile Organic Compounds) เช่น เบนซิน โทลูอีน",
          "อุบัติเหตุการจราจรจากยานพาหนะเข้าออกปั๊มน้ำมันขณะตรวจวัดพิกัดหัวจ่าย",
          "ความเสี่ยงประกายไฟจากประจุไฟฟ้าสถิตของเสื้อผ้า/โทรศัพท์ใกล้เขตคลังบรรจุ"
        ],
        ppe: [
          "เสื้อกั๊กสะท้อนแสงนิรภัยสีส้มตองอ่อนความเห็นชัด (High-Visibility Vest)",
          "รองเท้าเซฟตี้หุ้มส้นชนิดต้านทานไฟฟ้าสถิต (Anti-static Footwear)",
          "หน้ากากกรองไอสารเคมีออร์แกนิก (Organic Vapor Mask)"
        ],
        guidelines: [
          "ตรวจวัดในทิศทางเหนือลม (Upwind) เสมอเพื่อเลี่ยงไอระเหยแก๊สเป็นพิษ",
          "ยืนตรวจในจุดที่ห่างจากวิถีเคลื่อนรถยนต์และห้ามจับถือประกายไฟในระยะ 3 เมตร",
          "ห้ามหยิบใช้อุปกรณ์อิเล็กทรอนิกส์ที่ไม่ใช่รุ่นป้องกันการเกิดประกายไฟในพื้นที่อันตราย"
        ]
      },
      depot: {
        title: "คลังเก็บน้ำมันปิโตรเลียมดิบและเชื้อเพลิงหลักขนาดใหญ่ (Oil Storage Depot)",
        risk: "ระดับสูง (High Risk)",
        hazards: [
          "อันตรายเพลิงไหม้ระเบิดฉับพลันของคลังสารเชื้อเพลิงขนาดหมื่นบาร์เรล",
          "การพลัดตกจากที่สูงระหว่างข้ามบันไดไต่ขึ้นไปส่องความสึกกร่อนขอบหลังคาถังเหล็ก",
          "พื้นที่อับอากาศอันตรายรุนแรง (Confined Space Entry) ภายในถังเก็บขนาดใหญ่"
        ],
        ppe: [
          "หมวกนิรภัยเซฟตี้ต้านไฟฟ้าทนเจาะ Class E (Safety Helmet)",
          "แว่นตานิรภัยเซฟตี้ปิดกันสารเคมีไอพ่น (Goggles/Safety Glasses)",
          "ชุดหมีผ้าฝ้ายพิเศษหน่วงไฟลามไม่สะสมไฟฟ้าสถิต (FR Coverall)",
          "รองเท้าเซฟตี้หัวเหล็กหนาพื้นกันทะลุหุ้มข้อ"
        ],
        guidelines: [
          "ห้ามเหยียบย่างขึ้นหลังคาถังเก็บโดยไม่มีการคล้องเข็มขัดกันตกขอบสะพาน (Full Harness)",
          "ต้องพกพาเครื่องวัดแก๊ส Portable Gas Detector ร่วมตรวจสภาพออกซิเจนก่อนเข้าใกล้แนวถังพัก",
          "แตะสกรูกราวด์ดินขจัดไฟฟ้าสถิตในร่างกายบริเวณป้ายทางเข้าคลังทุกครั้ง"
        ]
      },
      pipeline: {
        title: "คลังเก็บก๊าซปิโตรเลียมเหลว (LPG) และสถานีควบคุมท่อส่งแก๊สความดันสูง (LPG Terminal & pipeline)",
        risk: "ระดับอันตรายสูงสุด (Extreme)",
        hazards: [
          "ไอแก๊สความดันสูงรั่วพ่นเฉียบพลันทำลายเยื่อบุตาและทางเดินหายใจ",
          "แก๊สเหลว LPG อุณหภูมิต่ำจัดรั่วรดสัมผัสผิวหนังทำให้เกิดแผลหิมะกัด (Frostbite/Cold Burn)",
          "ความล้าของเนื้อโลหะขอบท่อแตกร้าวฉับพลันจากคลื่นกระแทกความดันกระเพื่อม"
        ],
        ppe: [
          "ถุงมือหนังเนื้อหนาทนความเย็นจัดสูงพิเศษ ป้องกันแผลแก๊สเหลวรด",
          "แว่นครอบตานิรภัยซีลปิดมิดชิด (Safety Goggles)",
          "เครื่องตรวจวัดแก๊สรั่วส่วนบุคคล (Portable Gas Detector)",
          "รองเท้าเซฟตี้ต้านแรงดันไฟฟ้าสูง"
        ],
        guidelines: [
          "สังเกตการณ์เกจความดันและความชื้นของทรานส์เฟอร์แก๊สเสมอก่อนสัมผัสถัง",
          "ใช้เครื่องมือจับสัมผัสที่เป็นทองเหลืองหรือเบอริลเลียมทองแดงชนิดไม่เกิดประกายไฟ (Non-sparking Tools)",
          "กรณีเกิดท่อรั่วเสียงหวีดพุ่ง ให้เคลื่อนที่หนีขวางลมและห้ามเดินเข้าหาในเขตใต้ลมเด็ดขาด"
        ]
      }
    };
  },

  getEnergyProjectIdeas() {
    return [
      {
        title: "การประเมินการผุพังและการชำรุดชะลอตัวจากการกัดกร่อนในถังเก็บน้ำมันเชื้อเพลิงใต้ดิน (Underground Fuel Tank Corrosion Assessment)",
        desc: "เน้นการศึกษาปัญหารอยรั่วซึมและการผุของถังโลหะใต้ดินเนื่องจากสัมผัสความชื้นและสภาพความเป็นกรดด่างในดินของสถานีบริการน้ำมัน และเสนอมาตรการทำความสะอาดและระบบป้องกัน Cathodic Protection เพื่อรักษาสภาพถังเหล็กอย่างปลอดภัยตามมาตรฐานกรมธุรกิจพลังงาน"
      },
      {
        title: "การวิเคราะห์โครงสร้างความปลอดภัยในการบรรจุก๊าซ LPG และการตรวจสอบจุดบกพร่องรอยเชื่อมด้วยการทดสอบแบบไม่ทำลาย (LPG Tank Welding NDT Evaluation)",
        desc: "เสนอแนวทางการใช้วิธี Ultrasonic Testing (UT) และ Liquid Penetrant Testing (PT) ในการเข้าสแกนหารอยแยกหรือฟองอากาศในแนวเชื่อมของถังความดันสูงสำหรับก๊าซหุงต้มเหลวปิโตรเลียม เพื่อป้องกันการแตกร้าวแบบฉับพลันจากแรงดันแก๊สสะสม"
      },
      {
        title: "การศึกษามาตรการป้องกันการเกิดออกซิเดชันและการกัดกร่อนกัลวานิกในระบบท่อส่งน้ำมันเชื้อเพลิงทางบก (Pipeline Galvanic Corrosion & Protection)",
        desc: "ศึกษาประสิทธิภาพการเคลือบผิวท่อทรานส์เฟอร์เชื้อเพลิงและการยึดติดขั้วโลหะสังเวย (Sacrificial Anode) เพื่อขัดขวางการเกิดปฏิกิริยาไฟฟ้าเคมีต้านสนิมเหล็กในบริเวณข้อต่อโลหะต่างชนิดกันที่ทอดข้ามเขตดินและน้ำ"
      },
      {
        title: "การทบทวนข้อกำหนดทางกฎหมาย มาตรฐานวิศวกรรมความปลอดภัย และการวิเคราะห์การแตกร้าวของท่อก๊าซธรรมชาติ CNG (NGV Pipeline Crack & Safety Audit)",
        desc: "ศึกษาความสัมพันธ์ของมาตรฐานแรงดึงความปลอดภัยท่อส่งแก๊สอัด NGV การควบคุมความเค้นล้าจากการสั่นสะเทือนของเครื่องคอมเพรสเซอร์ และทบทวนระยะห่างปลอดภัยในการจัดตั้งสถานีบริการตามข้อบังคับกระทรวงพลังงาน"
      }
    ];
  },

  // --- Module 5: Materials Glossary & Curriculum Course Theory Mapper ---
  getTechnicalGlossary() {
    return [
      {
        term: "Cathodic Protection (การป้องกันสนิมแบบแคโทดิก)",
        definition: "เทคนิคการควบคุมการกัดกร่อนโลหะในท่อส่งใต้ดินหรือถังเก็บพลังงานปิโตรเลียม โดยการจ่ายไฟฟ้าลบหรือติดแร่โลหะศักย์ไฟฟ้าต่ำกว่าเป็นกันชน",
        courseCode: "01213427",
        courseName: "Corrosion of Materials",
        tips: "ใช้บรรยายการป้องกันสนิมถังน้ำมันเหล็กใต้ดินในบทความส่วนทฤษฎีบทที่ 2"
      },
      {
        term: "Non-Destructive Testing - NDT (การทดสอบแบบไม่ทำลาย)",
        definition: "การตรวจสอบหารอยร้าว ข้อบกพร่องภายใน หรือความหนาของถังแก๊ส LPG โดยไม่ทำลายชิ้นงาน เช่น การตรวจด้วยคลื่นสะท้อนความถี่สูง (Ultrasonic Testing)",
        courseCode: "01213216",
        courseName: "Mechanical Behavior of Materials",
        tips: "ใช้อ้างอิงวิธีการตรวจแนวเชื่อมรอยต่อนิรภัยคลังก๊าซปิโตรเลียม"
      },
      {
        term: "Stress Corrosion Cracking - SCC (การแตกร้าวจากความเค้นร่วมกับการกัดกร่อน)",
        definition: "กลไกความเสียหายที่โลหะท่อส่งน้ำมันความดันสูงแตกร้าวเฉียบพลันจากผลร่วมของความเค้นดึงเชิงกลและปฏิกิริยากัดกร่อนไฟฟ้าเคมี",
        courseCode: "01213217",
        courseName: "Thermodynamics of Materials",
        tips: "ใช้อธิบายทฤษฎีกลศาสตร์ความคงทนและสมดุลเคมีของวัสดุทนความดันสูง"
      },
      {
        term: "Welding Defect (จุดบกพร่องในแนวเชื่อม)",
        definition: "ปัญหาฟองอากาศ เศษสารมลทิน หรือการหลอมละลายไม่สมบูรณ์บริเวณแนวรอยต่อเชื่อมของถังความปลอดภัยโลหะ ซึ่งลดแรงต้านทานทางกล",
        courseCode: "01213421",
        courseName: "Physical Metallurgy",
        tips: "เขียนอภิปรายการเปลี่ยนแปลงของโครงสร้างจุลภาคบริเวณรอยเชื่อม (HAZ - Heat Affected Zone) ในบทสรุปรายงาน"
      },
      {
        term: "Hydrogen Embrittlement (การเปราะจากไฮโดรเจน)",
        definition: "ปรากฏการณ์ที่อะตอมไฮโดรเจนซึมผ่านโลหะท่อส่งแก๊สปิโตรเลียมความดันสูงและสะสมตามโครงสร้างผลึก ทำให้โลหะสูญเสียความเหนียวและเปราะหักง่าย",
        courseCode: "01213216",
        courseName: "Mechanical Behavior of Materials",
        tips: "อภิปรายกลไกการเปลี่ยนพฤติกรรมจากวัสดุเหนียวกลายเป็นแตกร้าวแบบ Brittle Fracture"
      },
      {
        term: "Sacrificial Anode (โลหะกันกร่อนแบบสังเวย)",
        definition: "การติดตั้งแท่งโลหะที่มีค่าศักย์ไฟฟ้าลบมากกว่า (เช่น ซิงก์หรืออลูมิเนียม) เชื่อมติดถังเหล็กคลังปิโตรเลียม เพื่อปล่อยให้โลหะชนิดนี้ผุกร่อนแทนตัวถังเหล็กหลัก",
        courseCode: "01213427",
        courseName: "Corrosion of Materials",
        tips: "ใช้วาดไดอะแกรมวิเคราะห์ปฏิกิริยากัลวานิกในรายงานโครงงานบทที่ 3"
      }
    ];
  },

  // --- Module 5: Markdown Report Compiler Engine ---
  compileReportDraft() {
    const student = STUDENT;
    const activeComp = state.ilmCompanies.find(c => c.status === 'accepted') || state.ilmCompanies[0] || { name: 'กรมธุรกิจพลังงาน กระทรวงพลังงาน', address: 'ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ วิภาวดีรังสิต', field: 'Fuel Safety Standards' };
    const logs = state.ilmLogs || [];
    const schedule = state.ilmProfile.schedule || {};
    
    let logsMarkdown = '';
    if (logs.length > 0) {
      logsMarkdown = logs.map(l => `### วันที่ ${l.date} (เวลาทำงาน: ${l.hours} ชม.)\n**รายละเอียดปฏิบัติงาน**: ${l.task}\n${l.otReason ? `*เหตุผลล่วงเวลา (OT)*: ${l.otReason}\n` : ''}`).join('\n\n');
    } else {
      logsMarkdown = '*ยังไม่มีข้อมูลบันทึกเวลางานปฏิบัติการรายวัน*';
    }

    const startDateStr = schedule.startDate ? new Date(schedule.startDate).toLocaleDateString('th-TH') : '[ยังไม่ได้ป้อนวันที่]';
    const endDateStr = schedule.endDate ? new Date(schedule.endDate).toLocaleDateString('th-TH') : '[ยังไม่ได้ป้อนวันที่]';

    return `# รายงานผลการฝึกงานวิชาชีพวิศวกรรมวัสดุ (01213399) ณ หน่วยงานราชการ
**สถานที่ฝึกงาน**: ${activeComp.name}
**ผู้จัดทำ**: นาย${student.nameTh} (${student.name})
**รหัสนิสิต**: ${student.id} ชั้นปีที่ 3 
**หลักสูตร**: วิศวกรรมศาสตรบัณฑิต (สาขาวิชาวิศวกรรมวัสดุ) คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์
**ช่วงระยะเวลาฝึกงาน**: ตั้งแต่วันที่ ${startDateStr} ถึงวันที่ ${endDateStr}

---

## บทที่ 1: ข้อมูลเบื้องต้นของกรมธุรกิจพลังงาน กระทรวงพลังงาน
หน่วยงานเป้าหมายหลักคือ **${activeComp.name}** ตั้งอยู่ที่ ${activeComp.address || 'N/A'} โดยทำหน้าที่กำกับดูแล ควบคุม ตรวจสอบ และสร้างมาตรฐานความปลอดภัยสำหรับธุรกิจพลังงานเชื้อเพลิง คลังน้ำมัน ท่อส่งปิโตรเลียม และปั๊มแก๊ส LPG ทั่วประเทศ ซึ่งขอบเขตวัสดุที่เกี่ยวข้อง ได้แก่ เหล็กกล้าผสมคาร์บอนในถังแรงดัน ท่อส่งแก๊สแรงดันสูง และโลหะทนการกัดกร่อน

## บทที่ 2: ทฤษฎีวิศวกรรมวัสดุศาสตร์และการวิเคราะห์การเสื่อมสภาพที่เกี่ยวข้อง
ในระหว่างการฝึกงาน ได้ประยุกต์และเชื่อมโยงหลักวิชาความรู้จากวิศวกรรมวัสดุ มก. ดังนี้:
1. **ทฤษฎีการกัดกร่อนและป้องกันสนิม (Corrosion of Materials - 01213427)**: อธิบายกลไกเกิดปฏิกิริยาไฟฟ้าเคมีในถังเก็บใต้ดิน และบทบาทของการติดตั้งแท่ง Sacrificial Anode แคโทดิกต้านสนิม
2. **การทดสอบแบบไม่ทำลาย (Non-Destructive Testing NDT - 01213216)**: การตรวจอัลตราโซนิก (UT) หาจุดพร่องของแนวเชื่อมท่อ LPG
3. **พฤติกรรมทางกลของวัสดุ (Mechanical Behavior - 01213216)**: การวิเคราะห์ลักษณะความเหนียวและจุดแตกหักล้าจากความดันสะสม

## บทที่ 3: บันทึกตารางลงเวลาปฏิบัติงานและรายงานความก้าวหน้าสะสมรายวัน

${logsMarkdown}

## บทที่ 4: สรุปผลการศึกษาโครงงาน ปัญหา ข้อเสนอแนะ และความคิดสะท้อนคิด
1. **หัวข้อโครงงานความปลอดภัยปิโตรเลียม**: การประเมินรอยเชื่อมและการกัดกร่อนของวัสดุถังทนแรงดันและท่อส่งพลังงานของกรมธุรกิจพลังงาน
2. **ปัญหาและอุปสรรค**: เรียนรู้ระบบกฎเกณฑ์เอกสารทางราชการ กฎหมายการควบคุมน้ำมันเชื้อเพลิง และความปลอดภัยในการเข้าหน้างานคลังปิโตรเลียมขนาดใหญ่
3. **ข้อเสนอแนะต่อหลักสูตร**: ควรเพิ่มความรู้การศึกษาตรวจสอบรอยเชื่อมและมาตรฐานท่อส่งพลังงาน (เช่น มาตรฐาน API/ASME) ในคาบเรียนเพิ่มเติม`;
  }
};
