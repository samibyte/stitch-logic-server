import express from "express";
import {
  createUser,
  getUserByEmail,
  getUsers,
  updateUserRole,
} from "../controllers/userController";
import { verifyFBToken } from "../middleware/auth";

const router = express.Router();

router.get("/", verifyFBToken, getUsers);
router.get("/:email", verifyFBToken, getUserByEmail);
router.post("/", createUser);
router.patch("/:id/:role", verifyFBToken, updateUserRole);

export default userRoutes;
