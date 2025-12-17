// routes/productRoutes.js
import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  toggleShowOnHome,
  bulkUpdateShowOnHome,
  getProductStats,
  getProductCategories,
} from "../controllers/productController.js";
import { verifyFBToken } from "../middlewares/auth.js";
import { checkRole } from "../middlewares/roleCheck.js";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/stats", getProductStats);
router.get("/categories", getProductCategories);
router.get("/:id", getProductById);

// Protected routes - Manager & Admin
router.get(
  "/my/products",
  verifyFBToken,
  checkRole(["manager", "admin"]),
  getMyProducts
);
router.post("/", verifyFBToken, checkRole(["manager", "admin"]), createProduct);
router.patch(
  "/:id",
  verifyFBToken,
  checkRole(["manager", "admin"]),
  updateProduct
);
router.delete(
  "/:id",
  verifyFBToken,
  checkRole(["manager", "admin"]),
  deleteProduct
);

// Admin-only routes for showOnHome
router.patch(
  "/:id/show-on-home",
  verifyFBToken,
  checkRole(["admin"]),
  toggleShowOnHome
);
router.patch(
  "/bulk/show-on-home",
  verifyFBToken,
  checkRole(["admin"]),
  bulkUpdateShowOnHome
);

export default router;
