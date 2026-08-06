import axios from "axios";
import { env } from "../env";

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to format responses conforming to API rules
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      success: false,
      error: {
        code: "CONNECTION_ERROR",
        message: error.message || "Failed to communicate with auth server",
      },
    });
  }
);
