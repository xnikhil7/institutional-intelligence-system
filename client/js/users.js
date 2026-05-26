let allUsers=[];

async function loadUsers(){

 allUsers = await GET("/admin/users");
 renderUsers(allUsers);

}

function renderUsers(list){

 userList.innerHTML = list.map(u=>{
  if (u.role === 'STUDENT') {
    // Stringify and escape safely for HTML attribute
    const safeStudent = JSON.stringify(u).replace(/"/g, '&quot;');
    return `
     <div class="resRow" onclick="openStudentModal(${safeStudent})" style="cursor: pointer;" title="Click for details">
      <div><strong>${u.name}</strong> <span style="font-size: 12px; color: var(--muted);">(Student)</span> - ${u.email}</div>
     </div>
    `;
  } else {
    return `
     <div class="resRow">
      <div>${u.name} <span style="font-size: 12px; color: var(--muted);">(${u.role})</span> - ${u.email}</div>
      <button class="delBtn" onclick="deleteUser(${u.id})">Delete</button>
     </div>
    `;
  }
 }).join("");

}

async function createUser(){

 const name = document.getElementById("name").value.trim();
 const email = document.getElementById("email").value.trim();
 const password = document.getElementById("password").value.trim();
 const role = document.getElementById("userRole").value;

 let branch = null;
 let year = null;
 let caste = null;
 let aadhar = null;

 if(role === "STUDENT"){
  branch = document.getElementById("branch").value;
  year = document.getElementById("year").value;
  caste = document.getElementById("caste").value;
  aadhar = document.getElementById("aadhar").value;
 }

 /* basic validation */

 if(!name || !email || !password || !role){
  customAlert("Fill required fields");
  return;
 }

 if(role === "STUDENT" && (!branch || !year || !caste || !aadhar)){
  customAlert("Student details missing");
  return;
 }

 try{

  const res = await POST("/admin/add-user",{
   name,
   email,
   password,
   role,
   branch,
   year,
   caste,
   aadhar
  });

  if(res.msg){
   customAlert(res.msg);
  }
  else if(res.error){
   customAlert(res.error);
  }
  else{
   customAlert("Unexpected server response");
  }

  loadUsers();
  name = ""
email = ""
password = ""
role = ""
branch = ""
year = ""
caste = ""
aadhar = ""

 }catch(err){

  console.log(err);

 }



}

function deleteUser(id){

 customConfirm("Delete user?", async () => {
  const res = await DEL("/admin/delete-user/"+id);
  customAlert(res.msg || res.error);
  if (res.msg) loadUsers();
 });

}

let currentRoleFilter = "ALL";

function setRoleFilter(role) {
  currentRoleFilter = role;
  const buttons = document.querySelectorAll('.role-filters .sem-btn');
  buttons.forEach(b => b.classList.remove('active'));
  
  const activeBtn = document.getElementById(`filter-${role}`);
  if(activeBtn) activeBtn.classList.add('active');
  
  filterUsers();
}

function filterUsers(){

 const q=document.getElementById("userSearch") ? document.getElementById("userSearch").value.toLowerCase() : "";
 let selectedRole = currentRoleFilter;

 const filtered = allUsers.filter(u => {
  const matchQuery = q ? (
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.role.toLowerCase().includes(q)
  ) : true;
  
  const matchRole = (selectedRole === "ALL") ? true : (u.role === selectedRole);
  
  return matchQuery && matchRole;
 });

 renderUsers(filtered);

}

let currentStudent = null;

async function openStudentModal(student) {
  currentStudent = student;
  const sdContent = document.getElementById("sd-content");
  if(sdContent) sdContent.innerHTML = "Fetching details...";
  
  const modal = document.getElementById("studentDetailModal");
  if(modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  try {
    let feesData = await GET("/fees/search/" + student.email);
    let feeText = "<span style='color: var(--danger);'>No fee record found</span>";
    if (feesData && feesData.length > 0) {
      const f = feesData[0];
      const paidAmt = Number(f.paid_amount) || 0;
      const pendingAmt = paidAmt === 0 ? f.total : (Number(f.pending_amount) || (f.total - paidAmt));
      feeText = `Total: ₹${f.total} | Paid: <span style='color: var(--success);'>₹${paidAmt}</span> | Pending: <span style='color: var(--danger);'>₹${Number(pendingAmt).toFixed(2)}</span>`;
    }

    if(sdContent) {
      sdContent.innerHTML = `
        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; margin-bottom: 15px;">
          <b>Name:</b> ${student.name}<br>
          <b>Email:</b> ${student.email}<br>
          <b>ID/Aadhar:</b> ${student.aadhar || 'N/A'}<br>
          <b>Branch:</b> ${student.branch || 'N/A'} (Year ${student.year || 'N/A'})<br>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px;">
          <b>Fees Status:</b><br> ${feeText}<br>
        </div>
      `;
    }
  } catch (err) {
    if(sdContent) {
      sdContent.innerHTML = `
        <b>Name:</b> ${student.name}<br>
        <b>Email:</b> ${student.email}<br>
        <span style="color: var(--danger);">Error fetching extra details.</span>
      `;
    }
  }
}

function closeStudentModal() {
  const modal = document.getElementById("studentDetailModal");
  if(modal) modal.style.display = "none";
  currentStudent = null;
}

function deleteCurrentStudent() {
  if (currentStudent) {
    deleteUser(currentStudent.id);
    closeStudentModal();
  }
}

function openUpdateProfileModal() {
  customAlert("Update Profile feature coming soon.", "Info");
}

function openStudentManageFees() {

  if (!currentStudent || !currentStudent.email) {
    customAlert("Student email not found");
    return;
  }

  
  localStorage.setItem("selectedStudentEmail", currentStudent.email);

  
  closeStudentModal();

  
  const feesBtn = document.querySelector('.nav button[onclick*="fees"]');

  if (feesBtn) {
    show('fees', feesBtn);
  }

}