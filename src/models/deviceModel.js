const mongoose = require("mongoose");

const conditionSchema = new mongoose.Schema({
    type: { type: String, required: true },
    operator: { type: String, required: true },
    value: { type: Number, required: true },
});

const deviceSchema = new mongoose.Schema(
    {
        deviceId: { type: String, unique: true, required: true },
        venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
        FreezerData: { type: Object, default: {} },
        AmbientData: { type: Object, default: {} },
        conditions: [conditionSchema],
        apiKey: { type: String, unique: true, required: true },
        batteryAlert: { type: Boolean, default: false },
        refrigeratorAlert: { type: Boolean, default: false },

        versionId: { type: String, default: null },
    },
    { timestamps: true }
);

const deviceModel = mongoose.model("Device", deviceSchema);

module.exports = deviceModel;