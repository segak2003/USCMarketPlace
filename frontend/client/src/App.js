import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import SellPage from './components/SellPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import HomePage from './components/HomePage';
import NotFoundPage from './components/NotFoundPage';
import UserProfilePage from './components/UserProfilePage';
import LikesPage from './components/LikesPage';
import MessagesPage from './components/MessagesPage';
import ShopListingsPage from './components/ShopListingsPage'
import DisplayListing from './components/DisplayListing';
import SearchResultsPage from './components/SearchResultsPage';
import SellerProfile from './components/SellerProfile'; 

const router = createBrowserRouter([
  {
  path: '/',
  element: <HomePage />,
  errorElement: <NotFoundPage />,
  },
  {
    path: '/SellingPage',
    element: <SellPage />,
  },
  {
    path: '/profile/:userName',
    element: (
      <PrivateRoute>
        <UserProfilePage />
      </PrivateRoute>
    ),
  },
  {
    path: '/listing/:listingId/profile/:userId',
    element: <SellerProfile />,
  },
  {
    path: '/SignUp',
    element: <SignUpPage />,
  },
  {
    path: '/Login',
    element: <LoginPage />,
  },
  {
    path: '/Messages',
    element: (
      <PrivateRoute>
        <MessagesPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/Likes',
    element: (
      <PrivateRoute>
        <LikesPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/ShopListings',
    element: <ShopListingsPage />,
  },
  {
    path: '/listing/:id',
    element: <DisplayListing />,
  },
  {
    path: '/profile/:username/listing/:id',
    element: <DisplayListing />,
  },
  {
    path: '/likes/listing/:id',
    element: <DisplayListing />,
  },
  {
    path: '/search',
    element: <SearchResultsPage />,
  },
]);

function App() {
  return (
    <AuthProvider >
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;