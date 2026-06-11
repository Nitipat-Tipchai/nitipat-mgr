// ══════════════════════════════════════════════════
// WEB PUSH NOTIFICATIONS & REMINDERS
// ══════════════════════════════════════════════════

window.initWebPush = async function() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('firebase-messaging-sw.js');
      console.log('Firebase Service Worker registered');

      // อัปเดต Token อัตโนมัติถ้าเคยอนุญาตแล้ว
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && typeof getToken !== 'undefined') {
        const registration = await navigator.serviceWorker.ready;
        try {
          const currentToken = await getToken(messaging, {
            vapidKey: 'BGJJHyr07SwrKxHuo1w8HDRYCb6R-p6kZsk6yRaq-ho-iQ-7S0YdfTgz9KKDFW95jyQ927xCY51r6Wml84TonF4'.trim(),
            serviceWorkerRegistration: registration
          });
          if (currentToken) {
            if (typeof google !== 'undefined' && google.script) {
              try {
                google.script.run.withFailureHandler(() => {}).saveFcmToken(currentToken);
              } catch (e) {}
            }
          }
        } catch (tokenErr) {
          console.warn('FCM token auto-update skipped: Push service connection is currently unavailable or blocked (VPN/AdBlocker/network). Using local notifications fallback.');
        }
      }
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
    }
  }
};

window.requestNotificationPermission = async function() {
  if (!("Notification" in window)) {
    alert("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน");
    return;
  }

  let permission = await Notification.requestPermission();
  if (permission === "granted") {
    try {
      const registration = await navigator.serviceWorker.ready;
      const currentToken = await getToken(messaging, {
        vapidKey: 'BGJJHyr07SwrKxHuo1w8HDRYCb6R-p6kZsk6yRaq-ho-iQ-7S0YdfTgz9KKDFW95jyQ927xCY51r6Wml84TonF4'.trim(),
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        const tokenHash = currentToken.substring(currentToken.length - 20);
        // Note: setDoc and db must be available from firebase-logic.js
        if (typeof setDoc !== 'undefined' && typeof db !== 'undefined' && typeof doc !== 'undefined' && typeof serverTimestamp !== 'undefined') {
            await setDoc(doc(db, 'fcm_tokens', tokenHash), {
                token: currentToken,
                updatedAt: serverTimestamp(),
                userId: window.STUDENT ? window.STUDENT.id : 'unknown',
                platform: navigator.platform,
                userAgent: navigator.userAgent
            });
        }
        
        if (typeof google !== 'undefined' && google.script) {
          google.script.run.withSuccessHandler(res => {
            showToast(`✅ ลงทะเบียนสำเร็จ! (อุปกรณ์ที่ ${res?.count || 1})`);
          }).withFailureHandler(err => {
            console.warn("GAS saveFcmToken failed:", err);
            showToast(`✅ ลงทะเบียนแจ้งเตือนสำเร็จ (เชื่อมต่อคลาวด์)`);
          }).saveFcmToken(currentToken);
        } else {
          showToast(`✅ ลงทะเบียนแจ้งเตือนสำเร็จ (เชื่อมต่อคลาวด์)`);
        }

        showToast("✅ เปิดการแจ้งเตือน FCM สำเร็จ!");
        state.notificationsGranted = true;
        new Notification("NITIPAT MANAGER", {
          body: "ระบบลงทะเบียนแจ้งเตือนแบบ Native สำเร็จแล้ว!",
          icon: "https://img1.pic.in.th/images/Gemini_Generated_Image_k0lkzwk0lkzwk0lk.png"
        });
      } else {
        showToast("⚠️ ไม่สามารถรับรหัสลงทะเบียนได้", "err");
      }
    } catch (err) {
      console.warn('FCM token retrieval failed: Push service unavailable, activating Local notifications fallback.', err);
      
      // Since browser notification permission is granted, local notifications WILL work perfectly!
      state.notificationsGranted = true;
      
      showToast("📢 เปิดใช้งาน 'ระบบแจ้งเตือนจำลองในหน้าต่างแอป' ให้คุณแล้ว!\n(เนื่องจากเครือข่าย/VPN บล็อกระบบ Push ของบราวเซอร์)", "success");
      
      new Notification("NITIPAT MANAGER", {
        body: "เปิดใช้งานระบบการแจ้งเตือนจำลอง (Local Notifications) เรียบร้อยแล้ว!",
        icon: "https://img1.pic.in.th/images/Gemini_Generated_Image_k0lkzwk0lkzwk0lk.png"
      });
    }
  } else {
    showToast("⚠️ คุณยังไม่ได้อนุญาตการแจ้งเตือน", "err");
  }
};

window.checkFcmStatus = function() {
    if (Notification.permission === 'granted') {
        showToast('✅ คุณเปิดรับการแจ้งเตือนแล้ว');
    } else if (Notification.permission === 'denied') {
        showToast('❌ คุณบล็อกการแจ้งเตือนไว้ กรุณาแก้ในตั้งค่าเบราว์เซอร์', 'err');
    } else {
        showToast('⚠️ คุณยังไม่ได้กดอนุญาตการแจ้งเตือน', 'warn');
    }
};

window.pushNotif = function(title, body, delay = 0) {
  if (!state.notificationsGranted || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  if (delay <= 0) {
    new Notification(title, { body, icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" });
  } else {
    const tid = setTimeout(() => {
      new Notification(title, { body, icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" });
    }, delay);
    if (!state.notificationTimeouts) state.notificationTimeouts = [];
    state.notificationTimeouts.push(tid);
  }
};

window.clearAllNotificationTimeouts = function() {
  if (state.notificationTimeouts) {
    state.notificationTimeouts.forEach(clearTimeout);
    state.notificationTimeouts = [];
  }
};

window.scheduleAllNotifications = function() {
  // Try to set notificationsGranted automatically if permission was already given
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      state.notificationsGranted = true;
  }
    
  if (!state.notificationsGranted) return;
  clearAllNotificationTimeouts();
  if (!state.notificationTimeouts) state.notificationTimeouts = [];

  const todayStr = new Date().toDateString();
  let notifiedMap = { date: '', events: [] };
  try { notifiedMap = JSON.parse(localStorage.getItem('nitipat_notified') || '{"date":"","events":[]}'); } catch(e){}
  if (notifiedMap.date !== todayStr) {
    notifiedMap.date = todayStr;
    notifiedMap.events = [];
  }

  function scheduleOrPush(id, title, body, hour, min = 0) {
    const eventId = `${id}_${hour}_${min}`;
    if (notifiedMap.events.includes(eventId)) return;

    const now = new Date();
    const t = new Date(now);
    t.setHours(hour, min, 0, 0);
    
    if (now >= t) {
      pushNotif(title, body, 0);
      notifiedMap.events.push(eventId);
      localStorage.setItem('nitipat_notified', JSON.stringify(notifiedMap));
    } else {
      const delay = t.getTime() - now.getTime();
      const tid = setTimeout(() => {
        pushNotif(title, body, 0);
        notifiedMap.events.push(eventId);
        localStorage.setItem('nitipat_notified', JSON.stringify(notifiedMap));
      }, delay);
      state.notificationTimeouts.push(tid);
    }
  }

  // Fallback to getDaysUntil if defined globally, or implement inline
  const getDays = typeof window.getDaysUntil === 'function' ? window.getDaysUntil : function(d) {
    return Math.ceil((new Date(d) - new Date()) / (864e5));
  };

  const assignments = state.assignments ? Object.values(state.assignments).flat().filter(a => !a.submitted) : [];
  const exams = state.exams ? Object.values(state.exams).flat() : [];

  assignments.forEach(a => {
    if (!a.dueDate) return;
    const days = getDays(a.dueDate);
    if (days === 7) {
      [8, 19].forEach(hr => scheduleOrPush(a.id, `⏳ อีก 7 วันส่ง: ${a.title}`, `อย่าลืมวางแผนทำนะ!`, hr));
    } else if (days === 3) {
      [8, 12, 16, 20].forEach(hr => scheduleOrPush(a.id, `⚠️ อีก 3 วันส่ง!! ${a.title}`, `ต้องเริ่มทำจริงจังแล้วนะ`, hr));
    } else if (days === 1) {
      const msgs = ['เริ่มเช้าวันใหม่กับงาน!', 'โอกาสสุดท้ายของเช้านี้', 'ช่วงบ่ายต้องคืบหน้า', 'เย็นนี้ต้องใกล้เสร็จ', 'ค่ำคืนแห่งการปั่นงาน', '2 ชั่วโมงสุดท้ายก่อนเที่ยงคืน?', 'ยังไม่นอนใช่ไหม? ปั่นต่อ!'];
      [7, 10, 13, 16, 19, 21, 23].forEach((hr, i) => scheduleOrPush(a.id, `🚨 พรุ่งนี้ต้องส่งแล้ว!!: ${a.title}`, msgs[i], hr));
    }
  });

  exams.forEach(e => {
    if (!e.date) return;
    const days = getDays(e.date);
    const tips = ["ทบทวนสรุป", "ทำโจทย์ย้อนหลัง", "เน้นประเด็นสำคัญ"];
    if (days === 5) {
      [9, 14, 19].forEach((hr, i) => scheduleOrPush(e.id, `📖 อีก 5 วันสอบ: ${e.title}`, `Tip: ${tips[i]}`, hr));
    } else if (days === 1) {
      for (let hr = 8; hr <= 22; hr += 2) {
        scheduleOrPush(e.id, `🔥 พรุ่งนี้สอบ!!: ${e.title}`, `Priority สูงสุด! ทบทวนโค้งสุดท้าย`, hr);
      }
    }
  });
};
