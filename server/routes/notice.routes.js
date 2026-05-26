const express = require("express");
const router = express.Router();

const notice = require("../controllers/notice.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, notice.createNotice);
router.get("/", auth, notice.getNotices);
router.delete("/:id", auth, notice.deleteNotice);

module.exports = router;