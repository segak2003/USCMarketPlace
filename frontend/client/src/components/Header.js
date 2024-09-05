import React, { useState, useRef, useEffect } from 'react';
import './Header.css';
import { Link, useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../contexts/AuthContext';

function Header() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState("");
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [iconHeight, setIconHeight] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(0);

    const iconRef = useRef(null);
    const headerRef = useRef(null);

    const handleInputChanges = (event) => {
        setInputValue(event.target.value);
    };

    const handleLogout = async () => {
        console.log("entered logout handler");
        await logout();
        setMenuVisible(false);
        navigate('/');
    }

    const clearInput = () => {
        setInputValue("");
    };

    const showDropdown = () => {
        setDropdownVisible(true);
    };

    const hideDropdown = () => {
        setDropdownVisible(false);
    };

    const toggleMenu = () => {
        setMenuVisible(!isMenuVisible);
    };

    const handleSellClick = () => {
        if (!currentUser) {
            navigate('/Signup');
        }
        else {
            navigate('/SellingPage');
        }
    };

    const handleSearch = (event) => {
        if (event.key === 'Enter' && inputValue.trim()) {
            navigate(`/search?query=${inputValue}`);
        }
    };

    useEffect(() => {
        const updateHeights = () => {
            if (iconRef.current && headerRef.current) {
                setIconHeight(iconRef.current.offsetHeight);
                setHeaderHeight(headerRef.current.offsetHeight);
                console.log("Icon Height: ", iconRef.current.offsetHeight);
                console.log("Header Height: ", headerRef.current.offsetHeight);
            }
        };

        updateHeights();

        window.addEventListener('resize', updateHeights);

        return () => {
            window.removeEventListener('resize', updateHeights);
        };
    }, []);

    return (
        <div className="Header" ref={headerRef}>
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

            {/* Hamburger menu for small screens */}
            <div className="hamburger-icon">
                <img
                    src="/hamburger.png"
                    className="hamburger-icon-image"
                    ref={iconRef}
                    onClick={toggleMenu}
                    alt="hamburger icon"
                />
            </div>

            {isMenuVisible && (
                currentUser ? (
                    <div className="button-dropdown" style={{ top: `${((headerHeight - iconHeight) / 2) + iconHeight + 3}px` }}>
                        <Link to={`/profile/${currentUser.username}`} className="dropdown-item-top">Profile</Link>
                        <Link to="/Likes" className="dropdown-item-mid">Likes</Link>
                        <Link to="/Messages" className="dropdown-item-mid">Messages</Link>
                        <div onClick={handleLogout} className="dropdown-item-bottom">Logout</div>
                    </div>
                ) : (
                    <div className="button-dropdown" style={{ top: `${((headerHeight - iconHeight) / 2) + iconHeight + 3}px` }}>
                        <Link to="/Signup" className="dropdown-item-top" onClick={() => setMenuVisible(false)}>Sign up</Link>
                        <Link to="/Login" className="dropdown-item-mid" onClick={() => setMenuVisible(false)}>Login</Link>
                        <div onClick={handleSellClick} className="dropdown-item-mid">Sell</div>
                        <Link to="/ShopListings" onClick={() => setMenuVisible(false)} className="dropdown-item-bottom">Shop</Link>
                    </div>
                )
            )}
        </div>
    );
}

export default Header;
