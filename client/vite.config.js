import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Use IPv4 explicitly so Windows localhost/IPv6 resolution cannot cause a
// false ECONNREFUSED when the API is listening on 127.0.0.1.
const API = process.env.VITE_API_PROXY || 'http://127.0.0.1:5000';
export default defineConfig({ plugins: [react()], server: { host: true, port: 5173, proxy: { '/api': API, '/uploads': API, '/socket.io': { target: API, ws: true } } } });
