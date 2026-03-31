import styles from "./TaskTable.module.css";

function TaskTable({ tasks, toggleTask, deleteTask }) {
  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>✔</th>
            <th>Task</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {tasks.map(task => (
            <tr key={task.id}>
              <td>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                />
              </td>

              <td>{task.text}</td>
              <td>{task.done ? "Done" : "Pending"}</td>

              <td>
                <button onClick={() => deleteTask(task.id)}>
                  ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TaskTable;