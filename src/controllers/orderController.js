import Order from "../models/Order.js";
import Product from "../models/Product.js";

/**
 * Create a new order (Buyer only)
 */
export const createOrder = async (req, res) => {
  try {
    const { productId, paymentOption, quantity, buyer } = req.body;

    // Fetch product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const orderPrice = quantity * product.price;
    const requiresOnlinePayment = paymentOption === "PayFirst";

    const order = new Order({
      buyer: {
        ...buyer,
        firebaseUid: req.firebaseUid,
        email: req.email,
      },
      productId: product._id,
      paymentOption,
      quantity,
      orderPrice,
      requiresOnlinePayment,
    });

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
      .populate("productId")
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
      .populate("productId")
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
    const order = await Order.findById(req.params.id)
      .populate("productId")
      .select("+trackingUpdates");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Buyer can only view own order
    if (req.role === "buyer" && order.buyer.firebaseUid !== req.firebaseUid) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Manager can only view orders for their products
    if (req.role === "manager") {
      const product = await Product.findById(order.productId);
      if (!product || product.manager.firebaseUid !== req.firebaseUid) {
        return res.status(403).json({
          message: "Unauthorized to view this order",
        });
      }
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

export const approveOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("productId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if manager owns this product
    if (req.role === "manager") {
      const product = await Product.findById(order.productId);
      if (!product || product.manager.firebaseUid !== req.firebaseUid) {
        return res.status(403).json({
          message: "Unauthorized to approve this order",
        });
      }
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        message: "Only pending orders can be approved",
      });
    }

    order.status = "approved";
    order.approvedAt = new Date();
    await order.save();

    res.json({
      message: "Order approved successfully",
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const rejectOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("productId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if manager owns this product
    if (req.user.role === "manager") {
      const product = await Product.findById(order.productId);
      if (!product || product.manager.firebaseUid !== req.firebaseUid) {
        return res.status(403).json({
          message: "Unauthorized to reject this order",
        });
      }
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        message: "Only pending orders can be rejected",
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true } // returns the updated document
    );

    // Restore product quantity if order was rejected
    if (order.productId) {
      const product = await Product.findById(order.productId);
      if (product) {
        product.availableQuantity += order.quantity;
        await product.save();
      }
    }

    res.json({
      message: "Order rejected successfully",
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPendingOrders = async (req, res) => {
  try {
    const { searchText, page = 1, limit = 10 } = req.query;

    const query = {
      status: "pending",
    };

    if (req.user.role === "manager") {
      const managerProducts = await Product.find({
        "manager.firebaseUid": req.firebaseUid,
      }).select("_id");

      const productIds = managerProducts.map((p) => p._id);
      query.productId = { $in: productIds };
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
      .populate({
        path: "productId",
        select: "name price images category manager",
      })
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
export const getApprovedOrders = async (req, res) => {
  try {
    const { searchText, page = 1, limit = 10 } = req.query;

    const query = {
      status: "approved",
    };

    if (req.user.role === "manager") {
      const managerProducts = await Product.find({
        "manager.firebaseUid": req.firebaseUid,
      }).select("_id");

      const productIds = managerProducts.map((p) => p._id);
      query.productId = { $in: productIds };
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
      .populate({
        path: "productId",
        select: "name price images category manager",
      })
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
 * Get tracking information for a specific order
 * Accessible by buyer (their own orders), manager, and admin
 */
export const getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("productId")
      .select("trackingId buyer trackingUpdates createdAt status");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Authorization checks (same as before)
    if (req.role === "buyer" && order.buyer.firebaseUid !== req.firebaseUid) {
      return res.status(403).json({ message: "Unauthorized access" });
    } else if (req.role === "manager") {
      const product = await Product.findById(order.productId);
      if (!product || product.manager.firebaseUid !== req.firebaseUid) {
        return res.status(403).json({ message: "Unauthorized" });
      }
    }

    // 1. Define the Strict Order of Operations
    const STEPS = [
      "Cutting Completed",
      "Sewing Started",
      "Finishing",
      "QC Checked",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
    ];

    // 2. Find the index of the furthest step the order has reached
    // We look at all updates in the DB and find which one is furthest down our list
    let highestStepIndex = -1;

    order.trackingUpdates.forEach((update) => {
      const index = STEPS.indexOf(update.status);
      if (index > highestStepIndex) {
        highestStepIndex = index;
      }
    });

    // 3. Build the smart timeline
    const timeline = STEPS.map((stepName, index) => {
      // Find the specific log for this step (if it exists)
      const exactLog = order.trackingUpdates.find((u) => u.status === stepName);

      return {
        status: stepName,
        // CRITICAL FIX: A step is complete if its index is <= the highest reached step
        completed: index <= highestStepIndex,
        // If we have real data (timestamp/location), return it.
        // If it's an "implicit" completion (skipped step), return null or a placeholder.
        update: exactLog
          ? {
              location: exactLog.location,
              note: exactLog.note,
              updatedAt: exactLog.updatedAt,
            }
          : null, // No specific log, but logically completed
      };
    });

    // 4. Determine the "Current" status (The single latest update)
    const lastUpdateLog =
      order.trackingUpdates[order.trackingUpdates.length - 1];

    const response = {
      trackingId: order.trackingId,
      status: order.status,
      buyer: {
        name: `${order.buyer.firstName} ${order.buyer.lastName}`,
        email: order.buyer.email,
      },
      timeline, // The new smart timeline
      lastUpdate: lastUpdateLog || null,
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Add a tracking update to an order
 * Only accessible by manager and admin
 */
export const addTrackingUpdate = async (req, res) => {
  try {
    const { location, note, status, timestamp } = req.body;
    const orderId = req.params.id;

    // Validate required fields
    if (!location || !status) {
      return res.status(400).json({
        message: "Location and status are required",
      });
    }

    // Validate status
    const validStatuses = [
      "Cutting Completed",
      "Sewing Started",
      "Finishing",
      "QC Checked",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid tracking status",
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if manager owns this product
    if (req.role === "manager") {
      const product = await Product.findById(order.productId);
      if (!product || product.manager.firebaseUid !== req.firebaseUid) {
        return res.status(403).json({
          message: "Unauthorized to update tracking for this order",
        });
      }
    }

    // Check if order is approved (only approved orders can have tracking)
    if (order.status !== "approved") {
      return res.status(400).json({
        message: "Only approved orders can have tracking updates",
      });
    }

    // Create tracking update
    const trackingUpdate = {
      location,
      note: note || "",
      status,
      updatedAt: timestamp,
    };

    // Add to tracking updates array
    order.trackingUpdates.push(trackingUpdate);

    // Save the order
    await order.save();

    // Send notification to buyer

    res.status(201).json({
      message: "Tracking update added successfully",
      trackingUpdate,
      order: {
        _id: order._id,
        trackingId: order.trackingId,
        status: order.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
