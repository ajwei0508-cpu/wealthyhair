// src/components/AlopeciaAreataView.jsx
// 원형탈모(SALT) 정밀 진단 — 초기 화면은 단일 진단 시작 메뉴 하나만 표시하고, 사진 등록 즉시 정밀 직경 계측·진단 모드로 돌입

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, ShieldAlert, Ruler, RotateCcw
} from 'lucide-react';
import {
  SALT_QUADRANTS,
  SCALE_CALIBRATION_PRESETS,
  analyzeAlopeciaAreataImage,
  calculateFinalAlopeciaAreataReport
} from '../utils/alopeciaAreataAnalysis';
import { PrivacyMembershipNoticeCard } from './AuthGate';

const AlopeciaAreataView = ({ onBack = null, user = null, onRequireAuth = null }) => {
  const [activeQuadrant] = useState('top');
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

  // 정밀 직경 스케일 보정 상태 (사진 업로드 후 진단 화면에서만 노출)
  const [calibrationMode, setCalibrationMode] = useState('auto_fov');
  const [coinSpanRatio, setCoinSpanRatio] = useState(0.185);
  const [coinCenter, setCoinCenter] = useState({ x: 0.24, y: 0.26 });

  // 인터랙티브 디지털 버니어 캘리퍼스
  const [caliperActive, setCaliperActive] = useState(true);
  const [caliperPoints, setCaliperPoints] = useState({
    ax: 0.41,
    ay: 0.50,
    bx: 0.59,
    by: 0.50,
    isManual: false
  });
  const [draggingHandle, setDraggingHandle] = useState(null);

  const [checklist] = useState({
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

  const computeLiveCaliperMetrics = (pts = caliperPoints, fovCm = effectiveFovCm) => {
    const dxCm = (pts.bx - pts.ax) * fovCm;
    const dyCm = (pts.by - pts.ay) * (fovCm * 0.75);
    const distCm = Math.sqrt(dxCm * dxCm + dyCm * dyCm);
    const diameterCm = Number(Math.max(0.2, distCm).toFixed(2));
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
    setFinalReport(report);
  };

  const handleTriggerUpload = () => {
    if (!user && onRequireAuth) {
      onRequireAuth({
        mode: 'signup',
        featureName: '원형탈모(SALT) 정밀 진단앱',
        onSuccess: () => {
          setTimeout(() => fileInputRef.current?.click(), 120);
        }
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

  const handleReset = () => {
    setQuadrantImages({ top: null, back: null, left: null, right: null });
    setQuadrantResults({ top: null, back: null, left: null, right: null });
    setFinalReport(null);
  };

  const isCoinMode = calibrationMode === 'coin_100' || calibrationMode === 'coin_500';
  const coinRefDiameterCm = calibrationMode === 'coin_500' ? 2.65 : 2.40;

  return (
    <div className="fade-in" style={{ paddingBottom: '90px', color: '#fff', background: '#000' }}>
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
              <ArrowLeft size={13} /> 이전으로
            </button>
          )}
          <h1 className="tab-banner-title">원형탈모(SALT) 정밀 진단</h1>
          <p className="tab-banner-sub">국제 SALT 척도(S0~S5) · 정밀 직경 계측</p>
        </div>
      </div>

      <div style={{ padding: '16px 14px' }}>
        <PrivacyMembershipNoticeCard
          user={user}
          featureType="areata"
          onOpenAuth={onRequireAuth}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e, activeQuadrant)}
        />

        {/* 사진 등록 전: 깔끔하게 원형탈모 진단 모드로 바로 돌입하는 메뉴 하나만 노출 */}
        {!currentImg ? (
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(24, 24, 30, 0.98), rgba(14, 14, 18, 0.98))',
              border: '1.5px solid #D4AF37',
              borderRadius: '14px',
              padding: '22px 18px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            }}
          >
            <h2 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#f5f0e8', margin: '0 0 8px' }}>
              🎯 원형탈모(SALT) 정밀 진단
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#bbb', margin: '0 0 18px', lineHeight: 1.5 }}>
              원형탈모 의심 부위 사진을 등록하면 즉시 탈모반 직경(cm) 계측 및 SALT 등급 진단을 시작합니다.
            </p>

            <button
              type="button"
              onClick={handleTriggerUpload}
              disabled={isAnalyzing}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
                color: '#000',
                fontSize: '0.92rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {isAnalyzing
                ? '원형탈모 정밀 분석 중...'
                : user
                ? '원형탈모 진단 바로 시작하기 →'
                : '🔒 회원가입 후 원형탈모 진단 시작하기 →'}
            </button>
          </div>
        ) : (
          /* 사진 등록 후: 정밀 직경 보정 + 캘리퍼스 뷰포트 + SALT 진단 리포트 */
          <div className="fade-in">
            {/* 정밀 직경 오차 보정 컨트롤 */}
            <div style={{
              background: '#121217',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '12px',
              padding: '11px 12px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Ruler size={14} /> 직경 오차 정밀 보정 (촬영 거리 · 동전 기준 · 캘리퍼스)
                </span>
                <span style={{ fontSize: '0.65rem', color: '#81C784', fontWeight: 700 }}>
                  1mm(0.1cm) 단위 계측
                </span>
              </div>

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
                    onChange={(e) => handleCoinRatioChange(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#00E676', cursor: 'pointer' }}
                  />
                </div>
              )}

              <div style={{ fontSize: '0.66rem', color: '#999', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>적용 시야폭(FOV): <strong style={{ color: '#D4AF37' }}>가로 {effectiveFovCm}cm</strong></span>
                <span>💡 사진 위 <strong style={{ color: '#00E676' }}>[A]·[B] 점</strong> 드래그로 미세 보정</span>
              </div>
            </div>

            {/* 인터랙티브 캘리퍼스 뷰포트 */}
            <div style={{
              background: '#111',
              border: '1.5px solid rgba(212, 175, 55, 0.45)',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
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

                    {currentResult && currentResult.patchCount > 0 && (
                      <g>
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

                        <line
                          x1={caliperPoints.ax * 400}
                          y1={caliperPoints.ay * 300}
                          x2={caliperPoints.bx * 400}
                          y2={caliperPoints.by * 300}
                          stroke="#00E676"
                          strokeWidth="2.5"
                        />

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

                {caliperActive && currentResult && currentResult.patchCount > 0 && (
                  <>
                    <div
                      onMouseDown={() => setDraggingHandle('A')}
                      onTouchStart={() => setDraggingHandle('A')}
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
                  />
                )}
              </div>

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
                    {currentResult && currentResult.patchCount > 0
                      ? `실측 직경 Ø ${liveCaliper.diameterCm}cm · 면적 ${liveCaliper.areaCm2}cm²`
                      : '원형탈모 스캔 완료'}
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

            {/* 진단 결과 리포트 */}
            {finalReport && (
              <div style={{
                background: '#111',
                border: '1.5px solid #D4AF37',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: '#181818', padding: '10px', borderRadius: '8px', border: '1px solid #2b2b2b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.67rem', color: '#888' }}>국제 SALT 등급</span>
                      <span style={{ fontSize: '0.6rem', color: '#64B5F6', fontWeight: 700 }}>↓ 낮을수록 좋음</span>
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: finalReport.severityColor, marginTop: '3px' }}>
                      {finalReport.saltGrade.split(' ')[0]} ({finalReport.saltScore}점 / 100)
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#aaa', marginTop: '2px' }}>{finalReport.severityLabel} (0점 S0 정상)</div>
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
                      검출 병변 {finalReport.totalPatchCount}개
                    </div>
                  </div>
                </div>

                {currentResult?.patches?.length > 0 && (
                  <div style={{
                    background: '#16161c',
                    border: '1px solid rgba(0, 230, 118, 0.28)',
                    borderRadius: '8px',
                    padding: '10px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#00E676', marginBottom: '6px' }}>
                      📐 검출 탈모반 장축×단축 정밀 치수
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
                              #{p.id} 탈모반 (Ø {dispDiam}cm)
                            </span>
                            <span style={{ color: '#bbb' }}>
                              장축 <strong style={{ color: '#D4AF37' }}>{dispMajor}cm</strong> × 단축 <strong style={{ color: '#D4AF37' }}>{dispMinor}cm</strong> · <strong style={{ color: '#81C784' }}>{dispArea}cm²</strong>
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
        )}
      </div>
    </div>
  );
};

export default AlopeciaAreataView;
