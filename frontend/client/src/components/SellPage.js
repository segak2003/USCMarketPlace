import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SellPage.css';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';
import Success from './Success';
import Error from './Error';

function SellPage() {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: "",
        description: "",
        condition: "",
        thumbnail: null,
        supplementalImages: []
    });
    const [categories, setCategories] = useState([]);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${API_URL}/categories`);
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const changeHandler = (e) => {
        const { name, value } = e.target;

        if (name === "price" && (isNaN(value) || value.includes(".") || value.includes(" ") || value.length > 4)) {
            return;
        }

        if (name === "name" && value.length > 50) {
            return;
        }

        if (name === "description" && value.length > 500) {
            return;
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const fileChangeHandler = (e) => {
        const file = e.target.files[0];
        setFormData({
            ...formData,
            thumbnail: file
        });
        setThumbnailPreview(URL.createObjectURL(file));
    };

    const multipleFileChangeHandler = (e) => {
        if (e.target.files.length > 10) {
            setErrorMessage('You can only upload a maximum of 10 supplemental images.');
            setShowError(true);
            e.target.value = null;
            return;
        }
        const newSupplementalImages = Array.from(e.target.files);
        setFormData({
            ...formData,
            supplementalImages: [...formData.supplementalImages, ...newSupplementalImages]
        });
    };

    const removeThumbnail = () => {
        setFormData({
            ...formData,
            thumbnail: null
        });
        setThumbnailPreview(null);
    };

    const removeSupplementalImage = (indexToRemove) => {
        const updatedSupplementalImages = formData.supplementalImages.filter((_, index) => index !== indexToRemove);
        setFormData({
            ...formData,
            supplementalImages: updatedSupplementalImages
        });
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('userId', currentUser._id);
        data.append('name', formData.name);
        data.append('price', parseInt(formData.price));
        data.append('category', formData.category);
        data.append('condition', formData.condition);
        data.append('description', formData.description);

        if (formData.thumbnail) {
            data.append('thumbnail', formData.thumbnail);
        }

        if (formData.supplementalImages.length > 0) {
            formData.supplementalImages.forEach((file) => {
                data.append('supplementalImages', file);
            });
        }

        try {
            const response = await axios.post(`${API_URL}/addlisting`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    navigate("/");
                }, 1200);
            } else {
                setErrorMessage("Failed to post listing.");
                setShowError(true);
            }
        } catch (error) {
            console.error('Error posting listing:', error.response || error.message);
            setErrorMessage("Failed to post listing.");
            setShowError(true);
        }
    };

    return (
        <div>
            <Header />
            <div className="background">
                <div className="post-listing-container">
                    <h1 className="usc-color">Post a New Listing</h1>
                    {showSuccess && <Success message="Listing posted successfully!" />}
                    {showError && <Error message={errorMessage} />}
                    <form onSubmit={submitHandler} className="post-listing-form">
                        <div className="form-group">
                            <label htmlFor="name" className="usc-color">Product Name</label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={changeHandler}
                                required
                                maxLength="50"
                            />
                            <small>{formData.name.length}/50</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="price" className="usc-color">Price</label>
                            <input
                                type="text"
                                name="price"
                                id="price"
                                value={formData.price}
                                onChange={changeHandler}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="category" className="usc-color">Category</label>
                            <select
                                name="category"
                                id="category"
                                value={formData.category}
                                onChange={changeHandler}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="condition" className="usc-color">Condition</label>
                            <select
                                name="condition"
                                id="condition"
                                value={formData.condition}
                                onChange={changeHandler}
                                required
                            >
                                <option value="">Select condition</option>
                                <option value="New">New</option>
                                <option value="Pre-owned">Pre-owned</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="description" className="usc-color">Description</label>
                            <textarea
                                name="description"
                                id="description"
                                value={formData.description}
                                onChange={changeHandler}
                                required
                                maxLength="500"
                            ></textarea>
                            <small>{formData.description.length}/500</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="thumbnail" className="usc-color">Thumbnail Image</label>
                            <input
                                type="file"
                                name="thumbnail"
                                id="thumbnail"
                                onChange={fileChangeHandler}
                                accept="image/*"
                                required
                            />
                        </div>
                        {thumbnailPreview && (
                            <div className="thumbnail-preview-container">
                                <img
                                    src={thumbnailPreview}
                                    alt="Thumbnail Preview"
                                    className="thumbnail-preview"
                                    onClick={removeThumbnail}
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="supplementalImages" className="usc-color">Supplemental Images (up to 10)</label>
                            <input
                                type="file"
                                name="supplementalImages"
                                id="supplementalImages"
                                onChange={multipleFileChangeHandler}
                                accept="image/*"
                                multiple
                            />
                        </div>
                        <div className="supplemental-images-preview">
                            {formData.supplementalImages.length > 0 && formData.supplementalImages.map((file, index) => (
                                <img
                                    key={index}
                                    src={URL.createObjectURL(file)}
                                    alt={`Supplemental ${index + 1}`}
                                    className="thumbnail-preview"
                                    onClick={() => removeSupplementalImage(index)}
                                />
                            ))}
                        </div>
                        <button type="submit" className="usc-button">Post Listing</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default SellPage;