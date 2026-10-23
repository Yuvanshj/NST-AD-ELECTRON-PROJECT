import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import { MessageSquare, Send, CheckCircle2, User, Search } from 'lucide-react';

export default function ChatModule({ initialRecipient }) {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentUser?._id) {
      loadConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialRecipient) {
      setActivePartner(initialRecipient);
    }
  }, [initialRecipient]);

  useEffect(() => {
    if (activePartner && currentUser?._id) {
      loadMessages();
    }
  }, [activePartner, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await api.chat.getConversations(currentUser._id);
      if (res.conversations) {
        setConversations(res.conversations);
        if (!activePartner && res.conversations.length > 0) {
          setActivePartner(res.conversations[0].partner);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await api.chat.getMessages(currentUser._id, activePartner._id);
      if (res.messages) {
        setMessages(res.messages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartner) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Optimistic UI update
    const tempMsg = {
      _id: 'temp-' + Date.now(),
      senderId: { _id: currentUser._id, name: currentUser.name },
      receiverId: { _id: activePartner._id, name: activePartner.name },
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await api.chat.sendMessage({
        senderId: currentUser._id,
        receiverId: activePartner._id,
        content,
      });
      loadConversations();
    } catch (err) {
      alert('Error sending message: ' + err.message);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ height: 'calc(100vh - var(--navbar-height) - 4rem)' }}>
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          height: '100%',
          overflow: 'hidden',
          borderRadius: 16,
        }}
      >
        {/* Left Sidebar: Conversations */}
        <div
          style={{
            width: 320,
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(15, 23, 42, 0.4)',
          }}
        >
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Direct Messages</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GTU Verified Alumni & Student Network</p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active conversations yet. Visit the Alumni Directory to initiate conversations!
              </div>
            ) : (
              conversations.map((c, idx) => {
                const partner = c.partner;
                const isSelected = activePartner?._id === partner?._id;
                return (
                  <div
                    key={idx}
                    onClick={() => setActivePartner(partner)}
                    style={{
                      padding: '0.85rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#1d4ed8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      {partner?.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {partner?.name}
                          </span>
                          {partner?.verificationStatus === 'VERIFIED' && (
                            <CheckCircle2 size={13} color="#10b981" />
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.lastMessage?.content || 'Started conversation'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Chat Window */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(10, 15, 29, 0.6)' }}>
          {activePartner ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(15, 23, 42, 0.6)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb, #10b981)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {activePartner.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {activePartner.name}
                      {activePartner.verificationStatus === 'VERIFIED' && (
                        <CheckCircle2 size={14} color="#10b981" />
                      )}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {activePartner.role} • {activePartner.collegeId?.name || 'GTU'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                    <MessageSquare size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <p>No messages yet. Say hello to {activePartner.name}!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = (msg.senderId?._id || msg.senderId) === currentUser._id;
                    return (
                      <div
                        key={idx}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                        }}
                      >
                        <div
                          style={{
                            background: isMe
                              ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                              : 'rgba(30, 41, 59, 0.8)',
                            color: '#fff',
                            padding: '0.75rem 1rem',
                            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            border: isMe ? 'none' : '1px solid var(--border-color)',
                            fontSize: '0.875rem',
                            lineHeight: 1.4,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          }}
                        >
                          {msg.content}
                        </div>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.25rem',
                            textAlign: isMe ? 'right' : 'left',
                            padding: '0 0.25rem',
                          }}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '0.75rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Write a message to ${activePartner.name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 1.25rem' }}>
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
