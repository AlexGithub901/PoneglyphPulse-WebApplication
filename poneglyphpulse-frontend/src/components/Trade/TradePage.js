import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './Trade.css';

function TradePage({ user }) {
  const [trades, setTrades] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchTrades();
    fetchInventory();
  }, []);

  const fetchTrades = async () => {
    try {
      const response = await api.get('/trades/my-trades');
      setTrades(response.data.trades);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get('/gacha/inventory');
      setInventory(response.data.inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handleAcceptTrade = async (tradeId) => {
    try {
      await api.put(`/trades/accept/${tradeId}`);
      alert('Trade accepted successfully!');
      fetchTrades();
      fetchInventory();
    } catch (error) {
      alert(error.response?.data?.error || 'Error accepting trade');
    }
  };

  const handleRejectTrade = async (tradeId) => {
    try {
      await api.put(`/trades/reject/${tradeId}`);
      fetchTrades();
    } catch (error) {
      alert('Error rejecting trade');
    }
  };

  const handleCancelTrade = async (tradeId) => {
    try {
      await api.delete(`/trades/cancel/${tradeId}`);
      fetchTrades();
    } catch (error) {
      alert('Error cancelling trade');
    }
  };

  return (
    <div className="trade-page">
      <div className="trade-header">
        <h1>🤝 Character Trading</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="create-trade-btn">
          {showCreateForm ? '✕ Cancel' : '+ New Trade'}
        </button>
      </div>

      <div className="trades-container">
        <h2>Your Trades</h2>
        {trades.length > 0 ? (
          trades.map(trade => (
            <div key={trade.tradeId} className={`trade-card status-${trade.status}`}>
              <div className="trade-info">
                <div className="trade-parties">
                  <div className="party">
                    <strong>{trade.initiator.username}</strong>
                    <span className="role">Offering</span>
                  </div>
                  <span className="arrow">⇄</span>
                  <div className="party">
                    <strong>{trade.recipient.username}</strong>
                    <span className="role">Receiving</span>
                  </div>
                </div>
                <div className="trade-status">
                  Status: <span className="status-badge">{trade.status}</span>
                </div>
              </div>

              {trade.status === 'pending' && trade.recipient._id === user._id && (
                <div className="trade-actions">
                  <button onClick={() => handleAcceptTrade(trade.tradeId)} className="accept-btn">
                    ✓ Accept
                  </button>
                  <button onClick={() => handleRejectTrade(trade.tradeId)} className="reject-btn">
                    ✕ Reject
                  </button>
                </div>
              )}

              {trade.status === 'pending' && trade.initiator._id === user._id && (
                <div className="trade-actions">
                  <button onClick={() => handleCancelTrade(trade.tradeId)} className="cancel-btn">
                    Cancel Trade
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="empty-state">No trades yet. Start trading with other players!</p>
        )}
      </div>

      {showCreateForm && (
        <div className="create-trade-form">
          <h2>Create Trade Offer</h2>
          <p>This feature allows you to trade characters with other players. Coming soon!</p>
        </div>
      )}
    </div>
  );
}

export default TradePage;
