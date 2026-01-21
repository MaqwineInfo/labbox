const mongoose = require("mongoose");

const PasswordResetTokenSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    token: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
  }
);

module.exports = mongoose.model("PasswordResetToken", PasswordResetTokenSchema);
