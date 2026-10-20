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

function DiagnosisHubTab({ user, onRequireAuth }) {
  const handleStartDiagnosisMode = () => {
    if (!user && onRequireAuth) {
      onRequireAuth({
        mode: 'signup',
        featureName: 'AI 탈모진단앱',
        onSuccess: () => {
          window.location.href = '/diagnosis.html?direct=1';
        },
      });
      return;
    }
    window.location.href = '/diagnosis.html?direct=1';
  };

  return (
    <div className="av-content fade-in" style={{ padding: '0 0 90px' }}>
      <div className="tab-banner">
        <img src="/assets/banners/banner_simulator.jpg" alt="AI 탈모 정밀 진단" className="tab-banner-img" />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">AI 탈모 정밀 진단</h1>
          <p className="tab-banner-sub">남성(M자·정수리) · 여성(가르마) AI 정밀 스캔</p>
        </div>
      </div>

      <div style={{ padding: '16px 14px' }}>
        <PrivacyMembershipNoticeCard
          user={user}
          featureType="diagnosis"
          onOpenAuth={onRequireAuth}
        />

        {/* 단일 메뉴: 진단 모드로 바로 돌입하는 카드 하나만 배치 */}
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
            📸 AI 탈모 정밀 진단
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#bbb', margin: '0 0 18px', lineHeight: 1.5 }}>
            카메라 촬영 또는 사진 등록으로 즉시 탈모 진단 모드를 시작합니다.
          </p>

          <button
            type="button"
            onClick={handleStartDiagnosisMode}
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
            }}
          >
            {user ? 'AI 탈모 진단 바로 시작하기 →' : '🔒 회원가입 후 AI 탈모 진단 시작하기 →'}
          </button>
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
        return <DiagnosisHubTab user={user} onRequireAuth={openAuthModal} />;
      case 'areata':
        return <AlopeciaAreataView user={user} onRequireAuth={openAuthModal} />;
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
        return <DiagnosisHubTab user={user} onRequireAuth={openAuthModal} />;
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
