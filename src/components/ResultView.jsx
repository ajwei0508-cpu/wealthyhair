import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';
import './ResultView.css';

const ResultView = ({ images, onReset }) => {
  const [mainTab, setMainTab] = useState('Overview');
  const [subTab, setSubTab] = useState('Front');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [imgDim, setImgDim] = useState({ width: 640, height: 480 });
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyScore, setSurveyScore] = useState(0);
  const [surveyFeedback, setSurveyFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const sliderRef = useRef(null);

  const diagnosisData = arguments[0]?.diagnosisData || {};

  const norwood = diagnosisData?.norwood || '분석 완료';
  const ludwig = diagnosisData?.ludwig || '분석 완료';
  const sinclair = diagnosisData?.sinclair || 'Grade 2';
  const basp = diagnosisData?.basp || 'Basic M1';
  const summary = diagnosisData?.summary || '진단 데이터를 불러왔습니다.';
  const features = diagnosisData?.features || {};
  const boxes = diagnosisData?.boxes || {};
  const masks = diagnosisData?.masks || {};
  const hasHairLoss =
    diagnosisData?.hasHairLoss !== undefined
      ? diagnosisData.hasHairLoss
      : Boolean(features.mShapeRecession || features.vertexThinning);

  // 종합 모발 건강 점수 (0~100점: 높을수록 좋음 ↑)
  const computedHealthScore =
    diagnosisData?.healthScore ??
    Math.max(
      25,
      Math.min(
        96,
        Math.round(
          100 -
            Math.max(0, (140 - (features.follicularDensityEstimate ?? 116)) * 0.55) -
            Math.max(0, ((features.partingWidthMm ?? 2.4) - 1.8) * 4.5) -
            Math.max(0, (features.mShapeDepthDelta ?? 6.5) * 0.4)
        )
      )
    );
  const healthGradeLabel =
    diagnosisData?.healthGradeLabel ||
    (computedHealthScore >= 82
      ? '양호·정상 (80점 이상)'
      : computedHealthScore >= 68
      ? '초기 주의 (골든타임)'
      : computedHealthScore >= 50
      ? '중기 진행 (집중 케어 권장)'
      : '심화 단계 (적극적 치료 필요)');

  const handleSurveySubmit = async () => {
    if (surveyScore === 0) return;
    setIsSubmitting(true);
    try {
      await supabase.from('surveys').insert([
        {
          score: surveyScore,
          feedback: surveyFeedback,
          norwood: features.gender === 'female' ? ludwig : norwood,
          has_hair_loss: hasHairLoss,
          gender: features.gender || null,
          age: features.age || null,
          ethnicity: features.ethnicity || null,
          goals: features.goals ? features.goals.join(', ') : null,
          family_history: features.familyHistory || null,
          duration: features.duration || null,
          routine: features.routine || null,
          procedure: features.procedure || null,
        },
      ]);
      setSurveySubmitted(true);
      setShowSurveyModal(false);
    } catch (error) {
      console.error('Error submitting survey:', error);
      setSurveySubmitted(true);
      setShowSurveyModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mainTabs = [
    { id: 'Overview', label: '종합 개요' },
    { id: 'Hairline', label: '헤어라인 계측' },
    { id: 'Density', label: '모낭 밀도·홍반' },
  ];

  const subTabs = [
    { id: 'Front', label: '정면' },
    { id: 'Left', label: '좌측' },
    { id: 'Right', label: '우측' },
    { id: 'Top', label: '정수리' },
  ].filter((tab) => {
    const keyMap = { Front: 'front', Left: 'left', Right: 'right', Top: 'vertex' };
    return !!images?.[keyMap[tab.id]];
  });

  const imageKeyMap = {
    Front: 'front',
    Left: 'left',
    Right: 'right',
    Top: 'vertex',
  };

  const currentImageKey = imageKeyMap[subTab];
  const currentImageSrc = images?.[currentImageKey];
  const currentBox = boxes?.[currentImageKey] || [140, 80, 360, 220];
  const currentMask = masks?.[currentImageKey];

  const handlePointerDown = (e) => {
    setIsDragging(true);
    updateSliderPosition(e);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updateSliderPosition(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updateSliderPosition = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    if (x === undefined) return;
    let position = ((x - rect.left) / rect.width) * 100;
    position = Math.max(0, Math.min(100, position));
    setSliderPosition(position);
  };

  useEffect(() => {
    const el = sliderRef.current;
    if (el) {
      const preventTouch = (e) => {
        if (isDragging) e.preventDefault();
      };
      el.addEventListener('touchmove', preventTouch, { passive: false });
      return () => el.removeEventListener('touchmove', preventTouch);
    }
  }, [isDragging]);

  const renderOverlay = () => {
    if (!currentBox || currentBox.length !== 4) return null;
    const [bx, by, bw, bh] = currentBox;

    if (mainTab === 'Overview') {
      return (
        <>
          {currentMask && (
            <img
              src={currentMask}
              className="rv-svg-overlay"
              style={{
                objectFit: 'cover',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 0 8px rgba(0, 230, 118, 0.4))',
              }}
              alt="Hair Mask"
            />
          )}
          <svg
            className="rv-svg-overlay"
            viewBox={`0 0 ${imgDim.width} ${imgDim.height}`}
            preserveAspectRatio="xMidYMid slice"
            style={{ zIndex: 10, pointerEvents: 'none' }}
          >
            {subTab === 'Top' ? (
              <>
                <rect
                  x={bx}
                  y={by}
                  width={bw / 2}
                  height={bh}
                  fill="rgba(255, 82, 82, 0.15)"
                  stroke="rgba(255, 82, 82, 0.8)"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                <text x={bx + 8} y={by + 22} fill="rgba(255, 82, 82, 1)" fontSize="14" fontWeight="bold">
                  우측 밀도 ({features.vertexRightRatio ?? 55}%)
                </text>
                <rect
                  x={bx + bw / 2}
                  y={by}
                  width={bw / 2}
                  height={bh}
                  fill="rgba(0, 150, 255, 0.15)"
                  stroke="rgba(0, 150, 255, 0.8)"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                <text x={bx + bw / 2 + 8} y={by + 22} fill="rgba(0, 150, 255, 1)" fontSize="14" fontWeight="bold">
                  좌측 밀도 ({features.vertexLeftRatio ?? 56}%)
                </text>
                <line x1={bx + bw / 2} y1={by} x2={bx + bw / 2} y2={by + bh} stroke="var(--accent-gold)" strokeWidth="3" />
                <text
                  x={bx + bw / 2}
                  y={Math.max(16, by - 8)}
                  fill="var(--accent-gold)"
                  fontSize="13"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  가르마 폭 {features.partingWidthMm ?? 2.4}mm
                </text>
              </>
            ) : (
              !currentMask && (
                <>
                  <rect
                    x={bx}
                    y={by}
                    width={bw}
                    height={bh}
                    fill="rgba(212, 175, 55, 0.18)"
                    stroke="var(--accent-gold)"
                    strokeWidth="2.5"
                  />
                  <text x={bx + 8} y={by + 22} fill="var(--accent-gold)" fontSize="15" fontWeight="bold">
                    AI 모낭 분석 타겟 영역
                  </text>
                </>
              )
            )}
          </svg>
        </>
      );
    }

    if (mainTab === 'Hairline') {
      const mRecessPx = Math.round(((features.mShapeDepthDelta || 8) / 30) * (bh * 0.45));
      return (
        <svg
          className="rv-svg-overlay"
          viewBox={`0 0 ${imgDim.width} ${imgDim.height}`}
          preserveAspectRatio="xMidYMid slice"
        >
          <line
            x1={bx}
            y1={by + bh * 0.55}
            x2={bx + bw}
            y2={by + bh * 0.55}
            stroke="rgba(76, 175, 80, 0.75)"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          <text x={bx + 8} y={by + bh * 0.55 - 6} fill="#81C784" fontSize="12" fontWeight="bold">
            표준 정상 헤어라인 기준선
          </text>
          <polyline
            points={`${bx},${by + bh * 0.6} ${bx + bw * 0.22},${by + bh * 0.4 - mRecessPx} ${bx + bw * 0.5},${by + bh * 0.48} ${bx + bw * 0.78},${by + bh * 0.4 - mRecessPx} ${bx + bw},${by + bh * 0.6}`}
            fill="none"
            stroke="var(--accent-gold)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx={bx + bw * 0.22} cy={by + bh * 0.4 - mRecessPx} r="6" fill="#FF5252" />
          <circle cx={bx + bw * 0.5} cy={by + bh * 0.48} r="6" fill="var(--accent-gold)" />
          <circle cx={bx + bw * 0.78} cy={by + bh * 0.4 - mRecessPx} r="6" fill="#FF5252" />
        </svg>
      );
    }

    if (mainTab === 'Density') {
      return (
        <svg
          className="rv-svg-overlay"
          viewBox={`0 0 ${imgDim.width} ${imgDim.height}`}
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="heatGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 82, 82, 0.62)" />
              <stop offset="55%" stopColor="rgba(212, 175, 55, 0.38)" />
              <stop offset="100%" stopColor="rgba(76, 175, 80, 0.1)" />
            </radialGradient>
          </defs>
          <ellipse cx={bx + bw / 2} cy={by + bh / 2} rx={bw * 0.65} ry={bh * 0.65} fill="url(#heatGrad)" />
          <text
            x={bx + bw / 2}
            y={by + bh / 2}
            fill="#fff"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
          >
            추정 밀도 {features.follicularDensityEstimate ?? 112} hairs/cm²
          </text>
        </svg>
      );
    }

    return null;
  };

  return (
    <div className="rv-wrapper">
      <header className="rv-header">
        <button className="rv-icon-btn" onClick={onReset} title="처음으로">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1>AI 정밀 모발·두피 진단 리포트</h1>
        <button
          className="rv-icon-btn"
          onClick={() => (window.location.href = '/')}
          title="통합 대시보드로 이동"
        >
          <span className="material-symbols-outlined">dashboard</span>
        </button>
      </header>

      <main className="rv-main-content">
        {/* Top Tabs */}
        <div className="rv-top-tabs">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              className={`rv-tab-btn ${mainTab === tab.id ? 'active' : ''}`}
              onClick={() => setMainTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hero Image Section */}
        <div className="rv-hero-section">
          <div className="rv-image-container">
            {currentImageSrc ? (
              <img
                src={currentImageSrc}
                alt="Base"
                className="rv-base-image"
                onLoad={(e) => setImgDim({ width: e.target.naturalWidth, height: e.target.naturalHeight })}
              />
            ) : (
              <div style={{ color: '#555', textAlign: 'center', paddingTop: '50%' }}>이미지 없음</div>
            )}

            {currentImageSrc && (
              <div className="rv-slider-clip" style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}>
                <img src={currentImageSrc} alt="Overlay Base" className="rv-slider-image" />
                <div className="rv-overlay-layer">{renderOverlay()}</div>
              </div>
            )}

            {currentImageSrc && (
              <div
                className="rv-slider-container"
                ref={sliderRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <div className="rv-slider-line" style={{ left: `${sliderPosition}%` }}>
                  <div className="rv-slider-handle"></div>
                </div>
              </div>
            )}
          </div>

          <div className="rv-sub-tabs">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                className={`rv-sub-tab-btn ${subTab === tab.id ? 'active' : ''}`}
                onClick={() => setSubTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quantitative Clinical Data Cards */}
        <div className="rv-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 💡 산출된 점수·등급이 높으면 좋은지 낮으면 좋은지 한눈에 보는 안내 배너 */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.14), rgba(18, 18, 24, 0.96))',
              border: '1px solid rgba(212, 175, 55, 0.45)',
              borderRadius: '12px',
              padding: '11px 13px',
            }}
          >
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#D4AF37', marginBottom: '6px' }}>
              💡 진단 점수·단계 판독 기준 (높을수록 좋은가요, 낮을수록 좋은가요?)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.71rem', lineHeight: 1.45 }}>
              <div style={{ background: 'rgba(129, 199, 132, 0.1)', border: '1px solid rgba(129, 199, 132, 0.3)', borderRadius: '8px', padding: '7px 9px' }}>
                <div style={{ color: '#81C784', fontWeight: 800, marginBottom: '2px' }}>↑ 높을수록 좋은 지표</div>
                <div style={{ color: '#ddd' }}>
                  • <strong>모발 건강 점수</strong> (80~100점 정상)<br />
                  • <strong>추정 모낭 밀도</strong> (130모/cm² 이상)
                </div>
              </div>
              <div style={{ background: 'rgba(100, 181, 246, 0.1)', border: '1px solid rgba(100, 181, 246, 0.3)', borderRadius: '8px', padding: '7px 9px' }}>
                <div style={{ color: '#64B5F6', fontWeight: 800, marginBottom: '2px' }}>↓ 낮을수록 좋은 지표</div>
                <div style={{ color: '#ddd' }}>
                  • <strong>탈모 단계(Norwood·Ludwig·BASP)</strong>: 1단계가 정상, 클수록 심화<br />
                  • <strong>가르마 폭·M자 후퇴·두피 홍반</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 종합 모발 건강 점수 (0~100점: 높을수록 좋음 ↑) */}
          <div className="rv-card">
            <div className="rv-card-row" style={{ alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 className="rv-card-title" style={{ margin: 0 }}>종합 모발 건강 점수</h3>
                  <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', background: 'rgba(129, 199, 132, 0.18)', color: '#81C784', fontWeight: 800 }}>
                    ↑ 높을수록 좋음
                  </span>
                </div>
                <p className="rv-card-desc" style={{ marginTop: '3px' }}>
                  100점 만점 기준 · {healthGradeLabel}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2
                  className="rv-card-value highlight"
                  style={{
                    color: computedHealthScore >= 80 ? '#81C784' : computedHealthScore >= 65 ? '#D4AF37' : '#FF8A80',
                    fontSize: '1.45rem',
                    margin: 0,
                  }}
                >
                  {computedHealthScore}점 <span style={{ fontSize: '0.78rem', color: '#888' }}>/ 100</span>
                </h2>
              </div>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#222', borderRadius: '999px', overflow: 'hidden', marginTop: '8px' }}>
              <div
                style={{
                  width: `${computedHealthScore}%`,
                  height: '100%',
                  background: computedHealthScore >= 80 ? '#81C784' : computedHealthScore >= 65 ? '#D4AF37' : '#FF8A80',
                  borderRadius: '999px',
                }}
              />
            </div>
          </div>

          <div className="rv-card">
            <div className="rv-card-row">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <h3 className="rv-card-title" style={{ margin: 0 }}>국제 표준 탈모 진행 단계</h3>
                  <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', background: 'rgba(100, 181, 246, 0.18)', color: '#64B5F6', fontWeight: 800 }}>
                    ↓ 단계 숫자가 낮을수록 좋음 (1단계 정상)
                  </span>
                </div>
                <p className="rv-card-desc" style={{ marginTop: '3px' }}>
                  {features.gender === 'female'
                    ? '루드비히(Ludwig 1~3단계) & 싱클레어(Sinclair 1~5단계) 척도'
                    : '해밀턴-노우드(Hamilton-Norwood 1~7단계) 척도'}
                </p>
              </div>
            </div>
            <div style={{ marginTop: '10px' }}>
              <h2 className="rv-card-value" style={{ color: 'var(--accent-gold)', fontSize: '1.22rem' }}>
                {features.gender === 'female' ? ludwig : norwood}
              </h2>
              {features.gender === 'female' && (
                <div style={{ fontSize: '0.82rem', color: '#ccc', marginTop: '4px' }}>
                  Sinclair 가르마 척도: <strong style={{ color: '#D4AF37' }}>{sinclair}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="rv-card">
            <div className="rv-card-row">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <h3 className="rv-card-title" style={{ margin: 0 }}>한국형 BASP 분류 (대한모발학회)</h3>
                  <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', background: 'rgba(100, 181, 246, 0.18)', color: '#64B5F6', fontWeight: 800 }}>
                    ↓ 숫자가 낮을수록 초기·경증
                  </span>
                </div>
                <p className="rv-card-desc" style={{ marginTop: '3px' }}>기본형(L정상 · M/C/U 1~3) + 특이형(V/F 1~3)</p>
              </div>
              <h2 className="rv-card-value" style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>
                {basp}
              </h2>
            </div>
          </div>

          {/* Precision Biometric Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
            }}
          >
            <div className="rv-card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#999' }}>추정 모낭 밀도</span>
                <span style={{ fontSize: '0.62rem', color: '#81C784', fontWeight: 700 }}>↑ 높을수록 좋음</span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D4AF37', marginTop: '4px' }}>
                {features.follicularDensityEstimate ?? 112} <span style={{ fontSize: '0.75rem' }}>hairs/cm²</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#888', marginTop: '2px' }}>정상 성인 기준 130~160모/cm²</div>
            </div>

            <div className="rv-card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#999' }}>중앙 가르마 노출 폭</span>
                <span style={{ fontSize: '0.62rem', color: '#64B5F6', fontWeight: 700 }}>↓ 좁을수록 좋음</span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f5f0e8', marginTop: '4px' }}>
                {features.partingWidthMm ?? 2.4} <span style={{ fontSize: '0.75rem' }}>mm</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#888', marginTop: '2px' }}>정상 2.0mm 이하 (클수록 연모화)</div>
            </div>

            <div className="rv-card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#999' }}>M자 양측 후퇴 편차</span>
                <span style={{ fontSize: '0.62rem', color: '#64B5F6', fontWeight: 700 }}>↓ 낮을수록 좋음</span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f5f0e8', marginTop: '4px' }}>
                +{features.mShapeDepthDelta ?? 6.5}%
              </div>
              <div style={{ fontSize: '0.68rem', color: '#888', marginTop: '2px' }}>0%에 가까울수록 일자 헤어라인</div>
            </div>

            <div className="rv-card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#999' }}>두피 홍반·열감 비율</span>
                <span style={{ fontSize: '0.62rem', color: '#64B5F6', fontWeight: 700 }}>↓ 낮을수록 좋음</span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#64B5F6', marginTop: '4px' }}>
                {features.scalpErythemaRatio ?? 12.4}%
              </div>
              <div style={{ fontSize: '0.68rem', color: '#888', marginTop: '2px' }}>15% 이하 안정 (높을수록 열감·염증)</div>
            </div>
          </div>

          <div className="rv-card">
            <span className="rv-card-badge">AI 임상 정밀 소견서</span>
            <div className="rv-explanation-text" style={{ whiteSpace: 'pre-line', lineHeight: '1.65' }}>
              {diagnosisData?.detailedExplanation ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: diagnosisData.detailedExplanation
                      .replace(/\n/g, '<br/>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--accent-gold);">$1</strong>'),
                  }}
                />
              ) : (
                features.explanation || summary
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="rv-floating-cta" style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onReset}
          style={{ flex: 1, padding: '14px', borderRadius: '10px', fontWeight: 700 }}
        >
          다시 촬영·진단하기
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => (window.location.href = '/')}
          style={{
            flex: 1.4,
            padding: '14px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #D4AF37, #B89225)',
            color: '#000',
            fontWeight: 800,
          }}
        >
          통합 대시보드로 이동 →
        </button>
      </div>

      {/* Optional Survey Modal */}
      {showSurveyModal && !surveySubmitted && (
        <div className="rv-modal-overlay">
          <div className="rv-modal-content fade-in">
            <button className="rv-modal-close" onClick={() => setShowSurveyModal(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="rv-modal-title">AI 정확도 평가</h2>
            <div className="rv-survey-group">
              <label>1. AI 진단 결과가 평소 느끼는 상태와 비슷합니까?</label>
              <div className="rv-score-buttons">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    className={`rv-score-btn ${surveyScore === score ? 'selected' : ''}`}
                    onClick={() => setSurveyScore(score)}
                  >
                    {score}점
                  </button>
                ))}
              </div>
            </div>
            <div className="rv-survey-group">
              <label>2. 추가 의견</label>
              <textarea
                className="rv-survey-textarea"
                value={surveyFeedback}
                onChange={(e) => setSurveyFeedback(e.target.value)}
              />
            </div>
            <button
              className="btn-primary rv-survey-submit"
              disabled={surveyScore === 0 || isSubmitting}
              onClick={handleSurveySubmit}
            >
              {isSubmitting ? '제출 중...' : '제출하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultView;
