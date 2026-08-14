import React, { useState, useEffect } from 'react';
import './MedicationTab.css';
import AvatarChat from './AvatarChat';
import { Info } from 'lucide-react';

const MedicationTab = () => {
  const [alarm, setAlarm] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [medName, setMedName] = useState('');
  const [ledger, setLedger] = useState({});
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadData();
    window.addEventListener('ledgerUpdated', loadData);
    return () => window.removeEventListener('ledgerUpdated', loadData);
  }, []);

  const loadData = () => {
    const savedAlarm = localStorage.getItem('medicationAlarm');
    if (savedAlarm) setAlarm(JSON.parse(savedAlarm));
    const savedLedger = localStorage.getItem('medicationLedger');
    if (savedLedger) setLedger(JSON.parse(savedLedger));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  };

  const handleAutoSetup = () => {
    if (!medName) return alert('약품명을 입력해주세요.');
    const newAlarm = { medName, time: '22:00' };
    localStorage.setItem('medicationAlarm', JSON.stringify(newAlarm));
    setAlarm(newAlarm);
    setShowSetup(false);
    requestNotificationPermission();
    alert(`[스마트 설정 완료] ${medName} 복용 시간이 매일 오후 10시로 자동 설정되었습니다.`);
  };

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="av-content fade-in med-tab">
      {showChat ? (
        <AvatarChat onClose={() => setShowChat(false)} />
      ) : (
        <>
          {/* Header Banner */}
          <div className="tab-banner">
            <img src="/assets/banners/banner_medication.jpg" alt="복약 관리" className="tab-banner-img" />
            <div className="tab-banner-overlay">
              <h1 className="tab-banner-title">복약 관리</h1>
              <p className="tab-banner-sub">체계적인 복약으로 최고의 효과를</p>
            </div>
          </div>

          {/* AI 상담 + 알림 설정 카드 */}
          <div className="med-card">
            <button className="med-ai-btn" onClick={() => setShowChat(true)}>
              <span className="med-ai-icon">🤖</span>
              <div>
                <div className="med-ai-title">AI 복약 상담</div>
                <div className="med-ai-sub">궁금한 점을 AI에게 물어보세요</div>
              </div>
              <span className="med-ai-arrow">›</span>
            </button>
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
                <button className="med-btn-ghost" onClick={() => setShowSetup(true)}>설정 변경</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>설정된 알림이 없습니다.</p>
                <button className="med-btn-primary" onClick={() => setShowSetup(true)}>새 알림 설정하기</button>
              </div>
            )}
          </div>

          {/* Setup Modal */}
          {showSetup && (
            <div className="med-modal-overlay" onClick={() => setShowSetup(false)}>
              <div className="med-modal" onClick={e => e.stopPropagation()}>
                <h3 className="med-modal-title">복약 스마트 설정</h3>
                <p className="med-modal-sub">복용 중인 약 이름을 입력하면<br/>최적 시간으로 자동 설정됩니다.</p>
                <input
                  type="text"
                  placeholder="약품명 (예: 프로페시아, 미녹시딜)"
                  value={medName}
                  onChange={e => setMedName(e.target.value)}
                  className="med-input"
                />
                <button className="med-btn-primary" onClick={handleAutoSetup}>자동 추천 설정으로 저장</button>
                <button className="med-btn-ghost" onClick={() => setShowSetup(false)}>취소</button>
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="med-card">
            <div className="med-card-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>{today.getMonth() + 1}월 복약 달력</span>
            </div>
            <div className="med-cal-labels">
              {dayLabels.map(d => <span key={d} className="med-cal-label">{d}</span>)}
            </div>
            <div className="med-cal-grid">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="med-cal-cell empty" />
              ))}
              {days.map(day => {
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
              <span className="legend-item"><span className="legend-dot verified" />인증 완료</span>
              <span className="legend-item"><span className="legend-dot forced" />수동 확인</span>
              <span className="legend-item"><span className="legend-dot today-dot" />오늘</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MedicationTab;
