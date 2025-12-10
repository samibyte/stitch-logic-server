import mongoose from "mongoose";

const { Schema, model } = mongoose;

const productSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  availableQuantity: { type: Number, required: true },
  minOrderQuantity: { type: Number, required: true },
  images: [{ type: String, trim: true }],
  demoVideo: { type: String, trim: true },
  paymentOptions: [{ type: String, enum: ["COD", "PayFirst"] }],
  showOnHome: { type: Boolean, default: false },
  firebaseUid: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default model("Product", productSchema);
