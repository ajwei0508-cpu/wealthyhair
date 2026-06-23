import React, { useState } from 'react';
import { ChevronLeft, Info } from 'lucide-react';
import './DurationView.css';

const DurationView = ({ onBack, onContinue }) => {
  const [selectedDuration, setSelectedDuration] = useState(null);

  const options = [
    { id: 'less_6m', label: '6개월 미만' },
    { id: '6_12m', label: '6~12개월 전' },
    { id: '1_3y', label: '1~3년 전' },
    { id: 'over_3y', label: '3년 이상' },
    { id: 'not_sure', label: '잘 모르겠습니다' }
  ];

  return (
    <div className="dv-wrapper">
      <div className="dv-header">
        <button className="dv-back-btn" onClick={onBack}>
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="dv-content">
        <h1 className="dv-title">
          탈모를 처음 <span className="dv-highlight">인지한 시기</span>는 언제인가요?
        </h1>

        <div className="dv-options-list">
          {options.map((option) => (
            <div 
              key={option.id} 
              className={`dv-option-card ${selectedDuration === option.id ? 'selected' : ''}`}
              onClick={() => setSelectedDuration(option.id)}
            >
              <span className="dv-option-label">{option.label}</span>
              <div className="dv-radio-circle">
                {selectedDuration === option.id && <div className="dv-radio-inner"></div>}
              </div>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div className="dv-info-card">
          <div className="dv-info-header">
            <div className="dv-info-icon">
              <Info size={14} color="#D4AF37" />
            </div>
            <span>왜 중요한가요?</span>
          </div>
          <p className="dv-info-text">
            약 60~80%의 사람들이 눈에 띄게 머리숱이 줄어든 후에야 관리를 시작합니다. 인지 시기에 따라 가장 적절한 관리법이 달라집니다.
          </p>
        </div>
      </div>

      <div className="dv-bottom">
        <button 
          className="dv-continue-btn" 
          disabled={!selectedDuration}
          onClick={() => onContinue(selectedDuration)}
        >
          계속하기
        </button>
      </div>
    </div>
  );
};

export default DurationView;
