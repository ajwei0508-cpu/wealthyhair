import React from 'react';
import { ShieldCheck, ScanFace, Database, Star } from 'lucide-react';
import './OnboardingView.css';

const OnboardingView = ({ onStart }) => {
  return (
    <div className="ob-wrapper">
      <div className="ob-content">
        {/* Logo & Title */}
        <div className="ob-header">
          <div className="ob-logo">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#F9E29D', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#B8860B', stopOpacity: 1 }} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Shield Outer Path (Classic Crest) */}
              <path d="M15 25 L50 10 L85 25 C85 65, 50 95, 50 95 C50 95, 15 65, 15 25 Z" 
                    stroke="url(#goldGradient)" 
                    strokeWidth="4" 
                    fill="rgba(212, 175, 55, 0.05)" 
                    strokeLinejoin="round" 
                    filter="url(#glow)"/>
                    
              {/* Dashed Inner Path */}
              <path d="M22 29 L50 17 L78 29 C78 61, 50 86, 50 86 C50 86, 22 61, 22 29 Z" 
                    stroke="url(#goldGradient)" 
                    strokeWidth="1.5" 
                    strokeDasharray="4,4" 
                    fill="none" 
                    strokeLinejoin="round" />

              {/* Stylized 'W' integrated with hair-like flowing curves, scaled down and centered */}
              <g transform="translate(15, 20) scale(0.7)">
                <path d="M15 30 
                         C 15 30, 25 80, 35 80 
                         C 45 80, 48 40, 50 40 
                         C 52 40, 55 80, 65 80 
                         C 75 80, 85 30, 85 30" 
                      stroke="url(#goldGradient)" 
                      strokeWidth="6" 
                      fill="none" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" />
                <path d="M22 35 
                         C 22 35, 30 75, 38 75 
                         C 46 75, 48 45, 50 45" 
                      stroke="url(#goldGradient)" 
                      strokeWidth="2" 
                      fill="none" 
                      opacity="0.8" />
                <path d="M78 35 
                         C 78 35, 70 75, 62 75 
                         C 54 75, 52 45, 50 45" 
                      stroke="url(#goldGradient)" 
                      strokeWidth="2" 
                      fill="none" 
                      opacity="0.8" />
              </g>
            </svg>
          </div>
          <h1 className="ob-title">모발부자 AI</h1>
        </div>

        {/* Feature List */}
        <div className="ob-features">
          <div className="ob-feature-item">
            <ShieldCheck className="ob-feature-icon" size={20} />
            <span>15년 임상 경력 한의사의 탈모 진단 노하우 적용</span>
          </div>
          <div className="ob-feature-item">
            <ScanFace className="ob-feature-icon" size={20} />
            <span>국제 탈모 진단법의 AI 두피 모발 스캔 정확도</span>
          </div>
          <div className="ob-feature-item">
            <Database className="ob-feature-icon" size={20} />
            <span>한국인 중심으로 헤어라인 분석 데이터 학습</span>
          </div>
        </div>

        {/* Reservation Badge */}
        <div className="ob-reservation-badge">
          탈모 분석 앱 1위 예약
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="ob-bottom">
        <button className="ob-continue-btn" onClick={onStart}>
          시작하기
        </button>
        <p className="ob-terms">
          계속 진행하시면 당사의 개인정보 처리방침 및 이용약관에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
};

export default OnboardingView;
