async function loadTemplates(){

 const data = await GET("/fees/templates");

 templateList.innerHTML = data.map(t=>`
  <div class="fee-row">

   ${t.branch} - Year ${t.year} - ${t.caste}
   | ₹${t.total_fee}

   <button class="delBtn"
    onclick="deleteTemplate(${t.id})">
    Delete
   </button>

  </div>
 `).join("");

}

async function saveTemplate(){

 const data = {
  branch: fBranch.value.trim(),
  year: Number(fYear.value),
  caste: fCaste.value.trim(),
  tuition: Number(fTuition.value),
  development: Number(fDev.value),
  exam: Number(fExam.value),
  other: Number(fOther.value)
 };

 // ✅ Validation
 if(!data.branch || !data.year || !data.caste){
   customAlert("❌ Fill all fields");
   return;
 }

 if(
   isNaN(data.tuition) ||
   isNaN(data.development) ||
   isNaN(data.exam) ||
   isNaN(data.other)
 ){
   customAlert("❌ Fees must be numbers");
   return;
 }

 try{

   const res = await POST("/fees/template", data);

   if(res.error){
     customAlert("❌ " + res.error);
     return;
   }

   customAlert("✅ " + res.msg);

   loadTemplates();
   closeTemplateModal();

 }catch(err){
   console.error(err);
   customAlert("❌ Request failed");
 }
}

function deleteTemplate(id){

 customConfirm("Delete template?", async () => {
  const res = await DEL("/fees/template/"+id);
  customAlert(res.msg);
  loadTemplates();
 });

}

 async function searchPending(){

  const el = document.getElementById("searchValue");
  if (!el) return;
  const val = el.value.trim();
  if (!val) { customAlert("Enter search value"); return; }
 
  const data = await GET("/fees/search/"+val);

  if (!data || data.length === 0) {
    searchResult.innerHTML = "<p style='color:var(--muted); text-align:center; padding: 20px;'>No fee records found for this student.</p>";
    return;
  }
 
  searchResult.innerHTML = data.map(d=>`
   <div class="card" style="background: rgba(255,255,255,0.05); margin-bottom: 20px;">
    <div style="font-size: 18px; margin-bottom: 10px;"><strong>${d.name}</strong></div>
    <div style="font-size: 14px; color: var(--muted); margin-bottom: 15px;">Email: ${d.email} | Aadhar: ${d.student_id || 'N/A'}</div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; border-top: 1px solid var(--border); padding-top: 10px;">
      <div><strong>Total:</strong> <br>₹${d.total}</div>
      <div><strong>Paid:</strong> <br><span style="color:var(--success)">₹${Number(d.paid_amount) || 0}</span></div>
      <div><strong>Pending:</strong> <br><span style="color:var(--danger)">₹${Number(d.paid_amount) === 0 ? d.total : (Number(d.pending_amount) || (d.total - Number(d.paid_amount)))}</span></div>
    </div>
    <button class="btn" style="width: 100%;" onclick="openManageFees(${d.id}, ${d.total}, ${d.paid_amount || 0})">Manage Fees</button>
   </div>
  `).join("");
 
 }

function openManageFees(id, total, paid) {
  document.getElementById("manageFeeId").value = id;
  document.getElementById("manageTotal").value = total;
  document.getElementById("managePaid").value = paid;
  calculatePending();
  document.getElementById("manageFeesModal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeManageFees() {
  closeAllModals();
}

function calculatePending() {
  const total = Number(document.getElementById("manageTotal").value) || 0;
  const paid = Number(document.getElementById("managePaid").value) || 0;
  const pending = paid === 0 ? total : (total - paid);
  document.getElementById("managePendingDisplay").innerText = "₹" + pending.toFixed(2);
}

async function submitManageFees() {
  const id = document.getElementById("manageFeeId").value;
  const total = Number(document.getElementById("manageTotal").value);
  const paid = Number(document.getElementById("managePaid").value);
  
  if(total < 0 || paid < 0) {
    customAlert("Values cannot be negative");
    return;
  }
  if(paid > total) {
    customAlert("Paid amount cannot exceed total fees");
    return;
  }
  
  try {
    const res = await fetch(API + "/fees/update/" + id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
      },
      body: JSON.stringify({ total, paid })
    });
    const data = await res.json();
    customAlert(data.msg || data.error);
    closeManageFees();
    searchPending();
  } catch(err) {
    customAlert("Server error");
  }
}

function openTemplateModal(){
 templateModal.style.display="flex";
 document.body.style.overflow = "hidden";
 fBranch.value="";
 fYear.value="";
 fCaste.value="OPEN";
 fTuition.value="";
 fDev.value="";
 fExam.value="";
 fOther.value="";
}

function closeTemplateModal(){
 closeAllModals();
}

function autoSearchStudentFees(){

  const email = localStorage.getItem("selectedStudentEmail");

  if(!email) return;

  const input = document.getElementById("searchValue");

  if(input){
    input.value = email;

    searchPending(); // existing function

    // cleanup
    localStorage.removeItem("selectedStudentEmail");
  }

}