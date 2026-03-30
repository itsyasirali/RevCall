import React, { useState } from 'react';
import { useAuth } from './useAuth';
import axios from '../../service/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthForm = () => {
    const { setUser } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isLogin = mode === 'login';

    const handleAuthAction = async () => {
        setError('');
        setIsSubmitting(true);
        console.log('[AUTH_FORM] Action:', mode, 'Email:', email.trim().toLowerCase());

        try {
            const trimmedEmail = email.trim().toLowerCase();
            if (isLogin) {
                const response = await axios.post('/api/auth/login', {
                    email: trimmedEmail,
                    password: password
                });
                const { user } = response.data;
                await AsyncStorage.setItem('user', JSON.stringify(user));
                setUser(user);
            } else {
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    return;
                }
                const response = await axios.post('/api/auth/signup', {
                    name,
                    email: trimmedEmail,
                    password: password
                });
                const { user } = response.data;
                await AsyncStorage.setItem('user', JSON.stringify(user));
                setUser(user);
            }
        } catch (err: any) {
            console.error('[AUTH_FORM] Error details:', err.response?.data);
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMode = () => {
        setMode(isLogin ? 'signup' : 'login');
        setError('');
    };

    return {
        mode,
        setMode,
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
        setError,
        isSubmitting,
        isLogin,
        handleAuthAction,
        toggleMode,
    };
};
