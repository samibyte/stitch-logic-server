import express from "express";
import {
  createPayment,
  getPaymentByOrder,
} from "../controllers/paymentController.js";
import { verifyFBToken } from "../middlewares/auth.js";
import { checkRole } from "../middlewares/roleCheck.js";

const router = express.Router();

router.post("/", verifyFBToken, checkRole("buyer"), createPayment);
router.get("/:orderId", verifyFBToken, getPaymentByOrder);

export default router;
