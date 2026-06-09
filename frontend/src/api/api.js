import axios from "axios";
import gymConfig from "../config/gymConfig"; // Import default export

const api = axios.create({ 
baseURL: "http://localhost:8088/api"
});

// Attach JWT like Feedback (token header) AND standard Bearer
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    // Feedback-style header (your working pattern elsewhere)
    config.headers.token = token;
    // Standard Bearer header (for any middleware expecting it)
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;