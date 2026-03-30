import React, { useEffect, useState } from 'react';
import { useActiveCall } from '../hooks/call/useActiveCall';
import { View, TouchableOpacity, Text, BackHandler } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallContext } from '../context/CallContext';
import CallingStatus from './CallingStatus';

const GlobalActiveCallOverlay = () => {
    const {
        activeCall,
        isCallingFullScreen,
        setIsCallingFullScreen,
        minimizeCall,
        endCurrentCall,
        webrtc
    } = useCallContext();

    const [showKeypad, setShowKeypad] = useState(false);
    const {
        timer,
        displayStatus,
        displayError,
        formatTimer,
    } = useActiveCall(webrtc, activeCall, endCurrentCall);

    // Back handler for full screen
    useEffect(() => {
        const backAction = () => {
            if (isCallingFullScreen) {
                minimizeCall(
                    activeCall?.phoneNumber || '',
                    activeCall?.name || '',
                    timer
                );
                return true;
            }
            return false;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [isCallingFullScreen, activeCall, timer, minimizeCall]);

    if (!activeCall) return null;

    // --- BANNER VIEW ---
    if (!isCallingFullScreen) {
        return (
            <SafeAreaView className="absolute top-0 left-0 right-0 z-50 pointer-events-box-none">
                <View className="px-5 pt-2">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setIsCallingFullScreen(true)}
                        className="overflow-hidden rounded-md shadow-2xl shadow-black/30 border border-white/20"
                    >
                        <LinearGradient
                            colors={['#ffffff', '#f8faff']}
                            className="flex-row items-center justify-between p-5"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="w-14 h-14 rounded-full bg-sky-500 items-center justify-center mr-4 shadow-lg shadow-sky-200">
                                    <Text className="text-white text-xl font-bold">{activeCall.name?.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View>
                                    <Text className="text-xl font-bold text-gray-900 tracking-tight">{activeCall.name || activeCall.phoneNumber}</Text>
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                        <Text className="text-green-500 text-sm font-semibold tracking-wide uppercase">
                                            {timer > 0 ? formatTimer(timer) : 'Active...'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={endCurrentCall}
                                className="w-12 h-12 rounded-full bg-red-500 items-center justify-center shadow-lg shadow-red-200"
                            >
                                <Ionicons name="call" size={24} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                            </TouchableOpacity>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // --- FULL SCREEN VIEW ---
    return (
        <View className="absolute inset-0 z-50 bg-white">
            <SafeAreaView className="flex-1">
                <LinearGradient
                    colors={['#ffffff', '#f8faff']}
                    className="flex-1 px-6 justify-between py-12"
                >
                    <View className="self-end p-2" />


                    <CallingStatus
                        name={activeCall.name || activeCall.phoneNumber}
                        status={displayStatus}
                        errorMessage={displayError}
                    />

                    {displayError && (
                        <View className="bg-red-50 p-4 rounded-2xl mx-6 border border-red-100">
                            <Text className="text-red-500 text-center font-medium">{displayError}</Text>
                        </View>
                    )}

                    <View className="items-center pb-8">
                        <View className="flex-row justify-between w-full px-8 mb-12">
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={webrtc.toggleMute}
                                className="items-center"
                            >
                                <View className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${webrtc.isMuted ? 'bg-gray-200 border-gray-300' : 'bg-gray-50 border-gray-100'} border`}>
                                    <Ionicons name={webrtc.isMuted ? "mic-off" : "mic-off-outline"} size={28} color={webrtc.isMuted ? "#007AFF" : "#8E8E93"} />
                                </View>
                                <Text className={`${webrtc.isMuted ? 'text-sky-500' : 'text-gray-500'} font-medium text-xs`}>Mute</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={() => setShowKeypad(true)}
                                className="items-center"
                            >
                                <View className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 items-center justify-center mb-2">
                                    <Ionicons name="keypad-outline" size={28} color="#8E8E93" />
                                </View>
                                <Text className="text-gray-500 font-medium text-xs">Keypad</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={webrtc.toggleSpeaker}
                                className="items-center"
                            >
                                <View className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${webrtc.isSpeaker ? 'bg-gray-200 border-gray-300' : 'bg-gray-50 border-gray-100'} border`}>
                                    <Ionicons name={webrtc.isSpeaker ? "volume-high" : "volume-high-outline"} size={28} color={webrtc.isSpeaker ? "#007AFF" : "#8E8E93"} />
                                </View>
                                <Text className={`${webrtc.isSpeaker ? 'text-sky-500' : 'text-gray-500'} font-medium text-xs`}>Speaker</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={endCurrentCall}
                            className="w-20 h-20 rounded-full bg-red-500 items-center justify-center shadow-lg shadow-red-100"
                        >
                            <Ionicons name="call" size={40} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                        </TouchableOpacity>
                    </View>

                    {webrtc.remoteStream && (
                        <RTCView
                            streamURL={webrtc.remoteStream.toURL()}
                            style={{ width: 1, height: 1, position: 'absolute', opacity: 0.01 }}
                            zOrder={0}
                            objectFit="cover"
                            mirror={false}
                        />
                    )}
                </LinearGradient>

                {showKeypad && (
                    <View className="absolute inset-0 bg-white z-50">
                        <SafeAreaView className="flex-1">
                            <View className="flex-1 px-8 pt-12">
                                <TouchableOpacity
                                    onPress={() => setShowKeypad(false)}
                                    className="self-end p-2 mb-8"
                                >
                                    <Text className="text-sky-500 text-lg font-semibold">Hide</Text>
                                </TouchableOpacity>

                                <View className="flex-row flex-wrap justify-between">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((num) => (
                                        <TouchableOpacity
                                            key={num}
                                            className="w-[28%] aspect-square rounded-full bg-gray-50 border border-gray-100 items-center justify-center mb-6"
                                        >
                                            <Text className="text-3xl text-gray-900 font-medium">{num}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </SafeAreaView>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
};

export default GlobalActiveCallOverlay;
