import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db";
import userRoutes from "./routes/userRoutes";

const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(express.json());
app.use(cors());

await connectDB();

app.use("/api/v1/users", userRoutes);

app.get("/", (req, res) => {
  res.send("stitchlogic running fine :)");
});

app.listen(port, () => {
  console.log(`StitchLogic server is running on ${port}`);
});
