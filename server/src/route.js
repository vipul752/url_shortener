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
import { authMiddleware, optionalAuth } from "./middleware/auth.middleware.js";
// import { rateLimitMiddleware } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/shorten", optionalAuth, shortenUrl);
router.post("/bulk-shorten", optionalAuth, bulkShortenUrl);
router.get("/info/:shortId", getUrlInfo);
router.post("/verify/:shortId", verifyPassword);

// Dashboard & Analytics routes (protected)
router.get("/my-links", authMiddleware, getUserLinks);
router.get("/analytics/:shortId", authMiddleware, getLinkAnalytics);
router.delete("/link/:shortId", authMiddleware, deleteLink);

router.get("/:shortId", redirectUrl);

export default router;
