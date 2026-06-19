import React, { useState } from 'react';
import CameraView from './components/CameraView';
import AnalysisLoading from './components/AnalysisLoading';
import ResultView from './components/ResultView';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('camera'); // 'camera', 'loading', 'result'
  const [capturedImage, setCapturedImage] = useState(null);

  const [diagnosisData, setDiagnosisData] = useState(null);

  const handleCapture = async (imageSrc) => {
    setCapturedImage(imageSrc);
    setCurrentView('loading');
    
    try {
      const formData = new FormData();
      formData.append('image', imageSrc);
      
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        setDiagnosisData(data.data);
      } else {
        console.error("API Error:", data.error);
        setDiagnosisData(null);
      }
    } catch (error) {
      console.error("Network Error:", error);
      // Fallback to null so ResultView uses default mock if backend is down
      setDiagnosisData(null); 
    }
    
    // Add artificial delay for UX if API was too fast
    setTimeout(() => {
      setCurrentView('result');
    }, 2000);
  };

  const resetApp = () => {
    setCapturedImage(null);
    setCurrentView('camera');
  };

  return (
    <div className="app-container">
      {currentView === 'camera' && <CameraView onCapture={handleCapture} />}
      {currentView === 'loading' && <AnalysisLoading image={capturedImage} />}
      {currentView === 'result' && <ResultView image={capturedImage} onReset={resetApp} diagnosisData={diagnosisData} />}
    </div>
  );
}

export default App;
