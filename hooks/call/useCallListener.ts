import { useEffect } from 'react';
import { socketService } from '../../service/socket';
import { useAuth } from '../auth/useAuth';
import { useCallContext } from '../../context/CallContext';

export const useCallListener = () => {
    const { user } = useAuth();
    const { setIncomingCall, activeCall } = useCallContext();

    const identifier = user?.number || user?._id || user?.id;

    useEffect(() => {
        if (!identifier) return;

        const socket = socketService.connect(identifier);
        console.log('[GLOBAL_LISTENER] Monitoring for calls for identifier:', identifier);

        socket.on('incoming-call', ({ from, offer, name }) => {
            console.log(`[CLIENT] Incoming call signal received from: ${from}. (My identifier: ${identifier})`);

            if (from === identifier) {
                console.log('[CLIENT] Ignoring self-incoming call loopback signal (preventing caller-side ringtone)');
                return;
            }

            // COLLISION PREVENTION: If we are calling this person and we are Master, ignore their incoming offer
            if (activeCall?.phoneNumber === from) {
                // IDs are strings, so we compare them. (In JS '107' < '939' is true)
                if (String(identifier) < String(from)) {
                    console.log('[CLIENT] I am Master in collision. Ignoring incoming call state (preventing ringtone).');
                    return;
                }
            }

            // Notify the caller that we are ringing
            socket.emit('ringing', { to: from });
            setIncomingCall({ from, name, offer });
        });

        return () => {
            socket.off('incoming-call');
        };
    }, [identifier, setIncomingCall]);
};
