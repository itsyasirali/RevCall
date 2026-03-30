import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from '../../service/axios';
import { useAuth } from '../../hooks/auth/useAuth';
import { useRecents } from '../../hooks/call/useRecents';
import { useCallContext } from '../../context/CallContext';
import { format } from 'date-fns';

export default function RecentsScreen() {
    const { history, loading, fetchHistory, formatDuration } = useRecents();
    const { user } = useAuth();
    const router = useRouter();
    const { startOutgoingCall, setIsCallingFullScreen, activeCall } = useCallContext();

    const handleCall = (number: string, name: string) => {
        if (activeCall && activeCall.phoneNumber === number) {
            console.log('[RECENTS] Already in call with this user');
            return;
        }
        console.log('[RECENTS] Starting call directly');
        startOutgoingCall(number, name);
        setIsCallingFullScreen(true);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-gray-50">
                <Text className="text-3xl font-bold text-gray-900">Recents</Text>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={fetchHistory}
                    className="bg-gray-50 p-2 rounded-full border border-gray-100"
                >
                    <Ionicons name="refresh" size={20} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => {
                        const isIncoming = item.direction === 'incoming';
                        const isCaller = !isIncoming;
                        const otherUser = isCaller ? item.receiver : item.caller;
                        const otherName = otherUser?.name || (item.receiver === null || !otherUser ? 'Unknown' : 'Unknown');
                        const otherNumber = otherUser?.number || (item.receiver === null || !otherUser ? '' : '');


                        return (
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={() => handleCall(otherNumber, otherName)}
                                className="flex-row items-center px-6 py-4 border-b border-gray-50 active:bg-gray-50"
                            >
                                <View className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 items-center justify-center mr-4">
                                    <MaterialCommunityIcons
                                        name={isIncoming ? (item.status === 'missed' ? 'phone-missed' : 'phone-incoming') : 'phone-outgoing'}
                                        size={20}
                                        color={item.status === 'missed' ? '#FF3B30' : (isIncoming ? '#0d9488' : '#0ea5e9')}
                                    />
                                    {activeCall?.phoneNumber === otherNumber && (
                                        <View className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white items-center justify-center">
                                            <Ionicons name="call" size={8} color="white" />
                                        </View>
                                    )}
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row items-center">
                                        <Text className={`text-lg font-semibold ${item.status === 'missed' ? 'text-red-500' : 'text-gray-900'}`}>
                                            {otherName}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Text className="text-gray-500 text-sm font-medium">{otherNumber}</Text>
                                        {item.duration > 0 && (
                                            <Text className="text-gray-400 text-xs font-medium ml-2">
                                                • {formatDuration(item.duration)}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-gray-400 text-[10px] font-medium uppercase">
                                        {format(new Date(item.startTime), 'MMM d')}
                                    </Text>
                                    <Text className="text-gray-500 text-xs font-semibold">
                                        {format(new Date(item.startTime), 'h:mm a')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Text className="text-gray-500">No recent calls</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
