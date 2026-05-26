import axios from "axios";

export const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const shortLinkHost = import.meta.env.VITE_SHORT_LINK_HOST || "http://localhost:5000";

const API = axios.create({
  baseURL,
  withCredentials: true,
});

// AUTH APIS
export const registerUser = (username, email, password) =>
  API.post("/auth/register", { username, email, password });

export const loginUser = (loginKey, password) =>
  API.post("/auth/login", { loginKey, password });

export const logoutUser = () =>
  API.post("/auth/logout");

export const getUserProfile = () =>
  API.get("/auth/me");

// URL APIS
export const createShortUrl = (originalUrl, expiresAt) =>
  API.post("/shorten", { originalUrl, expiresAt });

export const getStats = (shortCode) =>
  API.get(`/stats/${shortCode}`);

export const getUserUrls = () =>
  API.get("/my-urls");