import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from '../../service/axios';
import { useKeypad } from '../../hooks/call/useKeypad';
import { useCallContext } from '../../context/CallContext';

const KeypadScreen = () => {
    const {
        phoneNumber,
        setPhoneNumber,
        matchedContact,
        isSearching,
        handlePress,
        handleDelete,
        getSubText,
    } = useKeypad();
    const router = useRouter();

    const {
        incomingCall,
        activeCall,
        setIsFullScreen,
        startOutgoingCall,
        setIsCallingFullScreen
    } = useCallContext();

    const handleCall = () => {
        if (phoneNumber) {
            if (activeCall && activeCall.phoneNumber === phoneNumber) {
                console.log('[KEYPAD] Already in call with this user');
                return;
            }
            // If there's an incoming call from the number being dialed, show the full screen incoming call UI
            if (incomingCall?.from === phoneNumber) {
                setIsFullScreen(true);
                return;
            }
            console.log('[KEYPAD] Starting call directly');
            startOutgoingCall(
                phoneNumber,
                matchedContact ? matchedContact.name : phoneNumber
            );
            setIsCallingFullScreen(true); // Set calling full screen for outgoing calls
        }
    };

    const dialPad = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['*', '0', '#'],
    ];


    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 pb-2">
                {/* Phone Number Display Area */}
                <View className="h-44 justify-center items-center px-6 pt-10">
                    <View className="h-8 mb-1 items-center justify-center">
                        {isSearching ? (
                            <ActivityIndicator size="small" color="#0ea5e9" />
                        ) : matchedContact ? (
                            <View className="flex-row items-center">
                                <Text className="text-sky-600 font-semibold text-xl tracking-tight mr-2">
                                    {matchedContact.name}
                                </Text>
                                {activeCall?.phoneNumber === matchedContact.number && (
                                    <View className="bg-green-500 w-5 h-5 rounded-full items-center justify-center">
                                        <Ionicons name="call" size={10} color="white" />
                                    </View>
                                )}
                            </View>
                        ) : null}
                    </View>

                    <View className="h-16 justify-center">
                        <Text
                            className="text-5xl font-light text-gray-900 tracking-wider"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {phoneNumber}
                        </Text>
                    </View>

                    <View className="h-8 mt-4">
                        {phoneNumber.length > 0 && !matchedContact && !isSearching && (
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={() => {/* Add to contacts logic could go here */ }}
                                className="flex-row items-center bg-sky-50 px-4 py-1.5 rounded-full"
                            >
                                <Ionicons name="add-circle-outline" size={18} color="#0ea5e9" className="mr-1" />
                                <Text className="text-sky-500 font-semibold text-base ml-1">Add Number</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Keypad */}
                <View className="px-8 flex-1 justify-end pb-4">
                    {dialPad.map((row, rowIndex) => (
                        <View key={rowIndex} className="flex-row justify-around mb-5">
                            {row.map((digit) => (
                                <TouchableOpacity
                                    activeOpacity={1}
                                    key={digit}
                                    onPress={() => handlePress(digit)}
                                    onLongPress={() => digit === '0' && handlePress('+')}
                                    className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 justify-center items-center"
                                >
                                    <Text className="text-3xl font-regular text-gray-900">{digit}</Text>
                                    <Text className="text-[10px] font-bold text-gray-400 uppercase">{getSubText(digit)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}

                    {/* Action Buttons */}
                    <View className="flex-row justify-around items-end mt-4">
                        <View className="w-20" />

                        <TouchableOpacity
                            activeOpacity={1}
                            className="w-20 h-20 rounded-full bg-sky-500 justify-center items-center shadow-lg shadow-green-100"
                            onPress={handleCall}
                        >
                            <Ionicons name="call" size={36} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={handleDelete}
                            onLongPress={() => setPhoneNumber('')}
                            className="w-20 h-20 justify-center items-center"
                        >
                            {phoneNumber.length > 0 && (
                                <Ionicons name="backspace-outline" size={32} color="#8E8E93" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default KeypadScreen;
