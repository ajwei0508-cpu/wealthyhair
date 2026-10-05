import React, { useState } from 'react';
import CameraView from './components/CameraView';
import ReviewView from './components/ReviewView';
import LoadingView from './components/LoadingView';
import ResultView from './components/ResultView';
import AvatarView from './components/AvatarView';
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
import analyzeHairLoss from './utils/diagnosis';
import { performOfflineAnalysis } from './utils/offlineAnalysis';
import { getSavedSurveyProfile, saveSurveyProfile, clearSurveyProfile } from './utils/surveyStorage';
import './index.css';

// CAPTURE_STEPS is now dynamic inside App component

function App() {
  const [currentView, setCurrentView] = useState('onboarding'); 
  // 'onboarding', 'privacy', 'age', 'ethnicity', 'goal', 'family_history', 'duration', 'quote', 'routine', 'procedure', 'together', 'gender', 'expectation', 'notification', 'scan_intro', 'photo_guide', 'camera', 'review', 'loading', 'result', 'avatar'
  
  // 저장된 설문 프로필이 있으면 기본값으로 자동 로드
  const [savedProfile, setSavedProfile] = useState(() => getSavedSurveyProfile());
  const [age, setAge] = useState(savedProfile?.age || null);
  const [ethnicity, setEthnicity] = useState(savedProfile?.ethnicity || null);
  const [goals, setGoals] = useState(savedProfile?.goals || []);
  const [familyHistory, setFamilyHistory] = useState(savedProfile?.familyHistory || null);
  const [duration, setDuration] = useState(savedProfile?.duration || null);
  const [routine, setRoutine] = useState(savedProfile?.routine || null);
  const [procedure, setProcedure] = useState(savedProfile?.procedure || null);
  const [gender, setGender] = useState(savedProfile?.gender || null);
  
  const getCaptureSteps = () => gender === 'female' ? ['front', 'vertex'] : ['front', 'left', 'right', 'vertex'];
  const currentCaptureSteps = getCaptureSteps();
  
  const [capturedImages, setCapturedImages] = useState({
    front: null,
    left: null,
    right: null,
    vertex: null
  });
  const [capturedAllPoints, setCapturedAllPoints] = useState({
    front: null,
    left: null,
    right: null,
    vertex: null
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
      isCompleted: true
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
    setGender(null);
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
        const features = { ...responseData.data.features, gender, age, ethnicity, goals, familyHistory, duration, routine, procedure };
        const result = analyzeHairLoss(features);
        result.features = features;
        result.boxes = responseData.data.boxes || {};
        result.masks = {
          front: capturedAllPoints.front?.mask || null,
          left: capturedAllPoints.left?.mask || null,
          right: capturedAllPoints.right?.mask || null,
          vertex: capturedAllPoints.vertex?.mask || null
        };
        setDiagnosisData(result);
      } else {
        alert(responseData.error || "분석에 실패했습니다.");
        setDiagnosisData(null);
        setCurrentView('review');
      }
    } catch (error) {
      console.error("Network Error:", error);
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

    // 설문 프로필은 로컬스토리지에서 안전하게 유지
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
      setGender(profile.gender || null);
    }
  };

  return (
    <div className="app-container">
      {currentView === 'onboarding' && (
        <OnboardingView 
          savedProfile={savedProfile}
          onStart={() => {
            // 이미 설문이 완료된 기록이 있다면 긴 설문을 건너뛰고 바로 스캔 단계로 이동
            if (savedProfile && (savedProfile.gender || savedProfile.age)) {
              setCurrentView('scan_intro');
            } else {
              setCurrentView('privacy');
            }
          }}
          onFastStart={() => {
            setCurrentView('scan_intro');
          }}
          onRetakeSurvey={handleRetakeSurvey}
        />
      )}
      {currentView === 'privacy' && (
        <PrivacyView 
          onBack={() => setCurrentView('onboarding')}
          onContinue={() => setCurrentView('age')}
        />
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
      {currentView === 'quote' && (
        <QuoteView
          onContinue={() => {
            setCurrentView('routine');
          }}
        />
      )}
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
      {currentView === 'together' && (
        <TogetherView
          onContinue={() => {
            setCurrentView('gender');
          }}
        />
      )}
      {currentView === 'gender' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px', color: 'var(--text-main)', background: 'var(--bg-main)' }}>
          <h1 style={{ marginBottom: '60px', fontSize: '32px', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>당신의 성별을 선택해주세요</h1>
          <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '400px' }}>
            <button 
              onClick={() => handleGenderSelect('male')}
              className="btn-secondary"
            >남성</button>
            <button 
              onClick={() => handleGenderSelect('female')}
              className="btn-primary"
            >여성</button>
          </div>
        </div>
      )}
      {currentView === 'expectation' && (
        <ExpectationView onContinue={() => setCurrentView('notification')} />
      )}
      {currentView === 'notification' && (
        <NotificationView onContinue={() => setCurrentView('scan_intro')} />
      )}
      {currentView === 'scan_intro' && (
        <ScanIntroView onContinue={() => setCurrentView('photo_guide')} />
      )}
      {currentView === 'photo_guide' && (
        <PhotoGuideView onContinue={() => setCurrentView('camera')} />
      )}
      {currentView === 'camera' && 
        <CameraView 
          onCapture={handleCapture} 
          currentStep={currentCaptureSteps[currentCaptureIndex]} 
          stepIndex={currentCaptureIndex + 1}
          totalSteps={currentCaptureSteps.length}
          gender={gender}
        />
      }
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
      {currentView === 'result' && diagnosisData && 
        <ResultView 
          diagnosisData={diagnosisData} 
          images={capturedImages} 
          onReset={resetApp}
          onProceedToAvatar={() => setCurrentView('avatar')}
        />
      }
      {currentView === 'avatar' && diagnosisData &&
        <AvatarView 
          diagnosisData={diagnosisData}
          onBack={() => setCurrentView('result')}
        />
      }
    </div>
  );
}

export default App;
