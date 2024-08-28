import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Success from './Success';
import "./LoginPage.css";

function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const handleLogin = async () => {
        setEmailError("");
        setPasswordError("");
        
        let responseData = await login(formData.email, formData.password);

        console.log("responseData: ", responseData);

        if (responseData.success) {
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                navigate('/');
            }, 1200);
        } else {
            if (responseData.errors === "Incorrect Email address") {
                setEmailError("Incorrect Email address");
            } else if (responseData.errors === "Incorrect Password") {
                setPasswordError("Incorrect Password");
            }
        }
    };

    const changeHandler = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <div className="simple-header">
                <Link rel="icon" to="/" className="logo2" sizes="2x2">
                    <img src="/USCMlogo2.png" alt="USCMlogo" />
                </Link>
            </div>

            <div>
                {showSuccess && (
                    <div className="overlay">
                        <Success message="Login Successful!" />
                    </div>
                )}
                
                <div className={`loginPageLayout ${showSuccess ? 'blur' : ''}`}>
                    <div className="loginWrapper">
                        <p className="intro-text">Log in</p>
                        <input
                            type="text"
                            name="email"
                            value={formData.email}
                            onChange={changeHandler}
                            className="enterEmail"
                            placeholder="Email"
                        />
                            {emailError && <div className="error-message">{emailError}</div>}
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={changeHandler}
                            className="enterPassword"
                            placeholder="Password"
                            maxLength="64"  /* Limit to 64 characters */
                        />
                        {passwordError && <div className="error-message">{passwordError}</div>}
                        <button onClick={handleLogin} className="loginButton">Log in</button>
                        <p className="SignUpText">
                            Don't have an account yet? <Link to="/signup" className="signUpLink">Sign up</Link>
                        </p>
                    </div>
                    <img className="skyline" src="/LAskylineRed2.png" alt="LA Skyline" />
                </div>
            </div>
        </div> 
    );
}

export default LoginPage;
