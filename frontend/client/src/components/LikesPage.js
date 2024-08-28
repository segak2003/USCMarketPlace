import React, { useState, useEffect } from 'react';
import Header from './Header';
import axios from 'axios';
import './LikesPage.css';
import { Link } from 'react-router-dom';

const LikesPage = () => {
    const [likedListings, setLikedListings] = useState([]);

    useEffect(() => {
        const fetchLikedListings = async () => {
            try {
                const userResponse = await axios.get('http://localhost:5000/user', { withCredentials: true });
                const userId = userResponse.data._id;

                const likedListingsResponse = await axios.get(`http://localhost:5000/liked-listings/${userId}`, { withCredentials: true });
                setLikedListings(likedListingsResponse.data);
            }
            catch (error) {
                console.error("Failed to fetch liked listings", error);
            }
        };

        fetchLikedListings();
    }, []);

    const unlikeListing = async (listingId) => {
        try {
            await axios.post(`http://localhost:5000/unlike`, { listingId }, { withCredentials: true });
            setLikedListings(prevListings => prevListings.filter(listing => listing._id !== listingId));
        }
        catch (error) {
            console.error('Error unliking the listing', error);
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
        <div>
            <Header />
            <div className="likes-page">
                <h2>Liked Listings</h2>
                <p>Click on heart icons to unlike the listing</p>
                {likedListings.length > 0 ? (
                    <div className="listings-grid">
                        {likedListings.slice().reverse().map((listing) => (
                            <Link key={listing._id} to={`/listing/${listing._id}`} className="listing-card">
                                <img src={listing.thumbnailUrl} alt={listing.name} className="card-image"/>
                                <div className="listing-age">
                                    <p>{timeAgo(listing.date)}</p>
                                </div>
                                <div className="listing-title" >
                                    <p>{listing.name}</p>
                                </div>
                                <div className="cost-unlike-container">
                                    <div className="listing-cost">
                                        <p>${listing.price}</p>
                                    </div>
                                    <img 
                                    src="/liked-icon.png" 
                                    alt="Unlike" 
                                    className="unlike-icon" 
                                    onClick={() => unlikeListing(listing._id)} 
                                    style={{ cursor: 'pointer' }} 
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p>No liked listings found.</p>
                )}
            </div>
        </div>
    );
};

export default LikesPage;
