import Order from "../models/Order.js";

/**
 * Get orders (Admin: all, Buyer: own orders)
 */
export const getOrders = async (req, res) => {
  try {
    const { role, email } = req.user; // set by auth middleware
    let query = {};
    if (role === "buyer") query.userEmail = email;

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create a new order
 */
export const createOrder = async (req, res) => {
  try {
    const order = new Order(req.body);
    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update order status (approve/reject)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body; // "approved" | "rejected"
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updatedOrder)
      return res.status(404).json({ message: "Order not found" });
    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
