// ══════════════════════════════════════════════════
// FIREBASE CRUD
// ══════════════════════════════════════════════════
function showLoadingBlocker() {
  let b = document.getElementById('globalLoadingBlocker');
  if (!b) {
    b = document.createElement('div');
    b.id = 'globalLoadingBlocker';
    b.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(255,255,255,0.4); z-index:99999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(3px); cursor:wait;';
    b.innerHTML = '<div style="background:var(--text); color:white; padding:15px 30px; border-radius:12px; font-weight:600; box-shadow:0 10px 25px rgba(0,0,0,0.1); display:flex; align-items:center; gap:10px;"><div class="spinner"></div>กำลังบันทึกข้อมูล...</div>';
    const style = document.createElement('style');
    style.innerHTML = '.spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; } @keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    document.body.appendChild(b);
  }
  b.style.display = 'flex';
}
function hideLoadingBlocker() {
  const b = document.getElementById('globalLoadingBlocker');
  if (b) b.style.display = 'none';
}

async function fsSet(col, id, data) {
  saveToLocalStorage();
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return;
  }
  try {
    const plainData = JSON.parse(JSON.stringify(data));
    setDoc(doc(db, col, id), { ...plainData, _t: serverTimestamp() })
      .catch(e => handleFirebaseError(e, 'fsSet'));
    
    // Notion Sync Trigger (only for main data objects)
    if ((col === 'assignments' || col === 'exams') && !data._notion_syncing && typeof google !== 'undefined' && google.script) {
      const syncFunc = col === 'assignments' ? 'syncAssignmentToNotion' : 'syncExamToNotion';
      google.script.run.withSuccessHandler(res => {
        if (res && res.success && res.pageId && !data.notionPageId) {
          fsUpd(col, id, { notionPageId: res.pageId, _notion_syncing: true });
        }
      })[syncFunc](plainData);
    }
  } catch (e) {
    handleFirebaseError(e, 'fsSet');
  }
}
async function fsDel(col, id) {
  saveToLocalStorage();
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return;
  }
  try {
    deleteDoc(doc(db, col, id))
      .catch(e => handleFirebaseError(e, 'fsDel'));
  } catch (e) {
    handleFirebaseError(e, 'fsDel');
  }
}
async function fsUpd(col, id, data) {
  saveToLocalStorage();
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return;
  }
  try {
    const plainData = JSON.parse(JSON.stringify(data));
    updateDoc(doc(db, col, id), plainData)
      .catch(e => handleFirebaseError(e, 'fsUpd'));
    
    // Trigger Notion Update if relevant
    if ((col === 'assignments' || col === 'exams') && !data._notion_syncing && typeof google !== 'undefined' && google.script) {
      // Need full data for Notion sync
      getDoc(doc(db, col, id)).then(fullDoc => {
        if (fullDoc.exists()) {
          const fullData = fullDoc.data();
          const syncFunc = col === 'assignments' ? 'syncAssignmentToNotion' : 'syncExamToNotion';
          google.script.run.withSuccessHandler(res => {
            if (res && res.success && res.pageId && !fullData.notionPageId) {
               fsUpd(col, id, { notionPageId: res.pageId, _notion_syncing: true });
            }
          })[syncFunc](fullData);
        }
      }).catch(e => console.error("Notion sync document fetch failed", e));
    }
  } catch (e) {
    handleFirebaseError(e, 'fsUpd');
  }
}

function handleFirebaseError(e, source) {
  console.warn(`Firebase Error (${source}):`, e.message);
  if (e.message.toLowerCase().includes('blocked') || e.message.toLowerCase().includes('failed to fetch') || e.code === 'unavailable') {
    showToast('⚠️ การเชื่อมต่อฐานข้อมูลล้มเหลว กรุณาปิด Brave Shields หรือ AdBlocker สำหรับเว็บไซต์นี้', 'err');
  }
}

// ── โหลดข้อมูลจาก localStorage ก่อน (fast) แล้วค่อย sync Firebase ──
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('nitipat_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.semesters) state.semesters = parsed.semesters;
      if (parsed.courses) state.courses = parsed.courses;
      if (parsed.assignments) state.assignments = parsed.assignments;
      if (parsed.exams) state.exams = parsed.exams;
      if (parsed.topicMastery) state.topicMastery = parsed.topicMastery;
      if (parsed.attendanceHistory) state.attendanceHistory = parsed.attendanceHistory;
      if (parsed.ilmCompanies) state.ilmCompanies = parsed.ilmCompanies;
      if (parsed.ilmProfile) state.ilmProfile = parsed.ilmProfile;
      if (parsed.ilmLogs) state.ilmLogs = parsed.ilmLogs;
    }
    const pin = localStorage.getItem('user_pin');
    if (pin) {
      state.pin = pin;
      state.isLocked = true;
    }
  } catch (e) { console.warn('localStorage load error:', e); }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('nitipat_state', JSON.stringify({
      semesters: state.semesters,
      courses: state.courses,
      assignments: state.assignments,
      exams: state.exams,
      topicMastery: state.topicMastery,
      attendanceHistory: state.attendanceHistory,
      ilmCompanies: state.ilmCompanies,
      ilmProfile: state.ilmProfile,
      ilmLogs: state.ilmLogs
    }));
  } catch (e) { console.warn('localStorage save error:', e); }
}

function saveMoneyPod() {
  try {
    localStorage.setItem('moneyWallets', JSON.stringify(state.moneyWallets));
    localStorage.setItem('moneyTransactions', JSON.stringify(state.moneyTransactions));
    localStorage.setItem('moneyBudgets', JSON.stringify(state.moneyBudgets));
    localStorage.setItem('moneyGoals', JSON.stringify(state.moneyGoals));
    localStorage.setItem('moneyInstallments', JSON.stringify(state.moneyInstallments));
    localStorage.setItem('moneyTheme', state.moneyTheme);
    localStorage.setItem('moneyDailyBudget', state.moneyDailyBudget.toString());
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return;
    }
    
    if (db) {
      setDoc(doc(db, "app_settings", "money_pod"), {
        wallets: state.moneyWallets,
        transactions: state.moneyTransactions,
        budgets: state.moneyBudgets,
        goals: state.moneyGoals,
        installments: state.moneyInstallments,
        theme: state.moneyTheme,
        dailyBudget: state.moneyDailyBudget
      }).catch(e => console.warn("MoneyPod Firestore save error:", e));
    }
  } catch (e) {
    console.warn("MoneyPod save error:", e);
  }
}

async function loadAll() {
  state.isInitializing = true;
  loadFromLocalStorage();

  const today = new Date().toDateString();
  if (state.lastScoreReset !== today) {
    state.focusScore = 100;
    state.lastScoreReset = today;
    localStorage.setItem('focusScore', 100);
    localStorage.setItem('last_score_reset', today);
  }
  render();

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.warn("Local offline mode: Bypassing Firebase Sync");
    state.isInitializing = false;
    if (!state.modal) render();
    return;
  }

  try {
    const [sSnap, cSnap, aSnap, eSnap, secSnap, mastSnap, structSnap, reflSnap, profSnap, ilmCompSnap, ilmProfSnap, ilmLogsSnap] = await Promise.all([
      getDocs(collection(db, "semesters")),
      getDocs(collection(db, "courses")),
      getDocs(collection(db, "assignments")),
      getDocs(collection(db, "exams")),
      getDoc(doc(db, "app_settings", "security")),
      getDocs(collection(db, "topic_mastery")),
      getDocs(collection(db, "course_structures")),
      getDocs(collection(db, "reflections")),
      getDoc(doc(db, "app_settings", "profile")),
      getDocs(collection(db, "internship_companies")),
      getDoc(doc(db, "app_settings", "internship_profile")),
      getDocs(collection(db, "daily_logs"))
    ]);

    if (secSnap.exists()) {
      state.pin = secSnap.data().global_pin;
      state.pinSalt = secSnap.data().pin_salt || 'NITIPAT_SALT_DEFAULT';
      if (state.pin && sessionStorage.getItem('unlocked') !== 'true') state.isLocked = true;
      else state.isLocked = false;
    }

    if (profSnap.exists()) {
      const profData = profSnap.data();
      if (profData.idCardPhoto) {
        state.idCardPhoto = profData.idCardPhoto;
        localStorage.setItem('id_card_photo', state.idCardPhoto);
      } else if (state.idCardPhoto) {
        fsSet('app_settings', 'profile', {
          idCardPhoto: state.idCardPhoto,
          studentPhoto: STUDENT.photoUrl
        });
      }
      if (profData.studentPhoto) {
        STUDENT.photoUrl = profData.studentPhoto;
        localStorage.setItem('student_photo', STUDENT.photoUrl);
      }
    } else if (state.idCardPhoto) {
      fsSet('app_settings', 'profile', {
        idCardPhoto: state.idCardPhoto,
        studentPhoto: STUDENT.photoUrl
      });
    }

    state.semesters = sSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.order - b.order);
    state.courses = {};
    cSnap.docs.forEach(d => { const c = { id: d.id, ...d.data() }; if (!state.courses[c.semId]) state.courses[c.semId] = []; state.courses[c.semId].push(c); });
    state.assignments = {};
    aSnap.docs.forEach(d => { const a = { id: d.id, ...d.data() }; if (!state.assignments[a.courseId]) state.assignments[a.courseId] = []; state.assignments[a.courseId].push(a); });
    state.exams = {};
    eSnap.docs.forEach(d => { const e = { id: d.id, ...d.data() }; if (!state.exams[e.courseId]) state.exams[e.courseId] = []; state.exams[e.courseId].push(e); });

    // Cloud Sync for specialized collections
    mastSnap.docs.forEach(d => { state.topicMastery[d.id] = d.data().topics || []; });
    structSnap.docs.forEach(d => { state.courseStructures[d.id] = d.data() || { components: [] }; });
    reflSnap.docs.forEach(d => { state.reflections[d.id] = d.data().text || d.data().reflection || ""; });

    // Sync to LocalStorage as backup
    localStorage.setItem('topic_mastery', JSON.stringify(state.topicMastery));
    localStorage.setItem('course_structures', JSON.stringify(state.courseStructures));
    localStorage.setItem('reflections', JSON.stringify(state.reflections));

    // ILM Cloud Sync
    state.ilmCompanies = ilmCompSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (ilmProfSnap.exists()) {
      state.ilmProfile = ilmProfSnap.data();
    }
    state.ilmLogs = ilmLogsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    localStorage.setItem('ilm_companies', JSON.stringify(state.ilmCompanies));
    localStorage.setItem('ilm_profile', JSON.stringify(state.ilmProfile));
    localStorage.setItem('ilm_logs', JSON.stringify(state.ilmLogs));

    // Focus Sync Listener
    onSnapshot(doc(db, 'app_state', 'focus_session'), (snap) => {
      const data = snap.data();
      if (data && data.active) {
        if (!state.pomodoroActive && data.initiatorId !== state.deviceId) {
          state.pomodoroPhase = data.phase;
          state.pomodoroWork = data.work;
          state.pomodoroBreak = data.break;
          state.selectedFocusCourseId = data.courseId;
          state.lastInitiatorId = data.initiatorId;
          const elapsed = (Date.now() - data.startTime) / 1000;
          const total = (data.phase === 'work' ? data.work : data.break) * 60;
          state.pomodoroTimeRemaining = Math.max(0, total - elapsed);
          startPomodoro(true);
        }
      } else if (state.pomodoroActive && state.lastInitiatorId && state.lastInitiatorId !== state.deviceId) {
        stopPomodoro(false);
      }
    });

    onSnapshot(collection(db, 'attendance_history'), (snap) => {
      let updated = false;
      snap.forEach(doc => {
        const courseId = doc.id;
        const data = doc.data();
        if (data.history) {
          state.attendanceHistory[courseId] = data.history;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('attendance_history', JSON.stringify(state.attendanceHistory));
        if (state.activeHubTab === 'Attendance') render();
      }
    });

    try {
      const mpSnap = await getDoc(doc(db, "app_settings", "money_pod"));
      if (mpSnap.exists()) {
        const mpData = mpSnap.data();
        if (mpData.wallets) state.moneyWallets = mpData.wallets;
        if (mpData.transactions) state.moneyTransactions = mpData.transactions;
        if (mpData.budgets) state.moneyBudgets = mpData.budgets;
        if (mpData.goals) state.moneyGoals = mpData.goals;
        if (mpData.installments) state.moneyInstallments = mpData.installments;
        if (mpData.theme) state.moneyTheme = mpData.theme;
        if (mpData.dailyBudget) state.moneyDailyBudget = mpData.dailyBudget;
        
        localStorage.setItem('moneyWallets', JSON.stringify(state.moneyWallets));
        localStorage.setItem('moneyTransactions', JSON.stringify(state.moneyTransactions));
        localStorage.setItem('moneyBudgets', JSON.stringify(state.moneyBudgets));
        localStorage.setItem('moneyGoals', JSON.stringify(state.moneyGoals));
        localStorage.setItem('moneyInstallments', JSON.stringify(state.moneyInstallments));
        localStorage.setItem('moneyTheme', state.moneyTheme);
        localStorage.setItem('moneyDailyBudget', state.moneyDailyBudget.toString());
      }
    } catch (err) {
      console.warn("Error loading MoneyPod data from Firestore:", err);
    }

    saveToLocalStorage();
    await autoArchiveCourses();
    state.isInitializing = false;
    scheduleAllNotifications();
    if (!state.modal) render();
  } catch (e) {
    state.isInitializing = false;
    handleFirebaseError(e, 'loadAll');
  }
}

async function autoArchiveCourses() {
  const today = new Date();
  let changed = false;
  state.semesters.forEach(s => {
    const endD = new Date(s.endDate);
    if (today > endD) {
      const courses = state.courses[s.id] || [];
      courses.forEach(c => {
        if (!c.isArchived && c.grade && c.grade !== '-' && c.grade !== 'I' && c.grade !== 'N' && c.grade !== 'P' && c.grade !== 'F') {
          c.isArchived = true;
          fsUpd('courses', c.id, { isArchived: true });
          changed = true;
        }
      });
    }
  });
  if (changed) saveToLocalStorage();
}

