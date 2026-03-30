import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CallingButton from './CallingButton';

interface CallingControlsProps {
    isMuted: boolean;
    toggleMute: () => void;
    isSpeaker: boolean;
    toggleSpeaker: () => void;
    currentLang: 'en-US' | 'ur-PK';
    toggleLang: () => void;
    onEndCall: () => void;
}

const CallingControls: React.FC<CallingControlsProps> = ({
    isMuted,
    toggleMute,
    isSpeaker,
    toggleSpeaker,
    currentLang,
    toggleLang,
    onEndCall
}) => {
    return (
        <View className="w-full">
            <View className="flex-row justify-around mb-12">
                <CallingButton
                    icon={isMuted ? "mic-off" : "mic"}
                    label="Mute"
                    isActive={isMuted}
                    onPress={toggleMute}
                />
                <CallingButton
                    icon="language"
                    label={currentLang === 'ur-PK' ? "Urdu" : "English"}
                    isActive={currentLang === 'ur-PK'}
                    onPress={toggleLang}
                />
                <CallingButton
                    icon={isSpeaker ? "volume-high" : "volume-medium"}
                    label="Speaker"
                    isActive={isSpeaker}
                    onPress={toggleSpeaker}
                />
            </View>

            <View className="flex-row justify-around mb-12">
                <CallingButton icon="add" label="Add call" />
                <CallingButton icon="videocam" label="Video" />
                <CallingButton icon="person-add" label="Contacts" />
            </View>

            <View className="items-center mt-8">
                <TouchableOpacity
                    onPress={onEndCall}
                    className="w-20 h-20 rounded-full bg-red-500 items-center justify-center shadow-lg active:bg-red-600"
                >
                    <Ionicons name="call" size={36} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default CallingControls;
