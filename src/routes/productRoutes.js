import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { verifyFBToken } from "../middlewares/auth.js";
import { checkRole } from "../middlewares/roleCheck.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", verifyFBToken, checkRole("manager"), createProduct);
router.patch("/:id", verifyFBToken, checkRole("manager"), updateProduct);
router.delete("/:id", verifyFBToken, checkRole("manager"), deleteProduct);

export default router;
