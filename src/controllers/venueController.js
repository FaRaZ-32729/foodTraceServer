const venueModel = require("../models/venueModal");


const createVenue = async (req, res) => {
    try {
        const { name, organization } = req.body;

        if (!name || !organization)
            return res.status(400).json({ message: "Venue name and organization are required" });

        const existingVenue = await venueModel.findOne({ name, organization });
        if (existingVenue) {
            return res.status(400).json({
                message: "A venue with this name already exists in this organization",
            });
        }

        const venue = await venueModel.create({ name, organization });
        res.status(201).json({
            message: "Venue created successfully",
            venue,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating venue" });
    }
};

const getVenues = async (req, res) => {
    try {
        const venues = await venueModel.find().populate("organization");
        res.json(venues);
    } catch (error) {
        res.status(500).json({ message: "Error fetching venues" });
    }
};

const getSingleVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const venue = await venueModel.findById(id).populate("organization", "name");
        return res.status(200).json({ venue });

    } catch (error) {
        console.log("error while fetching the venue", error.message);
        return res.status(500).json({ message: "Failed to fetch venue" });
    }
}

const getVenuesByOrganization = async (req, res) => {
    try {
        const { organizationId } = req.params;

        if (!organizationId)
            return res.status(400).json({ message: "Organization ID is required" });

        const venues = await venueModel.find({ organization: organizationId });

        if (!venues.length)
            return res.status(404).json({ message: "No venues found for this organization" });

        res.status(200).json({ venues });
    } catch (error) {
        console.error("Error fetching venues by organization:", error.message);
        res.status(500).json({ message: "Error fetching venues" });
    }
};


const updateVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name)
            return res.status(400).json({ message: "Venue name is required" });

        const venue = await venueModel.findById(id);
        if (!venue) return res.status(404).json({ message: "Venue not found" });

        const duplicateVenue = await venueModel.findOne({
            name,
            organization: venue.organization,
            _id: { $ne: id },
        });

        if (duplicateVenue) {
            return res.status(400).json({
                message: "A venue with this name already exists in this organization",
            });
        }

        venue.name = name;
        const updatedVenue = await venue.save();

        res.json({
            message: "Venue updated successfully",
            venue: updatedVenue,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating venue" });
    }
};


const deleteVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await venueModel.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Venue not found" });

        res.json({ message: "Venue deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting venue" });
    }
};

module.exports = { createVenue, getVenues, updateVenue, deleteVenue, getSingleVenue, getVenuesByOrganization };
