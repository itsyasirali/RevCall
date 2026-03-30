import { Server } from 'socket.io';
import http from 'http';

export const setupSocket = (server: http.Server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // Map to track active calls: receiverId -> senderId
    const activeCalls = new Map<string, { from: string, name: string, offer: any, status: 'ringing' | 'connected' }>();
    // Map to track which user is in which call (userId -> callId/receiverId)
    const userCallState = new Map<string, string>();

    io.on('connection', (socket) => {
        let currentUserId: string | null = null;
        console.log('New client connected:', socket.id);

        socket.on('join', (userId) => {
            // Leave previous user-specific rooms to prevent multi-room signaling crossover
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    socket.leave(room);
                }
            }
            currentUserId = userId;
            socket.join(userId);
            console.log(`[SIGNAL] User ${userId} joined room ${userId} (Socket: ${socket.id}). Current rooms:`, [...socket.rooms]);
        });

        socket.on('call-user', ({ to, offer, from, name }) => {
            console.log(`[SIGNAL] call-user prompt: from ${from} to ${to}`);

            // 1. Check if 'to' is already being called by 'from' (Scenario Step 2)
            const existingCall = activeCalls.get(to);
            if (existingCall && existingCall.from === from) {
                console.log(`[SIGNAL] DUPLICATE: Call already exists from ${from} to ${to}.`);
                socket.emit('call-rejected', { reason: 'Call already in progress' });
                return;
            }

            // 2. Check if 'to' is currently calling 'from' (Collision)
            const reverseCall = activeCalls.get(from);
            if (reverseCall && reverseCall.from === to) {
                console.log(`[SIGNAL] COLLISION: ${to} is already calling ${from}.`);
                socket.emit('call-rejected', { reason: 'Incoming call from this user already exists' });
                return;
            }

            // 3. Mark call as active
            activeCalls.set(to, { from, name, offer, status: 'ringing' });
            userCallState.set(from, to);
            userCallState.set(to, from);

            console.log(`[SIGNAL] Emit incoming-call to room: ${to} from ${from}`);
            io.to(to).emit('incoming-call', { from, offer, name });
        });

        socket.on('answer-call', ({ to, answer }) => {
            console.log(`[SIGNAL] answer-call from ${currentUserId} to ${to}`);
            const call = activeCalls.get(currentUserId || '');
            if (call) {
                call.status = 'connected';
            }
            io.to(to).emit('call-answered', { answer });
        });

        socket.on('ringing', ({ to }) => {
            console.log(`[SIGNAL] ringing notification: from ${currentUserId} to ${to}`);
            io.to(to).emit('ringing');
        });

        socket.on('ice-candidate', ({ to, candidate, from }) => {
            const sender = from || currentUserId;
            // console.log(`[SIGNAL] ice-candidate from ${sender} to ${to}`);
            io.to(to).emit('ice-candidate', { candidate, from: sender });
        });

        const handleCleanup = (targetId: string | null) => {
            if (!targetId) return;

            const otherId = userCallState.get(targetId);
            if (otherId) {
                console.log(`[SIGNAL] Cleaning up call state between ${targetId} and ${otherId}`);
                activeCalls.delete(targetId);
                activeCalls.delete(otherId); // In case they were mapped the other way
                userCallState.delete(targetId);
                userCallState.delete(otherId);
                io.to(otherId).emit('call-ended');
            }
        };

        socket.on('hangup', ({ to }) => {
            console.log(`[SIGNAL] Hangup from ${currentUserId} to ${to}`);
            handleCleanup(currentUserId);
            io.to(to).emit('call-ended');
        });

        socket.on('disconnect', () => {
            console.log('[SIGNAL] Client disconnected:', socket.id, 'User:', currentUserId);
            if (currentUserId) {
                handleCleanup(currentUserId);
            }
        });
    });

    return io;
};
