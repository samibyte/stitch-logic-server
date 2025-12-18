import express from "express";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  cancelOrder,
  approveOrder,
  rejectOrder,
  getApprovedOrders,
  getPendingOrders,
  addTrackingUpdate,
  getOrderTracking,
} from "../controllers/orderController.js";
import { verifyFBToken } from "../middlewares/auth.js";
import { checkRole } from "../middlewares/roleCheck.js";

const router = express.Router();

// Buyer routes
router.post("/", verifyFBToken, checkRole(["buyer"]), createOrder);
router.get("/my", verifyFBToken, checkRole(["buyer"]), getMyOrders);
router.patch("/:id/cancel", verifyFBToken, checkRole(["buyer"]), cancelOrder);

// Shared - all authenticated users can view tracking
router.get(
  "/:id",
  verifyFBToken,
  checkRole(["buyer", "manager", "admin"]),
  getOrderById
);

// Tracking routes
router.get(
  "/:id/tracking",
  verifyFBToken,
  checkRole(["buyer", "manager", "admin"]),
  getOrderTracking
);

// Admin & manager routes for adding tracking updates
router.post(
  "/:id/tracking",
  verifyFBToken,
  checkRole(["manager", "admin"]),
  addTrackingUpdate
);

// Admin & manager routes
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

// Manager routes
router.get(
  "/status/pending",
  verifyFBToken,
  checkRole(["manager"]),
  getPendingOrders
);
router.get(
  "/status/approved",
  verifyFBToken,
  checkRole(["manager"]),
  getApprovedOrders
);

// Admin routes
router.get("/", verifyFBToken, checkRole(["admin", "manager"]), getAllOrders);

export default router;
