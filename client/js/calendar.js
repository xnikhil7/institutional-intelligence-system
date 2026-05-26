async function loadCalendar(){

 const data = await GET("/calendar");

 calendarList.innerHTML = data.map(e=>`
  <tr>
   <td>${e.date}</td>
   <td>${e.event}</td>
  </tr>
 `).join("");

}