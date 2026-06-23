import React from 'react';
import './ScanIntroView.css';
import { Camera } from 'lucide-react';

const ScanIntroView = ({ onContinue }) => {
  return (
    <div className="siv-wrapper">
      <div className="siv-content">
        <h1 className="siv-title">
          현재 모발 상태를 <span className="siv-highlight">이해하는 것</span>부터 시작됩니다.
        </h1>
        <p className="siv-subtitle">
          첫 번째 스캔을 시작해 볼까요?
        </p>

        <div className="siv-graphic-area">
          <div className="siv-scan-graphic">
            {/* A simple CSS graphic representing a person scanning */}
            <div className="siv-head-silhouette"></div>
            <div className="siv-phone-silhouette">
              <Camera size={24} color="#111" />
            </div>
          </div>
        </div>
      </div>

      <div className="siv-bottom">
        <button className="siv-continue-btn" onClick={onContinue}>
          계속하기
        </button>
      </div>
    </div>
  );
};

export default ScanIntroView;
