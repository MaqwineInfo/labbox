const mongoose = require("mongoose");

const DocterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact_no: { type: Number, required: true },
    hospital: { type: String, required: true },
    degree: { type: String, required: true },

    // 0 = false, 1 = true, 2 = deleted
    status: { type: Number, default: 1, enum: [0, 1, 2] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Docter", DocterSchema);
