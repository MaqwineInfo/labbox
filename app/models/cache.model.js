const mongoose = require("mongoose");

const CacheSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    value: { type: String, required: true },
 
    expiration: { type: Date, required: true }
  },
  { versionKey: false }
);

// Create TTL index to auto delete expired cache
CacheSchema.index({ expiration: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Cache", CacheSchema);
