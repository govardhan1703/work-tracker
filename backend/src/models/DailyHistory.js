import mongoose from "mongoose";

const DailyHistorySchema = new mongoose.Schema(
  {
    // YYYY-MM-DD (used as a unique key)
    date: { type: String, required: true, unique: true, index: true },
    columns: { type: [String], default: ["Task"] },
    // rows are stored as an array of objects keyed by column name
    rows: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("DailyHistory", DailyHistorySchema);

