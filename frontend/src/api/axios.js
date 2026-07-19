import axios from "axios";

const api = axios.create({
  baseURL: process.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("payout.token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    const message = err.response?.data?.error || err.message || "Request failed";
    return Promise.reject({ ...err, message, nextAllowedAt: err.response?.data?.nextAllowedAt });
  }
);

export default api;
