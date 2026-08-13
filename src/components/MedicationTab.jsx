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
    
    alert(`[스마트 설정 완료] ${medName} 복용 시간이 매일 오후 10시로 자동 설정되었습니다. 수정하시려면 다시 설정해주세요.`);
  };

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

  return (
    <div className="av-content fade-in">
      {showChat ? (
        <AvatarChat onClose={() => setShowChat(false)} />
      ) : (
        <>
          <h1 className="av-title">
            <span className="av-highlight">복약</span>을 체계적으로 관리하세요
          </h1>

          <div className="av-info-card text-center" style={{marginTop: 0, marginBottom: '2rem'}}>
            <button className="av-continue-btn" style={{padding: '0.8rem', fontSize: '0.9rem', marginBottom: '1rem', background: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--text-main)'}} onClick={() => setShowChat(true)}>
              🤖 AI 복약상담 시작하기
            </button>
            
            {alarm ? (
              <>
                <div className="av-info-header" style={{justifyContent: 'center'}}>현재 알림 설정</div>
                <p style={{fontSize: '1.2rem', color: 'var(--accent-gold)', fontWeight: 'bold'}}>{alarm.medName}</p>
                <p style={{color: 'var(--text-muted)', marginTop: '0.5rem'}}>매일 {alarm.time}</p>
                <button className="av-continue-btn" style={{marginTop: '1rem', padding: '0.8rem', background: 'var(--bg-surface)', color: 'var(--text-muted)'}} onClick={() => setShowSetup(true)}>
                  설정 변경
                </button>
              </>
            ) : (
              <div>
                <p style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>설정된 알림이 없습니다.</p>
                <button className="av-continue-btn" onClick={() => setShowSetup(true)}>새 알림 설정</button>
              </div>
            )}
          </div>

          {showSetup && (
            <div className="setup-modal">
              <div className="av-info-card" style={{margin: '2rem', width: '100%'}}>
                <h3 style={{fontFamily: 'var(--font-serif)', marginBottom: '1rem'}}>복약 스마트 설정</h3>
                <input 
                  type="text" 
                  placeholder="약품명 (예: 프로페시아)" 
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="av-input"
                />
                <button className="av-continue-btn" onClick={handleAutoSetup}>자동 추천 설정으로 저장</button>
                <button className="av-continue-btn" style={{background: 'var(--bg-main)', color: 'var(--text-muted)', marginTop: '0.5rem'}} onClick={() => setShowSetup(false)}>취소</button>
              </div>
            </div>
          )}

          <div className="calendar-container">
            <h3 style={{fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '1rem'}}>{today.getMonth() + 1}월 복약 달력</h3>
            <div className="av-calendar-grid">
              {days.map(day => {
                const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const status = ledger[dateStr]?.status;
                let dotClass = '';
                if(status === 'verified') dotClass = 'dot-green';
                if(status === 'forced') dotClass = 'dot-orange';

                return (
                  <div key={day} className={`av-calendar-cell ${day === today.getDate() ? 'today' : ''}`}>
                    <span>{day}</span>
                    {dotClass && <div className={`status-dot ${dotClass}`}></div>}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="av-info-card" style={{marginTop: '2rem'}}>
            <div className="av-info-header">
              <Info size={14} color="#D4AF37" />
              <span>장부 안내</span>
            </div>
            <p className="av-info-text">
              초록색 점은 사진 인증 완료, 주황색 점은 수동(강제) 종료를 의미합니다. 매일 꾸준한 복약이 탈모 치료의 핵심입니다.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MedicationTab;
