import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function ChatModule({ initialRecipient }) {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
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
    <div className="page-wrapper animate-fade-in" style={{ height: 'calc(100vh - var(--navbar-height) - 40px - 5rem)', paddingBottom: 0 }}>
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          height: '100%',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Left Sidebar: Conversations */}
        <div
          style={{
            width: 340,
            borderRight: '2px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-primary)',
          }}
        >
          <div style={{ padding: '1.5rem', borderBottom: '2px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Direct Messages</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>GTU Verified Network</p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
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
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      background: isSelected ? 'var(--accent)' : 'transparent',
                      borderLeft: isSelected ? '4px solid #000000' : '4px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        background: isSelected ? '#000000' : 'var(--bg-secondary)',
                        color: isSelected ? 'var(--accent)' : '#FAFAFA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1rem',
                        fontFamily: 'Space Grotesk, sans-serif',
                        border: '2px solid',
                        borderColor: isSelected ? '#000000' : 'var(--border-color)',
                      }}
                    >
                      {partner?.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: isSelected ? '#000000' : '#FAFAFA', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {partner?.name}
                          </span>
                          {partner?.verificationStatus === 'VERIFIED' && (
                            <CheckCircle2 size={13} color={isSelected ? '#000000' : '#10b981'} />
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: isSelected ? '#222222' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
          {activePartner ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: '1.25rem 2rem',
                  borderBottom: '2px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: 'var(--accent)',
                      color: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      fontFamily: 'Space Grotesk, sans-serif',
                      border: '2px solid #000000',
                    }}
                  >
                    {activePartner.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {activePartner.name}
                      {activePartner.verificationStatus === 'VERIFIED' && (
                        <CheckCircle2 size={15} color="#10b981" />
                      )}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {activePartner.role} • {activePartner.collegeId?.name || 'GTU'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                    <MessageSquare size={44} style={{ margin: '0 auto 0.75rem', color: 'var(--accent)' }} />
                    <p style={{ textTransform: 'uppercase', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>No messages yet. Say hello to {activePartner.name}!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = (msg.senderId?._id || msg.senderId) === currentUser._id;
                    return (
                      <div
                        key={idx}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                        }}
                      >
                        <div
                          style={{
                            background: isMe ? 'var(--accent)' : 'var(--bg-primary)',
                            color: isMe ? '#000000' : '#FAFAFA',
                            padding: '0.85rem 1.25rem',
                            border: '2px solid',
                            borderColor: isMe ? 'var(--accent)' : 'var(--border-color)',
                            fontSize: '0.95rem',
                            fontWeight: isMe ? 600 : 400,
                            lineHeight: 1.5,
                          }}
                        >
                          {msg.content}
                        </div>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--text-dim)',
                            marginTop: '0.35rem',
                            textAlign: isMe ? 'right' : 'left',
                            fontFamily: 'Space Grotesk, sans-serif',
                            textTransform: 'uppercase',
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

              {/* Chat Input Bar */}
              <div
                style={{
                  padding: '1.25rem 2rem',
                  borderTop: '2px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                }}
              >
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`Message ${activePartner.name}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 1.75rem' }}>
                    <Send size={16} /> Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ margin: '0 auto 1rem', color: 'var(--accent)' }} />
              <h3 style={{ textTransform: 'uppercase', fontFamily: 'Space Grotesk, sans-serif' }}>Select a conversation to start chatting</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
