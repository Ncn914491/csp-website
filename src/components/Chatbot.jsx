import React, { useState, useEffect } from 'react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const API_KEY = 'AIzaSyAQEL9an0blwM5X3pt963hNpifWlOt7X0I';
  const systemPrompt = `You are a career guidance chatbot. Your purpose is to provide helpful and accurate information about careers, education paths, and skills development. Do not answer questions that are not related to career guidance. If a user asks a question that is not related to career guidance, politely decline to answer and remind them of your purpose.`;

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
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user' };
    setMessages([...messages, userMessage]);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: input },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch response from the Gemini API');
      }

      const data = await response.json();
      const botMessage = {
        text: data.candidates[0].content.parts[0].text,
        sender: 'bot',
      };
      setMessages([...messages, userMessage, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        text: 'Sorry, something went wrong. Please try again later.',
        sender: 'bot',
      };
      setMessages([...messages, userMessage, errorMessage]);
    }

    setInput('');
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''} ${isMaximized ? 'maximized' : ''}`}>
      <div className="chatbot-icon" onClick={toggleChatbot}>
        <img src="/chatbot-icon.svg" alt="Chatbot" />
      </div>
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Career Guidance Chatbot</h3>
            <div className="chatbot-header-buttons">
              <button onClick={toggleMaximize}>{isMaximized ? 'Minimize' : 'Maximize'}</button>
              <button onClick={toggleChatbot}>Close</button>
            </div>
          </div>
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                {message.text}
              </div>
            ))}
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask a question about careers..."
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
