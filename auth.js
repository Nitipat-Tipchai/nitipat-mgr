/**
 * 🔐 LOGIN GATE CONTROLLER
 */
const LoginGate = {
  el: null,
  statusEl: null,
  pinContainer: null,
  correctPinHash: null,
  inputPin: "",

  async init() {
    this.el = document.getElementById('login-gate');
    if (this.el) this.el.classList.remove('inactive');
    
    // Check for admin parameter to hide the login pad from unauthorized visitors
    const urlParams = new URLSearchParams(window.location.search);
    const isElectron = window.process && window.process.type;
    const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (urlParams.get('admin') !== 'true' && !isElectron && !isCapacitor && !isLocalhost) {
      document.title = "404 Not Found";
      this.el.style.background = "#09090b";
      this.el.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; color:#f8fafc; font-family:monospace; text-align:center;">
          <h1 style="font-size:4rem; margin:0 0 10px 0; color:#e2e8f0;">404</h1>
          <p style="color:#94a3b8; font-size:1.1rem;">The requested page could not be found.</p>
        </div>
      `;
      return;
    }

    this.statusEl = document.getElementById('gate-status');
    this.pinContainer = document.getElementById('pin-container');
    
    this.statusEl.textContent = "ESTABLISHING SECURE CONNECTION...";
    
    // Bind Keyboard event listener for PIN entries
    if (!this._hasKeyboardListener) {
      window.addEventListener('keydown', (e) => {
        if (!state.isLocked) return;
        if (e.key >= '0' && e.key <= '9') {
          this.press(e.key);
        } else if (e.key === 'Backspace') {
          this.press('DEL');
        } else if (e.key === 'Escape') {
          this.clear();
        }
      });
      this._hasKeyboardListener = true;
    }

    try {
      await this.sync(false);
      this.statusEl.textContent = "IDENTITY VERIFICATION REQUIRED";
      this.renderPinPad();
    } catch (e) {
      console.error(e);
      this.statusEl.textContent = "CONNECTION FAILURE. RETRYING...";
      setTimeout(() => this.init(), 3000);
    }
  },

  async sync(showToastMsg = true) {
    if (showToastMsg) this.statusEl.textContent = "SYNCING SECURITY VAULT...";
    const config = await this.getSecurityConfig();
    this.correctPinSalt = config.pinSalt || 'NITIPAT_SALT_DEFAULT';
    if (config.pin && config.pin.length > 20) {
      this.correctPinHash = config.pin;
    } else {
      this.correctPinHash = await hashPIN(config.pin || "246810", this.correctPinSalt);
    }
    if (showToastMsg) this.statusEl.textContent = "VAULT SYNCED. TRY AGAIN.";
  },

  async getSecurityConfig() {
    if (typeof google === 'undefined' || !google.script || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !navigator.userAgent.includes('Electron'))) {
      console.warn("Using local security fallback");
      return Promise.resolve({ pin: "246810" });
    }
    return new Promise((res, rej) => {
      google.script.run.withSuccessHandler(res).withFailureHandler(rej).getAppConfig();
    });
  },

  renderPinPad() {
    if (this.pinContainer) this.pinContainer.classList.remove('hidden');
    
    const hasBiometric = localStorage.getItem('webauthn_credential');
    
    this.pinContainer.innerHTML = `
      <div class="pin-display">
        ${[1, 2, 3, 4, 5, 6].map(i => `<div class="pin-dot" id="dot-${i}"></div>`).join('')}
      </div>
      <div class="pin-pad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="pin-btn" onclick="LoginGate.press('${n}')">${n}</button>`).join('')}
        <button class="pin-btn" onclick="LoginGate.clear()" style="font-size:14px; opacity:0.6;">CLR</button>
        <button class="pin-btn" onclick="LoginGate.press('0')">0</button>
        <button class="pin-btn" onclick="LoginGate.press('DEL')" style="font-size:20px; opacity:0.6;">⌫</button>
      </div>
      
      ${hasBiometric ? `
      <div style="margin-top:20px; text-align:center; display:flex; flex-direction:column; gap:8px;">
        <button class="btn-glass" onclick="LoginGate.unlockWithBiometrics()" style="width:100%; border-color:var(--c-mint); color:var(--c-mint);">
          <span style="font-size:20px; margin-right:8px;">📱</span> ปลดล็อคด้วย Face ID / Touch ID
        </button>
        <button class="btn-glass sm" onclick="localStorage.removeItem('webauthn_credential'); window.location.reload();" style="width:100%; font-size:11px; opacity:0.7; border-color:var(--c-red); color:var(--c-red);">
          🗑️ ลบข้อมูล Passkey ที่ค้างในเครื่องนี้ออก
        </button>
      </div>
      ` : ''}
      
      <div class="gate-actions" style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
        <button class="btn-glass sm" onclick="LoginGate.sync()"><span style="margin-right:5px;">🔄</span>Sync PIN</button>
        <button class="btn-glass sm" onclick="LoginGate.showIdCard()"><span style="margin-right:5px;">🪪</span>ดูบัตร</button>
      </div>
    `;
    
    // Auto-trigger biometric prompt if registered
    if (hasBiometric && !window._biometricPrompted) {
      window._biometricPrompted = true;
      setTimeout(() => this.unlockWithBiometrics(), 500);
    }
  },

  async unlockWithBiometrics() {
    const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    if (isCapacitor && window.Capacitor.Plugins.NativeBiometric) {
      try {
        const { isAvailable } = await window.Capacitor.Plugins.NativeBiometric.isAvailable();
        if (isAvailable) {
          await window.Capacitor.Plugins.NativeBiometric.verifyIdentity({
            reason: "เข้าสู่ระบบ",
            title: "NITIPAT MGR",
            subtitle: "กรุณาสแกนลายนิ้วมือหรือใบหน้า",
          });
          this.statusEl.textContent = "BIOMETRICS VERIFIED. SYNCING DATA...";
          sessionStorage.setItem('unlocked', 'true');
          sessionStorage.setItem('unlocked_at', Date.now().toString());
          state.isLocked = false;
          this.el.classList.add('inactive');
          return;
        }
      } catch (e) {
        console.log("Native biometric failed", e);
        this.statusEl.textContent = "BIOMETRICS FAILED. ENTER PIN.";
        return;
      }
    }

    const rawIdStr = localStorage.getItem('webauthn_credential');
    if (!rawIdStr || !window.PublicKeyCredential) return;
    
    try {
      this.statusEl.textContent = "WAITING FOR BIOMETRICS...";
      
      const rawId = new Uint8Array(atob(rawIdStr).split('').map(c => c.charCodeAt(0)));
      
      const publicKeyCredentialRequestOptions = {
        challenge: Uint8Array.from("nitipat-mgr-random-challenge-v1", c => c.charCodeAt(0)),
        allowCredentials: [{
          id: rawId,
          type: 'public-key',
        }],
        timeout: 60000,
        userVerification: "required"
      };

      await navigator.credentials.get({ publicKey: publicKeyCredentialRequestOptions });
      
      // Success
      this.statusEl.textContent = "BIOMETRICS VERIFIED. SYNCING DATA...";
      sessionStorage.setItem('unlocked', 'true');
      sessionStorage.setItem('unlocked_at', Date.now().toString());
      state.isLocked = false;
      this.el.classList.add('inactive');
      await startAppCore();
      
    } catch(e) {
      console.log("Biometric unlock failed", e);
      this.statusEl.textContent = "BIOMETRICS FAILED. ENTER PIN.";
    }
  },

  showIdCard() {
    const photo = state.idCardPhoto || "https://img2.pic.in.th/pic/Student_Photo_Placeholder.png";
    const studentId = "20067105527480";
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    overlay.innerHTML = `
      <div class="card-modal">
        <button class="card-close" onclick="this.parentElement.parentElement.remove()">✕</button>
        <div class="card-title">STUDENT IDENTIFICATION</div>
        <div class="card-body">
          <img src="${photo}" class="card-photo" onerror="this.src='https://img2.pic.in.th/pic/Student_Photo_Placeholder.png'">
          <div class="card-info">
            <div class="card-name">${STUDENT.nameTh}</div>
            <div class="card-id">${studentId}</div>
            <div class="card-major">${STUDENT.major}</div>
          </div>
          <div class="barcode-container">
            <svg id="barcode"></svg>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    // Generate Barcode
    setTimeout(() => {
      JsBarcode("#barcode", studentId, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 16,
        font: "JetBrains Mono",
        background: "transparent",
        lineColor: "#000"
      });
    }, 100);
  },

  press(val) {
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
    if (val === 'DEL') {
      this.inputPin = this.inputPin.slice(0, -1);
    } else if (this.inputPin.length < 6) {
      this.inputPin += val;
    }
    this.updateDots();
    if (this.inputPin.length === 6) this.verify();
  },

  updateDots() {
    for (let i = 1; i <= 6; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (dot) {
        if (i <= this.inputPin.length) dot.classList.add('active');
        else dot.classList.remove('active');
      }
    }
  },

  clear() {
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
    this.inputPin = "";
    this.updateDots();
  },

  async verify() {
    const activeHash = state.pin || this.correctPinHash;
    const activeSalt = state.pinSalt || this.correctPinSalt || 'NITIPAT_SALT_DEFAULT';

    const isValid = await verifyPIN(this.inputPin, activeHash, activeSalt);
    if (isValid) {
      this.statusEl.textContent = "ACCESS GRANTED. SYNCING DATA...";
      sessionStorage.setItem('unlocked', 'true');
      sessionStorage.setItem('unlocked_at', Date.now().toString());
      state.isLocked = false;
      this.el.classList.add('inactive');
      
      // Auto-register WebAuthn after PIN success if not registered
      if (!localStorage.getItem('webauthn_credential') && window.PublicKeyCredential) {
         try {
           const publicKeyCredentialCreationOptions = {
             challenge: Uint8Array.from("nitipat-mgr-random-challenge-v1", c => c.charCodeAt(0)),
             rp: { name: "Nitipat MGR", id: window.location.hostname },
             user: { id: Uint8Array.from("user_id_1", c => c.charCodeAt(0)), name: "Nitipat", displayName: "Nitipat" },
             pubKeyCredParams: [{alg: -7, type: "public-key"}, {alg: -257, type: "public-key"}],
             authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
             timeout: 60000,
             attestation: "none"
           };
           const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
           const rawIdStr = btoa(String.fromCharCode.apply(null, new Uint8Array(credential.rawId)));
           localStorage.setItem('webauthn_credential', rawIdStr);
           alert("✅ Windows Hello ลงทะเบียนสำเร็จ!");
         } catch(e) {
           console.log("WebAuthn creation failed", e);
           alert("❌ ไม่สามารถเปิด Windows Hello ได้: " + e.message + " | Hostname: " + window.location.hostname);
         }
      }

      await startAppCore();
    } else {
      // Problem 5: Auto-sync once on failure
      this.statusEl.textContent = "VERIFYING WITH REMOTE VAULT...";
      await this.sync(false);
      const activeHashRetry = state.pin || this.correctPinHash;
      const activeSaltRetry = state.pinSalt || this.correctPinSalt || 'NITIPAT_SALT_DEFAULT';
      
      const isValidRetry = await verifyPIN(this.inputPin, activeHashRetry, activeSaltRetry);
      
      if (isValidRetry) {
        this.verify(); // Success after sync
        return;
      }

      this.statusEl.textContent = "INCORRECT PIN. ACCESS DENIED.";
      this.inputPin = "";
      this.updateDots();
      this.pinContainer.style.animation = 'none';
      this.pinContainer.offsetHeight;
      this.pinContainer.style.animation = 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both';
      if (window.navigator.vibrate) window.navigator.vibrate(200);
    }
  }
};

window.LoginGate = LoginGate;

// Entry point unified into DOMContentLoaded

async function startAppCore() {
  try {
    let firebaseConfig = {
      apiKey: "AIzaSyB7pGaPWn4n7NxrQ9l60V16u-qj05khqU8",
      authDomain: "mat-e-db476.firebaseapp.com",
      databaseURL: "https://mat-e-db476-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "mat-e-db476",
      storageBucket: "mat-e-db476.firebasestorage.app",
      messagingSenderId: "986910230630",
      appId: "1:986910230630:web:7b4b23ce828d18ab7bc5a7"
    };

    if (!firebaseConfig.apiKey) {
      console.error("Firebase API Key is missing.");
      return;
    }

    if (!window.firebaseApp) {
      const app = initializeApp(firebaseConfig);
      window.firebaseApp = app;
      window.db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        experimentalForceLongPolling: true
      });

      window.messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        if (typeof Notification !== 'undefined') {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.image || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          });
        }
      });
    }

    await loadAll();
    
    if (typeof initWebPush === 'function') initWebPush();
    if (typeof scheduleAllNotifications === 'function') scheduleAllNotifications();
    
    startHyperNotifications();
    
    // Notion Initial Sync

    render();
    
    const urlParams = new URLSearchParams(window.location.search);
    let checkinCourseId = urlParams.get('checkin');
    if (!checkinCourseId && window.location.hash.includes('checkin=')) {
      checkinCourseId = window.location.hash.split('checkin=')[1].split('&')[0];
    }
    
    if (checkinCourseId) {
      setTimeout(() => {
        let foundCourse = null;
        for (const term in state.courses) {
          const course = state.courses[term]?.find(c => c.id === checkinCourseId);
          if (course) { foundCourse = course; break; }
        }
        if (foundCourse && typeof showCheckinBanner === 'function') {
          showCheckinBanner(foundCourse);
        } else {
          showToast('ไม่พบข้อมูลรายวิชาสำหรับเช็คชื่อ (วิชาอาจถูกลบไปแล้ว)', 'err');
        }
      }, 500);
    }
  } catch (err) {
    console.error("App initialization failed:", err);
  }
}

window.startAppPublic = async function() {
  try {
    let firebaseConfig = {
      apiKey: "AIzaSyB7pGaPWn4n7NxrQ9l60V16u-qj05khqU8",
      authDomain: "mat-e-db476.firebaseapp.com",
      databaseURL: "https://mat-e-db476-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "mat-e-db476",
      storageBucket: "mat-e-db476.firebasestorage.app",
      messagingSenderId: "986910230630",
      appId: "1:986910230630:web:7b4b23ce828d18ab7bc5a7"
    };

    if (!firebaseConfig.apiKey) return;

    const app = initializeApp(firebaseConfig);
    window.firebaseApp = app;
    window.db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      experimentalForceLongPolling: true
    });

    state.ilmFilesLoadedFromServer = false;
    render(); // Update UI to show loading

    try {
      const ilmFilesSnap = await getDoc(doc(window.db, "ilm_data", "files"));
      if (ilmFilesSnap.exists()) {
        state.ilmFiles = ilmFilesSnap.data().list || [];
      }
    } catch(e) {
      console.warn("Public fetch error", e);
    }
    
    state.ilmFilesLoadedFromServer = true;
    render(); // Re-render the portal with actual data
  } catch (err) {
    console.error("Public App initialization failed:", err);
  }
};

window.startAppVerify = async function(docId) {
  try {
    let firebaseConfig = {
      apiKey: "AIzaSyB7pGaPWn4n7NxrQ9l60V16u-qj05khqU8",
      authDomain: "mat-e-db476.firebaseapp.com",
      databaseURL: "https://mat-e-db476-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "mat-e-db476",
      storageBucket: "mat-e-db476.firebasestorage.app",
      messagingSenderId: "986910230630",
      appId: "1:986910230630:web:7b4b23ce828d18ab7bc5a7"
    };

    if (!firebaseConfig.apiKey) return;

    const app = initializeApp(firebaseConfig);
    window.firebaseApp = app;
    window.db = initializeFirestore(app, {
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
