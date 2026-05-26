const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../config/db");

exports.register = async (req,res)=>{
 try{

  const {name,email,password,branch,year,caste,aadhar} = req.body;

  if(!name || !email || !password || !branch || !year || !aadhar)
   return res.status(400).json({msg:"Missing fields"});
  // 🔒 Aadhar must be exactly 12 digits
  if(!/^\d{12}$/.test(aadhar)){
    return res.status(400).json({msg:"Aadhar must be exactly 12 digits"});
  }

  const hash = await bcrypt.hash(password,10);

  const [user] = await db.query(
   `INSERT INTO users
    (name,email,password,role,branch,year,caste,aadhar)
    VALUES (?,?,?,'STUDENT',?,?,?,?)
    RETURNING id`,
   [name,email,hash,branch,year,caste,aadhar]
  );

  const userId = user.id || user.insertId;

  // ✅ SINGLE SOURCE OF TRUTH for fee assignment
  const feesController = require("./fees.controller");

  await feesController.assignFees({
    id: userId,
    branch,
    year,
    caste
  });

  // ✅ send response AFTER everything is done
  res.json({msg:"Signup successful"});

 }catch(err){

  console.log(err);

  // 🔥 HANDLE DUPLICATE ENTRIES
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

  res.status(500).json({msg:"Server error"});
}
};


exports.login = async (req,res)=>{
 try{

  const {email,password} = req.body;

  const [rows] = await db.query(
   "SELECT * FROM users WHERE email=?",
   [email]
  );

  if(!rows.length)
   return res.status(401).json({msg:"Invalid email"});

  const user = rows[0];

  const valid = await bcrypt.compare(password,user.password);

  if(!valid)
   return res.status(401).json({msg:"Wrong password"});

  const token = jwt.sign(
   {id:user.id,role:user.role},
   "secretkey", 
   {expiresIn:"1d"}
  );

  res.json({
   token,
   user:{
    id:user.id,
    name:user.name,
    role:user.role
   }
  });

 }catch(err){
  console.log(err);
  res.status(500).json({msg:"Server error"});
 }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      "SELECT id, name, email, role, branch, year, caste, aadhar FROM users WHERE id=?",
      [userId]
    );

    if(!rows.length) return res.status(404).json({msg: "User not found"});

    res.json(rows[0]);

  } catch (err) {
    console.log(err);
    res.status(500).json({msg: "Server error"});
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ msg: "Name and email are required" });
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await db.query(
        "UPDATE users SET name=?, email=?, password=? WHERE id=?",
        [name, email, hash, userId]
      );
    } else {
      await db.query(
        "UPDATE users SET name=?, email=? WHERE id=?",
        [name, email, userId]
      );
    }

    res.json({ msg: "Profile updated successfully" });
  } catch (err) {
    console.log(err);
    const isDuplicate = err.code === "ER_DUP_ENTRY" || err.code === "23505";
    if (isDuplicate) {
      return res.status(400).json({ msg: "Email already in use" });
    }
    res.status(500).json({ msg: "Server error" });
  }
};