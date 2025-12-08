const deviceModel = require("../models/deviceModel");
const venueModel = require("../models/venueModal");

// Helper function to generate Base64 API key
const generateApiKey = (deviceId, conditions) => {
    const data = JSON.stringify({ deviceId, conditions });
    return Buffer.from(data).toString("base64");
};


const createDevice = async (req, res) => {
    try {
        const { deviceId, venueId, conditions } = req.body;

        // ✅ Validate required fields
        if (!deviceId || !venueId) {
            return res.status(400).json({ message: "deviceId and venueId are required" });
        }

        // ✅ Check venue existence
        const venue = await venueModel.findById(venueId);
        if (!venue) return res.status(404).json({ message: "Venue not found" });

        // ✅ Prevent duplicate device IDs
        const existing = await deviceModel.findOne({ deviceId });
        if (existing) return res.status(400).json({ message: "Device ID already exists" });

        // ✅ Validate conditions (if provided)
        if (conditions && !Array.isArray(conditions)) {
            return res.status(400).json({ message: "Conditions must be an array" });
        }

        if (conditions && conditions.length > 0) {
            for (const cond of conditions) {
                if (!cond.type || !cond.operator || cond.value === undefined) {
                    return res.status(400).json({
                        message: "Each condition must include type, operator, and value",
                    });
                }
            }
        }

        // ✅ Generate Base64 API Key (deviceId + conditions)
        const apiKey = generateApiKey(deviceId, conditions || []);

        // ✅ Create new device entry
        const device = await deviceModel.create({
            deviceId,
            venue: venueId,
            conditions: conditions || [],
            apiKey,
            FreezerData: {},
            AmbientData: {},
        });

        res.status(201).json({
            message: "Device created successfully",
            device,
        });
    } catch (error) {
        console.error("Error creating device:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getAllDevices = async (req, res) => {
    try {
        const devices = await deviceModel.find()
            .populate("venue", "name")
        res.status(200).json(devices);
    } catch (err) {
        console.error("Error fetching devices:", err);
        res.status(500).json({ message: "Failed to fetch devices" });
    }
};

const getSingleDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await deviceModel.findById(id).populate("venue", "name");
        res.status(200).json({ device });
    } catch (error) {
        console.log("error while fetching device", error.message);
        res.status(500).json({ message: "Failed to fetch device" });
    }
}

const getDevicesByVenue = async (req, res) => {
    try {
        const { venueId } = req.params;

        if (!venueId) {
            return res.status(400).json({ message: "Venue ID is required" });
        }

        const devices = await deviceModel.find({ venue: venueId }).populate("venue", "name");

        if (!devices.length) {
            return res.status(404).json({ message: "No devices found for this venue" });
        }

        res.status(200).json({ devices });
    } catch (error) {
        console.error("Error fetching devices by venue:", error.message);
        res.status(500).json({ message: "Failed to fetch devices" });
    }
};


const updateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const { deviceId, venueId, conditions } = req.body;

        const device = await deviceModel.findById(id);
        if (!device) return res.status(404).json({ message: "Device not found" });

        if (venueId) {
            const venue = await venueModel.findById(venueId);
            if (!venue) return res.status(404).json({ message: "Venue not found" });
        }

        if (conditions && !Array.isArray(conditions)) {
            return res.status(400).json({ message: "Conditions must be an array" });
        }

        if (conditions && conditions.length > 0) {
            for (const cond of conditions) {
                if (!cond.type || !cond.operator || cond.value === undefined) {
                    return res.status(400).json({
                        message: "Each condition must include type, operator, and value",
                    });
                }
            }
        }

        if (deviceId) device.deviceId = deviceId;
        if (venueId) device.venue = venueId;
        if (conditions) device.conditions = conditions;

        const newApiKey = generateApiKey(device.deviceId, device.conditions);
        device.apiKey = newApiKey;

        await device.save();

        res.status(200).json({
            message: "Device updated successfully",
            device,
        });

    } catch (error) {
        console.error("Error updating device:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


const deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await deviceModel.findByIdAndDelete(id);

        if (!deleted) return res.status(404).json({ message: "Device not found" });
        res.status(200).json({ message: "Device deleted successfully" });
    } catch (err) {
        console.error("Error deleting device:", err);
        res.status(500).json({ message: "Failed to delete device" });
    }
};



module.exports = { createDevice, getDevicesByVenue, getAllDevices, deleteDevice, updateDevice, getSingleDevice };
