const mongoose = require("mongoose");

const LaboratorySchema = new mongoose.Schema(
  {
    logo: { type: String, required: true },
    name: { type: String, required: true },

    owner: { type: String, required: true },

    contact_1: { type: String, required: true, unique: true },
    contact_2: { type: String, unique: true, default: null },

    email: { type: String, required: true, unique: true },

    address_1: { type: String, required: true },
    address_2: { type: String, default: null },

    city: { type: String, required: true },
    state: { type: String, required: true },
    zipcode: { type: Number, required: true },

    // 0 = False, 1 = True, 2 = Deleted
    status: { type: Number, default: 1, enum: [0, 1, 2] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Laboratory", LaboratorySchema);
