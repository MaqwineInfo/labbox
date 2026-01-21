const mongoose = require("mongoose");

const CacheLockSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    owner: { type: String, required: true },
    expiration: { type: Date, required: true }
  },
  { versionKey: false }
);
 
CacheLockSchema.index({ expiration: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("CacheLock", CacheLockSchema);
