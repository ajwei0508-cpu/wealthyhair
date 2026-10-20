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
import ResultView from './components/ResultView';
import { performOfflineAnalysis } from './utils/offlineAnalysis';
import analyzeHairLoss from './utils/diagnosis';

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

// 혐오감 없는 깔끔한 스튜디오형 탈모 예시 & 진단 결과물 샘플 데이터
const DIAGNOSIS_RESULT_SAMPLES = [
  {
    id: 'sample_male_m',
    tabLabel: '남성 M자형 샘플',
    gender: 'male',
    photo: '/guides/guide_side.jpg',
    vertexPhoto: '/guides/guide_vertex.jpg',
    badge: 'Norwood Stage II · BASP M1',
    title: '남성 초기 M자 헤어라인 후퇴 진단 샘플',
    summary: '양측 관자놀이(전측두부) 모발이 가늘어지며 M자 경계가 약 1.3cm 후퇴한 초기 단계입니다.',
    metrics: [
      { label: '진단 척도 등급', value: 'Norwood II (초기)', color: '#D4AF37' },
      { label: '추정 모낭 밀도', value: '116 모/cm² (정상 대비 -19%)', color: '#81C784' },
      { label: 'M자 경계 연모화율', value: '23.5% (모발 굵기 감소)', color: '#FFB74D' },
      { label: '권장 맞춤 솔루션', value: '5α-환원효소 억제제 + 미녹시딜 5%', color: '#64B5F6' },
    ],
    overlayType: 'hairline',
  },
  {
    id: 'sample_vertex',
    tabLabel: '정수리·가르마 샘플',
    gender: 'male',
    photo: '/guides/guide_vertex.jpg',
    vertexPhoto: '/guides/guide_vertex.jpg',
    badge: 'BASP V1 · 정수리 초기 연모화',
    title: '정수리·가마 주변 밀도 저하 진단 샘플',
    summary: '가마 중심부 모발의 굵기가 가늘어져 조명에 따라 두피 비침이 시작되는 골든타임 단계입니다.',
    metrics: [
      { label: '진단 척도 등급', value: 'BASP V1 (정수리 경증)', color: '#D4AF37' },
      { label: '추정 모낭 밀도', value: '112 모/cm² (정상 대비 -22%)', color: '#81C784' },
      { label: '두피 노출 비율', value: '18.4% (가마 주변 확산)', color: '#FFB74D' },
      { label: '권장 맞춤 솔루션', value: '피나스테리드/두타스테리드 + 두피 열감 케어', color: '#64B5F6' },
    ],
    overlayType: 'vertex',
  },
  {
    id: 'sample_female',
    tabLabel: '여성 가르마형 샘플',
    gender: 'female',
    photo: '/guides/guide_front.jpg',
    vertexPhoto: '/guides/guide_vertex.jpg',
    badge: 'Ludwig Grade I · Sinclair 2단계',
    title: '여성 헤어라인·가르마 볼륨 감소 진단 샘플',
    summary: '전면 헤어라인 형태는 유지되나 중심 가르마 간격이 넓어지고 잔머리 탄력이 저하된 단계입니다.',
    metrics: [
      { label: '진단 척도 등급', value: 'Ludwig Grade I (초기)', color: '#D4AF37' },
      { label: '추정 모낭 밀도', value: '121 모/cm² (연모 비율 증가)', color: '#81C784' },
      { label: '중심 가르마 폭', value: '2.6 mm (정상 기준 1.5mm 이하)', color: '#FFB74D' },
      { label: '권장 맞춤 솔루션', value: '미녹시딜 폼 + 비오틴·철분·맥주효모 영양케어', color: '#64B5F6' },
    ],
    overlayType: 'female',
  },
];

function DiagnosisHubTab({ user, onRequireAuth, onOpenAreata }) {
  const [activeSampleIdx, setActiveSampleIdx] = useState(0);
  const [selectedGender, setSelectedGender] = useState('male');
  const [frontPhoto, setFrontPhoto] = useState('/guides/guide_side.jpg');
  const [vertexPhoto, setVertexPhoto] = useState('/guides/guide_vertex.jpg');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const currentSample = DIAGNOSIS_RESULT_SAMPLES[activeSampleIdx];

  const handleFileChange = (e, slot) => {
    if (!user) {
      e.preventDefault();
      if (onRequireAuth) {
        onRequireAuth({
          mode: 'signup',
          featureName: 'AI 탈모진단앱 (내 사진 분석)',
        });
      }
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (slot === 'front') setFrontPhoto(ev.target.result);
      else setVertexPhoto(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const executePrecisionDiagnosis = async (activeUser = user) => {
    setIsScanning(true);
    try {
      const effectiveGender = activeUser?.gender || selectedGender;
      const images = {
        front: frontPhoto,
        left: effectiveGender === 'male' ? frontPhoto : null,
        right: effectiveGender === 'male' ? frontPhoto : null,
        vertex: vertexPhoto,
      };
      const emptyPoints = { front: null, left: null, right: null, vertex: null };
      const responseData = await performOfflineAnalysis(emptyPoints, images);
      if (responseData.success) {
        const features = {
          ...responseData.data.features,
          gender: selectedGender,
          age: activeUser?.age ? `${Math.floor(activeUser.age / 10) * 10}대` : '30대',
          familyHistory: '있음',
        };
        const result = analyzeHairLoss(features);
        result.features = features;
        result.boxes = responseData.data.boxes || {};
        result.masks = {};
        setScanResult({ diagnosisData: result, images });
      }
    } catch (err) {
      console.error('Precision diagnosis error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunPrecisionDiagnosis = () => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth({
          mode: 'signup',
          featureName: 'AI 탈모진단앱',
          onSuccess: (loggedInUser) => {
            executePrecisionDiagnosis(loggedInUser);
          },
        });
      }
      return;
    }
    executePrecisionDiagnosis(user);
  };

  const handleOpenCameraApp = () => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth({
          mode: 'signup',
          featureName: '실시간 카메라 AI 탈모진단앱',
          onSuccess: () => {
            window.location.href = '/diagnosis.html';
          },
        });
      }
      return;
    }
    window.location.href = '/diagnosis.html';
  };

  if (scanResult) {
    return (
      <ResultView
        diagnosisData={scanResult.diagnosisData}
        images={scanResult.images}
        onReset={() => setScanResult(null)}
      />
    );
  }

  return (
    <div className="av-content fade-in" style={{ padding: '0 0 90px' }}>
      {/* 깔끔한 하이엔드 배너 (혐오감 없는 골드 실루엣 아트워크) */}
      <div className="tab-banner">
        <img src="/assets/banners/banner_simulator.jpg" alt="AI 탈모 정밀 진단" className="tab-banner-img" />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">AI 탈모 정밀 진단</h1>
          <p className="tab-banner-sub">남성(M자·정수리) · 여성(가르마) · 원형탈모 맞춤 분석</p>
        </div>
      </div>

      <div style={{ padding: '14px' }}>
        {/* 간결한 개인정보 보호 및 회원가입 유도 배너 */}
        <PrivacyMembershipNoticeCard
          user={user}
          featureType="diagnosis"
          onOpenAuth={onRequireAuth}
        />

        {/* ====================================================================
            1. 진단하면 어떤 결과물이 보이는지 샘플 (무난하고 깔끔한 스튜디오 예시)
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
                SAMPLE REPORT PREVIEW
              </span>
              <h3 style={{ fontSize: '0.92rem', color: '#f5f0e8', fontWeight: 800, margin: '2px 0 0' }}>
                📋 진단하면 어떤 결과물이 보이나요? (결과 샘플)
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.66rem',
                padding: '3px 8px',
                borderRadius: '999px',
                background: 'rgba(212, 175, 55, 0.15)',
                color: '#D4AF37',
                fontWeight: 700,
              }}
            >
              예시 화면
            </span>
          </div>

          {/* 샘플 유형 탭 전환 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
            {DIAGNOSIS_RESULT_SAMPLES.map((s, idx) => {
              const active = idx === activeSampleIdx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveSampleIdx(idx);
                    setSelectedGender(s.gender);
                    setFrontPhoto(s.photo);
                    setVertexPhoto(s.vertexPhoto);
                  }}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    border: active ? '1.5px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                    background: active ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#D4AF37' : '#aaa',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {s.tabLabel}
                </button>
              );
            })}
          </div>

          {/* 무난한 스튜디오 예시 이미지 + AI 그래픽 가이드 오버레이 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '125px 1fr',
              gap: '12px',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '12px',
              padding: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '10px',
            }}
          >
            <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '125px' }}>
              <img
                src={currentSample.photo}
                alt={currentSample.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* 깔끔한 AI 스캔 타겟 그래픽 오버레이 */}
              <svg
                viewBox="0 0 120 120"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              >
                <rect
                  x="14"
                  y="14"
                  width="92"
                  height="68"
                  rx="10"
                  fill="rgba(212, 175, 55, 0.10)"
                  stroke="#D4AF37"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <path
                  d="M22 48 Q60 32 98 48"
                  fill="none"
                  stroke="#00E676"
                  strokeWidth="2"
                />
                <circle cx="38" cy="42" r="4" fill="#D4AF37" />
                <circle cx="82" cy="42" r="4" fill="#D4AF37" />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.75)',
                  color: '#D4AF37',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  padding: '3px 0',
                }}
              >
                AI 헤어라인·밀도 계측 예시
              </div>
            </div>

            <div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#00E676',
                  background: 'rgba(0, 230, 118, 0.12)',
                  border: '1px solid rgba(0, 230, 118, 0.35)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  marginBottom: '5px',
                }}
              >
                {currentSample.badge}
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#fff', marginBottom: '4px', lineHeight: 1.35 }}>
                {currentSample.title}
              </div>
              <p style={{ fontSize: '0.73rem', color: '#bbb', margin: 0, lineHeight: 1.45 }}>
                {currentSample.summary}
              </p>
            </div>
          </div>

          {/* 진단 결과표 4대 핵심 수치 미리보기 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
            {currentSample.metrics.map((m, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontSize: '0.66rem', color: '#888' }}>{m.label}</div>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: m.color, marginTop: '2px' }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ====================================================================
            2. 내 사진 등록 및 실제 AI 진단 실행 (간결한 인터페이스)
        ==================================================================== */}
        <div
          style={{
            background: '#121216',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f5f0e8' }}>
              🔍 내 탈모 정밀 진단 시작하기
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'male', label: '👨 남성' },
                { key: 'female', label: '👩 여성' },
              ].map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => {
                    setSelectedGender(g.key);
                    if (g.key === 'male') {
                      setFrontPhoto('/guides/guide_side.jpg');
                      setVertexPhoto('/guides/guide_vertex.jpg');
                    } else {
                      setFrontPhoto('/guides/guide_front.jpg');
                      setVertexPhoto('/guides/guide_vertex.jpg');
                    }
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    border: selectedGender === g.key ? '1px solid #D4AF37' : '1px solid #333',
                    background: selectedGender === g.key ? '#D4AF37' : 'transparent',
                    color: selectedGender === g.key ? '#000' : '#aaa',
                    fontSize: '0.73rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <label
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  onRequireAuth &&
                    onRequireAuth({
                      mode: 'signup',
                      featureName: 'AI 탈모진단앱 (내 사진 등록)',
                    });
                }
              }}
              style={{
                border: '1px dashed rgba(212, 175, 55, 0.45)',
                borderRadius: '10px',
                padding: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, 'front')}
              />
              <img
                src={frontPhoto}
                alt="헤어라인 가이드"
                style={{ width: '100%', height: '105px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }}
              />
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D4AF37' }}>
                📷 헤어라인 사진 등록
              </div>
            </label>

            <label
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  onRequireAuth &&
                    onRequireAuth({
                      mode: 'signup',
                      featureName: 'AI 탈모진단앱 (정수리 사진 등록)',
                    });
                }
              }}
              style={{
                border: '1px dashed rgba(212, 175, 55, 0.45)',
                borderRadius: '10px',
                padding: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, 'vertex')}
              />
              <img
                src={vertexPhoto}
                alt="정수리 가이드"
                style={{ width: '100%', height: '105px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }}
              />
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D4AF37' }}>
                📷 정수리·가르마 등록
              </div>
            </label>
          </div>

          <button
            type="button"
            className="av-continue-btn"
            onClick={handleRunPrecisionDiagnosis}
            disabled={isScanning}
            style={{ width: '100%', marginBottom: '8px', padding: '13px', fontSize: '0.88rem', fontWeight: 800 }}
          >
            {isScanning
              ? 'AI 탈모 진단 리포트 생성 중...'
              : user
              ? '🔍 AI 정밀 탈모 진단 결과 확인하기'
              : '🔒 회원가입 후 내 탈모 진단 결과 확인하기'}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="med-btn-ghost"
              onClick={handleOpenCameraApp}
              style={{ padding: '10px', fontSize: '0.74rem', borderColor: 'rgba(212,175,55,0.35)', color: '#D4AF37' }}
            >
              📸 실시간 가이드 카메라 촬영
            </button>
            <button
              type="button"
              className="med-btn-ghost"
              onClick={onOpenAreata}
              style={{ padding: '10px', fontSize: '0.74rem', borderColor: 'rgba(100,181,246,0.4)', color: '#64B5F6' }}
            >
              🎯 원형탈모(SALT) 진단 이동
            </button>
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
