import axios from 'axios';

// Vite exposes env variables on the `import.meta.env` object.
// VITE_ is a required prefix.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// --- THIS IS THE FIX ---
// We add a request interceptor to automatically add the auth token to every request.
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from local storage (or wherever you store it)
    const token = localStorage.getItem('token');
    if (token) {
      // If the token exists, add it to the Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;