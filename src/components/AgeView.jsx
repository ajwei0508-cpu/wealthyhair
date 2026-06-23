import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Info } from 'lucide-react';
import './AgeView.css';

const AgeView = ({ onBack, onContinue }) => {
  const [selectedAge, setSelectedAge] = useState(30);
  const scrollRef = useRef(null);
  
  const MIN_AGE = 15;
  const MAX_AGE = 80;
  const ages = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => i + MIN_AGE);

  // Initialize scroll position on mount
  useEffect(() => {
    if (scrollRef.current) {
      // Each item is 80px wide. Default age 30 is at index (30 - 15) = 15
      const itemWidth = 80;
      const targetScroll = (30 - MIN_AGE) * itemWidth;
      scrollRef.current.scrollLeft = targetScroll;
    }
  }, []);

  const handleScroll = (e) => {
    const container = e.target;
    const itemWidth = 80;
    // Calculate which item is closest to the center
    const centerIndex = Math.round(container.scrollLeft / itemWidth);
    const newAge = MIN_AGE + centerIndex;
    
    if (newAge >= MIN_AGE && newAge <= MAX_AGE && newAge !== selectedAge) {
      setSelectedAge(newAge);
    }
  };

  return (
    <div className="av-wrapper">
      <div className="av-header">
        <button className="av-back-btn" onClick={onBack}>
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="av-content">
        <h1 className="av-title">
          현재 <span className="av-highlight">나이</span>가 어떻게 되시나요?
        </h1>

        {/* Horizontal Age Picker */}
        <div className="av-picker-wrapper">
          <div 
            className="av-picker-container" 
            ref={scrollRef}
            onScroll={handleScroll}
          >
            {ages.map((age) => {
              const isActive = age === selectedAge;
              const isNear = Math.abs(age - selectedAge) === 1;
              const isFar = Math.abs(age - selectedAge) === 2;
              
              let className = "av-number";
              if (isActive) className += " active";
              else if (isNear) className += " near";
              else if (isFar) className += " far";
              else className += " hidden";

              return (
                <div key={age} className="av-picker-item">
                  <div className={className}>{age}</div>
                  <div className="av-ticks">
                    <div className="av-tick small"></div>
                    <div className="av-tick small"></div>
                    <div className={`av-tick main ${isActive ? 'active' : ''}`}></div>
                    <div className="av-tick small"></div>
                    <div className="av-tick small"></div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Center Indicator Line */}
          <div className="av-center-indicator"></div>
        </div>

        {/* Info Card */}
        <div className="av-info-card">
          <div className="av-info-header">
            <div className="av-info-icon">
              <Info size={14} color="#cda8fc" />
            </div>
            <span>왜 나이를 묻나요?</span>
          </div>
          <p className="av-info-text">
            탈모는 어느 연령에서나 발생할 수 있지만, 나이에 따라 진행 속도와 가장 효과적인 치료 및 관리 방법이 달라질 수 있기 때문입니다.
          </p>
        </div>
      </div>

      <div className="av-bottom">
        <button className="av-continue-btn" onClick={() => onContinue(selectedAge)}>
          계속하기
        </button>
      </div>
    </div>
  );
};

export default AgeView;
