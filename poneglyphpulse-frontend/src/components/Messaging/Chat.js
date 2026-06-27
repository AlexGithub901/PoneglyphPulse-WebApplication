import React, { useState, useEffect } from 'react';
import { getSocket } from '../../utils/socket';
import api from '../../utils/api';
import './Chat.css';

function Chat({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchConversations();
    
    const socket = getSocket();
    if (socket) {
      socket.on('receiveMessage', (data) => {
        setMessages(prev => [...prev, data]);
      });
    }

    return () => {
      if (socket) {
        socket.off('receiveMessage');
      }
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await api.get(`/messages/conversation/${userId}`);
      setMessages(response.data.messages);
      setSelectedConversation(userId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await api.post('/messages/send', {
        recipientId: selectedConversation,
        content: newMessage
      });
      setNewMessage('');
    } catch (error) {
      alert('Error sending message');
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="conversations-sidebar">
          <h2>💬 Messages</h2>
          {conversations.length > 0 ? (
            conversations.map(conv => (
              <div
                key={conv.user._id}
                className={`conversation-item ${selectedConversation === conv.user._id ? 'active' : ''}`}
                onClick={() => fetchMessages(conv.user._id)}
              >
                <div className="conv-avatar">{conv.user.username[0].toUpperCase()}</div>
                <div className="conv-info">
                  <strong>{conv.user.username}</strong>
                  <p>{conv.lastMessage?.content.substring(0, 30)}...</p>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-conversations">No conversations yet</p>
          )}
        </div>

        <div className="chat-area">
          {selectedConversation ? (
            <>
              <div className="messages-container">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${msg.sender._id === user._id ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{msg.content}</p>
                      <span className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={sendMessage} className="message-input-form">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <h2>Select a conversation to start chatting</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
