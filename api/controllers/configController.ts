import { Request, Response } from 'express';
import * as env from '../config/env';

export const getIceServers = async (req: Request, res: Response) => {
    try {
        const iceServers: any[] = [
            // Comprehensive STUN server list for initial P2P discovery
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:stun.nextcloud.com:443' },
            { urls: 'stun:iphone-stun.strato-iphone.de:3478' }
        ];

        // Add private TURN server configuration from environment
        if (env.TURN_SERVER_URL) {
            console.log('[CONFIG_CONTROLLER] Providing private TURN server:', env.TURN_SERVER_URL);
            
            // Build TURN URL list (UDP + TCP)
            const turnUrls = [env.TURN_SERVER_URL];
            if (env.TURN_SERVER_URL_TCP) {
                turnUrls.push(env.TURN_SERVER_URL_TCP);
            }

            iceServers.push({
                urls: turnUrls,
                username: env.TURN_USERNAME,
                credential: env.TURN_CREDENTIAL,
                credentialType: 'password'
            });
        } else {
            console.warn('[CONFIG_CONTROLLER] No primary TURN server configured in ENV.');
        }

        // Add standard free fallback TURN servers
        iceServers.push({
            urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'],
            username: 'openrelayproject',
            credential: 'openrelayproject',
            credentialType: 'password'
        });

        res.json({ iceServers });
    } catch (err: any) {
        console.error('[CONFIG_CONTROLLER] Failed to generate/fetch ICE servers:', err.message);
        res.status(500).send('Server error');
    }
};
