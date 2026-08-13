import React from 'react';
import { Home, Pill, BookOpen, Camera, MapPin } from 'lucide-react';
import './BottomNavBar.css';

const BottomNavBar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'diagnosis', label: '진단 홈', icon: <Home size={22} /> },
    { id: 'medication', label: '복약 관리', icon: <Pill size={22} /> },
    { id: 'guide', label: '탈모 백과', icon: <BookOpen size={22} /> },
    { id: 'journal', label: '성장 일지', icon: <Camera size={22} /> },
    { id: 'clinic', label: '병원 찾기', icon: <MapPin size={22} /> },
  ];

  return (
    <div className="bottom-nav-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <div className="nav-icon">{tab.icon}</div>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavBar;
