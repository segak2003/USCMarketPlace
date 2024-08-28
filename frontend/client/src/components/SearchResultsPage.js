import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SearchResultsPage.css';
import Header from './Header';
import { Link, useLocation } from 'react-router-dom';

function SearchResultsPage() {
    const [searchResults, setSearchResults] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('query');

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!query) return;
    
            try {
                const categoryParam = selectedCategory !== 'All' ? `&category=${selectedCategory}` : '';
                const response = await axios.get(`http://localhost:5000/search?query=${query}${categoryParam}`);
                setSearchResults(response.data);
            }
            catch (error) {
                console.error('Error fetching the search results', error);
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
    
        fetchSearchResults();
        fetchCategories();
    }, [query, selectedCategory]);
    

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
            <div className="search-results">
                <div className="search-header">
                    <div className="search-description">
                        <h1>Search Results</h1>
                        <p>{searchResults.length} results found for "{query}"</p>
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
                <div className="results-container">
                    {searchResults.slice().reverse().map(result => (
                        <Link key={result._id} to={`/listing/${result._id}`} className="listing-card">
                            <img src={result.thumbnailUrl} alt={result.name} className="card-image" />
                            <div className="listing-age">
                                 <p>{timeAgo(result.date)}</p>
                            </div>
                            <div className="listing-title" >
                                <p>{result.name}</p>
                            </div>
                            <div className="listing-cost">
                                <p>${result.price}</p>
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

export default SearchResultsPage;
