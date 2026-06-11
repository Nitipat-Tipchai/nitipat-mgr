const NotionHub = {
  async checkConnection() {
    showToast('⏳ กำลังตรวจสอบ Notion...');
    try {
      const res = await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).checkNotionConnection());
      if (res.success) {
        state.notionConnected = true;
        state.notionBotName = res.botName;
        localStorage.setItem('notion_bot_name', res.botName);
        showToast(`✅ เชื่อมต่อ Notion สำเร็จ: ${res.botName}`);
      } else {
        state.notionConnected = false;
        showToast(`❌ เชื่อมต่อล้มเหลว: ${res.error}`, 'err');
      }
      render();
    } catch (e) {
      console.error(e);
      showToast('❌ เกิดข้อผิดพลาดในการเรียก API', 'err');
    }
  },

  async sync(manual = false) {
    if (state.notionSyncing) return;
    state.notionSyncing = true;
    if (manual) showToast('🔄 เริ่มการซิงก์ข้อมูลกับ Notion...');
    render();

    try {
      // 0. Automatically clean up and deduplicate Semesters in Notion first!
      try {
        await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).cleanupDuplicateSemesters());
      } catch (err) {
        console.error("Error deduplicating semesters:", err);
      }

      // 1. Sync Courses (Subjects) in one batch
      const courses = Object.values(state.courses).flat();
      const coursesToSync = courses.filter(c => !c.notionPageId || !c.notionUrl || manual).map(course => {
        const sem = state.semesters.find(s => String(s.id) === String(course.semId));
        return {
          ...course,
          semesterName: sem ? sem.name : 'Unknown Semester'
        };
      });

      if (coursesToSync.length > 0) {
        try {
          const res = await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).syncCoursesToNotionBatch(coursesToSync));
          if (res && res.success && res.results) {
            for (const item of res.results) {
              if (item.success) {
                const localCourse = courses.find(c => c.id === item.id);
                if (localCourse) {
                  localCourse.notionPageId = item.pageId;
                  localCourse.notionUrl = item.url;
                  await fsUpd('courses', localCourse.id, { notionPageId: item.pageId, notionUrl: item.url });
                }
              } else {
                console.error(`Failed to batch sync course ${item.id}:`, item.error);
              }
            }
          }
        } catch (err) {
          console.error("Error in course batch sync:", err);
        }
      }

      // 2. Sync Assignments in one batch
      const assignments = Object.values(state.assignments).flat();
      const assignmentsToSync = assignments.filter(assign => !assign.notionPageId || (assign.updatedAt && assign.updatedAt > state.lastNotionSync)).map(assign => {
        const course = Object.values(state.courses).flat().find(c => String(c.id) === String(assign.courseId));
        return {
          ...assign,
          courseNotionPageId: course ? course.notionPageId : null
        };
      });
      
      if (assignmentsToSync.length > 0) {
        try {
          const res = await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).syncAssignmentsToNotionBatch(assignmentsToSync));
          if (res && res.success && res.results) {
            for (const item of res.results) {
              if (item.success) {
                const localAssign = assignments.find(a => a.id === item.id);
                if (localAssign) {
                  localAssign.notionPageId = item.pageId;
                  await fsUpd('assignments', localAssign.id, { notionPageId: item.pageId });
                }
              } else {
                console.error(`Failed to batch sync assignment ${item.id}:`, item.error);
              }
            }
          }
        } catch (err) {
          console.error("Error in assignment batch sync:", err);
        }
      }

      // 3. Sync Notebooks (Notion -> Google Drive)
      try {
        await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).syncNotebooksWithNotion());
      } catch (err) {
        console.error("Error syncing notebooks with Notion:", err);
      }

      // 4. Pull Updates from Notion (Assignments Database)
      try {
        const lastSync = manual ? null : state.lastNotionSync; // If manual sync, pull all updates!
        const updates = await new Promise((res, rej) => {
          google.script.run
            .withSuccessHandler(res)
            .withFailureHandler(rej)
            .fetchNotionUpdates(lastSync);
        });
        
        if (updates && updates.length > 0) {
          let pullCount = 0;
          for (const item of updates) {
            let assign = null;
            if (item.appId) {
              assign = Object.values(state.assignments).flat().find(a => a.id === item.appId);
            }
            if (!assign) {
              assign = Object.values(state.assignments).flat().find(a => a.notionPageId === item.notionPageId);
            }
            
            if (assign) {
              let changed = false;
              if (item.status && item.status !== (assign.submitted ? 'Done' : assign.status)) {
                assign.submitted = (item.status === 'Done');
                if (item.status !== 'Done') assign.status = item.status;
                changed = true;
              }
              if (item.title && item.title !== assign.title) {
                assign.title = item.title;
                changed = true;
              }
              if (item.deadline && item.deadline !== assign.dueDate) {
                assign.dueDate = item.deadline;
                changed = true;
              }
              
              if (changed) {
                await fsUpd('assignments', assign.id, {
                  submitted: assign.submitted,
                  status: assign.status || 'In Progress',
                  title: assign.title,
                  dueDate: assign.dueDate
                });
                pullCount++;
              }
            }
          }
          if (pullCount > 0 && manual) {
            showToast(`📥 ดึงข้อมูลอัปเดต ${pullCount} รายการจาก Notion เรียบร้อย!`);
          }
        }
      } catch (err) {
        console.error("Error pulling updates from Notion:", err);
      }

      state.lastNotionSync = new Date().toISOString();
      localStorage.setItem('last_notion_sync', state.lastNotionSync);
      state.notionConnected = true;
      
      if (manual) showToast('✅ ซิงก์ Notion สำเร็จ!');
    } catch (e) {
      console.error("Notion Sync Error:", e);
      if (manual) showToast('❌ การซิงก์ล้มเหลว', 'err');
    } finally {
      state.notionSyncing = false;
      render();
    }
  },

  async runSetupWizard() {
    const token = document.getElementById('notionTokenInput')?.value.trim();
    if (!token) return showToast('⚠️ กรุณาใส่ Token', 'err');
    
    showToast('⏳ กำลังเนรมิตฐานข้อมูล Notion...');
    try {
      const res = await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).initializeNotionWorkspace(token));
      if (res.success) {
        showToast(`✨ ${res.message}`);
        state.notionConnected = true;
        this.sync(true); // Run initial sync
      } else {
        showToast(`❌ ${res.error}`, 'err');
      }
    } catch (e) {
      showToast('❌ การตั้งค่าล้มเหลว', 'err');
    }
  },

  async setupTrigger() {
    try {
      const res = await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).setupNotionTrigger());
      if (res.success) showToast(`✅ ${res.message}`);
    } catch (e) {
      showToast('❌ ไม่สามารถเปิด Auto-Sync ได้', 'err');
    }
  },

  async pushReflection(courseId, text) {
    const course = findCourseById(courseId);
    if (!course || !course.notionPageId) return;
    
    try {
      await new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).syncReflectionToNotion(course.notionPageId, text));
      showToast('📤 ส่ง Reflection ไปยัง Notion แล้ว');
    } catch (e) {
      console.error("Reflection sync failed", e);
    }
  },

  async forceResetSync() {
    if (!confirm("⚠️ คำเตือน: ระบบจะล้างรหัสประวัติการซิงก์วิชาและการบ้านเดิมทั้งหมดในฐานข้อมูล Firestore เพื่อบังคับให้วิชาเรียนและการบ้านทั้งหมดในแอปถูกส่งขึ้นไปสร้างใหม่ในฐานข้อมูล Notion ชุดใหม่โดยสมบูรณ์nnการกระทำนี้จะช่วยแก้ปัญหากรณีฐานข้อมูลบน Notion โดนสร้างใหม่แล้วแอปยังจำค่า ID เก่าnnคุณต้องการบังคับซิงก์ใหม่ทั้งหมดตอนนี้หรือไม่?")) {
      return;
    }
    
    showToast("⏳ กำลังเตรียมการล้างประวัติการซิงก์เดิม...");
    try {
      const courses = Object.values(state.courses).flat();
      for (const course of courses) {
        course.notionPageId = null;
        course.notionUrl = null;
        await fsUpd('courses', course.id, { notionPageId: null, notionUrl: null });
      }
      
      const assignments = Object.values(state.assignments).flat();
      for (const assign of assignments) {
        assign.notionPageId = null;
        await fsUpd('assignments', assign.id, { notionPageId: null });
      }
      
      const exams = Object.values(state.exams).flat();
      for (const exam of exams) {
        exam.notionPageId = null;
        await fsUpd('exams', exam.id, { notionPageId: null });
      }
      
      state.lastNotionSync = null;
      localStorage.removeItem('last_notion_sync');
      
      showToast("🔄 ล้างค่าเชื่อมโยงเดิมสำเร็จ! กำลังอัปโหลดวิชาเรียนและการบ้านชุดใหม่ทั้งหมดขึ้น Notion...");
      await this.sync(true);
    } catch (e) {
      console.error("Force Re-Sync Error:", e);
      showToast("❌ การบังคับซิงก์ใหม่ล้มเหลว", "err");
    }
  }
};

window.NotionHub = NotionHub;

// ── Google Calendar Sync Frontend Integration ──
window.syncToGoogleCalendar = function() {
  showToast('⏳ กำลังซิงค์ข้อมูลกับ Google Calendar...');
  
  const exams = Object.values(state.exams || {}).flat();
  const assignments = Object.values(state.assignments || {}).flat();
  const courses = Object.values(state.courses || []).filter(c => !c.isArchived);

  const payload = {
    exams: exams,
    assignments: assignments,
    courses: courses
  };

  google.script.run
    .withSuccessHandler(res => {
      if (res && res.success) {
        showToast('✅ ' + res.message);
      } else {
        showToast('❌ ' + (res.error || 'การซิงค์ล้มเหลว'), 'err');
      }
    })
    .withFailureHandler(err => {
      showToast('❌ เกิดข้อผิดพลาด: ' + err.message, 'err');
    })
    .syncAcademicMilestonesToCalendar(payload);
};

