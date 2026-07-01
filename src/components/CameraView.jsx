import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RefreshCw, Image as ImageIcon, ArrowRight, ArrowLeft, Smartphone, User, Check } from 'lucide-react';
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';
import './CameraView.css';

const CameraView = ({ onCapture, currentStep = 'front', stepIndex = 1, totalSteps = 4, gender = 'male' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [deviceAngles, setDeviceAngles] = useState({ beta: 90, gamma: 0 });
  const [stream, setStream] = useState(null);
  
  // 상태 관리
  const [isLevel, setIsLevel] = useState(false);
  const [isTargetDetected, setIsTargetDetected] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [capturedPoints, setCapturedPoints] = useState(null); // { hairline: [], face: [], mask: '' }
  
  const latestHairlineRef = useRef([]);
  const latestFaceRef = useRef([]);
  const countdownTimerRef = useRef(null);
  const segmenterRef = useRef(null);

  // 최신 상태를 Camera 콜백에서 읽기 위한 Refs
  const currentStepRef = useRef(currentStep);
  const previewImageRef = useRef(previewImage);

  useEffect(() => {
    currentStepRef.current = currentStep;
    previewImageRef.current = previewImage;
  }, [currentStep, previewImage]);

  // 스텝이 바뀔 때마다 초기화
  useEffect(() => {
    setTimeout(() => {
      setPreviewImage(null);
      setCountdown(null);
    }, 0);
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
  }, [currentStep]);

  const getStepInstruction = () => {
    switch (currentStep) {
      case 'front': return "정면을 보고 이마 라인을 수평선에 맞추세요.";
      case 'left': return "고개를 오른쪽으로 돌려 왼쪽 M자 부위를 보여주세요.";
      case 'right': return "고개를 왼쪽으로 돌려 오른쪽 M자 부위를 보여주세요.";
      case 'vertex': return "고개를 푹 숙여 정수리 중앙을 화면에 꽉 채워주세요.";
      default: return "얼굴을 가이드라인에 맞춰주세요.";
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'front': return "정면 이마선 촬영";
      case 'left': return "좌측 M자 파임 촬영";
      case 'right': return "우측 M자 파임 촬영";
      case 'vertex': return "정수리 밀도 촬영";
      default: return "촬영";
    }
  };

  useEffect(() => {
    let active = true;

    // Load MediaPipe ImageSegmenter
    const loadSegmenter = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          outputCategoryMask: true,
          outputConfidenceMasks: false
        });
        if (active) {
          segmenterRef.current = segmenter;
          console.log("ImageSegmenter loaded");
        }
      } catch (err) {
        console.error("Error loading segmenter:", err);
      }
    };
    loadSegmenter();
    
    // 전역(window)에서 MediaPipe 객체를 가져옵니다.
    const { FaceMesh, Camera } = window;

    if (!FaceMesh) {
      console.error("MediaPipe FaceMesh not loaded from CDN.");
      return;
    }

    // 정수리 모드일 때 FaceMesh 캔버스는 초기화하지만, 카메라는 계속 켜져야 하므로 return 하지 않음.
    if (currentStepRef.current === 'vertex') {
      if (drawingCanvasRef.current) {
        const ctx = drawingCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
      }
    }

    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });
    
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults((results) => {
      if (!drawingCanvasRef.current || !videoRef.current || previewImageRef.current) return;
      const width = drawingCanvasRef.current.width;
      const height = drawingCanvasRef.current.height;
      
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        for (const landmarks of results.multiFaceLandmarks) {
          if (currentStepRef.current !== 'vertex') {
            const pTop = landmarks[10];
            const pNose = landmarks[8];
            const pChin = landmarks[152];
            const fH = Math.abs(pChin.y - pTop.y);
            const faceHeightPx = fH * height;
            const extX = faceHeightPx * 0.8;
            
            const mirrorX = (ptX) => width - (ptX * width);
            let ptsFace = [];
            let ptsHair = [];
            
            if (currentStepRef.current === 'left' || currentStepRef.current === 'right') {
              const topY = (pTop.y - fH * 0.08) * height;
              const topX = mirrorX(pTop.x);
              const noseY = pNose.y * height;
              const noseX = mirrorX(pNose.x);
              
              const dir = (currentStepRef.current === 'left') ? 1 : -1;
              
              ptsHair = [
                { x: topX, y: topY },
                { x: topX + dir * extX * 0.25, y: topY + faceHeightPx * 0.05 },
                { x: topX + dir * extX * 0.5, y: topY + faceHeightPx * 0.15 },
                { x: topX + dir * extX * 0.75, y: topY + faceHeightPx * 0.3 },
                { x: topX + dir * extX, y: topY + faceHeightPx * 0.5 }
              ];
              
              ptsFace = [
                ...ptsHair,
                { x: topX + dir * extX, y: noseY },
                { x: noseX, y: noseY },
                { x: topX, y: topY }
              ];
            } else {
              const faceOutline = [103, 67, 10, 297, 332, 263, 8, 33];
              const hairlineIndices = [103, 67, 10, 297, 332];
              
              for (let i = 0; i < faceOutline.length; i++) {
                const pt = landmarks[faceOutline[i]];
                let x = mirrorX(pt.x);
                let y = pt.y * height;
                if (hairlineIndices.includes(faceOutline[i])) {
                  y = (pt.y - fH * 0.08) * height;
                  ptsHair.push({x, y});
                }
                ptsFace.push({x, y});
              }
            }

            latestFaceRef.current = ptsFace;
            latestHairlineRef.current = ptsHair;
            // 프론트엔드 실시간 화면에서는 네모/다각형 가이드를 그리지 않고 Segmenter Mask만 그립니다.
          }
        }
      }
    });

    let cameraInstance = null;

    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      } 
    })
    .then((mediaStream) => {
      if (!active) return;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setHasCamera(true);
        
        if (Camera) {
          cameraInstance = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && active && !previewImageRef.current) {
                // FaceMesh 업데이트 (정수리 촬영 제외)
                if (currentStepRef.current !== 'vertex') {
                  try {
                    // await을 빼거나 백그라운드에서 처리되도록 하여 Segmenter 블로킹을 방지합니다.
                    faceMesh.send({image: videoRef.current}).catch(e => console.log("FaceMesh error:", e));
                  } catch (e) {}
                }
                
                // 실시간 Segmentation (하늘색/골드색 머리카락 마스크 그리기) - 모든 스텝에서 항상 실행
                if (segmenterRef.current && drawingCanvasRef.current) {
                  try {
                    segmenterRef.current.segmentForVideo(videoRef.current, performance.now(), (result) => {
                      const canvas = drawingCanvasRef.current;
                      if(!canvas) return;
                      const ctx = canvas.getContext('2d');
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      
                      if (result && result.categoryMask) {
                        const mask = result.categoryMask;
                        const maskImageData = new ImageData(mask.width, mask.height);
                        const data = maskImageData.data;
                        const maskData = mask.getAsUint8Array();
                        
                        const halfWidth = mask.width / 2;
                        let targetPixelCount = 0;
                        
                        for (let i = 0; i < maskData.length; i++) {
                          // 1: Hair, 2: Body-skin, 3: Face-skin
                          if (maskData[i] === 1 || maskData[i] === 2 || maskData[i] === 3) {
                            targetPixelCount++;
                          }
                          if (maskData[i] === 1) {
                            if (currentStepRef.current === 'vertex') {
                              const x = i % mask.width;
                              if (x < halfWidth) {
                                // 좌측 분석 영역 (파란색 계열)
                                data[i * 4] = 0;
                                data[i * 4 + 1] = 150;
                                data[i * 4 + 2] = 255;
                                data[i * 4 + 3] = 100;
                              } else {
                                // 우측 분석 영역 (붉은색 계열)
                                data[i * 4] = 255;
                                data[i * 4 + 1] = 82;
                                data[i * 4 + 2] = 82;
                                data[i * 4 + 3] = 100;
                              }
                            } else {
                              data[i * 4] = 212;     // R (Gold)
                              data[i * 4 + 1] = 175; // G
                              data[i * 4 + 2] = 55;  // B
                              data[i * 4 + 3] = 120; // Alpha (반투명 골드)
                            }
                          } else {
                            data[i * 4 + 3] = 0; // 투명
                          }
                        }
                        
                        // 모든 단계에서 피부(얼굴/몸)나 모발이 화면의 2% 이상 잡히면 타겟 인식으로 간주
                        // FaceMesh는 측면 얼굴이나 깜빡임에 취약하므로 Segmenter의 픽셀 면적을 기준으로 판정합니다.
                        setIsTargetDetected(targetPixelCount > (mask.width * mask.height * 0.02));
                        
                        // ImageData를 캔버스에 그리기 위해 임시 캔버스 사용
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = mask.width;
                        tempCanvas.height = mask.height;
                        tempCanvas.getContext('2d').putImageData(maskImageData, 0, 0);
                        
                        // 이미 CSS로 transform: scaleX(-1)가 적용되어 있으므로 바로 그립니다.
                        ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
                        
                        // 폴리곤 가이드 (금색 테두리) 다시 그리기
                        if (currentStepRef.current !== 'vertex' && latestFaceRef.current && latestFaceRef.current.length > 0) {
                          ctx.beginPath();
                          latestFaceRef.current.forEach((pt, index) => {
                            if (index === 0) ctx.moveTo(pt.x, pt.y);
                            else ctx.lineTo(pt.x, pt.y);
                          });
                          ctx.closePath();
                          ctx.lineWidth = 2;
                          ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
                          ctx.setLineDash([5, 5]);
                          ctx.stroke();
                          ctx.setLineDash([]);
                        }
                        
                        // 텍스트 안내
                        ctx.fillStyle = 'rgba(212, 175, 55, 1)';
                        ctx.font = 'bold 16px sans-serif';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                        ctx.shadowBlur = 4;
                        ctx.fillText(currentStepRef.current === 'vertex' ? '좌우 가르마 영역 실시간 분석 중...' : 'AI 실시간 모발 영역 인식 중...', 20, 30);
                        ctx.shadowBlur = 0;
                      }
                    });
                  } catch (e) {
                    console.log("Segmenter error:", e);
                  }
                }
              }
            },
            width: 640,
            height: 480
          });
          cameraInstance.start();
        }
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
      if (cameraInstance) {
        cameraInstance.stop();
      }
      faceMesh.close();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const handleOrientation = (event) => {
      const { beta, gamma } = event;
      if (beta !== null && gamma !== null) {
        setDeviceAngles({ beta, gamma });
        if (currentStep === 'vertex') {
          setIsLevel(Math.abs(gamma) < 15 && beta < 45 && beta > -45);
        } else {
          setIsLevel(beta > 75 && beta < 105 && Math.abs(gamma) < 15);
        }
      } else {
        setIsLevel(true);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
      setTimeout(() => setIsLevel(true), 0);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [currentStep]);

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      // 비디오 먼저 그리기 (거울모드)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // FaceMesh 오버레이는 이제 원본 이미지에 강제 합성하지 않고,
      // 투명 SVG 레이어로 띄워서 사용자가 수정할 수 있게 합니다.

      const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
      
      if (segmenterRef.current) {
        segmenterRef.current.segmentForVideo(canvas, performance.now(), (result) => {
          let maskDataUrl = null;
          if (result && result.categoryMask) {
            const categoryMask = result.categoryMask;
            const maskArray = categoryMask.getAsUint8Array();
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = canvas.width;
            maskCanvas.height = canvas.height;
            const maskCtx = maskCanvas.getContext('2d');
            const imageData = maskCtx.createImageData(canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < maskArray.length; i++) {
              if (maskArray[i] === 1) { 
                data[i * 4] = 212;       
                data[i * 4 + 1] = 175; 
                data[i * 4 + 2] = 55; 
                data[i * 4 + 3] = 120; // Alpha
              } else {
                data[i * 4 + 3] = 0;
              }
            }
            maskCtx.putImageData(imageData, 0, 0);
            maskDataUrl = maskCanvas.toDataURL('image/png');
          }

          // 캡처 시점의 최신 폴리곤 좌표와 마스크를 상태로 저장
          setCapturedPoints({
            face: latestFaceRef.current ? [...latestFaceRef.current] : [],
            hairline: latestHairlineRef.current ? [...latestHairlineRef.current] : [],
            mask: maskDataUrl
          });

          // 승인 대기창으로 전환
          setPreviewImage(imageSrc);
        });
      } else {
        setCapturedPoints({
          face: latestFaceRef.current ? [...latestFaceRef.current] : [],
          hairline: latestHairlineRef.current ? [...latestHairlineRef.current] : [],
          mask: null
        });
        setPreviewImage(imageSrc);
      }
    }
  }, [currentStep]);

  const approveCapture = () => {
    onCapture(previewImage, capturedPoints);
    setPreviewImage(null);
  };

  const retakeCapture = () => {
    setPreviewImage(null);
    setCountdown(null);
  };

  useEffect(() => {
    if (previewImage) {
      setTimeout(() => setCountdown(null), 0);
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      return;
    }

    if (isLevel && isTargetDetected) {
      if (countdown === null) {
        setTimeout(() => setCountdown(3), 0);
      }
    } else {
      setTimeout(() => setCountdown(null), 0);
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    }
  }, [isLevel, isTargetDetected, previewImage]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      captureFrame();
      setTimeout(() => setCountdown(null), 0);
    }

    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [countdown, captureFrame]);

  const mockCapture = () => {
    const mockImage = `https://via.placeholder.com/600x800/222222/cccccc?text=Mock+${currentStep}`;
    setPreviewImage(mockImage);
  };

  return (
    <div className="cv-container">
      <div className="cv-top-guide">
        <div className="cv-progress-bar">
          <div className="cv-progress-fill" style={{width: `${(stepIndex / totalSteps) * 100}%`}}></div>
        </div>
        <h2 className="cv-step-title">[{stepIndex}/{totalSteps}] {getStepTitle()}</h2>
        <p className="cv-step-instruction">{getStepInstruction()}</p>
      </div>

      {previewImage && (
        <div className="cv-preview-wrapper">
          <img src={previewImage} alt="Preview" className="cv-preview-image" />
          
          {/* 딥러닝 모발 마스크 오버레이 */}
          {capturedPoints && capturedPoints.mask && (
            <img 
              src={capturedPoints.mask} 
              alt="Hair Mask" 
              className="cv-manual-svg-overlay" 
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                objectFit: 'cover', pointerEvents: 'none',
                filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.8))'
              }}
            />
          )}

          <div className="cv-preview-actions">
            <div className="cv-preview-actions-right" style={{marginLeft: 'auto'}}>
              <button className="cv-icon-btn cv-btn-refresh" onClick={retakeCapture}>
                <RefreshCw size={28} />
              </button>
              <button className="cv-icon-btn cv-btn-approve" onClick={approveCapture}>
                <Check size={40} color="#000" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: previewImage ? 'none' : 'block', width: '100%', height: '100%' }}>
        <div className="cv-video-wrapper">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="cv-video" 
            style={{ display: hasCamera ? 'block' : 'none', opacity: 1 }} 
          />
          
          {!hasCamera && (
            <div className="cv-placeholder">
              {cameraError ? (
                <div className="cv-error-box">
                  <p className="cv-error-text">{cameraError}</p>
                  <p className="cv-error-subtext">PC에 웹캠이 없거나 권한이 없습니다.</p>
                </div>
              ) : (
                <span className="material-symbols-outlined cv-icon-spin">refresh</span>
              )}
            </div>
          )}

          <canvas 
            ref={drawingCanvasRef}
            className="cv-drawing-canvas"
            width="640"
            height="480"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10,
              transform: 'scaleX(-1)',
              objectFit: 'cover'
            }}
          />

          {hasCamera && (
            <div className={`cv-guideline-overlay strict-guide ${isLevel ? 'level-ok' : ''}`} style={{zIndex: 20}}>
              {currentStep !== 'vertex' && (
                <div className="cv-svg-container" style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                  <div className="cv-corner top-left"></div>
                  <div className="cv-corner top-right"></div>
                  <div className="cv-corner bottom-left"></div>
                  <div className="cv-corner bottom-right"></div>
                  <div className="cv-ghost">
                    <svg width="100%" height="100%" viewBox="0 0 320 426" preserveAspectRatio="xMidYMid meet">
                      <rect x="40" y="20" width="240" height="100" rx="15" fill="rgba(212, 175, 55, 0.15)" stroke="var(--accent-gold)" strokeWidth="2" strokeDasharray="6,4" />
                      <text x="160" y="75" fill="var(--accent-gold)" fontSize="18" fontWeight="bold" textAnchor="middle" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>모발 측정 범위</text>
                      <ellipse cx="160" cy="260" rx="110" ry="140" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="8,6" />
                      <text x="160" y="260" fill="rgba(255,255,255,0.4)" fontSize="16" textAnchor="middle">얼굴</text>
                    </svg>
                  </div>
                </div>
              )}

              {currentStep === 'front' && <div className="cv-vertical-line" style={{ zIndex: 21 }}></div>}
              
              {currentStep === 'vertex' && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 20 }}>
                  <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--accent-gold)' }}>
                    <span style={{ color: 'var(--accent-gold)', fontSize: '18px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>모발 측정 범위</span>
                  </div>
                  <div className="cv-vertex-circle" style={{ position: 'relative', top: 'auto', left: 'auto', transform: 'none' }}>
                    <span className="cv-circle-label">정수리 중앙</span>
                  </div>
                </div>
              )}
              <div className="cv-status-badge">
                {!isLevel ? (
                  <span className="cv-warning-text">{currentStep === 'vertex' ? "기기를 바닥과 평행하게(수평으로) 눕혀주세요" : "기기를 지면과 수직(90도)으로 세우세요"}</span>
                ) : !isTargetDetected ? (
                  <span className="cv-warning-text">{currentStep === 'vertex' ? "정수리 피부나 모발이 화면에 잘 보이게 해주세요" : "얼굴이 명확히 인식되지 않았습니다"}</span>
                ) : (
                  countdown !== null && countdown > 0 ? (
                    <span className="cv-countdown-text">{countdown}초 후 자동 촬영됩니다</span>
                  ) : (
                    <span className="cv-success-text">자세가 좋습니다. 유지해주세요.</span>
                  )
                )}
              </div>

              <div className="cv-gyro-container">
                <div className="cv-gyro-target" style={{ borderColor: isLevel ? 'var(--accent-gold)' : 'rgba(212,175,55,0.3)' }}></div>
                <div 
                  className="cv-gyro-indicator" 
                  style={{
                    transform: `translate(calc(-50% + ${Math.max(-20, Math.min(20, deviceAngles.gamma))}px), calc(-50% + ${Math.max(-20, Math.min(20, (currentStep === 'vertex' ? deviceAngles.beta : deviceAngles.beta - 90)))}px))`,
                    backgroundColor: isLevel ? 'var(--accent-gold)' : 'transparent',
                    borderColor: isLevel ? 'var(--accent-gold)' : 'var(--text-main)'
                  }}
                ></div>
              </div>
              
              {countdown !== null && countdown > 0 && (
                <div className="cv-big-countdown">{countdown}</div>
              )}
            </div>
          )}
          
          <div className="cv-overlay-dim"></div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

        {/* Bottom Controls */}
        <div className="cv-bottom-bar">
          <button className="cv-mock-btn" onClick={mockCapture}>
            <ImageIcon size={16} /> 가상 사진으로 테스트
          </button>

          {/* 수동 캡처 버튼 (가이드 시에도 누를 수 있도록 허용) */}
          <button 
            className="cv-capture-btn" 
            aria-label="사진 촬영" 
            onClick={captureFrame} 
            disabled={!hasCamera} 
            style={{ opacity: hasCamera ? 1 : 0.5 }}
          >
            <div className="cv-capture-inner"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraView;
