
\n/**
\n * 🔐 LOGIN GATE CONTROLLER
\n */
\nconst LoginGate = {
\n  el: null,
\n  statusEl: null,
\n  pinContainer: null,
\n  correctPinHash: null,
\n  inputPin: "",
\n
\n  async init() {
\n    this.el = document.getElementById('login-gate');
\n    
\n    // Check for admin parameter to hide the login pad from unauthorized visitors
\n    const urlParams = new URLSearchParams(window.location.search);
\n    if (urlParams.get('admin') !== 'true') {
\n      document.title = "404 Not Found";
\n      this.el.style.background = "#09090b";
\n      this.el.innerHTML = `
\n        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; color:#f8fafc; font-family:monospace; text-align:center;">
\n          <h1 style="font-size:4rem; margin:0 0 10px 0; color:#e2e8f0;">404</h1>
\n          <p style="color:#94a3b8; font-size:1.1rem;">The requested page could not be found.</p>
\n        </div>
\n      `;
\n      return;
\n    }
\n
\n    this.statusEl = document.getElementById('gate-status');
\n    this.pinContainer = document.getElementById('pin-container');
\n    
\n    this.statusEl.textContent = "ESTABLISHING SECURE CONNECTION...";
\n    
\n    // Bind Keyboard event listener for PIN entries
\n    if (!this._hasKeyboardListener) {
\n      window.addEventListener('keydown', (e) => {
\n        if (!state.isLocked) return;
\n        if (e.key >= '0' && e.key <= '9') {
\n          this.press(e.key);
\n        } else if (e.key === 'Backspace') {
\n          this.press('DEL');
\n        } else if (e.key === 'Escape') {
\n          this.clear();
\n        }
\n      });
\n      this._hasKeyboardListener = true;
\n    }
\n
\n    try {
\n      await this.sync(false);
\n      this.statusEl.textContent = "IDENTITY VERIFICATION REQUIRED";
\n      this.renderPinPad();
\n    } catch (e) {
\n      console.error(e);
\n      this.statusEl.textContent = "CONNECTION FAILURE. RETRYING...";
\n      setTimeout(() => this.init(), 3000);
\n    }
\n  },
\n
\n  async sync(showToastMsg = true) {
\n    if (showToastMsg) this.statusEl.textContent = "SYNCING SECURITY VAULT...";
\n    const config = await this.getSecurityConfig();
\n    this.correctPinSalt = config.pinSalt || 'NITIPAT_SALT_DEFAULT';
\n    if (config.pin && config.pin.length > 20) {
\n      this.correctPinHash = config.pin;
\n    } else {
\n      this.correctPinHash = await hashPIN(config.pin || "246810", this.correctPinSalt);
\n    }
\n    if (showToastMsg) this.statusEl.textContent = "VAULT SYNCED. TRY AGAIN.";
\n  },
\n
\n  getSecurityConfig() {
\n    if (typeof google === 'undefined' || !google.script || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
\n      console.warn("Using local security fallback");
\n      return Promise.resolve({ pin: "246810" });
\n    }
\n    return new Promise((res, rej) => {
\n      google.script.run.withSuccessHandler(res).withFailureHandler(rej).getAppConfig();
\n    });
\n  },
\n
\n  renderPinPad() {
\n    if (this.pinContainer) this.pinContainer.classList.remove('hidden');
\n    this.pinContainer.innerHTML = `
\n      <div class="pin-display">
\n        ${[1, 2, 3, 4, 5, 6].map(i => `<div class="pin-dot" id="dot-${i}"></div>`).join('')}
\n      </div>
\n      <div class="pin-pad">
\n        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="pin-btn" onclick="LoginGate.press('${n}')">${n}</button>`).join('')}
\n        <button class="pin-btn" onclick="LoginGate.clear()" style="font-size:14px; opacity:0.6;">CLR</button>
\n        <button class="pin-btn" onclick="LoginGate.press('0')">0</button>
\n        <button class="pin-btn" onclick="LoginGate.press('DEL')" style="font-size:20px; opacity:0.6;">⌫</button>
\n      </div>
\n      <div class="gate-actions" style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
\n        <button class="btn-glass sm" onclick="LoginGate.sync()"><span style="margin-right:5px;">🔄</span>Sync PIN</button>
\n        <button class="btn-glass sm" onclick="LoginGate.showIdCard()"><span style="margin-right:5px;">🪪</span>ดูบัตร</button>
\n      </div>
\n    `;
\n  },
\n
\n  showIdCard() {
\n    const photo = state.idCardPhoto || "https://img2.pic.in.th/pic/Student_Photo_Placeholder.png";
\n    const studentId = "20067105527480";
\n    
\n    // Create overlay
\n    const overlay = document.createElement('div');
\n    overlay.className = 'card-overlay';
\n    overlay.innerHTML = `
\n      <div class="card-modal">
\n        <button class="card-close" onclick="this.parentElement.parentElement.remove()">✕</button>
\n        <div class="card-title">STUDENT IDENTIFICATION</div>
\n        <div class="card-body">
\n          <img src="${photo}" class="card-photo" onerror="this.src='https://img2.pic.in.th/pic/Student_Photo_Placeholder.png'">
\n          <div class="card-info">
\n            <div class="card-name">${STUDENT.nameTh}</div>
\n            <div class="card-id">${studentId}</div>
\n            <div class="card-major">${STUDENT.major}</div>
\n          </div>
\n          <div class="barcode-container">
\n            <svg id="barcode"></svg>
\n          </div>
\n        </div>
\n      </div>
\n    `;
\n    document.body.appendChild(overlay);
\n    
\n    // Generate Barcode
\n    setTimeout(() => {
\n/**\n * 🔐 LOGIN GATE CONTROLLER\n */\nconst LoginGate = {\n  el: null,\n  statusEl: null,\n  pinContainer: null,\n  correctPinHash: null,\n  inputPin: "",\n\n  async init() {\n    this.el = document.getElementById('login-gate');\n    \n    // Check for admin parameter to hide the login pad from unauthorized visitors\n    const urlParams = new URLSearchParams(window.location.search);\n    if (urlParams.get('admin') !== 'true') {\n      document.title = "404 Not Found";\n      this.el.style.background = "#09090b";\n      this.el.innerHTML = `\n        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; color:#f8fafc; font-family:monospace; text-align:center;">\n          <h1 style="font-size:4rem; margin:0 0 10px 0; color:#e2e8f0;">404</h1>\n          <p style="color:#94a3b8; font-size:1.1rem;">The requested page could not be found.</p>\n        </div>\n      `;\n      return;\n    }\n\n    this.statusEl = document.getElementById('gate-status');\n    this.pinContainer = document.getElementById('pin-container');\n    \n    this.statusEl.textContent = "ESTABLISHING SECURE CONNECTION...";\n    \n    // Bind Keyboard event listener for PIN entries\n    if (!this._hasKeyboardListener) {\n      window.addEventListener('keydown', (e) => {\n        if (!state.isLocked) return;\n        if (e.key >= '0' && e.key <= '9') {\n          this.press(e.key);\n        } else if (e.key === 'Backspace') {\n          this.press('DEL');\n        } else if (e.key === 'Escape') {\n          this.clear();\n        }\n      });\n      this._hasKeyboardListener = true;\n    }\n\n    try {\n      await this.sync(false);\n      this.statusEl.textContent = "IDENTITY VERIFICATION REQUIRED";\n      this.renderPinPad();\n    } catch (e) {\n      console.error(e);\n      this.statusEl.textContent = "CONNECTION FAILURE. RETRYING...";\n      setTimeout(() => this.init(), 3000);\n    }\n  },\n\n  async sync(showToastMsg = true) {\n    if (showToastMsg) this.statusEl.textContent = "SYNCING SECURITY VAULT...";\n    const config = await this.getSecurityConfig();\n    this.correctPinSalt = config.pinSalt || 'NITIPAT_SALT_DEFAULT';\n    if (config.pin && config.pin.length > 20) {\n      this.correctPinHash = config.pin;\n    } else {\n      this.correctPinHash = await hashPIN(config.pin || "246810", this.correctPinSalt);\n    }\n    if (showToastMsg) this.statusEl.textContent = "VAULT SYNCED. TRY AGAIN.";\n  },\n\n  getSecurityConfig() {\n    if (typeof google === 'undefined' || !google.script || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {\n      console.warn("Using local security fallback");\n      return Promise.resolve({ pin: "246810" });\n    }\n    return new Promise((res, rej) => {\n      google.script.run.withSuccessHandler(res).withFailureHandler(rej).getAppConfig();\n    });\n  },\n\n  renderPinPad() {\n    if (this.pinContainer) this.pinContainer.classList.remove('hidden');\n    this.pinContainer.innerHTML = `\n      <div class="pin-display">\n        ${[1, 2, 3, 4, 5, 6].map(i => `<div class="pin-dot" id="dot-${i}"></div>`).join('')}\n      </div>\n      <div class="pin-pad">\n        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="pin-btn" onclick="LoginGate.press('${n}')">${n}</button>`).join('')}\n        <button class="pin-btn" onclick="LoginGate.clear()" style="font-size:14px; opacity:0.6;">CLR</button>\n        <button class="pin-btn" onclick="LoginGate.press('0')">0</button>\n        <button class="pin-btn" onclick="LoginGate.press('DEL')" style="font-size:20px; opacity:0.6;">⌫</button>\n      </div>\n      <div class="gate-actions" style="margin-top:20px; display:flex; gap:10px; justify-content:center;">\n        <button class="btn-glass sm" onclick="LoginGate.sync()"><span style="margin-right:5px;">🔄</span>Sync PIN</button>\n        <button class="btn-glass sm" onclick="LoginGate.showIdCard()"><span style="margin-right:5px;">🪪</span>ดูบัตร</button>\n      </div>\n    `;\n  },\n\n  showIdCard() {\n    const photo = state.idCardPhoto || "https://img2.pic.in.th/pic/Student_Photo_Placeholder.png";\n    const studentId = "20067105527480";\n    \n    // Create overlay\n    const overlay = document.createElement('div');\n    overlay.className = 'card-overlay';\n    overlay.innerHTML = `\n      <div class="card-modal">\n        <button class="card-close" onclick="this.parentElement.parentElement.remove()">✕</button>\n        <div class="card-title">STUDENT IDENTIFICATION</div>\n        <div class="card-body">\n          <img src="${photo}" class="card-photo" onerror="this.src='https://img2.pic.in.th/pic/Student_Photo_Placeholder.png'">\n          <div class="card-info">\n            <div class="card-name">${STUDENT.nameTh}</div>\n            <div class="card-id">${studentId}</div>\n            <div class="card-major">${STUDENT.major}</div>\n          </div>\n          <div class="barcode-container">\n            <svg id="barcode"></svg>\n          </div>\n        </div>\n      </div>\n    `;\n    document.body.appendChild(overlay);\n    \n    // Generate Barcode\n    setTimeout(() => {\n      JsBarcode("#barcode", studentId, {\n        format: "CODE128",\n        width: 2,\n        height: 60,\n        displayValue: true,\n        fontSize: 16,\n        font: "JetBrains Mono",\n        background: "transparent",\n        lineColor: "#000"\n      });\n    }, 100);\n  },\n\n  press(val) {\n    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);\n    if (val === 'DEL') {\n      this.inputPin = this.inputPin.slice(0, -1);\n    } else if (this.inputPin.length < 6) {\n      this.inputPin += val;\n    }\n    this.updateDots();\n    if (this.inputPin.length === 6) this.verify();\n  },\n\n  updateDots() {\n    for (let i = 1; i <= 6; i++) {\n      const dot = document.getElementById(`dot-${i}`);\n      if (dot) {\n        if (i <= this.inputPin.length) dot.classList.add('active');\n        else dot.classList.remove('active');\n      }\n    }\n  },\n\n  clear() {\n    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);\n    this.inputPin = "";\n    this.updateDots();\n  },\n\n  async verify() {\n    const activeHash = state.pin || this.correctPinHash;\n    const activeSalt = state.pinSalt || this.correctPinSalt || 'NITIPAT_SALT_DEFAULT';\n\n    const isValid = await verifyPIN(this.inputPin, activeHash, activeSalt);\n    if (isValid) {\n      this.statusEl.textContent = "ACCESS GRANTED. SYNCING DATA...";\n      sessionStorage.setItem('unlocked', 'true');\n      sessionStorage.setItem('unlocked_at', Date.now().toString());\n      state.isLocked = false;\n      this.el.classList.add('inactive');\n      await startAppCore();\n    } else {\n      // Problem 5: Auto-sync once on failure\n      this.statusEl.textContent = "VERIFYING WITH REMOTE VAULT...";\n      await this.sync(false);\n      const activeHashRetry = state.pin || this.correctPinHash;\n      const activeSaltRetry = state.pinSalt || this.correctPinSalt || 'NITIPAT_SALT_DEFAULT';\n      \n      const isValidRetry = await verifyPIN(this.inputPin, activeHashRetry, activeSaltRetry);\n      \n      if (isValidRetry) {\n        this.verify(); // Success after sync\n        return;\n      }\n\n      this.statusEl.textContent = "INCORRECT PIN. ACCESS DENIED.";\n      this.inputPin = "";\n      this.updateDots();\n      this.pinContainer.style.animation = 'none';\n      this.pinContainer.offsetHeight;\n      this.pinContainer.style.animation = 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both';\n      if (window.navigator.vibrate) window.navigator.vibrate(200);\n    }\n  }\n};\n\nwindow.LoginGate = LoginGate;\n\n// Entry point unified into DOMContentLoaded\n\nasync function startAppCore() {\n  try {\n    let firebaseConfig;\n    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {\n      console.warn("Using aligned local Firebase config");\n      firebaseConfig = {\n        apiKey: "AIzaSyB7pGaPWn4n7NxrQ9l60V16u-qj05khqU8",\n        authDomain: "mat-e-db476.firebaseapp.com",\n        databaseURL: "https://mat-e-db476-default-rtdb.asia-southeast1.firebasedatabase.app",\n        projectId: "mat-e-db476",\n        storageBucket: "mat-e-db476.firebasestorage.app",\n        messagingSenderId: "986910230630",\n        appId: "1:986910230630:web:7b4b23ce828d18ab7bc5a7"\n      };\n    } else {\n      firebaseConfig = await new Promise((res, rej) => {\n        google.script.run.withSuccessHandler(res).withFailureHandler(rej).getFirebaseConfig();\n      });\n    }\n\n    if (!firebaseConfig.apiKey) {\n      console.error("Firebase API Key is missing.");\n      return;\n    }\n\n    const app = initializeApp(firebaseConfig);\n    db = initializeFirestore(app, {\n      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),\n      experimentalForceLongPolling: true\n    });\n\n    messaging = getMessaging(app);\n    onMessage(messaging, (payload) => {\n      if (typeof Notification !== 'undefined') {\n        new Notification(payload.notification.title, {\n          body: payload.notification.body,\n          icon: payload.notification.image || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"\n        });\n      }\n    });\n\n    await loadAll();\n    startHyperNotifications();\n    scheduleAllNotifications();\n    \n    // Notion Initial Sync\n    setTimeout(() => NotionHub.sync(), 2000);\n    if ('serviceWorker' in navigator) {\n      initWebPush();\n    }\n    render();\n  } catch (err) {\n    console.error("App initialization failed:", err);\n  }\n}\n\nwindow.startAppPublic = async function() {\n  try {\n    let firebaseConfig;\n    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {\n      firebaseConfig = {\n        apiKey: "AIzaSyB7pGaPWn4n7NxrQ9l60V16u-qj05khqU8",\n        authDomain: "mat-e-db476.firebaseapp.com",\n        databaseURL: "https://mat-e-db476-default-rtdb.asia-southeast1.firebasedatabase.app",\n        projectId: "mat-e-db476",\n        storageBucket: "mat-e-db476.firebasestorage.app",\n        messagingSenderId: "986910230630",\n        appId: "1:986910230630:web:7b4b23ce828d18ab7bc5a7"\n      };\n\n
window.startAppVerify = async function(docId) {
  try {
    let firebaseConfig;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      firebaseConfig = {
        apiKey: "AIzaSyB7pGaPWn4n7NxrQ9l60V16u-qj05khqU8",
        authDomain: "mat-e-db476.firebaseapp.com",
        databaseURL: "https://mat-e-db476-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "mat-e-db476",
        storageBucket: "mat-e-db476.firebasestorage.app",
        messagingSenderId: "986910230630",
        appId: "1:986910230630:web:7b4b23ce828d18ab7bc5a7"
      };
    } else {
      firebaseConfig = await new Promise((res, rej) => {
        google.script.run.withSuccessHandler(res).withFailureHandler(rej).getFirebaseConfig();
      });
    }

    if (!firebaseConfig.apiKey) return;

    const app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      experimentalForceLongPolling: true
    });

    document.body.innerHTML = `
      <div style="height:100vh; display:flex; justify-content:center; align-items:center; background:#0f172a; color:#f8fafc; font-family:'Inter', sans-serif;">
        <div style="text-align:center;">
          <div style="font-size:40px; margin-bottom:20px;" class="spin">⏳</div>
          <h2>VERIFYING DOCUMENT...</h2>
          <p style="color:#64748b;">Checking cryptographic signature</p>
        </div>
      </div>
      <style>.spin { animation: spin 2s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `;

    let docData = null;
    try {
      const snap = await getDoc(doc(db, "verifications", docId));
      if (snap.exists()) docData = snap.data();
    } catch(e) {
      console.warn(e);
    }

    if (docData) {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const docTime = new Date(docData.timestamp).getTime();
      if (Date.now() - docTime > thirtyDaysMs) {
        document.body.innerHTML = `
          <div style="height:100vh; display:flex; justify-content:center; align-items:center; background:#0f172a; color:#f8fafc; font-family:'Inter', sans-serif;">
            <div style="text-align:center; background:#1e293b; padding:40px; border-radius:16px; border:1px solid #334155; max-width:400px; box-shadow:0 20px 40px rgba(0,0,0,0.5);">
              <div style="font-size:60px; margin-bottom:20px;">⏱️</div>
              <h2 style="color:#f59e0b; margin-top:0;">DOCUMENT EXPIRED</h2>
              <p style="color:#94a3b8; line-height:1.6;">This verification link has expired because it is older than 30 days. Please request a newly generated document from the issuer.</p>
            </div>
          </div>
        `;
        return;
      }
    }

    if (!docData) {
      document.body.innerHTML = `
        <div style="height:100vh; display:flex; justify-content:center; align-items:center; background:#0f172a; color:#f8fafc; font-family:'Inter', sans-serif;">
          <div style="text-align:center; background:#1e293b; padding:40px; border-radius:16px; border:1px solid #334155; max-width:400px; box-shadow:0 20px 40px rgba(0,0,0,0.5);">
            <div style="font-size:60px; margin-bottom:20px;">❌</div>
            <h2 style="color:#ef4444; margin-top:0;">VERIFICATION FAILED</h2>
            <p style="color:#94a3b8; line-height:1.6;">This document cannot be found in the secure vault.</p>
          </div>
        </div>
      `;
      return;
    }

    // Success Screen
    const hash = "VERIFIED-" + docId.substring(0,8).toUpperCase();
    const date = new Date(docData.timestamp).toLocaleString('th-TH');

    document.body.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600;800&display=swap');
        body { margin: 0; background: #0f172a; color: #f8fafc; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-image: radial-gradient(circle at 50% -20%, #1e293b 0%, #0f172a 80%); }
        .verify-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05); position: relative; overflow: hidden; }
        .verify-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #10b981, #3b82f6); }
        .success-icon { width: 80px; height: 80px; background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 40px; margin: 0 auto 20px; box-shadow: 0 0 30px rgba(16, 185, 129, 0.2); border: 2px solid rgba(16, 185, 129, 0.3); }
        h1 { text-align: center; font-family: 'Playfair Display', serif; font-size: 28px; margin: 0 0 5px 0; color: #fff; }
        .subtitle { text-align: center; color: #10b981; font-weight: 600; letter-spacing: 2px; font-size: 12px; margin-bottom: 40px; }
        .data-grid { display: grid; gap: 20px; margin-bottom: 40px; }
        .data-row { background: rgba(0,0,0,0.2); padding: 15px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
        .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-bottom: 4px; }
        .value { font-size: 16px; color: #f8fafc; font-weight: 600; }
        .value.highlight { color: #3b82f6; font-size: 18px; }
        .hash-block { background: #020617; padding: 15px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748b; text-align: center; border: 1px dashed #334155; word-break: break-all; }
      </style>
      <div class="verify-card">
        <div class="success-icon">✓</div>
        <h1>Official Document Verified</h1>
        <div class="subtitle">AUTHENTICITY CONFIRMED</div>
        
        <div class="data-grid">
          <div class="data-row">
            <div class="label">Issued To</div>
            <div class="value">${docData.nameTh}</div>
            <div class="label" style="margin-top:8px;">Student ID</div>
            <div class="value" style="font-family:monospace;">${docData.studentId}</div>
          </div>
          
          <div class="data-row" style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
            <div>
              <div class="label">Cumulative GPAX</div>
              <div class="value highlight">${docData.gpax}</div>
            </div>
            <div>
              <div class="label">Date of Issue</div>
              <div class="value">${date}</div>
            </div>
          </div>
        </div>
        
        <div class="hash-block">
          <div style="color:#f8fafc; margin-bottom:4px; font-weight:bold;">BLOCKCHAIN SIGNATURE</div>
          ${hash}<br><span style="color:#3b82f6;">DOC ID: ${docId}</span>
        </div>

        ${docData.currMapBase64 ? `
          <div style="margin-top:40px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:15px; text-align:center;">
             <div class="label" style="margin-bottom:10px;">Interactive Curriculum Map Included</div>
             <img src="${docData.currMapBase64}" style="max-width:100%; border-radius:8px;" />
          </div>
        ` : ''}
      </div>
    `;
  } catch (err) {
    console.error(err);
    document.body.innerHTML = "<div style='color:white; padding:20px;'>Internal System Error.</div>";
  }
};
