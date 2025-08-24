import React, { useState, useEffect } from 'react';
import './Chatbot.css';
import { FaRobot, FaTimes, FaW              placeholder="Type your message..."
            />
            <button onClick={handleSendMessage} className="send-button">
              <IoSend />
            </button>
          </div>
        </div>
      )}
    </div>
  );imize, FaWindowMinimize, FaWindowRestore } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const API_KEY = import.meta.env.GEMINI_API_KEY;
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
        <FaRobot size={30} color="#fff" />
      </div>
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3><FaRobot className="header-icon" /> Career Guidance Chatbot</h3>
            <div className="chatbot-header-buttons">
              <button onClick={toggleMaximize}>
                {isMaximized ? <FaWindowRestore /> : <FaWindowMaximize />}
              </button>
              <button onClick={toggleChatbot}>
                <FaTimes />
              </button>
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
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
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
