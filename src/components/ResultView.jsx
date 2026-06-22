import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';
import './ResultView.css';

// --- Removed Chat Component (Moved to AvatarView) ---

const ResultView = ({ images, onReset, onRetake, diagnosisData, onProceedToAvatar }) => {
  const [mainTab, setMainTab] = useState('Overview');
  const [subTab, setSubTab] = useState('Front');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isSurveyCompleted, setIsSurveyCompleted] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyScore, setSurveyScore] = useState(0);
  const [surveyFeedback, setSurveyFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sliderRef = useRef(null);

  const norwood = diagnosisData?.norwood || '분석 중...';
  const basp = diagnosisData?.basp || '분석 중...';
  const summary = diagnosisData?.summary || '진단 데이터를 불러오지 못했습니다.';
  const features = diagnosisData?.features || {};
  const boxes = diagnosisData?.boxes || {};
  const masks = diagnosisData?.masks || {};

  const handleSurveySubmit = async () => {
    if (surveyScore === 0) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('surveys')
        .insert([
          {
            score: surveyScore,
            feedback: surveyFeedback,
            norwood: norwood,
            has_hair_loss: norwood !== 'Stage I (정상)' && norwood !== 'Normal (정상)'
          }
        ]);
        
      if (error) throw error;
      
      setIsSurveyCompleted(true);
      setShowSurveyModal(false);
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert(`오류: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Translation mappings
  const mainTabs = [
    { id: 'Overview', label: '개요' },
    { id: 'Hairline', label: '헤어라인' },
    { id: 'Density', label: '밀도' }
  ];
  
  const subTabs = [
    { id: 'Front', label: '정면' },
    { id: 'Left', label: '좌측' },
    { id: 'Right', label: '우측' },
    { id: 'Top', label: '정수리' }
  ].filter(tab => {
    const keyMap = { 'Front': 'front', 'Left': 'left', 'Right': 'right', 'Top': 'vertex' };
    return !!images?.[keyMap[tab.id]];
  });

  // Map subTab to image keys
  const imageKeyMap = {
    'Front': 'front',
    'Left': 'left',
    'Right': 'right',
    'Top': 'vertex'
  };

  const currentImageKey = imageKeyMap[subTab];
  const currentImageSrc = images?.[currentImageKey];
  const currentBox = boxes?.[currentImageKey];
  const currentMask = masks?.[currentImageKey];

  // Slider Logic
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
    let x = e.clientX || (e.touches && e.touches[0].clientX);
    if (x === undefined) return;
    
    let position = ((x - rect.left) / rect.width) * 100;
    position = Math.max(0, Math.min(100, position)); // Clamp 0-100
    setSliderPosition(position);
  };

  // Prevent default touch actions on slider to stop scrolling
  useEffect(() => {
    const el = sliderRef.current;
    if (el) {
      const preventTouch = (e) => { if (isDragging) e.preventDefault(); };
      el.addEventListener('touchmove', preventTouch, { passive: false });
      return () => el.removeEventListener('touchmove', preventTouch);
    }
  }, [isDragging]);

  // Render Overlays based on Main Tab
  const renderOverlay = () => {
    if (!currentBox || currentBox.length !== 4) return null;
    const [bx, by, bw, bh] = currentBox;

    if (mainTab === 'Overview') {
      if (currentMask) {
        return (
          <img 
            src={currentMask} 
            className="rv-svg-overlay" 
            style={{ 
              objectFit: 'cover', 
              pointerEvents: 'none',
              filter: 'drop-shadow(0 0 8px rgba(0, 230, 118, 0.4))'
            }} 
            alt="Hair Mask" 
          />
        );
      }
      return (
        <svg className="rv-svg-overlay" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice">
          <rect 
            x={bx} y={by} width={bw} height={bh} 
            fill="rgba(212, 175, 55, 0.2)" 
            stroke="var(--accent-gold)" strokeWidth="3" rx="0"
          />
          <text x={bx + 5} y={by + 20} fill="var(--accent-gold)" fontSize="16" fontWeight="bold">감지됨</text>
        </svg>
      );
    }
    
    if (mainTab === 'Hairline') {
      return (
        <svg className="rv-svg-overlay" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice">
          {/* Simulate hairline dots over the box */}
          <polyline 
            points={`${bx},${by+bh} ${bx+bw/4},${by+bh/2} ${bx+bw/2},${by+bh/3} ${bx+(bw*3/4)},${by+bh/2} ${bx+bw},${by+bh}`}
            fill="none" stroke="var(--accent-gold)" strokeWidth="4" strokeDasharray="6,6" strokeLinecap="round"
          />
          <circle cx={bx} cy={by+bh} r="6" fill="var(--accent-gold)" />
          <circle cx={bx+bw/2} cy={by+bh/3} r="6" fill="var(--accent-gold)" />
          <circle cx={bx+bw} cy={by+bh} r="6" fill="var(--accent-gold)" />
        </svg>
      );
    }

    if (mainTab === 'Density') {
      return (
        <svg className="rv-svg-overlay" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice">
             <defs>
            <radialGradient id="heatGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 82, 82, 0.6)" />
              <stop offset="50%" stopColor="rgba(212, 175, 55, 0.4)" />
              <stop offset="100%" stopColor="rgba(212, 175, 55, 0)" />
            </radialGradient>
          </defs>
          <ellipse cx={bx + bw/2} cy={by + bh/2} rx={bw*1.5} ry={bh*1.5} fill="url(#heatGrad)" />
        </svg>
      );
    }

    return null;
  };

  return (
    <div className="rv-wrapper">
      <header className="rv-header">
        <button className="rv-icon-btn" onClick={onReset}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1>AI 스캔 결과</h1>
        <button className="rv-icon-btn">
          <span className="material-symbols-outlined">ios_share</span>
        </button>
      </header>

      <main className="rv-main-content">
        
        {/* Top Tabs */}
        <div className="rv-top-tabs">
          {mainTabs.map(tab => (
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
            {/* Before Image (Base) */}
            {currentImageSrc ? (
              <img src={currentImageSrc} alt="Base" className="rv-base-image" />
            ) : (
              <div style={{color: '#555', textAlign: 'center', paddingTop: '50%'}}>이미지 없음</div>
            )}

            {/* After Image & Overlay (Clipped by Slider) */}
            {currentImageSrc && (
              <div className="rv-slider-clip" style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}>
                <img src={currentImageSrc} alt="Overlay Base" className="rv-slider-image" />
                <div className="rv-overlay-layer">
                  {renderOverlay()}
                </div>
              </div>
            )}

            {/* Slider Control */}
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

          {/* Sub Tabs (Floating over image) */}
          <div className="rv-sub-tabs">
            {subTabs.map(tab => (
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

        {/* Data Cards */}
        <div className="rv-cards-container" style={{ position: 'relative' }}>
          
          <div className={!isSurveyCompleted ? 'rv-blurred' : ''} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="rv-card">
            <div className="rv-card-row">
              <div>
                <h3 className="rv-card-title">탈모가 진행 중인가요?</h3>
                <p className="rv-card-desc">탈모 감지 여부</p>
              </div>
              <h2 className="rv-card-value highlight">{features.mShapeRecession || features.vertexThinning ? '예' : '아니오'}</h2>
            </div>
          </div>

          <div className="rv-card">
            <div className="rv-card-row">
              <div>
                <h3 className="rv-card-title">탈모 진행 단계</h3>
                <p className="rv-card-desc">노우드(Norwood) 척도 기준</p>
              </div>
            </div>
            <div style={{marginTop: '12px'}}>
              <h2 className="rv-card-value" style={{color: 'var(--accent-gold)'}}>{norwood}</h2>
            </div>
          </div>

          <div className="rv-card">
            <div className="rv-card-row">
              <div>
                <h3 className="rv-card-title">헤어라인 유형</h3>
                <p className="rv-card-desc">BASP 분류</p>
              </div>
              <h2 className="rv-card-value" style={{color: 'var(--text-main)'}}>{basp.split(' ')[0]}</h2>
            </div>
          </div>

          {mainTab === 'Density' && (
            <div className="rv-card">
              <h3 className="rv-card-title">밀도 색상 지표</h3>
              <div className="rv-density-bar-container">
                <div className="rv-density-bar"></div>
                <div className="rv-density-labels">
                  <span>낮음</span>
                  <span>높음</span>
                </div>
              </div>
              <div className="rv-card-row" style={{marginTop: '16px'}}>
                <h3 className="rv-card-title">정수리 밀도</h3>
                <h2 className="rv-card-value">{features.vertexThinning ? '낮음' : '보통'}</h2>
              </div>
            </div>
          )}

          <div className="rv-card">
            <span className="rv-card-badge">AI 분석 상세</span>
            <div 
              className="rv-explanation-text" 
              style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}
            >
              {diagnosisData?.detailedExplanation ? (
                <div dangerouslySetInnerHTML={{ 
                  __html: diagnosisData.detailedExplanation
                    .replace(/\n/g, '<br/>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--accent-gold);">$1</strong>')
                }} />
              ) : (
                features.explanation || summary
              )}
            </div>
          </div>
          </div> {/* End of blurred wrapper */}

          {!isSurveyCompleted && (
            <div className="rv-unlock-overlay fade-in" style={{ borderRadius: '8px', zIndex: 10 }}>
              <span className="material-symbols-outlined rv-lock-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>lock</span>
              <p style={{ fontSize: '16px', fontWeight: 'bold' }}>설문을 완료해야 AI 진단 결과를 확인할 수 있습니다.</p>
              <button className="btn-primary" onClick={() => setShowSurveyModal(true)}>
                설문 작성하고 결과 보기
              </button>
            </div>
          )}
        </div>

        {/* Normal CTA at the bottom of the scrollable content */}
        <div className="rv-floating-cta">
          <button className="rv-cta-btn" onClick={onProceedToAvatar}>
            나의 아바타 만나러 가기
          </button>
        </div>
      </main>

      {/* Survey Modal */}
      {showSurveyModal && (
        <div className="rv-modal-overlay">
          <div className="rv-modal-content fade-in">
            <button className="rv-modal-close" onClick={() => setShowSurveyModal(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="rv-modal-title">AI 정확도 평가</h2>
            <p className="rv-modal-desc">결과를 확인하기 위해 짧은 의견을 남겨주세요!</p>

            <div className="rv-survey-group">
              <label>1. AI 진단 결과가 평소 느끼는 상태와 비슷합니까?</label>
              <div className="rv-score-buttons">
                {[1, 2, 3, 4, 5].map(score => (
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
              <label>2. 앱에 바라는 점이나 아쉬운 점을 자유롭게 적어주세요.</label>
              <textarea 
                className="rv-survey-textarea"
                placeholder="의견을 남겨주시면 큰 도움이 됩니다!"
                value={surveyFeedback}
                onChange={(e) => setSurveyFeedback(e.target.value)}
              />
            </div>

            <button 
              className="btn-primary rv-survey-submit"
              disabled={surveyScore === 0 || isSubmitting}
              onClick={handleSurveySubmit}
            >
              {isSubmitting ? '제출 중...' : '제출하고 결과 보기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultView;
