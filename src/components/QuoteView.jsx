import React from 'react';
import { Quote } from 'lucide-react';
import './QuoteView.css';

const QuoteView = ({ onContinue }) => {
  return (
    <div className="qv-wrapper">
      <div className="qv-content">
        <div className="qv-quote-icon">
          <Quote size={40} color="#6b528b" fill="#6b528b" />
        </div>
        
        <h1 className="qv-quote-text">
          "어떤 치료든 가장 중요한 것은 탈모를 인지한 즉시 <span className="qv-highlight">시작하는</span> 것입니다."
        </h1>

        <div className="qv-divider"></div>

        <div className="qv-source-info">
          <a href="#" className="qv-article-link">
            얇아지는 모발을 지키기에 아직 늦지 않았습니다
          </a>
          <p className="qv-date">2023년 1월 1일</p>
          <p className="qv-author">하이디 고드먼 (Heidi Godman), 편집장</p>
          
          <div className="qv-publisher">
            <div className="qv-publisher-logo-placeholder">
              <span className="qv-shield">🛡️</span>
            </div>
            <div className="qv-publisher-text">
              <span className="qv-pub-name">Harvard Health Publishing</span>
              <span className="qv-pub-sub">HARVARD MEDICAL SCHOOL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="qv-bottom">
        <button className="qv-continue-btn" onClick={onContinue}>
          계속하기
        </button>
      </div>
    </div>
  );
};

export default QuoteView;
