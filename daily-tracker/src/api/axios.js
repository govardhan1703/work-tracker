import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3001/api", // your backend URL
});

export default API;