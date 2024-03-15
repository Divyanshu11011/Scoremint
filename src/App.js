import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/sidebar/sidebar';
import Navbar from './components/nav/nav';
import AllStudentsView from './views/AllStudentsView';
import MyMenteesView from './views/MyMenteesView';
import Login from './views/login'; // Import the Login component


function App() {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState('');

  useEffect(() => {
    // Check if the user is already logged in
    const userLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (userLoggedIn) {
      setIsLoggedIn(true);
      const userName = localStorage.getItem('loggedInUserName');
      setLoggedInUserName(userName);
    }
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Router>
      <div>
        {isLoggedIn && (
          <>
            <Navbar toggleSidebar={toggleSidebar} setIsLoggedIn={setIsLoggedIn} />
            <Sidebar isOpen={isOpen} loggedInUserName={loggedInUserName} />
          </>
        )}
        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <Navigate to="/all-students" />
              ) : (
                <Login setIsLoggedIn={setIsLoggedIn} setLoggedInUserName={setLoggedInUserName} />
              )
            }
          />
          {isLoggedIn && (
            <>
              <Route path="/all-students" element={<AllStudentsView />} />
              <Route path="/my-mentees" element={<MyMenteesView />} />
             
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
