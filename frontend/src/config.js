// Dynamische API-URL Konfiguration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getApiUrl = () => API_URL;

export const fetchFromApi = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  return fetch(url, options);
};
