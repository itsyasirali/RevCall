import React, { useEffect } from 'react';
import { BackHandler, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallContext } from '../context/CallContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const GlobalCallOverlay = () => {
    const { incomingCall, isFullScreen, setIsFullScreen, acceptCall, declineCall } = useCallContext();
    const router = useRouter();

    useEffect(() => {
        const backAction = () => {
            if (incomingCall && isFullScreen) {
                setIsFullScreen(false);
                return true; // Prevent default behavior (closing the app)
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [incomingCall, isFullScreen, setIsFullScreen]);

    useEffect(() => {
        let timeout: any;
        if (incomingCall) {
            timeout = setTimeout(() => {
                console.log('[GlobalCallOverlay] Auto-declining call after timeout');
                declineCall();
            }, 30000); // 30 seconds
        }
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [incomingCall, declineCall]);

    if (!incomingCall) return null;

    const handleAccept = async () => {
        await acceptCall();
        // The CallContext.acceptCall now sets activeCall, 
        // which triggers GlobalActiveCallOverlay to show the full-screen UI.
        // No more navigation to /calling needed.
    };

    const handleDecline = async () => {
        await declineCall();
    };

    if (!isFullScreen) {
        return (
            <SafeAreaView className="absolute top-0 left-0 right-0 z-50 pointer-events-box-none">
                <View className="px-5 pt-2">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setIsFullScreen(true)}
                        className="overflow-hidden rounded-md shadow-2xl shadow-black/30 border border-white/20"
                    >
                        <LinearGradient
                            colors={['#ffffff', '#f8faff']}
                            className="flex-row items-center justify-between p-5"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="w-14 h-14 rounded-full bg-sky-500 items-center justify-center mr-4 shadow-lg shadow-sky-200">
                                    <Ionicons name="person" size={28} color="white" />
                                </View>
                                <View>
                                    <Text className="text-xl font-bold text-gray-900 tracking-tight">{incomingCall.name || 'Unknown'}</Text>
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full bg-sky-500 mr-2" />
                                        <Text className="text-sky-500 text-sm font-semibold tracking-wide uppercase">Incoming Call...</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row gap-4">
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={handleDecline}
                                    className="w-12 h-12 rounded-full bg-red-500 items-center justify-center shadow-lg shadow-red-200"
                                >
                                    <Ionicons name="call" size={24} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={handleAccept}
                                    className="w-12 h-12 rounded-full bg-sky-500 items-center justify-center shadow-lg shadow-sky-200"
                                >
                                    <Ionicons name="call" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View className="absolute inset-0 z-50">
            <SafeAreaView className="flex-1 bg-white">
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setIsFullScreen(false)}
                    className="flex-1"
                >
                    <LinearGradient
                        colors={['#ffffff', '#f0f4ff']}
                        className="flex-1 px-8 justify-between py-16"
                    >
                        <View className="items-center mt-10">
                            <View className="w-24 h-24 rounded-full bg-sky-500 items-center justify-center mb-6 shadow-xl shadow-sky-100">
                                <Ionicons name="person" size={50} color="white" />
                            </View>
                            <Text className="text-3xl font-bold text-gray-900 mb-2">{incomingCall.name || 'Unknown'}</Text>
                            <Text className="text-sky-500 font-medium text-sm">Ringing...</Text>
                        </View>

                        <View className="flex-row justify-around mb-12">
                            <TouchableOpacity activeOpacity={1} className="items-center">
                                <View className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 items-center justify-center mb-2">
                                    <Ionicons name="alarm-outline" size={24} color="#8E8E93" />
                                </View>
                                <Text className="text-gray-500 text-xs font-medium">Remind Me</Text>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={1} className="items-center">
                                <View className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 items-center justify-center mb-2">
                                    <Ionicons name="chatbubble-outline" size={24} color="#8E8E93" />
                                </View>
                                <Text className="text-gray-500 text-xs font-medium">Message</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row justify-between px-4 pb-8">
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={handleAccept}
                                className="w-20 h-20 rounded-full bg-sky-500 items-center justify-center shadow-lg shadow-green-100"
                            >
                                <Ionicons name="call" size={40} color="white" style={{ transform: [{ rotate: '0deg' }] }} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={handleDecline}
                                className="w-20 h-20 rounded-full bg-red-500 items-center justify-center shadow-lg shadow-red-100"
                            >
                                <Ionicons name="call" size={40} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

export default GlobalCallOverlay;
