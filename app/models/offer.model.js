const mongoose = require("mongoose");

const OfferSchema = new mongoose.Schema(
  {
    avatar: { type: String, default: null },
    linked_with: { type: String, default: null },
    from: { type: Date, default: null },
    to: { type: Date, default: null },
    status: { type: Number, default: 1, enum: [0, 1, 2] }, // 0:false,1:true,2:delete
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", OfferSchema);
