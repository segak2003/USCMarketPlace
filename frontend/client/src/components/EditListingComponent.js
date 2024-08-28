import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditListingComponent.css';

const EditListingComponent = ({ listing, userId, onClose, onListingUpdated, onShowMessage }) => {
    const [name, setName] = useState(listing.name);
    const [description, setDescription] = useState(listing.description);
    const [price, setPrice] = useState(listing.price);
    const [category, setCategory] = useState(listing.category);
    const [condition, setCondition] = useState(listing.condition);
    const [thumbnail, setThumbnail] = useState(listing.thumbnailUrl || '');
    const [supplementalImages, setSupplementalImages] = useState(listing.supplementalImagesUrls || []);
    const [newThumbnail, setNewThumbnail] = useState(null);
    const [newSupplementalImages, setNewSupplementalImages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [mode, setMode] = useState(''); // '' | 'remove' | 'add'
    const [imagesToRemove, setImagesToRemove] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:5000/categories');
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const handleSave = async () => {
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('listingId', listing._id);
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('category', category);
        formData.append('condition', condition);

        if (newThumbnail) {
            formData.append('thumbnail', newThumbnail);
        }

        const allSupplementalImages = [...supplementalImages, ...newSupplementalImages];

        allSupplementalImages.forEach((image, index) => {
            formData.append('supplementalImages', image);
        });

        if (mode === 'remove' && imagesToRemove.length > 0) {
            formData.append('imagesToRemove', JSON.stringify(imagesToRemove));
        }

        try {
            const response = await axios.post('http://localhost:5000/edit-listing', formData, { withCredentials: true });
            onListingUpdated(response.data.listing);
            onClose();
            onShowMessage('success', 'Listing updated successfully!');
        } catch (error) {
            console.error("Failed to edit listing", error);
            onClose();
            onShowMessage('error', 'Failed to update listing.');
        }
    };

    const handleThumbnailChange = (e) => {
        setNewThumbnail(e.target.files[0]);
    };

    const handleSupplementalImagesChange = (e) => {
        setNewSupplementalImages([...newSupplementalImages, ...Array.from(e.target.files)]);
    };

    const extractBaseUrl = (url) => {
        return url.split('?')[0];
    };

    const removeSupplementalImage = (index) => {
        setImagesToRemove([...imagesToRemove, extractBaseUrl(supplementalImages[index])]);
        setSupplementalImages(supplementalImages.filter((_, i) => i !== index));
    };

    const removeNewSupplementalImage = (index) => {
        setNewSupplementalImages(newSupplementalImages.filter((_, i) => i !== index));
    };


    const handleRemoveMode = () => {
        setMode('remove');
    };

    const handleAddMode = () => {
        setMode('add');
    };


    return (
        <div className="edit-listing-overlay">
            <div className="edit-listing-component">
                <h2>Edit Listing</h2>
                <label>
                    Name:
                    <input
                        type="text"
                        className="edit-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>
                <label>
                    Description:
                    <textarea
                        className="edit-textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </label>
                <label>
                    Price:
                    <input
                        type="number"
                        className="edit-input"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </label>
                <label>
                    Category:
                    <select
                        className="edit-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map((cat, index) => (
                            <option key={index} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Condition:
                    <select
                        className="edit-select"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        required
                    >
                        <option value="">Select condition</option>
                        <option value="New">New</option>
                        <option value="Pre-owned">Pre-owned</option>
                    </select>
                </label>
                <label>
                    Thumbnail:
                    <input
                        type="file"
                        className="edit-input"
                        onChange={handleThumbnailChange}
                        accept="image/*"
                    />
                    {thumbnail && !newThumbnail && (
                        <img
                            src={thumbnail}
                            alt="Current Thumbnail"
                            className="current-image"
                        />
                    )}
                    {newThumbnail && (
                        <img
                            src={URL.createObjectURL(newThumbnail)}
                            alt="New Thumbnail"
                            className="new-image"
                        />
                    )}
                </label>

                <div className="mode-buttons">
                    <button
                        onClick={() => setMode('remove')}
                        disabled={mode === 'add'}
                        className={`mode-button remove ${
                            mode === 'add' ? 'disabled' : ''
                        } ${mode === 'remove' ? 'active' : ''}`}
                    >
                        Remove Images
                    </button>
                    <button
                        onClick={() => setMode('add')}
                        disabled={mode === 'remove'}
                        className={`mode-button ${
                            mode === 'remove' ? 'disabled' : ''
                        } ${mode === 'add' ? 'active' : ''}`}
                    >
                        Add Images
                    </button>
                </div>

                {mode === 'remove' && (
                    <div className="supplemental-images-grid">
                        {supplementalImages.map((img, index) => (
                            <div
                                key={index}
                                className="supplemental-image-container"
                            >
                                <img
                                    src={img}
                                    alt={`Supplemental ${index + 1}`}
                                    className="supplemental-image"
                                />
                                <button
                                    className="remove-image-button"
                                    onClick={() => removeSupplementalImage(index)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {mode === 'add' && (
                    <label>
                        Supplemental Images:
                        <div className="supplemental-images-grid">
                            {newSupplementalImages.map((img, index) => (
                                <div
                                    key={index}
                                    className="supplemental-image-container"
                                >
                                    <img
                                        src={URL.createObjectURL(img)}
                                        alt={`New Supplemental ${index + 1}`}
                                        className="supplemental-image"
                                    />
                                    <button
                                        className="remove-image-button"
                                        onClick={() => removeNewSupplementalImage(index)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                            {Array.from({
                                length:
                                    10 -
                                    (supplementalImages.length +
                                        newSupplementalImages.length),
                            }).map((_, index) => (
                                <div
                                    key={index}
                                    className="supplemental-image-container"
                                >
                                    <input
                                        type="file"
                                        className="file-input"
                                        onChange={handleSupplementalImagesChange}
                                        accept="image/*"
                                    />
                                </div>
                            ))}
                        </div>
                    </label>
                )}

                <button onClick={handleSave} className="save-button">
                    Save
                </button>
                <button onClick={onClose} className="cancel-button">
                    Cancel
                </button>
            </div>
        </div>
    );

};

export default EditListingComponent;
