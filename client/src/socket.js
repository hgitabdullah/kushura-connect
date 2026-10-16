import { io } from 'socket.io-client';
import { serverOrigin } from './api';
let s; export const getSocket = () => (s ||= io(serverOrigin || undefined, { auth: { token: localStorage.getItem('token') } }));
export const resetSocket = () => { s?.disconnect(); s = null; };
