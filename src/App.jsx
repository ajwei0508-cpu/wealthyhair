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
import { simulateOfflineAnalysis } from './utils/offlineAnalysis';
import './index.css';

// CAPTURE_STEPS is now dynamic inside App component

function App() {
  const [currentView, setCurrentView] = useState('gender'); // 'onboarding', 'privacy', 'age', 'ethnicity', 'goal', 'family_history', 'duration', 'quote', 'routine', 'procedure', 'together', 'gender', 'expectation', 'notification', 'scan_intro', 'photo_guide', 'camera', 'review', 'loading', 'result', 'avatar'
  const [age, setAge] = useState(null);
  const [ethnicity, setEthnicity] = useState(null);
  const [goals, setGoals] = useState([]);
  const [familyHistory, setFamilyHistory] = useState(null);
  const [duration, setDuration] = useState(null);
  const [routine, setRoutine] = useState(null);
  const [procedure, setProcedure] = useState(null);
  const [gender, setGender] = useState(null);
  
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
      const responseData = await simulateOfflineAnalysis(capturedAllPoints, capturedImages);
      if (responseData.success) {
        const features = { ...responseData.data.features, gender, age, ethnicity, goals, familyHistory, duration, routine, procedure };
        const result = analyzeHairLoss(features);
        result.boxes = responseData.data.boxes || {};
        result.masks = {
          front: capturedAllPoints.front?.mask || null,
          left: capturedAllPoints.left?.mask || null,
          right: capturedAllPoints.right?.mask || null,
          vertex: capturedAllPoints.vertex?.mask || null
        };
        setDiagnosisData(result);
      } else {
        setDiagnosisData(null);
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
    setCurrentCaptureIndex(0);
    setCurrentView('onboarding');
    setAge(null);
    setEthnicity(null);
    setGoals([]);
    setFamilyHistory(null);
    setDuration(null);
    setRoutine(null);
    setProcedure(null);
    setGender(null);
    setDiagnosisData(null);
  };

  return (
    <div className="app-container">
      {currentView === 'onboarding' && (
        <OnboardingView onStart={() => setCurrentView('privacy')} />
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
            setCurrentView('ethnicity');
          }}
        />
      )}
      {currentView === 'ethnicity' && (
        <EthnicityView
          onBack={() => setCurrentView('age')}
          onContinue={(selectedEthnicity) => {
            setEthnicity(selectedEthnicity);
            setCurrentView('goal');
          }}
        />
      )}
      {currentView === 'goal' && (
        <GoalView
          onBack={() => setCurrentView('ethnicity')}
          onContinue={(selectedGoals) => {
            setGoals(selectedGoals);
            setCurrentView('family_history');
          }}
        />
      )}
      {currentView === 'family_history' && (
        <FamilyHistoryView
          onBack={() => setCurrentView('goal')}
          onContinue={(selectedHistory) => {
            setFamilyHistory(selectedHistory);
            setCurrentView('duration');
          }}
        />
      )}
      {currentView === 'duration' && (
        <DurationView
          onBack={() => setCurrentView('family_history')}
          onContinue={(selectedDuration) => {
            setDuration(selectedDuration);
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
            setCurrentView('procedure');
          }}
        />
      )}
      {currentView === 'procedure' && (
        <ProcedureView
          onBack={() => setCurrentView('routine')}
          onContinue={(selectedProcedure) => {
            setProcedure(selectedProcedure);
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
              onClick={() => { setGender('male'); setCurrentView('expectation'); }}
              className="btn-secondary"
            >남성</button>
            <button 
              onClick={() => { setGender('female'); setCurrentView('expectation'); }}
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
          onReset={() => setCurrentView('gender')}
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
