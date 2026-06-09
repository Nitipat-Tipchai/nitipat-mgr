
const FOCUS_PRESETS = [
  { name: 'Pomodoro', work: 25, break: 5, icon: '🍅' },
  { name: 'Deep Work', work: 50, break: 10, icon: '⚡' },
  { name: 'Long Focus', work: 90, break: 15, icon: '🧘' }
];

/**
 * 📀 MGR Audio Database (Google Drive IDs)
 */
const MGR_AUDIO_DATABASE = {
  morning: ["1x1umD0OX2uFJukPKgvi1O5K1mE0Zb2zN", "180L3lpxTNrVgFsGIprEbqUSc8kurKvFJ", "1Pk1nw_e276Vx3xy5fvHIMi7Gp1D80284", "1Pf_y2W6MOPk2Ky-jyuHIX6g20HOhYSji", "1_8hQVqoAdDTEoJ8PDgf7Dzue81INnX3n", "1yH8t3UBrp2_OVI8LDoD5nrEwcTfMDQQk", "1FBQKNJ19589rh68ojFwL92Azv3PWf4Jb"],
  afternoon: ["1loLOrzrzQNKvwPdy7wBNG1Pax3CYeD52", "1bjKsBuL0o-MMFq3bPqy13OaD6laF8dE7", "1636AP2tsWZlhbFEfq8LfszsRwotQUzOR", "1nrGZavcWfGhAx8fep12teR7b1qqmssii", "1oQowQgQiBCTIFs4hvop8bb4s4Z1i-h6k", "1EBoajtvqdzC8grasBUb0_zzQB0CSpCK3", "1pbxKmKdl_N5n7VIZcx0MUrG7LValmBaq"],
  night: ["1xUNr9oz0vRg2YT_sB7NJQBsiEEaOMfm1", "1LKykxZWMiuJ7nAHKwfaNjmk_KNRTzLAJ", "1A5SePiU0snXti4tRWSDZ_qx_71xru3Yw", "1XgnxOjTM4KRXHN44d_4x_cE9N1BNhxbZ", "1xD1pWpM9arPPYetVFRbEfluCt4GwRG8v", "14xeeWwXY0F288XqGlcFAXBzvsvhel8Dd", "1D9SGkMoMKebFJqvKjnGIpB3hkAlQZkwp", "1CdbgKRLfMW30EIg_LSeQCKH4JMdxqwiA"],
  start: ["11vII4lmTi1UBYg14iuWxV_okY1lFHzjg", "1aZGx5bgFf6rWAg1rYp4bV-Eq2j_EtFIA", "11d8ADTh7_eA72k964h_gkQYccXvQh47c"],
  pause: ["1LPFV4giMm4VGdrlDNH6yH6qBQMZ1n_Sw", "1FYMWoUyyXQPEqQEjYFvMupBYso1tms7x"],
  complete: ["1PR4T7FayCGKHdGL3OpFhFYl__T7vHCku", "1j9OysfFjZPMyOvDFGtqGXKSGsJ0zar_U", "1Io5uQTcnkgrtd-kS2KQnnp5Vn8jIXo3u"],
  lofi: ["https://www.dropbox.com/scl/fi/0rge299tcx5tuz0t1jesx/Ytmp3.gg_YouTube_45-Minute-Timer-Lofi_Media_rGXWHmb9vEQ_009_128k.mp3?rlkey=5xt97s6fmild8ellrnoz6s0ak&st=4g3864q0&dl=1"],
  groove: ["https://www.dropbox.com/scl/fi/m9wfjxbog3mqub56lbuzg/GROOVE-POP-laid-back-Vol.13-A-Groove-That-Lifts-Your-Mood-grgr_playlist-128k.mp3?rlkey=5rfmqtievcm60vzyezgstxd2c&st=j94ekyh8&dl=1"]
};

class RadioController {
  constructor() {
    this.musicAudio = new Audio();
    this.djAudio = new Audio();
    this.triggerAudio = new Audio();
    this.playedTracks = new Set();
    this.audioCache = {};
    this.interruptionTimer = null;
    this.musicTrackCount = 0;
    this.mode = 'lofi';
    this.isPlaying = false; // Flag ตรวจสอบสถานะการเล่นจริง

    this.musicAudio.volume = 0.6;
    this.djAudio.volume = 0.8;
    this.triggerAudio.volume = 0.9;

    this.musicAudio.onended = () => {
      if (!this.isPlaying) return;
      this.musicTrackCount++;
      if (this.musicTrackCount >= 2) {
        this.musicTrackCount = 0;
        this.playDJInterrupt();
      } else {
        this.playMusic();
      }
    };

    // Pre-create some context to help mobile
    this.silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFWm51bQAAAAADAAEAgD4AAIA+AAABAAgAZGF0YQAAAAA=');
  }

  async warmUp() {
    console.log("🔊 DJ Brain: Warming up audio context...");
    try {
      const warm = async (a) => { a.play().then(() => a.pause()).catch(() => { }); };
      await warm(this.musicAudio);
      await warm(this.djAudio);
      await warm(this.triggerAudio);
      await warm(this.silentAudio);
    } catch (e) { console.warn("Warmup failed", e); }
  }

  async init() {
    console.log("🎙️ DJ Brain: Pre-caching critical sounds...");
    const criticalCategories = ['start', 'pause', 'complete'];
    for (const cat of criticalCategories) {
      this.preCacheCategory(cat);
    }
    // 2. โหลดเสียงดีเจตามช่วงเวลาปัจจุบัน
    const h = new Date().getHours();
    let currentDJ = 'night';
    if (h >= 6 && h < 12) currentDJ = 'morning';
    else if (h >= 12 && h < 18) currentDJ = 'afternoon';
    this.preCacheCategory(currentDJ);
  }

  async preCacheCategory(category) {
    const ids = MGR_AUDIO_DATABASE[category];
    if (!ids) return;
    for (const id of ids) {
      if (!this.audioCache[id]) {
        this.loadAudioSource(id).then(dataUri => {
          if (dataUri) this.audioCache[id] = dataUri;
        });
      }
    }
  }

  async loadAudioSource(id) {
    // ถ้าเป็น URL ตรงๆ (เช่น Dropbox) ให้ส่งกลับไปเลย ไม่ต้องผ่าน Proxy
    if (id.startsWith('http')) return id;

    if (this.audioCache[id]) return this.audioCache[id];
    return new Promise((resolve) => {
      google.script.run
        .withSuccessHandler(dataUri => {
          if (!dataUri) {
            console.warn("⚠️ ไฟล์ใหญ่อาจเกิน 50MB (Proxy ล้มเหลว) ลองใช้ Direct URL แทน:", id);
            resolve(`https://drive.google.com/uc?export=download&id=${id}`);
          } else {
            resolve(dataUri);
          }
        })
        .withFailureHandler(err => {
          console.warn("⚠️ Proxy Error:", err);
          resolve(`https://drive.google.com/uc?export=download&id=${id}`);
        })
        .getAudioDataProxy(id);
    });
  }

  pickRandomId(category) {
    let ids = MGR_AUDIO_DATABASE[category];
    if (category === 'lofi' || category === 'groove') {
      // Inject custom URLs
      ids = [...ids, ...(state.customMusicUrls || [])];
    }
    if (!ids || ids.length === 0) return null;
    const available = ids.filter(id => !this.playedTracks.has(id));
    if (available.length === 0) {
      ids.forEach(id => this.playedTracks.delete(id));
      return this.pickRandomId(category);
    }
    const id = available[Math.floor(Math.random() * available.length)];
    this.playedTracks.add(id);
    return id;
  }

  async fadeVolume(audio, target, duration = 1500) {
    const startVol = audio.volume;
    const steps = 30;
    const interval = duration / steps;
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, interval));
      audio.volume = startVol + (target - startVol) * (i / steps);
    }
    audio.volume = target;
  }

  async playMusic() {
    if (!this.isPlaying) return;
    const id = this.pickRandomId(this.mode);
    if (id) {
      const dataUri = await this.loadAudioSource(id);
      if (dataUri && this.isPlaying) {
        this.musicAudio.src = dataUri;
        this.musicAudio.play().then(() => {
          this.resetInterruptionTimer();
        }).catch(e => {
          console.error("❌ Music Playback Error (ข้ามไปเพลงถัดไป):", e);
          // ข้ามไปเล่นเพลงถัดไปถ้าเล่นไม่ได้ (เช่นติด CSP หรือไฟล์พัง)
          setTimeout(() => this.playMusic(), 1000);
        });
      } else if (!dataUri && this.isPlaying) {
        setTimeout(() => this.playMusic(), 1000);
      }
    }
  }

  resetInterruptionTimer() {
    if (this.interruptionTimer) clearTimeout(this.interruptionTimer);
    if (!this.isPlaying) return;
    const delay = (15 + Math.random() * 5) * 60 * 1000;
    this.interruptionTimer = setTimeout(() => this.playDJInterrupt(), delay);
  }

  async playDJInterrupt() {
    if (!this.isPlaying) return;
    const h = new Date().getHours();
    let cat = 'night';
    if (h >= 6 && h < 12) cat = 'morning';
    else if (h >= 12 && h < 18) cat = 'afternoon';

    const id = this.pickRandomId(cat);
    if (!id) return this.playMusic();

    const dataUri = await this.loadAudioSource(id);
    if (!dataUri || !this.isPlaying) {
      if (this.isPlaying && this.musicAudio.paused) this.playMusic();
      return;
    }

    await this.fadeVolume(this.musicAudio, 0.1, 1500);
    if (!this.isPlaying) return;
    this.djAudio.src = dataUri;
    this.djAudio.play().catch(e => {
      console.error("❌ DJ Playback Error:", e);
      this.fadeVolume(this.musicAudio, 0.6, 1000);
      this.resetInterruptionTimer();
    });
    this.djAudio.onended = async () => {
      if (!this.isPlaying) return;
      await this.fadeVolume(this.musicAudio, 0.6, 2000);
      if (this.musicAudio.paused && this.isPlaying) this.playMusic();
      else this.resetInterruptionTimer();
    };
  }

  async playTrigger(type) {
    const id = this.pickRandomId(type);
    if (id) {
      const dataUri = await this.loadAudioSource(id);
      if (dataUri) {
        this.triggerAudio.src = dataUri;
        this.triggerAudio.play().catch(() => { });
      }
    }
  }

  onPomodoroStart() {
    this.isPlaying = true;
    this.stopAll(false);
    this.playTrigger('start').then(() => {
      this.triggerAudio.onended = () => {
        if (this.isPlaying) this.playMusic();
      }
    });
  }

  async onPomodoroPause() {
    this.isPlaying = false;
    if (this.interruptionTimer) clearTimeout(this.interruptionTimer);
    await this.fadeVolume(this.musicAudio, 0, 1000);
    this.musicAudio.pause();
    this.playTrigger('pause');
  }

  onResume() {
    this.isPlaying = true;
    if (this.musicAudio.src) {
      this.musicAudio.volume = 0.6;
      this.musicAudio.play().catch(() => this.playMusic());
      this.resetInterruptionTimer();
    } else {
      this.playMusic();
    }
  }

  onPomodoroComplete() {
    this.isPlaying = false;
    this.stopAll();
    this.playTrigger('complete');
  }

  stopAll(resetIsPlaying = true) {
    if (resetIsPlaying) this.isPlaying = false;
    this.musicAudio.pause();
    this.djAudio.pause();
    this.triggerAudio.pause();
    this.silentAudio.pause();
    if (this.interruptionTimer) clearTimeout(this.interruptionTimer);
  }
}

const Radio = new RadioController();

// ══════════════════════════════════════════════════
// ADVANCED LOGIC: GEOLOCATION & HAVERSINE
// ══════════════════════════════════════════════════
// ══════════════════════════════════════════════════


// ══════════════════════════════════════════════════
// 📝 NOTION SYNC ENGINE (2-WAY)
// ══════════════════════════════════════════════════
const NotionSync = {
  async syncAll() {
    showToast("Syncing with Notion...", "wait");
    try {
      // Step 1: Sync Assignments
      const allAssign = Object.values(state.assignments).flat();
      for (const a of allAssign) {
        if (a.needsSync) {
          await this.syncAssignment(a);
        }
      }
      showToast("Notion Sync Complete", "ok");
    } catch (e) {
      console.error("Notion Sync Failed:", e);
      showToast("Notion Sync Failed", "err");
    }
  },

  async syncAssignment(assignment) {
    return new Promise((res, rej) => {
      google.script.run
        .withSuccessHandler(res)
        .withFailureHandler(rej)
        .syncAssignmentToNotion(assignment);
    });
  }
};

window.NotionSync = NotionSync;

// ══════════════════════════════════════════════════
// 📍 GPS & CHECK-IN MANAGER
// ══════════════════════════════════════════════════
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const GPSManager = {
  hasCheckedInToday(courseId) {
    const history = state.attendanceHistory[courseId];
    if (!history) return false;
    if (Array.isArray(history)) {
      if (history.length === 0) return false;
      const today = new Date().toDateString();
      return history.some(record => new Date(record.timestamp).toDateString() === today);
    }
    const dateKey = new Date().toLocaleDateString('en-CA');
    return !!history[dateKey];
  },

  async checkInSuggestion() {
    const curClass = this.getCurrentClass();
    if (!curClass) return;

    if (this.hasCheckedInToday(curClass.id)) return;

    try {
      const coords = await this.getCurrentPosition();
      let targetLat = 14.065, targetLng = 100.606; // Default KU
      if (curClass.targetCoords) {
        const [lat, lng] = curClass.targetCoords.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          targetLat = lat;
          targetLng = lng;
        }
      }
      const distance = getDistance(coords.lat, coords.lng, targetLat, targetLng);

      if (distance <= 200) { // 200m
        this.showCheckInPrompt(curClass, true);
      } else {
        this.showCheckInPrompt(curClass, false); // Suggest Online
      }
    } catch (e) {
      console.warn("Could not retrieve geolocation: ", e);
    }
  },

  getCurrentClass() {
    const now = new Date();
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const h = now.getHours();
    const all = Object.values(state.courses).flat();
    return all.find(c => (c.schedules || []).some(s => s.day === day && s.startHour <= h && (s.endHour || s.startHour + 3) > h));
  },

  getCurrentPosition() {
    return new Promise((res, rej) => {
      navigator.geolocation.getCurrentPosition(
        p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        e => rej(e),
        { enableHighAccuracy: true }
      );
    });
  },

  showCheckInPrompt(course, isNearby) {
    openModal("Check-in Suggestion", `
      <div style="text-align:center;">
        <div style="font-size:40px; margin-bottom:15px;">📍</div>
        <p>คุณกำลังเรียนวิชา <strong>${course.nameTh}</strong> หรือไม่?</p>
        <p style="font-size:12px; color:var(--c-muted);">${isNearby ? "ตรวจพบว่าคุณอยู่ที่ห้องเรียน" : "คุณอยู่นอกพื้นที่ห้องเรียน (เรียนออนไลน์?)"}</p>
      </div>
    `, `
      <button class="nb-btn" onclick="GPSManager.confirmCheckIn('${course.id}', '${isNearby ? 'On-site' : 'Online'}')">ยืนยันเช็คชื่อ</button>
      <button class="nb-btn-danger" onclick="closeModal()">ไม่เรียน / ข้าม</button>
    `);
  },

  confirmCheckIn(courseId, mode) {
    const now = new Date();
    const dateKey = now.toLocaleDateString('en-CA');
    if (!state.attendanceHistory[courseId]) state.attendanceHistory[courseId] = {};
    if (Array.isArray(state.attendanceHistory[courseId])) {
      state.attendanceHistory[courseId] = {};
    }
    state.attendanceHistory[courseId][dateKey] = { timestamp: now.toISOString(), mode: mode, status: mode };
    localStorage.setItem('attendance_history', JSON.stringify(state.attendanceHistory));
    showToast(`เช็คชื่อ ${mode} สำเร็จ!`, "ok");
    closeModal();
    render();
  }
};

window.GPSManager = GPSManager;

function suggestGradesForTarget(targetGPA) {
  const allPast = [];
  state.semesters.forEach(s => {
    (state.courses[s.id] || []).forEach(c => {
      if (c.grade && GRADE_PTS[c.grade] !== null) allPast.push(c);
    });
  });

  const curSem = getCurrentSemester();
  if (!curSem) return { error: 'ไม่มีเทอมปัจจุบัน' };
  const currentCourses = (state.courses[curSem.id] || []).filter(c => !c.grade);
  if (currentCourses.length === 0) return { error: 'ไม่มีวิชาที่กำลังเรียน' };

  let pastPts = 0, pastCr = 0;
  allPast.forEach(c => { pastPts += GRADE_PTS[c.grade] * c.credits; pastCr += c.credits; });

  const currentTotalCr = currentCourses.reduce((sum, c) => sum + c.credits, 0);
  const totalCr = pastCr + currentTotalCr;
  const neededTotalPts = targetGPA * totalCr;
  const neededCurPts = neededTotalPts - pastPts;

  const targetAvg = neededCurPts / currentTotalCr;
  if (targetAvg > 4) return { error: 'เป้าหมายสูงเกินความเป็นไปได้ (ต้องการเกรดเฉลี่ย > 4.00)' };

  // Simple heuristic: suggest grades
  const grades = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D'];
  let suggestion = [];
  currentCourses.forEach(c => {
    let best = 'F';
    for (let g of grades) { if (GRADE_PTS[g] >= targetAvg) best = g; }
    suggestion.push({ code: c.code, suggest: best });
  });
  return { avg: targetAvg.toFixed(2), suggestion };
}

// ══════════════════════════════════════════════════
// ADVANCED LOGIC: SOS ANALYZER
// ══════════════════════════════════════════════════
function analyzeSOS(courseId) {
  const all = [];
  let targetCourse = null;
  state.semesters.forEach(s => {
    (state.courses[s.id] || []).forEach(c => {
      if (c.id === courseId) targetCourse = c;
      if (c.grade && GRADE_PTS[c.grade] !== null) all.push(c);
    });
  });

  if (!targetCourse) return null;

  const currentGPA = parseFloat(calcGPAFromList(all));

  // Option 1: Keep and get D/F
  const withD = [...all, { ...targetCourse, grade: 'D' }];
  const withF = [...all, { ...targetCourse, grade: 'F' }];
  const gpaD = calcGPAFromList(withD);
  const gpaF = calcGPAFromList(withF);

  // Option 2: Withdraw (W)
  const gpaW = currentGPA; // W doesn't affect GPA

  return {
    current: currentGPA,
    ifD: gpaD,
    ifF: gpaF,
    ifW: gpaW,
    recommend: (gpaF < 2.0 && gpaW >= 2.0) ? 'ถอน (Withdraw) เพื่อรักษา GPAX' : 'สู้ต่อ (Keep Fighting)'
  };
}

// ══════════════════════════════════════════════════
// GRADE UTILS
// ══════════════════════════════════════════════════
const GRADE_PTS = { A: 4, 'B+': 3.5, B: 3, 'C+': 2.5, C: 2, 'D+': 1.5, D: 1, F: 0, W: null, 'W-Late': null, N: null, I: null, P: null };
const GRADE_COLORS = {
  A: '#84cc16', 'B+': '#84cc16', B: '#84cc16', 'C+': '#84cc16', C: '#84cc16', 'D+': '#84cc16', D: '#84cc16',
  F: '#e11d48', W: '#e11d48', 'W-Late': '#e11d48', N: '#94a3b8', '-': '#6366f1'
};

function renderTopicMastery(courseId, parentId = null) {
  const allTopics = state.topicMastery[courseId] || [];
  const topics = allTopics.filter(t => t.parentId === parentId);
  const total = allTopics.length;
  const mastered = allTopics.filter(t => t.level === 'mastered').length;
  const progressPct = total > 0 ? ((mastered / total) * 100).toFixed(0) : 0;
  let html = '';

  // FIX 3: Mastery Summary Bar
  if (parentId === null && total > 0) {
    html += `
          <div class="glass-card nb-card" style="margin-bottom:15px; background:rgba(132,204,22,0.05); border-color:var(--c-lime);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
               <div style="font-size:14px; font-weight:800; color:var(--c-lime);">📊 Mastery Progress</div>
               <div style="font-size:14px; font-weight:800;">${progressPct}%</div>
            </div>
            <div class="progress-bar-v2" style="height:12px;"><div class="pb-fill" style="width:${progressPct}%; background:var(--c-lime);"></div></div>
            <div style="font-size:11px; margin-top:6px; font-weight:600; opacity:0.7;">เชี่ยวชาญแล้ว ${mastered}/${total} หัวข้อ</div>
          </div>
        `;
  }

  // Course-wide Linked Files (from Drive Toolbar)
  if (parentId === null) {
    const c = findCourseById(courseId);
    if (c && c.linkedFiles && c.linkedFiles.length > 0) {
      html += `
        <div class="glass-card nb-card" style="margin-bottom:15px; background:rgba(99,102,241,0.05); border-color:var(--c-indigo); padding: 15px;">
          <div style="font-size:14px; font-weight:800; color:var(--c-indigo); margin-bottom:8px; display:flex; align-items:center; gap:6px;">📚 เอกสารประกอบรายวิชา (Linked Files)</div>
          <div style="display:flex; flex-wrap:wrap; gap:5px;">
            ${c.linkedFiles.map(f => `
              <div class="file-tag" style="background:white; padding:4px 10px; border-radius:6px; font-size:11px; display:flex; align-items:center; gap:5px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <span onclick="previewFile('${f.id}', '${f.name}', '${f.url}', '${f.mimeType}')" style="cursor:pointer; font-weight:600;">📄 ${f.name}</span>
                <span onclick="unlinkFileFromCourse('${courseId}', '${f.id}')" style="cursor:pointer; color:var(--c-red); font-weight:800; margin-left:3px;">✕</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  if (topics.length === 0 && parentId === null) {
    return html + `<div class="empty-sm">ยังไม่มีหัวข้อที่เรียน <br> <button class="nb-btn sm" style="margin-top:10px;" onclick="addTopic('${courseId}', null)">➕ เพิ่มหัวข้อหลัก</button></div>`;
  }

  html += `<div class="${parentId ? 'topic-branch' : ''}">
        ${topics.map((t, idx) => `
          <div style="margin-bottom:12px;">
            <div class="topic-item nb-card" style="padding:10px 15px; background:white;">
              <div style="display:flex; align-items:center; gap:10px; flex:1;">
                 <div class="topic-lvl-badge" style="width:10px; height:10px; background:${t.level === 'mastered' ? 'var(--c-lime)' : t.level === 'ok' ? 'var(--c-indigo)' : 'var(--c-rust)'}; border:1.5px solid black;"></div>
                 <div style="font-weight:700; font-size:13px; color:black;">${t.name}</div>
              </div>
              <div class="topic-meta" style="display:flex; gap:6px;">
                <button class="mastery-btn ${t.level === 'review' ? 'active' : ''}" style="background:var(--c-rust);" title="Review" onclick="setTopicLevel('${courseId}', '${t.id}', 'review')">❓ ทวน</button>
                <button class="mastery-btn ${t.level === 'ok' ? 'active' : ''}" style="background:var(--c-indigo);" title="OK" onclick="setTopicLevel('${courseId}', '${t.id}', 'ok')">📖 พอได้</button>
                <button class="mastery-btn ${t.level === 'mastered' ? 'active' : ''}" style="background:var(--c-lime);" title="Mastered" onclick="setTopicLevel('${courseId}', '${t.id}', 'mastered')">⭐ แม่น</button>
                <button class="tool-btn sm" style="font-size:10px; width:auto; padding:0 8px; border:1px solid black; border-radius:6px;" title="Link File" onclick="PickerManager.openPicker('${courseId}', null, (docs) => linkFilesToTopic('${courseId}', '${t.id}', docs))">🔗</button>
                <button class="tool-btn sm" style="font-size:10px; width:auto; padding:0 8px; border:1px solid black; border-radius:6px;" title="เพิ่มหัวข้อย่อย" onclick="addTopic('${courseId}', '${t.id}')">➕ ย่อย</button>
                <button class="btn-text-danger" style="font-size:14px; font-weight:800;" onclick="deleteTopic('${courseId}', '${t.id}')">✕</button>
              </div>
            </div>
            ${t.files && t.files.length > 0 ? `
              <div class="topic-files" style="margin-left: 25px; margin-top: 5px; margin-bottom: 5px; display: flex; flex-wrap: wrap; gap: 5px;">
                ${t.files.map(f => `
                  <div class="file-tag" style="background:#f1f5f9; padding:2px 8px; border-radius:6px; font-size:11px; display:flex; align-items:center; gap:5px; border:1px solid #e2e8f0;">
                    <span onclick="previewFile('${f.id}', '${f.name}', '${f.url}', '${f.mimeType}')" style="cursor:pointer;">📄 ${f.name}</span>
                    <span onclick="unlinkFileFromTopic('${courseId}', '${t.id}', '${f.id}')" style="cursor:pointer; color:var(--c-red); font-weight:800;">✕</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${renderTopicMastery(courseId, t.id)}
          </div>
        `).join('')}
        ${!parentId ? `<button class="nb-btn sm" style="width:100%; margin-top:5px; background:#f8fafc;" onclick="addTopic('${courseId}', null)">➕ เพิ่มหัวข้อหลัก</button>` : ''}
      </div>`;
  return html;
}

function calcGPAFromList(list) {
  let pts = 0, cr = 0;
  list.forEach(c => {
    const g = GRADE_PTS[c.grade];
    if (g !== null && g !== undefined && c.grade !== 'W' && c.grade !== 'W-Late' && c.grade !== 'P' && c.grade !== 'N') { pts += g * c.credits; cr += c.credits; }
  });
  return cr > 0 ? (pts / cr).toFixed(2) : '-';
}

// ══════════════════════════════════════════════════
// MICRO-GRADE & WHAT-IF LOGIC
// ══════════════════════════════════════════════════
function renderGradeStructure(courseId) {
  const structure = state.courseStructures[courseId] || { components: [] };
  if (structure.components.length === 0) {
    return `<div class="empty-sm" style="background:rgba(255,255,255,0.05); padding:12px; border-radius:12px; border:1px dashed var(--glass-border);">
      ยังไม่มีโครงสร้างคะแนน <br> <button class="btn-glass sm" style="margin-top:8px;" id="setupGradeBtn">🛠 ตั้งค่าโครงสร้าง</button>
    </div>`;
  }

  let totalWeight = 0;
  let earnedPct = 0;
  let html = `<div class="grade-rows" style="display:flex; flex-direction:column; gap:8px;">`;
  structure.components.forEach((comp, idx) => {
    const score = parseFloat(comp.earned) || 0;
    const max = parseFloat(comp.max) || 100;
    const weight = parseFloat(comp.weight) || 0;
    const contribution = (score / max) * weight;
    totalWeight += weight;
    earnedPct += contribution;
    html += `
      <div class="grade-row-item">
        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
          <span>${comp.name} (${weight}%)</span>
          <span style="font-weight:600;">${score}/${max} (${contribution.toFixed(1)}%)</span>
        </div>
        <div class="prog-bar-bg" style="height:6px; background:rgba(255,255,255,0.1);"><div class="prog-bar-fill" style="width:${(score / max) * 100}%; background:var(--c-accent); box-shadow:0 0 10px var(--c-accent);"></div></div>
      </div>`;
  });

  const remainingWeight = 100 - totalWeight;
  html += `</div>
    <div style="margin-top:12px; padding:12px; background:rgba(79,70,229,0.1); border-radius:12px; border:1px solid rgba(79,70,229,0.2);">
      <div style="font-size:14px; font-weight:700; color:var(--c-accent);">คะแนนปัจจุบัน: ${earnedPct.toFixed(1)} / ${totalWeight}%</div>
      ${remainingWeight > 0 ? `
        <div style="font-size:11px; margin-top:4px; opacity:0.7;">เหลือคะแนนอีก ${remainingWeight}% ที่ยังไม่ได้ประกาศ</div>
        <div class="what-if-results" style="margin-top:10px; font-size:10px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div class="glass-card-sm" style="padding:8px; border:1px solid rgba(132,204,22,0.3);">
            <div style="color:var(--c-lime); font-weight:700;">เป้าหมายเกรด A (80%)</div>
            <div>ต้องได้อีก: <strong>${Math.max(0, 80 - earnedPct).toFixed(1)}%</strong></div>
          </div>
          <div class="glass-card-sm" style="padding:8px; border:1px solid rgba(249,115,22,0.3);">
            <div style="color:var(--c-rust); font-weight:700;">เป้าหมายเกรด C (60%)</div>
            <div>ต้องได้อีก: <strong>${Math.max(0, 60 - earnedPct).toFixed(1)}%</strong></div>
          </div>
        </div>
      ` : ''}
    </div>
    <button class="btn-text-sm" style="margin-top:10px; width:100%;" id="editGradeStructureBtn">✏️ แก้ไขคะแนนย่อย</button>`;
  return html;
}

function setupGradeStructure(courseId) {
  const structure = state.courseStructures[courseId] || { components: [] };
  let tempComponents = [...structure.components];

  const renderTemp = () => tempComponents.map((c, i) => `
    <div class="glass-card-sm" style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr 30px; gap:8px; align-items:center; margin-bottom:8px; padding:10px;">
      <input class="glass-input sm f-comp-name" placeholder="ชื่อ (เช่น Midterm)" value="${c.name}" data-idx="${i}">
      <input type="number" class="glass-input sm f-comp-earned" placeholder="ได้" value="${c.earned}" data-idx="${i}">
      <input type="number" class="glass-input sm f-comp-max" placeholder="เต็ม" value="${c.max}" data-idx="${i}">
      <input type="number" class="glass-input sm f-comp-weight" placeholder="นน.%" value="${c.weight}" data-idx="${i}">
      <button class="btn-text-danger" onclick="tempComponents.splice(${i},1); window.updateCompUI();">✕</button>
    </div>
  `).join('');

  openModal('ตั้งค่าโครงสร้างคะแนน', `
    <div class="form-grid">
      <div id="compList">${renderTemp()}</div>
      <button class="btn-glass sm" id="addCompBtn">+ เพิ่มรายการ</button>
      <div style="font-size:11px; color:var(--c-muted);">* รวมค่าน้ำหนัก (%) ทั้งหมดควรเท่ากับ 100</div>
    </div>
  `, `<button class="btn-glass-primary" id="saveCompBtn">บันทึกโครงสร้าง</button>`);

  window.updateCompUI = () => {
    const list = document.getElementById('compList');
    if (list) {
      list.innerHTML = renderTemp();
      attachCompEvents();
    }
  };
  const attachCompEvents = () => {
    document.querySelectorAll('.f-comp-name').forEach(el => el.onchange = (e) => tempComponents[e.target.dataset.idx].name = e.target.value);
    document.querySelectorAll('.f-comp-earned').forEach(el => el.onchange = (e) => tempComponents[e.target.dataset.idx].earned = e.target.value);
    document.querySelectorAll('.f-comp-max').forEach(el => el.onchange = (e) => tempComponents[e.target.dataset.idx].max = e.target.value);
    document.querySelectorAll('.f-comp-weight').forEach(el => el.onchange = (e) => tempComponents[e.target.dataset.idx].weight = e.target.value);
  };
  document.getElementById('addCompBtn').onclick = () => { tempComponents.push({ name: '', earned: 0, max: 100, weight: 0 }); window.updateCompUI(); };
  attachCompEvents();

  document.getElementById('saveCompBtn').onclick = async () => {
    state.courseStructures[courseId] = { components: tempComponents };
    localStorage.setItem('course_structures', JSON.stringify(state.courseStructures));

    showToast('⏳ กำลังซิงก์ข้อมูลโครงสร้างคะแนน...');
    await fsSet('course_structures', courseId, { components: tempComponents });

    showToast('✅ บันทึกโครงสร้างคะแนนเรียบร้อย');
    closeModal();
    render();
  };
}

function getCumGPA() {
  const all = [];
  state.semesters.forEach(s => { (state.courses[s.id] || []).forEach(c => { if (c.grade) all.push(c); }); });
  return calcGPAFromList(all);
}

function getTotalPassedCredits() {
  let t = 0;
  state.semesters.forEach(s => {
    (state.courses[s.id] || []).forEach(c => {
      if (c.grade && c.grade !== 'F' && c.grade !== 'W' && c.grade !== 'W-Late' && c.grade !== 'N' && c.grade !== 'I') t += c.credits;
    });
  });
  return t;
}

function getProStatus(gpa) {
  const g = parseFloat(gpa);
  if (isNaN(g) || gpa === '-') return null;
  if (g < 1.5) return 'expelled';
  if (g < 1.75) return 'pro-high';
  if (g < 2.0) return 'pro-low';
  return 'safe';
}

function getDaysUntil(d) { return Math.ceil((new Date(d) - new Date()) / (864e5)); }

// ══════════════════════════════════════════════════
// ⏱️ LIVE CLASS HUB (DASHBOARD COMPONENT)
// ══════════════════════════════════════════════════
const LiveClassHub = {
  active: false,
  courseId: null,
  startTime: null,
  worker: null,
  elapsed: 0,

  initWorker() {
    if (this.worker) return;
    const workerCode = `
      let timer;
      let start;
      self.onmessage = function(e) {
        if (e.data.cmd === 'start') {
          start = e.data.start;
          if (timer) clearInterval(timer);
          timer = setInterval(() => {
            self.postMessage({ cmd: 'tick', elapsed: Date.now() - start });
          }, 1000);
        } else if (e.data.cmd === 'stop') {
          clearInterval(timer);
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    this.worker.onmessage = (e) => {
      if (e.data.cmd === 'tick') {
        this.elapsed = e.data.elapsed;
        this.updateUI();
      }
    };
  },

  start(courseId) {
    this.active = true;
    this.courseId = courseId;
    this.startTime = Date.now();
    this.initWorker();
    this.worker.postMessage({ cmd: 'start', start: this.startTime });
    this.elapsed = 0;
    render();
    showToast('🚀 เริ่มบันทึกเวลาเรียนแล้ว');
  },

  stop() {
    if (!this.active) return;
    const durationMin = Math.round(this.elapsed / 60000);
    this.active = false;
    if (this.worker) this.worker.postMessage({ cmd: 'stop' });
    this.saveSession(durationMin);
    render();
  },

  updateUI() {
    const el = document.getElementById('live-timer-display');
    if (el) {
      const s = Math.floor(this.elapsed / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      el.textContent = `${h.toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    }
  },

  saveSession(min) {
    const c = findCourseById(this.courseId);
    openModal('📝 สรุปการเรียนวันนี้', `
      <div style="padding:10px;">
        <h3 style="margin-bottom:10px;">${c?.nameTh || 'ไม่ทราบวิชา'}</h3>
        <p style="font-size:14px; opacity:0.7; margin-bottom:20px;">บันทึกเวลาเรียนไป ${min} นาที</p>
        <div class="fg full">
          <label>สิ่งที่คุณได้เรียนรู้วันนี้ (Reflection)</label>
          <textarea id="liveReflection" class="glass-textarea" placeholder="วันนี้เรียนเรื่องอะไร? มีอะไรสำคัญ?..." style="height:120px;"></textarea>
        </div>
      </div>
    `, `
      <button class="btn-glass-primary full" onclick="LiveClassHub.finalSave()">💾 บันทึกความก้าวหน้า</button>
    `);
  },

  async finalSave() {
    const text = document.getElementById('liveReflection').value;
    if (text.length < 10) { showToast('⚠️ โปรดเขียนสรุปสั้นๆ (อย่างน้อย 10 ตัวอักษร)', 'warn'); return; }
    
    showToast('⏳ กำลังบันทึก...');
    const sessionData = {
        courseId: this.courseId,
        date: new Date().toISOString(),
        duration: Math.round(this.elapsed / 60000),
        reflection: text
    };
    await fsSet('reflections', `${this.courseId}_${Date.now()}`, sessionData);
    
    closeModal();
    showToast('✅ บันทึก Reflection สำเร็จ');
    this.courseId = null;
    render();
  }
};

window.LiveClassHub = LiveClassHub;

// ══════════════════════════════════════════════════
// 📄 PDF TRACEABILITY MANAGER
// ══════════════════════════════════════════════════
const PDFManager = {
  async generateTranscriptReport() {
    showToast("Generating Traceable PDF...", "wait");
    const data = {
      student: STUDENT,
      gpax: getCumGPA(),
      credits: getTotalPassedCredits(),
      courses: state.courses,
      timestamp: new Date().toISOString()
    };

    google.script.run
      .withSuccessHandler((res) => {
        if (res && res.success && res.id) {
          showToast("✅ PDF Generated Successfully. Downloading...", "ok");
          downloadFileViaProxy(res.id, `NITIPAT_TRANSCRIPT_${STUDENT.id}.pdf`);
        } else if (res && typeof res === 'string') {
          const match = res.match(/\/d\/(.*?)\//);
          const fileId = match ? match[1] : null;
          if (fileId) {
            showToast("✅ PDF Generated Successfully. Downloading...", "ok");
            downloadFileViaProxy(fileId, `NITIPAT_TRANSCRIPT_${STUDENT.id}.pdf`);
          } else {
            window.open(res, '_blank');
            showToast("PDF Generated Successfully", "ok");
          }
        } else {
          showToast("❌ PDF Generation Failed", "err");
        }
      })
      .withFailureHandler(() => showToast("PDF Generation Failed", "err"))
      .generateTraceablePDF(data);
  }
};

window.PDFManager = PDFManager;

function getCurrentSemester() {
  if (!state.semesters || state.semesters.length === 0) return null;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  
  // 1. Try to find an active semester covering today
  const active = state.semesters.find(s => dateStr >= s.start && dateStr <= s.end);
  if (active) return active;
  
  // 2. If today is between semesters, find the closest upcoming semester
  const upcoming = [...state.semesters]
    .filter(s => s.start > dateStr)
    .sort((a, b) => a.start.localeCompare(b.start));
  if (upcoming.length > 0) return upcoming[0];
  
  // 3. If all semesters have ended, fall back to the most recent semester that ended
  const ended = [...state.semesters]
    .filter(s => s.end < dateStr)
    .sort((a, b) => b.end.localeCompare(a.end));
  if (ended.length > 0) return ended[0];
  
  // 4. Ultimate fallback: last semester in array
  return state.semesters[state.semesters.length - 1];
}

