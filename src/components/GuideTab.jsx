import { useState, useMemo } from 'react';
import {
  medicalData,
  DRUG_INTERACTIONS_DATA,
  DRUG_SIDE_EFFECTS_DATA,
  CONTRAINDICATED_FOODS_DATA,
} from '../data/medicalGuideData';
import './GuideTab.css';
import './MedicationTab.css';

const SUB_TABS = [
  { id: 'interactions', label: '병용금기 양약' },
  { id: 'sideEffects', label: '부작용 대처' },
  { id: 'badFoods', label: '금기 식품 10선' },
  { id: 'drugs', label: '탈모약 총람' },
];

const BADGE_STYLE = {
  danger: { bg: 'rgba(255, 82, 82, 0.16)', border: 'rgba(255, 82, 82, 0.5)', color: '#FF6B6B' },
  warning: { bg: 'rgba(255, 183, 77, 0.16)', border: 'rgba(255, 183, 77, 0.5)', color: '#FFB74D' },
  caution: { bg: 'rgba(100, 181, 246, 0.15)', border: 'rgba(100, 181, 246, 0.45)', color: '#64B5F6' },
  safe: { bg: 'rgba(129, 199, 132, 0.16)', border: 'rgba(129, 199, 132, 0.48)', color: '#81C784' },
};

const SIDE_EFFECT_FILTERS = ['전체', '피나스테리드', '두타스테리드', '미녹시딜', '스피로노락톤'];

const FOOD_GRADE_FILTERS = [
  { id: 'all', label: '전체 (10종)' },
  { id: 'danger', label: '절대금기 · 고위험' },
  { id: 'warning', label: '중등도 위험' },
  { id: 'caution', label: '섭취 주의' },
];

const splitExamples = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const GuideTab = ({
  initialSection = 'interactions',
  onOpenDiagnosis = null,
  onOpenSasang = null,
}) => {
  const [activeSubTab, setActiveSubTab] = useState(
    SUB_TABS.some((t) => t.id === initialSection) ? initialSection : 'interactions'
  );
  const [activeAccordion, setActiveAccordion] = useState(0);

  // TAB 1: 병용금기 양약 상태
  const [selectedDrugKey, setSelectedDrugKey] = useState(
    DRUG_INTERACTIONS_DATA[0]?.drugKey || 'finasteride'
  );
  const [interactionSearch, setInteractionSearch] = useState('');

  // TAB 2: 부작용 대처 상태
  const [sideEffectDrugFilter, setSideEffectDrugFilter] = useState('전체');
  const [expandedSideEffectId, setExpandedSideEffectId] = useState(
    DRUG_SIDE_EFFECTS_DATA[0]?.id || null
  );

  // TAB 3: 금기 식품 10선 상태
  const [foodGradeFilter, setFoodGradeFilter] = useState('all');
  const [expandedFoodId, setExpandedFoodId] = useState(
    CONTRAINDICATED_FOODS_DATA[0]?.id || null
  );

  const currentIngredient = useMemo(
    () =>
      DRUG_INTERACTIONS_DATA.find((d) => d.drugKey === selectedDrugKey) ||
      DRUG_INTERACTIONS_DATA[0],
    [selectedDrugKey]
  );

  // 검색어 입력 시 전체 탈모약 성분에서 통합 검색, 미입력 시 선택된 성분의 병용금기 목록 표시
  const filteredInteractions = useMemo(() => {
    const q = interactionSearch.trim().toLowerCase();
    if (!q) {
      return (currentIngredient?.interactions || []).map((item) => ({
        ...item,
        sourceDrugName: currentIngredient.drugName,
      }));
    }

    const matches = [];
    DRUG_INTERACTIONS_DATA.forEach((group) => {
      (group.interactions || []).forEach((item) => {
        const haystack = [
          group.drugName,
          group.brandExamples,
          item.targetDrug,
          item.targetIngredients,
          item.category,
          item.mechanism,
          item.actionGuide,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (haystack.includes(q)) {
          matches.push({
            ...item,
            sourceDrugName: group.drugName,
          });
        }
      });
    });
    return matches;
  }, [currentIngredient, interactionSearch]);

  const filteredSideEffects = useMemo(() => {
    if (sideEffectDrugFilter === '전체') return DRUG_SIDE_EFFECTS_DATA;
    return DRUG_SIDE_EFFECTS_DATA.filter((se) =>
      (se.relatedDrugs || []).some((d) => d.includes(sideEffectDrugFilter))
    );
  }, [sideEffectDrugFilter]);

  const filteredBadFoods = useMemo(() => {
    if (foodGradeFilter === 'all') return CONTRAINDICATED_FOODS_DATA;
    return CONTRAINDICATED_FOODS_DATA.filter((f) => f.dangerBadge === foodGradeFilter);
  }, [foodGradeFilter]);

  return (
    <div className="tab-content fade-in guide-tab" style={{ padding: 0, colorScheme: 'dark' }}>
      <div className="tab-banner">
        <img
          src="/assets/banners/banner_safety.jpg"
          alt="금기 및 약학 안전 백과 배너"
          className="tab-banner-img"
          onError={(e) => {
            e.currentTarget.src = '/assets/banners/banner_guide.jpg';
          }}
        />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">금기 · 약학 백과</h1>
          <p className="tab-banner-sub">병용금기 양약 · 부작용 대처 · 금기 식품 핵심 정리</p>
        </div>
      </div>

      {/* Sub Navigation Pills */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
          padding: '10px 14px',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(10, 10, 12, 0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.16)',
        }}
      >
        {SUB_TABS.map((t) => {
          const active = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => setActiveSubTab(t.id)}
              style={{
                padding: '9px 4px',
                borderRadius: '8px',
                border: active ? '1.5px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                background: active ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255,255,255,0.03)',
                color: active ? '#D4AF37' : '#aaa',
                fontSize: '0.73rem',
                fontWeight: active ? 800 : 500,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '14px 14px 90px' }} data-testid="guide-tab-body">
        {/* TAB 1: 병용금기 양약 */}
        {activeSubTab === 'interactions' && (
          <div className="fade-in" data-testid="guide-subtab-interactions">
            <h2 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#D4AF37', margin: '0 0 8px' }}>
              복용 중인 탈모약 성분별 병용금기 · 주의 양약
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {DRUG_INTERACTIONS_DATA.map((item) => {
                const isSel = item.drugKey === selectedDrugKey && !interactionSearch.trim();
                const interactionCount = Array.isArray(item.interactions) ? item.interactions.length : 0;
                return (
                  <button
                    key={item.drugKey}
                    type="button"
                    aria-pressed={isSel}
                    onClick={() => {
                      setSelectedDrugKey(item.drugKey);
                      setInteractionSearch('');
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: isSel ? '1.5px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                      background: isSel ? 'rgba(212, 175, 55, 0.14)' : 'rgba(255,255,255,0.025)',
                      color: '#f5f0e8',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.81rem', fontWeight: 800, color: isSel ? '#D4AF37' : '#eee' }}>
                        {item.drugName}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#999', marginTop: '2px', lineHeight: 1.35 }}>
                        {Array.isArray(item.brandExamples) ? item.brandExamples.join(', ') : item.brandExamples}
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: '0.68rem',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        background: isSel ? '#D4AF37' : 'rgba(255,255,255,0.08)',
                        color: isSel ? '#000' : '#aaa',
                        fontWeight: 700,
                      }}
                    >
                      주의 {interactionCount}종
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label
                htmlFor="guide-interaction-search"
                style={{ display: 'block', fontSize: '0.71rem', color: '#bbb', fontWeight: 700, marginBottom: '4px' }}
              >
                🔍 전체 탈모약 대비 양약 · 질환 통합 검색
              </label>
              <input
                id="guide-interaction-search"
                type="search"
                value={interactionSearch}
                onChange={(e) => setInteractionSearch(e.target.value)}
                placeholder="양약 이름 또는 질환 검색 (예: 하루날, 혈압약, 진통제, 무좀약)"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  background: '#111216',
                  color: '#f5f0e8',
                  fontSize: '0.78rem',
                }}
              />
            </div>

            {!interactionSearch.trim() && currentIngredient?.metabolismInfo && (
              <div
                style={{
                  fontSize: '0.71rem',
                  color: '#cfc6b0',
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.24)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  marginBottom: '10px',
                  lineHeight: 1.45,
                }}
              >
                🧬 <strong>대사 경로:</strong> {currentIngredient.metabolismInfo}
              </div>
            )}

            {filteredInteractions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#999',
                  fontSize: '0.78rem',
                }}
              >
                검색하신 약물과 일치하는 병용금기 항목이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredInteractions.map((drug, i) => {
                  const badge = BADGE_STYLE[drug.severityCode] || BADGE_STYLE.warning;
                  const ingredientChips = splitExamples(drug.targetIngredients);
                  return (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(20, 20, 24, 0.95)',
                        border: `1px solid ${badge.border}`,
                        borderRadius: '10px',
                        padding: '12px',
                      }}
                    >
                      {interactionSearch.trim() && (
                        <div style={{ fontSize: '0.66rem', color: '#D4AF37', fontWeight: 800, marginBottom: '4px' }}>
                          대상 탈모약: {drug.sourceDrugName}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                        <h3 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 800, color: '#f5f0e8', lineHeight: 1.35 }}>
                          {drug.targetDrug}
                        </h3>
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                          }}
                        >
                          {drug.severity}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                        {drug.category && (
                          <span
                            style={{
                              fontSize: '0.66rem',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: 'rgba(212, 175, 55, 0.14)',
                              color: '#D4AF37',
                              fontWeight: 700,
                            }}
                          >
                            {drug.category}
                          </span>
                        )}
                        {ingredientChips.map((ex, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: 'rgba(255,255,255,0.06)',
                              color: '#ddd',
                            }}
                          >
                            💊 {ex}
                          </span>
                        ))}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: '#ccc', lineHeight: 1.5, marginBottom: '7px' }}>
                        {drug.mechanism}
                      </div>

                      <div
                        style={{
                          fontSize: '0.73rem',
                          color: '#81C784',
                          lineHeight: 1.45,
                          padding: '7px 9px',
                          borderRadius: '6px',
                          background: 'rgba(76, 175, 80, 0.08)',
                        }}
                      >
                        <strong>✅ 복약 지침:</strong> {drug.actionGuide}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 부작용 대처 */}
        {activeSubTab === 'sideEffects' && (
          <div className="fade-in" data-testid="guide-subtab-sideEffects">
            <h2 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#D4AF37', margin: '0 0 8px' }}>
              탈모약 부작용 증상별 기전 및 의학적 대처 프로토콜
            </h2>

            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '10px' }}>
              {SIDE_EFFECT_FILTERS.map((flt) => {
                const active = sideEffectDrugFilter === flt;
                return (
                  <button
                    key={flt}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSideEffectDrugFilter(flt)}
                    style={{
                      flexShrink: 0,
                      padding: '6px 11px',
                      borderRadius: '999px',
                      border: active ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                      background: active ? '#D4AF37' : 'rgba(255,255,255,0.04)',
                      color: active ? '#000' : '#ccc',
                      fontSize: '0.72rem',
                      fontWeight: active ? 800 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {flt}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredSideEffects.map((se) => {
                const isOpen = expandedSideEffectId === se.id;
                const badge = BADGE_STYLE[se.riskBadge] || BADGE_STYLE.caution;
                return (
                  <div
                    key={se.id}
                    style={{
                      background: 'rgba(18, 18, 22, 0.96)',
                      border: isOpen ? `1px solid ${badge.border}` : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setExpandedSideEffectId(isOpen ? null : se.id)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: '#f5f0e8',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '5px' }}>
                          <span
                            style={{
                              fontSize: '0.64rem',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: 'rgba(212, 175, 55, 0.16)',
                              color: '#D4AF37',
                              fontWeight: 800,
                            }}
                          >
                            {se.system}
                          </span>
                          <span
                            style={{
                              fontSize: '0.64rem',
                              padding: '2px 7px',
                              borderRadius: '999px',
                              background: badge.bg,
                              border: `1px solid ${badge.border}`,
                              color: badge.color,
                              fontWeight: 700,
                            }}
                          >
                            {se.riskLevel}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.83rem', fontWeight: 800, color: '#fff', lineHeight: 1.38, marginBottom: '6px' }}>
                          {se.title}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(se.relatedDrugs || []).map((dr, dIdx) => (
                            <span
                              key={dIdx}
                              style={{
                                fontSize: '0.65rem',
                                padding: '2px 6px',
                                borderRadius: '5px',
                                background: 'rgba(255,255,255,0.06)',
                                color: '#bbb',
                              }}
                            >
                              {dr}
                            </span>
                          ))}
                        </div>
                      </div>

                      <span style={{ color: '#D4AF37', fontSize: '1rem', fontWeight: 800, paddingTop: '2px' }} aria-hidden="true">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>

                    {isOpen && (
                      <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ marginTop: '9px', fontSize: '0.72rem', color: '#FFB74D', fontWeight: 700, marginBottom: '3px' }}>
                          • 발현 빈도: {se.incidence}
                        </div>
                        {se.onsetTimeline && (
                          <div style={{ fontSize: '0.71rem', color: '#9ec5fe', fontWeight: 600, marginBottom: '7px' }}>
                            • 발현 시기: {se.onsetTimeline}
                          </div>
                        )}
                        <div style={{ fontSize: '0.74rem', color: '#ccc', lineHeight: 1.52, marginBottom: '8px' }}>
                          {se.mechanism}
                        </div>
                        <div
                          style={{
                            fontSize: '0.73rem',
                            color: '#81C784',
                            lineHeight: 1.5,
                            background: 'rgba(76, 175, 80, 0.08)',
                            padding: '9px 10px',
                            borderRadius: '7px',
                          }}
                        >
                          <strong>✅ 임상 대처법:</strong> {se.copingStrategy}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: 금기 식품 10선 */}
        {activeSubTab === 'badFoods' && (
          <div className="fade-in" data-testid="guide-subtab-badFoods">
            <h2 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#D4AF37', margin: '0 0 8px' }}>
              탈모 악화 · 모낭 독성 주의 식품 10선 (학술 근거)
            </h2>

            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '10px' }}>
              {FOOD_GRADE_FILTERS.map((flt) => {
                const active = foodGradeFilter === flt.id;
                return (
                  <button
                    key={flt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFoodGradeFilter(flt.id)}
                    style={{
                      flexShrink: 0,
                      padding: '6px 11px',
                      borderRadius: '999px',
                      border: active ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                      background: active ? '#D4AF37' : 'rgba(255,255,255,0.04)',
                      color: active ? '#000' : '#ccc',
                      fontSize: '0.72rem',
                      fontWeight: active ? 800 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {flt.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredBadFoods.map((food) => {
                const badge = BADGE_STYLE[food.dangerBadge] || BADGE_STYLE.warning;
                const isExpanded = expandedFoodId === food.id;
                const exampleItems = splitExamples(food.examples);
                return (
                  <div
                    key={food.id}
                    style={{
                      background: 'rgba(18, 18, 22, 0.96)',
                      border: isExpanded ? `1px solid ${badge.border}` : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedFoodId(isExpanded ? null : food.id)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: '#f5f0e8',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '0.84rem', color: '#f5f0e8', fontWeight: 800, lineHeight: 1.38 }}>
                          {food.name}
                        </h3>
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                          }}
                        >
                          {food.dangerLevel}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '7px 0' }}>
                        {exampleItems.map((fItem, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: 'rgba(255, 82, 82, 0.09)',
                              color: '#ffcdd2',
                            }}
                          >
                            ⛔ {fItem}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#FFB74D', fontWeight: 700 }}>
                          원인 물질: {food.harmfulComponent}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800 }} aria-hidden="true">
                          {isExpanded ? '접기 ▲' : '기전 보기 ▼'}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ marginTop: '9px', fontSize: '0.74rem', color: '#d6d6d6', lineHeight: 1.54, marginBottom: '8px' }}>
                          {food.medicalReason}
                        </div>
                        <div
                          style={{
                            fontSize: '0.73rem',
                            color: '#81C784',
                            lineHeight: 1.48,
                            background: 'rgba(76, 175, 80, 0.08)',
                            padding: '8px 10px',
                            borderRadius: '6px',
                          }}
                        >
                          <strong>🥗 안전한 대체 식품:</strong> {food.safeAlternative}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: 탈모약 총람 */}
        {activeSubTab === 'drugs' && (
          <div className="fade-in" data-testid="guide-subtab-drugs">
            <h2 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#D4AF37', margin: '0 0 8px' }}>
              FDA · 식약처 허가 탈모 치료제 약리학 총람
            </h2>

            {medicalData.map((category, idx) => {
              const isOpen = activeAccordion === idx;

              if (category.isSpecial) {
                return (
                  <div
                    key={category.id || idx}
                    className="accordion-item glass-panel"
                    style={{ border: '1px solid var(--accent-gold)', borderRadius: '10px', marginBottom: '8px' }}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      className="accordion-header"
                      onClick={() => setActiveAccordion(isOpen ? null : idx)}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: 'inherit', textAlign: 'left' }}
                    >
                      <span style={{ color: 'var(--accent-gold)', fontSize: '0.82rem', lineHeight: 1.4 }}>
                        {category.type}
                      </span>
                      <span style={{ color: 'var(--accent-gold)', marginLeft: '8px' }} aria-hidden="true">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="accordion-content fade-in">
                        <div className="info-block">
                          <span className="info-label">기본 원칙</span>
                          <p>{category.efficacy}</p>
                        </div>
                        <div className="info-block">
                          <span className="info-label warning">미녹시딜 농도 상향 · 병합</span>
                          <p>{category.sideEffects}</p>
                        </div>
                        <div className="info-block">
                          <span className="info-label danger">경구약 성분 교체 원칙</span>
                          <p>{category.contraindications}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={category.id || idx}
                  className="accordion-item glass-panel"
                  style={{ borderRadius: '10px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.09)' }}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    className="accordion-header"
                    onClick={() => setActiveAccordion(isOpen ? null : idx)}
                    style={{ width: '100%', background: 'transparent', border: 'none', color: '#f5f0e8', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>{category.type}</span>
                    <span style={{ color: '#D4AF37', marginLeft: '8px' }} aria-hidden="true">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="accordion-content fade-in">
                      {category.original && (
                        <div
                          className="info-block"
                          style={{ background: 'rgba(212, 175, 55, 0.08)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.22)' }}
                        >
                          <div style={{ color: '#D4AF37', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            {category.original.manufacturer}
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
                            {category.original.name}
                          </div>
                          {category.halfLife && (
                            <div style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '0.35rem', lineHeight: 1.4 }}>
                              ⏱️ {category.halfLife}
                            </div>
                          )}
                        </div>
                      )}

                      {Array.isArray(category.generics) && category.generics.length > 0 && (
                        <div className="info-block">
                          <span className="info-label">대표 제네릭 (동일성분 의약품)</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '0.4rem' }}>
                            {category.generics.map((gen) => (
                              <span
                                key={gen}
                                style={{
                                  background: 'rgba(255,255,255,0.07)',
                                  padding: '3px 8px',
                                  borderRadius: '8px',
                                  fontSize: '0.71rem',
                                  color: '#ddd',
                                }}
                              >
                                {gen}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="info-block">
                        <span className="info-label">약리 효능</span>
                        <p style={{ fontSize: '0.76rem', color: '#ddd' }}>{category.efficacy}</p>
                      </div>

                      {category.sideEffects && (
                        <div className="info-block">
                          <span className="info-label warning">보고된 부작용</span>
                          <p style={{ fontSize: '0.75rem', color: '#ccc' }}>{category.sideEffects}</p>
                        </div>
                      )}

                      {category.contraindications && (
                        <div className="info-block" style={{ marginBottom: 0 }}>
                          <span className="info-label danger">필수 금기 및 주의사항</span>
                          <p style={{ fontSize: '0.75rem', color: '#f3c6c6' }}>{category.contraindications}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 하단 진단 바로가기 연결 */}
        {(onOpenDiagnosis || onOpenSasang) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
            {onOpenDiagnosis && (
              <button
                type="button"
                onClick={onOpenDiagnosis}
                style={{
                  padding: '11px 10px',
                  borderRadius: '9px',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  background: '#16161c',
                  color: '#D4AF37',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                📸 AI 탈모 진단 이동 →
              </button>
            )}
            {onOpenSasang && (
              <button
                type="button"
                onClick={onOpenSasang}
                style={{
                  padding: '11px 10px',
                  borderRadius: '9px',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  background: '#16161c',
                  color: '#f5d77f',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                🧍 사상체질 식이 이동 →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideTab;
