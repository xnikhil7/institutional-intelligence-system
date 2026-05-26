const db = require("../config/db");

exports.assignFees = async (student) => {
 try {

   const [template] = await db.query(
     "SELECT * FROM fee_templates WHERE branch=? AND year=? AND caste=? LIMIT 1",
     [student.branch, student.year, student.caste]
   );

   if(!template.length){
     console.log("No template found", student);
     return;
   }

   const t = template[0];

   const total =
     (t.tuition_fee || 0) +
     (t.development_fee || 0) +
     (t.exam_fee || 0) +
     (t.other_fee || 0);

   await db.query(
     `INSERT INTO student_fees
      (student_id, academic_year, tuition, development, exam, other, total, status)
      VALUES (?,?,?,?,?,?,?,?)`,
     [
       student.id,
       student.year,
       t.tuition_fee,
       t.development_fee,
       t.exam_fee,
       t.other_fee,
       total,
       "UNPAID"
     ]
   );

   console.log("✅ Fees assigned for student:", student.id);

 } catch(err) {
   console.error("Auto fee assign error:", err);
 }
};

exports.getStudentFees = async (req,res)=>{
 try{

   const student = req.user.id;

   const [rows] = await db.query(
     "SELECT * FROM student_fees WHERE student_id=?",
     [student]
   );

   if(!rows.length){
     return res.status(404).json({msg:"Fees not assigned yet"});
   }

   const f = rows[0];

   res.json({
     tuition_fee: f.tuition,
     development_fee: f.development,
     exam_fee: f.exam,
     other_fee: f.other,
     total_fee: f.total,
     paid_amount: f.paid_amount || 0,
     pending_amount: f.pending_amount !== undefined ? f.pending_amount : f.total,
     status: f.status
   });

 }catch(err){
   res.status(500).json({error:err.message});
 }
};

exports.createFeesTemplate = async (req,res)=>{
 try{

   const {branch,year,caste,tuition,development,exam,other} = req.body;

   // ✅ Validation
   if(
     !branch || !year || !caste ||
     tuition == null || development == null || exam == null || other == null
   ){
     return res.status(400).json({msg:"All fields required"});
   }

   // ✅ Normalize
   const cleanBranch = branch.trim().toUpperCase();
   const cleanCaste = caste.trim().toUpperCase();
   const cleanYear = Number(year);

   const t = Number(tuition);
   const d = Number(development);
   const e = Number(exam);
   const o = Number(other);

   if(isNaN(cleanYear) || isNaN(t) || isNaN(d) || isNaN(e) || isNaN(o)){
     return res.status(400).json({msg:"Invalid numbers"});
   }

   const total = t + d + e + o;

   // 🔥 DELETE existing (simple & reliable)
   await db.query(
     "DELETE FROM fee_templates WHERE branch=? AND year=? AND caste=?",
     [cleanBranch, cleanYear, cleanCaste]
   );

   // 🔥 INSERT fresh
   const [result] = await db.query(
     `INSERT INTO fee_templates
      (branch,year,caste,tuition_fee,development_fee,exam_fee,other_fee,total_fee)
      VALUES (?,?,?,?,?,?,?,?)`,
     [cleanBranch, cleanYear, cleanCaste, t, d, e, o, total]
   );

   res.status(201).json({msg:"Template saved successfully", data: {id: result.insertId, branch: cleanBranch, year: cleanYear, caste: cleanCaste, t, d, e, o, total}});

 }catch(err){
   console.error("Create template error:", err);
   res.status(500).json({error:"Server error"});
 }
};


exports.getTemplates = async (req,res)=>{
 try{

   const [rows] = await db.query("SELECT * FROM fee_templates");

   res.json(rows);

 }catch(err){
   res.status(500).json({error:err.message});
 }
};

exports.deleteTemplate = async (req,res)=>{
 try{

   await db.query(
    "DELETE FROM fee_templates WHERE id=?",
    [req.params.id]
   );

   res.json({msg:"Template deleted"});

 }catch(err){
   res.status(500).json({error:err.message});
 }
};

exports.searchPending = async (req,res)=>{
 try{

   const val = req.params.value;

   const [rows] = await db.query(
     `SELECT sf.*, u.name, u.email, u.aadhar as student_id 
      FROM student_fees sf 
      JOIN users u ON sf.student_id = u.id 
      WHERE u.email=? OR u.aadhar=?`,
     [val,val]
   );

   res.json(rows);

 }catch(err){
   res.status(500).json({error:err.message});
 }
};
exports.updateFees = async (req, res) => {
  try {
    const feeId = req.params.id;
    const { total, paid } = req.body;
    
    if(total == null || paid == null) return res.status(400).json({msg:"Missing total or paid"});
    if(total < 0 || paid < 0) return res.status(400).json({msg:"Values cannot be negative"});
    if(paid > total) return res.status(400).json({msg:"Paid amount cannot exceed total fees"});
    
    let pending = total - paid;
    let status = pending <= 0 ? "PAID" : "UNPAID";
    
    try {
      await db.query(
        "UPDATE student_fees SET total=?, paid_amount=?, pending_amount=?, status=? WHERE id=?",
        [total, paid, pending, status, feeId]
      );
    } catch(dbErr) {
       console.error("Column mapping failed falling back:", dbErr.message);
       await db.query(
         "UPDATE student_fees SET total=?, status=? WHERE id=?",
         [total, status, feeId]
       );
    }
    
    res.json({msg:"Fees updated successfully"});
  } catch(err) {
    res.status(500).json({error: err.message});
  }
};
