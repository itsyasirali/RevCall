import React from 'react';

export interface User {
    _id: string;
    id?: string;
    name: string;
    number: string;
    email?: string;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}
