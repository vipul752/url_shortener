import { register, login, logout, getMe } from "./logic/auth.js";
import express from "express";
import { authMiddleware } from "./middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

export default router;
