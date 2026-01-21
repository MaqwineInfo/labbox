const mongoose = require("mongoose");

const PrescriptionSchema = new mongoose.Schema(
  {
    avatar: { type: String, required: true },  
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", PrescriptionSchema);
