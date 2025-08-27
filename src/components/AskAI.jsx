import React, { useState, useRef, useEffect, useCallback } from 'react';
import { API_URL } from '../config';
import './AskAI.css';

function AskAI({ isFullView = false }) {
  const [isOpen, setIsOpen] = useState(isFullView);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [conversationContext, setConversationContext] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Initialize conversation with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'bot',
        text: 'Hello! I\'m AskAI, your career guidance assistant. I can help you with career paths, college admissions, exam preparation, and scholarship opportunities. How can I assist you today?',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  // Load conversation history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('askAI_conversation');
    const savedContext = localStorage.getItem('askAI_context');
    
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
      }
    }
    
    if (savedContext) {
      try {
        const parsedContext = JSON.parse(savedContext);
        if (Array.isArray(parsedContext)) {
          setConversationContext(parsedContext);
        }
      } catch (error) {
        console.error('Error loading conversation context:', error);
      }
    }
  }, []);

  // Save conversation history to localStorage
  useEffect(() => {
    if (messages.length > 1) { // Don't save just the welcome message
      localStorage.setItem('askAI_conversation', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (conversationContext.length > 0) {
      localStorage.setItem('askAI_context', JSON.stringify(conversationContext));
    }
  }, [conversationContext]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if ((isOpen && !isMinimized) || isFullView) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized, isFullView]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      text: 'Hello! I\'m AskAI, your career guidance assistant. I can help you with career paths, college admissions, exam preparation, and scholarship opportunities. How can I assist you today?',
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    setConversationContext([]);
    setError(null);
    localStorage.removeItem('askAI_conversation');
    localStorage.removeItem('askAI_context');
  }, []);

  // Retry failed message
  const retryMessage = useCallback(async (messageText) => {
    setError(null);
    setRetryCount(prev => prev + 1);
    await sendMessageToAPI(messageText);
  }, []);

  // Send message to API with enhanced error handling
  const sendMessageToAPI = useCallback(async (messageText) => {
    try {
      setIsLoading(true);
      setError(null);

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Prepare context for the API (last 5 exchanges for context)
      const recentContext = conversationContext.slice(-10);
      
      const response = await fetch(`${API_URL}/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText,
          context: recentContext
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.response) {
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          text: data.response,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        // Update conversation context
        setConversationContext(prev => [
          ...prev,
          { role: 'user', content: messageText },
          { role: 'assistant', content: data.response }
        ]);
        
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error('No response received from AI service');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'I apologize, but I\'m having trouble processing your request.';
      
      if (error.name === 'AbortError') {
        return; // Request was cancelled, don't show error
      } else if (error.message.includes('HTTP 429')) {
        errorMessage = 'I\'m receiving too many requests right now. Please wait a moment and try again.';
      } else if (error.message.includes('HTTP 503') || error.message.includes('HTTP 502')) {
        errorMessage = 'The AI service is temporarily unavailable. Please try again in a few moments.';
      } else if (!navigator.onLine) {
        errorMessage = 'You appear to be offline. Please check your internet connection and try again.';
      } else if (retryCount >= 3) {
        errorMessage = 'I\'m having persistent issues connecting to the AI service. Please try again later or contact support.';
      }
      
      setError({
        message: errorMessage,
        canRetry: retryCount < 3 && navigator.onLine,
        originalMessage: messageText
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [conversationContext, retryCount]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to conversation
    const userMessageObj = {
      id: Date.now(),
      type: 'user',
      text: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessageObj]);
    
    // Send to API
    await sendMessageToAPI(userMessage);
  }, [inputMessage, isLoading, sendMessageToAPI]);

  const quickQuestions = [
    'What career paths are available after 12th?',
    'How to prepare for engineering entrance exams?',
    'What are the best colleges for medical studies?',
    'Tell me about scholarship opportunities',
    'Which stream should I choose in 11th grade?',
    'How to prepare for competitive exams?'
  ];

  const handleQuickQuestion = useCallback((question) => {
    setInputMessage(question);
    inputRef.current?.focus();
    // Auto-submit the question
    setTimeout(() => {
      const event = { preventDefault: () => {} };
      handleSendMessage(event);
    }, 100);
  }, [handleSendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <>
      {/* Chat Button */}
      {!isOpen && !isFullView && (
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
      {(isOpen || isFullView) && (
        <div className={`${
          isFullView 
            ? 'w-full max-w-4xl mx-auto' 
            : `fixed bottom-6 right-6 z-50 transition-all duration-300 ${isMinimized ? 'w-80' : 'w-96'}`
        }`}>
          <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
            isFullView 
              ? 'h-[80vh]' 
              : isMinimized ? 'h-14' : 'h-[600px]'
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
                  {(!isMinimized || isFullView) && (
                    <p className="text-xs text-white/80">
                      {isFullView ? 'Full View - Career Guidance Helper' : 'Your Career Guidance Helper'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Clear Conversation Button */}
                {(!isMinimized || isFullView) && (
                  <button
                    onClick={clearConversation}
                    className="text-white/80 hover:text-white transition-colors"
                    aria-label="Clear conversation"
                    title="Clear conversation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                {/* Minimize Button (only for widget mode) */}
                {!isFullView && (
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
                )}
                {/* Close Button (only for widget mode) */}
                {!isFullView && (
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
                )}
              </div>
            </div>

            {(!isMinimized || isFullView) && (
              <>
                {/* Messages Area */}
                <div className={`${
                  isFullView ? 'h-[calc(80vh-200px)]' : 'h-[420px]'
                } overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white`}>
                  {messages.map((message, index) => (
                    <div
                      key={message.id || index}
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
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-purple-600">AskAI</span>
                            {message.timestamp && (
                              <span className="text-xs text-gray-400">
                                {new Date(message.timestamp).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            )}
                          </div>
                        )}
                        {message.type === 'user' && message.timestamp && (
                          <div className="flex justify-end mb-1">
                            <span className="text-xs text-white/70">
                              {new Date(message.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Error Message */}
                  {error && (
                    <div className="flex justify-start mb-4">
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-red-50 border border-red-200">
                        <div className="flex items-center mb-2">
                          <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-xs font-medium text-red-600">Error</span>
                        </div>
                        <p className="text-sm text-red-700 mb-3">{error.message}</p>
                        {error.canRetry && (
                          <button
                            onClick={() => retryMessage(error.originalMessage)}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-full transition-colors"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {isLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-xs text-gray-500">AskAI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions */}
                {messages.length === 1 && !isLoading && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-gray-500 mb-2">Quick questions to get started:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {quickQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickQuestion(question)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors text-left"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation Stats */}
                {isFullView && messages.length > 1 && (
                  <div className="px-4 pb-2 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs text-gray-500 py-2">
                      <span>{messages.length - 1} messages in conversation</span>
                      <span>Context: {conversationContext.length / 2} exchanges</span>
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
                      placeholder={isLoading ? "AskAI is thinking..." : "Type your question..."}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50"
                      disabled={isLoading}
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-full hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-400">
                      Powered by Gemini AI {conversationContext.length > 0 && `• ${conversationContext.length / 2} exchanges`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {inputMessage.length}/500
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}


    </>
  );
}

export default AskAI;
