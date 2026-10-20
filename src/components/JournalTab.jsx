import React, { useState, useEffect } from 'react';
import { set, get } from 'idb-keyval';
import './JournalTab.css';
import './MedicationTab.css';

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
      <img src="/assets/banners/banner_medication.jpg" alt="성장 일지" className="tab-banner-img" />
      <div className="tab-banner-overlay">
        <h1 className="tab-banner-title">모발 성장 일지</h1>
        <p className="tab-banner-sub">기기 내 암호화 보관으로 모발 변화를 기록하세요</p>
      </div>
    </div>
  );

  if (!hasConsent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Banner />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="med-card" style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>🔒</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: '#D4AF37', marginBottom: '0.6rem' }}>기기 내 안전 보관 안내</h2>
            <p style={{ color: '#888', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
              촬영된 사진은 외부 서버로 전송되지 않으며 내 기기 내부에만 안전하게 저장됩니다.
            </p>
            <button className="med-btn-primary" onClick={handleConsent}>동의하고 기록 시작하기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="av-content fade-in" style={{ padding: 0 }}>
      <Banner />
      <div style={{ padding: '1rem 1rem 80px' }}>
        <div className="med-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.2rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>오늘의 모발 사진 남기기</div>
            <div style={{ fontSize: '0.73rem', color: '#888', marginTop: 2 }}>같은 조명과 각도로 기록해 보세요</div>
          </div>
          <button
            onClick={takePhoto}
            style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.1rem' }}
          >📸</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
          {photos.map(p => (
            <div key={p.id} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', aspectRatio: '1', background: '#111' }}>
              <img src={p.src} alt={p.date} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '0.4rem', fontSize: '0.7rem', color: '#eee' }}>
                {p.date}
              </div>
            </div>
          ))}
          {photos.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2.5rem 0', color: '#666' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>📷</div>
              <p style={{ fontSize: '0.8rem' }}>아직 등록된 성장 일지 사진이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalTab;
