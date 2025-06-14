import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await refreshInstance.post('auth/token/refresh/');
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Prevent infinite retries by not retrying refresh failures
        if (refreshError.response?.status === 400 || refreshError.response?.status === 401) {
          // Clear any stale tokens or state if needed
          originalRequest._retry = false; // Reset retry flag
          return Promise.reject(refreshError);
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance