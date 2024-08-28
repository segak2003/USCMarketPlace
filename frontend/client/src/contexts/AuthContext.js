// AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the AuthContext
const AuthContext = createContext();

// Create a custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to fetch user data
    const fetchUser = async () => {
        /*console.log("#######################");
        console.log("Calling fetchUser from authContext");
        console.log("#######################");*/
        try {
            const response = await axios.get('http://localhost:5000/user', { withCredentials: true });
            //console.log("responseData from authcontext: ", response.data)

            const user = response.data;
            if (user.listingData) {
                const listingDataMap = new Map(Object.entries(user.listingData));
                /*console.log("ListingData as Map:", listingDataMap);
                for (let [key, value] of listingDataMap.entries()) {
                    console.log(`Key: ${key}, Value: `, value);
                }*/
            } 
            else {
                console.log("No listingData found in user data.");
            }

            setCurrentUser(user);
        }
        catch (error) {
            console.error("Error fetching user data", error); // Added error logging
            setCurrentUser(null);
        }
        finally {
            setLoading(false);
        }
    };

    // Function to log in
    const login = async (email, password) => {
        const response = await axios.post('http://localhost:5000/login', { email, password }, { withCredentials: true });
        if (response.data.success) {
            await fetchUser();
        }
        return response.data;
    };

    // Function to sign up
    const signup = async (firstName, lastName, username, email, password) => {
        try {
            const response = await axios.post('http://localhost:5000/signup', { firstName, lastName, username, email, password }, { withCredentials: true });
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
        await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
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
