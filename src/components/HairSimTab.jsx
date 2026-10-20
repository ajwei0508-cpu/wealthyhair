import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CLINICAL_VERIFICATION_CASES,
  compareBeforeAfterImages,
  simulateHairGrowthClientSide,
} from '../utils/beforeAfterAnalyzer';
import { PrivacyMembershipNoticeCard } from './AuthGate';
import './HairSimTab.css';
import './MedicationTab.css';

// ── 복약 성분별 1·3·6·12개월 핵심 경과 데이터 ──────────────────────────────────
const DRUG_DATA = {
  finasteride: {
    name: '피나스테리드 1mg (프로페시아·피나온)',
    shortName: '피나스테리드 1mg',
    mechanism: '두피 DHT를 약 65~70% 억제하여 모낭 축소를 막고 가늘어진 연모를 굵은 성모로 회복시킵니다.',
    months: {
      1: { density: 8, description: 'DHT 감소 시작 단계로 빠지는 모발 수가 줄어들기 시작합니다.', recovery: 'DHT 억제 · 탈락 감소', color: '#6B8E6E' },
      3: { density: 28, description: '휴지기 모낭이 성장기로 전환되며 잔머리와 모발 밀도가 약 +10% 증가합니다.', recovery: '모발 밀도 +10% 회복', color: '#4CAF50' },
      6: { density: 46, description: '가르마와 M자 경계부 모발이 굵어지며 육안으로 두피 비침 완화가 확인됩니다.', recovery: '모발 굵기·볼륨 본격 회복', color: '#81C784' },
      12: { density: 62, description: '1cm²당 평균 +18~22모 증가하며 최대 임상 발모 효과 구간에 도달합니다.', recovery: '최대 밀도 회복 (+20모/cm²)', color: '#D4AF37' },
    },
  },
  dutasteride: {
    name: '두타스테리드 0.5mg (아보다트·두타온)',
    shortName: '두타스테리드 0.5mg',
    mechanism: '1형·2형 효소를 이중 차단하여 DHT를 92% 이상 억제하며 전두부(M자)·정수리 동시 회복에 탁월합니다.',
    months: {
      1: { density: 12, description: '혈중 DHT 90% 이상 급감과 함께 두피 피지·열감이 빠르게 완화됩니다.', recovery: 'DHT 92% 이중 차단', color: '#8B7E6E' },
      3: { density: 38, description: 'M자 경계와 정수리에서 초기 신생모 출현 및 밀도 +17% 증가가 관찰됩니다.', recovery: '모발 밀도 +17% 회복', color: '#4CAF50' },
      6: { density: 58, description: '전두부(M자) 및 정수리 모간 굵기가 뚜렷하게 굵어지고 피복률이 상승합니다.', recovery: '전두부·정수리 동시 개선', color: '#81C784' },
      12: { density: 74, description: '단일 경구제 중 가장 높은 모낭 밀도 회복률을 기록합니다.', recovery: '최상위 밀도 회복 (+26모/cm²)', color: '#D4AF37' },
    },
  },
  minoxidil: {
    name: '미녹시딜 5% (로게인폼·마이녹실)',
    shortName: '미녹시딜 5%',
    mechanism: '모낭 미세혈류를 확장하고 성장인자(VEGF)를 유도하여 모낭 크기를 직접 키웁니다.',
    months: {
      1: { density: 6, description: '새 머리가 자라기 위해 기존 휴지기 모발이 밀려나는 쉐딩이 일시적으로 나타날 수 있습니다.', recovery: '성장기 전환 유도', color: '#8B6E6E' },
      3: { density: 34, description: '가르마와 헤어라인 부위에 솜털과 신생 연모가 뚜렷하게 올라옵니다.', recovery: '신생 잔머리 출현', color: '#4CAF50' },
      6: { density: 50, description: '모발 직경이 굵어지며 가르마 폭과 두피 비침이 눈에 띄게 줄어듭니다.', recovery: '가르마 비침 감소', color: '#81C784' },
      12: { density: 56, description: '성장기 모발 비율이 안정적으로 유지됩니다.', recovery: '볼륨·밀도 안정 유지', color: '#D4AF37' },
    },
  },
  combination: {
    name: '복합요법 (경구 DHT 억제제 + 미녹시딜)',
    shortName: '경구약 + 미녹시딜 복합',
    mechanism: 'DHT 차단(수비)과 모낭 혈류 촉진(공격)을 병행하여 단독 요법 대비 34% 이상 높은 발모 시너지를 냅니다.',
    months: {
      1: { density: 15, description: '탈모 원인 차단과 혈류 공급이 동시에 작동합니다.', recovery: '이중 시너지 가동', color: '#7BA87E' },
      3: { density: 48, description: '단독 복용 대비 가장 빠른 초기 모발 밀도 증가를 보입니다.', recovery: '초기 발모 속도 극대화', color: '#4CAF50' },
      6: { density: 68, description: '헤어라인과 정수리 모두에서 뚜렷한 모낭 밀도 상승이 확인됩니다.', recovery: '모발 피복률 +68% 구간', color: '#81C784' },
      12: { density: 84, description: '비수술적 약물 치료 중 가장 높은 모발 회복 결과를 달성합니다.', recovery: '약물 치료 최고 회복 (+32모/cm²)', color: '#D4AF37' },
    },
  },
};

// ── Before / After 드래그 슬라이더 ────────────────────────
const BeforeAfterSlider = ({ beforeSrc, afterSrc, isLoading, monthColor = '#D4AF37', rightLabel = '복약 후' }) => {
  const [pos, setPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const updatePos = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(Math.max(x, 2), 98));
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => updatePos(e.clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, updatePos]);

  return (
    <div className="ba-outer">
      <div
        ref={containerRef}
        className={`ba-slider${isDragging ? ' ba-dragging' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          updatePos(e.touches[0].clientX);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          updatePos(e.touches[0].clientX);
        }}
        onTouchEnd={() => setIsDragging(false)}
      >
        <div className="ba-layer">
          {beforeSrc && <img src={beforeSrc} alt="복약 전" className="ba-img" />}
          <div className="ba-tag ba-tag-before">복약 전 (Before)</div>
        </div>

        <div className="ba-layer ba-after-layer" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {isLoading ? (
            <div className="ba-overlay">
              <div className="ba-ring"><div /><div /><div /><div /></div>
              <p className="ba-load-text">복약 후 모발 밀도 시뮬레이션 생성 중...</p>
            </div>
          ) : afterSrc ? (
            <img src={afterSrc} alt="복약 후" className="ba-img ba-img-in" />
          ) : null}
          <div className="ba-tag ba-tag-after" style={{ color: monthColor }}>
            {rightLabel}
          </div>
        </div>

        <div className="ba-div-wrap" style={{ left: `${pos}%` }}>
          <div className="ba-div-line" />
          <div className="ba-div-handle">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <path d="M8 5.5L3 11L8 16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 5.5L19 11L14 16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      <p className="ba-hint">← 슬라이더를 좌우로 움직여 복약 전·후 변화를 비교해 보세요 →</p>
    </div>
  );
};

// ── 복약 전·후 정량 비교 요약 카드 ────────────────────────────────────────────
const QuantitativeMetricsPanel = ({ metrics }) => {
  if (!metrics) return null;
  const isPositive = metrics.coverageGain >= 0;

  return (
    <div
      style={{
        background: 'rgba(18, 18, 22, 0.96)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        borderRadius: '12px',
        padding: '12px',
        marginTop: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f5f0e8' }}>
          📊 복약 전·후 모발 밀도 변화 수치
        </span>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            background: 'rgba(76, 175, 80, 0.16)',
            color: '#81C784',
          }}
        >
          {metrics.gradeText}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '9px', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.68rem', color: '#999' }}>모발 피복률 변화</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
            {metrics.beforeCoverage}% → <span style={{ color: '#4CAF50' }}>{metrics.afterCoverage}%</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: isPositive ? '#81C784' : '#FF8A80', fontWeight: 700 }}>
            {isPositive ? `+${metrics.coverageGain}%p 증가` : `${metrics.coverageGain}%p`}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '9px', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.68rem', color: '#999' }}>단위면적 모낭 밀도</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
            {metrics.beforeFollicularDensity} → <span style={{ color: '#D4AF37' }}>{metrics.afterFollicularDensity}</span>
            <span style={{ fontSize: '0.65rem', color: '#aaa' }}> 모/cm²</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#D4AF37', fontWeight: 700 }}>
            +{metrics.follicularDensityDelta} 모/cm² 회복
          </div>
        </div>
      </div>
    </div>
  );
};

// ── 메인 HairSimTab ──────────────────────────────────────────────
const HairSimTab = ({ user = null, onRequireAuth = null }) => {
  const [selectedCase, setSelectedCase] = useState(CLINICAL_VERIFICATION_CASES[0]);
  const [selectedDrug, setSelectedDrug] = useState('dutasteride');
  const [selectedMonth, setSelectedMonth] = useState(6);
  const [simResult, setSimResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // 내 사진 업로드 상태 (회원 전용)
  const [customBefore, setCustomBefore] = useState(null);
  const [customAfter, setCustomAfter] = useState(null);
  const [customMetrics, setCustomMetrics] = useState(null);
  const mySimInputRef = useRef(null);
  const beforeInputRef = useRef(null);
  const afterInputRef = useRef(null);

  const runSimulation = useCallback(async (imgSrc, drugKey, monthNum) => {
    if (!imgSrc) return;
    setIsRunning(true);
    try {
      const drugInfo = DRUG_DATA[drugKey] || DRUG_DATA.dutasteride;
      const res = await simulateHairGrowthClientSide(imgSrc, {
        month: monthNum,
        drugName: drugInfo.name,
        targetDensityGain: drugInfo.months[monthNum]?.density || 45,
      });
      setSimResult(res);
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setIsRunning(false);
    }
  }, []);

  useEffect(() => {
    runSimulation(selectedCase.beforeImage, selectedDrug, selectedMonth);
  }, [selectedCase, selectedDrug, selectedMonth, runSimulation]);

  const requireAuthOrRun = (featureLabel, callback) => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth({
          mode: 'signup',
          featureName: featureLabel,
          onSuccess: () => callback && callback(),
        });
      }
      return;
    }
    if (callback) callback();
  };

  const handleMyPhotoSimulate = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setSelectedCase({
        id: 'custom_user',
        title: '내 모발 사진 맞춤 복약 경과 예측',
        stage: '개인 맞춤 시뮬레이션',
        beforeImage: dataUrl,
        sampleMetrics: {
          beforeDensity: 95,
          after3MDensity: 114,
          after6MDensity: 131,
          after12MDensity: 145,
          hairlineGainMm: '맞춤 모낭 밀도 회복 예측'
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCustomCompareUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      if (type === 'before') {
        setCustomBefore(dataUrl);
        if (customAfter) {
          const m = await compareBeforeAfterImages(dataUrl, customAfter);
          setCustomMetrics(m);
        }
      } else {
        setCustomAfter(dataUrl);
        if (customBefore) {
          const m = await compareBeforeAfterImages(customBefore, dataUrl);
          setCustomMetrics(m);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const currentDrugInfo = DRUG_DATA[selectedDrug] || DRUG_DATA.dutasteride;
  const currentMonthInfo = currentDrugInfo.months[selectedMonth] || currentDrugInfo.months[6];
  const sampleM = selectedCase.sampleMetrics || CLINICAL_VERIFICATION_CASES[0].sampleMetrics;

  return (
    <div className="sim-container fade-in" style={{ paddingBottom: '90px' }}>
      {/* 깔끔한 배너 */}
      <div className="tab-banner">
        <img src="/assets/banners/banner_simulator.jpg" alt="복약 전후 변화 샘플" className="tab-banner-img" />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">복약 전·후 예상 경과 확인</h1>
          <p className="tab-banner-sub">복약 전·후 변화 샘플 미리보기 및 1·3·6·12개월 발모 시뮬레이션</p>
        </div>
      </div>

      <div style={{ padding: '14px' }}>
        {/* 간결한 개인정보 보호 및 회원가입 유도 배너 */}
        <PrivacyMembershipNoticeCard
          user={user}
          featureType="simulator"
          onOpenAuth={onRequireAuth}
        />

        {/* ====================================================================
            1. 복약 전·후 변화 샘플 (혐오감 없는 무난한 스튜디오 예시 + 슬라이더)
        ==================================================================== */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(22, 22, 26, 0.98), rgba(14, 14, 18, 0.98))',
            border: '1px solid rgba(212, 175, 55, 0.38)',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#D4AF37', fontWeight: 700 }}>
                BEFORE & AFTER SAMPLE
              </span>
              <h3 style={{ fontSize: '0.92rem', color: '#f5f0e8', fontWeight: 800, margin: '2px 0 0' }}>
                ✨ 복약 전·후 변화 샘플 (유형별 경과 예시)
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.66rem',
                padding: '3px 8px',
                borderRadius: '999px',
                background: 'rgba(76, 175, 80, 0.16)',
                color: '#81C784',
                fontWeight: 700,
              }}
            >
              {currentMonthInfo.recovery}
            </span>
          </div>

          {/* 3가지 무난한 탈모 예시 선택 탭 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
            {CLINICAL_VERIFICATION_CASES.slice(0, 3).map((item) => {
              const active = selectedCase.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedCase(item)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    border: active ? '1.5px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                    background: active ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#D4AF37' : '#aaa',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {item.category} 샘플
                </button>
              );
            })}
          </div>

          {/* 약물 선택 & 개월 수 선택 */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {[
              { id: 'finasteride', label: '피나스테리드' },
              { id: 'dutasteride', label: '두타스테리드' },
              { id: 'minoxidil', label: '미녹시딜' },
              { id: 'combination', label: '복합요법' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDrug(d.id)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: selectedDrug === d.id ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                  background: selectedDrug === d.id ? '#D4AF37' : 'transparent',
                  color: selectedDrug === d.id ? '#000' : '#ccc',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
            {[1, 3, 6, 12].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonth(m)}
                style={{
                  padding: '7px',
                  borderRadius: '8px',
                  border: selectedMonth === m ? '1px solid #4CAF50' : '1px solid rgba(255,255,255,0.08)',
                  background: selectedMonth === m ? 'rgba(76, 175, 80, 0.18)' : 'rgba(255,255,255,0.03)',
                  color: selectedMonth === m ? '#81C784' : '#999',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {m}개월 후
              </button>
            ))}
          </div>

          {/* 인터랙티브 전/후 비교 슬라이더 */}
          <BeforeAfterSlider
            beforeSrc={selectedCase.beforeImage}
            afterSrc={simResult?.predicted_image}
            isLoading={isRunning}
            monthColor={currentMonthInfo.color}
            rightLabel={`${selectedMonth}개월 복약 후 (${currentDrugInfo.shortName})`}
          />

          {/* 한눈에 보는 복약 전 -> 3·6·12개월 밀도 회복 타임라인 샘플 */}
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px',
              padding: '10px 12px',
              marginTop: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#D4AF37', fontWeight: 700, marginBottom: '8px' }}>
              <span>📈 기간별 모낭 밀도 회복 추이 샘플</span>
              <span style={{ color: '#81C784' }}>{sampleM.hairlineGainMm}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
              {[
                { label: '복약 전', val: `${sampleM.beforeDensity}모`, pct: 55, color: '#888' },
                { label: '3개월 후', val: `${sampleM.after3MDensity}모`, pct: 70, color: '#4CAF50' },
                { label: '6개월 후', val: `${sampleM.after6MDensity}모`, pct: 85, color: '#81C784' },
                { label: '12개월 후', val: `${sampleM.after12MDensity}모`, pct: 98, color: '#D4AF37' },
              ].map((stepItem, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '7px 4px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.64rem', color: '#999' }}>{stepItem.label}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: stepItem.color, margin: '3px 0' }}>
                    {stepItem.val}/cm²
                  </div>
                  <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden', margin: '0 6px' }}>
                    <div style={{ width: `${stepItem.pct}%`, height: '100%', background: stepItem.color }} />
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '0.73rem', color: '#ccc', margin: '8px 0 0', lineHeight: 1.45 }}>
              {currentMonthInfo.description}
            </p>
          </div>

          {simResult?.metrics && <QuantitativeMetricsPanel metrics={simResult.metrics} />}
        </div>

        {/* ====================================================================
            2. 내 사진으로 직접 복약 경과 예측 & 전·후 비교 (개인정보 보호 회원 전용)
        ==================================================================== */}
        <div
          style={{
            background: '#121216',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '14px',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f5f0e8', marginBottom: '4px' }}>
            📸 내 사진으로 복약 전·후 경과 확인하기
          </div>
          <p style={{ fontSize: '0.73rem', color: '#aaa', margin: '0 0 12px', lineHeight: 1.45 }}>
            내 현재 사진을 등록해 1·3·6·12개월 후 발모 경과를 예측하거나, 실제 복약 전·후 사진 2장을 비교합니다.
          </p>

          <input
            ref={mySimInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleMyPhotoSimulate}
          />

          <button
            type="button"
            onClick={() => requireAuthOrRun('내 사진 복약 경과 시뮬레이션', () => mySimInputRef.current?.click())}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              marginBottom: '12px',
            }}
          >
            {user
              ? '📷 내 모발 사진 등록하고 1·3·6·12개월 경과 예측하기'
              : '🔒 회원가입 후 내 사진으로 복약 경과 예측하기'}
          </button>

          {/* 실제 복용 전/후 2장 비교 슬롯 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div
              onClick={() => requireAuthOrRun('복약 전·후 사진 비교', () => beforeInputRef.current?.click())}
              style={{
                border: '1px dashed rgba(212, 175, 55, 0.4)',
                borderRadius: '10px',
                padding: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <input
                ref={beforeInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleCustomCompareUpload(e, 'before')}
              />
              {customBefore ? (
                <img src={customBefore} alt="Before" style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '6px' }} />
              ) : (
                <div style={{ padding: '14px 0', color: '#aaa', fontSize: '0.73rem', fontWeight: 600 }}>
                  📥 복약 전(Before) 사진
                </div>
              )}
            </div>

            <div
              onClick={() => requireAuthOrRun('복약 전·후 사진 비교', () => afterInputRef.current?.click())}
              style={{
                border: '1px dashed rgba(76, 175, 80, 0.45)',
                borderRadius: '10px',
                padding: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <input
                ref={afterInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleCustomCompareUpload(e, 'after')}
              />
              {customAfter ? (
                <img src={customAfter} alt="After" style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '6px' }} />
              ) : (
                <div style={{ padding: '14px 0', color: '#81C784', fontSize: '0.73rem', fontWeight: 600 }}>
                  📥 복약 후(After) 사진
                </div>
              )}
            </div>
          </div>

          {customMetrics && <QuantitativeMetricsPanel metrics={customMetrics} />}
        </div>
      </div>
    </div>
  );
};

export default HairSimTab;
