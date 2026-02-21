import mongoose from "mongoose";

const clickSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
});

const urlSchema = new mongoose.Schema({
  shortUrl: { type: String, unique: true },
  originalUrl: String,
  customAlias: { type: String, default: null },
  userId: { type: String, default: null }, // For tracking user's links
  password: { type: String, default: null },
  title: { type: String, default: null },
  image: { type: String, default: null },
  clicks: { type: Number, default: 0 },
  clickHistory: [clickSchema], // Track each click with timestamp
  lastAccessedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
});

// Index for faster queries
urlSchema.index({ userId: 1 });
urlSchema.index({ createdAt: -1 });

const Url = mongoose.model("Url", urlSchema);

export default Url;
