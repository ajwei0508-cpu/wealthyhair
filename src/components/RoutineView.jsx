import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import './RoutineView.css';

const RoutineView = ({ onBack, onContinue }) => {
  const [selectedRoutine, setSelectedRoutine] = useState(null);

  const options = [
    { id: 'yes_routine', label: '네, 꾸준히 관리하고 있습니다' },
    { id: 'planning', label: '아니요, 하지만 곧 시작할 계획입니다' },
    { id: 'deciding', label: '잘 모르겠습니다, 아직 고민 중입니다' },
    { id: 'no_plan', label: '아니요, 앞으로도 계획이 없습니다' }
  ];

  return (
    <div className="rv-wrapper">
      <div className="rv-header">
        <button className="rv-back-btn" onClick={onBack}>
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="rv-content">
        <h1 className="rv-title">
          현재 진행 중인 <span className="rv-highlight">탈모 관리 루틴</span>이 있으신가요?
        </h1>
        <p className="rv-subtitle">
          예: 약물 복용 (피나스테리드, 미녹시딜 등) 또는 보조 치료 (MTS 롤러, 적외선 치료, 영양제 등)
        </p>

        <div className="rv-options-list">
          {options.map((option) => (
            <div 
              key={option.id} 
              className={`rv-option-card ${selectedRoutine === option.id ? 'selected' : ''}`}
              onClick={() => setSelectedRoutine(option.id)}
            >
              <span className="rv-option-label">{option.label}</span>
              <div className="rv-radio-circle">
                {selectedRoutine === option.id && <div className="rv-radio-inner"></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rv-bottom">
        <button 
          className="rv-continue-btn" 
          disabled={!selectedRoutine}
          onClick={() => onContinue(selectedRoutine)}
        >
          계속하기
        </button>
      </div>
    </div>
  );
};

export default RoutineView;
