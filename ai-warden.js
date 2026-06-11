/**
 * 🤖 NITIPAT MANAGER V2 - EXTREME WARDEN AI
 * นี่คือระบบผู้คุมวิญญาณที่จะทำงานพื้นหลังเพื่อด่าและกระตุ้นนิติพัฒน์
 */

class WardenAI {
  constructor() {
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
    this.apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  }

  async generateGuiltTrip(contextData) {
    if (!this.apiKey) {
      console.warn("WardenAI: API Key not set. Cannot guilt trip.");
      return "⚠️ ตั้งค่า Gemini API Key ในการตั้งค่า (Settings) ก่อน เพื่อเปิดใช้งานโหมดผู้คุมสุดโหด!";
    }

    const prompt = `
      คุณคือ "ผู้คุมสุดโหด" ในเรือนจำวิศวกรรมวัสดุ หน้าที่ของคุณคือด่าทอ กระตุ้น และจี้จุดอ่อนของเด็กวิศวะชื่อ "นิติพัฒน์" ที่ตอนนี้ขี้เกียจมาก เกรดกำลังจะตก และใกล้จะเรียนไม่จบ
      จงใช้ข้อมูลต่อไปนี้ในการด่าและตักเตือนให้เขาไปอ่านหนังสือซะ (เขียนให้เจ็บปวด เป็นภาษาไทย สั้นๆ กระแทกใจ ไม่เกิน 3 ประโยค):
      
      ข้อมูลปัจจุบันของนิติพัฒน์:
      - GPA สะสม: ${contextData.gpa}
      - จำนวนวิชาที่ยังไม่ได้เกรดในเทอมนี้: ${contextData.currentCourses}
      - งานค้าง (Assignments Pending): ${contextData.pendingAssignments} งาน
      - ชั่วโมงการโฟกัส (Pomodoro) วันนี้: ${contextData.focusHours} ชั่วโมง
      
      (อย่าลืม: ด่าให้เจ็บ แต่แฝงความหวังดีให้ลุกไปอ่านหนังสือ ห้ามพูดเพราะ ห้ามใช้คำสุภาพเกินไป ใช้คำพูดแบบรุ่นพี่สายว้าก)
    `;

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('API Request failed');
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (e) {
      console.error("WardenAI Error:", e);
      return "⚠️ ระบบผู้คุมขัดข้อง... แต่ถึงแอปจะพัง คุณก็ต้องไปอ่านหนังสือเดี๋ยวนี้!";
    }
  }

  // UI Setting removed as key is hardcoded

  async runDailyNag() {
    // Collect context from global state
    const allPast = [];
    let currentCourseCount = 0;
    if (state.semesters) {
      state.semesters.forEach(s => {
        (state.courses[s.id] || []).forEach(c => {
          if (c.grade && c.grade !== 'W') allPast.push(c);
          else currentCourseCount++;
        });
      });
    }
    
    let pendingAssignCount = 0;
    const nowTime = new Date();
    if (state.assignments) {
      Object.values(state.assignments).flat().forEach(a => {
        if (!a.submitted) {
          pendingAssignCount++;
          // WARDEN PENALTY FOR LATE ASSIGNMENTS
          if (a.dueDate) {
            const due = new Date(a.dueDate + 'T' + (a.dueTime || '23:59'));
            if (nowTime > due && !a.penalized) {
              a.penalized = true;
              if (typeof fsUpd === 'function') fsUpd('assignments', a.id, { penalized: true });
              if (!state.expenses) state.expenses = [];
              state.expenses.push({ id: 'late_' + a.id, amount: 200, category: 'penalty', date: nowTime.toISOString(), note: 'ค่าปรับส่งงานช้า: ' + a.title });
              localStorage.setItem('expenses', JSON.stringify(state.expenses));
              alert(`🚨 AI WARDEN ลงโทษ! 🚨\\nคุณค้างงาน: ${a.title}\\nระบบหักเงินคุณ 200 บาท! ไปปั่นเดี๋ยวนี้!`);
            }
          }
        }
      });
    }

    const contextData = {
      gpa: getCumGPA() || "ไม่ทราบ",
      currentCourses: currentCourseCount,
      pendingAssignments: pendingAssignCount,
      focusHours: (state.totalFocusHours || 0).toFixed(1)
    };

    // Inject to Dashboard
    const dashboardTitle = document.querySelector('.dash-hero');
    if (dashboardTitle && !document.getElementById('warden-quote')) {
      const quoteBox = document.createElement('div');
      quoteBox.id = 'warden-quote';
      quoteBox.className = 'glass-card nb-card';
      quoteBox.style.cssText = 'margin-top: 15px; border: 2px solid var(--c-rust); background: #fff1f2; color: var(--c-rust); font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 15px; padding: 15px; border-radius: 12px;';
      quoteBox.innerHTML = `
        <div style="font-size: 30px; animation: shake 0.5s infinite;">😡</div>
        <div id="warden-msg">ระบบกำลังประมวลผลความขี้เกียจของคุณ...</div>
      `;
      dashboardTitle.parentElement.insertBefore(quoteBox, dashboardTitle.nextSibling);

      const msg = await this.generateGuiltTrip(contextData);
      const msgElem = document.getElementById('warden-msg');
      if (msgElem) {
        msgElem.innerHTML = msg.replace(/\n/g, '<br>');
      }
    }
  }
}

window.Warden = new WardenAI();
