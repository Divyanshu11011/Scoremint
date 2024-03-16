import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './sidebar.css';

const Sidebar = ({ isOpen }) => {
  const [loggedInUserName, setLoggedInUserName] = useState(localStorage.getItem('loggedInUserName'));

  const openStreamlitApp = () => {
    window.open('https://scoremintbot-wkbmpykdbstm64wmqug2fn.streamlit.app/', '_blank');
  };

  return (
    <div className={isOpen ? 'sidebar open' : 'sidebar'}>
      <nav>
        <div className="greeting">
          {loggedInUserName && ( // Show the greeting message only when loggedInUserName is available
            <>
              <span className="greeting-text">Hi {loggedInUserName}</span>
              <span role="img" aria-label="Smile" className="smile">😊</span>
            </>
          )}
        </div>
        <button className="option-button"><Link to="/all-students">View all Students</Link></button>
        <button className="option-button"><Link to="/my-mentees">My mentees</Link></button>
        <button className="option-button" onClick={openStreamlitApp}>MarksheetChat</button>
      </nav>
    </div>
  );
};

export default Sidebar;
