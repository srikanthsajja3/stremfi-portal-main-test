import axios from "axios";

const isVercel = typeof window !== "undefined" && window.location.hostname.includes("vercel.app");

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || (isVercel ? "/frontend_api" : "https://pol.vrplay.in/frontend_api"),
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    
    if (error.response?.status === 403 && error.response?.data?.mustChangePassword) {
      if (window.location.pathname !== "/change-password") {
        window.location.href = "/change-password";
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("rootToken");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
