require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const adminRoutes = require("./routes/admin.routes");
const feesRoutes = require("./routes/fees.routes");


const timetableRoutes = require("./routes/timetable.routes");

const db = require("./config/db");

const app = express();
const server = http.createServer(app);

/* ================= SOCKET ================= */

const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5501",
  "http://localhost:5500",
  "http://localhost:5501",
  "https://iis-client.vercel.app",
  "https://iis-client.onrender.com"
];

const extraOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

const corsOrigins = Array.from(new Set([...allowedOrigins, ...extraOrigins]));

const corsOptions = {
  origin: corsOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

io.on("connection", (socket) => {

  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", (role)=>{
    socket.join(role);
    console.log(`${socket.id} joined ${role}`);
  });

  socket.on("disconnect", ()=>{
    console.log("Socket disconnected:", socket.id);
  });

});

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(express.static("public"));

app.use(cors(corsOptions));

/* ================= ROUTES ================= */

app.use("/api/auth", require("./routes/auth.routes"));
// app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/resources", require("./routes/resource.routes"));
app.use("/api/attendance", require("./routes/attendance.routes"));
app.use("/api/results", require("./routes/results.routes"));
app.use("/api/notices", require("./routes/notice.routes"));
app.use("/api/result-issues", require("./routes/resultIssue.routes"));
app.use("/api/fees", require("./routes/fees.routes"));
app.use("/api/timetable", timetableRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/price", require("./routes/price.routes"));


/* ================= HEALTH CHECK ================= */

app.get("/", (req,res)=>{
  res.send("Backend running with Socket.IO 🚀");
});


/* ================= AI PRICE CHECK ================= */

app.post("/api/ai-price-check", async (req,res)=>{

  const { product, quantity } = req.body;

  if(!product || !quantity){
    return res.status(400).json({
      result:"Product and quantity required"
    });
  }

  try{

    const prompt = `
Give estimated vendor prices for ${quantity} units of ${product}.

Use realistic Indian vendors like:
- IndiaMart suppliers
- Amazon Business
- Udaan
- Local distributors

Return vendor name, price per unit and total price.
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model:"openai/gpt-3.5-turbo",
        messages:[
          { role:"user", content: prompt }
        ]
      },
      {
        headers:{
          "Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type":"application/json"
        }
      }
    );

    const result = response.data.choices[0].message.content;

    res.json({result});

  }catch(err){

    console.log("AI ERROR:", err.response?.data || err.message);

    res.status(500).json({
      result:"AI failed"
    });

  }

});


/* ================= ACADEMIC CALENDAR ================= */

app.get("/api/calendar", async(req,res)=>{

  try{

    const [rows] = await db.query(
      "SELECT * FROM academic_events ORDER BY date"
    );

    res.json(rows);

  }catch(err){

    console.log(err);
    res.status(500).json({error:"Calendar fetch failed"});

  }

});


/* ================= TODAY EVENT ================= */

app.get("/api/today-event", async(req,res)=>{

  try{

    const today = new Date().toISOString().split("T")[0];

    const [rows] = await db.query(
      "SELECT event FROM academic_events WHERE date=?",
      [today]
    );

    if(rows.length===0){
      return res.json({
        event:"No academic event today"
      });
    }

    res.json(rows[0]);

  }catch(err){

    console.log(err);
    res.status(500).json({
      error:"Event fetch failed"
    });

  }

});




/* ================= SERVER START ================= */

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

server.listen(PORT, ()=>{
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Either stop the existing process or set a different PORT in your .env file.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});