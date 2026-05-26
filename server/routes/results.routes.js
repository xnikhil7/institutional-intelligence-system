const express = require("express");
const router = express.Router();
const r = require("../controllers/results.controller");
const auth = require("../middleware/auth.middleware");

router.post("/add", auth, r.addResult);
router.get("/student", auth, r.getStudentResults);
router.get("/all", auth, r.getAllResults);

module.exports = router;