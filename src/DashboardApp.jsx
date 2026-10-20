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
  diagnosis: '남성·여성 정밀 탈모 진단',
  areata: '원형탈모 SALT 진단앱',
  simulator: '복약 전·후 예상 경과 확인',
  sasang: '사상체질 체형 진단 & 맞춤 식이',
  guide: '금기식품 · 병용금기 양약 · 부작용 백과',
  medication: '복약 관리',
  journal: '모발 성장 일지',
  clinic: '탈모 전문 병원 찾기',
};

const QUICK_SCAN_PRESETS = [
  {
    id: 'male_s2',
    gender: 'male',
    label: '남성 M자 초기 (Norwood II)',
    front: '/dataset/samples/male_s2/Front.jpg',
    vertex: '/dataset/samples/male_s2/Top-Down.jpg',
  },
  {
    id: 'male_s3',
    gender: 'male',
    label: '남성 M자+정수리 (Norwood III-V)',
    front: '/dataset/samples/male_s3/Front.jpg',
    vertex: '/dataset/samples/crown_clinical/eu_crown_1.jpg',
  },
  {
    id: 'male_s5',
    gender: 'male',
    label: '남성 복합 심화 (Norwood V)',
    front: '/dataset/samples/male_s5/Top-Down.jpg',
    vertex: '/dataset/samples/male_s5/Top-Down.jpg',
  },
  {
    id: 'female_ludwig',
    gender: 'female',
    label: '여성 가르마 확산형 (Ludwig I-II)',
    front: '/dataset/samples/female/case1_top.png',
    vertex: '/dataset/samples/female/case2_top.png',
  },
];

function DiagnosisHubTab({ user, onRequireAuth, onOpenAreata }) {
  const [selectedGender, setSelectedGender] = useState('male');
  const [frontPhoto, setFrontPhoto] = useState('/dataset/samples/male_s3/Front.jpg');
  const [vertexPhoto, setVertexPhoto] = useState('/dataset/samples/crown_clinical/eu_crown_1.jpg');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleFileChange = (e, slot) => {
    if (!user) {
      e.preventDefault();
      if (onRequireAuth) {
        onRequireAuth({
          mode: 'signup',
          featureName: '탈모진단앱 (개인 두피·모발 사진 정밀 분석)',
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
          featureName: '남성·여성 AI 초정밀 탈모진단앱',
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
          featureName: '4방향 실시간 카메라 AI 탈모진단앱',
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
      <div className="tab-banner">
        <img src="/assets/banners/banner_alopecia_areata.jpg" alt="남녀 정밀 탈모 진단" className="tab-banner-img" />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">남성 · 여성 초정밀 탈모 진단</h1>
          <p className="tab-banner-sub">
            CIE L*a*b* 색공간 · Sobel 모낭 엣지 · 5-Column 헤어라인 · 가르마 폭(mm) 정량 계측
          </p>
        </div>
      </div>

      <div style={{ padding: '14px' }}>
        {/* 개인정보 보호 안내문 및 회원가입 유도 카드 */}
        <PrivacyMembershipNoticeCard
          user={user}
          featureType="diagnosis"
          onOpenAuth={onRequireAuth}
        />

        {/* Precision Engine Highlights */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(212, 175, 55, 0.14), rgba(18, 18, 22, 0.96))',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '14px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 700, marginBottom: '4px' }}>
            ✨ 하이엔드 정밀 컴퓨터 비전 엔진
          </div>
          <div style={{ fontSize: '0.88rem', color: '#f5f0e8', fontWeight: 700, marginBottom: '6px' }}>
            남성(Norwood · BASP) & 여성(Ludwig · Sinclair 5단계) 이중 정밀 판독
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.72rem', color: '#ccc' }}>
            <div>• <strong>남성 M자 계측:</strong> 5-Column 수직 스캔 깊이 편차(%)</div>
            <div>• <strong>여성 가르마 계측:</strong> 중심축 두피 노출 폭(mm) 산출</div>
            <div>• <strong>모낭 밀도 추정:</strong> Sobel 그래디언트 hairs/cm²</div>
            <div>• <strong>두피 홍반·열감:</strong> CIE a* 적색도 염증 지수(%)</div>
          </div>
        </div>

        {/* Gender Selector */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f5f0e8', marginBottom: '6px' }}>
            1. 진단 대상 성별 및 척도 선택
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setSelectedGender('male');
                setFrontPhoto('/dataset/samples/male_s3/Front.jpg');
                setVertexPhoto('/dataset/samples/crown_clinical/eu_crown_1.jpg');
              }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: selectedGender === 'male' ? '1.5px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                background: selectedGender === 'male' ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255,255,255,0.03)',
                color: selectedGender === 'male' ? '#D4AF37' : '#aaa',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              👨 남성 탈모 정밀 진단
              <div style={{ fontSize: '0.66rem', fontWeight: 400, color: '#999', marginTop: '2px' }}>
                Hamilton-Norwood I~VII · BASP
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedGender('female');
                setFrontPhoto('/dataset/samples/female/case1_top.png');
                setVertexPhoto('/dataset/samples/female/case2_top.png');
              }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: selectedGender === 'female' ? '1.5px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                background: selectedGender === 'female' ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255,255,255,0.03)',
                color: selectedGender === 'female' ? '#D4AF37' : '#aaa',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              👩 여성 탈모 정밀 진단
              <div style={{ fontSize: '0.66rem', fontWeight: 400, color: '#999', marginTop: '2px' }}>
                Ludwig I~III · Sinclair 1~5단계
              </div>
            </button>
          </div>
        </div>

        {/* Clinical Sample Quick Picker */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '0.76rem', color: '#D4AF37', fontWeight: 700, marginBottom: '6px' }}>
            2. 임상 데이터셋 샘플 또는 내 사진 등록 {!user && <span style={{ color: '#ffab91', fontSize: '0.68rem' }}>(개인 사진 진단은 회원가입 필요)</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
            {QUICK_SCAN_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedGender(p.gender);
                  setFrontPhoto(p.front);
                  setVertexPhoto(p.vertex);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: frontPhoto === p.front ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                  background: frontPhoto === p.front ? 'rgba(212, 175, 55, 0.14)' : 'rgba(255,255,255,0.03)',
                  color: '#eee',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  onRequireAuth && onRequireAuth({
                    mode: 'signup',
                    featureName: '탈모진단앱 (내 두피 사진 업로드 및 분석)',
                  });
                }
              }}
              style={{
                border: '1px dashed rgba(212, 175, 55, 0.45)',
                borderRadius: '10px',
                padding: '10px',
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
                alt="정면 헤어라인"
                style={{ width: '100%', height: '115px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }}
              />
              <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#D4AF37' }}>
                📷 정면 이마·헤어라인 (변경 탭)
              </div>
            </label>

            <label
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  onRequireAuth && onRequireAuth({
                    mode: 'signup',
                    featureName: '탈모진단앱 (내 정수리·가르마 사진 분석)',
                  });
                }
              }}
              style={{
                border: '1px dashed rgba(212, 175, 55, 0.45)',
                borderRadius: '10px',
                padding: '10px',
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
                alt="정수리 가르마"
                style={{ width: '100%', height: '115px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }}
              />
              <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#D4AF37' }}>
                📷 정수리·가르마 (변경 탭)
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <button
          type="button"
          className="av-continue-btn"
          onClick={handleRunPrecisionDiagnosis}
          disabled={isScanning}
          style={{ width: '100%', marginBottom: '10px', padding: '14px', fontSize: '0.9rem', fontWeight: 800 }}
        >
          {isScanning
            ? 'AI 초정밀 모낭·헤어라인 스캔 분석 중...'
            : user
            ? '🔍 현재 사진으로 즉시 초정밀 AI 탈모 진단 실행'
            : '🔒 회원가입하고 초정밀 AI 탈모 진단 결과 확인하기'}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            className="med-btn-ghost"
            onClick={handleOpenCameraApp}
            style={{ padding: '11px', fontSize: '0.76rem', borderColor: 'rgba(212,175,55,0.4)', color: '#D4AF37' }}
          >
            📸 4방향 실시간 카메라 가이드 촬영 →
          </button>
          <button
            type="button"
            className="med-btn-ghost"
            onClick={onOpenAreata}
            style={{ padding: '11px', fontSize: '0.76rem', borderColor: 'rgba(100,181,246,0.45)', color: '#64B5F6' }}
          >
            🎯 원형탈모 SALT 정밀 진단앱 →
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
            {/* Sub-bar for Medication / Journal / Clinic */}
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
                { id: 'medication', label: '💊 복약·안전 관리' },
                { id: 'journal', label: '📔 모발 성장 일지' },
                { id: 'clinic', label: '🏥 탈모 병원 찾기' },
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
