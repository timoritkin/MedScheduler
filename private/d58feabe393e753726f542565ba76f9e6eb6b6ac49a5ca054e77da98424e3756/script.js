const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzysyyKVJR6v9syKiw9rZetenWhWWn2Hy6YZF5qAQr9864_ABGbXR8VlHY8pQEqlGE_2g/exec";

const WA_SVG = `<svg class="wa-icon" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

let allPatients = [];
let sortAsc = true;

/* ══════════════════════════════
   TAB SWITCHING
══════════════════════════════ */
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('page-' + tab).classList.add('active');
  if (tab === 'dashboard') loadData();
  if (tab === 'return') loadReturnData();
}

/* ══════════════════════════════
   FORM
══════════════════════════════ */
function copyField(id) {
  const input = document.getElementById(id);
  const value = input.value.trim();
  if (!value) return;
  navigator.clipboard.writeText(value).then(() => {
    const btn = input.parentElement.querySelector('.copy-btn');
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 1800);
  });
}

function submitForm() {
  const fields = {
    name:    document.getElementById("name").value.trim(),
    surname: document.getElementById("surname").value.trim(),
    phone:   document.getElementById("phone").value.trim(),
    date:    document.getElementById("date").value,
    time:    document.getElementById("time").value,
  };

  if (Object.values(fields).some(v => !v)) {
    showFormMsg("⚠️ יש למלא את כל השדות", "error");
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = "⏳ שולח...";

  const params = new URLSearchParams(fields);
  fetch(SCRIPT_URL + "?" + params.toString(), { method: "GET", mode: "no-cors" })
    .then(() => {
      showFormMsg("✅ הנתונים נשלחו בהצלחה!", "success");
      document.querySelectorAll(".form-input").forEach(i => i.value = "");
    })
    .catch(err => showFormMsg("❌ שגיאה: " + err.message, "error"))
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "📤 שלח לגיליון Google";
    });
}

function showFormMsg(text, type) {
  const msg = document.getElementById("formMessage");
  msg.textContent = text;
  msg.className = type;
  msg.style.display = "block";
  setTimeout(() => { msg.className = ""; msg.style.display = "none"; }, 5000);
}

/* ══════════════════════════════
   DASHBOARD
══════════════════════════════ */
async function loadData() {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('spinning');
  try {
    // Google Apps Script requires redirect following — use no-cors won't work for reading.
    // Use a proxy-friendly approach: append callback timestamp to bust cache
    const url = SCRIPT_URL + '?action=getData&t=' + Date.now();
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
    });
    const text = await res.text();
    // Apps Script sometimes wraps in HTML on error
    if (text.trim().startsWith('<')) {
      showError('שגיאה בתשובה מ-Apps Script. וודא שה-deployment עודכן ל-New version.');
      return;
    }
    const json = JSON.parse(text);
    renderCards(json.data || []);
    hideError();
  } catch(e) {
    showError('לא ניתן לטעון נתונים: ' + e.message);
  } finally {
    btn.classList.remove('spinning');
  }
}

function renderCards(patients) {
  allPatients = patients;
  updateStats(patients);
  displayCards(patients);
}

function parseDate(dateStr) {
  if (!dateStr) return new Date(0);
  const p = dateStr.split('/');
  if (p.length === 3) return new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
  return new Date(dateStr);
}

function normalizeDateForSubmit(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const p = dateStr.split('/');
  if (p.length === 3) {
    const day = p[0].padStart(2, '0');
    const month = p[1].padStart(2, '0');
    const year = p[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

function toDisplayDate(dateStr) {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const p = dateStr.split('-');
    return `${p[2]}/${p[1]}/${p[0]}`;
  }
  return dateStr;
}

function formatPhoneForWhatsApp(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return '972' + digits.slice(1);
  return digits;
}

function displayCards(patients) {
  const grid = document.getElementById('grid');
  if (!patients || patients.length === 0) {
    grid.innerHTML = '<div class="state-box"><div class="big-icon">📭</div><h3>אין תורים להצגה</h3><p>הגיליון ריק או שכל התורים עברו</p></div>';
    return;
  }

  // Group by date
  const groups = {};
  patients.forEach(p => {
    const key = p.date || 'ללא תאריך';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  // Sort dates ascending
  const sortedDates = Object.keys(groups).sort((a, b) => parseDate(a) - parseDate(b));

  // Sort patients by time within each group
  sortedDates.forEach(date => {
    groups[date].sort((a, b) => (a.time||'').localeCompare(b.time||''));
  });

  let html = '';
  let idx = 0;

  sortedDates.forEach(date => {
    const count = groups[date].length;
    html += '<div class="date-group-header">' +
      '<div class="date-group-line"></div>' +
      '<div class="date-group-label">' +
        '<span class="date-group-icon">📅</span>' +
        date +
        '<span class="date-group-count">' + count + ' מטופלים</span>' +
      '</div>' +
      '<div class="date-group-line"></div>' +
    '</div>';

    groups[date].forEach(p => {
      const initials = ((p.name||'?')[0] + (p.surname||'?')[0]).toUpperCase();
      const waPhone = formatPhoneForWhatsApp(p.phone);
      const waLink1 = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent(p.message1||'');
      const waLink2 = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent(p.message2||'');
      const cardId = 'card-' + idx;
      const esc = (s) => s.replace(/'/g, "\\'");
      html += '<div class="patient-card" style="animation-delay:' + (idx*0.04) + 's" id="' + cardId + '">' +
        '<div class="card-top">' +
          '<div class="patient-info">' +
            '<div class="avatar">' + initials + '</div>' +
            '<div>' +
              '<div class="patient-name">' + p.name + ' ' + p.surname + '</div>' +
              '<div class="patient-phone">' + p.phone + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<div class="time-badge">⏰ ' + p.time + '</div>' +
            '<button class="change-datetime-btn" onclick="changePatientDateTime(\'' + cardId + '\',\'' + esc(p.name) + '\',\'' + esc(p.surname || '') + '\',\'' + esc(p.phone) + '\',\'' + esc(p.date) + '\',\'' + esc(p.time || '') + '\')" title="שנה תאריך ושעה">🗓️</button>' +
            '<button class="delete-btn" onclick="deletePatient(\'' + cardId + '\',\'' + esc(p.name) + '\',\'' + esc(p.phone) + '\',\'' + esc(p.date) + '\')" title="מחק מטופל">🗑️</button>' +
          '</div>' +
        '</div>' +
        '<div class="card-meta">' +
          '<div class="meta-item">📅 ' + p.date + '</div>' +
          '<div class="meta-item">📞 ' + p.phone + '</div>' +
        '</div>' +
        '<div class="card-actions">' +
          '<a href="' + waLink1 + '" target="_blank" class="wa-btn wa-btn-1">' + WA_SVG + ' הודעה ראשונה</a>' +
          '<a href="' + waLink2 + '" target="_blank" class="wa-btn wa-btn-2">' + WA_SVG + ' תזכורת</a>' +
        '</div>' +
      '</div>';
      idx++;
    });
  });

  grid.innerHTML = html;
}

async function deletePatient(cardId, name, phone, date) {
  if (!confirm('למחוק את ' + name + '?')) return;

  const card = document.getElementById(cardId);
  card.style.opacity = '0.4';
  card.style.pointerEvents = 'none';

  const params = new URLSearchParams({ action: 'deleteRow', name, phone, date });
  fetch(SCRIPT_URL + '?' + params.toString(), { method: 'GET', mode: 'no-cors' })
    .then(() => {
      card.style.transition = 'all 0.4s';
      card.style.transform = 'scale(0.9)';
      card.style.opacity = '0';
      setTimeout(() => {
        card.remove();
        allPatients = allPatients.filter(p => !(p.name === name && p.phone === phone));
        updateStats(allPatients);
      }, 400);
    })
    .catch(() => {
      card.style.opacity = '1';
      card.style.pointerEvents = 'auto';
      alert('שגיאה במחיקה, נסה שוב');
    });
}

async function changePatientDateTime(cardId, name, surname, phone, currentDate, currentTime) {
  const currentDateForInput = toDisplayDate(currentDate);
  const newDate = prompt('הכנס תאריך חדש (dd/mm/yyyy):', currentDateForInput);

  if (newDate === null) return;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(newDate.trim())) {
    alert('פורמט תאריך לא תקין. יש להזין dd/mm/yyyy');
    return;
  }

  const newTime = prompt('הכנס שעה חדשה (HH:MM):', (currentTime || '').trim());

  if (newTime === null) return;
  if (!/^\d{2}:\d{2}$/.test(newTime.trim())) {
    alert('פורמט שעה לא תקין. יש להזין HH:MM');
    return;
  }

  const trimmedDate = newDate.trim();
  const trimmedTime = newTime.trim();
  if (trimmedDate === currentDateForInput && trimmedTime === (currentTime || '').trim()) return;

  const card = document.getElementById(cardId);
  if (card) {
    card.style.opacity = '0.5';
    card.style.pointerEvents = 'none';
  }

  try {
    const addParams = new URLSearchParams({
      name,
      surname,
      phone,
      date: normalizeDateForSubmit(trimmedDate),
      time: trimmedTime
    });

    await fetch(SCRIPT_URL + '?' + addParams.toString(), {
      method: 'GET',
      mode: 'no-cors'
    });

    const deleteParams = new URLSearchParams({ action: 'deleteRow', name, phone, date: currentDate });
    await fetch(SCRIPT_URL + '?' + deleteParams.toString(), {
      method: 'GET',
      mode: 'no-cors'
    });

    await loadData();
    alert('התור עודכן בהצלחה');
  } catch (e) {
    if (card) {
      card.style.opacity = '1';
      card.style.pointerEvents = 'auto';
    }
    alert('לא ניתן לעדכן תור כרגע, נסה שוב');
  }
}

function updateStats(p) {
  document.getElementById('statTotal').textContent = p.length;
  document.getElementById('statDates').textContent = new Set(p.map(x => x.date)).size;
  document.getElementById('statMsg').textContent = p.length * 2;
}

function filterCards() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  displayCards(allPatients.filter(p =>
    (p.name+' '+p.surname+' '+p.phone+' '+p.date).toLowerCase().includes(q)
  ));
}

function toggleSort() {
  sortAsc = !sortAsc;
  const btn = document.getElementById('sortBtn');
  btn.classList.add('active');
  btn.textContent = sortAsc ? '⏰ מיין לפי שעה ↑' : '⏰ מיין לפי שעה ↓';
  displayCards([...allPatients].sort((a,b) =>
    sortAsc ? (a.time||'').localeCompare(b.time||'') : (b.time||'').localeCompare(a.time||'')
  ));
}

function showError(msg) {
  const el = document.getElementById('errorBanner');
  el.textContent = '⚠️ ' + msg;
  el.style.display = 'block';
}

function hideError() {
  document.getElementById('errorBanner').style.display = 'none';
}

// Auto-refresh every 60 seconds when dashboard is active
setInterval(() => {
  if (document.getElementById('page-dashboard').classList.contains('active')) loadData();
}, 60000);
/* ══════════════════════════════
   RETURN CALL
══════════════════════════════ */
const RETURN_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxa_z-qUKWRtfvo_kLBBtTkWzVrVdN0thi35dNGgGm2FVltsQyQbn94Wcfxli2VWllXcg/exec"; // 👈 הכנס כאן את ה-URL של הסקריפט השני

const RETURN_MESSAGE =
  'שלום,\n' +
  'פניתם לקביעת תורים לד"ר אזרוב נינה, מומחית רפואת ריאות, דרך כללית מושלם.\n' +
  'מצטערים שלא הצלחנו לענות לשיחה שלך קודם.\n' +
  'תוכל/י לקבוע תור בכמה דרכים:\n' +
  '✅ להמשיך להתכתב איתנו כאן בוואטסאפ ונטפל בקביעת התור\n\n' +
  '📞 אם מעדיפים שנחזור אליכם טלפונית - אנא ציינו זאת בהודעה\n\n' +
  '💻 להיכנס לאתר האינטרנט ולקבוע תור בעצמכם:\n' +
  'https://www.doctorim.co.il/s/doctor-809/%D7%93%D7%A8-%D7%A0%D7%99%D7%A0%D7%94-%D7%90%D7%96%D7%A8%D7%95%D7%91/%D7%9E%D7%97%D7%9C%D7%95%D7%AA-%D7%A8%D7%99%D7%90%D7%94\n\n' +
  'נשמח לעזור! 🙏';

let allReturnData = [];
let returnSentCount = 0;

async function loadReturnData() {
  const grid = document.getElementById('returnGrid');
  grid.innerHTML = '<div class="state-box"><div class="spinner"></div><h3>טוען נתונים...</h3></div>';

  try {
    const res = await fetch(RETURN_SCRIPT_URL + "?action=getData");
    const json = await res.json();
    allReturnData = json.data || [];
    document.getElementById('returnTotal').textContent = allReturnData.length;
    displayReturnCards(allReturnData);
    document.getElementById('returnErrorBanner').style.display = 'none';
  } catch(e) {
    document.getElementById('returnErrorBanner').textContent = '⚠️ לא ניתן לטעון נתונים. וודא שה-URL נכון ושה-deployment עודכן.';
    document.getElementById('returnErrorBanner').style.display = 'block';
    grid.innerHTML = '<div class="state-box"><div class="big-icon">❌</div><h3>שגיאה בטעינת נתונים</h3></div>';
  }
}

function displayReturnCards(data) {
  const grid = document.getElementById('returnGrid');

  if (!data || data.length === 0) {
    grid.innerHTML = '<div class="state-box"><div class="big-icon">📭</div><h3>אין שיחות להחזרה</h3><p>הגיליון ריק</p></div>';
    return;
  }

  grid.innerHTML = data.map((row, i) => {
    const fullPhone = formatPhoneForWhatsApp(row.phone);
    const waLink = 'https://wa.me/' + fullPhone + '?text=' + encodeURIComponent(RETURN_MESSAGE);

    return `
      <div class="patient-card" style="animation-delay:${i*0.05}s" id="return-card-${i}">
        <div class="card-top">
          <div class="patient-info">
            <div class="avatar" style="background: linear-gradient(135deg, #25d366, #128c7e);">📞</div>
            <div>
              <div class="patient-name" dir="ltr">${row.phone}</div>
              <div class="patient-phone">נכנס: ${row.timestamp || 'לא ידוע'}</div>
            </div>
          </div>
          <div class="time-badge" style="background:rgba(37,211,102,0.12); color:var(--primary);">
            ממתין לשיחה
          </div>
        </div>
        <div class="card-actions">
          <a href="${waLink}" target="_blank" class="wa-btn wa-btn-1" onclick="markSent(${i})">
            ${WA_SVG} שלח הודעת WhatsApp
          </a>
        </div>
      </div>`;
  }).join('');
}

function markSent(index) {
  returnSentCount++;
  document.getElementById('returnSent').textContent = returnSentCount;
  const card = document.getElementById('return-card-' + index);
  if (card) {
    card.style.opacity = '0.45';
    card.querySelector('.time-badge').textContent = '✅ נשלח';
    card.querySelector('.time-badge').style.color = 'var(--primary)';
  }
}

function filterReturn() {
  const q = document.getElementById('returnSearch').value.toLowerCase();
  displayReturnCards(allReturnData.filter(r => r.phone.toLowerCase().includes(q)));
}
