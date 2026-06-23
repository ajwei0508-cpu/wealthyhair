import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import './ProcedureView.css';

const ProcedureView = ({ onBack, onContinue }) => {
  const [selectedProcedure, setSelectedProcedure] = useState(null);

  const options = [
    { id: 'yes_planning', label: '네, 계획하고 있습니다' },
    { id: 'not_sure', label: '아직 확실하지 않습니다' },
    { id: 'monitoring', label: '일단 상태를 지켜보는 중입니다' }
  ];

  return (
    <div className="pv-wrapper">
      <div className="pv-header">
        <button className="pv-back-btn" onClick={onBack}>
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="pv-content">
        <h1 className="pv-title">
          현재 <span className="pv-highlight">의학적 치료나 시술</span>을 계획 중이신가요?
        </h1>
        <p className="pv-subtitle">
          예: 모발 이식 수술, 두피 정밀 검사 등
        </p>

        <div className="pv-options-list">
          {options.map((option) => (
            <div 
              key={option.id} 
              className={`pv-option-card ${selectedProcedure === option.id ? 'selected' : ''}`}
              onClick={() => setSelectedProcedure(option.id)}
            >
              <span className="pv-option-label">{option.label}</span>
              <div className="pv-radio-circle">
                {selectedProcedure === option.id && <div className="pv-radio-inner"></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pv-bottom">
        <button 
          className="pv-continue-btn" 
          disabled={!selectedProcedure}
          onClick={() => onContinue(selectedProcedure)}
        >
          계속하기
        </button>
      </div>
    </div>
  );
};

export default ProcedureView;
