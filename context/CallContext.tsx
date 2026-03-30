import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Vibration, Platform, NativeModules } from 'react-native';
import { Audio } from 'expo-av';
import { socketService, useSocket } from '../service/socket';
import { useWebRTC } from '../hooks/call/useWebRTC';
import { useAuth } from '../hooks/auth/useAuth';
import axios from '../service/axios';
import { format } from 'date-fns';

// Safe import for VolumeManager
let VolumeManager: any = null;
try {
    VolumeManager = require('react-native-volume-manager').VolumeManager;
} catch (e) {
    console.log('[CALL_CONTEXT] VolumeManager not found, ringer mode awareness disabled');
}

interface CallData {
    from: string;
    name: string;
    offer: any;
}

interface ActiveCallData {
    phoneNumber: string;
    name: string;
    isMinimized: boolean;
    timer: number;
    startTime?: Date;
}

interface CallContextType {
    incomingCall: CallData | null;
    isFullScreen: boolean; // For incoming call
    isCallingFullScreen: boolean; // For active call
    setIncomingCall: (call: CallData | null) => void;
    setIsFullScreen: (isFull: boolean) => void;
    setIsCallingFullScreen: (isFull: boolean) => void;
    acceptCall: () => Promise<void>;
    declineCall: () => Promise<void>;
    activeCall: ActiveCallData | null;
    setActiveCall: (call: ActiveCallData | null) => void;
    minimizeCall: (phoneNumber: string, name: string, timer: number) => void;
    restoreCall: () => void;
    // Call controls
    startOutgoingCall: (phoneNumber: string, name: string) => Promise<void>;
    endCurrentCall: () => Promise<void>;
    // WebRTC exposures
    webrtc: any;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isCallingFullScreen, setIsCallingFullScreen] = useState(false);
    const [activeCall, setActiveCall] = useState<ActiveCallData | null>(null);
    const [isIosMuted, setIsIosMuted] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);
    const isAcceptedRef = useRef(false);
    const startTimeRef = useRef<Date | null>(null);
    const socket = useSocket();

    useEffect(() => {
        if (Platform.OS === 'ios' && VolumeManager && VolumeManager.addSilentListener) {
            const subscription = VolumeManager.addSilentListener((status: any) => {
                setIsIosMuted(status.isMuted);
            });
            return () => {
                if (subscription && typeof (subscription as any).remove === 'function') {
                    (subscription as any).remove();
                }
            };
        }
    }, []);

    const identifier = user?.number || user?._id || user?.id || '';

    // Use WebRTC hook at the component level to persist state
    const webrtc = useWebRTC(identifier);

    const logCall = async (data: {
        otherNumber: string,
        direction: 'incoming' | 'outgoing',
        status: 'missed' | 'completed' | 'busy' | 'declined',
        startTime: Date,
        endTime: Date,
        duration: number
    }) => {
        try {
            console.log('[CALL_CONTEXT] Logging call:', data);
            await axios.post('/api/calls/log', {
                ...data,
                receiverNumber: data.direction === 'outgoing' ? data.otherNumber : user?.number,
                startTime: data.startTime.toISOString(),
                endTime: data.endTime.toISOString()
            });
        } catch (error) {
            console.error('[CALL_CONTEXT] Failed to log call:', error);
        }
    };

    const minimizeCall = useCallback((phoneNumber: string, name: string, timer: number) => {
        setActiveCall({
            phoneNumber,
            name,
            isMinimized: true,
            timer
        });
        setIsCallingFullScreen(false);
    }, []);

    const restoreCall = useCallback(() => {
        if (activeCall) {
            setActiveCall({ ...activeCall, isMinimized: false });
            setIsCallingFullScreen(true);
        }
    }, [activeCall]);

    const playRingtone = useCallback(async () => {
        if (isAcceptedRef.current) return;
        try {
            // Android: 0 = SILENT, 1 = VIBRATE, 2 = NORMAL
            // iOS: getRingerMode returns undefined, so we use isIosMuted
            if (VolumeManager && VolumeManager.getRingerMode) {
                const ringerMode = await VolumeManager.getRingerMode();
                console.log('[CALL_CONTEXT] Current Ringer Mode:', ringerMode);

                if (Platform.OS === 'android') {
                    if (ringerMode === 0 || ringerMode === 1) {
                        console.log('[CALL_CONTEXT] Android ringer mode is silent/vibrate, skipping ringtone');
                        return;
                    }
                } else if (Platform.OS === 'ios') {
                    if (isIosMuted) {
                        console.log('[CALL_CONTEXT] iOS is muted, skipping ringtone');
                        return;
                    }
                }
            }

            await Audio.setIsEnabledAsync(true);
            const source = require('../assets/images/ringtone/Opening.aac');
            const oldSound = soundRef.current;
            if (oldSound) {
                soundRef.current = null;
                try {
                    await oldSound.stopAsync();
                    await oldSound.unloadAsync();
                } catch (e) { }
            }
            const { sound: ringtone } = await Audio.Sound.createAsync(
                source,
                { shouldPlay: false, isLooping: true, volume: 1.0 }
            );
            if (isAcceptedRef.current) {
                await ringtone.unloadAsync();
                return;
            }
            soundRef.current = ringtone;
            await ringtone.playAsync();
        } catch (error) {
            console.error('[CALL_CONTEXT] Ringtone failed:', error);
        }
    }, [isIosMuted]);

    const stopFeedback = useCallback(async () => {
        isAcceptedRef.current = true;
        Vibration.cancel();
        const sound = soundRef.current;
        if (!sound) return;
        soundRef.current = null;
        try {
            if (typeof sound.getStatusAsync === 'function') {
                const status = await sound.getStatusAsync().catch(() => null);
                if (status && (status as any).isLoaded) {
                    if (typeof sound.stopAsync === 'function') await sound.stopAsync().catch(() => { });
                    if (typeof sound.unloadAsync === 'function') await sound.unloadAsync().catch(() => { });
                } else if (typeof (sound as any).unloadAsync === 'function') {
                    await (sound as any).unloadAsync().catch(() => { });
                }
            } else if (typeof (sound as any).unloadAsync === 'function') {
                await (sound as any).unloadAsync().catch(() => { });
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        if (incomingCall) {
            isAcceptedRef.current = false;

            // Handle Vibration and Ringtone based on Ringer Mode
            const setupFeedback = async () => {
                try {
                    let ringerMode = undefined;
                    if (VolumeManager && VolumeManager.getRingerMode) {
                        ringerMode = await VolumeManager.getRingerMode();
                    }
                    console.log('[CALL_CONTEXT] Incoming Call - Ringer Mode:', ringerMode, 'iOS Muted:', isIosMuted);

                    // Determine if we should vibrate
                    let shouldVibrate = true;
                    if (Platform.OS === 'android') {
                        // 0 = SILENT, 1 = VIBRATE, 2 = NORMAL
                        shouldVibrate = ringerMode === 1 || ringerMode === 2 || ringerMode === undefined;
                    } else if (Platform.OS === 'ios') {
                        // On iOS, we usually vibrate even if muted (mimicking "Vibrate on Silent")
                        shouldVibrate = true;
                    }

                    if (shouldVibrate) {
                        Vibration.vibrate([500, 1000, 500], true);
                    }

                    // Play ringtone (it handles its own ringer mode check inside playRingtone)
                    await playRingtone();
                } catch (err) {
                    console.error('[CALL_CONTEXT] Error setting up call feedback:', err);
                    // Fallback to default behavior if error
                    Vibration.vibrate([500, 1000, 500], true);
                    playRingtone();
                }
            };

            setupFeedback();

            const handleHangup = () => {
                setIncomingCall(null);
                setIsFullScreen(false);
                stopFeedback();
            };
            socket?.on('call-ended', handleHangup);
            return () => {
                socket?.off('call-ended', handleHangup);
                stopFeedback();
            };
        } else {
            stopFeedback();
        }
    }, [incomingCall, socket, playRingtone, stopFeedback]);

    // Handle remote hangup for active calls
    useEffect(() => {
        const handleActiveCallEnded = () => {
            console.log('[CALL_CONTEXT] Active call ended by remote');
            if (activeCall && startTimeRef.current) {
                const duration = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 1000);
                logCall({
                    otherNumber: activeCall.phoneNumber,
                    direction: webrtc.peerStatus === 'connected' ? 'outgoing' : 'incoming',
                    status: 'completed',
                    startTime: startTimeRef.current,
                    endTime: new Date(),
                    duration
                });
            }
            setActiveCall(null);
            setIsCallingFullScreen(false);
            startTimeRef.current = null;
        };

        if (activeCall) {
            socket?.on('call-ended', handleActiveCallEnded);
            socket?.on('call-rejected', handleActiveCallEnded);
            return () => {
                socket?.off('call-ended', handleActiveCallEnded);
                socket?.off('call-rejected', handleActiveCallEnded);
            };
        }
    }, [activeCall, socket]);

    // Cleanup if WebRTC goes idle (e.g. failure)
    useEffect(() => {
        if (webrtc.peerStatus === 'idle' && activeCall) {
            setActiveCall(null);
            setIsCallingFullScreen(false);
        }
    }, [webrtc.peerStatus, activeCall]);

    const startOutgoingCall = useCallback(async (phoneNumber: string, name: string) => {
        const now = new Date();
        startTimeRef.current = now;
        setActiveCall({
            phoneNumber,
            name,
            isMinimized: false,
            timer: 0,
            startTime: now
        });
        setIsCallingFullScreen(true);
        await webrtc.startCall(phoneNumber, name);
    }, [webrtc]);

    const acceptCall = useCallback(async () => {
        if (!incomingCall) return;
        console.log('[CALL_CONTEXT] Accepting incoming call from:', incomingCall.from);
        const callData = { ...incomingCall };
        setIncomingCall(null);
        setIsFullScreen(false);
        await stopFeedback();
        const now = new Date();
        startTimeRef.current = now;
        setActiveCall({
            phoneNumber: callData.from,
            name: callData.name,
            isMinimized: false,
            timer: 0,
            startTime: now
        });
        setIsCallingFullScreen(true);
        await webrtc.answerCall(callData.from, callData.offer);
    }, [incomingCall, stopFeedback, webrtc]);

    const declineCall = useCallback(async () => {
        if (!incomingCall) return;
        const from = incomingCall.from;
        const now = new Date();
        setIncomingCall(null);
        setIsFullScreen(false);
        await stopFeedback();
        socket?.emit('hangup', { to: from });

        // Log declined call
        logCall({
            otherNumber: from,
            direction: 'incoming',
            status: 'declined',
            startTime: now,
            endTime: now,
            duration: 0
        });
    }, [incomingCall, socket, stopFeedback, user]);

    const endCurrentCall = useCallback(async () => {
        if (activeCall) {
            if (startTimeRef.current) {
                const duration = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 1000);
                logCall({
                    otherNumber: activeCall.phoneNumber,
                    direction: 'outgoing',
                    status: 'completed',
                    startTime: startTimeRef.current,
                    endTime: new Date(),
                    duration
                });
            }

            webrtc.hangup(activeCall.phoneNumber);
        }
        setActiveCall(null);
        setIsCallingFullScreen(false);
        startTimeRef.current = null;
    }, [activeCall, webrtc, user]);



    return (
        <CallContext.Provider value={{
            incomingCall,
            isFullScreen,
            isCallingFullScreen,
            setIncomingCall,
            setIsFullScreen,
            setIsCallingFullScreen,
            acceptCall,
            declineCall,
            activeCall,
            setActiveCall,
            minimizeCall,
            restoreCall,
            startOutgoingCall,
            endCurrentCall,
            webrtc
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCallContext = () => {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error('useCallContext must be used within a CallProvider');
    }
    return context;
};
