// src/components/AlopeciaAreataView.jsx
// 국제 표준 SALT (Severity of Alopecia Tool) 척도 및 Connected-Component 비전 알고리즘 기반 원형탈모 정밀 진단앱

import React, { useState, useRef } from 'react';
import {
  Scan, Upload, Sparkles, CheckCircle2, AlertTriangle, RotateCcw,
  ArrowLeft, ShieldAlert, Layers, Activity
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

  // 임상 예후 체크리스트 (대한모발학회 원형탈모 중증도 보정 기준)
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
        featureName: '원형탈모 SALT 정밀 진단앱 (개인 병변 사진 분석)'
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
        sampleUrl = '/dataset/samples/crown_clinical/normal_vertex.jpg';
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
        featureName: '원형탈모 SALT 정밀 탈모진단앱',
        onSuccess: () => executeClinicalPreset(presetType, label)
      });
      return;
    }
    executeClinicalPreset(presetType, label);
  };

  const executeDiagnosis = async () => {
    const hasAnyImage = Object.values(quadrantImages).some(Boolean);
    if (!hasAnyImage) {
      alert('진단할 두피 사진을 최소 1장 이상 등록하거나 상단의 [임상 검증 샘플]을 선택해 주세요.');
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
        featureName: '원형탈모 SALT 정밀 탈모진단앱',
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
      {/* Luxury Banner */}
      <div className="tab-banner" style={{ position: 'relative' }}>
        <img
          src="/assets/banners/banner_alopecia_areata.jpg"
          alt="원형탈모 AI 진단"
          className="tab-banner-img"
          onError={(e) => { e.currentTarget.src = '/assets/banners/banner_simulator.jpg'; }}
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
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '8px',
                width: 'fit-content'
              }}
            >
              <ArrowLeft size={14} /> 일반 탈모 진단으로 돌아가기
            </button>
          )}
          <h1 className="tab-banner-title">원형탈모 AI 정밀 진단</h1>
          <p className="tab-banner-sub">국제 SALT 척도(S0~S5) & 원형 탈모반 직경·변연부 활성도 계측</p>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* 개인정보 보호 안내문 및 회원가입 유도 카드 */}
        <PrivacyMembershipNoticeCard
          user={user}
          featureType="areata"
          onOpenAuth={onRequireAuth}
        />

        {/* 의학적 개요 카드 */}
        <div style={{
          background: '#111',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Activity size={16} color="#D4AF37" />
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#D4AF37' }}>
              원형탈모(Alopecia Areata) 자가면역 스캔 프로토콜
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: '#bbb', lineHeight: 1.6 }}>
            원형탈모는 일반 안드로겐성(남성·여성형) 탈모와 달리 자가면역 T세포가 모낭을 공격하여 <strong>경계가 명확한 원형·타원형 무모반(Glabrous patch)</strong>을 형성합니다. 본 엔진은 Connected-Component 세그멘테이션으로 탈모반의 개수, 직경(cm), 면적(cm²), 변연부 홍반 활성도 및 국제 표준 <strong>SALT 점수(Olsen et al., JAAD 2004)</strong>를 정밀 산출합니다.
          </p>
        </div>

        {/* 스캔 모드 선택 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '14px'
        }}>
          <button
            type="button"
            onClick={() => setScanMode('single')}
            style={{
              padding: '11px',
              borderRadius: '8px',
              border: scanMode === 'single' ? '1.5px solid #D4AF37' : '1px solid #2b2b2b',
              background: scanMode === 'single' ? 'rgba(212, 175, 55, 0.16)' : '#121212',
              color: scanMode === 'single' ? '#D4AF37' : '#999',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            🎯 단일 병변 정밀 스캔
          </button>
          <button
            type="button"
            onClick={() => setScanMode('salt4')}
            style={{
              padding: '11px',
              borderRadius: '8px',
              border: scanMode === 'salt4' ? '1.5px solid #D4AF37' : '1px solid #2b2b2b',
              background: scanMode === 'salt4' ? 'rgba(212, 175, 55, 0.16)' : '#121212',
              color: scanMode === 'salt4' ? '#D4AF37' : '#999',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            🌐 4구역 SALT 정식 스캔
          </button>
        </div>

        {/* 4구역 SALT 선택 탭 */}
        {scanMode === 'salt4' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '14px'
          }}>
            {SALT_QUADRANTS.map(q => {
              const isSelected = activeQuadrant === q.id;
              const hasPhoto = Boolean(quadrantImages[q.id]);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setActiveQuadrant(q.id)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid #D4AF37' : '1px solid #2a2a2a',
                    background: isSelected ? '#1c180f' : '#121212',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? '#D4AF37' : '#ccc' }}>
                      {q.label.split('(')[0]}
                    </span>
                    <span style={{
                      fontSize: '0.66rem',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background: hasPhoto ? 'rgba(0, 230, 118, 0.2)' : '#222',
                      color: hasPhoto ? '#00E676' : '#888'
                    }}>
                      {hasPhoto ? '등록완료' : `가중치 ${q.weightPct}%`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 원클릭 임상 검증 샘플 테스트 바 */}
        <div style={{
          background: '#141414',
          border: '1px solid #2a2a2a',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#D4AF37', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} /> 실제 두피 기반 원형탈모 AI 검출 정확도 테스트 {!user && <span style={{ color: '#ffab91', fontSize: '0.68rem' }}>(회원가입 후 판독)</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {[
              { key: 'single_s1', label: '① 단발성 S1 (동전크기)' },
              { key: 'multiple_s2', label: '② 다발성 S2 (3개 병변)' },
              { key: 'severe_s3', label: '③ 중증 융합형 S3 (SALT≥50)' },
              { key: 'normal_s0', label: '④ 정상 두피 대조군 (S0)' }
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleLoadClinicalPreset(item.key, item.label)}
                style={{
                  padding: '8px 10px',
                  background: '#1d1d1d',
                  border: '1px solid #383838',
                  borderRadius: '6px',
                  color: '#eee',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 업로드 / 프리뷰 뷰포트 */}
        <div style={{
          background: '#111',
          border: '1.5px dashed rgba(212, 175, 55, 0.45)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '16px',
          position: 'relative'
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
                style={{ width: '100%', maxHeight: '340px', objectFit: 'contain', display: 'block', background: '#050505' }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: '#161616',
                borderTop: '1px solid #2a2a2a'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 600 }}>
                  {SALT_QUADRANTS.find(q => q.id === activeQuadrant)?.label}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleTriggerUpload}
                    style={{
                      padding: '6px 10px',
                      background: '#262626',
                      color: '#fff',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    사진 변경
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      padding: '6px 10px',
                      background: 'rgba(255,82,82,0.15)',
                      color: '#ff8a80',
                      border: '1px solid rgba(255,82,82,0.4)',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    초기화
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={handleTriggerUpload}
              style={{
                padding: '44px 20px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <Upload size={34} color="#D4AF37" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                원형탈모 의심 부위 사진 촬영 또는 업로드
              </div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>
                머리카락을 들추어 동전 모양의 탈모반 경계가 잘 보이도록 촬영해 주세요
              </div>
            </div>
          )}
        </div>

        {/* 임상 동반 증상 체크리스트 */}
        <div style={{
          background: '#121212',
          border: '1px solid #262626',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D4AF37', marginBottom: '10px' }}>
            🔍 원형탈모 예후·중증도 임상 체크리스트 (해당 항목 선택)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.76rem', color: '#ccc' }}>
            {[
              { key: 'rapidPullTest', label: '탈모반 가장자리 머리카락을 살짝 당기면 힘없이 4~5가닥 이상 쉽게 뽑힌다 (활성 진행기)' },
              { key: 'nailPitting', label: '손톱이나 발톱 표면에 바늘로 찌른 듯한 미세한 패임(Nail pitting)이나 거칠어짐이 있다' },
              { key: 'atopyOrThyroid', label: '본인 또는 가족에게 아토피 피부염, 알레르기 비염, 갑상선 질환 등 자가면역 소인이 있다' },
              { key: 'ophiasisBand', label: '탈모 부위가 귀 옆(측두부)에서 뒷머리(후두부) 헤어라인을 따라 띠 모양(사행성)으로 이어진다' },
              { key: 'eyebrowLoss', label: '두피 외에 눈썹, 속눈썹, 수염 등 체모에서도 원형 탈락이 동반된다' }
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checklist[item.key]}
                  onChange={() => toggleCheck(item.key)}
                  style={{ marginTop: 3, accentColor: '#D4AF37' }}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* AI 정밀 분석 실행 버튼 */}
        <button
          type="button"
          onClick={handleRunDiagnosis}
          disabled={isAnalyzing}
          style={{
            width: '100%',
            padding: '15px',
            background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}
        >
          <Scan size={18} />
          {isAnalyzing
            ? 'Connected-Component 탈모반 계측 중...'
            : user
            ? '원형탈모 AI 정밀 진단 및 SALT 점수 산출하기'
            : '🔒 회원가입하고 원형탈모 SALT 정밀 진단 결과 확인하기'}
        </button>

        {/* 진단 결과 리포트 */}
        {finalReport && (
          <div className="fade-in" style={{
            background: '#111',
            border: '1.5px solid #D4AF37',
            borderRadius: '12px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{
                fontSize: '0.72rem',
                padding: '3px 10px',
                borderRadius: '12px',
                background: 'rgba(212, 175, 55, 0.18)',
                color: '#D4AF37',
                fontWeight: 700
              }}>
                AI 원형탈모 SALT 정밀 판독서
              </span>
              {finalReport.presetLabel && (
                <span style={{ fontSize: '0.7rem', color: '#999' }}>{finalReport.presetLabel}</span>
              )}
            </div>

            {/* 핵심 지표 그리드 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <div style={{ background: '#181818', padding: '12px', borderRadius: '8px', border: '1px solid #2b2b2b' }}>
                <div style={{ fontSize: '0.72rem', color: '#888' }}>국제 SALT 중증도 등급</div>
                <div style={{ fontSize: '1.02rem', fontWeight: 800, color: finalReport.severityColor, marginTop: '4px' }}>
                  {finalReport.saltGrade.split(' ')[0]} ({finalReport.saltScore}점)
                </div>
                <div style={{ fontSize: '0.68rem', color: '#aaa', marginTop: '2px' }}>
                  {finalReport.severityLabel}
                </div>
              </div>

              <div style={{ background: '#181818', padding: '12px', borderRadius: '8px', border: '1px solid #2b2b2b' }}>
                <div style={{ fontSize: '0.72rem', color: '#888' }}>검출된 탈모반 & 총 면적</div>
                <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                  {finalReport.totalPatchCount}개 병변 ({finalReport.totalAreaCm2} cm²)
                </div>
                <div style={{ fontSize: '0.68rem', color: '#D4AF37', marginTop: '2px' }}>
                  최대 직경: 약 {finalReport.maxDiameterCm} cm
                </div>
              </div>
            </div>

            {/* 임상 형태 분류 */}
            <div style={{
              background: '#161616',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '14px',
              borderLeft: `3px solid ${finalReport.severityColor}`
            }}>
              <div style={{ fontSize: '0.74rem', color: '#999' }}>임상 형태학적 분류</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: '3px' }}>
                {finalReport.clinicalPattern}
              </div>
            </div>

            {/* 개별 탈모반 상세 테이블 */}
            {finalReport.allPatches.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D4AF37', marginBottom: '8px' }}>
                  📏 검출된 원형탈모반(Patch) 개별 형태학 계측
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {finalReport.allPatches.map(p => (
                    <div
                      key={p.id}
                      style={{
                        background: '#181818',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ color: '#D4AF37' }}>Patch #{p.id}</strong> · {p.shapeType}
                        <div style={{ color: '#999', fontSize: '0.7rem', marginTop: '2px' }}>
                          {p.borderActivity} (CIE a* 홍반도: {p.meanErythema})
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>직경 Ø {p.diameterCm} cm</div>
                        <div style={{ color: '#aaa', fontSize: '0.7rem' }}>면적 {p.areaCm2} cm²</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 동반 위험 인자 */}
            {finalReport.riskFactors.length > 0 && (
              <div style={{
                background: 'rgba(255, 82, 82, 0.1)',
                border: '1px solid rgba(255, 82, 82, 0.35)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '14px'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ff8a80', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={15} /> 확인된 예후 주의 인자
                </div>
                <ul style={{ paddingLeft: '18px', fontSize: '0.75rem', color: '#ffcdd2', lineHeight: 1.6 }}>
                  {finalReport.riskFactors.map((rf, i) => <li key={i}>{rf}</li>)}
                </ul>
              </div>
            )}

            {/* 표준 의학 치료 프로토콜 */}
            <div style={{
              background: '#161616',
              border: '1px solid #2b2b2b',
              borderRadius: '8px',
              padding: '14px'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D4AF37', marginBottom: '8px' }}>
                🏥 대한모발학회·국제 원형탈모 치료 가이드라인 권고
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.76rem', color: '#ddd', lineHeight: 1.65 }}>
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
