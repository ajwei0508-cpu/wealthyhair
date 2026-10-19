import React, { useState } from 'react';
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
import AuthGate, { MemberHeaderBar, MemberProfileModal } from './components/AuthGate';
import KakaoReportModal from './components/KakaoReportModal';
import analyzeHairLoss from './utils/diagnosis';
import { performOfflineAnalysis } from './utils/offlineAnalysis';
import { getSavedSurveyProfile, saveSurveyProfile, clearSurveyProfile } from './utils/surveyStorage';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('onboarding');
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
  const [gender, setGender] = useState(savedProfile?.gender || 'male');

  const getCaptureSteps = () => (gender === 'female' ? ['front', 'vertex'] : ['front', 'left', 'right', 'vertex']);
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

  const handleRetakeSurvey = () => {
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

  const handleStartAnalysis = async () => {
    setCurrentView('loading');
    try {
      const responseData = await performOfflineAnalysis(capturedAllPoints, capturedImages);
      if (responseData.success) {
        const features = {
          ...responseData.data.features,
          gender,
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
          front: capturedAllPoints.front?.mask || null,
          left: capturedAllPoints.left?.mask || null,
          right: capturedAllPoints.right?.mask || null,
          vertex: capturedAllPoints.vertex?.mask || null,
        };
        setDiagnosisData(result);
      } else {
        alert(responseData.error || '분석에 실패했습니다.');
        setDiagnosisData(null);
        setCurrentView('review');
      }
    } catch (error) {
      console.error('Analysis Error:', error);
      setDiagnosisData(null);
    }
  };

  const handleLoadingComplete = () => {
    setCurrentView('result');
  };

  const resetApp = () => {
    setCapturedImages({ front: null, left: null, right: null, vertex: null });
    setCapturedAllPoints({ front: null, left: null, right: null, vertex: null });
    setCurrentCaptureIndex(0);
    setCurrentView('onboarding');
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
      setGender(profile.gender || 'male');
    }
  };

  return (
    <AuthGate>
      {(user, handleLogout) => (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <MemberHeaderBar
            user={user}
            currentScreenName={`진단앱 (${currentView})`}
            onOpenProfile={() => setProfileModalOpen(true)}
            onOpenReport={() => setReportModalOpen(true)}
          />

          {/* Mode Quick Bar */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '6px 12px',
              background: '#0d0d10',
              borderBottom: '1px solid rgba(212, 175, 55, 0.16)',
            }}
          >
            <button
              type="button"
              onClick={() => setCurrentView('onboarding')}
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

          <div style={{ flex: 1, position: 'relative' }}>
            {currentView === 'areata' && <AlopeciaAreataView />}
            {currentView === 'onboarding' && (
              <OnboardingView
                savedProfile={savedProfile}
                onStart={() => {
                  if (savedProfile && (savedProfile.gender || savedProfile.age)) {
                    setCurrentView('scan_intro');
                  } else {
                    setCurrentView('privacy');
                  }
                }}
                onFastStart={() => setCurrentView('scan_intro')}
                onRetakeSurvey={handleRetakeSurvey}
              />
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
                  height: '80vh',
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
                <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '400px' }}>
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
                currentStep={currentCaptureSteps[currentCaptureIndex]}
                stepIndex={currentCaptureIndex + 1}
                totalSteps={currentCaptureSteps.length}
                gender={gender}
              />
            )}
            {currentView === 'review' && (
              <ReviewView
                photos={capturedImages}
                onStartAnalysis={handleStartAnalysis}
                onRetakeAll={() => {
                  setCapturedImages({ front: null, left: null, right: null, vertex: null });
                  setCurrentCaptureIndex(0);
                  setCurrentView('camera');
                }}
                onBack={() => {
                  setCurrentCaptureIndex(currentCaptureSteps.length - 1);
                  setCurrentView('camera');
                }}
              />
            )}
            {currentView === 'loading' && <LoadingView onComplete={handleLoadingComplete} />}
            {currentView === 'result' && diagnosisData && (
              <ResultView diagnosisData={diagnosisData} images={capturedImages} onReset={resetApp} />
            )}
          </div>

          <MemberProfileModal
            isOpen={profileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            user={user}
            onLogout={handleLogout}
          />

          <KakaoReportModal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            onOpen={() => setReportModalOpen(true)}
            currentMenu={`진단앱 (${currentView})`}
            currentUser={user}
          />
        </div>
      )}
    </AuthGate>
  );
}

export default App;
