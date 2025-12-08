import express from "express";
import {
  suspendUser,
  getSuspensionByUser,
} from "../controllers/suspensionController.js";
import { verifyFBToken } from "../middlewares/auth.js";
import { checkRole } from "../middlewares/roleCheck.js";

const router = express.Router();

router.post("/", verifyFBToken, checkRole("admin"), suspendUser);
router.get(
  "/:userId",
  verifyFBToken,
  checkRole("buyer", "manager"),
  getSuspensionByUser
);

export default router;
