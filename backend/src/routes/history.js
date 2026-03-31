import { Router } from "express";
import DailyHistory from "../models/DailyHistory.js";

const router = Router();

// Health check for this router
router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.get("/:date", async (req, res) => {
  const { date } = req.params;

  const doc = await DailyHistory.findOne({ date }).lean();
  if (!doc) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({
    date: doc.date,
    columns: doc.columns,
    rows: doc.rows
  });
});

router.put("/:date", async (req, res) => {
  const { date } = req.params;
  const { columns, rows } = req.body ?? {};

  if (!Array.isArray(columns) || !Array.isArray(rows)) {
    return res.status(400).json({
      error: "Invalid body. Expected { columns: string[], rows: object[] }"
    });
  }

  const doc = await DailyHistory.findOneAndUpdate(
    { date },
    { date, columns, rows },
    { upsert: true, new: true }
  );

  res.json({
    date: doc.date,
    columns: doc.columns,
    rows: doc.rows
  });
});

router.delete("/:date", async (req, res) => {
  const { date } = req.params;

  const doc = await DailyHistory.findOneAndDelete({ date }).lean();
  if (!doc) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({ ok: true, deleted: doc.date });
});

export default router;

