const fs = require('fs');
const file = 'c:/Users/nitip/Downloads/web app/nitipat-mgr-v2/auth.js';
const content = fs.readFileSync(file, 'utf-8');

// I know that lines 1 to 311 of the CURRENT file are exactly:
// LoginGate, startAppCore, startAppPublic (ends at line 309).
// Then let's just extract it properly!

const lines = content.split('\n');
let correctTop = [];

let inPublic = false;
for (let i = 0; i < lines.length; i++) {
  correctTop.push(lines[i]);
  if (lines[i].includes('window.startAppPublic = async function() {')) {
    inPublic = true;
  }
  if (inPublic && lines[i].includes('};')) {
    // found end of startAppPublic
    break;
  }
}

const startAppVerifyCode = `
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

    document.body.innerHTML = \`
      <div style="height:100vh; display:flex; justify-content:center; align-items:center; background:#0f172a; color:#f8fafc; font-family:'Inter', sans-serif;">
        <div style="text-align:center;">
          <div style="font-size:40px; margin-bottom:20px;" class="spin">⏳</div>
          <h2>VERIFYING DOCUMENT...</h2>
          <p style="color:#64748b;">Checking cryptographic signature</p>
        </div>
      </div>
      <style>.spin { animation: spin 2s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }</style>
    \`;

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
        document.body.innerHTML = \`
          <div style="height:100vh; display:flex; justify-content:center; align-items:center; background:#0f172a; color:#f8fafc; font-family:'Inter', sans-serif;">
            <div style="text-align:center; background:#1e293b; padding:40px; border-radius:16px; border:1px solid #334155; max-width:400px; box-shadow:0 20px 40px rgba(0,0,0,0.5);">
              <div style="font-size:60px; margin-bottom:20px;">⏱️</div>
              <h2 style="color:#f59e0b; margin-top:0;">DOCUMENT EXPIRED</h2>
              <p style="color:#94a3b8; line-height:1.6;">This verification link has expired because it is older than 30 days. Please request a newly generated document from the issuer.</p>
            </div>
          </div>
        \`;
        return;
      }
    }

    if (!docData) {
      document.body.innerHTML = \`
        <div style="height:100vh; display:flex; justify-content:center; align-items:center; background:#0f172a; color:#f8fafc; font-family:'Inter', sans-serif;">
          <div style="text-align:center; background:#1e293b; padding:40px; border-radius:16px; border:1px solid #334155; max-width:400px; box-shadow:0 20px 40px rgba(0,0,0,0.5);">
            <div style="font-size:60px; margin-bottom:20px;">❌</div>
            <h2 style="color:#ef4444; margin-top:0;">VERIFICATION FAILED</h2>
            <p style="color:#94a3b8; line-height:1.6;">This document cannot be found in the secure vault.</p>
          </div>
        </div>
      \`;
      return;
    }

    // Success Screen
    const hash = "VERIFIED-" + docId.substring(0,8).toUpperCase();
    const date = new Date(docData.timestamp).toLocaleString('th-TH');

    document.body.innerHTML = \`
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
            <div class="value">\${docData.nameTh}</div>
            <div class="label" style="margin-top:8px;">Student ID</div>
            <div class="value" style="font-family:monospace;">\${docData.studentId}</div>
          </div>
          
          <div class="data-row" style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
            <div>
              <div class="label">Cumulative GPAX</div>
              <div class="value highlight">\${docData.gpax}</div>
            </div>
            <div>
              <div class="label">Date of Issue</div>
              <div class="value">\${date}</div>
            </div>
          </div>
        </div>
        
        <div class="hash-block">
          <div style="color:#f8fafc; margin-bottom:4px; font-weight:bold;">BLOCKCHAIN SIGNATURE</div>
          \${hash}<br><span style="color:#3b82f6;">DOC ID: \${docId}</span>
        </div>

        \${docData.currMapBase64 ? \`
          <div style="margin-top:40px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:15px; text-align:center;">
             <div class="label" style="margin-bottom:10px;">Interactive Curriculum Map Included</div>
             <img src="\${docData.currMapBase64}" style="max-width:100%; border-radius:8px;" />
          </div>
        \` : ''}
      </div>
    \`;
  } catch (err) {
    console.error(err);
    document.body.innerHTML = "<div style='color:white; padding:20px;'>Internal System Error.</div>";
  }
};
`;

const finalFile = correctTop.join('\\n') + '\\n\\n' + startAppVerifyCode;
fs.writeFileSync(file, finalFile, 'utf-8');
console.log('Fixed auth.js');
