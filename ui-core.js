
// ══════════════════════════════════════════════════
// EXPOSE TO WINDOW (Fix for iOS/Safari & Module Scoping)
// ══════════════════════════════════════════════════
window.render = render;
window.showToast = showToast;
window.addTopic = addTopic;
window.setTopicLevel = setTopicLevel;
window.deleteTopic = deleteTopic;
window.setAttendanceStatus = setAttendanceStatus;
window.promptAbsenceReason = promptAbsenceReason;
window.renderCourseHub = renderCourseHub;
window.logoutApp = () => {
  if (confirm('ต้องการออกจากระบบ (ล็อกแอป) ใช่หรือไม่?')) {
    sessionStorage.removeItem('unlocked');
    sessionStorage.removeItem('unlocked_at');
    state.isLocked = true;
    showToast('🔒 ออกจากระบบและล็อกแอปสำเร็จ');
    render();
  }
};

window.showIDCardModal = showIDCardModal;
window.closeModal = closeModal;
window.setupGradeStructure = setupGradeStructure;
window.openModal = openModal;
window.openAddSemesterForm = openAddSemesterForm;
window.openAddCourseForm = openAddCourseForm;
window.openAddAssignmentForm = openAddAssignmentForm;
window.openAddExamForm = openAddExamForm;
window.triggerConfetti = triggerConfetti;
window.state = typeof state !== 'undefined' ? state : {};
window.Radio = typeof Radio !== 'undefined' ? Radio : null;
window.addCourseLink = addCourseLink;
window.removeCourseLink = removeCourseLink;
window.deleteCourse = deleteCourse;
window.saveCourseSettings = async function (id) {
  const form = document.getElementById('courseHubForm');
  if (!form) return;
  const updates = {
    'hubConfig.structure': form.querySelector('#f-hubStructure')?.value || '',
    'hubConfig.understanding': form.querySelector('#f-hubUnderstanding')?.value || '',
    'hubConfig.score': form.querySelector('#f-hubScore')?.value || '',
    'hubConfig.notes': form.querySelector('#f-hubNotes')?.value || ''
  };
  try {
    await updateDoc(doc(db, 'courses', id), updates);
    showToast('✅ บันทึกข้อมูลวิชาเรียบร้อย');
    await loadAll();
  } catch (e) {
    console.error(e);
    showToast('❌ บันทึกไม่สำเร็จ', 'err');
  }
};
async function hashPIN(pin, salt = 'NITIPAT_SALT_DEFAULT', iterations = 10000) {
  try {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: iterations,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const exported = await crypto.subtle.exportKey('raw', derivedKey);
    const hashArray = Array.from(new Uint8Array(exported));
    return 'pbkdf2$' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Cryptographic fallback to salted SHA-256 if subtle is unavailable or fails
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256$' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

async function verifyPIN(inputPin, storedHash, salt = 'NITIPAT_SALT_DEFAULT') {
  if (!storedHash) return false;
  
  if (storedHash.startsWith('pbkdf2$')) {
    const hashedInput = await hashPIN(inputPin, salt);
    return hashedInput === storedHash;
  }
  
  if (storedHash.startsWith('sha256$')) {
    const hashedInput = await hashPIN(inputPin, salt);
    return hashedInput === storedHash;
  }
  
  // Legacy plain SHA-256 (no prefix)
  const encoder = new TextEncoder();
  const data = encoder.encode(inputPin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const legacyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return legacyHash === storedHash;
}

function startInactivityTracker() {
  const resetTimer = () => {
    if (sessionStorage.getItem('unlocked') === 'true') {
      sessionStorage.setItem('unlocked_at', Date.now().toString());
    }
  };
  
  ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetTimer, { passive: true });
  });
  
  setInterval(() => {
    if (sessionStorage.getItem('unlocked') === 'true') {
      const unlockedAt = sessionStorage.getItem('unlocked_at');
      if (unlockedAt && (Date.now() - parseInt(unlockedAt) > 1800000)) {
        sessionStorage.removeItem('unlocked');
        sessionStorage.removeItem('unlocked_at');
        state.isLocked = true;
        showToast('🔒 เซสชันหมดอายุเนื่องจากไม่มีความเคลื่อนไหว', 'err');
        LoginGate.init();
        render();
      }
    }
  }, 10000);
}

window.updateSetColor = updateSetColor;

async function initApp() {
  try {
    startInactivityTracker();
    await loadCourseDatabase();
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
    loadFromLocalStorage();
    
    // Check initial unlock state
    const unlocked = sessionStorage.getItem('unlocked');
    const unlockedAt = sessionStorage.getItem('unlocked_at');
    const isTimeout = unlockedAt && Date.now() - parseInt(unlockedAt) > 1800000;
    
    const urlParams = new URLSearchParams(window.location.search);
    const isShareLink = urlParams.has('share');
    const isVerifyLink = urlParams.has('verify');
    
    let checkinCourseId = urlParams.get('checkin');
    if (!checkinCourseId && window.location.hash.includes('checkin=')) {
      checkinCourseId = window.location.hash.split('checkin=')[1].split('&')[0];
    }

    if (isShareLink) {
      state.isLocked = false;
      document.getElementById('login-gate')?.classList.add('inactive');
      if (typeof startAppPublic === 'function') {
        await startAppPublic();
      }
    } else if (isVerifyLink) {
      state.isLocked = false;
      document.getElementById('login-gate')?.classList.add('inactive');
      if (typeof startAppVerify === 'function') {
        await startAppVerify(urlParams.get('verify'));
      }
    } else if (unlocked === 'true' && !isTimeout) {
      state.isLocked = false;
      document.getElementById('login-gate')?.classList.add('inactive');
      await startAppCore();
    } else {
      state.isLocked = true;
      sessionStorage.removeItem('unlocked');
      sessionStorage.removeItem('unlocked_at');
      LoginGate.init(); // Fallback to classic gate for initialization
    }

    render();

    if (typeof Radio !== 'undefined') {
      Radio.init();
    }

    // Dynamic background GPS check-in tracker (runs every 5 minutes)
    setInterval(() => {
      if (!state.isLocked && !state.modal) {
        GPSManager.checkInSuggestion().catch(err => console.error("Background GPS check failed: ", err));
      }
    }, 300000);

    
    // Removed 30-second auto-render to prevent annoying background refreshes
  } catch (e) {
    console.error("Initialization failed:", e);
    render();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Page Visibility API — kill tree if unfocused during pomodoro
document.addEventListener('visibilitychange', () => {
  if (typeof state === 'undefined') return;
  if (document.hidden && state.pomodoroActive && state.pomodoroPhase === 'work') {
    state.tree.alive = false;
    localStorage.setItem('focusTree', JSON.stringify(state.tree));
    showToast('🪨 ต้นไม้ตายแล้ว! อย่าออกจากหน้าจอระหว่างโฟกัส', 'err');
  }
});
