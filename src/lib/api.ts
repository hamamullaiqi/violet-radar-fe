import axios from "axios";

// Default API URL (can be updated dynamically via Cockpit settings)
const getApiUrl = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("violet_backend_url") || "http://localhost:5001";
  }
  return "http://localhost:5001";
};

export const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Inject Bearer token before each request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("violet_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Dynamically update baseURL if changed in Cockpit settings
      const currentUrl = localStorage.getItem("violet_backend_url");
      if (currentUrl) {
        config.baseURL = currentUrl;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry or unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response && error.response.status === 401) {
      // Clear invalid credentials and token
      localStorage.removeItem("violet_token");
      localStorage.removeItem("violet_user");
      // Redirect to login if on the cockpit app
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
