import express from "express";
import { shortenUrl, redirectUrl } from "./logic/api.logic.js";
// import { rateLimitMiddleware } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/shorten", shortenUrl);
router.get("/:shortId", redirectUrl);

export default router;
