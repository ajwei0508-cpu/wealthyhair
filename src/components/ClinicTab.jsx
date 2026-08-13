import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './ClinicTab.css';
import { Info } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const mockClinics = [
  { id: 1, name: '부유모발 피부과', lat: 37.4979, lng: 127.0276, address: '서울 강남구 강남대로', tags: ['모발이식', '피부과 전문의'] },
  { id: 2, name: '풍성한내일 탈모센터', lat: 37.5002, lng: 127.0360, address: '서울 강남구 역삼로', tags: ['여성탈모', '원형탈모'] },
  { id: 3, name: '골든크라운 의원', lat: 37.4950, lng: 127.0300, address: '서울 서초구 서초대로', tags: ['두피문신', '모발이식'] },
];

const ClinicTab = () => {
  const center = [37.4979, 127.0276];

  const openNaverMap = (clinicName) => {
    const url = `https://map.naver.com/v5/search/${encodeURIComponent(clinicName)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="av-content fade-in">
      <h1 className="av-title">
        주변 <span className="av-highlight">탈모 전문</span> 병원
      </h1>

      <div className="av-map-wrapper">
        <MapContainer center={center} zoom={14} style={{ height: '300px', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {mockClinics.map(clinic => (
            <Marker key={clinic.id} position={[clinic.lat, clinic.lng]}>
              <Popup>
                <div className="custom-popup">
                  <strong>{clinic.name}</strong><br/>
                  {clinic.address}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="av-info-card" style={{marginTop: '1rem', marginBottom: '2rem'}}>
        <div className="av-info-header">
          <Info size={14} color="#D4AF37" />
          <span>병원 방문 팁</span>
        </div>
        <p className="av-info-text">
          전문의가 직접 진료하는 곳인지, 모발이식 등 본인이 원하는 시술을 전문으로 하는 곳인지 태그를 확인하세요.
        </p>
      </div>

      <div className="av-clinic-list">
        {mockClinics.map(clinic => (
          <div key={clinic.id} className="av-info-card" style={{marginTop: 0, marginBottom: '1rem', padding: '1.2rem'}}>
            <h3 style={{color: 'var(--accent-gold)', marginBottom: '0.5rem', fontSize: '1.2rem'}}>{clinic.name}</h3>
            <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem'}}>{clinic.address}</p>
            
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem'}}>
              {clinic.tags.map(tag => (
                <span key={tag} style={{background: 'var(--border-light)', padding: '4px 10px', borderRadius: '15px', fontSize: '0.75rem'}}>
                  {tag}
                </span>
              ))}
            </div>
            
            <button className="av-continue-btn" style={{padding: '0.8rem', fontSize: '0.9rem'}} onClick={() => openNaverMap(clinic.name)}>
              네이버 지도로 열기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClinicTab;
