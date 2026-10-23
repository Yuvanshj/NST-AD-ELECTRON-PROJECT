import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { api } from '../services/api.js';
import {
  Bell,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Globe,
  User,
  ChevronDown,
  Building2,
  GraduationCap,
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, activePersona, switchPersona } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
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
        background: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        zIndex: 100,
      }}
    >
      {/* Left: Department & University context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)',
            width: 38,
            height: 38,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1rem',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          મ
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
              {t('portalName')}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                padding: '0.15rem 0.5rem',
                borderRadius: 4,
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              GTU & GOG
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {t('portalTagline')}
          </p>
        </div>
      </div>

      {/* Right: Controls, Role Switcher, Language & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Hackathon Role Simulator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {t('switchRole')}:
          </span>
          <select
            className="form-select"
            value={activePersona}
            onChange={(e) => switchPersona(e.target.value)}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              width: 'auto',
              cursor: 'pointer',
              borderColor: 'rgba(59, 130, 246, 0.4)',
              background: '#131e38',
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
          style={{ gap: '0.35rem' }}
        >
          <Globe size={14} />
          <span>{t('langToggle')}</span>
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-secondary btn-sm"
            style={{ position: 'relative', padding: '0.45rem' }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                top: 42,
                right: 0,
                width: 320,
                maxHeight: 400,
                overflowY: 'auto',
                padding: '1rem',
                zIndex: 200,
                background: '#0d1527',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No new notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    style={{
                      padding: '0.6rem 0.5rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      opacity: n.isRead ? 0.6 : 1,
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{n.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Current User Pill */}
        {currentUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.35rem 0.8rem',
              borderRadius: '9999px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            >
              {currentUser.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {currentUser.name}
                {currentUser.verificationStatus === 'VERIFIED' ? (
                  <CheckCircle2 size={13} color="#10b981" title="GTU Verified" />
                ) : (
                  <Clock size={13} color="#f59e0b" title="Pending Verification" />
                )}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {currentUser.role} • {currentUser.collegeId?.code || 'GTU'}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
