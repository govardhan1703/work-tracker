import API from "../api/axios";

// GET by date
export const getHistory = async (date) => {
  const res = await API.get(`/history/${date}`);
  return res.data;
};

// PUT (create/update)
export const saveHistory = async (date, data) => {
  const res = await API.put(`/history/${date}`, data);
  return res.data;
};