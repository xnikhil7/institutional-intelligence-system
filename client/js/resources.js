async function loadResources(){

 const res = await fetch(
  API + "/admin/resources-public",
  {
    headers:{
      Authorization:"Bearer "+localStorage.getItem("token")
    }
  }
 );

 const data = await res.json();

 const box = document.getElementById("facultyResources");

 box.innerHTML = data.map(r => `
   <div style="padding:10px;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center">

      <div>
        <b>${r.name}</b><br>
        ${r.description}<br>
        Capacity: ${r.capacity}
      </div>

      <button 
        onclick="deleteResource(${r.id})"
        style="background:#ef4444;border:none;color:white;padding:6px 10px;border-radius:6px;cursor:pointer"
      >
        Delete
      </button>

   </div>
`).join("");

}


async function addResource(){

 await POST("/admin/add-resource",{
  name:rname.value,
  capacity:rcap.value,
  description:rdesc.value
 });

 rname.value="";
 rcap.value="";
 rdesc.value="";

 loadResources();

}

function deleteResource(id){

 customConfirm("Delete resource?", async () => {
  await fetch(API + "/resources/"+id,{
    method:"DELETE",
    headers:{
      Authorization:"Bearer "+localStorage.getItem("token")
    }
  });
  loadResources();
 });

}


async function checkAI(){

const product=document.getElementById("productName").value;
const quantity=document.getElementById("quantity").value;

const resultDiv=document.getElementById("aiResult");

if(!product || !quantity){
resultDiv.innerHTML="⚠️ Enter product and quantity";
return;
}

resultDiv.innerHTML="🔍 Scanning marketplaces...";

try{

const res=await fetch(API + "/price/best",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
product,
quantity
})
});

const data=await res.json();

/* ---- IMPORTANT FIX ---- */

if(data && data.results && data.results.length>0){
renderAIResult(data);
}else{
resultDiv.innerHTML="⚠️ Couldn't compute best deal but no results were returned.";
}

}
catch(err){

console.error(err);

/* show fallback UI */
resultDiv.innerHTML=`
<div style="padding:15px;background:#f59e0b;border-radius:10px">
⚠️ AI failed to compute best deal. Showing available marketplace results.
</div>
`;

}

}

function renderAIResult(data){
  const div=document.getElementById("aiResult");

  let html=`<div class="ai-container" style="display:flex; flex-direction:column; gap:20px;">`;

  if(data.best_vendor) {
    html += `
      <div class="card" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(21, 128, 61, 0.4)); border: 1px solid var(--success); padding: 20px;">
        <h3 style="color: #4ade80; margin-bottom: 15px; display:flex; align-items:center; gap:8px;">🏆 Best Deal Found</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
          <div><p style="color:var(--muted); font-size:13px; margin:0;">Vendor</p><p style="font-weight:bold; font-size:16px; margin:5px 0 0 0;">${data.best_vendor}</p></div>
          <div><p style="color:var(--muted); font-size:13px; margin:0;">Price/Unit</p><p style="font-weight:bold; font-size:16px; margin:5px 0 0 0;">₹${data.best_price_per_unit || "N/A"}</p></div>
          <div><p style="color:var(--muted); font-size:13px; margin:0;">Quantity</p><p style="font-weight:bold; font-size:16px; margin:5px 0 0 0;">${data.quantity}</p></div>
          <div><p style="color:var(--muted); font-size:13px; margin:0;">Total Estimated</p><p style="color:#4ade80; font-weight:bold; font-size:18px; margin:5px 0 0 0;">₹${data.best_total_price || "N/A"}</p></div>
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="card" style="border: 1px solid var(--warning);">
        <h4 style="color:var(--warning); margin:0;">⚠️ Couldn't confidently compute best deal, showing raw results</h4>
      </div>
    `;
  }

  html += `<h4 style="margin-top:10px; margin-bottom:0;">Other Market Prices</h4>`;
  html += `<div style="display:flex; flex-direction:column; gap:10px;">`;

  if(data.results && data.results.length > 0) {
    data.results.forEach(item => {
      html += `
        <div class="card" style="background: rgba(255,255,255,0.03); padding: 15px; display:flex; justify-content:space-between; align-items:center; gap:15px; flex-wrap:wrap;">
          <div style="flex: 2; min-width:200px;">
            <p style="color:var(--muted); font-size:12px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">${item.site}</p>
            <p style="font-weight:500; font-size:14px; margin:0; line-height:1.4;">${item.title}</p>
          </div>
          <div style="flex: 1; text-align:right; min-width:100px;">
            <p style="color:var(--text); font-weight:bold; font-size:16px; margin:0 0 5px 0;">₹${item.price || "N/A"}</p>
            <p style="color:${item.availability==='In Stock'?'var(--success)':'var(--danger)'}; font-size:12px; margin:0;">${item.availability}</p>
          </div>
          <div>
            <a href="${item.url}" target="_blank" style="display:inline-block; padding:8px 16px; background:var(--primary); color:#fff; text-decoration:none; border-radius:8px; font-size:13px; font-weight:bold; transition:all 0.2s;">View Deal</a>
          </div>
        </div>
      `;
    });
  } else {
    html += `<p style="color:var(--muted); text-align:center; padding:20px;">No other records found.</p>`;
  }

  html += `</div></div>`;
  div.innerHTML = html;
}