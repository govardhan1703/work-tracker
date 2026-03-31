import { useState } from "react";
import styles from "./TaskInput.module.css";

function TaskInput({ addTask }) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    addTask(input);
    setInput("");
  };

  return (
    <div className={styles.container}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add task..."
        className={styles.input}
      />
      <button onClick={handleAdd}>Add</button>
    </div>
  );
}

export default TaskInput;