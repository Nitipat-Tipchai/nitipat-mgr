
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
    
    // Check for admin parameter to hide the login pad from unauthorized visitors
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') !== 'true') {
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

  getSecurityConfig() {
    if (typeof google === 'undefined' || !google.script || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.warn("Using local security fallback");
      return Promise.resolve({ pin: "246810" });
    }
    return new Promise((res, rej) => {
      google.script.run.withSuccessHandler(res).withFailureHandler(rej).getAppConfig();
    });
  },

  renderPinPad() {
    if (this.pinContainer) this.pinContainer.classList.remove('hidden');
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
      <div class="gate-actions" style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
        <button class="btn-glass sm" onclick="LoginGate.sync()"><span style="margin-right:5px;">🔄</span>Sync PIN</button>
        <button class="btn-glass sm" onclick="LoginGate.showIdCard()"><span style="margin-right:5px;">🪪</span>ดูบัตร</button>
      </div>
    `;
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
    let firebaseConfig;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.warn("Using aligned local Firebase config");
      firebaseConfig = {
        apiKey: "AIzaSyB7pGaPWn4n7NxrQ9l60V16u-qj05khqU8",
        authDomain: "mat-e-db476.firebaseapp.com",
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

    if (!firebaseConfig.apiKey) {
      console.error("Firebase API Key is missing.");
      return;
    }

    const app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      experimentalForceLongPolling: true
    });

    messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      if (typeof Notification !== 'undefined') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.image || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
        });
      }
    });

    await loadAll();
    startHyperNotifications();
    scheduleAllNotifications();
    
    // Notion Initial Sync
    setTimeout(() => NotionHub.sync(), 2000);
    if ('serviceWorker' in navigator) {
      initWebPush();
    }
    render();
  } catch (err) {
    console.error("App initialization failed:", err);
  }
}

window.startAppPublic = async function() {
  try {
    let firebaseConfig;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      firebaseConfig = {
        apiKey: "AIzaSyB7pGaPWn4n7NxrQ9l60V16u-qj05khqU8",
        authDomain: "mat-e-db476.firebaseapp.com",
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

    state.ilmFilesLoadedFromServer = false;
    render(); // Update UI to show loading

    try {
      const ilmFilesSnap = await getDoc(doc(db, "ilm_data", "files"));
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
