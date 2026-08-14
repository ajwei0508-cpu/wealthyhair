import React, { useState } from 'react';
import BottomNavBar from './components/BottomNavBar';
import MedicationTab from './components/MedicationTab';
import GuideTab from './components/GuideTab';
import JournalTab from './components/JournalTab';
import ClinicTab from './components/ClinicTab';
import AlarmManager from './components/AlarmManager';
import HairSimTab from './components/HairSimTab';

function DashboardApp() {
  const [activeTab, setActiveTab] = useState('medication');

  const renderTab = () => {
    switch (activeTab) {
      case 'medication':  return <MedicationTab />;
      case 'guide':       return <GuideTab />;
      case 'journal':     return <JournalTab />;
      case 'clinic':      return <ClinicTab />;
      case 'simulator':   return <HairSimTab />;
      case 'diagnosis':
        return (
          <div className="av-content fade-in" style={{ padding: '20px', textAlign: 'center' }}>
            <h1 className="av-title">
              새로운 <span className="av-highlight">진단</span>을 시작하시겠어요?
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: '2rem 0' }}>진단 홈으로 이동하여 정밀 분석을 다시 진행합니다.</p>
            <button className="av-continue-btn" onClick={() => window.location.href = '/'}>
              진단 앱 열기
            </button>
          </div>
        );
      default: return <MedicationTab />;
    }
  };

  return (
    <div className="app-container dashboard-container">
      <AlarmManager />

      <div className="av-wrapper" style={{ paddingBottom: '68px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top bar - only show on tabs without banner */}
        {(activeTab === 'diagnosis') && (
          <div className="av-header" style={{ justifyContent: 'center', padding: '1.5rem 1rem 1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--accent-gold)' }}>
              WealthyHair
            </h2>
          </div>
        )}

        <div className="dashboard-content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {renderTab()}
        </div>
      </div>

      <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default DashboardApp;
