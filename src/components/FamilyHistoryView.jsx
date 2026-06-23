import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import './FamilyHistoryView.css';

const FamilyHistoryView = ({ onBack, onContinue }) => {
  const [selectedHistory, setSelectedHistory] = useState(null);

  const options = [
    { id: 'father', label: '네, 친가 쪽에 있습니다' },
    { id: 'mother', label: '네, 외가 쪽에 있습니다' },
    { id: 'both', label: '네, 양가 모두 있습니다' },
    { id: 'not_sure', label: '잘 모르겠습니다' },
    { id: 'none', label: '아니요, 없습니다' }
  ];

  return (
    <div className="fhv-wrapper">
      <div className="fhv-header">
        <button className="fhv-back-btn" onClick={onBack}>
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="fhv-content">
        <h1 className="fhv-title">
          <span className="fhv-highlight">가족</span> 중에 탈모가 있으신 분이 있나요?
        </h1>
        <p className="fhv-subtitle">
          유전적 요인은 탈모의 주요 원인 중 하나입니다. 가족력을 알면 더 정확한 예측이 가능합니다.
        </p>

        <div className="fhv-options-list">
          {options.map((option) => (
            <div 
              key={option.id} 
              className={`fhv-option-card ${selectedHistory === option.id ? 'selected' : ''}`}
              onClick={() => setSelectedHistory(option.id)}
            >
              <span className="fhv-option-label">{option.label}</span>
              <div className="fhv-radio-circle">
                {selectedHistory === option.id && <div className="fhv-radio-inner"></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fhv-bottom">
        <button 
          className="fhv-continue-btn" 
          disabled={!selectedHistory}
          onClick={() => onContinue(selectedHistory)}
        >
          계속하기
        </button>
      </div>
    </div>
  );
};

export default FamilyHistoryView;
