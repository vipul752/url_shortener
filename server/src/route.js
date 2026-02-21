import express from "express";
import {
  shortenUrl,
  redirectUrl,
  bulkShortenUrl,
  getUrlInfo,
  verifyPassword,
} from "./logic/api.logic.js";
// import { rateLimitMiddleware } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/shorten", shortenUrl);
router.post("/bulk-shorten", bulkShortenUrl);
router.get("/info/:shortId", getUrlInfo);
router.post("/verify/:shortId", verifyPassword);
router.get("/:shortId", redirectUrl);

export default router;
