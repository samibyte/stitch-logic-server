import Order from "../models/Order.js";
import Product from "../models/Product.js";

/**
 * Create a new order (Buyer only)
 */
export const createOrder = async (req, res) => {
  try {
    const {
      productId,
      paymentOption,
      quantity,
      firstName,
      lastName,
      contactNumber,
      deliveryAddress,
      notes,
    } = req.body;

    // Fetch product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate payment option
    if (!product.paymentOptions.includes(paymentOption)) {
      return res.status(400).json({ message: "Invalid payment option" });
    }

    // Quantity validation
    if (quantity < product.minOrderQuantity) {
      return res.status(400).json({
        message: `Minimum order quantity is ${product.minOrderQuantity}`,
      });
    }

    if (quantity > product.availableQuantity) {
      return res.status(400).json({
        message: "Order quantity exceeds available stock",
      });
    }

    const orderPrice = quantity * product.price;
    const requiresOnlinePayment = paymentOption === "PayFirst";

    const order = new Order({
      buyer: {
        firebaseUid: req.firebaseUid,
        email: req.email,
        firstName,
        lastName,
        contactNumber,
        deliveryAddress,
        notes,
      },
      product: product._id,
      paymentOption,
      quantity,
      orderPrice,
      requiresOnlinePayment,
    });

    // Reduce product stock
    product.availableQuantity -= quantity;

    await order.save();
    await product.save();

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get orders of logged-in buyer
 */
export const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = { "buyer.firebaseUid": req.firebaseUid };

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("product")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all orders (Admin only)
 */
export const getAllOrders = async (req, res) => {
  try {
    const { status, searchText, page = 1, limit = 10 } = req.query;

    const query = {};

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Search filter
    if (searchText) {
      query.$or = [
        { trackingId: { $regex: searchText, $options: "i" } },
        { "buyer.firstName": { $regex: searchText, $options: "i" } },
        { "buyer.lastName": { $regex: searchText, $options: "i" } },
        { "buyer.email": { $regex: searchText, $options: "i" } },
      ];
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("product")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        hasNextPage,
        hasPrevPage,
        itemsPerPage: limitNum,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get single order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("product");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Buyer can only view own order
    if (req.role === "buyer" && order.buyer.firebaseUid !== req.firebaseUid) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Cancel order (Buyer only, pending)
 */
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.buyer.firebaseUid !== req.firebaseUid) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending orders can be cancelled" });
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();

    await order.save();

    res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Approve order (Manager only)
 */
export const approveOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending orders can be approved" });
    }

    order.status = "approved";
    order.approvedAt = new Date();

    await order.save();

    res.json({ message: "Order approved", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Reject order (Manager only)
 */
export const rejectOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending orders can be rejected" });
    }

    order.status = "rejected";
    await order.save();

    res.json({ message: "Order rejected", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
