import express from "express";
import {
  createUser,
  deleteUser,
  getUserByEmail,
  getUsers,
  updateUser,
  updateUserRole,
} from "../controllers/userController.js";
import { verifyFBToken } from "../middlewares/auth.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";

const router = express.Router();

router.get("/", verifyFBToken, getUsers);
router.get("/my/profile", verifyFBToken, getProfile);
router.get("/:email/role", verifyFBToken, getUserByEmail);
router.post("/", createUser);
router.patch("/:id", verifyFBToken, updateUser);
router.patch("/my/profile", verifyFBToken, updateProfile);
router.patch("/:id/:role", verifyFBToken, updateUserRole);
router.delete("/:id", verifyFBToken, deleteUser);

export default router;
