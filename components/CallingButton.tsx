import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CallingButtonProps {
    icon: any;
    label: string;
    isActive?: boolean;
    onPress?: () => void;
}

const CallingButton: React.FC<CallingButtonProps> = ({ icon, label, isActive, onPress }) => (
    <View className="items-center w-24">
        <TouchableOpacity
            onPress={onPress}
            className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${isActive ? 'bg-white' : 'bg-gray-800/60'}`}
        >
            <Ionicons name={icon} size={28} color={isActive ? '#1a1a1a' : 'white'} />
        </TouchableOpacity>
        <Text className="text-gray-300 text-xs font-medium">{label}</Text>
    </View>
);

export default CallingButton;
