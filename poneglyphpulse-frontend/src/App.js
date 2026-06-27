import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import GachaPage from './components/Gacha/GachaPage';
import Goals from './components/Goals/Goals';
import MapView from './components/Map/MapView'; // ← ADD THIS
import Navbar from './components/Layout/Navbar';
function App() {
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [user, setUser] = useState(null);
useEffect(() =&gt; {
const token = localStorage.getItem('token');
if (token) {
setIsAuthenticated(true);
fetchUserData(token);
}
}, []);
const fetchUserData = async (token) =&gt; {
try {
const response = await fetch('http://localhost:5000/api/auth/me', {
headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
setUser(data.user);
} catch (error) {
console.error('Error:', error);
}
};
const handleLogin = (token, userData) =&gt; {
localStorage.setItem('token', token);
setIsAuthenticated(true);
setUser(userData);
};
const handleLogout = () =&gt; {
localStorage.removeItem('token');
setIsAuthenticated(false);
setUser(null);
};
return (
&lt;Router&gt;
<div>
{isAuthenticated &amp;&amp; &lt;Navbar user={user} onLogout={handleLogout} /&gt;}
&lt;Routes&gt;
&lt;Route path="/login" element={!isAuthenticated ? &lt;Login onLogin={handleLo
&lt;Route path="/register" element={!isAuthenticated ? &lt;Register onLogin={ha
&lt;Route path="/dashboard" element={isAuthenticated ? &lt;Dashboard user={user
&lt;Route path="/gacha" element={isAuthenticated ? &lt;GachaPage user={user} /&
&lt;Route path="/goals" element={isAuthenticated ? &lt;Goals user={user} /&gt;
&lt;Route path="/map" element={isAuthenticated ? &lt;MapView user={user} /&gt;
&lt;Route path="/" element={&lt;Navigate to={isAuthenticated ? "/dashboard" : "
&lt;/Routes&gt;
</div>
&lt;/Router&gt;
);
}
export default App;
