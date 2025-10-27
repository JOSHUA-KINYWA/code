'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export default function AdminChatPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin';

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      toast.error('Access denied. Admin only.');
      router.push('/');
    }
  }, [isLoaded, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadConversations();

      // Poll for new conversations/messages every 5 seconds
      pollIntervalRef.current = setInterval(() => {
        loadConversations();
      }, 5000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [isAdmin, statusFilter]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    if (selectedConversation?.messages) {
      scrollToBottom();
    }
  }, [selectedConversation?.messages]);

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/chat/conversations?status=${statusFilter}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);

        // Update selected conversation if it exists
        if (selectedConversation) {
          const updated = data.find((c: Conversation) => c.id === selectedConversation.id);
          if (updated) {
            setSelectedConversation(updated);
          }
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          senderId: user?.id,
          senderName: 'Admin Support',
          senderRole: 'admin',
          message: message.trim(),
        }),
      });

      if (response.ok) {
        await loadConversations();
        setMessage('');
        toast.success('Message sent');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const closeConversation = async (conversationId: string) => {
    try {
      console.log('🔒 Closing conversation:', conversationId);
      const response = await fetch('/api/chat/conversations', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          conversationId,
          status: 'closed',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Conversation closed successfully:', result);
        toast.success('✅ Conversation closed! User will be notified.');
        
        // Reload conversations to show updated status
        await loadConversations();
        
        // If this conversation is selected, keep it selected but update its status
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation({
            ...selectedConversation,
            status: 'closed'
          });
        }
      } else {
        const error = await response.text();
        console.error('❌ Failed to close conversation:', error);
        toast.error('Failed to close conversation');
      }
    } catch (error) {
      console.error('❌ Error closing conversation:', error);
      toast.error('Failed to close conversation');
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Conversation deleted');
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
        }
        loadConversations();
      } else {
        toast.error('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const getUnreadCount = (conversation: Conversation) => {
    if (!conversation.messages) return 0;
    const adminMessages = conversation.messages.filter(m => m.senderRole === 'admin');
    const userMessages = conversation.messages.filter(m => m.senderRole === 'user');
    
    if (userMessages.length === 0) return 0;
    if (adminMessages.length === 0) return userMessages.length;
    
    const lastAdminMessage = adminMessages[adminMessages.length - 1];
    const unreadMessages = userMessages.filter(m => 
      new Date(m.createdAt) > new Date(lastAdminMessage.createdAt)
    );
    
    return unreadMessages.length;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isLoaded || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Customer Support Chat</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer inquiries and support tickets</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="open">Open Conversations</option>
                <option value="closed">Closed Conversations</option>
                <option value="all">All Conversations</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const unreadCount = getUnreadCount(conv);
                  return (
                    <div key={conv.id} className="relative group">
                      <button
                        onClick={() => {
                          setSelectedConversation(conv);
                          markAsRead(conv.id);
                        }}
                        className={`w-full p-4 text-left border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        } ${unreadCount > 0 ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{conv.userName}</h3>
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-bold animate-pulse">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              conv.status === 'open'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {conv.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">{conv.userEmail}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''} • Updated{' '}
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-1 rounded transition-opacity"
                        title="Delete conversation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.userName}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedConversation.userEmail}</p>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                      selectedConversation.status === 'open' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {selectedConversation.status === 'open' ? '● Active' : '● Closed'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {selectedConversation.status === 'open' && (
                      <button
                        onClick={() => closeConversation(selectedConversation.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                        title="Close this conversation"
                      >
                        🔒 Close Conversation
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-0">
                  {selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          msg.senderRole === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {msg.senderRole !== 'admin' && (
                          <p className="text-xs font-semibold mb-1 text-blue-600 dark:text-blue-400">{msg.senderName}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.senderRole === 'admin' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {selectedConversation.status === 'open' && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your response..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        disabled={isLoading}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!message.trim() || isLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium"
                      >
                        {isLoading ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm mt-1">Choose a conversation from the list to view and respond</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

