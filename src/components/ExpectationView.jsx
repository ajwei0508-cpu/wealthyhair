import React from 'react';
import './ExpectationView.css';
import { Camera, Stethoscope, ClipboardCheck } from 'lucide-react';

const ExpectationView = ({ onContinue }) => {
  return (
    <div className="ev-wrapper">
      <div className="ev-content">
        <h1 className="ev-title">
          눈에 띄는 <span className="ev-highlight">결과</span>를 보려면 보통 3~6개월이 걸립니다.
        </h1>
        <p className="ev-subtitle">
          너무 일찍 포기하지 마세요. 저희가 모든 중요한 단계를 안내해 드릴게요.
        </p>

        <div className="ev-mockup-container">
          <div className="ev-mockup-phone">
            <h2 className="ev-mockup-title">나의 맞춤 플랜</h2>
            
            <div className="ev-task-card">
              <div className="ev-task-icon"><Camera size={20} color="#cda8fc" /></div>
              <div className="ev-task-info">
                <span className="ev-task-title">첫 번째 스캔 시작하기</span>
                <span className="ev-task-sub">여기서부터 기준이 설정됩니다</span>
              </div>
              <button className="ev-task-btn">시작</button>
            </div>

            <div className="ev-roadmap-section">
              <h3 className="ev-roadmap-title">로드맵</h3>
              
              <div className="ev-timeline">
                <div className="ev-timeline-item">
                  <div className="ev-timeline-date">
                    <span className="ev-date-day">16</span>
                    <span className="ev-date-month">4월</span>
                  </div>
                  <div className="ev-timeline-card">
                    <div className="ev-timeline-icon"><Stethoscope size={16} color="#ffffff" /></div>
                    <span className="ev-timeline-text">전문가 상담</span>
                  </div>
                </div>

                <div className="ev-timeline-item">
                  <div className="ev-timeline-date" style={{ color: '#ffb347' }}>
                    <span className="ev-date-day">16</span>
                    <span className="ev-date-month">4월</span>
                  </div>
                  <div className="ev-timeline-card highlight-card">
                    <div className="ev-timeline-icon" style={{ background: '#ffb347', color: '#111' }}><ClipboardCheck size={16} /></div>
                    <div className="ev-timeline-info">
                      <span className="ev-timeline-text" style={{ color: '#ffffff' }}>초기 결과 확인</span>
                      <span className="ev-timeline-sub">3개월 후</span>
                    </div>
                  </div>
                </div>

                <div className="ev-timeline-item">
                  <div className="ev-timeline-date" style={{ color: '#ffb347' }}>
                    <span className="ev-date-day">16</span>
                    <span className="ev-date-month">2월</span>
                    <span className="ev-date-year">2027</span>
                  </div>
                  <div className="ev-timeline-card highlight-card">
                    <div className="ev-timeline-icon" style={{ background: '#ffb347', color: '#111' }}><ClipboardCheck size={16} /></div>
                    <div className="ev-timeline-info">
                      <span className="ev-timeline-text" style={{ color: '#ffffff' }}>유의미한 결과 확인</span>
                      <span className="ev-timeline-sub">1년 후</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ev-mockup-fade"></div>
          </div>
        </div>
      </div>

      <div className="ev-bottom">
        <button className="ev-continue-btn" onClick={onContinue}>
          계속하기
        </button>
      </div>
    </div>
  );
};

export default ExpectationView;
