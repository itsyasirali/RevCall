import { useState, useEffect, useRef, useCallback } from 'react';
import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, MediaStream, mediaDevices } from 'react-native-webrtc';
import { socketService, useSocket } from '../../service/socket';
import { NativeModules, DeviceEventEmitter } from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import InCallManager from 'react-native-incall-manager';


export const useWebRTC = (userId: string) => {
    // State
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [connectionState, setConnectionState] = useState<string>('new');
    const [peerStatus, setPeerStatus] = useState<'calling' | 'ringing' | 'connected' | 'idle'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);

    // Refs
    const pc = useRef<RTCPeerConnection | null>(null);
    const iceCandidateQueue = useRef<any[]>([]);
    const socket = useSocket();
    const hasInitializedAudio = useRef(false);
    const statsInterval = useRef<any>(null);
    const userIdRef = useRef(userId);

    // Sync userId to ref to avoid stale closures in callbacks
    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    // Hardened audio session setup
    const ensureAudioSession = useCallback(async (speaker: boolean = isSpeaker) => {
        try {
            console.log('[WEBRTC] Hardening Audio Session. Speaker:', speaker);
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: !speaker, // true = Earpiece, false = Speaker
                staysActiveInBackground: true,
                interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            });
            console.log('[WEBRTC] Audio Session Hardened Successfully');
        } catch (e) {
            console.error('[WEBRTC] Audio session hardening failed:', e);
        }
    }, [isSpeaker]);

    // Re-initialization guard for audio
    useEffect(() => {
        if ((peerStatus === 'connected' || connectionState === 'connected') && !hasInitializedAudio.current) {
            hasInitializedAudio.current = true;
            ensureAudioSession();
        }
        if (peerStatus === 'idle') {
            hasInitializedAudio.current = false;
        }
    }, [peerStatus, connectionState, ensureAudioSession]);

    // Track state monitor
    useEffect(() => {
        if (remoteStream) {
            console.log('[WEBRTC] Remote stream tracks initialized:', remoteStream.getTracks().length);
            remoteStream.getTracks().forEach(track => {
                console.log(`[WEBRTC] Remote Track: ${track.kind} | State: ${track.readyState} | Enabled: ${track.enabled}`);
                track.enabled = true;
                // @ts-ignore
                if (track._muted) track._muted = false;
                // Force un-mute if using newer library versions
                // @ts-ignore
                if (track.setMuted) track.setMuted(false);
            });

            // Start stats monitoring to verify packet flow
            if (pc.current && !statsInterval.current) {
                statsInterval.current = setInterval(async () => {
                    try {
                        const stats = await pc.current?.getStats();
                        stats?.forEach((report: any) => {
                            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                                console.log(`[WEBRTC] Inbound Audio: ${report.bytesReceived} bytes | Jitter: ${report.jitter}`);
                            }
                        });
                    } catch (e) { }
                }, 5000);
            }
        }
        return () => {
            if (statsInterval.current) {
                clearInterval(statsInterval.current);
                statsInterval.current = null;
            }
        };
    }, [remoteStream]);

    const configuration: any = {
        iceServers: [
            { urls: 'stun:stun.net' },
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            {
                urls: [
                    process.env.EXPO_PUBLIC_TURN_SERVER_URL,
                    process.env.EXPO_PUBLIC_TURN_SERVER_URL_TCP
                ],
                username: process.env.EXPO_PUBLIC_TURN_USERNAME,
                credential: process.env.EXPO_PUBLIC_TURN_CREDENTIAL
            },
            {
                urls: ['turn:freestun.net:3478', 'turn:freestun.net:5349', 'turn:freestun.net:3478?transport=tcp'],
                username: 'free',
                credential: 'free'
            }
        ],
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 0,
        sdpSemantics: 'unified-plan'
    };

    const cleanup = useCallback(() => {
        console.log('[WEBRTC] Cleaning up connection...');
        if (pc.current) {
            try {
                pc.current.close();
            } catch (e) { }
            pc.current = null;
        }
        if (statsInterval.current) {
            clearInterval(statsInterval.current);
            statsInterval.current = null;
        }
        setRemoteStream(null);
        setConnectionState('new');
        setPeerStatus('idle');
        iceCandidateQueue.current = [];
        if (NativeModules.InCallManager) {
            InCallManager.stopRingback();
            InCallManager.stopProximitySensor();
            InCallManager.setKeepScreenOn(false);
            InCallManager.stop();
            console.log('[WEBRTC] InCallManager stopped and proximity reset');
        }
    }, []);

    const stopTracks = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
    }, [localStream]);

    useEffect(() => {
        if (!socket) return;

        const handleCallAnswered = async ({ answer }: any) => {
            console.log('[WEBRTC] Call answered by remote');
            setPeerStatus('connected');
            if (NativeModules.InCallManager) {
                console.log('[WEBRTC] Stopping ringback (dial tone) on caller device...');
                InCallManager.stopRingback();
            }
            if (pc.current && pc.current.signalingState !== 'closed') {
                try {
                    console.log('[WEBRTC] Setting Remote Description from Answer');
                    await pc.current.setRemoteDescription(new RTCSessionDescription(answer));

                    // Process any ICE candidates that arrived before the answer
                    console.log(`[WEBRTC] Processing ${iceCandidateQueue.current.length} queued ICE candidates after Answer`);
                    while (iceCandidateQueue.current.length > 0) {
                        const candidate = iceCandidateQueue.current.shift();
                        try {
                            await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (e) {
                            console.warn('[WEBRTC] Failed to add queued candidate:', e);
                        }
                    }
                } catch (e) {
                    console.error('[WEBRTC] setRemoteDescription failed:', e);
                }
            }
        };

        const handleRinging = () => {
            console.log('[WEBRTC] Received ringing event from remote.');
            setPeerStatus('ringing');
            // User requested to remove audio on caller side
            // if (NativeModules.InCallManager) {
            //     console.log('[WEBRTC] Starting ringback (dial tone) on caller device...');
            //     InCallManager.startRingback('_BUNDLE_');
            // }
        };

        const handleIceCandidate = async ({ candidate, from }: any) => {
            if (!candidate) return;

            // Filter out self-candidates (sanity check to prevent echo/loops)
            if (from === userIdRef.current) {
                console.log('[WEBRTC] Ignoring self-ICE candidate');
                return;
            }

            // Queue candidates even if pc.current is not yet initialized or lacks remoteDescription
            if (pc.current && pc.current.remoteDescription && pc.current.signalingState !== 'closed') {
                try {
                    const rtcCandidate = new RTCIceCandidate(candidate);
                    console.log(`[WEBRTC] Adding Remote ICE: ${rtcCandidate.candidate.split(' ')[7] || 'relay'} (from: ${from || 'unknown'})`);
                    await pc.current.addIceCandidate(rtcCandidate);
                } catch (e) {
                    console.error('[WEBRTC] ICE Candidate add failed:', e);
                }
            } else {
                console.log(`[WEBRTC] Queueing Remote ICE (PC/RemoteDesc not ready) (from: ${from || 'unknown'})`);
                iceCandidateQueue.current.push(candidate);
            }
        };

        const handleCallEnded = () => {
            console.log('[WEBRTC] Call ended signal received');
            cleanup();
            stopTracks();
        };

        const handleCallRejected = ({ reason }: { reason: string }) => {
            console.log('[WEBRTC] Call rejected:', reason);
            setErrorMessage(reason);
            cleanup();
            stopTracks();
        };

        const handleProximity = (data: any) => {
            console.log('[WEBRTC] Proximity event:', data);
        };

        socket.on('call-answered', handleCallAnswered);
        socket.on('ringing', handleRinging);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('call-ended', handleCallEnded);
        socket.on('call-rejected', handleCallRejected);

        const proximitySubscription = DeviceEventEmitter.addListener('Proximity', handleProximity);

        return () => {
            socket.off('call-answered', handleCallAnswered);
            socket.off('ringing', handleRinging);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('call-ended', handleCallEnded);
            socket.off('call-rejected', handleCallRejected);
            proximitySubscription.remove();
        };
    }, [socket, cleanup, stopTracks]);

    const setupLocalStream = async () => {
        try {
            console.log('[WEBRTC] Acquiring local audio track...');
            await ensureAudioSession(); // Ensure audio session is ready before acquisition
            const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
            stream.getAudioTracks().forEach(t => {
                t.enabled = true;
                // @ts-ignore
                if (t._muted) t._muted = false;
            });
            setLocalStream(stream);
            return stream;
        } catch (e) {
            console.warn('[WEBRTC] getUserMedia denied or failed:', e);
            return null;
        }
    };

    const setupPeerConnection = useCallback((to: string, stream: MediaStream | null) => {
        // Prevent connection leaks: Close existing PC before creating new one
        if (pc.current) {
            console.log('[WEBRTC] Closing existing PeerConnection to prevent leaks');
            try { pc.current.close(); } catch (e) { }
            pc.current = null;
        }

        console.log('[WEBRTC] Creating RTCPeerConnection...');
        const _pc = new RTCPeerConnection(configuration) as any;

        if (stream) {
            stream.getTracks().forEach(track => {
                console.log('[WEBRTC] Binding local track:', track.kind);
                _pc.addTrack(track, stream);
            });
            // Polyfill for different library versions
            if (_pc.addStream) _pc.addStream(stream);
        }

        _pc.onicecandidate = (event: any) => {
            if (event.candidate) {
                console.log(`[WEBRTC] Local ICE Gathered: ${event.candidate.candidate.split(' ')[7] || 'relay'} (userId: ${userIdRef.current})`);
                socketService.getSocket()?.emit('ice-candidate', { to, candidate: event.candidate, from: userIdRef.current });
            } else {
                console.log('[WEBRTC] ICE Gathering Complete');
            }
        };

        _pc.ontrack = (event: any) => {
            console.log('[WEBRTC] Incoming track detected:', event.track.kind);
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            } else {
                setRemoteStream(prev => {
                    const s = prev || new MediaStream();
                    if (!s.getTracks().find(t => t.id === event.track.id)) {
                        s.addTrack(event.track);
                    }
                    return s;
                });
            }
        };

        _pc.oniceconnectionstatechange = () => {
            console.log('[WEBRTC] ICE State:', _pc.iceConnectionState);
        };

        _pc.onconnectionstatechange = () => {
            console.log('[WEBRTC] PC State:', _pc.connectionState);
            setConnectionState(_pc.connectionState);
        };

        pc.current = _pc;

        // Immediately check for and process any buffered candidates from socketService
        const buffered = socketService.getBufferedCandidates(to);
        if (buffered.length > 0) {
            console.log(`[WEBRTC] Found ${buffered.length} buffered candidates for ${to}. Adding to queue.`);
            iceCandidateQueue.current.push(...buffered);
        }

        return _pc;
    }, [socket, userId]);

    const startCall = async (to: string, name: string) => {
        setPeerStatus('calling');
        setErrorMessage(null);
        const stream = await setupLocalStream();
        if (!stream) return;
        const _pc = setupPeerConnection(to, stream);
        const offer = await _pc.createOffer({});
        await _pc.setLocalDescription(offer);

        // Ensure socket is available
        const s = socketService.getSocket() || (userIdRef.current ? socketService.connect(userIdRef.current) : null);
        if (s) {
            console.log('[WEBRTC] Sending call-user to:', to);
            if (NativeModules.InCallManager) {
                console.log('[WEBRTC] Starting InCallManager for outgoing call...');
                InCallManager.start({ media: 'audio' }); // Don't start ringback yet
                // We let proximity sensor handle the screen state
                InCallManager.startProximitySensor();
                console.log('[WEBRTC] InCallManager started (outgoing) with proximity enabled');
            } else {
                console.warn('[WEBRTC] InCallManager native module is missing.');
            }
            s.emit('call-user', { to, offer, from: userIdRef.current, name });
        } else {
            console.error('[WEBRTC] Socket missing, cannot send call-user');
        }
    };

    const answerCall = async (to: string, offer: any) => {
        setPeerStatus('connected'); // Set immediately to prevent UI hiding in CallContext cleanup
        const stream = await setupLocalStream();
        if (!stream) return;
        const _pc = setupPeerConnection(to, stream);
        await _pc.setRemoteDescription(new RTCSessionDescription(offer));
        while (iceCandidateQueue.current.length > 0) {
            const c = iceCandidateQueue.current.shift();
            await _pc.addIceCandidate(new RTCIceCandidate(c));
        }
        const answer = await _pc.createAnswer();
        await _pc.setLocalDescription(answer);

        // Ensure socket is available
        const s = socketService.getSocket() || (userIdRef.current ? socketService.connect(userIdRef.current) : null);
        if (s) {
            console.log('[WEBRTC] Sending answer-call to:', to);
            if (NativeModules.InCallManager) {
                InCallManager.start({ media: 'audio' });
                // We let proximity sensor handle the screen state
                InCallManager.startProximitySensor();
                console.log('[WEBRTC] InCallManager started (incoming/answer) with proximity enabled');
            } else {
                console.warn('[WEBRTC] InCallManager native module is missing.');
            }
            s.emit('answer-call', { to, answer });
        } else {
            console.error('[WEBRTC] Socket missing, cannot send answer-call');
        }
        setPeerStatus('connected');
    };

    const hangup = (to: string) => {
        socketService.getSocket()?.emit('hangup', { to });
        cleanup();
        stopTracks();
    };

    const toggleMute = useCallback(() => {
        const newState = !isMuted;
        setIsMuted(newState);
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !newState;
            });
            console.log(`[WEBRTC] Local audio ${newState ? 'muted' : 'unmuted'}`);
        }
    }, [isMuted, localStream]);

    const toggleSpeaker = useCallback(async () => {
        const newState = !isSpeaker;
        setIsSpeaker(newState);
        if (NativeModules.InCallManager) {
            InCallManager.setForceSpeakerphoneOn(newState);
            // If speaker is on, we don't want the screen to turn off via proximity
            if (newState) {
                InCallManager.stopProximitySensor();
            } else {
                InCallManager.startProximitySensor();
            }
        }
        await ensureAudioSession(newState);
    }, [isSpeaker, ensureAudioSession]);

    return {
        startCall,
        answerCall,
        hangup,
        toggleMute,
        toggleSpeaker,
        isMuted,
        isSpeaker,
        connectionState,
        peerStatus,
        errorMessage,
        remoteStream,
        localStream,
        cleanup: () => {
            cleanup();
            stopTracks();
        }
    };
};
