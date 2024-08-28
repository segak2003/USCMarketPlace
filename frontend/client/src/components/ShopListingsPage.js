import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./ShopListingsPage.css";
import Header from './Header';
import { Link } from 'react-router-dom';

function ShopListingsPage () {
    const [listings, setListings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const categoryParam = selectedCategory !== 'All' ? `?category=${selectedCategory}` : '';
                const response = await axios.get(`http://localhost:5000/all-listings${categoryParam}`);
                setListings(response.data);
            }
            catch (error) {
                console.error('Error fetching the listings', error);
            }
        };

        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:5000/categories');
                setCategories(['All', ...response.data]); // Add "All" as the default option
            }
            catch (error) {
                console.error('Error fetching categories', error);
            }
        };

        fetchListings();
        fetchCategories();
    }, [selectedCategory]);

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
            <div className="shop-listings">
                <div className="shop-header">
                    <div className="description">
                        <h1>All Listings</h1>
                        <p>{listings.length} listings available</p>
                    </div>
                    <div className="filter-container">
                        <div className="filter-wrapper">
                            <label htmlFor="category-select">Filter by category:</label>
                            <select 
                                id="category-select" 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="shop-listings-container">
                    {listings.slice().reverse().map(listing => (
                        <Link key={listing._id} to={`/listing/${listing._id}`} className="listing-card">
                            <img src={listing.thumbnailUrl} alt={listing.name} className="card-image"/>
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
                <div className="content-wrapper">
                    <img className="skyline-image" src="/LAskylineRed2.png" alt="LA Skyline" />
                </div>
            </div>
        </div>
    );
}

export default ShopListingsPage;