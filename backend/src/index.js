import dns from "node:dns";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import historyRouter from "./routes/history.js";
import { activeStorageLabel } from "./historyStore.js";

dns.setDefaultResultOrder("ipv4first");

/**
 * mongodb+srv needs SRV DNS; some Windows/resolver setups fail with querySrv ECONNREFUSED.
 * Use Google DNS for this process (override with MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 or MONGODB_DNS_SERVERS=system to skip).
 */
function applyMongoDnsForSrv(uri) {
  if (!uri?.startsWith("mongodb+srv://")) return;
  const custom = process.env.MONGODB_DNS_SERVERS?.trim();
  if (custom === "system" || custom === "0") return;
  const servers = custom
    ? custom.split(",").map((s) => s.trim()).filter(Boolean)
    : ["8.8.8.8", "8.8.4.4"];
  try {
    dns.setServers(servers);
    console.log(`MongoDB SRV lookups using DNS: ${servers.join(", ")}`);
  } catch (e) {
    console.warn("Could not set DNS servers for MongoDB:", e.message);
  }
}

dotenv.config({ override: true });
const app = express();

/** Comma-separated list, e.g. https://my-app.vercel.app,https://www.example.com */
const corsAllowList = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return cb(null, true);
      }
      if (corsAllowList.length === 0 || corsAllowList.includes("*")) {
        return cb(null, true);
      }
      return cb(null, corsAllowList.includes(origin));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

const mongoStateNames = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

let lastMongoConnectError = null;

app.get("/api/health", (req, res) => {
  const rs = mongoose.connection.readyState;
  const payload = {
    ok: true,
    mongo: rs === 1 ? "connected" : "disconnected",
    mongoReadyState: rs,
    mongoState: mongoStateNames[rs] ?? "unknown",
    lastConnectError: lastMongoConnectError,
    historyStorage: activeStorageLabel(),
  };

  if (req.query.html === "1") {
    const rows = Object.entries(payload)
      .map(
        ([k, v]) =>
          `<tr><td><code>${k}</code></td><td>${escapeHtml(JSON.stringify(v))}</td></tr>`
      )
      .join("");
    return res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>API health</title>
<style>body{font-family:system-ui,sans-serif;padding:1.25rem;background:#111;color:#eee;max-width:40rem}
h1{font-size:1.1rem}table{width:100%;border-collapse:collapse;margin-top:1rem}
td{padding:8px 10px;border-bottom:1px solid #333;vertical-align:top}
code{color:#9cf}</style></head>
<body><h1>Backend health</h1><p>JSON: <a href="/api/health" style="color:#9cf">/api/health</a></p><table>${rows}</table></body></html>`);
  }

  res.json(payload);
});

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

app.use("/api/history", historyRouter);

const PORT = Number(process.env.PORT || 3001);
const MONGODB_URI = process.env.MONGODB_URI?.trim();

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  if (!MONGODB_URI) {
    console.log("History API: local file (backend/data/local-history.json). Set MONGODB_URI to use Atlas.");
  } else {
    console.log("History API: local file until MongoDB connects, then Atlas.");
  }
});

const mongoOpts = {
  serverSelectionTimeoutMS: 12_000,
  socketTimeoutMS: 45_000,
};

let mongoErrorListenerAdded = false;
let querySrvHintLogged = false;

async function connectMongoForever() {
  for (;;) {
    try {
      await mongoose.connect(MONGODB_URI, mongoOpts);
      lastMongoConnectError = null;
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
      if (!mongoErrorListenerAdded) {
        mongoErrorListenerAdded = true;
        mongoose.connection.on("error", (err) => {
          lastMongoConnectError = err.message;
          console.error("MongoDB runtime error:", err.message);
        });
      }
      return;
    } catch (err) {
      lastMongoConnectError = err.message;
      console.error(`MongoDB connection failed: ${err.message}. Retrying in 5s…`);
      if (String(err.message).includes("querySrv") && !querySrvHintLogged) {
        querySrvHintLogged = true;
        console.error(
          "If this keeps failing: (1) set PC DNS to 8.8.8.8 in Windows, or (2) replace MONGODB_URI with Atlas’s mongodb:// (non-SRV) connection string."
        );
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

if (MONGODB_URI) {
  applyMongoDnsForSrv(MONGODB_URI);
  connectMongoForever();
} else {
  lastMongoConnectError = "MONGODB_URI not set";
}

