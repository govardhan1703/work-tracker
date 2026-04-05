import axios from "axios";

const origin =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3001";

const API = axios.create({
  baseURL: `${String(origin).replace(/\/$/, "")}/api`,
});

export default API;