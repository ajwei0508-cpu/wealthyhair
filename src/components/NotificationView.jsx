import React from 'react';
import './NotificationView.css';
import { ArrowUpRight } from 'lucide-react';

const NotificationView = ({ onContinue }) => {
  return (
    <div className="nv-wrapper">
      <div className="nv-content">
        <h1 className="nv-title">
          성공적인 관리를 위해, 각 단계마다 <span className="nv-highlight">알림</span>을 받을 수 있도록 권한을 허용해 주세요.
        </h1>

        <div className="nv-mockup-area">
          <div className="nv-popup-mockup">
            <svg viewBox="0 0 100 100" className="nv-arrow-svg">
              <path d="M 30,80 Q 20,40 60,70" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              <path d="M 50,70 L 60,70 L 55,60" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <button className="nv-allow-btn" onClick={onContinue}>허용 (Allow)</button>
          </div>
        </div>
      </div>

      <div className="nv-bottom">
        <button className="nv-continue-btn" onClick={onContinue}>
          계속하기
        </button>
      </div>
    </div>
  );
};

export default NotificationView;
