import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from '../../service/axios';
import { useContacts } from '../../hooks/contacts/useContacts';
import { useCallContext } from '../../context/CallContext';

export default function ContactsScreen() {
    const {
        search,
        setSearch,
        loading,
        isSearchModalVisible,
        setIsSearchModalVisible,
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        handleSearch,
        addContact,
        getFilteredContacts,
    } = useContacts();
    const router = useRouter();
    const {
        incomingCall,
        activeCall,
        setIsFullScreen,
        startOutgoingCall,
        setIsCallingFullScreen
    } = useCallContext();

    const handleCall = (number: string, name: string) => {
        if (activeCall && activeCall.phoneNumber === number) {
            console.log('[CONTACTS] Already in call with this user');
            return;
        }
        if (incomingCall?.from === number) {
            setIsFullScreen(true);
            return;
        }
        console.log('[CONTACTS] Starting call directly');
        startOutgoingCall(number, name);
        setIsCallingFullScreen(true);
    };

    const filteredContacts = getFilteredContacts();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 py-4">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-3xl font-bold text-gray-900">Contacts</Text>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setIsSearchModalVisible(true)}
                        className="bg-sky-500 w-10 h-10 rounded-full items-center justify-center"
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>
                <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                    <Ionicons name="search" size={20} color="#8E8E93" />
                    <TextInput
                        placeholder="Search Contacts"
                        className="flex-1 ml-2 text-lg text-gray-900"
                        placeholderTextColor="#8E8E93"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={filteredContacts}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => handleCall(item.number, item.name)}
                            className="flex-row items-center px-6 py-4 border-b border-gray-50 active:bg-gray-50"
                        >
                            <View className={`w-12 h-12 rounded-full ${item.type === 'contact' ? 'bg-sky-500' : 'bg-gray-200'} items-center justify-center mr-4 shadow-sm`}>
                                <Text className="text-white text-lg font-bold">
                                    {item.name ? item.name[0] : '?'}
                                </Text>
                                {activeCall?.phoneNumber === item.number && (
                                    <View className="absolute -top-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white items-center justify-center">
                                        <Ionicons name="call" size={10} color="white" />
                                    </View>
                                )}
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg font-semibold text-gray-900">{item.name}</Text>
                                <Text className="text-gray-500 text-sm font-medium">{item.number}</Text>
                            </View>
                            <View className="flex-row items-center space-x-2">
                                {item.type === 'directory' && (
                                    <TouchableOpacity
                                        activeOpacity={1}
                                        onPress={() => addContact(item._id)}
                                        className="bg-sky-50 p-2 rounded-lg"
                                    >
                                        <Ionicons name="person-add-outline" size={20} color="#007AFF" />
                                    </TouchableOpacity>
                                )}
                                <Ionicons name="call-outline" size={24} color="#34C759" />
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Search Modal */}
            <Modal
                visible={isSearchModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsSearchModalVisible(false)}
            >
                <View className="flex-1 bg-white p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-2xl font-bold text-gray-900">Add & Call</Text>
                        <TouchableOpacity onPress={() => setIsSearchModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 mb-6">
                        <TextInput
                            placeholder="Search by name or number"
                            className="flex-1 text-lg text-gray-900"
                            placeholderTextColor="#8E8E93"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                        />
                        <TouchableOpacity onPress={handleSearch}>
                            <Ionicons name="search" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    </View>

                    {isSearching ? (
                        <ActivityIndicator size="large" color="#007AFF" />
                    ) : (
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <View className="flex-row items-center justify-between py-4 border-b border-gray-50">
                                    <View className="flex-1">
                                        <Text className="text-lg font-semibold text-gray-900">{item.name}</Text>
                                        <Text className="text-gray-500 font-medium">{item.number}</Text>
                                    </View>
                                    <View className="flex-row gap-x-4 justify-center items-center">
                                        <TouchableOpacity
                                            activeOpacity={1}
                                            onPress={() => {
                                                if (activeCall && activeCall.phoneNumber === item.number) {
                                                    console.log('[CONTACTS_SEARCH] Already in call with this user');
                                                    return;
                                                }
                                                setIsSearchModalVisible(false);
                                                handleCall(item.number, item.name);
                                            }}
                                            className="bg-green-500 p-2 rounded-xl"
                                        >
                                            <Ionicons name="call" size={20} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            activeOpacity={1}
                                            onPress={() => addContact(item._id)}
                                            className="bg-sky-500 px-4 py-2 rounded-xl"
                                        >
                                            <Text className="text-white font-bold">Add</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}
