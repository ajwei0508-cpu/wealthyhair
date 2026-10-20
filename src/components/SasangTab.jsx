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

// ── 정면(0°)·후면(180°) 32-bit RGBA 3D 캐릭터 에셋 로더 & 해부학적 윤곽선 측정기 ──
function prepareRiggedCharacterData(img, isFemale) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  let minY = h;
  let maxY = 0;
  const torsoLeft = new Float32Array(h);
  const torsoRight = new Float32Array(h);
  const symCx = isFemale ? 448 : 451;

  // 팔과 몸통 사이의 빈 공간(Air Gap)을 지나는 해부학적 분리 키포인트
  const gapKps = isFemale
    ? [
        [0, 356, 536],
        [315, 356, 536],
        [400, 362, 534],
        [480, 358, 538],
        [550, 330, 566],
        [600, 316, 580],
        [680, 310, 586],
        [h, 310, 586],
      ]
    : [
        [0, 346, 555],
        [324, 346, 555],
        [400, 349, 553],
        [480, 342, 560],
        [560, 316, 586],
        [620, 302, 600],
        [700, 290, 612],
        [h, 290, 612],
      ];

  const gapLeftArr = new Float32Array(h);
  const gapRightArr = new Float32Array(h);

  for (let y = 0; y < h; y++) {
    let gl = gapKps[0][1];
    let gr = gapKps[0][2];
    for (let k = 0; k < gapKps.length - 1; k++) {
      const [y0, l0, r0] = gapKps[k];
      const [y1, l1, r1] = gapKps[k + 1];
      if (y >= y0 && y <= y1) {
        const t = y1 > y0 ? (y - y0) / (y1 - y0) : 0;
        gl = l0 + (l1 - l0) * t;
        gr = r0 + (r1 - r0) * t;
        break;
      }
    }
    gapLeftArr[y] = gl;
    gapRightArr[y] = gr;

    let rowHasPixel = false;
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 35) {
        rowHasPixel = true;
        break;
      }
    }
    if (rowHasPixel) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    let lx = Math.round(gl);
    const maxLx = symCx - 10;
    while (lx < maxLx && d[(y * w + lx) * 4 + 3] <= 35) lx++;
    let rx = Math.round(gr);
    const minRx = symCx + 10;
    while (rx > minRx && d[(y * w + rx) * 4 + 3] <= 35) rx--;

    if (rx > lx + 20) {
      torsoLeft[y] = lx;
      torsoRight[y] = rx;
    } else {
      torsoLeft[y] = symCx - 75;
      torsoRight[y] = symCx + 75;
    }
  }

  return {
    canvas: off,
    width: w,
    height: h,
    symCx,
    armpitY: isFemale ? 315 : 324,
    crotchY: isFemale ? 648 : 652,
    armLCx0: isFemale ? 334 : 316,
    armRCx0: isFemale ? 562 : 586,
    minY: minY < maxY ? minY : 50,
    maxY: maxY > minY ? maxY : h - 50,
    gapLeftArr,
    gapRightArr,
    torsoLeft,
    torsoRight,
  };
}

// ── 우측면(90°)·좌측면(270°) 32-bit RGBA 3D 캐릭터 로더 & 전·후방 측면 윤곽선 측정기 ──
function prepareSideCharacterData(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  // 90° 우측면 캔버스 (오른쪽을 바라보는 측면)
  const offRight = document.createElement('canvas');
  offRight.width = w;
  offRight.height = h;
  const ctxR = offRight.getContext('2d');
  ctxR.drawImage(img, 0, 0);

  // 270° 좌측면 캔버스 (왼쪽을 바라보는 측면 - 좌우 미러)
  const offLeft = document.createElement('canvas');
  offLeft.width = w;
  offLeft.height = h;
  const ctxL = offLeft.getContext('2d');
  ctxL.save();
  ctxL.translate(w, 0);
  ctxL.scale(-1, 1);
  ctxL.drawImage(img, 0, 0);
  ctxL.restore();

  const imgData = ctxR.getImageData(0, 0, w, h);
  const d = imgData.data;

  let minY = h;
  let maxY = 0;
  const edgeLeft = new Float32Array(h);
  const edgeRight = new Float32Array(h);
  const symCx = 452;

  for (let y = 0; y < h; y++) {
    let lx = 0;
    while (lx < w && d[(y * w + lx) * 4 + 3] <= 35) lx++;
    let rx = w - 1;
    while (rx >= 0 && d[(y * w + rx) * 4 + 3] <= 35) rx--;

    if (rx > lx) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      edgeLeft[y] = lx;
      edgeRight[y] = rx;
    } else {
      edgeLeft[y] = symCx - 55;
      edgeRight[y] = symCx + 55;
    }
  }

  return {
    canvasRight: offRight,
    canvasLeft: offLeft,
    width: w,
    height: h,
    symCx,
    minY: minY < maxY ? minY : 50,
    maxY: maxY > minY ? maxY : h - 50,
    edgeLeft,
    edgeRight,
  };
}

// ============================================================================
// High-End 360° 3D Celebrity Character Simulator (정면 0° · 우측면 90° · 후면 180° · 좌측면 270°)
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
  const processedModelsRef = useRef({
    male: { front: null, side: null, back: null },
    female: { front: null, side: null, back: null },
  });
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [angleDegUI, setAngleDegUI] = useState(0);
  const targetYawRef = useRef(0);
  const yawRef = useRef(0);
  const lastFrameTimeRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const animSmoothRef = useRef({
    chest: chestWidth,
    waist: waistWidth,
    pelvis: pelvisWidth,
  });

  // 360° 남·여 3D 캐릭터(정면 0° / 측면 90°·270° / 후면 180°) 프리로드
  useEffect(() => {
    let mounted = true;
    const loadImg = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

    Promise.all([
      loadImg('/assets/sasang/male_3d_model.png'),
      loadImg('/assets/sasang/male_3d_side.png'),
      loadImg('/assets/sasang/male_3d_back.png'),
      loadImg('/assets/sasang/female_3d_model.png'),
      loadImg('/assets/sasang/female_3d_side.png'),
      loadImg('/assets/sasang/female_3d_back.png'),
    ]).then(([mFront, mSide, mBack, fFront, fSide, fBack]) => {
      if (!mounted) return;
      if (mFront) processedModelsRef.current.male.front = prepareRiggedCharacterData(mFront, false);
      if (mSide) processedModelsRef.current.male.side = prepareSideCharacterData(mSide);
      if (mBack) processedModelsRef.current.male.back = prepareRiggedCharacterData(mBack, false);
      if (fFront) processedModelsRef.current.female.front = prepareRiggedCharacterData(fFront, true);
      if (fSide) processedModelsRef.current.female.side = prepareSideCharacterData(fSide);
      if (fBack) processedModelsRef.current.female.back = prepareRiggedCharacterData(fBack, true);
      setModelsLoaded(true);
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

  // 특정 각도(도, 0~360)로 즉시/부드럽게 회전 이동
  const setAngleDegrees = (deg) => {
    const normDeg = ((deg % 360) + 360) % 360;
    const rad = (normDeg * Math.PI) / 180;
    setAutoRotate(false);
    targetYawRef.current = rad;
    setAngleDegUI(Math.round(normDeg));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId;
    let startTime = performance.now();
    const TWO_PI = Math.PI * 2;

    const asymBell = (v, center, halfUp, halfDown) => {
      const d = v - center;
      const halfW = d >= 0 ? halfDown : halfUp;
      if (Math.abs(d) >= halfW) return 0;
      return 0.5 * (1 + Math.cos((Math.abs(d) / halfW) * Math.PI));
    };

    const wrapSignedAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

    const render = (now) => {
      const dt = (now - startTime) * 0.001;
      const frameDelta = lastFrameTimeRef.current ? Math.min(0.05, (now - lastFrameTimeRef.current) * 0.001) : 0.016;
      lastFrameTimeRef.current = now;

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

      const cVal = animSmoothRef.current.chest;
      const wVal = animSmoothRef.current.waist;
      const pVal = animSmoothRef.current.pelvis;

      const chestFactor = 1 + (cVal - 56) * 0.0046;
      const waistFactor = 1 + (wVal - 52) * 0.0048;
      const pelvisFactor = 1 + (pVal - 54) * 0.0048;

      // 360° 연속 턴테이블 회전 업데이트 (0° → 90° 우측면 → 180° 후면 → 270° 좌측면 → 360°)
      if (autoRotate && !isDraggingRef.current) {
        yawRef.current = (yawRef.current + frameDelta * 0.58) % TWO_PI;
        targetYawRef.current = yawRef.current;
      } else if (!isDraggingRef.current) {
        const diff = wrapSignedAngle(targetYawRef.current - yawRef.current);
        yawRef.current = ((yawRef.current + diff * 0.16) % TWO_PI + TWO_PI) % TWO_PI;
      }

      const yaw = ((yawRef.current % TWO_PI) + TWO_PI) % TWO_PI;
      const curDeg = Math.round((yaw * 180) / Math.PI) % 360;
      const pitch = 0.12;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      const breath = Math.sin(dt * 2.4) * 0.008;
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

      const auraX = cx + Math.sin(yaw) * 10;
      const auraGrad = ctx.createRadialGradient(auraX, cy - 28, 12, auraX, cy - 28, scale3D * 0.96);
      auraGrad.addColorStop(0, 'rgba(212, 175, 55, 0.24)');
      auraGrad.addColorStop(0.48, gender === 'female' ? 'rgba(244, 143, 177, 0.11)' : 'rgba(100, 181, 246, 0.11)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(auraX, cy - 28, scale3D * 0.96, 0, Math.PI * 2);
      ctx.fill();

      // ── 2. 3D 홀로그램 바닥 360° 나침반 포디움(Pedestal) ──
      [0.52, 0.37].forEach((rad, rIdx) => {
        ctx.beginPath();
        for (let i = 0; i <= 50; i++) {
          const ang = (i / 50) * TWO_PI + (rIdx === 0 ? yaw : -yaw * 0.5);
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

      // ── 3. 상·중·하초 360° 3D 입체 타원 링 정의 (가로폭 rx & 전후두께 rz 동시 반영) ──
      const ringZones = [
        { y: -0.34, rx: 0.23 * chestFactor, rz: 0.16 * chestFactor, col: '#00E676', label: '상초' },
        { y: -0.11, rx: 0.19 * waistFactor, rz: 0.14 * waistFactor, col: '#FFB74D', label: '중초' },
        { y: 0.09, rx: 0.22 * pelvisFactor, rz: 0.16 * pelvisFactor, col: '#4FC3F7', label: '하초' },
      ];

      const drawZoneRingsHalf = (frontHalf) => {
        ringZones.forEach((zr) => {
          ctx.beginPath();
          let started = false;
          for (let i = 0; i <= 64; i++) {
            const ang = (i / 64) * TWO_PI;
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

      drawZoneRingsHalf(false);

      // ── 4. 360° 전방위(정면 0° / 우측면 90° / 후면 180° / 좌측면 270°) 해부학 리깅 렌더링 ──
      const genderSet = processedModelsRef.current[gender] || processedModelsRef.current.male;

      let shoulderLeftPx = cx - 48;
      let shoulderRightPx = cx + 48;
      let shoulderPy = cy - 75;
      let waistFrontPx = cx + 30;
      let waistBackPx = cx - 30;
      let waistPy = cy - 22;
      let pelvisLeftPx = cx - 42;
      let pelvisRightPx = cx + 42;
      let pelvisPy = cy + 16;

      // (4-A) 정면(0°) 및 후면(180°) 3D 골격 분리 렌더러 (팔·손 꼬임 0%)
      const renderFrontOrBackView = (modelData, localYaw, viewAlpha) => {
        if (!modelData || !modelData.canvas || viewAlpha <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = viewAlpha;

        const srcCanvas = modelData.canvas;
        const srcW = modelData.width;
        const srcH = modelData.height;
        const symCx = modelData.symCx;
        const armpitY = modelData.armpitY;
        const crotchY = modelData.crotchY;
        const armLCx0 = modelData.armLCx0;
        const armRCx0 = modelData.armRCx0;
        const minY = modelData.minY;
        const maxY = modelData.maxY;
        const charSrcH = Math.max(100, maxY - minY);

        const targetCharH = H * 0.88;
        const baseScale = targetCharH / charSrcH;
        const topDestY = (H - targetCharH) * 0.48 + floatY;

        const clampedYaw = Math.max(-0.62, Math.min(0.62, localYaw));
        const perspectiveSquash = Math.max(0.76, Math.cos(clampedYaw * 0.72));
        const cylAsym = Math.sin(clampedYaw) * 0.18;
        const scaleL = baseScale * perspectiveSquash * (1 + cylAsym);
        const scaleR = baseScale * perspectiveSquash * (1 - cylAsym);

        const getArmScale = (v) => {
          if (v < 0.14) return 1.0;
          return 1.0 + asymBell(v, 0.24, 0.09, 0.34) * (chestFactor - 1.0 + breath * 0.5);
        };

        const vArmpit = (armpitY - minY) / charSrcH;
        const sArmpit = getArmScale(vArmpit);
        const hipExcess = Math.max(0, Math.max(pelvisFactor, waistFactor) - chestFactor);
        const abductMaxSrcPx = hipExcess * 28.0;

        const numSlices = 200;
        const sliceSrcH = charSrcH / numSlices;
        const sliceDestH = targetCharH / numSlices;

        for (let s = 0; s < numSlices; s++) {
          const v = s / numSlices;
          const sy = minY + s * sliceSrcH;
          const rowIdx = Math.min(srcH - 1, Math.round(sy));

          const wUpper = asymBell(v, 0.24, 0.09, 0.15);
          const wMiddle = asymBell(v, 0.39, 0.14, 0.15);
          const wLower = asymBell(v, 0.52, 0.15, 0.35);

          const sTorso =
            v < 0.15
              ? 1.0
              : 1.0 +
                wUpper * (chestFactor - 1.0 + breath) +
                wMiddle * (waistFactor - 1.0) +
                wLower * (pelvisFactor - 1.0);

          const sArm = getArmScale(v);

          const depthZ =
            v < 0.16
              ? 0.10
              : v < 0.35
              ? 0.14 * chestFactor
              : v < 0.48
              ? 0.12 * waistFactor
              : v < 0.65
              ? 0.13 * pelvisFactor
              : 0.07;

          const centerScreenX = cx + Math.sin(clampedYaw) * depthZ * 72;
          const destY = topDestY + s * sliceDestH;
          const sh = sliceSrcH + 1.4;
          const dh = sliceDestH + 1.15;

          if (sy <= armpitY) {
            const leftSrcW = symCx;
            const rightSrcW = srcW - symCx;
            const destWL = leftSrcW * sArm * scaleL;
            const destWR = rightSrcW * sArm * scaleR;

            ctx.drawImage(srcCanvas, 0, sy, leftSrcW, sh, centerScreenX - destWL, destY, destWL + 0.6, dh);
            ctx.drawImage(srcCanvas, symCx, sy, rightSrcW, sh, centerScreenX - 0.3, destY, destWR + 0.3, dh);
          } else if (sy <= 700) {
            const gapL = modelData.gapLeftArr[rowIdx];
            const gapR = modelData.gapRightArr[rowIdx];

            if (sy <= crotchY) {
              const tLeftSrcW = symCx - gapL;
              const tRightSrcW = gapR - symCx;
              const tDestWL = tLeftSrcW * sTorso * scaleL;
              const tDestWR = tRightSrcW * sTorso * scaleR;

              ctx.drawImage(srcCanvas, gapL, sy, tLeftSrcW, sh, centerScreenX - tDestWL, destY, tDestWL + 0.6, dh);
              ctx.drawImage(srcCanvas, symCx, sy, tRightSrcW, sh, centerScreenX - 0.3, destY, tDestWR + 0.3, dh);
            } else {
              const legT = Math.min(1.0, (sy - crotchY) / 180.0);
              const innerShiftSrc = (sTorso - 1.0) * 2.8 * legT;
              const lLegSrcW = symCx - gapL;
              const rLegSrcW = gapR - symCx;
              const lLegDestW = lLegSrcW * sTorso * scaleL;
              const rLegDestW = rLegSrcW * sTorso * scaleR;

              ctx.drawImage(
                srcCanvas,
                gapL,
                sy,
                lLegSrcW,
                sh,
                centerScreenX - innerShiftSrc * scaleL - lLegDestW,
                destY,
                lLegDestW,
                dh
              );
              ctx.drawImage(
                srcCanvas,
                symCx,
                sy,
                rLegSrcW,
                sh,
                centerScreenX + innerShiftSrc * scaleR,
                destY,
                rLegDestW,
                dh
              );
            }

            const armT = (sy - armpitY) / 360.0;
            const abductShift = abductMaxSrcPx * armT;

            const lArmSrcW = gapL;
            const lArmDestW = lArmSrcW * sArm * scaleL;
            const lArmOffsetSrc =
              (armLCx0 - symCx) * sArmpit + (0 - armLCx0) * sArm - abductShift;
            const lArmDestX = centerScreenX + lArmOffsetSrc * scaleL;
            ctx.drawImage(srcCanvas, 0, sy, lArmSrcW, sh, lArmDestX, destY, lArmDestW, dh);

            const rArmSrcW = srcW - gapR;
            const rArmDestW = rArmSrcW * sArm * scaleR;
            const rArmOffsetSrc =
              (armRCx0 - symCx) * sArmpit + (gapR - armRCx0) * sArm + abductShift;
            const rArmDestX = centerScreenX + rArmOffsetSrc * scaleR;
            ctx.drawImage(srcCanvas, gapR, sy, rArmSrcW, sh, rArmDestX, destY, rArmDestW, dh);
          } else {
            const lLegSrcW = symCx;
            const rLegSrcW = srcW - symCx;
            const lLegDestW = lLegSrcW * sTorso * scaleL;
            const rLegDestW = rLegSrcW * sTorso * scaleR;

            ctx.drawImage(srcCanvas, 0, sy, lLegSrcW, sh, centerScreenX - lLegDestW, destY, lLegDestW, dh);
            ctx.drawImage(srcCanvas, symCx, sy, rLegSrcW, sh, centerScreenX, destY, rLegDestW, dh);
          }

          if (viewAlpha >= 0.5) {
            const tLx = modelData.torsoLeft[rowIdx];
            const tRx = modelData.torsoRight[rowIdx];
            if (Math.abs(v - 0.24) < 0.005) {
              shoulderLeftPx = centerScreenX + (tLx - symCx) * sTorso * scaleL;
              shoulderRightPx = centerScreenX + (tRx - symCx) * sTorso * scaleR;
              shoulderPy = destY;
            }
            if (Math.abs(v - 0.52) < 0.005) {
              pelvisLeftPx = centerScreenX + (tLx - symCx) * sTorso * scaleL;
              pelvisRightPx = centerScreenX + (tRx - symCx) * sTorso * scaleR;
              pelvisPy = destY;
            }
          }
        }

        ctx.restore();
      };

      // (4-B) 우측면(90°) 및 좌측면(270°) 전·후방 체형 입체 두께(가슴·복부·둔부) 모핑 렌더러
      const renderSideProfileView = (sideData, isLeftProfile, localYaw, viewAlpha) => {
        if (!sideData || viewAlpha <= 0.01) return;
        const srcCanvas = isLeftProfile ? sideData.canvasLeft : sideData.canvasRight;
        if (!srcCanvas) return;

        ctx.save();
        ctx.globalAlpha = viewAlpha;

        const srcW = sideData.width;
        const srcH = sideData.height;
        const symCx = isLeftProfile ? srcW - sideData.symCx : sideData.symCx;
        const minY = sideData.minY;
        const maxY = sideData.maxY;
        const charSrcH = Math.max(100, maxY - minY);

        const targetCharH = H * 0.88;
        const baseScale = targetCharH / charSrcH;
        const topDestY = (H - targetCharH) * 0.48 + floatY;

        const clampedYaw = Math.max(-0.62, Math.min(0.62, localYaw));
        const perspectiveSquash = Math.max(0.78, Math.cos(clampedYaw * 0.7));
        const cylAsym = Math.sin(clampedYaw) * 0.15;
        const scaleLeftHalf = baseScale * perspectiveSquash * (1 + cylAsym);
        const scaleRightHalf = baseScale * perspectiveSquash * (1 - cylAsym);

        // 상초(흉곽 전후두께), 중초(복부 돌출·만곡), 하초(둔부·골반 전후 볼륨) 편차
        const cDev = (cVal - 56) * 0.0052;
        const wDev = (wVal - 52) * 0.0058;
        const pDev = (pVal - 54) * 0.0058;

        const numSlices = 200;
        const sliceSrcH = charSrcH / numSlices;
        const sliceDestH = targetCharH / numSlices;

        for (let s = 0; s < numSlices; s++) {
          const v = s / numSlices;
          const sy = minY + s * sliceSrcH;
          const rowIdx = Math.min(srcH - 1, Math.round(sy));

          let sPost = 1.0; // 등·허리·둔부(Posterior) 확장 배율
          let sAnt = 1.0;  // 가슴·복부·대퇴전면(Anterior) 확장 배율

          if (v >= 0.16) {
            const wUp = asymBell(v, 0.26, 0.10, 0.16);
            const wMid = asymBell(v, 0.40, 0.14, 0.15);
            const wLow = asymBell(v, 0.53, 0.15, 0.35);

            sPost = 1.0 + wUp * (cDev * 0.85 + breath * 0.4) + wMid * wDev * 0.55 + wLow * pDev * 1.28;
            sAnt = 1.0 + wUp * (cDev * 1.22 + breath) + wMid * wDev * 1.38 + wLow * pDev * 0.75;
          }

          // 90° 우측면(오른쪽 응시): 좌측 반구가 후방(등·둔부), 우측 반구가 전방(가슴·복부)
          // 270° 좌측면(왼쪽 응시): 좌측 반구가 전방(가슴·복부), 우측 반구가 후방(등·둔부)
          const sLeftHalf = isLeftProfile ? sAnt : sPost;
          const sRightHalf = isLeftProfile ? sPost : sAnt;

          const centerScreenX = cx + Math.sin(clampedYaw) * 9.0;
          const destY = topDestY + s * sliceDestH;
          const sh = sliceSrcH + 1.4;
          const dh = sliceDestH + 1.15;

          const leftSrcW = symCx;
          const rightSrcW = srcW - symCx;
          const destWL = leftSrcW * sLeftHalf * scaleLeftHalf;
          const destWR = rightSrcW * sRightHalf * scaleRightHalf;

          ctx.drawImage(srcCanvas, 0, sy, leftSrcW, sh, centerScreenX - destWL, destY, destWL + 0.6, dh);
          ctx.drawImage(srcCanvas, symCx, sy, rightSrcW, sh, centerScreenX - 0.3, destY, destWR + 0.3, dh);

          if (viewAlpha >= 0.5) {
            const rawL = sideData.edgeLeft[rowIdx];
            const rawR = sideData.edgeRight[rowIdx];
            const eLx = isLeftProfile ? srcW - rawR : rawL;
            const eRx = isLeftProfile ? srcW - rawL : rawR;

            if (Math.abs(v - 0.26) < 0.005) {
              shoulderLeftPx = centerScreenX + (eLx - symCx) * sLeftHalf * scaleLeftHalf;
              shoulderRightPx = centerScreenX + (eRx - symCx) * sRightHalf * scaleRightHalf;
              shoulderPy = destY;
            }
            if (Math.abs(v - 0.40) < 0.005) {
              waistBackPx = centerScreenX + (eLx - symCx) * sLeftHalf * scaleLeftHalf;
              waistFrontPx = centerScreenX + (eRx - symCx) * sRightHalf * scaleRightHalf;
              waistPy = destY;
            }
            if (Math.abs(v - 0.53) < 0.005) {
              pelvisLeftPx = centerScreenX + (eLx - symCx) * sLeftHalf * scaleLeftHalf;
              pelvisRightPx = centerScreenX + (eRx - symCx) * sRightHalf * scaleRightHalf;
              pelvisPy = destY;
            }
          }
        }

        ctx.restore();
      };

      // 4방향 카디널 뷰(0° 정면, 90° 우측면, 180° 후면, 270° 좌측면) 가중치 계산 및 연속 360° 블렌딩
      const cardinals = [
        { angle: 0, type: 'front' },
        { angle: Math.PI * 0.5, type: 'sideRight' },
        { angle: Math.PI, type: 'back' },
        { angle: Math.PI * 1.5, type: 'sideLeft' },
      ];

      cardinals.forEach((c) => {
        const delta = wrapSignedAngle(yaw - c.angle);
        const absD = Math.abs(delta);
        if (absD >= Math.PI * 0.5) return;

        // 각 카디널 중심(±22°)에서는 100% 선명하게 표시하고, 대각선 구간(22°~68°)에서 코사인 입체 블렌딩
        const holdRad = 0.38;
        const fadeEndRad = Math.PI * 0.5 - 0.38;
        let alpha = 1.0;
        if (absD > holdRad) {
          const t = Math.min(1.0, (absD - holdRad) / Math.max(0.01, fadeEndRad - holdRad));
          alpha = 0.5 * (1.0 + Math.cos(t * Math.PI));
        }

        if (c.type === 'front') {
          renderFrontOrBackView(genderSet.front, delta, alpha);
        } else if (c.type === 'back') {
          renderFrontOrBackView(genderSet.back || genderSet.front, delta, alpha);
        } else if (c.type === 'sideRight') {
          renderSideProfileView(genderSet.side, false, delta, alpha);
        } else if (c.type === 'sideLeft') {
          renderSideProfileView(genderSet.side, true, delta, alpha);
        }
      });

      // ── 5. 상·중·하초 3D 입체 링 전면(z >= 0) 렌더링 ──
      drawZoneRingsHalf(true);

      // ── 6. 정면·후면(좌우 경사각) 및 좌·우 측면(전후 입체 굴곡선) 가이드 라인 & 측정 수치 HUD ──
      const isSideDominant =
        (curDeg >= 45 && curDeg <= 135) || (curDeg >= 225 && curDeg <= 315);

      ctx.save();
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      if (isSideDominant) {
        // 측면(90° / 270°) 뷰: 전방(가슴-복부-골반) 및 후방(등-허리-둔부) 입체 굴곡 라인 표시
        ctx.moveTo(shoulderLeftPx, shoulderPy);
        ctx.lineTo(waistBackPx, waistPy);
        ctx.lineTo(pelvisLeftPx, pelvisPy);
        ctx.moveTo(shoulderRightPx, shoulderPy);
        ctx.lineTo(waistFrontPx, waistPy);
        ctx.lineTo(pelvisRightPx, pelvisPy);
      } else {
        // 정면(0°) / 후면(180°) 뷰: 좌·우 상하초 체형 경사각 라인 표시
        ctx.moveTo(shoulderLeftPx - 2, shoulderPy);
        ctx.lineTo(pelvisLeftPx - 2, pelvisPy);
        ctx.moveTo(shoulderRightPx + 2, shoulderPy);
        ctx.lineTo(pelvisRightPx + 2, pelvisPy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      const guideNodes = isSideDominant
        ? [
            [shoulderLeftPx, shoulderPy, '#00E676'],
            [shoulderRightPx, shoulderPy, '#00E676'],
            [waistBackPx, waistPy, '#FFB74D'],
            [waistFrontPx, waistPy, '#FFB74D'],
            [pelvisLeftPx, pelvisPy, '#4FC3F7'],
            [pelvisRightPx, pelvisPy, '#4FC3F7'],
          ]
        : [
            [shoulderLeftPx - 2, shoulderPy, '#00E676'],
            [shoulderRightPx + 2, shoulderPy, '#00E676'],
            [pelvisLeftPx - 2, pelvisPy, '#4FC3F7'],
            [pelvisRightPx + 2, pelvisPy, '#4FC3F7'],
          ];

      guideNodes.forEach(([px, py, col]) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px, py, 4.2, 0, TWO_PI);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // 현재 360° 방향 라벨
      const dirLabel =
        curDeg >= 315 || curDeg < 45
          ? `정면 ${curDeg}°`
          : curDeg >= 45 && curDeg < 135
          ? `우측면 ${curDeg}°`
          : curDeg >= 135 && curDeg < 225
          ? `후면 ${curDeg}°`
          : `좌측면 ${curDeg}°`;

      // 좌측 상단 360° 각도 및 체형 경사각 HUD
      ctx.fillStyle = 'rgba(10, 12, 18, 0.88)';
      ctx.fillRect(10, 10, 166, 48);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
      ctx.strokeRect(10, 10, 166, 48);
      ctx.font = 'bold 10px Montserrat, Pretendard, sans-serif';
      ctx.fillStyle = '#D4AF37';
      ctx.fillText(`360° VIEW · ${dirLabel}`, 18, 25);
      ctx.font = 'bold 11.5px Pretendard, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(
        isSideDominant
          ? `측면 입체굴곡: 상${chestWidth}·중${waistWidth}·하${pelvisWidth}`
          : `체형 경사각: ${taperAngleDeg > 0 ? `+${taperAngleDeg}°` : `${taperAngleDeg}°`}`,
        18,
        46
      );

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
  }, [gender, modelsLoaded, chestWidth, waistWidth, pelvisWidth, autoRotate, taperAngleDeg]);

  const handlePointerDown = (clientX) => {
    isDraggingRef.current = true;
    setAutoRotate(false);
    lastXRef.current = clientX;
  };

  const handlePointerMove = (clientX) => {
    if (!isDraggingRef.current) return;
    const TWO_PI = Math.PI * 2;
    const delta = (clientX - lastXRef.current) * 0.015;
    yawRef.current = ((yawRef.current + delta) % TWO_PI + TWO_PI) % TWO_PI;
    targetYawRef.current = yawRef.current;
    setAngleDegUI(Math.round((yawRef.current * 180) / Math.PI) % 360);
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

      {/* 360° 3D 캐릭터 뷰포트 캔버스 */}
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
          style={{ width: '100%', height: '390px', display: 'block', cursor: 'grab', touchAction: 'pan-y' }}
          onMouseDown={(e) => handlePointerDown(e.clientX)}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
          onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
          onTouchEnd={handlePointerUp}
        />

        {/* 하단 360° 전방위 카메라 앵글 컨트롤 바 (정면 0° / 우측면 90° / 후면 180° / 좌측면 270°) */}
        <div
          style={{
            padding: '8px 10px',
            background: 'rgba(14, 14, 18, 0.96)',
            borderTop: '1px solid rgba(212, 175, 55, 0.22)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginBottom: '7px' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[
                { label: '정면 0°', deg: 0 },
                { label: '우측면 90°', deg: 90 },
                { label: '후면 180°', deg: 180 },
                { label: '좌측면 270°', deg: 270 },
              ].map((v, i) => {
                const isSelected = !autoRotate && Math.abs(((angleDegUI - v.deg + 540) % 360) - 180) < 22;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAngleDegrees(v.deg)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #D4AF37' : '1px solid #333',
                      background: isSelected ? 'rgba(212,175,55,0.22)' : '#18181e',
                      color: isSelected ? '#FFD700' : '#eee',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              style={{
                padding: '5px 10px',
                borderRadius: '999px',
                border: autoRotate ? '1px solid #00E676' : '1px solid #555',
                background: autoRotate ? 'rgba(0, 230, 118, 0.16)' : '#18181e',
                color: autoRotate ? '#00E676' : '#aaa',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {autoRotate ? '● 360° 자동회전 ON' : '○ 360° 자동회전 OFF'}
            </button>
          </div>

          {/* 360° 자유 회전 슬라이더 바 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.66rem', color: '#D4AF37', fontWeight: 800, minWidth: '64px' }}>
              🔄 360° 회전
            </span>
            <input
              type="range"
              min="0"
              max="360"
              value={angleDegUI}
              onChange={(e) => setAngleDegrees(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#D4AF37', cursor: 'pointer', height: '4px' }}
            />
            <span style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 800, minWidth: '34px', textAlign: 'right' }}>
              {angleDegUI}°
            </span>
          </div>
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
