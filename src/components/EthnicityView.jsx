import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import './EthnicityView.css';

const EthnicityView = ({ onBack, onContinue }) => {
  const [selectedEthnicity, setSelectedEthnicity] = useState(null);

  const ethnicities = [
    { id: 'east_asian', label: '동아시아인' },
    { id: 'southeast_asian', label: '동남아시아인' },
    { id: 'south_asian', label: '남아시아인' },
    { id: 'white', label: '백인 / 코카시안' },
    { id: 'black', label: '흑인 / 아프리카계' },
    { id: 'hispanic', label: '히스패닉 / 라틴계' },
    { id: 'middle_eastern', label: '중동 / 북아프리카계' },
    { id: 'indigenous', label: '아메리카 원주민 / 태평양 섬주민' },
    { id: 'mixed', label: '혼혈 / 다인종' },
    { id: 'other', label: '기타 / 해당 없음' }
  ];

  return (
    <div className="ev-wrapper">
      <div className="ev-header">
        <button className="ev-back-btn" onClick={onBack}>
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="ev-content">
        <h1 className="ev-title">
          어떤 <span className="ev-highlight">인종적 배경</span>에 가장 가까우신가요?
        </h1>
        <p className="ev-subtitle">
          모발과 두피의 특성은 인종에 따라 다를 수 있으며, 이는 AI가 분석 결과를 해석하고 맞춤형 관리를 제안하는 데 중요한 역할을 합니다.
        </p>

        <div className="ev-options-list">
          {ethnicities.map((eth) => (
            <div 
              key={eth.id} 
              className={`ev-option-card ${selectedEthnicity === eth.id ? 'selected' : ''}`}
              onClick={() => setSelectedEthnicity(eth.id)}
            >
              <span className="ev-option-label">{eth.label}</span>
              <div className="ev-radio-circle">
                {selectedEthnicity === eth.id && <div className="ev-radio-inner"></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ev-bottom">
        <button 
          className="ev-continue-btn" 
          disabled={!selectedEthnicity}
          onClick={() => onContinue(selectedEthnicity)}
        >
          계속하기
        </button>
      </div>
    </div>
  );
};

export default EthnicityView;
