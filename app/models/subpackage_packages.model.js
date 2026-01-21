const mongoose = require("mongoose");

const SubpackagePackageSchema = new mongoose.Schema(
  {
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true
    },
    sub_package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubPackage",
      required: true
    },

    // Your logic: 0 = false, 1 = true, 2 = deleted
    status: { type: Number, default: 1, enum: [0, 1, 2] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubpackagePackage", SubpackagePackageSchema);
