import React, { useState, useEffect } from 'react';
import Avatar from "react-avatar-edit";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import axios from 'axios';

const Profile = () => {
    const defaultPic = 'https://uscmbucket.s3.us-west-2.amazonaws.com/user.png';
    const [imagecrop, setimagecrop] = useState(false);
    const [src, setsrc] = useState(null);
    const [profilePicture, setProfilePicture] = useState(defaultPic);
    const [pview, setpview] = useState(null);
    const [fetchTrigger, setFetchTrigger] = useState(0); // State to trigger useEffect
    const API_URL = process.env.REACT_APP_API_URL;

    const fetchUserProfile = async () => {
            const response = await axios.get(`${API_URL}/user`, { withCredentials: true });
            setProfilePicture(response.data.profilePicture || defaultPic);
    };

    useEffect(() => {
        fetchUserProfile();
    }, [fetchTrigger]);

    const onClose = () => {
        setpview(null);
    };

    const onCrop = (view) => {
        setpview(view);
    };

    const saveCropImage = async () => {
        if (pview) {
            try {
                const formData = new FormData();
                formData.append("profilePicture", dataURItoBlob(pview));
                const response = await axios.post(`${API_URL}/upload-profile-picture`, formData, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                if (response.data.success) {
                    setProfilePicture(`${response.data.profilePicture}?t=${new Date().getTime()}`);
                    setFetchTrigger(prev => prev + 1); // Update fetchTrigger to refetch user profile
                    window.location.reload();
                }
                setimagecrop(false);
            }
            catch (error) {
                console.error("Failed to upload image", error);
            }
        }
    };

    const dataURItoBlob = (dataURI) => {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <div>
                <img
                    style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        cursor: "pointer"
                    }}
                    onClick={() => setimagecrop(true)}
                    src={profilePicture}
                    alt="Profile"
                    onError={(e) => { e.target.src = defaultPic; }} // Handle error to revert to default pic if needed
                />
                <label style={{ marginTop: '10px', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>
                    Click to Edit Photo
                </label>
                <Dialog
                    visible={imagecrop}
                    header={() => (
                        <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#474649' }}>
                            Change Profile Picture
                        </p>
                    )}
                    onHide={() => setimagecrop(false)}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Avatar
                            width={500}
                            height={400}
                            onCrop={onCrop}
                            onClose={onClose}
                            src={src}
                            shadingColor={"#474649"}
                            backgroundColor={"#474649"}
                        />
                        <div style={{ marginTop: '20px', width: '100%', textAlign: 'center' }}>
                            <Button
                                onClick={saveCropImage}
                                label="Save"
                                icon="pi pi-check"
                            />
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default Profile;
