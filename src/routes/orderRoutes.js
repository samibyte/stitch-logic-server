import express from "express";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  cancelOrder,
  approveOrder,
  rejectOrder,
} from "../controllers/orderController.js";
import { verifyFBToken } from "../middlewares/auth.js";
import { checkRole } from "../middlewares/roleCheck.js";

const router = express.Router();

// Buyer routes
router.post("/", verifyFBToken, checkRole(["buyer"]), createOrder);
router.get("/my", verifyFBToken, checkRole(["buyer"]), getMyOrders);
router.patch("/:id/cancel", verifyFBToken, checkRole(["buyer"]), cancelOrder);

// Shared
router.get(
  "/:id",
  verifyFBToken,
  checkRole(["buyer", "manager", "admin"]),
  getOrderById
);

// Admin routes
router.get("/", verifyFBToken, checkRole(["admin"]), getAllOrders);

router.patch(
  "/:id/approve",
  verifyFBToken,
  checkRole(["manager", "admin"]),
  approveOrder
);
router.patch(
  "/:id/reject",
  verifyFBToken,
  checkRole(["manager", "admin"]),
  rejectOrder
);

export default router;
