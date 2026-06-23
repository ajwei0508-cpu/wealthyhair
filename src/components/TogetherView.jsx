import React from 'react';
import './TogetherView.css';
import { LineChart, Activity, ClipboardList } from 'lucide-react';

const TogetherView = ({ onContinue }) => {
  return (
    <div className="tv-wrapper">
      <div className="tv-content">
        <h1 className="tv-title">
          모든 기록이 <span className="tv-highlight">한곳에 있을 때</span> 더 쉽고 확실해집니다.
        </h1>
        <p className="tv-subtitle">
          검사 결과, 치료 내역, 시술 기록을 한곳에 보관하여 시간 경과에 따른 변화를 명확하게 확인하세요.
        </p>

        <div className="tv-mockup-container">
          <div className="tv-mockup-phone">
            {/* Chart Area */}
            <div className="tv-mockup-chart">
              <svg viewBox="0 0 100 30" className="tv-chart-svg">
                <path d="M 5,25 L 20,22 L 35,24 L 50,18 L 65,15 L 80,10 L 95,12" fill="none" stroke="#D4AF37" strokeWidth="1" />
                <circle cx="5" cy="25" r="1.5" fill="#D4AF37" />
                <circle cx="20" cy="22" r="1.5" fill="#D4AF37" />
                <circle cx="35" cy="24" r="1.5" fill="#D4AF37" />
                <circle cx="50" cy="18" r="1.5" fill="#D4AF37" />
                <circle cx="65" cy="15" r="1.5" fill="#D4AF37" />
                <circle cx="80" cy="10" r="1.5" fill="#D4AF37" />
                <circle cx="95" cy="12" r="1.5" fill="#D4AF37" />
              </svg>
              <div className="tv-chart-labels">
                <span>1개월</span>
                <span>3개월</span>
                <span>1년</span>
                <span className="tv-chart-active">전체</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="tv-mockup-tabs">
              <span className="tv-tab active">전체</span>
              <span className="tv-tab">분석 기록</span>
              <span className="tv-tab">치료 내역</span>
            </div>

            {/* List */}
            <div className="tv-mockup-list">
              {/* Item 1 */}
              <div className="tv-list-item">
                <div className="tv-item-date">
                  <span className="tv-date-day">24</span>
                  <span className="tv-date-month">10월</span>
                </div>
                <div className="tv-item-card">
                  <div className="tv-item-img-placeholder" style={{ background: 'linear-gradient(45deg, #2a1b38, #3b2850)' }}>
                    <Activity size={20} color="#D4AF37" />
                  </div>
                  <div className="tv-item-details">
                    <div className="tv-detail-col">
                      <span className="tv-detail-label">헤어 점수</span>
                      <span className="tv-detail-value">80<span className="tv-detail-sub">/100</span></span>
                    </div>
                    <div className="tv-detail-col">
                      <span className="tv-detail-label">진행 단계</span>
                      <span className="tv-detail-value">2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="tv-list-item">
                <div className="tv-item-date">
                  <span className="tv-date-day">7</span>
                  <span className="tv-date-month">8월</span>
                </div>
                <div className="tv-item-card">
                  <div className="tv-item-icon-box">
                    <ClipboardList size={16} color="#ffffff" />
                  </div>
                  <div className="tv-item-details">
                    <span className="tv-detail-single">모발 이식 수술</span>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="tv-list-item">
                <div className="tv-item-date">
                  <span className="tv-date-day">14</span>
                  <span className="tv-date-month">6월</span>
                </div>
                <div className="tv-item-card" style={{ opacity: 0.6 }}>
                  <div className="tv-item-img-placeholder" style={{ background: 'linear-gradient(45deg, #1f1429, #2d1d3b)' }}>
                    <Activity size={20} color="#a0a0a0" />
                  </div>
                  <div className="tv-item-details">
                    <div className="tv-detail-col">
                      <span className="tv-detail-label">헤어 점수</span>
                      <span className="tv-detail-value">60<span className="tv-detail-sub">/100</span></span>
                    </div>
                    <div className="tv-detail-col">
                      <span className="tv-detail-label">진행 단계</span>
                      <span className="tv-detail-value">3</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fade effect at bottom */}
            <div className="tv-mockup-fade"></div>
          </div>
        </div>
      </div>

      <div className="tv-bottom">
        <button className="tv-continue-btn" onClick={onContinue}>
          계속하기
        </button>
      </div>
    </div>
  );
};

export default TogetherView;
