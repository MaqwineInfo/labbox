const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema(
  {
    avatar: { type: String, default: null },           
    linked_with: { type: String, default: null },     
    from: { type: Date, default: null },
    to: { type: Date, default: null },

    // 0 = False (Inactive)
    // 1 = True (Active)
    // 2 = Deleted
    status: { type: Number, enum: [0, 1, 2], default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", BannerSchema);
