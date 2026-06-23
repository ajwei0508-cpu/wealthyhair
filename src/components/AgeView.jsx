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
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = targetScroll;
        }
      }, 50);
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

  const handleItemClick = (age) => {
    const itemWidth = 80;
    const targetScroll = (age - MIN_AGE) * itemWidth;
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      setSelectedAge(age);
    }
  };

  // Mouse Drag to Scroll Logic
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
    scrollRef.current.style.scrollBehavior = 'auto';
    scrollRef.current.style.scrollSnapType = 'none';
  };

  const snapToNearest = () => {
    if (scrollRef.current) {
      const itemWidth = 80;
      const centerIndex = Math.round(scrollRef.current.scrollLeft / itemWidth);
      scrollRef.current.scrollTo({
        left: centerIndex * itemWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleMouseLeaveOrUp = () => {
    if (isDragging) {
      setIsDragging(false);
      scrollRef.current.style.scrollBehavior = 'smooth';
      scrollRef.current.style.scrollSnapType = 'x mandatory';
      snapToNearest();
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
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
            className={`av-picker-container ${isDragging ? 'dragging' : ''}`}
            ref={scrollRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
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
                <div key={age} className="av-picker-item" onClick={() => handleItemClick(age)} style={{ cursor: 'pointer' }}>
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
              <Info size={14} color="#D4AF37" />
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
