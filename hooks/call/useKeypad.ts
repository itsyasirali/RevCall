import { useState, useEffect } from 'react';
import axios from '../../service/axios';

export const useKeypad = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [matchedContact, setMatchedContact] = useState<{ name: string, number: string } | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const lookupNumber = async () => {
            if (!phoneNumber || phoneNumber.length < 3) {
                setMatchedContact(null);
                return;
            }

            setIsSearching(true);
            try {
                const res = await axios.get(`/api/users/search?query=${phoneNumber}`);
                if (res.data && res.data.length > 0) {
                    const exactMatch = res.data.find((u: any) => u.number === phoneNumber);
                    if (exactMatch) {
                        setMatchedContact({ name: exactMatch.name, number: exactMatch.number });
                    } else {
                        setMatchedContact(null);
                    }
                } else {
                    setMatchedContact(null);
                }
            } catch (err) {
                console.error('Keypad lookup error:', err);
                setMatchedContact(null);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(lookupNumber, 300);
        return () => clearTimeout(timer);
    }, [phoneNumber]);

    const handlePress = (value: string) => {
        if (phoneNumber.length < 15) {
            setPhoneNumber((prev) => prev + value);
        }
    };

    const handleDelete = () => {
        setPhoneNumber((prev) => prev.slice(0, -1));
    };

    const getSubText = (digit: string) => {
        switch (digit) {
            case '2': return 'A B C';
            case '3': return 'D E F';
            case '4': return 'G H I';
            case '5': return 'J K L';
            case '6': return 'M N O';
            case '7': return 'P Q R S';
            case '8': return 'T U V';
            case '9': return 'W X Y Z';
            case '0': return '+';
            default: return '';
        }
    };

    return {
        phoneNumber,
        setPhoneNumber,
        matchedContact,
        isSearching,
        handlePress,
        handleDelete,
        getSubText,
    };
};
