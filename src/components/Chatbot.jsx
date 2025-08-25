import React, { useState } from 'react';
import './Chatbot.css';
import { api } from '../utils/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your career guidance assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || loading) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await api.sendMessage(input);
      const botMessage = {
        text: response.response,
        sender: 'bot',
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        text: 'Sorry, something went wrong. Please try again later.',
        sender: 'bot',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }

    setInput('');
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''} ${isMaximized ? 'maximized' : ''}`}>
      <div className="chatbot-icon" onClick={toggleChatbot}>
        <img src="/chatbot-icon.svg" alt="Chat" width="30" height="30" />
      </div>
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>
              <img src="/chatbot-icon.svg" alt="Bot" width="20" height="20" className="header-icon" />
              Career Guidance Assistant
            </h3>
            <div className="chatbot-header-buttons">
              <button onClick={toggleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
                {isMaximized ? '🗗' : '🗖'}
              </button>
              <button onClick={toggleChatbot} title="Close">
                ✕
              </button>
            </div>
          </div>
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                {message.text}
              </div>
            ))}
            {loading && (
              <div className="message bot">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about careers..."
              disabled={loading}
            />
            <button onClick={handleSendMessage} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;