const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    _id: { type: String }, // matches the session ID
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    ip_address: { type: String, default: null },
    user_agent: { type: String, default: null },
    payload: { type: String, required: true },
    last_activity: { type: Number, required: true }
  },
  { _id: false }  
);

module.exports = mongoose.model("Session", SessionSchema);
