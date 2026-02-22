const PRIVATE_ROOT = "private";
const LAST_PATH_KEY = "clinicflow_private_path";

async function sha256Hex(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

function showGateMessage(text, type) {
  const msg = document.getElementById("gateMessage");
  msg.textContent = text;
  msg.className = "gate-message " + type;
}

async function resolvePrivatePath(password) {
  const hash = await sha256Hex(password.trim());
  return `./${PRIVATE_ROOT}/${hash}/`;
}

async function navigateToPrivateArea(password) {
  const targetPath = await resolvePrivatePath(password);
  localStorage.setItem(LAST_PATH_KEY, targetPath);
  window.location.assign(targetPath);
}

document.getElementById("gateForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.getElementById("passwordInput");
  const btn = document.getElementById("enterBtn");
  const password = input.value;

  if (!password || !password.trim()) {
    showGateMessage("יש להזין סיסמה", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "בודק...";
  showGateMessage("מעביר לאזור המאובטח...", "info");

  try {
    await navigateToPrivateArea(password);
  } catch (err) {
    showGateMessage("שגיאה בגישה: " + err.message, "error");
    btn.disabled = false;
    btn.textContent = "כניסה";
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const rememberedPath = localStorage.getItem(LAST_PATH_KEY);
  if (rememberedPath) {
    showGateMessage("הסיסמה הקודמת נשמרה בדפדפן. אפשר להקליד שוב או לנווט ידנית.", "info");
  }
});
