import { useState, useRef, useEffect } from 'react';
import './ResultView.css';

const ResultView = ({ images, onReset, diagnosisData }) => {
  const [mainTab, setMainTab] = useState('Overview');
  const [subTab, setSubTab] = useState('Front');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const norwood = diagnosisData?.norwood || '분석 중...';
  const basp = diagnosisData?.basp || '분석 중...';
  const summary = diagnosisData?.summary || '진단 데이터를 불러오지 못했습니다.';
  const features = diagnosisData?.features || {};
  const boxes = diagnosisData?.boxes || {};
  const masks = diagnosisData?.masks || {};

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
            fill="rgba(0, 230, 118, 0.2)" 
            stroke="#00E676" strokeWidth="3" rx="8"
          />
          <text x={bx + 5} y={by + 20} fill="#00E676" fontSize="16" fontWeight="bold">Detected</text>
        </svg>
      );
    }
    
    if (mainTab === 'Hairline') {
      return (
        <svg className="rv-svg-overlay" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice">
          {/* Simulate hairline dots over the box */}
          <polyline 
            points={`${bx},${by+bh} ${bx+bw/4},${by+bh/2} ${bx+bw/2},${by+bh/3} ${bx+(bw*3/4)},${by+bh/2} ${bx+bw},${by+bh}`}
            fill="none" stroke="#FFD700" strokeWidth="4" strokeDasharray="6,6" strokeLinecap="round"
          />
          <circle cx={bx} cy={by+bh} r="6" fill="#00E676" />
          <circle cx={bx+bw/2} cy={by+bh/3} r="6" fill="#00E676" />
          <circle cx={bx+bw} cy={by+bh} r="6" fill="#00E676" />
        </svg>
      );
    }

    if (mainTab === 'Density') {
      return (
        <svg className="rv-svg-overlay" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice">
           <defs>
            <radialGradient id="heatGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 82, 82, 0.6)" />
              <stop offset="50%" stopColor="rgba(255, 215, 0, 0.4)" />
              <stop offset="100%" stopColor="rgba(0, 230, 118, 0)" />
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
        <h1>AI Scan Result</h1>
        <button className="rv-icon-btn">
          <span className="material-symbols-outlined">ios_share</span>
        </button>
      </header>

      <main className="rv-main-content">
        
        {/* Top Tabs */}
        <div className="rv-top-tabs">
          {['Overview', 'Hairline', 'Density'].map(tab => (
            <button 
              key={tab} 
              className={`rv-tab-btn ${mainTab === tab ? 'active' : ''}`}
              onClick={() => setMainTab(tab)}
            >
              {tab}
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
              <div style={{color: '#555', textAlign: 'center', paddingTop: '50%'}}>No Image</div>
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
            {['Front', 'Left', 'Right', 'Top'].map(tab => (
              <button 
                key={tab}
                className={`rv-sub-tab-btn ${subTab === tab ? 'active' : ''}`}
                onClick={() => setSubTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Data Cards */}
        <div className="rv-cards-container">
          
          <div className="rv-card">
            <div className="rv-card-row">
              <div>
                <h3 className="rv-card-title">Is your hair thinning?</h3>
                <p className="rv-card-desc">Hairloss Detected</p>
              </div>
              <h2 className="rv-card-value highlight">{features.mShapeRecession || features.vertexThinning ? 'Yes' : 'No'}</h2>
            </div>
          </div>

          <div className="rv-card">
            <div className="rv-card-row">
              <div>
                <h3 className="rv-card-title">Hair Loss Stage</h3>
                <p className="rv-card-desc">This is based on the Norwood Scale</p>
              </div>
            </div>
            <div style={{marginTop: '12px'}}>
              <h2 className="rv-card-value" style={{color: '#FFD700'}}>{norwood}</h2>
            </div>
          </div>

          <div className="rv-card">
            <div className="rv-card-row">
              <div>
                <h3 className="rv-card-title">Hairline Type</h3>
                <p className="rv-card-desc">Classification</p>
              </div>
              <h2 className="rv-card-value" style={{color: '#fff'}}>{basp.split(' ')[0]}</h2>
            </div>
          </div>

          {mainTab === 'Density' && (
            <div className="rv-card">
              <h3 className="rv-card-title">Density Color Index</h3>
              <div className="rv-density-bar-container">
                <div className="rv-density-bar"></div>
                <div className="rv-density-labels">
                  <span>LOW</span>
                  <span>HIGH</span>
                </div>
              </div>
              <div className="rv-card-row" style={{marginTop: '16px'}}>
                <h3 className="rv-card-title">Crown Density</h3>
                <h2 className="rv-card-value">{features.vertexThinning ? 'Low' : 'Medium'}</h2>
              </div>
            </div>
          )}

          <div className="rv-card">
            <span className="rv-card-badge">AI Analysis Details</span>
            <div className="rv-explanation-text" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
              {diagnosisData?.detailedExplanation ? (
                <div dangerouslySetInnerHTML={{ 
                  __html: diagnosisData.detailedExplanation
                    .replace(/\n/g, '<br/>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FFD700;">$1</strong>')
                }} />
              ) : (
                features.explanation || summary
              )}
            </div>
          </div>
          
        </div>
      </main>

      {/* Floating CTA */}
      <div className="rv-floating-cta">
        <button className="rv-cta-btn">
          Unlock all features
        </button>
      </div>
    </div>
  );
};

export default ResultView;
