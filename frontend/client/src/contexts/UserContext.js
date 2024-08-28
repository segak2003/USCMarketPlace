import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [profilePicture, setProfilePicture] = useState('https://uscmbucket.s3.us-west-2.amazonaws.com/user.png');

    const updateProfilePicture = (newProfilePicture) => {
        setProfilePicture(newProfilePicture);
    };

    return (
        <UserContext.Provider value={{ profilePicture, updateProfilePicture }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
