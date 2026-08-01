// ai-service.js
// ══════════════════════════════════════════════════
// OKMD AI Playground API Integration (OpenAI Compatible)
// ══════════════════════════════════════════════════

const OKMD_BASE_URL = 'https://gen.ai.kku.ac.th/okmd/api/v1';

window.getAiApiKey = function() {
  return localStorage.getItem('okmd_ai_api_key') || '';
};

window.getAiModel = function() {
  return localStorage.getItem('okmd_ai_model') || 'gemini-2.5-flash-lite';
};

window.callOkmdAI = async function(messages, customModel = null) {
  const apiKey = getAiApiKey();
  if (!apiKey) {
    throw new Error('กรุณาตั้งค่า OKMD AI API Key ในเมนูตั้งค่าก่อนใช้งานครับ');
  }

  const model = customModel || getAiModel();
  
  const response = await fetch(`${OKMD_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      stream: false
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  if (data.choices && data.choices.length > 0 && data.choices[0].message) {
    return data.choices[0].message.content;
  }
  throw new Error('ไม่ได้รับคำตอบจาก AI');
};

/**
 * Parses natural language input into structured task parameters.
 */
window.parseTaskWithAI = async function(userPrompt) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const dayName = days[now.getDay()];

  const systemPrompt = `คุณคือ AI ผู้ช่วยจัดสรรงานและเวลาสำหรับนักศึกษา
วันปัจจุบันคือวัน${dayName}ที่ ${dateStr}
ให้ทำการแกะความต้องการของผู้ใช้ภาษาไทย แล้วคืนค่าผลลัพธ์เป็น JSON Object ชนิดเดียว โดยไม่มีข้อความอื่นล้อมรอบ (NO MARKDOWN CODEBLOCKS, ONLY RAW JSON):

รูปแบบ JSON ที่ต้องส่งกลับ:
{
  "title": "ชื่องาน/การบ้าน/กิจกรรม (สั้น กระชับ)",
  "tag": "หมวดหมู่ภาษาอังกฤษ เลือกจาก [class, assignment, exam, study, research, internship, meeting, club, personal]",
  "due": "วันที่ในรูปแบบ YYYY-MM-DD (คำนวณจากคำว่า 'ศุกร์นี้', 'พรุ่งนี้', '15 ส.ค.' โดยใช้อ้างอิงจากวันที่ปัจจุบัน ${dateStr})",
  "startTime": "เวลาเริ่มในรูปแบบ HH:MM (24 ชม. เช่น 09:00, 14:30) ถ้าไม่ระบุให้เป็น null",
  "endTime": "เวลาจบในรูปแบบ HH:MM (24 ชม. เช่น 12:00, 16:00) ถ้าไม่ระบุให้เป็น null",
  "kanbanStage": "To Do",
  "note": "รายละเอียดเพิ่มเติม เช่น สถานที่, สโคปสอบ, หรือข้อความเดิมของผู้ใช้"
}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const rawResult = await callOkmdAI(messages);
  
  // Clean markdown block wrappers if present
  let cleanJsonStr = rawResult.trim();
  if (cleanJsonStr.startsWith('```')) {
    cleanJsonStr = cleanJsonStr.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(cleanJsonStr);
  } catch (e) {
    console.error('Failed to parse AI JSON:', rawResult);
    throw new Error('AI ส่งคืนข้อมูลไม่อยู่ในรูปแบบ JSON ที่ถูกต้อง');
  }
};
