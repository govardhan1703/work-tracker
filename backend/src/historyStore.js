import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import DailyHistory from "./models/DailyHistory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localPath = path.join(__dirname, "..", "data", "local-history.json");

function mongoReady() {
  return mongoose.connection.readyState === 1;
}

async function readLocal() {
  try {
    const text = await fs.readFile(localPath, "utf8");
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function writeLocal(data) {
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, JSON.stringify(data, null, 2), "utf8");
}

export function activeStorageLabel() {
  return mongoReady() ? "mongodb" : "local-file";
}

export async function getHistoryByDate(date) {
  if (mongoReady()) {
    const doc = await DailyHistory.findOne({ date }).lean();
    if (!doc) return null;
    return { date: doc.date, columns: doc.columns, rows: doc.rows };
  }
  const all = await readLocal();
  const entry = all[date];
  if (!entry) return null;
  return { date, columns: entry.columns, rows: entry.rows };
}

export async function putHistoryByDate(date, columns, rows) {
  if (mongoReady()) {
    const doc = await DailyHistory.findOneAndUpdate(
      { date },
      { date, columns, rows },
      { upsert: true, new: true }
    );
    return { date: doc.date, columns: doc.columns, rows: doc.rows };
  }
  const all = await readLocal();
  all[date] = { columns, rows };
  await writeLocal(all);
  return { date, columns, rows };
}

export async function deleteHistoryByDate(date) {
  if (mongoReady()) {
    const doc = await DailyHistory.findOneAndDelete({ date }).lean();
    return doc ? doc.date : null;
  }
  const all = await readLocal();
  if (!all[date]) return null;
  delete all[date];
  await writeLocal(all);
  return date;
}
