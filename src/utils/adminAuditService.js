// src/utils/adminAuditService.js
// 모발부자(WealthyHair) 비공개 관리자 관제 시스템 (Who · When · Where · What 초정밀 추적 및 양방향 서버 동기화 엔진)

import { get } from 'idb-keyval';

const ADMIN_LOGS_KEY = 'wealthyhair_admin_audit_logs_v1';
const ADMIN_MEMBERS_KEY = 'wealthyhair_admin_members_index_v1';
const ADMIN_AUTH_SESSION_KEY = 'wealthyhair_admin_unlocked_v1';
const ADMIN_CUSTOM_PIN_KEY = 'wealthyhair_admin_custom_pin_v1';
const ADMIN_DEMO_DISMISSED_KEY = 'wealthyhair_admin_demo_dismissed_v1';
const GEO_CACHE_KEY = 'wealthyhair_geo_cache_v1';
const CURRENT_SESSION_ID_KEY = 'wealthyhair_active_session_id_v1';
const USERS_STORAGE_KEY = 'wealthyhair_registered_members_v1';
const SESSION_KEY = 'wealthyhair_auth_session_v1';
const TEMP_SESSION_KEY = 'wealthyhair_auth_session_temp_v1';

const MAX_LOCAL_LOGS = 500;

// 기본 마스터 비밀번호/PIN 목록 (원장님 전용 마스터키)
const DEFAULT_VALID_PINS = ['0508', 'admin0508', 'wealthy0508', 'A50tkf100djrA!'];

let _lastTabEnterTime = Date.now();
let _lastSectionName = '앱 진입';
let _resolvedGeoPromise = null;

/**
 * 한국 표준시(KST) 상세 포맷팅 (예: 2026-11-09 (월) 13:25:40)
 */
export function formatKstDateTime(isoOrDate) {
  try {
    const d = isoOrDate ? new Date(isoOrDate) : new Date();
    if (Number.isNaN(d.getTime())) return String(isoOrDate || '-');
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const map = {};
    parts.forEach((p) => {
      map[p.type] = p.value;
    });
    return `${map.year}-${map.month}-${map.day} (${map.weekday}) ${map.hour}:${map.minute}:${map.second}`;
  } catch {
    return new Date().toLocaleString('ko-KR');
  }
}

/**
 * 상대 시간 표시 (방금 전, N분 전, N시간 전, N일 전)
 */
export function formatRelativeTime(isoStr) {
  if (!isoStr) return '-';
  const target = new Date(isoStr).getTime();
  if (Number.isNaN(target)) return '-';
  const diffSec = Math.max(0, Math.floor((Date.now() - target) / 1000));
  if (diffSec < 45) return '방금 전';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)}일 전`;
  return formatKstDateTime(isoStr).slice(0, 10);
}

/**
 * 현재 브라우저 탭의 고유 세션 ID 발급/조회
 */
export function getActiveSessionId() {
  if (typeof window === 'undefined') return 'ssr_session';
  try {
    let sid = sessionStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(CURRENT_SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return `sess_${Date.now()}`;
  }
}

/**
 * User-Agent 및 브라우저 환경에서 기기 모델·OS·브라우저·해상도·네트워크 정밀 파싱
 */
export function parseDeviceEnvironment() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceType: 'PC',
      deviceModel: 'Desktop',
      osName: 'Windows',
      browserName: 'Chrome',
      screenResolution: '1920x1080',
      networkType: 'Wi-Fi / Broadband',
      referrer: '직접 접속',
      userAgent: '',
    };
  }

  const ua = navigator.userAgent || '';
  let deviceType = 'PC (데스크톱)';
  let deviceModel = 'PC / 워크스테이션';
  let osName = 'Windows';
  let browserName = 'Chrome';

  // 기기 종류 및 모델 상세 판별
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
    deviceType = '태블릿';
    deviceModel = 'Apple iPad';
    osName = 'iPadOS';
  } else if (/iPhone/i.test(ua)) {
    deviceType = '모바일';
    deviceModel = 'Apple iPhone';
    const iosMatch = ua.match(/OS (\d+[_\d]*)/);
    osName = iosMatch ? `iOS ${iosMatch[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/Android/i.test(ua)) {
    deviceType = /Mobile/i.test(ua) ? '모바일' : '태블릿';
    const verMatch = ua.match(/Android\s+([\d.]+)/i);
    osName = verMatch ? `Android ${verMatch[1]}` : 'Android';

    // 삼성 갤럭시 주요 모델명 매핑
    if (/SM-S928/i.test(ua)) deviceModel = 'Samsung Galaxy S24 Ultra';
    else if (/SM-S926/i.test(ua)) deviceModel = 'Samsung Galaxy S24+';
    else if (/SM-S921/i.test(ua)) deviceModel = 'Samsung Galaxy S24';
    else if (/SM-S918/i.test(ua)) deviceModel = 'Samsung Galaxy S23 Ultra';
    else if (/SM-S911|SM-S916/i.test(ua)) deviceModel = 'Samsung Galaxy S23';
    else if (/SM-F946|SM-F956/i.test(ua)) deviceModel = 'Samsung Galaxy Z Fold';
    else if (/SM-F731|SM-F741/i.test(ua)) deviceModel = 'Samsung Galaxy Z Flip';
    else {
      const modelMatch = ua.match(/;\s*([^;)]+)\s+Build\//i);
      deviceModel = modelMatch ? modelMatch[1].trim() : 'Android 스마트폰';
    }
  } else if (/Windows NT/i.test(ua)) {
    deviceType = 'PC';
    deviceModel = 'Windows PC';
    if (/Windows NT 10\.0/i.test(ua)) osName = 'Windows 10/11';
    else osName = 'Windows';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceType = 'PC';
    deviceModel = 'Apple Mac';
    osName = 'macOS';
  } else if (/Linux/i.test(ua)) {
    deviceType = 'PC';
    deviceModel = 'Linux PC';
    osName = 'Linux';
  }

  // 브라우저(인앱 브라우저 포함) 정밀 판별
  if (/KAKAOTALK/i.test(ua)) {
    browserName = '카카오톡 인앱브라우저';
  } else if (/NAVER\(/i.test(ua)) {
    browserName = '네이버 앱 브라우저';
  } else if (/Instagram/i.test(ua)) {
    browserName = '인스타그램 인앱브라우저';
  } else if (/SamsungBrowser/i.test(ua)) {
    browserName = '삼성 인터넷';
  } else if (/Edg\//i.test(ua)) {
    browserName = 'Microsoft Edge';
  } else if (/OPR\/|Opera/i.test(ua)) {
    browserName = 'Opera';
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browserName = 'Google Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browserName = 'Apple Safari';
  } else if (/Firefox\//i.test(ua)) {
    browserName = 'Mozilla Firefox';
  }

  const sw = window.screen?.width || window.innerWidth || 0;
  const sh = window.screen?.height || window.innerHeight || 0;
  const vw = window.innerWidth || sw;
  const vh = window.innerHeight || sh;
  const screenResolution = `${sw}×${sh} (뷰포트 ${vw}×${vh})`;

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let networkType = '광대역 / Wi-Fi';
  if (conn) {
    const eff = conn.effectiveType ? conn.effectiveType.toUpperCase() : '';
    const type = conn.type || '';
    if (type === 'wifi') networkType = `Wi-Fi (${eff || '고속'})`;
    else if (type === 'cellular') networkType = `모바일 데이터 (${eff || '5G/LTE'})`;
    else if (eff) networkType = `네트워크 (${eff}${conn.downlink ? ` · ${conn.downlink}Mbps` : ''})`;
  }

  let referrer = '직접 접속 (Direct)';
  if (typeof document !== 'undefined' && document.referrer) {
    try {
      const refUrl = new URL(document.referrer);
      if (refUrl.host === window.location.host) {
        referrer = `내부 이동 (${refUrl.pathname || '/'})`;
      } else {
        referrer = refUrl.hostname;
      }
    } catch {
      referrer = document.referrer.slice(0, 50);
    }
  }

  return {
    deviceType,
    deviceModel,
    osName,
    browserName,
    screenResolution,
    networkType,
    referrer,
    userAgent: ua.slice(0, 220),
  };
}

/**
 * 다중 레이어 지리적 위치(어디에서 사용했는지) 해석기
 * 1) 세션 캐시 확인
 * 2) 백엔드 `/api/admin/geoip` 조회 (공인 IP · 통신사 · 시/도 · 구/군 · 위경도)
 * 3) 클라이언트 직접 조회 폴백 (`ipwho.is`, `ipapi.co`)
 * 4) HTML5 Geolocation 권한이 이미 허용된 경우 고정밀 GPS + 한국어 역지오코딩으로 자동 업그레이드
 */
export async function resolveUserLocation(forceRefresh = false) {
  if (typeof window === 'undefined') {
    return {
      ipAddress: '127.0.0.1',
      country: '대한민국',
      region: '서울특별시',
      city: '강남구',
      district: '역삼동',
      locationLabel: '서울특별시 강남구 역삼동',
      latitude: 37.4979,
      longitude: 127.0276,
      isp: 'KT / Broadband',
      locationSource: '시스템 기본값',
    };
  }

  if (!forceRefresh) {
    try {
      const cached = sessionStorage.getItem(GEO_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.locationLabel && Date.now() - (parsed.cachedAt || 0) < 1000 * 60 * 30) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  if (_resolvedGeoPromise && !forceRefresh) {
    return _resolvedGeoPromise;
  }

  _resolvedGeoPromise = (async () => {
    let geoResult = null;

    // 1단계: 백엔드 GeoIP API 호출
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2800);
      const res = await fetch('/api/admin/geoip', { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          geoResult = json.data;
        }
      }
    } catch {
      // 백엔드 미응답 시 2단계로 폴백
    }

    // 2단계: 클라이언트 공인 IP Geolocation API (ipwho.is 한국어 지원)
    if (!geoResult || geoResult.ipAddress === '127.0.0.1') {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2800);
        const res = await fetch('https://ipwho.is/?lang=ko', { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success !== false) {
            const country = data.country || '대한민국';
            const region = data.region || '서울특별시';
            const city = data.city || '';
            const labelParts = [region, city].filter(Boolean);
            const dedup = [];
            labelParts.forEach((p) => {
              if (!dedup.some((ex) => ex.includes(p) || p.includes(ex))) dedup.push(p);
            });
            geoResult = {
              ipAddress: data.ip || geoResult?.ipAddress || '공인 IP 확인됨',
              country,
              region,
              city,
              district: '',
              locationLabel: dedup.join(' ') || `${country} ${region}`,
              latitude: Number(data.latitude) || 37.5665,
              longitude: Number(data.longitude) || 126.978,
              isp: data.connection?.isp || data.connection?.org || '국내 인터넷망',
              locationSource: '공인 IP 위치추적',
            };
          }
        }
      } catch {
        // ignore
      }
    }

    // 3단계: 만약 이미 브라우저 위치 권한(geolocation)이 granted 상태이면 고정밀 GPS 좌표 + 동 단위 주소 보강
    try {
      if (navigator.permissions && navigator.geolocation) {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        if (perm.state === 'granted') {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 2500,
              maximumAge: 600000,
            });
          });
          if (pos?.coords) {
            const lat = Number(pos.coords.latitude.toFixed(5));
            const lng = Number(pos.coords.longitude.toFixed(5));
            const rev = await reverseGeocodeKorean(lat, lng);
            geoResult = {
              ...(geoResult || {}),
              ipAddress: geoResult?.ipAddress || '공인 IP + GPS',
              country: rev.country || geoResult?.country || '대한민국',
              region: rev.region || geoResult?.region || '서울특별시',
              city: rev.city || geoResult?.city || '',
              district: rev.district || geoResult?.district || '',
              locationLabel: rev.locationLabel || geoResult?.locationLabel || `GPS (${lat}, ${lng})`,
              latitude: lat,
              longitude: lng,
              isp: geoResult?.isp || '모바일/Wi-Fi GPS',
              locationSource: 'GPS 정밀위치 인증',
            };
          }
        }
      }
    } catch {
      // ignore GPS error
    }

    if (!geoResult) {
      geoResult = {
        ipAddress: '127.0.0.1 (로컬 접속)',
        country: '대한민국',
        region: '서울특별시',
        city: '강남구',
        district: '역삼동',
        locationLabel: '서울특별시 강남구 (로컬 접속)',
        latitude: 37.4979,
        longitude: 127.0276,
        isp: '국내 초고속 인터넷',
        locationSource: '네트워크 게이트웨이',
      };
    }

    const withCacheTime = { ...geoResult, cachedAt: Date.now() };
    try {
      sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(withCacheTime));
    } catch {
      // ignore
    }
    return withCacheTime;
  })();

  return _resolvedGeoPromise;
}

/**
 * 위도·경도를 한국어 행정구역(시·도 / 시·군·구 / 읍·면·동)으로 변환
 */
export async function reverseGeocodeKorean(lat, lng) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ko`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const country = data.countryName || '대한민국';
      const region = data.principalSubdivision || '서울특별시';
      const admin = Array.isArray(data.localityInfo?.administrative) ? data.localityInfo.administrative : [];
      const guGun = admin.find((a) => a.adminLevel === 6 && a.name && a.name !== region)?.name || '';
      const city = guGun || (data.city && data.city !== region ? data.city : '');
      let district = '';
      if (data.locality && data.locality !== region && data.locality !== city) {
        district = data.locality;
      } else {
        const dongObj = [...admin]
          .reverse()
          .find((a) => (a.adminLevel >= 7 || /동$|읍$|면$/.test(a.name || '')) && a.name !== region && a.name !== city);
        if (dongObj) district = dongObj.name;
      }
      const parts = [region, city, district].filter(Boolean);
      const dedup = [];
      parts.forEach((p) => {
        if (!dedup.some((ex) => ex === p)) dedup.push(p);
      });
      return {
        country,
        region,
        city,
        district,
        locationLabel: dedup.join(' ') || `${region} (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      };
    }
  } catch {
    // ignore
  }
  return {
    country: '대한민국',
    region: '서울특별시',
    city: '',
    district: '',
    locationLabel: `위도 ${lat.toFixed(4)}, 경도 ${lng.toFixed(4)}`,
  };
}

/**
 * 사용자가 '내 주변 정밀 위치 인증' 또는 '병원 찾기 GPS'를 실행했을 때 정밀 GPS 위치를 즉시 갱신·기록
 */
export async function triggerPrecisionGpsCheck(member = null) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('이 브라우저에서는 GPS 위치 기능을 지원하지 않습니다.');
  }
  const pos = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 7000,
      maximumAge: 0,
    });
  });

  const lat = Number(pos.coords.latitude.toFixed(5));
  const lng = Number(pos.coords.longitude.toFixed(5));
  const accuracyMeters = Math.round(pos.coords.accuracy || 15);
  const currentGeo = await resolveUserLocation(false);
  const rev = await reverseGeocodeKorean(lat, lng);

  const upgradedGeo = {
    ...currentGeo,
    country: rev.country || '대한민국',
    region: rev.region || currentGeo.region,
    city: rev.city || currentGeo.city,
    district: rev.district || currentGeo.district,
    locationLabel: rev.locationLabel,
    latitude: lat,
    longitude: lng,
    locationSource: `GPS 정밀위치 (±${accuracyMeters}m)`,
    cachedAt: Date.now(),
  };

  try {
    sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(upgradedGeo));
  } catch {
    // ignore
  }
  _resolvedGeoPromise = Promise.resolve(upgradedGeo);

  await trackUserActivity({
    eventType: 'LOCATION_UPDATE',
    eventLabel: 'GPS 정밀 위치 확인',
    appSection: '위치 서비스 인증',
    actionDetail: `${upgradedGeo.locationLabel} (위도 ${lat}, 경도 ${lng}, 오차 ±${accuracyMeters}m)`,
    member,
    metadata: { latitude: lat, longitude: lng, accuracyMeters },
  });

  return upgradedGeo;
}

/**
 * 현재 로그인된 회원 정보 즉시 읽기 (순환 참조 방지용 독립 리더)
 */
function readCurrentActiveMember() {
  if (typeof window === 'undefined') return null;
  try {
    const p = localStorage.getItem(SESSION_KEY);
    if (p) {
      const parsed = JSON.parse(p);
      if (parsed && (parsed.id || parsed.email)) return parsed;
    }
  } catch {
    // ignore
  }
  try {
    const t = sessionStorage.getItem(TEMP_SESSION_KEY);
    if (t) {
      const parsed = JSON.parse(t);
      if (parsed && (parsed.id || parsed.email)) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function readLocalAuditLogs() {
  try {
    const raw = localStorage.getItem(ADMIN_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalAuditLogs(logs) {
  try {
    const trimmed = (logs || []).slice(0, MAX_LOCAL_LOGS);
    localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return logs || [];
  }
}

function readLocalAdminMembers() {
  try {
    const raw = localStorage.getItem(ADMIN_MEMBERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalAdminMembers(members) {
  try {
    localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(members || []));
  } catch {
    // ignore
  }
}

/**
 * 회원 정보를 관리자 인덱스 레지스트리에 병합 (Upsert)
 */
export function upsertLocalAdminMember(memberPatch) {
  if (!memberPatch || !(memberPatch.id || memberPatch.email)) return null;
  const list = readLocalAdminMembers();
  const cleanEmail = String(memberPatch.email || '').toLowerCase();
  const targetId = memberPatch.id || `email_${cleanEmail}`;

  const idx = list.findIndex(
    (m) => m.id === targetId || (cleanEmail && String(m.email || '').toLowerCase() === cleanEmail)
  );

  const nowIso = new Date().toISOString();
  let merged;
  if (idx >= 0) {
    const prev = list[idx];
    merged = {
      ...prev,
      ...memberPatch,
      id: prev.id || targetId,
      name: memberPatch.name || prev.name || '회원',
      email: cleanEmail || prev.email || '',
      phone: memberPatch.phone || prev.phone || '',
      birthDate: memberPatch.birthDate || prev.birthDate || '',
      age: memberPatch.age ?? prev.age ?? null,
      gender: memberPatch.gender || prev.gender || 'male',
      autoLogin: memberPatch.autoLogin !== undefined ? Boolean(memberPatch.autoLogin) : prev.autoLogin !== false,
      consents: memberPatch.consents || prev.consents || {},
      createdAt: prev.createdAt || memberPatch.createdAt || nowIso,
      lastLoginAt: memberPatch.lastLoginAt || prev.lastLoginAt || nowIso,
      lastActiveAt: memberPatch.lastActiveAt || nowIso,
      lastIp: memberPatch.lastIp || prev.lastIp || '',
      lastLocationLabel: memberPatch.lastLocationLabel || prev.lastLocationLabel || '',
      lastRegion: memberPatch.lastRegion || prev.lastRegion || '',
      lastCity: memberPatch.lastCity || prev.lastCity || '',
      lastLat: memberPatch.lastLat ?? prev.lastLat ?? null,
      lastLng: memberPatch.lastLng ?? prev.lastLng ?? null,
      lastIsp: memberPatch.lastIsp || prev.lastIsp || '',
      lastDeviceSummary: memberPatch.lastDeviceSummary || prev.lastDeviceSummary || '',
      isDemo: Boolean(prev.isDemo && memberPatch.isDemo !== false),
    };
    list[idx] = merged;
  } else {
    merged = {
      id: targetId,
      name: memberPatch.name || (cleanEmail ? cleanEmail.split('@')[0] : '회원'),
      email: cleanEmail,
      phone: memberPatch.phone || '',
      birthDate: memberPatch.birthDate || '',
      age: memberPatch.age ?? null,
      gender: memberPatch.gender || 'male',
      autoLogin: memberPatch.autoLogin !== false,
      consents: memberPatch.consents || {},
      createdAt: memberPatch.createdAt || nowIso,
      lastLoginAt: memberPatch.lastLoginAt || memberPatch.createdAt || nowIso,
      lastActiveAt: memberPatch.lastActiveAt || nowIso,
      lastIp: memberPatch.lastIp || '',
      lastLocationLabel: memberPatch.lastLocationLabel || '',
      lastRegion: memberPatch.lastRegion || '',
      lastCity: memberPatch.lastCity || '',
      lastLat: memberPatch.lastLat ?? null,
      lastLng: memberPatch.lastLng ?? null,
      lastIsp: memberPatch.lastIsp || '',
      lastDeviceSummary: memberPatch.lastDeviceSummary || '',
      isDemo: Boolean(memberPatch.isDemo),
    };
    list.unshift(merged);
  }

  writeLocalAdminMembers(list);
  return merged;
}

/**
 * 핵심 사용자 활동(어느 가입자가 · 언제 · 어디에서 · 무엇을 했는지) 실시간 기록
 */
export async function trackUserActivity({
  eventType = 'PAGE_VIEW',
  eventLabel = '메뉴 조회',
  appSection = '대시보드 홈',
  actionDetail = '',
  member = null,
  metadata = {},
  customDurationSec = null,
}) {
  if (typeof window === 'undefined') return null;

  const activeMember = member || readCurrentActiveMember();
  const env = parseDeviceEnvironment();
  const now = new Date();
  const nowIso = now.toISOString();
  const kstTimeStr = formatKstDateTime(now);
  const sessionId = getActiveSessionId();

  // 이전 섹션 체류 시간 계산
  const elapsedSec =
    customDurationSec !== null
      ? customDurationSec
      : Math.max(1, Math.min(3600, Math.round((Date.now() - _lastTabEnterTime) / 1000)));
  _lastTabEnterTime = Date.now();
  _lastSectionName = appSection;

  const geo = await resolveUserLocation(false);

  const memberId = activeMember?.id || (activeMember?.email ? `email_${activeMember.email.toLowerCase()}` : 'guest');
  const isMember = Boolean(activeMember && (activeMember.id || activeMember.email));

  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: nowIso,
    kstTimeStr,
    sessionId,
    memberId,
    memberName: activeMember?.name || '비회원(방문자)',
    memberEmail: activeMember?.email || '',
    memberPhone: activeMember?.phone || '',
    memberGender: activeMember?.gender || metadata?.gender || '',
    memberAge: activeMember?.age ? String(activeMember.age) : metadata?.age ? String(metadata.age) : '',
    isMember,
    eventType,
    eventLabel,
    appSection,
    actionDetail: actionDetail || `${appSection} (${eventLabel})`,
    metadata: metadata || {},
    ipAddress: geo.ipAddress || '127.0.0.1',
    country: geo.country || '대한민국',
    region: geo.region || '서울특별시',
    city: geo.city || '',
    district: geo.district || '',
    locationLabel: geo.locationLabel || '대한민국 서울특별시',
    latitude: geo.latitude ?? 37.4979,
    longitude: geo.longitude ?? 127.0276,
    isp: geo.isp || '국내 인터넷망',
    locationSource: geo.locationSource || '공인 IP 위치추적',
    deviceType: env.deviceType,
    deviceModel: env.deviceModel,
    osName: env.osName,
    browserName: env.browserName,
    screenResolution: env.screenResolution,
    networkType: env.networkType,
    referrer: env.referrer,
    userAgent: env.userAgent,
    durationSec: elapsedSec,
    isDemo: false,
  };

  // 1. 로컬 감사 로그에 즉시 저장
  const currentLogs = readLocalAuditLogs();
  writeLocalAuditLogs([logEntry, ...currentLogs]);

  // 2. 회원일 경우 회원 마스터 레코드의 최근 접속 위치/시각/기기 정보 즉시 업데이트
  let updatedMember = null;
  if (isMember) {
    updatedMember = upsertLocalAdminMember({
      ...activeMember,
      lastActiveAt: nowIso,
      lastLoginAt:
        eventType === 'MEMBER_LOGIN' || eventType === 'MEMBER_SIGNUP' || eventType === 'SESSION_RESTORE'
          ? nowIso
          : activeMember.lastLoginAt,
      lastIp: logEntry.ipAddress,
      lastLocationLabel: logEntry.locationLabel,
      lastRegion: logEntry.region,
      lastCity: logEntry.city,
      lastLat: logEntry.latitude,
      lastLng: logEntry.longitude,
      lastIsp: logEntry.isp,
      lastDeviceSummary: `${env.deviceModel} · ${env.osName} · ${env.browserName}`,
      isDemo: false,
    });
  }

  // 3. 백엔드 중앙 DB(`/api/admin/track`)에 비차단형 실시간 전송
  try {
    fetch('/api/admin/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        log: logEntry,
        member: updatedMember,
      }),
    }).catch(() => {});
  } catch {
    // ignore offline error
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('adminAuditUpdated'));
  }

  return logEntry;
}

/**
 * 기존 로컬 가입자(`wealthyhair_registered_members_v1`) 및 진단 기록(`idb-keyval` / `localStorage`)을
 * 관리자 감사 인덱스로 자동 백필(Backfill)하여 과거 가입자 및 기록도 100% 누락 없이 표시
 */
async function backfillExistingLocalMembersAndHistory() {
  if (typeof window === 'undefined') return;

  const geo = await resolveUserLocation(false);
  const env = parseDeviceEnvironment();

  let registered = [];
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) registered = JSON.parse(raw);
  } catch {
    // ignore
  }

  // 현재 세션 회원도 포함
  const currentSessionMember = readCurrentActiveMember();
  if (currentSessionMember && !registered.some((m) => m.id === currentSessionMember.id || m.email === currentSessionMember.email)) {
    registered.push(currentSessionMember);
  }

  const existingLogs = readLocalAuditLogs();
  const loggedIds = new Set(existingLogs.map((l) => l.id));
  const newBackfillLogs = [];

  for (const reg of registered) {
    if (!reg || !(reg.id || reg.email)) continue;
    const syncedMember = upsertLocalAdminMember({
      ...reg,
      lastIp: reg.lastIp || geo.ipAddress,
      lastLocationLabel: reg.lastLocationLabel || geo.locationLabel,
      lastRegion: reg.lastRegion || geo.region,
      lastCity: reg.lastCity || geo.city,
      lastLat: reg.lastLat ?? geo.latitude,
      lastLng: reg.lastLng ?? geo.longitude,
      lastIsp: reg.lastIsp || geo.isp,
      lastDeviceSummary: reg.lastDeviceSummary || `${env.deviceModel} · ${env.osName} · ${env.browserName}`,
      isDemo: false,
    });

    // 가입 로그가 없으면 가입 이력 백필 생성
    const signupLogId = `backfill_signup_${syncedMember.id}`;
    if (!loggedIds.has(signupLogId)) {
      const createdIso = syncedMember.createdAt || new Date().toISOString();
      newBackfillLogs.push({
        id: signupLogId,
        timestamp: createdIso,
        kstTimeStr: formatKstDateTime(createdIso),
        sessionId: `sess_init_${syncedMember.id}`,
        memberId: syncedMember.id,
        memberName: syncedMember.name,
        memberEmail: syncedMember.email,
        memberPhone: syncedMember.phone || '',
        memberGender: syncedMember.gender || 'male',
        memberAge: syncedMember.age ? String(syncedMember.age) : '',
        isMember: true,
        eventType: 'MEMBER_SIGNUP',
        eventLabel: '회원가입 및 약관동의 완료',
        appSection: '회원 인증 게이트',
        actionDetail: `신규 회원가입 완료 (성명: ${syncedMember.name}, 연락처: ${syncedMember.phone || '-'}, 자동로그인: ${syncedMember.autoLogin !== false ? 'ON' : 'OFF'})`,
        metadata: { consents: syncedMember.consents || {} },
        ipAddress: syncedMember.lastIp || geo.ipAddress,
        country: geo.country || '대한민국',
        region: syncedMember.lastRegion || geo.region || '서울특별시',
        city: syncedMember.lastCity || geo.city || '',
        district: geo.district || '',
        locationLabel: syncedMember.lastLocationLabel || geo.locationLabel,
        latitude: syncedMember.lastLat ?? geo.latitude,
        longitude: syncedMember.lastLng ?? geo.longitude,
        isp: syncedMember.lastIsp || geo.isp,
        locationSource: geo.locationSource || '공인 IP 위치추적',
        deviceType: env.deviceType,
        deviceModel: env.deviceModel,
        osName: env.osName,
        browserName: env.browserName,
        screenResolution: env.screenResolution,
        networkType: env.networkType,
        referrer: '회원가입 폼',
        userAgent: env.userAgent,
        durationSec: 45,
        isDemo: false,
      });
      loggedIds.add(signupLogId);
    }

    // 해당 회원의 진단 기록(IndexedDB 또는 localStorage) 백필
    const scopeKeys = [syncedMember.id];
    if (syncedMember.email) scopeKeys.push(`email_${syncedMember.email.toLowerCase()}`);

    for (const scope of scopeKeys) {
      let diagRecords = [];
      try {
        const fromIdb = await get(`wealthyhair_diag_history_v1_${scope}`);
        if (Array.isArray(fromIdb)) diagRecords = fromIdb;
      } catch {
        // ignore
      }
      if (!diagRecords.length) {
        try {
          const fromLs = localStorage.getItem(`wealthyhair_diag_meta_v1_${scope}`);
          if (fromLs) diagRecords = JSON.parse(fromLs);
        } catch {
          // ignore
        }
      }

      for (const rec of diagRecords || []) {
        if (!rec || !rec.id) continue;
        const diagLogId = `backfill_diag_${rec.id}`;
        if (loggedIds.has(diagLogId)) continue;

        const isAreata = rec.category === 'areata';
        const diagTime = rec.createdAt || new Date().toISOString();
        newBackfillLogs.push({
          id: diagLogId,
          timestamp: diagTime,
          kstTimeStr: formatKstDateTime(diagTime),
          sessionId: `sess_diag_${rec.id.slice(-6)}`,
          memberId: syncedMember.id,
          memberName: syncedMember.name,
          memberEmail: syncedMember.email,
          memberPhone: syncedMember.phone || '',
          memberGender: rec.gender || syncedMember.gender || 'male',
          memberAge: syncedMember.age ? String(syncedMember.age) : '',
          isMember: true,
          eventType: isAreata ? 'DIAGNOSIS_AREATA' : 'DIAGNOSIS_AGA',
          eventLabel: isAreata ? '원형탈모(SALT) 정밀 진단' : '남·여 탈모 AI 정밀 진단',
          appSection: isAreata ? '원형탈모(SALT) 진단' : 'AI 탈모 정밀 진단',
          actionDetail: isAreata
            ? `${rec.primaryGrade} · ${rec.secondaryGrade} (SALT ${rec.saltScore ?? 0}점)`
            : `${rec.primaryGrade} · BASP ${rec.basp || '-'} (모발 건강점수 ${rec.healthScore ?? 80}점)`,
          metadata: {
            recordId: rec.id,
            category: rec.category,
            primaryGrade: rec.primaryGrade,
            secondaryGrade: rec.secondaryGrade,
            healthScore: rec.healthScore,
            saltScore: rec.saltScore,
            metrics: rec.metrics || {},
            summary: rec.summary || '',
            memo: rec.memo || '',
            thumbnail: rec.thumbnails?.primary || null,
          },
          ipAddress: syncedMember.lastIp || geo.ipAddress,
          country: geo.country || '대한민국',
          region: syncedMember.lastRegion || geo.region || '서울특별시',
          city: syncedMember.lastCity || geo.city || '',
          district: geo.district || '',
          locationLabel: syncedMember.lastLocationLabel || geo.locationLabel,
          latitude: syncedMember.lastLat ?? geo.latitude,
          longitude: syncedMember.lastLng ?? geo.longitude,
          isp: syncedMember.lastIsp || geo.isp,
          locationSource: geo.locationSource || '공인 IP 위치추적',
          deviceType: env.deviceType,
          deviceModel: env.deviceModel,
          osName: env.osName,
          browserName: env.browserName,
          screenResolution: env.screenResolution,
          networkType: env.networkType,
          referrer: '진단 완료 자동기록',
          userAgent: env.userAgent,
          durationSec: 110,
          isDemo: false,
        });
        loggedIds.add(diagLogId);
      }
    }
  }

  if (newBackfillLogs.length > 0) {
    const mergedLogs = [...newBackfillLogs, ...existingLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    writeLocalAuditLogs(mergedLogs);
  }
}

/**
 * 전국 주요 거점 시뮬레이션 가입자 및 사용 이력 생성기 (시연 및 다지역 지도/통계 테스트용)
 * - `isDemo: true` 플래그로 실제 가입자와 명확히 구분되며 언제든 필터링·삭제 가능
 */
export function ensureDemoSubscribersSeeded() {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(ADMIN_DEMO_DISMISSED_KEY) === '1') return;
  } catch {
    // ignore
  }

  const currentMembers = readLocalAdminMembers();
  if (currentMembers.some((m) => m.isDemo)) return;

  const now = Date.now();
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;

  const demoSubscribers = [
    {
      id: 'demo_mem_seoul_01',
      name: '김도현',
      email: 'dohyun.kim88@naver.com',
      phone: '010-8241-3910',
      birthDate: '1988-04-15',
      age: 38,
      gender: 'male',
      autoLogin: true,
      consents: { age14: true, terms: true, privacyRequired: true, sensitiveHealth: true, marketingOptIn: true },
      createdAt: new Date(now - 6 * day - 3 * hour).toISOString(),
      lastLoginAt: new Date(now - 18 * min).toISOString(),
      lastActiveAt: new Date(now - 12 * min).toISOString(),
      lastIp: '211.234.118.42',
      lastRegion: '서울특별시',
      lastCity: '강남구',
      lastDistrict: '역삼동',
      lastLocationLabel: '서울특별시 강남구 역삼동',
      lastLat: 37.5006,
      lastLng: 127.0364,
      lastIsp: 'KT (Korea Telecom)',
      deviceType: '모바일',
      deviceModel: 'Samsung Galaxy S24 Ultra',
      osName: 'Android 15',
      browserName: '카카오톡 인앱브라우저',
      screenResolution: '412×915 (뷰포트 412×820)',
      networkType: '모바일 데이터 (5G)',
      lastDeviceSummary: 'Samsung Galaxy S24 Ultra · Android 15 · 카카오톡 인앱브라우저',
      isDemo: true,
    },
    {
      id: 'demo_mem_bundang_02',
      name: '이서연',
      email: 'seoyeon.lee93@gmail.com',
      phone: '010-5412-7782',
      birthDate: '1993-09-22',
      age: 33,
      gender: 'female',
      autoLogin: true,
      consents: { age14: true, terms: true, privacyRequired: true, sensitiveHealth: true, marketingOptIn: false },
      createdAt: new Date(now - 4 * day - 5 * hour).toISOString(),
      lastLoginAt: new Date(now - 52 * min).toISOString(),
      lastActiveAt: new Date(now - 44 * min).toISOString(),
      lastIp: '175.198.45.109',
      lastRegion: '경기도',
      lastCity: '성남시 분당구',
      lastDistrict: '정자동',
      lastLocationLabel: '경기도 성남시 분당구 정자동',
      lastLat: 37.3662,
      lastLng: 127.1076,
      lastIsp: 'SK Broadband',
      deviceType: '모바일',
      deviceModel: 'Apple iPhone',
      osName: 'iOS 18.2',
      browserName: 'Apple Safari',
      screenResolution: '393×852 (뷰포트 393×760)',
      networkType: 'Wi-Fi (고속)',
      lastDeviceSummary: 'Apple iPhone · iOS 18.2 · Apple Safari',
      isDemo: true,
    },
    {
      id: 'demo_mem_busan_03',
      name: '박준혁',
      email: 'junhyuk.park79@daum.net',
      phone: '010-3901-6624',
      birthDate: '1979-11-03',
      age: 46,
      gender: 'male',
      autoLogin: true,
      consents: { age14: true, terms: true, privacyRequired: true, sensitiveHealth: true, marketingOptIn: true },
      createdAt: new Date(now - 5 * day).toISOString(),
      lastLoginAt: new Date(now - 2 * hour - 15 * min).toISOString(),
      lastActiveAt: new Date(now - 2 * hour - 5 * min).toISOString(),
      lastIp: '112.164.88.19',
      lastRegion: '부산광역시',
      lastCity: '해운대구',
      lastDistrict: '우동 센텀시티',
      lastLocationLabel: '부산광역시 해운대구 우동',
      lastLat: 35.1689,
      lastLng: 129.1319,
      lastIsp: 'LG U+ (엘지유플러스)',
      deviceType: 'PC',
      deviceModel: 'Windows PC',
      osName: 'Windows 10/11',
      browserName: 'Google Chrome',
      screenResolution: '2560×1440 (뷰포트 1920×1010)',
      networkType: '광대역 / Wi-Fi',
      lastDeviceSummary: 'Windows PC · Windows 10/11 · Google Chrome',
      isDemo: true,
    },
    {
      id: 'demo_mem_daegu_04',
      name: '최은지',
      email: 'eunji.choi96@kakao.com',
      phone: '010-7129-4805',
      birthDate: '1996-02-18',
      age: 30,
      gender: 'female',
      autoLogin: false,
      consents: { age14: true, terms: true, privacyRequired: true, sensitiveHealth: true, marketingOptIn: true },
      createdAt: new Date(now - 3 * day - 2 * hour).toISOString(),
      lastLoginAt: new Date(now - 4 * hour - 30 * min).toISOString(),
      lastActiveAt: new Date(now - 4 * hour - 12 * min).toISOString(),
      lastIp: '58.231.14.205',
      lastRegion: '대구광역시',
      lastCity: '수성구',
      lastDistrict: '범어동',
      lastLocationLabel: '대구광역시 수성구 범어동',
      lastLat: 35.8591,
      lastLng: 128.6263,
      lastIsp: 'KT (Korea Telecom)',
      deviceType: '모바일',
      deviceModel: 'Apple iPhone',
      osName: 'iOS 18.1',
      browserName: '카카오톡 인앱브라우저',
      screenResolution: '390×844 (뷰포트 390×750)',
      networkType: '모바일 데이터 (5G)',
      lastDeviceSummary: 'Apple iPhone · iOS 18.1 · 카카오톡 인앱브라우저',
      isDemo: true,
    },
    {
      id: 'demo_mem_incheon_05',
      name: '정성훈',
      email: 'sunghoon.jung84@gmail.com',
      phone: '010-6388-1920',
      birthDate: '1984-07-29',
      age: 42,
      gender: 'male',
      autoLogin: true,
      consents: { age14: true, terms: true, privacyRequired: true, sensitiveHealth: true, marketingOptIn: false },
      createdAt: new Date(now - 2 * day - 8 * hour).toISOString(),
      lastLoginAt: new Date(now - 6 * hour - 10 * min).toISOString(),
      lastActiveAt: new Date(now - 5 * hour - 50 * min).toISOString(),
      lastIp: '121.138.204.77',
      lastRegion: '인천광역시',
      lastCity: '연수구',
      lastDistrict: '송도동',
      lastLocationLabel: '인천광역시 연수구 송도동',
      lastLat: 37.3925,
      lastLng: 126.6438,
      lastIsp: 'SK Broadband',
      deviceType: '태블릿',
      deviceModel: 'Apple iPad',
      osName: 'iPadOS',
      browserName: 'Apple Safari',
      screenResolution: '1024×1366 (뷰포트 1024×1290)',
      networkType: 'Wi-Fi (고속)',
      lastDeviceSummary: 'Apple iPad · iPadOS · Apple Safari',
      isDemo: true,
    },
    {
      id: 'demo_mem_daejeon_06',
      name: '강민수',
      email: 'minsu.kang91@naver.com',
      phone: '010-9043-5127',
      birthDate: '1991-12-11',
      age: 34,
      gender: 'male',
      autoLogin: true,
      consents: { age14: true, terms: true, privacyRequired: true, sensitiveHealth: true, marketingOptIn: true },
      createdAt: new Date(now - 1 * day - 11 * hour).toISOString(),
      lastLoginAt: new Date(now - 9 * hour).toISOString(),
      lastActiveAt: new Date(now - 8 * hour - 40 * min).toISOString(),
      lastIp: '218.152.63.14',
      lastRegion: '대전광역시',
      lastCity: '유성구',
      lastDistrict: '봉명동',
      lastLocationLabel: '대전광역시 유성구 봉명동',
      lastLat: 36.3554,
      lastLng: 127.3415,
      lastIsp: 'LG U+ (엘지유플러스)',
      deviceType: '모바일',
      deviceModel: 'Samsung Galaxy S23 Ultra',
      osName: 'Android 14',
      browserName: '삼성 인터넷',
      screenResolution: '384×824 (뷰포트 384×740)',
      networkType: '모바일 데이터 (5G)',
      lastDeviceSummary: 'Samsung Galaxy S23 Ultra · Android 14 · 삼성 인터넷',
      isDemo: true,
    },
  ];

  demoSubscribers.forEach((m) => upsertLocalAdminMember(m));

  const makeDemoLog = (m, offsetMs, eventType, eventLabel, appSection, actionDetail, durationSec, metadata = {}) => {
    const tIso = new Date(now - offsetMs).toISOString();
    return {
      id: `demo_log_${m.id}_${offsetMs}`,
      timestamp: tIso,
      kstTimeStr: formatKstDateTime(tIso),
      sessionId: `sess_demo_${m.id}`,
      memberId: m.id,
      memberName: m.name,
      memberEmail: m.email,
      memberPhone: m.phone,
      memberGender: m.gender,
      memberAge: String(m.age),
      isMember: true,
      eventType,
      eventLabel,
      appSection,
      actionDetail,
      metadata,
      ipAddress: m.lastIp,
      country: '대한민국',
      region: m.lastRegion,
      city: m.lastCity,
      district: m.lastDistrict,
      locationLabel: m.lastLocationLabel,
      latitude: m.lastLat,
      longitude: m.lastLng,
      isp: m.lastIsp,
      locationSource: '공인 IP + 기지국 위치',
      deviceType: m.deviceType,
      deviceModel: m.deviceModel,
      osName: m.osName,
      browserName: m.browserName,
      screenResolution: m.screenResolution,
      networkType: m.networkType,
      referrer: m.browserName.includes('카카오톡') ? '카카오톡 공유 링크' : '네이버 검색 (모발부자)',
      userAgent: `${m.deviceModel} / ${m.osName} / ${m.browserName}`,
      durationSec,
      isDemo: true,
    };
  };

  const demoLogs = [
    // 김도현 (서울 강남구 역삼동)
    makeDemoLog(
      demoSubscribers[0],
      12 * min,
      'DIAGNOSIS_AGA',
      '남성형 탈모 AI 정밀 진단 완료',
      'AI 탈모 정밀 진단 (결과 리포트)',
      'Norwood Stage III · 한국형 BASP M2+V1형 (모발 건강점수 66점 · 양측 M자 후퇴 2.1cm, 정수리 연모화 18.4%)',
      185,
      {
        category: 'androgenetic',
        primaryGrade: 'Stage III (초·중기 M자)',
        secondaryGrade: 'BASP M2 / V1',
        healthScore: 66,
        metrics: { follicularDensityPerCm2: 114, templeRecessionCm: 2.1, vertexThinningPercent: 18.4 },
      }
    ),
    makeDemoLog(
      demoSubscribers[0],
      16 * min,
      'TAB_SWITCH',
      '카메라 4각도 촬영 및 스캔',
      '진단앱 > 4각도 AI 스캔',
      '전면·좌측·우측·정수리 4장 촬영 완료 및 MediaPipe 랜드마크 추출',
      95
    ),
    makeDemoLog(
      demoSubscribers[0],
      18 * min,
      'MEMBER_LOGIN',
      '자동로그인 세션 접속',
      '대시보드 홈',
      '김도현님 자동로그인 인증 성공 (서울특별시 강남구 역삼동)',
      25
    ),

    // 이서연 (경기 성남시 분당구 정자동)
    makeDemoLog(
      demoSubscribers[1],
      44 * min,
      'DIAGNOSIS_AGA',
      '여성형 탈모 AI 정밀 진단 완료',
      'AI 탈모 정밀 진단 (결과 리포트)',
      'Ludwig Stage I · Sinclair Stage 2 (모발 건강점수 76점 · 정수리 가르마 폭 2.6mm, 모낭 밀도 128개/cm²)',
      160,
      {
        category: 'androgenetic',
        primaryGrade: 'Ludwig Stage I (초기 가르마 확장)',
        secondaryGrade: 'Sinclair Stage 2',
        healthScore: 76,
        metrics: { follicularDensityPerCm2: 128, partingWidthMm: 2.6, vertexThinningPercent: 12.2 },
      }
    ),
    makeDemoLog(
      demoSubscribers[1],
      49 * min,
      'SASANG_CHECK',
      '사상체질 3D 체형·약선 분석',
      '사상체질·식이 탭',
      '소음인(少陰人) 판정 (체형 부합도 89% · 하초 안정형 · 맞춤 발모 약선: 흑임자·하수오·대추차 확인)',
      140,
      { constitution: '소음인', confidence: 89 }
    ),

    // 박준혁 (부산 해운대구 우동)
    makeDemoLog(
      demoSubscribers[2],
      125 * min,
      'MEDICATION_LOG',
      '오늘의 탈모약 복약 체크 완료',
      '복약 관리 탭',
      '피나스테리드 1mg 정시 복용 체크 완료 (이번 달 복약 순응도 94%)',
      75,
      { medName: '피나스테리드 1mg', adherenceRate: 94 }
    ),
    makeDemoLog(
      demoSubscribers[2],
      132 * min,
      'DIAGNOSIS_AGA',
      '남성형 탈모 AI 정밀 진단 완료',
      'AI 탈모 정밀 진단 (결과 리포트)',
      'Norwood Stage IV · 한국형 BASP M2+V2형 (모발 건강점수 58점 · 정수리 집중 케어 권장)',
      210,
      {
        category: 'androgenetic',
        primaryGrade: 'Stage IV (중기 복합형)',
        secondaryGrade: 'BASP M2 / V2',
        healthScore: 58,
        metrics: { follicularDensityPerCm2: 102, templeRecessionCm: 2.7, vertexThinningPercent: 26.5 },
      }
    ),

    // 최은지 (대구 수성구 범어동)
    makeDemoLog(
      demoSubscribers[3],
      252 * min,
      'DIAGNOSIS_AREATA',
      '원형탈모(SALT) 정밀 진단 완료',
      '원형탈모(SALT) 진단 탭',
      'SALT S1 (경증 · 5.4%) · 단발성 원형탈모 (상부 두피 최대 직경 Ø1.85cm, 면적 2.48cm² · 500원 동전 스케일 보정)',
      230,
      {
        category: 'areata',
        primaryGrade: 'S1 (경증 <25%)',
        secondaryGrade: '단발성 원형탈모',
        saltScore: 5.4,
        metrics: { maxDiameterCm: 1.85, totalAreaCm2: 2.48, totalPatchCount: 1 },
      }
    ),
    makeDemoLog(
      demoSubscribers[3],
      268 * min,
      'CLINIC_SEARCH',
      '내 주변 탈모 전문 병원 조회',
      '병원 찾기 탭',
      '원형탈모·여성탈모 클리닉 지도 검색 및 네이버 지도 연동 실행',
      88
    ),

    // 정성훈 (인천 연수구 송도동)
    makeDemoLog(
      demoSubscribers[4],
      350 * min,
      'SASANG_CHECK',
      '사상체질 3D 체형·약선 분석',
      '사상체질·식이 탭',
      '태음인(太陰人) 판정 (체형 부합도 92% · 중초 발달형 · 두피 열감·피지 완화 식이 가이드 열람)',
      165,
      { constitution: '태음인', confidence: 92 }
    ),
    makeDemoLog(
      demoSubscribers[4],
      362 * min,
      'TAB_SWITCH',
      '금기·약학백과 상호작용 열람',
      '금기·약학백과 탭',
      '두타스테리드(아보다트) 반감기 및 헌혈 금지 기간·간 대사 주의사항 열람',
      115
    ),

    // 강민수 (대전 유성구 봉명동)
    makeDemoLog(
      demoSubscribers[5],
      520 * min,
      'MEMBER_SIGNUP',
      '신규 회원가입 및 민감정보 동의',
      '회원 인증 게이트',
      '신규 회원가입 완료 (성명: 강민수, 연락처: 010-9043-5127, 자동로그인: ON)',
      60
    ),
    makeDemoLog(
      demoSubscribers[5],
      515 * min,
      'DIAGNOSIS_AGA',
      '남성형 탈모 AI 정밀 진단 완료',
      'AI 탈모 정밀 진단 (결과 리포트)',
      'Norwood Stage II · 한국형 BASP M1형 (모발 건강점수 79점 · 초기 골든타임 관리 단계)',
      175,
      {
        category: 'androgenetic',
        primaryGrade: 'Stage II (초기 M자 주의)',
        secondaryGrade: 'BASP M1',
        healthScore: 79,
        metrics: { follicularDensityPerCm2: 129, templeRecessionCm: 1.4, vertexThinningPercent: 9.8 },
      }
    ),
  ];

  const existingLogs = readLocalAuditLogs();
  const existingIds = new Set(existingLogs.map((l) => l.id));
  const merged = [...existingLogs, ...demoLogs.filter((d) => !existingIds.has(d.id))].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  writeLocalAuditLogs(merged);
}

/**
 * 관리자 대시보드 전체 데이터 통합 로드 (로컬 백필 + 데모 시드 + 백엔드 양방향 동기화 + 통계 집계)
 */
export async function getAdminAuditDashboardData({ includeDemo = true } = {}) {
  await backfillExistingLocalMembersAndHistory();
  ensureDemoSubscribersSeeded();

  let members = readLocalAdminMembers();
  let logs = readLocalAuditLogs();

  // 백엔드 서버와 양방향 동기화 시도
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('/api/admin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members, logs: logs.slice(0, 200) }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) {
        const srvMembers = json.data.members || [];
        const srvLogs = json.data.logs || [];

        // 로컬과 서버 병합
        const memMap = new Map();
        [...srvMembers, ...members].forEach((m) => {
          if (!m || !(m.id || m.email)) return;
          const key = m.id || `email_${String(m.email).toLowerCase()}`;
          const prev = memMap.get(key);
          if (!prev || (m.lastActiveAt || '') >= (prev.lastActiveAt || '')) {
            memMap.set(key, { ...(prev || {}), ...m });
          }
        });
        members = Array.from(memMap.values());
        writeLocalAdminMembers(members);

        const logMap = new Map();
        [...srvLogs, ...logs].forEach((l) => {
          if (l && l.id && !logMap.has(l.id)) {
            logMap.set(l.id, l);
          }
        });
        logs = Array.from(logMap.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        writeLocalAuditLogs(logs);
      }
    }
  } catch {
    // 오프라인/로컬 단독 모드 시 로컬 데이터 그대로 사용
  }

  // 데모 포함 여부 필터링
  const filteredMembers = includeDemo ? members : members.filter((m) => !m.isDemo);
  const filteredLogs = includeDemo ? logs : logs.filter((l) => !l.isDemo);

  // 각 가입자별 상세 사용 통계(총 접속 세션, 총 이벤트 수, 총 진단 횟수, 최근 행동, 사용 위치 목록) 계산
  const enrichedMembers = filteredMembers.map((m) => {
    const mLogs = filteredLogs.filter(
      (l) =>
        l.memberId === m.id ||
        (m.email && l.memberEmail && l.memberEmail.toLowerCase() === m.email.toLowerCase())
    );
    const uniqueSessions = new Set(mLogs.map((l) => l.sessionId).filter(Boolean)).size || 1;
    const diagnosisLogs = mLogs.filter(
      (l) => l.eventType === 'DIAGNOSIS_AGA' || l.eventType === 'DIAGNOSIS_AREATA'
    );
    const uniqueLocations = Array.from(
      new Set(mLogs.map((l) => l.locationLabel).filter(Boolean))
    );
    const uniqueDevices = Array.from(
      new Set(
        mLogs
          .map((l) => `${l.deviceModel || l.deviceType} (${l.browserName || l.osName})`)
          .filter(Boolean)
      )
    );
    const totalDurationSec = mLogs.reduce((acc, cur) => acc + (Number(cur.durationSec) || 0), 0);
    const latestLog = mLogs[0] || null;

    return {
      ...m,
      totalSessions: uniqueSessions,
      totalEvents: mLogs.length,
      totalDiagnoses: diagnosisLogs.length,
      totalDurationSec,
      latestAction: latestLog ? `${latestLog.appSection} — ${latestLog.eventLabel}` : '회원가입 완료',
      latestDiagnosis: diagnosisLogs[0]?.actionDetail || null,
      lastActiveAt: latestLog?.timestamp || m.lastActiveAt || m.lastLoginAt || m.createdAt,
      lastLocationLabel: latestLog?.locationLabel || m.lastLocationLabel || '대한민국 서울특별시',
      lastIp: latestLog?.ipAddress || m.lastIp || '-',
      lastIsp: latestLog?.isp || m.lastIsp || '-',
      lastLat: latestLog?.latitude ?? m.lastLat ?? 37.4979,
      lastLng: latestLog?.longitude ?? m.lastLng ?? 127.0276,
      lastDeviceSummary:
        m.lastDeviceSummary ||
        (latestLog ? `${latestLog.deviceModel} · ${latestLog.osName} · ${latestLog.browserName}` : '모바일/PC'),
      uniqueLocations,
      uniqueDevices,
      memberLogs: mLogs,
    };
  });

  // 지역별(시·도 및 구·군) 집계
  const regionMap = {};
  filteredLogs.forEach((l) => {
    const loc = l.locationLabel || l.region || '기타 지역';
    if (!regionMap[loc]) {
      regionMap[loc] = {
        locationLabel: loc,
        region: l.region || '대한민국',
        city: l.city || '',
        count: 0,
        uniqueMembers: new Set(),
        latitude: l.latitude || 37.4979,
        longitude: l.longitude || 127.0276,
        latestTimestamp: l.timestamp,
      };
    }
    regionMap[loc].count += 1;
    regionMap[loc].uniqueMembers.add(l.memberId || l.sessionId);
  });

  const regionBreakdown = Object.values(regionMap)
    .map((r) => ({
      ...r,
      memberCount: r.uniqueMembers.size,
      uniqueMembers: undefined,
    }))
    .sort((a, b) => b.count - a.count);

  // 메뉴/기능별 사용 빈도 집계
  const sectionMap = {};
  filteredLogs.forEach((l) => {
    const key = l.appSection || l.eventLabel || '기타';
    sectionMap[key] = (sectionMap[key] || 0) + 1;
  });
  const sectionBreakdown = Object.entries(sectionMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 시간대별(00시~23시 KST) 이용 분포
  const hourlyCounts = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}시`,
    count: 0,
  }));
  filteredLogs.forEach((l) => {
    try {
      const d = new Date(l.timestamp);
      const kstHour = Number(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Seoul',
          hour: 'numeric',
          hour12: false,
        }).format(d)
      ) % 24;
      if (hourlyCounts[kstHour]) hourlyCounts[kstHour].count += 1;
    } catch {
      // ignore
    }
  });

  // 오늘(KST 기준) 활성 가입자 수
  const todayKstPrefix = formatKstDateTime(new Date()).slice(0, 10);
  const todayLogs = filteredLogs.filter((l) => (l.kstTimeStr || '').startsWith(todayKstPrefix));
  const todayActiveUsers = new Set(todayLogs.map((l) => l.memberId || l.sessionId)).size;
  const totalDiagnosesCount = filteredLogs.filter(
    (l) => l.eventType === 'DIAGNOSIS_AGA' || l.eventType === 'DIAGNOSIS_AREATA'
  ).length;

  return {
    members: enrichedMembers,
    logs: filteredLogs,
    regionBreakdown,
    sectionBreakdown,
    hourlyCounts,
    kpis: {
      totalSubscribers: enrichedMembers.length,
      realSubscribers: members.filter((m) => !m.isDemo).length,
      demoSubscribers: members.filter((m) => m.isDemo).length,
      todayActiveUsers,
      totalEvents: filteredLogs.length,
      totalDiagnosesCount,
      activeRegionsCount: regionBreakdown.length,
    },
  };
}

/**
 * 시뮬레이션(데모) 데이터만 깔끔하게 제거하거나 다시 복원
 */
export async function setDemoDataVisibility(enableDemo) {
  if (!enableDemo) {
    localStorage.setItem(ADMIN_DEMO_DISMISSED_KEY, '1');
    const cleanMembers = readLocalAdminMembers().filter((m) => !m.isDemo);
    const cleanLogs = readLocalAuditLogs().filter((l) => !l.isDemo);
    writeLocalAdminMembers(cleanMembers);
    writeLocalAuditLogs(cleanLogs);
    try {
      await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_demo' }),
      });
    } catch {
      // ignore
    }
  } else {
    localStorage.removeItem(ADMIN_DEMO_DISMISSED_KEY);
    ensureDemoSubscribersSeeded();
  }
}

/**
 * 특정 감사 로그 삭제
 */
export async function deleteAdminAuditLog(logId) {
  const next = readLocalAuditLogs().filter((l) => l.id !== logId);
  writeLocalAuditLogs(next);
  try {
    await fetch('/api/admin/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_log', targetId: logId }),
    });
  } catch {
    // ignore
  }
}

// ── 비공개 관리자 인증(PIN / 마스터 비밀번호) 관리 ──
export function verifyAdminPin(inputPin) {
  const cleaned = String(inputPin || '').trim();
  if (!cleaned) return false;
  try {
    const customPin = localStorage.getItem(ADMIN_CUSTOM_PIN_KEY);
    if (customPin && cleaned === customPin) return true;
  } catch {
    // ignore
  }
  return DEFAULT_VALID_PINS.includes(cleaned);
}

export function setAdminUnlockedSession(unlocked = true, persistDevice = false) {
  try {
    if (unlocked) {
      sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, '1');
      if (persistDevice) {
        localStorage.setItem(ADMIN_AUTH_SESSION_KEY, '1');
      }
    } else {
      sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
      localStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

export function isAdminSessionUnlocked() {
  try {
    return (
      sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) === '1' ||
      localStorage.getItem(ADMIN_AUTH_SESSION_KEY) === '1'
    );
  } catch {
    return false;
  }
}

export function updateAdminCustomPin(newPin) {
  const cleaned = String(newPin || '').trim();
  if (cleaned.length < 4) {
    throw new Error('관리자 비밀번호(PIN)는 4자 이상 입력해 주세요.');
  }
  localStorage.setItem(ADMIN_CUSTOM_PIN_KEY, cleaned);
  return true;
}
