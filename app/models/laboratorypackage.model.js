const mongoose = require("mongoose");

const LaboratoryPackageSchema = new mongoose.Schema(
  {
    laboratory_id: { type: mongoose.Schema.Types.ObjectId, ref: "Laboratory", required: true },
    package_id: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
    status: { type: Number, default: 1, enum: [0, 1, 2] } // 0 = false, 1 = true, 2 = deleted
  },
  { timestamps: true }
);

module.exports = mongoose.model("LaboratoryPackage", LaboratoryPackageSchema);
