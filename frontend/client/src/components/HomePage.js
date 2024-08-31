import Header from './Header'; 
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';

function HomePage() {
   
    const [topListings, setTopListings] = useState([]); 
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL;
    
    useEffect(() => {
        const fetchTopListings = async () => {
            try {
                const response = await fetch(`${API_URL}/top-listings`);
                const data = await response.json();
                setTopListings(data);
            }
            catch (error) {
                console.error("Error fetching top listings:", error);
            }
        };

        fetchTopListings();
    }, []);

    const handleSell = () => {
        if (!currentUser) {
            navigate('/Signup');
        } else {
            navigate('/SellingPage');
        }
    };

    function timeAgo(date) {
        const now = new Date();
        const secondsAgo = Math.floor((now - new Date(date)) / 1000);
    
        const minutes = Math.floor(secondsAgo / 60);
        if (minutes < 1) return "0 minutes ago";
        if (minutes === 1) return "1 minute ago";
        if (minutes < 60) return `${minutes} minutes ago`;
    
        const hours = Math.floor(minutes / 60);
        if (hours === 1) return "1 hour ago";
        if (hours < 24) return `${hours} hours ago`;
    
        const days = Math.floor(hours / 24);
        if (days === 1) return "1 day ago";
        if (days < 7) return `${days} days ago`;
    
        const weeks = Math.floor(days / 7);
        if (weeks === 1) return "1 week ago";
        if (weeks < 4) return `${weeks} weeks ago`;
    
        const months = Math.floor(days / 30);
        if (months === 1) return "1 month ago";
        if (months < 12) return `${months} months ago`;
    
        const years = Math.floor(days / 365);
        if (years === 1) return "1 month ago";
        else {return `${years} years ago`};
    }  


    return (
        <div className="homepage-wrapper">
            <Header />
            <div className="backgroundvideo-container">
                <video autoPlay loop muted playsInline disablePictureInPicture className="background-video"  width="100%">
                    <source src="/backgroundVid2.mp4" type="video/mp4"/>
                </video>
            </div>

            <div className="overview-section">
                <h1>Welcome to Trojan Trade</h1>
                <h2>Your One-Stop Shop for Buying and Selling</h2>
                <div className="overview-content">
                    <div className="overview-point">
                        <img src="/student.png" alt="icon" />
                        <p>Exclusive to USC Students: Connect with fellow Trojans for all your buying and selling needs.</p>
                    </div>
                    <div className="overview-point">
                        <img src="/lock.png" alt="icon" />
                        <p>Safe and Secure: Your privacy and security are our top priorities.</p>
                    </div>
                    <div className="overview-point">
                        <img src="/peace.png" alt="icon" />
                        <p>Wide Range of Items: From textbooks to electronics, find it all here.</p>
                    </div>
                    <div className="overview-point">
                        <img src="/like.png" alt="icon" />
                        <p>Easy to Use: Post your listings and make transactions with just a few clicks.</p>
                    </div>
                </div>
                <div className="cta-button-wrapper">
                    <button onClick={() => (navigate('/ShopListings'))} className="cta-button">Browse Listings</button>
                    <button onClick={handleSell} className="cta-button2">Sell an item</button>
                </div>
                
            </div>

            <div className="top-listings-section">
                <h2>Popular Listings</h2>
                <div className="listings-container">
                    {topListings.map(listing => (
                        <Link key={listing._id} to={`/listing/${listing._id}`} className="listing-card">
                            <img src={listing.thumbnailUrl} alt={listing.name} className="card-image" />
                            <div className="listing-age">
                                 <p>{timeAgo(listing.date)}</p>
                            </div>
                            <div className="listing-title" >
                                <p>{listing.name}</p>
                            </div>
                            <div className="listing-cost">
                                <p>${listing.price}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="content-wrapper">
                <img className="skyline-image" src="/LAskylineRed2.png" alt="LA Skyline" />
            </div>
            <div className="disclaimer">
                <p>
                    Trojan Trade is committed to providing a safe and secure platform for USC students to buy and sell items. We strictly prohibit the listing, sale, or exchange of any illegal products, items that violate university policies, or items that are not allowed on campus. This includes, but is not limited to, weapons, controlled substances, counterfeit goods, and any other items deemed inappropriate by university guidelines.
                </p>
                <p>
                    All users are expected to comply with both local laws and university regulations when using this platform. Any violation of these terms may result in immediate account suspension and further action by university authorities.
                </p>
            </div>
        </div>  
    );
}

export default HomePage;