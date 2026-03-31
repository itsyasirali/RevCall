import { Request, Response } from 'express';
import * as env from '../config/env';

export const getIceServers = async (req: Request, res: Response) => {
    try {
        const iceServers = [
            // STUN servers come first to encourage P2P discovery
            { urls: 'stun:stun.net' },
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ];

        // Add dynamic TURN server configuration from backend environment
        if (env.TURN_SERVER_URL) {
            const turnUrls = [env.TURN_SERVER_URL];
            if (env.TURN_SERVER_URL_TCP) {
                turnUrls.push(env.TURN_SERVER_URL_TCP);
            }

            iceServers.push({
                urls: turnUrls,
                username: env.TURN_USERNAME || '',
                credential: env.TURN_CREDENTIAL || ''
            } as any);
        }

        // Add standard fallback public TURN server for broad compatibility
        iceServers.push({
            urls: ['turn:freestun.net:3478', 'turn:freestun.net:5349', 'turn:freestun.net:3478?transport=tcp'],
            username: 'free',
            credential: 'free'
        } as any);

        res.json({ iceServers });
    } catch (err: any) {
        console.error('[CONFIG_CONTROLLER] Failed to generate/fetch ICE servers:', err.message);
        res.status(500).send('Server error');
    }
};
