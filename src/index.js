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

const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(express.json());
app.use(cors());

await connectDB();

// routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/suspension", suspensionRouter);
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("stitchlogic running fine :)");
});

app.listen(port, () => {
  console.log(`StitchLogic server is running on ${port}`);
});
