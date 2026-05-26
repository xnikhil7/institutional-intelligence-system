async function loadTimetable(){

 const data = await GET("/timetable");

 if(!data || data.length === 0){
  ttList.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted);">No timetable data available</td></tr>`;
  return;
 }

 ttList.innerHTML = data.map(t=>`
  <tr>
   <td>${t.year}</td>
   <td>${t.branch}</td>
   <td>${t.date}</td>
   <td>${t.time}</td>
   <td>${t.subject}</td>
   <td>
    <button class="delBtn"
     onclick="deleteExam(${t.id})">
     Delete
    </button>
   </td>
  </tr>
 `).join("");

}

async function addTimetable(){

 const res = await POST("/timetable/add",{
  year:tYear.value,
  branch:tBranch.value,
  date:tDate.value,
  time:tTime.value,
  subject:tSubject.value
 });

 customAlert(res.msg);

 loadTimetable();

}

function deleteExam(id){

 customConfirm("Delete exam?", async () => {
  const res = await DEL("/timetable/"+id);
  customAlert(res.msg);
  loadTimetable();
 });

}