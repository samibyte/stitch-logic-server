import express from "express";
import {
  createUser,
  getUserByEmail,
  getUsers,
  updateUserRole,
} from "../controllers/userController.js";
import { verifyFBToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/:email", verifyFBToken, getUserByEmail);
router.post("/", createUser);
router.patch("/:id/:role", verifyFBToken, updateUserRole);

export default router;
