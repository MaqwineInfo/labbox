const mongoose = require("mongoose");

const PackageSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    avatar: { type: String, default: null },
    short_desc: { type: String, required: true },
    long_desc: { type: String, default: null },

    // Array field instead of JSON
    categories_id: { type: [mongoose.Schema.Types.ObjectId], ref: "categories", default: [] },

    fasting: { type: String, default: null },
    report_in: { type: String, default: null },
    sample_type: { type: String, default: null },
    for_what: { type: String, default: null },
    package_instruction: { type: String, default: null },

    mrp: { type: Number, required: true },
    dis_price: { type: Number, required: true },

    // 0:false, 1:true, 2:delete
    status: { type: Number, default: 1, enum: [0, 1, 2] },

    recommended_age: { type: String, default: null },
    recommended_gender: { type: Number, default: 2 }, // 0=female,1=male,2=both
    option: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", PackageSchema);
