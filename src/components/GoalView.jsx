import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import './GoalView.css';

const GoalView = ({ onBack, onContinue }) => {
  const [selectedGoals, setSelectedGoals] = useState([]);

  const goals = [
    { id: 'understand', label: '탈모가 진행 중인지 확인하고 싶어요' },
    { id: 'density_health', label: '모발 밀도와 두피 건강을 개선하고 싶어요' },
    { id: 'slow_stop', label: '탈모 진행을 늦추거나 멈추고 싶어요' },
    { id: 'hairline', label: '헤어라인을 개선하고 싶어요' }
  ];

  const toggleGoal = (id) => {
    setSelectedGoals(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  return (
    <div className="gv-wrapper">
      <div className="gv-header">
        <button className="gv-back-btn" onClick={onBack}>
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="gv-content">
        <h1 className="gv-title">
          앱을 통해 어떤 <span className="gv-highlight">목표</span>를 달성하고 싶으신가요?
        </h1>
        <p className="gv-subtitle">
          (중복 선택 가능)
        </p>

        <div className="gv-options-list">
          {goals.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <div 
                key={goal.id} 
                className={`gv-option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleGoal(goal.id)}
              >
                <span className="gv-option-label">{goal.label}</span>
                <div className={`gv-checkbox ${isSelected ? 'checked' : ''}`}>
                  {isSelected && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.5 5L4.5 8L10.5 2" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="gv-bottom">
        <button 
          className="gv-continue-btn" 
          disabled={selectedGoals.length === 0}
          onClick={() => onContinue(selectedGoals)}
        >
          계속하기
        </button>
      </div>
    </div>
  );
};

export default GoalView;
