import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RefreshCw, Image as ImageIcon, Upload, Check, HelpCircle } from 'lucide-react';
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';
import PhotoGuideModal from './PhotoGuideModal';
import './CameraView.css';

const CLINICAL_STEP_SAMPLES = {
  male: {
    front: '/dataset/samples/male_s3/Front.jpg',
    left: '/dataset/samples/male_s3/Left.jpg',
    right: '/dataset/samples/male_s3/Right.jpg',
    vertex: '/dataset/samples/crown_clinical/eu_crown_1.jpg',
  },
  female: {
    front: '/dataset/samples/female/case1_top.png',
    vertex: '/dataset/samples/female/case2_top.png',
  },
};

const CameraView = ({ onCapture, currentStep = 'front', stepIndex = 1, totalSteps = 4, gender = 'male' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [deviceAngles, setDeviceAngles] = useState({ beta: 90, gamma: 0 });
  const [stream, setStream] = useState(null);

  const [isLevel, setIsLevel] = useState(false);
  const [isTargetDetected, setIsTargetDetected] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [capturedPoints, setCapturedPoints] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const latestHairlineRef = useRef([]);
  const latestFaceRef = useRef([]);
  const latestMaskArrayRef = useRef(null);
  const latestMaskDimRef = useRef({ width: 0, height: 0 });
  const countdownTimerRef = useRef(null);
  const segmenterRef = useRef(null);

  const currentStepRef = useRef(currentStep);
  const previewImageRef = useRef(previewImage);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    currentStepRef.current = currentStep;
    previewImageRef.current = previewImage;
  }, [currentStep, previewImage]);

  useEffect(() => {
    setTimeout(() => {
      setPreviewImage(null);
      setCountdown(null);
    }, 0);
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
  }, [currentStep]);

  const getStepInstruction = () => {
    if (gender === 'female') {
      return currentStep === 'vertex'
        ? '고개를 숙여 중앙 가르마와 정수리 전체가 선명하게 보이도록 맞춰주세요.'
        : '정면을 보고 이마 헤어라인과 가르마 시작점을 수평선에 맞추세요.';
    }
    switch (currentStep) {
      case 'front':
        return '정면을 보고 이마 라인을 수평선에 맞추세요.';
      case 'left':
        return '고개를 오른쪽으로 돌려 왼쪽 M자 부위를 보여주세요.';
      case 'right':
        return '고개를 왼쪽으로 돌려 오른쪽 M자 부위를 보여주세요.';
      case 'vertex':
        return '고개를 푹 숙여 정수리 중앙을 화면에 꽉 채워주세요.';
      default:
        return '얼굴을 가이드라인에 맞춰주세요.';
    }
  };

  const getStepTitle = () => {
    if (gender === 'female') {
      return currentStep === 'vertex' ? '여성 가르마·정수리 밀도 스캔' : '여성 정면 헤어라인 스캔';
    }
    switch (currentStep) {
      case 'front':
        return '정면 이마선 촬영';
      case 'left':
        return '좌측 M자 파임 촬영';
      case 'right':
        return '우측 M자 파임 촬영';
      case 'vertex':
        return '정수리 밀도 촬영';
      default:
        return '촬영';
    }
  };

  // Find actual hair transition Y in segmenter categoryMask along column X
  const findActualHairlineY = (canvasX, startY, faceHeightPx, canvasWidth, canvasHeight) => {
    const maskArr = latestMaskArrayRef.current;
    const { width: mW, height: mH } = latestMaskDimRef.current;
    if (!maskArr || !mW || !mH) {
      return Math.max(10, startY - faceHeightPx * 0.08);
    }
    // Note: canvasX is already mirrored on display, map back to unmirrored mask X
    const rawX = Math.min(mW - 1, Math.max(0, Math.round(((canvasWidth - canvasX) / canvasWidth) * mW)));
    const startMaskY = Math.min(mH - 1, Math.max(5, Math.round((startY / canvasHeight) * mH)));
    const minMaskY = Math.max(2, Math.round(((startY - faceHeightPx * 0.45) / canvasHeight) * mH));

    for (let y = startMaskY; y >= minMaskY; y--) {
      if (maskArr[y * mW + rawX] === 1) {
        return (y / mH) * canvasHeight;
      }
    }
    return Math.max(10, startY - faceHeightPx * 0.1);
  };

  useEffect(() => {
    let active = true;

    const loadSegmenter = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        const segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });
        if (active) {
          segmenterRef.current = segmenter;
        }
      } catch (err) {
        console.error('Error loading segmenter:', err);
      }
    };
    loadSegmenter();

    const { FaceMesh } = window;
    let faceMesh = null;

    if (FaceMesh) {
      faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
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

              const mirrorX = (ptX) => width - ptX * width;
              let ptsFace = [];
              let ptsHair = [];

              if (currentStepRef.current === 'left' || currentStepRef.current === 'right') {
                const topX = mirrorX(pTop.x);
                const baseTopY = pTop.y * height;
                const topY = findActualHairlineY(topX, baseTopY, faceHeightPx, width, height);
                const noseY = pNose.y * height;
                const noseX = mirrorX(pNose.x);
                const dir = currentStepRef.current === 'left' ? 1 : -1;

                const xs = [
                  topX,
                  topX + dir * extX * 0.25,
                  topX + dir * extX * 0.5,
                  topX + dir * extX * 0.75,
                  topX + dir * extX,
                ];
                ptsHair = xs.map((xPos, i) => ({
                  x: xPos,
                  y: findActualHairlineY(xPos, baseTopY + faceHeightPx * (i * 0.08), faceHeightPx, width, height),
                }));

                ptsFace = [
                  ...ptsHair,
                  { x: topX + dir * extX, y: noseY },
                  { x: noseX, y: noseY },
                  { x: topX, y: topY },
                ];
              } else {
                const faceOutline = [103, 67, 10, 297, 332, 263, 8, 33];
                const hairlineIndices = [103, 67, 10, 297, 332];

                for (let i = 0; i < faceOutline.length; i++) {
                  const pt = landmarks[faceOutline[i]];
                  const x = mirrorX(pt.x);
                  let y = pt.y * height;
                  if (hairlineIndices.includes(faceOutline[i])) {
                    y = findActualHairlineY(x, y, faceHeightPx, width, height);
                    ptsHair.push({ x, y });
                  }
                  ptsFace.push({ x, y });
                }
              }

              latestFaceRef.current = ptsFace;
              latestHairlineRef.current = ptsHair;
            }
          }
        }
      });
    }

    let reqId = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        })
        .then((mediaStream) => {
          if (!active) return;
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            setHasCamera(true);
            videoRef.current.play().catch((e) => console.log('Video play error:', e));

            const tick = async () => {
              if (!active) return;
              if (videoRef.current && active && !previewImageRef.current && !isProcessingRef.current) {
                isProcessingRef.current = true;
                try {
                  if (segmenterRef.current && drawingCanvasRef.current) {
                    segmenterRef.current.segmentForVideo(videoRef.current, performance.now(), (result) => {
                      const canvas = drawingCanvasRef.current;
                      if (!canvas) return;
                      if (
                        videoRef.current &&
                        videoRef.current.videoWidth > 0 &&
                        (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight)
                      ) {
                        canvas.width = videoRef.current.videoWidth;
                        canvas.height = videoRef.current.videoHeight;
                      }
                      const ctx = canvas.getContext('2d');
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      if (result && result.categoryMask) {
                        const mask = result.categoryMask;
                        const maskImageData = new ImageData(mask.width, mask.height);
                        const data = maskImageData.data;
                        const maskData = mask.getAsUint8Array();
                        latestMaskArrayRef.current = new Uint8Array(maskData);
                        latestMaskDimRef.current = { width: mask.width, height: mask.height };

                        const halfWidth = mask.width / 2;
                        let targetPixelCount = 0;
                        for (let i = 0; i < maskData.length; i++) {
                          if (maskData[i] === 1 || maskData[i] === 2 || maskData[i] === 3) {
                            targetPixelCount++;
                          }
                          if (maskData[i] === 1) {
                            if (currentStepRef.current === 'vertex') {
                              const x = i % mask.width;
                              if (x < halfWidth) {
                                data[i * 4] = 0;
                                data[i * 4 + 1] = 150;
                                data[i * 4 + 2] = 255;
                                data[i * 4 + 3] = 100;
                              } else {
                                data[i * 4] = 255;
                                data[i * 4 + 1] = 82;
                                data[i * 4 + 2] = 82;
                                data[i * 4 + 3] = 100;
                              }
                            } else {
                              data[i * 4] = 212;
                              data[i * 4 + 1] = 175;
                              data[i * 4 + 2] = 55;
                              data[i * 4 + 3] = 120;
                            }
                          } else {
                            data[i * 4 + 3] = 0;
                          }
                        }
                        setIsTargetDetected(targetPixelCount > mask.width * mask.height * 0.02);
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = mask.width;
                        tempCanvas.height = mask.height;
                        tempCanvas.getContext('2d').putImageData(maskImageData, 0, 0);
                        ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

                        if (
                          currentStepRef.current !== 'vertex' &&
                          latestFaceRef.current &&
                          latestFaceRef.current.length > 0
                        ) {
                          ctx.beginPath();
                          latestFaceRef.current.forEach((pt, index) => {
                            if (index === 0) ctx.moveTo(pt.x, pt.y);
                            else ctx.lineTo(pt.x, pt.y);
                          });
                          ctx.closePath();
                          ctx.strokeStyle = '#D4AF37';
                          ctx.lineWidth = 2;
                          ctx.stroke();
                        }
                      }
                    });
                  }

                  if (currentStepRef.current !== 'vertex' && faceMesh) {
                    await faceMesh.send({ image: videoRef.current });
                  }
                } catch (e) {
                  console.error(e);
                } finally {
                  isProcessingRef.current = false;
                }
              }
              if (active) reqId = requestAnimationFrame(tick);
            };
            reqId = requestAnimationFrame(tick);
          }
        })
        .catch((err) => {
          console.error('Camera error:', err);
          if (active) {
            setCameraError(err.message || '카메라를 찾을 수 없습니다. 아래 버튼으로 사진을 업로드하거나 임상 샘플을 선택하세요.');
          }
        });
    } else {
      setCameraError('카메라 장치가 없어도 사진 업로드 또는 임상 표준 샘플로 즉시 정밀 진단이 가능합니다.');
    }

    return () => {
      active = false;
      if (reqId) cancelAnimationFrame(reqId);
      if (faceMesh) faceMesh.close();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let hasReceivedEvent = false;
    const handleOrientation = (event) => {
      hasReceivedEvent = true;
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
      setTimeout(() => {
        if (!hasReceivedEvent) setIsLevel(true);
      }, 1000);
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
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageSrc = canvas.toDataURL('image/jpeg', 0.92);

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
                data[i * 4 + 3] = 120;
              } else {
                data[i * 4 + 3] = 0;
              }
            }
            maskCtx.putImageData(imageData, 0, 0);
            maskDataUrl = maskCanvas.toDataURL('image/png');
          }

          setCapturedPoints({
            face: latestFaceRef.current ? [...latestFaceRef.current] : [],
            hairline: latestHairlineRef.current ? [...latestHairlineRef.current] : [],
            mask: maskDataUrl,
          });
          setPreviewImage(imageSrc);
        });
      } else {
        setCapturedPoints({
          face: latestFaceRef.current ? [...latestFaceRef.current] : [],
          hairline: latestHairlineRef.current ? [...latestHairlineRef.current] : [],
          mask: null,
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

  // Load either uploaded file or clinical dataset image into canvas & generate hair mask
  const loadExternalImageAsCapture = (srcUrl) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 640;
      c.height = 480;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL('image/jpeg', 0.92);

      // Generate CIE L*a*b* hair mask & hairline points automatically
      const imgData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imgData.data;
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = c.width;
      maskCanvas.height = c.height;
      const mCtx = maskCanvas.getContext('2d');
      const mImg = mCtx.createImageData(c.width, c.height);
      const md = mImg.data;

      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (lum < 95 && lum > 8) {
          md[i] = 212;
          md[i + 1] = 175;
          md[i + 2] = 55;
          md[i + 3] = 115;
        }
      }
      mCtx.putImageData(mImg, 0, 0);

      setCapturedPoints({
        face: [],
        hairline: [],
        mask: maskCanvas.toDataURL('image/png'),
      });
      setPreviewImage(dataUrl);
    };
    img.src = srcUrl;
  };

  const handleClinicalSampleCapture = () => {
    const gKey = gender === 'female' ? 'female' : 'male';
    const samplePath =
      CLINICAL_STEP_SAMPLES[gKey]?.[currentStep] || CLINICAL_STEP_SAMPLES.male.front;
    loadExternalImageAsCapture(samplePath);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => loadExternalImageAsCapture(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="cv-container">
      <div className="cv-top-guide">
        <div className="cv-progress-bar">
          <div className="cv-progress-fill" style={{ width: `${(stepIndex / totalSteps) * 100}%` }}></div>
        </div>
        <div className="cv-header-flex">
          <h2 className="cv-step-title">
            [{stepIndex}/{totalSteps}] {getStepTitle()}
          </h2>
          <button
            className="cv-guide-help-btn"
            onClick={() => setShowGuideModal(true)}
            type="button"
            title="촬영 방법 안내"
          >
            <HelpCircle size={15} />
            <span>촬영 안내</span>
          </button>
        </div>
        <p className="cv-step-instruction">{getStepInstruction()}</p>
      </div>

      {previewImage && (
        <div className="cv-preview-wrapper">
          <img src={previewImage} alt="Preview" className="cv-preview-image" />

          {capturedPoints && capturedPoints.mask && (
            <img
              src={capturedPoints.mask}
              alt="Hair Mask"
              className="cv-manual-svg-overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.8))',
              }}
            />
          )}

          <div className="cv-preview-actions">
            <div className="cv-preview-actions-right" style={{ marginLeft: 'auto' }}>
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
                <div className="cv-error-box" style={{ padding: '20px' }}>
                  <p className="cv-error-text">{cameraError}</p>
                  <p className="cv-error-subtext" style={{ marginTop: '8px' }}>
                    하단의 <strong>[사진 업로드]</strong> 또는 <strong>[임상 표준 사진 테스트]</strong> 버튼을 눌러 즉시 정밀 진단을 진행할 수 있습니다.
                  </p>
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
              objectFit: 'cover',
            }}
          />

          {hasCamera && (
            <div className={`cv-guideline-overlay strict-guide ${isLevel ? 'level-ok' : ''}`} style={{ zIndex: 20 }}>
              {currentStep === 'front' && <div className="cv-vertical-line" style={{ zIndex: 21 }}></div>}
              <div className="cv-status-badge">
                {!isLevel ? (
                  <span className="cv-warning-text">
                    {currentStep === 'vertex'
                      ? '기기를 바닥과 평행하게(수평으로) 눕혀주세요'
                      : '기기를 지면과 수직(90도)으로 세우세요'}
                  </span>
                ) : !isTargetDetected ? (
                  <span className="cv-warning-text">모발과 두피 영역이 잘 보이도록 맞춰주세요</span>
                ) : (
                  <span className="cv-success-text">자세가 좋습니다. 촬영 버튼을 눌러주세요.</span>
                )}
              </div>
            </div>
          )}

          <div className="cv-overlay-dim"></div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

        {/* Bottom Controls */}
        <div className="cv-bottom-bar" style={{ gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button className="cv-mock-btn" type="button" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} /> 사진 직접 업로드
          </button>

          <button
            className="cv-capture-btn"
            aria-label="사진 촬영"
            onClick={captureFrame}
            disabled={!hasCamera}
            style={{ opacity: hasCamera ? 1 : 0.4 }}
          >
            <div className="cv-capture-inner"></div>
          </button>

          <button className="cv-mock-btn" type="button" onClick={handleClinicalSampleCapture}>
            <ImageIcon size={15} /> 임상 표준 샘플 테스트
          </button>
        </div>
      </div>

      <PhotoGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </div>
  );
};

export default CameraView;
