// src/components/AlopeciaAreataView.jsx
// 국제 표준 SALT (Severity of Alopecia Tool) 척도 + 3단계 정밀 직경 보정(Auto-FOV · 동전 기준원 · 디지털 캘리퍼스) 원형탈모 진단앱

import React, { useState, useRef, useEffect } from 'react';
import {
  Scan, Upload, Sparkles, ArrowLeft, ShieldAlert, Ruler, RotateCcw
} from 'lucide-react';
import {
  SALT_QUADRANTS,
  SCALE_CALIBRATION_PRESETS,
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

  // 정밀 직경 스케일 보정 상태
  const [calibrationMode, setCalibrationMode] = useState('auto_fov');
  const [coinSpanRatio, setCoinSpanRatio] = useState(0.185); // 화면 가로 대비 동전 직경 비율 (기본 18.5%)
  const [ coinCenter, setCoinCenter ] = useState({ x: 0.24, y: 0.26 });

  // 인터랙티브 디지털 버니어 캘리퍼스 (사진 위 직접 드래그 측정)
  const [caliperActive, setCaliperActive] = useState(true);
  const [caliperPoints, setCaliperPoints] = useState({
    ax: 0.41,
    ay: 0.50,
    bx: 0.59,
    by: 0.50,
    isManual: false
  });
  const [draggingHandle, setDraggingHandle] = useState(null); // 'A' | 'B' | 'COIN' | null

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
  const viewportRef = useRef(null);

  const currentResult = quadrantResults[activeQuadrant];
  const currentImg = currentResult?.annotatedImage || quadrantImages[activeQuadrant];
  const effectiveFovCm = currentResult?.effectiveFovWidthCm || 13.0;

  // 현재 캘리퍼스 두 점(A, B) 사이의 실시간 직경(cm) 및 면적(cm²) 계산
  const computeLiveCaliperMetrics = (pts = caliperPoints, fovCm = effectiveFovCm) => {
    // 4:3 비율 보정 후 유클리드 거리 계산
    const dxCm = (pts.bx - pts.ax) * fovCm;
    const dyCm = (pts.by - pts.ay) * (fovCm * 0.75);
    const distCm = Math.sqrt(dxCm * dxCm + dyCm * dyCm);
    const diameterCm = Number(Math.max(0.2, distCm).toFixed(2));
    // 현재 검출된 병변의 단축/장축 비율(aspect ratio)을 유지하여 타원 면적 산출
    const primaryPatch = currentResult?.patches?.[0];
    const aspect =
      primaryPatch && primaryPatch.majorDiameterCm > 0
        ? primaryPatch.minorDiameterCm / primaryPatch.majorDiameterCm
        : 0.92;
    const minorCm = Number((diameterCm * aspect).toFixed(2));
    const areaCm2 = Number((Math.PI * (diameterCm / 2) * (minorCm / 2)).toFixed(2));
    return {
      diameterCm,
      majorDiameterCm: diameterCm,
      minorDiameterCm: minorCm,
      areaCm2
    };
  };

  const liveCaliper = computeLiveCaliperMetrics();

  // 촬영 거리/동전 스케일 프리셋 변경 시 즉시 재계산
  const ReanalyzeWithScale = async (nextMode = calibrationMode, nextCoinRatio = coinSpanRatio) => {
    const hasAnyImage = Object.values(quadrantImages).some(Boolean);
    if (!hasAnyImage) return;

    const nextResults = { ...quadrantResults };
    for (const q of SALT_QUADRANTS) {
      if (quadrantImages[q.id]) {
        nextResults[q.id] = await analyzeAlopeciaAreataImage(quadrantImages[q.id], q.id, {
          calibrationMode: nextMode,
          coinSpanRatio: nextCoinRatio
        });
      }
    }
    setQuadrantResults(nextResults);

    const activeRes = nextResults[activeQuadrant];
    if (activeRes?.defaultCaliper) {
      setCaliperPoints({
        ...activeRes.defaultCaliper,
        isManual: false
      });
    }

    const report = calculateFinalAlopeciaAreataReport(nextResults, checklist);
    setFinalReport(report);
  };

  const handleSelectCalibrationMode = async (modeId) => {
    setCalibrationMode(modeId);
    await ReanalyzeWithScale(modeId, coinSpanRatio);
  };

  const handleCoinRatioChange = async (newRatio) => {
    setCoinSpanRatio(newRatio);
    await ReanalyzeWithScale(calibrationMode, newRatio);
  };

  // 캘리퍼스 드래그 핸들러 (마우스 + 모바일 터치 완벽 지원)
  const updateHandleFromEvent = (clientX, clientY) => {
    if (!draggingHandle || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const nx = Math.max(0.04, Math.min(0.96, (clientX - rect.left) / rect.width));
    const ny = Math.max(0.05, Math.min(0.95, (clientY - rect.top) / rect.height));

    if (draggingHandle === 'COIN') {
      setCoinCenter({ x: nx, y: ny });
      return;
    }

    setCaliperPoints(prev => {
      const updated =
        draggingHandle === 'A'
          ? { ...prev, ax: nx, ay: ny, isManual: true }
          : { ...prev, bx: nx, by: ny, isManual: true };

      if (finalReport && currentResult) {
        const metrics = computeLiveCaliperMetrics(updated, effectiveFovCm);
        const manualReport = calculateFinalAlopeciaAreataReport(quadrantResults, checklist, {
          diameterCm: metrics.diameterCm,
          areaCm2: metrics.areaCm2
        });
        manualReport.presetLabel = finalReport.presetLabel;
        setFinalReport(manualReport);
      }
      return updated;
    });
  };

  useEffect(() => {
    if (!draggingHandle) return;
    const onMove = (ev) => {
      const pt = ev.touches ? ev.touches[0] : ev;
      if (pt) updateHandleFromEvent(pt.clientX, pt.clientY);
    };
    const onUp = () => setDraggingHandle(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  });

  const handleResetCaliperToAI = () => {
    if (!currentResult?.defaultCaliper) return;
    setCaliperPoints({
      ...currentResult.defaultCaliper,
      isManual: false
    });
    const report = calculateFinalAlopeciaAreataReport(quadrantResults, checklist);
    if (finalReport?.presetLabel) report.presetLabel = finalReport.presetLabel;
    setFinalReport(report);
  };

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
      const nextImages = { ...quadrantImages, [targetQuad]: dataUrl };
      setQuadrantImages(nextImages);
      setIsAnalyzing(true);
      try {
        const analysis = await analyzeAlopeciaAreataImage(dataUrl, targetQuad, {
          calibrationMode,
          coinSpanRatio
        });
        const nextResults = { ...quadrantResults, [targetQuad]: analysis };
        setQuadrantResults(nextResults);
        if (analysis.defaultCaliper) {
          setCaliperPoints({ ...analysis.defaultCaliper, isManual: false });
        }
        const report = calculateFinalAlopeciaAreataReport(nextResults, checklist);
        setFinalReport(report);
      } finally {
        setIsAnalyzing(false);
      }
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
        const topAnalysis = await analyzeAlopeciaAreataImage(sampleUrl, 'top', {
          calibrationMode,
          coinSpanRatio
        });
        const nextResults = { top: topAnalysis, back: null, left: null, right: null };
        setQuadrantResults(nextResults);
        if (topAnalysis.defaultCaliper) {
          setCaliperPoints({ ...topAnalysis.defaultCaliper, isManual: false });
        }
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
          nextResults[q.id] = await analyzeAlopeciaAreataImage(quadrantImages[q.id], q.id, {
            calibrationMode,
            coinSpanRatio
          });
        }
      }
      setQuadrantResults(nextResults);
      const activeRes = nextResults[activeQuadrant];
      if (activeRes?.defaultCaliper) {
        setCaliperPoints({ ...activeRes.defaultCaliper, isManual: false });
      }
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

  const isCoinMode = calibrationMode === 'coin_100' || calibrationMode === 'coin_500';
  const coinRefDiameterCm = calibrationMode === 'coin_500' ? 2.65 : 2.40;

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
          <p className="tab-banner-sub">국제 SALT 척도(S0~S5) · 3단계 오차 보정 정밀 직경 계측</p>
        </div>
      </div>

      <div style={{ padding: '14px' }}>
        <PrivacyMembershipNoticeCard
          user={user}
          featureType="areata"
          onOpenAuth={onRequireAuth}
        />

        {/* 원형탈모 진단 결과물 샘플 요약 카드 + SALT 점수 높낮이 안내 */}
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
            <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', background: 'rgba(100, 181, 246, 0.16)', color: '#64B5F6', fontWeight: 800 }}>
              ↓ SALT 점수는 낮을수록 좋음 (0점 정상)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
            {[
              { label: 'SALT 점수 (↓낮을수록 좋음)', val: 'S1 (3.4점 · 경증)', color: '#D4AF37' },
              { label: '정밀 직경 (장축×단축)', val: 'Ø 2.4cm (2.4×2.4)', color: '#81C784' },
              { label: '권장 치료', val: '국소 주사 + 외용제', color: '#64B5F6' }
            ].map((m, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '7px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.62rem', color: '#888' }}>{m.label}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: m.color, marginTop: '2px' }}>{m.val}</div>
              </div>
            ))}
          </div>

          {/* 간결한 SALT 점수 판독 안내 */}
          <div style={{
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '8px',
            padding: '6px 9px',
            fontSize: '0.68rem',
            color: '#ddd',
            marginBottom: '9px',
            lineHeight: 1.45
          }}>
            💡 <strong style={{ color: '#D4AF37' }}>점수 기준 안내</strong>: 원형탈모 <strong>SALT 점수(0~100점)와 등급(S0~S5)은 숫자가 낮을수록 좋습니다.</strong> (<strong>0점 S0 = 정상</strong>, S1 = 25% 미만 경증, 숫자가 높을수록 탈모반 면적이 넓음)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {[
              { key: 'single_s1', label: '단발성 S1 (Ø2.4cm)' },
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

        {/* ====================================================================
            📏 원형탈모 직경 오차 해결: 3단계 정밀 스케일 보정 & 디지털 캘리퍼스 뷰포트
        ==================================================================== */}
        <div style={{
          background: '#121217',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '12px',
          padding: '11px 12px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Ruler size={14} /> 정밀 직경 오차 보정 (촬영 거리 · 동전 기준 · 캘리퍼스)
            </span>
            <span style={{ fontSize: '0.65rem', color: '#81C784', fontWeight: 700 }}>
              1mm(0.1cm) 단위 정밀 계측
            </span>
          </div>

          {/* 6종 스케일 프리셋 탭 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', marginBottom: '8px' }}>
            {SCALE_CALIBRATION_PRESETS.map(preset => {
              const active = calibrationMode === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectCalibrationMode(preset.id)}
                  style={{
                    padding: '6px 5px',
                    borderRadius: '7px',
                    border: active ? '1.5px solid #D4AF37' : '1px solid #2b2b2b',
                    background: active ? 'rgba(212, 175, 55, 0.2)' : '#18181f',
                    color: active ? '#D4AF37' : '#bbb',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div>{preset.label}</div>
                  <div style={{ fontSize: '0.59rem', color: active ? '#f5f0e8' : '#777', fontWeight: 500 }}>
                    {preset.sub}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 동전 기준 모드 선택 시 동전 크기 맞춤 슬라이더 표시 */}
          {isCoinMode && (
            <div style={{
              background: 'rgba(0, 230, 118, 0.08)',
              border: '1px solid rgba(0, 230, 118, 0.3)',
              borderRadius: '8px',
              padding: '8px 10px',
              marginBottom: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.69rem', color: '#81C784', fontWeight: 700, marginBottom: '4px' }}>
                <span>🪙 기준 동전({coinRefDiameterCm}cm) 가이드 원 크기 맞춤</span>
                <span>화면 폭의 {Math.round(coinSpanRatio * 100)}% = {coinRefDiameterCm}cm</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.36"
                step="0.005"
                value={coinSpanRatio}
                onChange={(e) => handleCoinRatioChange( parseFloat(e.target.value) )}
                style={{ width: '100%', accentColor: '#00E676', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '0.63rem', color: '#bbb', marginTop: '2px' }}>
                사진 속 동전(또는 손가락 한 마디 약 2.4cm) 크기에 초록색 기준원을 맞추면 촬영 거리 오차가 0%로 보정됩니다.
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.66rem', color: '#999', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>현재 적용 시야폭(FOV): <strong style={{ color: '#D4AF37' }}>가로 {effectiveFovCm}cm</strong></span>
            <span>💡 사진 위 <strong style={{ color: '#00E676' }}>[A]·[B] 캘리퍼스 점</strong>을 드래그해 미세 조정 가능</span>
          </div>
        </div>

        {/* 이미지 업로드 & 인터랙티브 디지털 캘리퍼스 뷰포트 */}
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
              {/* 인터랙티브 계측 뷰포트 */}
              <div
                ref={viewportRef}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  maxHeight: '290px',
                  background: '#050505',
                  overflow: 'hidden',
                  userSelect: 'none',
                  touchAction: 'none'
                }}
              >
                <img
                  src={currentImg}
                  alt="Alopecia Areata Scan"
                  style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', pointerEvents: 'none' }}
                />

                {/* SVG 디지털 캘리퍼스 & 동전 기준원 오버레이 */}
                {caliperActive && (
                  <svg
                    viewBox="0 0 400 300"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none'
                    }}
                  >
                    {/* 동전 기준 모드일 때 기준 동전 원 표시 */}
                    {isCoinMode && (
                      <g>
                        <circle
                          cx={coinCenter.x * 400}
                          cy={coinCenter.y * 300}
                          r={(coinSpanRatio * 400) / 2}
                          fill="rgba(0, 230, 118, 0.15)"
                          stroke="#00E676"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                        />
                        <text
                          x={coinCenter.x * 400}
                          y={coinCenter.y * 300 + 4}
                          fill="#00E676"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          🪙 {calibrationMode === 'coin_500' ? '500원(2.65cm)' : '100원(2.40cm)'}
                        </text>
                      </g>
                    )}

                    {/* 디지털 캘리퍼스 측정선 (A <-> B) */}
                    {currentResult && currentResult.patchCount > 0 && (
                      <g>
                        {/* 측정 보조 타원 */}
                        <ellipse
                          cx={((caliperPoints.ax + caliperPoints.bx) / 2) * 400}
                          cy={((caliperPoints.ay + caliperPoints.by) / 2) * 300}
                          rx={Math.max(10, (Math.hypot((caliperPoints.bx - caliperPoints.ax) * 400, (caliperPoints.by - caliperPoints.ay) * 300)) / 2)}
                          ry={Math.max(8, (Math.hypot((caliperPoints.bx - caliperPoints.ax) * 400, (caliperPoints.by - caliperPoints.ay) * 300)) * 0.44)}
                          fill="rgba(0, 230, 118, 0.08)"
                          stroke="rgba(0, 230, 118, 0.65)"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />

                        {/* 중심 측정선 */}
                        <line
                          x1={caliperPoints.ax * 400}
                          y1={caliperPoints.ay * 300}
                          x2={caliperPoints.bx * 400}
                          y2={caliperPoints.by * 300}
                          stroke="#00E676"
                          strokeWidth="2.5"
                        />

                        {/* 중앙 실시간 직경 배지 */}
                        <rect
                          x={((caliperPoints.ax + caliperPoints.bx) / 2) * 400 - 54}
                          y={((caliperPoints.ay + caliperPoints.by) / 2) * 300 - 28}
                          width="108"
                          height="20"
                          rx="6"
                          fill="rgba(0, 0, 0, 0.85)"
                          stroke="#00E676"
                          strokeWidth="1.2"
                        />
                        <text
                          x={((caliperPoints.ax + caliperPoints.bx) / 2) * 400}
                          y={((caliperPoints.ay + caliperPoints.by) / 2) * 300 - 15}
                          fill="#00E676"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          Ø {liveCaliper.diameterCm}cm ({Math.round(liveCaliper.diameterCm * 10)}mm)
                        </text>
                      </g>
                    )}
                  </svg>
                )}

                {/* 드래그 가능한 캘리퍼스 핸들 [A] / [B] */}
                {caliperActive && currentResult && currentResult.patchCount > 0 && (
                  <>
                    <div
                      onMouseDown={() => setDraggingHandle('A')}
                      onTouchStart={() => setDraggingHandle('A')}
                      title="드래그하여 탈모반 왼쪽 끝점에 맞추세요"
                      style={{
                        position: 'absolute',
                        left: `calc(${caliperPoints.ax * 100}% - 13px)`,
                        top: `calc(${caliperPoints.ay * 100}% - 13px)`,
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'rgba(0, 230, 118, 0.92)',
                        border: '2px solid #000',
                        color: '#000',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'grab',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        zIndex: 12
                      }}
                    >
                      A
                    </div>
                    <div
                      onMouseDown={() => setDraggingHandle('B')}
                      onTouchStart={() => setDraggingHandle('B')}
                      title="드래그하여 탈모반 오른쪽 끝점에 맞추세요"
                      style={{
                        position: 'absolute',
                        left: `calc(${caliperPoints.bx * 100}% - 13px)`,
                        top: `calc(${caliperPoints.by * 100}% - 13px)`,
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'rgba(212, 175, 55, 0.95)',
                        border: '2px solid #000',
                        color: '#000',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'grab',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        zIndex: 12
                      }}
                    >
                      B
                    </div>
                  </>
                )}

                {/* 동전 기준원 위치 이동 핸들 */}
                {caliperActive && isCoinMode && (
                  <div
                    onMouseDown={() => setDraggingHandle('COIN')}
                    onTouchStart={() => setDraggingHandle('COIN')}
                    style={{
                      position: 'absolute',
                      left: `calc(${coinCenter.x * 100}% - 14px)`,
                      top: `calc(${coinCenter.y * 100}% - 14px)`,
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(0, 230, 118, 0.35)',
                      border: '1.5px solid #00E676',
                      cursor: 'move',
                      zIndex: 11
                    }}
                    title="동전 위치로 이동"
                  />
                )}
              </div>

              {/* 뷰포트 하단 컨트롤 바 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '8px 12px',
                background: '#161616',
                borderTop: '1px solid #2a2a2a'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 700 }}>
                    { currentResult && currentResult.patchCount > 0
                      ? `실측 직경 Ø ${liveCaliper.diameterCm}cm · 면적 ${liveCaliper.areaCm2}cm²`
                      : SALT_QUADRANTS.find(q => q.id === activeQuadrant)?.label.split('(')[0] }
                  </span>
                  {caliperPoints.isManual && (
                    <button
                      type="button"
                      onClick={handleResetCaliperToAI}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '3px 7px',
                        background: 'rgba(0,230,118,0.14)',
                        color: '#00E676',
                        border: '1px solid rgba(0,230,118,0.4)',
                        borderRadius: '5px',
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCcw size={11} /> AI 자동점 복원
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    type="button"
                    onClick={() => setCaliperActive(prev => !prev)}
                    style={{
                      padding: '5px 8px',
                      background: caliperActive ? 'rgba(0, 230, 118, 0.16)' : '#262626',
                      color: caliperActive ? '#00E676' : '#aaa',
                      border: caliperActive ? '1px solid #00E676' : '1px solid #444',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    📏 캘리퍼스 {caliperActive ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerUpload}
                    style={{ padding: '5px 9px', background: '#262626', color: '#fff', border: '1px solid #444', borderRadius: '6px', fontSize: '0.68rem', cursor: 'pointer' }}
                  >
                    사진 변경
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{ padding: '5px 9px', background: 'rgba(255,82,82,0.15)', color: '#ff8a80', border: '1px solid rgba(255,82,82,0.4)', borderRadius: '6px', fontSize: '0.68rem', cursor: 'pointer' }}
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
                탈모반 경계가 보이도록 촬영하거나, 동전(100원·500원)과 함께 촬영하면 오차 없이 정밀 측정됩니다
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
            ? '원형탈모 정밀 직경·SALT 분석 중...'
            : user
            ? '원형탈모 SALT 점수 & 정밀 직경 산출하기'
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
                AI 원형탈모 SALT & 2D PCA 정밀 계측 리포트
              </span>
              {finalReport.presetLabel && (
                <span style={{ fontSize: '0.7rem', color: '#999' }}>{finalReport.presetLabel}</span>
              )}
            </div>

            {/* 점수 높낮이 해석 요약 바 */}
            <div style={{
              background: 'rgba(100, 181, 246, 0.1)',
              border: '1px solid rgba(100, 181, 246, 0.3)',
              borderRadius: '8px',
              padding: '7px 10px',
              fontSize: '0.7rem',
              color: '#ddd',
              marginBottom: '10px'
            }}>
              💡 <strong style={{ color: '#64B5F6' }}>SALT 점수 판독 기준 (↓ 낮을수록 좋음)</strong>: <strong>0점(S0)이 탈모반이 없는 정상</strong>이며, 점수가 높을수록 전체 두피 대비 탈모 면적(%)이 넓음을 뜻합니다.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: '#181818', padding: '10px', borderRadius: '8px', border: '1px solid #2b2b2b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.67rem', color: '#888' }}>국제 SALT 등급</span>
                  <span style={{ fontSize: '0.6rem', color: '#64B5F6', fontWeight: 700 }}>↓ 낮을수록 좋음</span>
                </div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: finalReport.severityColor, marginTop: '3px' }}>
                  {finalReport.saltGrade.split(' ')[0]} ({finalReport.saltScore}점 / 100)
                </div>
                <div style={{ fontSize: '0.66rem', color: '#aaa', marginTop: '2px' }}>{finalReport.severityLabel}</div>
              </div>

              <div style={{ background: '#181818', padding: '10px', borderRadius: '8px', border: '1px solid #2b2b2b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.67rem', color: '#888' }}>정밀 병변 직경·면적</span>
                  <span style={{ fontSize: '0.6rem', color: '#00E676', fontWeight: 700 }}>
                    {caliperPoints.isManual ? '캘리퍼스 보정됨' : 'PCA 장·단축 계측'}
                  </span>
                </div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#fff', marginTop: '3px' }}>
                  Ø {finalReport.maxDiameterCm} cm ({finalReport.totalAreaCm2} cm²)
                </div>
                <div style={{ fontSize: '0.66rem', color: '#D4AF37', marginTop: '2px' }}>
                  검출 병변 {finalReport.totalPatchCount}개 · 100원 동전(2.4cm)의 약 {Math.round((finalReport.maxDiameterCm / 2.4) * 100)}%
                </div>
              </div>
            </div>

            {/* 검출된 개별 탈모반 장축×단축 상세 테이블 */}
            {currentResult?.patches?.length > 0 && (
              <div style={{
                background: '#16161c',
                border: '1px solid rgba(0, 230, 118, 0.28)',
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#00E676', marginBottom: '6px' }}>
                  📐 검출 탈모반 부위별 장축×단축 정밀 치수 (오차 보정 완료)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {currentResult.patches.map((p, idx) => {
                    const dispDiam = idx === 0 && caliperPoints.isManual ? liveCaliper.diameterCm : p.diameterCm;
                    const dispMajor = idx === 0 && caliperPoints.isManual ? liveCaliper.majorDiameterCm : p.majorDiameterCm;
                    const dispMinor = idx === 0 && caliperPoints.isManual ? liveCaliper.minorDiameterCm : p.minorDiameterCm;
                    const dispArea = idx === 0 && caliperPoints.isManual ? liveCaliper.areaCm2 : p.estimatedCm2;
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(255,255,255,0.03)',
                          padding: '6px 9px',
                          borderRadius: '6px',
                          fontSize: '0.71rem'
                        }}
                      >
                        <span style={{ fontWeight: 700, color: '#f5f0e8' }}>
                          #{p.id} 탈모반 (평균 Ø {dispDiam}cm)
                        </span>
                        <span style={{ color: '#bbb' }}>
                          장축 <strong style={{ color: '#D4AF37' }}>{dispMajor}cm</strong> × 단축 <strong style={{ color: '#D4AF37' }}>{dispMinor}cm</strong> · 면적 <strong style={{ color: '#81C784' }}>{dispArea}cm²</strong>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
