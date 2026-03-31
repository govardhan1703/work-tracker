import { useEffect, useState } from "react";
import { getHistory, saveHistory } from "../api/history";

const today = new Date().toISOString().split("T")[0];

const trackerpage = () => {
  const [columns, setColumns] = useState(["task", "status"]);
  const [rows, setRows] = useState([]);

  // 🔹 Load data from backend
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getHistory(today);
      setColumns(data.columns);
      setRows(data.rows);
    } catch (err) {
      console.log("No data found, starting fresh");
    }
  };

  // 🔹 Add new row
  const addRow = () => {
    setRows([...rows, { task: "", status: "" }]);
  };

  // 🔹 Handle input change
  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  // 🔹 Save to backend
  const handleSave = async () => {
    try {
      await saveHistory(today, { columns, rows });
      alert("Saved successfully ✅");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Daily Tracker</h2>

      <button onClick={addRow}>Add Row</button>
      <button onClick={handleSave}>Save</button>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col, j) => (
                <td key={j}>
                  <input
                    value={row[col] || ""}
                    onChange={(e) =>
                      handleChange(i, col, e.target.value)
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default trackerpage;