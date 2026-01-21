const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    contact_no: { type: String, required: true, unique: true },
    otp: { type: Number, sparse: true, default: null },
    name: { type: String, default: null },
    age: { type: Number, default: null },
    relation: { type: String, default: null },
    gender: { type: String, enum: ["male", "female", "other"], default: null },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctors",
      default: null
    },
    status: { type: Number, default: 1, enum: [0, 1, 2] }, // 0:False,1:True,2:delete
    is_user: { type: Number, default: null , enum: [0, 1]}, // 0:False,1:True
    is_verify: { type: Number, default: 0, enum: [0, 1] }, // 0:Not Verify,1:Verify
    device_token: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);