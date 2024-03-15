// src/components/sidebar/Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link component
import './sidebar.css';

const Sidebar = ({ isOpen, loggedInUserName }) => {
  const openStreamlitApp = () => {
    // Open the Streamlit app in a new window
    window.open('https://llmbot-6zxzs4tw2s6eaksgyjgugu.streamlit.app/', '_blank');
  };

  return (
    <div className={isOpen ? 'sidebar open' : 'sidebar'}>
      <nav>
        <div className="greeting">
          <span className="greeting-text">Hi {loggedInUserName}</span>
          <span role="img" aria-label="Smile" className="smile">😊</span>
        </div>
        <button className="option-button"><Link to="/all-students">View all Students</Link></button>
        <button className="option-button"><Link to="/my-mentees">My mentees</Link></button>
        <button className="option-button" onClick={openStreamlitApp}>MarksheetChat</button> {/* Add onClick handler */}
      </nav>
    </div>
  );
};

export default Sidebar;
