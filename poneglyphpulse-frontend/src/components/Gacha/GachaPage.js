import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import GachaAnimation from './GachaAnimation';
import './Gacha.css';

function GachaPage({ user, setUser }) {
  const [pullingGacha, setPullingGacha] = useState(false);
  const [pulledCharacter, setPulledCharacter] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [rates, setRates] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchRates();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/gacha/inventory');
      setInventory(response.data.inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchRates = async () => {
    try {
      const response = await api.get('/gacha/rates');
      setRates(response.data);
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  };

  const handlePull = async (type) => {
    const cost = type === 'single' ? rates.pityCost : rates.multiCost;
    
    if (user.currency.poneglyphs < cost) {
      alert(`Not enough Poneglyphs! Need ${cost}, have ${user.currency.poneglyphs}`);
      return;
    }

    setPullingGacha(true);
    setShowAnimation(true);

    try {
      const response = await api.post(`/gacha/pull/${type}`);
      
      // Wait for animation
      setTimeout(() => {
        setPulledCharacter(response.data.character || response.data.characters);
        setShowAnimation(false);
        
        // Update user currency
        setUser(prev => ({
          ...prev,
          currency: response.data.currency
        }));

        fetchInventory();
      }, 3000);
    } catch (error) {
      console.error('Gacha pull error:', error);
      alert(error.response?.data?.error || 'Error pulling gacha');
      setShowAnimation(false);
    } finally {
      setPullingGacha(false);
    }
  };

  const getRarityColor = (rarity) => {
    const colors = {
      'Common': '#9e9e9e',
      'Uncommon': '#4caf50',
      'Rare': '#2196f3',
      'Epic': '#9c27b0',
      'Legendary': '#ff9800',
      'Mythic': '#f44336',
      'Secret': '#ffd700'
    };
    return colors[rarity] || '#000';
  };

  return (
    <div className="gacha-page">
      <AnimatePresence>
        {showAnimation && <GachaAnimation />}
      </AnimatePresence>

      {pulledCharacter && !showAnimation && (
        <motion.div 
          className="pull-result"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <div className="result-card" style={{ borderColor: getRarityColor(pulledCharacter.rarity) }}>
            <img src={pulledCharacter.image} alt={pulledCharacter.name} />
            <h2>{pulledCharacter.name}</h2>
            <p className="rarity" style={{ color: getRarityColor(pulledCharacter.rarity) }}>
              {pulledCharacter.rarity}
            </p>
            <p className="title">{pulledCharacter.title}</p>
            <button onClick={() => setPulledCharacter(null)} className="close-btn">
              Awesome! ✨
            </button>
          </div>
        </motion.div>
      )}

      <div className="gacha-header">
        <h1>🎲 Gacha System</h1>
        <p>Pull for powerful characters!</p>
        <div className="pity-counter">
          Pity Counter: <strong>{user?.pityCounter || 0}</strong> / 90
        </div>
      </div>

      <div className="gacha-controls">
        <div className="pull-card">
          <h3>Single Pull</h3>
          <p className="cost">📜 {rates?.pityCost || 100} Poneglyphs</p>
          <button 
            onClick={() => handlePull('single')} 
            disabled={pullingGacha}
            className="pull-btn single"
          >
            Pull x1
          </button>
        </div>

        <div className="pull-card featured">
          <div className="discount-badge">10% OFF!</div>
          <h3>Multi Pull</h3>
          <p className="cost">📜 {rates?.multiCost || 900} Poneglyphs</p>
          <button 
            onClick={() => handlePull('multi')} 
            disabled={pullingGacha}
            className="pull-btn multi"
          >
            Pull x10
          </button>
        </div>
      </div>

      <div className="rates-section">
        <h2>Drop Rates</h2>
        <div className="rates-grid">
          {rates?.rates.map(tier => (
            <div key={tier.rarity} className="rate-item">
              <span className="rarity-name" style={{ color: getRarityColor(tier.rarity) }}>
                {tier.rarity}
              </span>
              <span className="rate-percent">{tier.rate}%</span>
            </div>
          ))}
        </div>
        <p className="pity-info">
          🎁 Pity System: Guaranteed Legendary after 90 pulls without one!
        </p>
      </div>

      <div className="inventory-section">
        <h2>Your Collection ({inventory.length})</h2>
        <div className="inventory-grid">
          {inventory.length > 0 ? (
            inventory.map((item, index) => (
              <div key={index} className="inventory-card" style={{ borderColor: getRarityColor(item.character?.rarity) }}>
                <img src={item.character?.image} alt={item.character?.name} />
                <h4>{item.character?.name}</h4>
                <p className="char-rarity" style={{ color: getRarityColor(item.character?.rarity) }}>
                  {item.character?.rarity}
                </p>
              </div>
            ))
          ) : (
            <p className="empty-inventory">Your collection is empty. Start pulling!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default GachaPage;
