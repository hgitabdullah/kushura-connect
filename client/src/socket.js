import { io } from 'socket.io-client';
let s; export const getSocket = () => (s ||= io({ auth: { token: localStorage.getItem('token') } }));
export const resetSocket = () => { s?.disconnect(); s = null; };
