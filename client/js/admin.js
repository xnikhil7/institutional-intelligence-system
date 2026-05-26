function show(id,btn){

 document.querySelectorAll(".section")
 .forEach(s=>s.classList.remove("active"));

 document.getElementById(id).classList.add("active");

 document.querySelectorAll(".nav button")
 .forEach(b=>b.classList.remove("active"));

 btn.classList.add("active");

 if(id==="fees"){
     loadTemplates();
     autoSearchStudentFees();
 }
}

document.getElementById("userRole")
.addEventListener("change",function(){

 if(this.value==="STUDENT"){
  document.getElementById("studentFields").style.display="block";
 }
 else{
  document.getElementById("studentFields").style.display="none";
 }

});

document.addEventListener("DOMContentLoaded",()=>{

 loadUsers();
 loadResources();
 loadBooks();
 loadNotices();
 loadTimetable();
 refreshAdminNameDisplay();

});