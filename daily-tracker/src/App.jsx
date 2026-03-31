import { useState, useEffect, useRef } from "react";
import styles from "./components/tasktable.module.css";

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem("history")) || {};
  } catch {
    return {};
  }
}

function DailyTable({ selectedDate }) {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  const [columns, setColumns] = useState(() => {
    const stored = loadHistory();
    return stored[selectedDate]?.columns ?? [];
  });

  const [rows, setRows] = useState(() => {
    const stored = loadHistory();
    return stored[selectedDate]?.rows ?? [];
  });

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  // Prevent overwriting MongoDB with the initial localStorage values.
  const didHydrateFromServerRef = useRef(false);

  // 📥 Load data from backend (MongoDB)
  useEffect(() => {
    didHydrateFromServerRef.current = false;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/history/${selectedDate}`);
        if (!res.ok) {
          // If not found, we keep local defaults and allow user edits to create it.
          if (res.status === 404) didHydrateFromServerRef.current = true;
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        setColumns(data.columns ?? []);
        setRows(data.rows ?? []);

        // Keep localStorage cache in sync too.
        const existing = loadHistory();
        const updatedHistory = {
          ...existing,
          [selectedDate]: { columns: data.columns ?? ["Task"], rows: data.rows ?? [] }
        };
        localStorage.setItem("history", JSON.stringify(updatedHistory));
        didHydrateFromServerRef.current = true;
      } catch (err) {
        // If backend isn't available, fall back to localStorage.
        console.warn("Backend fetch failed, using local cache:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [API_BASE_URL, selectedDate]);

  // 💾 SAVE DATA (local cache always; MongoDB only after hydrate)
  useEffect(() => {
    const existing = loadHistory();
    const updatedHistory = {
      ...existing,
      [selectedDate]: { columns, rows }
    };
    localStorage.setItem("history", JSON.stringify(updatedHistory));

    if (!didHydrateFromServerRef.current) return;

    const timeout = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/history/${selectedDate}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns, rows })
      }).catch(() => {
        console.warn("Backend save failed");
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [columns, rows, selectedDate, API_BASE_URL]);

  // ➕ Add Column
  const addColumn = () => {
    const name = newColumnName.trim();
    if (!name || columns.includes(name)) return;

    const newColumns = [...columns, name];
    setColumns(newColumns);

    const updatedRows = rows.map(row => ({
      ...row,
      [name]: ""
    }));

    setRows(updatedRows);

    setNewColumnName("");
    setIsAddingColumn(false);
  };

  // ❌ Remove Column
  const removeColumn = (col) => {
    const newColumns = columns.filter(c => c !== col);
    setColumns(newColumns);

    const updatedRows = rows.map(row => {
      const newRow = { ...row };
      delete newRow[col];
      return newRow;
    });
    setRows(updatedRows);
  };

  // ➕ Add Row
  const addRow = () => {
    const newRow = {};
    columns.forEach(col => {
      newRow[col] = "";
    });
    setRows([...rows, newRow]);
  };

  // ✏️ Update Cell
  const updateCell = (rowIndex, col, value) => {
    const updated = [...rows];
    updated[rowIndex][col] = value;
    setRows(updated);
  };

  // ❌ Delete Row
  const deleteRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* ACTION BUTTONS */}
      <div style={{ marginBottom: "15px" }}>
        {!isAddingColumn ? (
          <button onClick={() => setIsAddingColumn(true)}>+ Column</button>
        ) : (
          <>
            <input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Column name"
              style={{ width: 200, marginRight: 10 }}
            />
            <button onClick={addColumn}>Add</button>
            <button
              onClick={() => {
                setNewColumnName("");
                setIsAddingColumn(false);
              }}
              style={{ marginLeft: 10 }}
            >
              Cancel
            </button>
          </>
        )}
        <button onClick={addRow} style={{ marginLeft: "10px" }}>
          + Row
        </button>
      </div>

      {/* TABLE */}
      <div className={styles.container}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>
                  {col}
                  <button onClick={() => removeColumn(col)}> ✖</button>
                </th>
              ))}
              <th style={{ width: "80px", textAlign: "center" }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td key={col}>
                    <input
                      value={row[col] || ""}
                      onChange={(e) =>
                        updateCell(rowIndex, col, e.target.value)
                      }
                    />
                  </td>
                ))}

                <td style={{ textAlign: "center" }}>
                  <button onClick={() => deleteRow(rowIndex)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function App() {
  // 📅 Date
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // 🎨 Theme
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  // 🎨 Apply Theme
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div style={{ padding: "30px" }}>

      {/* TITLE */}
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Daily-Tracker
      </h1>

      {/* THEME TOGGLE */}
      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* DATE PICKER (HISTORY) */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <DailyTable key={selectedDate} selectedDate={selectedDate} />

    </div>
  );
}

export default App;