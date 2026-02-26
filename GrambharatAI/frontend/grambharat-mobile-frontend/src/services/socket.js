import { io } from 'socket.io-client';
import { getCurrentBaseUrl } from './api';

let socket = null;

export const initSocket = () => {
    if (socket) return socket;

    const baseUrl = getCurrentBaseUrl();
    socket = io(baseUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
