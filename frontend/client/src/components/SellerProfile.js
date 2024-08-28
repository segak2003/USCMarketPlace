import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import './SellerProfile.css';
import { useNavigate, Link, useParams } from 'react-router-dom';

function SellerProfile() {
    const sellerId = useParams();
    const navigate = useNavigate();
    const [sellerDetails, setSellerDetails] = useState({});
    const [listings, setListings] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                console.log("sellerid: ", sellerId.userId);
                const response = await axios.post('http://localhost:5000/get-seller-details', { seller: sellerId.userId }, { withCredentials: true });
          
                const user = response.data;
                setSellerDetails(user);
                
                console.log("response: ", response.data);
                const listingsArray = Object.entries(response.data.listingData);
                console.log("Listings Array: ", listingsArray);

                // Extract listings from user data
                const userListingData = new Map(Object.entries(response.data.listingData));
                console.log("gonna enter");
                if (userListingData.size > 0) {
                    console.log("entered");
                    
                    const userListings = Array.from(userListingData.values());

                    const listingsWithUrlsResponse = await axios.post('http://localhost:5000/make-presignedURLs', { listings: userListings }, { withCredentials: true });
                    console.log("response: ", listingsWithUrlsResponse.data);
                    setListings(listingsWithUrlsResponse.data);
                    console.log("listings: ", listings);
                }
            }
            catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };
        fetchUserData();
    }, []);

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

    const joinYear = new Date(sellerDetails.date).getFullYear();

    return(   
    <div>
        <Header />
        <div className="user-profile-page">
            <div className="profile-info-container">
            <div>
                <img
                    style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        cursor: "pointer"
                    }}
                    src={sellerDetails.profilePictureUrl}
                    alt="Profile"
                />
            </div>
                <div className="account-details">
                    <p> <strong>{sellerDetails.username}</strong> </p>
                    <p>Joined {joinYear}</p>
                </div>
            </div>
            <div className="user-listings">
                <h2>{`${sellerDetails.username}'s Listings`}</h2>
                {listings.length > 0 ? (
                    <div className="display">
                        <div className="listings-grid">
                            {listings.slice().reverse().map((listing, index) => (
                                <Link to={`/listing/${listing._id}`} key={index} className="listing-item">
                                    <img src={listing.thumbnailUrl} alt={listing.name} className="card-image" />
                                    <div className="listing-info">
                                        <div className="listing-age">
                                            <p>{timeAgo(listing.date)}</p>
                                        </div>
                                        <div className="listing-title" >
                                            <p>{listing.name}</p>
                                        </div>
                                        <div className="listing-cost">
                                            <p>${listing.price}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p style={{marginBottom: '20px'}}>This user does not have any listings for sale.</p>
                )}
            </div>
        </div>
        
        </div>
    );
};

export default SellerProfile;
