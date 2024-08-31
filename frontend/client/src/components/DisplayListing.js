import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';
import "./DisplayListing.css";
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';

function DisplayListing() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [listing, setListing] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [numLikes, setNumLikes] = useState(null);
    const [isMessageBarVisible, setMessageBarVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [viewerIsSeller, setViewerIsSeller] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [seller, setSeller] = useState(null);
    const API_URL = process.env.REACT_APP_API_URL;

    const showMessageBar = () => {
        if (!currentUser) {
            navigate('/Signup');
        } else {
            setMessageBarVisible(true);
        }
    };

    const hideMessageBar = () => {
        setMessageBarVisible(false);
    };

    const handleMessageChange = (event) => {
        const newMessage = event.target.value;

        if (newMessage.length <= 300) {
            setMessage(newMessage);
        }
    };

    const sendMessage = async () => {
        if (message.trim() === "") return;
        try {
            await axios.post(`${API_URL}/sendMessage`, { 
                content: message, 
                listingId: listing._id,
                recipientId: listing.seller
            }, { withCredentials: true });
            setMessage("");
            hideMessageBar();
        }
        catch (error) {
            console.error('Error sending message', error);
        }
    };

    useEffect(() => {
        const fetchListingAndUser = async () => {
            try {
                const response = await axios.get(`${API_URL}/listing/${id}`);
                const { thumbnailUrl, supplementalImagesUrls, ...rest } = response.data;
                setListing({ ...rest, thumbnailUrl, supplementalImagesUrls });
                setNumLikes(rest.numLikes);
    
                const sellerResponse = await axios.post(`${API_URL}/get-seller-details`, { seller: rest.seller }, { withCredentials: true });
                setSeller(sellerResponse.data);
                if (currentUser) {
                    setViewerIsSeller(rest.seller === currentUser._id);
    
                    const userResponse = await axios.get(`${API_URL}/user`, { withCredentials: true });
                    const userLikes = new Set(userResponse.data.likedListings || []);
    
                    setIsLiked(userLikes.has(rest._id));
                }
            }
            catch (error) {
                console.error('Error fetching the listing or user data', error);
            }
        };
    
        fetchListingAndUser();
    }, [id, currentUser]);
    
    

    const toggleLike = async () => {
        if (!currentUser) {
            navigate('/Signup');
            return;
        }

        try {
            if (isLiked) {
                await axios.post(`${API_URL}/unlike`, { listingId: listing._id }, { withCredentials: true });
                setNumLikes(numLikes - 1);
            } else {
                await axios.post(`${API_URL}/like`, { listingId: listing._id }, { withCredentials: true });
                setNumLikes(numLikes + 1);
            }
            setIsLiked(!isLiked);
        }
        catch (error) {
            console.error('Error toggling like', error);
        }
    };
    
    const images = [listing?.thumbnailUrl, ...(listing?.supplementalImagesUrls || [])];

    const handleNextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const handlePreviousImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    const handleImageClick = (index) => {
        setCurrentImageIndex(index);
    };

    if (!listing || numLikes === null) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <Header />
            <div className="listing-detail">
                <div className="left-half">
                    <div className="image-container">
                        {listing.supplementalImagesUrls && listing.supplementalImagesUrls.length > 0 && (
                            <button className="carousel-button left" onClick={handlePreviousImage}>
                                &#10094;
                            </button>
                        )}
                        <img
                            src={images[currentImageIndex]}
                            alt={listing.name}
                            className="listing-image"
                            onClick={() => handleImageClick(currentImageIndex)}
                        />
                        {listing.supplementalImagesUrls && listing.supplementalImagesUrls.length > 0 && (
                            <button className="carousel-button right" onClick={handleNextImage}>
                                &#10095;
                            </button>
                        )}

                    </div>
                    <div className="supplemental-images">
                        {images.map((image, index) => (
                            <img
                                key={index}
                                src={image}
                                alt={`Supplemental ${index + 1}`}
                                className={`supplemental-image ${currentImageIndex === index ? 'active' : ''}`}
                                onClick={() => handleImageClick(index)}
                            />
                        ))}
                    </div>
                </div>
                <div className="right-half" > 
                    <div className="listing-detail-info">
                        <div className="name-and-like-container">
                            <div className="listing-name">
                                <h2>{listing.name}</h2>
                            </div>
                            <div className="like-container">
                                <img 
                                    src={isLiked ? "/liked-icon.png" : "/not-liked-icon.png"} 
                                    alt="Like button" 
                                    className={`like-icon ${viewerIsSeller ? 'disabled' : ''}`}
                                    onClick={toggleLike}
                                    style={{ cursor: 'pointer' }}
                                />
                                <p>{numLikes}</p>
                            </div>
                        </div>
                        <div className="listing-price">
                            <p>${listing.price}</p>
                        </div>
                        <div className="field-container">
                            <div className="field-name">
                                <p>Category</p>
                            </div>
                            <div className="field-value">
                                <p>{listing.category}</p>
                            </div>
                        </div>
                        <div className="field-container">
                            <div className="field-name">
                                <p>Condition</p>
                            </div>
                            <div className="field-value">
                                <p>{listing.condition}</p>
                            </div>
                        </div>
                        <Link to={seller ? `/listing/${id}/profile/${seller._id}` : '#'} className="seller-profile-banner">
                            {seller && (
                                <>
                                    <img src={seller.profilePictureUrl} className="seller-profile-picture" alt="seller profile pic" />
                                    <div className="seller-info">
                                        <p className="seller-username">{seller.username}</p>
                                        <p className="seller-listings">
                                            {seller.listingDataSize} {seller.listingDataSize === 1 ? 'listing' : 'listings'} for sale
                                        </p>
                                    </div>
                                </>
                            )}
                        </Link>
                        {!viewerIsSeller && (
                            <button class="message-button"onClick={showMessageBar} >
                                <svg class="svg-icon" fill="none" height="22" viewBox="0 0 20 20" width="22" xmlns="http://www.w3.org/2000/svg"><g stroke="#fff" stroke-linecap="round" stroke-width="1.5"><path d="m6.66669 6.66667h6.66671"></path><path clip-rule="evenodd" d="m3.33331 5.00001c0-.92047.74619-1.66667 1.66667-1.66667h10.00002c.9205 0 1.6666.7462 1.6666 1.66667v6.66669c0 .9205-.7461 1.6666-1.6666 1.6666h-4.8274c-.1105 0-.21654.044-.29462.122l-2.50004 2.5c-.26249.2625-.71129.0766-.71129-.2945v-1.9108c0-.2301-.18655-.4167-.41667-.4167h-1.25c-.92048 0-1.66667-.7461-1.66667-1.6666z" fill-rule="evenodd"></path><path d="m6.66669 10h2.5"></path></g></svg>
                                <span class="lable">Message</span>
                            </button>
                        )}
                        {isMessageBarVisible && (
                            <div className='message-bar-wrapper'>
                                <div className='message-bar'>
                                    <div className='message-bar-header'>
                                        <h2>Message Seller</h2>
                                        <button onClick={hideMessageBar} className='close-button'>X</button>
                                    </div>
                                    <textarea 
                                        value={message} 
                                        onChange={handleMessageChange} 
                                        className='message-textarea' 
                                        placeholder='Write your message here...'
                                    ></textarea>
                                    <div className="character-count">
                                        {message.length}/300
                                    </div>
                                    <button 
                                        onClick={sendMessage} 
                                        className='send-button' 
                                        disabled={message.trim() === "" || message.length >= 300}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="description-container">
                            <div className="description-header">
                                <p>Seller description</p>
                            </div>
                            <div className="description-text">
                                <p>{listing.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}    

export default DisplayListing;