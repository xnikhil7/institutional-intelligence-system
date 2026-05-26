const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const issue = require("../controllers/resultIssue.controller");

router.post("/raise", auth, issue.raiseIssue);
router.get("/", auth, issue.getIssues);
router.put("/handle/:id", auth, issue.handleIssue);
module.exports = router;