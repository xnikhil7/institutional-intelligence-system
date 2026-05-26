const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const db = require("../config/db");

// GET ALL EXAMS (Role-based)
router.get("/", auth, async (req,res)=>{
  try{

    const userRows = await db.query("SELECT role, branch, year FROM users WHERE id=?", [req.user.id]);
    const user = userRows[0][0];

    if(!user){
      return res.status(404).json({error:"User not found"});
    }

    if(user.role === 'STUDENT'){
      const [rows] = await db.query("SELECT * FROM exams WHERE branch=? AND year=? ORDER BY date", [user.branch, user.year]);
      res.json(rows);
    } else {
      const [rows] = await db.query("SELECT * FROM exams ORDER BY date");
      res.json(rows);
    }

  }catch(err){
    res.status(500).json({error:err.message});
  }
});

// ADD EXAM
router.post("/add", auth, async (req,res)=>{
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
});

// DELETE EXAM
router.delete("/:id", auth, async (req,res)=>{
  try{

    await db.query(
      "DELETE FROM exams WHERE id=?",
      [req.params.id]
    );

    res.json({msg:"Exam deleted"});

  }catch(err){
    res.status(500).json({error:err.message});
  }
});

module.exports = router;