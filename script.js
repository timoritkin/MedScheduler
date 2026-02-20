const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJxTavZiPd_JNwnnfq-YqWHdBMtrIuiQB127vizwak_WzjUghiaAqs52Oif8QAXwCbvw/exec"; // 👈 הכנס כאן את ה-URL של Google Apps Script

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
    showMessage("⚠️ יש למלא את כל השדות", "error");
    return;
  }

  fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(fields)
  })
  .then(res => res.json())
  .then(() => {
    showMessage("✅ הנתונים נשלחו בהצלחה לגיליון!", "success");
    document.querySelectorAll("input").forEach(i => i.value = "");
  })
  .catch(() => showMessage("❌ שגיאה בשליחת הנתונים", "error"));
}

function showMessage(text, type) {
  const msg = document.getElementById("message");
  msg.textContent = text;
  msg.className = type;
  setTimeout(() => { msg.className = ""; msg.style.display = "none"; }, 4000);
}