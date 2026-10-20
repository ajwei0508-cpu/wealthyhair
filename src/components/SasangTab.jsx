// src/components/SasangTab.jsx
// 하이엔드 3D 연예인급 미남·미녀 캐릭터 (남·여 구분) + 200-슬라이스 스무스 메쉬 디포메이션(상·중·하초 실시간 3D 체형 모핑) 및
// 사상체질별 핵심 발모 약선(藥膳) 가이드

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, ThumbsUp, ThumbsDown, RotateCcw, Compass, ChevronRight, ChevronLeft
} from 'lucide-react';
import {
  SASANG_QUESTIONS,
  SASANG_CONSTITUTION_DETAILS
} from '../data/sasangConstitutionData';

// ── 체질별 표준 3D 체형 비율 프리셋 ──
const BODY_PRESETS = {
  taeyang: { label: '태양인 체형', desc: '목덜미·상초 발달 (역삼각 상체)', chest: 84, waist: 45, pelvis: 40 },
  soyang: { label: '소양인 체형', desc: '어깨·흉곽 발달 · 골반 슬림', chest: 78, waist: 47, pelvis: 42 },
  taeeum: { label: '태음인 체형', desc: '허리·복부(중초) 중후 · 골격 탄탄', chest: 62, waist: 82, pelvis: 66 },
  soeum: { label: '소음인 체형', desc: '골반·하초 안정 · 상체 슬림', chest: 42, waist: 46, pelvis: 78 },
};

// ── 2D Flood-Fill 스튜디오 배경 투명화 & 몸통(Torso) 정밀 윤곽선 추출기 ──
function processCharacterImageToAlphaCanvas(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  // 1. 외곽에서 시작하는 2D Flood-Fill로 팔과 몸통 사이, 다리 사이의 검은 배경까지 완벽히 투명화
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const isBgPixel = (idx4) => {
    const r = d[idx4];
    const g = d[idx4 + 1];
    const b = d[idx4 + 2];
    return r < 18 && g < 18 && b < 22;
  };

  // 테두리 픽셀 큐 등록
  for (let x = 0; x < w; x++) {
    const topIdx = x;
    const botIdx = (h - 1) * w + x;
    if (isBgPixel(topIdx * 4)) {
      visited[topIdx] = 1;
      queue[tail++] = topIdx;
    }
    if (isBgPixel(botIdx * 4)) {
      visited[botIdx] = 1;
      queue[tail++] = botIdx;
    }
  }
  for (let y = 1; y < h - 1; y++) {
    const leftIdx = y * w;
    const rightIdx = y * w + (w - 1);
    if (isBgPixel(leftIdx * 4)) {
      visited[leftIdx] = 1;
      queue[tail++] = leftIdx;
    }
    if (isBgPixel(rightIdx * 4)) {
      visited[rightIdx] = 1;
      queue[tail++] = rightIdx;
    }
  }

  while (head < tail) {
    const curr = queue[head++];
    d[curr * 4 + 3] = 0;
    const cx = curr % w;
    const cy = (curr / w) | 0;

    if (cx > 0) {
      const n = curr - 1;
      if (!visited[n] && isBgPixel(n * 4)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (cx < w - 1) {
      const n = curr + 1;
      if (!visited[n] && isBgPixel(n * 4)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (cy > 0) {
      const n = curr - w;
      if (!visited[n] && isBgPixel(n * 4)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (cy < h - 1) {
      const n = curr + w;
      if (!visited[n] && isBgPixel(n * 4)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
  }

  // 2. 실루엣 경계선 안티앨리어싱 소프트 페더링 (1~2px 부드러운 알파 전환)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (!visited[p]) {
        const bgNeighbors =
          visited[p - 1] + visited[p + 1] + visited[p - w] + visited[p + w];
        if (bgNeighbors > 0) {
          const idx4 = p * 4;
          const lum = (d[idx4] + d[idx4 + 1] + d[idx4 + 2]) / 3;
          d[idx4 + 3] = Math.min(255, Math.max(90, Math.round(lum * 5.2)));
        }
      }
    }
  }

  // 3. 캐릭터 상·하단 바운딩박스 및 중앙에서 뻗어나가는 몸통(Torso) 좌·우 경계선 측정
  let minY = h;
  let maxY = 0;
  const torsoLeft = new Float32Array(h);
  const torsoRight = new Float32Array(h);
  const midX = (w * 0.5) | 0;

  for (let y = 0; y < h; y++) {
    let rowHasPixel = false;
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 40) {
        rowHasPixel = true;
        break;
      }
    }
    if (rowHasPixel) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    // 중심선(midX)에서 좌·우로 스캔하여 팔과 분리된 몸통(Torso)의 실제 외곽 좌표 추출
    let lx = midX;
    while (lx > w * 0.18 && d[(y * w + lx) * 4 + 3] > 30) lx--;
    let rx = midX;
    while (rx < w * 0.82 && d[(y * w + rx) * 4 + 3] > 30) rx++;

    if (rx - lx > w * 0.08) {
      torsoLeft[y] = lx / w;
      torsoRight[y] = rx / w;
    } else {
      torsoLeft[y] = 0.36;
      torsoRight[y] = 0.64;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return {
    canvas: off,
    width: w,
    height: h,
    minY: minY < maxY ? minY : 0,
    maxY: maxY > minY ? maxY : h,
    torsoLeft,
    torsoRight,
  };
}

// ============================================================================
// High-End 3D Celebrity Character Simulator (200-Slice Mesh Deformation + 3D Motion)
// ============================================================================
const Sasang3DBodyModel = ({
  gender,
  onChangeGender,
  chestWidth,
  waistWidth,
  pelvisWidth,
  onSelectPreset,
}) => {
  const canvasRef = useRef(null);
  const processedModelsRef = useRef({ male: null, female: null });
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [targetYaw, setTargetYaw] = useState(0.28);
  const yawRef = useRef(0.28);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const animSmoothRef = useRef({
    chest: chestWidth,
    waist: waistWidth,
    pelvis: pelvisWidth,
  });

  // 3D 남·여 연예인급 모델 이미지 프리로드 및 알파 실루엣 처리
  useEffect(() => {
    let mounted = true;
    const loadModel = (key, src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (mounted) {
            processedModelsRef.current[key] = processCharacterImageToAlphaCanvas(img);
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = src;
      });

    Promise.all([
      loadModel('male', '/assets/sasang/male_3d_model.png'),
      loadModel('female', '/assets/sasang/female_3d_model.png'),
    ]).then(() => {
      if (mounted) setModelsLoaded(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  // 상·하초 체형 경사각 계산
  const taperAngleDeg = ((chestWidth - pelvisWidth) * 0.38).toFixed(1);
  const bodyShapeLabel =
    chestWidth >= waistWidth + 10 && chestWidth >= pelvisWidth + 10
      ? '상초 발달 역삼각 체형 (소양·태양형)'
      : waistWidth >= chestWidth + 8
      ? '중초 발달 중후 체형 (태음형)'
      : pelvisWidth >= chestWidth + 8
      ? '하초 발달 안정 체형 (소음형)'
      : '상·중·하초 균형 체형';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId;
    let startTime = performance.now();

    // 코사인 벨 커브 가중치 함수 (경계면 끊김 없이 매끄럽게 체형 모핑)
    const smoothBell = (v, center, halfWidth) => {
      const dist = Math.abs(v - center);
      if (dist >= halfWidth) return 0;
      return 0.5 * (1 + Math.cos((dist / halfWidth) * Math.PI));
    };

    const render = (now) => {
      const dt = (now - startTime) * 0.001;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayW = canvas.clientWidth || 340;
      const displayH = canvas.clientHeight || 390;
      if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
      }

      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const W = displayW;
      const H = displayH;
      const cx = W * 0.5;
      const cy = H * 0.52;

      // 상·중·하초 슬라이더 값 부드러운 보간
      animSmoothRef.current.chest += (chestWidth - animSmoothRef.current.chest) * 0.14;
      animSmoothRef.current.waist += (waistWidth - animSmoothRef.current.waist) * 0.14;
      animSmoothRef.current.pelvis += (pelvisWidth - animSmoothRef.current.pelvis) * 0.14;

      const cVal = animSmoothRef.current.chest; // 25 ~ 90 (기준 58)
      const wVal = animSmoothRef.current.waist; // 25 ~ 90 (기준 52)
      const pVal = animSmoothRef.current.pelvis; // 25 ~ 90 (기준 54)

      // 기준 대비 가로 확장/수축 배율 (매끄럽고 자연스러운 3D 체형 변환)
      const chestFactor = 1 + (cVal - 58) * 0.0068;
      const waistFactor = 1 + (wVal - 52) * 0.0076;
      const pelvisFactor = 1 + (pVal - 54) * 0.0072;

      // 3D 회전 각도 업데이트
      if (autoRotate && !isDraggingRef.current) {
        yawRef.current = Math.sin(dt * 1.05) * 0.42; // 부드러운 좌우 3D 입체 턴테이블 스윙
      } else if (!isDraggingRef.current) {
        yawRef.current += (targetYaw - yawRef.current) * 0.14;
      }

      const yaw = yawRef.current;
      const pitch = 0.12;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      // 호흡 모션 (숨쉬듯 자연스럽게 흉곽이 오르내림)
      const breath = Math.sin(dt * 2.4) * 0.010;
      const floatY = Math.sin(dt * 2.4) * 2.0;

      const scale3D = Math.min(W, H) * 0.44;
      const projectRing3D = (x, y, z) => {
        const rx = x * cosY + z * sinY;
        const rz = -x * sinY + z * cosY;
        const ry = y * cosP - rz * sinP;
        const fz = y * sinP + rz * cosP;
        const fov = 3.2 / (3.2 - fz * 0.48);
        return {
          px: cx + rx * scale3D * fov,
          py: cy + ry * scale3D * fov + floatY,
          z: fz,
        };
      };

      // ── 1. 하이엔드 스튜디오 배경 & 볼류메트릭 조명 후광 ──
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createRadialGradient(cx, cy - 30, 10, cx, cy, W * 0.72);
      bgGrad.addColorStop(0, gender === 'female' ? '#2a1e30' : '#1b2335');
      bgGrad.addColorStop(0.55, '#0e1017');
      bgGrad.addColorStop(1, '#060609');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 캐릭터 후면 림라이트 오라(Aura)
      const auraX = cx + Math.sin(yaw) * 14;
      const auraGrad = ctx.createRadialGradient(auraX, cy - 28, 12, auraX, cy - 28, scale3D * 0.96);
      auraGrad.addColorStop(0, 'rgba(212, 175, 55, 0.24)');
      auraGrad.addColorStop(0.48, gender === 'female' ? 'rgba(244, 143, 177, 0.11)' : 'rgba(100, 181, 246, 0.11)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(auraX, cy - 28, scale3D * 0.96, 0, Math.PI * 2);
      ctx.fill();

      // ── 2. 3D 홀로그램 바닥 포디움(Pedestal) ──
      [0.52, 0.37].forEach((rad, rIdx) => {
        ctx.beginPath();
        for (let i = 0; i <= 50; i++) {
          const ang = (i / 50) * Math.PI * 2 + dt * (rIdx === 0 ? 0.35 : -0.25);
          const pt = projectRing3D(Math.cos(ang) * rad, 0.91, Math.sin(ang) * rad);
          if (i === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        if (rIdx === 0) {
          ctx.fillStyle = 'rgba(212, 175, 55, 0.06)';
          ctx.fill();
        }
        ctx.strokeStyle = rIdx === 0 ? 'rgba(212, 175, 55, 0.48)' : 'rgba(100, 181, 246, 0.26)';
        ctx.lineWidth = rIdx === 0 ? 1.8 : 1.1;
        ctx.stroke();
      });

      // ── 3. 상·중·하초 3D 입체 링 정의 & 후면(z < 0) 렌더링 ──
      const ringZones = [
        { y: -0.34, rx: 0.23 * chestFactor, rz: 0.15 * chestFactor, col: '#00E676', label: '상초' },
        { y: -0.11, rx: 0.19 * waistFactor, rz: 0.13 * waistFactor, col: '#FFB74D', label: '중초' },
        { y: 0.09, rx: 0.22 * pelvisFactor, rz: 0.15 * pelvisFactor, col: '#4FC3F7', label: '하초' },
      ];

      const drawZoneRingsHalf = (frontHalf) => {
        ringZones.forEach((zr) => {
          ctx.beginPath();
          let started = false;
          for (let i = 0; i <= 64; i++) {
            const ang = (i / 64) * Math.PI * 2;
            const pt = projectRing3D(Math.cos(ang) * zr.rx, zr.y, Math.sin(ang) * zr.rz);
            const isFront = pt.z >= 0;
            if (isFront === frontHalf) {
              if (!started) {
                ctx.moveTo(pt.px, pt.py);
                started = true;
              } else {
                ctx.lineTo(pt.px, pt.py);
              }
            } else {
              started = false;
            }
          }
          ctx.strokeStyle = zr.col;
          ctx.globalAlpha = frontHalf ? 0.88 : 0.28;
          ctx.lineWidth = frontHalf ? 2.2 : 1.1;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        });
      };

      // 캐릭터 뒤쪽 링 먼저 그리기
      drawZoneRingsHalf(false);

      // ── 4. 하이엔드 3D 미남·미녀 캐릭터 200-슬라이스 초정밀 스무스 메쉬 디포메이션 렌더링 ──
      const modelData = processedModelsRef.current[gender] || processedModelsRef.current.male;

      let shoulderLeftPx = cx - 48;
      let shoulderRightPx = cx + 48;
      let shoulderPy = cy - 75;
      let pelvisLeftPx = cx - 42;
      let pelvisRightPx = cx + 42;
      let pelvisPy = cy + 16;

      if (modelData && modelData.canvas) {
        const srcCanvas = modelData.canvas;
        const srcW = modelData.width;
        const srcH = modelData.height;
        const minY = modelData.minY;
        const maxY = modelData.maxY;
        const charSrcH = Math.max(100, maxY - minY);

        // 화면에 표시할 캐릭터 높이 및 기본 너비
        const targetCharH = H * 0.88;
        const baseScale = targetCharH / charSrcH;
        const targetBaseW = srcW * baseScale;
        const topDestY = (H - targetCharH) * 0.48 + floatY;

        // 3D 회전 시 입체 원근감(Perspective Foreshortening & Parallax Shift)
        const perspectiveSquash = 1 - Math.pow(Math.sin(yaw), 2) * 0.11;
        const numSlices = 200;
        const sliceSrcH = charSrcH / numSlices;
        const sliceDestH = targetCharH / numSlices;

        for (let s = 0; s < numSlices; s++) {
          const v = s / numSlices; // 0.0 (머리 끝) ~ 1.0 (발 끝)
          const sy = minY + s * sliceSrcH;

          // 해부학적 구간별 코사인 스무스 모핑 가중치 (실제 3D 모델의 어깨·허리·골반 높이에 정밀 매칭)
          // 0.00 ~ 0.16: 얼굴·헤어 (왜곡 없이 연예인 이목구비 100% 보존!)
          // 0.17 ~ 0.37: 상초 (어깨·쇄골·흉곽, 중심 v=0.26)
          // 0.33 ~ 0.49: 중초 (허리·복부, 중심 v=0.40)
          // 0.45 ~ 0.68: 하초 (골반·힙·허벅지, 중심 v=0.53)
          const wUpper = smoothBell(v, 0.26, 0.11);
          const wMiddle = smoothBell(v, 0.40, 0.10);
          const wLower = smoothBell(v, 0.53, 0.13);

          let localStretch =
            1 +
            wUpper * (chestFactor - 1 + breath) +
            wMiddle * (waistFactor - 1) +
            wLower * (pelvisFactor - 1);

          // 얼굴·머리 영역은 원본 비율 100% 고정
          if (v < 0.16) {
            localStretch = 1.0;
          }

          // 3D 입체 회전 패럴랙스 (전면 돌출 부위가 회전 방향으로 부드럽게 입체 이동)
          const depthZ =
            v < 0.16
              ? 0.09 // 얼굴
              : v < 0.35
              ? 0.13 * chestFactor // 가슴(상초)
              : v < 0.48
              ? 0.11 * waistFactor // 복부(중초)
              : v < 0.65
              ? 0.12 * pelvisFactor // 골반(하초)
              : 0.06; // 다리

          const parallaxShiftX = Math.sin(yaw) * depthZ * 82;
          const destW = targetBaseW * localStretch * perspectiveSquash;
          const destX = cx - destW * 0.5 + parallaxShiftX;
          const destY = topDestY + s * sliceDestH;

          // 서브픽셀 틈새 방지를 위해 1.1px 오버랩 렌더링
          ctx.drawImage(
            srcCanvas,
            0,
            sy,
            srcW,
            sliceSrcH + 1.4,
            destX,
            destY,
            destW,
            sliceDestH + 1.1
          );

          // 몸통 어깨(상초 v≈0.25) 및 골반(하초 v≈0.52) 실제 윤곽 좌표 기록
          const rowIdx = Math.min(srcH - 1, Math.round(sy));
          const tLeft = modelData.torsoLeft[rowIdx] || 0.38;
          const tRight = modelData.torsoRight[rowIdx] || 0.62;

          if (Math.abs(v - 0.25) < 0.004) {
            shoulderLeftPx = destX + tLeft * destW;
            shoulderRightPx = destX + tRight * destW;
            shoulderPy = destY;
          }
          if (Math.abs(v - 0.52) < 0.004) {
            pelvisLeftPx = destX + tLeft * destW;
            pelvisRightPx = destX + tRight * destW;
            pelvisPy = destY;
          }
        }
      }

      // ── 5. 상·중·하초 3D 입체 링 전면(z >= 0) 렌더링 ──
      drawZoneRingsHalf(true);

      // ── 6. 상·하초 체형 경사각(Angle Vector) 가이드 라인 & 측정 수치 HUD ──
      ctx.save();
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(shoulderLeftPx - 2, shoulderPy);
      ctx.lineTo(pelvisLeftPx - 2, pelvisPy);
      ctx.moveTo(shoulderRightPx + 2, shoulderPy);
      ctx.lineTo(pelvisRightPx + 2, pelvisPy);
      ctx.stroke();
      ctx.setLineDash([]);

      [
        [shoulderLeftPx - 2, shoulderPy, '#00E676'],
        [shoulderRightPx + 2, shoulderPy, '#00E676'],
        [pelvisLeftPx - 2, pelvisPy, '#4FC3F7'],
        [pelvisRightPx + 2, pelvisPy, '#4FC3F7'],
      ].forEach(([px, py, col]) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // 좌측 상단 체형 각도 HUD
      ctx.fillStyle = 'rgba(10, 12, 18, 0.86)';
      ctx.fillRect(10, 10, 152, 44);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.strokeRect(10, 10, 152, 44);
      ctx.font = 'bold 10px Montserrat, Pretendard, sans-serif';
      ctx.fillStyle = '#D4AF37';
      ctx.fillText(gender === 'female' ? '3D FEMALE CELEBRITY' : '3D MALE CELEBRITY', 18, 25);
      ctx.font = 'bold 12px Pretendard, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(`체형 경사각: ${taperAngleDeg > 0 ? `+${taperAngleDeg}°` : `${taperAngleDeg}°`}`, 18, 44);

      // 우측 상·중·하초 수치 콜아웃
      const badges = [
        { label: `상초 ${chestWidth}%`, col: '#00E676', y: -0.34 },
        { label: `중초 ${waistWidth}%`, col: '#FFB74D', y: -0.11 },
        { label: `하초 ${pelvisWidth}%`, col: '#4FC3F7', y: 0.09 },
      ];
      badges.forEach((b) => {
        const anchor = projectRing3D(0.20, b.y, 0.08);
        const bx = W - 78;
        const by = anchor.py;
        ctx.strokeStyle = b.col;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(anchor.px, anchor.py);
        ctx.lineTo(bx - 4, by);
        ctx.stroke();

        ctx.fillStyle = 'rgba(10, 12, 18, 0.9)';
        ctx.fillRect(bx, by - 10, 68, 20);
        ctx.strokeRect(bx, by - 10, 68, 20);
        ctx.fillStyle = b.col;
        ctx.font = 'bold 11px Pretendard, sans-serif';
        ctx.fillText(b.label, bx + 7, by + 4);
      });

      ctx.restore();
      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [gender, modelsLoaded, chestWidth, waistWidth, pelvisWidth, autoRotate, targetYaw, taperAngleDeg]);

  const handlePointerDown = (clientX) => {
    isDraggingRef.current = true;
    setAutoRotate(false);
    lastXRef.current = clientX;
  };

  const handlePointerMove = (clientX) => {
    if (!isDraggingRef.current) return;
    const delta = (clientX - lastXRef.current) * 0.012;
    yawRef.current = Math.max(-0.85, Math.min(0.85, yawRef.current + delta));
    setTargetYaw(yawRef.current);
    lastXRef.current = clientX;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div style={{ marginBottom: '14px' }}>
      {/* 남·여 하이엔드 3D 비주얼 모델 선택 스위치 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        <button
          type="button"
          onClick={() => onChangeGender('male')}
          style={{
            padding: '10px',
            borderRadius: '10px',
            border: gender === 'male' ? '1.5px solid #D4AF37' : '1px solid #2b2b2b',
            background: gender === 'male' ? 'linear-gradient(135deg, rgba(212,175,55,0.24), rgba(30,36,52,0.9))' : '#14141a',
            color: gender === 'male' ? '#D4AF37' : '#999',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          👨 남성 3D 모델 (미남형)
        </button>
        <button
          type="button"
          onClick={() => onChangeGender('female')}
          style={{
            padding: '10px',
            borderRadius: '10px',
            border: gender === 'female' ? '1.5px solid #D4AF37' : '1px solid #2b2b2b',
            background: gender === 'female' ? 'linear-gradient(135deg, rgba(212,175,55,0.24), rgba(52,30,45,0.9))' : '#14141a',
            color: gender === 'female' ? '#D4AF37' : '#999',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          👩 여성 3D 모델 (미녀형)
        </button>
      </div>

      {/* 3D 캐릭터 뷰포트 캔버스 */}
      <div
        style={{
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1.5px solid rgba(212, 175, 55, 0.45)',
          background: '#08080c',
          boxShadow: '0 12px 32px rgba(0,0,0,0.65)',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '385px', display: 'block', cursor: 'grab', touchAction: 'pan-y' }}
          onMouseDown={(e) => handlePointerDown(e.clientX)}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
          onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
          onTouchEnd={handlePointerUp}
        />

        {/* 하단 3D 카메라 앵글 컨트롤 바 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 10px',
            background: 'rgba(14, 14, 18, 0.95)',
            borderTop: '1px solid rgba(212, 175, 55, 0.22)',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', gap: '5px' }}>
            {[
              { label: '좌측 입체', yaw: -0.42 },
              { label: '정면 0°', yaw: 0 },
              { label: '우측 입체', yaw: 0.42 },
            ].map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setAutoRotate(false);
                  setTargetYaw(v.yaw);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: !autoRotate && Math.abs(targetYaw - v.yaw) < 0.15 ? '1px solid #D4AF37' : '1px solid #333',
                  background: !autoRotate && Math.abs(targetYaw - v.yaw) < 0.15 ? 'rgba(212,175,55,0.2)' : '#18181e',
                  color: '#eee',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              border: autoRotate ? '1px solid #00E676' : '1px solid #555',
              background: autoRotate ? 'rgba(0, 230, 118, 0.16)' : '#18181e',
              color: autoRotate ? '#00E676' : '#aaa',
              fontSize: '0.68rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {autoRotate ? '● 3D 입체모션 ON' : '○ 3D 입체모션 OFF'}
          </button>
        </div>
      </div>

      {/* 현재 3D 체형 각도 분석 요약 바 */}
      <div
        style={{
          marginTop: '8px',
          padding: '8px 12px',
          borderRadius: '10px',
          background: 'rgba(212, 175, 55, 0.09)',
          border: '1px solid rgba(212, 175, 55, 0.28)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
        }}
      >
        <span style={{ color: '#ddd', fontWeight: 700 }}>{bodyShapeLabel}</span>
        <span style={{ color: '#D4AF37', fontWeight: 800 }}>슬라이더 조절 시 실시간 체형 변환</span>
      </div>

      {/* 4체질 3D 체형 원클릭 프리셋 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '8px' }}>
        {Object.entries(BODY_PRESETS).map(([key, p]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelectPreset(key, p)}
            style={{
              padding: '7px 4px',
              borderRadius: '8px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              background: 'rgba(255,255,255,0.03)',
              color: '#eee',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#D4AF37' }}>{p.label}</div>
            <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '2px' }}>3D 체형변환</div>
          </button>
        ))}
      </div>
    </div>
  );
};

const SasangTab = () => {
  const [subMode, setSubMode] = useState('test'); // 'test' | 'food_guide'
  const [gender, setGender] = useState('male'); // 'male' | 'female'
  const [chestWidth, setChestWidth] = useState(72);
  const [waistWidth, setWaistWidth] = useState(48);
  const [pelvisWidth, setPelvisWidth] = useState(46);

  // 간결한 스텝형 설문 상태
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [resultType, setResultType] = useState(() => {
    return localStorage.getItem('wealthyhair_sasang_result') || null;
  });
  const [scoresMap, setScoresMap] = useState(null);
  const [selectedViewType, setSelectedViewType] = useState(resultType || 'taeeum');

  const handleSelectPreset = (key, preset) => {
    setChestWidth(preset.chest);
    setWaistWidth(preset.waist);
    setPelvisWidth(preset.pelvis);
  };

  const handleSelectOption = (qId, optionIdx) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
    if (currentQIdx < SASANG_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQIdx((idx) => Math.min(SASANG_QUESTIONS.length - 1, idx + 1)), 160);
    }
  };

  const evaluateConstitution = () => {
    const totals = { taeyang: 1, soyang: 1, taeeum: 1, soeum: 1 };

    SASANG_QUESTIONS.forEach((q) => {
      const idx = answers[q.id];
      const opt = q.options[idx];
      if (opt) totals[opt.type] += opt.weight;
    });

    if (chestWidth >= 75 && pelvisWidth <= 44) {
      totals.taeyang += 4.2;
      totals.soyang += 2.5;
    } else if (chestWidth >= waistWidth + 8 && chestWidth >= pelvisWidth + 8) {
      totals.soyang += 4.5;
    } else if (waistWidth >= chestWidth + 5 && waistWidth >= pelvisWidth + 4) {
      totals.taeeum += 4.8;
    } else if (pelvisWidth >= chestWidth + 5) {
      totals.soeum += 4.8;
    } else {
      totals.taeeum += 2.0;
    }

    const sumAll = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    const percentages = {
      taeyang: Math.round((totals.taeyang / sumAll) * 100),
      soyang: Math.round((totals.soyang / sumAll) * 100),
      taeeum: Math.round((totals.taeeum / sumAll) * 100),
      soeum: Math.round((totals.soeum / sumAll) * 100),
    };

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const winner = sorted[0][0];

    setScoresMap(percentages);
    setResultType(winner);
    setSelectedViewType(winner);
    localStorage.setItem('wealthyhair_sasang_result', winner);
    setSubMode('food_guide');
  };

  const activeDetail = SASANG_CONSTITUTION_DETAILS[selectedViewType] || SASANG_CONSTITUTION_DETAILS.taeeum;
  const activeQuestion = SASANG_QUESTIONS[currentQIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="fade-in" style={{ paddingBottom: '90px', color: '#fff', background: '#000' }}>
      <div className="tab-banner">
        <img
          src="/assets/banners/banner_sasang.jpg"
          alt="사상체질 3D 체형 진단"
          className="tab-banner-img"
          onError={(e) => { e.currentTarget.src = '/assets/banners/banner_guide.jpg'; }}
        />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">사상체질 3D 체형 & 발모 약선</h1>
          <p className="tab-banner-sub">남·여 3D 비주얼 캐릭터 상·중·하초 체형 각도 및 체질별 맞춤 식이</p>
        </div>
      </div>

      <div style={{ padding: '14px' }}>
        {/* 모드 전환 탭 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <button
            type="button"
            onClick={() => setSubMode('test')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: subMode === 'test' ? '1.5px solid #D4AF37' : '1px solid #2a2a2a',
              background: subMode === 'test' ? 'rgba(212, 175, 55, 0.18)' : '#121216',
              color: subMode === 'test' ? '#D4AF37' : '#999',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            🧍 3D 남·여 체형 · 체질 진단
          </button>
          <button
            type="button"
            onClick={() => setSubMode('food_guide')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: subMode === 'food_guide' ? '1.5px solid #D4AF37' : '1px solid #2a2a2a',
              background: subMode === 'food_guide' ? 'rgba(212, 175, 55, 0.18)' : '#121216',
              color: subMode === 'food_guide' ? '#D4AF37' : '#999',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            🍲 체질별 발모 음식 백과
          </button>
        </div>

        {subMode === 'test' ? (
          <div>
            <div
              style={{
                background: '#111115',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#D4AF37' }}>
                  STEP 1 · 3D 비주얼 캐릭터 체형 각도 시뮬레이터
                </span>
                <span style={{ fontSize: '0.68rem', color: '#999' }}>삼초(상·중·하) 비율 조절</span>
              </div>

              <Sasang3DBodyModel
                gender={gender}
                onChangeGender={setGender}
                chestWidth={chestWidth}
                waistWidth={waistWidth}
                pelvisWidth={pelvisWidth}
                onSelectPreset={handleSelectPreset}
              />

              {/* 상초·중초·하초 비율 조절 슬라이더 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', marginBottom: '2px' }}>
                    <span style={{ color: '#00E676', fontWeight: 700 }}>상초 (어깨·가슴·목덜미 발달도)</span>
                    <span style={{ fontWeight: 700 }}>{chestWidth}%</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="90"
                    value={chestWidth}
                    onChange={(e) => setChestWidth(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#00E676' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', marginBottom: '2px' }}>
                    <span style={{ color: '#FFB74D', fontWeight: 700 }}>중초 (허리·복부 두께 발달도)</span>
                    <span style={{ fontWeight: 700 }}>{waistWidth}%</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="90"
                    value={waistWidth}
                    onChange={(e) => setWaistWidth(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#FFB74D' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', marginBottom: '2px' }}>
                    <span style={{ color: '#4FC3F7', fontWeight: 700 }}>하초 (골반·엉덩이·하체 발달도)</span>
                    <span style={{ fontWeight: 700 }}>{pelvisWidth}%</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="90"
                    value={pelvisWidth}
                    onChange={(e) => setPelvisWidth(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#4FC3F7' }}
                  />
                </div>
              </div>
            </div>

            {/* 2. 간결한 1문항 스텝형 체질 설문 카드 */}
            <div
              style={{
                background: '#121216',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#D4AF37' }}>
                  STEP 2 · 핵심 체질 문진 ({currentQIdx + 1} / {SASANG_QUESTIONS.length})
                </span>
                <span style={{ fontSize: '0.7rem', color: '#81C784', fontWeight: 700 }}>
                  응답 {answeredCount}개 완료
                </span>
              </div>

              <div style={{ height: '5px', background: '#222', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                <div
                  style={{
                    width: `${((currentQIdx + 1) / SASANG_QUESTIONS.length) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #D4AF37, #00E676)',
                  }}
                />
              </div>

              <div style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 700, marginBottom: '4px' }}>
                [{activeQuestion.category}]
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff', marginBottom: '12px', lineHeight: 1.45 }}>
                {activeQuestion.question}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '12px' }}>
                {activeQuestion.options.map((opt, oIdx) => {
                  const isSelected = answers[activeQuestion.id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(activeQuestion.id, oIdx)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '9px',
                        border: isSelected ? '1.5px solid #D4AF37' : '1px solid #2b2b2b',
                        background: isSelected ? 'rgba(212, 175, 55, 0.16)' : '#18181f',
                        color: isSelected ? '#fff' : '#ccc',
                        fontSize: '0.76rem',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        lineHeight: 1.4,
                      }}
                    >
                      {isSelected ? '✓ ' : ''}{opt.text}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <button
                  type="button"
                  disabled={currentQIdx === 0}
                  onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#1a1a1f',
                    color: currentQIdx === 0 ? '#555' : '#ccc',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: currentQIdx === 0 ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ChevronLeft size={14} /> 이전 문항
                </button>
                <button
                  type="button"
                  disabled={currentQIdx === SASANG_QUESTIONS.length - 1}
                  onClick={() => setCurrentQIdx((i) => Math.min(SASANG_QUESTIONS.length - 1, i + 1))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#1a1a1f',
                    color: currentQIdx === SASANG_QUESTIONS.length - 1 ? '#555' : '#ccc',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: currentQIdx === SASANG_QUESTIONS.length - 1 ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  다음 문항 <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={evaluateConstitution}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Compass size={18} />
              3D 체형 + 설문 종합 사상체질 결과 보기
            </button>
          </div>
        ) : (
          <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
              {Object.values(SASANG_CONSTITUTION_DETAILS).map((c) => {
                const isSelected = selectedViewType === c.id;
                const isMyResult = resultType === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedViewType(c.id)}
                    style={{
                      padding: '9px 4px',
                      borderRadius: '8px',
                      border: isSelected ? `1.5px solid ${c.color}` : '1px solid #2a2a2a',
                      background: isSelected ? '#1a1915' : '#121216',
                      color: isSelected ? c.color : '#aaa',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {isMyResult && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '4px',
                          background: '#D4AF37',
                          color: '#000',
                          fontSize: '0.56rem',
                          padding: '1px 5px',
                          borderRadius: '6px',
                          fontWeight: 900,
                        }}
                      >
                        내 체질
                      </span>
                    )}
                    {c.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                background: 'linear-gradient(145deg, #191815, #111114)',
                border: `1.5px solid ${activeDetail.color}`,
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: 'rgba(212, 175, 55, 0.16)',
                    color: activeDetail.color,
                    fontWeight: 800,
                  }}
                >
                  {activeDetail.organBalance}
                </span>
                {scoresMap && (
                  <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 700 }}>
                    일치도 {scoresMap[selectedViewType]}%
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
                {activeDetail.name} 맞춤 발모 솔루션
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#ccc', margin: '0 0 10px', lineHeight: 1.5 }}>
                {activeDetail.hairLossPattern}
              </p>

              <div
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '8px',
                  padding: '9px 11px',
                  fontSize: '0.73rem',
                  color: '#bbb',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <strong style={{ color: '#D4AF37' }}>핵심 체형 특징:</strong> {activeDetail.bodyShape}
              </div>
            </div>

            <div
              style={{
                background: '#121614',
                border: '1px solid rgba(129, 199, 132, 0.35)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <ThumbsUp size={15} color="#81C784" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#81C784' }}>
                  모낭을 살리는 유익한 발모 음식 (Recommended)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {activeDetail.beneficialFoods.map((grp, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(129, 199, 132, 0.16)',
                      borderRadius: '8px',
                      padding: '9px',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#A5D6A7', marginBottom: '4px' }}>
                      • {grp.category}
                    </div>
                    <div style={{ fontSize: '0.71rem', color: '#eee', fontWeight: 600, lineHeight: 1.4, marginBottom: '4px' }}>
                      {grp.items.slice(0, 4).join(', ')}
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#999', lineHeight: 1.35 }}>
                      {grp.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: '#171212',
                border: '1px solid rgba(229, 115, 115, 0.35)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <ThumbsDown size={15} color="#E57373" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#E57373' }}>
                  탈모를 악화시키는 주의 음식 (Avoid)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {activeDetail.harmfulFoods.map((grp, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(229, 115, 115, 0.16)',
                      borderRadius: '8px',
                      padding: '9px',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#EF9A9A', marginBottom: '4px' }}>
                      • {grp.category}
                    </div>
                    <div style={{ fontSize: '0.71rem', color: '#eee', fontWeight: 600, lineHeight: 1.4, marginBottom: '4px' }}>
                      {grp.items.slice(0, 4).join(', ')}
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#999', lineHeight: 1.35 }}>
                      {grp.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: '#141418',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '12px',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D4AF37', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={14} /> 맞춤 한방 차(茶) & 두피 관리 팁
              </div>
              <div style={{ fontSize: '0.74rem', color: '#ddd', marginBottom: '6px', lineHeight: 1.45 }}>
                🍵 <strong>추천 약차:</strong> {activeDetail.teaPrescription}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#aaa', lineHeight: 1.45 }}>
                💆 <strong>생활 습관:</strong> {activeDetail.scalpCareRules[0]}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSubMode('test')}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1c1c22',
                color: '#D4AF37',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <RotateCcw size={14} /> 3D 남·여 체형 시뮬레이터로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SasangTab;
