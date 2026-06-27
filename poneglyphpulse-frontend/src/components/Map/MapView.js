import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
iconUrl: require('leaflet/dist/images/marker-icon.png'),
shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
// Component to update map view
function ChangeView({ center, zoom }) {
const map = useMap();
map.setView(center, zoom);
return null;
}
function MapView({ user }) {
const [currentPosition, setCurrentPosition] = useState([20.5937, 78.9629]); // Default:
const [zoom, setZoom] = useState(5);
const [users, setUsers] = useState([]);
const [socket, setSocket] = useState(null);
const [locationPermission, setLocationPermission] = useState(false);
useEffect(() =&gt; {
// Connect to WebSocket
const newSocket = io('http://localhost:5000');
setSocket(newSocket);
// Get current location
if (navigator.geolocation) {
navigator.geolocation.getCurrentPosition(
(position) =&gt; {
const { latitude, longitude } = position.coords;
setCurrentPosition([latitude, longitude]);
setZoom(13);
setLocationPermission(true);
// Send location to server
newSocket.emit('locationUpdate', {
userId: user?.id,
username: user?.username,
location: {
type: 'Point',
coordinates: [longitude, latitude]
},
avatar: user?.profilePic || '👤'
});
},
(error) =&gt; {
console.error('Location error:', error);
setLocationPermission(false);
},
{
enableHighAccuracy: true,
timeout: 5000,
maximumAge: 0
}
);
// Update location every 30 seconds
const locationInterval = setInterval(() =&gt; {
navigator.geolocation.getCurrentPosition(
(position) =&gt; {
const { latitude, longitude } = position.coords;
setCurrentPosition([latitude, longitude]);
newSocket.emit('locationUpdate', {
userId: user?.id,
username: user?.username,
location: {
type: 'Point',
coordinates: [longitude, latitude]
},
avatar: user?.profilePic || '👤'
});
}
);
}, 30000); // Every 30 seconds
return () =&gt; {
clearInterval(locationInterval);
newSocket.disconnect();
};
}// Listen for other users' locations
newSocket.on('userLocationUpdate', (data) =&gt; {
setUsers(prevUsers =&gt; {
const filtered = prevUsers.filter(u =&gt; u.userId !== data.userId);
return [...filtered, data];
});
});
return () =&gt; {
newSocket.disconnect();
};
}, [user]);
// Create custom user marker icon
const createUserIcon = (avatar) =&gt; {
return L.divIcon({
className: 'custom-user-marker',
html: `
<div>
<div>${avatar}</div>
<div></div>
</div>
`,
iconSize: [50, 50],
iconAnchor: [25, 50],
popupAnchor: [0, -50]
});
};
const goToMyLocation = () =&gt; {
if (locationPermission) {
navigator.geolocation.getCurrentPosition(
(position) =&gt; {
const { latitude, longitude } = position.coords;
setCurrentPosition([latitude, longitude]);
setZoom(15);
}
);
} else {
alert('Please enable location permissions to use this feature!');
}
};
return (
<div>
<div>
<h1>🗺️Pirate Map</h1>
<p>Track your crew in real-time!</p>
</div>
<div>
&lt;button className="btn btn-primary locate-btn" onClick={goToMyLocation}&gt;
📍 My Location
&lt;/button&gt;
<div>
👥 {users.length + 1} Pirates Online
</div>
</div>
&lt;MapContainer
center={currentPosition}
zoom={zoom}
className="map-container"
scrollWheelZoom={true}
&gt;
{/* Satellite View - OpenStreetMap */}
&lt;TileLayer
attribution='&copy; &lt;a href="https://www.openstreetmap.org/copyright"&gt;Ope
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/&gt;
{/* Alternative: Satellite imagery (requires API key) */}
{/*
&lt;TileLayer
attribution='Tiles &copy; Esri'
url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServ
/&gt;
*/}
&lt;ChangeView center={currentPosition} zoom={zoom} /&gt;
{/* Current user marker */}
&lt;Marker
position={currentPosition}
icon={createUserIcon(user?.profilePic || '👤')}
&gt;
&lt;Popup&gt;
<div>
<div>{user?.profilePic || '👤'}</div>
<h3>{user?.username || 'You'}</h3>
<p>Level {user?.level || 1}</p>
<p>📍 Your Location</p>
</div>
&lt;/Popup&gt;
&lt;/Marker&gt;
{/* Other users markers */}
{users.map((otherUser, index) =&gt; (
&lt;Marker
key={index}
position={[
otherUser.location.coordinates[1],
otherUser.location.coordinates[0]
]}
icon={createUserIcon(otherUser.avatar)}
&gt;
&lt;Popup&gt;
<div>
<div>{otherUser.avatar}</div>
<h3>{otherUser.username}</h3>
<p>🏴‍☠️ Fellow Pirate</p>
</div>
&lt;/Popup&gt;
&lt;/Marker&gt;
))}
&lt;/MapContainer&gt;
{!locationPermission &amp;&amp; (
<div>
⚠️ Location permission required. Please enable location access in your browser.
</div>
)}
</div>
);
}
export default MapView;