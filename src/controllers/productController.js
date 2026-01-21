import Product from "../models/Product.js";

/**
 * Get all products with filters and pagination
 * Query params: searchText, category, price, showOnHome, page, limit
 */
export const getAllProducts = async (req, res) => {
  try {
    const {
      searchText,
      category,
      price,
      showOnHome,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Search filter
    if (searchText) {
      query.$or = [
        { name: { $regex: searchText, $options: "i" } },
        { description: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } },
      ];
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Price filter
    if (price && price !== "all") {
      if (price === "low") query.price = { $lt: 50 };
      else if (price === "medium") query.price = { $gte: 50, $lte: 200 };
      else if (price === "high") query.price = { $gt: 200 };
    }

    // Show on home filter
    if (showOnHome && showOnHome !== "all") {
      query.showOnHome = showOnHome === "true";
    }

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    //Sort order
    const allowedSortFields = ["createdAt", "name", "price"];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ message: "Invalid sort field" });
    }

    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const sortOptions = {
      [sortField]: sortDirection,
      _id: 1,
    };

    // Total count
    const total = await Product.countDocuments(query);

    // Fetch products
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        itemsPerPage: limitNum,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getHomeProducts = async (req, res) => {
  try {
    const products = await Product.find({ showOnHome: true })
      .sort({ createdAt: -1 })
      .limit(8);

    res.json(products);
  } catch (err) {
    console.error("Error fetching home products:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get single product by ID
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get products for current manager
 */
export const getMyProducts = async (req, res) => {
  try {
    const { searchText, page = 1, limit = 10 } = req.query;

    const query = { "manager.firebaseUid": req.firebaseUid };

    if (searchText) {
      query.$or = [
        { name: { $regex: searchText, $options: "i" } },
        { description: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        itemsPerPage: limitNum,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create a new product
 */
export const createProduct = async (req, res) => {
  try {
    // Add manager info from authenticated user
    const productData = {
      ...req.body,
      manager: {
        firebaseUid: req.user.firebaseUid,
        displayName: req.user.displayName || "Manager",
        email: req.user.email || "",
      },
    };

    // Ensure paymentOptions is an array
    if (
      productData.paymentOptions &&
      !Array.isArray(productData.paymentOptions)
    ) {
      productData.paymentOptions = [productData.paymentOptions];
    }

    // Ensure images is an array
    if (productData.images && !Array.isArray(productData.images)) {
      productData.images = [productData.images];
    }

    const product = new Product(productData);
    const savedProduct = await product.save();

    res.status(201).json(savedProduct);
  } catch (err) {
    console.error(err);

    // Handle validation errors
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update product
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists and belongs to current user (if manager)
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If user is manager, check if they own the product
    if (
      req.role === "manager" &&
      existingProduct.manager.firebaseUid !== req.firebaseUid
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this product" });
    }

    // Ensure paymentOptions is an array
    if (req.body.paymentOptions && !Array.isArray(req.body.paymentOptions)) {
      req.body.paymentOptions = [req.body.paymentOptions];
    }

    // Ensure images is an array
    if (req.body.images && !Array.isArray(req.body.images)) {
      req.body.images = [req.body.images];
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Toggle show on home status (Admin only)
 */
export const toggleShowOnHome = async (req, res) => {
  try {
    const { id } = req.params;
    const { showOnHome } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Only admin can toggle showOnHome
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can update showOnHome" });
    }

    product.showOnHome = showOnHome;
    await product.save();

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Bulk update show on home status (Admin only)
 */
export const bulkUpdateShowOnHome = async (req, res) => {
  try {
    const { productIds, showOnHome } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Product IDs are required" });
    }

    // Only admin can bulk update
    if (req.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can bulk update showOnHome" });
    }

    // Update all products
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { showOnHome } },
    );

    // Get updated products
    const updatedProducts = await Product.find({ _id: { $in: productIds } });

    res.json({
      message: `${productIds.length} products updated successfully`,
      products: updatedProducts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If user is manager, check if they own the product
    if (
      req.role === "manager" &&
      product.manager.firebaseUid !== req.firebaseUid
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this product" });
    }

    await Product.findByIdAndDelete(id);

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get product statistics
 */
export const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const productsOnHome = await Product.countDocuments({ showOnHome: true });

    // Get total inventory value
    const inventoryValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$price", "$availableQuantity"] } },
        },
      },
    ]);

    // Get products by category
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$price", "$availableQuantity"] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get products by payment options
    const paymentOptionsStats = await Product.aggregate([
      { $unwind: "$paymentOptions" },
      {
        $group: {
          _id: "$paymentOptions",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalProducts,
      productsOnHome,
      totalInventoryValue: inventoryValue[0]?.totalValue || 0,
      productsByCategory,
      paymentOptionsStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get unique categories for filter dropdown
 */
export const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
