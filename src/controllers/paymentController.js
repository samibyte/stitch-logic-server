import Stripe from "stripe";
import Order from "../models/Order.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Verify that the request actually came from Stripe
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook Signature Verification Failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the specific event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    try {
      // Update your Order schema based on the logic we discussed
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        status: "approved", // Optional: Auto-approve if paid
      });
      console.log(`Order ${orderId} marked as PAID`);
    } catch (dbErr) {
      console.error("Database update failed during webhook:", dbErr);
    }
  }

  res.json({ received: true });
};
