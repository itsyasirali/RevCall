import axios from '../../service/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';

export const useLogout = () => {
    const { setUser } = useAuth();

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } catch (e) {
            console.error('Logout API failed', e);
        } finally {
            await AsyncStorage.removeItem('user');
            setUser(null);
        }
    };

    return { logout };
};
