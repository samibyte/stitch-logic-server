import mongoose from "mongoose";

const { Schema, model } = mongoose;

const suspensionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, required: true, trim: true },
  feedback: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export default model("Suspension", suspensionSchema);
