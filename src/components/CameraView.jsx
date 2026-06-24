import React, { useRef, useState, useEffect, useCallback } from 'react';
import { HelpCircle, Zap, X } from 'lucide-react';
import './CameraView.css';

// Reference images (mock placeholders)
const refImages = {
  front: 'https://via.placeholder.com/160/222222/cda8fc?text=Front',
  left: 'https://via.placeholder.com/160/222222/cda8fc?text=Left',
  right: 'https://via.placeholder.com/160/222222/cda8fc?text=Right',
  vertex: 'https://via.placeholder.com/160/222222/cda8fc?text=Top'
};

const CameraView = ({ onCapture, currentStep = 'front', stepIndex = 1, totalSteps = 4, gender = 'male' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [stream, setStream] = useState(null);
  
  const [previewImage, setPreviewImage] = useState(null);

  const getStepInstruction = () => {
    if (gender === 'female') {
      switch (currentStep) {
        case 'front': return "정면을 보고 정상적인 헤어라인이 보이도록 이마를 드러내주세요.";
        case 'left': return "고개를 오른쪽으로 돌려 좌측 가르마 부근의 숱을 보여주세요.";
        case 'right': return "고개를 왼쪽으로 돌려 우측 가르마 부근의 숱을 보여주세요.";
        case 'vertex': return "고개를 푹 숙이고, 머리를 가운데 가르마로 선명하게 타주세요.";
        default: return "얼굴을 가이드라인에 맞춰주세요.";
      }
    } else {
      switch (currentStep) {
        case 'front': return "정면을 보고 이마 라인을 수평선에 맞추세요.";
        case 'left': return "고개를 오른쪽으로 돌려 왼쪽 M자 부위를 보여주세요.";
        case 'right': return "고개를 왼쪽으로 돌려 오른쪽 M자 부위를 보여주세요.";
        case 'vertex': return "고개를 푹 숙여 정수리 중앙을 화면에 꽉 채워주세요.";
        default: return "얼굴을 가이드라인에 맞춰주세요.";
      }
    }
  };

  useEffect(() => {
    let active = true;

    if (previewImage) return;

    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'user',
        width: { ideal: 720 },
        height: { ideal: 1280 }
      } 
    })
    .then((mediaStream) => {
      if (!active) return;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setHasCamera(true);
      }
    })
    .catch((err) => {
      console.error("Camera error:", err);
      if (active) {
        setCameraError(err.message || "카메라를 찾을 수 없습니다.");
      }
    });

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentStep, previewImage]);

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      
      const ctx = canvas.getContext('2d');
      // 비디오 먼저 그리기 (거울모드)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewImage(imageSrc);
    }
  }, []);

  const approveCapture = () => {
    onCapture(previewImage);
    setPreviewImage(null);
  };

  const retakeCapture = () => {
    setPreviewImage(null);
  };

  return (
    <div className="cv-wrapper">
      <div className="cv-top-bar">
        <button className="cv-pill-btn">
          <HelpCircle size={16} className="cv-pill-icon" /> Help
        </button>
        <div className="cv-top-center-btns">
          <button className="cv-pill-btn">
            <Zap size={16} className="cv-pill-icon" /> On
          </button>
          <button className="cv-icon-btn">
            <X size={20} />
          </button>
        </div>
      </div>

      {previewImage ? (
        <>
          <img src={previewImage} alt="Preview" className="cv-preview-img" />
          <div className="cv-dark-overlay" style={{background: 'rgba(0,0,0,0.6)'}}></div>
          <div className="cv-preview-actions">
            <div className="cv-preview-title">How does this look?</div>
            <button className="cv-btn-retake" onClick={retakeCapture}>
              다시 찍기 (Retake)
            </button>
            <button className="cv-btn-keep" onClick={approveCapture}>
              사진 사용 (Keep Photo)
            </button>
          </div>
        </>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="cv-video" 
            style={{ display: hasCamera ? 'block' : 'none' }} 
          />
          
          <div className="cv-dark-overlay">
            <div className="cv-circle-border">
              {/* Guide Overlay inside circle depending on step */}
              <div className="cv-face-guide"></div>
            </div>

            <div className="cv-instructions">
              <div className="cv-instruction-top">HOLD YOUR PHONE AT ARM'S LENGTH</div>
              <h2 className="cv-instruction-main">{getStepInstruction()}</h2>
            </div>

            <div className="cv-reference">
              <img src={refImages[currentStep]} alt="reference" />
            </div>
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

          {/* Bottom Area */}
          <div className="cv-capture-area">
            <button 
              className="cv-capture-btn" 
              onClick={captureFrame} 
              disabled={!hasCamera} 
              style={{ opacity: hasCamera ? 1 : 0.5 }}
            >
              <div className="cv-capture-inner"></div>
            </button>

            <div className="cv-progress-steps">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={`cv-step-bar ${step <= stepIndex ? 'active' : ''}`}></div>
              ))}
            </div>
          </div>

          {!hasCamera && cameraError && (
            <div className="cv-error">
              <p>{cameraError}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CameraView;
