import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, CheckCircle2, AlertTriangle, 
  Sparkles, Smartphone, Sun, X, ChevronRight, Check, Eye
} from 'lucide-react';
import './PhotoGuideModal.css';

const GUIDE_STEPS = [
  {
    id: 'front',
    title: '1. 정면 이마선 촬영',
    badge: 'M자 & 헤어라인 분석',
    image: '/guides/guide_front.jpg',
    angleDesc: '스마트폰을 지면과 수직(90도)으로 눈높이에 위치',
    duration: 5,
    keyPoints: [
      '앞머리를 한 손으로 가볍게 들어 올려 이마 라인을 시원하게 노출합니다.',
      '스마트폰을 똑바로 세우고(90도 수직), 눈높이 정면에 맞춥니다.',
      '화면의 골드 가이드 박스 안에 이마와 얼굴 전체가 들어가면 3초 후 자동 촬영됩니다.'
    ],
    dos: '눈썹과 헤어라인 경계가 선명하게 보이도록 고정',
    donts: '앞머리가 이마를 가리거나 스마트폰을 아래에서 위로 올려다보지 마세요.'
  },
  {
    id: 'side',
    title: '2. 좌·우 M자 라인 촬영',
    badge: '관자놀이 파임 깊이 측정',
    image: '/guides/guide_side.jpg',
    angleDesc: '고개를 45도 회전, 스마트폰 수직 유지',
    duration: 5,
    keyPoints: [
      '고개를 약 45도 옆으로 돌려 관자놀이 M자 파임 부위가 잘 보이게 합니다.',
      '옆머리를 살짝 걷어올려 모발이 시작되는 경계선을 확실히 보여줍니다.',
      '헤어라인 깊이를 측정하여 노우드 척도 기반 정밀 단계 분석이 진행됩니다.'
    ],
    dos: '측면 헤어라인의 가장 깊게 파인 각도가 잘 드러나도록 촬영',
    donts: '귀나 손가락이 헤어라인 측정 부위를 가리지 않도록 주의하세요.'
  },
  {
    id: 'vertex',
    title: '3. 정수리 가르마 밀도 촬영',
    badge: '두피 노출 면적 & 모낭 밀도',
    image: '/guides/guide_vertex.jpg',
    angleDesc: '스마트폰을 지면과 평행하게(180도 수평) 눕히기',
    duration: 5,
    keyPoints: [
      '고개를 앞으로 푹 숙여 정수리와 가마 부위가 위를 향하도록 합니다.',
      '스마트폰을 바닥과 평행하게(수평) 눕혀 머리 위 20~25cm 높이에 놓습니다.',
      '자이로 센서 동심원 타겟 안에 정수리 중앙 가마를 위치시키면 자동 감지됩니다.'
    ],
    dos: '정수리 가르마를 중심으로 두피 피부가 골고루 드러나게 촬영',
    donts: '카메라가 너무 가까워 초점이 흐려지거나 심하게 기울어지지 않게 유지하세요.'
  },
  {
    id: 'tips',
    title: '4. 조명 & 환경 체크리스트',
    badge: 'AI 정확도 98% 필수 요건',
    image: '/guides/guide_tips.jpg',
    angleDesc: '자연광 및 그림자 없는 균일한 밝기',
    duration: 5,
    keyPoints: [
      '밝은 자연광이나 그림자가 생기지 않는 균일한 실내 조명 아래서 촬영하세요.',
      '스마트폰 카메라 렌즈를 깨끗한 천으로 닦아 유분과 지문을 제거해주세요.',
      '플래시는 두피에 강한 반사광을 만들어 인식을 방해하므로 꺼두시는 것이 좋습니다.'
    ],
    dos: '선명하고 부드러운 자연광 환경에서 촬영',
    donts: '어두운 방, 역광, 플래시 직광, 손떨림으로 인한 블러'
  }
];

export default function PhotoGuideModal({ isOpen = true, onClose, onStartScanning, isStandalone = false }) {
  const [activeMode, setActiveMode] = useState('video'); // 'video' | 'steps'
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [simCountdown, setSimCountdown] = useState(3);
  const [simLevel, setSimLevel] = useState(false);
  const [flashTrigger, setFlashTrigger] = useState(false);

  const step = GUIDE_STEPS[currentStepIdx];
  const timerRef = useRef(null);

  // Video Mode Simulation Loop
  useEffect(() => {
    if (!isOpen || activeMode !== 'video') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = 100;
    const stepDurationMs = step.duration * 1000;
    const progressInc = (intervalMs / stepDurationMs) * 100;

    timerRef.current = setInterval(() => {
      setVideoProgress((prev) => {
        const next = prev + progressInc;
        
        // Gyro Leveling simulation (level ok after 30%)
        if (next >= 30) {
          setSimLevel(true);
        } else {
          setSimLevel(false);
        }

        // Countdown simulation
        if (next < 30) {
          setSimCountdown(3);
        } else if (next >= 30 && next < 55) {
          setSimCountdown(3);
        } else if (next >= 55 && next < 75) {
          setSimCountdown(2);
        } else if (next >= 75 && next < 92) {
          setSimCountdown(1);
        } else if (next >= 92) {
          setSimCountdown(0);
        }

        // Shutter Flash at 95%
        if (next >= 95 && next < 98) {
          setFlashTrigger(true);
          setTimeout(() => setFlashTrigger(false), 250);
        }

        if (next >= 100) {
          // Move to next step
          setCurrentStepIdx((idx) => (idx + 1) % GUIDE_STEPS.length);
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, activeMode, isPlaying, currentStepIdx, step.duration]);

  // Reset states when step changes manually
  const handleSelectStep = (index) => {
    setCurrentStepIdx(index);
    setVideoProgress(0);
    setSimLevel(false);
    setSimCountdown(3);
  };

  if (!isOpen) return null;

  return (
    <div className={`pgm-overlay ${isStandalone ? 'standalone' : ''}`}>
      <div className="pgm-modal-card">
        {/* Header */}
        <div className="pgm-header">
          <div className="pgm-title-area">
            <div className="pgm-badge">
              <Sparkles size={14} className="pgm-badge-sparkle" />
              <span>탈모진단앱 촬영 마스터 가이드</span>
            </div>
            <h2 className="pgm-main-title">정확한 AI 탈모진단을 위한 촬영 방법</h2>
            <p className="pgm-sub-title">15년 임상 의료 노하우 기반의 정밀 분석을 위해 올바른 촬영 각도를 안내해 드립니다.</p>
          </div>
          {onClose && (
            <button className="pgm-close-btn" onClick={onClose} aria-label="닫기">
              <X size={22} />
            </button>
          )}
        </div>

        {/* Mode Switcher Tabs */}
        <div className="pgm-mode-switch">
          <button 
            className={`pgm-mode-btn ${activeMode === 'video' ? 'active' : ''}`}
            onClick={() => setActiveMode('video')}
          >
            <Play size={16} /> 30초 모션 영상 튜토리얼
          </button>
          <button 
            className={`pgm-mode-btn ${activeMode === 'steps' ? 'active' : ''}`}
            onClick={() => setActiveMode('steps')}
          >
            <Eye size={16} /> 4단계 상세 사진 가이드
          </button>
        </div>

        {/* Step Selector Pills */}
        <div className="pgm-step-tabs">
          {GUIDE_STEPS.map((s, idx) => (
            <button
              key={s.id}
              className={`pgm-step-tab ${currentStepIdx === idx ? 'active' : ''}`}
              onClick={() => handleSelectStep(idx)}
            >
              <span className="pgm-tab-num">{idx + 1}</span>
              <span className="pgm-tab-text">{s.id === 'tips' ? '촬영 팁' : s.title.split('. ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="pgm-body">
          {activeMode === 'video' ? (
            /* Mode 1: Interactive Video Simulation Player */
            <div className="pgm-video-container">
              <div className="pgm-phone-stage">
                <div className={`pgm-phone-bezel ${flashTrigger ? 'shutter-flash' : ''}`}>
                  {/* Speaker & Dynamic Notch */}
                  <div className="pgm-notch">
                    <div className="pgm-lens-dot"></div>
                  </div>

                  {/* Phone Screen Display */}
                  <div className="pgm-phone-screen">
                    <img src={step.image} alt={step.title} className="pgm-screen-img" />

                    {/* Laser Scan Sweep Bar */}
                    <div className="pgm-laser-bar"></div>

                    {/* Augmented Reality Guidelines */}
                    <div className="pgm-ar-overlay">
                      {step.id === 'vertex' ? (
                        <div className={`pgm-vertex-target ${simLevel ? 'locked' : ''}`}>
                          <div className="pgm-vertex-inner-circle"></div>
                          <span className="pgm-target-label">정수리 가마 타겟</span>
                        </div>
                      ) : (
                        <div className={`pgm-hairline-box ${simLevel ? 'locked' : ''}`}>
                          <div className="pgm-corner tl"></div>
                          <div className="pgm-corner tr"></div>
                          <div className="pgm-corner bl"></div>
                          <div className="pgm-corner br"></div>
                          <div className="pgm-horizon-line"></div>
                          <span className="pgm-target-label">모발 측정 가이드라인</span>
                        </div>
                      )}
                    </div>

                    {/* Gyro Level Sensor Simulator */}
                    <div className="pgm-screen-hud">
                      <div className={`pgm-hud-status ${simLevel ? 'level-ok' : 'level-wait'}`}>
                        {simLevel ? (
                          <>
                            <CheckCircle2 size={14} /> 각도 일치 ({step.angleDesc})
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={14} /> 기기 각도 맞추는 중...
                          </>
                        )}
                      </div>

                      {/* Countdown badge */}
                      {simLevel && simCountdown > 0 && (
                        <div className="pgm-countdown-pill">
                          <span className="pgm-cd-number">{simCountdown}</span>초 후 자동 촬영
                        </div>
                      )}
                      {simLevel && simCountdown === 0 && (
                        <div className="pgm-countdown-pill captured">
                          <Check size={16} /> 촬영 완료!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Player Controls */}
              <div className="pgm-player-controls">
                <div className="pgm-progress-track" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  setVideoProgress(ratio * 100);
                }}>
                  <div className="pgm-progress-fill" style={{ width: `${videoProgress}%` }}></div>
                </div>

                <div className="pgm-controls-row">
                  <button 
                    className="pgm-ctrl-play"
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? '일시정지' : '재생'}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} fill="#fff" />}
                  </button>

                  <div className="pgm-step-indicator">
                    <span className="pgm-step-current-title">{step.title}</span>
                    <span className="pgm-step-current-badge">{step.badge}</span>
                  </div>

                  <button 
                    className="pgm-ctrl-restart"
                    onClick={() => {
                      setVideoProgress(0);
                      setIsPlaying(true);
                      setSimLevel(false);
                      setSimCountdown(3);
                    }}
                    title="처음부터 다시보기"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Detailed Step-by-Step Clinical Photo Guide */
            <div className="pgm-steps-container">
              <div className="pgm-step-image-card">
                <img src={step.image} alt={step.title} className="pgm-step-full-img" />
                <div className="pgm-step-img-caption">
                  <Smartphone size={16} /> {step.angleDesc}
                </div>
              </div>

              <div className="pgm-step-desc-card">
                <div className="pgm-desc-header">
                  <span className="pgm-step-tag">{step.badge}</span>
                  <h3 className="pgm-step-heading">{step.title}</h3>
                </div>

                <div className="pgm-point-list">
                  {step.keyPoints.map((pt, i) => (
                    <div key={i} className="pgm-point-item">
                      <div className="pgm-point-num">{i + 1}</div>
                      <p className="pgm-point-text">{pt}</p>
                    </div>
                  ))}
                </div>

                <div className="pgm-dodont-box">
                  <div className="pgm-do-col">
                    <div className="pgm-col-title do"><CheckCircle2 size={16} /> 올바른 예시</div>
                    <p>{step.dos}</p>
                  </div>
                  <div className="pgm-dont-col">
                    <div className="pgm-col-title dont"><AlertTriangle size={16} /> 피해야 할 예시</div>
                    <p>{step.donts}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Summary Strip (Always Visible) */}
          <div className="pgm-summary-strip">
            <div className="pgm-strip-item">
              <Smartphone size={16} className="pgm-strip-icon" />
              <span><strong>수평/수직 센서:</strong> 기기 각도가 일치하면 골드 테두리로 변경됩니다.</span>
            </div>
            <div className="pgm-strip-item">
              <Sun size={16} className="pgm-strip-icon" />
              <span><strong>조명 팁:</strong> 그림자가 없는 밝은 자연광에서 가장 정확합니다.</span>
            </div>
            <div className="pgm-strip-item">
              <Sparkles size={16} className="pgm-strip-icon" />
              <span><strong>자동 촬영:</strong> 자세가 고정되면 3초 후 자동으로 촬영됩니다.</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pgm-footer">
          {onClose && (
            <button className="pgm-btn-cancel" onClick={onClose}>
              닫기
            </button>
          )}
          {onStartScanning && (
            <button className="pgm-btn-proceed" onClick={onStartScanning}>
              <span>탈모진단 스캔 시작하기</span>
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
