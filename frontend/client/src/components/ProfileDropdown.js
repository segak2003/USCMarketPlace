import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ProfileDropdown.css';
import { useAuth } from '../contexts/AuthContext';

function ProfileDropdown() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="layout">
            <Link to={`/profile/${currentUser.username}`} className="dropdown-item-top">Profile</Link>
            <Link to="/Likes" className="dropdown-item-mid">Likes</Link>
            <Link to="/Messages" className="dropdown-item-mid">Messages</Link>
            <div onClick={handleLogout} className="dropdown-item-bottom">Logout</div>
        </div>
    );
}

export default ProfileDropdown;