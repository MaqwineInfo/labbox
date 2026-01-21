const mongoose = require("mongoose");

const OAuthAccessTokenSchema = new mongoose.Schema(
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
      default: null
    },

    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OAuthClient",
      required: true
    },

    name: {
      type: String,
      default: null
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
  { timestamps: true }
);

module.exports = mongoose.model("OAuthAccessToken", OAuthAccessTokenSchema);
