import express from "express";
import {
  shortenUrl,
  redirectUrl,
  bulkShortenUrl,
  getUrlInfo,
  verifyPassword,
  getUserLinks,
  getLinkAnalytics,
  deleteLink,
} from "./logic/api.logic.js";
// import { rateLimitMiddleware } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/shorten", shortenUrl);
router.post("/bulk-shorten", bulkShortenUrl);
router.get("/info/:shortId", getUrlInfo);
router.post("/verify/:shortId", verifyPassword);

// Dashboard & Analytics routes
router.get("/user/:userId/links", getUserLinks);
router.get("/analytics/:shortId", getLinkAnalytics);
router.delete("/link/:shortId", deleteLink);

router.get("/:shortId", redirectUrl);

export default router;
