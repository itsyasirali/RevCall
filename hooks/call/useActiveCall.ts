import { useState, useEffect } from 'react';

export const useActiveCall = (webrtc: any, activeCall: any, endCurrentCall: () => void) => {
    const [timer, setTimer] = useState(0);
    const [ringingTimer, setRingingTimer] = useState(0);
    const [isTimedOut, setIsTimedOut] = useState(false);

    // Timer logic for active call
    useEffect(() => {
        let interval: any;
        if (webrtc.peerStatus === 'connected' || webrtc.connectionState === 'connected') {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        } else {
            setTimer(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [webrtc.connectionState, webrtc.peerStatus]);

    // Timer logic for ringing timeout
    useEffect(() => {
        let interval: any;
        if (webrtc.peerStatus === 'calling' || webrtc.peerStatus === 'ringing') {
            interval = setInterval(() => {
                setRingingTimer(prev => {
                    if (prev >= 30) {
                        setIsTimedOut(true);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            setRingingTimer(0);
            setIsTimedOut(false);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [webrtc.peerStatus]);

    // Auto-end call after timeout message
    useEffect(() => {
        if (isTimedOut) {
            const timeout = setTimeout(() => {
                endCurrentCall();
            }, 3000); // Wait 3s to show the message
            return () => clearTimeout(timeout);
        }
    }, [isTimedOut, endCurrentCall]);

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getPeerStatus = () => {
        if (isTimedOut) return 'User not responding';
        if (webrtc.peerStatus === 'connected' || webrtc.connectionState === 'connected') {
            return formatTimer(timer);
        }
        if (webrtc.peerStatus === 'ringing') return 'Ringing...';
        if (webrtc.peerStatus === 'calling') return 'Calling...';

        switch (webrtc.connectionState) {
            case 'connecting': return 'Connecting...';
            case 'failed': return 'Connection Failed';
            case 'disconnected': return 'Disconnected';
            default: return 'Calling...';
        }
    };

    const displayStatus = getPeerStatus();
    const displayError = webrtc.errorMessage;

    return {
        timer,
        ringingTimer,
        isTimedOut,
        formatTimer,
        getPeerStatus,
        displayStatus,
        displayError,
    };
};
