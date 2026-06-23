import React, { useState } from 'react';
import CameraView from './components/CameraView';
import AnalysisLoading from './components/AnalysisLoading';
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
import analyzeHairLoss from './utils/diagnosis';
import { simulateOfflineAnalysis } from './utils/offlineAnalysis';
import './index.css';

// CAPTURE_STEPS is now dynamic inside App component

function App() {
  const [currentView, setCurrentView] = useState('onboarding'); // 'onboarding', 'privacy', 'age', 'ethnicity', 'goal', 'family_history', 'duration', 'quote', 'gender', 'camera', 'loading', 'result', 'avatar'
  const [age, setAge] = useState(null);
  const [ethnicity, setEthnicity] = useState(null);
  const [goals, setGoals] = useState([]);
  const [familyHistory, setFamilyHistory] = useState(null);
  const [duration, setDuration] = useState(null);
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
    
    // Update the images object with the new capture
    const updatedImages = { ...capturedImages, [currentStep]: imageSrc };
    setCapturedImages(updatedImages);

    const updatedPoints = { ...capturedAllPoints, [currentStep]: points };
    setCapturedAllPoints(updatedPoints);
    
    // Check if we need more photos
    if (currentCaptureIndex < steps.length - 1) {
      setCurrentCaptureIndex(currentCaptureIndex + 1);
      return; // Stay on camera view
    }
    
    // All photos captured, proceed to loading and API call
    setCurrentView('loading');
    
    try {
      // 백엔드 API 대신 프론트엔드 오프라인 시뮬레이터 호출 (실제 이미지 픽셀 분석 포함)
      const responseData = await simulateOfflineAnalysis(updatedPoints, updatedImages);
      
      if (responseData.success) {
        const features = { ...responseData.data.features, gender, age, ethnicity, goals, familyHistory, duration };
        const result = analyzeHairLoss(features);
        // Include the bounding boxes from backend directly into diagnosisData
        result.boxes = responseData.data.boxes || {};
        
        // Use frontend generated highly accurate semantic segmentation masks!
        result.masks = {
          front: updatedPoints.front?.mask || null,
          left: updatedPoints.left?.mask || null,
          right: updatedPoints.right?.mask || null,
          vertex: updatedPoints.vertex?.mask || null
        };
        
        setDiagnosisData(result);
      } else {
        alert(responseData.error || "분석을 완료할 수 없습니다. 다시 촬영해주세요.");
        resetApp();
        return;
      }
    } catch (error) {
      console.error("Network Error:", error);
      setDiagnosisData(null); 
    }
    
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
            setCurrentView('gender');
          }}
        />
      )}
      {currentView === 'gender' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px', color: 'var(--text-main)', background: 'var(--bg-main)' }}>
          <h1 style={{ marginBottom: '60px', fontSize: '32px', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>당신의 성별을 선택해주세요</h1>
          <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '400px' }}>
            <button 
              onClick={() => { setGender('male'); setCurrentView('camera'); }}
              className="btn-secondary"
            >남성</button>
            <button 
              onClick={() => { setGender('female'); setCurrentView('camera'); }}
              className="btn-primary"
            >여성</button>
          </div>
        </div>
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
      {currentView === 'loading' && <AnalysisLoading image={capturedImages.front} />}
      {currentView === 'result' && diagnosisData && 
        <ResultView 
          diagnosisData={diagnosisData} 
          images={capturedImages} 
          onRetake={() => setCurrentView('gender')}
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
