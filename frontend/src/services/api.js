import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (window.location.hostname.includes('vercel.app') ? 'https://insight-1-vf6e.onrender.com/api' : '/api'),
    headers: {
          'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('insightai_token');
    if (token) {
          config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
