import express from "express";
import { getPlatformStats } from "../controllers/statsController.js";

const router = express.Router();

// Public route — no auth required
router.get("/", getPlatformStats);

export default router;
