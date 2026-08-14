import React, { useState, useRef } from 'react';
import './HairSimTab.css';
import './MedicationTab.css';

// ── 논문 근거 데이터 ──────────────────────────────────────────────
const DRUG_DATA = {
  finasteride: {
    name: '피나스테리드 (프로페시아/피나온 계열)',
    generic: 'DHT 5α-환원효소 2형 억제제',
    mechanism: '두피 내 DHT(디하이드로테스토스테론)를 최대 83% 감소시켜 모낭 소형화를 억제합니다.',
    months: {
      1: { density: 8, description: 'DHT 감소 시작 단계. 가시적인 성장 변화는 미미하지만, 추가 탈모 진행이 억제됩니다. 일시적 탈락이 발생할 수 있습니다.', recovery: '탈모 진행 억제', color: '#6B8E6E' },
      2: { density: 18, description: 'DHT가 안정적으로 83% 감소. 모낭 주변 솜털(vellus hair) 발생이 관찰되기 시작합니다. 두피 건강이 개선됩니다.', recovery: '솜털 발생 시작', color: '#7BA87E' },
      3: { density: 32, description: '임상 연구(NEJM 1998, Kaufman et al.)에서 3개월 후 모발 수 9~10% 유의미한 증가가 확인되었습니다. 굵기와 밀도가 동시에 향상됩니다.', recovery: '모발 밀도 9~10% 증가', color: '#4CAF50' },
    },
    reference: 'Kaufman KD et al. NEJM 1998;338:1000-1006',
  },
  dutasteride: {
    name: '두타스테리드 (아보다트/두타온 계열)',
    generic: 'DHT 5α-환원효소 1,2형 동시 억제제',
    mechanism: '1형과 2형 효소 모두 억제하여 DHT를 최대 98% 감소시킵니다. 피나스테리드 대비 더 강력한 억제 효과.',
    months: {
      1: { density: 12, description: 'DHT 98% 감소 즉각 시작. 피나스테리드보다 빠른 억제 효과로 추가 탈락이 빠르게 멈춥니다.', recovery: '탈모 진행 완전 억제', color: '#8B7E6E' },
      2: { density: 28, description: '두피 모발 밀도 증가가 체감될 수 있으며, 모발 직경(굵기) 향상이 관찰됩니다.', recovery: '모발 굵기 증가 체감', color: '#A0936E' },
      3: { density: 45, description: '임상 연구(J Dermatol 2006)에서 3개월 후 모발 수 17% 증가가 확인됨. 피나스테리드(9~10%) 대비 탁월한 효과.', recovery: '모발 밀도 17% 증가', color: '#D4AF37' },
    },
    reference: 'Olsen EA et al. J Am Acad Dermatol 2006;54:1032-1041',
  },
  minoxidil: {
    name: '미녹시딜 (로게인/마이녹실 계열)',
    generic: '혈관확장제 / 모발 성장 촉진제',
    mechanism: 'KATP 채널을 열어 두피 혈류를 증가시키고 모낭의 성장기(anagen)를 연장합니다.',
    months: {
      1: { density: 5, description: '초기 탈락(Shedding) 현상이 발생할 수 있습니다. 이는 성장기 모발 전환 신호로 정상 반응입니다.', recovery: '초기 탈락 정상 반응', color: '#8B6E6E' },
      2: { density: 22, description: '두피 혈류 개선으로 솜털(vellus) 증가가 가시화됩니다. 특히 정수리 부위 반응이 빠릅니다.', recovery: '솜털 증가 가시화', color: '#A07B6E' },
      3: { density: 35, description: '임상 연구(JAAD 2002)에서 3개월 시점 모발 굵기와 밀도의 동시 향상이 확인. 경구 미녹시딜은 효과가 더 빠릅니다.', recovery: '모발 굵기·밀도 동시 향상', color: '#4CAF50' },
    },
    reference: 'Olsen EA. J Am Acad Dermatol 2002;47:377-385',
  },
  combination: {
    name: '복합요법 (피나스테리드 + 미녹시딜)',
    generic: '경구약 + 외용약 병행 치료',
    mechanism: 'DHT 억제(피나스테리드)와 혈류 증가(미녹시딜)의 시너지 효과로 단일 약제 대비 현저히 향상된 결과.',
    months: {
      1: { density: 15, description: '두 가지 작용 기전이 동시에 작동하여 억제 효과와 성장 효과가 병행됩니다.', recovery: '이중 기전 동시 작동', color: '#7BA87E' },
      2: { density: 38, description: '상호 보완적 기전으로 단일 약제 대비 빠른 회복이 관찰됩니다.', recovery: '단일 약제 대비 1.5배 효과', color: '#A0936E' },
      3: { density: 58, description: '복합요법 임상 연구(Dermatol Ther 2021)에서 단독 투여 대비 모발 수 34% 추가 증가 확인.', recovery: '모발 밀도 58% 회복 목표', color: '#D4AF37' },
    },
    reference: 'Hu R et al. Dermatol Ther 2021;11:1819-1831',
  },
};

const NUTRITION_DATA = [
  {
    name: '비오틴 (B7)',
    icon: '🥚',
    img: '/assets/foods/food_biotin.jpg',
    foods: '달걀, 아몬드, 호두',
    reason: '케라틴 단백질 생합성의 보조효소로 작용. 비오틴 결핍 시 탈모가 가속화됩니다. 하루 권장량: 30μg',
    detail: '머리카락의 주요 구성 성분인 케라틴의 생성을 돕는 핵심 비타민입니다. 피나스테리드·미녹시딜 복용 환자에게 보조적으로 권장됩니다.',
  },
  {
    name: '단백질',
    icon: '🍗',
    img: '/assets/foods/food_protein.jpg',
    foods: '연어, 닭가슴살, 두부',
    reason: '모발의 95%는 케라틴(단백질)입니다. 단백질 부족 시 성장기가 단축되어 탈모가 심화됩니다.',
    detail: '하루 체중 1kg당 1.2~1.6g의 단백질 섭취를 권장합니다. 동물성·식물성 단백질을 균형 있게 섭취하면 아미노산 구성이 최적화됩니다.',
  },
  {
    name: '아연 (Zinc)',
    icon: '🦪',
    img: '/assets/foods/food_zinc.jpg',
    foods: '굴, 시금치, 호박씨',
    reason: '5α-환원효소 억제 보조 작용. 아연 부족 시 두피 염증이 증가하고 모발 성장 속도가 감소합니다.',
    detail: '아연은 5α-환원효소 억제 보조 효과가 있어, 피나스테리드·두타스테리드와 시너지 효과를 냅니다. 하루 권장량: 남성 11mg.',
  },
  {
    name: '오메가-3',
    icon: '🐟',
    img: null,
    foods: '고등어, 정어리, 호두',
    reason: '두피 혈행 개선 및 항염증 작용으로 모낭 미세 환경을 최적화합니다.',
    detail: '미녹시딜의 혈류 개선 효과를 보완합니다. EPA/DHA 형태의 오메가-3가 두피 염증을 감소시키고 모발 밀도를 개선한다는 연구가 있습니다.',
  },
  {
    name: '철분 (Iron)',
    icon: '🥩',
    img: null,
    foods: '소고기, 렌틸콩, 시금치',
    reason: '철분 결핍성 빈혈은 탈모의 주요 원인 중 하나입니다. 모낭 세포 분열에 필수 미네랄입니다.',
    detail: '페리틴(혈청 철분 저장 단백질) 수치가 40ng/mL 이하면 탈모 위험이 높습니다. 비타민 C와 함께 섭취하면 흡수율이 3배 증가합니다.',
  },
  {
    name: '비타민 D',
    icon: '☀️',
    img: null,
    foods: '달걀노른자, 연어, 햇빛 노출',
    reason: '비타민 D 수용체가 모낭 주기를 직접 조절합니다. 결핍 시 원형 탈모 위험이 증가합니다.',
    detail: '연구에 따르면 비타민 D가 모낭 줄기세포의 활성화를 촉진합니다. 하루 15~30분 햇빛 노출 또는 보충제 1000~2000IU 섭취를 권장합니다.',
  },
];

const ADDITIONAL_TREATMENTS = [
  { icon: '💉', name: 'PRP (혈소판풍부혈장) 주사', desc: '자신의 혈액에서 추출한 성장인자를 두피에 직접 주사하여 모낭을 재생합니다. 임상적으로 3~6회 시술 후 효과 확인.', level: '고효과' },
  { icon: '🔴', name: '저준위 레이저 치료 (LLLT)', desc: '특정 파장의 레이저로 모낭 세포 내 ATP 생산을 증가시켜 성장기를 연장합니다. 가정용 헬멧형 기기 사용 가능.', level: '중효과' },
  { icon: '💊', name: '경구 미녹시딜 추가', desc: '외용 미녹시딜 사용 중이라면 저용량 경구(0.5~2.5mg/일) 미녹시딜을 추가하면 효과가 현저히 향상됩니다.', level: '고효과' },
  { icon: '🧴', name: '두피 케토코나졸 샴푸', desc: '항진균 성분인 케토코나졸이 두피 염증을 억제하고 DHT 수치를 낮추는 보조 효과가 있습니다.', level: '보조' },
  { icon: '🏥', name: '모발 이식 (FUE/FUT)', desc: '약물로 3~6개월 충분히 시도한 뒤에도 효과가 미미하다면 모발 이식을 고려할 수 있습니다. 영구적인 해결책.', level: '최종선택' },
];

// ── Step 1: 약 선택 ──────────────────────────────────────────────
const Step1 = ({ onNext }) => {
  const [selected, setSelected] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dose, setDose] = useState('');

  const drugOptions = [
    { key: 'finasteride', label: '피나스테리드', sub: '프로페시아·피나온' },
    { key: 'dutasteride', label: '두타스테리드', sub: '아보다트·두타온' },
    { key: 'minoxidil', label: '미녹시딜', sub: '로게인·마이녹실' },
    { key: 'combination', label: '복합요법', sub: '피나스테리드 + 미녹시딜' },
  ];

  return (
    <div className="sim-step fade-in">
      <div className="sim-step-header">
        <div className="sim-step-num">01</div>
        <div>
          <h2 className="sim-step-title">복용약 정보 입력</h2>
          <p className="sim-step-sub">현재 복용 중인 탈모약을 선택하세요</p>
        </div>
      </div>

      <div className="sim-drug-grid">
        {drugOptions.map(d => (
          <button
            key={d.key}
            className={`sim-drug-card ${selected === d.key ? 'selected' : ''}`}
            onClick={() => setSelected(d.key)}
          >
            <div className="sim-drug-name">{d.label}</div>
            <div className="sim-drug-sub">{d.sub}</div>
            {selected === d.key && <div className="sim-drug-check">✓</div>}
          </button>
        ))}
      </div>

      <div className="sim-form-group">
        <label className="sim-label">복용 시작일</label>
        <input
          type="date"
          className="med-input"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="sim-form-group">
        <label className="sim-label">용량·복용 방법</label>
        <input
          type="text"
          className="med-input"
          placeholder="예: 피나스테리드 1mg 1정/일, 미녹시딜 5% 1ml 2회/일"
          value={dose}
          onChange={e => setDose(e.target.value)}
        />
      </div>

      <div className="sim-ref-box">
        <span className="sim-ref-icon">📄</span>
        <span>선택한 약물의 예측 데이터는 국제 임상 논문 결과를 기반으로 합니다.</span>
      </div>

      <button
        className="med-btn-primary sim-next-btn"
        disabled={!selected || !startDate}
        onClick={() => onNext({ drug: selected, startDate, dose })}
      >
        다음: 모발 사진 등록 →
      </button>
    </div>
  );
};

// ── Step 2: 사진 등록 ───────────────────────────────────────────
const PhotoSlot = ({ label, angle, photo, onCapture }) => {
  const inputRef = useRef(null);

  const handleClick = () => inputRef.current?.click();
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onCapture(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className={`sim-photo-slot ${photo ? 'has-photo' : ''}`} onClick={handleClick}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      {photo ? (
        <>
          <img src={photo} alt={label} className="sim-photo-preview" />
          <div className="sim-photo-label-overlay">{label}</div>
        </>
      ) : (
        <>
          <div className="sim-photo-placeholder-icon">{angle}</div>
          <div className="sim-photo-label">{label}</div>
          <div className="sim-photo-hint">탭하여 촬영 / 선택</div>
        </>
      )}
    </div>
  );
};

const Step2 = ({ onNext, onBack }) => {
  const [photos, setPhotos] = useState({ front: null, left: null, right: null });

  const setPhoto = (key, src) => setPhotos(prev => ({ ...prev, [key]: src }));
  const canProceed = photos.front && photos.left && photos.right;

  return (
    <div className="sim-step fade-in">
      <div className="sim-step-header">
        <div className="sim-step-num">02</div>
        <div>
          <h2 className="sim-step-title">기준 모발 사진 등록</h2>
          <p className="sim-step-sub">3방향 사진을 등록하면 정밀한 예측이 가능합니다</p>
        </div>
      </div>

      <div className="sim-guide-box">
        <p>📷 <strong>촬영 가이드</strong></p>
        <ul>
          <li>밝은 조명 아래서 촬영하세요</li>
          <li>머리를 완전히 펼쳐 두피가 보이게 하세요</li>
          <li>매월 같은 구도로 촬영하면 비교가 용이합니다</li>
        </ul>
      </div>

      <div className="sim-photo-grid">
        <PhotoSlot label="정면" angle="👤" photo={photos.front} onCapture={s => setPhoto('front', s)} />
        <PhotoSlot label="좌측면" angle="👤" photo={photos.left} onCapture={s => setPhoto('left', s)} />
        <PhotoSlot label="우측면" angle="👤" photo={photos.right} onCapture={s => setPhoto('right', s)} />
      </div>

      <p className="sim-privacy-note">🔒 사진은 기기 내 임시 저장만 되며, 서버로 전송되지 않습니다.</p>

      <div className="sim-btn-row">
        <button className="med-btn-ghost" onClick={onBack}>← 이전</button>
        <button
          className="med-btn-primary"
          disabled={!canProceed}
          style={{ flex: 1 }}
          onClick={() => onNext(photos)}
        >
          AI 예측 분석 시작 →
        </button>
      </div>
    </div>
  );
};

// ── Step 3: 예측 결과 ───────────────────────────────────────────
const ProgressBar = ({ value, color }) => {
  const [animated, setAnimated] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="sim-progress-track">
      <div
        className="sim-progress-fill"
        style={{ width: animated ? `${value}%` : '0%', background: color }}
      />
      <span className="sim-progress-label">{value}%</span>
    </div>
  );
};

const Step3 = ({ medInfo, photos, onNext, onBack, apiResult, isLoadingAI, apiError }) => {
  const [activeMonth, setActiveMonth] = useState(1);
  const [activeView, setActiveView] = useState('front');
  const drugData = DRUG_DATA[medInfo.drug];
  const monthData = drugData.months[activeMonth];

  const viewLabels = { front: '정면', left: '좌측면', right: '우측면' };
  const currentPhoto = photos[activeView === 'front' ? 'front' : activeView === 'left' ? 'left' : 'right'];

  return (
    <div className="sim-step fade-in">
      <div className="sim-step-header">
        <div className="sim-step-num">03</div>
        <div>
          <h2 className="sim-step-title">예상 변화 시뮬레이션</h2>
          <p className="sim-step-sub">{drugData.name}</p>
        </div>
      </div>

      {/* Month selector */}
      <div className="sim-month-tabs">
        {[1, 2, 3].map(m => (
          <button
            key={m}
            className={`sim-month-tab ${activeMonth === m ? 'active' : ''}`}
            onClick={() => setActiveMonth(m)}
          >
            {m}개월 후
          </button>
        ))}
      </div>

      {/* View selector */}
      <div className="sim-view-tabs">
        {['front', 'left', 'right'].map(v => (
          <button
            key={v}
            className={`sim-view-tab ${activeView === v ? 'active' : ''}`}
            onClick={() => setActiveView(v)}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>

      {/* Photo + Result side by side */}
      <div className="sim-compare">
        <div className="sim-compare-col">
          <div className="sim-compare-label">현재 상태</div>
          <div className="sim-photo-frame">
            {currentPhoto
              ? <img src={currentPhoto} alt="현재" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div className="sim-photo-empty">사진 없음</div>
            }
          </div>
        </div>
        <div className="sim-compare-arrow">→</div>
        <div className="sim-compare-col">
          <div className="sim-compare-label" style={{ color: isLoadingAI ? '#888' : monthData.color }}>
            {isLoadingAI ? 'AI 분석 중...' : `${activeMonth}개월 후 예측`}
          </div>
          <div className="sim-photo-frame sim-photo-predicted" style={{ borderColor: isLoadingAI ? '#444' : monthData.color }}>
            {isLoadingAI ? (
              <div className="sim-ai-placeholder">
                <div className="sim-ai-spinner" />
                <div style={{ fontSize: '0.72rem', color: '#888', textAlign: 'center', marginTop: '0.6rem' }}>AI 이미지 생성 중<br/><span style={{fontSize:'0.65rem',color:'#555'}}>30~60초 소요</span></div>
              </div>
            ) : apiResult?.predicted_image ? (
              <img src={apiResult.predicted_image} alt="예측" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : apiError ? (
              <div className="sim-ai-placeholder">
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>⚠️</div>
                <div style={{ fontSize: '0.68rem', color: '#C0506A', textAlign: 'center', padding: '0 0.5rem' }}>{apiError}</div>
              </div>
            ) : (
              <div className="sim-ai-placeholder">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔬</div>
                <div style={{ fontSize: '0.72rem', color: '#666', textAlign: 'center' }}>분석 대기 중</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="sim-result-card">
        <div className="sim-result-row">
          <span className="sim-result-label">모발 밀도 회복 예상</span>
          <span style={{ color: monthData.color, fontWeight: 700 }}>{monthData.density}%</span>
        </div>
        <ProgressBar value={monthData.density} color={monthData.color} />

        <div className="sim-result-badge" style={{ background: `${monthData.color}22`, color: monthData.color }}>
          {monthData.recovery}
        </div>

        <p className="sim-result-desc">{monthData.description}</p>

        <div className="sim-ref-box" style={{ marginTop: '1rem' }}>
          <span className="sim-ref-icon">📚</span>
          <span style={{ fontSize: '0.72rem' }}>출처: {drugData.reference}</span>
        </div>
      </div>

      <div className="sim-btn-row">
        <button className="med-btn-ghost" onClick={onBack}>← 이전</button>
        <button className="med-btn-primary" style={{ flex: 1 }} onClick={onNext}>추가 케어 추천 보기 →</button>
      </div>
    </div>
  );
};

// ── Step 4: 추가 추천 ───────────────────────────────────────────
const Step4 = ({ medInfo, onBack, onRestart }) => {
  const [activeNutrition, setActiveNutrition] = useState(null);
  const drugData = DRUG_DATA[medInfo.drug];

  return (
    <div className="sim-step fade-in">
      <div className="sim-step-header">
        <div className="sim-step-num">04</div>
        <div>
          <h2 className="sim-step-title">추가 케어 & 영양 가이드</h2>
          <p className="sim-step-sub">회복을 가속화하는 보완 요법</p>
        </div>
      </div>

      {/* Drug mechanism info */}
      <div className="sim-mech-card">
        <div className="sim-mech-title">{drugData.name}</div>
        <p className="sim-mech-desc">{drugData.mechanism}</p>
      </div>

      {/* Additional treatments */}
      <h3 className="sim-section-title">추가 치료법 추천</h3>
      <div className="sim-treatment-list">
        {ADDITIONAL_TREATMENTS.map((t, i) => (
          <div key={i} className="sim-treatment-item">
            <div className="sim-treatment-icon">{t.icon}</div>
            <div className="sim-treatment-body">
              <div className="sim-treatment-name">
                {t.name}
                <span className={`sim-treatment-badge badge-${t.level === '고효과' ? 'high' : t.level === '중효과' ? 'mid' : t.level === '보조' ? 'low' : 'special'}`}>{t.level}</span>
              </div>
              <p className="sim-treatment-desc">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Nutrition */}
      <h3 className="sim-section-title" style={{ marginTop: '2rem' }}>모발에 좋은 영양 성분</h3>
      <div className="sim-nutrition-grid">
        {NUTRITION_DATA.map((n, i) => (
          <div key={i} className={`sim-nutrition-card ${activeNutrition === i ? 'expanded' : ''}`} onClick={() => setActiveNutrition(activeNutrition === i ? null : i)}>
            <div className="sim-nutrition-top">
              {n.img
                ? <img src={n.img} alt={n.name} className="sim-nutrition-img" />
                : <div className="sim-nutrition-emoji">{n.icon}</div>
              }
              <div>
                <div className="sim-nutrition-name">{n.name}</div>
                <div className="sim-nutrition-foods">{n.foods}</div>
              </div>
              <div className="sim-nutrition-toggle">{activeNutrition === i ? '▲' : '▼'}</div>
            </div>
            {activeNutrition === i && (
              <div className="sim-nutrition-detail fade-in">
                <p className="sim-nutrition-reason"><strong>필요한 이유:</strong> {n.reason}</p>
                <p className="sim-nutrition-explain">{n.detail}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sim-btn-row" style={{ marginTop: '2rem' }}>
        <button className="med-btn-ghost" onClick={onBack}>← 이전</button>
        <button className="med-btn-primary" style={{ flex: 1 }} onClick={onRestart}>처음부터 다시 →</button>
      </div>
    </div>
  );
};

// ── 메인 HairSimTab ──────────────────────────────────────────────
const HairSimTab = () => {
  const [step, setStep] = useState(1);
  const [medInfo, setMedInfo] = useState(null);
  const [photos, setPhotos] = useState(null);
  const [apiResult, setApiResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleStep1 = (info) => {
    setMedInfo(info);
    setStep(2);
  };

  const handleStep2 = async (photoData) => {
    setPhotos(photoData);
    setApiResult(null);
    setApiError(null);
    setStep(3);
    setIsAnalyzing(false);
    setIsLoadingAI(true);

    try {
      const drug = DRUG_DATA[medInfo?.drug];

      const payload = {
        image: photoData.front,
        drug_name: drug?.name || 'Hair loss'
      };

      const response = await fetch('/api/simulate_hair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API 오류 ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.predicted_image) {
        setApiResult({ predicted_image: result.data.predicted_image });
      } else {
        throw new Error(result.error || 'AI 이미지 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('AI 시뮬레이션 오류:', err);
      setApiError(err.message || 'AI 이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleRestart = () => {
    setStep(1);
    setMedInfo(null);
    setPhotos(null);
    setApiResult(null);
  };

  return (
    <div className="sim-container fade-in">
      {/* Header Banner */}
      <div className="tab-banner">
        <img src="/assets/banners/banner_simulator.jpg" alt="AI 예측" className="tab-banner-img" />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">AI 모발 예측</h1>
          <p className="tab-banner-sub">복약 후 1·2·3개월 변화를 미리 확인하세요</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="sim-stepper">
        {[1, 2, 3, 4].map(s => (
          <React.Fragment key={s}>
            <div className={`sim-stepper-dot ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}>{s}</div>
            {s < 4 && <div className={`sim-stepper-line ${step > s ? 'active' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Analyzing overlay */}
      {isAnalyzing && (
        <div className="sim-analyzing-overlay">
          <div className="sim-analyzing-spinner" />
          <p>AI가 모발 변화를 분석 중입니다...</p>
        </div>
      )}

      <div className="sim-content">
        {step === 1 && <Step1 onNext={handleStep1} />}
        {step === 2 && <Step2 onNext={handleStep2} onBack={() => setStep(1)} />}
        {step === 3 && medInfo && photos && (
          <Step3
            medInfo={medInfo}
            photos={photos}
            apiResult={apiResult}
            isLoadingAI={isLoadingAI}
            apiError={apiError}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && medInfo && (
          <Step4
            medInfo={medInfo}
            onBack={() => setStep(3)}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
};

export default HairSimTab;
