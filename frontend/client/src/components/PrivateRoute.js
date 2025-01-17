import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
  
    if (loading) {
      return <div>Loading...</div>;
    }
  
    if (!currentUser) {
      return <Navigate to="/Login" replace />;
    }
  
    return children;
  };

export default PrivateRoute;
