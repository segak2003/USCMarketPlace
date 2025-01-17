import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const API_URL = process.env.REACT_APP_API_URL;

    // Function to fetch user data
    const fetchUser = async () => {
        try {
            const response = await axios.get(`${API_URL}/user`, { withCredentials: true });

            const user = response.data;
            if (user.listingData) {
                const listingDataMap = new Map(Object.entries(user.listingData));
            } 

            setCurrentUser(user);
        }
        catch (error) {
            setCurrentUser(null);
        }
        finally {
            setLoading(false);
        }
    };

    // Function to log in
    const login = async (email, password) => {
        const response = await axios.post(`${API_URL}/login`, { email, password }, { withCredentials: true });
        if (response.data.success) {
            await fetchUser();
        }
        return response.data;
    };

    // Function to sign up
    const signup = async (firstName, lastName, username, email, password) => {
        try {
            const response = await axios.post(`${API_URL}/signup`, { firstName, lastName, username, email, password }, { withCredentials: true });
            if (response.data.success) {
                await fetchUser();
            }
            return response.data;
        }
        catch (error) {
            if(error.response && error.response.status === 400) {
                return error.response.data
            }
            throw error;
        }
    };

    // Function to log out
    const logout = async () => {
        await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
        setCurrentUser(null);
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const value = {
        currentUser,
        login,
        signup,
        logout,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
