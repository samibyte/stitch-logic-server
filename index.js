import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db";
import admin from "firebase-admin";

const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(express.json());
app.use(cors());

await connectDB();

app.get("/");

app.get("/", (req, res) => {
  res.send("stitchlogic running fine :)");
});

app.listen(port, () => {
  console.log(`StitchLogic server is running on ${port}`);
});
