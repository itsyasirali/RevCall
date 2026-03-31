import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CallLogData } from '../../types';

export const useRecents = () => {
    const [history, setHistory] = useState<CallLogData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        try {
            const historyJson = await AsyncStorage.getItem('CALL_HISTORY');
            const data = historyJson ? JSON.parse(historyJson) : [];
            setHistory(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Fetch history error:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [])
    );

    const formatDuration = (sec: number) => {
        if (!sec) return '';
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return {
        history,
        loading,
        fetchHistory,
        formatDuration,
    };
};
