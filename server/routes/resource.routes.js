const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth.middleware");

// Get all resources
router.get("/", auth, async (req,res)=>{
 try{

   const [rows] = await db.query(
     "SELECT id,name,capacity,description FROM resources"
   );

   res.json(rows);

 }catch(err){
   res.status(500).json({error:err.message});
 }
});


// Delete resource
router.delete("/:id", auth, async (req,res)=>{
  try{

    const {id}=req.params;

    await db.query(
      "DELETE FROM resources WHERE id=?",
      [id]
    );

    res.json({message:"Resource deleted"});

  }catch(err){
    res.status(500).json({error:err.message});
  }
});

module.exports = router;