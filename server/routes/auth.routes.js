const express = require("express");
const router = express.Router();

const auth = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

// REGISTER
router.post("/register", auth.register);

// LOGIN
router.post("/login", auth.login);

// PROTECTED PROFILE
router.get("/profile", authMiddleware, auth.getProfile);

// UPDATE PROFILE
router.put("/profile", authMiddleware, auth.updateProfile);

module.exports = router;
