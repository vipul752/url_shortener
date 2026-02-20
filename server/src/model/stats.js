import mongoose from "mongoose";

const StatsSchema = new mongoose.Schema({
  shortId: String,
  timestamp: Number,
  ip: String,
  userAgent: String,
});

export default mongoose.model("Stats", StatsSchema);
