// ══════════════════════════════════════════════════
// CONFETTI
// ══════════════════════════════════════════════════
function triggerConfetti() {
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `left:${Math.random() * 100}vw;background:hsl(${Math.random() * 360},90%,60%);animation-duration:${0.8 + Math.random()}s;animation-delay:${Math.random() * 0.5}s;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}



// Course Hub functions have been moved up and integrated with the hierarchical system.

async function setAttendanceStatus(courseId, status, skipGPS = false) {
  const c = findCourseById(courseId);
  let distMeters = null;

  const recordAttendance = async (finalStatus) => {
    const now = new Date();
    const dateKey = now.toLocaleDateString('en-CA');
    state.attendanceHistory[courseId] = state.attendanceHistory[courseId] || {};
    state.attendanceHistory[courseId][dateKey] = { status: finalStatus, timestamp: now.toISOString(), distanceMeters: distMeters };
    localStorage.setItem('attendance_history', JSON.stringify(state.attendanceHistory));
    showToast(`✅ บันทึกสถานะ [${finalStatus}] แล้ว`);
    render();
    if (typeof renderCourseHub === 'function' && document.getElementById('hubModal')) {
      renderCourseHub(courseId);
    }
    try {
      await fsSet('attendance_history', courseId, { history: state.attendanceHistory[courseId] });
    } catch (e) { console.warn("Firebase att sync failed", e); }
  };

  if (skipGPS || status.includes('Online') || status.includes('ขาดเรียน') || !c?.targetCoords) {
    if (!skipGPS && !confirm(`ต้องการเช็คชื่อสถานะ [${status}] ของวิชานี้ใช่หรือไม่?`)) return;
    await recordAttendance(status);
    return;
  }

  // Open modal with map
  openModal('📍 ตรวจสอบตำแหน่งเช็คชื่อ', `
    <div style="text-align:center; padding:10px;">
      <p id="gpsStatusText" style="font-weight:bold; margin-bottom:10px;">⏳ กำลังค้นหาตำแหน่ง GPS ของคุณ...</p>
      <div id="checkinMap" style="height: 250px; width: 100%; border-radius: 8px; border: 1px solid var(--border); background: #f0f0f0;"></div>
      <div id="checkinActions" style="margin-top:15px; display:none;"></div>
    </div>
  `);

  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, enableHighAccuracy: true })
    );
    const { latitude: lat, longitude: lon } = pos.coords;
    const [tLat, tLon] = c.targetCoords.split(',').map(Number);
    const dist = getDistance(lat, lon, tLat, tLon);
    distMeters = Math.round(dist);

    const isInside = dist <= 500;

    document.getElementById('gpsStatusText').innerHTML = `
      คุณอยู่ห่างจากห้องเรียน <strong>${distMeters} เมตร</strong><br>
      <span style="color:${isInside ? '#10b981' : '#ef4444'}; font-size:14px;">
        ${isInside ? '✅ อยู่ในรัศมีที่กำหนด (500ม.)' : '❌ นอกรัศมีที่กำหนด (500ม.)'}
      </span>
    `;

    setTimeout(() => {
      const mapEl = document.getElementById('checkinMap');
      if (mapEl && typeof L !== 'undefined') {
        const map = L.map('checkinMap').setView([lat, lon], 16);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        L.marker([lat, lon]).addTo(map).bindPopup('📍 ตำแหน่งของคุณ').openPopup();
        L.circle([tLat, tLon], {
          color: 'var(--primary)',
          fillColor: 'var(--primary)',
          fillOpacity: 0.2,
          radius: 500
        }).addTo(map).bindPopup('🏫 ห้องเรียน');

        map.fitBounds(L.latLngBounds([[lat, lon], [tLat, tLon]]), { padding: [20, 20] });
      }
    }, 200);

    const actionDiv = document.getElementById('checkinActions');
    actionDiv.style.display = 'flex';
    actionDiv.style.flexDirection = 'column';
    actionDiv.style.gap = '10px';

    if (isInside) {
      actionDiv.innerHTML = `
        <button class="btn-pastel-primary full" id="confirmCheckinBtn" style="border-radius:10px;">✅ ยืนยันการเช็คชื่อเข้าเรียน</button>
      `;
      document.getElementById('confirmCheckinBtn').onclick = async () => {
        closeModal();
        await recordAttendance(status);
      };
    } else {
      actionDiv.innerHTML = `
        <p style="font-weight:700; margin:0; text-align:left;">กรุณาระบุเหตุผลเพื่อความโปร่งใส:</p>
        <textarea id="outOfGeofenceReason" class="glass-input full" placeholder="ทำไมถึงเช็คชื่อนอกบริเวณนี้? (เช่น ติดธุระ, เปลี่ยนห้องเรียน)" style="height:60px; border-radius:10px; font-size:12px; padding:10px; resize:none;"></textarea>
        <button class="btn-pastel-primary full" id="confirmCheckinBtn" style="border-radius:10px;">💾 ส่งเหตุผลและเช็คชื่อ</button>
      `;
      document.getElementById('confirmCheckinBtn').onclick = async () => {
        const reason = document.getElementById('outOfGeofenceReason').value.trim();
        if (!reason) return showToast('⚠️ กรุณาระบุเหตุผล', 'err');
        closeModal();
        await recordAttendance(`${status} (นอกพื้นที่: ${reason})`);
      };
    }

  } catch (err) {
    document.getElementById('gpsStatusText').innerHTML = `<span style="color:#ef4444;">⚠️ ไม่สามารถเข้าถึง GPS ได้ (${err.message})</span>`;
    document.getElementById('checkinMap').style.display = 'none';
    const actionDiv = document.getElementById('checkinActions');
    actionDiv.style.display = 'flex';
    actionDiv.style.flexDirection = 'column';
    actionDiv.style.gap = '10px';
    actionDiv.innerHTML = `
      <p style="font-weight:700; margin:0; text-align:left;">ระบุเหตุผลเพื่อเช็คชื่อแบบแมนนวล:</p>
      <textarea id="outOfGeofenceReason" class="glass-input full" placeholder="เหตุผลที่ระบบดึงพิกัดไม่ได้ (เช่น ไม่มีสัญญาณ, ไม่ได้เปิดพิกัด)" style="height:60px; border-radius:10px; font-size:12px; padding:10px; resize:none;"></textarea>
      <button class="btn-pastel-primary full" id="confirmCheckinBtn" style="border-radius:10px;">💾 เช็คชื่อแมนนวลพร้อมเหตุผล</button>
    `;
    document.getElementById('confirmCheckinBtn').onclick = async () => {
      const reason = document.getElementById('outOfGeofenceReason').value.trim();
      if (!reason) return showToast('⚠️ กรุณาระบุเหตุผล', 'err');
      closeModal();
      await recordAttendance(`${status} (ระบุแมนนวล: ${reason})`);
    };
  }
}

window.submitCustomCheckinReason = async function(courseId, status) {
  const reasonText = document.getElementById('outOfGeofenceReason')?.value.trim();
  if (!reasonText) {
    showToast('⚠️ กรุณากรอกเหตุผลก่อนทำการเช็คชื่อ', 'err');
    return;
  }
  closeModal();
  const finalStatus = `${status} (นอกพื้นที่: ${reasonText})`;
  await setAttendanceStatus(courseId, finalStatus, true);
};

function promptAbsenceReason(courseId) {
  const reason = prompt("กรุณาระบุเหตุผลที่ขาดเรียน (เช่น เจ็บป่วย, ลากิจ, อื่นๆ):");
  if (reason === null) return;
  const status = reason.trim() === "" ? "ขาดเรียน" : `ขาดเรียน (${reason.trim()})`;
  setAttendanceStatus(courseId, status, true);
}

