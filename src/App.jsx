import React, { useState } from 'react';
import CameraView from './components/CameraView';
import AnalysisLoading from './components/AnalysisLoading';
import ResultView from './components/ResultView';
import analyzeHairLoss from './utils/diagnosis';
import { simulateOfflineAnalysis } from './utils/offlineAnalysis';
import './index.css';

const CAPTURE_STEPS = ['front', 'left', 'right', 'vertex'];

function App() {
  const [currentView, setCurrentView] = useState('camera'); // 'camera', 'loading', 'result'
  
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
    const currentStep = CAPTURE_STEPS[currentCaptureIndex];
    
    // Update the images object with the new capture
    const updatedImages = { ...capturedImages, [currentStep]: imageSrc };
    setCapturedImages(updatedImages);

    const updatedPoints = { ...capturedAllPoints, [currentStep]: points };
    setCapturedAllPoints(updatedPoints);
    
    // Check if we need more photos
    if (currentCaptureIndex < CAPTURE_STEPS.length - 1) {
      setCurrentCaptureIndex(currentCaptureIndex + 1);
      return; // Stay on camera view
    }
    
    // All photos captured, proceed to loading and API call
    setCurrentView('loading');
    
    try {
      // 백엔드 API 대신 프론트엔드 오프라인 시뮬레이터 호출
      const responseData = await simulateOfflineAnalysis(updatedPoints);
      
      if (responseData.success) {
        const features = responseData.data.features;
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
        console.error("API Error:", responseData.error);
        setDiagnosisData(null);
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
    setCurrentView('camera');
    setDiagnosisData(null);
  };

  return (
    <div className="app-container">
      {currentView === 'camera' && 
        <CameraView 
          onCapture={handleCapture} 
          currentStep={CAPTURE_STEPS[currentCaptureIndex]} 
          stepIndex={currentCaptureIndex + 1}
          totalSteps={CAPTURE_STEPS.length}
        />
      }
      {currentView === 'loading' && <AnalysisLoading image={capturedImages.front} />}
      {currentView === 'result' && <ResultView images={capturedImages} onReset={resetApp} diagnosisData={diagnosisData} />}
    </div>
  );
}

export default App;
