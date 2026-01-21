const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    avatar: { type: String, required: true },
    long_desc: { type: String, required: true },
    short_desc: { type: String, required: true },
    sort_by: { type: Number, default: 0 }, // 0:false, 1:true, 2:delete
    // 0:false, 1:true, 2:delete
    status: { type: Number, default: 1, enum: [0, 1, 2] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("categories", CategorySchema);
