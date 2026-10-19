import React from 'react';
import './BottomNavBar.css';

const DiagnosisIcon = ({ size = 21 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
  </svg>
);

const AreataIcon = ({ size = 21 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="6" strokeDasharray="3 2" />
    <circle cx="16.5" cy="15.5" r="3.5" />
    <path d="M4 20c1.5-3 4.5-4.5 8-4.5" />
  </svg>
);

const SasangIcon = ({ size = 21 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 20a5 5 0 0 1 0-10 5 5 0 0 0 0-10" />
    <circle cx="12" cy="7" r="1.2" fill="currentColor" />
    <circle cx="12" cy="17" r="1.2" fill="currentColor" />
  </svg>
);

const SimulatorIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const MedicationIcon = ({ size = 21 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M9 16l2 2 4-4" />
  </svg>
);

const GuideIcon = ({ size = 21 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const BottomNavBar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'diagnosis', label: '남·여진단', icon: DiagnosisIcon },
    { id: 'areata', label: '원형탈모', icon: AreataIcon },
    { id: 'simulator', label: '전후·예측', icon: SimulatorIcon, isCenter: true },
    { id: 'sasang', label: '사상체질', icon: SasangIcon },
    { id: 'guide', label: '금기·백과', icon: GuideIcon },
    { id: 'medication', label: '복약·케어', icon: MedicationIcon },
  ];

  return (
    <div className="bottom-nav-bar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id || (tab.id === 'medication' && (activeTab === 'journal' || activeTab === 'clinic'));
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''} ${tab.isCenter ? 'nav-center' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-label={tab.label}
          >
            {tab.isCenter ? (
              <div className="nav-center-bubble">
                <Icon size={26} />
              </div>
            ) : (
              <div className="nav-icon">
                <Icon size={21} />
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
