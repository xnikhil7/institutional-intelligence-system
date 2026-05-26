const socket = io(SOCKET_URL);

socket.on("newIssue",(data)=>{
  customAlert("New result issue raised!");
  loadIssues(); // we will create this
});



socket.emit("joinRoom","FACULTY");

socket.on("attendanceMarked",()=>{
  loadReport();
});


async function loadDashboardIssues() {
  const res = await fetch(
    API + "/result-issues",
    { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
  );

  const data = await res.json();

  const container = document.getElementById("dashboardIssues");
  container.innerHTML = "";

  const pending = data.filter(i => i.status === "PENDING").slice(0, 5);

  if (!pending.length) {
    container.innerHTML = "<p>No new issues 🎉</p>";
    return;
  }

  pending.forEach(issue => {
    container.innerHTML += `
      <p><b>${issue.student_name}</b> - ${issue.subject}</p>
      <hr>
    `;
  });
}

async function loadDashboardNotices() {
  const res = await fetch(
    API + "/notices",
    { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
  );

  const data = await res.json();
  const container = document.getElementById("dashboardNotices");
  container.innerHTML = "";

  data.slice(0, 3).forEach(n => {
    container.innerHTML += `
      <p><b>${n.title}</b></p>
      <hr>
    `;
  });
}

function loadTodos() {
  const todos = JSON.parse(localStorage.getItem("faculty_todos")) || [];
  const container = document.getElementById("todoList");
  container.innerHTML = "";

  todos.forEach((todo, index) => {
    container.innerHTML += `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span>${todo}</span>
        <button onclick="deleteTodo(${index})" 
                style="background:#ef4444;color:white;border:none;border-radius:6px;padding:4px 8px;">
          X
        </button>
      </div>
    `;
  });
}

function addTodo() {
  const input = document.getElementById("todoInput");
  const value = input.value.trim();
  if (!value) return;

  const todos = JSON.parse(localStorage.getItem("faculty_todos")) || [];
  todos.push(value);

  localStorage.setItem("faculty_todos", JSON.stringify(todos));

  input.value = "";
  loadTodos();
}

async function loadTodayEvent(){

const res = await fetch(API + "/today-event");
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

function deleteTodo(index) {
  const todos = JSON.parse(localStorage.getItem("faculty_todos")) || [];
  todos.splice(index, 1);
  localStorage.setItem("faculty_todos", JSON.stringify(todos));
  loadTodos();
}


window.onload = () => {
  loadDashboardIssues();
  loadDashboardNotices();
  loadTodos();
};


async function createSession(){
 const subject = document.getElementById("sub").value;
 if(!subject) return customAlert("Subject is required");

 try {
   const res = await fetch(
    API + "/attendance/session",
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+localStorage.getItem("token")
      },
      body:JSON.stringify({subject})
    }
   );

   const data = await res.json();
   
   if(res.ok){
     customAlert("Attendance session created successfully");
     document.getElementById("sub").value = "";
   } else {
     customAlert(data.msg || data.message || "Failed to create session");
   }
 } catch(e) {
   console.error(e);
   customAlert("Error creating attendance session");
 }
}

const n = localStorage.getItem("name") || "Faculty";
document.getElementById("facName").innerText =
 "Logged in: "+n;


async function postResult(){

 const sid = document.getElementById("sid");
 const subj = document.getElementById("subj");
 const intr = document.getElementById("int");
 const extr = document.getElementById("ext");
 const seme = document.getElementById("sem");

 const body={
   student_id: sid.value,
   subject: subj.value,
   internal: intr.value,
   external: extr.value,
   semester: seme.value
 };

 const res=await fetch(
  API + "/results/add",
  {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+localStorage.getItem("token")
    },
    body:JSON.stringify(body)
  }
 );

 const d=await res.json();
 customAlert(d.message || "Done");

 // ✅ CLEAR FIELDS
 sid.value="";
 subj.value="";
 intr.value="";
 extr.value="";
 seme.value="";

 loadResults();
}


async function postNotice() {

  const titleEl = document.getElementById("ntitle");
  const msgEl = document.getElementById("nmsg");

  const title = titleEl.value.trim();
  const content = msgEl.value.trim();

  if (!title || !content) {
    customAlert("All fields required");
    return;
  }

  try {
    const res = await fetch(API + "/notices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({ title, content })
    });

    const data = await res.json();

    if (!res.ok) {
      customAlert(data.msg || "Failed");
      return;
    }

    customAlert(data.msg);

    titleEl.value = "";
    msgEl.value = "";

    loadNotices();

  } catch (err) {
    console.log(err);
    customAlert("Server error");
  }
  // ✅ CLEAR FIELDS
  titleEl.value="";
  msgEl.value="";
  loadNotices();
}


let reportData = {};
async function loadReport() {
  try {
    const res = await fetch(API + "/attendance/report", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });
    const data = await res.json();
    reportData = data;

    const subjectSelect = document.getElementById("subjectFilter");
    subjectSelect.innerHTML = '<option value="">All Subjects</option>';
    const uniqueSubjects = Object.keys(reportData);
    uniqueSubjects.forEach(sub => {
      subjectSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
    });

    renderReport(reportData);
  } catch (err) {
    console.log(err);
  }
}

function renderReport(data) {
  const container = document.getElementById("reportContainer");
  
  if (Object.keys(data).length === 0) {
    container.innerHTML = "<p>No attendance records found.</p>";
    return;
  }

  let tableHTML = `
    <table class="ai-table" style="width:100%; border-radius:10px; overflow:hidden;">
      <thead>
        <tr>
          <th>Subject</th>
          <th>Total Sessions</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody style="transition: all 0.3s ease;">
  `;

  for (const [subject, sessions] of Object.entries(data)) {
    tableHTML += `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="font-weight:bold; color:var(--text);">${subject}</td>
        <td>${sessions.length}</td>
        <td><button class="btn" onclick="toggleSubject('${subject}')" style="margin:0; padding:6px 16px; border-radius:6px; font-size:12px;">Expand</button></td>
      </tr>
      <tr id="sub-${subject}" style="display:none; transition: all 0.3s ease;">
        <td colspan="3" style="padding:0; background:var(--bg)">
          <table style="width:100%; margin:0;">
            <thead style="background:rgba(0,0,0,0.05);">
              <tr>
                <th style="padding-left:30px; font-size:12px; color:var(--muted);">Session Date</th>
                <th style="font-size:12px; color:var(--muted);">Students Present</th>
                <th style="font-size:12px; color:var(--muted);">Action</th>
              </tr>
            </thead>
            <tbody>
    `;

    sessions.forEach((sess, idx) => {
      const sessId = `${subject}-${idx}`;
      tableHTML += `
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding-left:30px; color:var(--text);">${new Date(sess.date).toLocaleString()}</td>
                <td style="color:var(--success); font-weight:bold;">${sess.students.length} Present</td>
                <td><button class="btn" onclick="toggleSession('${sessId}')" style="margin:0; padding:4px 12px; background:var(--border); color:var(--text); box-shadow:none; border-radius:6px; font-size:11px;">Students</button></td>
              </tr>
              <tr id="sess-${sessId}" style="display:none; background:rgba(0,0,0,0.03); transition: all 0.3s ease;">
                <td colspan="3" style="padding:15px 30px;">
                  <div style="display:flex; flex-wrap:wrap; gap:8px;">
                  ${sess.students.length ? sess.students.map(s => `<span style="padding:6px 12px; background:var(--card); border:1px solid var(--border); color:var(--text); border-radius:6px; font-size:13px;">${s.name}</span>`).join('') : '<span style="color:var(--muted); font-style:italic;">No students present</span>'}
                  </div>
                </td>
              </tr>
      `;
    });

    tableHTML += `
            </tbody>
          </table>
        </td>
      </tr>
    `;
  }

  tableHTML += `</tbody></table>`;
  container.innerHTML = tableHTML;
}

window.toggleSubject = (id) => {
  const el = document.getElementById('sub-' + id);
  if (el.style.display === 'none') {
    el.style.display = 'table-row';
    el.style.opacity = '0';
    setTimeout(() => el.style.opacity = '1', 10);
  } else {
    el.style.display = 'none';
  }
};

window.toggleSession = (id) => {
  const el = document.getElementById('sess-' + id);
  if (el.style.display === 'none') {
    el.style.display = 'table-row';
    el.style.opacity = '0';
    setTimeout(() => el.style.opacity = '1', 10);
  } else {
    el.style.display = 'none';
  }
};

function applyReportFilters() {
  const searchValue = document.getElementById("reportSearch").value.toLowerCase();
  const subjectValue = document.getElementById("subjectFilter").value;
  const sortValue = document.getElementById("sortOption").value;

  let filtered = {};

  for (const [subject, sessions] of Object.entries(reportData)) {
    if (subjectValue && subject !== subjectValue) continue;

    let matchingSessions = sessions;
    
    if (searchValue) {
      matchingSessions = sessions.map(sess => ({
        ...sess,
        students: sess.students.filter(s => s.name.toLowerCase().includes(searchValue))
      })).filter(sess => sess.students.length > 0);
      
      if (matchingSessions.length === 0) continue;
    }

    matchingSessions = [...matchingSessions];

    if (sortValue === "latest") {
      matchingSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortValue === "oldest") {
      matchingSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    filtered[subject] = matchingSessions;
  }

  if (sortValue === "subject") {
    const sortedKeys = Object.keys(filtered).sort();
    const sortedFiltered = {};
    for (const key of sortedKeys) {
      sortedFiltered[key] = filtered[key];
    }
    filtered = sortedFiltered;
  }

  renderReport(filtered);
}



async function loadNotices(){
 const r=await fetch(
  API + "/notices",
  {headers:{Authorization:"Bearer "+localStorage.getItem("token")}}
 );

 const data=await r.json();
 let html="";

 data.forEach(n=>{
  html+=`<p><h2>${n.title}</h2><br>${n.message}<br><hr></p><br><br>`;
 });

 noticeList.innerHTML=html;
}

// async function loadIssues() {
//   const res = await fetch(
//     API + "/result-issues",
//     {
//       headers: {
//         Authorization: "Bearer " + localStorage.getItem("token")
//       }
//     }
//   );

//   const data = await res.json();

//   const container = document.getElementById("issueContainer");
//   container.innerHTML = "";

//   if (!data.length) {
//     container.innerHTML = "<p>No issues found</p>";
//     return;
//   }

//   data.forEach(issue => {
//     const div = document.createElement("div");
//     div.style.marginBottom = "20px";
//     div.style.padding = "15px";
//     div.style.border = "1px solid rgba(255,255,255,0.1)";
//     div.style.borderRadius = "10px";

//     div.innerHTML = `
//   <p><b>Student:</b> ${issue.student_name}</p>
//   <p><b>Subject:</b> ${issue.subject}</p>
//   <p><b>Message:</b> ${issue.message}</p>
//   <p><b>Status:</b> ${issue.status}</p>

//   <table border="1" width="100%" style="margin:10px 0">
//     <tr>
//       <th>Internal</th>
//       <th>External</th>
//       <th>Total</th>
//       <th>Semester</th>
//     </tr>
//     <tr>
//       <td>${issue.internal}</td>
//       <td>${issue.external}</td>
//       <td>${issue.total}</td>
//       <td>${issue.semester}</td>
//     </tr>
//   </table>

//   ${
//     issue.status === "PENDING"
//     ? `
//       <input id="int_${issue.id}" 
//              placeholder="New Internal"
//              value="${issue.internal}">
             
//       <input id="ext_${issue.id}" 
//              placeholder="New External"
//              value="${issue.external}">

//       <input id="msg_${issue.id}" 
//              placeholder="Faculty Message">

//       <button class="btn"
//         onclick="handleIssue(${issue.id}, 'RESOLVE')">
//         Resolve
//       </button>

//       <button class="btn"
//         style="background:#ef4444"
//         onclick="handleIssue(${issue.id}, 'DECLINE')">
//         Decline
//       </button>
//     `
//     : `
//       <p><b>Faculty Response:</b> 
//          ${issue.faculty_message || "-"}</p>
//     `
//   }
// `;
//     container.appendChild(div);
//   });
// }

async function loadIssues() {
  const res = await fetch(
    API + "/result-issues",
    {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    }
  );

  const data = await res.json();
  const container = document.getElementById("issueContainer");

  if (!data.length) {
    container.innerHTML = "<p>No issues found</p>";
    return;
  }

  let html = `
    <table class="ai-table" style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th>Student</th>
          <th>Subject</th>
          <th>Message</th>
          <th>Status</th>
          <th>Internal</th>
          <th>External</th>
          <th>Total</th>
          <th>Semester</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach(issue => {
    html += `
      <tr style="border-bottom:1px solid var(--border);">
        <td>${issue.student_name}</td>
        <td>${issue.subject}</td>
        <td>${issue.message}</td>
        <td>${issue.status}</td>
        <td>
          ${issue.status === "PENDING"
            ? `<input id="int_${issue.id}" value="${issue.internal}" style="width:60px;">`
            : issue.internal}
        </td>
        <td>
          ${issue.status === "PENDING"
            ? `<input id="ext_${issue.id}" value="${issue.external}" style="width:60px;">`
            : issue.external}
        </td>
        <td>${issue.total}</td>
        <td>${issue.semester}</td>
        <td>
          ${
            issue.status === "PENDING"
            ? `
              <input id="msg_${issue.id}" placeholder="Message" style="width:100px;"><br><br>
              <button class="btn" onclick="handleIssue(${issue.id}, 'RESOLVE')">✔</button>
              <button class="btn" style="background:#ef4444" onclick="handleIssue(${issue.id}, 'DECLINE')">✖</button>
            `
            : `<span style="color:var(--muted); font-size:12px;">
                ${issue.faculty_message || "-"}
               </span>`
          }
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

async function handleIssue(id, action){

  const internal = document.getElementById(`int_${id}`)?.value;
  const external = document.getElementById(`ext_${id}`)?.value;
  const message = document.getElementById(`msg_${id}`)?.value;

  const res = await fetch(
    API + "/result-issues/handle/"+id,
    {
      method:"PUT",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+localStorage.getItem("token")
      },
      body:JSON.stringify({
        internal,
        external,
        message,
        action
      })
    }
  );

  const data = await res.json();
  customAlert(data.msg);
  loadIssues();
}

async function resolveIssue(id) {
  const res = await fetch(
    API + "/result-issues/resolve/" + id,
    {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    }
  );

  const data = await res.json();
  customAlert(data.msg);

  loadIssues();
}

async function loadResources() {
  try {

    const res = await fetch(API + "/resources", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    });

    const data = await res.json();

    const box = document.getElementById("facultyResources");

    if (!data.length) {
      box.innerHTML = "<p>No resources available</p>";
      return;
    }

    box.innerHTML = data.map(r => `
      <div style="padding:10px;border-bottom:1px solid #334155">
        <b>${r.name}</b><br>
        ${r.description || ""}<br>
        Capacity: ${r.capacity}
      </div>
    `).join("");

  } catch (err) {
    console.error("Resource load error:", err);
  }
}

document.getElementById("reportSearch")
  .addEventListener("input", applyReportFilters);

document.getElementById("subjectFilter")
  .addEventListener("change", applyReportFilters);

document.getElementById("sortOption")
  .addEventListener("change", applyReportFilters);

async function loadResults() {
  const subj = document.getElementById("resSubjectFilter")?.value || "";
  const exam = document.getElementById("resExamFilter")?.value || "";
  
  let url = API + "/results/all?";
  if (subj) url += `subject=${encodeURIComponent(subj)}&`;
  if (exam) url += `exam_name=${encodeURIComponent(exam)}&`;

  try {
    const res = await fetch(url, {
      headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    });
    const data = await res.json();
    
    const subjFilter = document.getElementById("resSubjectFilter");
    const examFilter = document.getElementById("resExamFilter");
    
    // Only populate if they are default empty right now
    if (subjFilter && subjFilter.options.length === 1 && data.length > 0) {
      const uniqueSubjs = [...new Set(data.map(d => d.subject))].filter(Boolean);
      uniqueSubjs.forEach(s => subjFilter.innerHTML += `<option value="${s}">${s}</option>`);
      
      const uniqueExams = [...new Set(data.map(d => d.semester))].filter(Boolean);
      uniqueExams.forEach(e => examFilter.innerHTML += `<option value="${e}">${e}</option>`);
    }

    const container = document.getElementById("resultsContainer");
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = "<p>No results found.</p>";
      return;
    }

    let html = `
      <table class="ai-table" style="width:100%; border-radius:10px; overflow:hidden;">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Subject</th>
            <th>Semester/Exam</th>
            <th>Internal</th>
            <th>External</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    data.forEach(r => {
      html += `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="color:var(--text);">${r.student_name || 'Unknown'}</td>
          <td>${r.subject}</td>
          <td>${r.semester}</td>
          <td>${r.internal}</td>
          <td>${r.external}</td>
          <td style="color:#22c55e; font-weight:bold;">${r.total}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;

  } catch (err) {
    console.error(err);
  }
}
