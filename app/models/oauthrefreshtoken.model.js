import mongoose from "mongoose";

const OauthRefreshTokenSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  access_token_id: {
    type: String,
    required: true,
    index: true
  },
  revoked: {
    type: Boolean,
    default: false // 0:false, 1:true
  },
  expires_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: false  
});

export default mongoose.model("OauthRefreshToken", OauthRefreshTokenSchema);
