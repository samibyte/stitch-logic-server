import Payment from "../models/Payment.js";

/**
 * Create payment record
 */
export const createPayment = async (req, res) => {
  try {
    const payment = new Payment(req.body);
    const savedPayment = await payment.save();
    res.status(201).json(savedPayment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get payment by orderId
 */
export const getPaymentByOrder = async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
