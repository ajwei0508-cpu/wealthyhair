// src/components/AlopeciaAreataView.jsx
// 원형탈모(SALT) 정밀 진단 — 사진 업로드 및 임상 표준 샘플 스캔, 6종 스케일 보정, 디지털 캘리퍼스, 4구역 SALT 합산 및 개인 기록 저장

import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  Ruler,
  RotateCcw,
  Save,
  CheckCircle2,
  FlaskConical,
  Upload,
} from 'lucide-react';
import {
  SALT_QUADRANTS,
  SCALE_CALIBRATION_PRESETS,
  analyzeAlopeciaAreataImage,
  calculateFinalAlopeciaAreataReport,
  generateVerifiedAlopeciaSample,
} from '../utils/alopeciaAreataAnalysis';
import { saveAreataDiagnosisRecord } from '../utils/diagnosisHistoryService';
import { PrivacyMembershipNoticeCard } from './AuthGate';
import DiagnosisHistoryPanel from './DiagnosisHistoryPanel';

const CLINICAL_CHECKLIST_ITEMS = [
  { key: 'nailPitting', label: '손발톱 미세 패임 동반' },
  { key: 'atopyOrThyroid', label: '아토피 · 갑상선 질환력' },
  { key: 'eyebrowLoss', label: '눈썹 · 체모 동반 탈락' },
  { key: 'ophiasisBand', label: '측·후두부 띠 형태(사행성)' },
  { key: 'rapidPullTest', label: '변연부 모발 견인검사 양성' },
];

function normalizeCaliperPoints(raw, isManual = false) {
  const ax = Number.isFinite(raw?.ax) ? raw.ax : Number.isFinite(raw?.x1) ? raw.x1 : 0.41;
  const ay = Number.isFinite(raw?.ay) ? raw.ay : Number.isFinite(raw?.y1) ? raw.y1 : 0.5;
  const bx = Number.isFinite(raw?.bx) ? raw.bx : Number.isFinite(raw?.x2) ? raw.x2 : 0.59;
  const by = Number.isFinite(raw?.by) ? raw.by : Number.isFinite(raw?.y2) ? raw.y2 : 0.5;
  return { ax, ay, bx, by, isManual: Boolean(isManual) };
}

function buildCalibrationOptions(modeId, coinRatio) {
  const isCoin = modeId === 'coin_100' || modeId === 'coin_500';
  return {
    scaleMode: modeId,
    coinRefRatio: isCoin ? coinRatio : null,
    coinActualCm: modeId === 'coin_500' ? 2.65 : 2.4,
  };
}

const AlopeciaAreataView = ({ onBack = null, user = null, onRequireAuth = null }) => {
  const [activeQuadrant, setActiveQuadrant] = useState('top');
  const [quadrantImages, setQuadrantImages] = useState({
    top: null,
    back: null,
    left: null,
    right: null,
  });
  const [quadrantResults, setQuadrantResults] = useState({
    top: null,
    back: null,
    left: null,
    right: null,
  });

  // 정밀 직경 스케일 보정 상태
  const [calibrationMode, setCalibrationMode] = useState('auto_fov');
  const [coinSpanRatio, setCoinSpanRatio] = useState(0.185);
  const [coinCenter, setCoinCenter] = useState({ x: 0.24, y: 0.26 });

  // 인터랙티브 디지털 버니어 캘리퍼스
  const [caliperActive, setCaliperActive] = useState(true);
  const [caliperPoints, setCaliperPoints] = useState(() => normalizeCaliperPoints(null, false));
  const [draggingHandle, setDraggingHandle] = useState(null);

  const [checklist, setChecklist] = useState({
    nailPitting: false,
    atopyOrThyroid: false,
    eyebrowLoss: false,
    ophiasisBand: false,
    rapidPullTest: false,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [finalReport, setFinalReport] = useState(null);

  // 개인 진단 기록 저장 상태
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [personalMemo, setPersonalMemo] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  const fileInputRef = useRef(null);
  const viewportRef = useRef(null);
  const recordIdRef = useRef(null);

  const hasAnyScan = Object.values(quadrantImages).some(Boolean);
  const currentResult = quadrantResults[activeQuadrant];
  const currentImg = currentResult?.annotatedImage || quadrantImages[activeQuadrant];
  const effectiveFovCm = currentResult?.effectiveFovWidthCm || 13.6;

  const computeLiveCaliperMetrics = (pts = caliperPoints, fovCm = effectiveFovCm) => {
    const safePts = normalizeCaliperPoints(pts, pts?.isManual);
    const dxCm = (safePts.bx - safePts.ax) * fovCm;
    const dyCm = (safePts.by - safePts.ay) * (fovCm * 0.75);
    const distCm = Math.sqrt(dxCm * dxCm + dyCm * dyCm);
    const diameterCm = Number(Math.max(0.2, Number.isFinite(distCm) ? distCm : 1.8).toFixed(2));
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
      areaCm2,
    };
  };

  const liveCaliper = computeLiveCaliperMetrics();

  const persistCurrentSaltRecord = async ({
    reportToSave = finalReport,
    imagesToSave = quadrantImages,
    resultsToSave = quadrantResults,
    modeToSave = calibrationMode,
    fovToSave = effectiveFovCm,
    manualFlag = caliperPoints.isManual,
    memoText = personalMemo,
    isManualSave = false,
  } = {}) => {
    if (!reportToSave) return null;
    const saved = await saveAreataDiagnosisRecord({
      member: user,
      finalReport: reportToSave,
      quadrantImages: imagesToSave,
      quadrantResults: resultsToSave,
      activeQuadrant,
      calibrationMode: modeToSave,
      effectiveFovCm: fovToSave,
      caliperManual: manualFlag,
      memo: memoText,
      existingRecordId: recordIdRef.current,
      isManualSave,
    });
    if (saved?.id) {
      recordIdRef.current = saved.id;
      setActiveRecordId(saved.id);
    }
    return saved;
  };

  const processQuadrantImageDataUrl = async (dataUrl, targetQuad = activeQuadrant) => {
    if (!dataUrl) return;
    const nextImages = { ...quadrantImages, [targetQuad]: dataUrl };
    setQuadrantImages(nextImages);
    setIsAnalyzing(true);
    try {
      const calOpts = buildCalibrationOptions(calibrationMode, coinSpanRatio);
      const analysis = await analyzeAlopeciaAreataImage(dataUrl, targetQuad, calOpts);
      const nextResults = { ...quadrantResults, [targetQuad]: analysis };
      setQuadrantResults(nextResults);

      if (analysis?.defaultCaliper) {
        setCaliperPoints(normalizeCaliperPoints(analysis.defaultCaliper, false));
      }

      const report = calculateFinalAlopeciaAreataReport(nextResults, checklist);
      setFinalReport(report);

      await persistCurrentSaltRecord({
        reportToSave: report,
        imagesToSave: nextImages,
        resultsToSave: nextResults,
        modeToSave: calibrationMode,
        fovToSave: analysis?.effectiveFovWidthCm || effectiveFovCm,
        manualFlag: false,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reanalyzeWithScale = async (nextMode = calibrationMode, nextCoinRatio = coinSpanRatio) => {
    if (!hasAnyScan) return;

    const calOpts = buildCalibrationOptions(nextMode, nextCoinRatio);
    const nextResults = { ...quadrantResults };
    for (const q of SALT_QUADRANTS) {
      if (quadrantImages[q.id]) {
        nextResults[q.id] = await analyzeAlopeciaAreataImage(quadrantImages[q.id], q.id, calOpts);
      }
    }
    setQuadrantResults(nextResults);

    const activeRes = nextResults[activeQuadrant];
    if (activeRes?.defaultCaliper) {
      setCaliperPoints(normalizeCaliperPoints(activeRes.defaultCaliper, false));
    }

    const report = calculateFinalAlopeciaAreataReport(nextResults, checklist);
    setFinalReport(report);

    await persistCurrentSaltRecord({
      reportToSave: report,
      resultsToSave: nextResults,
      modeToSave: nextMode,
      fovToSave: activeRes?.effectiveFovWidthCm || effectiveFovCm,
      manualFlag: false,
    });
  };

  const handleSelectCalibrationMode = async (modeId) => {
    setCalibrationMode(modeId);
    await reanalyzeWithScale(modeId, coinSpanRatio);
  };

  const handleCoinRatioChange = async (newRatio) => {
    setCoinSpanRatio(newRatio);
    await reanalyzeWithScale(calibrationMode, newRatio);
  };

  const handleToggleChecklistItem = async (key) => {
    const nextChecklist = { ...checklist, [key]: !checklist[key] };
    setChecklist(nextChecklist);
    if (hasAnyScan) {
      const override = caliperPoints.isManual
        ? { diameterCm: liveCaliper.diameterCm, areaCm2: liveCaliper.areaCm2 }
        : null;
      const report = calculateFinalAlopeciaAreataReport(quadrantResults, nextChecklist, override);
      setFinalReport(report);
      await persistCurrentSaltRecord({ reportToSave: report, manualFlag: caliperPoints.isManual });
    }
  };

  const handleQuadrantSwitch = (quadId) => {
    setActiveQuadrant(quadId);
    const existingRes = quadrantResults[quadId];
    if (existingRes?.defaultCaliper) {
      setCaliperPoints(normalizeCaliperPoints(existingRes.defaultCaliper, false));
    }
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

    setCaliperPoints((prev) => {
      const safePrev = normalizeCaliperPoints(prev, true);
      const updated =
        draggingHandle === 'A'
          ? { ...safePrev, ax: nx, ay: ny, isManual: true }
          : { ...safePrev, bx: nx, by: ny, isManual: true };

      if (finalReport && currentResult) {
        const metrics = computeLiveCaliperMetrics(updated, effectiveFovCm);
        const manualReport = calculateFinalAlopeciaAreataReport(quadrantResults, checklist, {
          diameterCm: metrics.diameterCm,
          areaCm2: metrics.areaCm2,
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
    const onUp = () => {
      setDraggingHandle(null);
      if (finalReport) {
        persistCurrentSaltRecord({ manualFlag: true }).catch(() => {});
      }
    };
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

  const handleResetCaliperToAI = async () => {
    if (!currentResult?.defaultCaliper) return;
    setCaliperPoints(normalizeCaliperPoints(currentResult.defaultCaliper, false));
    const report = calculateFinalAlopeciaAreataReport(quadrantResults, checklist);
    setFinalReport(report);
    await persistCurrentSaltRecord({ reportToSave: report, manualFlag: false });
  };

  const runWithAuthCheck = (actionFn) => {
    if (!user && onRequireAuth) {
      onRequireAuth({
        mode: 'signup',
        featureName: '원형탈모(SALT) 정밀 진단 및 개인 기록 저장',
        onSuccess: () => {
          setTimeout(() => actionFn(), 100);
        },
      });
      return;
    }
    actionFn();
  };

  const handleTriggerUpload = () => {
    runWithAuthCheck(() => fileInputRef.current?.click());
  };

  const handleRunVerifiedSample = (presetType = 'single_s1') => {
    runWithAuthCheck(async () => {
      setIsAnalyzing(true);
      try {
        const sampleDataUrl = await generateVerifiedAlopeciaSample(presetType);
        if (sampleDataUrl) {
          await processQuadrantImageDataUrl(sampleDataUrl, activeQuadrant);
        }
      } finally {
        setIsAnalyzing(false);
      }
    });
  };

  const handleFileUpload = (e, targetQuad = activeQuadrant) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await processQuadrantImageDataUrl(ev.target.result, targetQuad);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveManualMemo = async () => {
    await persistCurrentSaltRecord({
      memoText: personalMemo,
      isManualSave: true,
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2400);
  };

  const handleReset = () => {
    setQuadrantImages({ top: null, back: null, left: null, right: null });
    setQuadrantResults({ top: null, back: null, left: null, right: null });
    setFinalReport(null);
    setActiveQuadrant('top');
    setPersonalMemo('');
    recordIdRef.current = null;
    setActiveRecordId(null);
  };

  const isCoinMode = calibrationMode === 'coin_100' || calibrationMode === 'coin_500';
  const coinRefDiameterCm = calibrationMode === 'coin_500' ? 2.65 : 2.4;

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
                width: 'fit-content',
              }}
            >
              <ArrowLeft size={13} /> 이전으로
            </button>
          )}
          <h1 className="tab-banner-title">원형탈모(SALT) 정밀 진단</h1>
          <p className="tab-banner-sub">국제 SALT 척도(S0~S5) · 정밀 직경 계측 · 개인 기록 저장</p>
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

        {!hasAnyScan ? (
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
              원형탈모 의심 부위 사진을 등록하면 즉시 탈모반 장축·단축 직경(cm) 계측 및 국제 SALT 등급 진단을 시작하고 내 기록에 자동 저장합니다.
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Upload size={16} />
              <span>
                {isAnalyzing
                  ? '원형탈모 정밀 분석 중...'
                  : user
                  ? '원형탈모 사진 등록 · 진단 시작하기 →'
                  : '🔒 회원가입 후 원형탈모 진단 시작하기 →'}
              </span>
            </button>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginTop: '10px',
              }}
            >
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleRunVerifiedSample('single_s1')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  background: 'rgba(212, 175, 55, 0.09)',
                  color: '#E5C158',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <FlaskConical size={13} /> 단발성(S1·2.4cm) 샘플 테스트
              </button>
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleRunVerifiedSample('multiple_s2')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#ccc',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <FlaskConical size={13} /> 다발성(3개 병변) 샘플 테스트
              </button>
            </div>
          </div>
        ) : (
          /* 사진 등록 후: 4대 구역 탭 + 정밀 직경 보정 + 캘리퍼스 뷰포트 + SALT 진단 리포트 + 개인 기록 저장 */
          <div className="fade-in">
            {/* SALT 4대 두피 구역 선택 바 (다발성·다구역 스캔 지원) */}
            <div
              style={{
                background: '#121217',
                border: '1px solid rgba(212, 175, 55, 0.28)',
                borderRadius: '11px',
                padding: '9px 10px',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#bbb', marginBottom: '6px', fontWeight: 700 }}>
                📍 SALT 두피 구역 선택 (여러 부위에 탈모반이 있으면 구역별로 추가 등록 가능)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                {[
                  { id: 'top', short: '정수리 40%' },
                  { id: 'back', short: '후두부 24%' },
                  { id: 'left', short: '좌측 18%' },
                  { id: 'right', short: '우측 18%' },
                ].map((q) => {
                  const isCurrent = activeQuadrant === q.id;
                  const isDone = Boolean(quadrantResults[q.id]);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleQuadrantSwitch(q.id)}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '7px',
                        border: isCurrent ? '1.5px solid #D4AF37' : '1px solid #2b2b33',
                        background: isCurrent
                          ? 'rgba(212, 175, 55, 0.2)'
                          : isDone
                          ? 'rgba(0, 230, 118, 0.1)'
                          : '#18181f',
                        color: isCurrent ? '#D4AF37' : isDone ? '#81C784' : '#999',
                        fontSize: '0.67rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {isDone ? `✓ ${q.short}` : q.short}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 선택한 구역에 아직 사진이 없을 때 업로드 안내 */}
            {!currentImg ? (
              <div
                style={{
                  background: '#14141a',
                  border: '1px dashed rgba(212, 175, 55, 0.45)',
                  borderRadius: '12px',
                  padding: '20px 14px',
                  textAlign: 'center',
                  marginBottom: '12px',
                }}
              >
                <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#ccc' }}>
                  선택하신 <strong>{SALT_QUADRANTS.find((q) => q.id === activeQuadrant)?.label}</strong> 구역 사진을 등록하면 전체 SALT 점수에 가중 합산됩니다.
                </p>
                <button
                  type="button"
                  onClick={handleTriggerUpload}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #D4AF37, #B68D2C)',
                    color: '#000',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  이 구역 사진 추가 등록하기 →
                </button>
              </div>
            ) : (
              <>
                {/* 정밀 직경 오차 보정 컨트롤 */}
                <div
                  style={{
                    background: '#121217',
                    border: '1px solid rgba(212, 175, 55, 0.35)',
                    borderRadius: '12px',
                    padding: '11px 12px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '7px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        color: '#D4AF37',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Ruler size={14} /> 직경 오차 정밀 보정 (촬영 거리 · 동전 기준 · 캘리퍼스)
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#81C784', fontWeight: 700 }}>
                      1mm(0.1cm) 단위 계측
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '5px',
                      marginBottom: '8px',
                    }}
                  >
                    {SCALE_CALIBRATION_PRESETS.map((preset) => {
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
                            textAlign: 'center',
                          }}
                        >
                          <div>{preset.label}</div>
                          <div
                            style={{
                              fontSize: '0.59rem',
                              color: active ? '#f5f0e8' : '#777',
                              fontWeight: 500,
                            }}
                          >
                            {preset.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {isCoinMode && (
                    <div
                      style={{
                        background: 'rgba(0, 230, 118, 0.08)',
                        border: '1px solid rgba(0, 230, 118, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        marginBottom: '6px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.69rem',
                          color: '#81C784',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        <span>🪙 기준 동전({coinRefDiameterCm}cm) 가이드 원 크기 맞춤</span>
                        <span>
                          화면 폭의 {Math.round(coinSpanRatio * 100)}% = {coinRefDiameterCm}cm
                        </span>
                      </div>
                      <input
                        type="range"
                        aria-label="기준 동전 가이드 원 크기 비율"
                        min="0.10"
                        max="0.36"
                        step="0.005"
                        value={coinSpanRatio}
                        onChange={(e) => handleCoinRatioChange(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#00E676', cursor: 'pointer' }}
                      />
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: '0.66rem',
                      color: '#999',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      적용 시야폭(FOV): <strong style={{ color: '#D4AF37' }}>가로 {effectiveFovCm}cm</strong>
                    </span>
                    <span>
                      💡 사진 위 <strong style={{ color: '#00E676' }}>[A]·[B] 점</strong> 드래그로 미세 보정
                    </span>
                  </div>
                </div>

                {/* 인터랙티브 캘리퍼스 뷰포트 */}
                <div
                  style={{
                    background: '#111',
                    border: '1.5px solid rgba(212, 175, 55, 0.45)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '12px',
                  }}
                >
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
                      touchAction: 'none',
                    }}
                  >
                    <img
                      src={currentImg}
                      alt="원형탈모 정밀 스캔 결과"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'fill',
                        display: 'block',
                        pointerEvents: 'none',
                      }}
                    />

                    {caliperActive && (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 400 300"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
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
                              rx={Math.max(
                                10,
                                Math.hypot(
                                  (caliperPoints.bx - caliperPoints.ax) * 400,
                                  (caliperPoints.by - caliperPoints.ay) * 300
                                ) / 2
                              )}
                              ry={Math.max(
                                8,
                                Math.hypot(
                                  (caliperPoints.bx - caliperPoints.ax) * 400,
                                  (caliperPoints.by - caliperPoints.ay) * 300
                                ) * 0.44
                              )}
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
                            zIndex: 12,
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
                            zIndex: 12,
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
                          zIndex: 11,
                        }}
                      />
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '6px',
                      padding: '8px 12px',
                      background: '#161616',
                      borderTop: '1px solid #2a2a2a',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 700 }}>
                        {currentResult && currentResult.patchCount > 0
                          ? `실측 직경 Ø ${liveCaliper.diameterCm}cm · 면적 ${liveCaliper.areaCm2}cm²`
                          : '원형탈모 스캔 완료 (병변 미검출)'}
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
                            cursor: 'pointer',
                          }}
                        >
                          <RotateCcw size={11} /> AI 자동점 복원
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        type="button"
                        aria-pressed={caliperActive}
                        onClick={() => setCaliperActive((prev) => !prev)}
                        style={{
                          padding: '5px 8px',
                          background: caliperActive ? 'rgba(0, 230, 118, 0.16)' : '#262626',
                          color: caliperActive ? '#00E676' : '#aaa',
                          border: caliperActive ? '1px solid #00E676' : '1px solid #444',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        📏 캘리퍼스 {caliperActive ? 'ON' : 'OFF'}
                      </button>
                      <button
                        type="button"
                        onClick={handleTriggerUpload}
                        style={{
                          padding: '5px 9px',
                          background: '#262626',
                          color: '#fff',
                          border: '1px solid #444',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          cursor: 'pointer',
                        }}
                      >
                        사진 변경
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        style={{
                          padding: '5px 9px',
                          background: 'rgba(255,82,82,0.15)',
                          color: '#ff8a80',
                          border: '1px solid rgba(255,82,82,0.4)',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          cursor: 'pointer',
                        }}
                      >
                        초기화
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 임상 예후 체크리스트 (선택 토글) */}
            <div
              style={{
                background: '#121217',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '11px',
                padding: '10px 12px',
                marginBottom: '12px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D4AF37', marginBottom: '7px' }}>
                🩺 동반 임상 소견 체크 (해당 시 선택하면 치료 권고안에 즉시 반영)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {CLINICAL_CHECKLIST_ITEMS.map((item) => {
                  const active = checklist[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleToggleChecklistItem(item.key)}
                      style={{
                        padding: '5px 9px',
                        borderRadius: '999px',
                        border: active ? '1px solid #ff8a80' : '1px solid #333',
                        background: active ? 'rgba(255, 82, 82, 0.16)' : '#18181f',
                        color: active ? '#ff8a80' : '#aaa',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {active ? `✓ ${item.label}` : item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 진단 결과 리포트 */}
            {finalReport && (
              <div
                style={{
                  background: '#111',
                  border: '1.5px solid #D4AF37',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      background: '#181818',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #2b2b2b',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.67rem', color: '#888' }}>국제 SALT 등급</span>
                      <span style={{ fontSize: '0.6rem', color: '#64B5F6', fontWeight: 700 }}>
                        ↓ 낮을수록 좋음
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.96rem',
                        fontWeight: 800,
                        color: finalReport.severityColor,
                        marginTop: '3px',
                      }}
                    >
                      {finalReport.saltGrade.split(' ')[0]} ({finalReport.saltScore}점 / 100)
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#aaa', marginTop: '2px' }}>
                      {finalReport.severityLabel} (0점 S0 정상)
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#181818',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #2b2b2b',
                    }}
                  >
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
                  <div
                    style={{
                      background: '#16161c',
                      border: '1px solid rgba(0, 230, 118, 0.28)',
                      borderRadius: '8px',
                      padding: '10px',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 800,
                        color: '#00E676',
                        marginBottom: '6px',
                      }}
                    >
                      📐 검출 탈모반 장축×단축 정밀 치수
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {currentResult.patches.map((p, idx) => {
                        const dispDiam =
                          idx === 0 && caliperPoints.isManual ? liveCaliper.diameterCm : p.diameterCm;
                        const dispMajor =
                          idx === 0 && caliperPoints.isManual
                            ? liveCaliper.majorDiameterCm
                            : p.majorDiameterCm;
                        const dispMinor =
                          idx === 0 && caliperPoints.isManual
                            ? liveCaliper.minorDiameterCm
                            : p.minorDiameterCm;
                        const dispArea =
                          idx === 0 && caliperPoints.isManual
                            ? liveCaliper.areaCm2
                            : p.areaCm2 ?? p.estimatedCm2 ?? 0;
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
                              fontSize: '0.71rem',
                            }}
                          >
                            <span style={{ fontWeight: 700, color: '#f5f0e8' }}>
                              #{p.id} 탈모반 (Ø {dispDiam}cm)
                            </span>
                            <span style={{ color: '#bbb' }}>
                              장축 <strong style={{ color: '#D4AF37' }}>{dispMajor}cm</strong> × 단축{' '}
                              <strong style={{ color: '#D4AF37' }}>{dispMinor}cm</strong> ·{' '}
                              <strong style={{ color: '#81C784' }}>{dispArea}cm²</strong>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {finalReport.riskFactors.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(255, 82, 82, 0.1)',
                      border: '1px solid rgba(255, 82, 82, 0.35)',
                      borderRadius: '8px',
                      padding: '10px',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#ff8a80',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <ShieldAlert size={14} /> 확인된 주의 인자
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '16px',
                        fontSize: '0.72rem',
                        color: '#ffcdd2',
                        lineHeight: 1.5,
                      }}
                    >
                      {finalReport.riskFactors.map((rf, i) => (
                        <li key={i}>{rf}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div
                  style={{
                    background: '#161616',
                    border: '1px solid #2b2b2b',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#D4AF37',
                      marginBottom: '6px',
                    }}
                  >
                    🏥 권장 치료 프로토콜
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      fontSize: '0.74rem',
                      color: '#ddd',
                      lineHeight: 1.55,
                    }}
                  >
                    {finalReport.treatmentRecommendations.map((rec, i) => (
                      <div
                        key={i}
                        dangerouslySetInnerHTML={{
                          __html: `• ${rec.replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong style="color:#D4AF37">$1</strong>'
                          )}`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* 개인 원형탈모 기록 및 메모 저장 카드 */}
                <div
                  style={{
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.35)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}
                  >
                    <label
                      htmlFor="areata-personal-memo"
                      style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37' }}
                    >
                      💾 내 원형탈모 개인 진단 기록 · 치료 메모 저장
                    </label>
                    <span style={{ fontSize: '0.66rem', color: '#81C784', fontWeight: 700 }}>
                      ✓ 스캔 데이터 자동 보관됨
                    </span>
                  </div>
                  <textarea
                    id="areata-personal-memo"
                    name="areataPersonalMemo"
                    rows={2}
                    placeholder="예: 피부과 트리암시놀론 국소주사 1차 직후 기록 (직경 변화 추적용)"
                    value={personalMemo}
                    onChange={(e) => setPersonalMemo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '7px',
                      border: '1px solid #333',
                      background: '#16161d',
                      color: '#fff',
                      fontSize: '0.76rem',
                      marginBottom: '8px',
                      resize: 'vertical',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveManualMemo}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #D4AF37, #B68D2C)',
                      color: '#000',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    {saveToast ? (
                      <>
                        <CheckCircle2 size={15} /> 내 개인 진단 기록에 저장 완료!
                      </>
                    ) : (
                      <>
                        <Save size={15} /> 내 원형탈모 진단 기록·메모 저장하기
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 내 원형탈모(SALT) 저장 기록 목록 */}
        <DiagnosisHistoryPanel
          user={user}
          initialCategory="areata"
          allowCategorySwitch={false}
          highlightRecordId={activeRecordId}
          onRequireAuth={onRequireAuth}
          title="📋 내 원형탈모(SALT) 누적 진단 기록"
        />
      </div>
    </div>
  );
};

export default AlopeciaAreataView;
