import mongoose from "mongoose";
import { generateTrackingId } from "../utils/generateTrackingId.js";

const { Schema, model } = mongoose;

// Subdocument for tracking updates
const trackingUpdateSchema = new Schema({
  location: {
    type: String,
    required: true,
    trim: true,
  },
  note: {
    type: String,
    trim: true,
    default: "",
  },
  status: {
    type: String,
    enum: [
      "Cutting Completed",
      "Sewing Started",
      "Finishing",
      "QC Checked",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
    ],
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const orderSchema = new Schema({
  // Buyer booking form
  buyer: {
    firebaseUid: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    deliveryAddress: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
  },

  // Product reference
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  paymentOption: { type: String, enum: ["COD", "PayFirst"], required: true },
  quantity: { type: Number, required: true },
  orderPrice: { type: Number, required: true },
  requiresOnlinePayment: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
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

  trackingUpdates: {
    type: [trackingUpdateSchema],
    default: [],
  },
});

orderSchema.index({ "trackingUpdates.status": 1 });
orderSchema.index({ trackingId: 1 });

export default model("Order", orderSchema);
