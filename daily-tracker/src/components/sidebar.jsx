import styles from "./Sidebar.module.css";

function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <h2>WorkTrack</h2>

      <p>📅 Today</p>
      <p>📆 History</p>
      <p>⭐ Important</p>
    </div>
  );
}

export default Sidebar;