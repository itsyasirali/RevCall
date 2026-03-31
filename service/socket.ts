import { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { BASE_URL } from './config';

const SIGNAL_SERVER = BASE_URL;

class SocketService {
    private socket: Socket | null = null;
    private currentUserId: string | null = null;
    private listeners: ((socket: Socket | null) => void)[] = [];
    private candidateBuffer: Record<string, any[]> = {};

    connect(userId: string) {
        if (this.socket && this.currentUserId !== userId) {
            console.log(`[SOCKET_SERVICE] User changed from ${this.currentUserId} to ${userId}. Reconnecting to ensure clean room state.`);
            this.disconnect();
        }
        this.currentUserId = userId;

        if (!this.socket) {
            console.log('Initializing Global Socket connection to:', SIGNAL_SERVER);
            const _socket = io(SIGNAL_SERVER, {
                transports: ['websocket', 'polling'], // Allow polling fallback for tunnel stability
                reconnectionAttempts: 10,
                timeout: 20000, // Increased timeout for slow tunnel handshakes
                autoConnect: true,
                forceNew: true,
                withCredentials: true // Crucial for session-based auth
            });

            _socket.on('connect', () => {
                console.log('Global Socket connected successfully. ID:', _socket.id);
                if (this.currentUserId) {
                    _socket.emit('join', this.currentUserId);
                }
                this.notifyListeners(_socket);
            });

            _socket.on('ice-candidate', ({ candidate, from }: any) => {
                // If it's from someone else, buffer it
                if (from && from !== this.currentUserId) {
                    console.log(`[SOCKET_SERVICE] Buffering ICE candidate from ${from}`);
                    if (!this.candidateBuffer[from]) this.candidateBuffer[from] = [];
                    this.candidateBuffer[from].push(candidate);
                }
            });

            _socket.on('disconnect', (reason) => {
                console.log('Global Socket disconnected. Reason:', reason);
                this.notifyListeners(_socket);
            });

            this.socket = _socket;
            this.notifyListeners(_socket);
        } else if (this.socket.connected) {
            this.socket.emit('join', userId);
        }

        return this.socket;
    }

    getBufferedCandidates(from: string) {
        const candidates = this.candidateBuffer[from] || [];
        delete this.candidateBuffer[from];
        if (candidates.length > 0) {
            console.log(`[SOCKET_SERVICE] Returning ${candidates.length} buffered candidates for ${from}`);
        }
        return candidates;
    }

    private notifyListeners(socket: Socket | null) {
        this.listeners.forEach(l => l(socket));
    }

    subscribe(listener: (socket: Socket | null) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    getSocket() {
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.notifyListeners(null);
            this.candidateBuffer = {};
        }
    }
}

export const socketService = new SocketService();

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(socketService.getSocket());

    useEffect(() => {
        const unsubscribe = socketService.subscribe((s) => setSocket(s));
        // Check current status in case it changed between initialization and subscription
        const current = socketService.getSocket();
        if (current !== socket) setSocket(current);

        return unsubscribe;
    }, []);

    return socket;
};
