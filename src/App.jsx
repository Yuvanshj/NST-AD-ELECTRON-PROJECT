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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Navbar />
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
