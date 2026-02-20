import mongoose from "mongoose";

const StatsSchema = new mongoose.Schema({
  shortId: String,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
  referrer: String,
  browser: String,
  os: String,
  device: String,
  country: String,
  city: String,
});

export default mongoose.model("Stats", StatsSchema);
