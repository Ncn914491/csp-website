import React, { useState, useRef, useEffect } from 'react';
import { API_URL } from '../config';

function AskAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! I\'m AskAI, your career guidance assistant. How can I help you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      
      if (response.ok && data.response) {
        setMessages(prev => [...prev, { type: 'bot', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { 
          type: 'bot', 
          text: 'I apologize, but I\'m having trouble processing your request. Please try again later.' 
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'I\'m sorry, I couldn\'t connect to the server. Please check your connection and try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    'What career paths are available after 12th?',
    'How to prepare for engineering entrance exams?',
    'What are the best colleges for medical studies?',
    'Tell me about scholarship opportunities'
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
    // Auto-submit the question
    setTimeout(() => {
      const event = { preventDefault: () => {} };
      handleSendMessage(event);
    }, 100);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 z-50 group"
          aria-label="Open AskAI Chat"
        >
          <div className="relative">
            {/* AskAI Icon - Brain with sparkles */}
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.62 3.34 1.66 4.59-.05.27-.16.52-.16.81 0 1.1.9 2 2 2h.28c.35.6.98 1 1.72 1 .74 0 1.37-.4 1.72-1h.56c.35.6.98 1 1.72 1 .74 0 1.37-.4 1.72-1H16c1.1 0 2-.9 2-2 0-.29-.11-.54-.16-.81C18.38 12.34 19 10.74 19 9c0-3.87-3.13-7-7-7z"/>
              <circle cx="9" cy="8" r="1"/>
              <circle cx="15" cy="8" r="1"/>
              <path d="M12 12c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z"/>
              {/* Sparkles */}
              <circle cx="7" cy="4" r="0.5" opacity="0.7"/>
              <circle cx="17" cy="6" r="0.5" opacity="0.7"/>
              <circle cx="20" cy="14" r="0.5" opacity="0.7"/>
              <circle cx="4" cy="16" r="0.5" opacity="0.7"/>
            </svg>
            {/* Pulse Animation */}
            <span className="absolute -top-1 -right-1 h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
          </div>
          <span className="absolute -top-10 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask AI Assistant
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isMinimized ? 'w-80' : 'w-96'
        }`}>
          <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[600px]'
          }`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full p-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.62 3.34 1.66 4.59-.05.27-.16.52-.16.81 0 1.1.9 2 2 2h.28c.35.6.98 1 1.72 1 .74 0 1.37-.4 1.72-1h.56c.35.6.98 1 1.72 1 .74 0 1.37-.4 1.72-1H16c1.1 0 2-.9 2-2 0-.29-.11-.54-.16-.81C18.38 12.34 19 10.74 19 9c0-3.87-3.13-7-7-7z"/>
                    <circle cx="9" cy="8" r="0.8"/>
                    <circle cx="15" cy="8" r="0.8"/>
                    <path d="M12 11c-0.8 0-1.5-.7-1.5-1.5h3c0 .8-.7 1.5-1.5 1.5z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">AskAI Assistant</h3>
                  {!isMinimized && (
                    <p className="text-xs text-white/80">Your Career Guidance Helper</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Minimize Button */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMinimized ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                </button>
                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsMinimized(false);
                  }}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="h-[420px] overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {message.type === 'bot' && (
                          <div className="flex items-center mb-1">
                            <span className="text-xs font-medium text-purple-600">AskAI</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl border border-gray-200">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions */}
                {messages.length === 1 && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickQuestion(question)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                        >
                          {question.substring(0, 30)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type your question..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-full hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Send message"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Powered by Gemini AI
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

export default AskAI;
