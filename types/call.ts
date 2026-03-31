import { MediaStream } from 'react-native-webrtc';

export interface CallData {
    from: string;
    name: string;
    offer: any;
}

export interface ActiveCallData {
    phoneNumber: string;
    name: string;
    isMinimized: boolean;
    timer: number;
    startTime?: Date;
}

export type PeerStatus = 'calling' | 'ringing' | 'connected' | 'idle';

export interface CallContextType {
    incomingCall: CallData | null;
    isFullScreen: boolean;
    isCallingFullScreen: boolean;
    setIncomingCall: (call: CallData | null) => void;
    setIsFullScreen: (isFull: boolean) => void;
    setIsCallingFullScreen: (isFull: boolean) => void;
    acceptCall: () => Promise<void>;
    declineCall: () => Promise<void>;
    activeCall: ActiveCallData | null;
    setActiveCall: (call: ActiveCallData | null) => void;
    minimizeCall: (phoneNumber: string, name: string, timer: number) => void;
    restoreCall: () => void;
    startOutgoingCall: (phoneNumber: string, name: string) => Promise<void>;
    endCurrentCall: () => Promise<void>;
    webrtc: any;
}

export interface CallLogData {
    _id: string;
    direction: 'incoming' | 'outgoing';
    status: 'missed' | 'completed' | 'busy' | 'declined';
    startTime: string;
    endTime: string;
    duration: number;
    caller: { name: string; number: string };
    receiver: { name: string; number: string };
}
