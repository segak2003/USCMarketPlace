import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ProfileDropdown.css';
import { useAuth } from '../contexts/AuthContext';

function ProfileDropdown() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        console.log("entered logout handler");
        await logout();
        navigate('/');
    };

    return (
        <div className="layout">
            <Link to={`/profile/${currentUser.username}`} className="dropdown-item">Profile</Link>
            <Link to="/Likes" className="dropdown-item">Likes</Link>
            <Link to="/Messages" className="dropdown-item">Messages</Link>
            <button onClick={handleLogout} className="dropdown-item">Logout</button>
        </div>
    );
}

export default ProfileDropdown;