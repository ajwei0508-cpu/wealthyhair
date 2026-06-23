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
            <img src="/logo.png" alt="모발부자 AI 로고" style={{ width: '120px', height: '120px', objectFit: 'contain', mixBlendMode: 'screen' }} />
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
