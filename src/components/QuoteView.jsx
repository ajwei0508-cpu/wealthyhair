import React from 'react';
import { Quote } from 'lucide-react';
import './QuoteView.css';

const QuoteView = ({ onContinue }) => {
  return (
    <div className="qv-wrapper">
      <div className="qv-content">
        <div className="qv-quote-icon">
          <Quote size={40} color="#D4AF37" fill="#D4AF37" />
        </div>
        
        <h1 className="qv-quote-text" style={{ fontSize: '24px', lineHeight: '1.5' }}>
          "나무를 심기에 가장 좋았던 때는 10년 전이다. 두 번째로 좋은 때는 바로 <span className="qv-highlight">지금</span>이다"
          <br /><br />
          "내일 빠질 머리를 오늘 지켜주는 것 그게 탈모 회복의 <span className="qv-highlight">시작</span>이다."
        </h1>

        <div className="qv-divider" style={{ marginTop: '30px', marginBottom: '20px' }}></div>

        <div className="qv-source-info" style={{ textAlign: 'right' }}>
          <p className="qv-author" style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-secondary)' }}>-개발자-</p>
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
