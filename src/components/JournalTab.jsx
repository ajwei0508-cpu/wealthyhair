import React, { useState, useEffect } from 'react';
import { set, get } from 'idb-keyval';
import './JournalTab.css';
import { Info } from 'lucide-react';

const JournalTab = () => {
  const [hasConsent, setHasConsent] = useState(false);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const consent = localStorage.getItem('journalConsent');
    if (consent === 'true') {
      setHasConsent(true);
      loadPhotos();
    }
  }, []);

  const loadPhotos = async () => {
    const saved = await get('journalPhotos');
    if (saved) setPhotos(saved);
  };

  const handleConsent = () => {
    localStorage.setItem('journalConsent', 'true');
    setHasConsent(true);
  };

  const takePhoto = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if(file) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const newPhoto = { id: Date.now(), date: new Date().toISOString().split('T')[0], src: ev.target.result };
          const newPhotos = [newPhoto, ...photos];
          setPhotos(newPhotos);
          await set('journalPhotos', newPhotos);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  if (!hasConsent) {
    return (
      <div className="setup-modal">
        <div className="av-info-card text-center" style={{margin: '2rem', width: '100%'}}>
          <h1 className="av-title" style={{fontSize: '1.5rem', marginBottom: '1rem'}}>
            <span className="av-highlight">개인정보 수집</span> 및<br/>사진 저장 동의
          </h1>
          <p className="av-info-text" style={{margin: '1.5rem 0'}}>
            성장 일지 기능은 사용자의 민감한 두피 및 얼굴 사진을 기기 내부에 암호화하여 저장합니다. 원활한 기능 사용을 위해 동의가 필요합니다.
          </p>
          <button className="av-continue-btn" onClick={handleConsent}>
            동의하고 시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="av-content fade-in">
      <h1 className="av-title">
        <span className="av-highlight">모발 성장</span> 일지
      </h1>
      
      <div className="av-info-card text-center" style={{marginTop: 0, padding: '2rem 1.5rem'}}>
        <p className="av-info-text" style={{marginBottom: '1.5rem'}}>오늘의 모발 상태를 객관적으로 기록해보세요.</p>
        <button className="av-continue-btn" onClick={takePhoto}>📸 오늘 사진 촬영하기</button>
      </div>

      <div className="av-photo-grid">
        {photos.map(p => (
          <div key={p.id} className="av-photo-card">
            <img src={p.src} alt={p.date} />
            <div className="av-photo-date">{p.date}</div>
          </div>
        ))}
        {photos.length === 0 && (
          <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)'}}>
            저장된 사진이 없습니다.
          </div>
        )}
      </div>

      <div className="av-info-card">
        <div className="av-info-header">
          <Info size={14} color="#D4AF37" />
          <span>왜 사진을 남기나요?</span>
        </div>
        <p className="av-info-text">
          매일 같은 구도로 사진을 찍어두면 미세한 솜털의 성장과 밀도 변화를 객관적으로 파악할 수 있어 약물 치료 효과를 판별하는 가장 훌륭한 기준이 됩니다.
        </p>
      </div>
    </div>
  );
};

export default JournalTab;
