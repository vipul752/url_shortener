import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
  shortUrl: { type: String, unique: true },
  originalUrl: String,
  password: { type: String, default: null },
  title: { type: String, default: null },
  image: { type: String, default: null },
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
});

const Url = mongoose.model("Url", urlSchema);

export default Url;
