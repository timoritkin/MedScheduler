const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKKOUIaPpsAqfj7EcUDp73zc1V_coGjtNoH98o0pE6ymSJEYf9byoUVp4ppXo2A73epQ/exec";

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

  const btn = document.querySelector('.submit-btn');
  btn.disabled = true;
  btn.textContent = "⏳ שולח...";

  // שולח דרך GET עם URL parameters + no-cors
  const params = new URLSearchParams(fields);
  const url = SCRIPT_URL + "?" + params.toString();

  fetch(url, { method: "GET", mode: "no-cors" })
    .then(() => {
      showMessage("✅ הנתונים נשלחו בהצלחה לגיליון!", "success");
      document.querySelectorAll("input").forEach(i => i.value = "");
    })
    .catch(err => showMessage("❌ שגיאה: " + err.message, "error"))
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "📤 שלח לגיליון Google";
    });
}

function showMessage(text, type) {
  const msg = document.getElementById("message");
  msg.textContent = text;
  msg.className = type;
  msg.style.display = "block";
  setTimeout(() => { msg.className = ""; msg.style.display = "none"; }, 5000);
}
