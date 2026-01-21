const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    relation: { type: String, required: true },
    gender: { type: String, required: true },

    // 0:False, 1:True, 2:delete
    status: { type: Number, default: 1, enum: [0, 1, 2] },

    // was tinyInteger in Laravel → Boolean here
    is_delete: { type: Boolean, default: false },

    // Foreign Key (string before -> converting to ObjectId relationship)
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", PatientSchema);
