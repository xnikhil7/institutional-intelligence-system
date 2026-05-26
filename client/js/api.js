const API = window.API || (window.location.hostname === "localhost"
  ? "http://localhost:5000/api"
  : "https://iis-backend.onrender.com/api");
window.API = API;

const SOCKET_URL = window.SOCKET_URL || (window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://iis-backend.onrender.com");
window.SOCKET_URL = SOCKET_URL;

function getToken(){
  return localStorage.getItem("token");
}

async function GET(url){

  const res = await fetch(API + url,{
    headers:{
      "Authorization":"Bearer " + getToken()
    }
  });

  return res.json();
}

async function POST(url,data){

  const res = await fetch(API + url,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer " + getToken()
    },
    body:JSON.stringify(data)
  });

  return res.json();
}

async function DEL(url){

  const res = await fetch(API + url,{
    method:"DELETE",
    headers:{
      "Authorization":"Bearer " + getToken()
    }
  });

  return res.json();
}

/* GLOBAL MODAL SYSTEM */
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("modal-root")) {
    const root = document.createElement("div");
    root.id = "modal-root";
    document.body.appendChild(root);
  }
  document.addEventListener('keydown', (e) => {
    if(e.key === "Escape") closeAllModals();
  });
});

let currentConfirmCallback = null;

function showGlobalModal(contentHtml) {
  let root = document.getElementById("modal-root");
  if (!root) return;
  
  const container = document.createElement("div");
  container.className = "dynamic-modal";
  container.innerHTML = `
    <div class="modal-overlay" style="display:flex;" onclick="closeModalOnOutsideClick(event)">
      <div class="modal-box">
        ${contentHtml}
      </div>
    </div>
  `;
  root.appendChild(container);
  document.body.style.overflow = "hidden";
}

window.closeAllModals = function() {
  const overlays = document.querySelectorAll('.modal-overlay');
  overlays.forEach(m => {
    if (m.parentElement && m.parentElement.classList.contains('dynamic-modal')) {
      m.parentElement.remove();
    } else {
      m.style.display = 'none';
    }
  });
  document.body.style.overflow = "";
};

window.closeModalOnOutsideClick = function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    closeAllModals();
  }
};

function customAlert(msg, title = "Alert") {
  showGlobalModal(`
    <h3 style="margin-bottom: 15px;">${title}</h3>
    <p style="margin-bottom: 25px; color: var(--text); font-size: 16px;">${msg}</p>
    <div style="display:flex; justify-content:center;">
      <button class="btn" style="margin-top:0;" onclick="closeAllModals()">OK</button>
    </div>
  `);
}

function customConfirm(msg, onConfirm) {
  currentConfirmCallback = onConfirm;
  showGlobalModal(`
    <h3 style="margin-bottom: 15px;">Confirm Action</h3>
    <p style="margin-bottom: 25px; color: var(--text); font-size: 16px;">${msg}</p>
    <div style="display:flex; justify-content:center; gap: 15px;">
      <button class="delBtn" onclick="closeAllModals()">Cancel</button>
      <button class="btn" style="margin-top:0;" onclick="closeAllModals(); currentConfirmCallback();">Confirm</button>
    </div>
  `);
}

async function PUT(url, data){
  const res = await fetch(API + url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + getToken()
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

function refreshAdminNameDisplay(name) {
  const adminNameEl = document.getElementById("adminName");
  if (!adminNameEl) return;
  adminNameEl.innerText = "Logged in: " + (name || localStorage.getItem("name") || "Admin");
}

/* ACCOUNT TAB FUNCTIONS */
async function loadAccountTab() {
  const nameInput = document.getElementById("accName");
  const emailInput = document.getElementById("accEmail");
  
  try {
    const profile = await GET("/auth/profile");
    if (profile && !profile.msg && !profile.error) {
      if(nameInput) nameInput.value = profile.name || "";
      if(emailInput) emailInput.value = profile.email || "";
      // also sync localstorage just in case
      localStorage.setItem("name", profile.name);
      localStorage.setItem("role", profile.role);
      refreshAdminNameDisplay(profile.name);
    } else {
      if (nameInput) nameInput.value = localStorage.getItem("name") || "";
      refreshAdminNameDisplay();
    }
  } catch (err) {
    console.error("Error loading profile:", err);
    if (nameInput) nameInput.value = localStorage.getItem("name") || "";
    refreshAdminNameDisplay();
  }
}

async function updateAccount() {
  const name = document.getElementById("accName").value;
  const email = document.getElementById("accEmail").value;
  const password = document.getElementById("accPassword").value;
  
  if (!email) return customAlert("Email is required.");
  
  try {
    const res = await PUT("/auth/profile", { name, email, password });
    if (res.msg) {
      customAlert(res.msg);
      if (name) {
        localStorage.setItem("name", name);
        refreshAdminNameDisplay(name);
      }
    } else if (res.error) {
      customAlert(res.error);
    } else {
      customAlert("Unexpected server response");
    }
  } catch (err) {
    customAlert("Failed to update account");
    console.error(err);
  }
}