import { useState } from 'react';
import { Wrench, Clock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import './HairSimTab.css';
import './MedicationTab.css';

// ── 복약 성분별 1·3·6·12개월 표준 임상 경과 참고 데이터 ──────────────────────
const DRUG_DATA = {
  finasteride: {
    name: '피나스테리드 1mg (프로페시아·피나온)',
    shortName: '피나스테리드 1mg',
    mechanism: '두피 DHT를 약 65~70% 억제하여 모낭 축소를 막고 가늘어진 연모를 굵은 성모로 회복시킵니다.',
    months: {
      1: { density: 8, description: 'DHT 감소 시작 단계로 빠지는 모발 수가 줄어들기 시작합니다.', recovery: 'DHT 억제 · 탈락 감소', color: '#6B8E6E' },
      3: { density: 28, description: '휴지기 모낭이 성장기로 전환되며 잔머리와 모발 밀도가 약 +10% 증가합니다.', recovery: '모발 밀도 +10% 회복', color: '#4CAF50' },
      6: { density: 46, description: '가르마와 M자 경계부 모발이 굵어지며 육안으로 두피 비침 완화가 확인됩니다.', recovery: '모발 굵기·볼륨 본격 회복', color: '#81C784' },
      12: { density: 62, description: '1cm²당 평균 +18~22모 증가하며 최대 임상 발모 효과 구간에 도달합니다.', recovery: '최대 밀도 회복 (+20모/cm²)', color: '#D4AF37' },
    },
  },
  dutasteride: {
    name: '두타스테리드 0.5mg (아보다트·두타온)',
    shortName: '두타스테리드 0.5mg',
    mechanism: '1형·2형 효소를 이중 차단하여 DHT를 92% 이상 억제하며 전두부(M자)·정수리 동시 회복에 탁월합니다.',
    months: {
      1: { density: 12, description: '혈중 DHT 90% 이상 급감과 함께 두피 피지·열감이 빠르게 완화됩니다.', recovery: 'DHT 92% 이중 차단', color: '#8B7E6E' },
      3: { density: 38, description: 'M자 경계와 정수리에서 초기 신생모 출현 및 밀도 +17% 증가가 관찰됩니다.', recovery: '모발 밀도 +17% 회복', color: '#4CAF50' },
      6: { density: 58, description: '전두부(M자) 및 정수리 모간 굵기가 뚜렷하게 굵어지고 피복률이 상승합니다.', recovery: '전두부·정수리 동시 개선', color: '#81C784' },
      12: { density: 74, description: '단일 경구제 중 가장 높은 모낭 밀도 회복률을 기록합니다.', recovery: '최상위 밀도 회복 (+26모/cm²)', color: '#D4AF37' },
    },
  },
  minoxidil: {
    name: '미녹시딜 5% (로게인폼·마이녹실)',
    shortName: '미녹시딜 5%',
    mechanism: '모낭 미세혈류를 확장하고 성장인자(VEGF)를 유도하여 모낭 크기를 직접 키웁니다.',
    months: {
      1: { density: 6, description: '새 머리가 자라기 위해 기존 휴지기 모발이 밀려나는 쉐딩이 일시적으로 나타날 수 있습니다.', recovery: '성장기 전환 유도', color: '#8B6E6E' },
      3: { density: 34, description: '가르마와 헤어라인 부위에 솜털과 신생 연모가 뚜렷하게 올라옵니다.', recovery: '신생 잔머리 출현', color: '#4CAF50' },
      6: { density: 50, description: '모발 직경이 굵어지며 가르마 폭과 두피 비침이 눈에 띄게 줄어듭니다.', recovery: '가르마 비침 감소', color: '#81C784' },
      12: { density: 56, description: '성장기 모발 비율이 안정적으로 유지됩니다.', recovery: '볼륨·밀도 안정 유지', color: '#D4AF37' },
    },
  },
  combination: {
    name: '복합요법 (경구 DHT 억제제 + 미녹시딜)',
    shortName: '경구약 + 미녹시딜 복합',
    mechanism: 'DHT 차단(수비)과 모낭 혈류 촉진(공격)을 병행하여 단독 요법 대비 34% 이상 높은 발모 시너지를 냅니다.',
    months: {
      1: { density: 15, description: '탈모 원인 차단과 혈류 공급이 동시에 작동합니다.', recovery: '이중 시너지 가동', color: '#7BA87E' },
      3: { density: 48, description: '단독 복용 대비 가장 빠른 초기 모발 밀도 증가를 보입니다.', recovery: '초기 발모 속도 극대화', color: '#4CAF50' },
      6: { density: 68, description: '헤어라인과 정수리 모두에서 뚜렷한 모낭 밀도 상승이 확인됩니다.', recovery: '모발 피복률 +68% 구간', color: '#81C784' },
      12: { density: 84, description: '비수술적 약물 치료 중 가장 높은 모발 회복 결과를 달성합니다.', recovery: '약물 치료 최고 회복 (+32모/cm²)', color: '#D4AF37' },
    },
  },
};

const HairSimTab = ({ onNavigateTab = null }) => {
  const [selectedDrug, setSelectedDrug] = useState('dutasteride');
  const [selectedMonth, setSelectedMonth] = useState(6);

  const currentDrugInfo = DRUG_DATA[selectedDrug] || DRUG_DATA.dutasteride;
  const currentMonthInfo = currentDrugInfo.months[selectedMonth] || currentDrugInfo.months[6];

  const handleDisabledNoticeClick = (e) => {
    e.preventDefault();
  };

  return (
    <div className="sim-container fade-in" style={{ paddingBottom: '90px' }}>
      <div className="tab-banner">
        <img src="/assets/banners/banner_simulator.jpg" alt="복약 전후 AI 예측 서비스 점검 안내 배너" className="tab-banner-img" />
        <div className="tab-banner-overlay">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span
              style={{
                padding: '2px 9px',
                borderRadius: '999px',
                background: 'rgba(255, 183, 77, 0.22)',
                border: '1px solid #FFB74D',
                color: '#FFB74D',
                fontSize: '0.68rem',
                fontWeight: 800,
              }}
            >
              🛠️ 서비스 점검중
            </span>
          </div>
          <h1 className="tab-banner-title">복약 전·후 AI 예측 (점검중)</h1>
          <p className="tab-banner-sub">실제 임상 모낭 밀도 예측 AI 엔진 정밀도 고도화 작업 진행 중</p>
        </div>
      </div>

      <div style={{ padding: '14px' }}>
        {/* 메인 점검중 안내 히어로 카드 */}
        <div
          data-testid="ai-sim-maintenance-card"
          style={{
            background: 'linear-gradient(145deg, rgba(28, 24, 16, 0.98), rgba(14, 14, 18, 0.98))',
            border: '1.5px solid #FFB74D',
            borderRadius: '16px',
            padding: '22px 18px',
            marginBottom: '14px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 183, 77, 0.14)',
                border: '1.5px solid rgba(255, 183, 77, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(255, 183, 77, 0.22)',
              }}
            >
              <Wrench size={26} color="#FFB74D" aria-hidden="true" />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'rgba(255, 183, 77, 0.16)',
                color: '#FFB74D',
                fontSize: '0.7rem',
                fontWeight: 800,
                marginBottom: '8px',
              }}
            >
              <Clock size={12} aria-hidden="true" /> UNDER MAINTENANCE · 시스템 점검 안내
            </span>

            <h2 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.4 }}>
              복약 전·후 AI 예측은 아직 점검 중입니다
            </h2>

            <p style={{ fontSize: '0.78rem', color: '#d6d1c4', margin: 0, lineHeight: 1.55 }}>
              내 모발 사진 기반 <strong style={{ color: '#FFD700' }}>1·3·6·12개월 복약 전·후 AI 발모 예측 시뮬레이션</strong>은 실제 임상 회복 경과와의 정밀도를 높이기 위한 AI 모델 고도화 점검을 진행하고 있습니다.
            </p>
          </div>

          {/* 점검 상세 현황 박스 */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.42)',
              border: '1px solid rgba(255, 183, 77, 0.24)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
              fontSize: '0.74rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ color: '#999', fontWeight: 700, flexShrink: 0 }}>점검 대상</span>
              <span style={{ color: '#eee', fontWeight: 600, textAlign: 'right' }}>
                복약 전·후 사진 AI 예측 & 비교 시뮬레이션
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ color: '#999', fontWeight: 700, flexShrink: 0 }}>현재 상태</span>
              <span style={{ color: '#FFB74D', fontWeight: 800, textAlign: 'right' }}>
                AI 발모 예측 엔진 점검 중 (재오픈 준비 중)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ color: '#999', fontWeight: 700, flexShrink: 0 }}>정상 이용</span>
              <span style={{ color: '#81C784', fontWeight: 700, textAlign: 'right' }}>
                남·여 AI 탈모 진단 · 원형탈모 · 사상체질 진단
              </span>
            </div>
          </div>

          {/* 비활성 점검 상태 표시 버튼 (키보드 포커스 유지 + 클릭 방지) */}
          <button
            type="button"
            aria-disabled="true"
            onClick={handleDisabledNoticeClick}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              border: '1px dashed rgba(255, 183, 77, 0.45)',
              background: 'rgba(255, 183, 77, 0.09)',
              color: '#FFB74D',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'not-allowed',
              marginBottom: onNavigateTab ? '12px' : 0,
            }}
          >
            🛠️ 복약 전·후 AI 예측 시뮬레이션 점검 중 (오픈 준비 중)
          </button>

          {/* 정상 운영 중인 핵심 진단 기능 바로가기 */}
          {onNavigateTab && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('diagnosis')}
                style={{
                  padding: '11px 10px',
                  borderRadius: '9px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
                  color: '#000',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <span>AI 탈모 진단하기</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('sasang')}
                style={{
                  padding: '11px 10px',
                  borderRadius: '9px',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  background: 'rgba(212, 175, 55, 0.14)',
                  color: '#f5d77f',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <span>사상체질 진단하기</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* 점검 기간 동안 열람 가능한 표준 임상 복약 경과 텍스트 가이드 */}
        <div
          style={{
            background: '#121216',
            border: '1px solid rgba(212, 175, 55, 0.28)',
            borderRadius: '14px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#D4AF37', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={14} aria-hidden="true" /> [참고] 복약 성분별 표준 임상 회복 가이드
            </h3>
            <span style={{ fontSize: '0.66rem', color: '#81C784', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
              <ShieldCheck size={12} aria-hidden="true" /> 학술 임상 기준
            </span>
          </div>
          <p style={{ fontSize: '0.71rem', color: '#999', margin: '0 0 10px', lineHeight: 1.45 }}>
            사진 기반 AI 예측 점검 기간 동안 성분별 평균 임상 회복 주기를 먼저 확인하실 수 있습니다.
          </p>

          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {[
              { id: 'finasteride', label: '피나스테리드' },
              { id: 'dutasteride', label: '두타스테리드' },
              { id: 'minoxidil', label: '미녹시딜' },
              { id: 'combination', label: '복합요법' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={selectedDrug === d.id}
                onClick={() => setSelectedDrug(d.id)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: selectedDrug === d.id ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                  background: selectedDrug === d.id ? '#D4AF37' : 'transparent',
                  color: selectedDrug === d.id ? '#000' : '#ccc',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
            {[1, 3, 6, 12].map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={selectedMonth === m}
                onClick={() => setSelectedMonth(m)}
                style={{
                  padding: '7px',
                  borderRadius: '8px',
                  border: selectedMonth === m ? '1px solid #4CAF50' : '1px solid rgba(255,255,255,0.08)',
                  background: selectedMonth === m ? 'rgba(76, 175, 80, 0.18)' : 'rgba(255,255,255,0.03)',
                  color: selectedMonth === m ? '#81C784' : '#999',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {m}개월차
              </button>
            ))}
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '11px 12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '5px' }}>
              <strong style={{ fontSize: '0.78rem', color: '#fff' }}>{currentDrugInfo.name}</strong>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: currentMonthInfo.color,
                  background: 'rgba(212, 175, 55, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                {selectedMonth}개월차 · {currentMonthInfo.recovery}
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#bbb', margin: '0 0 6px', lineHeight: 1.45 }}>
              {currentDrugInfo.mechanism}
            </p>
            <p style={{ fontSize: '0.74rem', color: '#f0ece1', margin: 0, fontWeight: 600, lineHeight: 1.48 }}>
              • {currentMonthInfo.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HairSimTab;
