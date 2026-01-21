const mongoose = require("mongoose");

const LaboratoryCategorySchema = new mongoose.Schema(
  {
    laboratory_id: { type: mongoose.Schema.Types.ObjectId, ref: "Laboratory", required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "categories", required: true },
    status: { type: Number, default: 1, enum: [0, 1, 2] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LaboratoryCategory", LaboratoryCategorySchema);
