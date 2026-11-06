import { CheckCircle, ChevronLeft, RotateCcw, Sparkles } from 'lucide-react';
import './ReviewView.css';

const STEP_LABELS = {
  front: '정면 헤어라인 (FRONT)',
  left: '좌측 M자 (LEFT)',
  right: '우측 M자 (RIGHT)',
  vertex: '정수리·가르마 (TOP)',
};

const ReviewView = ({ photos = {}, gender = 'male', onStartAnalysis, onRetakeAll, onBack }) => {
  const orderedKeys = gender === 'female' ? ['front', 'vertex'] : ['front', 'left', 'right', 'vertex'];
  const visibleKeys = orderedKeys.filter((k) => Boolean(photos[k]));
  const displayKeys = visibleKeys.length > 0 ? visibleKeys : orderedKeys;

  return (
    <div className="rvw-wrapper">
      <div className="rvw-top-bar">
        <button className="rvw-icon-btn" type="button" onClick={onBack} title="이전 단계">
          <ChevronLeft size={24} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2 className="rvw-header-title">촬영 사진 최종 확인</h2>
          <div style={{ fontSize: '0.7rem', color: '#D4AF37', marginTop: '2px', fontWeight: 700 }}>
            {gender === 'female'
              ? '여성 탈모 정밀 스캔 (Ludwig · Sinclair · BASP)'
              : '남성 탈모 정밀 스캔 (Hamilton-Norwood · BASP)'}
          </div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div className="rvw-content">
        <div className={`rvw-grid ${displayKeys.length <= 2 ? 'rvw-grid-two' : ''}`}>
          {displayKeys.map((key) => (
            <div key={key} className="rvw-grid-item">
              {photos[key] ? (
                <img src={photos[key]} alt={STEP_LABELS[key]} />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: '0.78rem',
                  }}
                >
                  미촬영
                </div>
              )}
              <div className="rvw-label">{STEP_LABELS[key]}</div>
              {photos[key] && (
                <CheckCircle className="rvw-check-icon" size={20} color="#D4AF37" fill="#111111" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rvw-bottom">
        <button className="rvw-btn-analyze" type="button" onClick={onStartAnalysis}>
          <Sparkles size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          AI 탈모 정밀 진단 결과 보기
        </button>
        <button className="rvw-btn-retake-all" type="button" onClick={onRetakeAll}>
          <RotateCcw size={15} /> 전체 다시 촬영하기
        </button>
      </div>
    </div>
  );
};

export default ReviewView;
