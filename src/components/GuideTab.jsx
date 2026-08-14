import React, { useState } from 'react';
import { medicalData } from '../data/medicalGuideData';
import './GuideTab.css';
import './MedicationTab.css';

const GuideTab = () => {
  const [activeAccordion, setActiveAccordion] = useState(null);

  return (
    <div className="tab-content fade-in guide-tab" style={{ padding: 0 }}>
      {/* Header Banner */}
      <div className="tab-banner">
        <img src="/assets/banners/banner_guide.jpg" alt="탈모 백과" className="tab-banner-img" />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">탈모 백과</h1>
          <p className="tab-banner-sub">논문 기반 전문 지식을 한눈에</p>
        </div>
      </div>

      <div style={{ padding: '0 1rem 80px' }}>

        <h3 className="category-title" style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-gold)', marginTop: '1.5rem', marginBottom: '1rem' }}>
          탈모약 정보 가이드
        </h3>

        {medicalData.map((category, idx) => {
          const isOpen = activeAccordion === idx;

          if (category.isSpecial) {
            return (
              <div key={idx} className="accordion-item glass-panel" style={{ border: '1px solid var(--accent-gold)' }}>
                <div className="accordion-header" onClick={() => setActiveAccordion(isOpen ? null : idx)}>
                  <span style={{ color: 'var(--accent-gold)' }}>{category.type}</span>
                  <span>{isOpen ? '−' : '+'}</span>
                </div>
                {isOpen && (
                  <div className="accordion-content fade-in">
                    <div className="info-block">
                      <span className="info-label">기본 원리</span>
                      <p>{category.efficacy}</p>
                    </div>
                    <div className="info-block">
                      <span className="info-label warning">미녹시딜 농도 증량</span>
                      <p>{category.sideEffects}</p>
                    </div>
                    <div className="info-block">
                      <span className="info-label danger">경구약 성분 변경 (피나 &#8594; 두타)</span>
                      <p>{category.contraindications}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={idx} className="accordion-item glass-panel">
              <div className="accordion-header" onClick={() => setActiveAccordion(isOpen ? null : idx)}>
                <span>{category.type}</span>
                <span>{isOpen ? '−' : '+'}</span>
              </div>
              {isOpen && (
                <div className="accordion-content fade-in">
                  <div className="info-block" style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '4px' }}>
                    <h5 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>{category.original.manufacturer}</h5>
                    <p style={{ fontSize: '1rem', fontWeight: 'bold' }}>{category.original.name}</p>
                  </div>
                  <div className="info-block">
                    <span className="info-label">국내 제네릭 (카피약)</span>
                    <p style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '0.5rem' }}>
                      {category.generics.map(gen => (
                        <span key={gen} style={{ background: 'var(--border-light)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{gen}</span>
                      ))}
                    </p>
                  </div>
                  <div className="info-block">
                    <span className="info-label">효능 및 역할</span>
                    <p>{category.efficacy}</p>
                  </div>
                  <div className="info-block">
                    <span className="info-label warning">심층 부작용</span>
                    <p>{category.sideEffects}</p>
                  </div>
                  <div className="info-block">
                    <span className="info-label danger">금기 및 주의사항</span>
                    <p>{category.contraindications}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="guide-section" style={{ marginTop: '2rem' }}>
          <h3 className="category-title" style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-gold)' }}>
            단계별 탈모 자가진단
          </h3>
          <div className="glass-panel text-center" style={{ padding: '2rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>전문가 일러스트 및 진단 기능 준비중</p>
            <div style={{ fontSize: '3rem', margin: '1rem 0' }}>📊</div>
            <button className="av-continue-btn" style={{ width: '100%', padding: '1rem' }}>나의 단계 설정하기</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GuideTab;
