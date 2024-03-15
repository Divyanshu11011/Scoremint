import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const Login = ({ setIsLoggedIn, setLoggedInUserName }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Array containing mentor data
  const mentors = [
    { Mentorid: "1111", Name: "Prof. Abhay Shukla", Password: "password1" },
    { Mentorid: "2222", Name: "Prof. Rajesh Kumar", Password: "password2" },
    { Mentorid: "3333", Name: "Prof. Manisha", Password: "password3" }
  ];

  const handleLogin = async () => {
    // Check credentials against the database
    try {
      const response = await fetch('https://scoremint.onrender.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsLoggedIn(true);
        localStorage.setItem('loggedInUserName', data.name);
        localStorage.setItem('isLoggedIn', true);
        navigate('/all-students');
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError('Internal server error');
    }
  };

  return (
    <div className="login-container">
      <h2>Hey Mentor</h2>

      <div className="input-group">
        <label>Mentor ID:</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="input-group">
        <label>Password:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="login-button" onClick={handleLogin}>Login</button>
      {error && <p className="error-message">{error}</p>}

            {/* Display mentor credentials */}
            <div className="mentors-info">
        <h3>Mentor Credentials for Testing:</h3>
        <ul>
          {mentors.map(mentor => (
            <li key={mentor.Mentorid}>
              <span>Mentor ID: {mentor.Mentorid}</span>
              <span> Password: {mentor.Password}</span>
              <span> Name: {mentor.Name}</span>
              
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Login;
