
const socket = io("http://localhost:5000");
socket.emit("joinRoom","STUDENT");

socket.on("newAttendanceSession",()=>{
 loadActiveSessions();
});

socket.on("noticeCreated",()=>{
  loadNotices();
});

socket.on("resultAdded",()=>{
  loadResults();
});

socket.on("issueUpdated",()=>{
  loadResults();
});

async function loadStudentLibrary() {
  try {
    const data = await GET("/admin/books");
    const container = document.getElementById("studentLibraryList");

    if (!container) return;

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center; color:var(--muted);">
            No books available
          </td>
        </tr>`;
      return;
    }

    container.innerHTML = data.map(b => {
      let color = "gray";

      if (b.status.toLowerCase() === "available") color = "green";
      else if (b.status.toLowerCase() === "issued") color = "red";
      else if (b.status.toLowerCase() === "maintenance") color = "orange";

      return `
        <tr>
          <td>${b.name}</td>
          <td>${b.author}</td>
          <td style="color:${color}; font-weight:bold;">
            ${b.status}
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error(err);
    document.getElementById("studentLibraryList").innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center;">Failed to load</td>
      </tr>`;
  }
}

async function loadStudentTimetable() {
  try {
    const data = await GET("/timetable");
    const container = document.getElementById("studentTimetableList");

    if (!container) return;

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; color:var(--muted);">
            No timetable available
          </td>
        </tr>`;
      return;
    }

    container.innerHTML = data.map(t => `
      <tr>
        <td>${t.year}</td>
        <td>${t.branch}</td>
        <td>${t.date}</td>
        <td>${t.time}</td>
        <td>${t.subject}</td>
      </tr>
    `).join("");

  } catch (err) {
    console.error(err);
    document.getElementById("studentTimetableList").innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">Failed to load</td>
      </tr>`;
  }
}

async function loadDashboard(){

 // Attendance summary
 const r = await fetch(
  "http://localhost:5000/api/attendance/student",
  {headers:{Authorization:"Bearer "+localStorage.getItem("token")}}
 );
 const data = await r.json();

 let total=0,present=0;

 data.forEach(s=>{
  total+=s.total;
  present+=s.present;
 });

 const pct = total?Math.round((present/total)*100):0;

 document.getElementById("dashAttendance")
  .innerHTML = `<h2>${pct}% Overall Attendance</h2>`;

 // Latest notice
 const n = await fetch(
  "http://localhost:5000/api/notices",
  {headers:{Authorization:"Bearer "+localStorage.getItem("token")}}
 );

 const notices = await n.json();

 if(notices.length){
  document.getElementById("latestNotice")
   .innerHTML = `<b>${notices[0].title}</b><br>${notices[0].message}`;
 }

 // Latest Issue
const res2 = await fetch(
 "http://localhost:5000/api/results/student",
 {headers:{Authorization:"Bearer "+localStorage.getItem("token")}}
);

const results = await res2.json();

const latestIssue = results
  .filter(r=>r.issue_status)
  .sort((a,b)=>new Date(b.issue_created)-new Date(a.issue_created))[0];

if(latestIssue){
  document.getElementById("latestIssue")
    .innerHTML = `
      <h4>${latestIssue.subject}</h4>
      <p>Status: ${latestIssue.issue_status}</p>
    `;
}
}

loadDashboard();




async function markAttendance(sessionId){
 const marked = JSON.parse(localStorage.getItem("markedSessions")) || [];
 if (marked.includes(sessionId)) {
   customAlert("Attendance already marked for this session.");
   return;
 }

 if(!navigator.geolocation){
   customAlert("No GPS");
   return;
 }

 const button = document.querySelector(`.session-card[data-id="${sessionId}"] button`);
 if (button) {
   button.disabled = true;
   button.innerText = "Marking...";
 }

 navigator.geolocation.getCurrentPosition(async pos=>{
   const lat=pos.coords.latitude;
   const lng=pos.coords.longitude;

   const res=await fetch(
    "http://localhost:5000/api/attendance/mark",
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+localStorage.getItem("token")
      },
      body:JSON.stringify({
        lat,lng,session_id:sessionId
      })
    }
   );

   const d=await res.json();
   customAlert(d.msg || "Attendance updated.");

   if (res.ok && !d.error) {
     const storedMarked = JSON.parse(localStorage.getItem("markedSessions")) || [];
     if(!storedMarked.includes(sessionId)){
       storedMarked.push(sessionId);
       localStorage.setItem("markedSessions", JSON.stringify(storedMarked));
     }

     const sessionBlock = document.querySelector(`.session-card[data-id="${sessionId}"]`);
     if(sessionBlock){
       sessionBlock.remove();
     }
   } else {
     if (button) {
       button.disabled = false;
       button.innerText = "Mark Attendance";
     }
   }

   loadAttendance();
 }, err => {
   if (button) {
     button.disabled = false;
     button.innerText = "Mark Attendance";
   }
   customAlert("Failed to access location.");
   console.error(err);
 });
}



async function loadAttendance(){
 const r=await fetch(
  "http://localhost:5000/api/attendance/student",
  {headers:{Authorization:"Bearer "+localStorage.getItem("token")}}
 );
 const data=await r.json();

 let html="";

 data.forEach(s=>{
  const pct=s.total?Math.round((s.present/s.total)*100):0;
  const color=pct>=75?"green":"red";

  html+=`
   <p>${s.subject} (${s.present}/${s.total})</p>
   <div class="progress">
    <div class="fill"
     style="width:${pct}%;background:${pct>=75?'#22c55e':'#ef4444'}">
     ${pct}%
    </div>
   </div><br>
  `;
 });

 document.getElementById("attendanceList").innerHTML=html;
}



async function loadActiveSessions(){
 const r=await fetch(
  "http://localhost:5000/api/attendance/sessions/active",
  {headers:{Authorization:"Bearer "+localStorage.getItem("token")}}
 );
 const data=await r.json();

 if(!Array.isArray(data)){
  console.error("Invalid session data:",data);
  return;
 }

 let html="";

 if(!data.length)
  html="<p>No active lectures</p>";

 const marked = JSON.parse(localStorage.getItem("markedSessions")) || [];
 data.forEach(s=>{
  if(marked.includes(s.id)) return;
  html+=`
   <div class="session-card" data-id="${s.id}">
    <b>${s.subject}</b><br>
    <button onclick="markAttendance(${s.id})" class="button" style = "border-radius:7px;margin:10px;padding:8px">
      Mark Attendance
    </button>
    <hr>
   </div>
  `;
 });

 document.getElementById("lectureList").innerHTML=html;
}

async function loadTodayEvent(){

const res = await fetch("http://localhost:5000/api/today-event");
const data = await res.json();

todayEvent.innerText =
"Academic Event: " + data.event;

}

loadTodayEvent();


function showTodayDate(){

const today = new Date();

const options = {
weekday:"long",
year:"numeric",
month:"long",
day:"numeric"
};

todayDate.innerText =
"Today: " + today.toLocaleDateString("en-IN",options);

}

showTodayDate();


// RESULTS
async function loadResults(){
 try{
   const res = await fetch(
     "http://localhost:5000/api/results/student",
     {
       headers:{
           "Authorization":"Bearer "+localStorage.getItem("token")
       }
    }
   );
   
   const data = await res.json();
   
   const tbody = document.querySelector("#resultsTable tbody");
   tbody.innerHTML="";
   
   data.forEach(r=>{
       tbody.innerHTML += `
       <tr>
        <td>${r.subject}</td>
        <td>${r.internal}</td>
        <td>${r.external}</td>
        <td>${r.total}</td>
        <td>${r.semester}</td>
        <td>
        <button onclick="openModal(${r.id})" class="btn" style="border-radius:5px;padding:6px 10px;font-size:12px;">
          Raise Issue
        </button>
  </td>
       </tr>`;
   });

   let issueHTML = "";

data.forEach(r=>{
  if(r.issue_status){
    issueHTML += `
      <div class="card" style="margin-top:15px">
        <h4>${r.subject}</h4>
        <p><b>Status:</b> ${r.issue_status}</p>
        <p><b>Faculty Response:</b> 
           ${r.faculty_message || "-"}</p>
        <p><small>
          Raised on: ${r.issue_created 
            ? new Date(r.issue_created).toLocaleString()
            : "-"}
        </small></p>
      </div>
    `;
  }
});

document.getElementById("issueTracker").innerHTML = issueHTML;

}catch(err){
    console.log(err);
 }
}

let currentResultId = null;

function openModal(id){
  currentResultId = id;
  document.getElementById("issueModal").style.display="flex";
  document.body.style.overflow="hidden";
}

function closeModal(){
  closeAllModals();
  document.getElementById("issueText").value="";
}

async function submitIssue(){
  const msg = document.getElementById("issueText").value;

  if(!msg){
    customAlert("Write something");
    return;
  }

  const res = await fetch(
    "http://localhost:5000/api/result-issues/raise",
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+localStorage.getItem("token")
      },
      body:JSON.stringify({
        result_id: currentResultId,
        message: msg
      })
    }
  );

  const data = await res.json();
  customAlert(data.msg);

  closeModal();
  loadResults();
}

async function loadNotices(){
 const r=await fetch(
  "http://localhost:5000/api/notices",
  {headers:{Authorization:"Bearer "+localStorage.getItem("token")}}
 );

 const data=await r.json();
 let html="";

 data.forEach(n=>{
  html+=`<p><h2>${n.title}</h2><br>${n.message}</p><hr><br><br>`;
 });

 noticeList.innerHTML=html;
}
document.addEventListener("DOMContentLoaded", () => {
  const n = localStorage.getItem("name") || "Student";
  document.getElementById("student").innerText =
    "Logged in: " + n;
});

async function loadFees(){

  const res = await fetch(
    "http://localhost:5000/api/fees/student",
    {
      headers:{
        Authorization:"Bearer "+localStorage.getItem("token")
      }
    }
  );

  const data = await res.json();

  if(!data || data.length === 0){
    document.getElementById("feesContainer").innerHTML =
      `<p>${data.msg}</p>`;
    return;
  }

  if(!res.ok){
    document.getElementById("feesContainer").innerHTML =
      `<p>${data.msg}</p>`;
    return;
  }

  document.getElementById("feesContainer").innerHTML = `
    <p>Tuition: \u20B9${data.tuition_fee}</p>
    <p>Development: \u20B9${data.development_fee}</p>
    <p>Exam: \u20B9${data.exam_fee}</p>
    <p>Other: \u20B9${data.other_fee}</p>
    <hr>
    <h4>Total: \u20B9${data.total_fee}</h4>
    <p style="color:var(--success)"><b>Paid:</b> \u20B9${data.paid_amount}</p>
    <p style="color:var(--danger)"><b>Pending:</b> \u20B9${data.pending_amount}</p>
    <br>
    <p>Status: <span style="font-weight:bold; color: ${data.status === 'PAID' ? 'var(--success)' : 'var(--danger)'}">${data.status}</span></p>
  `;
} 



loadActiveSessions();
loadAttendance();
loadResults();
loadNotices();