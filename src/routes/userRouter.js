const express = require("express");
const { getAllUsers, updateUserStatus, updateUserProfile, deleteUser } = require("../controllers/userController");
const adminOnly = require("../middlewere/adminOnly");
const authenticate = require("../middlewere/authMiddleware");

const router = express.Router();

router.put("/update-status/:id", authenticate, adminOnly, updateUserStatus);
router.get("/all", authenticate, adminOnly, getAllUsers);
router.put("/update/:id", authenticate, adminOnly, updateUserProfile);
router.delete("/delete/:id", authenticate, adminOnly, deleteUser);


module.exports = router;