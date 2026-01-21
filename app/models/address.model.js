const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        address: { type: String, required: true },
        save_as: { type: String, required: true },

        // (0 = false, 1 = true)
        current_add: { type: Number, default: 1, enum: [0, 1] },
        is_main: { type: Number, default: 1, enum: [0, 1] },

        lat: { type: String },
        long: { type: String },

        // (0 = false, 1 = true, 2 = deleted)
        status: { type: Number, default: 1, enum: [0, 1, 2] }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Address", AddressSchema);
