import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import axios from '../../service/axios';

export const useRecents = () => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('/api/calls/history');
            setHistory(Array.isArray(res.data) ? res.data : []);
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
