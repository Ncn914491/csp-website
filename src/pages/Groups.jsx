import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';

function Groups() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [userMemberships, setUserMemberships] = useState(new Set());
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchGroups = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setGroupsLoading(true);
      setError(null);
      
      const data = await api.listGroups();
      setGroups(data || []);
      
      // Update user memberships
      const memberships = new Set();
      data?.forEach(group => {
        if (group.isMember) {
          memberships.add(group._id);
        }
      });
      setUserMemberships(memberships);
      
      setRetryCount(0);
    } catch (e) {
      console.error('Error fetching groups:', e);
      setError(e.message || 'Failed to load groups');
    } finally {
      if (showLoading) setGroupsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (groupId, showLoading = true) => {
    try {
      if (showLoading) setMessagesLoading(true);
      setError(null);
      
      const msgs = await api.listMessages(groupId);
      setMessages(msgs || []);
      
      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    } catch (e) {
      console.error('Error fetching messages:', e);
      setError(e.message || 'Failed to load messages');
    } finally {
      if (showLoading) setMessagesLoading(false);
    }
  }, [scrollToBottom]);

  const openGroup = useCallback(async (group) => {
    // Check if user is a member
    if (!userMemberships.has(group._id)) {
      setError('You must join this group to view messages');
      return;
    }
    
    setSelectedGroup(group);
    setMessages([]);
    await fetchMessages(group._id);
    
    // Start polling for new messages
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(group._id, false);
    }, 5000); // Poll every 5 seconds
  }, [userMemberships, fetchMessages]);

  const sendMessage = useCallback(async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedGroup || sendingMessage) return;
    
    const messageText = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);
    
    try {
      const msg = await api.sendMessageToGroup(selectedGroup._id, messageText);
      setMessages(prev => [...prev, msg]);
      setError(null);
      
      // Scroll to bottom after sending
      setTimeout(scrollToBottom, 100);
      
      // Focus back on input
      messageInputRef.current?.focus();
    } catch (e) {
      console.error('Error sending message:', e);
      setError(e.message || 'Failed to send message');
      // Restore message text on error
      setNewMessage(messageText);
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedGroup, sendingMessage, scrollToBottom]);

  const joinGroup = useCallback(async (groupId) => {
    try {
      setError(null);
      await api.joinGroup(groupId);
      setUserMemberships(prev => new Set([...prev, groupId]));
      await fetchGroups(false);
    } catch (e) {
      console.error('Error joining group:', e);
      setError(e.message || 'Failed to join group');
    }
  }, [fetchGroups]);

  const leaveGroup = useCallback(async (groupId) => {
    try {
      setError(null);
      await api.leaveGroup(groupId);
      setUserMemberships(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
      
      // If leaving the currently selected group, close it
      if (selectedGroup && selectedGroup._id === groupId) {
        setSelectedGroup(null);
        setMessages([]);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      }
      
      await fetchGroups(false);
    } catch (e) {
      console.error('Error leaving group:', e);
      setError(e.message || 'Failed to leave group');
    }
  }, [selectedGroup, fetchGroups]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && selectedGroup) {
        e.preventDefault();
        sendMessage();
      }
    };

    const inputElement = messageInputRef.current;
    if (inputElement) {
      inputElement.addEventListener('keypress', handleKeyPress);
      return () => inputElement.removeEventListener('keypress', handleKeyPress);
    }
  }, [selectedGroup, sendMessage]);

  if (groupsLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="text-gray-600 mt-4">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Groups</h1>
          <p className="text-gray-600">Join groups to collaborate and discuss with fellow students</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={handleRetry}
              className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Groups Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-lg border overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Available Groups</h2>
                <button 
                  onClick={() => fetchGroups()}
                  className="text-white/80 hover:text-white transition-colors"
                  title="Refresh groups"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 h-full overflow-y-auto">
              <div className="space-y-3">
                {groups.map(group => {
                  const isMember = userMemberships.has(group._id);
                  const isSelected = selectedGroup?._id === group._id;
                  
                  return (
                    <div 
                      key={group._id} 
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{group.name}</h3>
                            {isMember && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                Member
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {group.members?.length || 0} members
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {isMember ? (
                          <>
                            <button
                              onClick={() => openGroup(group)}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Open Chat
                            </button>
                            <button
                              onClick={() => leaveGroup(group._id)}
                              className="px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              Leave
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => joinGroup(group._id)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Join Group
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {groups.length === 0 && (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No groups available yet</p>
                    <button
                      onClick={handleRetry}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg border flex flex-col overflow-hidden">
            {selectedGroup ? (
              <>
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">{selectedGroup.name}</h2>
                      <p className="text-green-100 text-sm">{selectedGroup.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 text-green-100 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{selectedGroup.members?.length || 0} members</span>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  {messagesLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <LoadingSpinner />
                      <span className="ml-2 text-gray-600">Loading messages...</span>
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isConsecutive = index > 0 && 
                          messages[index - 1].userId === message.userId &&
                          new Date(message.createdAt) - new Date(messages[index - 1].createdAt) < 300000; // 5 minutes
                        
                        return (
                          <div key={message._id} className={`${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                            {!isConsecutive && (
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {message.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <span className="font-medium text-gray-900 text-sm">
                                  {message.userId?.name || 'Unknown User'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleString()}
                                </span>
                              </div>
                            )}
                            <div className={`${isConsecutive ? 'ml-10' : 'ml-10'} bg-white rounded-lg p-3 shadow-sm border`}>
                              <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-lg font-medium mb-2">No messages yet</p>
                      <p className="text-sm">Be the first to start the conversation!</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t bg-white">
                  <div className="flex space-x-3">
                    <input
                      ref={messageInputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sendingMessage}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="Type your message..."
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {sendingMessage ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                      <span>{sendingMessage ? 'Sending...' : 'Send'}</span>
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Press Enter to send</span>
                    <span>{newMessage.length}/500</span>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                <svg className="w-20 h-20 mb-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-xl font-medium mb-2">Select a Group</h3>
                <p className="text-center max-w-md">
                  Join a study group from the sidebar to start collaborating and discussing with fellow students.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default Groups;
