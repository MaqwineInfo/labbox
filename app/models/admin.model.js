const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // 0=False,1=True,
    patient_read: { type: Number, enum: [0, 1], default: 0 },
    patient_delete: { type: Number, enum: [0, 1], default: 0 },

    lab_add: { type: Number, enum: [0, 1], default: 0 },
    lab_read: { type: Number, enum: [0, 1], default: 0 },
    lab_update: { type: Number, enum: [0, 1], default: 0 },
    lab_delete: { type: Number, enum: [0, 1], default: 0 },

    cate_add: { type: Number, enum: [0, 1], default: 0 },
    cate_read: { type: Number, enum: [0, 1], default: 0 },
    cate_update: { type: Number, enum: [0, 1], default: 0 },
    cate_delete: { type: Number, enum: [0, 1], default: 0 },

    pack_add: { type: Number, enum: [0, 1], default: 0 },
    pack_read: { type: Number, enum: [0, 1], default: 0 },
    pack_update: { type: Number, enum: [0, 1], default: 0 },
    pack_delete: { type: Number, enum: [0, 1], default: 0 },

    sub_add: { type: Number, enum: [0, 1], default: 0 },
    sub_read: { type: Number, enum: [0, 1], default: 0 },
    sub_update: { type: Number, enum: [0, 1], default: 0 },
    sub_delete: { type: Number, enum: [0, 1], default: 0 },

    banner_add: { type: Number, enum: [0, 1], default: 0 },
    banner_read: { type: Number, enum: [0, 1], default: 0 },
    banner_update: { type: Number, enum: [0, 1], default: 0 },
    banner_delete: { type: Number, enum: [0, 1], default: 0 },

    offer_add: { type: Number, enum: [0, 1], default: 0 },
    offer_read: { type: Number, enum: [0, 1], default: 0 },
    offer_update: { type: Number, enum: [0, 1], default: 0 },
    offer_delete: { type: Number, enum: [0, 1], default: 0 },

    order_read: { type: Number, enum: [0, 1], default: 0 },
    order_update: { type: Number, enum: [0, 1], default: 0 },

    report_read: { type: Number, enum: [0, 1], default: 0 },
    report_update: { type: Number, enum: [0, 1], default: 0 },
    report_delete: { type: Number, enum: [0, 1], default: 0 },

    doctor_add: { type: Number, enum: [0, 1], default: 0 },
    doctor_read: { type: Number, enum: [0, 1], default: 0 },
    doctor_update: { type: Number, enum: [0, 1], default: 0 },
    doctor_delete: { type: Number, enum: [0, 1], default: 0 },

    is_main: { type: Number, enum: [0, 1], default: 0 },
    status: { type: Number, enum: [0, 1, 2], default: 1 }, // 0=False,1=True,2=delete
  },
  { timestamps: true }
);
 
AdminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
 
AdminSchema.pre("save", async function (next) { 
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("Admin", AdminSchema);