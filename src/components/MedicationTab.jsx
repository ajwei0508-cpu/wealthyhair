import React, { useState, useEffect } from 'react';
import './MedicationTab.css';
import { Info, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DRUG_INTERACTIONS_DATA, DRUG_SIDE_EFFECTS_DATA } from '../data/medicalGuideData';

const MedicationTab = ({ onNavigateToGuide }) => {
  const [alarm, setAlarm] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [medName, setMedName] = useState('');
  const [medIngredient, setMedIngredient] = useState('finasteride');
  const [medTime, setMedTime] = useState('22:00');
  const [ledger, setLedger] = useState({});
  const [quickSafetyOpen, setQuickSafetyOpen] = useState(false);

  useEffect(() => {
    loadData();
    window.addEventListener('ledgerUpdated', loadData);
    return () => window.removeEventListener('ledgerUpdated', loadData);
  }, []);

  const loadData = () => {
    const savedAlarm = localStorage.getItem('medicationAlarm');
    if (savedAlarm) {
      const parsed = JSON.parse(savedAlarm);
      setAlarm(parsed);
      if (parsed.ingredient) setMedIngredient(parsed.ingredient);
    }
    const savedLedger = localStorage.getItem('medicationLedger');
    if (savedLedger) setLedger(JSON.parse(savedLedger));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  };

  const detectIngredientFromName = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('아보다트') || n.includes('두타')) return 'dutasteride';
    if (n.includes('로게인') || n.includes('마이녹실') || n.includes('외용')) return 'topical_minoxidil';
    if (n.includes('미녹시딜정') || n.includes('현대미녹시딜') || n.includes('경구미녹')) return 'oral_minoxidil';
    if (n.includes('알닥톤') || n.includes('스피로노')) return 'spironolactone';
    return medIngredient || 'finasteride';
  };

  const handleAutoSetup = () => {
    if (!medName.trim()) return alert('약품명을 입력해주세요.');
    const detectedIngredient = detectIngredientFromName(medName);
    const newAlarm = {
      medName: medName.trim(),
      ingredient: detectedIngredient,
      time: medTime || '22:00',
    };
    localStorage.setItem('medicationAlarm', JSON.stringify(newAlarm));
    setAlarm(newAlarm);
    setMedIngredient(detectedIngredient);
    setShowSetup(false);
    requestNotificationPermission();
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isTodayChecked = Boolean(ledger[todayStr]?.status);

  const handleCheckToday = () => {
    const nextLedger = {
      ...ledger,
      [todayStr]: {
        status: 'verified',
        checkedAt: new Date().toISOString(),
        medName: alarm?.medName || '탈모약',
      },
    };
    localStorage.setItem('medicationLedger', JSON.stringify(nextLedger));
    setLedger(nextLedger);
    window.dispatchEvent(new Event('ledgerUpdated'));
  };

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  const activeInteractionProfile =
    DRUG_INTERACTIONS_DATA.find((d) => d.id === (alarm?.ingredient || medIngredient)) ||
    DRUG_INTERACTIONS_DATA[0];
  const activeSideEffectProfile =
    DRUG_SIDE_EFFECTS_DATA.find((d) => d.id === (alarm?.ingredient || medIngredient)) ||
    DRUG_SIDE_EFFECTS_DATA[0];

  const verifiedCountThisMonth = Object.keys(ledger).filter((k) =>
    k.startsWith(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-`)
  ).length;
  const adherenceRate = Math.min(100, Math.round((verifiedCountThisMonth / Math.max(1, today.getDate())) * 100));

  return (
    <div className="av-content fade-in med-tab">
      {/* Header Banner */}
      <div className="tab-banner">
        <img src="/assets/banners/banner_medication.jpg" alt="복약 관리" className="tab-banner-img" />
        <div className="tab-banner-overlay">
          <h1 className="tab-banner-title">복약 & 안전 관리</h1>
          <p className="tab-banner-sub">일일 복약 인증 · 병용금기 양약 점검 · 부작용 모니터링</p>
        </div>
      </div>

      {/* 오늘 복약 원클릭 체크인 & 복약 순응도 카드 */}
      <div className="med-card" style={{ border: '1px solid rgba(212, 175, 55, 0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '0.73rem', color: '#D4AF37', fontWeight: 700 }}>TODAY CHECK-IN</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f5f0e8', marginTop: '2px' }}>
              {alarm ? `${alarm.medName} 복용 기록` : '오늘의 탈모약 복용 인증'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: '#999' }}>이달 복약 순응도</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D4AF37' }}>{adherenceRate}%</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCheckToday}
          disabled={isTodayChecked}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '10px',
            border: isTodayChecked ? '1px solid rgba(76, 175, 80, 0.5)' : 'none',
            background: isTodayChecked
              ? 'rgba(76, 175, 80, 0.16)'
              : 'linear-gradient(135deg, #D4AF37, #B89225)',
            color: isTodayChecked ? '#81C784' : '#000',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: isTodayChecked ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          {isTodayChecked ? `오늘(${todayStr}) 복약 인증 완료` : '오늘 탈모약 복용 완료 체크하기'}
        </button>
      </div>

      {/* 복용약 성분별 병용금기 양약 & 부작용 즉시 점검 카드 (아바타 모드 폐쇄 및 전문 약학 안전 모듈로 대체) */}
      <div className="med-card">
        <div className="med-card-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={15} color="#FF8A80" />
            <span>내 복용약 병용금기 양약 · 부작용 브리핑</span>
          </div>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(255, 82, 82, 0.15)',
              color: '#FF8A80',
              fontWeight: 700,
            }}
          >
            DUR 안전점검
          </span>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#ddd', marginBottom: '10px', lineHeight: 1.5 }}>
          현재 기준 성분: <strong style={{ color: '#D4AF37' }}>{activeInteractionProfile.ingredient}</strong>
        </div>

        <div
          style={{
            background: 'rgba(255, 82, 82, 0.08)',
            border: '1px solid rgba(255, 82, 82, 0.25)',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '10px',
          }}
        >
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#FF8A80', marginBottom: '4px' }}>
            ⛔ 함께 복용하면 안 되는 대표 양약
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#ccc', lineHeight: 1.55 }}>
            {activeInteractionProfile.contraindicatedDrugs.slice(0, 3).map((d, i) => (
              <li key={i}>
                <strong>{d.drugClass.split(' (')[0]}</strong> ({d.riskLevel})
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="med-btn-ghost"
            style={{ flex: 1, fontSize: '0.76rem', padding: '9px' }}
            onClick={() => setQuickSafetyOpen(!quickSafetyOpen)}
          >
            {quickSafetyOpen ? '부작용 요약 닫기 ▲' : '주요 부작용 요약 보기 ▼'}
          </button>
          {onNavigateToGuide && (
            <button
              type="button"
              className="med-btn-primary"
              style={{ flex: 1, fontSize: '0.76rem', padding: '9px' }}
              onClick={() => onNavigateToGuide('interactions')}
            >
              전체 금기약·식품 백과 →
            </button>
          )}
        </div>

        {quickSafetyOpen && (
          <div
            className="fade-in"
            style={{
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.75rem',
              color: '#ccc',
              lineHeight: 1.55,
            }}
          >
            <div style={{ color: '#FFB74D', fontWeight: 700, marginBottom: '6px' }}>
              <AlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              {activeSideEffectProfile.drugName} 복용 시 체크리스트
            </div>
            <div>• <strong>헌혈 금지 기간:</strong> {activeSideEffectProfile.bloodDonationBan}</div>
            {activeSideEffectProfile.systems.slice(0, 3).map((s, idx) => (
              <div key={idx} style={{ marginTop: '4px' }}>
                • <strong>[{s.system}]</strong> {s.symptoms.join(', ')} ({s.incidence})
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 알림 설정 카드 */}
      <div className="med-card">
        <div className="med-card-header">
          <Info size={14} color="#D4AF37" />
          <span>복약 알림 설정</span>
        </div>
        {alarm ? (
          <div className="med-alarm-display">
            <div className="med-alarm-name">{alarm.medName}</div>
            <div className="med-alarm-time">매일 {alarm.time} 알림</div>
            <div className="med-alarm-status active">● 활성화됨</div>
            <button className="med-btn-ghost" onClick={() => setShowSetup(true)}>
              복용약 · 알림 시간 변경
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              설정된 복약 알림이 없습니다.
            </p>
            <button className="med-btn-primary" onClick={() => setShowSetup(true)}>
              새 복약 알림 설정하기
            </button>
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <div className="med-modal-overlay" onClick={() => setShowSetup(false)}>
          <div className="med-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="med-modal-title">복약 스마트 설정</h3>
            <p className="med-modal-sub">
              복용 중인 탈모약 성분과 이름을 입력하면
              <br />
              맞춤 안전 가이드와 알림이 설정됩니다.
            </p>
            <select
              value={medIngredient}
              onChange={(e) => setMedIngredient(e.target.value)}
              className="med-input"
              style={{ marginBottom: '8px', background: '#141418', color: '#f5f0e8' }}
            >
              <option value="finasteride">피나스테리드 (프로페시아·피나온 등)</option>
              <option value="dutasteride">두타스테리드 (아보다트·두타온 등)</option>
              <option value="oral_minoxidil">경구용 미녹시딜정 (현대미녹시딜 등)</option>
              <option value="topical_minoxidil">외용 미녹시딜 (로게인폼·마이녹실 등)</option>
              <option value="spironolactone">스피로노락톤 (여성 안드로겐 탈모)</option>
            </select>
            <input
              type="text"
              placeholder="처방 약품명 (예: 프로페시아 1mg)"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              className="med-input"
            />
            <input
              type="time"
              value={medTime}
              onChange={(e) => setMedTime(e.target.value)}
              className="med-input"
            />
            <button className="med-btn-primary" onClick={handleAutoSetup}>
              저장 및 알림 활성화
            </button>
            <button className="med-btn-ghost" onClick={() => setShowSetup(false)}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="med-card">
        <div className="med-card-header">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{today.getMonth() + 1}월 복약 달력</span>
        </div>
        <div className="med-cal-labels">
          {dayLabels.map((d) => (
            <span key={d} className="med-cal-label">
              {d}
            </span>
          ))}
        </div>
        <div className="med-cal-grid">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="med-cal-cell empty" />
          ))}
          {days.map((day) => {
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const status = ledger[dateStr]?.status;
            const isToday = day === today.getDate();
            let statusClass = '';
            if (status === 'verified') statusClass = 'verified';
            if (status === 'forced') statusClass = 'forced';
            return (
              <div key={day} className={`med-cal-cell ${isToday ? 'today' : ''} ${statusClass}`}>
                <span>{day}</span>
              </div>
            );
          })}
        </div>
        <div className="med-cal-legend">
          <span className="legend-item">
            <span className="legend-dot verified" />
            인증 완료
          </span>
          <span className="legend-item">
            <span className="legend-dot forced" />
            수동 확인
          </span>
          <span className="legend-item">
            <span className="legend-dot today-dot" />
            오늘
          </span>
        </div>
      </div>
    </div>
  );
};

export default MedicationTab;
