import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Zap, Image as ImageIcon } from 'lucide-react';
import './CameraView.css';

const CameraView = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const [tilt, setTilt] = useState({ x: 10, y: 10 });
  const [isLevel, setIsLevel] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setHasCamera(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasCamera(false);
        setCameraError('카메라를 찾을 수 없거나 권한이 차단되었습니다.');
      }
    };

    startCamera();

    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      setTilt({ x, y });
      setIsLevel(Math.abs(x) < 3 && Math.abs(y) < 3);
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current && hasCamera) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageSrc = canvas.toDataURL('image/jpeg');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      onCapture(imageSrc);
    }
  };

  const mockCapture = () => {
    const mockImage = 'https://via.placeholder.com/600x800/222222/cccccc?text=Mock+Scalp+Photo';
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onCapture(mockImage);
  };

  return (
    <div className="cv-container">
      <div className="cv-video-wrapper">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="cv-video" 
          style={{ display: hasCamera ? 'block' : 'none' }} 
        />
        {!hasCamera && (
          <div className="cv-placeholder">
            {cameraError ? (
              <div className="cv-error-box">
                <p className="cv-error-text">{cameraError}</p>
                <p className="cv-error-subtext">PC에 웹캠이 없거나 권한이 없습니다.</p>
              </div>
            ) : (
              <p>카메라를 연결하는 중...</p>
            )}
          </div>
        {/* Slight dimming overlay for better UI contrast */}
        <div className="cv-overlay-dim"></div>
      </div>

      {/* Top Action Bar (Overlay) */}
      {/* Video Stream */}
      {hasCamera ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="cv-video"
        ></video>
      ) : (
        <div className="cv-video cv-fallback">
          <p>카메라를 찾을 수 없습니다.<br/>가상 테스트 모드로 진행해주세요.</p>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      {/* Bottom Controls */}
      <div className="cv-bottom-bar">
        {/* Mock test button for non-camera users */}
        <button className="cv-mock-btn" onClick={mockCapture}>
          <ImageIcon size={16} /> 가상 사진으로 테스트
        </button>

        {/* Capture Button */}
        <button className="cv-capture-btn" aria-label="Take Photo" onClick={captureFrame} disabled={!hasCamera} style={{ opacity: hasCamera ? 1 : 0.5 }}>
          <div className="cv-capture-inner"></div>
        </button>
      </div>
    </div>
  );
};

export default CameraView;
