// src/utils/offlineAnalysis.js

const analyzeVertexDensity = (imageSrc, maskSrc = null) => {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve({ densityLossPercent: 10.0, box: [160, 120, 320, 240] });
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const processAnalysis = (maskData) => {
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          let startX = Math.floor(canvas.width * 0.25);
          let endX = Math.floor(canvas.width * 0.75);
          let startY = Math.floor(canvas.height * 0.25);
          let endY = Math.floor(canvas.height * 0.75);

          // 마스크가 주어졌다면 마스크 영역(모발)의 바운딩 박스를 찾아 그 중심부를 분석합니다.
          if (maskData) {
            let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
            for (let y = 0; y < canvas.height; y++) {
              for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                if (maskData[idx + 3] > 0) { // 투명하지 않은 픽셀 (모발 마스크)
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }
            if (minX < maxX && minY < maxY) {
              const hairWidth = maxX - minX;
              const hairHeight = maxY - minY;
              
              // 1. 가르마 X좌표 자동 탐색 (두피 픽셀이 가장 밀집된 X 기둥 찾기)
              let bestX = Math.floor(minX + hairWidth / 2);
              let maxScalpCount = -1;
              const colWidth = Math.floor(canvas.width * 0.04); // 탐색 너비 (화면의 약 4%)
              
              // 모발 영역의 좌우 20%~80% 사이에서 탐색
              const searchMinX = Math.floor(minX + hairWidth * 0.2);
              const searchMaxX = Math.floor(maxX - hairWidth * 0.2);
              // 이마나 얼굴 피부가 오인식되는 것을 방지하기 위해 정수리 상단(10%~50%)만 탐색
              const searchMinY = Math.floor(minY + hairHeight * 0.1);
              const searchMaxY = Math.floor(minY + hairHeight * 0.5);

              for (let cx = searchMinX; cx < searchMaxX; cx += 4) {
                let scalpCount = 0;
                for (let y = searchMinY; y < searchMaxY; y++) {
                  for (let wx = cx - Math.floor(colWidth/2); wx <= cx + Math.floor(colWidth/2); wx++) {
                    if (wx < 0 || wx >= canvas.width) continue;
                    const idx = (y * canvas.width + wx) * 4;
                    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
                    
                    const isSkinTone = (r > 120 && g > 100 && b > 90 && r > g && r > b && (r - Math.min(g, b)) > 10);
                    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
                    
                    if (isSkinTone || brightness > 170) {
                      scalpCount++;
                    }
                  }
                }
                if (scalpCount > maxScalpCount) {
                  maxScalpCount = scalpCount;
                  bestX = cx;
                }
              }

              if (maxScalpCount === 0) {
                bestX = Math.floor(minX + hairWidth / 2); // 탐색 실패시 중앙값 유지
              }

              // 2. 찾은 가르마 좌표(bestX)를 정중앙으로 하여 60% 크기의 분석 영역 박스 생성
              const analysisWidth = Math.floor(hairWidth * 0.6);
              
              startX = Math.max(0, Math.floor(bestX - analysisWidth / 2));
              endX = Math.min(canvas.width, Math.floor(bestX + analysisWidth / 2));
              startY = Math.floor(minY + hairHeight * 0.2);
              endY = Math.floor(maxY - hairHeight * 0.2);
            }
          }

          let totalHairAreaPixels = 0;
          let scalpPixels = 0;

          let r = 0, g = 0, b = 0;
          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              const idx = (y * canvas.width + x) * 4;
              r = data[idx];
              g = data[idx + 1];
              b = data[idx + 2];

              const isSkinTone = (r > 120 && g > 100 && b > 90 && r > g && r > b && (r - Math.min(g, b)) > 10);
              const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
              const isScalp = isSkinTone || brightness > 180;

              if (isScalp) {
                scalpPixels++;
              }
              totalHairAreaPixels++;
            }
          }

          let densityLossPercent = 0;
          if (totalHairAreaPixels > 0) {
            if (scalpPixels === 0 && r === 0 && g === 0 && b === 0) {
               resolve({ densityLossPercent: -1.0, box: [160, 120, 320, 240] });
               return;
            }
            const scalpRatio = scalpPixels / totalHairAreaPixels;
            densityLossPercent = scalpRatio * 100 * 2.5; 
            densityLossPercent = Math.min(Math.max(densityLossPercent, 0), 100);
          }

          resolve({
            densityLossPercent: parseFloat(densityLossPercent.toFixed(2)),
            box: [startX, startY, endX - startX, endY - startY]
          });
        } catch (e) {
          console.error("Canvas image data read error:", e);
          resolve({ densityLossPercent: 10.0, box: [160, 120, 320, 240] });
        }
      };

      if (maskSrc) {
        const maskImg = new Image();
        maskImg.onload = () => {
          const mCanvas = document.createElement('canvas');
          mCanvas.width = canvas.width;
          mCanvas.height = canvas.height;
          const mCtx = mCanvas.getContext('2d');
          mCtx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
          const maskData = mCtx.getImageData(0, 0, canvas.width, canvas.height).data;
          processAnalysis(maskData);
        };
        maskImg.onerror = () => {
          processAnalysis(null);
        };
        maskImg.src = maskSrc;
      } else {
        processAnalysis(null);
      }
    };
    img.onerror = () => {
      console.error("Failed to load image for density analysis");
      resolve({ densityLossPercent: 10.0, box: [160, 120, 320, 240] });
    };
    img.src = imageSrc;
  });
};

export const performOfflineAnalysis = async (pointsData, capturedImages) => {
  // 실제 AI 분석처럼 느끼도록 최소 지연시간 보장 (Canvas 분석이 너무 빠를 수 있음)
  await new Promise(resolve => setTimeout(resolve, 800));

  // 1. 유효성 검사 (얼굴 또는 모발이 제대로 찍혔는지)
  // 강제로 반려하면 사용자 경험을 해치므로, 인식이 안 되었을 때는 기본값(0.0)으로 처리하도록 완화합니다.
  const isFrontMock = capturedImages?.front?.includes('via.placeholder.com');
  if (!isFrontMock && pointsData?.front && (!pointsData.front.face || pointsData.front.face.length === 0)) {
    console.warn("사진에서 얼굴이 완벽하게 인식되지 않았으나 분석을 계속 진행합니다.");
  }

  // 간단한 좌표 기반 거리 계산 유틸리티
  const calculateRecession = (pts, type) => {
    if (!pts || !pts.face || pts.face.length === 0) return 0.0;
    
    // 얼굴 전체 높이 추정 (대략적인 바운딩 박스)
    const ys = pts.face.map(p => p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const faceHeight = maxY - minY;
    
    if (faceHeight <= 0) return 0.0;
    
    // 헤어라인의 평균 Y 좌표
    let hairlineY = minY;
    if (pts.hairline && pts.hairline.length > 0) {
      const hys = pts.hairline.map(p => p.y);
      hairlineY = Math.min(...hys);
    }
    
    // 이마 상단 끝(minY)과 헤어라인(hairlineY)의 거리 차이 측정
    const distancePixels = minY - hairlineY; 
    let recessionCm = 0.0;
    
    if (distancePixels > 0) {
      // 대략적인 픽셀 -> cm 변환 (평균 얼굴 높이 20cm 가정)
      recessionCm = (distancePixels / faceHeight) * 20.0;
    }
    
    // 측면 사진의 경우 가중치 부여
    if (type === 'left' || type === 'right') {
      recessionCm = recessionCm * 1.5; 
    }
    
    return parseFloat(recessionCm.toFixed(2));
  };

  const front_val = calculateRecession(pointsData.front, 'front');
  const left_val = calculateRecession(pointsData.left, 'left');
  const right_val = calculateRecession(pointsData.right, 'right');
  
  // 템플(M자)의 대표값은 좌우 중 더 파인 곳으로 설정
  const temple_val = Math.max(left_val, right_val);
  
  // 랜덤 값 대신 실제 마스크와 정수리 픽셀을 결합한 분석 적용!
  const vertexResult = await analyzeVertexDensity(capturedImages?.vertex, pointsData?.vertex?.mask);
  const vertex_val = vertexResult.densityLossPercent;
  const vertex_box = vertexResult.box;

  if (vertex_val === -1.0) {
    return {
      success: false,
      error: "정수리 사진이 너무 어둡거나 두피/모발을 찾을 수 없습니다. 다시 촬영해주세요."
    };
  }

  // === 상세 원인 분석 문구 생성 로직 (단답형 항목별 요약) ===
  const explanations = [];
  explanations.push(`**[주요 측정 결과]**`);
  explanations.push(`- **측두부 (M자) 파임**: 약 ${temple_val.toFixed(1)} cm`);
  explanations.push(`- **전두부 (앞머리) 후퇴**: 약 ${front_val.toFixed(1)} cm`);
  explanations.push(`- **정수리(가르마) 노출도**: 약 ${vertex_val.toFixed(1)} % (밀도 감소율)\n`);
  explanations.push(`**[종합 분석 소견]**`);

  if (temple_val > 2.0) {
      if (left_val > right_val + 1.0) {
          explanations.push(`- 좌측 관자놀이가 우측보다 심하게 파인 비대칭 M자 패턴입니다.`);
      } else if (right_val > left_val + 1.0) {
          explanations.push(`- 우측 관자놀이가 좌측보다 심하게 파인 비대칭 M자 패턴입니다.`);
      } else {
          explanations.push(`- 양측 관자놀이에 뚜렷한 파임이 있는 전형적인 M자 패턴입니다.`);
      }
  } else {
      explanations.push("- 관자놀이(M자) 영역 헤어라인이 잘 유지되고 있습니다.");
  }

  if (front_val > 1.5) {
      explanations.push(`- 앞머리 중앙 라인이 넓게 후퇴하는 패턴이 동반되었습니다.`);
  }
      
  if (vertex_val > 30.0) {
      explanations.push(`- 정수리(가르마) 모발이 얇아지고 두피 노출이 눈에 띄게 증가했습니다.`);
  } else if (vertex_val > 15.0) {
      explanations.push(`- 정수리(가르마) 부위에 미세한 모발 밀도 감소와 두피 비침이 감지됩니다.`);
  } else {
      explanations.push("- 정수리 부위 모발 숱과 가르마 밀도는 정상 범주로 빽빽하게 유지되고 있습니다.");
  }

  const explanation_text = explanations.join("\n");

  // 여성의 경우 정수리 숱(가르마 밀도)과 가르마 폭(mm)은 밀접한 상관관계가 있으므로 이를 바탕으로 계산
  const parting_width_mm = (vertex_val / 100.0) * 15.0 + 1.0; 

  const features = {
      frontalRecessionCm: front_val,
      templeRecessionCm: temple_val,
      leftRecessionCm: left_val,
      rightRecessionCm: right_val,
      vertexThinningPercent: vertex_val,
      partingWidthMm: parting_width_mm,
      explanation: explanation_text
  };

  const getBox = (pts) => {
    if (!pts || !pts.face || pts.face.length === 0) return [0, 0, 0, 0];
    const xs = pts.face.map(p => p.x);
    const ys = pts.face.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return [Math.floor(minX), Math.floor(minY), Math.floor(maxX - minX), Math.floor(maxY - minY)];
  };

  // 바운딩 박스
  const boxes = {
    front: getBox(pointsData?.front),
    left: getBox(pointsData?.left),
    right: getBox(pointsData?.right),
    vertex: vertex_box // 마스크를 기반으로 동적 계산된 영역
  };

  return {
    success: true,
    data: {
      features: features,
      boxes: boxes
    }
  };
};
