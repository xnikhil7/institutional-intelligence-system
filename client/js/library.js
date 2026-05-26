async function loadBooks(){

 const data = await GET("/admin/books");

 if(!data || data.length === 0){
  bookList.innerHTML = `<div class="resRow" style="justify-content:center; color:var(--muted);">No books available</div>`;
  return;
 }

 bookList.innerHTML = data.map(b=>`
  <div class="resRow">
   ${b.name} - ${b.author}
   <button class="delBtn"
    onclick="deleteBook(${b.id})">
    Delete
   </button>
  </div>
 `).join("");

}

async function addBook(){

 const res = await POST("/admin/add-book",{
  name:bname.value,
  author:bauthor.value,
  status:bstatus.value
 });

 customAlert(res.msg);

 bname.value="";
 bauthor.value="";

 loadBooks();

}

function deleteBook(id){

 customConfirm("Delete book?", async () => {
  const res = await DEL("/admin/delete-book/"+id);
  customAlert(res.msg);
  loadBooks();
 });

}