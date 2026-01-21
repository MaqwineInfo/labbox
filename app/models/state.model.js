const mongoose = require("mongoose");

const StateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },

    // Follow your global rule (0 = false, 1 = true, 2 = deleted)
    status: { type: Number, default: 1, enum: [0, 1, 2] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("State", StateSchema);
