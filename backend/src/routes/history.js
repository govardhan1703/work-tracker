import { Router } from "express";
import {
  getHistoryByDate,
  putHistoryByDate,
  deleteHistoryByDate,
} from "../historyStore.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.get("/:date", async (req, res) => {
  const { date } = req.params;

  const doc = await getHistoryByDate(date);
  if (!doc) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({
    date: doc.date,
    columns: doc.columns,
    rows: doc.rows,
  });
});

router.put("/:date", async (req, res) => {
  const { date } = req.params;
  const { columns, rows } = req.body ?? {};

  if (!Array.isArray(columns) || !Array.isArray(rows)) {
    return res.status(400).json({
      error: "Invalid body. Expected { columns: string[], rows: object[] }",
    });
  }

  const doc = await putHistoryByDate(date, columns, rows);
  res.json({
    date: doc.date,
    columns: doc.columns,
    rows: doc.rows,
  });
});

router.delete("/:date", async (req, res) => {
  const { date } = req.params;

  const deleted = await deleteHistoryByDate(date);
  if (!deleted) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({ ok: true, deleted });
});

export default router;
