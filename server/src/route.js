import express from "express";
import { shortenUrl, redirectUrl, statShortURL } from "./logic/api.logic.js";
// import { rateLimitMiddleware } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/shorten", shortenUrl);
router.get("/stats/:shortId", statShortURL);
router.get("/:shortId", redirectUrl);

export default router;
