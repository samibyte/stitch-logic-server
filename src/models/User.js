import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema({
  firebaseUid: { type: String, required: true },
  displayName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  photoURL: { type: String },
  role: { type: String, enum: ["buyer", "manager", "admin"], default: "buyer" },
  status: {
    type: String,
    enum: ["pending", "active", "suspended"],
    default: "pending",
  },
  suspendReason: { type: String },
  suspendFeedback: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export default model("User", userSchema);
