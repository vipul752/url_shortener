import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import urlRoutes from "./route.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", urlRoutes);

// Connect DB
await connectDB();

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
