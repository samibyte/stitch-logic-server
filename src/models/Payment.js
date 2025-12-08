import mongoose from "mongoose";

const { Schema, model } = mongoose;

const paymentSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  paymentStatus: {
    type: String,
    enum: ["paid", "pending"],
    default: "pending",
  },
  transactionId: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export default model("Payment", paymentSchema);
