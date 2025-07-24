import axios from 'axios';

// Vite exposes env variables on the `import.meta.env` object.
// VITE_ is a required prefix.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export default apiClient;