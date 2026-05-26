const db = require("../config/db");

exports.createNotice = async (req,res)=>{
 try{

   const {title,message} = req.body;

   await db.query(
     "INSERT INTO notices(title,message) VALUES(?,?)",
     [title,message]
   );

   res.json({msg:"Notice posted"});

 }catch(err){
   res.status(500).json({error:err.message});
 }
};

exports.getNotices = async (req,res)=>{
 try{

   const [rows] = await db.query(
     "SELECT * FROM notices ORDER BY id DESC"
   );

   res.json(rows);

 }catch(err){
   res.status(500).json({error:err.message});
 }
};

exports.deleteNotice = async (req,res)=>{
 try{

   await db.query(
    "DELETE FROM notices WHERE id=?",
    [req.params.id]
   );

   res.json({msg:"Notice deleted"});

 }catch(err){
   res.status(500).json({error:err.message});
 }
};