// src/components/PrivateAdminModal.jsx
// 모발부자(WealthyHair) 비공개 관리자 모드 (Who · When · Where · What 초정밀 가입자 관제 센터)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Users,
  Clock,
  MapPin,
  Smartphone,
  Activity,
  Search,
  Download,
  RefreshCw,
  X,
  Eye,
  Trash2,
  CheckCircle2,
  Navigation,
  Globe,
  Cpu,
  FileSpreadsheet,
  KeyRound,
  Sparkles,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  getAdminAuditDashboardData,
  formatKstDateTime,
  formatRelativeTime,
  verifyAdminPin,
  setAdminUnlockedSession,
  isAdminSessionUnlocked,
  updateAdminCustomPin,
  setDemoDataVisibility,
  triggerPrecisionGpsCheck,
  deleteAdminAuditLog,
} from '../utils/adminAuditService';
import './PrivateAdminModal.css';

// 골드 핀 커스텀 아이콘 생성기
function createGoldPinIcon(isRealMember = true) {
  const bg = isRealMember
    ? 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)'
    : 'linear-gradient(135deg, #64B5F6 0%, #1E88E5 100%)';
  const border = isRealMember ? '#FFF3B0' : '#E3F2FD';
  return L.divIcon({
    className: 'wh-admin-custom-pin',
    html: `<div style="
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      background: ${bg};
      border: 2px solid ${border};
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.65);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #0b0b0e;
        transform: rotate(45deg);
      "></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
  });
}

// 지도 중심 이동 보조 컴포넌트
function MapFlyToController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.flyTo(center, zoom || 12, { duration: 0.9 });
    }
  }, [center, zoom, map]);
  return null;
}

const EVENT_TYPE_BADGES = {
  MEMBER_SIGNUP: { label: '신규 회원가입', bg: 'rgba(129, 199, 132, 0.18)', color: '#81C784', border: 'rgba(129, 199, 132, 0.45)' },
  MEMBER_LOGIN: { label: '회원 로그인', bg: 'rgba(100, 181, 246, 0.18)', color: '#64B5F6', border: 'rgba(100, 181, 246, 0.45)' },
  DIAGNOSIS_AGA: { label: '남·여 탈모 진단', bg: 'rgba(212, 175, 55, 0.2)', color: '#FFD54F', border: 'rgba(212, 175, 55, 0.55)' },
  DIAGNOSIS_AREATA: { label: '원형탈모(SALT) 진단', bg: 'rgba(255, 138, 101, 0.2)', color: '#FF8A65', border: 'rgba(255, 138, 101, 0.5)' },
  SASANG_CHECK: { label: '사상체질·식이 분석', bg: 'rgba(186, 104, 200, 0.2)', color: '#CE93D8', border: 'rgba(186, 104, 200, 0.45)' },
  MEDICATION_LOG: { label: '복약 체크·알림', bg: 'rgba(77, 208, 225, 0.18)', color: '#4DD0E1', border: 'rgba(77, 208, 225, 0.45)' },
  LOCATION_UPDATE: { label: 'GPS 정밀위치 인증', bg: 'rgba(129, 199, 132, 0.22)', color: '#A5D6A7', border: 'rgba(129, 199, 132, 0.5)' },
  KAKAO_REPORT: { label: '카톡 불편신고', bg: 'rgba(254, 229, 0, 0.18)', color: '#FEE500', border: 'rgba(254, 229, 0, 0.45)' },
  LOGOUT: { label: '로그아웃', bg: 'rgba(158, 158, 158, 0.16)', color: '#BDBDBD', border: 'rgba(158, 158, 158, 0.35)' },
  WITHDRAW: { label: '회원 탈퇴', bg: 'rgba(2ef, 83, 80, 0.2)', color: '#EF5350', border: 'rgba(239, 83, 80, 0.45)' },
  TAB_SWITCH: { label: '메뉴 이동·열람', bg: 'rgba(255, 255, 255, 0.08)', color: '#E0E0E0', border: 'rgba(255, 255, 255, 0.18)' },
  PAGE_VIEW: { label: '페이지 진입', bg: 'rgba(255, 255, 255, 0.08)', color: '#E0E0E0', border: 'rgba(255, 255, 255, 0.18)' },
};

function getEventBadge(eventType) {
  return (
    EVENT_TYPE_BADGES[eventType] || {
      label: eventType || '활동 기록',
      bg: 'rgba(212, 175, 55, 0.14)',
      color: '#D4AF37',
      border: 'rgba(212, 175, 55, 0.35)',
    }
  );
}

function formatDurationReadable(sec) {
  const s = Math.max(1, Number(sec) || 0);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}분 ${rem}초` : `${m}분`;
}

const PrivateAdminModal = ({ isOpen, onClose, currentUser = null }) => {
  const [unlocked, setUnlocked] = useState(() => isAdminSessionUnlocked());
  const [pinInput, setPinInput] = useState('');
  const [persistDeviceUnlock, setPersistDeviceUnlock] = useState(true);
  const [pinError, setPinError] = useState('');

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'members' | 'locations' | 'logs'
  const [includeDemo, setIncludeDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    members: [],
    logs: [],
    regionBreakdown: [],
    sectionBreakdown: [],
    hourlyCounts: [],
    kpis: {
      totalSubscribers: 0,
      realSubscribers: 0,
      demoSubscribers: 0,
      todayActiveUsers: 0,
      totalEvents: 0,
      totalDiagnosesCount: 0,
      activeRegionsCount: 0,
    },
  });

  // 가입자 검색·필터·정렬 상태
  const [memberSearch, setMemberSearch] = useState('');
  const [memberGenderFilter, setMemberGenderFilter] = useState('all');
  const [memberSortBy, setMemberSortBy] = useState('lastActive'); // 'lastActive' | 'createdAt' | 'events' | 'diagnoses'
  const [selectedMember, setSelectedMember] = useState(null);

  // 지도 포커스 좌표 상태
  const [mapCenter, setMapCenter] = useState([36.5, 127.75]);
  const [mapZoom, setMapZoom] = useState(7);

  // 감사 로그 필터 상태
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  // PIN 변경 상태
  const [newCustomPin, setNewCustomPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState('');
  const [gpsStatusMsg, setGpsStatusMsg] = useState('');

  // diagnosis.html 등에서 열렸을 때 Leaflet CSS가 없으면 자동 주입
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const existingLink = document.querySelector('link[href*="leaflet.css"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, [isOpen]);

  const loadAuditData = useCallback(
    async (demoFlag = includeDemo) => {
      setLoading(true);
      try {
        const data = await getAdminAuditDashboardData({ includeDemo: demoFlag });
        setDashboardData(data);
        if (selectedMember) {
          const updatedSel = data.members.find((m) => m.id === selectedMember.id);
          if (updatedSel) setSelectedMember(updatedSel);
        }
      } catch (err) {
        console.warn('[AdminModal] Load error:', err);
      } finally {
        setLoading(false);
      }
    },
    [includeDemo, selectedMember]
  );

  useEffect(() => {
    if (isOpen && unlocked) {
      loadAuditData(includeDemo);
    }
  }, [isOpen, unlocked, includeDemo]);

  useEffect(() => {
    if (!isOpen || !unlocked) return;
    const onAuditUpdate = () => loadAuditData(includeDemo);
    window.addEventListener('adminAuditUpdated', onAuditUpdate);
    return () => window.removeEventListener('adminAuditUpdated', onAuditUpdate);
  }, [isOpen, unlocked, includeDemo, loadAuditData]);

  const handlePinSubmit = (e) => {
    if (e) e.preventDefault();
    if (verifyAdminPin(pinInput)) {
      setAdminUnlockedSession(true, persistDeviceUnlock);
      setUnlocked(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('관리자 보안 PIN 또는 마스터 비밀번호가 일치하지 않습니다.');
    }
  };

  const handleQuickKeypad = (digit) => {
    setPinError('');
    const next = (pinInput + digit).slice(0, 16);
    setPinInput(next);
    if (verifyAdminPin(next)) {
      setAdminUnlockedSession(true, persistDeviceUnlock);
      setUnlocked(true);
      setPinInput('');
    }
  };

  const handleToggleDemoData = async () => {
    const nextFlag = !includeDemo;
    setIncludeDemo(nextFlag);
    if (nextFlag) {
      await setDemoDataVisibility(true);
    }
    await loadAuditData(nextFlag);
  };

  const handlePrecisionGpsTest = async () => {
    setGpsStatusMsg('현재 기기의 GPS/네트워크 위치를 정밀 계측 중...');
    try {
      const geo = await triggerPrecisionGpsCheck(currentUser);
      setGpsStatusMsg(`✅ 정밀 위치 기록 완료: ${geo.locationLabel} (${geo.ipAddress})`);
      setMapCenter([geo.latitude || 37.4979, geo.longitude || 127.0276]);
      setMapZoom(14);
      await loadAuditData(includeDemo);
    } catch (err) {
      setGpsStatusMsg(`ℹ️ 브라우저 GPS 권한 미허용 — 공인 IP 위치추적으로 대체 기록됨 (${err.message || ''})`);
      await loadAuditData(includeDemo);
    }
  };

  // CSV(엑셀 호환 UTF-8 BOM) 내보내기
  const handleExportCsv = () => {
    const rows = [
      [
        '로그ID',
        '사용일시(KST)',
        '회원구분',
        '가입자성명',
        '이메일(ID)',
        '연락처',
        '성별',
        '연령',
        '사용위치(행정구역)',
        '위도',
        '경도',
        '공인IP주소',
        '통신사(ISP)',
        '위치출처',
        '기기종류',
        '기기모델',
        '운영체제(OS)',
        '브라우저',
        '화면해상도',
        '앱내메뉴(어디서)',
        '활동유형',
        '상세수행내역(무엇을)',
        '체류시간(초)',
      ],
    ];

    dashboardData.logs.forEach((l) => {
      rows.push([
        l.id || '',
        l.kstTimeStr || formatKstDateTime(l.timestamp),
        l.isDemo ? '시뮬레이션' : l.isMember ? '정식가입자' : '비회원방문자',
        l.memberName || '',
        l.memberEmail || '',
        l.memberPhone || '',
        l.memberGender === 'female' ? '여성' : l.memberGender === 'male' ? '남성' : '-',
        l.memberAge || '-',
        l.locationLabel || '',
        l.latitude ?? '',
        l.longitude ?? '',
        l.ipAddress || '',
        l.isp || '',
        l.locationSource || '',
        l.deviceType || '',
        l.deviceModel || '',
        l.osName || '',
        l.browserName || '',
        l.screenResolution || '',
        l.appSection || '',
        l.eventLabel || l.eventType || '',
        (l.actionDetail || '').replace(/\r?\n/g, ' '),
        l.durationSec || 0,
      ]);
    });

    const csvContent =
      '\uFEFF' +
      rows
        .map((r) =>
          r
            .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateTag = formatKstDateTime(new Date()).slice(0, 10);
    a.href = url;
    a.download = `모발부자_가입자별_상세사용이력_${dateTag}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 가입자 필터링 및 정렬
  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    return dashboardData.members
      .filter((m) => {
        if (memberGenderFilter !== 'all' && m.gender !== memberGenderFilter) return false;
        if (!q) return true;
        const hay = [
          m.name,
          m.email,
          m.phone,
          m.lastLocationLabel,
          m.lastIp,
          m.lastIsp,
          m.lastDeviceSummary,
          m.latestAction,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        if (memberSortBy === 'createdAt') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (memberSortBy === 'events') {
          return (b.totalEvents || 0) - (a.totalEvents || 0);
        }
        if (memberSortBy === 'diagnoses') {
          return (b.totalDiagnoses || 0) - (a.totalDiagnoses || 0);
        }
        return new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime();
      });
  }, [dashboardData.members, memberSearch, memberGenderFilter, memberSortBy]);

  // 감사 로그 필터링
  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return dashboardData.logs.filter((l) => {
      if (logTypeFilter !== 'all') {
        if (logTypeFilter === 'auth' && !['MEMBER_SIGNUP', 'MEMBER_LOGIN', 'LOGOUT', 'WITHDRAW'].includes(l.eventType)) {
          return false;
        }
        if (logTypeFilter === 'aga' && l.eventType !== 'DIAGNOSIS_AGA') return false;
        if (logTypeFilter === 'areata' && l.eventType !== 'DIAGNOSIS_AREATA') return false;
        if (logTypeFilter === 'sasang' && l.eventType !== 'SASANG_CHECK') return false;
        if (logTypeFilter === 'medication' && l.eventType !== 'MEDICATION_LOG') return false;
        if (logTypeFilter === 'navigation' && !['TAB_SWITCH', 'PAGE_VIEW', 'LOCATION_UPDATE'].includes(l.eventType)) {
          return false;
        }
      }
      if (!q) return true;
      const hay = [
        l.memberName,
        l.memberEmail,
        l.memberPhone,
        l.locationLabel,
        l.ipAddress,
        l.isp,
        l.deviceModel,
        l.osName,
        l.browserName,
        l.appSection,
        l.eventLabel,
        l.actionDetail,
        l.kstTimeStr,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [dashboardData.logs, logTypeFilter, logSearch]);

  // 기기 및 브라우저 분포 집계
  const deviceStats = useMemo(() => {
    const devMap = {};
    const browserMap = {};
    const ispMap = {};
    dashboardData.logs.forEach((l) => {
      const dt = l.deviceModel || l.deviceType || '기타 기기';
      devMap[dt] = (devMap[dt] || 0) + 1;
      const br = l.browserName || '기타 브라우저';
      browserMap[br] = (browserMap[br] || 0) + 1;
      const isp = l.isp || '국내 통신망';
      ispMap[isp] = (ispMap[isp] || 0) + 1;
    });
    const toSorted = (obj) =>
      Object.entries(obj)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    return {
      devices: toSorted(devMap),
      browsers: toSorted(browserMap),
      isps: toSorted(ispMap),
    };
  }, [dashboardData.logs]);

  if (!isOpen) return null;

  // ── 1) 잠금 상태일 때: 비공개 관리자 보안 인증 게이트 ──
  if (!unlocked) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wh-admin-lock-title"
        className="wh-admin-overlay"
        onClick={onClose}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '410px',
            background: 'linear-gradient(160deg, #15151d 0%, #0c0c10 100%)',
            border: '1.5px solid #D4AF37',
            borderRadius: '18px',
            padding: '24px 20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.9)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: 'rgba(212, 175, 55, 0.16)',
                  border: '1px solid rgba(212, 175, 55, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D4AF37',
                }}
              >
                <Lock size={18} />
              </div>
              <div>
                <h2 id="wh-admin-lock-title" style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#D4AF37' }}>
                  비공개 관리자 관제 모드
                </h2>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#999' }}>
                  가입자 · 접속 시각 · 사용 위치 · 진단 이력 보안 열람
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="비공개 관리자 창 닫기"
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.28)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '0.74rem',
                color: '#e0d8c8',
                lineHeight: 1.5,
              }}
            >
              🔐 원장님 전용 비공개 보안 구역입니다.<br />
              마스터 PIN 번호(<strong>0508</strong>) 또는 관리자 비밀번호를 입력해 주세요.
            </div>

            <div>
              <label htmlFor="wh-admin-pin-input" style={{ display: 'block', fontSize: '0.72rem', color: '#aaa', marginBottom: '5px' }}>
                관리자 보안 PIN / 마스터 비밀번호
              </label>
              <input
                id="wh-admin-pin-input"
                type="password"
                autoComplete="off"
                placeholder="보안 PIN 입력 (예: 0508)"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError('');
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  letterSpacing: '0.2em',
                  textAlign: 'center',
                  borderRadius: '10px',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  background: '#0d0d12',
                  color: '#D4AF37',
                }}
              />
            </div>

            {/* 원클릭 터치 숫자 키패드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '0508', '지우기'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === '지우기') {
                      setPinInput('');
                      setPinError('');
                    } else if (key === '0508') {
                      setAdminUnlockedSession(true, persistDeviceUnlock);
                      setUnlocked(true);
                    } else {
                      handleQuickKeypad(key);
                    }
                  }}
                  style={{
                    padding: '9px',
                    borderRadius: '8px',
                    border: key === '0508' ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                    background: key === '0508' ? 'rgba(212, 175, 55, 0.18)' : '#1a1a22',
                    color: key === '0508' ? '#D4AF37' : '#eee',
                    fontSize: key === '0508' ? '0.75rem' : '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {key === '0508' ? '⚡ 원장님 즉시인증' : key}
                </button>
              ))}
            </div>

            {pinError && (
              <div
                role="alert"
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 82, 82, 0.15)',
                  border: '1px solid rgba(255, 82, 82, 0.45)',
                  color: '#ff8a80',
                  fontSize: '0.73rem',
                  textAlign: 'center',
                }}
              >
                {pinError}
              </div>
            )}

            <label
              htmlFor="wh-admin-persist-check"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '0.73rem',
                color: '#bbb',
                cursor: 'pointer',
              }}
            >
              <input
                id="wh-admin-persist-check"
                type="checkbox"
                checked={persistDeviceUnlock}
                onChange={(e) => setPersistDeviceUnlock(e.target.checked)}
                style={{ accentColor: '#D4AF37' }}
              />
              <span>이 기기에서 관리자 잠금해제 상태 유지</span>
            </label>

            <button type="submit" className="wh-admin-btn wh-admin-btn-gold" style={{ justifyContent: 'center', padding: '12px', fontSize: '0.86rem' }}>
              <Unlock size={16} /> 비공개 관리자 관제 센터 입장하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── 2) 잠금 해제 완료: 비공개 관리자 메인 관제 대시보드 ──
  const { kpis } = dashboardData;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wh-admin-console-title"
      className="wh-admin-overlay"
      onClick={onClose}
    >
      <div className="wh-admin-shell" onClick={(e) => e.stopPropagation()}>
        {/* ── 상단 헤더 바 ── */}
        <header className="wh-admin-header">
          <div className="wh-admin-brand">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #D4AF37, #9A741C)',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 id="wh-admin-console-title" style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#D4AF37' }}>
                  WEALTHY HAIR 비공개 관리자 관제 센터
                </h2>
                <span className="wh-admin-badge-live">
                  <span className="wh-admin-pulse-dot" />
                  실시간 가입자 · 시간 · 위치 추적 중
                </span>
              </div>
              <div style={{ fontSize: '0.71rem', color: '#999', marginTop: '2px' }}>
                어느 가입자가(Who) · 언제(When) · 어디에서(Where: 행정구역/지도/IP/통신사/기기) · 무엇을(What) 사용했는지 정밀 열람
              </div>
            </div>
          </div>

          <div className="wh-admin-toolbar">
            <button
              type="button"
              onClick={handleToggleDemoData}
              className="wh-admin-btn"
              style={{
                borderColor: includeDemo ? 'rgba(100, 181, 246, 0.45)' : 'rgba(129, 199, 132, 0.5)',
                color: includeDemo ? '#90CAF9' : '#81C784',
              }}
              title="실제 가입자만 보거나 전국 시뮬레이션 샘플 데이터를 함께 표시합니다"
            >
              <Layers size={14} />
              <span>{includeDemo ? '전체 보기 (실제+전국샘플)' : '실제 가입자만 보기'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrecisionGpsTest}
              className="wh-admin-btn"
              style={{ borderColor: 'rgba(212, 175, 55, 0.45)', color: '#FFD54F' }}
            >
              <Navigation size={14} />
              <span>내 현재 위치·기기 즉시 기록</span>
            </button>

            <button
              type="button"
              onClick={() => loadAuditData(includeDemo)}
              className="wh-admin-btn"
              aria-label="데이터 새로고침"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>새로고침</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="wh-admin-btn wh-admin-btn-gold"
            >
              <FileSpreadsheet size={14} />
              <span>엑셀(CSV) 다운로드</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminUnlockedSession(false, false);
                setUnlocked(false);
              }}
              className="wh-admin-btn"
              title="관리자 화면 다시 잠그기"
            >
              <Lock size={14} />
              <span>잠금</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="wh-admin-btn"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              aria-label="관리자 모드 닫기"
            >
              <X size={15} />
              <span>닫기</span>
            </button>
          </div>
        </header>

        {gpsStatusMsg && (
          <div
            style={{
              padding: '7px 18px',
              background: 'rgba(212, 175, 55, 0.14)',
              borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
              fontSize: '0.74rem',
              color: '#FFE082',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{gpsStatusMsg}</span>
            <button
              type="button"
              onClick={() => setGpsStatusMsg('')}
              style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.72rem' }}
            >
              닫기 ✕
            </button>
          </div>
        )}

        {/* ── 4대 관제 탭 네비게이션 ── */}
        <nav className="wh-admin-tabs" aria-label="관리자 관제 메뉴">
          <button
            type="button"
            className={`wh-admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={15} />
            <span>1. 실시간 종합 관제 (Who·When·Where)</span>
          </button>

          <button
            type="button"
            className={`wh-admin-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={15} />
            <span>2. 가입자별 정밀 이력 조회 ({dashboardData.members.length}명)</span>
          </button>

          <button
            type="button"
            className={`wh-admin-tab-btn ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            <MapPin size={15} />
            <span>3. 사용 위치 지도 & 지역·기기 분석 ({dashboardData.regionBreakdown.length}개 지역)</span>
          </button>

          <button
            type="button"
            className={`wh-admin-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <Clock size={15} />
            <span>4. 시간순 전체 감사 로그 & 보안설정 ({dashboardData.logs.length}건)</span>
          </button>
        </nav>

        {/* ── 본문 영역 ── */}
        <div className="wh-admin-body">
          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: 실시간 종합 관제 & 라이브 스트림
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <>
              {/* 5대 핵심 KPI 카드 */}
              <div className="wh-admin-kpi-grid">
                <div className="wh-admin-kpi-card">
                  <div className="wh-admin-kpi-label">
                    <span>조회 중인 가입자 수</span>
                    <Users size={15} color="#D4AF37" />
                  </div>
                  <div className="wh-admin-kpi-value">{kpis.totalSubscribers}명</div>
                  <div className="wh-admin-kpi-sub">
                    실제 기기 가입 {kpis.realSubscribers}명 · 전국 샘플 {kpis.demoSubscribers}명
                  </div>
                </div>

                <div className="wh-admin-kpi-card">
                  <div className="wh-admin-kpi-label">
                    <span>오늘 활성 사용자 (DAU)</span>
                    <Activity size={15} color="#81C784" />
                  </div>
                  <div className="wh-admin-kpi-value" style={{ color: '#81C784' }}>
                    {kpis.todayActiveUsers}명
                  </div>
                  <div className="wh-admin-kpi-sub">금일(KST) 접속 및 기능 실행 회원</div>
                </div>

                <div className="wh-admin-kpi-card">
                  <div className="wh-admin-kpi-label">
                    <span>누적 상세 사용 로그</span>
                    <Clock size={15} color="#64B5F6" />
                  </div>
                  <div className="wh-admin-kpi-value" style={{ color: '#64B5F6' }}>
                    {kpis.totalEvents}건
                  </div>
                  <div className="wh-admin-kpi-sub">메뉴 이동 · 로그인 · 진단 전 과정 기록</div>
                </div>

                <div className="wh-admin-kpi-card">
                  <div className="wh-admin-kpi-label">
                    <span>AI 탈모 정밀 진단 완료</span>
                    <Sparkles size={15} color="#FFD54F" />
                  </div>
                  <div className="wh-admin-kpi-value" style={{ color: '#FFD54F' }}>
                    {kpis.totalDiagnosesCount}회
                  </div>
                  <div className="wh-admin-kpi-sub">남·여 탈모(BASP/Ludwig) + 원형탈모(SALT)</div>
                </div>

                <div className="wh-admin-kpi-card">
                  <div className="wh-admin-kpi-label">
                    <span>접속 확인 지역 거점</span>
                    <MapPin size={15} color="#FF8A65" />
                  </div>
                  <div className="wh-admin-kpi-value" style={{ color: '#FF8A65' }}>
                    {kpis.activeRegionsCount}곳
                  </div>
                  <div className="wh-admin-kpi-sub">시·도 / 시·군·구 행정구역 및 IP 식별</div>
                </div>
              </div>

              <div className="wh-admin-split-grid">
                {/* 좌측: 실시간 가입자 사용 스트림 (Who / When / Where / What) */}
                <section className="wh-admin-panel">
                  <div className="wh-admin-panel-title">
                    <span>⚡ 실시간 가입자 사용 타임라인 (누가 · 언제 · 어디서 · 무엇을)</span>
                    <span style={{ fontSize: '0.72rem', color: '#999', fontWeight: 500 }}>
                      최근 {Math.min(12, dashboardData.logs.length)}건 표시
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
                    {dashboardData.logs.slice(0, 12).map((log) => {
                      const badge = getEventBadge(log.eventType);
                      return (
                        <div key={log.id} className="wh-stream-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span
                                className="wh-tag-pill"
                                style={{
                                  background: badge.bg,
                                  color: badge.color,
                                  border: `1px solid ${badge.border}`,
                                }}
                              >
                                {badge.label}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const foundMem = dashboardData.members.find(
                                    (m) => m.id === log.memberId || (log.memberEmail && m.email === log.memberEmail)
                                  );
                                  if (foundMem) {
                                    setSelectedMember(foundMem);
                                    setActiveTab('members');
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: '#fff',
                                  fontWeight: 800,
                                  fontSize: '0.84rem',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  textDecorationColor: 'rgba(212,175,55,0.5)',
                                }}
                              >
                                👤 {log.memberName}
                              </button>
                              {log.memberEmail && (
                                <span style={{ fontSize: '0.72rem', color: '#aaa' }}>({log.memberEmail})</span>
                              )}
                              {log.memberPhone && (
                                <span style={{ fontSize: '0.71rem', color: '#D4AF37', fontWeight: 600 }}>
                                  📞 {log.memberPhone}
                                </span>
                              )}
                              {log.isDemo && (
                                <span
                                  className="wh-tag-pill"
                                  style={{ background: 'rgba(100,181,246,0.12)', color: '#90CAF9', border: '1px solid rgba(100,181,246,0.3)' }}
                                >
                                  샘플
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.71rem', color: '#bbb', textAlign: 'right' }}>
                              <strong style={{ color: '#81C784' }}>{formatRelativeTime(log.timestamp)}</strong> ·{' '}
                              <span>{log.kstTimeStr || formatKstDateTime(log.timestamp)}</span>
                            </div>
                          </div>

                          {/* 어디에서 & 어떤 기기로 */}
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '10px',
                              fontSize: '0.73rem',
                              color: '#d0cbc0',
                              background: 'rgba(0,0,0,0.28)',
                              padding: '7px 10px',
                              borderRadius: '7px',
                            }}
                          >
                            <span>
                              📍 <strong style={{ color: '#FFD54F' }}>사용 위치:</strong> {log.locationLabel || '대한민국'}{' '}
                              <span style={{ color: '#888' }}>({log.ipAddress} · {log.isp})</span>
                            </span>
                            <span>
                              📱 <strong style={{ color: '#90CAF9' }}>접속 기기:</strong> {log.deviceModel || log.deviceType} · {log.osName} · {log.browserName}
                            </span>
                            <span>
                              🧭 <strong style={{ color: '#CE93D8' }}>사용 메뉴:</strong> {log.appSection} ({formatDurationReadable(log.durationSec)} 체류)
                            </span>
                          </div>

                          {/* 상세 실행 내용 */}
                          <div style={{ fontSize: '0.77rem', color: '#eee', lineHeight: 1.45 }}>
                            <strong style={{ color: '#D4AF37' }}>상세 내역:</strong> {log.actionDetail}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 우측: 지역별 접속 현황 + 시간대별 사용 분포 + 메뉴별 이용 순위 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <section className="wh-admin-panel">
                    <div className="wh-admin-panel-title">
                      <span>📍 어디에서 사용했나 (지역별 접속 TOP 거점)</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('locations')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#D4AF37',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        전체 지도 보기 →
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {dashboardData.regionBreakdown.slice(0, 6).map((reg, idx) => {
                        const maxCount = dashboardData.regionBreakdown[0]?.count || 1;
                        const pct = Math.max(10, Math.round((reg.count / maxCount) * 100));
                        return (
                          <div
                            key={reg.locationLabel}
                            style={{
                              background: '#191922',
                              padding: '9px 11px',
                              borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.06)',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setMapCenter([reg.latitude || 37.4979, reg.longitude || 127.0276]);
                              setMapZoom(13);
                              setActiveTab('locations');
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '5px' }}>
                              <span>
                                <strong style={{ color: '#D4AF37' }}>#{idx + 1}</strong> {reg.locationLabel}
                              </span>
                              <span style={{ color: '#81C784', fontWeight: 700 }}>
                                가입자 {reg.memberCount}명 · 활동 {reg.count}건
                              </span>
                            </div>
                            <div style={{ height: '6px', background: '#0d0d12', borderRadius: '999px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #D4AF37, #81C784)',
                                  borderRadius: '999px',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="wh-admin-panel">
                    <div className="wh-admin-panel-title">
                      <span>🕒 언제 주로 사용했나 (시간대별 KST 활동 분포)</span>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, 1fr)',
                        gap: '4px',
                        alignItems: 'end',
                        height: '95px',
                        paddingTop: '10px',
                      }}
                    >
                      {dashboardData.hourlyCounts
                        .filter((_, i) => i % 2 === 0)
                        .map((item, idx) => {
                          const nextItem = dashboardData.hourlyCounts[idx * 2 + 1] || { count: 0 };
                          const pairSum = item.count + nextItem.count;
                          const maxPair = Math.max(
                            1,
                            ...Array.from({ length: 12 }, (_, k) =>
                              (dashboardData.hourlyCounts[k * 2]?.count || 0) +
                              (dashboardData.hourlyCounts[k * 2 + 1]?.count || 0)
                            )
                          );
                          const barH = Math.max(8, Math.round((pairSum / maxPair) * 65));
                          return (
                            <div
                              key={item.hour}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                              title={`${item.hour} ~ ${nextItem.hour}: ${pairSum}건`}
                            >
                              <span style={{ fontSize: '0.62rem', color: pairSum > 0 ? '#D4AF37' : '#555', fontWeight: 700 }}>
                                {pairSum}
                              </span>
                              <div
                                style={{
                                  width: '100%',
                                  maxWidth: '18px',
                                  height: `${barH}px`,
                                  borderRadius: '4px 4px 0 0',
                                  background:
                                    pairSum > 0
                                      ? 'linear-gradient(180deg, #D4AF37 0%, rgba(212,175,55,0.3) 100%)'
                                      : 'rgba(255,255,255,0.06)',
                                }}
                              />
                              <span style={{ fontSize: '0.6rem', color: '#888' }}>{idx * 2}시</span>
                            </div>
                          );
                        })}
                    </div>
                  </section>

                  <section className="wh-admin-panel">
                    <div className="wh-admin-panel-title">
                      <span>🧭 앱 내 어느 메뉴를 가장 많이 사용했나</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {dashboardData.sectionBreakdown.slice(0, 5).map((sec) => (
                        <div
                          key={sec.name}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '7px 10px',
                            background: '#191922',
                            borderRadius: '7px',
                            fontSize: '0.75rem',
                          }}
                        >
                          <span style={{ color: '#e6e1d6', fontWeight: 600 }}>{sec.name}</span>
                          <span
                            className="wh-tag-pill"
                            style={{ background: 'rgba(212,175,55,0.16)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.35)' }}
                          >
                            {sec.count}회 실행
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: 가입자별 정밀 이력 조회 & 1:1 딥다이브
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'members' && (
            <>
              {/* 검색 및 필터 바 */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#14141b',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                }}
              >
                <div style={{ position: 'relative', flex: '1 1 260px' }}>
                  <Search
                    size={15}
                    color="#D4AF37"
                    style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="search"
                    placeholder="가입자 성명, 이메일, 전화번호(010-...), 사용 지역(강남구 등), 기기명 검색..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: '8px',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      background: '#0d0d12',
                      color: '#fff',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    aria-label="성별 필터"
                    value={memberGenderFilter}
                    onChange={(e) => setMemberGenderFilter(e.target.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #333',
                      background: '#0d0d12',
                      color: '#eee',
                      fontSize: '0.76rem',
                    }}
                  >
                    <option value="all">성별 전체 ({dashboardData.members.length}명)</option>
                    <option value="male">남성 가입자</option>
                    <option value="female">여성 가입자</option>
                  </select>

                  <select
                    aria-label="가입자 정렬 기준"
                    value={memberSortBy}
                    onChange={(e) => setMemberSortBy(e.target.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #333',
                      background: '#0d0d12',
                      color: '#eee',
                      fontSize: '0.76rem',
                    }}
                  >
                    <option value="lastActive">최근 사용한 시간순</option>
                    <option value="createdAt">최근 회원가입일순</option>
                    <option value="events">앱 활동 횟수 많은순</option>
                    <option value="diagnoses">AI 진단 횟수 많은순</option>
                  </select>
                </div>
              </div>

              {/* 가입자 1:1 딥다이브 상세 뷰어 (선택 시 상단에 하이라이트 표시) */}
              {selectedMember && (
                <section
                  style={{
                    background: 'linear-gradient(155deg, #1b1914 0%, #121218 100%)',
                    border: '2px solid #D4AF37',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: '0 14px 40px rgba(0,0,0,0.75)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          className="wh-tag-pill"
                          style={{ background: '#D4AF37', color: '#000', fontWeight: 900 }}
                        >
                          가입자 1:1 정밀 분석
                        </span>
                        <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#fff' }}>
                          {selectedMember.name} ({selectedMember.gender === 'female' ? '여성' : '남성'} · 만 {selectedMember.age || '-'}세)
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: 700 }}>
                          {selectedMember.email} · {selectedMember.phone || '연락처 미등록'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#bbb', marginTop: '4px' }}>
                        가입일시: <strong>{formatKstDateTime(selectedMember.createdAt)}</strong> · 최근 사용일시:{' '}
                        <strong style={{ color: '#81C784' }}>{formatKstDateTime(selectedMember.lastActiveAt)}</strong> (
                        {formatRelativeTime(selectedMember.lastActiveAt)})
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="wh-admin-btn"
                        onClick={() => {
                          setMapCenter([selectedMember.lastLat || 37.4979, selectedMember.lastLng || 127.0276]);
                          setMapZoom(14);
                          setActiveTab('locations');
                        }}
                      >
                        <MapPin size={14} color="#D4AF37" />
                        <span>지도에서 사용 위치 확인</span>
                      </button>
                      <button
                        type="button"
                        className="wh-admin-btn"
                        onClick={() => setSelectedMember(null)}
                      >
                        <X size={14} />
                        <span>상세창 닫기</span>
                      </button>
                    </div>
                  </div>

                  {/* 가입자 핵심 메타 요약 3열 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                    <div style={{ background: '#14141b', padding: '11px 13px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.76rem', lineHeight: 1.65 }}>
                      <div style={{ color: '#D4AF37', fontWeight: 800, marginBottom: '4px' }}>📍 어디에서 사용했나 (위치 · 네트워크)</div>
                      <div>• <strong>최근 접속 주소:</strong> {selectedMember.lastLocationLabel}</div>
                      <div>• <strong>공인 IP / 통신사:</strong> {selectedMember.lastIp} ({selectedMember.lastIsp})</div>
                      <div>• <strong>위도 / 경도 좌표:</strong> {selectedMember.lastLat}, {selectedMember.lastLng}</div>
                      <div>• <strong>누적 사용 지역:</strong> {(selectedMember.uniqueLocations || []).join(' / ') || selectedMember.lastLocationLabel}</div>
                    </div>

                    <div style={{ background: '#14141b', padding: '11px 13px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.76rem', lineHeight: 1.65 }}>
                      <div style={{ color: '#90CAF9', fontWeight: 800, marginBottom: '4px' }}>📱 어떤 기기로 사용했나 (디바이스 · 세션)</div>
                      <div>• <strong>주 사용 기기:</strong> {selectedMember.lastDeviceSummary}</div>
                      <div>• <strong>식별된 기기 목록:</strong> {(selectedMember.uniqueDevices || []).join(', ') || selectedMember.lastDeviceSummary}</div>
                      <div>• <strong>향후 자동로그인:</strong> {selectedMember.autoLogin !== false ? '켜짐 (ON)' : '꺼짐 (OFF)'}</div>
                      <div>• <strong>생년월일:</strong> {selectedMember.birthDate || '-'}</div>
                    </div>

                    <div style={{ background: '#14141b', padding: '11px 13px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.76rem', lineHeight: 1.65 }}>
                      <div style={{ color: '#81C784', fontWeight: 800, marginBottom: '4px' }}>📊 무엇을 얼마나 사용했나 (활동 · 진단)</div>
                      <div>• <strong>총 접속 세션 / 이벤트:</strong> {selectedMember.totalSessions}회 접속 · {selectedMember.totalEvents}건 활동</div>
                      <div>• <strong>AI 탈모 정밀 진단:</strong> 총 {selectedMember.totalDiagnoses}회 완료</div>
                      <div>• <strong>총 앱 체류 시간:</strong> {formatDurationReadable(selectedMember.totalDurationSec)}</div>
                      <div>• <strong>최근 진단 요약:</strong> {selectedMember.latestDiagnosis || '진단 전'}</div>
                    </div>
                  </div>

                  {/* 해당 가입자의 시간순 전체 행동 타임라인 */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D4AF37', marginBottom: '8px' }}>
                      🕒 {selectedMember.name}님의 시간순 상세 사용 기록 ({selectedMember.memberLogs?.length || 0}건)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '280px', overflowY: 'auto' }}>
                      {(selectedMember.memberLogs || []).map((ml) => {
                        const b = getEventBadge(ml.eventType);
                        return (
                          <div
                            key={ml.id}
                            style={{
                              background: '#15151d',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '8px',
                              padding: '9px 12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '10px',
                              flexWrap: 'wrap',
                              fontSize: '0.75rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span
                                className="wh-tag-pill"
                                style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}` }}
                              >
                                {b.label}
                              </span>
                              <strong style={{ color: '#FFD54F' }}>[{ml.appSection}]</strong>
                              <span style={{ color: '#eee' }}>{ml.actionDetail}</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#aaa', whiteSpace: 'nowrap' }}>
                              📍 {ml.locationLabel} ({ml.ipAddress}) · 🕒 {ml.kstTimeStr || formatKstDateTime(ml.timestamp)} ({formatDurationReadable(ml.durationSec)})
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* 반응형 가입자 정밀 테이블 (Modern Web Guidance `responsive-table` 준수) */}
              <div
                tabIndex={0}
                role="region"
                aria-labelledby="wh-members-table-caption"
                className="wh-table-wrapper"
              >
                <table className="wh-admin-table">
                  <caption id="wh-members-table-caption">
                    모발부자 가입자별 사용 일시(When) · 사용 위치(Where) · 접속 기기 · 상세 활동(What) 현황표 (총 {filteredMembers.length}명)
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">가입자 정보 (Who)</th>
                      <th scope="col">언제 사용했나 (When)</th>
                      <th scope="col">어디에서 사용했나 (Where)</th>
                      <th scope="col">접속 기기 · 브라우저</th>
                      <th scope="col">이용 · 진단 통계</th>
                      <th scope="col">최근 사용 내역 & 상세</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <th scope="row">조건에 맞는 가입자 없음</th>
                        <td colSpan={5} style={{ color: '#999' }}>
                          검색 조건을 변경하거나 상단 [전체 보기] 토글을 확인해 주세요.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((m) => (
                        <tr
                          key={m.id}
                          onClick={() => setSelectedMember(m)}
                          style={{ cursor: 'pointer' }}
                        >
                          <th scope="row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{m.name}</span>
                              <span
                                className="wh-tag-pill"
                                style={{
                                  background: m.gender === 'female' ? 'rgba(244, 143, 177, 0.16)' : 'rgba(100, 181, 246, 0.16)',
                                  color: m.gender === 'female' ? '#F48FB1' : '#90CAF9',
                                }}
                              >
                                {m.gender === 'female' ? '여성' : '남성'} {m.age ? `· ${m.age}세` : ''}
                              </span>
                              {m.isDemo ? (
                                <span
                                  className="wh-tag-pill"
                                  style={{ background: 'rgba(100,181,246,0.12)', color: '#90CAF9' }}
                                >
                                  샘플
                                </span>
                              ) : (
                                <span
                                  className="wh-tag-pill"
                                  style={{ background: 'rgba(129,199,132,0.18)', color: '#81C784' }}
                                >
                                  실제가입
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#bbb', marginTop: '3px' }}>{m.email}</div>
                            <div style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 600 }}>
                              {m.phone || '연락처 미기재'}
                            </div>
                          </th>

                          <td>
                            <div style={{ color: '#81C784', fontWeight: 800, fontSize: '0.76rem' }}>
                              최근: {formatRelativeTime(m.lastActiveAt)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#ddd' }}>
                              {formatKstDateTime(m.lastActiveAt)}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#888', marginTop: '2px' }}>
                              가입: {formatKstDateTime(m.createdAt).slice(0, 13)}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 700, color: '#FFD54F', fontSize: '0.77rem' }}>
                              📍 {m.lastLocationLabel}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '2px' }}>
                              IP: {m.lastIp} · {m.lastIsp}
                            </div>
                            {m.lastLat && m.lastLng && (
                              <div style={{ fontSize: '0.67rem', color: '#777' }}>
                                좌표: {Number(m.lastLat).toFixed(4)}, {Number(m.lastLng).toFixed(4)}
                              </div>
                            )}
                          </td>

                          <td>
                            <div style={{ fontSize: '0.75rem', color: '#e6e1d6', fontWeight: 600 }}>
                              {m.lastDeviceSummary}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#888', marginTop: '2px' }}>
                              자동로그인: {m.autoLogin !== false ? '켜짐(ON)' : '꺼짐(OFF)'}
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span
                                className="wh-tag-pill"
                                style={{ background: 'rgba(212,175,55,0.16)', color: '#D4AF37' }}
                              >
                                진단 {m.totalDiagnoses}회
                              </span>
                              <span
                                className="wh-tag-pill"
                                style={{ background: 'rgba(255,255,255,0.08)', color: '#ddd' }}
                              >
                                활동 {m.totalEvents}건
                              </span>
                            </div>
                            <div style={{ fontSize: '0.69rem', color: '#aaa' }}>
                              총 체류: {formatDurationReadable(m.totalDurationSec)} ({m.totalSessions}세션)
                            </div>
                          </td>

                          <td>
                            <div style={{ fontSize: '0.74rem', color: '#eee', marginBottom: '6px' }}>
                              {m.latestDiagnosis || m.latestAction}
                            </div>
                            <button
                              type="button"
                              className="wh-admin-btn"
                              style={{ padding: '4px 9px', fontSize: '0.7rem', color: '#D4AF37', borderColor: 'rgba(212,175,55,0.4)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMember(m);
                              }}
                            >
                              <Eye size={12} /> 1:1 상세 타임라인 열람
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: 사용 위치 지도 (Leaflet Map) & 지역·기기·통신사 분석
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'locations' && (
            <>
              <div className="wh-admin-split-grid">
                {/* 좌측: 인터랙티브 가입자 접속 위치 지도 */}
                <section className="wh-admin-panel">
                  <div className="wh-admin-panel-title">
                    <span>🗺️ 가입자 실시간 사용 위치 지도 (핀 클릭 시 상세 정보 표시)</span>
                    <button
                      type="button"
                      className="wh-admin-btn"
                      style={{ padding: '4px 9px', fontSize: '0.7rem' }}
                      onClick={() => {
                        setMapCenter([36.5, 127.75]);
                        setMapZoom(7);
                      }}
                    >
                      전국 한눈에 보기
                    </button>
                  </div>

                  <div
                    style={{
                      height: '440px',
                      width: '100%',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      position: 'relative',
                    }}
                  >
                    <MapContainer
                      center={mapCenter}
                      zoom={mapZoom}
                      style={{ height: '100%', width: '100%', background: '#0b0b0e' }}
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap & CartoDB"
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      />
                      <MapFlyToController center={mapCenter} zoom={mapZoom} />
                      {dashboardData.members
                        .filter((m) => Number.isFinite(Number(m.lastLat)) && Number.isFinite(Number(m.lastLng)))
                        .map((m) => (
                          <Marker
                            key={m.id}
                            position={[Number(m.lastLat), Number(m.lastLng)]}
                            icon={createGoldPinIcon(!m.isDemo)}
                          >
                            <Popup>
                              <div style={{ color: '#111', fontSize: '0.78rem', lineHeight: 1.5, minWidth: '210px' }}>
                                <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#000', marginBottom: '3px' }}>
                                  👤 {m.name} ({m.gender === 'female' ? '여' : '남'} · {m.age || '-'}세)
                                </div>
                                <div><strong>이메일:</strong> {m.email}</div>
                                <div><strong>연락처:</strong> {m.phone || '-'}</div>
                                <div><strong>사용 위치:</strong> {m.lastLocationLabel}</div>
                                <div><strong>IP / 통신사:</strong> {m.lastIp} ({m.lastIsp})</div>
                                <div><strong>최근 사용:</strong> {formatKstDateTime(m.lastActiveAt)}</div>
                                <div><strong>접속 기기:</strong> {m.lastDeviceSummary}</div>
                                <div><strong>최근 활동:</strong> {m.latestDiagnosis || m.latestAction}</div>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                    </MapContainer>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.72rem', color: '#aaa', flexWrap: 'wrap' }}>
                    <span>🟡 <strong>골드 마커:</strong> 이 기기/서버 실제 가입 회원</span>
                    <span>🔵 <strong>블루 마커:</strong> 전국 시뮬레이션 샘플 회원</span>
                    <span>💡 우측 거점 목록을 클릭하면 해당 위치로 지도가 즉시 확대 이동합니다.</span>
                  </div>
                </section>

                {/* 우측: 지역별 접속 거점 상세 리스트 */}
                <section className="wh-admin-panel">
                  <div className="wh-admin-panel-title">
                    <span>📍 행정구역별(시·도 / 구·군) 가입자 접속 현황</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '460px', overflowY: 'auto' }}>
                    {dashboardData.regionBreakdown.map((reg, idx) => (
                      <div
                        key={reg.locationLabel}
                        style={{
                          background: '#191922',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          padding: '11px 13px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
                            <span style={{ color: '#D4AF37', marginRight: '6px' }}>#{idx + 1}</span>
                            {reg.locationLabel}
                          </div>
                          <div style={{ fontSize: '0.71rem', color: '#aaa', marginTop: '3px' }}>
                            가입자 <strong>{reg.memberCount}명</strong> · 누적 사용 <strong>{reg.count}건</strong> · 최근:{' '}
                            {formatRelativeTime(reg.latestTimestamp)}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="wh-admin-btn"
                          style={{ padding: '6px 10px', fontSize: '0.72rem', color: '#D4AF37' }}
                          onClick={() => {
                            setMapCenter([reg.latitude || 37.4979, reg.longitude || 127.0276]);
                            setMapZoom(14);
                          }}
                        >
                          <MapPin size={13} /> 위치 확대
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* 하단: 기기 모델 · 브라우저 · 통신사(ISP) 3열 상세 분석 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <section className="wh-admin-panel">
                  <div className="wh-admin-panel-title">
                    <span>📱 접속 기기 모델 분포</span>
                    <Smartphone size={15} />
                  </div>
                  {deviceStats.devices.slice(0, 6).map((d) => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', padding: '6px 8px', background: '#191922', borderRadius: '6px' }}>
                      <span>{d.name}</span>
                      <strong style={{ color: '#D4AF37' }}>{d.count}건</strong>
                    </div>
                  ))}
                </section>

                <section className="wh-admin-panel">
                  <div className="wh-admin-panel-title">
                    <span>🌐 접속 브라우저 (인앱 브라우저 포함)</span>
                    <Globe size={15} />
                  </div>
                  {deviceStats.browsers.slice(0, 6).map((b) => (
                    <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', padding: '6px 8px', background: '#191922', borderRadius: '6px' }}>
                      <span>{b.name}</span>
                      <strong style={{ color: '#90CAF9' }}>{b.count}건</strong>
                    </div>
                  ))}
                </section>

                <section className="wh-admin-panel">
                  <div className="wh-admin-panel-title">
                    <span>📡 인터넷 통신사 (ISP) 분포</span>
                    <Cpu size={15} />
                  </div>
                  {deviceStats.isps.slice(0, 6).map((isp) => (
                    <div key={isp.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', padding: '6px 8px', background: '#191922', borderRadius: '6px' }}>
                      <span>{isp.name}</span>
                      <strong style={{ color: '#81C784' }}>{isp.count}건</strong>
                    </div>
                  ))}
                </section>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4: 시간순 전체 감사 로그 & 관리자 보안 PIN 설정
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'logs' && (
            <>
              {/* 필터 바 */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#14141b',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                }}
              >
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: '전체 로그' },
                    { id: 'auth', label: '회원가입·로그인' },
                    { id: 'aga', label: '남·여 탈모 진단' },
                    { id: 'areata', label: '원형탈모(SALT)' },
                    { id: 'sasang', label: '사상체질·식이' },
                    { id: 'medication', label: '복약 체크' },
                    { id: 'navigation', label: '메뉴 이동·위치' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setLogTypeFilter(f.id)}
                      className="wh-admin-btn"
                      style={{
                        background: logTypeFilter === f.id ? '#D4AF37' : 'rgba(255,255,255,0.04)',
                        color: logTypeFilter === f.id ? '#000' : '#ccc',
                        borderColor: logTypeFilter === f.id ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
                  <Search
                    size={14}
                    color="#D4AF37"
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="search"
                    placeholder="로그 내 이름, 지역, IP, 진단등급 검색..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 30px',
                      borderRadius: '8px',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      background: '#0d0d12',
                      color: '#fff',
                      fontSize: '0.76rem',
                    }}
                  />
                </div>
              </div>

              {/* 시간순 전체 감사 로그 리스트 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredLogs.map((log) => {
                  const badge = getEventBadge(log.eventType);
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <div
                      key={log.id}
                      style={{
                        background: '#14141c',
                        border: isExpanded ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        padding: '11px 14px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap',
                          cursor: 'pointer',
                        }}
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            className="wh-tag-pill"
                            style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                          >
                            {badge.label}
                          </span>
                          <strong style={{ color: '#fff', fontSize: '0.82rem' }}>{log.memberName}</strong>
                          {log.memberEmail && (
                            <span style={{ fontSize: '0.72rem', color: '#aaa' }}>({log.memberEmail})</span>
                          )}
                          <span style={{ fontSize: '0.74rem', color: '#FFD54F', fontWeight: 700 }}>
                            📍 {log.locationLabel}
                          </span>
                          <span style={{ fontSize: '0.71rem', color: '#888' }}>
                            ({log.ipAddress} · {log.deviceModel || log.deviceType} · {log.browserName})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#81C784', fontWeight: 700 }}>
                            {log.kstTimeStr || formatKstDateTime(log.timestamp)}
                          </span>
                          <ChevronRight
                            size={15}
                            color="#D4AF37"
                            style={{
                              transform: isExpanded ? 'rotate(90deg)' : 'none',
                              transition: 'transform 0.15s',
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ fontSize: '0.76rem', color: '#ddd', marginTop: '6px' }}>
                        <strong style={{ color: '#D4AF37' }}>[{log.appSection}]</strong> {log.actionDetail}
                      </div>

                      {isExpanded && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: '#0b0b0f',
                            border: '1px solid rgba(212, 175, 55, 0.25)',
                            fontSize: '0.72rem',
                            color: '#ccc',
                            lineHeight: 1.65,
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px' }}>
                            <div>• <strong>로그 고유 ID:</strong> {log.id}</div>
                            <div>• <strong>세션 ID:</strong> {log.sessionId}</div>
                            <div>• <strong>가입자 ID / 연락처:</strong> {log.memberId} / {log.memberPhone || '-'}</div>
                            <div>• <strong>정확한 시각(ISO):</strong> {log.timestamp}</div>
                            <div>• <strong>행정구역 상세:</strong> {log.country} {log.region} {log.city} {log.district}</div>
                            <div>• <strong>위도 / 경도 / 출처:</strong> {log.latitude}, {log.longitude} ({log.locationSource})</div>
                            <div>• <strong>공인 IP / 통신사:</strong> {log.ipAddress} / {log.isp}</div>
                            <div>• <strong>기기 / OS / 브라우저:</strong> {log.deviceModel} / {log.osName} / {log.browserName}</div>
                            <div>• <strong>화면 해상도 / 네트워크:</strong> {log.screenResolution} / {log.networkType}</div>
                            <div>• <strong>유입 경로 / 체류시간:</strong> {log.referrer} / {formatDurationReadable(log.durationSec)}</div>
                          </div>

                          {log.metadata?.thumbnail && (
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={log.metadata.thumbnail}
                                alt="진단 촬영 썸네일"
                                style={{ width: 68, height: 68, objectFit: 'cover', borderRadius: '8px', border: '1px solid #D4AF37' }}
                              />
                              <span style={{ color: '#D4AF37' }}>진단 당시 촬영된 두피·모발 스캔 썸네일</span>
                            </div>
                          )}

                          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="wh-admin-btn"
                              style={{ color: '#ff8a80', borderColor: 'rgba(255,82,82,0.4)', padding: '4px 9px', fontSize: '0.69rem' }}
                              onClick={async () => {
                                await deleteAdminAuditLog(log.id);
                                await loadAuditData(includeDemo);
                              }}
                            >
                              <Trash2 size={12} /> 이 로그 레코드 삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 하단: 관리자 전용 보안 PIN 변경 패널 */}
              <section className="wh-admin-panel" style={{ marginTop: '10px' }}>
                <div className="wh-admin-panel-title">
                  <span>🔑 비공개 관리자 전용 PIN 번호 변경 설정</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="password"
                    placeholder="새 관리자 PIN 입력 (4자 이상)"
                    value={newCustomPin}
                    onChange={(e) => setNewCustomPin(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #333',
                      background: '#0d0d12',
                      color: '#fff',
                      fontSize: '0.78rem',
                    }}
                  />
                  <button
                    type="button"
                    className="wh-admin-btn wh-admin-btn-gold"
                    onClick={() => {
                      try {
                        updateAdminCustomPin(newCustomPin);
                        setNewCustomPin('');
                        setPinChangeMsg('✅ 사용자 지정 관리자 PIN이 저장되었습니다. (기본 마스터 PIN 0508도 함께 유지됩니다)');
                      } catch (err) {
                        setPinChangeMsg(`⚠️ ${err.message}`);
                      }
                    }}
                  >
                    <KeyRound size={14} /> 새 보안 PIN 저장
                  </button>
                  {pinChangeMsg && <span style={{ fontSize: '0.74rem', color: '#81C784' }}>{pinChangeMsg}</span>}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivateAdminModal;
