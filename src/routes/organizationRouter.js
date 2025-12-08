const express = require("express");
const { createOrganization, getOrganizations, updateOrganization, deleteOrganization } = require("../controllers/organizationController");
const adminOnly = require("../middlewere/adminOnly");

const router = express.Router();

router.post("/new-org", adminOnly, createOrganization);
router.get("/all-org", adminOnly, getOrganizations);
router.put("/update/:id", adminOnly, updateOrganization);
router.delete("/delete/:id", adminOnly, deleteOrganization);

module.exports = router