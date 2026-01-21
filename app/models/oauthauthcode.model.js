const mongoose = require("mongoose");

const OAuthAuthCodeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true
    },

    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OAuthClient",
      required: true
    },

    scopes: {
      type: [String], 
      default: []
    },

    revoked: {
      type: Boolean,
      default: false
    },

    expires_at: {
      type: Date,
      default: null
    }
  },
  { timestamps: false }
);

module.exports = mongoose.model("OAuthAuthCode", OAuthAuthCodeSchema);
