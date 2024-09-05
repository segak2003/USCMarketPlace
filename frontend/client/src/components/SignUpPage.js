import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Success from './Success';
import Error from './Error';
import "./SignUpPage.css";

function SignUpPage() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: ""
    });
    const [errors, setErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);

    const validateEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]{3,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return email.length <= 64 && emailRegex.test(email) && email.endsWith("@usc.edu");
    };

    const validatePassword = (password) => {
        return password.length >= 8 && password.length <= 64;
    };

    const validateUsername = (username) => {
        return username.length >= 4 && username.length <= 20;
    };

    const validateFirstName = (firstName) => {
        return firstName.length >= 1 && firstName.length <= 36;
    };

    const validateLastName = (lastName) => {
        return lastName.length >= 1 && lastName.length <= 36;
    };

    const handleSignup = async () => {
        const newErrors = {};

        // Check for empty fields
        if (!formData.firstName || !formData.lastName || !formData.username || !formData.email || !formData.password) {
            newErrors.general = "All fields are required.";
        }

        if (!validateEmail(formData.email)) {
            newErrors.email = "Email must be a valid USC email (e.g., yourname@usc.edu) and less than 64 characters long.";
        }

        if (!validatePassword(formData.password)) {
            newErrors.password = "Password must be between 8 and 64 characters long.";
        }

        if (!validateFirstName(formData.firstName)) {
            if (!formData.firstName) {
                newErrors.firstName = "Must enter a first name.";
            }
            else {
                newErrors.firstName = "First name must be less than 36 characters long.";
            }
        }

        if (!validateLastName(formData.lastName)) {
            if (!formData.lastName) {
                newErrors.lastName = "must enter a last name.";
            }
            else {
                newErrors.lastName = "Last name must be less than 36 characters long.";
            }
        }

        if (!validateUsername(formData.username)) {
            newErrors.username = "Username must be between 4 and 20 characters long.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        let responseData = await signup(formData.firstName, formData.lastName, formData.username, formData.email, formData.password);
        
        try {
            if (responseData.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    navigate("/");
                }, 1200);
            }
            else {
                setErrors({ general: responseData.errors });
                setShowError(true);
            }
        }
        catch (error) {
            setErrors({ general: "Error with Sign up" });
            setShowError(true);
        }
    };

    const changeHandler = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: null, general: null });
    };

    return (
        <div>
            {showSuccess && (
                <div className="overlay">
                    <Success message="Signup Successful!" />
                </div>
            )}
            {showError && (
                <div className="overlay">
                    <Success message="Error with Signup" />
                </div>
            )}
            <div className="simple-header">
                    <Link rel="icon" to="/" className="logo2" sizes="2x2">
                        <img src="/USCMlogo2.png" alt="USCMlogo"/>
                    </Link>
            </div>
            <div className={`signUpPageLayout ${showSuccess ? 'blur' : ''}`}>
                <div className="signUpWrapper">
                    <p className="intro-text">Sign Up</p>
                    <p className="more-text">Sign up to post listings</p>
                    <div className="nameContainer">
                        <input name="firstName" value={formData.firstName} onChange={changeHandler} type="text" className="enterFirstName" placeholder="First name"/>
                        <input name="lastName" value={formData.lastName} onChange={changeHandler} type="text" className="enterLastName" placeholder="Last name"/>
                    </div>
                    {errors.firstName && <p className="error-text">{errors.firstName}</p>}
                    {errors.lastName && <p className="error-text">{errors.lastName}</p>}
                    <input name="username" value={formData.username} onChange={changeHandler} type="text" className="enterUsername" placeholder="Username"/>
                    {errors.username && <p className="error-text">{errors.username}</p>}
                    <input name="email" value={formData.email} onChange={changeHandler} type="text" className="enterEmail" placeholder="Email" />
                    {errors.email && <p className="error-text">{errors.email}</p>}
                    <input name="password" value={formData.password} onChange={changeHandler} type="password" className="enterPassword" placeholder="Password"/>
                    {errors.password && <p className="error-text">{errors.password}</p>}
                    {errors.general && <p className="error-text">{errors.general}</p>}
                    <button onClick={handleSignup} className="createAccountButton">Create account</button>
                    <p className="signInText">
                        Already have an account? <Link to="/login" className="signInLink">Sign in</Link>
                    </p>
                </div>
                <img className="skyline" src="/LAskylineRed2.png" alt="LA Skyline" />
            </div>
        </div>
    );
}

export default SignUpPage;
