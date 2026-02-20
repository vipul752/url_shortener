import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
  shortUrl: { type: String, unique: true },
  originalUrl: String,
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Url = mongoose.model("Url", urlSchema);

export default Url;
