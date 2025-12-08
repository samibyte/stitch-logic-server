import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import userRouter from "./routes/userRoutes.js";
import productRouter from "./routes/productRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(express.json());
app.use(cors());

await connectDB();

// routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);

app.get("/", (req, res) => {
  res.send("stitchlogic running fine :)");
});

app.listen(port, () => {
  console.log(`StitchLogic server is running on ${port}`);
});
