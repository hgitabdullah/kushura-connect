import axios from 'axios';
// Set VITE_API_URL to the backend origin on Vercel (for example, https://api.example.com).
// Keep it empty for local development, where Vite proxies /api to localhost:5000.
export const serverOrigin = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const api = axios.create({ baseURL: serverOrigin ? `${serverOrigin}/api` : '/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
api.interceptors.response.use(response => {
  if (!serverOrigin) return response;
  const absolutizeUploads = value => {
    if (typeof value === 'string') return value.startsWith('/uploads/') ? `${serverOrigin}${value}` : value;
    if (Array.isArray(value)) return value.map(absolutizeUploads);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, absolutizeUploads(item)]));
    return value;
  };
  response.data = absolutizeUploads(response.data);
  return response;
});
export default api;
