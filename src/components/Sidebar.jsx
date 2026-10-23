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
        background: 'var(--bg-primary)',
        borderRight: '2px solid var(--border-color)',
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
          borderBottom: '2px solid var(--border-color)',
          gap: '0.85rem',
        }}
      >
        <div
          style={{
            background: 'var(--accent)',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000000',
            fontWeight: 900,
            fontSize: '1rem',
            fontFamily: 'Space Grotesk, sans-serif',
            border: '2px solid #000000',
          }}
        >
          GS
        </div>
        <div>
          <h2
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#FAFAFA',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            MahaSetu
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 3 }}>
            <span style={{ width: 6, height: 6, background: 'var(--accent)', display: 'inline-block' }}></span>
            <span
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              GTU STATE NETWORK
            </span>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <div style={{ flex: 1, padding: '1.25rem 0.75rem' }}>
        {navSections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                letterSpacing: '0.09em',
                padding: '0 0.75rem 0.5rem',
                textTransform: 'uppercase',
                fontFamily: 'Space Grotesk, sans-serif',
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
                    padding: '0.65rem 0.85rem',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? '4px solid #000000' : '4px solid transparent',
                    color: isActive ? '#000000' : 'var(--text-muted)',
                    fontSize: '0.825rem',
                    fontWeight: isActive ? 700 : 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    marginBottom: 3,
                    fontFamily: 'Space Grotesk, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                      e.currentTarget.style.color = 'var(--accent)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={16} color={isActive ? '#000000' : 'currentColor'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.625rem',
                        padding: '0.15rem 0.45rem',
                        background: isActive ? '#000000' : 'var(--border-color)',
                        color: isActive ? 'var(--accent)' : '#FAFAFA',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
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
          padding: '1.25rem 1rem',
          borderTop: '2px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          fontFamily: 'Space Grotesk, sans-serif',
          textTransform: 'uppercase',
          fontWeight: 700,
          letterSpacing: '0.06em',
        }}
      >
        Govt of Gujarat • Higher Education
      </div>
    </aside>
  );
}
