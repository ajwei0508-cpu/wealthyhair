import React, { useState, useEffect } from 'react';
import { set, get } from 'idb-keyval';
import './JournalTab.css';
import './MedicationTab.css';
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
      if (file) {
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

  const Banner = () => (
    <div className="tab-banner">
      <img src="/assets/banners/banner_journal.jpg" alt="성장 일지" className="tab-banner-img" />
      <div className="tab-banner-overlay">
        <h1 className="tab-banner-title">성장 일지</h1>
        <p className="tab-banner-sub">모발 변화를 객관적으로 기록하세요</p>
      </div>
    </div>
  );

  if (!hasConsent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Banner />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="med-card" style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#D4AF37', marginBottom: '0.8rem' }}>개인정보 동의 필요</h2>
            <p style={{ color: '#777', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              성장 일지는 두피·모발 사진을 기기 내부에 암호화하여 저장합니다. 서버로는 전송되지 않습니다.
            </p>
            <button className="med-btn-primary" onClick={handleConsent}>동의하고 시작하기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="av-content fade-in" style={{ padding: 0 }}>
      <Banner />
      <div style={{ padding: '1rem 1rem 80px' }}>
        <div className="med-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.4rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>오늘의 모발 기록</div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 2 }}>같은 구도로 꾸준히 촬영하세요</div>
          </div>
          <button
            onClick={takePhoto}
            style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '50%', width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem' }}
          >📸</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
          {photos.map(p => (
            <div key={p.id} style={{ position: 'relative', borderRadius: 2, overflow: 'hidden', aspectRatio: '1', background: '#111' }}>
              <img src={p.src} alt={p.date} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '0.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', fontFamily: 'Montserrat, sans-serif' }}>
                {p.date}
              </div>
            </div>
          ))}
          {photos.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: '#555' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
              <p style={{ fontSize: '0.85rem' }}>아직 기록된 사진이 없습니다</p>
            </div>
          )}
        </div>

        <div className="med-card" style={{ marginTop: '1rem' }}>
          <div className="med-card-header">
            <Info size={14} color="#D4AF37" />
            <span>왜 사진을 남기나요?</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#777', lineHeight: 1.7 }}>
            매일 같은 구도로 촬영하면 미세한 솜털 성장과 밀도 변화를 객관적으로 확인할 수 있어, 약물 치료 효과 판단의 가장 확실한 기준이 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JournalTab;
