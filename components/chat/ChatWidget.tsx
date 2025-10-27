'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

export default function ChatWidget() {
  const { user, isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] = useState<string>('open');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousMessageCountRef = useRef(0);

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin';

  // Load persisted state from localStorage
  useEffect(() => {
    if (isSignedIn && user?.id) {
      const savedState = localStorage.getItem(`chat_state_${user.id}`);
      if (savedState) {
        const { isOpen: savedIsOpen, lastReadMessageId: savedLastRead } = JSON.parse(savedState);
        setIsOpen(savedIsOpen || false);
        setLastReadMessageId(savedLastRead || null);
      }
    }
  }, [isSignedIn, user?.id]);

  // Save state to localStorage
  useEffect(() => {
    if (isSignedIn && user?.id) {
      localStorage.setItem(`chat_state_${user.id}`, JSON.stringify({
        isOpen,
        lastReadMessageId,
      }));
    }
  }, [isOpen, lastReadMessageId, isSignedIn, user?.id]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = useCallback(async () => {
    try {
      console.log('Loading conversation for user:', user?.id);
      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.fullName || user?.firstName || 'User',
          userEmail: user?.emailAddresses[0]?.emailAddress || '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Conversation loaded:', data);
        setConversationId(data.id);
        setConversationStatus(data.status || 'open');
        const initialMessages = Array.isArray(data.messages) ? data.messages : [];
        setMessages(initialMessages);
        console.log('Initial messages set:', initialMessages.length);
        
        if (data.status === 'closed') {
          toast.error('This conversation has been closed by admin. Start a new one!', { duration: 5000 });
        } else {
          toast.success('Chat ready!');
        }
      } else {
        const error = await response.text();
        console.error('Failed to load conversation:', error);
        toast.error('Failed to start chat. Please try again.');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Connection error. Please check your internet.');
    }
  }, [user]);

  const startNewConversation = async () => {
    console.log('Starting new conversation...');
    setConversationId(null);
    setMessages([]);
    setConversationStatus('open');
    await loadConversation();
  };

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      console.log('loadMessages: No conversationId, skipping');
      return;
    }

    try {
      const timestamp = Date.now();
      console.log(`Fetching messages for conversation: ${conversationId}`);
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}&t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded messages data:', data);
        console.log('Current status:', conversationStatus, '| New status:', data.conversation?.status);
        
        // Handle both old format (array) and new format (object with messages)
        const newMessages = Array.isArray(data) ? data : (data.messages || []);
        console.log('Parsed messages array:', newMessages.length, 'messages');
        
        // Check if conversation status changed to closed
        if (data.conversation && data.conversation.status) {
          const newStatus = data.conversation.status;
          if (newStatus === 'closed' && conversationStatus !== 'closed') {
            console.log('🔒 Conversation was closed by admin!');
            setConversationStatus('closed');
            toast.error('🔒 Admin has closed this conversation.', { duration: 6000 });
            
            // Play notification sound
            if (typeof Audio !== 'undefined') {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHGm98OOnVhQIRpzn77BdGAg+ltzzxnMpBSl+zPLaizsIHGS57OihUhEKTonh8LVeHAU2jdXzzn0uBSF1xe/glEILElyw6OyrWBUIQ5jm8L1oHgU5ldrzzIMwBiBuvPDmo1oUCECY5O+3Yhsa');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            }
          } else if (newStatus !== conversationStatus) {
            console.log('Status changed:', conversationStatus, '→', newStatus);
            setConversationStatus(newStatus);
          }
        }
        
        // Check for new messages from admin
        if (newMessages.length > previousMessageCountRef.current) {
          const latestMessage = newMessages[newMessages.length - 1];
          console.log('📨 New message detected!', latestMessage);
          
          // If new message is from admin
          if (latestMessage.senderRole === 'admin') {
            console.log('💬 Admin sent a message!');
            
            // If chat is closed/minimized, show notification
            if (!isOpen || isMinimized) {
              toast('💬 New message from Support!', {
                duration: 5000,
                icon: '🔔',
              });
              
              // Play notification sound
              if (typeof Audio !== 'undefined') {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHGm98OOnVhQIRpzn77BdGAg+ltzzxnMpBSl+zPLaizsIHGS57OihUhEKTonh8LVeHAU2jdXzzn0uBSF1xe/glEILElyw6OyrWBUIQ5jm8L1oHgU5ldrzzIMwBiBuvPDmo1oUCECY5O+3Yhsa');
                audio.volume = 0.3;
                audio.play().catch(() => {});
              }
            }
          }
        }
        
        // Update unread count if chat is not open
        if (!isOpen || isMinimized) {
          const unreadMessages = newMessages.filter((msg: Message) => 
            msg.senderRole === 'admin' && 
            (!lastReadMessageId || msg.createdAt > (messages.find(m => m.id === lastReadMessageId)?.createdAt || ''))
          );
          setUnreadCount(unreadMessages.length);
        } else {
          // Mark as read if chat is open
          if (newMessages.length > 0) {
            setLastReadMessageId(newMessages[newMessages.length - 1].id);
          }
          setUnreadCount(0);
        }
        
        previousMessageCountRef.current = newMessages.length;
        setMessages(newMessages);
        console.log('Messages updated. Total:', newMessages.length);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [conversationId, isOpen, isMinimized, lastReadMessageId, conversationStatus]);

  // Load conversation when signed in (always load, even when minimized)
  useEffect(() => {
    if (isSignedIn && !conversationId) {
      loadConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, conversationId]);

  // Poll for new messages continuously (even when minimized to show notifications)
  useEffect(() => {
    if (conversationId && isSignedIn) {
      console.log('Starting message polling...');
      // Initial load
      loadMessages();

      // Poll every 3 seconds for new messages
      pollIntervalRef.current = setInterval(() => {
        console.log('Polling for messages...');
        loadMessages();
      }, 3000);

      return () => {
        console.log('Stopping message polling');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [conversationId, isSignedIn, loadMessages]);


  const sendMessage = useCallback(async () => {
    console.log('sendMessage called:', { 
      hasMessage: !!message.trim(), 
      conversationId, 
      conversationStatus,
      isSignedIn 
    });
    
    if (!message.trim()) {
      toast.error('Please type a message');
      return;
    }
    
    if (!conversationId) {
      toast.error('Chat not ready. Please wait...');
      console.log('No conversation ID available');
      return;
    }
    
    if (conversationStatus === 'closed') {
      toast.error('This conversation is closed. Please start a new one.');
      return;
    }
    
    if (!isSignedIn) {
      toast.error('Please sign in to send messages');
      return;
    }

    // Optimistic update - show message immediately
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      senderId: user?.id || '',
      senderName: user?.fullName || user?.firstName || 'User',
      senderRole: 'user',
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const messageToSend = message.trim();
    setMessage(''); // Clear input immediately
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          senderId: user?.id,
          senderName: user?.fullName || user?.firstName || 'User',
          senderRole: 'user',
          message: messageToSend,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        console.log('Message sent successfully:', newMessage);
        // Replace optimistic message with real one
        setMessages((prev) => 
          prev.map(msg => msg.id === optimisticMessage.id ? newMessage : msg)
        );
        toast.success('Message sent!');
      } else {
        const errorText = await response.text();
        console.error('Failed to send message:', errorText);
        // Remove optimistic message on error
        setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
        toast.error('Failed to send message');
        setMessage(messageToSend); // Restore message
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
      toast.error('Failed to send message. Please try again.');
      setMessage(messageToSend); // Restore message
    } finally {
      setIsLoading(false);
    }
  }, [message, conversationId, conversationStatus, isSignedIn, user]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleToggleChat = () => {
    if (!isSignedIn) {
      toast.error('Please sign in to chat with support');
      return;
    }
    setIsOpen(!isOpen);
    setIsMinimized(false);
    
    // Mark messages as read when opening
    if (!isOpen && messages.length > 0) {
      setLastReadMessageId(messages[messages.length - 1].id);
      setUnreadCount(0);
    }
  };

  // Mark messages as read when opening or un-minimizing
  useEffect(() => {
    if (isOpen && !isMinimized && messages.length > 0) {
      setLastReadMessageId(messages[messages.length - 1].id);
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized, messages]);

  // Don't show chat widget for admins
  if (isAdmin) {
    return null;
  }

  // WhatsApp click handler
  const handleWhatsAppClick = () => {
    const phoneNumber = '254758036936'; // Your WhatsApp number (without + sign)
    const message = encodeURIComponent('Hello! I would like to inquire about your products.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      {/* Vertical Chat Buttons Container - Stacked Top to Bottom */}
      <div className="fixed bottom-8 right-8 flex flex-col-reverse items-end gap-3 z-[9999]">
        {/* WhatsApp Button - Always Visible (Bottom) */}
        <button
          onClick={handleWhatsAppClick}
          className="bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-2xl transition-all duration-200 hover:scale-110 group animate-pulse hover:animate-none"
          aria-label="Contact us on WhatsApp"
        >
          {/* WhatsApp Icon */}
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          
          {/* Enhanced Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl w-56 whitespace-normal">
            <p className="font-semibold mb-1">📱 WhatsApp</p>
            <p className="text-xs text-gray-300">For general inquiries & quick replies</p>
            <div className="absolute top-full right-6 -mt-1 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>

        {/* In-App Chat Button - Only for signed-in users (Top) */}
        {isSignedIn && !isOpen && (
          <button
            onClick={handleToggleChat}
            className={`bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-all duration-200 hover:scale-110 group relative ${
              unreadCount > 0 ? 'animate-bounce' : ''
            }`}
            aria-label="Chat for orders and products"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
            
            {/* Enhanced Tooltip */}
            <div className="absolute bottom-full right-0 mb-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl w-56 whitespace-normal">
              <p className="font-semibold mb-1">💬 Support Chat</p>
              <p className="text-xs text-gray-300">For order tracking & product inquiries</p>
              <div className="absolute top-full right-6 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>
        )}
      </div>

      {/* In-App Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-8 right-8 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[9999] flex flex-col transition-all duration-200 ${
            isMinimized ? 'h-16' : 'h-[600px]'
          }`}
          style={{ position: 'fixed', bottom: '2rem', right: '2rem' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600"></span>
              </div>
              <div>
                <h3 className="font-semibold">Customer Support</h3>
                <p className="text-xs text-blue-100">
                  {messages.some(m => m.senderRole === 'admin') ? 'Active' : 'We\'re here to help!'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 p-1 rounded transition-colors"
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isMinimized ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="font-medium">Start a conversation</p>
                    <p className="text-sm mt-1">Send us a message and we'll get back to you shortly</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          msg.senderRole === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {msg.senderRole !== 'user' && (
                          <p className="text-xs font-semibold mb-1 text-blue-600 dark:text-blue-400">{msg.senderName}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.senderRole === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Conversation Closed Banner */}
              {conversationStatus === 'closed' && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
                  <div className="text-center">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
                      🔒 This conversation has been closed by admin
                    </p>
                    <button
                      onClick={startNewConversation}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Start New Conversation
                    </button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              {conversationStatus === 'open' && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim() || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

