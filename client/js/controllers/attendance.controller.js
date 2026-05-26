const db = require("../config/db");

// ================= MARK ATTENDANCE =================
exports.markAttendance = async (req,res)=>{
 try{

   if(req.user.role !== "STUDENT")
     return res.status(403).json({msg:"Students only"});

   const studentId = req.user.id;
   const {lat,lng,session_id} = req.body;

   if(!lat || !lng || !session_id)
     return res.status(400).json({msg:"Missing data"});

   const latNum = parseFloat(lat);
   const lngNum = parseFloat(lng);

   // CHECK SESSION VALIDITY
   const [session] = await db.query(
     "SELECT subject FROM attendance_sessions WHERE id=? AND expire_at > NOW()",
     [session_id]
   );

   if(session.length === 0)
     return res.status(400).json({msg:"Session expired"});

   const subject = session[0].subject;
  //HOME
  const campusLat = 19.223307010794304;     
  const campusLng  = 73.13709934155591;
  const radius = 200; // meters

  // COLLEGE
  // const campusLat = 19.061605793304224;      
  // const campusLng  = 73.3111667960819;
  // const radius = 200; // meters


  //COLLEGE GATE
  // const campusLat = 19.06272083845079;      
  // const campusLng  = 73.31291963449013;
  // const radius = 200; // meters
  
  function dist(a,b,c,d){
     const R=6371e3;
     const p=Math.PI/180;
     const x=(c-a)*p;
     const y=(d-b)*p;
     const A=Math.sin(x/2)**2+
       Math.cos(a*p)*Math.cos(c*p)*
       Math.sin(y/2)**2;
     return R*2*Math.atan2(Math.sqrt(A),Math.sqrt(1-A));
   }

   if(dist(latNum,lngNum,campusLat,campusLng)>radius)
     return res.status(403).json({msg:"Outside campus"});

   // CHECK DUPLICATE
   const [ex] = await db.query(
     "SELECT id FROM attendance WHERE student_id=? AND session_id=?",
     [studentId,session_id]
   );

   if(ex.length)
     return res.json({msg:"Already marked"});

   // INSERT ATTENDANCE
   await db.query(
     `INSERT INTO attendance
     (student_id,date,status,latitude,longitude,subject,session_id)
     VALUES (?,CURDATE(),'present',?,?,?,?)`,
     [studentId,latNum,lngNum,subject,session_id]
   );

   const io = req.app.get("io");
   io.to("FACULTY").emit("attendanceMarked",{session_id});

   res.json({msg:"Attendance marked"});
 }
 catch(e){
   console.log(e);
   res.status(500).json({msg:"Error"});
 }
};


// ================= CREATE SESSION =================
exports.createSession = async (req,res)=>{
 try{
   if(req.user.role !== "FACULTY")
     return res.status(403).json({msg:"Faculty only"});

   const {subject} = req.body;

   if(!subject)
     return res.status(400).json({msg:"Subject required"});

   const [result] = await db.query(
     `INSERT INTO attendance_sessions
      (subject, faculty_id, expire_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
     [subject, req.user.id]
   );

   // SOCKET EMIT TO STUDENTS
   const io = req.app.get("io");
   io.to("STUDENT").emit("attendanceSessionStarted",{subject});

   res.json({message:"Session started", session_id:result.insertId});
 }
 catch(e){
   console.log(e);
   res.status(500).json({msg:"Error"});
 }
};


// ================= ACTIVE SESSIONS =================
exports.getActiveSessions = async (req,res)=>{
 try{
   const [r]=await db.query(`
     SELECT id,subject
     FROM attendance_sessions
     WHERE NOW()<expire_at
   `);
   res.json(r);
 }
 catch{
   res.status(500).json({msg:"Error"});
 }
};


exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [rows] = await db.query(`
      SELECT 
        s.subject,
        COUNT(DISTINCT s.id) AS total,
        COUNT(a.id) AS present
      FROM attendance_sessions s
      LEFT JOIN attendance a 
        ON a.session_id = s.id 
        AND a.student_id = ?
      GROUP BY s.subject
    `, [studentId]);

    res.json(rows);
  } catch (e) {
    console.log(e);
    res.status(500).json({ msg: "Error" });
  }
};

exports.getReport = async (req, res) => {
  try {

    const [sessions] = await db.query(`
      SELECT 
        s.id,
        s.subject,
        s.created_at,
        (
          SELECT COUNT(*) 
          FROM attendance_sessions s2 
          WHERE s2.subject = s.subject 
            AND s2.id <= s.id
        ) AS session_number
      FROM attendance_sessions s
      ORDER BY s.subject, s.id
    `);

    const groupedData = {};

    for (let session of sessions) {
      const [students] = await db.query(`
        SELECT u.id, u.name
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        WHERE a.session_id = ?
      `, [session.id]);

      if (!groupedData[session.subject]) {
        groupedData[session.subject] = [];
      }

      groupedData[session.subject].push({
        id: session.id,
        date: session.created_at,
        session_number: session.session_number,
        students: students
      });
    }

    res.json(groupedData);

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
};