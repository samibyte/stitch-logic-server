import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import userRouter from "./routes/userRoutes.js";
import productRouter from "./routes/productRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import suspensionRouter from "./routes/suspensionRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { handleStripeWebhook } from "./controllers/paymentController.js";

const app = express();

app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// middleware
app.use(express.json());
app.use(cors());

// Health check / Root
app.get("/", (req, res) => {
  res.send("stitchlogic running fine :)");
});

// routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/suspension", suspensionRouter);

app.use(errorHandler);

connectDB();

if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Local server running on ${port}`);
  });
}

export default app;
