// nav.js
import React from 'react';
import './nav.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const Navbar = ({ toggleSidebar, setIsLoggedIn }) => {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInUserName');
    setIsLoggedIn(false); // Update login state to false
    navigate('/'); // Redirect to login page
  };

  return (
    <div className="navbar">
      <div className="navbar-options">
        <span className="brand">ScoreMint</span>
        <button className="toggle-sidebar" onClick={toggleSidebar}>Toggle Sidebar</button>
      </div>
      <div className="logout-button-container">
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Navbar;
