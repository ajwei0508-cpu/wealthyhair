import { useState, useEffect, useRef } from 'react';
import './LoadingView.css';

const LoadingView = ({ onComplete, isReady = true, gender = 'male' }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('정확한 진단을 위해 촬영된 모든 각도의 모발을 분석 중입니다');
  const [subText, setSubText] = useState('촬영 뷰 정밀 스캔 중...');

  const onCompleteRef = useRef(onComplete);
  const isReadyRef = useRef(isReady);
  const completedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      if (currentProgress < 95) {
        currentProgress += 2;
      } else if (isReadyRef.current) {
        currentProgress += 2;
      }

      if (currentProgress >= 100) {
        setProgress(100);
        setLoadingText('AI 탈모 정밀 진단 리포트 생성이 완료되었습니다');
        setSubText('진단 결과를 불러오는 중...');
        clearInterval(interval);
        if (!completedRef.current) {
          completedRef.current = true;
          setTimeout(() => {
            if (onCompleteRef.current) onCompleteRef.current();
          }, 220);
        }
      } else {
        setProgress(currentProgress);

        if (currentProgress < 28) {
          setLoadingText('정확한 결과를 위해 촬영된 모발·두피 각도를 분석 중입니다');
          setSubText('CIE L*a*b* 색공간 및 모낭 영역 추출 중...');
        } else if (currentProgress < 56) {
          setLoadingText(
            gender === 'female'
              ? '중앙 가르마 폭(mm)과 정수리 연모화 징후를 계측 중입니다'
              : '전두부·M자 헤어라인 후퇴 깊이(cm)를 정밀 계측 중입니다'
          );
          setSubText(
            gender === 'female'
              ? '루드비히(Ludwig)·싱클레어 척도 대조 중...'
              : '해밀턴-노우드(Norwood)·BASP 척도 대조 중...'
          );
        } else if (currentProgress < 82) {
          setLoadingText('단위 면적당 추정 모낭 밀도(hairs/cm²)와 두피 홍반도를 산출합니다');
          setSubText('모발 밀도 및 두피 열감 평가 중...');
        } else {
          setLoadingText('맞춤 임상 관리 가이드라인과 종합 건강 점수를 검증합니다');
          setSubText('최종 진단 리포트 생성 중...');
        }
      }
    }, 35);

    return () => clearInterval(interval);
  }, [gender]);

  // SVG Circular Progress
  const radius = 96;
  const strokeWidth = 3;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="lv-wrapper">
      <div className="lv-content">
        <h3 className="lv-top-text">{loadingText}</h3>

        <div className="lv-progress-container">
          <div className="lv-ticks">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="lv-tick"
                style={{
                  transform: `rotate(${i * 6}deg) translateY(-106px)`,
                  opacity: (i / 60) * 100 <= progress ? 1 : 0.2,
                }}
              />
            ))}
          </div>

          <div className="lv-progress-circle-wrap">
            <svg height={radius * 2} width={radius * 2}>
              <circle
                stroke="rgba(212, 175, 55, 0.2)"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke="#D4AF37"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.08s linear' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            <div className="lv-progress-text">{progress}%</div>
          </div>
        </div>
      </div>

      <div className="lv-bottom">
        <div className="lv-avatars">
          <div className="lv-avatar lv-avatar-badge-user">SCAN</div>
          <div className="lv-avatar lv-avatar-ai lv-avatar-badge-ai">AI</div>
        </div>
        <div className="lv-sub-text">{subText}</div>
        <div className="lv-stay-text">잠시만 기다려 주세요 · 곧 진단 리포트가 표시됩니다</div>
      </div>
    </div>
  );
};

export default LoadingView;
