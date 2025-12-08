import mongoose from "mongoose";
import { generateTrackingId } from "../utils/generateTrackingId.js";

const { Schema, model } = mongoose;

const orderSchema = new Schema({
  buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  orderPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  trackingId: {
    type: String,
    default: generateTrackingId,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  cancelledAt: { type: Date },
});

export default model("Order", orderSchema);
