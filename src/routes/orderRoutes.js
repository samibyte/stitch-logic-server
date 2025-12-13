import express from "express";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { verifyFBToken } from "../middlewares/auth.js";
import { checkRole } from "../middlewares/roleCheck.js";

const router = express.Router();

router.get("/", verifyFBToken, getOrders);
router.get("/:id", verifyFBToken, getOrderById);
router.post("/", verifyFBToken, createOrder);
router.patch("/:id", verifyFBToken, checkRole("manager"), updateOrderStatus);

export default router;
