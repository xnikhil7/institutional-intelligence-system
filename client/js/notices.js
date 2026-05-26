async function loadNotices(){

 const data = await GET("/notices");

 noticeList.innerHTML = data.map(n=>`
  <div class="resRow">

   <div>
    <strong>${n.title}</strong><br>
    ${n.message}
   </div>

   <button class="delBtn"
    onclick="deleteNotice(${n.id})">
    Delete
   </button>

  </div>
 `).join("");

}

async function addNotice(){

 const title = ntitle.value.trim();
 const message = nmsg.value.trim();

 if(!title || !message){
  customAlert("Enter notice title and message");
  return;
 }

 const res = await POST("/notices",{title,message});

 customAlert(res.msg);

 ntitle.value="";
 nmsg.value="";

 loadNotices();

}

function deleteNotice(id){

 customConfirm("Delete notice?", async () => {
  await DEL("/notices/"+id);
  loadNotices();
 });

}