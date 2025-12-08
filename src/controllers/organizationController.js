const orgModel = require("../models/organizationModel");

// CREATE
const createOrganization = async (req, res) => {
    try {
        let { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Organization name is required" });
        }

        name = name.trim().toLowerCase();

        const existingOrg = await orgModel.findOne({ name });
        if (existingOrg) {
            return res.status(400).json({ message: "Organization already exists" });
        }

        const org = await orgModel.create({ name });

        res.status(201).json({
            message: "Organization created successfully",
            organization: org,
        });
    } catch (err) {
        console.error("Error creating organization:", err);
        res.status(500).json({
            message: "Internal Server Error while creating organization",
        });
    }
};

// READ
const getOrganizations = async (req, res) => {
    try {
        const orgs = await orgModel.find();
        res.status(200).json(orgs);
    } catch (error) {
        console.log("error to fetch organizations");
        return res.status(500).json({ message: "Server Error" });
    }
};

// UPDATE
const updateOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        let { name } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Organization ID is required" });
        }

        if (!name) {
            return res.status(400).json({ message: "Organization name is required" });
        }

        name = name.trim().toLowerCase();

        const existingOrg = await orgModel.findOne({ name });
        if (existingOrg && existingOrg._id.toString() !== id) {
            return res.status(400).json({ message: "Another organization with this name already exists" });
        }

        const org = await orgModel.findByIdAndUpdate(
            id,
            { name },
            { new: true, runValidators: true }
        );

        if (!org) {
            return res.status(404).json({ message: "Organization not found" });
        }

        res.status(200).json({
            message: "Organization updated successfully",
            organization: org,
        });
    } catch (err) {
        console.error("Error updating organization:", err);
        res.status(500).json({
            message: "Internal Server Error while updating organization",
        });
    }
};

// DELETE
const deleteOrganization = async (req, res) => {
    try {
        const { id } = req.params;

        const org = await orgModel.findById(id);
        if (!org) {
            return res.status(404).json({ message: "Organization not found" });
        }

        await orgModel.findByIdAndDelete(id);

        res.status(200).json({
            message: "Organization deleted successfully",
            deletedOrganization: org,
        });

    } catch (err) {
        console.error("Error deleting organization:", err);
        res.status(500).json({
            message: "Internal Server Error while deleting organization",
        });
    }
};

module.exports = { createOrganization, getOrganizations, updateOrganization, deleteOrganization }