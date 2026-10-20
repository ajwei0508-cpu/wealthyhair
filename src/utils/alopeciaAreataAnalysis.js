// src/utils/alopeciaAreataAnalysis.js
// 국제 표준 SALT (Severity of Alopecia Tool, Olsen et al. JAAD 2004) 척도 및
// Connected-Component(BFS) 원형/타원형 무모반(Glabrous Patch) 자동 검출·변연부 활성도 분석 엔진

const rgbToLab = (r, g, b) => {
  let rn = r / 255, gn = g / 255, bn = b / 255;
  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

  let x = (rn * 0.4124 + gn * 0.3576 + bn * 0.1805) / 0.95047;
  let y = (rn * 0.2126 + gn * 0.7152 + bn * 0.0722) / 1.00000;
  let z = (rn * 0.0193 + gn * 0.1192 + bn * 0.9505) / 1.08883;

  x = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + 16 / 116;
  y = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + 16 / 116;
  z = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + 16 / 116;

  return {
    L: (116 * y) - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  };
};

// SALT 4대 두피 구역 가중치 (Olsen et al., J Am Acad Dermatol 2004)
export const SALT_QUADRANTS = [
  { id: 'top', label: '상부 · 정수리 (Top / Vertex)', weight: 0.40, weightPct: 40, desc: '두피 전체 면적의 40% 차지' },
  { id: 'back', label: '후두부 · 뒷머리 (Back / Occipital)', weight: 0.24, weightPct: 24, desc: '두피 전체 면적의 24% 차지' },
  { id: 'left', label: '좌측두부 · 옆머리 (Left Temporal)', weight: 0.18, weightPct: 18, desc: '두피 전체 면적의 18% 차지' },
  { id: 'right', label: '우측두부 · 옆머리 (Right Temporal)', weight: 0.18, weightPct: 18, desc: '두피 전체 면적의 18% 차지' }
];

/**
 * 단일 두피 이미지에서 원형탈모반(Alopecia Areata Patch) Connected-Component 검출 및 오버레이 생성
 */
export const analyzeAlopeciaAreataImage = (imageSrc, quadrantId = 'top') => {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.width || 640;
      const h = img.height || 480;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      // 격자 해상도 (Connected-component BFS용)
      const gw = 160;
      const gh = 120;
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = gw;
      smallCanvas.height = gh;
      const sCtx = smallCanvas.getContext('2d');
      sCtx.drawImage(img, 0, 0, gw, gh);
      const sData = sCtx.getImageData(0, 0, gw, gh).data;

      // 1. 픽셀별 두피(무모 피부) vs 모발 분류 + 텍스처 분산(매끄러운 원형탈모반 특징) 계산
      const isScalpGrid = new Uint8Array(gw * gh);
      const isHairGrid = new Uint8Array(gw * gh);
      const erythemaGrid = new Float32Array(gw * gh);

      const marginX = Math.floor(gw * 0.12);
      const marginY = Math.floor(gh * 0.10);

      let totalRoiCells = 0;
      for (let y = marginY; y < gh - marginY; y++) {
        for (let x = marginX; x < gw - marginX; x++) {
          const i = y * gw + x;
          const idx = i * 4;
          const r = sData[idx], g = sData[idx + 1], b = sData[idx + 2];
          const { L, a, b: labB } = rgbToLab(r, g, b);
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);

          // 주변 3x3 텍스처 변화량 (원형탈모반 내부는 모발이 완전히 빠져 텍스처 변화량이 낮고 매끄러움)
          let localGrad = 0;
          if (x > 1 && x < gw - 2 && y > 1 && y < gh - 2) {
            const idxR = (y * gw + (x + 1)) * 4;
            const idxD = ((y + 1) * gw + x) * 4;
            localGrad = Math.abs(r - sData[idxR]) + Math.abs(g - sData[idxD + 1]);
          }

          const isGlare = L > 95 && chroma < 10;
          const isSkinTone = !isGlare && (
            (L > 46 && L < 93 && a > 1.5 && a < 30 && labB > 3 && labB < 38 && r >= g * 0.94) ||
            (L > 64 && L < 92 && localGrad < 28 && r >= b)
          );

          if (isSkinTone && localGrad < 42) {
            isScalpGrid[i] = 1;
            erythemaGrid[i] = Math.max(0, a);
          } else if (L < 48 || localGrad >= 32) {
            isHairGrid[i] = 1;
          }
          totalRoiCells++;
        }
      }

      // 2. BFS Connected-Component Labeling으로 독립된 원형/타원형 탈모반(Patch) 추출
      const visited = new Uint8Array(gw * gh);
      const rawPatches = [];

      const dirs = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [1, -1], [-1, 1], [1, 1]
      ];

      for (let y = marginY; y < gh - marginY; y++) {
        for (let x = marginX; x < gw - marginX; x++) {
          const startIdx = y * gw + x;
          if (isScalpGrid[startIdx] === 1 && visited[startIdx] === 0) {
            const queue = [startIdx];
            visited[startIdx] = 1;
            const cells = [];
            let minX = x, maxX = x, minY = y, maxY = y;
            let sumX = 0, sumY = 0, sumErythema = 0;
            let perimeterCells = 0;
            let borderingHairCells = 0;

            while (queue.length > 0) {
              const curr = queue.pop();
              const cy = Math.floor(curr / gw);
              const cx = curr % gw;
              cells.push([cx, cy]);
              sumX += cx;
              sumY += cy;
              sumErythema += erythemaGrid[curr];
              if (cx < minX) minX = cx;
              if (cx > maxX) maxX = cx;
              if (cy < minY) minY = cy;
              if (cy > maxY) maxY = cy;

              let isBorder = false;
              for (const [dx, dy] of dirs) {
                const nx = cx + dx;
                const ny = cy + dy;
                if (nx < marginX || nx >= gw - marginX || ny < marginY || ny >= gh - marginY) {
                  isBorder = true;
                  continue;
                }
                const nIdx = ny * gw + nx;
                if (isScalpGrid[nIdx] === 0) {
                  isBorder = true;
                  if (isHairGrid[nIdx] === 1) borderingHairCells++;
                } else if (visited[nIdx] === 0) {
                  visited[nIdx] = 1;
                  queue.push(nIdx);
                }
              }
              if (isBorder) perimeterCells++;
            }

            // 노이즈(미세 반점) 제거: 최소 면적 14셀 이상
            if (cells.length >= 14) {
              const areaCells = cells.length;
              const bw = Math.max(1, maxX - minX + 1);
              const bh = Math.max(1, maxY - minY + 1);
              const aspectRatio = Math.max(bw, bh) / Math.min(bw, bh);
              const circularity = Math.min(1.0, (4 * Math.PI * areaCells) / Math.pow(Math.max(perimeterCells, 4), 2));
              const hairBorderRatio = borderingHairCells / Math.max(1, perimeterCells);

              // 모발로 둘러싸여 있거나 뚜렷한 탈모반 형태인 컴포넌트 채택
              if (hairBorderRatio >= 0.18 || areaCells >= 40) {
                rawPatches.push({
                  areaCells,
                  cx: (sumX / areaCells) / gw,
                  cy: (sumY / areaCells) / gh,
                  minX: minX / gw,
                  maxX: maxX / gw,
                  minY: minY / gh,
                  maxY: maxY / gh,
                  rx: (bw / 2) / gw,
                  ry: (bh / 2) / gh,
                  aspectRatio: parseFloat(aspectRatio.toFixed(2)),
                  circularity: parseFloat(circularity.toFixed(2)),
                  meanErythema: parseFloat((sumErythema / areaCells).toFixed(1))
                });
              }
            }
          }
        }
      }

      // 면적 순 정렬 후 상위 6개 주요 탈모반 추출
      rawPatches.sort((a, b) => b.areaCells - a.areaCells);
      const patches = rawPatches.slice(0, 6).map((p, idx) => {
        // 구역 전체 면적(약 140 cm²) 기준 실제 면적(cm²) 및 등가 직경(cm) 산출
        const areaRatio = p.areaCells / Math.max(1, totalRoiCells);
        const areaCm2 = parseFloat(Math.max(0.4, areaRatio * 135).toFixed(1));
        const diameterCm = parseFloat((2 * Math.sqrt(areaCm2 / Math.PI)).toFixed(1));
        const isActiveBorder = p.meanErythema >= 11.5;

        return {
          id: idx + 1,
          ...p,
          areaRatioPercent: parseFloat((areaRatio * 100).toFixed(1)),
          areaCm2,
          diameterCm,
          shapeType: p.aspectRatio < 1.45 ? '원형 (Circular)' : p.aspectRatio < 2.2 ? '타원형 (Oval)' : '융합·띠형 (Confluent/Band)',
          borderActivity: isActiveBorder ? '활성기 의심 (변연부 홍반·감탄사모발 주의)' : '안정기 (경계 명확)'
        };
      });

      const totalLossPercent = Math.min(
        100,
        parseFloat(patches.reduce((acc, p) => acc + p.areaRatioPercent * 1.25, 0).toFixed(1))
      );

      // 3. 시각적 진단 리포트 이미지(annotatedImage) Canvas 렌더링
      ctx.save();
      patches.forEach((p) => {
        const px = p.cx * w;
        const py = p.cy * h;
        const prx = Math.max(18, p.rx * w * 1.08);
        const pry = Math.max(18, p.ry * h * 1.08);

        // 반투명 탈모반 하이라이트
        ctx.beginPath();
        ctx.ellipse(px, py, prx, pry, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.meanErythema >= 11.5 ? 'rgba(255, 82, 82, 0.22)' : 'rgba(212, 175, 55, 0.22)';
        ctx.fill();

        // 외곽 정밀 타겟 링
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = p.meanErythema >= 11.5 ? '#FF5252' : '#D4AF37';
        ctx.stroke();
        ctx.setLineDash([]);

        // 직경 측정 십자선
        ctx.beginPath();
        ctx.moveTo(px - prx, py);
        ctx.lineTo(px + prx, py);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 라벨 배지
        const label = `#${p.id} Ø${p.diameterCm}cm (${p.areaCm2}cm²)`;
        ctx.font = 'bold 13px Montserrat, Pretendard, sans-serif';
        const textWidth = ctx.measureText(label).width;
        const bx = Math.max(8, Math.min(w - textWidth - 20, px - textWidth / 2 - 6));
        const by = Math.max(24, py - pry - 10);

        ctx.fillStyle = 'rgba(10, 10, 10, 0.86)';
        ctx.fillRect(bx, by - 16, textWidth + 14, 22);
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by - 16, textWidth + 14, 22);

        ctx.fillStyle = '#D4AF37';
        ctx.fillText(label, bx + 7, by - 1);
      });
      ctx.restore();

      const annotatedImage = canvas.toDataURL('image/jpeg', 0.92);

      resolve({
        quadrantId,
        patches,
        patchCount: patches.length,
        quadrantLossPercent: totalLossPercent,
        annotatedImage
      });
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
};

/**
 * 구역별 분석 결과와 임상 설문을 종합하여 국제 SALT 점수(S0~S5) 및 임상 유형 판정
 */
export const calculateFinalAlopeciaAreataReport = (quadrantResults, clinicalChecklist = {}) => {
  // 1. 단일 사진만 등록된 경우 vs 다중 구역 등록된 경우 SALT 점수 산출
  const activeQuadrants = Object.values(quadrantResults).filter(Boolean);
  let allPatches = [];
  let weightedSaltScore = 0;

  if (activeQuadrants.length === 1) {
    const single = activeQuadrants[0];
    allPatches = single.patches || [];
    const qWeight = SALT_QUADRANTS.find(q => q.id === single.quadrantId)?.weight || 0.40;
    // 단일 구역 스캔 시 해당 구역 가중치 반영 및 국소 병변 비율 보정
    weightedSaltScore = parseFloat(Math.min(100, single.quadrantLossPercent * Math.max(0.45, qWeight * 1.35)).toFixed(1));
  } else {
    SALT_QUADRANTS.forEach(q => {
      const res = quadrantResults[q.id];
      if (res) {
        weightedSaltScore += res.quadrantLossPercent * q.weight;
        allPatches = allPatches.concat(res.patches.map(p => ({ ...p, quadrantLabel: q.label })));
      }
    });
    weightedSaltScore = parseFloat(Math.min(100, weightedSaltScore).toFixed(1));
  }

  const totalPatchCount = allPatches.length;
  const totalAreaCm2 = parseFloat(allPatches.reduce((sum, p) => sum + p.areaCm2, 0).toFixed(1));
  const maxDiameterCm = allPatches.length > 0 ? Math.max(...allPatches.map(p => p.diameterCm)) : 0;

  // 2. 국제 SALT 중증도 등급 (Olsen et al., JAAD 2004)
  let saltGrade = 'S0 (탈모반 없음 · 0%)';
  let severityLabel = '정상 (무증상)';
  let severityColor = '#4CAF50';

  if (weightedSaltScore === 0 && totalPatchCount === 0) {
    saltGrade = 'S0 (정상 · 탈모반 미검출)';
    severityLabel = '정상';
    severityColor = '#4CAF50';
  } else if (weightedSaltScore < 25) {
    saltGrade = 'S1 (경증 · 두피 면적 1~24% 소실)';
    severityLabel = '경증 원형탈모 (국소 치료 권장)';
    severityColor = '#D4AF37';
  } else if (weightedSaltScore < 50) {
    saltGrade = 'S2 (중등증 · 두피 면적 25~49% 소실)';
    severityLabel = '중등도 원형탈모 (적극적 면역·국소 병합치료)';
    severityColor = '#FFA726';
  } else if (weightedSaltScore < 75) {
    saltGrade = 'S3 (중증 · 두피 면적 50~74% 소실)';
    severityLabel = '중증 원형탈모 (표적 JAK 억제제 고려 대상)';
    severityColor = '#FF5252';
  } else if (weightedSaltScore < 99) {
    saltGrade = weightedSaltScore <= 95 ? 'S4a (고도 중증 · 75~95% 소실)' : 'S4b (아전두성 · 96~99% 소실)';
    severityLabel = '고도 중증 원형탈모 (전신 표적 면역치료 필수)';
    severityColor = '#FF1744';
  } else {
    saltGrade = 'S5 (전두탈모증 Alopecia Totalis · 100%)';
    severityLabel = '전두/전신탈모증';
    severityColor = '#FF1744';
  }

  // 3. 임상 형태학적 분류 (단발성 / 다발성 / 망상형 / 사행성)
  let clinicalPattern = '단발성 원형탈모 (Patchy Alopecia Areata - Single)';
  if (totalPatchCount === 0) {
    clinicalPattern = '뚜렷한 원형탈모반 관찰되지 않음';
  } else if (clinicalChecklist.ophiasisBand || (quadrantResults.back && quadrantResults.left)) {
    clinicalPattern = '사행성 원형탈모 의심 (Ophiasis — 측두·후두부 헤어라인 띠 형태)';
  } else if (totalPatchCount === 1) {
    clinicalPattern = `단발성 원형탈모 (Single Patch · 직경 약 ${maxDiameterCm}cm)`;
  } else if (totalPatchCount >= 2 && totalPatchCount <= 3) {
    clinicalPattern = `다발성 원형탈모 (Multiple Patchy · ${totalPatchCount}개 병변 검출)`;
  } else {
    clinicalPattern = `다발성·융합형(망상형) 원형탈모 (Reticular / Confluent · ${totalPatchCount}개 병변)`;
  }

  // 4. 예후 인자 및 맞춤 치료 권고안 (대한모발학회 원형탈모 진료 가이드라인 기반)
  const riskFactors = [];
  if (clinicalChecklist.nailPitting) riskFactors.push('손발톱 오목변형(Nail pitting/조갑이영양증) 동반 — 만성 경과 위험 인자');
  if (clinicalChecklist.atopyOrThyroid) riskFactors.push('아토피 피부염 또는 갑상선 자가면역 질환 병력 동반');
  if (clinicalChecklist.eyebrowLoss) riskFactors.push('눈썹·속눈썹 또는 체모 탈락 동반 (전신성 이행 주의)');
  if (clinicalChecklist.rapidPullTest) riskFactors.push('모발 견인검사(Hair Pull Test) 양성 — 급성 활성 진행기');

  const treatmentRecommendations = [];
  if (weightedSaltScore === 0 && totalPatchCount === 0) {
    treatmentRecommendations.push('현재 육안 및 AI 스캔상 경계가 명확한 원형탈모반이 관찰되지 않습니다. 급격한 스트레스나 수면 부족을 피하고 두피 보습과 항산화 식이를 유지하세요.');
  } else if (weightedSaltScore < 25) {
    treatmentRecommendations.push('1차 표준 치료: 피부과 전문의 진료를 통한 **병변 내 스테로이드 국소 주사(Intralesional Triamcinolone Acetonide 2.5~5mg/mL, 4~6주 간격)**가 가장 빠르고 효과적으로 모낭 주위 자가면역 T세포 염증을 억제합니다.');
    treatmentRecommendations.push('병합 외용 치료: 고역가 국소 스테로이드 로션/연고 도포와 **외용 미녹시딜 5% 폼**을 병용하면 신생모의 생장기 전환 속도를 앞당길 수 있습니다.');
  } else if (weightedSaltScore < 50) {
    treatmentRecommendations.push('중등도 다발성 치료: 광범위한 탈모반에 대한 병변 내 주사 + **국소 면역요법(DPCP 감작 치료)** 또는 단기 경구 면역조절제·엑시머 레이저(308nm Excimer Laser) 병합 치료가 권장됩니다.');
  } else {
    treatmentRecommendations.push('중증 원형탈모(SALT ≥ 50) 표적 치료: 식품의약품안전처 및 미국 FDA에서 중증 원형탈모 치료제로 정식 승인된 **경구 JAK 억제제(바리시티닙 올루미언트 2~4mg/일 또는 리틀레시티닙 리트풀로 50mg/일)** 투여 적응증에 해당합니다.');
    treatmentRecommendations.push('국소 면역요법(DPCP) 및 모낭 면역특권(Immune Privilege) 회복을 위한 전문 대학병원/모발클리닉 정밀 혈액검사(갑상선 호르몬 TSH/Free T4, 자가항체 ANA, 비타민 D, 페리틴, 아연)가 필수적입니다.');
  }

  return {
    saltScore: weightedSaltScore,
    saltGrade,
    severityLabel,
    severityColor,
    clinicalPattern,
    totalPatchCount,
    totalAreaCm2,
    maxDiameterCm,
    allPatches,
    riskFactors,
    treatmentRecommendations
  };
};

/**
 * 실제 두피 데이터셋 이미지 위에 의학적으로 정확한 원형탈모반(단발성 S1 / 다발성 S2 / 중증 융합형 S3)을 합성하여
 * 사용자가 즉시 원형탈모 AI 검출 정확도를 점검·체험할 수 있는 검증 샘플 생성기
 */
export const generateVerifiedAlopeciaSample = (presetType = 'single_s1') => {
  return new Promise((resolve) => {
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.onload = () => {
      const canvas = document.createElement('canvas');
      const w = 640;
      const h = 480;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(baseImg, 0, 0, w, h);

      const drawRealisticGlabrousPatch = (cx, cy, rx, ry, erythemaLevel = 0) => {
        ctx.save();
        const grad = ctx.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.15, cx, cy, Math.max(rx, ry));
        if (erythemaLevel > 0) {
          grad.addColorStop(0, 'rgba(232, 182, 168, 0.96)');
          grad.addColorStop(0.75, 'rgba(224, 165, 152, 0.92)');
          grad.addColorStop(1, 'rgba(185, 135, 120, 0.0)');
        } else {
          grad.addColorStop(0, 'rgba(228, 196, 174, 0.96)');
          grad.addColorStop(0.78, 'rgba(215, 182, 160, 0.90)');
          grad.addColorStop(1, 'rgba(170, 140, 120, 0.0)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      if (presetType === 'single_s1') {
        // 단발성 동전 크기 원형탈모 (직경 약 2.6cm)
        drawRealisticGlabrousPatch(w * 0.48, h * 0.44, 46, 42, 0);
      } else if (presetType === 'multiple_s2') {
        // 다발성 원형탈모 (3개 병변 + 변연부 홍반 활성기)
        drawRealisticGlabrousPatch(w * 0.38, h * 0.40, 54, 48, 1);
        drawRealisticGlabrousPatch(w * 0.62, h * 0.48, 42, 38, 1);
        drawRealisticGlabrousPatch(w * 0.46, h * 0.64, 34, 30, 0);
      } else if (presetType === 'severe_s3') {
        // 중증 광범위 융합형 원형탈모 (SALT S3급)
        drawRealisticGlabrousPatch(w * 0.45, h * 0.42, 115, 92, 1);
        drawRealisticGlabrousPatch(w * 0.63, h * 0.56, 78, 66, 1);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    baseImg.onerror = () => resolve(null);
    baseImg.src = '/guides/guide_vertex.jpg';
  });
};
