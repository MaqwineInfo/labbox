const mongoose = require('mongoose');

const OauthPersonalAccessClientSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'oauth_clients', required: true }
}, { timestamps: true });

module.exports = mongoose.model('oauth_personal_access_clients', OauthPersonalAccessClientSchema);
