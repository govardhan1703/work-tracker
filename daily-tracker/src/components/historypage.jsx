import { useEffect, useState } from "react";
import { getHistory } from "../api/history";

const historyage = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await getHistory();
    setData(res);
  };

  return (
    <div>
      {data.map((item, i) => (
        <p key={i}>{item.title}</p>
      ))}
    </div>
  );
};

export default historypage;