import mongoose from "mongoose";

const { Schema, model } = mongoose;

const trackingSchema = new Schema({
  trackingId: { type: String, required: true, trim: true },
  status: { type: String, required: true, trim: true }, // Cutting Completed, Sewing Started, etc.
  details: { type: String, trim: true },
  notes: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export default model("Tracking", trackingSchema);
