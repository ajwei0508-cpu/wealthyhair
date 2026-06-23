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
            {/* Simple stylized H or WealthyHair Logo */}
            <span className="ob-logo-icon">W</span>
          </div>
          <h1 className="ob-title">부자머리 AI</h1>
        </div>

        {/* Feature List */}
        <div className="ob-features">
          <div className="ob-feature-item">
            <ShieldCheck className="ob-feature-icon" size={20} />
            <span>15년 임상 경력 한의사의 탈모 진단 노하우 적용</span>
          </div>
          <div className="ob-feature-item">
            <ScanFace className="ob-feature-icon" size={20} />
            <span>세계 최고 수준의 AI 두피·모발 스캔 정확도</span>
          </div>
          <div className="ob-feature-item">
            <Database className="ob-feature-icon" size={20} />
            <span>한국인 중심으로 헤어라인 분석 데이터 학습</span>
          </div>
        </div>

        {/* Badge */}
        <div className="ob-badge-container">
          <div className="ob-laurel left"></div>
          <div className="ob-badge-content">
            <h2>#1 탈모 분석 AI 앱</h2>
            <div className="ob-stars">
              <Star fill="#D4AF37" color="#D4AF37" size={16} />
              <Star fill="#D4AF37" color="#D4AF37" size={16} />
              <Star fill="#D4AF37" color="#D4AF37" size={16} />
              <Star fill="#D4AF37" color="#D4AF37" size={16} />
              <Star fill="#D4AF37" color="#D4AF37" size={16} />
            </div>
          </div>
          <div className="ob-laurel right"></div>
        </div>

        {/* Reviews Horizontal Scroll */}
        <div className="ob-reviews-slider">
          <div className="ob-review-card">
            <div className="ob-review-header">
              <span className="ob-reviewer">김**</span>
              <span className="ob-flag">🇰🇷</span>
            </div>
            <div className="ob-review-stars">
              <Star fill="#D4AF37" color="#D4AF37" size={12} />
              <Star fill="#D4AF37" color="#D4AF37" size={12} />
              <Star fill="#D4AF37" color="#D4AF37" size={12} />
              <Star fill="#D4AF37" color="#D4AF37" size={12} />
              <Star fill="#D4AF37" color="#D4AF37" size={12} />
            </div>
            <p className="ob-review-text">
              "병원 가기 전에 집에서 정확하게 진단해 볼 수 있어서 너무 좋았습니다. 전체적인 매핑이 아주 선명해요."
            </p>
          </div>

          <div className="ob-review-card">
            <div className="ob-review-header">
              <span className="ob-reviewer">이**</span>
              <span className="ob-flag">🇰🇷</span>
            </div>
            <div className="ob-review-stars">
              <Star fill="#D4AF37" color="#D4AF37" size={12} />
              <Star fill="#D4AF37" color="#D4AF37" size={12} />
              <Star fill="#D4AF37" color="#D4AF37" size={12} />
              <Star fill="#D4AF37" color="#D4AF37" size={12} />
              <Star fill="#D4AF37" color="#D4AF37" size={12} />
            </div>
            <p className="ob-review-text">
              "다른 앱들도 써봤지만 이게 훨씬 진짜 같아요. 15년 경력 한의사 원장님 데이터라니 믿음이 갑니다."
            </p>
          </div>
        </div>
        
        {/* Dots */}
        <div className="ob-dots">
          <span className="ob-dot active"></span>
          <span className="ob-dot"></span>
          <span className="ob-dot"></span>
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
