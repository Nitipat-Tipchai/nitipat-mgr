const PickerManager = {
  async openPicker(courseId, parentId, onSelect) {
    if (typeof API_KEY === 'undefined' || API_KEY.startsWith('YOUR_')) {
      alert("⚠️ กรุณาตั้งค่า API_KEY ในไฟล์ google-api.js ก่อนเปิดใช้ Picker");
      return;
    }
    
    requestDriveAccess(async () => {
      const token = NativeGoogleDrive.getAccessToken();
      await new Promise((res) => gapi.load('picker', res));
      
      const appId = CLIENT_ID.split('-')[0]; // Extract App ID from Client ID
      
      const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setParent(parentId)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);

      const uploadView = new google.picker.DocsUploadView()
        .setParent(parentId);

      const picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setAppId(appId)
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .addView(view)
        .addView(uploadView)
        .setCallback((data) => {
          if (data.action === google.picker.Action.PICKED) {
            onSelect(data.docs);
          }
        })
        .build();
      
      picker.setVisible(true);
    });
  }
};

window.PickerManager = PickerManager;

/**
 * SMART COURSE HUB: DRIVE EXPLORER
 */
async function refreshDriveFiles(courseId, folderId, force = false) {
  const c = findCourseById(courseId);
  if (!c) return;

  const targetFolderId = folderId || state.currentFolderId || c.driveId;
  if (!targetFolderId) return;

  // Initialize breadcrumbs if at root
  if (targetFolderId === c.driveId && state.driveBreadcrumbs.length === 0) {
    state.driveBreadcrumbs = [{ id: targetFolderId, name: 'Root' }];
  }
  state.currentFolderId = targetFolderId;

  state.courseFiles = state.courseFiles || {};
  state.selectedItems.clear();
  refreshExplorerOnly(courseId);

  requestDriveAccess(async () => {
    try {
      const files = await NativeGoogleDrive.listDriveFiles(targetFolderId);
      state.courseFiles[targetFolderId] = {
        folders: files.filter(f => f.isFolder),
        files: files.filter(f => !f.isFolder)
      };
      refreshExplorerOnly(courseId);
    } catch (err) {
      showToast(`❌ โหลดไฟล์ล้มเหลว: ${err.message}`, 'err');
    }
  });
}

async function handleFileUpload(courseId, folderId) {
  const c = findCourseById(courseId);
  const targetFolderId = state.currentFolderId || folderId || (c ? c.driveId : null);
  if (!targetFolderId) return;

  PickerManager.openPicker(courseId, targetFolderId, (docs) => {
    showToast(`✅ อัปโหลด ${docs.length} รายการสำเร็จ (Direct to Drive)`);
    refreshDriveFiles(courseId, targetFolderId, true);
  });
}

function gotoFolder(courseId, folderId, folderName) {
  const existingIdx = state.driveBreadcrumbs.findIndex(b => b.id === folderId);
  if (existingIdx !== -1) {
    state.driveBreadcrumbs = state.driveBreadcrumbs.slice(0, existingIdx + 1);
  } else {
    state.driveBreadcrumbs.push({ id: folderId, name: folderName });
  }
  refreshDriveFiles(courseId, folderId);
}

window.saveCourseCoords = async (courseId) => {
  if (!state.tempCoords) return;
  try {
    await fsUpd('courses', courseId, { targetCoords: state.tempCoords });
    const c = findCourseById(courseId);
    if (c) c.targetCoords = state.tempCoords;
    showToast('✅ บันทึกพิกัดห้องเรียนสำเร็จ');
  } catch (e) {
    showToast('❌ ไม่สามารถบันทึกพิกัดได้', 'err');
  }
};

function initAttendanceMap(courseId, targetCoords) {
  setTimeout(() => {
    const mapEl = document.getElementById('attMap');
    if (!mapEl) return;

    let [lat, lon] = [13.8476, 100.5696]; // Default KU
    const c = findCourseById(courseId);
    const savedCoords = targetCoords || (c && c.targetCoords);
    if (savedCoords) {
      [lat, lon] = savedCoords.split(',').map(Number);
    }

    const map = L.map('attMap').setView([lat, lon], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    let marker = L.marker([lat, lon], { draggable: true }).addTo(map)
      .bindPopup(`ตึกเรียนของคุณ${savedCoords ? ' (บันทึกแล้ว)' : ''} (ลากเพื่อย้าย)`).openPopup();

    marker.on('dragend', function (e) {
      const newPos = marker.getLatLng();
      const coordsStr = `${newPos.lat.toFixed(6)},${newPos.lng.toFixed(6)}`;
      state.tempCoords = coordsStr;
      marker.getPopup().setContent(`
            พิกัดใหม่: ${coordsStr}<br>
            <button onclick="saveCourseCoords('${courseId}')" style="margin-top:8px; padding:4px 8px; background:#4f46e5; color:white; border:none; border-radius:4px; cursor:pointer;">💾 บันทึกพิกัด</button>
          `).openOn(map);
    });

    window.useCurrentLocation = () => {
      if (!navigator.geolocation) return showToast('ไม่รองรับ GPS');
      navigator.geolocation.getCurrentPosition(pos => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        map.setView(p, 17);
        marker.setLatLng(p);
        state.tempCoords = `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
      });
    };
  }, 100);
}
// ── Web Push & Notification Logic ──
async function initWebPush() {
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
}

async function requestNotificationPermission() {
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
        await setDoc(doc(db, 'fcm_tokens', tokenHash), {
          token: currentToken,
          updatedAt: serverTimestamp(),
          userId: STUDENT.id,
          platform: navigator.platform,
          userAgent: navigator.userAgent
        });
        
        if (typeof google !== 'undefined' && google.script) {
          google.script.run.withSuccessHandler(res => {
            showToast(`✅ ลงทะเบียนสำเร็จ! (อุปกรณ์ที่ ${res?.count || 1})`);
          }).withFailureHandler(err => {
            console.warn("GAS saveFcmToken failed (falling back silently to Firestore):", err);
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
      
      showToast("📢 เปิดใช้งาน 'ระบบแจ้งเตือนจำลองในหน้าต่างแอป' ให้คุณแล้ว!n(เนื่องจากเครือข่าย/VPN บล็อกระบบ Push ของบราวเซอร์)", "success");
      
      new Notification("NITIPAT MANAGER", {
        body: "เปิดใช้งานระบบการแจ้งเตือนจำลอง (Local Notifications) เรียบร้อยแล้ว!",
        icon: "https://img1.pic.in.th/images/Gemini_Generated_Image_k0lkzwk0lkzwk0lk.png"
      });
    }
  } else {
    showToast("⚠️ คุณยังไม่ได้อนุญาตการแจ้งเตือน", "err");
  }
}

window.requestNotificationPermission = requestNotificationPermission;

window.openPendingReflectionsModal = () => {
  const missing = getMissingReflections();
  if (missing.length === 0) { showToast('🎉 ไม่มีงาน Reflection ค้างแล้ว'); return; }

  openModal('📝 สรุปการเรียนที่ค้างอยู่', `
    <div style="padding:10px;">
      <p style="font-size:13px; margin-bottom:15px; color:var(--c-rust); font-weight:700;">⚠️ ตรวจพบงานที่ค้างเกิน 24 ชม. (หลอกระบบหรือเปล่า? ทำไมเข้าเรียนแต่ไม่บันทึก!)</p>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${missing.map(c => `
          <div class="glass-card" style="padding:15px; border:1.5px solid black; background:white;">
            <div style="font-weight:800;">${c.code} - ${c.nameTh}</div>
            <textarea id="refl_${c.id}" class="nb-input" style="width:100%; margin-top:10px; min-height:60px;" placeholder="วันนี้เรียนรู้อะไรบ้าง..."></textarea>
            <button class="nb-btn-primary sm full" style="margin-top:10px;" onclick="saveSingleReflection('${c.id}')">บันทึกวิชานี้</button>
          </div>
        `).join('')}
      </div>
    </div>
  `);
};

window.saveSingleReflection = async (id) => {
  const val = document.getElementById(`refl_${id}`)?.value.trim();
  if (!val) { showToast('⚠️ กรุณากรอกเนื้อหา', 'err'); return; }

  await saveReflectionData(id, val);
  showToast('✅ บันทึกสำเร็จ!');
  const remaining = getMissingReflections();
  if (remaining.length > 0) openPendingReflectionsModal();
  else closeModal();
  render();
};
// ── Notification Logic ──
function pushNotif(title, body, delay = 0) {
  if (!state.notificationsGranted || typeof Notification === 'undefined') return;
  if (delay <= 0) {
    new Notification(title, { body, icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" });
  } else {
    const tid = setTimeout(() => {
      new Notification(title, { body, icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" });
    }, delay);
    state.notificationTimeouts.push(tid);
  }
}

function clearAllNotificationTimeouts() {
  state.notificationTimeouts.forEach(clearTimeout);
  state.notificationTimeouts = [];
}

function scheduleAllNotifications() {
  if (!state.notificationsGranted) return;
  clearAllNotificationTimeouts();

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

  const assignments = Object.values(state.assignments).flat().filter(a => !a.submitted);
  const exams = Object.values(state.exams).flat();

  assignments.forEach(a => {
    const days = getDaysUntil(a.dueDate);
    if (days === 7) {
      [8, 19].forEach(hr => scheduleOrPush(a.id, `⏳ อีก 7 วันส่ง: ${a.title}`, `เช้า/เย็นอย่าลืมวางแผนทำนะ!`, hr));
    } else if (days === 3) {
      [8, 12, 16, 20].forEach(hr => scheduleOrPush(a.id, `⚠️ อีก 3 วันส่ง!! ${a.title}`, `ต้องเริ่มลงมือทำจริงจังแล้วนะ`, hr));
    } else if (days === 1) {
      const msgs = ['เริ่มเช้าวันใหม่กับงาน!', 'โอกาสสุดท้ายของเช้านี้', 'ช่วงบ่ายต้องคืบหน้า', 'เย็นนี้ต้องใกล้เสร็จ', 'ค่ำคืนแห่งการปั่นงาน', '2 ชั่วโมงสุดท้ายก่อนเที่ยงคืน?', 'ยังไม่นอนใช่ไหม? ปั่นต่อ!'];
      [7, 10, 13, 16, 19, 21, 23].forEach((hr, i) => scheduleOrPush(a.id, `🚨 พรุ่งนี้ต้องส่งแล้ว!!: ${a.title}`, msgs[i], hr));
    }
  });

  exams.forEach(e => {
    const days = getDaysUntil(e.date);
    const tips = ["ทบทวน Mind Map", "ทำโจทย์ย้อนหลัง 3 ปี", "สรุปประเด็นสำคัญใน 1 หน้า"];
    if (days === 5) {
      [9, 14, 19].forEach((hr, i) => scheduleOrPush(e.id, `📖 อีก 5 วันสอบ: ${e.title}`, `Study Tip: ${tips[i]}`, hr));
    } else if (days === 1) {
      for (let hr = 8; hr <= 22; hr += 2) {
        scheduleOrPush(e.id, `🔥 พรุ่งนี้สอบ!!: ${e.title}`, `Priority สูงสุด! ทบทวนโค้งสุดท้าย`, hr);
      }
    }
  });
}



function showCheckinBanner(course) {
  let banner = document.getElementById('checkinBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'checkinBanner';
    banner.style.cssText = `
      position:fixed; top:0; left:0; right:0; z-index:9999;
      background:linear-gradient(135deg,#4f46e5,#7c3aed);
      color:white; padding:12px 16px;
      display:flex; align-items:center; justify-content:space-between;
      font-family:Kanit; font-size:14px;
      box-shadow:0 4px 20px rgba(79,70,229,0.4);
      animation: slideDown 0.3s ease;
    `;
    document.getElementById('app').prepend(banner);
  }
  banner.innerHTML = `
    <div>
      <div style="font-weight:600">📍 กำลังเรียน: ${course.nameTh}</div>
      <div style="font-size:12px;opacity:0.85">ห้อง ${course.room || 'ไม่ระบุ'} — เช็คชื่อด้วยนะ!</div>
    </div>
    <button onclick="setAttendanceStatus('${course.id}','เข้าเรียน');hideCheckinBanner()"
      style="background:white;color:#4f46e5;border:none;padding:8px 16px;
             border-radius:20px;font-family:Kanit;font-size:13px;
             font-weight:600;cursor:pointer;white-space:nowrap">
      ✅ เช็คชื่อเลย
    </button>
  `;
}

function hideCheckinBanner() {
  document.getElementById('checkinBanner')?.remove();
}

// ── Smart Alarm System ──
function renderAlarmPage() {
  const alarms = [...state.alarms].sort((a, b) => a.time.localeCompare(b.time));
  const nextAlarm = alarms.find(a => a.enabled);

  return `
    <div class="page-container">
      <div class="page-header">
        <h2>⏰ นาฬิกาปลุก</h2>
        ${nextAlarm ? `<div class="next-alarm-pill">ปลุกครั้งถัดไป ${nextAlarm.time}</div>` : ''}
      </div>

      <div class="quick-add-strip">
        <div class="quick-label">เพิ่มชุดปลุกด่วน:</div>
        <button onclick="quickAddAlarms(5,5)" class="nb-btn sm">5×5นาที</button>
        <button onclick="quickAddAlarms(3,10)" class="nb-btn sm">3×10นาที</button>
        <button onclick="quickAddAlarms(7,5)" class="nb-btn sm">7×5นาที</button>
        <button onclick="openQuickAddModal()" class="nb-btn sm nb-btn-primary">กำหนดเอง</button>
      </div>

      <div class="alarm-list">
        ${alarms.length === 0 ? `
          <div class="empty-state">
            <div style="font-size:48px">⏰</div>
            <div>ยังไม่มีนาฬิกาปลุก</div>
            <div style="font-size:13px;opacity:0.6">กดปุ่มด้านล่างเพื่อเพิ่ม</div>
          </div>
        ` : alarms.map(a => `
          <div class="alarm-card ${a.enabled ? '' : 'disabled'}" id="alarm-${a.id}">
            <div class="alarm-main">
              <div class="alarm-time">${a.time}</div>
              <div class="alarm-meta">
                <div class="alarm-label">${a.label || 'นาฬิกาปลุก'}</div>
                <div class="alarm-repeat">
                  ${a.repeat?.length > 0 ? a.repeat.map(d => ({
    mon: 'จ', tue: 'อ', wed: 'พ', thu: 'พฤ', fri: 'ศ', sat: 'ส', sun: 'อา'
  }[d] || d)).join(' ') : 'วันเดียว'}
                  • snooze ${a.snoozeMin || 5} นาที
                </div>
              </div>
            </div>
            <div class="alarm-actions">
              <label class="toggle-switch">
                <input type="checkbox" ${a.enabled ? 'checked' : ''} 
                  onchange="toggleAlarm('${a.id}', this.checked)">
                <span class="toggle-slider"></span>
              </label>
              <button onclick="deleteAlarm('${a.id}')" class="alarm-delete-btn">🗑</button>
            </div>
          </div>
        `).join('')}
      </div>

      <button onclick="openAddAlarmModal()" class="add-alarm-btn">
        + เพิ่มนาฬิกาปลุก
      </button>

      ${alarms.filter(a => a.enabled).length > 0 ? `
        <button onclick="enterSleepMode()" class="sleep-mode-btn">
          🌙 โหมดนอน — เปิดหน้าจอนาฬิกา
        </button>
        <button onclick="sendAlarmsToShortcuts()" class="shortcuts-btn">
          🍎 ส่งไป iPhone Shortcuts
        </button>
      ` : ''}
    </div>
  `;
}

function openAddAlarmModal(prefillTime = '') {
  const now = new Date();
  const defaultTime = prefillTime ||
    `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  openModal('⏰ เพิ่มนาฬิกาปลุก', `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div>
        <label class="form-label">เวลาปลุก</label>
        <input type="time" id="alarmTime" value="${defaultTime}"
          style="font-size:32px;font-family:JetBrains Mono;width:100%;
                 padding:12px;border-radius:12px;border:1px solid var(--border);
                 background:var(--bg);color:var(--text);text-align:center">
      </div>
      <div>
        <label class="form-label">ป้ายชื่อ (optional)</label>
        <input type="text" id="alarmLabel" class="nb-input"
          placeholder="เช่น ตื่นไปเรียน, ตื่นส่งงาน" value="ตื่นไปเรียน">
      </div>
      <div>
        <label class="form-label">เลื่อนปลุก (Snooze)</label>
        <select id="alarmSnooze" class="nb-input">
          <option value="5">5 นาที</option>
          <option value="10">10 นาที</option>
          <option value="15">15 นาที</option>
        </select>
      </div>
      <div>
        <label class="form-label">ทำซ้ำ</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${[['mon', 'จ'], ['tue', 'อ'], ['wed', 'พ'], ['thu', 'พฤ'],
    ['fri', 'ศ'], ['sat', 'ส'], ['sun', 'อา']].map(([v, l]) => `
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
              <input type="checkbox" value="${v}" class="alarm-repeat-cb"> ${l}
            </label>
          `).join('')}
        </div>
      </div>
    </div>
  `, `
    <button onclick="addAlarmFromModal()" class="nb-btn nb-btn-primary full">
      ⏰ บันทึกนาฬิกาปลุก
    </button>
  `);
}

async function addAlarmFromModal() {
  const time = document.getElementById('alarmTime')?.value;
  const label = document.getElementById('alarmLabel')?.value || 'นาฬิกาปลุก';
  const snoozeMin = parseInt(document.getElementById('alarmSnooze')?.value || '5');
  const repeat = [...document.querySelectorAll('.alarm-repeat-cb:checked')]
    .map(cb => cb.value);

  if (!time) { showToast('⚠️ กรุณาเลือกเวลา', 'warn'); return; }
  await addAlarm(time, label, snoozeMin, repeat);
  closeModal();
}

async function addAlarm(time, label, snoozeMin = 5, repeat = []) {
  const alarm = {
    id: Date.now().toString(),
    time, label,
    enabled: true,
    snoozeMin,
    repeat,
    isSnooze: false
  };
  state.alarms.push(alarm);
  state.alarms.sort((a, b) => a.time.localeCompare(b.time));
  localStorage.setItem('alarms', JSON.stringify(state.alarms));
  try { await fsSet('alarms', 'list', { alarms: state.alarms }); } catch (e) { }
  render();
  showToast(`⏰ ตั้งปลุก ${time} แล้ว`);
  syncDataToBackend();
}

function openQuickAddModal() {
  openModal('⚡ Quick Add ชุดปลุก', `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div>
        <label class="form-label">เวลาเริ่มต้น</label>
        <input type="time" id="qaStartTime" value="07:00"
          style="font-size:28px;font-family:JetBrains Mono;width:100%;
                 padding:12px;border-radius:12px;border:1px solid var(--border);
                 background:var(--bg);color:var(--text);text-align:center">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label class="form-label">จำนวนครั้ง</label>
          <input type="number" id="qaCount" class="nb-input" value="5" min="1" max="20">
        </div>
        <div>
          <label class="form-label">ห่างกัน (นาที)</label>
          <input type="number" id="qaInterval" class="nb-input" value="5" min="1" max="60">
        </div>
      </div>
    </div>
  `, `
    <button onclick="quickAddFromModal()" class="nb-btn nb-btn-primary full">
      ⚡ สร้างชุดปลุก
    </button>
  `);
}

async function quickAddFromModal() {
  const startTime = document.getElementById('qaStartTime')?.value || '07:00';
  const count = parseInt(document.getElementById('qaCount')?.value || '5');
  const interval = parseInt(document.getElementById('qaInterval')?.value || '5');
  await quickAddAlarms(count, interval, startTime);
  closeModal();
}

async function quickAddAlarms(count, intervalMin, startTime = '07:00') {
  const [h, m] = startTime.split(':').map(Number);
  for (let i = 0; i < count; i++) {
    const totalMin = h * 60 + m + i * intervalMin;
    const nh = Math.floor(totalMin / 60) % 24;
    const nm = totalMin % 60;
    const time = `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
    await addAlarm(time, `ปลุกครั้งที่ ${i + 1}`, 5, []);
    await new Promise(r => setTimeout(r, 50));
  }
  showToast(`⏰ สร้าง ${count} นาฬิกาปลุกแล้ว`);
}

function toggleAlarm(id, enabled) {
  const alarm = state.alarms.find(a => a.id === id);
  if (alarm) {
    alarm.enabled = enabled;
    localStorage.setItem('alarms', JSON.stringify(state.alarms));
    fsSet('alarms', 'list', { alarms: state.alarms }).catch(() => { });
    showToast(enabled ? `⏰ เปิดปลุก ${alarm.time}` : `🔕 ปิดปลุก ${alarm.time}`);
    syncDataToBackend();
  }
}

function deleteAlarm(id) {
  state.alarms = state.alarms.filter(a => a.id !== id);
  localStorage.setItem('alarms', JSON.stringify(state.alarms));
  fsSet('alarms', 'list', { alarms: state.alarms }).catch(() => { });
  render();
  showToast('🗑 ลบนาฬิกาปลุกแล้ว');
  syncDataToBackend();
}

async function enterSleepMode() {
  if (!state.alarmAudioCtx) {
    state.alarmAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.alarmAudioCtx.state === 'suspended') {
    await state.alarmAudioCtx.resume();
  }
  let hideTimer;
  // 1. Web Worker Timer: ระบบจับเวลาที่จะไม่หยุดเดินแม้ดับหน้าจอ
  if (!state.timerWorker) {
    const workerCode = `
      let timer;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          timer = setInterval(() => self.postMessage('tick'), 1000);
        } else if (e.data === 'stop') {
          clearInterval(timer);
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    state.timerWorker = new Worker(URL.createObjectURL(blob));
    state.timerWorker.onmessage = () => {
      if (state.sleepMode) {
        updateSleepClock();
        checkAlarms();
      }
    };
  }
  state.timerWorker.postMessage('start');

  // 2. Media Session & Silent Audio: ใช้ไฟล์ MP3 เงียบมาตรฐานจาก URL จริง (เพื่อให้ iOS ยอมรับ)
  if (!state.keepAliveAudio) {
    // ใช้ไฟล์เงียบมาตรฐานความยาว 250ms ที่นิยมใช้ประคองชีพ PWA
    state.keepAliveAudio = new Audio('https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3');
    state.keepAliveAudio.loop = true;
    state.keepAliveAudio.volume = 0.05;
  }

  const startAudio = () => {
    state.keepAliveAudio.play().then(() => {
      console.log("✅ iOS Keep-Alive Audio Playing");
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    }).catch(e => {
      console.log("❌ Audio Play Failed:", e);
      showToast('⚠️ โปรดแตะหน้าจอหนึ่งครั้งเพื่อเปิดระบบเสียง', 'warn');
    });
  };

  startAudio();

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'NITIPAT Alarms Active',
      artist: 'System Protection',
      album: 'Keep-Alive Mode'
    });
    navigator.mediaSession.playbackState = 'playing';
  }

  state.sleepMode = true;
  const screen = document.createElement('div');
  screen.id = 'sleepModeScreen';
  screen.style.cssText = `
    position:fixed; inset:0; z-index:99999;
    background:#000; color:#fff;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    font-family:'JetBrains Mono',monospace;
    cursor:pointer; user-select:none;
  `;
  screen.innerHTML = `
    <div id="sleepClock" style="font-size:72px;font-weight:600;letter-spacing:4px;
      text-shadow:0 0 40px rgba(255,255,255,0.3)">00:00</div>
    <div id="sleepDate" style="font-size:16px;opacity:0.5;margin-top:8px;
      font-family:Kanit"></div>
    <div id="sleepNextAlarm" style="margin-top:32px;font-size:14px;
      opacity:0.4;font-family:Kanit;text-align:center"></div>
    <div id="keepAlivePulse" style="margin-top:16px; width:6px; height:6px; background:#0f0; border-radius:50%; opacity:0.8; animation: pulse 2s infinite"></div>
    <div id="iosAudioHint" style="font-size:10px; color:#444; margin-top:20px; font-family:Kanit">หากปัด Control Center แล้วไม่เห็นชื่อแอป ให้กดที่นี่หนึ่งครั้ง</div>
    <div style="margin-top:12px;">
       <button onclick="state.keepAliveAudio.play()" style="background:none; border:1px solid #333; color:#555; padding:4px 12px; border-radius:12px; font-size:11px; font-family:Kanit">🔔 ทดสอบระบบเสียง</button>
    </div>
    <div id="sleepControls" style="position:fixed;bottom:40px;right:24px;
      opacity:0;transition:opacity 0.3s">
      <button onclick="exitSleepMode()" style="background:rgba(255,255,255,0.1);
        color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.2);
        padding:10px 20px;border-radius:20px;font-family:Kanit;font-size:13px;
        cursor:pointer">ออกจากโหมดนอน</button>
    </div>
  `;

  screen.addEventListener('click', () => {
    // ทุกครั้งที่กดหน้าจอ ให้ช่วย Re-sync เสียงเผื่อ iOS หลุด
    if (state.keepAliveAudio && state.keepAliveAudio.paused) {
      state.keepAliveAudio.play().catch(() => { });
    }
    const ctrl = document.getElementById('sleepControls');
    if (ctrl) {
      ctrl.style.opacity = '1';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { if (ctrl) ctrl.style.opacity = '0'; }, 3000);
    }
  });

  document.body.appendChild(screen);
  updateSleepClock();

  // ในโหมดนอน ถ้ามีนาฬิกาปลุก ให้ส่งไป Shortcuts ทันที (Native Alarms)
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    const enabled = state.alarms.filter(a => a.enabled && !a.isSnooze);
    if (enabled.length > 0) {
      // ส่งไป Shortcuts ทันทีโดยไม่รอถาม เพื่อความรวดเร็วตามความต้องการผู้ใช้
      setTimeout(() => {
        sendAlarmsToShortcuts(true); // true = auto-trigger URL
      }, 800);
    }
  }

  try {
    state.wakeLock = await navigator.wakeLock.request('screen');
  } catch (e) { console.warn('Wake Lock not supported'); }
}

function updateSleepClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');

  const clockEl = document.getElementById('sleepClock');
  if (clockEl) clockEl.textContent = `${h}:${m}:${s}`;

  const dateEl = document.getElementById('sleepDate');
  if (dateEl) {
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
    dateEl.textContent = `${days[now.getDay()]} ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear() + 543}`;
  }

  const nextAlarmEl = document.getElementById('sleepNextAlarm');
  if (nextAlarmEl) {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const enabled = state.alarms.filter(a => a.enabled).sort((a, b) => a.time.localeCompare(b.time));
    const next = enabled.find(a => {
      const [ah, am] = a.time.split(':').map(Number);
      return ah * 60 + am > nowMin;
    }) || enabled[0];

    if (next) {
      const [ah, am] = next.time.split(':').map(Number);
      let diff = ah * 60 + am - nowMin;
      if (diff < 0) diff += 24 * 60;
      const dh = Math.floor(diff / 60), dm = diff % 60;
      nextAlarmEl.textContent = `⏰ ปลุก ${next.time} น. — อีก ${dh > 0 ? dh + 'ชม.' : ''}${dm}นาที`;
    } else {
      nextAlarmEl.textContent = 'ไม่มีนาฬิกาปลุกที่เปิดอยู่';
    }
  }
}

function checkAlarms() {
  if (state.alarmRinging) return;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayMap[now.getDay()];

  state.alarms.forEach(alarm => {
    if (!alarm.enabled || alarm.time !== timeStr) return;
    if (alarm.repeat.length > 0 && !alarm.repeat.includes(today)) return;
    const lastRing = localStorage.getItem('alarm_rang_' + alarm.id);
    if (lastRing === timeStr) return;

    triggerAlarm(alarm);
    localStorage.setItem('alarm_rang_' + alarm.id, timeStr);

    if (alarm.repeat.length === 0 && !alarm.isSnooze) {
      alarm.enabled = false;
      localStorage.setItem('alarms', JSON.stringify(state.alarms));
    }
    if (alarm.isSnooze) {
      state.alarms = state.alarms.filter(a => a.id !== alarm.id);
      localStorage.setItem('alarms', JSON.stringify(state.alarms));
    }
  });
}

function triggerAlarm(alarm) {
  state.alarmRinging = true;
  state.currentAlarmId = alarm.id;

  // หากอยู่ในโหมดนอน ให้ใช้ keepAliveAudio เล่นเสียงปลุกแทนเพื่อความชัวร์บน iOS
  if (state.sleepMode && state.keepAliveAudio) {
    // เปลี่ยนจาก .ogg เป็น .mp3 (iOS รองรับ)
    state.keepAliveAudio.src = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.mp3';
    state.keepAliveAudio.volume = 1.0;
    state.keepAliveAudio.play().catch(() => { });
  }

  async function playAlarmSound() {
    try {
      if (!state.alarmAudioCtx) {
        state.alarmAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = state.alarmAudioCtx;
      if (ctx.state === 'suspended') await ctx.resume();

      function beep(freq, startTime, duration, vol = 0.3) {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc2.type = 'sine';
        osc.frequency.value = freq; osc2.frequency.value = freq * 2;
        osc.connect(gain); osc2.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime); osc2.start(startTime);
        osc.stop(startTime + duration); osc2.stop(startTime + duration);
      }

      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const base = now + i * 1.5;
        const v = Math.min(0.2 + i * 0.1, 0.6);
        beep(880, base, 0.2, v);
        beep(880, base + 0.25, 0.2, v);
      }
    } catch (e) { console.warn('Audio error:', e); }
  }

  playAlarmSound();
  state.alarmSoundInterval = setInterval(playAlarmSound, 6000);

  if ('vibrate' in navigator) {
    navigator.vibrate([500, 150, 500, 150, 500, 150, 1000, 300, 1000]);
    state.alarmVibrateInterval = setInterval(() => {
      navigator.vibrate([500, 150, 500, 150, 1000]);
    }, 3500);
  }
  showAlarmOverlay(alarm);
}

function showAlarmOverlay(alarm) {
  let overlay = document.getElementById('alarmOverlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'alarmOverlay';
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:999999;
    background:linear-gradient(180deg,#0f0f1a 0%,#1a0f2e 100%);
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    font-family:Kanit; color:white;
    animation: alarmFadeIn 0.5s ease;
  `;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  overlay.innerHTML = `
    <div style="text-align:center;padding:0 24px">
      <div style="font-size:16px;opacity:0.5;margin-bottom:8px;font-family:JetBrains Mono">ALARM</div>
      <div style="font-size:80px;font-family:JetBrains Mono;font-weight:600;animation:alarmPulse 1s infinite;text-shadow:0 0 60px rgba(239,68,68,0.8)">${timeStr}</div>
      <div style="font-size:22px;margin-top:16px;font-weight:500">${alarm.label || 'นาฬิกาปลุก'}</div>
      <div style="margin-top:48px;display:flex;flex-direction:column;gap:16px;width:100%;max-width:280px">
        <button onclick="dismissAlarm()" style="padding:20px;font-size:18px;font-weight:700;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:24px;cursor:pointer;font-family:Kanit;box-shadow:0 8px 32px rgba(239,68,68,0.5);animation:alarmPulse 1s infinite">⛔ หยุดปลุก</button>
        <button onclick="snoozeAlarm(${alarm.snoozeMin || 5})" style="padding:16px;font-size:16px;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.2);border-radius:20px;cursor:pointer;font-family:Kanit">💤 เลื่อน ${alarm.snoozeMin || 5} นาที</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function dismissAlarm() {
  state.alarmRinging = false;
  clearInterval(state.alarmSoundInterval);
  clearInterval(state.alarmVibrateInterval);
  try { navigator.vibrate(0); } catch (e) { }
  try { state.alarmAudioCtx?.close(); } catch (e) { }
  state.alarmAudioCtx = null;
  document.getElementById('alarmOverlay')?.remove();
  showToast('✅ หยุดปลุกแล้ว');
}

async function snoozeAlarm(minutes) {
  dismissAlarm();
  const snoozeTime = new Date(Date.now() + minutes * 60000);
  const h = snoozeTime.getHours().toString().padStart(2, '0');
  const m = snoozeTime.getMinutes().toString().padStart(2, '0');
  await addAlarm(`${h}:${m}`, `💤 Snooze (${h}:${m})`, minutes, []);
  const snoozed = state.alarms.find(a => a.time === `${h}:${m}`);
  if (snoozed) { snoozed.isSnooze = true; localStorage.setItem('alarms', JSON.stringify(state.alarms)); }
  showToast(`💤 เลื่อนปลุก ${minutes} นาที (${h}:${m})`);
}

function exitSleepMode() {
  state.sleepMode = false;
  if (state.timerWorker) state.timerWorker.postMessage('stop');
  if (state.keepAliveAudio) { state.keepAliveAudio.pause(); }
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';

  clearInterval(state.sleepClockInterval);
  if (state.keepAliveOsc) {
    try { state.keepAliveOsc.stop(); state.keepAliveOsc.disconnect(); } catch (e) { }
    state.keepAliveOsc = null;
  }
  const v = document.getElementById('iosWakeLockVideo');
  if (v) { v.pause(); v.remove(); }

  try { state.wakeLock?.release(); } catch (e) { }
  state.wakeLock = null;
  document.getElementById('sleepModeScreen')?.remove();
  render();
}

function sendAlarmsToShortcuts(autoTrigger = false) {
  const enabled = state.alarms.filter(a => a.enabled && !a.isSnooze);
  if (enabled.length === 0) {
    if (!autoTrigger) showToast('⚠️ ไม่มีนาฬิกาปลุกที่เปิดอยู่', 'warn');
    return;
  }

  // ส่งข้อมูลเป็น JSON แบบมี Key ครอบเพื่อให้ Shortcut จัดการได้ง่ายขึ้น
  const payload = JSON.stringify({
    alarms: enabled.map((a, idx) => ({
      time: a.time,
      label: `ปลุกครั้งที่ ${idx + 1} (${a.label || 'NITIPAT'})`
    }))
  });

  const url = `shortcuts://run-shortcut?name=NITIPAT_ALARM&input=${encodeURIComponent(payload)}`;

  if (autoTrigger) {
    window.location.href = url;
    return;
  }

  openModal('🍎 ซิงก์นาฬิกาปลุกไป iPhone', `
    <div style="display:flex;flex-direction:column;gap:12px;font-size:14px;font-family:Kanit">
      <div style="background:var(--bg-solid);padding:12px;border-radius:12px;border:1px solid var(--border-color)">
        <div style="font-weight:600;margin-bottom:8px">เตรียมซิงก์ ${enabled.length} รายการ:</div>
        ${enabled.map(a => `<div style="font-size:13px; opacity:0.8">⏰ ${a.time} — ${a.label}</div>`).join('')}
      </div>
      <div style="color:var(--accent);font-size:12px; font-weight:500">
        💡 ระบบจะลบนาฬิกาปลุก (NITIPAT) อันเก่าในเครื่องคุณออกก่อน และสร้างอันใหม่ให้ตามรายการนี้ครับ
      </div>
    </div>
  `, `
    <button onclick="window.location.href='${url}'; closeModal();" class="nb-btn nb-btn-primary full">🚀 เริ่มส่งข้อมูล</button>
  `);
}


// Expose Alarm & Notification functions to window for HTML onclick handlers
window.quickAddAlarms = quickAddAlarms;
window.openQuickAddModal = openQuickAddModal;
window.toggleAlarm = toggleAlarm;
window.deleteAlarm = deleteAlarm;
window.openAddAlarmModal = openAddAlarmModal;
window.enterSleepMode = enterSleepMode;
window.sendAlarmsToShortcuts = sendAlarmsToShortcuts;
window.quickAddFromModal = quickAddFromModal;
window.addAlarmFromModal = addAlarmFromModal;
window.dismissAlarm = dismissAlarm;
window.snoozeAlarm = snoozeAlarm;
window.exitSleepMode = exitSleepMode;
window.hideCheckinBanner = hideCheckinBanner;

window.handleIdCardUpload = (input) => {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (re) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        state.idCardPhoto = compressedBase64;
        localStorage.setItem('id_card_photo', state.idCardPhoto);

        // Optimistically set in Firestore
        fsSet('app_settings', 'profile', {
          idCardPhoto: state.idCardPhoto,
          studentPhoto: STUDENT.photoUrl
        }).then(() => {
          showToast('✅ อัปโหลดและซิงก์รูปบัตรแล้ว');
          render();
        }).catch(err => {
          console.error("Profile sync failed:", err);
          showToast('⚠️ อัปโหลดแล้ว แต่ซิงก์คลาวด์ขัดข้อง', 'err');
          render();
        });
      };
      img.src = re.target.result;
    };
    reader.readAsDataURL(file);
  }
};

window.removeIdCard = () => {
  if (confirm('ลบรูปบัตรใช่หรือไม่?')) {
    state.idCardPhoto = null;
    localStorage.removeItem('id_card_photo');
    fsSet('app_settings', 'profile', {
      idCardPhoto: null,
      studentPhoto: STUDENT.photoUrl
    }).then(() => {
      showToast('✅ ลบรูปบัตรและซิงก์คลาวด์แล้ว');
      render();
    }).catch(err => {
      console.error("Profile sync failed:", err);
      render();
    });
  }
};
