import { useState, useEffect } from 'react';
import axios from '../../service/axios';

export const useContacts = () => {
    const [search, setSearch] = useState('');
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [directory, setDirectory] = useState<any[]>([]);

    const fetchContacts = async () => {
        try {
            const res = await axios.get('/api/users/contacts');
            setContacts(Array.isArray(res.data) ? res.data : []);

            const allRes = await axios.get('/api/users/all');
            const directoryData = Array.isArray(allRes.data) ? allRes.data : [];
            setDirectory(directoryData);
            setSearchResults(directoryData);
        } catch (err) {
            console.error('Fetch contacts error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleSearch = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            const res = await axios.get(`/api/users/search?query=${searchQuery}`);
            setSearchResults(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const addContact = async (userId: string) => {
        try {
            await axios.post('/api/users/contacts', { contactId: userId });
            setIsSearchModalVisible(false);
            setSearchQuery('');
            setSearchResults([]);
            fetchContacts();
        } catch (err) {
            console.error('Add contact error:', err);
        }
    };

    const getFilteredContacts = () => {
        return [
            { _id: 'ai', name: 'AI Assistant', number: '10', type: 'ai' },
            ...(contacts || []).map(c => ({ ...c.contact, _id: c._id, contactId: c.contact?._id, type: 'contact' })),
            ...(directory || []).filter(u => !(contacts || []).some(c => c.contact?._id === u._id)).map(u => ({ ...u, type: 'directory' }))
        ].filter(item =>
            item.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.number?.includes(search)
        );
    };

    return {
        search,
        setSearch,
        contacts,
        loading,
        isSearchModalVisible,
        setIsSearchModalVisible,
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        isSearching,
        directory,
        fetchContacts,
        handleSearch,
        addContact,
        getFilteredContacts,
    };
};
