const express = require("express");
const router = express.Router();

const feesController = require("../controllers/fees.controller");
const auth = require("../middleware/auth.middleware");

router.get("/student", auth, feesController.getStudentFees);
router.post("/template", auth, feesController.createFeesTemplate);
router.get("/templates", auth, feesController.getTemplates);
router.delete("/template/:id", auth, feesController.deleteTemplate);
router.get("/search/:value", auth, feesController.searchPending);
router.put("/update/:id", auth, feesController.updateFees);
module.exports = router;