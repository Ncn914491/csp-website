import React, { useState } from 'react';
import { api } from '../utils/api';
import './AIChat.css';

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your career guidance AI assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await api.sendMessage(inputMessage);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: response.response,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`ai-chat ${isMaximized ? 'maximized' : ''}`}>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button 
          className="chat-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Chat"
          title="Open chat"
        >
          <img src="/chatbot-icon.svg" alt="Open chat" width="28" height="28" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>
              <img src="/chatbot-icon.svg" alt="AI" width="18" height="18" style={{ marginRight: 8 }} />
              AI Career Assistant
            </h3>
            <div className="chat-actions">
              <button 
                className="icon-btn"
                onClick={() => setIsMaximized(!isMaximized)}
                aria-label={isMaximized ? 'Restore' : 'Maximize'}
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? (
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M6 8h10v10H6z"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M7 7h10v10H7z"/></svg>
                )}
              </button>
              <button 
                className="icon-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                title="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.17 12 2.89 5.71 4.3 4.29l6.29 6.3 6.29-6.3z"/></svg>
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender}`}
              >
                <div className="message-content">
                  {message.text}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message ai">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chat-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about career guidance..."
              rows="2"
              disabled={loading}
            />
            <button 
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim()}
              className="send-btn"
              title="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;