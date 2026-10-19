import React, { useState, useMemo } from 'react';
import {
  medicalData,
  DRUG_INTERACTIONS_DATA,
  DRUG_SIDE_EFFECTS_DATA,
  CONTRAINDICATED_FOODS_DATA,
} from '../data/medicalGuideData';
import './GuideTab.css';
import './MedicationTab.css';

const SUB_TABS = [
  { id: 'interactions', label: '병용금기 양약', badge: '필독' },
  { id: 'sideEffects', label: '부작용 백과', badge: '안전' },
  { id: 'badFoods', label: '금기 식품 10선', badge: '식이' },
  { id: 'drugs', label: '탈모약 총람', badge: null },
];

const RISK_STYLE = {
  '절대 금기': { bg: 'rgba(255, 82, 82, 0.16)', border: 'rgba(255, 82, 82, 0.5)', color: '#FF5252' },
  '고위험 금기': { bg: 'rgba(255, 82, 82, 0.16)', border: 'rgba(255, 82, 82, 0.5)', color: '#FF5252' },
  '병용 주의': { bg: 'rgba(255, 183, 77, 0.16)', border: 'rgba(255, 183, 77, 0.5)', color: '#FFB74D' },
  '섭취 주의': { bg: 'rgba(255, 183, 77, 0.16)', border: 'rgba(255, 183, 77, 0.5)', color: '#FFB74D' },
  '의사 상담 필요': { bg: 'rgba(100, 181, 246, 0.15)', border: 'rgba(100, 181, 246, 0.45)', color: '#64B5F6' },
};

const GuideTab = ({ initialSection = 'interactions', onOpenDiagnosis, onOpenAlopeciaAreata, onOpenSasang }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSection);
  const [activeAccordion, setActiveAccordion] = useState(0);

  // Interactions state
  const [selectedIngredientId, setSelectedIngredientId] = useState(DRUG_INTERACTIONS_DATA[0].id);
  const [interactionSearch, setInteractionSearch] = useState('');

  // Side effects state
  const [selectedSideEffectDrugId, setSelectedSideEffectDrugId] = useState(DRUG_SIDE_EFFECTS_DATA[0].id);
  const [expandedSideEffectIdx, setExpandedSideEffectIdx] = useState(0);

  // Contraindicated foods state
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('전체');
  const [expandedFoodId, setExpandedFoodId] = useState(CONTRAINDICATED_FOODS_DATA[0].id);

  const currentIngredient = useMemo(
    () => DRUG_INTERACTIONS_DATA.find((d) => d.id === selectedIngredientId) || DRUG_INTERACTIONS_DATA[0],
    [selectedIngredientId]
  );

  const filteredInteractions = useMemo(() => {
    const q = interactionSearch.trim().toLowerCase();
    if (!q) return currentIngredient.contraindicatedDrugs;
    return currentIngredient.contraindicatedDrugs.filter(
      (item) =>
        item.drugClass.toLowerCase().includes(q) ||
        item.mechanism.toLowerCase().includes(q) ||
        item.examples.some((ex) => ex.toLowerCase().includes(q))
    );
  }, [currentIngredient, interactionSearch]);

  const currentSideEffectDrug = useMemo(
    () => DRUG_SIDE_EFFECTS_DATA.find((d) => d.id === selectedSideEffectDrugId) || DRUG_SIDE_EFFECTS_DATA[0],
    [selectedSideEffectDrugId]
  );

  const foodCategories = useMemo(() => {
    const cats = Array.from(new Set(CONTRAINDICATED_FOODS_DATA.map((f) => f.category)));
    return ['전체', ...cats];
  }, []);

  const filteredBadFoods = useMemo(() => {
    if (foodCategoryFilter === '전체') return CONTRAINDICATED_FOODS_DATA;
    return CONTRAINDICATED_FOODS_DATA.filter((f) => f.category === foodCategoryFilter);
  }, [foodCategoryFilter]);

  return (
    <div className="tab-content fade-in guide-tab" style={{ padding: 0 }}>
      {/* Header Banner */}
      <div className="tab-banner">
        <img src="/assets/banners/banner_safety.jpg" alt="의학·약학 안전 백과" className="tab-banner-img" />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">탈모 의학·약학 백과</h1>
          <p className="tab-banner-sub">병용금기 양약 · 부작용 대처 · 탈모 악화 금기 식품 총람</p>
        </div>
      </div>

      {/* Sub Navigation Pills */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
          padding: '12px 14px 4px',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(10, 10, 10, 0.95)',
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
              onClick={() => setActiveSubTab(t.id)}
              style={{
                padding: '10px 4px',
                borderRadius: '10px',
                border: active ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                background: active
                  ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.22), rgba(212, 175, 55, 0.06))'
                  : 'rgba(255,255,255,0.03)',
                color: active ? '#D4AF37' : '#aaa',
                fontSize: '0.74rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.2s ease',
              }}
            >
              {t.badge && (
                <span
                  style={{
                    fontSize: '0.58rem',
                    padding: '1px 5px',
                    borderRadius: '999px',
                    background: active ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                    color: active ? '#000' : '#ccc',
                    fontWeight: 700,
                  }}
                >
                  {t.badge}
                </span>
              )}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '14px 14px 96px' }}>
        {/* ============================================================
            TAB 1: 복용 탈모약 성분에 따라 함께 복용하면 안 되는 양약 (Req 9)
        ============================================================ */}
        {activeSubTab === 'interactions' && (
          <div className="fade-in">
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(255, 82, 82, 0.1), rgba(18, 18, 22, 0.95))',
                border: '1px solid rgba(255, 82, 82, 0.3)',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '14px',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#FF8A80', fontWeight: 700, marginBottom: '4px' }}>
                ⚠️ 의약품 안전성 정보 (DUR 병용금기·주의 기준)
              </div>
              <div style={{ fontSize: '0.88rem', color: '#f5f0e8', fontWeight: 700, marginBottom: '4px' }}>
                복용 중인 탈모약 성분을 선택하고 병용 불가 양약을 확인하세요
              </div>
              <p style={{ fontSize: '0.76rem', color: '#bbb', margin: 0, lineHeight: 1.5 }}>
                탈모약은 간 대사 효소(CYP3A4)나 혈압·전해질 기전을 공유하는 타 양약과 함께 복용할 경우 심각한 부작용이나 과량 독성을 유발할 수 있습니다.
              </p>
            </div>

            {/* Ingredient Selector */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '6px', fontWeight: 600 }}>
                1. 복용(또는 사용) 중인 탈모약 성분 선택
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {DRUG_INTERACTIONS_DATA.map((item) => {
                  const isSel = item.id === selectedIngredientId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIngredientId(item.id)}
                      style={{
                        textAlign: 'left',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: isSel ? '1.5px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                        background: isSel ? 'rgba(212, 175, 55, 0.14)' : 'rgba(255,255,255,0.025)',
                        color: '#f5f0e8',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isSel ? '#D4AF37' : '#eee' }}>
                          {item.ingredient}
                        </div>
                        <div style={{ fontSize: '0.71rem', color: '#999', marginTop: '2px' }}>
                          대표 약품: {item.brandExamples.join(', ')} · [{item.category}]
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          background: isSel ? '#D4AF37' : 'rgba(255,255,255,0.08)',
                          color: isSel ? '#000' : '#aaa',
                          fontWeight: 700,
                        }}
                      >
                        주의 {item.contraindicatedDrugs.length}종
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Filter */}
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                value={interactionSearch}
                onChange={(e) => setInteractionSearch(e.target.value)}
                placeholder="양약 이름 또는 질환 검색 (예: 하루날, 이트라코나졸, 혈압약, 진통제, 비아그라)"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  background: '#111216',
                  color: '#f5f0e8',
                  fontSize: '0.8rem',
                }}
              />
            </div>

            {/* Metabolism & Drug List */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(212, 175, 55, 0.07)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                marginBottom: '12px',
                fontSize: '0.75rem',
                color: '#d8c9a3',
              }}
            >
              <strong>약물 대사 경로:</strong> {currentIngredient.metabolism}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredInteractions.map((drug, i) => {
                const badge = RISK_STYLE[drug.riskLevel] || RISK_STYLE['병용 주의'];
                return (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(20, 20, 24, 0.95)',
                      border: `1px solid ${badge.border}`,
                      borderRadius: '12px',
                      padding: '14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f5f0e8' }}>
                        {drug.drugClass}
                      </div>
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: '999px',
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                        }}
                      >
                        {drug.riskLevel}
                      </span>
                    </div>

                    {/* Examples */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                      {drug.examples.map((ex, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#ddd',
                          }}
                        >
                          💊 {ex}
                        </span>
                      ))}
                    </div>

                    <div
                      style={{
                        fontSize: '0.77rem',
                        color: '#ccc',
                        lineHeight: 1.55,
                        background: 'rgba(0,0,0,0.35)',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <strong style={{ color: '#FFB74D', display: 'block', marginBottom: '3px' }}>
                        [병용 시 발생 기전 및 위험 원인]
                      </strong>
                      {drug.mechanism}
                    </div>

                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: '#81C784',
                        lineHeight: 1.5,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'rgba(76, 175, 80, 0.08)',
                        border: '1px solid rgba(76, 175, 80, 0.25)',
                      }}
                    >
                      <strong>임상 복약 지침:</strong> {drug.action}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: 탈모약 복용 시 나타날 수 있는 부작용 및 대처법 (Req 10)
        ============================================================ */}
        {activeSubTab === 'sideEffects' && (
          <div className="fade-in">
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(212, 175, 55, 0.12), rgba(18, 18, 22, 0.95))',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '14px',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 700, marginBottom: '4px' }}>
                🔬 임상 약물감시(Pharmacovigilance) 리포트
              </div>
              <div style={{ fontSize: '0.88rem', color: '#f5f0e8', fontWeight: 700, marginBottom: '4px' }}>
                탈모약 성분별 부작용 발생 확률 · 원인 · 의학적 대처 프로토콜
              </div>
              <p style={{ fontSize: '0.75rem', color: '#bbb', margin: 0, lineHeight: 1.5 }}>
                FDA·식약처 허가사항 및 다기관 임상시험 데이터를 기반으로 실제 발현율과 안전한 대처법을 정리했습니다.
              </p>
            </div>

            {/* Drug Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
              {DRUG_SIDE_EFFECTS_DATA.map((d) => {
                const active = d.id === selectedSideEffectDrugId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setSelectedSideEffectDrugId(d.id);
                      setExpandedSideEffectIdx(0);
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: active ? '1.5px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                      background: active ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: active ? '#D4AF37' : '#ccc',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>{d.drugName.split(' (')[0]}</div>
                    <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: 400, marginTop: '2px' }}>
                      반감기: {d.halfLife}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Drug Summary Header */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f5f0e8' }}>
                  {currentSideEffectDrug.drugName}
                </div>
                <div style={{ fontSize: '0.73rem', color: '#aaa', marginTop: '2px' }}>
                  체내 반감기: {currentSideEffectDrug.halfLife}
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 82, 82, 0.14)',
                  border: '1px solid rgba(255, 82, 82, 0.4)',
                  color: '#FF8A80',
                  fontWeight: 700,
                }}
              >
                헌혈 제한: {currentSideEffectDrug.bloodDonationBan}
              </div>
            </div>

            {/* Side Effects Accordion List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentSideEffectDrug.systems.map((sys, idx) => {
                const isOpen = expandedSideEffectIdx === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(18, 18, 22, 0.96)',
                      border: isOpen
                        ? '1px solid rgba(212, 175, 55, 0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedSideEffectIdx(isOpen ? -1 : idx)}
                      style={{
                        width: '100%',
                        padding: '13px 14px',
                        background: 'transparent',
                        border: 'none',
                        color: '#f5f0e8',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '0.66rem',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            background: 'rgba(212, 175, 55, 0.16)',
                            color: '#D4AF37',
                            fontWeight: 700,
                            marginRight: '7px',
                          }}
                        >
                          {sys.system}
                        </span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                          {sys.symptoms.join(' · ')}
                        </span>
                      </div>
                      <span style={{ color: '#D4AF37', fontSize: '1rem', fontWeight: 700 }}>
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>

                    {isOpen && (
                      <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div
                          style={{
                            marginTop: '10px',
                            fontSize: '0.74rem',
                            color: '#FFB74D',
                            fontWeight: 600,
                            marginBottom: '8px',
                          }}
                        >
                          📊 임상 발현 빈도: {sys.incidence}
                        </div>

                        <div
                          style={{
                            fontSize: '0.77rem',
                            color: '#ccc',
                            lineHeight: 1.55,
                            background: 'rgba(0,0,0,0.35)',
                            padding: '10px',
                            borderRadius: '8px',
                            marginBottom: '8px',
                          }}
                        >
                          <strong style={{ color: '#D4AF37', display: 'block', marginBottom: '3px' }}>
                            [발생 기전 및 의학적 원인]
                          </strong>
                          {sys.mechanism}
                        </div>

                        <div
                          style={{
                            fontSize: '0.76rem',
                            color: '#81C784',
                            lineHeight: 1.55,
                            background: 'rgba(76, 175, 80, 0.08)',
                            border: '1px solid rgba(76, 175, 80, 0.25)',
                            padding: '10px',
                            borderRadius: '8px',
                          }}
                        >
                          <strong style={{ display: 'block', marginBottom: '3px' }}>
                            ✅ 전문의 권고 대처 프로토콜
                          </strong>
                          {sys.copingStrategy}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: 탈모 환자가 복용하면 안 되는 식품 리스트 및 원인 (Req 8)
        ============================================================ */}
        {activeSubTab === 'badFoods' && (
          <div className="fade-in">
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(255, 152, 0, 0.12), rgba(18, 18, 22, 0.95))',
                border: '1px solid rgba(255, 183, 77, 0.35)',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '14px',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#FFB74D', fontWeight: 700, marginBottom: '4px' }}>
                🚫 임상 영양독성학 & 모낭 대사 가이드
              </div>
              <div style={{ fontSize: '0.88rem', color: '#f5f0e8', fontWeight: 700, marginBottom: '4px' }}>
                탈모 환자가 피해야 할 금기·주의 식품 10선과 생화학적 원인
              </div>
              <p style={{ fontSize: '0.75rem', color: '#bbb', margin: 0, lineHeight: 1.5 }}>
                단순 속설이 아닌 DHT 전환 촉진, 아비딘-비오틴 결합, 비타민 A 과잉, 수은 축적, CYP3A4 대사 저해 등 명확한 생화학적 기전이 입증된 주의 식품 목록입니다.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '12px',
              }}
            >
              {foodCategories.map((cat) => {
                const active = foodCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFoodCategoryFilter(cat)}
                    style={{
                      flexShrink: 0,
                      padding: '6px 12px',
                      borderRadius: '999px',
                      border: active ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                      background: active ? '#D4AF37' : 'rgba(255,255,255,0.04)',
                      color: active ? '#000' : '#ccc',
                      fontSize: '0.73rem',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Contraindicated Food Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredBadFoods.map((food) => {
                const badge = RISK_STYLE[food.riskLevel] || RISK_STYLE['섭취 주의'];
                const isExpanded = expandedFoodId === food.id;
                return (
                  <div
                    key={food.id}
                    style={{
                      background: 'rgba(18, 18, 22, 0.96)',
                      border: isExpanded ? `1px solid ${badge.border}` : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedFoodId(isExpanded ? null : food.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            color: '#D4AF37',
                            background: 'rgba(212,175,55,0.12)',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontWeight: 700,
                          }}
                        >
                          {food.category}
                        </span>
                        <h4 style={{ margin: '6px 0 4px', fontSize: '0.88rem', color: '#f5f0e8', fontWeight: 700 }}>
                          {food.name}
                        </h4>
                      </div>
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                        }}
                      >
                        {food.riskLevel}
                      </span>
                    </div>

                    {/* Specific food items */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', margin: '6px 0 8px' }}>
                      {food.foods.map((fItem, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 82, 82, 0.08)',
                            color: '#ffcdd2',
                          }}
                        >
                          ⛔ {fItem}
                        </span>
                      ))}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#FFB74D', fontWeight: 600 }}>
                      핵심 원인: {food.culpritCompound}
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <div
                          style={{
                            fontSize: '0.77rem',
                            color: '#ddd',
                            lineHeight: 1.58,
                            background: 'rgba(0,0,0,0.38)',
                            padding: '10px',
                            borderRadius: '8px',
                            marginBottom: '8px',
                          }}
                        >
                          <strong style={{ color: '#FF8A80', display: 'block', marginBottom: '3px' }}>
                            [탈모 유발·악화 생화학적 기전]
                          </strong>
                          {food.mechanism}
                        </div>
                        <div
                          style={{
                            fontSize: '0.76rem',
                            color: '#81C784',
                            lineHeight: 1.5,
                            background: 'rgba(76, 175, 80, 0.08)',
                            border: '1px solid rgba(76, 175, 80, 0.25)',
                            padding: '9px 10px',
                            borderRadius: '8px',
                          }}
                        >
                          <strong>올바른 섭취 지침:</strong> {food.clinicalAdvice}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 4: 탈모약 정보 가이드 (기존 + 심화)
        ============================================================ */}
        {activeSubTab === 'drugs' && (
          <div className="fade-in">
            <h3
              className="category-title"
              style={{
                color: 'var(--text-main)',
                borderBottom: '1px solid var(--border-gold)',
                marginTop: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              탈모 치료제 오리지널 & 제네릭 총람
            </h3>

            {medicalData.map((category, idx) => {
              const isOpen = activeAccordion === idx;

              if (category.isSpecial) {
                return (
                  <div key={idx} className="accordion-item glass-panel" style={{ border: '1px solid var(--accent-gold)' }}>
                    <div className="accordion-header" onClick={() => setActiveAccordion(isOpen ? null : idx)}>
                      <span style={{ color: 'var(--accent-gold)' }}>{category.type}</span>
                      <span>{isOpen ? '−' : '+'}</span>
                    </div>
                    {isOpen && (
                      <div className="accordion-content fade-in">
                        <div className="info-block">
                          <span className="info-label">기본 원리</span>
                          <p>{category.efficacy}</p>
                        </div>
                        <div className="info-block">
                          <span className="info-label warning">미녹시딜 농도 증량</span>
                          <p>{category.sideEffects}</p>
                        </div>
                        <div className="info-block">
                          <span className="info-label danger">경구약 성분 변경 (피나 → 두타)</span>
                          <p>{category.contraindications}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={idx} className="accordion-item glass-panel">
                  <div className="accordion-header" onClick={() => setActiveAccordion(isOpen ? null : idx)}>
                    <span>{category.type}</span>
                    <span>{isOpen ? '−' : '+'}</span>
                  </div>
                  {isOpen && (
                    <div className="accordion-content fade-in">
                      <div className="info-block" style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '4px' }}>
                        <h5 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>{category.original.manufacturer}</h5>
                        <p style={{ fontSize: '1rem', fontWeight: 'bold' }}>{category.original.name}</p>
                      </div>
                      <div className="info-block">
                        <span className="info-label">국내 제네릭 (카피약)</span>
                        <p style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '0.5rem' }}>
                          {category.generics.map((gen) => (
                            <span
                              key={gen}
                              style={{
                                background: 'var(--border-light)',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                              }}
                            >
                              {gen}
                            </span>
                          ))}
                        </p>
                      </div>
                      <div className="info-block">
                        <span className="info-label">효능 및 역할</span>
                        <p>{category.efficacy}</p>
                      </div>
                      <div className="info-block">
                        <span className="info-label warning">심층 부작용</span>
                        <p>{category.sideEffects}</p>
                      </div>
                      <div className="info-block">
                        <span className="info-label danger">금기 및 주의사항</span>
                        <p>{category.contraindications}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick shortcuts to specialized diagnostic engines */}
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {onOpenDiagnosis && (
                <button
                  type="button"
                  className="av-continue-btn"
                  style={{ width: '100%', padding: '0.95rem' }}
                  onClick={onOpenDiagnosis}
                >
                  남성·여성 정밀 탈모 AI 스캔 시작하기 →
                </button>
              )}
              {onOpenAlopeciaAreata && (
                <button
                  type="button"
                  className="med-btn-ghost"
                  style={{ width: '100%', padding: '0.9rem', borderColor: '#D4AF37', color: '#D4AF37' }}
                  onClick={onOpenAlopeciaAreata}
                >
                  원형탈모 SALT 정밀 진단기로 이동 →
                </button>
              )}
              {onOpenSasang && (
                <button
                  type="button"
                  className="med-btn-ghost"
                  style={{ width: '100%', padding: '0.9rem' }}
                  onClick={onOpenSasang}
                >
                  사상체질 체형 진단 및 맞춤 탈모 식이 보기 →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideTab;
