const db = require("../config/db");
const express = require("express");
const router = express.Router();
const admin = require("../controllers/admin.controller");
const auth = require("../middleware/auth.middleware");

// USERS
router.get("/users", auth, admin.getUsers);
router.post("/add-user", auth, admin.createUser);
router.delete("/delete-user/:id", auth, admin.deleteUser);

// RESOURCES
router.get("/resources", auth, admin.getResources);
router.get("/resources-public", auth, admin.getResources);
router.post("/add-resource", auth, admin.addResource);
router.delete("/delete-resource/:id", auth, admin.deleteResource);


// BOOKS
router.get("/books", auth, admin.getBooks);
router.post("/add-book", auth, admin.addBook);
router.delete("/delete-book/:id", auth, admin.deleteBook);

// EXAMS
router.get("/exams", auth, admin.getExams);
router.post("/add-exam", auth, admin.addExam);
router.delete("/delete-exam/:id", auth, admin.deleteExam);




module.exports = router;