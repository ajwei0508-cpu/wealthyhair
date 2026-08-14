import React from 'react';
import './BottomNavBar.css';

// Custom SVG Icons
const DiagnosisIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4l3 3"/>
  </svg>
);

const MedicationIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/>
    <circle cx="18" cy="18" r="3"/>
    <path d="M10 2v4M14 2v4M8 10h8M8 14h2M10 18H6"/>
  </svg>
);

const GuideIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    <line x1="9" y1="7" x2="15" y2="7"/>
    <line x1="9" y1="11" x2="15" y2="11"/>
  </svg>
);

// Center simulator icon (special, larger)
const SimulatorIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
    <path d="M5 3L3 5M19 3l2 2"/>
    <path d="M12 2v2M7 7l-2-2M17 7l2-2"/>
  </svg>
);

const JournalIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const ClinicIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const BottomNavBar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'diagnosis',   label: '진단 홈',   icon: DiagnosisIcon },
    { id: 'medication',  label: '복약 관리',  icon: MedicationIcon },
    { id: 'simulator',   label: 'AI 예측',   icon: SimulatorIcon, isCenter: true },
    { id: 'journal',     label: '성장 일지',  icon: JournalIcon },
    { id: 'clinic',      label: '병원 찾기',  icon: ClinicIcon },
    { id: 'guide',       label: '탈모 백과',  icon: GuideIcon },
  ];

  return (
    <div className="bottom-nav-bar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''} ${tab.isCenter ? 'nav-center' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-label={tab.label}
          >
            {tab.isCenter ? (
              <div className="nav-center-bubble">
                <Icon size={28} />
              </div>
            ) : (
              <div className="nav-icon">
                <Icon size={22} />
              </div>
            )}
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNavBar;
