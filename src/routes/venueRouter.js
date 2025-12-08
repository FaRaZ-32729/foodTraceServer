const express = require("express");
const { createVenue, getVenues, updateVenue, deleteVenue, getSingleVenue, getVenuesByOrganization } = require("../controllers/venueController");
const adminOnly = require("../middlewere/adminOnly");

const router = express.Router();

router.post("/add", adminOnly, createVenue);
router.get("/all", adminOnly, getVenues);
router.get("/single-venue/:id", getSingleVenue);
router.get("/venue-by-org/:organizationId", getVenuesByOrganization);
router.put("/update/:id", adminOnly, updateVenue);
router.delete("/delete/:id", adminOnly, deleteVenue);

module.exports = router;