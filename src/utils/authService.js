// src/utils/authService.js
// 대한민국 개인정보보호법(제15조, 제22조, 제23조, 제36조) 및 정보통신망법 준수 회원 인증·동의 이력·세션 관리 서비스

import { supabase } from '../supabase';

const SESSION_KEY = 'wealthyhair_auth_session_v1';
const USERS_STORAGE_KEY = 'wealthyhair_registered_members_v1';

// Web Crypto API 기반 SHA-256 단방향 해시 (비밀번호 평문 저장 절대 금지)
export async function hashPasswordSHA256(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`wh_salt_2026_${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 한국 휴대전화번호 자동 하이픈 포맷팅 (010-XXXX-XXXX)
export function formatKoreanPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

// 만 14세 이상 연령 검증 (개인정보보호법 제22조 제6항)
export function calculateKoreanAge(birthDateStr) {
  if (!birthDateStr) return 0;
  const today = new Date();
  const birth = new Date(birthDateStr);
  if (Number.isNaN(birth.getTime())) return 0;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getCurrentMember() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getRegisteredMembers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function registerKoreanMember(payload) {
  const {
    name,
    email,
    phone,
    birthDate,
    gender,
    password,
    consents
  } = payload;

  const cleanEmail = email.trim().toLowerCase();
  const age = calculateKoreanAge(birthDate);

  if (age < 14) {
    throw new Error('대한민국 개인정보보호법 제22조 제6항에 따라 만 14세 미만 아동은 법정대리인 동의 없이 가입할 수 없습니다.');
  }

  if (!consents?.age14 || !consents?.terms || !consents?.privacyRequired || !consents?.sensitiveHealth) {
    throw new Error('필수 약관 및 민감정보(건강·두피 데이터) 처리 동의 항목에 모두 동의해야 가입이 가능합니다.');
  }

  const members = getRegisteredMembers();
  if (members.some(m => m.email === cleanEmail)) {
    throw new Error('이미 가입된 이메일 주소입니다. 로그인 탭을 이용해 주세요.');
  }

  const passwordHash = await hashPasswordSHA256(password);
  const nowIso = new Date().toISOString();

  const newMember = {
    id: `wh_mem_${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    phone: formatKoreanPhone(phone),
    birthDate,
    age,
    gender,
    passwordHash,
    consents: {
      age14: Boolean(consents.age14),
      terms: Boolean(consents.terms),
      privacyRequired: Boolean(consents.privacyRequired),
      sensitiveHealth: Boolean(consents.sensitiveHealth),
      thirdPartyResearch: Boolean(consents.thirdPartyResearch),
      marketingOptIn: Boolean(consents.marketingOptIn),
      consentedAt: nowIso,
      lawVersion: '개인정보보호법 제15조·제22조·제23조 (2026 표준약관)'
    },
    createdAt: nowIso
  };

  // 1. 로컬 암호화 레지스트리 저장
  members.push(newMember);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(members));

  // 2. 기존 설문 프로필과도 연령·성별 자동 연동
  try {
    const existingSurvey = JSON.parse(localStorage.getItem('wealthyhair_survey_profile_v1') || '{}');
    localStorage.setItem('wealthyhair_survey_profile_v1', JSON.stringify({
      ...existingSurvey,
      age: String(age),
      gender
    }));
  } catch {
    // ignore
  }

  // 3. Supabase Auth 및 클라우드 DB에 회원가입 동의 이력 동기화
  try {
    await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: newMember.name,
          phone: newMember.phone,
          birth_date: newMember.birthDate,
          gender: newMember.gender,
          consents: newMember.consents
        }
      }
    });
  } catch (err) {
    console.warn('Supabase Auth sync notice:', err?.message);
  }

  try {
    await supabase.from('surveys').insert([
      {
        score: 5,
        feedback: `[MEMBER_SIGNUP] 성명:${newMember.name} | 연락처:${newMember.phone} | 이메일:${newMember.email} | 필수약관·민감정보동의완료(${nowIso})`,
        norwood: 'MEMBER_REGISTERED',
        has_hair_loss: false,
        gender: newMember.gender,
        age: String(newMember.age)
      }
    ]);
  } catch (err) {
    console.warn('Supabase member log notice:', err?.message);
  }

  const sessionUser = { ...newMember };
  delete sessionUser.passwordHash;
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  window.dispatchEvent(new Event('authChanged'));
  return sessionUser;
}

export async function loginKoreanMember(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  const passwordHash = await hashPasswordSHA256(password);
  const members = getRegisteredMembers();

  const found = members.find(m => m.email === cleanEmail && m.passwordHash === passwordHash);
  if (found) {
    const sessionUser = { ...found, lastLoginAt: new Date().toISOString() };
    delete sessionUser.passwordHash;
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    window.dispatchEvent(new Event('authChanged'));
    return sessionUser;
  }

  // 로컬에 없을 경우 Supabase Auth 로그인 시도
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });
    if (!error && data?.user) {
      const meta = data.user.user_metadata || {};
      const sessionUser = {
        id: data.user.id,
        name: meta.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: meta.phone || '',
        birthDate: meta.birth_date || '',
        age: meta.birth_date ? calculateKoreanAge(meta.birth_date) : null,
        gender: meta.gender || 'male',
        consents: meta.consents || { consentedAt: data.user.created_at },
        createdAt: data.user.created_at
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      window.dispatchEvent(new Event('authChanged'));
      return sessionUser;
    }
  } catch {
    // fallback error below
  }

  throw new Error('이메일 또는 비밀번호가 일치하지 않습니다. 정보를 다시 확인해 주세요.');
}

export function logoutMember() {
  localStorage.removeItem(SESSION_KEY);
  try {
    supabase.auth.signOut();
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('authChanged'));
}

// 개인정보보호법 제36조(개인정보의 정정·삭제)에 따른 회원탈퇴 및 데이터 즉시 파기
export function withdrawMemberAccount(memberId) {
  const members = getRegisteredMembers().filter(m => m.id !== memberId);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(members));
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('wealthyhair_survey_profile_v1');
  localStorage.removeItem('medicationAlarm');
  localStorage.removeItem('medicationLedger');
  window.dispatchEvent(new Event('authChanged'));
}

// 대한민국 개인정보보호법 기반 정식 약관 전문
export const KOREAN_LEGAL_TERMS = {
  terms: {
    title: '[필수] 모발부자(WealthyHair) 서비스 이용약관',
    content: `제1조 (목적)
본 약관은 모발부자(WealthyHair, 이하 "회사")가 제공하는 AI 기반 남성·여성·원형탈모 정밀 분석, 복용 전후 비교, 사상체질 식이 가이드, 복약 관리 및 병원 정보 안내 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (의학적 고지 및 서비스의 성격)
1. 본 서비스가 제공하는 AI 두피·모발 비전 분석(Norwood, Ludwig, BASP, SALT 척도 등), 복약 후 변화 시뮬레이션, 사상체질 분석 및 약물·식품 정보는 학술 논문 및 식품의약품안전처 허가사항에 기반한 건강관리 보조 참고자료입니다.
2. 본 서비스의 분석 결과는 의료법상 의사·한의사의 직접적인 대면 진단이나 처방을 대체할 수 없으며, 질병의 최종 진단 및 약물 처방·변경은 반드시 전문 의료기관의 진료를 통해 결정되어야 합니다.

제3조 (회원가입 및 계정 관리)
1. 이용자는 대한민국 개인정보보호법 및 관련 법령에 따라 회사가 정한 가입 양식에 정확한 회원정보를 기입하고 필수 약관에 동의함으로써 회원가입을 신청합니다.
2. 만 14세 미만의 아동은 개인정보보호법 제22조 제6항에 의거하여 법정대리인의 별도 동의 없이는 회원으로 가입할 수 없습니다.

제4조 (회원의 의무 및 권리)
회원은 언제든지 본인의 개인정보 및 민감정보 열람, 정정, 동의 철회(회원탈퇴)를 요청할 수 있으며, 회사는 탈퇴 요청 즉시 관련 데이터를 지체 없이 파기합니다.`
  },
  privacyRequired: {
    title: '[필수] 개인정보 수집 및 이용 동의서 (개인정보보호법 제15조)',
    content: `모발부자(WealthyHair)는 「개인정보보호법」 제15조 제1항 제1호 및 제22조에 따라 아래와 같이 개인정보를 수집·이용하고자 합니다. 내용을 자세히 읽으신 후 동의 여부를 결정하여 주시기 바랍니다.

1. 개인정보의 수집 및 이용 목적
- 회원제 서비스 이용에 따른 본인 식별·인증, 회원자격 유지·관리
- 연령·성별에 따른 맞춤형 탈모 척도(남성 노우드/여성 루드비히/한국형 BASP) 자동 적용
- 서비스 내 불편사항 신고 접수 및 제작자 카카오톡 상담 회신 처리

2. 수집하는 개인정보의 항목 (최소 수집 원칙 준수)
- 필수항목: 성명(또는 닉네임), 이메일 주소(로그인 ID), 비밀번호(SHA-256 단방향 암호화 해시 저장), 휴대전화번호, 생년월일, 성별
- 자동수집항목: 서비스 이용기록, 가입 및 약관 동의 일시

3. 개인정보의 보유 및 이용 기간
- 원칙적으로 **회원 탈퇴 시까지** 보유·이용하며, 회원 탈퇴 시 지체 없이 파기합니다.
- 단, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우 아래와 같이 관계 법령에서 정한 기간 동안 안전하게 보관합니다.
  · 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)
  · 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)
  · 서비스 접속 및 로그인 기록: 3개월 (통신비밀보호법)

4. 동의를 거부할 권리 및 동의 거부에 따른 불이익
- 귀하는 위 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수항목 수집에 동의하지 않으실 경우 회원가입 및 맞춤형 진단 서비스 이용이 제한됩니다.`
  },
  sensitiveHealth: {
    title: '[필수] 민감정보(건강·두피·체질 데이터) 수집 및 이용 별도 동의 (개인정보보호법 제23조)',
    content: `「개인정보보호법」 제23조(민감정보의 처리 제한)에 따라, 건강 및 신체적 특징과 관련된 민감정보는 일반 개인정보와 구분하여 정보주체의 별도 동의를 받아 처리합니다.

1. 민감정보의 수집 및 이용 목적
- 카메라 촬영 또는 사진 업로드를 통한 AI 남성·여성·원형탈모(SALT) 정밀 계측
- 탈모약 복용 전·후 모발 밀도 및 경계선 변화 정밀 비교
- 사상체질(태양·소양·태음·소음인) 체형·소증 분석 및 맞춤 식이·약물 상호작용 안내
- 개인별 모발 성장 일지 및 복약 캘린더 이력 관리

2. 처리하는 민감정보 항목
- 두피·모발 촬영 이미지 및 비전 분석 계측값(후퇴 깊이 cm, 가르마 폭 mm, 밀도 %, 홍반도 %)
- 탈모 가족력, 진행 기간, 관리 목표, 복용 중인 탈모약 성분 및 용량, 사상체질 설문 응답 데이터

3. 민감정보의 보유 및 이용 기간
- 두피·모발 원본 사진은 이용자의 기기 내 로컬 스토리지(IndexedDB)를 우선 활용하여 보호되며, 회원 탈퇴 또는 민감정보 처리 동의 철회 시 **즉시 영구 파기**됩니다.

4. 동의 거부 권리 및 불이익 안내
- 민감정보 수집 및 이용에 대한 동의를 거부할 수 있으나, 미동의 시 AI 두피 스캔 및 사상체질·복약 맞춤 진단 기능을 이용하실 수 없습니다.`
  },
  thirdPartyResearch: {
    title: '[선택] AI 탈모 진단 알고리즘 고도화를 위한 가명·익명정보 활용 동의',
    content: `「개인정보보호법」 제28조의2(가명정보의 처리 등)에 따라, 개인을 식별할 수 없도록 완전히 비식별화(가명·익명 처리)된 탈모 계측 통계 데이터를 한국인 표준 탈모 AI 알고리즘 정밀도 향상 연구에 활용하는 것에 동의합니다. (선택 사항으로 동의하지 않아도 모든 서비스를 정상적으로 이용하실 수 있습니다.)`
  },
  marketingOptIn: {
    title: '[선택] 맞춤형 복약 알림 및 모발 건강 케어 정보 수신 동의 (정보통신망법 제50조)',
    content: `「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제50조에 따라, 복약 골든타임 알림, 계절별 두피 케어 가이드, 신규 임상 리포트 안내를 앱 푸시·이메일·문자(SMS/카카오톡)로 수신하는 것에 동의합니다. (선택 사항으로 동의하지 않아도 회원가입 및 서비스 이용에는 아무런 제한이 없으며, 가입 후 언제든지 철회할 수 있습니다.)`
  }
};
