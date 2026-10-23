import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';

// Modules
import ProfileModule from './components/modules/ProfileModule.jsx';
import VerificationQueueModule from './components/modules/VerificationQueueModule.jsx';
import DirectoryModule from './components/modules/DirectoryModule.jsx';
import MentorshipModule from './components/modules/MentorshipModule.jsx';
import ChatModule from './components/modules/ChatModule.jsx';
import JobsModule from './components/modules/JobsModule.jsx';
import DonationsModule from './components/modules/DonationsModule.jsx';
import TransparencyModule from './components/modules/TransparencyModule.jsx';
import EventsModule from './components/modules/EventsModule.jsx';
import StoriesModule from './components/modules/StoriesModule.jsx';
import SurveysModule from './components/modules/SurveysModule.jsx';
import AnalyticsModule from './components/modules/AnalyticsModule.jsx';
import AuditLogsModule from './components/modules/AuditLogsModule.jsx';

function AppContent() {
  const [activeTab, setActiveTab] = useState('directory');
  const [chatRecipient, setChatRecipient] = useState(null);

  const handleStartChat = (alumnus) => {
    setChatRecipient(alumnus);
    setActiveTab('chat');
  };

  const renderModule = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileModule />;
      case 'verification':
        return <VerificationQueueModule />;
      case 'directory':
        return <DirectoryModule onStartChat={handleStartChat} />;
      case 'mentorship':
        return <MentorshipModule />;
      case 'chat':
        return <ChatModule initialRecipient={chatRecipient} />;
      case 'jobs':
        return <JobsModule />;
      case 'donations':
        return <DonationsModule />;
      case 'transparency':
        return <TransparencyModule />;
      case 'events':
        return <EventsModule />;
      case 'stories':
        return <StoriesModule />;
      case 'surveys':
        return <SurveysModule />;
      case 'analytics':
        return <AnalyticsModule />;
      case 'audit':
        return <AuditLogsModule />;
      default:
        return <DirectoryModule onStartChat={handleStartChat} />;
    }
  };

  return (
    <div className="app-container">
      {/* Brutalist Noise Texture Overlay */}
      <svg className="noise-overlay" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <filter id="kinetic-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#kinetic-noise)" />
      </svg>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-content">
        <Navbar />

        {/* High-Energy Kinetic Marquee Ticker */}
        <div className="kinetic-ticker-bar" role="marquee" aria-label="Gujarat State Alumni Network Activity Ticker">
          <div className="ticker-track">
            <div className="ticker-item">
              <span>GUJARAT TECHNICAL UNIVERSITY • MAHASETU STATE ALUMNI PORTAL</span>
              <span className="ticker-separator"></span>
              <span>100% SECTION 80G TAX-EXEMPT ENDOWMENTS</span>
              <span className="ticker-separator"></span>
              <span>IMMUTABLE CONVOCATION REGISTRY VERIFICATION</span>
              <span className="ticker-separator"></span>
              <span>ALUMNI REFERRALS ACROSS TCS • ISRO • ADANI • L&T • RELIANCE</span>
              <span className="ticker-separator"></span>
              <span>PUBLIC ESCROW DISBURSEMENT LEDGER ONLINE</span>
              <span className="ticker-separator"></span>
              <span>50+ GUJARAT ENGINEERING COLLEGES CONNECTED</span>
              <span className="ticker-separator"></span>
            </div>
            {/* Duplicate for infinite loop */}
            <div className="ticker-item" aria-hidden="true">
              <span>GUJARAT TECHNICAL UNIVERSITY • MAHASETU STATE ALUMNI PORTAL</span>
              <span className="ticker-separator"></span>
              <span>100% SECTION 80G TAX-EXEMPT ENDOWMENTS</span>
              <span className="ticker-separator"></span>
              <span>IMMUTABLE CONVOCATION REGISTRY VERIFICATION</span>
              <span className="ticker-separator"></span>
              <span>ALUMNI REFERRALS ACROSS TCS • ISRO • ADANI • L&T • RELIANCE</span>
              <span className="ticker-separator"></span>
              <span>PUBLIC ESCROW DISBURSEMENT LEDGER ONLINE</span>
              <span className="ticker-separator"></span>
              <span>50+ GUJARAT ENGINEERING COLLEGES CONNECTED</span>
              <span className="ticker-separator"></span>
            </div>
          </div>
        </div>

        {renderModule()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
