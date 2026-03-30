import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/auth/useAuth';
import { useAuthForm } from '../hooks/auth/useAuthForm';

export default function Index() {
    const { user, loading } = useAuth();
    const {
        mode,
        name,
        setName,
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        showPassword,
        setShowPassword,
        error,
        isSubmitting,
        isLogin,
        handleAuthAction,
        toggleMode,
    } = useAuthForm();
    const router = useRouter();


    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: 48, paddingBottom: 32 }}
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View className="flex-1">
                            <View className="mb-10 items-center">
                                <View className="w-20 h-20 bg-sky-500 rounded-3xl items-center justify-center mb-6 shadow-xl shadow-sky-100">
                                    <Ionicons name="call" size={40} color="white" />
                                </View>
                                <Text className="text-3xl font-bold text-gray-900 mb-2 text-center sans-bold">
                                    {isLogin ? 'Welcome Back' : 'Create Account'}
                                </Text>
                                <Text className="text-gray-500 text-center text-lg sans-medium">
                                    {isLogin ? 'Sign in to continue your secure calls' : 'Connect with the world through secure voice'}
                                </Text>
                            </View>

                            {error ? (
                                <View className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
                                    <Text className="text-red-500 text-center font-medium">{error}</Text>
                                </View>
                            ) : null}

                            <View className="space-y-5">
                                {!isLogin && (
                                    <View className="mb-4">
                                        <Text className="text-gray-700 font-semibold mb-2 ml-1">Full Name</Text>
                                        <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2">
                                            <Ionicons name="person-outline" size={20} color="#8E8E93" />
                                            <TextInput
                                                placeholder="Enter your full name"
                                                className="flex-1 ml-3 text-lg text-gray-900"
                                                placeholderTextColor="#8E8E93"
                                                value={name}
                                                onChangeText={setName}
                                            />
                                        </View>
                                    </View>
                                )}

                                <View className="mb-4">
                                    <Text className="text-gray-700 font-semibold mb-2 ml-1">Email Address</Text>
                                    <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2">
                                        <Ionicons name="mail-outline" size={20} color="#8E8E93" />
                                        <TextInput
                                            placeholder="Enter your email address"
                                            className="flex-1 ml-3 text-lg text-gray-900"
                                            placeholderTextColor="#8E8E93"
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                        />
                                    </View>
                                </View>

                                <View className="mb-4">
                                    <Text className="text-gray-700 font-semibold mb-2 ml-1">Password</Text>
                                    <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2">
                                        <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" />
                                        <TextInput
                                            placeholder="Enter your password"
                                            className="flex-1 ml-3 text-lg text-gray-900"
                                            placeholderTextColor="#8E8E93"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity activeOpacity={1} onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#8E8E93" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {!isLogin && (
                                    <View className="mb-4">
                                        <Text className="text-gray-700 font-semibold mb-2 ml-1">Confirm Password</Text>
                                        <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2">
                                            <Ionicons name="shield-checkmark-outline" size={20} color="#8E8E93" />
                                            <TextInput
                                                placeholder="Enter your confirm password"
                                                className="flex-1 ml-3 text-lg text-gray-900"
                                                placeholderTextColor="#8E8E93"
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                secureTextEntry={!showPassword}
                                            />
                                        </View>
                                    </View>
                                )}

                                {isLogin && (
                                    <TouchableOpacity activeOpacity={1} className="items-end mt-1">
                                        <Text className="text-sky-500 font-semibold">Forgot Password?</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={handleAuthAction}
                                    disabled={isSubmitting}
                                    className="mt-8 bg-sky-500 p-5 overflow-hidden rounded-2xl shadow-lg shadow-sky-200"
                                >

                                    {isSubmitting ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white text-xl text-center font-bold">
                                            {isLogin ? 'Sign In' : 'Sign Up'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {isLogin && (
                                <>
                                    <View className="flex-row items-center my-8">
                                        <View className="flex-1 h-[1px] bg-gray-100" />
                                        <Text className="mx-4 text-gray-400 font-medium text-xs">OR CONTINUE WITH</Text>
                                        <View className="flex-1 h-[1px] bg-gray-100" />
                                    </View>

                                    <View className="flex-row justify-between space-x-4">
                                        <TouchableOpacity activeOpacity={1} className="flex-1 flex-row items-center justify-center bg-white border border-gray-100 py-4 rounded-2xl">
                                            <Ionicons name="logo-google" size={20} color="#DB4437" />
                                            <Text className="ml-2 font-semibold text-gray-700">Google</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity activeOpacity={1} className="flex-1 flex-row items-center justify-center bg-white border border-gray-100 py-4 rounded-2xl ml-4">
                                            <Ionicons name="logo-apple" size={20} color="black" />
                                            <Text className="ml-2 font-semibold text-gray-700">Apple</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}

                            <View className="flex-row justify-center mt-auto pt-8">
                                <Text className="text-gray-500 text-lg">
                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                </Text>
                                <TouchableOpacity activeOpacity={1} onPress={toggleMode}>
                                    <Text className="text-sky-500 font-bold text-lg">
                                        {isLogin ? 'Sign Up' : 'Sign In'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
