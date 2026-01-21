const mongoose = require("mongoose");

const PackageCategorySchema = new mongoose.Schema(
  {
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    // Status handling — same rule everywhere
    status: { type: Number, default: 1, enum: [0, 1, 2] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PackageCategory", PackageCategorySchema);
