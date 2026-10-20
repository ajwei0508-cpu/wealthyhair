import React, { useState } from 'react';
import BottomNavBar from './components/BottomNavBar';
import MedicationTab from './components/MedicationTab';
import GuideTab from './components/GuideTab';
import JournalTab from './components/JournalTab';
import ClinicTab from './components/ClinicTab';
import AlarmManager from './components/AlarmManager';
import HairSimTab from './components/HairSimTab';
import AlopeciaAreataView from './components/AlopeciaAreataView';
import SasangTab from './components/SasangTab';
import AuthGate, {
  MemberHeaderBar,
  MemberProfileModal,
  PrivacyMembershipNoticeCard,
} from './components/AuthGate';
import KakaoReportModal from './components/KakaoReportModal';

const TAB_NAMES = {
  diagnosis: 'AI 탈모 진단',
  areata: '원형탈모 진단',
  simulator: '복약 전·후 경과',
  sasang: '사상체질·식이',
  guide: '금기·약학백과',
  medication: '복약 관리',
  journal: '성장 일지',
  clinic: '병원 찾기',
};

function DiagnosisHubTab({ user, onRequireAuth, onOpenAreata, onOpenSimulator }) {
  const handleGoToDiagnosisApp = () => {
    if (!user && onRequireAuth) {
      onRequireAuth({
        mode: 'signup',
        featureName: 'AI 탈모진단앱',
        onSuccess: () => {
          window.location.href = '/diagnosis.html';
        },
      });
      return;
    }
    window.location.href = '/diagnosis.html';
  };

  return (
    <div className="av-content fade-in" style={{ padding: '0 0 90px' }}>
      {/* 깔끔한 하이엔드 배너 */}
      <div className="tab-banner">
        <img src="/assets/banners/banner_simulator.jpg" alt="AI 탈모 정밀 진단" className="tab-banner-img" />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">AI 탈모 정밀 진단</h1>
          <p className="tab-banner-sub">남성(M자·정수리) · 여성(가르마) · 원형탈모 진단앱 바로가기</p>
        </div>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 개인정보 보호 및 회원가입 유도 배너 */}
        <PrivacyMembershipNoticeCard
          user={user}
          featureType="diagnosis"
          onOpenAuth={onRequireAuth}
        />

        {/* ====================================================================
            1. 남성·여성 AI 탈모진단앱 바로 이동 메뉴 (메인 런처)
        ==================================================================== */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(24, 24, 30, 0.98), rgba(14, 14, 18, 0.98))',
            border: '1.5px solid #D4AF37',
            borderRadius: '14px',
            padding: '18px 16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#D4AF37',
                background: 'rgba(212, 175, 55, 0.16)',
                padding: '3px 9px',
                borderRadius: '999px',
              }}
            >
              AI HAIR LOSS DIAGNOSIS APP
            </span>
            <span style={{ fontSize: '0.68rem', color: '#81C784', fontWeight: 700 }}>
              Norwood · Ludwig · BASP
            </span>
          </div>

          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f5f0e8', margin: '4px 0 6px' }}>
            📸 남성·여성 AI 탈모진단앱 바로가기
          </h2>
          <p style={{ fontSize: '0.76rem', color: '#bbb', margin: '0 0 14px', lineHeight: 1.5 }}>
            전용 AI 스캔 카메라 및 사진 분석을 통해 헤어라인(M자), 정수리 모낭 밀도, 가르마 폭을 정밀 계측합니다.
          </p>

          <button
            type="button"
            onClick={handleGoToDiagnosisApp}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
              color: '#000',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {user ? '🔍 AI 탈모진단앱 바로 이동하기 →' : '🔒 회원가입 후 AI 탈모진단앱 바로 시작하기 →'}
          </button>
        </div>

        {/* ====================================================================
            2. 원형탈모(SALT) 진단앱 & 복약 전·후 경과 바로 이동 메뉴
        ==================================================================== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div
            onClick={onOpenAreata}
            style={{
              background: '#14141a',
              border: '1px solid rgba(100, 181, 246, 0.4)',
              borderRadius: '12px',
              padding: '14px 12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.66rem', color: '#64B5F6', fontWeight: 800, marginBottom: '4px' }}>
                SALT S0~S5 · 1mm 캘리퍼스
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                🎯 원형탈모 진단앱
              </div>
              <p style={{ fontSize: '0.7rem', color: '#aaa', margin: '0 0 10px', lineHeight: 1.4 }}>
                탈모반 직경(cm)·면적 정밀 계측 및 SALT 등급 산출
              </p>
            </div>
            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(100, 181, 246, 0.15)',
                color: '#64B5F6',
                fontSize: '0.73rem',
                fontWeight: 800,
                textAlign: 'center',
              }}
            >
              원형탈모 진단 이동 →
            </div>
          </div>

          <div
            onClick={onOpenSimulator}
            style={{
              background: '#14141a',
              border: '1px solid rgba(129, 199, 132, 0.4)',
              borderRadius: '12px',
              padding: '14px 12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.66rem', color: '#81C784', fontWeight: 800, marginBottom: '4px' }}>
                1 · 3 · 6 · 12개월 예측
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                ✨ 복약 전·후 경과
              </div>
              <p style={{ fontSize: '0.7rem', color: '#aaa', margin: '0 0 10px', lineHeight: 1.4 }}>
                내 사진 기반 복약 경과 예측 및 전·후 밀도 비교
              </p>
            </div>
            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(129, 199, 132, 0.15)',
                color: '#81C784',
                fontSize: '0.73rem',
                fontWeight: 800,
                textAlign: 'center',
              }}
            >
              복약 경과 확인 이동 →
            </div>
          </div>
        </div>

        {/* ====================================================================
            3. 산출 점수·등급 기준 간략 안내 (높을수록 좋음 ↑ vs 낮을수록 좋음 ↓)
        ==================================================================== */}
        <div
          style={{
            background: 'rgba(212, 175, 55, 0.07)',
            border: '1px solid rgba(212, 175, 55, 0.28)',
            borderRadius: '12px',
            padding: '11px 13px',
            fontSize: '0.72rem',
            lineHeight: 1.5,
            color: '#ddd',
          }}
        >
          <div style={{ fontWeight: 800, color: '#D4AF37', marginBottom: '4px' }}>
            💡 진단 점수·등급 판독 기준 안내
          </div>
          <div>
            • <strong style={{ color: '#81C784' }}>높을수록 좋음 ↑</strong> : <strong>종합 모발 건강 점수</strong>(80~100점 정상) · <strong>모낭 밀도</strong>(130모/cm² 이상)<br />
            • <strong style={{ color: '#64B5F6' }}>낮을수록 좋음 ↓</strong> : <strong>탈모 진행 단계</strong>(Norwood 1~7 / Ludwig 1~3 / BASP 1~3: 1단계가 정상) · <strong>원형탈모 SALT 점수</strong>(0점 S0 정상 ~ 100점 중증)
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardApp() {
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [guideInitialSection, setGuideInitialSection] = useState('interactions');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const navigateToGuideSection = (sec) => {
    setGuideInitialSection(sec || 'interactions');
    setActiveTab('guide');
  };

  const renderTab = (user, openAuthModal) => {
    switch (activeTab) {
      case 'diagnosis':
        return (
          <DiagnosisHubTab
            user={user}
            onRequireAuth={openAuthModal}
            onOpenAreata={() => setActiveTab('areata')}
            onOpenSimulator={() => setActiveTab('simulator')}
          />
        );
      case 'areata':
        return (
          <AlopeciaAreataView
            user={user}
            onRequireAuth={openAuthModal}
            onBack={() => setActiveTab('diagnosis')}
          />
        );
      case 'simulator':
        return <HairSimTab user={user} onRequireAuth={openAuthModal} />;
      case 'sasang':
        return <SasangTab />;
      case 'guide':
        return (
          <GuideTab
            key={guideInitialSection}
            initialSection={guideInitialSection}
            onOpenDiagnosis={() => setActiveTab('diagnosis')}
            onOpenAlopeciaAreata={() => setActiveTab('areata')}
            onOpenSasang={() => setActiveTab('sasang')}
          />
        );
      case 'medication':
      case 'journal':
      case 'clinic':
        return (
          <div>
            <div
              style={{
                display: 'flex',
                gap: '6px',
                padding: '10px 14px',
                background: 'rgba(12, 12, 16, 0.96)',
                borderBottom: '1px solid rgba(212, 175, 55, 0.18)',
              }}
            >
              {[
                { id: 'medication', label: '💊 복약 관리' },
                { id: 'journal', label: '📔 성장 일지' },
                { id: 'clinic', label: '🏥 병원 찾기' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setActiveTab(sub.id)}
                  style={{
                    flex: 1,
                    padding: '8px 6px',
                    borderRadius: '8px',
                    border: activeTab === sub.id ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                    background: activeTab === sub.id ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255,255,255,0.03)',
                    color: activeTab === sub.id ? '#D4AF37' : '#aaa',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {sub.label}
                </button>
              ))}
            </div>
            {activeTab === 'medication' && <MedicationTab onNavigateToGuide={navigateToGuideSection} />}
            {activeTab === 'journal' && <JournalTab />}
            {activeTab === 'clinic' && <ClinicTab />}
          </div>
        );
      default:
        return (
          <DiagnosisHubTab
            user={user}
            onRequireAuth={openAuthModal}
            onOpenAreata={() => setActiveTab('areata')}
            onOpenSimulator={() => setActiveTab('simulator')}
          />
        );
    }
  };

  return (
    <AuthGate>
      {(user, handleLogout, openAuthModal) => (
        <div className="app-container dashboard-container">
          <AlarmManager />

          <div
            className="av-wrapper"
            style={{ paddingBottom: '68px', display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <MemberHeaderBar
              member={user}
              user={user}
              currentMenuLabel={TAB_NAMES[activeTab] || activeTab}
              currentScreenName={TAB_NAMES[activeTab] || activeTab}
              onOpenProfile={() => setProfileModalOpen(true)}
              onOpenReport={() => setReportModalOpen(true)}
              onOpenAuth={openAuthModal}
            />

            <div className="dashboard-content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {renderTab(user, openAuthModal)}
            </div>
          </div>

          <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />

          <MemberProfileModal
            isOpen={profileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            member={user}
            user={user}
            onLoggedOut={handleLogout}
            onLogout={handleLogout}
          />

          <KakaoReportModal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            onOpen={() => setReportModalOpen(true)}
            currentMenu={TAB_NAMES[activeTab] || activeTab}
            member={user}
            currentUser={user}
          />
        </div>
      )}
    </AuthGate>
  );
}

export default DashboardApp;
