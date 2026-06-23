import React, { useState } from 'react';
import { ChevronLeft, Share } from 'lucide-react';
import './ResultView.css';

const ResultView = ({ images = {}, onReset, diagnosisData, onProceedToAvatar }) => {
  const [mainTab, setMainTab] = useState('Overview');
  const [subTabMap, setSubTabMap] = useState({
    Overview: 'Front',
    Hairline: 'All',
    Density: 'Top'
  });

  const handleSubTabChange = (tab) => {
    setSubTabMap(prev => ({ ...prev, [mainTab]: tab }));
  };

  const getSubTabs = () => {
    switch(mainTab) {
      case 'Overview': return ['Front', 'Left', 'Right', 'Top'];
      case 'Hairline': return ['All', 'Lower', 'Highest', 'None'];
      case 'Density': return ['Front', 'Top'];
      default: return [];
    }
  };

  // Maps UI subTab to actual image keys
  const getCurrentImageKey = () => {
    const subTab = subTabMap[mainTab];
    if (mainTab === 'Hairline') return 'front'; // Hairline mostly uses front
    const keyMap = { 'Front': 'front', 'Left': 'left', 'Right': 'right', 'Top': 'vertex' };
    return keyMap[subTab] || 'front';
  };

  const currentImageKey = getCurrentImageKey();
  const currentImageSrc = images[currentImageKey] || 'https://via.placeholder.com/640x800/111111/333333?text=No+Image';

  const renderImageOverlay = () => {
    if (mainTab === 'Overview') {
      return (
        <div className="resv-overlay-overview"></div>
      );
    }
    if (mainTab === 'Hairline') {
      return (
        <svg className="resv-svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 20,40 Q 50,20 80,40" fill="none" stroke="#cda8fc" strokeWidth="1" strokeDasharray="2,2" />
          <circle cx="20" cy="40" r="1.5" fill="#cda8fc" />
          <circle cx="50" cy="27" r="1.5" fill="#cda8fc" />
          <circle cx="80" cy="40" r="1.5" fill="#cda8fc" />
        </svg>
      );
    }
    if (mainTab === 'Density') {
      return (
        <div className="resv-overlay-density"></div>
      );
    }
    return null;
  };

  return (
    <div className="resv-wrapper">
      <div className="resv-top-bar">
        <button className="resv-icon-btn" onClick={onReset}>
          <ChevronLeft size={24} />
        </button>
        <h2 className="resv-header-title">AI Scan Result</h2>
        <button className="resv-icon-btn">
          <Share size={20} />
        </button>
      </div>

      <div className="resv-main-tabs">
        {['Overview', 'Hairline', 'Density'].map(tab => (
          <button 
            key={tab}
            className={`resv-tab-btn ${mainTab === tab ? 'active' : ''}`}
            onClick={() => setMainTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="resv-content">
        <div className="resv-image-area">
          <img src={currentImageSrc} alt="Scan Result" className="resv-main-img" />
          {renderImageOverlay()}
        </div>

        <div className="resv-sub-tabs">
          {getSubTabs().map(tab => (
            <button 
              key={tab}
              className={`resv-sub-tab-btn ${subTabMap[mainTab] === tab ? 'active' : ''}`}
              onClick={() => handleSubTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="resv-data-area">
          {mainTab === 'Overview' && (
            <>
              <div className="resv-data-row">
                <div className="resv-data-label">Is your hair thinning?</div>
                <div className="resv-data-value highlight">Yes</div>
              </div>
              <div className="resv-data-row">
                <div className="resv-data-label">Hair Loss Stage</div>
                <div className="resv-data-sub">This is based on the Norwood Scale</div>
              </div>
            </>
          )}

          {mainTab === 'Hairline' && (
            <div className="resv-data-row">
              <div>
                <div className="resv-data-label">Hairline Type</div>
                <div className="resv-data-sub">Classification</div>
              </div>
              <div className="resv-data-value" style={{color: '#cda8fc'}}>Receding</div>
            </div>
          )}

          {mainTab === 'Density' && (
            <>
              <div className="resv-density-section">
                <div className="resv-data-label">Density Color Index</div>
                <div className="resv-density-bar"></div>
                <div className="resv-density-labels">
                  <span>LOW</span>
                  <span>HIGH</span>
                </div>
              </div>
              <div className="resv-data-row" style={{marginTop: '20px'}}>
                <div>
                  <div className="resv-data-label">Crown Density</div>
                  <div className="resv-data-sub">Hair Heatmap</div>
                </div>
                <div className="resv-data-value">High</div>
              </div>
            </>
          )}

          <button className="resv-btn-unlock" onClick={onProceedToAvatar}>
            Unlock all features (나의 아바타 보기)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
