// src/components/SasangTab.jsx
// 하이엔드 3D 애니메이션 인체모형(상초·중초·하초 입체 체형 각도 시뮬레이터) 및
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
  taeyang: { label: '태양인 체형', desc: '목덜미·상초 발달 (역삼각 상체)', chest: 82, waist: 46, pelvis: 40 },
  soyang: { label: '소양인 체형', desc: '어깨·흉곽 발달 · 골반 슬림', chest: 78, waist: 48, pelvis: 42 },
  taeeum: { label: '태음인 체형', desc: '허리·복부(중초) 중후 · 골격 굵음', chest: 60, waist: 82, pelvis: 64 },
  soeum: { label: '소음인 체형', desc: '골반·하초 안정 · 상체 슬림', chest: 42, waist: 48, pelvis: 76 },
};

// ============================================================================
// High-End 3D Animated Human Body Model Component (HTML5 3D Projection Engine)
// ============================================================================
const Sasang3DBodyModel = ({ chestWidth, waistWidth, pelvisWidth, onSelectPreset }) => {
  const canvasRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [targetYaw, setTargetYaw] = useState(0.45); // 기본 25도 입체 얼짱 각도
  const yawRef = useRef(0.45);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const animSmoothRef = useRef({
    chest: chestWidth,
    waist: waistWidth,
    pelvis: pelvisWidth,
  });

  // 상·하초 체형 경사각(Torso Taper Angle) 계산
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

    const render = (now) => {
      const dt = (now - startTime) * 0.001;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayW = canvas.clientWidth || 320;
      const displayH = canvas.clientHeight || 340;
      if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
      }

      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.scale(dpr, dpr);

      const W = displayW;
      const H = displayH;
      const cx = W * 0.5;
      const cy = H * 0.51;

      // 부드러운 3D 모핑 보간 (Smooth Morphing)
      animSmoothRef.current.chest += (chestWidth - animSmoothRef.current.chest) * 0.12;
      animSmoothRef.current.waist += (waistWidth - animSmoothRef.current.waist) * 0.12;
      animSmoothRef.current.pelvis += (pelvisWidth - animSmoothRef.current.pelvis) * 0.12;

      const cNorm = animSmoothRef.current.chest / 100; // 0.2 ~ 0.9
      const wNorm = animSmoothRef.current.waist / 100;
      const pNorm = animSmoothRef.current.pelvis / 100;

      // 회전 각도 업데이트
      if (autoRotate && !isDraggingRef.current) {
        yawRef.current = Math.sin(dt * 0.85) * 0.68; // 좌우 -39° ~ +39° 부드러운 3D 턴테이블 스윙
      } else if (!isDraggingRef.current) {
        yawRef.current += (targetYaw - yawRef.current) * 0.14;
      }

      const yaw = yawRef.current;
      const pitch = 0.14; // 위에서 살짝 내려다보는 하이엔드 3D 카메라 앵글
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      // 호흡 모션 (Breathing animation)
      const breath = Math.sin(dt * 2.4) * 0.018;

      // 3D -> 2D 원근 투영 함수
      const scale = Math.min(W, H) * 0.42;
      const project3D = (x, y, z) => {
        const rx = x * cosY + z * sinY;
        const rz = -x * sinY + z * cosY;
        const ry = y * cosP - rz * sinP;
        const fz = y * sinP + rz * cosP;
        const fov = 3.4 / (3.4 - fz * 0.45);
        return {
          px: cx + rx * scale * fov,
          py: cy + ry * scale * fov,
          z: fz,
          fov,
        };
      };

      // 1. 하이엔드 다크 스튜디오 배경 & 입체 바닥 그리드 플랫폼
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createRadialGradient(cx, cy - 10, 10, cx, cy, W * 0.65);
      bgGrad.addColorStop(0, 'rgba(38, 31, 16, 0.55)');
      bgGrad.addColorStop(0.6, 'rgba(14, 15, 20, 0.92)');
      bgGrad.addColorStop(1, 'rgba(8, 8, 12, 1)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 3D 홀로그램 회전 바닥 링 (Pedestal)
      [0.52, 0.38, 0.24].forEach((rad, rIdx) => {
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const ang = (i / 48) * Math.PI * 2 + dt * (rIdx % 2 === 0 ? 0.4 : -0.3);
          const pt = project3D(Math.cos(ang) * rad, 0.96, Math.sin(ang) * rad);
          if (i === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.strokeStyle = rIdx === 0 ? 'rgba(212, 175, 55, 0.38)' : 'rgba(212, 175, 55, 0.16)';
        ctx.lineWidth = rIdx === 0 ? 1.5 : 1;
        ctx.stroke();
      });

      // 2. 인체 높이(y: -0.92 머리꼭대기 ~ +0.92 발목)에 따른 해부학 3D 단면 계산기
      const getTorsoRadii = (y) => {
        // Head (-0.92 ~ -0.66)
        if (y < -0.66) {
          const t = (y - -0.92) / 0.26; // 0 at top, 1 at chin
          const profile = Math.sin(Math.max(0.05, Math.min(0.98, t)) * Math.PI);
          const jawTaper = t > 0.6 ? 1 - (t - 0.6) * 0.45 : 1;
          return {
            rx: 0.135 * profile * jawTaper,
            rz: 0.15 * profile,
            zone: 'head',
          };
        }
        // Neck (-0.66 ~ -0.54) - 태양인/상초 발달 시 목덜미 두꺼워짐
        if (y < -0.54) {
          const neckFactor = 0.072 + cNorm * 0.028;
          return {
            rx: neckFactor,
            rz: neckFactor * 0.95,
            zone: 'neck',
          };
        }
        // Shoulder & Upper Chest 상초 (-0.54 ~ -0.18)
        if (y < -0.18) {
          const t = (y - -0.54) / 0.36; // 0 at neck base, 1 at lower chest
          const shoulderSlope = Math.sin(Math.min(1, t * 1.45) * (Math.PI * 0.5));
          const baseChestW = 0.21 + cNorm * 0.21 + breath;
          const baseChestD = 0.12 + cNorm * 0.10 + breath;
          const taperToWaist = t > 0.55 ? (t - 0.55) / 0.45 : 0;
          const waistTargetW = 0.14 + wNorm * 0.18;
          const waistTargetD = 0.10 + wNorm * 0.13;
          return {
            rx: (0.09 + (baseChestW - 0.09) * shoulderSlope) * (1 - taperToWaist * 0.35) + waistTargetW * (taperToWaist * 0.35),
            rz: (0.08 + (baseChestD - 0.08) * shoulderSlope) * (1 - taperToWaist * 0.3) + waistTargetD * (taperToWaist * 0.3),
            zone: 'upper',
          };
        }
        // Waist & Abdomen 중초 (-0.18 ~ +0.08)
        if (y < 0.08) {
          const t = (y - -0.18) / 0.26;
          const bellyCurve = Math.sin(t * Math.PI);
          const rx = 0.145 + wNorm * 0.185 + bellyCurve * (wNorm - 0.4) * 0.06;
          const rz = 0.105 + wNorm * 0.145 + bellyCurve * (wNorm - 0.35) * 0.08;
          return { rx, rz, zone: 'middle' };
        }
        // Pelvis & Hip 하초 (+0.08 ~ +0.32)
        if (y <= 0.32) {
          const t = (y - 0.08) / 0.24;
          const hipFlare = Math.sin(t * Math.PI * 0.85);
          const waistW = 0.145 + wNorm * 0.175;
          const pelvisW = 0.165 + pNorm * 0.205;
          const pelvisD = 0.115 + pNorm * 0.135;
          return {
            rx: waistW * (1 - hipFlare * 0.7) + pelvisW * (hipFlare * 0.7),
            rz: 0.11 + pelvisD * 0.55 * hipFlare,
            zone: 'lower',
          };
        }
        return { rx: 0, rz: 0, zone: 'legs' };
      };

      // 3. 3D 팔(Arms) & 다리(Legs) 튜브 세그먼트 생성 및 음영 렌더링
      const draw3DLimb = (jointPoints, radii, tintColor) => {
        for (let s = 0; s < jointPoints.length - 1; s++) {
          const p0 = jointPoints[s];
          const p1 = jointPoints[s + 1];
          const r0 = radii[s];
          const r1 = radii[s + 1];

          const steps = 6;
          for (let k = 0; k < steps; k++) {
            const frac = k / steps;
            const lx = p0[0] + (p1[0] - p0[0]) * frac;
            const ly = p0[1] + (p1[1] - p0[1]) * frac;
            const lz = p0[2] + (p1[2] - p0[2]) * frac;
            const lr = r0 + (r1 - r0) * frac;

            ctx.beginPath();
            for (let a = 0; a <= 16; a++) {
              const ang = (a / 16) * Math.PI * 2;
              const pt = project3D(lx + Math.cos(ang) * lr, ly, lz + Math.sin(ang) * lr);
              if (a === 0) ctx.moveTo(pt.px, pt.py);
              else ctx.lineTo(pt.px, pt.py);
            }
            ctx.strokeStyle = tintColor;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }
      };

      const shoulderX = 0.21 + cNorm * 0.19;
      const hipX = 0.095 + pNorm * 0.085;

      // 좌·우 팔 및 다리 렌더링
      draw3DLimb(
        [
          [-shoulderX, -0.44, 0],
          [-shoulderX - 0.07, -0.14, 0.02],
          [-shoulderX - 0.10, 0.14, 0.06],
        ],
        [0.055 + cNorm * 0.02, 0.046, 0.035],
        'rgba(212, 175, 55, 0.26)'
      );
      draw3DLimb(
        [
          [shoulderX, -0.44, 0],
          [shoulderX + 0.07, -0.14, 0.02],
          [shoulderX + 0.10, 0.14, 0.06],
        ],
        [0.055 + cNorm * 0.02, 0.046, 0.035],
        'rgba(212, 175, 55, 0.26)'
      );
      draw3DLimb(
        [
          [-hipX, 0.30, 0],
          [-hipX - 0.01, 0.60, 0.02],
          [-hipX - 0.015, 0.90, -0.01],
        ],
        [0.075 + pNorm * 0.035, 0.056, 0.040],
        'rgba(79, 195, 247, 0.28)'
      );
      draw3DLimb(
        [
          [hipX, 0.30, 0],
          [hipX + 0.01, 0.60, 0.02],
          [hipX + 0.015, 0.90, -0.01],
        ],
        [0.075 + pNorm * 0.035, 0.056, 0.040],
        'rgba(79, 195, 247, 0.28)'
      );

      // 4. 내부 삼초(상초·중초·하초) 3D 입체 에너지 코어 (Glowing Volumetric Spheres)
      const cores = [
        { y: -0.34, r: 0.07 + cNorm * 0.055, color: '0, 230, 118', label: '상초(폐·심)' },
        { y: -0.05, r: 0.07 + wNorm * 0.055, color: '255, 167, 38', label: '중초(비·간)' },
        { y: 0.20, r: 0.07 + pNorm * 0.055, color: '79, 195, 247', label: '하초(신·골반)' },
      ];
      cores.forEach((core, idx) => {
        const pulse = 1 + Math.sin(dt * 3.2 + idx) * 0.08;
        const cPt = project3D(0, core.y, 0);
        const radiusPx = core.r * scale * cPt.fov * pulse;
        const g = ctx.createRadialGradient(cPt.px, cPt.py, 2, cPt.px, cPt.py, radiusPx * 1.45);
        g.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
        g.addColorStop(0.35, `rgba(${core.color}, 0.55)`);
        g.addColorStop(1, `rgba(${core.color}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cPt.px, cPt.py, radiusPx * 1.45, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. 홀로그램 스캔 레이저 위치 (-0.9 ~ +0.85 왕복)
      const scanY = -0.05 + Math.sin(dt * 1.6) * 0.82;

      // 6. 인체 체간(머리~골반) 3D 볼류메트릭 단면 링 & 경락 세로 메쉬 렌더링
      const ySlices = [];
      const numSlices = 34;
      for (let i = 0; i <= numSlices; i++) {
        const y = -0.90 + (i / numSlices) * 1.22; // -0.90 to +0.32
        ySlices.push(y);
      }

      const ringVertices = [];
      const numAngles = 24;

      ySlices.forEach((y) => {
        const { rx, rz, zone } = getTorsoRadii(y);
        const pts = [];
        for (let j = 0; j <= numAngles; j++) {
          const theta = (j / numAngles) * Math.PI * 2;
          // 흉근/등/척추 해부학적 입체 굴곡 부여
          const anatomicalMod =
            zone === 'upper'
              ? 1 + Math.cos(theta * 2) * 0.06
              : zone === 'middle'
              ? 1 + Math.sin(theta) * 0.05
              : 1;
          const x = Math.cos(theta) * rx * anatomicalMod;
          const z = Math.sin(theta) * rz * anatomicalMod;
          pts.push(project3D(x, y, z));
        }
        ringVertices.push({ y, zone, pts });
      });

      // 가로 단면 링 그리기
      ringVertices.forEach(({ y, zone, pts }) => {
        const distToScan = Math.abs(y - scanY);
        const isScanned = distToScan < 0.06;

        let strokeCol = 'rgba(212, 175, 55, 0.35)';
        if (zone === 'upper') strokeCol = isScanned ? '#00E676' : 'rgba(0, 230, 118, 0.48)';
        else if (zone === 'middle') strokeCol = isScanned ? '#FFB74D' : 'rgba(255, 167, 38, 0.48)';
        else if (zone === 'lower') strokeCol = isScanned ? '#4FC3F7' : 'rgba(79, 195, 247, 0.48)';
        else if (zone === 'head') strokeCol = isScanned ? '#FFF' : 'rgba(212, 175, 55, 0.42)';

        ctx.beginPath();
        pts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        });
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = isScanned ? 2.2 : 1.15;
        ctx.stroke();
      });

      // 세로 방향 3D 메쉬 스플라인 (Longitudinal Anatomical Splines)
      for (let j = 0; j < numAngles; j += 2) {
        ctx.beginPath();
        ringVertices.forEach((ring, rIdx) => {
          const p = ring.pts[j];
          if (rIdx === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        });
        ctx.strokeStyle = j % 4 === 0 ? 'rgba(255, 235, 180, 0.25)' : 'rgba(212, 175, 55, 0.12)';
        ctx.lineWidth = j % 4 === 0 ? 1.2 : 0.75;
        ctx.stroke();
      }

      // 7. 상·하초 체형 경사각(Angle Vector) 가이드 라인 & 측정 수치 HUD 오버레이
      const leftShoulderPt = project3D(-(0.21 + cNorm * 0.20), -0.38, 0);
      const rightShoulderPt = project3D(0.21 + cNorm * 0.20, -0.38, 0);
      const leftPelvisPt = project3D(-(0.165 + pNorm * 0.20), 0.22, 0);
      const rightPelvisPt = project3D(0.165 + pNorm * 0.20, 0.22, 0);

      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(leftShoulderPt.px - 6, leftShoulderPt.py);
      ctx.lineTo(leftPelvisPt.px - 6, leftPelvisPt.py);
      ctx.moveTo(rightShoulderPt.px + 6, rightShoulderPt.py);
      ctx.lineTo(rightPelvisPt.px + 6, rightPelvisPt.py);
      ctx.stroke();
      ctx.setLineDash([]);

      // 어깨·골반 포인트 마커
      [leftShoulderPt, rightShoulderPt, leftPelvisPt, rightPelvisPt].forEach((pt, i) => {
        ctx.fillStyle = i < 2 ? '#00E676' : '#4FC3F7';
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 홀로그램 스캔 레이저 바
      const scanLeft = project3D(-0.48, scanY, 0);
      const scanRight = project3D(0.48, scanY, 0);
      const scanGrad = ctx.createLinearGradient(scanLeft.px, scanLeft.py, scanRight.px, scanRight.py);
      scanGrad.addColorStop(0, 'rgba(212, 175, 55, 0)');
      scanGrad.addColorStop(0.5, 'rgba(255, 215, 0, 0.75)');
      scanGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.strokeStyle = scanGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scanLeft.px, scanLeft.py);
      ctx.lineTo(scanRight.px, scanRight.py);
      ctx.stroke();

      // 상단 좌/우 HUD 뱃지
      ctx.fillStyle = 'rgba(10, 12, 16, 0.82)';
      ctx.fillRect(10, 10, 148, 44);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.strokeRect(10, 10, 148, 44);
      ctx.font = 'bold 10px Montserrat, Pretendard, sans-serif';
      ctx.fillStyle = '#D4AF37';
      ctx.fillText('3D BODY ANGLE SCAN', 18, 25);
      ctx.font = 'bold 12px Pretendard, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(`체형 경사각: ${taperAngleDeg > 0 ? `+${taperAngleDeg}°` : `${taperAngleDeg}°`}`, 18, 44);

      // 우측 상·중·하초 수치 콜아웃
      const badges = [
        { label: `상초 ${chestWidth}%`, col: '#00E676', y: -0.38 },
        { label: `중초 ${waistWidth}%`, col: '#FFB74D', y: -0.05 },
        { label: `하초 ${pelvisWidth}%`, col: '#4FC3F7', y: 0.22 },
      ];
      badges.forEach((b) => {
        const anchor = project3D(0.28, b.y, 0);
        const bx = W - 78;
        const by = anchor.py;
        ctx.strokeStyle = b.col;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(anchor.px, anchor.py);
        ctx.lineTo(bx - 4, by);
        ctx.stroke();

        ctx.fillStyle = 'rgba(12, 12, 16, 0.88)';
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
  }, [chestWidth, waistWidth, pelvisWidth, autoRotate, targetYaw, taperAngleDeg]);

  const handlePointerDown = (clientX) => {
    isDraggingRef.current = true;
    setAutoRotate(false);
    lastXRef.current = clientX;
  };

  const handlePointerMove = (clientX) => {
    if (!isDraggingRef.current) return;
    const delta = (clientX - lastXRef.current) * 0.012;
    yawRef.current += delta;
    setTargetYaw(yawRef.current);
    lastXRef.current = clientX;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div style={{ marginBottom: '14px' }}>
      {/* 3D 뷰포트 캔버스 */}
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
          style={{ width: '100%', height: '310px', display: 'block', cursor: 'grab', touchAction: 'pan-y' }}
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
              { label: '정면 0°', yaw: 0 },
              { label: '입체 35°', yaw: 0.6 },
              { label: '측면 80°', yaw: 1.38 },
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
            {autoRotate ? '● 3D 자동회전 ON' : '○ 3D 자동회전 OFF'}
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
        <span style={{ color: '#D4AF37', fontWeight: 800 }}>드래그하여 360° 회전</span>
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
            <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '2px' }}>3D 모핑</div>
          </button>
        ))}
      </div>
    </div>
  );
};

const SasangTab = () => {
  const [subMode, setSubMode] = useState('test'); // 'test' | 'food_guide'
  const [chestWidth, setChestWidth] = useState(68);
  const [waistWidth, setWaistWidth] = useState(50);
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

    // 응답한 설문 가중치 합산
    SASANG_QUESTIONS.forEach((q) => {
      const idx = answers[q.id];
      const opt = q.options[idx];
      if (opt) totals[opt.type] += opt.weight;
    });

    // 3D 체형 슬라이더(상초·중초·하초) 비율 가중치 반영
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
      {/* 깔끔한 배너 */}
      <div className="tab-banner">
        <img
          src="/assets/banners/banner_sasang.jpg"
          alt="사상체질 3D 체형 진단"
          className="tab-banner-img"
          onError={(e) => { e.currentTarget.src = '/assets/banners/banner_guide.jpg'; }}
        />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">사상체질 3D 체형 & 발모 약선</h1>
          <p className="tab-banner-sub">3D 입체 인체모형 상·중·하초 각도 계측 및 체질별 맞춤 식이</p>
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
            🧍 3D 인체모형 · 체질 진단
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
            {/* 1. 하이엔드 3D 애니메이션 인체모형 & 상·중·하초 슬라이더 */}
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
                  STEP 1 · 3D 인체모형 체형 각도 시뮬레이터
                </span>
                <span style={{ fontSize: '0.68rem', color: '#999' }}>삼초(상·중·하) 비율 조절</span>
              </div>

              <Sasang3DBodyModel
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
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#D4AF37' }}>
                  STEP 2 · 핵심 체질 문진 ({currentQIdx + 1} / {SASANG_QUESTIONS.length})
                </span>
                <span style={{ fontSize: '0.7rem', color: '#81C784', fontWeight: 700 }}>
                  {answeredCount}개 응답됨
                </span>
              </div>

              {/* 진행 바 */}
              <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                <div
                  style={{
                    width: `${((currentQIdx + 1) / SASANG_QUESTIONS.length) * 100}%`,
                    height: '100%',
                    background: '#D4AF37',
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>

              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff', marginBottom: '10px', lineHeight: 1.4 }}>
                Q{currentQIdx + 1}. {activeQuestion.question}
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
                        borderRadius: '8px',
                        border: isSelected ? '1.5px solid #D4AF37' : '1px solid #2b2b2b',
                        background: isSelected ? 'rgba(212, 175, 55, 0.16)' : '#18181e',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? '#D4AF37' : '#eee' }}>
                        {isSelected ? '✓ ' : ''}{opt.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '2px' }}>{opt.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* 이전/다음 문항 이동 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <button
                  type="button"
                  disabled={currentQIdx === 0}
                  onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    background: '#18181e',
                    color: currentQIdx === 0 ? '#555' : '#ccc',
                    fontSize: '0.72rem',
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
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    background: '#18181e',
                    color: currentQIdx === SASANG_QUESTIONS.length - 1 ? '#555' : '#D4AF37',
                    fontSize: '0.72rem',
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
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              🔍 3D 체형 각도 + 문진 종합 사상체질 결과 확인하기 →
            </button>
          </div>
        ) : (
          <div>
            {/* 판정 결과 요약 배너 */}
            {resultType && SASANG_CONSTITUTION_DETAILS[resultType] && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(18,18,22,0.96) 100%)',
                  border: '1.5px solid #D4AF37',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 700 }}>
                    ✓ 나의 3D 체형·사상체질 진단 결과
                  </span>
                  <button
                    type="button"
                    onClick={() => setSubMode('test')}
                    style={{
                      background: 'none',
                      border: '1px solid #555',
                      color: '#ccc',
                      borderRadius: '999px',
                      padding: '3px 9px',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    3D 체형 다시 조절
                  </button>
                </div>
                <h2 style={{ fontSize: '1.15rem', color: '#fff', margin: '4px 0' }}>
                  {SASANG_CONSTITUTION_DETAILS[resultType].name}{' '}
                  <span style={{ fontSize: '0.82rem', color: '#D4AF37' }}>
                    ({SASANG_CONSTITUTION_DETAILS[resultType].hanja})
                  </span>
                </h2>
                <p style={{ fontSize: '0.74rem', color: '#ccc', margin: 0, lineHeight: 1.45 }}>
                  {SASANG_CONSTITUTION_DETAILS[resultType].subtitle}
                </p>

                {scoresMap && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '10px' }}>
                    {[
                      { k: 'taeyang', l: '태양인' },
                      { k: 'soyang', l: '소양인' },
                      { k: 'taeeum', l: '태음인' },
                      { k: 'soeum', l: '소음인' },
                    ].map((c) => (
                      <div
                        key={c.k}
                        style={{
                          background: '#111',
                          padding: '5px',
                          borderRadius: '6px',
                          textAlign: 'center',
                          border: resultType === c.k ? '1px solid #D4AF37' : '1px solid #262626',
                        }}
                      >
                        <div style={{ fontSize: '0.65rem', color: '#999' }}>{c.l}</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: resultType === c.k ? '#D4AF37' : '#fff' }}>
                          {scoresMap[c.k]}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4체질 전환 탭 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '14px' }}>
              {[
                { key: 'taeyang', label: '태양인', sub: '폐대간소' },
                { key: 'soyang', label: '소양인', sub: '비대신소' },
                { key: 'taeeum', label: '태음인', sub: '간대폐소' },
                { key: 'soeum', label: '소음인', sub: '신대비소' },
              ].map((t) => {
                const isActive = selectedViewType === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelectedViewType(t.key)}
                    style={{
                      padding: '9px 4px',
                      borderRadius: '8px',
                      border: isActive ? '1.5px solid #D4AF37' : '1px solid #2a2a2a',
                      background: isActive ? '#D4AF37' : '#141418',
                      color: isActive ? '#000' : '#bbb',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{t.label}</div>
                    <div style={{ fontSize: '0.64rem', opacity: 0.8 }}>{t.sub}</div>
                  </button>
                );
              })}
            </div>

            {/* 1. 체질별 탈모 핵심 원인 요약 */}
            <div
              style={{
                background: '#121216',
                border: '1px solid #2b2b2b',
                borderRadius: '12px',
                padding: '13px',
                marginBottom: '12px',
              }}
            >
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#D4AF37', marginBottom: '6px' }}>
                🧬 {activeDetail.name} 체형 & 탈모 핵심 기전
              </div>
              <p style={{ fontSize: '0.75rem', color: '#ddd', margin: 0, lineHeight: 1.55 }}>
                {activeDetail.hairLossMechanism}
              </p>
            </div>

            {/* 2. 발모 핵심 슈퍼푸드 */}
            <div
              style={{
                background: 'linear-gradient(180deg, #17140b 0%, #101014 100%)',
                border: '1px solid rgba(212, 175, 55, 0.45)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Sparkles size={16} color="#D4AF37" />
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#D4AF37' }}>
                  {activeDetail.name} 맞춤 발모 핵심 식품
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeDetail.hairSuperfoods.map((sf, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#16161c',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      borderRadius: '8px',
                      padding: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>🌟 {sf.food}</span>
                      <span style={{ fontSize: '0.66rem', color: '#D4AF37', background: 'rgba(212,175,55,0.12)', padding: '2px 7px', borderRadius: '4px' }}>
                        {sf.keyNutrients}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.73rem', color: '#ccc', lineHeight: 1.5, margin: 0 }}>
                      {sf.hairMechanism}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 유익한 음식 & 피해야 할 음식 요약 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              <div style={{ background: '#121216', border: '1px solid rgba(76, 175, 80, 0.35)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#81c784', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ThumbsUp size={14} /> {activeDetail.name}에게 유익한 음식
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {[
                    ...activeDetail.goodFoods.grains.slice(0, 4),
                    ...activeDetail.goodFoods.seafoodMeats.slice(0, 4),
                    ...activeDetail.goodFoods.vegetables.slice(0, 4),
                    ...activeDetail.goodFoods.fruitsHerbs.slice(0, 4),
                  ].map((food, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(76, 175, 80, 0.12)',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        color: '#e8f5e9',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                      }}
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ background: '#121216', border: '1px solid rgba(255, 82, 82, 0.35)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ff8a80', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ThumbsDown size={14} /> {activeDetail.name}이 피해야 할 음식
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeDetail.badFoods.list.map((b, i) => (
                    <div key={i} style={{ fontSize: '0.73rem', color: '#ddd', lineHeight: 1.45 }}>
                      <strong style={{ color: '#ff8a80' }}>• {b.category}:</strong> {b.items}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SasangTab;
