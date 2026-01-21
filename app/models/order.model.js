const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({

  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },

  patient_id: { type: String, default: null },

  address_id: { type: String, default: null },

  package_id: { type: mongoose.Schema.Types.ObjectId, ref: "packages", default: null },

  laboratory_id: { type: mongoose.Schema.Types.ObjectId, ref: "laboratories", default: null },

  prescription_id: { type: mongoose.Schema.Types.ObjectId, ref: "prescriptions", default: null },

  // order_id: { type: mongoose.Schema.Types.ObjectId, ref: "orders", default: null },

  price: { type: Number, default: 0.00 },

  date: { type: Date, default: null },

  reason: { type: String, default: null },

  avatar: { type: String, default: null },

  status: { type: Number, default: 0 },
  // 0:request,1:in_review,2:order_confirm,3:sample_collected,
  // 4:in_progress,5:report_generated,6:reject

  is_delete: { type: Number, default: 0 },
  // 0:false,1:true

}, { timestamps: true });

module.exports = mongoose.model('orders', OrderSchema);
