import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CallingStatusProps {
    name: string;
    status: string;
    errorMessage?: string | null;
}

const CallingStatus: React.FC<CallingStatusProps> = ({
    name,
    status,
    errorMessage
}) => {
    return (
        <View className="items-center">
            <View className="w-32 h-32 rounded-full bg-gray-50 border border-gray-100 items-center justify-center mb-6 shadow-sm">
                <Ionicons name="person" size={64} color="#007AFF" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2 sans-bold">
                {name}
            </Text>
            <Text className="text-sky-500 font-semibold text-lg mb-2">
                {status}
            </Text>

            {errorMessage && (
                <Text className="text-red-500 text-sm mt-2 text-center px-4 font-medium">
                    {errorMessage}
                </Text>
            )}

        </View>
    );
};

export default CallingStatus;
