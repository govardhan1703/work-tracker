import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import historyRouter from "./routes/history.js";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/history", historyRouter);

const PORT = Number(process.env.PORT || 3001);
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // eslint-disable-next-line no-console
  console.error("Missing MONGODB_URI in backend/.env");
  process.exit(1);
}
mongoose
  .connect(MONGODB_URI)
  .then((conn) => {
    console.log(`MongoDB Connected: ${conn.connection.host}`); // ✅ ADD THIS
    app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
    process.exit(1);
  });

