import React from 'react';
import { ShieldCheck, ScanFace, Database, UserCheck, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import './OnboardingView.css';

const OnboardingView = ({ onStart, onFastStart, savedProfile, onRetakeSurvey }) => {
  const hasSaved = Boolean(savedProfile && (savedProfile.gender || savedProfile.age));

  const formatGoals = (goals) => {
    if (!goals || goals.length === 0) return null;
    if (goals.length <= 2) return goals.join(', ');
    return `${goals[0]}, ${goals[1]} 외 ${goals.length - 2}건`;
  };

  return (
    <div className="ob-wrapper">
      <div className="ob-content">
        {/* Logo & Title */}
        <div className="ob-header">
          <div className="ob-logo">
            <img 
              src="/logo_transparent.png" 
              alt="모발부자 AI 로고" 
              style={{ width: '100px', height: '100px', objectFit: 'contain' }} 
            />
          </div>
          <h1 className="ob-title">모발부자 AI</h1>
        </div>

        {/* Existing Profile Card (기존 설문 기록이 있는 경우) */}
        {hasSaved ? (
          <div className="ob-profile-card">
            <div className="ob-profile-badge-row">
              <span className="ob-profile-badge">
                <UserCheck size={14} className="ob-badge-icon" /> 맞춤 설문 기록 확인됨
              </span>
              <span className="ob-profile-chip">재질문 패스</span>
            </div>

            <div className="ob-profile-info-grid">
              <div className="ob-profile-info-item">
                <span className="ob-profile-label">성별</span>
                <span className="ob-profile-value">
                  {savedProfile.gender === 'female' ? '여성' : savedProfile.gender === 'male' ? '남성' : '선택됨'}
                </span>
              </div>
              {savedProfile.age && (
                <div className="ob-profile-info-item">
                  <span className="ob-profile-label">연령</span>
                  <span className="ob-profile-value">{savedProfile.age}세</span>
                </div>
              )}
              {savedProfile.familyHistory && (
                <div className="ob-profile-info-item">
                  <span className="ob-profile-label">가족력</span>
                  <span className="ob-profile-value">{savedProfile.familyHistory}</span>
                </div>
              )}
              {savedProfile.goals && savedProfile.goals.length > 0 && (
                <div className="ob-profile-info-item full-width">
                  <span className="ob-profile-label">집중 관리 고민</span>
                  <span className="ob-profile-value">{formatGoals(savedProfile.goals)}</span>
                </div>
              )}
            </div>

            <p className="ob-profile-desc">
              이미 설문 데이터가 안전하게 저장되어 있어, 긴 설문 절차를 거치지 않고 즉시 정밀 모발 스캔으로 이동합니다.
            </p>
          </div>
        ) : (
          /* Feature List (최초 방문자) */
          <div className="ob-features">
            <div className="ob-feature-item">
              <ShieldCheck className="ob-feature-icon" size={20} />
              <span>15년 임상 경력 의료인의 탈모 진단 노하우 적용</span>
            </div>
            <div className="ob-feature-item">
              <ScanFace className="ob-feature-icon" size={20} />
              <span>국제 탈모 진단법의 AI 두피 모발 스캔 정확도</span>
            </div>
            <div className="ob-feature-item">
              <Database className="ob-feature-icon" size={20} />
              <span>한국인 중심으로 헤어라인 분석 데이터 학습</span>
            </div>
          </div>
        )}

        {/* Reservation Badge */}
        {!hasSaved && (
          <div className="ob-reservation-badge">
            탈모 분석 앱 1위 예약
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="ob-bottom">
        {hasSaved ? (
          <>
            <button className="ob-continue-btn highlight" onClick={onFastStart || onStart}>
              <Sparkles size={18} style={{ marginRight: '6px' }} />
              AI 모발 스캔 바로 시작하기
              <ArrowRight size={18} style={{ marginLeft: '6px' }} />
            </button>
            <button className="ob-retake-btn" onClick={onRetakeSurvey}>
              <RotateCcw size={14} style={{ marginRight: '6px' }} />
              설문 프로필 새로 작성하기
            </button>
          </>
        ) : (
          <>
            <button className="ob-continue-btn" onClick={onStart}>
              시작하기
            </button>
            <p className="ob-terms">
              계속 진행하시면 당사의 개인정보 처리방침 및 이용약관에 동의하는 것으로 간주됩니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingView;
