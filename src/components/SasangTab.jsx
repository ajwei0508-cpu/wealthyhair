// src/components/SasangTab.jsx
// 하이엔드 3D 일러스트(툰 셰이딩·셀 셰이딩 그림체) 인체모형 상·중·하초 체형 각도 시뮬레이터 및
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
  taeeum: { label: '태음인 체형', desc: '허리·복부(중초) 중후 · 골격 굵음', chest: 62, waist: 84, pelvis: 66 },
  soeum: { label: '소음인 체형', desc: '골반·하초 안정 · 상체 슬림', chest: 42, waist: 48, pelvis: 78 },
};

// ============================================================================
// High-End 3D Cel-Shaded Illustration Character Engine (3D 그림체·웹툰 렌더링 엔진)
// ============================================================================
const Sasang3DBodyModel = ({ chestWidth, waistWidth, pelvisWidth, onSelectPreset }) => {
  const canvasRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [targetYaw, setTargetYaw] = useState(0.38); // 입체감이 가장 살아나는 3D 쿼터뷰 각도
  const yawRef = useRef(0.38);
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

    // 3D 벡터 정규화 및 내적 헬퍼
    const norm3 = (x, y, z) => {
      const len = Math.hypot(x, y, z) || 1;
      return [x / len, y / len, z / len];
    };
    const keyLight = norm3(0.48, -0.42, 0.77); // 주광원 (상단 우측 전면)
    const fillLight = norm3(-0.65, 0.15, 0.45); // 보조광 (좌측 림라이트)

    const render = (now) => {
      const dt = (now - startTime) * 0.001;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayW = canvas.clientWidth || 340;
      const displayH = canvas.clientHeight || 350;
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
      const cy = H * 0.53;

      // 부드러운 3D 체형 모핑 보간
      animSmoothRef.current.chest += (chestWidth - animSmoothRef.current.chest) * 0.12;
      animSmoothRef.current.waist += (waistWidth - animSmoothRef.current.waist) * 0.12;
      animSmoothRef.current.pelvis += (pelvisWidth - animSmoothRef.current.pelvis) * 0.12;

      const cNorm = animSmoothRef.current.chest / 100; // 0.25 ~ 0.90
      const wNorm = animSmoothRef.current.waist / 100;
      const pNorm = animSmoothRef.current.pelvis / 100;

      // 3D 회전 각도 업데이트 (자연스러운 턴테이블 모션)
      if (autoRotate && !isDraggingRef.current) {
        yawRef.current = Math.sin(dt * 0.95) * 0.58; // 좌우 -33° ~ +33° 입체 회전
      } else if (!isDraggingRef.current) {
        yawRef.current += (targetYaw - yawRef.current) * 0.14;
      }

      const yaw = yawRef.current;
      const pitch = 0.07; // 살짝 위에서 바라보는 캐릭터 일러스트 카메라 각도
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      // 생동감 있는 호흡 모션 & 미세 플로팅
      const breath = Math.sin(dt * 2.5) * 0.012;
      const bodyBob = Math.sin(dt * 2.5) * 0.008;

      const scale = Math.min(W, H) * 0.44;

      const transform3D = (x, y, z) => {
        const yy = y + bodyBob;
        const rx = x * cosY + z * sinY;
        const rz = -x * sinY + z * cosY;
        const ry = yy * cosP - rz * sinP;
        const fz = yy * sinP + rz * cosP;
        const fov = 3.2 / (3.2 - fz * 0.52);
        return {
          px: cx + rx * scale * fov,
          py: cy + ry * scale * fov,
          rx,
          ry,
          z: fz,
          fov,
        };
      };

      const rotateNormal = (nx, ny, nz) => {
        const rx = nx * cosY + nz * sinY;
        const rz = -nx * sinY + nz * cosY;
        const ry = ny * cosP - rz * sinP;
        const fz = ny * sinP + rz * cosP;
        return norm3(rx, ry, fz);
      };

      // ── 1. 스튜디오 배경 & 3D 캐릭터 아우라 후광 ──
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createRadialGradient(cx, cy - 25, 15, cx, cy, W * 0.7);
      bgGrad.addColorStop(0, '#231e28');
      bgGrad.addColorStop(0.55, '#111118');
      bgGrad.addColorStop(1, '#07070b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 캐릭터 뒤 은은한 금빛/청록 림라이트 배경 글로우
      const auraGrad = ctx.createRadialGradient(cx, cy - 20, 8, cx, cy - 20, scale * 0.95);
      auraGrad.addColorStop(0, 'rgba(212, 175, 55, 0.22)');
      auraGrad.addColorStop(0.5, 'rgba(100, 181, 246, 0.07)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy - 20, scale * 0.95, 0, Math.PI * 2);
      ctx.fill();

      // ── 2. 3D 바닥 마법진/턴테이블 플랫폼 ──
      [0.54, 0.40].forEach((rad, rIdx) => {
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const ang = (i / 48) * Math.PI * 2;
          const pt = transform3D(Math.cos(ang) * rad, 0.93, Math.sin(ang) * rad);
          if (i === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        if (rIdx === 0) {
          ctx.fillStyle = 'rgba(212, 175, 55, 0.06)';
          ctx.fill();
        }
        ctx.strokeStyle = rIdx === 0 ? 'rgba(212, 175, 55, 0.45)' : 'rgba(100, 181, 246, 0.25)';
        ctx.lineWidth = rIdx === 0 ? 1.8 : 1.1;
        ctx.stroke();
      });

      // 바닥 그림자 (Drop Shadow)
      ctx.beginPath();
      for (let i = 0; i <= 32; i++) {
        const ang = (i / 32) * Math.PI * 2;
        const pt = transform3D(Math.cos(ang) * 0.28, 0.925, Math.sin(ang) * 0.18);
        if (i === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fill();

      // ── 3. 상·중·하초 3D 에너지 링 (뒤쪽 반원 먼저 렌더링: z < 0) ──
      const zoneRings = [
        { y: -0.35, rx: 0.24 + cNorm * 0.21, rz: 0.16 + cNorm * 0.11, col: '#00E676', label: '상초' },
        { y: -0.05, rx: 0.18 + wNorm * 0.20, rz: 0.14 + wNorm * 0.14, col: '#FFB74D', label: '중초' },
        { y: 0.21, rx: 0.20 + pNorm * 0.22, rz: 0.15 + pNorm * 0.14, col: '#4FC3F7', label: '하초' },
      ];

      const drawZoneRingHalf = (frontHalf) => {
        zoneRings.forEach((zr) => {
          ctx.beginPath();
          let started = false;
          for (let i = 0; i <= 60; i++) {
            const ang = (i / 60) * Math.PI * 2;
            const x = Math.cos(ang) * zr.rx;
            const z = Math.sin(ang) * zr.rz;
            const pt = transform3D(x, zr.y, z);
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
          ctx.globalAlpha = frontHalf ? 0.85 : 0.28;
          ctx.lineWidth = frontHalf ? 2.4 : 1.2;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        });
      };

      drawZoneRingHalf(false);

      // ── 4. 3D 셀 셰이딩(Cel-Shading) 컬러 계산기 (애니·웹툰 그림체 톤 매핑) ──
      const getCelColor = (material, nx, ny, nz) => {
        const [rnx, rny, rnz] = rotateNormal(nx, ny, nz);
        const ndotl = rnx * keyLight[0] + rny * keyLight[1] + rnz * keyLight[2];
        const fillDot = Math.max(0, rnx * fillLight[0] + rny * fillLight[1] + rnz * fillLight[2]);
        const rim = Math.pow(Math.max(0, 1 - Math.abs(rnz)), 2.6);

        // 스킨 톤 (화사하고 입체적인 3D 일러스트 피치·웜아이보리 스킨)
        if (material === 'skin') {
          if (ndotl > 0.72) return '#FFE8D6'; // 하이라이트
          if (ndotl > 0.25) return '#F7CBB2'; // 기본 밝은 피부톤
          if (ndotl > -0.15) return '#DFA588'; // 1차 셀 음영
          if (rim > 0.45) return '#E8B89A'; // 역광 림라이트
          return '#C28266'; // 깊은 코어 음영
        }
        // 애슬레틱 수트 하의 (하이엔드 다크 네이비·골드 포인트 타이즈)
        if (material === 'suit_dark') {
          if (ndotl > 0.68) return '#394259';
          if (ndotl > 0.20) return '#262C3D';
          if (ndotl > -0.15) return '#1A1E2B';
          if (rim > 0.42) return '#4A5675';
          return '#11141D';
        }
        // 골드 벨트/트림
        if (material === 'gold') {
          if (ndotl > 0.6) return '#FFF099';
          if (ndotl > 0.15) return '#E5C158';
          return '#A67C1E';
        }
        return '#F7CBB2';
      };

      // ── 5. 인체 해부학 3D 볼륨 서피스 생성기 (목 ~ 상초 ~ 중초 ~ 하초) ──
      // theta: 0(우측) -> pi/2(정면 +z) -> pi(좌측) -> 3pi/2(후면 -z)
      const shoulderW = 0.18 + cNorm * 0.17 + breath;
      const chestW = 0.155 + cNorm * 0.145 + breath;
      const chestD = 0.115 + cNorm * 0.085 + breath;
      const waistW = 0.115 + wNorm * 0.155;
      const waistD = 0.090 + wNorm * 0.125;
      const pelvisW = 0.140 + pNorm * 0.165;
      const pelvisD = 0.105 + pNorm * 0.110;

      const getTorsoCrossSection = (v, theta) => {
        // v: 0 (목 상단 y=-0.62) ~ 1 (골반 하단 y=+0.32)
        const y = -0.62 + v * 0.94;
        const sinT = Math.sin(theta); // +1 정면, -1 후면
        const cosT = Math.cos(theta); // +1 우측, -1 좌측

        let rx = 0.07;
        let rz = 0.065;
        let material = 'skin';

        if (v < 0.10) {
          // 목 (Neck) - 태양인/상초 발달 시 목덜미 탄탄해짐
          const t = v / 0.10;
          const neckW = 0.064 + cNorm * 0.022;
          rx = neckW * (1 + t * 0.18);
          rz = neckW * 0.92 * (1 + t * 0.12);
        } else if (v < 0.22) {
          // 승모근 & 어깨 경사 (Trapezius to Shoulder Slope)
          const t = (v - 0.10) / 0.12;
          const smooth = Math.sin(t * Math.PI * 0.5);
          const neckW = (0.064 + cNorm * 0.022) * 1.18;
          rx = neckW + (shoulderW - neckW) * smooth;
          rz = neckW * 0.88 + (chestD - neckW * 0.88) * smooth;
        } else if (v < 0.48) {
          // 상초: 가슴 & 광배근 (Upper Chest & Lats)
          const t = (v - 0.22) / 0.26;
          rx = shoulderW * (1 - t * 0.18) + chestW * (t * 0.18);
          if (t > 0.5) {
            const subT = (t - 0.5) / 0.5;
            rx = rx * (1 - subT * 0.45) + waistW * (subT * 0.45);
          }
          rz = chestD * (1 - t * 0.25) + waistD * (t * 0.25);

          // 대흉근(Pectorals) 정면 입체 조형 + 가슴골(Sternum groove)
          if (sinT > 0.15) {
            const pecHeight = Math.sin(t * Math.PI);
            const pecLateral = Math.sin(Math.abs(cosT) * Math.PI);
            rz += pecHeight * pecLateral * (0.018 + cNorm * 0.028) * sinT;
            // 중앙 흉골 골짜기
            if (Math.abs(cosT) < 0.25) {
              rz -= pecHeight * (0.25 - Math.abs(cosT)) * 0.045;
            }
          }
          // 등 뒤 척추 기립근 골
          if (sinT < -0.2 && Math.abs(cosT) < 0.22) {
            rz -= (0.22 - Math.abs(cosT)) * 0.035;
          }
        } else if (v < 0.76) {
          // 중초: 허리 & 복부 (Waist & Abdomen)
          const t = (v - 0.48) / 0.28;
          const bellyCurve = Math.sin(t * Math.PI);
          rx = waistW + bellyCurve * (wNorm - 0.42) * 0.065;
          rz = waistD + bellyCurve * (wNorm - 0.38) * 0.075;

          // 정면 복근/배 볼륨 조형
          if (sinT > 0.2) {
            if (wNorm < 0.62) {
              // 탄탄한 11자 복근 조형
              const absGroove = Math.cos(cosT * 6) * 0.006;
              rz += absGroove * sinT;
            } else {
              // 태음인형 후덕한 중초 곡선
              rz += bellyCurve * (wNorm - 0.55) * 0.05 * sinT;
            }
          }
        } else {
          // 하초: 골반 & 힙 (Pelvis & Hips - 애슬레틱 수트 착용)
          const t = (v - 0.76) / 0.24;
          const hipCurve = Math.sin(t * Math.PI * 0.85);
          rx = waistW * (1 - hipCurve) + pelvisW * hipCurve;
          rz = waistD * (1 - hipCurve) + pelvisD * hipCurve;
          material = v < 0.81 ? 'gold' : 'suit_dark';

          // 힙(둔근) 뒤쪽 입체 볼륨
          if (sinT < -0.15) {
            rz += hipCurve * (0.022 + pNorm * 0.032) * Math.abs(sinT);
          }
        }

        const x = cosT * rx;
        const z = sinT * rz;
        return { x, y, z, material };
      };

      // ── 6. 3D 튜브형 팔·다리 메쉬 생성기 (근육 곡선 반영 + 외곽선 잉크 라인) ──
      const allQuads = [];
      const silhouetteSegments = [];

      const addTubularMesh = (ringList) => {
        // ringList: array of { pts3D: [{x,y,z,nx,ny,nz,mat}], isClosed: true }
        for (let i = 0; i < ringList.length - 1; i++) {
          const rA = ringList[i];
          const rB = ringList[i + 1];
          const N = rA.length - 1;

          for (let j = 0; j < N; j++) {
            const v00 = rA[j];
            const v10 = rA[j + 1];
            const v11 = rB[j + 1];
            const v01 = rB[j];

            const p00 = transform3D(v00.x, v00.y, v00.z);
            const p10 = transform3D(v10.x, v10.y, v10.z);
            const p11 = transform3D(v11.x, v11.y, v11.z);
            const p01 = transform3D(v01.x, v01.y, v01.z);

            const nx = (v00.nx + v10.nx + v11.nx + v01.nx) * 0.25;
            const ny = (v00.ny + v10.ny + v11.ny + v01.ny) * 0.25;
            const nz = (v00.nz + v10.nz + v11.nz + v01.nz) * 0.25;
            const rotN = rotateNormal(nx, ny, nz);

            // 카메라를 향하는 면(Front-facing)만 수집 + 실루엣 경계선 검출
            if (rotN[2] > -0.18) {
              const zAvg = (p00.z + p10.z + p11.z + p01.z) * 0.25;
              const fillCol = getCelColor(v00.material, nx, ny, nz);
              allQuads.push({
                pts: [p00, p10, p11, p01],
                z: zAvg,
                fill: fillCol,
                rotNz: rotN[2],
              });

              // 가장자리(림) 근처 쿼드는 만화풍 외곽선 잉크 스트로크 추가
              if (Math.abs(rotN[2]) < 0.34) {
                silhouetteSegments.push({
                  a: p00,
                  b: p01,
                  z: zAvg,
                });
              }
            }
          }
        }
      };

      // (A) 체간(Torso) 링 생성
      const vSteps = 28;
      const uSteps = 28;
      const torsoRings = [];
      for (let i = 0; i <= vSteps; i++) {
        const v = i / vSteps;
        const ring = [];
        for (let j = 0; j <= uSteps; j++) {
          const theta = (j / uSteps) * Math.PI * 2;
          const pt = getTorsoCrossSection(v, theta);
          const [nx, ny, nz] = norm3(Math.cos(theta), 0, Math.sin(theta));
          ring.push({ ...pt, nx, ny, nz });
        }
        torsoRings.push(ring);
      }
      addTubularMesh(torsoRings);

      // (B) 양팔(Arms: 삼각근 -> 이두/삼두 -> 전완근 -> 손) 생성
      const buildLimbRings = (joints, radii, matFunc) => {
        const limbRings = [];
        const segSteps = 5;
        const angSteps = 16;

        for (let s = 0; s < joints.length - 1; s++) {
          const j0 = joints[s];
          const j1 = joints[s + 1];
          const r0 = radii[s];
          const r1 = radii[s + 1];

          const maxK = s === joints.length - 2 ? segSteps : segSteps - 1;
          for (let k = 0; k <= maxK; k++) {
            const t = k / segSteps;
            const cxL = j0[0] + (j1[0] - j0[0]) * t;
            const cyL = j0[1] + (j1[1] - j0[1]) * t;
            const czL = j0[2] + (j1[2] - j0[2]) * t;
            // 근육 볼록 곡선(Muscle belly bulge)
            const muscleBulge = Math.sin(t * Math.PI) * 0.008;
            const rad = r0 + (r1 - r0) * t + muscleBulge;
            const mat = matFunc(s, t);

            const ring = [];
            for (let a = 0; a <= angSteps; a++) {
              const ang = (a / angSteps) * Math.PI * 2;
              const nx = Math.cos(ang);
              const nz = Math.sin(ang);
              ring.push({
                x: cxL + nx * rad,
                y: cyL,
                z: czL + nz * rad,
                nx,
                ny: 0,
                nz,
                material: mat,
              });
            }
            limbRings.push(ring);
          }
        }
        addTubularMesh(limbRings);
      };

      const armStartX = shoulderW + 0.015;
      const armRadii = [0.056 + cNorm * 0.022, 0.046 + cNorm * 0.014, 0.036, 0.032];
      // 우측 팔 & 좌측 팔
      buildLimbRings(
        [
          [armStartX, -0.43, 0.0],
          [armStartX + 0.065, -0.16, 0.01],
          [armStartX + 0.095, 0.10, 0.05],
          [armStartX + 0.085, 0.20, 0.07],
        ],
        armRadii,
        () => 'skin'
      );
      buildLimbRings(
        [
          [-armStartX, -0.43, 0.0],
          [-armStartX - 0.065, -0.16, 0.01],
          [-armStartX - 0.095, 0.10, 0.05],
          [-armStartX - 0.085, 0.20, 0.07],
        ],
        armRadii,
        () => 'skin'
      );

      // (C) 양다리(Legs: 허벅지 대퇴사두근 -> 무릎 -> 종아리 -> 발목) 생성
      const legStartX = 0.082 + pNorm * 0.068;
      const legRadii = [0.074 + pNorm * 0.036, 0.054 + pNorm * 0.018, 0.050 + pNorm * 0.014, 0.035];
      buildLimbRings(
        [
          [legStartX, 0.29, 0.0],
          [legStartX + 0.008, 0.56, 0.015],
          [legStartX + 0.010, 0.74, -0.01],
          [legStartX + 0.010, 0.90, 0.0],
        ],
        legRadii,
        (s, t) => (s === 0 && t < 0.75 ? 'suit_dark' : 'skin')
      );
      buildLimbRings(
        [
          [-legStartX, 0.29, 0.0],
          [-legStartX - 0.008, 0.56, 0.015],
          [-legStartX - 0.010, 0.74, -0.01],
          [-legStartX - 0.010, 0.90, 0.0],
        ],
        legRadii,
        (s, t) => (s === 0 && t < 0.75 ? 'suit_dark' : 'skin')
      );

      // ── 7. Z-깊이 정렬 후 셀 셰이딩 폴리곤 및 웹툰 외곽선 렌더링 ──
      allQuads.sort((a, b) => a.z - b.z);

      allQuads.forEach((q) => {
        ctx.beginPath();
        ctx.moveTo(q.pts[0].px, q.pts[0].py);
        ctx.lineTo(q.pts[1].px, q.pts[1].py);
        ctx.lineTo(q.pts[2].px, q.pts[2].py);
        ctx.lineTo(q.pts[3].px, q.pts[3].py);
        ctx.closePath();
        ctx.fillStyle = q.fill;
        ctx.fill();
        // 폴리곤 틈새 방지용 미세 보더
        ctx.strokeStyle = q.fill;
        ctx.lineWidth = 0.65;
        ctx.stroke();
      });

      // 외곽선 잉크 라인 (Toon Ink Outline)
      ctx.strokeStyle = '#2A1810';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      silhouetteSegments.forEach((seg) => {
        ctx.beginPath();
        ctx.moveTo(seg.a.px, seg.a.py);
        ctx.lineTo(seg.b.px, seg.b.py);
        ctx.stroke();
      });

      // ── 8. 해부학 일러스트 내부 드로잉 디테일 라인 (쇄골 · 흉근 · 복근 라인) ──
      ctx.strokeStyle = 'rgba(115, 62, 42, 0.65)';
      ctx.lineWidth = 1.5;

      // 쇄골(Clavicle) 라인
      const clavL1 = transform3D(-0.03, -0.46, chestD * 0.88);
      const clavL2 = transform3D(-shoulderW * 0.78, -0.44, chestD * 0.52);
      const clavR1 = transform3D(0.03, -0.46, chestD * 0.88);
      const clavR2 = transform3D(shoulderW * 0.78, -0.44, chestD * 0.52);
      ctx.beginPath();
      ctx.moveTo(clavL1.px, clavL1.py);
      ctx.quadraticCurveTo((clavL1.px + clavL2.px) * 0.5, clavL1.py + 4, clavL2.px, clavL2.py);
      ctx.moveTo(clavR1.px, clavR1.py);
      ctx.quadraticCurveTo((clavR1.px + clavR2.px) * 0.5, clavR1.py + 4, clavR2.px, clavR2.py);
      ctx.stroke();

      // 대흉근 하단 곡선 & 흉골 중심선 (Pectoral & Sternum Illustration Lines)
      const pecCenterTop = transform3D(0, -0.42, chestD * 0.96);
      const pecCenterBot = transform3D(0, -0.24, chestD * 0.98);
      const pecLeftOut = transform3D(-chestW * 0.76, -0.27, chestD * 0.58);
      const pecRightOut = transform3D(chestW * 0.76, -0.27, chestD * 0.58);

      ctx.beginPath();
      ctx.moveTo(pecCenterTop.px, pecCenterTop.py);
      ctx.lineTo(pecCenterBot.px, pecCenterBot.py);
      ctx.moveTo(pecCenterBot.px, pecCenterBot.py);
      ctx.quadraticCurveTo(
        (pecCenterBot.px + pecLeftOut.px) * 0.5,
        pecCenterBot.py + 6,
        pecLeftOut.px,
        pecLeftOut.py
      );
      ctx.moveTo(pecCenterBot.px, pecCenterBot.py);
      ctx.quadraticCurveTo(
        (pecCenterBot.px + pecRightOut.px) * 0.5,
        pecCenterBot.py + 6,
        pecRightOut.px,
        pecRightOut.py
      );
      ctx.stroke();

      // 복부 중심선 & 외복사근 라인
      const abTop = transform3D(0, -0.21, waistD * 0.98);
      const abBot = transform3D(0, 0.06, waistD * 1.02);
      ctx.strokeStyle = 'rgba(115, 62, 42, 0.42)';
      ctx.beginPath();
      ctx.moveTo(abTop.px, abTop.py);
      ctx.lineTo(abBot.px, abBot.py);
      ctx.stroke();

      // ── 9. 하이엔드 3D 애니메이션·웹툰 캐릭터 헤드 & 헤어스타일 ──
      const headCenter = transform3D(0, -0.76, 0.02);
      const headScale = scale * headCenter.fov;
      const headW = headScale * 0.135;
      const headH = headScale * 0.165;
      const faceShiftX = Math.sin(yaw) * headW * 0.42; // 3D 고개 회전에 따른 이목구비 패럴랙스

      // (1) 뒷머리 볼륨
      ctx.fillStyle = '#18161E';
      ctx.beginPath();
      ctx.arc(headCenter.px - faceShiftX * 0.25, headCenter.py - headH * 0.18, headW * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // (2) 양쪽 귀 (3D 회전 반영)
      const leftEarPt = transform3D(-0.135, -0.75, -0.01);
      const rightEarPt = transform3D(0.135, -0.75, -0.01);
      [leftEarPt, rightEarPt].forEach((ep) => {
        ctx.fillStyle = '#E8B094';
        ctx.strokeStyle = '#2A1810';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(ep.px, ep.py, headW * 0.18, headH * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // (3) 3D 셀 셰이딩 얼굴 윤곽 (V라인 턱선 + 볼 입체 음영)
      const faceGrad = ctx.createLinearGradient(
        headCenter.px - headW,
        headCenter.py - headH,
        headCenter.px + headW,
        headCenter.py + headH
      );
      faceGrad.addColorStop(0, '#FFEAD9');
      faceGrad.addColorStop(0.55, '#F7CBB2');
      faceGrad.addColorStop(1, '#D99B7E');

      ctx.fillStyle = faceGrad;
      ctx.strokeStyle = '#2A1810';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(headCenter.px - headW * 0.92, headCenter.py - headH * 0.25);
      ctx.quadraticCurveTo(
        headCenter.px - headW * 0.95,
        headCenter.py + headH * 0.45,
        headCenter.px + faceShiftX * 0.25,
        headCenter.py + headH * 0.95
      );
      ctx.quadraticCurveTo(
        headCenter.px + headW * 0.95,
        headCenter.py + headH * 0.45,
        headCenter.px + headW * 0.92,
        headCenter.py - headH * 0.25
      );
      ctx.quadraticCurveTo(
        headCenter.px,
        headCenter.py - headH * 1.05,
        headCenter.px - headW * 0.92,
        headCenter.py - headH * 0.25
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // (4) 3D 웹툰/애니풍 눈·눈썹·코·입 (고개 회전 패럴랙스 적용)
      const eyeY = headCenter.py - headH * 0.04;
      const leftEyeX = headCenter.px + faceShiftX - headW * 0.36 * Math.cos(yaw * 0.4);
      const rightEyeX = headCenter.px + faceShiftX + headW * 0.36 * Math.cos(yaw * 0.4);

      // 눈썹
      ctx.strokeStyle = '#221C28';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(leftEyeX - headW * 0.18, eyeY - headH * 0.16);
      ctx.quadraticCurveTo(leftEyeX, eyeY - headH * 0.22, leftEyeX + headW * 0.16, eyeY - headH * 0.15);
      ctx.moveTo(rightEyeX - headW * 0.16, eyeY - headH * 0.15);
      ctx.quadraticCurveTo(rightEyeX, eyeY - headH * 0.22, rightEyeX + headW * 0.18, eyeY - headH * 0.16);
      ctx.stroke();

      // 눈동자 & 하이라이트 캐치라이트
      [leftEyeX, rightEyeX].forEach((ex) => {
        // 흰자
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, headW * 0.16, headH * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();

        // 눈동자 (골드브라운 홍채)
        ctx.fillStyle = '#3B281E';
        ctx.beginPath();
        ctx.arc(ex + faceShiftX * 0.08, eyeY, headW * 0.095, 0, Math.PI * 2);
        ctx.fill();

        // 상단 속눈썹 아이라인
        ctx.strokeStyle = '#1B141C';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(ex, eyeY + headH * 0.02, headW * 0.16, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();

        // 애니풍 눈 하이라이트 (Catchlight)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex - headW * 0.04, eyeY - headH * 0.03, headW * 0.035, 0, Math.PI * 2);
        ctx.fill();
      });

      // 입체 콧대 & 코끝 음영
      const noseX = headCenter.px + faceShiftX * 1.15;
      const noseY = headCenter.py + headH * 0.24;
      ctx.fillStyle = 'rgba(175, 105, 80, 0.55)';
      ctx.beginPath();
      ctx.moveTo(noseX, eyeY + headH * 0.04);
      ctx.lineTo(noseX + (yaw >= 0 ? 3.5 : -3.5), noseY);
      ctx.lineTo(noseX, noseY + 2.5);
      ctx.closePath();
      ctx.fill();

      // 입술 라인
      ctx.strokeStyle = '#B86B58';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(headCenter.px + faceShiftX * 0.9 - headW * 0.16, headCenter.py + headH * 0.52);
      ctx.quadraticCurveTo(
        headCenter.px + faceShiftX * 0.9,
        headCenter.py + headH * 0.56,
        headCenter.px + faceShiftX * 0.9 + headW * 0.16,
        headCenter.py + headH * 0.52
      );
      ctx.stroke();

      // (5) 풍성한 3D 레이어드 헤어 & 엔젤링 하이라이트 (모발부자 시그니처 헤어)
      const hairGrad = ctx.createLinearGradient(
        headCenter.px,
        headCenter.py - headH * 1.35,
        headCenter.px,
        headCenter.py + headH * 0.2
      );
      hairGrad.addColorStop(0, '#362F42');
      hairGrad.addColorStop(0.5, '#1F1B29');
      hairGrad.addColorStop(1, '#120F18');

      ctx.fillStyle = hairGrad;
      ctx.strokeStyle = '#0B0910';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      // 정수리 볼륨부터 앞머리 레이어드 스파이크까지
      ctx.moveTo(headCenter.px - headW * 1.08, headCenter.py - headH * 0.10);
      ctx.quadraticCurveTo(
        headCenter.px - headW * 1.15,
        headCenter.py - headH * 1.18,
        headCenter.px + faceShiftX * 0.2,
        headCenter.py - headH * 1.28
      );
      ctx.quadraticCurveTo(
        headCenter.px + headW * 1.15,
        headCenter.py - headH * 1.18,
        headCenter.px + headW * 1.08,
        headCenter.py - headH * 0.10
      );
      // 앞머리 결 (Bangs)
      ctx.lineTo(headCenter.px + faceShiftX * 0.5 + headW * 0.62, headCenter.py - headH * 0.12);
      ctx.quadraticCurveTo(
        headCenter.px + faceShiftX * 0.5 + headW * 0.35,
        headCenter.py - headH * 0.45,
        headCenter.px + faceShiftX * 0.6 + headW * 0.12,
        headCenter.py - headH * 0.08
      );
      ctx.quadraticCurveTo(
        headCenter.px + faceShiftX * 0.5 - headW * 0.15,
        headCenter.py - headH * 0.48,
        headCenter.px + faceShiftX * 0.4 - headW * 0.42,
        headCenter.py - headH * 0.10
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 헤어 엔젤링(Angel-ring) 윤기 하이라이트
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(
        headCenter.px + faceShiftX * 0.25,
        headCenter.py - headH * 0.52,
        headW * 0.68,
        Math.PI * 1.18,
        Math.PI * 1.82
      );
      ctx.stroke();

      // ── 10. 상·중·하초 3D 에너지 링 (앞쪽 반원 렌더링: z >= 0) ──
      drawZoneRingHalf(true);

      // ── 11. 상·하초 체형 경사각(Taper Angle) 벡터 라인 & HUD ──
      const leftShoulderPt = transform3D(-shoulderW - 0.03, -0.36, 0);
      const rightShoulderPt = transform3D(shoulderW + 0.03, -0.36, 0);
      const leftPelvisPt = transform3D(-pelvisW - 0.03, 0.22, 0);
      const rightPelvisPt = transform3D(pelvisW + 0.03, 0.22, 0);

      ctx.save();
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(leftShoulderPt.px, leftShoulderPt.py);
      ctx.lineTo(leftPelvisPt.px, leftPelvisPt.py);
      ctx.moveTo(rightShoulderPt.px, rightShoulderPt.py);
      ctx.lineTo(rightPelvisPt.px, rightPelvisPt.py);
      ctx.stroke();
      ctx.setLineDash([]);

      [leftShoulderPt, rightShoulderPt, leftPelvisPt, rightPelvisPt].forEach((pt, i) => {
        ctx.fillStyle = i < 2 ? '#00E676' : '#4FC3F7';
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // 좌측 상단 체형 각도 HUD
      ctx.fillStyle = 'rgba(12, 12, 18, 0.86)';
      ctx.fillRect(10, 10, 152, 44);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.strokeRect(10, 10, 152, 44);
      ctx.font = 'bold 10px Montserrat, Pretendard, sans-serif';
      ctx.fillStyle = '#D4AF37';
      ctx.fillText('3D ILLUSTRATION BODY', 18, 25);
      ctx.font = 'bold 12px Pretendard, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(`체형 경사각: ${taperAngleDeg > 0 ? `+${taperAngleDeg}°` : `${taperAngleDeg}°`}`, 18, 44);

      // 우측 상·중·하초 수치 콜아웃
      const badges = [
        { label: `상초 ${chestWidth}%`, col: '#00E676', y: -0.35 },
        { label: `중초 ${waistWidth}%`, col: '#FFB74D', y: -0.05 },
        { label: `하초 ${pelvisWidth}%`, col: '#4FC3F7', y: 0.21 },
      ];
      badges.forEach((b) => {
        const anchor = transform3D(0.24, b.y, 0.08);
        const bx = W - 78;
        const by = anchor.py;
        ctx.strokeStyle = b.col;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(anchor.px, anchor.py);
        ctx.lineTo(bx - 4, by);
        ctx.stroke();

        ctx.fillStyle = 'rgba(12, 12, 18, 0.9)';
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
    yawRef.current = Math.max(-1.35, Math.min(1.35, yawRef.current + delta));
    setTargetYaw(yawRef.current);
    lastXRef.current = clientX;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div style={{ marginBottom: '14px' }}>
      {/* 3D 일러스트 뷰포트 캔버스 */}
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
          style={{ width: '100%', height: '340px', display: 'block', cursor: 'grab', touchAction: 'pan-y' }}
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
              { label: '입체 25°', yaw: 0.44 },
              { label: '측면 65°', yaw: 1.12 },
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
            {autoRotate ? '● 3D 모션 회전 ON' : '○ 3D 모션 회전 OFF'}
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
        <span style={{ color: '#D4AF37', fontWeight: 800 }}>드래그하여 입체 회전</span>
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
  const [chestWidth, setChestWidth] = useState(74);
  const [waistWidth, setWaistWidth] = useState(48);
  const [pelvisWidth, setPelvisWidth] = useState(44);

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
          <p className="tab-banner-sub">3D 일러스트 캐릭터 상·중·하초 체형 각도 및 체질별 맞춤 식이</p>
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
            🧍 3D 캐릭터 체형 · 체질 진단
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
            {/* 1. 하이엔드 3D 일러스트 인체모형 & 상·중·하초 슬라이더 */}
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
                  STEP 1 · 3D 일러스트 체형 각도 시뮬레이터
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
          /* ============================================================================
             체질별 핵심 발모 식이·약선 가이드
             ============================================================================ */
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
              <RotateCcw size={14} /> 3D 캐릭터 체형 시뮬레이터로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SasangTab;
