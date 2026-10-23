import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { api } from '../services/api.js';
import {
  Bell,
  CheckCircle2,
  Clock,
  Globe,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, activePersona, switchPersona } = useAuth();
  const { toggleLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser?._id) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    try {
      const res = await api.notifications.getAll(currentUser._id);
      if (res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead(currentUser._id);
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 'var(--sidebar-width)',
        right: 0,
        height: 'var(--navbar-height)',
        background: 'var(--bg-primary)',
        borderBottom: '2px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.5rem',
        zIndex: 100,
      }}
    >
      {/* Left: Department & University context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            background: 'var(--accent)',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '1.2rem',
            color: '#000000',
            border: '2px solid #000000',
            fontFamily: 'Space Grotesk, sans-serif',
          }}
        >
          મ
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: '#FAFAFA',
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
              }}
            >
              {t('portalName')}
            </span>
            <span
              className="badge"
              style={{
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
                background: 'rgba(223, 225, 4, 0.1)',
                fontSize: '0.65rem',
                padding: '0.15rem 0.5rem',
              }}
            >
              GTU & GOG
            </span>
          </div>
          <p
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontWeight: 500,
            }}
          >
            {t('portalTagline')}
          </p>
        </div>
      </div>

      {/* Right: Controls, Role Switcher, Language & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Hackathon Role Simulator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
              fontFamily: 'Space Grotesk, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {t('switchRole')}:
          </span>
          <select
            className="form-select"
            value={activePersona}
            onChange={(e) => switchPersona(e.target.value)}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              width: 'auto',
              cursor: 'pointer',
              borderColor: 'var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              fontFamily: 'Space Grotesk, sans-serif',
              textTransform: 'uppercase',
            }}
          >
            <option value="ALUMNI">Hardik Patel (Alumnus - TCS)</option>
            <option value="STUDENT">Meet Joshi (Student - LDCE)</option>
            <option value="COLLEGE_ADMIN">Prof. Shah (Registrar Admin)</option>
            <option value="STATE_DIRECTOR">Dr. Trivedi (State Director)</option>
            <option value="PENDING_ALUMNI">Rahul Vyas (Pending Verification)</option>
          </select>
        </div>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="btn btn-secondary btn-sm"
          title="Switch language between English & Gujarati"
          style={{ gap: '0.4rem' }}
        >
          <Globe size={14} />
          <span>{t('langToggle')}</span>
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-secondary btn-sm"
            style={{ position: 'relative', padding: '0.55rem' }}
            aria-label="View notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #000000',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="glass-panel animate-fade-in"
              style={{
                position: 'absolute',
                top: 48,
                right: 0,
                width: 340,
                maxHeight: 400,
                overflowY: 'auto',
                padding: '1.25rem',
                zIndex: 200,
                background: 'var(--bg-primary)',
                border: '2px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  borderBottom: '2px solid var(--border-color)',
                  paddingBottom: '0.65rem',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  System Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', textTransform: 'uppercase' }}>
                  No new notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderBottom: '1px solid var(--border-color)',
                      opacity: n.isRead ? 0.6 : 1,
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#FAFAFA' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {n.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Current User Pill / Box */}
        {currentUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'var(--bg-secondary)',
              padding: '0.45rem 0.95rem',
              border: '2px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: 'var(--accent)',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.85rem',
                fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              {currentUser.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#FAFAFA',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}
              >
                <span>{currentUser.name}</span>
                {currentUser.verificationStatus === 'VERIFIED' ? (
                  <CheckCircle2 size={14} color="#10b981" title="GTU Verified" />
                ) : (
                  <Clock size={14} color="#f59e0b" title="Pending Verification" />
                )}
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {currentUser.role} • {currentUser.collegeId?.code || 'GTU'}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
