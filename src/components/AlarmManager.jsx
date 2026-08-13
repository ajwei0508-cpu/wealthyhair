import React, { useEffect, useState } from 'react';
import './AlarmManager.css';

const AlarmManager = () => {
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [audio] = useState(new Audio('/alarm.mp3')); // Assume alarm.mp3 is in public

  useEffect(() => {
    const checkAlarm = () => {
      const savedAlarm = localStorage.getItem('medicationAlarm');
      if (savedAlarm && !alarmTriggered) {
        const alarmData = JSON.parse(savedAlarm);
        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;

        // Ensure we don't trigger multiple times in the same minute
        const lastTriggered = localStorage.getItem('lastTriggeredTime');

        if (alarmData.time === currentTime && lastTriggered !== currentTime) {
          triggerAlarm(alarmData, currentTime);
        }
      }
    };

    const intervalId = setInterval(checkAlarm, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [alarmTriggered]);

  const triggerAlarm = (alarmData, currentTime) => {
    setAlarmTriggered(true);
    setActiveAlarm(alarmData);
    localStorage.setItem('lastTriggeredTime', currentTime);
    
    // Notification API
    if (Notification.permission === 'granted') {
      new Notification('WealthyHair 복약 알림', {
        body: `${alarmData.medName} 복용 시간입니다!`,
      });
    }

    // Audio API
    audio.loop = true;
    audio.play().catch(e => console.log('Audio autoplay blocked', e));
  };

  const handleStopAlarm = (isForced) => {
    audio.pause();
    audio.currentTime = 0;
    setAlarmTriggered(false);
    setActiveAlarm(null);
    
    // Log to ledger
    const ledger = JSON.parse(localStorage.getItem('medicationLedger') || '{}');
    const today = new Date().toISOString().split('T')[0];
    ledger[today] = {
      status: isForced ? 'forced' : 'verified',
      time: new Date().toLocaleTimeString(),
      medName: activeAlarm?.medName
    };
    localStorage.setItem('medicationLedger', JSON.stringify(ledger));
    
    // Dispatch custom event to update ledger UI
    window.dispatchEvent(new Event('ledgerUpdated'));
  };

  if (!alarmTriggered) return null;

  return (
    <div className="alarm-overlay fade-in">
      <div className="alarm-content">
        <h2 className="pulse-text">복약 알림</h2>
        <p className="alarm-med-name">{activeAlarm?.medName}</p>
        <p className="alarm-time">지금 약을 복용할 시간입니다!</p>
        
        <div className="alarm-actions">
          <button className="btn-primary" onClick={() => handleStopAlarm(false)}>
            사진 인증하고 알림 종료
          </button>
          <button className="btn-secondary alarm-force-btn" onClick={() => {
            if(window.confirm('약 없이 강제로 알림을 종료하시겠습니까? (수동 기록됨)')) {
              handleStopAlarm(true);
            }
          }}>
            강제 종료
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlarmManager;
