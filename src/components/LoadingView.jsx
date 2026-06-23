import React, { useState, useEffect } from 'react';
import './LoadingView.css';

const LoadingView = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("ANALYZING ALL VIEWS OF YOUR HAIR TO ENSURE THE MOST ACCURATE RESULTS");
  const [subText, setSubText] = useState("Analyzing all views...");

  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1;
      if (currentProgress > 100) {
        clearInterval(interval);
        setTimeout(onComplete, 500);
      } else {
        setProgress(currentProgress);
        
        if (currentProgress < 25) {
          setLoadingText("정확한 결과를 위해 모든 각도의 모발을 분석 중입니다");
          setSubText("모든 뷰를 분석하는 중...");
        } else if (currentProgress < 50) {
          setLoadingText("헤어라인 후퇴 및 탈모 징후를 확인 중입니다");
          setSubText("탈모 단계를 확인하는 중...");
        } else if (currentProgress < 75) {
          setLoadingText("모발 밀도를 분석하여 탈모 단계를 결정합니다");
          setSubText("모발 밀도를 평가하는 중...");
        } else {
          setLoadingText("탈모 관리 계획을 세우고 결과를 검증합니다");
          setSubText("결과를 마무리하는 중...");
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  // SVG Circular Progress
  const radius = 100;
  const strokeWidth = 2;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="lv-wrapper">
      <div className="lv-content">
        <h3 className="lv-top-text">{loadingText}</h3>
        
        <div className="lv-progress-container">
          {/* Tick marks around circle like a clock */}
          <div className="lv-ticks">
            {Array.from({length: 60}).map((_, i) => (
              <div 
                key={i} 
                className="lv-tick" 
                style={{
                  transform: `rotate(${i * 6}deg) translateY(-110px)`,
                  opacity: (i / 60) * 100 <= progress ? 1 : 0.2
                }}
              ></div>
            ))}
          </div>

          <div className="lv-progress-circle-wrap">
            <svg height={radius * 2} width={radius * 2}>
              <circle
                stroke="rgba(205, 168, 252, 0.2)"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke="#cda8fc"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.1s linear' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            <div className="lv-progress-text">{progress}%</div>
          </div>
        </div>
      </div>

      <div className="lv-bottom">
        <div className="lv-avatars">
          <img src="https://via.placeholder.com/40/222/fff?text=User" alt="user" className="lv-avatar lv-avatar-user" />
          <img src="https://via.placeholder.com/40/cda8fc/111?text=AI" alt="ai" className="lv-avatar lv-avatar-ai" />
        </div>
        <div className="lv-sub-text">{subText}</div>
        <div className="lv-stay-text">이 화면을 유지해 주세요</div>
      </div>
    </div>
  );
};

export default LoadingView;
