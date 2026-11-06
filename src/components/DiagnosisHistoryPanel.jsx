// src/components/DiagnosisHistoryPanel.jsx
// 회원별 개인 탈모 진단 기록(남·여성 탈모 & 원형탈모 SALT) 열람 · 경과 비교 · 개인 메모 편집 · 삭제 패널

import { useState, useEffect, useCallback } from 'react';
import {
  History,
  ChevronDown,
  ChevronUp,
  Trash2,
  Save,
  TrendingUp,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  getDiagnosisHistory,
  updateDiagnosisRecordMemo,
  deleteDiagnosisRecord,
} from '../utils/diagnosisHistoryService';

function formatKoreanDateTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
  } catch {
    return isoStr;
  }
}

const DiagnosisHistoryPanel = ({
  user = null,
  initialCategory = 'all',
  allowCategorySwitch = true,
  highlightRecordId = null,
  onRequireAuth = null,
  title = '📋 내 개인 탈모 진단 기록 보관함',
}) => {
  const [records, setRecords] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [expandedId, setExpandedId] = useState(highlightRecordId || null);
  const [memoDrafts, setMemoDrafts] = useState({});
  const [savedNoticeId, setSavedNoticeId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadHistory = useCallback(async () => {
    const list = await getDiagnosisHistory(user, 'all');
    setRecords(list);
    setMemoDrafts((prev) => {
      const next = { ...prev };
      list.forEach((item) => {
        if (next[item.id] === undefined) {
          next[item.id] = item.memo || '';
        }
      });
      return next;
    });
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
    const onUpdated = () => {
      loadHistory();
    };
    window.addEventListener('diagnosisHistoryUpdated', onUpdated);
    window.addEventListener('authChanged', onUpdated);
    return () => {
      window.removeEventListener('diagnosisHistoryUpdated', onUpdated);
      window.removeEventListener('authChanged', onUpdated);
    };
  }, [loadHistory]);

  const filteredRecords =
    categoryFilter === 'all'
      ? records
      : records.filter((item) => item.category === categoryFilter);

  const agaRecords = records.filter((r) => r.category === 'androgenetic');
  const areataRecords = records.filter((r) => r.category === 'areata');

  // 최근 2회 경과 비교 데이터 산출
  const renderProgressionInsight = () => {
    if (categoryFilter !== 'areata' && agaRecords.length >= 2) {
      const latest = agaRecords[0];
      const prev = agaRecords[1];
      const scoreDiff = (latest.healthScore ?? 0) - (prev.healthScore ?? 0);
      const densityDiff =
        (latest.metrics?.follicularDensityPerCm2 ?? 0) -
        (prev.metrics?.follicularDensityPerCm2 ?? 0);
      return (
        <div
          style={{
            background: 'rgba(129, 199, 132, 0.09)',
            border: '1px solid rgba(129, 199, 132, 0.32)',
            borderRadius: '10px',
            padding: '9px 11px',
            marginBottom: '10px',
            fontSize: '0.73rem',
            color: '#e0f2f1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TrendingUp size={15} color="#81C784" style={{ flexShrink: 0 }} />
          <div style={{ lineHeight: 1.45 }}>
            <strong style={{ color: '#81C784' }}>직전 남·여 탈모 진단 대비 변화:</strong>{' '}
            모발 건강 점수{' '}
            <strong style={{ color: scoreDiff >= 0 ? '#81C784' : '#FF8A80' }}>
              {scoreDiff >= 0 ? `+${scoreDiff}점` : `${scoreDiff}점`}
            </strong>{' '}
            · 모낭 밀도{' '}
            <strong style={{ color: densityDiff >= 0 ? '#D4AF37' : '#FF8A80' }}>
              {densityDiff >= 0 ? `+${densityDiff}` : `${densityDiff}`}모/cm²
            </strong>
          </div>
        </div>
      );
    }

    if (categoryFilter !== 'androgenetic' && areataRecords.length >= 2) {
      const latest = areataRecords[0];
      const prev = areataRecords[1];
      const diamDiff = Number(
        ((latest.metrics?.maxDiameterCm ?? 0) - (prev.metrics?.maxDiameterCm ?? 0)).toFixed(1)
      );
      return (
        <div
          style={{
            background: 'rgba(100, 181, 246, 0.09)',
            border: '1px solid rgba(100, 181, 246, 0.32)',
            borderRadius: '10px',
            padding: '9px 11px',
            marginBottom: '10px',
            fontSize: '0.73rem',
            color: '#e3f2fd',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TrendingUp size={15} color="#64B5F6" style={{ flexShrink: 0 }} />
          <div style={{ lineHeight: 1.45 }}>
            <strong style={{ color: '#64B5F6' }}>직전 원형탈모(SALT) 진단 대비 변화:</strong>{' '}
            최대 병변 직경{' '}
            <strong style={{ color: diamDiff <= 0 ? '#81C784' : '#FF8A80' }}>
              {diamDiff > 0 ? `+${diamDiff}cm` : `${diamDiff}cm`}
            </strong>{' '}
            (낮아질수록 호전)
          </div>
        </div>
      );
    }

    return null;
  };

  const handleSaveMemo = async (recordId) => {
    const draft = memoDrafts[recordId] ?? '';
    await updateDiagnosisRecordMemo(recordId, draft, user);
    setSavedNoticeId(recordId);
    setTimeout(() => {
      setSavedNoticeId((curr) => (curr === recordId ? null : curr));
    }, 2200);
  };

  const handleDelete = async (recordId) => {
    await deleteDiagnosisRecord(recordId, user);
    setConfirmDeleteId(null);
    if (expandedId === recordId) setExpandedId(null);
  };

  return (
    <section
      aria-label="내 개인 탈모 진단 기록 보관함"
      style={{
        background: 'linear-gradient(145deg, rgba(20, 20, 26, 0.98), rgba(12, 12, 16, 0.98))',
        border: '1px solid rgba(212, 175, 55, 0.36)',
        borderRadius: '14px',
        padding: '16px 14px',
        marginTop: '14px',
        color: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <History size={17} color="#D4AF37" />
          <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#f5f0e8' }}>
            {title}
          </h3>
        </div>
        <span
          style={{
            fontSize: '0.68rem',
            padding: '3px 9px',
            borderRadius: '999px',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            color: '#D4AF37',
            fontWeight: 800,
          }}
        >
          {user ? `${user.name}님 기록 ${records.length}건` : `임시 저장 ${records.length}건`}
        </span>
      </div>

      {allowCategorySwitch && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            marginBottom: '11px',
          }}
        >
          {[
            { id: 'all', label: `전체 (${records.length})` },
            { id: 'androgenetic', label: `남·여 탈모 (${agaRecords.length})` },
            { id: 'areata', label: `원형탈모 (${areataRecords.length})` },
          ].map((tab) => {
            const active = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                style={{
                  padding: '7px 6px',
                  borderRadius: '8px',
                  border: active ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255,255,255,0.03)',
                  color: active ? '#D4AF37' : '#aaa',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {renderProgressionInsight()}

      {filteredRecords.length === 0 ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px dashed rgba(212, 175, 55, 0.25)',
            borderRadius: '10px',
            padding: '16px 12px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.77rem', color: '#bbb', lineHeight: 1.55 }}>
            {user
              ? '아직 저장된 개인 탈모 진단 기록이 없습니다. 남성·여성 탈모 스캔 또는 원형탈모(SALT) 진단을 완료하면 이곳에 사진·수치·경과 메모가 자동으로 안전하게 보관됩니다.'
              : '회원가입·로그인 후 진단을 진행하시면 촬영 썸네일과 정밀 수치(점수·밀도·직경)가 회원 전용 보관함에 자동 저장됩니다.'}
          </p>
          {!user && onRequireAuth && (
            <button
              type="button"
              onClick={() =>
                onRequireAuth({
                  mode: 'login',
                  featureName: '개인 탈모 진단 기록 저장 및 열람',
                })
              }
              style={{
                marginTop: '10px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #D4AF37',
                background: 'rgba(212, 175, 55, 0.14)',
                color: '#D4AF37',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Lock size={13} /> 내 계정 로그인·가입하여 기록 연동하기
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {filteredRecords.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const isAreata = rec.category === 'areata';
            const thumbSrc = rec.thumbnails?.primary || null;
            const memoInputId = `diag-memo-${rec.id}`;

            return (
              <div
                key={rec.id}
                style={{
                  background: '#16161c',
                  border:
                    rec.id === highlightRecordId
                      ? '1.5px solid #D4AF37'
                      : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '11px',
                  overflow: 'hidden',
                }}
              >
                {/* 요약 헤더 행 */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  aria-expanded={isExpanded}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '11px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {thumbSrc ? (
                    <img
                      src={thumbSrc}
                      alt={`${rec.title} 대표 스캔 썸네일`}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '1px solid rgba(212, 175, 55, 0.45)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '8px',
                        background: 'rgba(212, 175, 55, 0.12)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#D4AF37',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={16} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                        marginBottom: '2px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.63rem',
                          padding: '1px 6px',
                          borderRadius: '5px',
                          fontWeight: 800,
                          background: isAreata
                            ? 'rgba(0, 230, 118, 0.14)'
                            : rec.gender === 'female'
                            ? 'rgba(244, 143, 177, 0.18)'
                            : 'rgba(212, 175, 55, 0.18)',
                          color: isAreata
                            ? '#00E676'
                            : rec.gender === 'female'
                            ? '#F48FB1'
                            : '#D4AF37',
                        }}
                      >
                        {isAreata
                          ? '원형탈모 SALT'
                          : rec.gender === 'female'
                          ? '여성 탈모'
                          : '남성 탈모'}
                      </span>
                      <span style={{ fontSize: '0.66rem', color: '#999' }}>
                        {formatKoreanDateTime(rec.createdAt)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#f5f0e8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {rec.primaryGrade}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '2px' }}>
                      {isAreata
                        ? `SALT ${rec.saltScore ?? 0}점 · 최대 Ø${rec.metrics?.maxDiameterCm ?? 0}cm (${rec.metrics?.totalAreaCm2 ?? 0}cm²)`
                        : `건강점수 ${rec.healthScore ?? 80}점 · 밀도 ${rec.metrics?.follicularDensityPerCm2 ?? 132}모/cm² · BASP ${rec.basp || '-'}`}
                    </div>

                    {rec.memo && (
                      <div
                        style={{
                          fontSize: '0.67rem',
                          color: '#E5C158',
                          marginTop: '3px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        📝 {rec.memo}
                      </div>
                    )}
                  </div>

                  <div style={{ color: '#D4AF37', flexShrink: 0 }}>
                    {isExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                  </div>
                </button>

                {/* 상세 열람 & 개인 메모 편집 영역 */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '12px',
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      background: '#111116',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {/* 저장된 촬영 각도별 썸네일 갤러리 */}
                    {(() => {
                      const angleEntries = isAreata
                        ? [
                            { key: 'top', label: '정수리(40%)' },
                            { key: 'back', label: '후두부(24%)' },
                            { key: 'left', label: '좌측(18%)' },
                            { key: 'right', label: '우측(18%)' },
                          ].filter((a) => Boolean(rec.thumbnails?.[a.key]))
                        : [
                            { key: 'front', label: '정면' },
                            { key: 'left', label: '좌측 M자' },
                            { key: 'right', label: '우측 M자' },
                            { key: 'vertex', label: '정수리·가르마' },
                          ].filter((a) => Boolean(rec.thumbnails?.[a.key]));

                      if (angleEntries.length === 0) return null;
                      return (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${Math.min(4, angleEntries.length)}, 1fr)`,
                            gap: '6px',
                          }}
                        >
                          {angleEntries.map((ang) => (
                            <div
                              key={ang.key}
                              style={{
                                background: '#191920',
                                border: '1px solid #2b2b33',
                                borderRadius: '7px',
                                overflow: 'hidden',
                                textAlign: 'center',
                              }}
                            >
                              <img
                                src={rec.thumbnails[ang.key]}
                                alt={`${rec.title} ${ang.label}`}
                                style={{
                                  width: '100%',
                                  aspectRatio: '4 / 3',
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                              />
                              <span
                                style={{
                                  display: 'block',
                                  fontSize: '0.63rem',
                                  color: '#ccc',
                                  padding: '3px 2px',
                                  fontWeight: 700,
                                }}
                              >
                                {ang.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* 핵심 정밀 계측 수치 표 */}
                    {isAreata ? (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '6px',
                          fontSize: '0.71rem',
                        }}
                      >
                        <div style={{ background: '#181820', padding: '8px', borderRadius: '7px' }}>
                          <div style={{ color: '#999', fontSize: '0.64rem' }}>SALT 점수 (↓ 낮을수록 좋음)</div>
                          <div style={{ fontWeight: 800, color: '#00E676', marginTop: '2px' }}>
                            {rec.saltScore ?? 0}점 / 100
                          </div>
                        </div>
                        <div style={{ background: '#181820', padding: '8px', borderRadius: '7px' }}>
                          <div style={{ color: '#999', fontSize: '0.64rem' }}>최대 직경 · 총 탈모 면적</div>
                          <div style={{ fontWeight: 800, color: '#D4AF37', marginTop: '2px' }}>
                            Ø {rec.metrics?.maxDiameterCm ?? 0}cm · {rec.metrics?.totalAreaCm2 ?? 0}cm²
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '6px',
                          fontSize: '0.71rem',
                        }}
                      >
                        <div style={{ background: '#181820', padding: '8px', borderRadius: '7px' }}>
                          <div style={{ color: '#999', fontSize: '0.64rem' }}>종합 건강 점수 (↑ 높을수록 좋음)</div>
                          <div style={{ fontWeight: 800, color: '#81C784', marginTop: '2px' }}>
                            {rec.healthScore}점 / 100 ({rec.healthGradeLabel})
                          </div>
                        </div>
                        <div style={{ background: '#181820', padding: '8px', borderRadius: '7px' }}>
                          <div style={{ color: '#999', fontSize: '0.64rem' }}>모낭 밀도 · 가르마 폭</div>
                          <div style={{ fontWeight: 800, color: '#D4AF37', marginTop: '2px' }}>
                            {rec.metrics?.follicularDensityPerCm2}모/cm² · {rec.metrics?.partingWidthMm}mm
                          </div>
                        </div>
                        <div style={{ background: '#181820', padding: '8px', borderRadius: '7px' }}>
                          <div style={{ color: '#999', fontSize: '0.64rem' }}>전두부 · M자 후퇴 (↓ 낮을수록 좋음)</div>
                          <div style={{ fontWeight: 800, color: '#f5f0e8', marginTop: '2px' }}>
                            전두 {rec.metrics?.frontalRecessionCm}cm · 측두 {rec.metrics?.templeRecessionCm}cm
                          </div>
                        </div>
                        <div style={{ background: '#181820', padding: '8px', borderRadius: '7px' }}>
                          <div style={{ color: '#999', fontSize: '0.64rem' }}>두피 홍반·열감 비율</div>
                          <div style={{ fontWeight: 800, color: '#64B5F6', marginTop: '2px' }}>
                            {rec.metrics?.scalpErythemaPercent}%
                          </div>
                        </div>
                      </div>
                    )}

                    {rec.summary && (
                      <div
                        style={{
                          background: 'rgba(212, 175, 55, 0.08)',
                          border: '1px solid rgba(212, 175, 55, 0.25)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '0.72rem',
                          color: '#ddd',
                          lineHeight: 1.5,
                        }}
                      >
                        {rec.summary}
                      </div>
                    )}

                    {/* 개인 기록 메모 작성/수정 */}
                    <div>
                      <label
                        htmlFor={memoInputId}
                        style={{
                          display: 'block',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#D4AF37',
                          marginBottom: '4px',
                        }}
                      >
                        📝 내 개인 경과 메모 (복용 중인 약, 치료 주차, 두피 컨디션 기록)
                      </label>
                      <textarea
                        id={memoInputId}
                        name={`memo_${rec.id}`}
                        rows={2}
                        placeholder="예: 피나스테리드 1mg 복용 4주차, 정수리 열감 완화됨"
                        value={memoDrafts[rec.id] ?? ''}
                        onChange={(e) =>
                          setMemoDrafts((prev) => ({ ...prev, [rec.id]: e.target.value }))
                        }
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '7px',
                          border: '1px solid #333',
                          background: '#181820',
                          color: '#fff',
                          fontSize: '0.76rem',
                          resize: 'vertical',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSaveMemo(rec.id)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '7px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #D4AF37, #B68D2C)',
                          color: '#000',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                        }}
                      >
                        {savedNoticeId === rec.id ? (
                          <>
                            <CheckCircle2 size={14} /> 메모 저장 완료!
                          </>
                        ) : (
                          <>
                            <Save size={14} /> 개인 메모 저장
                          </>
                        )}
                      </button>

                      {confirmDeleteId === rec.id ? (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            type="button"
                            onClick={() => handleDelete(rec.id)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '7px',
                              border: '1px solid #ff5252',
                              background: '#ff5252',
                              color: '#fff',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            삭제 확정
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '7px',
                              border: '1px solid #444',
                              background: '#222',
                              color: '#ccc',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                            }}
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(rec.id)}
                          aria-label={`${rec.title} 기록 삭제`}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '7px',
                            border: '1px solid rgba(255, 82, 82, 0.4)',
                            background: 'rgba(255, 82, 82, 0.1)',
                            color: '#ff8a80',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Trash2 size={13} /> 기록 삭제
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default DiagnosisHistoryPanel;
