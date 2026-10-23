import React from 'react';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  UserCheck,
  ShieldAlert,
  Users,
  Compass,
  MessageSquare,
  Briefcase,
  HeartHandshake,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  BarChart3,
  TrendingUp,
  FileCode2,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const isRegistrarOrDirector =
    currentUser?.role === 'COLLEGE_ADMIN' ||
    currentUser?.role === 'STATE_DIRECTOR' ||
    currentUser?.role === 'SUPER_ADMIN';

  const navSections = [
    {
      heading: 'IDENTITY & TRUST',
      items: [
        { id: 'profile', label: t('navProfile'), icon: UserCheck },
        {
          id: 'verification',
          label: t('navVerificationQueue'),
          icon: ShieldAlert,
          badge: isRegistrarOrDirector ? 'ADMIN' : null,
          highlight: isRegistrarOrDirector,
        },
      ],
    },
    {
      heading: 'NETWORKING & MENTORSHIP',
      items: [
        { id: 'directory', label: t('navDirectory'), icon: Users },
        { id: 'mentorship', label: t('navMentorship'), icon: Compass },
        { id: 'chat', label: t('navChat'), icon: MessageSquare },
      ],
    },
    {
      heading: 'CAREERS & REFERRALS',
      items: [{ id: 'jobs', label: t('navJobs'), icon: Briefcase }],
    },
    {
      heading: 'GIVING & TRANSPARENCY',
      items: [
        { id: 'donations', label: t('navDonations'), icon: HeartHandshake },
        { id: 'transparency', label: t('navTransparency'), icon: FileSpreadsheet },
      ],
    },
    {
      heading: 'COMMUNITY & CAMPUS',
      items: [
        { id: 'events', label: t('navEvents'), icon: Calendar },
        { id: 'stories', label: t('navStories'), icon: Sparkles },
        { id: 'surveys', label: t('navSurveys'), icon: BarChart3 },
      ],
    },
    {
      heading: 'STATE GOVERNANCE',
      items: [
        { id: 'analytics', label: t('navAnalytics'), icon: TrendingUp },
        { id: 'audit', label: t('navAudit'), icon: FileCode2 },
      ],
    },
  ];

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: '#090e1c',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 110,
        overflowY: 'auto',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: 'var(--navbar-height)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #2563eb, #059669)',
            width: 34,
            height: 34,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
          }}
        >
          GS
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            MahaSetu
          </h2>
          <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>
            GTU STATE NETWORK
          </span>
        </div>
      </div>

      {/* Nav groups */}
      <div style={{ flex: 1, padding: '1.25rem 0.85rem' }}>
        {navSections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                letterSpacing: '0.08em',
                padding: '0 0.75rem 0.4rem',
              }}
            >
              {section.heading}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 8,
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)'
                      : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.825rem',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Icon size={16} color={isActive ? '#60a5fa' : 'currentColor'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        padding: '0.15rem 0.4rem',
                        borderRadius: 4,
                        background: '#3b82f6',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Gujarat Dept Footer */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.2)',
          fontSize: '0.7rem',
          color: 'var(--text-dim)',
          textAlign: 'center',
        }}
      >
        Govt of Gujarat • Higher Education
      </div>
    </aside>
  );
}
