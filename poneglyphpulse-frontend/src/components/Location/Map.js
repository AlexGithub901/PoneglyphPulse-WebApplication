import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './Map.css';

function Map({ user }) {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          updateLocation(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Please enable location services');
        }
      );
    }
  };

  const updateLocation = async (lat, lng) => {
    try {
      await api.put('/location/update', { latitude: lat, longitude: lng });
      fetchNearbyUsers();
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const fetchNearbyUsers = async () => {
    try {
      const response = await api.get('/location/nearby?maxDistance=5000');
      setNearbyUsers(response.data.nearbyUsers);
    } catch (error) {
      console.error('Error fetching nearby users:', error);
    }
  };

  return (
    <div className="map-page">
      <div className="map-header">
        <h1>🗺️ Nearby Pirates</h1>
        <p>Find other adventurers near you!</p>
      </div>

      <div className="map-container">
        <div className="map-placeholder">
          <p>🌍 Map View</p>
          <p className="location-info">
            {location ? (
              `Your location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
            ) : (
              'Getting your location...'
            )}
          </p>
        </div>
      </div>

      <div className="nearby-users-section">
        <h2>Nearby Users ({nearbyUsers.length})</h2>
        <div className="users-grid">
          {nearbyUsers.length > 0 ? (
            nearbyUsers.map(nearbyUser => (
              <div key={nearbyUser._id} className="user-card">
                <div className="user-avatar">{nearbyUser.username[0].toUpperCase()}</div>
                <h3>{nearbyUser.username}</h3>
                <p className="user-level">Level {nearbyUser.level}</p>
                <button className="connect-btn">Connect</button>
              </div>
            ))
          ) : (
            <p className="no-users">No users nearby. Be the first in your area!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Map;
