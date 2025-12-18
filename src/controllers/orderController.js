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
    const order = await Order.findById(req.params.id)
      .populate("product")
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
      .populate("product")
      .select("trackingId buyer trackingUpdates createdAt status");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check authorization
    if (req.role === "buyer") {
      // Buyer can only view their own orders
      if (order.buyer.firebaseUid !== req.firebaseUid) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
    } else if (req.role === "manager") {
      // Manager can only view orders for their products
      const product = await Product.findById(order.productId);
      if (!product || product.manager.firebaseUid !== req.firebaseUid) {
        return res.status(403).json({
          message: "Unauthorized to view this order",
        });
      }
    }

    // Format tracking updates with better structure
    const trackingData = {
      orderId: order._id,
      trackingId: order.trackingId,
      createdAt: order.createdAt,
      status: order.status,
      buyer: {
        name: `${order.buyer.firstName} ${order.buyer.lastName}`,
        email: order.buyer.email,
      },
      trackingUpdates: order.trackingUpdates.map((update) => ({
        _id: update._id,
        status: update.status,
        location: update.location,
        note: update.note,
        imageUrl: update.imageUrl,
        updatedAt: update.updatedAt,
      })),
      // For timeline view, get all possible statuses with their completion state
      timeline: [
        "Cutting Completed",
        "Sewing Started",
        "Finishing",
        "QC Checked",
        "Packed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
      ].map((status) => {
        const update = order.trackingUpdates.find((u) => u.status === status);
        return {
          status,
          completed: !!update,
          update: update
            ? {
                location: update.location,
                note: update.note,
                imageUrl: update.imageUrl,
                updatedAt: update.updatedAt,
              }
            : null,
        };
      }),
      // Last tracking update for quick reference
      lastUpdate:
        order.trackingUpdates.length > 0
          ? order.trackingUpdates[order.trackingUpdates.length - 1]
          : null,
    };

    res.json(trackingData);
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

export const getOrderForTrackingPage = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate({
      path: "product",
      select: "name price images category specifications",
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check authorization
    if (req.role === "buyer") {
      if (order.buyer.firebaseUid !== req.firebaseUid) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
    } else if (req.role === "manager") {
      const product = await Product.findById(order.productId);
      if (!product || product.manager.firebaseUid !== req.firebaseUid) {
        return res.status(403).json({
          message: "Unauthorized to view this order",
        });
      }
    }

    // Structure response for tracking page
    const response = {
      order: {
        _id: order._id,
        trackingId: order.trackingId,
        status: order.status,
        createdAt: order.createdAt,
        approvedAt: order.approvedAt,
        quantity: order.quantity,
        orderPrice: order.orderPrice,
        paymentStatus: order.paymentStatus,
        paymentOption: order.paymentOption,
      },
      buyer: {
        name: `${order.buyer.firstName} ${order.buyer.lastName}`,
        email: order.buyer.email,
        contactNumber: order.buyer.contactNumber,
        deliveryAddress: order.buyer.deliveryAddress,
        notes: order.buyer.notes,
      },
      product: order.product,
      trackingUpdates: order.trackingUpdates,
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
