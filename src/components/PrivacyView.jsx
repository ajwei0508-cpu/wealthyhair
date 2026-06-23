import React from 'react';
import { ChevronLeft, UserX, UserSquare2, Smartphone, ImageOff, Shield } from 'lucide-react';
import './PrivacyView.css';

const PrivacyView = ({ onBack, onContinue }) => {
  return (
    <div className="pv-wrapper">
      <div className="pv-header">
        <button className="pv-back-btn" onClick={onBack}>
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="pv-content">
        <h1 className="pv-title">
          탈모 고민이 얼마나 <span className="pv-highlight">개인적인</span> 문제인지 잘 알고 있습니다.
        </h1>
        <p className="pv-subtitle">
          그렇기 때문에 고객님의 데이터를 절대 서버에 저장하거나 외부로 유출하지 않습니다.
        </p>

        <div className="pv-feature-list">
          <div className="pv-feature-item">
            <div className="pv-icon-box">
              <UserX size={20} color="#D4AF37" />
            </div>
            <span><strong>이름</strong>을 수집하지 않습니다</span>
          </div>

          <div className="pv-feature-item">
            <div className="pv-icon-box">
              <UserSquare2 size={20} color="#D4AF37" />
            </div>
            <span><strong>개인정보</strong>를 요구하지 않습니다</span>
          </div>

          <div className="pv-feature-item">
            <div className="pv-icon-box">
              <Smartphone size={20} color="#D4AF37" />
            </div>
            <span>모든 데이터는 기기에 <strong>안전하게 비공개로 유지</strong>됩니다</span>
          </div>

          <div className="pv-feature-item">
            <div className="pv-icon-box">
              <ImageOff size={20} color="#D4AF37" />
            </div>
            <span>고객님의 <strong>사진을 절대 저장하지 않습니다</strong></span>
          </div>
        </div>

        {/* Big Shield Graphic */}
        <div className="pv-shield-container">
          <div className="pv-shield-glow"></div>
          <div className="pv-shield-icon-wrapper" style={{ border: 'none', background: 'transparent' }}>
             <img src="/logo.png" alt="보안 로고" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
          </div>
        </div>
      </div>

      <div className="pv-bottom">
        <button className="pv-continue-btn" onClick={onContinue}>
          동의하고 계속하기
        </button>
      </div>
    </div>
  );
};

export default PrivacyView;
