const express = require("express");
const router = express.Router();

const attendance = require("../controllers/attendance.controller");
const auth = require("../middleware/auth.middleware");

router.post("/mark", auth, attendance.markAttendance);
router.get("/student", auth, attendance.getStudentAttendance);
router.post("/session", auth, attendance.createSession);
router.get("/sessions/active", auth, attendance.getActiveSessions);
router.get("/report", auth, attendance.getReport);

module.exports = router;
