const mongoose = require("mongoose");

const CriteriaSchema = new mongoose.Schema(
  {
    avatar: { type: String, default: null },    

    text: { type: String, required: true },     

    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true
    },

    // 0 = false, 1 = true, 2 = deleted (project rule)
    status: { type: Number, default: 1, enum: [0, 1, 2] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Criteria", CriteriaSchema);
