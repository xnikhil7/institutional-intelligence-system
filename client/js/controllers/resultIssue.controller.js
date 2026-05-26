const db = require("../config/db");

// ================= RAISE ISSUE =================
exports.raiseIssue = async (req,res)=>{
 try{

   if(req.user.role !== "STUDENT")
     return res.status(403).json({msg:"Students only"});

   const {result_id,message} = req.body;

   if(!result_id || !message)
     return res.status(400).json({msg:"Missing data"});

   const studentId = req.user.id || req.user.user_id;

   await db.query(
   "INSERT INTO result_issues (result_id, student_id, message) VALUES (?,?,?)",
   [result_id, studentId, message]
   );

   res.json({msg:"Issue submitted"});

 }catch(err){
   console.log(err);
   res.status(500).json({msg:"Server error"});
 }
};

// ================= VIEW ISSUES =================
exports.getIssues = async (req,res)=>{
try{
if(req.user.role !== "ADMIN" && req.user.role !== "FACULTY")
return res.status(403).json({msg:"Not allowed"});


const [rows] = await db.query(`
SELECT 
  ri.*, 
  u.name AS student_name, 
  r.subject,
  r.internal,
  r.external,
  r.total,
  r.semester
FROM result_issues ri
JOIN users u ON ri.student_id = u.id
JOIN results r ON ri.result_id = r.id
ORDER BY ri.created_at DESC


`);


res.json(rows);


}
catch(err){
res.status(500).json({msg:"Server error"});
}
};

// ================= HANDLE ISSUE =================
exports.handleIssue = async (req,res)=>{
 try{

 if(req.user.role !== "FACULTY")
  return res.status(403).json({msg:"Faculty only"});

 const {id} = req.params;
 const {internal, external, message, action} = req.body;

 const [[issue]] = await db.query(
  "SELECT * FROM result_issues WHERE id=?",
  [id]
 );

 if(!issue)
  return res.status(404).json({msg:"Issue not found"});

 if(action === "RESOLVE"){

  const newInternal = internal ? Number(internal) : issue.internal;
  const newExternal = external ? Number(external) : issue.external;

  const total = newInternal + newExternal;

  await db.query(
   "UPDATE results SET internal=?, external=?, total=? WHERE id=?",
   [newInternal, newExternal, total, issue.result_id]
  );

  await db.query(
   "UPDATE result_issues SET status='RESOLVED', faculty_message=? WHERE id=?",
   [message || "Marks corrected", id]
  );
 }

 if(action === "DECLINE"){
  await db.query(
   "UPDATE result_issues SET status='DECLINED', faculty_message=? WHERE id=?",
   [message || "Issue not valid", id]
  );
 }

 const io = req.app.get("io");
 io.to("STUDENT").emit("issueUpdated",{});

 res.json({msg:"Issue handled"});

 }catch(err){
 console.log(err);
 res.status(500).json({msg:"Server error"});
 }
};
