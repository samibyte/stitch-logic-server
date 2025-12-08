import express from "express";
import {
  createUser,
  getUserByEmail,
  getUsers,
  updateUserRole,
} from "../controllers/userController.js";
import { verifyFBToken } from "../middleware/auth.js";

const userRoutes = express.Router();

userRoutes.get("/", getUsers);
userRoutes.get("/:email", verifyFBToken, getUserByEmail);
userRoutes.post("/", createUser);
userRoutes.patch("/:id/:role", verifyFBToken, updateUserRole);

export default userRoutes;
