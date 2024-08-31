import React, { useState } from 'react';
import './Header.css';
import { Link, useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../contexts/AuthContext';

function Header() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState("");
    const [isDropdownVisible, setDropdownVisible] = useState(false);

    const handleInputChanges = (event) => {
        setInputValue(event.target.value);
    };

    const clearInput = () => {
        setInputValue("");
    };

    const showDropdown = () => {
        setDropdownVisible(true);
    };

    const hideDropdown = () => {
        setDropdownVisible(false);
    };

    const handleSellClick = () => {
        if (!currentUser) {
            navigate('/Signup');
        } else {
            navigate('/SellingPage');
        }
    };

    const handleSearch = (event) => {
        if (event.key === 'Enter' && inputValue.trim()) {
            navigate(`/search?query=${inputValue}`);
        }
    };

    return (
        <div className="Header">
            <Link rel="icon" to="/" className="logo2" sizes="2x2">
                <img src="/USCMlogo2.png" alt="USCMlogo" />
            </Link>
            <div className="search-wrapper">
                <input
                    type="text"
                    placeholder="search"
                    className="search-bar"
                    value={inputValue}
                    onChange={handleInputChanges}
                    onKeyUp={handleSearch}
                />
                <div
                    className="clear-icon"
                    onClick={clearInput}
                    style={{ visibility: inputValue ? 'visible' : 'hidden' }}
                >
                    <img src={"/x.png"} alt="clear" />
                </div>
            </div>
            <div className="button-container">
                <button onClick={handleSellClick} className="sellButton">Sell</button>
                <Link to="/ShopListings" className="shopButton">Shop</Link>
                {currentUser
                    ? <div className="profile-container" onMouseEnter={showDropdown} onMouseLeave={hideDropdown}>
                        <Link to={`/profile/${currentUser.username}`} className="profile-button">
                            <img src={currentUser.profilePicture} alt="Userlogo" />
                        </Link>
                        {isDropdownVisible && <ProfileDropdown />}
                    </div>
                    : <>
                        <Link to="/Signup" className="signupButton">Sign up</Link>
                        <Link to="/Login" className="logButton">Login</Link>
                    </>
                }
            </div>
        </div>
    );
}

export default Header;
