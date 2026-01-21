const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    package_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Package", 
      default: null 
    },
    order_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "orders", 
      default: null 
    },

    patient_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "patients", 
        default: null 
    },

    status: { 
      type: Number, 
      default: 1, 
      enum: [0, 1, 2]  // 0:false,1:true,2:deleted
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", CartSchema);
