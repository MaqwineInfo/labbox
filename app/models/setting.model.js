const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema(
  {
    terms_use: { type: String, default: null },
    privacy_policy: { type: String, default: null },
    cancellation_refund: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", SettingSchema);
