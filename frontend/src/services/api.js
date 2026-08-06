import axios from 'axios';

// Ensure the base URL always ends with /api (fixes user Vercel env config missing /api)
let base = import.meta.env.VITE_API_URL || (window.location.hostname.includes('vercel.app') ? 'https://insight-1-vf6e.onrender.com/api' : '/api');
if (base && !base.endsWith('/api')) {
  base = base.replace(/\/$/, '') + '/api';
}

const api = axios.create({
    baseURL: base,
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
