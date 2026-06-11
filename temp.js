// Global variables for the new schedule view
window.activeScheduleView = window.activeScheduleView || 'weekly';
window.activeScheduleDay = window.activeScheduleDay || new Date().getDay(); // 0 is Sunday, 1 is Monday

function renderSchedule() {
  const daysShort = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const dayColors = {
    1: 'from-yellow-400 to-yellow-600', // Monday
    2: 'from-pink-400 to-pink-600',     // Tuesday
    3: 'from-emerald-400 to-emerald-600', // Wednesday
    4: 'from-orange-400 to-orange-600', // Thursday
    5: 'from-cyan-400 to-cyan-600',     // Friday
    6: 'from-purple-400 to-purple-600', // Saturday
    0: 'from-red-400 to-red-600',       // Sunday
  };
  
  const curSem = state.selectedSemester ? state.semesters.find(s => s.id === state.selectedSemester) : (getCurrentSemester() || state.semesters[state.semesters.length - 1]);
  const courses = curSem ? (state.courses[curSem.id] || []) : [];

  let html = `<div class="page-wrap text-slate-100" style="font-family: 'Inter', 'Sarabun', sans-serif;">
    
    <!-- Premium Header -->
    <header class="max-w-7xl mx-auto mb-6 no-print">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl shadow-slate-900/50">
            <div>
                <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">Smart Class Schedule</h1>
                <p class="text-slate-400 text-sm mt-1 font-medium"><i class="fas fa-graduation-cap mr-2"></i>${STUDENT?.nameTh || 'Student'} • ${STUDENT?.id || ''}</p>
            </div>
            
            <div class="flex flex-wrap items-center gap-3">
                <select id="schedSemFilter" class="bg-slate-800/80 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all" onchange="state.selectedSemester=this.value; render();">
                    <option value="">— All Terms —</option>
                    ${state.semesters.map(s => `<option value="${s.id}" ${curSem?.id === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
                
                <div class="flex bg-slate-800/80 rounded-lg p-1 border border-slate-700">
                    <button onclick="window.activeScheduleView='weekly'; render();" class="${window.activeScheduleView === 'weekly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'} px-4 py-1.5 rounded-md text-sm font-medium transition-all"><i class="fas fa-calendar-week mr-1.5"></i>สัปดาห์</button>
                    <button onclick="window.activeScheduleView='daily'; render();" class="${window.activeScheduleView === 'daily' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'} px-4 py-1.5 rounded-md text-sm font-medium transition-all"><i class="fas fa-calendar-day mr-1.5"></i>รายวัน</button>
                </div>
                
                <button id="exportSchedBtn" class="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2">
                    <i class="fas fa-camera"></i> Save
                </button>
                <button onclick="openEditCourseModal()" class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2">
                    <i class="fas fa-plus"></i> เพิ่มรายวิชา
                </button>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 print-container" id="timetable">
  `;

  // --- WEEKLY VIEW ---
  if (window.activeScheduleView === 'weekly') {
    html += `
        <!-- Weekly Grid -->
        <div class="lg:col-span-4 bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl overflow-hidden flex flex-col p-4">
            <div class="overflow-x-auto pb-4 custom-scrollbar">
                <div class="min-w-[900px]">
                    <div class="grid grid-cols-13 gap-2 text-center text-xs font-semibold text-slate-400 mb-2">
                        <div class="col-span-1"></div>
                        ${Array.from({length: 12}, (_, i) => `<div class="col-span-1 bg-slate-800/50 py-2 rounded-lg border border-slate-700/50">${8 + i}:00</div>`).join('')}
                    </div>
    `;

    // Render each day (1 to 6, then 0)
    const displayDays = [1, 2, 3, 4, 5, 6, 0]; 
    displayDays.forEach(dayIndex => {
      const dayCourses = courses.filter(c => (c.schedules || []).some(s => s.day === dayIndex));
      const now = new Date();
      const isToday = now.getDay() === dayIndex;

      html += `
          <div class="relative grid grid-cols-13 gap-2 mb-2 items-center min-h-[60px] group transition-all">
              <!-- Day Label -->
              <div class="col-span-1 h-full flex flex-col justify-center items-center rounded-xl font-bold text-sm bg-gradient-to-br ${dayColors[dayIndex]} text-white shadow-lg relative overflow-hidden ${isToday ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-90 group-hover:opacity-100'}">
                  ${thaiDays[dayIndex]}
                  ${isToday ? '<div class="absolute inset-0 bg-white/20 animate-pulse"></div>' : ''}
              </div>
              
              <!-- Timeline Grid background -->
              <div class="col-span-12 absolute inset-0 left-[7.69%] grid grid-cols-12 gap-2 pointer-events-none">
                  ${Array.from({length: 12}, () => `<div class="border-l border-slate-800/50 h-full"></div>`).join('')}
              </div>
      `;

      // Render courses for this day
      if (dayCourses.length > 0) {
        dayCourses.forEach(c => {
          (c.schedules || []).filter(s => s.day === dayIndex).forEach(s => {
            // Grid layout calculation
            const startCol = s.startHour - 8 + 2; // +1 because col 1 is day label, +1 for 1-based index
            const span = s.endHour - s.startHour;
            const currentHour = now.getHours() + (now.getMinutes() / 60);
            const isActive = isToday && currentHour >= s.startHour && currentHour < s.endHour;
            
            html += `
                <div class="absolute top-1 bottom-1 rounded-xl p-2 cursor-pointer shadow-lg transition-all duration-300 hover:scale-[1.02] hover:z-10 group/card overflow-hidden" 
                     style="left: calc(${(s.startHour - 8) / 12 * 100}% + 7.69%); width: calc(${span / 12 * 100}% - 8px); background-color: ${c.color}20; border: 1px solid ${c.color}60; ${isActive ? 'box-shadow: 0 0 15px ' + c.color + '40;' : ''}"
                     onclick="renderCourseHub('${c.id}')">
                     
                     <!-- Active indicator -->
                     ${isActive ? `<div class="absolute top-0 right-0 w-2 h-full bg-[${c.color}] animate-pulse"></div>` : ''}
                     ${isActive ? `<div class="absolute top-2 right-2 w-2 h-2 rounded-full animate-ping" style="background-color: ${c.color};"></div><div class="absolute top-2 right-2 w-2 h-2 rounded-full" style="background-color: ${c.color};"></div>` : ''}
                     
                    <div class="font-bold text-sm truncate" style="color: ${c.color}">${c.code}</div>
                    <div class="text-xs text-slate-200 font-medium truncate mt-0.5">${c.nameTh}</div>
                    <div class="text-[10px] text-slate-400 flex items-center mt-1 gap-1 truncate"><i class="fas fa-map-marker-alt"></i> ${c.room || 'ไม่ระบุ'}</div>
                </div>
            `;
          });
        });
      } else {
        html += `<div class="col-span-12 h-full flex items-center justify-center text-slate-600 text-xs italic bg-slate-800/20 rounded-xl border border-slate-800/50">ว่าง</div>`;
      }

      html += `</div>`;
    });

    html += `
                </div>
            </div>
        </div>
    `;
  } else {
    // --- DAILY VIEW ---
    html += `
        <!-- Daily Sidebar -->
        <div class="lg:col-span-1 flex flex-col gap-3">
            ${[1, 2, 3, 4, 5, 6, 0].map(dayIndex => {
                const dayCoursesCount = courses.filter(c => (c.schedules || []).some(s => s.day === dayIndex)).length;
                const isSelected = window.activeScheduleDay === dayIndex;
                const isToday = new Date().getDay() === dayIndex;
                
                return `
                <button onclick="window.activeScheduleDay=${dayIndex}; render();" class="flex items-center justify-between p-4 rounded-xl border transition-all ${isSelected ? `bg-gradient-to-r ${dayColors[dayIndex]} text-white border-transparent shadow-lg transform scale-105` : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800'}">
                    <div class="flex items-center gap-3">
                        <div class="w-2 h-8 rounded-full ${isSelected ? 'bg-white' : `bg-gradient-to-b ${dayColors[dayIndex]}`}"></div>
                        <div class="text-left">
                            <div class="font-bold">${thaiDays[dayIndex]}</div>
                            ${isToday ? '<div class="text-xs opacity-80">วันนี้</div>' : ''}
                        </div>
                    </div>
                    <div class="${isSelected ? 'bg-white/20' : 'bg-slate-800'} px-2.5 py-1 rounded-full text-xs font-bold">
                        ${dayCoursesCount} วิชา
                    </div>
                </button>
                `;
            }).join('')}
        </div>

        <!-- Daily Details -->
        <div class="lg:col-span-3 bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl p-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl ${dayColors[window.activeScheduleDay]} opacity-5 rounded-bl-full pointer-events-none"></div>
            
            <h2 class="text-2xl font-bold text-white border-b border-slate-800 pb-4 mb-6 flex items-center gap-3">
                <i class="fas fa-calendar-day text-blue-400"></i> ตารางเรียนวัน${thaiDays[window.activeScheduleDay]}
            </h2>
            
            <div class="flex flex-col gap-4 relative">
                <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-800"></div>
    `;

    const activeDayCourses = courses.flatMap(c => {
        return (c.schedules || []).filter(s => s.day === window.activeScheduleDay).map(s => ({...c, scheduleInfo: s}));
    }).sort((a, b) => a.scheduleInfo.startHour - b.scheduleInfo.startHour);

    if (activeDayCourses.length > 0) {
        activeDayCourses.forEach(c => {
            html += `
                <div class="flex gap-6 relative z-10 items-start group">
                    <div class="w-16 flex-shrink-0 text-right pt-4">
                        <div class="text-sm font-bold text-slate-300">${c.scheduleInfo.startHour}:00</div>
                        <div class="text-xs text-slate-500">${c.scheduleInfo.endHour}:00</div>
                    </div>
                    <div class="relative pt-4">
                        <div class="w-4 h-4 rounded-full border-4 border-slate-900 absolute left-[-26px] top-5 transition-transform group-hover:scale-150" style="background-color: ${c.color}"></div>
                    </div>
                    <div class="flex-grow bg-slate-800/40 hover:bg-slate-800/80 transition-all border border-slate-700/50 rounded-xl p-5 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1" style="border-left: 4px solid ${c.color};" onclick="renderCourseHub('${c.id}')">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <span class="px-2 py-1 rounded bg-slate-900/50 text-xs font-bold mr-2 border border-slate-700" style="color: ${c.color}">${c.code}</span>
                                <span class="text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded border border-slate-700">${c.credit} หน่วยกิต</span>
                            </div>
                            <button onclick="event.stopPropagation(); openEditCourseModal('${c.id}')" class="text-slate-500 hover:text-blue-400 transition-colors w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                        <h3 class="text-lg font-bold text-white mb-1">${c.nameTh}</h3>
                        <div class="text-sm text-slate-400 mb-3">${c.nameEn || ''}</div>
                        <div class="flex flex-wrap gap-4 text-sm text-slate-300">
                            <div class="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700">
                                <i class="fas fa-map-marker-alt text-rose-400"></i> ${c.room || 'ไม่ระบุ'}
                            </div>
                            <div class="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700">
                                <i class="fas fa-user-tie text-blue-400"></i> ${c.instructor || '-'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        html += `
            <div class="flex flex-col items-center justify-center py-16 text-center z-10">
                <div class="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <i class="fas fa-bed text-4xl text-slate-600"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-300 mb-2">ไม่มีเรียนในวันนี้</h3>
                <p class="text-slate-500">พักผ่อนให้เต็มที่ หรือทบทวนบทเรียนล่วงหน้า</p>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;
  }

  // --- SUBJECT LIST SECTION ---
  html += `
    <!-- Subject Summary Cards -->
    <div class="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        <div class="col-span-full border-b border-slate-800 pb-2 mb-2 flex justify-between items-center">
            <h2 class="text-xl font-bold text-white"><i class="fas fa-book-open text-emerald-400 mr-2"></i> รายวิชาในภาคเรียนนี้ (${courses.length})</h2>
        </div>
        ${courses.map(c => `
            <div class="bg-slate-900/40 border border-slate-800 rounded-xl p-4 hover:bg-slate-800/60 transition-all cursor-pointer flex gap-4 items-center group" onclick="renderCourseHub('${c.id}')">
                <div class="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg shadow-inner group-hover:scale-110 transition-transform" style="background-color: ${c.color}20; color: ${c.color}; border: 1px solid ${c.color}40">
                    ${c.code.substring(0, 2)}
                </div>
                <div class="flex-grow overflow-hidden">
                    <div class="text-xs font-mono mb-1" style="color: ${c.color}">${c.code}</div>
                    <div class="text-sm font-bold text-white truncate">${c.nameTh}</div>
                    <div class="text-xs text-slate-400 truncate mt-0.5"><i class="fas fa-user-tie text-slate-500 mr-1"></i> ${c.instructor || '-'}</div>
                </div>
            </div>
        `).join('')}
    </div>
  `;

  html += `
    </main>
  </div>`;
  
  return html;
}
