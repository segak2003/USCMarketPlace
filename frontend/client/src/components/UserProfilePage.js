import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Profile from './Profile';
import axios from 'axios';
import './UserProfilePage.css';
import EditListingComponent from './EditListingComponent';
import Success from './Success';
import Error from './Error';

const UserProfilePage = () => {
    const [userDetails, setUserDetails] = useState({});
    const [listings, setListings] = useState([]);
    const [deleteMode, setDeleteMode] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null); 
    const [message, setMessage] = useState(null); 
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${API_URL}/user`, { withCredentials: true });
                const user = response.data;
                setUserDetails(user);

                const userListingData = new Map(Object.entries(user.listingData));
                if (userListingData.size > 0) {
                    const userListings = Array.from(userListingData.values());

                    const listingsWithUrlsResponse = await axios.post(`${API_URL}/make-presignedURLs`, { listings: userListings }, { withCredentials: true });
                    setListings(listingsWithUrlsResponse.data);
                }
            }
            catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };
        fetchUserData();
    }, []);

    const removeListing = async (listingId) => {
        try {
            const response = await axios.post(`${API_URL}/remove-listing`, {
                listingId: listingId,
                userId: userDetails._id
            }, { withCredentials: true });
            console.log(response.data);

            setListings(prevListings => prevListings.filter(listing => listing._id !== listingId));
        }
        catch (error) {
            console.error("Failed to delete listing", error);
        }
    };

    const handleEditClick = () => {
        setEditMode(!editMode);
        setDeleteMode(false); // Disable delete mode when edit is active
    };

    const handleDeleteClick = () => {
        setDeleteMode(!deleteMode);
        setEditMode(false); // Disable edit mode when delete is active
    };

    const showEditComponent = (listing) => {
        setSelectedListing(listing);
    };

    const handleListingUpdated = (updatedListing) => {
        setListings(prevListings => prevListings.map(listing => 
            listing._id === updatedListing._id ? updatedListing : listing
        ));
    };
    
    const handleListingClick = (listing) => {
        if (editMode && !deleteMode) {
            // Show component
            showEditComponent(listing);
        } else if (deleteMode && !editMode) {
            removeListing(listing._id);
        } else {
            console.log("ID:   ", listing._id);
            navigate(`/profile/username/listing/${listing._id}`);
        }
    };

    const handleShowMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => {
            setMessage(null);
            if (type === 'success') {
                window.location.reload();
            }
        }, 1200);
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
        if (years === 1) return "1 year ago";
        else {return `${years} years ago`};
    } 

    const joinYear = new Date(userDetails.date).getFullYear();

    return (
        <div>
            <Header />
            <div className="user-profile-page">
                <div className="profile-info-container">
                    <Profile />
                    <div className="account-details">
                        <p> <strong>{userDetails.username}</strong> </p>
                        <p>Joined {joinYear}</p>
                    </div>
                </div>
                <div className="user-listings">
                    <h2>Your Listings</h2>
                    {listings.length > 0 ? (
                        <div className="display">
                            <div className="profile-button-wrapper">
                                <div className="action-buttons">
                                    <button 
                                        onClick={handleEditClick} 
                                        className="action-button"
                                        disabled={deleteMode} // Disable if delete mode is active
                                    >
                                        {editMode ? 'Cancel Edit' : 'Edit'}
                                    </button>
                                    <button 
                                        onClick={handleDeleteClick} 
                                        className="action-button"
                                        disabled={editMode} // Disable if edit mode is active
                                    >
                                        {deleteMode ? 'Cancel Delete' : 'Delete'}
                                    </button>
                                </div>
                                <div className="cssbutton-container" onClick={() => navigate('/SellingPage')}>
                                    <button className="cssbuttons-io-button" >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"></path><path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"></path></svg>
                                        <span>Add Listing</span>
                                    </button>
                                </div>
                            </div>
                            <div className="listings-grid">
                                {listings.slice().reverse().map((listing, index) => (
                                    <div onClick={() => handleListingClick(listing)} key={index} className={`listing-item ${deleteMode ? 'delete-mode' : ''}`}>
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                        <p style={{marginBottom: '20px'}}>You don't have any listings for sale.</p>
                        <div className="cssbutton-container" onClick={() => navigate('/SellingPage')}>
                            <button className="cssbuttons-io-button" >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"></path><path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"></path></svg>
                                <span>Add Listing</span>
                            </button>
                        </div>
                        </>
                    )}
                </div>
            </div>
            {selectedListing && (
                <div className="edit-listing-overlay">
                    <EditListingComponent
                        listing={selectedListing}
                        userId={userDetails._id}
                        onListingUpdated={handleListingUpdated}
                        onClose={() => setSelectedListing(null)}
                        onShowMessage={handleShowMessage}
                    />
                </div>
            )}
            {message && (
                message.type === 'success' ? (
                    <Success message={message.text} />
                ) : (
                    <Error message={message.text} />
                )
            )}
        </div>
    );
};

export default UserProfilePage;
