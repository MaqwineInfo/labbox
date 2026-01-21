const mongoose = require("mongoose");

const SampleSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    sample1: { type: String, default: null },
    sample2: { type: String, default: null },
    sample3: { type: String, default: null },

    status: {
      type: Number,
      default: 1, // 0:false,1:true
      enum: [0, 1]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sample", SampleSchema);
