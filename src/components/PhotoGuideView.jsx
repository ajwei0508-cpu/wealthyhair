import React from 'react';
import './PhotoGuideView.css';
import { Sparkles, Sun, RefreshCcw } from 'lucide-react';

const PhotoGuideView = ({ onContinue }) => {
  return (
    <div className="pgv-wrapper">
      <div className="pgv-content">
        <h1 className="pgv-title">
          <span className="pgv-highlight">좋은 사진</span>이 정확한 분석의 핵심입니다.
        </h1>
        <p className="pgv-subtitle">
          스캔을 시작하기 전에:
        </p>

        <div className="pgv-list">
          <div className="pgv-list-item">
            <div className="pgv-icon-box"><Sparkles size={20} color="#cda8fc" /></div>
            <span className="pgv-list-text">렌즈를 깨끗한 천으로 닦아주세요</span>
          </div>
          <div className="pgv-list-item">
            <div className="pgv-icon-box"><Sun size={20} color="#cda8fc" /></div>
            <span className="pgv-list-text">밝은 자연광이 있는 곳에서 촬영해 주세요</span>
          </div>
          <div className="pgv-list-item">
            <div className="pgv-icon-box"><RefreshCcw size={20} color="#cda8fc" /></div>
            <span className="pgv-list-text">매번 비슷한 환경에서 스캔해 주세요</span>
          </div>
        </div>

        <div className="pgv-graphic-area">
          <div className="pgv-phone-mockup">
            <div className="pgv-phone-lens"></div>
            <div className="pgv-cloth-mockup"></div>
          </div>
        </div>
      </div>

      <div className="pgv-bottom">
        <button className="pgv-continue-btn" onClick={onContinue}>
          스캔 시작하기
        </button>
      </div>
    </div>
  );
};

export default PhotoGuideView;
