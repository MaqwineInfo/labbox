const mongoose = require("mongoose");

const QandaSchema = new mongoose.Schema(
  {
    question: { type: String, default: null },
    answer: { type: String, default: null },

    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      default: null
    },

    // 0 = false, 1 = true, 2 = deleted
    status: { type: Number, default: 1, enum: [0, 1, 2] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Qanda", QandaSchema);
