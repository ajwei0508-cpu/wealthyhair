// src/components/AlopeciaAreataView.jsx
// 국제 표준 SALT (Severity of Alopecia Tool) 척도 기반 원형탈모 정밀 진단앱 (핵심 요약형 UI)

import React, { useState, useRef } from 'react';
import {
  Scan, Upload, Sparkles, ArrowLeft, ShieldAlert
} from 'lucide-react';
import {
  SALT_QUADRANTS,
  analyzeAlopeciaAreataImage,
  calculateFinalAlopeciaAreataReport,
  generateVerifiedAlopeciaSample
} from '../utils/alopeciaAreataAnalysis';
import { PrivacyMembershipNoticeCard } from './AuthGate';

const AlopeciaAreataView = ({ onBack = null, user = null, onRequireAuth = null }) => {
  const [scanMode, setScanMode] = useState('single'); // 'single' | 'salt4'
  const [activeQuadrant, setActiveQuadrant] = useState('top');
  const [quadrantImages, setQuadrantImages] = useState({
    top: null,
    back: null,
    left: null,
    right: null
  });
  const [quadrantResults, setQuadrantResults] = useState({
    top: null,
    back: null,
    left: null,
    right: null
  });

  const [checklist, setChecklist] = useState({
    nailPitting: false,
    atopyOrThyroid: false,
    eyebrowLoss: false,
    ophiasisBand: false,
    rapidPullTest: false
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const fileInputRef = useRef(null);

  const handleTriggerUpload = () => {
    if (!user && onRequireAuth) {
      onRequireAuth({
        mode: 'signup',
        featureName: '원형탈모(SALT) 정밀 진단앱'
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e, targetQuad = activeQuadrant) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setQuadrantImages(prev => ({ ...prev, [targetQuad]: dataUrl }));
      setFinalReport(null);
    };
    reader.readAsDataURL(file);
  };

  const executeClinicalPreset = async (presetType, label) => {
    setIsAnalyzing(true);
    try {
      let sampleUrl = null;
      if (presetType === 'normal_s0') {
        sampleUrl = '/guides/guide_vertex.jpg';
      } else {
        sampleUrl = await generateVerifiedAlopeciaSample(presetType);
      }

      if (sampleUrl) {
        const nextImages = { top: sampleUrl, back: null, left: null, right: null };
        setQuadrantImages(nextImages);
        setActiveQuadrant('top');
        const topAnalysis = await analyzeAlopeciaAreataImage(sampleUrl, 'top');
        const nextResults = { top: topAnalysis, back: null, left: null, right: null };
        setQuadrantResults(nextResults);
        const report = calculateFinalAlopeciaAreataReport(nextResults, checklist);
        report.presetLabel = label;
        setFinalReport(report);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadClinicalPreset = (presetType, label) => {
    if (!user && onRequireAuth) {
      onRequireAuth({
        mode: 'signup',
        featureName: '원형탈모(SALT) 정밀 진단앱',
        onSuccess: () => executeClinicalPreset(presetType, label)
      });
      return;
    }
    executeClinicalPreset(presetType, label);
  };

  const executeDiagnosis = async () => {
    const hasAnyImage = Object.values(quadrantImages).some(Boolean);
    if (!hasAnyImage) {
      alert('진단할 사진을 등록하거나 상단의 샘플을 선택해 주세요.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const nextResults = { top: null, back: null, left: null, right: null };
      for (const q of SALT_QUADRANTS) {
        if (quadrantImages[q.id]) {
          nextResults[q.id] = await analyzeAlopeciaAreataImage(quadrantImages[q.id], q.id);
        }
      }
      setQuadrantResults(nextResults);
      const report = calculateFinalAlopeciaAreataReport(nextResults, checklist);
      setFinalReport(report);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunDiagnosis = () => {
    if (!user && onRequireAuth) {
      onRequireAuth({
        mode: 'signup',
        featureName: '원형탈모(SALT) 정밀 진단앱',
        onSuccess: () => executeDiagnosis()
      });
      return;
    }
    executeDiagnosis();
  };

  const handleReset = () => {
    setQuadrantImages({ top: null, back: null, left: null, right: null });
    setQuadrantResults({ top: null, back: null, left: null, right: null });
    setFinalReport(null);
  };

  const toggleCheck = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentResult = quadrantResults[activeQuadrant];
  const currentImg = currentResult?.annotatedImage || quadrantImages[activeQuadrant];

  return (
    <div className="fade-in" style={{ paddingBottom: '90px', color: '#fff', background: '#000' }}>
      {/* 깔끔한 배너 */}
      <div className="tab-banner" style={{ position: 'relative' }}>
        <img
          src="/assets/banners/banner_simulator.jpg"
          alt="원형탈모 AI 진단"
          className="tab-banner-img"
        />
        <div className="tab-banner-overlay">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(0,0,0,0.65)',
                border: '1px solid #D4AF37',
                color: '#D4AF37',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '6px',
                width: 'fit-content'
              }}
            >
              <ArrowLeft size={13} /> 일반 탈모 진단으로
            </button>
          )}
          <h1 className="tab-banner-title">원형탈모(SALT) 정밀 진단</h1>
          <p className="tab-banner-sub">국제 SALT 척도(S0~S5) · 탈모반 크기 및 활성도 분석</p>
        </div>
      </div>

      <div style={{ padding: '14px' }}>
        <PrivacyMembershipNoticeCard
          user={user}
          featureType="areata"
          onOpenAuth={onRequireAuth}
        />

        {/* 원형탈모 진단 결과물 샘플 요약 카드 */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(22, 22, 26, 0.98), rgba(14, 14, 18, 0.98))',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={14} /> 원형탈모 진단 결과 샘플 미리보기
            </span>
            <span style={{ fontSize: '0.66rem', color: '#999' }}>SALT S0~S5 판정</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
            {[
              { label: 'SALT 등급', val: 'S1 (경증 · 8.5%)', color: '#D4AF37' },
              { label: '병변 크기', val: 'Ø 2.4cm (1개)', color: '#81C784' },
              { label: '권장 치료', val: '국소 주사 + 외용제', color: '#64B5F6' }
            ].map((m, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '7px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.64rem', color: '#888' }}>{m.label}</div>
                <div style={{ fontSize: '0.73rem', fontWeight: 800, color: m.color, marginTop: '2px' }}>{m.val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {[
              { key: 'single_s1', label: '단발성 S1 샘플' },
              { key: 'multiple_s2', label: '다발성 S2 샘플' },
              { key: 'normal_s0', label: '정상 대조군 S0' }
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleLoadClinicalPreset(item.key, item.label)}
                style={{
                  padding: '7px 6px',
                  background: '#1c1c22',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '6px',
                  color: '#eee',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 스캔 모드 선택 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setScanMode('single')}
            style={{
              padding: '9px',
              borderRadius: '8px',
              border: scanMode === 'single' ? '1.5px solid #D4AF37' : '1px solid #2b2b2b',
              background: scanMode === 'single' ? 'rgba(212, 175, 55, 0.16)' : '#121212',
              color: scanMode === 'single' ? '#D4AF37' : '#999',
              fontWeight: 700,
              fontSize: '0.76rem',
              cursor: 'pointer'
            }}
          >
            🎯 단일 부위 스캔
          </button>
          <button
            type="button"
            onClick={() => setScanMode('salt4')}
            style={{
              padding: '9px',
              borderRadius: '8px',
              border: scanMode === 'salt4' ? '1.5px solid #D4AF37' : '1px solid #2b2b2b',
              background: scanMode === 'salt4' ? 'rgba(212, 175, 55, 0.16)' : '#121212',
              color: scanMode === 'salt4' ? '#D4AF37' : '#999',
              fontWeight: 700,
              fontSize: '0.76rem',
              cursor: 'pointer'
            }}
          >
            🌐 4구역 SALT 스캔
          </button>
        </div>

        {scanMode === 'salt4' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
            {SALT_QUADRANTS.map(q => {
              const isSelected = activeQuadrant === q.id;
              const hasPhoto = Boolean(quadrantImages[q.id]);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setActiveQuadrant(q.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid #D4AF37' : '1px solid #2a2a2a',
                    background: isSelected ? '#1c180f' : '#121212',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: isSelected ? '#D4AF37' : '#ccc' }}>
                    {q.label.split('(')[0]}
                  </span>
                  <span style={{ fontSize: '0.64rem', color: hasPhoto ? '#00E676' : '#888' }}>
                    {hasPhoto ? '✓ 등록됨' : `${q.weightPct}%`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 이미지 업로드 박스 */}
        <div style={{
          background: '#111',
          border: '1.5px dashed rgba(212, 175, 55, 0.45)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e, activeQuadrant)}
          />

          {currentImg ? (
            <div>
              <img
                src={currentImg}
                alt="Alopecia Areata Scan"
                style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block', background: '#050505' }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#161616',
                borderTop: '1px solid #2a2a2a'
              }}>
                <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 600 }}>
                  {SALT_QUADRANTS.find(q => q.id === activeQuadrant)?.label.split('(')[0]}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleTriggerUpload}
                    style={{ padding: '5px 10px', background: '#262626', color: '#fff', border: '1px solid #444', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    사진 변경
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{ padding: '5px 10px', background: 'rgba(255,82,82,0.15)', color: '#ff8a80', border: '1px solid rgba(255,82,82,0.4)', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    초기화
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div onClick={handleTriggerUpload} style={{ padding: '28px 16px', textAlign: 'center', cursor: 'pointer' }}>
              <Upload size={28} color="#D4AF37" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>
                원형탈모 의심 부위 사진 등록
              </div>
              <div style={{ fontSize: '0.72rem', color: '#888' }}>
                동전 모양의 탈모반 경계가 보이도록 촬영해 주세요
              </div>
            </div>
          )}
        </div>

        {/* 간결한 체크리스트 (알약 버튼 형태) */}
        <div style={{
          background: '#121216',
          border: '1px solid #262626',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '14px'
        }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#D4AF37', marginBottom: '8px' }}>
            🔍 동반 증상 체크 (해당 항목 탭)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { key: 'rapidPullTest', label: '주변 모발 쉽게 뽑힘(활성기)' },
              { key: 'nailPitting', label: '손발톱 미세 패임' },
              { key: 'atopyOrThyroid', label: '아토피·갑상선 질환력' },
              { key: 'ophiasisBand', label: '귀옆·뒷머리 띠 형태' },
              { key: 'eyebrowLoss', label: '눈썹·체모 동반 탈락' }
            ].map(item => {
              const checked = checklist[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleCheck(item.key)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '999px',
                    border: checked ? '1px solid #D4AF37' : '1px solid #333',
                    background: checked ? 'rgba(212, 175, 55, 0.18)' : '#18181c',
                    color: checked ? '#D4AF37' : '#aaa',
                    fontSize: '0.72rem',
                    fontWeight: checked ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {checked ? '✓ ' : '+ '}{item.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleRunDiagnosis}
          disabled={isAnalyzing}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}
        >
          <Scan size={17} />
          {isAnalyzing
            ? '원형탈모 SALT 분석 중...'
            : user
            ? '원형탈모 SALT 점수 산출하기'
            : '🔒 회원가입 후 원형탈모 진단 결과 확인하기'}
        </button>

        {/* 진단 결과 리포트 */}
        {finalReport && (
          <div className="fade-in" style={{
            background: '#111',
            border: '1.5px solid #D4AF37',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{
                fontSize: '0.7rem',
                padding: '3px 9px',
                borderRadius: '12px',
                background: 'rgba(212, 175, 55, 0.18)',
                color: '#D4AF37',
                fontWeight: 700
              }}>
                AI 원형탈모 SALT 판독 결과
              </span>
              {finalReport.presetLabel && (
                <span style={{ fontSize: '0.7rem', color: '#999' }}>{finalReport.presetLabel}</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: '#181818', padding: '10px', borderRadius: '8px', border: '1px solid #2b2b2b' }}>
                <div style={{ fontSize: '0.68rem', color: '#888' }}>국제 SALT 등급</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: finalReport.severityColor, marginTop: '3px' }}>
                  {finalReport.saltGrade.split(' ')[0]} ({finalReport.saltScore}점)
                </div>
                <div style={{ fontSize: '0.66rem', color: '#aaa', marginTop: '2px' }}>{finalReport.severityLabel}</div>
              </div>

              <div style={{ background: '#181818', padding: '10px', borderRadius: '8px', border: '1px solid #2b2b2b' }}>
                <div style={{ fontSize: '0.68rem', color: '#888' }}>검출 병변 & 면적</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#fff', marginTop: '3px' }}>
                  {finalReport.totalPatchCount}개 ({finalReport.totalAreaCm2} cm²)
                </div>
                <div style={{ fontSize: '0.66rem', color: '#D4AF37', marginTop: '2px' }}>최대 직경 Ø {finalReport.maxDiameterCm} cm</div>
              </div>
            </div>

            {finalReport.riskFactors.length > 0 && (
              <div style={{
                background: 'rgba(255, 82, 82, 0.1)',
                border: '1px solid rgba(255, 82, 82, 0.35)',
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#ff8a80', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldAlert size={14} /> 확인된 주의 인자
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.72rem', color: '#ffcdd2', lineHeight: 1.5 }}>
                  {finalReport.riskFactors.map((rf, i) => <li key={i}>{rf}</li>)}
                </ul>
              </div>
            )}

            <div style={{ background: '#161616', border: '1px solid #2b2b2b', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#D4AF37', marginBottom: '6px' }}>
                🏥 권장 치료 프로토콜
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem', color: '#ddd', lineHeight: 1.55 }}>
                {finalReport.treatmentRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    dangerouslySetInnerHTML={{
                      __html: `• ${rec.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#D4AF37">$1</strong>')}`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlopeciaAreataView;
