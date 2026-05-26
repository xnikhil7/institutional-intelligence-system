const db = require("../config/db");

exports.getUsers = async (req,res)=>{
 try{
   const [rows] = await db.query("SELECT id, name, email, role, aadhar, branch, year, caste FROM users");
   res.json(rows);
 }catch(err){
   res.status(500).json({error:err.message});
 }
};

const bcrypt = require("bcrypt");

exports.createUser = async (req,res)=>{
 try{

  const {name,email,password,role,branch,year,caste,aadhar} = req.body;

  if(!name || !email || !password || !role){
   return res.status(400).json({msg:"Missing required fields"});
  }

  const bcrypt = require("bcrypt");
  const hashed = await bcrypt.hash(password,10);

  // ================= STUDENT =================
  if(role === "STUDENT"){

   if(!branch || !year || !aadhar){
    return res.status(400).json({msg:"Student details missing"});
   }

   // ✅ Normalize data (CRITICAL)
   const cleanBranch = branch.trim().toUpperCase();
   const cleanCaste = (caste || "OPEN").trim().toUpperCase();
   const cleanYear = Number(year);

   const [result] = await db.query(
    `INSERT INTO users
     (name,email,password,role,year,branch,caste,aadhar)
     VALUES (?,?,?,?,?,?,?,?)
     RETURNING id`,
    [
      name.trim(),
      email.trim(),
      hashed,
      role,
      cleanYear,
      cleanBranch,
      cleanCaste,
      aadhar
    ]
   );

   const createdUserId = result.id || result.insertId;
   const feesController = require("./fees.controller");

   console.log("Creating student:", {
     id: createdUserId,
     branch: cleanBranch,
     year: cleanYear,
     caste: cleanCaste
   });

   await feesController.assignFees({
     id: createdUserId,
     branch: cleanBranch,
     year: cleanYear,
     caste: cleanCaste
   });

  }

  // ================= ADMIN / FACULTY =================
  else{

   await db.query(
    `INSERT INTO users
     (name,email,password,role)
     VALUES (?,?,?,?)`,
    [
      name.trim(),
      email.trim(),
      hashed,
      role
    ]
   );

  }

  res.json({msg:"User created successfully"});

 }catch(err){

  const isDuplicate = err.code === "ER_DUP_ENTRY" || err.code === "23505";
  const detail = err.detail || "";

  if(isDuplicate){
    if(err.sqlMessage?.includes("email") || detail.includes("email")){
      return res.status(400).json({msg:"Email already exists"});
    }

    if(err.sqlMessage?.includes("aadhar") || detail.includes("aadhar")){
      return res.status(400).json({msg:"Aadhar already exists"});
    }

    return res.status(400).json({msg:"Duplicate entry"});
  }

  console.error("Create user error:", err);
  res.status(500).json({msg:"Server error occurred"});
 }
};

exports.deleteUser = async (req,res)=>{
 try{

   const [user] = await db.query("SELECT role FROM users WHERE id=?", [req.params.id]);
   
   if (user.length > 0 && user[0].role === 'STUDENT') {
      await db.query("DELETE FROM student_fees WHERE student_id=?", [req.params.id]);
      await db.query("DELETE FROM attendance WHERE student_id=?", [req.params.id]);
      await db.query("DELETE FROM results WHERE student_id=?", [req.params.id]);
      await db.query("DELETE FROM result_issues WHERE student_id=?", [req.params.id]);
   }

   await db.query(
     "DELETE FROM users WHERE id=?",
     [req.params.id]
   );

   res.json({msg:"User deleted successfully"});

 }catch(err){
   res.status(500).json({error:err.message});
 }
};


/* RESOURCES */

exports.getResources = async (req,res)=>{
 try{

   const [rows] = await db.query("SELECT * FROM resources");
   res.json(rows);

 }catch(err){
   res.status(500).json({error:err.message});
 }
};

exports.addResource = async (req,res)=>{
 try{

   const {name,capacity,description} = req.body;

   await db.query(
    "INSERT INTO resources(name,capacity,description) VALUES(?,?,?)",
    [name,capacity,description]
   );

   res.json({msg:"Resource added"});

 }catch(err){
   res.status(500).json({error:err.message});
 }
};

exports.deleteResource = async (req,res)=>{
 try{

   await db.query(
    "DELETE FROM resources WHERE id=?",
    [req.params.id]
   );

   res.json({msg:"Resource deleted"});

 }catch(err){
   res.status(500).json({error:err.message});
 }
};


/* BOOKS */

exports.getBooks = async (req,res)=>{
 try{

   const [rows] = await db.query("SELECT * FROM books");
   res.json(rows);

 }catch(err){
   res.status(500).json({error:err.message});
 }
};

exports.addBook = async (req,res)=>{
 try{

   const {name,author,status} = req.body;

   await db.query(
    "INSERT INTO books(name,author,status) VALUES(?,?,?)",
    [name,author,status]
   );

   res.json({msg:"Book added"});

 }catch(err){
   res.status(500).json({error:err.message});
 }
};

exports.deleteBook = async (req,res)=>{
 try{

   await db.query(
    "DELETE FROM books WHERE id=?",
    [req.params.id]
   );

   res.json({msg:"Book deleted"});

 }catch(err){
   res.status(500).json({error:err.message});
 }
};


/* EXAMS */

exports.getExams = async (req,res)=>{
 try{

   const [rows] = await db.query("SELECT * FROM exams");
   res.json(rows);

 }catch(err){
   res.status(500).json({error:err.message});
 }
};

exports.addExam = async (req,res)=>{
 try{

   const {branch,year,subject,date,time} = req.body;

   await db.query(
    "INSERT INTO exams(branch,year,subject,date,time) VALUES(?,?,?,?,?)",
    [branch,year,subject,date,time]
   );

   res.json({msg:"Exam added"});

 }catch(err){
   res.status(500).json({error:err.message});
 }
};

exports.deleteExam = async (req,res)=>{
 try{

   await db.query(
    "DELETE FROM exams WHERE id=?",
    [req.params.id]
   );

   res.json({msg:"Exam deleted"});

 }catch(err){
   res.status(500).json({error:err.message});
 }
};