// ══════════════════════════════════════════════════
// 🎓 ULTRA-PREMIUM ACADEMIC REPORT VIEWER
// ══════════════════════════════════════════════════

function getReportDataModel() {
  const gpa = getCumGPA();
  const proStatusRaw = getProStatus(gpa);
  let proStatusText = "สภาพวิทยฐานะ: ปกติ (Normal)";
  let proStatusColor = "#10b981"; // Emerald
  let proStatusIcon = "✨";

  if (proStatusRaw === 'pro-low') {
    proStatusText = "⚠️ สภาพวิทยฐานะ: รอพินิจ (Pro-Low)";
    proStatusColor = "#f59e0b"; // Amber
    proStatusIcon = "⚠️";
  } else if (proStatusRaw === 'pro-high') {
    proStatusText = "🚨 สภาพวิทยฐานะ: รอพินิจ (Pro-High)";
    proStatusColor = "#ef4444"; // Red
    proStatusIcon = "🚨";
  } else if (proStatusRaw === 'expelled') {
    proStatusText = "❌ สภาพวิทยฐานะ: พ้นสภาพ (Expelled)";
    proStatusColor = "#b91c1c"; // Dark Red
    proStatusIcon = "❌";
  }
  
  const consecutiveLow = typeof getConsecutiveLowProCount === 'function' ? getConsecutiveLowProCount() : 0;
  let isExpelled = false;
  if (consecutiveLow >= 2) {
    proStatusText = "💥 สภาพวิทยฐานะ: พ้นสภาพ (EXPELLED - 2 Consecutive Terms)";
    proStatusColor = "#ef4444";
    proStatusIcon = "💀";
    isExpelled = true;
  }

  const credits = getTotalPassedCredits();
  
  const historySemesters = [];
  state.semesters.forEach(sem => {
    const semCourses = state.courses[sem.id] || [];
    const graded = [];
    semCourses.forEach(c => {
      if (c.grade && c.grade !== '-' && c.grade !== 'I') {
        graded.push(c);
      }
    });
    if (graded.length > 0) {
      historySemesters.push({
        name: sem.name,
        courses: graded,
        gpa: calcGPAFromList(graded)
      });
    }
  });

  let plannedCourses = [];
  let plannedTotalCr = 0;
  try {
    const savedTrial = localStorage.getItem('nitipat_trial_registration');
    if (savedTrial) {
      const parsed = JSON.parse(savedTrial);
      parsed.forEach(item => {
        let courseDef = { code: item.courseCode, nameTh: item.courseCode, credits: 3 }; 
        if (typeof ALL_COURSES !== 'undefined') {
          const found = ALL_COURSES.find(c => c.code === item.courseCode);
          if (found) courseDef = found;
        } else if (typeof COURSE_DB !== 'undefined') {
           for(let cat in COURSE_DB) {
              const found = COURSE_DB[cat].find(c => c.code === item.courseCode);
              if (found) { courseDef = found; break; }
           }
        }
        
        let slotText = "-";
        if (item.slots && item.slots.length > 0) {
          const daysTh = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
          slotText = item.slots.map(s => `${daysTh[s.day] || ''} ${s.startTime}-${s.endTime}`).join(', ');
        }
        
        plannedCourses.push({
          code: courseDef.code,
          nameTh: courseDef.nameTh || courseDef.name || courseDef.code,
          credits: courseDef.credits,
          secNo: item.secNo || '-',
          instructor: item.instructor || '-',
          timeStr: slotText
        });
        plannedTotalCr += (parseInt(courseDef.credits) || 0);
      });
    }
  } catch(e) {}

  return {
    gpa, proStatusText, proStatusColor, proStatusIcon, isExpelled, credits,
    historySemesters, plannedCourses, plannedTotalCr,
    timestamp: new Date().toLocaleString('th-TH')
  };
}

function buildDocumentHTML(data, docId, verifyUrl, isPreview) {
  const hash = docId ? "VERIFIED-" + docId.substring(0,8).toUpperCase() : "UNVERIFIED-DRAFT-PREVIEW";
  
  return `
    <div class="a4-document" id="a4-preview-element">
      <div class="doc-watermark">NITIPAT</div>
      
      <div class="doc-header">
        <div>
          <div class="doc-subtitle">Academic Performance & Registration Plan</div>
          <h1 class="doc-title">คำร้องขออนุมัติแผนการเรียน</h1>
        </div>
        <div class="doc-qr-area">
          <div class="doc-qr-placeholder" id="qr-container">
            ${isPreview ? '<div id="qr-loading-text">UNVERIFIED<br>DRAFT</div>' : ''}
          </div>
          <div style="font-family:monospace; font-size:9px; color:#94a3b8; margin-top:4px;" id="report-doc-id">${docId || 'PRE-GEN-DOC'}</div>
        </div>
      </div>

      <div class="student-card">
        <div class="info-box">
          <div class="info-label">Student Identity</div>
          <div class="info-val-lg">${STUDENT.nameTh}</div>
          <div class="info-val-sm">${STUDENT.name}</div>
          <div class="info-val-sm" style="margin-top:8px; font-weight:600;">ID: ${STUDENT.id}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Academic Program</div>
          <div class="info-val-sm" style="font-weight:700;">${STUDENT.faculty}</div>
          <div class="info-val-sm">${STUDENT.major}</div>
          <div class="info-val-sm" style="margin-top:8px; color:#64748b;">${STUDENT.degree}</div>
        </div>
      </div>

      <div class="advisor-box">
        <div style="font-size:24px;">👨‍🏫</div>
        <div>
          <div class="info-label" style="margin-bottom:2px;">Advisor (อาจารย์ที่ปรึกษา)</div>
          <div style="font-weight:700; color:#1e293b; font-size:14px;">ผศ.พรทิพย์ เล็กพิทยา (Asst. Prof. Porntip Lekpittaya)</div>
          <div style="font-size:12px; color:#64748b; margin-top:2px;">Staff ID. 1603</div>
        </div>
      </div>

      <div class="status-banner ${data.isExpelled ? 'expelled' : ''}" ${!data.isExpelled ? `style="border-left-color:${data.proStatusColor}; background:${data.proStatusColor}15;"` : ''}>
        <div style="font-size: 32px;">${data.proStatusIcon}</div>
        <div style="flex: 1;">
          <div style="font-weight: 800; font-size: 16px; color: ${data.proStatusColor};">${data.proStatusText}</div>
          <div style="font-size: 13px; color: ${data.isExpelled ? '#cbd5e1' : '#475569'}; margin-top: 4px;">Cumulative GPAX: <strong>${data.gpa}</strong> | Total Credits Earned: <strong>${data.credits}</strong></div>
        </div>
      </div>

      <h2 class="section-title"><span>📝</span> แผนการลงทะเบียนเรียน (Proposed Plan)</h2>
      ${data.plannedCourses.length > 0 ? `
        <table class="premium-table">
          <thead>
            <tr><th style="width:12%">Code</th><th style="width:35%">Course Title</th><th style="width:28%">Schedule & Instructor</th><th style="width:10%; text-align:center;">Sec</th><th style="width:15%; text-align:center;">Credits</th></tr>
          </thead>
          <tbody>
            ${data.plannedCourses.map(c => `
              <tr>
                <td style="font-weight:700; color:#3b82f6;">${c.code}</td>
                <td style="font-weight:600;">${c.nameTh}</td>
                <td>
                  <div style="font-size:11px; color:#4f46e5; font-weight:600;">${c.timeStr}</div>
                  <div style="font-size:11px; color:#64748b; margin-top:2px;">👤 ${c.instructor}</div>
                </td>
                <td style="text-align:center;">${c.secNo}</td>
                <td style="text-align:center; font-weight:800;">${c.credits}</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="4" style="text-align:right; font-weight:800; font-size:14px; border-bottom:none; padding-top:20px;">Total Requested Credits:</td>
              <td style="text-align:center; font-weight:800; font-size:16px; color:#10b981; border-bottom:none; padding-top:20px;">${data.plannedTotalCr}</td>
            </tr>
          </tbody>
        </table>
      ` : `
        <div style="padding:20px; background:#f8fafc; border-radius:8px; text-align:center; color:#64748b; margin-bottom:30px; border:1px dashed #cbd5e1;">⚠️ ไม่มีข้อมูลแผนการเรียน (โปรดจัดตารางในเมนูทดลองลงทะเบียนก่อน)</div>
      `}

      <h2 class="section-title" style="margin-top:20px; break-before: auto;"><span>📚</span> ประวัติผลการเรียน (Grade History)</h2>
      ${data.historySemesters.map(sem => `
        <div style="margin-bottom: 20px; break-inside: avoid;">
          <div style="font-weight:800; font-size:13px; color:#1e3a8a; margin-bottom:8px; display:flex; justify-content:space-between;">
            <span>${sem.name}</span>
            <span style="color:#64748b;">Term GPA: <strong style="color:#0f172a;">${sem.gpa}</strong></span>
          </div>
          <table class="premium-table" style="margin-bottom:10px;">
            <thead>
              <tr><th style="width:15%">Code</th><th style="width:65%">Course Title</th><th style="width:10%; text-align:center;">CR</th><th style="width:10%; text-align:center;">Grade</th></tr>
            </thead>
            <tbody>
              ${sem.courses.map(c => `
                <tr>
                  <td style="font-weight:600; color:#475569;">${c.code}</td>
                  <td>${c.nameTh || c.name || '-'}</td>
                  <td style="text-align:center;">${c.credits}</td>
                  <td style="text-align:center;"><div class="grade-badge">${c.grade}</div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}

      <div class="security-block" style="break-inside: avoid;">
        <div class="security-icon">✓</div>
        <div>
          <div style="font-weight:800; font-size:14px; color:#0f172a; margin-bottom:4px;">Verified Official Document</div>
          <div style="font-size:11px; color:#64748b; margin-bottom:2px;">This document is generated by the NITIPAT system and has not been tampered with. For verification, scan the QR code.</div>
          <div style="font-family:'JetBrains Mono', monospace; font-size:10px; color:#3b82f6; word-break:break-all;" id="report-signature">${hash}</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:2px;">TIMESTAMP: ${data.timestamp}</div>
        </div>
      </div>

    </div>
  `;
}

function getDocumentCSS() {
  return `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Inter:wght@300;400;600;800&display=swap');
      
      body { margin: 0; padding: 0; background: #e2e8f0; display: flex; justify-content: center; font-family: 'Inter', sans-serif; }
      
      .a4-document {
        width: 100%;
        max-width: 850px;
        min-height: 1100px;
        background: #ffffff;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
        padding: 60px;
        position: relative;
        overflow: hidden;
        color: #1e293b;
      }

      .doc-watermark {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%) rotate(-30deg);
        font-family: 'Playfair Display', serif;
        font-size: 140px;
        font-weight: 700;
        color: rgba(79, 70, 229, 0.03);
        white-space: nowrap;
        pointer-events: none;
        z-index: 0;
      }

      .doc-header { border-bottom: 2px solid #e2e8f0; padding-bottom: 30px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; }
      .doc-title { font-family: 'Playfair Display', serif; color: #1e3a8a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.2; }
      .doc-subtitle { font-size: 14px; color: #64748b; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }
      .doc-qr-area { display: flex; flex-direction: column; align-items: center; gap: 6px; }
      .doc-qr-placeholder { width: 90px; height: 90px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 10px; color: #94a3b8; text-align: center; padding: 5px; overflow: hidden; }
      .doc-qr-placeholder img { width: 100%; height: 100%; object-fit: cover; }

      .student-card { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px; position: relative; z-index: 1; }
      .info-box { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; }
      .advisor-box { background: #fff; border: 2px dashed #e2e8f0; padding: 15px 20px; border-radius: 12px; margin-bottom: 30px; display: flex; align-items: center; gap: 15px; }
      .info-label { font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
      .info-val-lg { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
      .info-val-sm { font-size: 14px; color: #475569; }

      .status-banner { border-left: 4px solid #10b981; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 40px; display: flex; align-items: center; gap: 15px; }
      .status-banner.expelled { background: #000 !important; color: #fff; border-left: 6px solid #ef4444 !important; }

      .section-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; display: flex; align-items: center; gap: 10px; }
      .premium-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 30px; font-size: 13px; }
      .premium-table th { background: #f8fafc; padding: 12px 15px; text-align: left; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
      .premium-table td { padding: 10px 15px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: top; }
      .grade-badge { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; font-weight: 800; font-size: 13px; background: #eff6ff; color: #2563eb; }

      .security-block { margin-top: 50px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; gap: 20px; align-items: center; }
      .security-icon { width: 40px; height: 40px; background: #10b98115; color: #10b981; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 20px; box-shadow: 0 0 15px rgba(16, 185, 129, 0.2); flex-shrink: 0; }

      /* PRINT CSS: 100% Native A4 */
      @media print {
        body { background: #fff; display: block; }
        .a4-document { box-shadow: none; padding: 0; border: none; max-width: 100%; }
        @page { size: A4 portrait; margin: 10mm 15mm; }
      }
  `;
}

window.generateAndPrintFrontendPDF = async function() {
  showToast("Preparing Document in New Tab...", "wait");
  try {
    const dataModel = getReportDataModel();
    const docData = {
      studentId: STUDENT.id,
      nameTh: STUDENT.nameTh,
      gpax: dataModel.gpa,
      credits: dataModel.credits,
      timestamp: new Date().toISOString()
    };
    
    let docId = "LOCAL-" + Date.now();
    try {
      if (typeof db !== 'undefined' && typeof collection !== 'undefined' && typeof addDoc !== 'undefined') {
        const docRef = await addDoc(collection(db, "verifications"), docData);
        docId = docRef.id;
      }
    } catch(e) { console.warn("Firestore error:", e); }
    
    const verifyUrl = "https://nitipat-mgr.vercel.app/?verify=" + docId;
    
    // Open New Tab
    const newWin = window.open('', '_blank');
    if (!newWin) {
      showToast("Popup blocked! Please allow popups.", "err");
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Academic Report - ${STUDENT.nameTh}</title>
        <meta charset="utf-8">
        <style>${getDocumentCSS()}</style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      </head>
      <body>
        ${buildDocumentHTML(dataModel, docId, verifyUrl, false)}
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              const qrContainer = document.getElementById('qr-container');
              if (qrContainer && typeof QRCode !== 'undefined') {
                qrContainer.innerHTML = ''; // clear loading
                new QRCode(qrContainer, {
                  text: "${verifyUrl}",
                  width: 90,
                  height: 90,
                  colorDark : "#0f172a",
                  colorLight : "#f8fafc",
                  correctLevel : QRCode.CorrectLevel.L
                });
              }
              // Trigger print dialog after QR code paints
              setTimeout(function() { window.print(); }, 500);
            }, 300);
          };
        </script>
      </body>
      </html>
    `;
    
    newWin.document.write(htmlContent);
    newWin.document.close();
    
    showToast("✅ เปิดเอกสารในแท็บใหม่แล้ว", "ok");
  } catch(e) {
    console.error(e);
    showToast("เกิดข้อผิดพลาดในการสร้างเอกสาร", "err");
  }
};

function renderAcademicReport() {
  const dataModel = getReportDataModel();

  return `
    <style>
      ${getDocumentCSS()}
      
      .report-viewer-overlay {
        position: relative;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 20px 100px;
        animation: viewerFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        background: rgba(15, 23, 42, 0.05); /* slightly tinted background for preview */
      }
      
      @keyframes viewerFadeIn {
        from { opacity: 0; transform: translateY(20px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .a4-document {
        border-radius: 12px; /* rounded corners for preview only */
      }

      .fab-container {
        position: fixed;
        top: 25px;
        right: 30px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        padding: 10px 20px;
        border-radius: 999px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
        display: flex;
        gap: 15px;
        z-index: 10000;
      }

      .fab-btn {
        padding: 12px 24px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        display: flex; align-items: center; gap: 8px;
      }

      .fab-primary { background: linear-gradient(135deg, #4f46e5, #3b82f6); color: white; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3); }
      .fab-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4); }
      .fab-secondary { background: transparent; color: #475569; border: 1px solid #cbd5e1; }
    </style>

    <div class="report-viewer-overlay">
      
      <!-- Sticky Action Bar -->
      <div class="fab-container">
        <button class="fab-btn fab-secondary" onclick="state.view = 'dashboard'; render();">✕ Back to Dashboard</button>
        <button class="fab-btn fab-primary" onclick="generateAndPrintFrontendPDF()">
          <span style="font-size:16px;">📑</span> Generate PDF (New Tab)
        </button>
      </div>

      <!-- Preview Document -->
      ${buildDocumentHTML(dataModel, null, null, true)}

    </div>
  `;
}
