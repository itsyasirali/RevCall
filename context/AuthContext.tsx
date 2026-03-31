import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../service/axios';

import { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const response = await axios.get('/api/auth/me');
            const newUser = response.data;

            // Only update if data actually changed to avoid re-render storms
            setUser((prevUser: User | null) => {
                const isChanged = JSON.stringify(newUser) !== JSON.stringify(prevUser);
                if (isChanged) {
                    return newUser;
                }
                return prevUser;
            });

            // Side effects should be handled AFTER state update or based on data
            await AsyncStorage.setItem('user', JSON.stringify(newUser));
        } catch (e) {
            console.log('[AUTH_CONTEXT] Session expired');
            setUser(null);
            await AsyncStorage.removeItem('user');
        } finally {
            setLoading(prev => {
                if (prev) return false;
                return prev;
            });
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const stored = await AsyncStorage.getItem('user');
                if (stored) {
                    setUser(JSON.parse(stored));
                }
            } catch (e) { }
            await checkAuth();
        };
        initAuth();
    }, [checkAuth]);

    return (
        <AuthContext.Provider value={{ user, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
