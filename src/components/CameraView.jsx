import { useRef, useState, useEffect, useCallback } from 'react';
import { RefreshCw, Image as ImageIcon, Upload, Check, HelpCircle, Sparkles } from 'lucide-react';
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

const buildLuminanceHairMask = (ctx, width, height) => {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const mCtx = maskCanvas.getContext('2d');
    const mImg = mCtx.createImageData(width, height);
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
    return maskCanvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Fallback mask generation skipped:', err);
    return null;
  }
};

const CameraView = ({
  onCapture,
  onQuickAnalyze,
  onGenderChange,
  onPrevStep = null,
  isSingleRetake = false,
  currentStep = 'front',
  stepIndex = 1,
  totalSteps = 4,
  gender = 'male',
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState(() =>
    typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      ? ''
      : '카메라 장치가 없어도 사진 업로드 또는 임상 표준 샘플로 즉시 정밀 진단이 가능합니다.'
  );
  const [isLevel, setIsLevel] = useState(() => typeof window === 'undefined' || !window.DeviceOrientationEvent);
  const [isTargetDetected, setIsTargetDetected] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [capturedPoints, setCapturedPoints] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const latestHairlineRef = useRef([]);
  const latestFaceRef = useRef([]);
  const latestMaskArrayRef = useRef(null);
  const latestMaskDimRef = useRef({ width: 0, height: 0 });
  const countdownTimerRef = useRef(null);
  const segmenterRef = useRef(null);
  const streamRef = useRef(null);

  const currentStepRef = useRef(currentStep);
  const previewImageRef = useRef(previewImage);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    currentStepRef.current = currentStep;
    previewImageRef.current = previewImage;
  }, [currentStep, previewImage]);

  useEffect(() => {
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
  }, [currentStep, gender]);

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
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
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
        console.warn('Segmenter GPU load warning (using CIE L*a*b* fallback):', err);
      }
    };
    loadSegmenter();

    const { FaceMesh } = window;
    let faceMesh = null;

    if (FaceMesh) {
      try {
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
      } catch (e) {
        console.warn('FaceMesh initialization skipped:', e);
      }
    }

    let reqId = null;
    let lastTs = 0;

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
          if (!active) {
            mediaStream.getTracks().forEach((track) => track.stop());
            return;
          }
          streamRef.current = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            setHasCamera(true);
            videoRef.current.play().catch((e) => console.log('Video play error:', e));

            const tick = async () => {
              if (!active) return;
              if (
                videoRef.current &&
                videoRef.current.readyState >= 2 &&
                active &&
                !previewImageRef.current &&
                !isProcessingRef.current
              ) {
                isProcessingRef.current = true;
                try {
                  const nowTs = Math.max(lastTs + 1, Math.floor(performance.now()));
                  lastTs = nowTs;

                  if (segmenterRef.current && drawingCanvasRef.current) {
                    segmenterRef.current.segmentForVideo(videoRef.current, nowTs, (result) => {
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
                  console.warn('Frame processing warning:', e);
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
          console.warn('Camera error:', err);
          if (active) {
            setCameraError(
              err.message || '카메라를 찾을 수 없습니다. 아래 버튼으로 사진을 업로드하거나 임상 샘플을 선택하세요.'
            );
          }
        });
    }

    return () => {
      active = false;
      if (reqId) cancelAnimationFrame(reqId);
      if (faceMesh) {
        try {
          faceMesh.close();
        } catch {
          // ignore cleanup warning
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let hasReceivedEvent = false;
    const handleOrientation = (event) => {
      hasReceivedEvent = true;
      const { beta, gamma } = event;
      if (beta !== null && gamma !== null) {
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
      }, 800);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [currentStep]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    const imageSrc = canvas.toDataURL('image/jpeg', 0.92);

    // Build hair segmentation mask safely from latest video mask or CIE L*a*b*/luminance fallback
    let maskDataUrl;
    try {
      const maskArr = latestMaskArrayRef.current;
      const { width: mW, height: mH } = latestMaskDimRef.current;

      if (maskArr && mW > 0 && mH > 0) {
        const rawMaskCanvas = document.createElement('canvas');
        rawMaskCanvas.width = mW;
        rawMaskCanvas.height = mH;
        const rawCtx = rawMaskCanvas.getContext('2d');
        const rawImgData = rawCtx.createImageData(mW, mH);
        const rawData = rawImgData.data;

        for (let i = 0; i < maskArr.length; i++) {
          if (maskArr[i] === 1) {
            rawData[i * 4] = 212;
            rawData[i * 4 + 1] = 175;
            rawData[i * 4 + 2] = 55;
            rawData[i * 4 + 3] = 120;
          } else {
            rawData[i * 4 + 3] = 0;
          }
        }
        rawCtx.putImageData(rawImgData, 0, 0);

        const outMaskCanvas = document.createElement('canvas');
        outMaskCanvas.width = width;
        outMaskCanvas.height = height;
        const outCtx = outMaskCanvas.getContext('2d');
        outCtx.translate(width, 0);
        outCtx.scale(-1, 1);
        outCtx.drawImage(rawMaskCanvas, 0, 0, width, height);
        maskDataUrl = outMaskCanvas.toDataURL('image/png');
      } else {
        maskDataUrl = buildLuminanceHairMask(ctx, width, height);
      }
    } catch (err) {
      console.warn('Mask generation fallback:', err);
      maskDataUrl = buildLuminanceHairMask(ctx, width, height);
    }

    setCapturedPoints({
      face: latestFaceRef.current ? [...latestFaceRef.current] : [],
      hairline: latestHairlineRef.current ? [...latestHairlineRef.current] : [],
      mask: maskDataUrl,
    });
    setPreviewImage(imageSrc);
  }, []);

  const approveCapture = () => {
    if (!previewImage) return;
    onCapture(previewImage, capturedPoints);
    setPreviewImage(null);
  };

  const handleImmediateAnalyze = () => {
    if (!previewImage) return;
    if (onQuickAnalyze) {
      onQuickAnalyze(previewImage, capturedPoints);
      setPreviewImage(null);
    } else {
      approveCapture();
    }
  };

  const retakeCapture = () => {
    setPreviewImage(null);
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
      ctx.fillStyle = '#141418';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL('image/jpeg', 0.92);
      const maskDataUrl = buildLuminanceHairMask(ctx, c.width, c.height);

      setCapturedPoints({
        face: [],
        hairline: [],
        mask: maskDataUrl,
      });
      setPreviewImage(dataUrl);
    };
    img.onerror = () => {
      alert('이미지를 불러올 수 없습니다. 다른 사진 파일을 선택해 주세요.');
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
    e.target.value = '';
  };

  const isLastStep = stepIndex >= totalSteps;

  return (
    <div className="cv-container">
      <div className="cv-top-guide">
        {/* 남성 / 여성 진단 모드 즉시 전환 탭 */}
        {onGenderChange && (
          <div className="cv-gender-switch-bar">
            <button
              type="button"
              className={`cv-gender-pill ${gender === 'male' ? 'active' : ''}`}
              onClick={() => {
                setPreviewImage(null);
                onGenderChange('male');
              }}
            >
              👨 남성 탈모 (4컷: 정면·좌·우·정수리)
            </button>
            <button
              type="button"
              className={`cv-gender-pill ${gender === 'female' ? 'active' : ''}`}
              onClick={() => {
                setPreviewImage(null);
                onGenderChange('female');
              }}
            >
              👩 여성 탈모 (2컷: 정면·가르마)
            </button>
          </div>
        )}

        <div className="cv-progress-bar">
          <div className="cv-progress-fill" style={{ width: `${(stepIndex / totalSteps) * 100}%` }} />
        </div>
        <div className="cv-header-flex">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {stepIndex > 1 && onPrevStep && !isSingleRetake && (
              <button
                type="button"
                onClick={() => {
                  setPreviewImage(null);
                  onPrevStep();
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(212, 175, 55, 0.45)',
                  background: 'rgba(212, 175, 55, 0.12)',
                  color: '#D4AF37',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ← 이전
              </button>
            )}
            <h2 className="cv-step-title">
              [{stepIndex}/{totalSteps}] {getStepTitle()}
            </h2>
          </div>
          <button
            className="cv-guide-help-btn"
            onClick={() => setShowGuideModal(true)}
            type="button"
            aria-label="촬영 방법 안내"
          >
            <HelpCircle size={14} />
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
            <div className="cv-preview-btn-stack">
              <div className="cv-preview-main-row">
                <button
                  type="button"
                  className="cv-preview-retake-btn"
                  onClick={retakeCapture}
                >
                  <RefreshCw size={16} /> 다시 촬영
                </button>
                <button
                  type="button"
                  className="cv-preview-confirm-btn"
                  onClick={approveCapture}
                >
                  <Check size={18} strokeWidth={3} />
                  {isSingleRetake || isLastStep
                    ? '촬영 완료 · 진단 확인하기 →'
                    : `이 사진 확정 · 다음(${stepIndex + 1}/${totalSteps}) →`}
                </button>
              </div>

              {!isLastStep && onQuickAnalyze && (
                <button
                  type="button"
                  className="cv-preview-quick-analyze-btn"
                  onClick={handleImmediateAnalyze}
                >
                  <Sparkles size={14} /> 현재 촬영 사진만으로 즉시 AI 진단 결과 보기 →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: previewImage ? 'none' : 'flex',
          flexDirection: 'column',
          flex: 1,
          width: '100%',
          height: '100%',
          minHeight: 0,
          position: 'relative',
        }}
      >
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
                    하단의 <strong>[사진 직접 업로드]</strong> 또는 <strong>[임상 표준 샘플 테스트]</strong> 버튼을 눌러 즉시 정밀 진단을 진행할 수 있습니다.
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
              {currentStep === 'front' && <div className="cv-vertical-line" style={{ zIndex: 21 }} />}
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
                  <span className="cv-success-text">자세가 좋습니다. 아래 촬영 버튼을 눌러주세요.</span>
                )}
              </div>
            </div>
          )}

          <div className="cv-overlay-dim" />
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Bottom Controls */}
        <div className="cv-bottom-bar">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          <button
            className="cv-capture-btn"
            type="button"
            aria-label="사진 촬영"
            onClick={captureFrame}
            disabled={!hasCamera}
            style={{ opacity: hasCamera ? 1 : 0.4 }}
          >
            <div className="cv-capture-inner" />
          </button>

          <div className="cv-upload-row">
            <button className="cv-mock-btn" type="button" onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} /> 사진 직접 업로드
            </button>
            <button className="cv-mock-btn" type="button" onClick={handleClinicalSampleCapture}>
              <ImageIcon size={14} /> 임상 표준 샘플 테스트
            </button>
          </div>
        </div>
      </div>

      <PhotoGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </div>
  );
};

export default CameraView;
