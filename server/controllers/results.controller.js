const db = require("../config/db");


// ================= ADD RESULT =================
exports.addResult = async (req,res)=>{
 try{

   if(req.user.role !== "FACULTY")
     return res.status(403).json({msg:"Faculty only"});

   const {student_id,subject,internal,external,semester} = req.body;

   if(!student_id || !subject || internal==null || external==null || !semester)
     return res.status(400).json({msg:"Missing data"});

   const total = parseInt(internal) + parseInt(external);

   await db.query(
     `INSERT INTO results
      (student_id,subject,internal,external,total,semester)
      VALUES (?,?,?,?,?,?)`,
     [student_id,subject,internal,external,total,semester]
   );

   res.json({msg:"Result added"});

 }catch(err){
   console.log(err);
   res.status(500).json({msg:"Error"});
 }
};



// ================= GET STUDENT RESULTS =================
exports.getStudentResults = async (req,res)=>{
 try{

   const studentId = req.user.id || req.user.user_id;

   const [rows] = await db.query(
    `SELECT
    r.id,
    r.subject,
    r.internal,
    r.external,
    r.total,
    r.semester,
    ri.status AS issue_status,
    ri.faculty_message,
    ri.created_at AS issue_created
    FROM results r
    LEFT JOIN result_issues ri
    ON r.id = ri.result_id
    AND ri.student_id = ?
    WHERE r.student_id=?
    ORDER BY r.id DESC`,
    [studentId, studentId]
    );

   res.json(rows);

 }catch(err){
   console.log(err);
   res.status(500).json({msg:"Error"});
 }
};



// ================= GET ALL RESULTS =================
exports.getAllResults = async (req,res)=>{
 try{
   const { subject, exam_name } = req.query;
   let query = `
      SELECT
        r.id,
        r.subject,
        r.internal,
        r.external,
        r.total,
        r.semester,
        u.name as student_name
      FROM results r
      JOIN users u
      ON r.student_id=u.id
      WHERE 1=1`;
   
   const params = [];
   if (subject) {
     query += ` AND r.subject = ?`;
     params.push(subject);
   }
   if (exam_name) {
     query += ` AND r.semester = ?`;
     params.push(exam_name);
   }
   
   query += ` ORDER BY r.id DESC`;

   const [rows] = await db.query(query, params);
   res.json(rows);

 }catch(err){
   console.log(err);
   res.status(500).json({msg:"Error"});
 }
};



// ================= RAISE ISSUE =================
// exports.raiseIssue = async (req,res)=>{
//  try{

//    const studentId = req.user.id || req.user.user_id;
//    const {result_id,message} = req.body;

//    if(!result_id || !message)
//      return res.status(400).json({msg:"Missing data"});

//    // prevent duplicate issue
//    const [existing] = await db.query(
//      "SELECT id FROM result_issues WHERE result_id=? AND student_id=? AND status='PENDING'",
//      [result_id,studentId]
//    );

//    if(existing.length)
//      return res.json({msg:"Issue already raised"});

//    await db.query(
//      `INSERT INTO result_issues
//       (result_id,student_id,message)
//       VALUES (?,?,?)`,
//      [result_id,studentId,message]
//    );

//    res.json({msg:"Issue submitted"});

//  }catch(err){
//    console.log(err);
//    res.status(500).json({msg:"Server error"});
//  }
// };



// ================= GET ISSUES =================
exports.getIssues = async (req,res)=>{
 try{

   const [rows] = await db.query(
     `SELECT
        i.id,
        i.message,
        i.status,
        u.name as student,
        r.subject
      FROM result_issues i
      JOIN users u ON i.student_id=u.id
      JOIN results r ON i.result_id=r.id`
   );

   res.json(rows);

 }catch(err){
   console.log(err);
   res.status(500).json({msg:"Error"});
 }
};



// ================= RESOLVE ISSUE =================
exports.resolveIssue = async (req,res)=>{
 try{

   const {issue_id,faculty_message} = req.body;

   await db.query(
     `UPDATE result_issues
      SET status='RESOLVED',
      faculty_message=?
      WHERE id=?`,
     [faculty_message,issue_id]
   );

   res.json({msg:"Issue resolved"});

 }catch(err){
   console.log(err);
   res.status(500).json({msg:"Error"});
 }
};