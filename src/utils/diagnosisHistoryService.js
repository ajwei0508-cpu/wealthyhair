// src/utils/diagnosisHistoryService.js
// 회원별 개인 탈모 진단 기록(남성·여성 안드로겐성 탈모 & 원형탈모 SALT) 영구 저장·열람·경과 비교 서비스
// - IndexedDB(idb-keyval) 대용량 썸네일 저장 + localStorage 메타 인덱스 이중 백업 + 회원 탈퇴 시 즉시 파기

import { get, set, del } from 'idb-keyval';
import { supabase } from '../supabase';
import { trackUserActivity } from './adminAuditService';

const IDB_KEY_PREFIX = 'wealthyhair_diag_history_v1_';
const LS_META_PREFIX = 'wealthyhair_diag_meta_v1_';
const MAX_HISTORY_ITEMS = 60;

function getScopeId(member) {
  if (!member) return 'guest';
  if (typeof member === 'string') return member;
  return member.id || (member.email ? `email_${member.email.toLowerCase()}` : 'guest');
}

function getIdbKey(scopeId) {
  return `${IDB_KEY_PREFIX}${scopeId}`;
}

function getMetaKey(scopeId) {
  return `${LS_META_PREFIX}${scopeId}`;
}

function notifyHistoryUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('diagnosisHistoryUpdated'));
  }
}

/**
 * 원본 촬영 사진 또는 정적 샘플 경로를 저용량(최대 320px JPEG) 썸네일 DataURL로 압축
 */
export function createCompactThumbnail(imageSrc, maxWidth = 320, quality = 0.74) {
  return new Promise((resolve) => {
    if (!imageSrc || typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const srcW = img.naturalWidth || img.width || 640;
        const srcH = img.naturalHeight || img.height || 480;
        const scale = Math.min(1, maxWidth / Math.max(1, srcW));
        const outW = Math.max(80, Math.round(srcW * scale));
        const outH = Math.max(60, Math.round(srcH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#101014';
        ctx.fillRect(0, 0, outW, outH);
        ctx.drawImage(img, 0, 0, outW, outH);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(imageSrc.startsWith('data:') && imageSrc.length < 90000 ? imageSrc : null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}

function stripHeavyFieldsForLocalMeta(records) {
  return (records || []).map((rec) => ({
    ...rec,
    thumbnails: rec.thumbnails
      ? {
          primary: rec.thumbnails.primary || rec.thumbnails.front || rec.thumbnails.vertex || rec.thumbnails.top || null,
        }
      : {},
  }));
}

async function readRawRecords(scopeId) {
  try {
    const fromIdb = await get(getIdbKey(scopeId));
    if (Array.isArray(fromIdb)) {
      return fromIdb;
    }
  } catch (err) {
    console.warn('[DiagnosisHistory] IndexedDB read fallback to localStorage:', err);
  }

  try {
    const rawMeta = localStorage.getItem(getMetaKey(scopeId));
    if (rawMeta) {
      const parsed = JSON.parse(rawMeta);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

async function writeRawRecords(scopeId, records) {
  const trimmed = (records || []).slice(0, MAX_HISTORY_ITEMS);
  try {
    await set(getIdbKey(scopeId), trimmed);
  } catch (err) {
    console.warn('[DiagnosisHistory] IndexedDB write warning:', err);
  }

  try {
    // localStorage에는 가장 최근 25건의 경량 요약본을 백업
    const lightCopy = stripHeavyFieldsForLocalMeta(trimmed.slice(0, 25));
    localStorage.setItem(getMetaKey(scopeId), JSON.stringify(lightCopy));
  } catch {
    // localStorage 용량 초과 시 메타데이터만 최소 저장
    try {
      const minimal = trimmed.slice(0, 25).map((item) => {
        const copy = { ...item };
        delete copy.thumbnails;
        return copy;
      });
      localStorage.setItem(getMetaKey(scopeId), JSON.stringify(minimal));
    } catch {
      // ignore
    }
  }

  notifyHistoryUpdated();
  return trimmed;
}

/**
 * 비로그인 상태에서 생성된 임시 진단 기록이 있으면 로그인·가입 즉시 해당 회원 계정으로 병합
 */
export async function migrateGuestHistoryToMember(member) {
  const memberScope = getScopeId(member);
  if (!memberScope || memberScope === 'guest') return [];

  const guestRecords = await readRawRecords('guest');
  if (!guestRecords.length) {
    return readRawRecords(memberScope);
  }

  const memberRecords = await readRawRecords(memberScope);
  const existingIds = new Set(memberRecords.map((r) => r.id));

  const migrated = guestRecords
    .filter((r) => !existingIds.has(r.id))
    .map((r) => ({
      ...r,
      memberId: member.id || memberScope,
      memberName: member.name || r.memberName || '회원',
      migratedAt: new Date().toISOString(),
    }));

  const merged = [...migrated, ...memberRecords].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  await writeRawRecords(memberScope, merged);

  try {
    await del(getIdbKey('guest'));
    localStorage.removeItem(getMetaKey('guest'));
  } catch {
    // ignore
  }

  return merged;
}

/**
 * 회원별 진단 기록 목록 조회 ('all' | 'androgenetic' | 'areata')
 */
export async function getDiagnosisHistory(member, categoryFilter = 'all') {
  const scopeId = getScopeId(member);
  const list = await readRawRecords(scopeId);
  const sorted = [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (categoryFilter === 'all') return sorted;
  return sorted.filter((item) => item.category === categoryFilter);
}

/**
 * 남성·여성 안드로겐성 탈모 정밀 진단 결과 개인 기록 저장 (자동 저장 및 메모 업데이트 겸용)
 */
export async function saveAndrogeneticDiagnosisRecord({
  member = null,
  gender = 'male',
  diagnosisData = {},
  images = {},
  memo = '',
  existingRecordId = null,
  isManualSave = false,
}) {
  const scopeId = getScopeId(member);
  const list = await readRawRecords(scopeId);
  const nowIso = new Date().toISOString();

  const [frontThumb, leftThumb, rightThumb, vertexThumb] = await Promise.all([
    createCompactThumbnail(images?.front),
    createCompactThumbnail(images?.left),
    createCompactThumbnail(images?.right),
    createCompactThumbnail(images?.vertex),
  ]);

  const features = diagnosisData?.features || {};
  const effectiveGender = features.gender || gender || 'male';
  const primaryGrade =
    effectiveGender === 'female'
      ? diagnosisData?.ludwig || 'Normal (정상)'
      : diagnosisData?.norwood || 'Stage I (정상)';
  const secondaryGrade =
    effectiveGender === 'female'
      ? diagnosisData?.sinclair || 'Sinclair Stage 1'
      : diagnosisData?.basp || 'L형';

  const recordId = existingRecordId || `diag_aga_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const existingIdx = list.findIndex((item) => item.id === recordId);
  const prevItem = existingIdx >= 0 ? list[existingIdx] : null;

  const record = {
    id: recordId,
    category: 'androgenetic',
    gender: effectiveGender,
    memberId: member?.id || scopeId,
    memberName: member?.name || '비회원(기기저장)',
    createdAt: prevItem?.createdAt || nowIso,
    updatedAt: nowIso,
    title: effectiveGender === 'female' ? '여성형 탈모 AI 정밀 진단' : '남성형 탈모 AI 정밀 진단',
    primaryGrade,
    secondaryGrade,
    basp: diagnosisData?.basp || 'L형',
    sinclair: diagnosisData?.sinclair || null,
    healthScore: diagnosisData?.healthScore ?? 80,
    healthGradeLabel: diagnosisData?.healthGradeLabel || '양호',
    hasHairLoss: Boolean(diagnosisData?.hasHairLoss),
    summary: diagnosisData?.summary || '',
    detailedExplanation: diagnosisData?.detailedExplanation || features.explanation || '',
    metrics: {
      follicularDensityPerCm2: features.follicularDensityPerCm2 ?? 132,
      partingWidthMm: Number((features.partingWidthMm ?? 2.1).toFixed(1)),
      templeRecessionCm: Number((features.templeRecessionCm ?? 0).toFixed(1)),
      frontalRecessionCm: Number((features.frontalRecessionCm ?? 0).toFixed(1)),
      leftRecessionCm: Number((features.leftRecessionCm ?? 0).toFixed(1)),
      rightRecessionCm: Number((features.rightRecessionCm ?? 0).toFixed(1)),
      vertexThinningPercent: Number((features.vertexThinningPercent ?? 10).toFixed(1)),
      scalpErythemaPercent: Number((features.scalpErythemaPercent ?? 8).toFixed(1)),
    },
    thumbnails: {
      primary: frontThumb || vertexThumb || prevItem?.thumbnails?.primary || null,
      front: frontThumb || prevItem?.thumbnails?.front || null,
      left: leftThumb || prevItem?.thumbnails?.left || null,
      right: rightThumb || prevItem?.thumbnails?.right || null,
      vertex: vertexThumb || prevItem?.thumbnails?.vertex || null,
    },
    memo: memo !== undefined ? memo.trim() : prevItem?.memo || '',
    isManualSave: Boolean(isManualSave || prevItem?.isManualSave),
  };

  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = record;
  } else {
    updatedList = [record, ...list];
  }

  await writeRawRecords(scopeId, updatedList);

  if (!prevItem || isManualSave) {
    trackUserActivity({
      eventType: 'DIAGNOSIS_AGA',
      eventLabel: effectiveGender === 'female' ? '여성형 탈모 AI 정밀 진단' : '남성형 탈모 AI 정밀 진단',
      appSection: 'AI 탈모 정밀 진단 (결과 리포트)',
      actionDetail: `${record.primaryGrade} · ${record.secondaryGrade} (모발 건강점수 ${record.healthScore}점 | 모낭밀도 ${record.metrics.follicularDensityPerCm2}개/cm²)`,
      member,
      metadata: {
        recordId: record.id,
        category: 'androgenetic',
        gender: effectiveGender,
        primaryGrade: record.primaryGrade,
        secondaryGrade: record.secondaryGrade,
        healthScore: record.healthScore,
        metrics: record.metrics,
        memo: record.memo,
        thumbnail: record.thumbnails?.primary || null,
      },
    }).catch(() => {});
  }

  // 클라우드 보조 백업 (비차단형 — 네트워크 오류 시 로컬 저장에 영향 없음)
  if (member?.email && (!prevItem || isManualSave)) {
    supabase
      .from('surveys')
      .insert([
        {
          score: Math.max(1, Math.min(5, Math.round((record.healthScore || 80) / 20))),
          feedback: `[PERSONAL_DIAG_AGA] email:${member.email} | score:${record.healthScore} | basp:${record.basp} | memo:${record.memo || '-'}`,
          norwood: record.primaryGrade,
          has_hair_loss: record.hasHairLoss,
          gender: effectiveGender,
          age: features.age ? String(features.age) : member.age ? String(member.age) : null,
        },
      ])
      .then(() => {})
      .catch(() => {});
  }

  return record;
}

/**
 * 원형탈모(SALT) 정밀 진단 결과 개인 기록 저장 (자동 저장 및 캘리퍼스·메모 업데이트 겸용)
 */
export async function saveAreataDiagnosisRecord({
  member = null,
  finalReport = null,
  quadrantImages = {},
  quadrantResults = {},
  activeQuadrant = 'top',
  calibrationMode = 'auto_fov',
  effectiveFovCm = 13.6,
  caliperManual = false,
  memo = '',
  existingRecordId = null,
  isManualSave = false,
}) {
  if (!finalReport) return null;

  const scopeId = getScopeId(member);
  const list = await readRawRecords(scopeId);
  const nowIso = new Date().toISOString();

  const primarySource =
    quadrantResults?.[activeQuadrant]?.annotatedImage ||
    quadrantImages?.[activeQuadrant] ||
    Object.values(quadrantResults || {}).find(Boolean)?.annotatedImage ||
    Object.values(quadrantImages || {}).find(Boolean) ||
    null;

  const [primaryThumb, topThumb, backThumb, leftThumb, rightThumb] = await Promise.all([
    createCompactThumbnail(primarySource),
    createCompactThumbnail(quadrantResults?.top?.annotatedImage || quadrantImages?.top),
    createCompactThumbnail(quadrantResults?.back?.annotatedImage || quadrantImages?.back),
    createCompactThumbnail(quadrantResults?.left?.annotatedImage || quadrantImages?.left),
    createCompactThumbnail(quadrantResults?.right?.annotatedImage || quadrantImages?.right),
  ]);

  const scannedQuadrants = Object.keys(quadrantResults || {}).filter((k) => Boolean(quadrantResults[k]));
  const recordId = existingRecordId || `diag_aa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const existingIdx = list.findIndex((item) => item.id === recordId);
  const prevItem = existingIdx >= 0 ? list[existingIdx] : null;

  const record = {
    id: recordId,
    category: 'areata',
    gender: member?.gender || 'male',
    memberId: member?.id || scopeId,
    memberName: member?.name || '비회원(기기저장)',
    createdAt: prevItem?.createdAt || nowIso,
    updatedAt: nowIso,
    title: '원형탈모(SALT) 정밀 진단',
    primaryGrade: finalReport.saltGrade || 'S0 (정상)',
    secondaryGrade: finalReport.clinicalPattern || '단발성 원형탈모',
    saltScore: finalReport.saltScore ?? 0,
    severityLabel: finalReport.severityLabel || '정상',
    severityColor: finalReport.severityColor || '#D4AF37',
    summary: `${finalReport.saltGrade} · ${finalReport.clinicalPattern} (최대 직경 Ø${finalReport.maxDiameterCm}cm, 총 면적 ${finalReport.totalAreaCm2}cm²)`,
    detailedExplanation: (finalReport.treatmentRecommendations || []).join('\n'),
    metrics: {
      saltScore: finalReport.saltScore ?? 0,
      totalPatchCount: finalReport.totalPatchCount ?? 0,
      maxDiameterCm: finalReport.maxDiameterCm ?? 0,
      totalAreaCm2: finalReport.totalAreaCm2 ?? 0,
      calibrationMode,
      effectiveFovCm,
      caliperManual: Boolean(caliperManual),
      scannedQuadrants,
    },
    patches: (finalReport.allPatches || []).slice(0, 6),
    riskFactors: finalReport.riskFactors || [],
    treatmentRecommendations: finalReport.treatmentRecommendations || [],
    thumbnails: {
      primary: primaryThumb || prevItem?.thumbnails?.primary || null,
      top: topThumb || prevItem?.thumbnails?.top || null,
      back: backThumb || prevItem?.thumbnails?.back || null,
      left: leftThumb || prevItem?.thumbnails?.left || null,
      right: rightThumb || prevItem?.thumbnails?.right || null,
    },
    memo: memo !== undefined ? memo.trim() : prevItem?.memo || '',
    isManualSave: Boolean(isManualSave || prevItem?.isManualSave),
  };

  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = record;
  } else {
    updatedList = [record, ...list];
  }

  await writeRawRecords(scopeId, updatedList);

  if (!prevItem || isManualSave) {
    trackUserActivity({
      eventType: 'DIAGNOSIS_AREATA',
      eventLabel: '원형탈모(SALT) 정밀 진단',
      appSection: '원형탈모(SALT) 진단 탭',
      actionDetail: `${record.primaryGrade} · ${record.secondaryGrade} (SALT ${record.saltScore}점 | 최대 직경 Ø${record.metrics.maxDiameterCm}cm, 총 면적 ${record.metrics.totalAreaCm2}cm²)`,
      member,
      metadata: {
        recordId: record.id,
        category: 'areata',
        primaryGrade: record.primaryGrade,
        secondaryGrade: record.secondaryGrade,
        saltScore: record.saltScore,
        metrics: record.metrics,
        memo: record.memo,
        thumbnail: record.thumbnails?.primary || null,
      },
    }).catch(() => {});
  }

  if (member?.email && (!prevItem || isManualSave)) {
    supabase
      .from('surveys')
      .insert([
        {
          score: Math.max(1, Math.min(5, 5 - Math.floor((record.saltScore || 0) / 25))),
          feedback: `[PERSONAL_DIAG_SALT] email:${member.email} | salt:${record.saltScore} | maxDiam:${record.metrics.maxDiameterCm}cm | memo:${record.memo || '-'}`,
          norwood: `SALT_${record.primaryGrade.split(' ')[0]}`,
          has_hair_loss: (record.metrics.totalPatchCount || 0) > 0,
          gender: member.gender || null,
          age: member.age ? String(member.age) : null,
        },
      ])
      .then(() => {})
      .catch(() => {});
  }

  return record;
}

/**
 * 저장된 특정 진단 기록의 개인 메모 수정
 */
export async function updateDiagnosisRecordMemo(recordId, memo, member = null) {
  const scopeId = getScopeId(member);
  const list = await readRawRecords(scopeId);
  const idx = list.findIndex((item) => item.id === recordId);
  if (idx < 0) return null;

  const updatedRecord = {
    ...list[idx],
    memo: (memo || '').trim(),
    isManualSave: true,
    updatedAt: new Date().toISOString(),
  };

  const next = [...list];
  next[idx] = updatedRecord;
  await writeRawRecords(scopeId, next);
  return updatedRecord;
}

/**
 * 특정 개인 진단 기록 삭제
 */
export async function deleteDiagnosisRecord(recordId, member = null) {
  const scopeId = getScopeId(member);
  const list = await readRawRecords(scopeId);
  const next = list.filter((item) => item.id !== recordId);
  await writeRawRecords(scopeId, next);
  return next;
}

/**
 * 회원 탈퇴 시 해당 회원의 모든 개인 진단 기록 및 썸네일 영구 파기
 */
export async function clearMemberDiagnosisHistory(memberId) {
  if (!memberId) return;
  try {
    await del(getIdbKey(memberId));
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(getMetaKey(memberId));
  } catch {
    // ignore
  }
  notifyHistoryUpdated();
}
