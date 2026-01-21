const mongoose = require('mongoose');

const OauthClientSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true },
  secret: { type: String, default: null },
  provider: { type: String, default: null },
  redirect: { type: String, required: true },
 
  personal_access_client: { type: Number, default: 0 }, // 0:false, 1:true
  password_client: { type: Number, default: 0 },        // 0:false, 1:true
  revoked: { type: Number, default: 0 },                // 0:false, 1:true

}, { timestamps: true });

module.exports = mongoose.model('oauth_clients', OauthClientSchema);
