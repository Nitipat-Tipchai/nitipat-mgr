// ui-ai-widget.js
// ══════════════════════════════════════════════════
// NITIPAT AI Assistant Floating Chatbot Widget
// ══════════════════════════════════════════════════

window.initAiWidget = function() {
  if (document.getElementById('ai-widget-container')) return;

  const container = document.createElement('div');
  container.id = 'ai-widget-container';
  container.innerHTML = `
    <!-- Floating Button -->
    <button id="aiWidgetFab" class="ai-fab-btn" onclick="toggleAiDrawer()">
      <span class="ai-fab-sparkle">✨</span> NITIPAT AI
    </button>

    <!-- AI Assistant Drawer -->
    <div id="aiDrawer" class="ai-drawer glass-heavy" style="display:none;">
      <div class="ai-drawer-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:20px;">🤖</span>
          <div>
            <div style="font-weight:700; font-size:14px;">NITIPAT AI Assistant</div>
            <div style="font-size:10px; opacity:0.7;">ขับเคลื่อนด้วย OKMD AI Playground</div>
          </div>
        </div>
        <button class="icon-btn" onclick="toggleAiDrawer()" style="color:white; border:none; background:none; cursor:pointer;">✕</button>
      </div>

      <div class="ai-drawer-body" id="aiChatBody">
        <div class="ai-msg ai-bot">
          สวัสดีครับคุณนิติพัฒน์! 👋 ผมเป็น AI ผู้ช่วยส่วนตัวของคุณ มีอะไรให้ผมช่วยจัดการวันนี้ไหมครับ?
        </div>

        <div class="ai-quick-prompts">
          <button onclick="sendQuickPrompt('สรุปภารกิจและตารางเรียนวันนี้ให้หน่อยครับ')">📊 สรุปภารกิจวันนี้</button>
          <button onclick="sendQuickPrompt('ช่วยจัดลำดับความสำคัญของงานค้างให้ทีครับ')">💡 จัดลำดับงานด่วน</button>
          <button onclick="sendQuickPrompt('ช่วยแนะนำเทคนิคการอ่านหนังสือสอบช่วงนี้หน่อย')">📝 วางแผนอ่านสอบ</button>
        </div>
      </div>

      <div class="ai-drawer-footer">
        <input type="text" id="aiChatInput" class="glass-input" placeholder="ถาม AI หรือพิมพ์คำสั่ง..." onkeydown="if(event.key==='Enter') sendAiMessage()">
        <button id="aiSendBtn" class="btn-glass-primary" onclick="sendAiMessage()" style="padding: 8px 16px;">ส่ง</button>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  injectAiWidgetStyles();
};

function injectAiWidgetStyles() {
  if (document.getElementById('ai-widget-styles')) return;
  const style = document.createElement('style');
  style.id = 'ai-widget-styles';
  style.innerHTML = `
    .ai-fab-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
      color: white;
      border: none;
      border-radius: 30px;
      padding: 12px 20px;
      font-weight: 700;
      font-size: 14px;
      box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .ai-fab-btn:hover {
      transform: translateY(-3px) scale(1.03);
      box-shadow: 0 14px 30px rgba(99, 102, 241, 0.6);
    }
    .ai-drawer {
      position: fixed;
      bottom: 80px;
      right: 24px;
      width: 360px;
      height: 520px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 100px);
      z-index: 9999;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(20px);
      background: rgba(15, 23, 42, 0.85);
      color: white;
    }
    .ai-drawer-header {
      padding: 16px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(236, 72, 153, 0.2));
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ai-drawer-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ai-msg {
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.5;
      max-width: 85%;
      word-wrap: break-word;
    }
    .ai-msg.ai-bot {
      background: rgba(255, 255, 255, 0.1);
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .ai-msg.ai-user {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .ai-quick-prompts {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }
    .ai-quick-prompts button {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #c7d2fe;
      padding: 6px 10px;
      border-radius: 12px;
      font-size: 11px;
      cursor: pointer;
      transition: 0.2s;
    }
    .ai-quick-prompts button:hover {
      background: rgba(99, 102, 241, 0.35);
      color: white;
    }
    .ai-drawer-footer {
      padding: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      gap: 8px;
      background: rgba(0, 0, 0, 0.2);
    }
  `;
  document.head.appendChild(style);
}

window.toggleAiDrawer = function() {
  const drawer = document.getElementById('aiDrawer');
  if (!drawer) return;
  const isHidden = drawer.style.display === 'none';
  drawer.style.display = isHidden ? 'flex' : 'none';
};

window.sendQuickPrompt = function(promptText) {
  const input = document.getElementById('aiChatInput');
  if (input) {
    input.value = promptText;
    sendAiMessage();
  }
};

window.sendAiMessage = async function() {
  const input = document.getElementById('aiChatInput');
  const body = document.getElementById('aiChatBody');
  if (!input || !body) return;

  const text = input.value.trim();
  if (!text) return;

  // Add User Message
  const userMsgDiv = document.createElement('div');
  userMsgDiv.className = 'ai-msg ai-user';
  userMsgDiv.innerText = text;
  body.appendChild(userMsgDiv);

  input.value = '';
  body.scrollTop = body.scrollHeight;

  // Add Loading Message
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'ai-msg ai-bot';
  loadingDiv.innerText = '⏳ กำลังประมวลผล...';
  body.appendChild(loadingDiv);
  body.scrollTop = body.scrollHeight;

  try {
    // Context snapshot
    const plannerTasks = (state.plannerTasks || []).filter(t => !t.done);
    const contextPrompt = `ข้อมูลบริบทของผู้ใช้ปัจจุบัน:
- งานค้างใน Planner: ${JSON.stringify(plannerTasks.map(t => ({ title: t.title, due: t.due, tag: t.tag })))}
- คำถามของผู้ใช้: ${text}`;

    const messages = [
      { role: 'system', content: 'คุณคือ NITIPAT AI ผู้ช่วยการเรียนและจัดสรรเวลา ตอบคำถามเป็นภาษาไทย กระชับ เป็นกันเอง และสุภาพ' },
      { role: 'user', content: contextPrompt }
    ];

    const reply = await callOkmdAI(messages);
    loadingDiv.innerText = reply;
  } catch (err) {
    loadingDiv.innerText = `❌ ${err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI'}`;
  }
  body.scrollTop = body.scrollHeight;
};
