// src/components/SasangTab.jsx
// 사상체질(태양·소양·태음·소음) 체형 특징·용모사기·소증 정밀 검사 모드 및
// 체질별 좋은 음식·나쁜 음식·탈모 특화 유효성분 함유 슈퍼푸드 통합 가이드 (Requirement 7)

import React, { useState } from 'react';
import {
  Compass, CheckCircle2, Sparkles, ThumbsUp, ThumbsDown, Flame,
  RotateCcw, UserCheck, Scale
} from 'lucide-react';
import {
  SASANG_QUESTIONS,
  SASANG_CONSTITUTION_DETAILS
} from '../data/sasangConstitutionData';

const SasangTab = () => {
  // 상단 서브 모드: 'test' (체형·체질 검사 모드) | 'food_guide' (사상체질별 음식 & 탈모 특화 성분 백과)
  const [subMode, setSubMode] = useState('test');

  // 체간 비율 시각 슬라이더 (어깨·가슴 상초 / 허리·복부 중초 / 골반·엉덩이 하초)
  const [chestWidth, setChestWidth] = useState(55);
  const [waistWidth, setWaistWidth] = useState(50);
  const [pelvisWidth, setPelvisWidth] = useState(50);

  // 설문 응답 상태 (questionId -> optionIndex)
  const [answers, setAnswers] = useState({});
  const [resultType, setResultType] = useState(() => {
    return localStorage.getItem('wealthyhair_sasang_result') || null;
  });
  const [scoresMap, setScoresMap] = useState(null);
  const [selectedViewType, setSelectedViewType] = useState(resultType || 'taeeum');

  const handleSelectOption = (qId, optionIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const calculateSasangConstitution = () => {
    if (Object.keys(answers).length < SASANG_QUESTIONS.length) {
      alert(`정확한 사상체질 판정을 위해 8개 문항을 모두 선택해 주세요. (현재 ${Object.keys(answers).length}/8 완료)`);
      return;
    }

    const totals = { taeyang: 0, soyang: 0, taeeum: 0, soeum: 0 };

    // 1. 설문 가중치 합산
    SASANG_QUESTIONS.forEach(q => {
      const idx = answers[q.id];
      const opt = q.options[idx];
      if (opt) {
        totals[opt.type] += opt.weight;
      }
    });

    // 2. 체간 측정 슬라이더(상초·중초·하초 비율) 가중치 반영
    if (chestWidth >= waistWidth + 8 && chestWidth >= pelvisWidth + 8) {
      totals.soyang += 3.0;
      totals.taeyang += 1.8;
    } else if (waistWidth >= chestWidth + 5 && waistWidth >= pelvisWidth + 4) {
      totals.taeeum += 3.5;
    } else if (pelvisWidth >= chestWidth + 5) {
      totals.soeum += 3.5;
    } else if (chestWidth >= 65 && pelvisWidth <= 42) {
      totals.taeyang += 3.0;
    }

    const sumAll = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    const percentages = {
      taeyang: Math.round((totals.taeyang / sumAll) * 100),
      soyang: Math.round((totals.soyang / sumAll) * 100),
      taeeum: Math.round((totals.taeeum / sumAll) * 100),
      soeum: Math.round((totals.soeum / sumAll) * 100)
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

  return (
    <div className="fade-in" style={{ paddingBottom: '90px', color: '#fff', background: '#000' }}>
      {/* Luxury Banner */}
      <div className="tab-banner">
        <img
          src="/assets/banners/banner_sasang.jpg"
          alt="사상체질 & 탈모 식이"
          className="tab-banner-img"
          onError={(e) => { e.currentTarget.src = '/assets/banners/banner_guide.jpg'; }}
        />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">사상체질 & 모발 약선(藥膳)</h1>
          <p className="tab-banner-sub">동의수세보원 체형·장부 진단 및 체질별 발모 슈퍼푸드</p>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* 상단 모드 탭 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <button
            type="button"
            onClick={() => setSubMode('test')}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: subMode === 'test' ? '1.5px solid #D4AF37' : '1px solid #2a2a2a',
              background: subMode === 'test' ? 'rgba(212, 175, 55, 0.18)' : '#121212',
              color: subMode === 'test' ? '#D4AF37' : '#999',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            📐 체형·소증 정밀 검사 모드
          </button>
          <button
            type="button"
            onClick={() => setSubMode('food_guide')}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: subMode === 'food_guide' ? '1.5px solid #D4AF37' : '1px solid #2a2a2a',
              background: subMode === 'food_guide' ? 'rgba(212, 175, 55, 0.18)' : '#121212',
              color: subMode === 'food_guide' ? '#D4AF37' : '#999',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            🍲 체질별 음식 & 발모 성분
          </button>
        </div>

        {subMode === 'test' ? (
          <div>
            {/* STEP A: 인터랙티브 체간 비율(상초·중초·하초) 실루엣 시뮬레이터 */}
            <div style={{
              background: '#111',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Scale size={17} color="#D4AF37" />
                <h3 style={{ fontSize: '0.92rem', color: '#D4AF37', fontFamily: 'var(--font-sans)' }}>
                  STEP 1 · 체간 골격 발달 비율(상초·중초·하초) 자가 계측
                </h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#aaa', lineHeight: 1.5, marginBottom: '14px' }}>
                사상의학에서 체형을 구분하는 핵심 기준인 <strong>가슴·어깨(흉위)</strong>, <strong>허리·복부(복위)</strong>, <strong>골반·엉덩이(골반위)</strong>의 상대적 발달도를 조절해 보세요.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '16px', alignItems: 'center' }}>
                {/* 실시간 체형 실루엣 SVG */}
                <div style={{
                  background: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <svg width="86" height="140" viewBox="0 0 100 160">
                    {/* Head */}
                    <circle cx="50" cy="22" r="12" fill="none" stroke="#D4AF37" strokeWidth="2" />
                    {/* Torso polygon based on chestWidth, waistWidth, pelvisWidth */}
                    {(() => {
                      const cw = 18 + (chestWidth / 100) * 26;
                      const ww = 14 + (waistWidth / 100) * 26;
                      const pw = 16 + (pelvisWidth / 100) * 26;
                      return (
                        <>
                          <polygon
                            points={`${50 - cw},44 ${50 + cw},44 ${50 + ww},84 ${50 + pw},120 ${50 - pw},120 ${50 - ww},84`}
                            fill="rgba(212, 175, 55, 0.22)"
                            stroke="#D4AF37"
                            strokeWidth="2"
                          />
                          <line x1={50 - cw} y1="44" x2={50 + cw} y2="44" stroke="#00E676" strokeWidth="1.5" strokeDasharray="3,2" />
                          <line x1={50 - ww} y1="84" x2={50 + ww} y2="84" stroke="#FFA726" strokeWidth="1.5" strokeDasharray="3,2" />
                          <line x1={50 - pw} y1="120" x2={50 + pw} y2="120" stroke="#4FC3F7" strokeWidth="1.5" strokeDasharray="3,2" />
                        </>
                      );
                    })()}
                  </svg>
                  <span style={{ fontSize: '0.66rem', color: '#888', marginTop: '4px' }}>체간 실루엣</span>
                </div>

                {/* 슬라이더 3종 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                      <span style={{ color: '#00E676', fontWeight: 600 }}>상초 (가슴·어깨·목덜미)</span>
                      <span>{chestWidth}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="90"
                      value={chestWidth}
                      onChange={e => setChestWidth(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#00E676' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                      <span style={{ color: '#FFA726', fontWeight: 600 }}>중초 (허리·복부 두께)</span>
                      <span>{waistWidth}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="90"
                      value={waistWidth}
                      onChange={e => setWaistWidth(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#FFA726' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                      <span style={{ color: '#4FC3F7', fontWeight: 600 }}>하초 (골반·엉덩이·하체)</span>
                      <span>{pelvisWidth}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="90"
                      value={pelvisWidth}
                      onChange={e => setPelvisWidth(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#4FC3F7' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STEP B: 8대 표준 사상체질 설문 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {SASANG_QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  style={{
                    background: '#121212',
                    border: answers[q.id] !== undefined ? '1px solid rgba(212,175,55,0.55)' : '1px solid #262626',
                    borderRadius: '10px',
                    padding: '14px'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#D4AF37', fontWeight: 700, marginBottom: '4px' }}>
                    [{q.category}]
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff', marginBottom: '10px', lineHeight: 1.45 }}>
                    {q.question}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.options.map((opt, oIdx) => {
                      const isSelected = answers[q.id] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectOption(q.id, oIdx)}
                          style={{
                            textAlign: 'left',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid #D4AF37' : '1px solid #2b2b2b',
                            background: isSelected ? 'rgba(212, 175, 55, 0.15)' : '#181818',
                            color: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#D4AF37' : '#eee' }}>
                            {isSelected ? '✓ ' : ''}{opt.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#999', marginTop: '3px', lineHeight: 1.45 }}>
                            {opt.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={calculateSasangConstitution}
              style={{
                width: '100%',
                marginTop: '18px',
                padding: '15px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.94rem',
                cursor: 'pointer'
              }}
            >
              사상체질 판정 및 내 체질 맞춤 발모 음식 확인하기 →
            </button>
          </div>
        ) : (
          <div>
            {/* 판정된 체질 배너 (검사 결과가 있는 경우) */}
            {resultType && SASANG_CONSTITUTION_DETAILS[resultType] && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(20,20,20,0.95) 100%)',
                border: '1.5px solid #D4AF37',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 700 }}>
                    ✓ 나의 사상체질 정밀 분석 결과
                  </span>
                  <button
                    type="button"
                    onClick={() => setSubMode('test')}
                    style={{
                      background: 'none',
                      border: '1px solid #555',
                      color: '#ccc',
                      borderRadius: '12px',
                      padding: '3px 8px',
                      fontSize: '0.68rem',
                      cursor: 'pointer'
                    }}
                  >
                    다시 검사하기
                  </button>
                </div>
                <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '6px' }}>
                  {SASANG_CONSTITUTION_DETAILS[resultType].name}{' '}
                  <span style={{ fontSize: '0.9rem', color: '#D4AF37' }}>
                    ({SASANG_CONSTITUTION_DETAILS[resultType].hanja})
                  </span>
                </h2>
                <p style={{ fontSize: '0.76rem', color: '#ccc', marginTop: '4px', lineHeight: 1.5 }}>
                  {SASANG_CONSTITUTION_DETAILS[resultType].subtitle}
                </p>

                {scoresMap && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '12px' }}>
                    {[
                      { k: 'taeyang', l: '태양인' },
                      { k: 'soyang', l: '소양인' },
                      { k: 'taeeum', l: '태음인' },
                      { k: 'soeum', l: '소음인' }
                    ].map(c => (
                      <div key={c.k} style={{ background: '#111', padding: '6px', borderRadius: '6px', textAlign: 'center', border: resultType === c.k ? '1px solid #D4AF37' : '1px solid #262626' }}>
                        <div style={{ fontSize: '0.68rem', color: '#999' }}>{c.l}</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: resultType === c.k ? '#D4AF37' : '#fff' }}>
                          {scoresMap[c.k]}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4체질 전환 탭 (모든 체질의 좋은 음식·나쁜 음식·발모 슈퍼푸드를 자유롭게 열람 가능) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              marginBottom: '16px'
            }}>
              {[
                { key: 'taeyang', label: '태양인', sub: '폐대간소' },
                { key: 'soyang', label: '소양인', sub: '비대신소' },
                { key: 'taeeum', label: '태음인', sub: '간대폐소' },
                { key: 'soeum', label: '소음인', sub: '신대비소' }
              ].map(t => {
                const isActive = selectedViewType === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelectedViewType(t.key)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: '8px',
                      border: isActive ? '1.5px solid #D4AF37' : '1px solid #2a2a2a',
                      background: isActive ? '#D4AF37' : '#141414',
                      color: isActive ? '#000' : '#bbb',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>{t.label}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{t.sub}</div>
                  </button>
                );
              })}
            </div>

            {/* 1. 체형 특징 및 한의학적 탈모 병기 */}
            <div style={{
              background: '#121212',
              border: '1px solid #2b2b2b',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '0.96rem', color: '#D4AF37', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
                🧬 {activeDetail.name} 체형 특징 및 탈모 발생 원리
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '8px' }}>
                <strong>장부 구조:</strong> {activeDetail.organBalance}
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.76rem', color: '#ddd', lineHeight: 1.65, marginBottom: '10px' }}>
                {activeDetail.bodyFeatureSummary.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
              <div style={{
                background: '#191610',
                borderLeft: '3px solid #D4AF37',
                padding: '10px 12px',
                borderRadius: '4px',
                fontSize: '0.76rem',
                color: '#eee',
                lineHeight: 1.6
              }}>
                <strong style={{ color: '#D4AF37' }}>[체질 탈모 병기]</strong> {activeDetail.hairLossMechanism}
              </div>
            </div>

            {/* 2. 🌟 [핵심 특화] 좋은 음식 중 '탈모에 도움되는 유효성분이 풍부한 슈퍼푸드' 별도 심층 안내 */}
            <div style={{
              background: 'linear-gradient(180deg, #17140b 0%, #101010 100%)',
              border: '1.5px solid #D4AF37',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Sparkles size={18} color="#D4AF37" />
                <h3 style={{ fontSize: '0.96rem', color: '#D4AF37', fontFamily: 'var(--font-sans)' }}>
                  {activeDetail.name} 좋은 음식 중 [탈모 억제·발모 핵심 성분] 특화 식품
                </h3>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#bbb', marginBottom: '12px', lineHeight: 1.5 }}>
                {activeDetail.name}에게 이로운 음식 가운데 모낭 재생, 5α-환원효소(DHT) 억제, 두피 열감 해소에 직접 작용하는 생리활성 성분이 검증된 핵심 식품입니다.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeDetail.hairSuperfoods.map((sf, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#161616',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  >
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                      🌟 {sf.food}
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: '#D4AF37',
                      background: 'rgba(212, 175, 55, 0.12)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      marginBottom: '6px',
                      display: 'inline-block'
                    }}>
                      핵심 발모 성분: {sf.keyNutrients}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#ddd', lineHeight: 1.6, marginBottom: '6px' }}>
                      {sf.hairMechanism}
                    </p>
                    <div style={{ fontSize: '0.72rem', color: '#81c784' }}>
                      <strong>💡 권장 섭취법:</strong> {sf.intakeTip}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 사상체질별 좋은 음식 (전체 카테고리 나열) */}
            <div style={{
              background: '#121212',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '0.92rem', color: '#81c784', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)' }}>
                <ThumbsUp size={16} /> {activeDetail.name}에게 유익한 좋은 음식 전체 리스트
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.76rem' }}>
                {[
                  { label: '🌾 곡류 · 두류', items: activeDetail.goodFoods.grains },
                  { label: '🥩 어패류 · 육류 단백질', items: activeDetail.goodFoods.seafoodMeats },
                  { label: '🥬 채소 · 해조류', items: activeDetail.goodFoods.vegetables },
                  { label: '🍎 과일 · 견과 · 한방 약차', items: activeDetail.goodFoods.fruitsHerbs }
                ].map((cat, i) => (
                  <div key={i} style={{ background: '#181818', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 700, color: '#81c784', marginBottom: '6px' }}>{cat.label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {cat.items.map(food => (
                        <span
                          key={food}
                          style={{
                            background: 'rgba(76, 175, 80, 0.12)',
                            border: '1px solid rgba(76, 175, 80, 0.3)',
                            color: '#e8f5e9',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem'
                          }}
                        >
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. 사상체질별 나쁜 음식 (피해야 할 음식 전체 나열 및 원인) */}
            <div style={{
              background: '#121212',
              border: '1px solid rgba(255, 82, 82, 0.45)',
              borderRadius: '10px',
              padding: '15px'
            }}>
              <h3 style={{ fontSize: '0.92rem', color: '#ff8a80', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)' }}>
                <ThumbsDown size={16} /> {activeDetail.name}이 피해야 할 나쁜 음식 & 탈모 악화 이유
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#ffcdd2', lineHeight: 1.55, marginBottom: '10px', background: 'rgba(255,82,82,0.1)', padding: '9px', borderRadius: '6px' }}>
                <strong>⚠️ 해로운 이유:</strong> {activeDetail.badFoods.reason}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeDetail.badFoods.list.map((b, i) => (
                  <div key={i} style={{ background: '#181818', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #ff5252' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#ff8a80', marginBottom: '3px' }}>
                      ❌ {b.category}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#ddd', lineHeight: 1.5 }}>
                      {b.items}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SasangTab;
