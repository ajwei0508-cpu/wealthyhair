import { useState, useCallback } from 'react';
import CameraView from './components/CameraView';
import ReviewView from './components/ReviewView';
import LoadingView from './components/LoadingView';
import ResultView from './components/ResultView';
import OnboardingView from './components/OnboardingView';
import PrivacyView from './components/PrivacyView';
import AgeView from './components/AgeView';
import EthnicityView from './components/EthnicityView';
import GoalView from './components/GoalView';
import FamilyHistoryView from './components/FamilyHistoryView';
import DurationView from './components/DurationView';
import QuoteView from './components/QuoteView';
import RoutineView from './components/RoutineView';
import ProcedureView from './components/ProcedureView';
import TogetherView from './components/TogetherView';
import ExpectationView from './components/ExpectationView';
import NotificationView from './components/NotificationView';
import ScanIntroView from './components/ScanIntroView';
import PhotoGuideView from './components/PhotoGuideView';
import AlopeciaAreataView from './components/AlopeciaAreataView';
import AuthGate, {
  MemberHeaderBar,
  MemberProfileModal,
  PrivacyMembershipNoticeCard,
} from './components/AuthGate';
import KakaoReportModal from './components/KakaoReportModal';
import analyzeHairLoss from './utils/diagnosis';
import { performOfflineAnalysis } from './utils/offlineAnalysis';
import { getSavedSurveyProfile, saveSurveyProfile, clearSurveyProfile } from './utils/surveyStorage';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('direct') === '1' ? 'camera' : 'onboarding';
  });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [savedProfile, setSavedProfile] = useState(() => getSavedSurveyProfile());
  const [age, setAge] = useState(savedProfile?.age || null);
  const [ethnicity, setEthnicity] = useState(savedProfile?.ethnicity || null);
  const [goals, setGoals] = useState(savedProfile?.goals || []);
  const [familyHistory, setFamilyHistory] = useState(savedProfile?.familyHistory || null);
  const [duration, setDuration] = useState(savedProfile?.duration || null);
  const [routine, setRoutine] = useState(savedProfile?.routine || null);
  const [procedure, setProcedure] = useState(savedProfile?.procedure || null);
  const [gender, setGender] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlGender = params.get('gender');
    if (urlGender === 'female' || urlGender === 'male') {
      saveSurveyProfile({ gender: urlGender });
      return urlGender;
    }
    return savedProfile?.gender || 'male';
  });

  const getCaptureSteps = (targetGender = gender) =>
    targetGender === 'female' ? ['front', 'vertex'] : ['front', 'left', 'right', 'vertex'];
  const currentCaptureSteps = getCaptureSteps();

  const [capturedImages, setCapturedImages] = useState({
    front: null,
    left: null,
    right: null,
    vertex: null,
  });
  const [capturedAllPoints, setCapturedAllPoints] = useState({
    front: null,
    left: null,
    right: null,
    vertex: null,
  });

  const [currentCaptureIndex, setCurrentCaptureIndex] = useState(0);
  const [diagnosisData, setDiagnosisData] = useState(null);

  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
    const updated = saveSurveyProfile({
      age,
      ethnicity,
      goals,
      familyHistory,
      duration,
      routine,
      procedure,
      gender: selectedGender,
      isCompleted: true,
    });
    setSavedProfile(updated);
    setCurrentView('expectation');
  };

  const handleCameraGenderSwitch = (nextGender) => {
    if (nextGender === gender) return;
    setGender(nextGender);
    const updated = saveSurveyProfile({ gender: nextGender });
    setSavedProfile(updated);
    setCapturedImages({ front: null, left: null, right: null, vertex: null });
    setCapturedAllPoints({ front: null, left: null, right: null, vertex: null });
    setCurrentCaptureIndex(0);
  };

  const handleRetakeSurvey = (user, openAuthModal) => {
    const proceed = () => {
      clearSurveyProfile();
      setSavedProfile(null);
      setAge(null);
      setEthnicity(null);
      setGoals([]);
      setFamilyHistory(null);
      setDuration(null);
      setRoutine(null);
      setProcedure(null);
      setGender('male');
      setCurrentView('privacy');
    };
    if (!user && openAuthModal) {
      openAuthModal({
        mode: 'signup',
        featureName: 'AI 탈모진단앱 (맞춤 설문 및 스캔)',
        onSuccess: proceed,
      });
      return;
    }
    proceed();
  };

  const runAnalysisPipeline = async (imagesToAnalyze, pointsToAnalyze, activeGender = gender) => {
    setDiagnosisData(null);
    setCurrentView('loading');
    try {
      const responseData = await performOfflineAnalysis(pointsToAnalyze, imagesToAnalyze);
      if (responseData.success) {
        const features = {
          ...responseData.data.features,
          gender: activeGender,
          age,
          ethnicity,
          goals,
          familyHistory,
          duration,
          routine,
          procedure,
        };
        const result = analyzeHairLoss(features);
        result.features = features;
        result.boxes = responseData.data.boxes || {};
        result.masks = {
          front: pointsToAnalyze.front?.mask || null,
          left: pointsToAnalyze.left?.mask || null,
          right: pointsToAnalyze.right?.mask || null,
          vertex: pointsToAnalyze.vertex?.mask || null,
        };
        setDiagnosisData(result);
      } else {
        alert(responseData.error || '분석에 실패했습니다. 밝은 조명에서 다시 촬영해 주세요.');
        setDiagnosisData(null);
        setCurrentView('review');
      }
    } catch (error) {
      console.error('Analysis Error:', error);
      alert('진단 분석 중 오류가 발생했습니다. 다시 시도해 주세요.');
      setDiagnosisData(null);
      setCurrentView('review');
    }
  };

  const handleCapture = async (imageSrc, points) => {
    const steps = getCaptureSteps();
    const currentStep = steps[currentCaptureIndex];

    const updatedImages = { ...capturedImages, [currentStep]: imageSrc };
    setCapturedImages(updatedImages);

    const updatedPoints = { ...capturedAllPoints, [currentStep]: points };
    setCapturedAllPoints(updatedPoints);

    if (currentCaptureIndex < steps.length - 1) {
      setCurrentCaptureIndex(currentCaptureIndex + 1);
      return;
    }

    setCurrentView('review');
  };

  const handleQuickAnalyzeFromCamera = async (imageSrc, points) => {
    const steps = getCaptureSteps();
    const currentStep = steps[currentCaptureIndex] || 'front';

    const updatedImages = { ...capturedImages, [currentStep]: imageSrc };
    const updatedPoints = { ...capturedAllPoints, [currentStep]: points };

    setCapturedImages(updatedImages);
    setCapturedAllPoints(updatedPoints);

    await runAnalysisPipeline(updatedImages, updatedPoints, gender);
  };

  const handleStartAnalysis = async () => {
    await runAnalysisPipeline(capturedImages, capturedAllPoints, gender);
  };

  const handleLoadingComplete = useCallback(() => {
    setCurrentView('result');
  }, []);

  const resetApp = () => {
    setCapturedImages({ front: null, left: null, right: null, vertex: null });
    setCapturedAllPoints({ front: null, left: null, right: null, vertex: null });
    setCurrentCaptureIndex(0);
    setCurrentView('camera');
    setDiagnosisData(null);

    const profile = getSavedSurveyProfile();
    setSavedProfile(profile);
    if (profile) {
      setAge(profile.age || null);
      setEthnicity(profile.ethnicity || null);
      setGoals(profile.goals || []);
      setFamilyHistory(profile.familyHistory || null);
      setDuration(profile.duration || null);
      setRoutine(profile.routine || null);
      setProcedure(profile.procedure || null);
      if (profile.gender) setGender(profile.gender);
    }
  };

  return (
    <AuthGate>
      {(user, handleLogout, openAuthModal) => (
        <div
          className="app-container"
          style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}
        >
          <MemberHeaderBar
            member={user}
            user={user}
            currentMenuLabel={`진단앱 (${currentView})`}
            currentScreenName={`진단앱 (${currentView})`}
            onOpenProfile={() => setProfileModalOpen(true)}
            onOpenReport={() => setReportModalOpen(true)}
            onOpenAuth={openAuthModal}
          />

          {/* Mode Quick Bar */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '6px 12px',
              background: '#0d0d10',
              borderBottom: '1px solid rgba(212, 175, 55, 0.16)',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setCurrentView('camera')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                border: currentView !== 'areata' ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                background: currentView !== 'areata' ? 'rgba(212, 175, 55, 0.16)' : 'transparent',
                color: currentView !== 'areata' ? '#D4AF37' : '#aaa',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              남성·여성 탈모 진단
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('areata')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                border: currentView === 'areata' ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                background: currentView === 'areata' ? 'rgba(212, 175, 55, 0.16)' : 'transparent',
                color: currentView === 'areata' ? '#D4AF37' : '#aaa',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              원형탈모(SALT) 진단
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = '/')}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.04)',
                color: '#ddd',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              대시보드 홈
            </button>
          </div>

          <div className="diagnosis-stage-viewport">
            {currentView === 'areata' && (
              <AlopeciaAreataView
                user={user}
                onRequireAuth={openAuthModal}
                onBack={() => setCurrentView('camera')}
              />
            )}
            {currentView === 'onboarding' && (
              <div className="ob-stage-wrap">
                <div style={{ padding: '12px 14px 0', background: '#09090b', flexShrink: 0 }}>
                  <PrivacyMembershipNoticeCard
                    user={user}
                    featureType="diagnosis"
                    onOpenAuth={openAuthModal}
                  />
                </div>
                <OnboardingView
                  savedProfile={savedProfile}
                  onStart={() => {
                    const nextStep = () => {
                      if (savedProfile && (savedProfile.gender || savedProfile.age)) {
                        setCurrentView('scan_intro');
                      } else {
                        setCurrentView('privacy');
                      }
                    };
                    if (!user) {
                      openAuthModal({
                        mode: 'signup',
                        featureName: 'AI 정밀 탈모진단앱',
                        onSuccess: nextStep,
                      });
                      return;
                    }
                    nextStep();
                  }}
                  onFastStart={() => {
                    const nextStep = () => setCurrentView('scan_intro');
                    if (!user) {
                      openAuthModal({
                        mode: 'signup',
                        featureName: 'AI 정밀 탈모진단앱 (빠른 스캔)',
                        onSuccess: nextStep,
                      });
                      return;
                    }
                    nextStep();
                  }}
                  onRetakeSurvey={() => handleRetakeSurvey(user, openAuthModal)}
                />
              </div>
            )}
            {currentView === 'privacy' && (
              <PrivacyView onBack={() => setCurrentView('onboarding')} onContinue={() => setCurrentView('age')} />
            )}
            {currentView === 'age' && (
              <AgeView
                onBack={() => setCurrentView('privacy')}
                onContinue={(selectedAge) => {
                  setAge(selectedAge);
                  saveSurveyProfile({ age: selectedAge });
                  setCurrentView('ethnicity');
                }}
              />
            )}
            {currentView === 'ethnicity' && (
              <EthnicityView
                onBack={() => setCurrentView('age')}
                onContinue={(selectedEthnicity) => {
                  setEthnicity(selectedEthnicity);
                  saveSurveyProfile({ ethnicity: selectedEthnicity });
                  setCurrentView('goal');
                }}
              />
            )}
            {currentView === 'goal' && (
              <GoalView
                onBack={() => setCurrentView('ethnicity')}
                onContinue={(selectedGoals) => {
                  setGoals(selectedGoals);
                  saveSurveyProfile({ goals: selectedGoals });
                  setCurrentView('family_history');
                }}
              />
            )}
            {currentView === 'family_history' && (
              <FamilyHistoryView
                onBack={() => setCurrentView('goal')}
                onContinue={(selectedHistory) => {
                  setFamilyHistory(selectedHistory);
                  saveSurveyProfile({ familyHistory: selectedHistory });
                  setCurrentView('duration');
                }}
              />
            )}
            {currentView === 'duration' && (
              <DurationView
                onBack={() => setCurrentView('family_history')}
                onContinue={(selectedDuration) => {
                  setDuration(selectedDuration);
                  saveSurveyProfile({ duration: selectedDuration });
                  setCurrentView('quote');
                }}
              />
            )}
            {currentView === 'quote' && <QuoteView onContinue={() => setCurrentView('routine')} />}
            {currentView === 'routine' && (
              <RoutineView
                onBack={() => setCurrentView('duration')}
                onContinue={(selectedRoutine) => {
                  setRoutine(selectedRoutine);
                  saveSurveyProfile({ routine: selectedRoutine });
                  setCurrentView('procedure');
                }}
              />
            )}
            {currentView === 'procedure' && (
              <ProcedureView
                onBack={() => setCurrentView('routine')}
                onContinue={(selectedProcedure) => {
                  setProcedure(selectedProcedure);
                  saveSurveyProfile({ procedure: selectedProcedure });
                  setCurrentView('together');
                }}
              />
            )}
            {currentView === 'together' && <TogetherView onContinue={() => setCurrentView('gender')} />}
            {currentView === 'gender' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  height: '100%',
                  padding: '20px',
                  color: 'var(--text-main)',
                  background: 'var(--bg-main)',
                }}
              >
                <h1
                  style={{
                    marginBottom: '40px',
                    fontSize: '28px',
                    fontFamily: 'var(--font-serif)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  당신의 성별을 선택해주세요
                </h1>
                <div style={{ display: 'flex', gap: '14px', width: '100%', maxWidth: '400px' }}>
                  <button onClick={() => handleGenderSelect('male')} className="btn-secondary">
                    남성 (Norwood·BASP)
                  </button>
                  <button onClick={() => handleGenderSelect('female')} className="btn-primary">
                    여성 (Ludwig·Sinclair)
                  </button>
                </div>
              </div>
            )}
            {currentView === 'expectation' && (
              <ExpectationView onContinue={() => setCurrentView('notification')} />
            )}
            {currentView === 'notification' && (
              <NotificationView onContinue={() => setCurrentView('scan_intro')} />
            )}
            {currentView === 'scan_intro' && <ScanIntroView onContinue={() => setCurrentView('photo_guide')} />}
            {currentView === 'photo_guide' && <PhotoGuideView onContinue={() => setCurrentView('camera')} />}
            {currentView === 'camera' && (
              <CameraView
                onCapture={handleCapture}
                onQuickAnalyze={handleQuickAnalyzeFromCamera}
                onGenderChange={handleCameraGenderSwitch}
                currentStep={currentCaptureSteps[currentCaptureIndex]}
                stepIndex={currentCaptureIndex + 1}
                totalSteps={currentCaptureSteps.length}
                gender={gender}
              />
            )}
            {currentView === 'review' && (
              <ReviewView
                photos={capturedImages}
                gender={gender}
                onStartAnalysis={handleStartAnalysis}
                onRetakeAll={() => {
                  setCapturedImages({ front: null, left: null, right: null, vertex: null });
                  setCapturedAllPoints({ front: null, left: null, right: null, vertex: null });
                  setCurrentCaptureIndex(0);
                  setCurrentView('camera');
                }}
                onBack={() => {
                  setCurrentCaptureIndex(Math.max(0, currentCaptureSteps.length - 1));
                  setCurrentView('camera');
                }}
              />
            )}
            {currentView === 'loading' && (
              <LoadingView
                onComplete={handleLoadingComplete}
                isReady={Boolean(diagnosisData)}
                gender={gender}
              />
            )}
            {currentView === 'result' && (
              <ResultView
                diagnosisData={diagnosisData || {}}
                images={capturedImages}
                onReset={resetApp}
              />
            )}
          </div>

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
            currentMenu={`진단앱 (${currentView})`}
            member={user}
            currentUser={user}
          />
        </div>
      )}
    </AuthGate>
  );
}

export default App;
