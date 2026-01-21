const mongoose = require("mongoose");

const SubPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    avatar: { type: String, default: null },

    short_desc: { type: String, default: null },
    long_desc: { type: String, default: null },

    mrp: { type: Number, default: null },
    dis_price: { type: Number, default: null },
 
    parameter: { type: String, default: null },

    // packages_id stored as array of ObjectId references
    packages_id: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Package",
      default: []
    },

    // 0 = false, 1 = true, 2 = deleted
    status: { type: Number, default: 1, enum: [0, 1, 2] }
  },
  { timestamps: true }
);

module.exports = mongoose.models.SubPackage || mongoose.model('SubPackage', SubPackageSchema);
