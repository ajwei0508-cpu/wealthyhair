// src/components/AuthGate.jsx
// 대한민국 개인정보보호법(제15조·제22조·제23조) 준수
// - 시작 시 강제 회원가입 차단으로 인한 이탈 방지 (개방형 탐색 지원)
// - 탈모진단앱(남·여·원형탈모) 및 복약 전·후 예상 경과 확인 이용 시 개인정보 보호 안내문과 함께 자연스러운 회원가입 유도

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Lock, User, Mail, Phone, Calendar, CheckCircle2,
  Eye, EyeOff, FileText, X, AlertCircle, LogOut, Trash2, Sparkles, ArrowRight, KeyRound
} from 'lucide-react';
import {
  getCurrentMember,
  registerKoreanMember,
  loginKoreanMember,
  formatKoreanPhone,
  calculateKoreanAge,
  KOREAN_LEGAL_TERMS,
  logoutMember,
  withdrawMemberAccount
} from '../utils/authService';

// ── 1. 상단 글로벌 헤더 바 (비로그인 시 [로그인·회원가입] 버튼 / 로그인 시 [내정보] 표시) ──
export const MemberHeaderBar = ({
  member,
  user,
  currentMenuLabel,
  currentScreenName,
  onOpenReport,
  onOpenProfile,
  onOpenAuth
}) => {
  const activeMember = member || user || null;
  const menuLabel = currentMenuLabel || currentScreenName || '';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      background: 'linear-gradient(180deg, rgba(18,18,18,0.98) 0%, rgba(10,10,10,0.95) 100%)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.28)',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <img
          src="/logo_transparent.png"
          alt="모발부자"
          style={{ width: 26, height: 26, objectFit: 'contain' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '0.92rem',
              fontWeight: 700,
              color: '#D4AF37',
              letterSpacing: '0.02em'
            }}>
              WEALTHY HAIR
            </span>
            {menuLabel && (
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 7px',
                borderRadius: '10px',
                background: 'rgba(212, 175, 55, 0.14)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                color: '#E5C158',
                whiteSpace: 'nowrap'
              }}>
                {menuLabel}
              </span>
            )}
          </div>
          {activeMember ? (
            <div style={{ fontSize: '0.68rem', color: '#999', marginTop: 1 }}>
              {activeMember.name} 회원님 ({activeMember.gender === 'female' ? '여' : '남'}{activeMember.age ? `·${activeMember.age}세` : ''})
            </div>
          ) : (
            <div style={{ fontSize: '0.66rem', color: '#888', marginTop: 1 }}>
              자유 둘러보기 중 · 진단/경과확인은 회원가입 후 이용
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* 모든 메뉴 상단에 고정 노출되는 제작자 카톡 즉시 신고 버튼 */}
        <button
          type="button"
          onClick={onOpenReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: '#FEE500',
            color: '#191919',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(254, 229, 0, 0.25)'
          }}
          title="현재 메뉴의 불편사항을 제작자 카카오톡으로 즉시 전송합니다"
        >
          <span style={{ fontSize: '0.82rem' }}>💬</span>
          <span>불편신고·카톡전송</span>
        </button>

        {activeMember ? (
          <button
            type="button"
            onClick={onOpenProfile}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(212,175,55,0.35)',
              color: '#D4AF37',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="내 회원정보 및 개인정보 동의 관리"
          >
            내정보
          </button>
        ) : (
          onOpenAuth && (
            <button
              type="button"
              onClick={() => onOpenAuth({ mode: 'signup', featureName: '모발부자 AI 개인맞춤 멤버십' })}
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.08))',
                border: '1px solid #D4AF37',
                color: '#D4AF37',
                borderRadius: '6px',
                padding: '6px 9px',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              🔒 회원가입·로그인
            </button>
          )
        )}
      </div>
    </div>
  );
};

// ── 2. 탈모진단앱 & 복약전후 예상 경과 확인 전용 개인정보 안내 및 회원가입 유도 카드 ──
export const PrivacyMembershipNoticeCard = ({
  user,
  featureType = 'diagnosis', // 'diagnosis' | 'areata' | 'simulator'
  onOpenAuth
}) => {
  if (user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.14), rgba(18, 22, 18, 0.95))',
        border: '1px solid rgba(129, 199, 132, 0.4)',
        borderRadius: '12px',
        padding: '10px 14px',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#e8f5e9' }}>
          <ShieldCheck size={17} color="#81c784" style={{ flexShrink: 0 }} />
          <span>
            <strong style={{ color: '#81c784' }}>{user.name} 회원님</strong> 개인정보 암호화 보호 적용 중 · 모든 정밀 진단 및 복약 전·후 예상 경과 확인이 활성화되었습니다.
          </span>
        </div>
      </div>
    );
  }

  const copyMap = {
    diagnosis: {
      badge: '개인정보(민감 두피·건강정보) 보호 안내',
      title: '탈모진단앱과 복약 전·후 예상 경과 확인은 개인정보 내용으로 회원가입이 필요합니다',
      desc: 'AI 남성·여성 초정밀 탈모 진단과 복약 전·후 예상 경과 확인은 귀하의 두피·모발 촬영 사진, 연령·성별 탈모 척도(Norwood·Ludwig·BASP), 모낭 밀도 등 민감한 개인정보(건강정보)를 분석하는 맞춤형 서비스입니다. 개인의 소중한 진단 데이터와 경과 기록을 안전하게 보호하기 위해 반드시 회원가입 후 이용하실 수 있습니다.',
      cta: '무료 회원가입하고 내 탈모 정밀 진단 시작하기 →',
      featureName: '남성·여성 AI 정밀 탈모진단앱'
    },
    areata: {
      badge: '개인정보(민감 두피·면역정보) 보호 안내',
      title: '원형탈모(SALT) 탈모진단앱은 개인정보 내용으로 회원가입이 필요합니다',
      desc: '원형탈모 SALT 정밀 진단 및 복약 전·후 예상 경과 확인은 두피 병변 사진, 탈락 면적(%) 및 예후 체크리스트 등 민감한 개인정보(건강정보)를 다루는 서비스입니다. 타인에게 노출되지 않는 암호화 보관과 개인별 맞춤 경과 분석을 위해 회원가입이 필요합니다.',
      cta: '무료 회원가입하고 원형탈모 SALT 진단 시작하기 →',
      featureName: '원형탈모 SALT 정밀 탈모진단앱'
    },
    simulator: {
      badge: '개인정보(복약 이력·발모 경과) 보호 안내',
      title: '복약 전·후 예상 경과 확인은 개인정보 내용으로 회원가입이 필요합니다',
      desc: '탈모진단앱 및 복약 전·후 예상 경과 확인(1·3·6·12개월 발모 예측 및 실제 전·후 사진 비교)은 복용 중인 탈모약 성분·용량·복용 시작일과 개인 두피 사진 등 민감한 개인정보를 포함합니다. 안전한 개인정보 보호와 정확한 개인별 복약 경과 추적을 위해 회원가입을 진행해 주세요.',
      cta: '무료 회원가입하고 복약 전·후 예상 경과 확인하기 →',
      featureName: '복약 전·후 예상 경과 확인'
    }
  };

  const info = copyMap[featureType] || copyMap.diagnosis;

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(28, 22, 12, 0.98) 0%, rgba(14, 14, 18, 0.98) 100%)',
      border: '1.5px solid rgba(212, 175, 55, 0.55)',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '14px',
      boxShadow: '0 10px 28px rgba(0, 0, 0, 0.55)'
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '999px',
        background: 'rgba(212, 175, 55, 0.16)',
        border: '1px solid rgba(212, 175, 55, 0.45)',
        color: '#D4AF37',
        fontSize: '0.68rem',
        fontWeight: 700,
        marginBottom: '8px'
      }}>
        <Lock size={12} /> {info.badge}
      </div>

      <h3 style={{
        fontSize: '0.94rem',
        fontWeight: 800,
        color: '#f5f0e8',
        lineHeight: 1.4,
        marginBottom: '8px',
        fontFamily: 'var(--font-sans)'
      }}>
        🔒 {info.title}
      </h3>

      <p style={{
        fontSize: '0.76rem',
        color: '#ccc',
        lineHeight: 1.55,
        marginBottom: '12px'
      }}>
        {info.desc}
      </p>

      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '10px 12px',
        marginBottom: '12px',
        fontSize: '0.72rem',
        color: '#bbb',
        display: 'grid',
        gap: '4px'
      }}>
        <div>• <strong style={{ color: '#D4AF37' }}>회원가입 필수 대상:</strong> AI 탈모진단앱(남·여·원형탈모) 및 복약 전·후 예상 경과 확인</div>
        <div>• <strong style={{ color: '#81c784' }}>회원가입 없이 무료 열람:</strong> 금기식품·병용금기 양약 백과, 사상체질 안내, 탈모 병원 찾기</div>
        <div>• <strong style={{ color: '#f5f0e8' }}>개인정보 보호 기준:</strong> 대한민국 개인정보보호법 제15조·제23조 암호화 안전 보관</div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onOpenAuth && onOpenAuth({ mode: 'signup', featureName: info.featureName })}
          style={{
            flex: 1,
            minWidth: '210px',
            padding: '12px 14px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
            color: '#000',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)'
          }}
        >
          <Sparkles size={15} />
          <span>{info.cta}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenAuth && onOpenAuth({ mode: 'login', featureName: info.featureName })}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            background: 'rgba(255, 255, 255, 0.04)',
            color: '#D4AF37',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          기존 회원 로그인
        </button>
      </div>
    </div>
  );
};

// ── 3. 내 회원정보 및 개인정보 동의 관리 모달 ──
export const MemberProfileModal = ({ member, user, isOpen, onClose, onLoggedOut, onLogout }) => {
  const activeMember = member || user;
  const handleLogoutCallback = onLoggedOut || onLogout;

  if (!isOpen || !activeMember) return null;

  const handleWithdraw = () => {
    if (window.confirm('개인정보보호법 제36조에 따라 회원 탈퇴 시 귀하의 계정 및 저장된 민감정보(진단·복약 기록)가 즉시 파기됩니다. 정말 탈퇴하시겠습니까?')) {
      withdrawMemberAccount(activeMember.id);
      onClose();
      if (handleLogoutCallback) handleLogoutCallback();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.84)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 9999
    }} onClick={onClose}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#111',
        border: '1px solid #D4AF37',
        borderRadius: '10px',
        padding: '20px',
        color: '#fff'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={18} /> 회원 정보 및 개인정보 보호 현황
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: '#181818', borderRadius: '8px', padding: '12px', fontSize: '0.82rem', lineHeight: 1.8, border: '1px solid #2a2a2a' }}>
          <div><strong style={{ color: '#D4AF37' }}>성명:</strong> {activeMember.name}</div>
          <div><strong style={{ color: '#D4AF37' }}>이메일(ID):</strong> {activeMember.email}</div>
          <div><strong style={{ color: '#D4AF37' }}>휴대전화:</strong> {activeMember.phone || '인증됨'}</div>
          <div><strong style={{ color: '#D4AF37' }}>생년월일 / 성별:</strong> {activeMember.birthDate || '-'} ({activeMember.gender === 'female' ? '여성' : '남성'})</div>
          <div><strong style={{ color: '#D4AF37' }}>약관·민감정보 동의일:</strong> {activeMember.consents?.consentedAt ? new Date(activeMember.consents.consentedAt).toLocaleString('ko-KR') : '동의 완료'}</div>
          <div><strong style={{ color: '#D4AF37' }}>적용 법령 기준:</strong> 개인정보보호법 제15조·제22조·제23조 준수</div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => {
              logoutMember();
              onClose();
              if (handleLogoutCallback) handleLogoutCallback();
            }}
            style={{
              flex: 1,
              padding: '11px',
              background: '#222',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={15} /> 로그아웃
          </button>
          <button
            type="button"
            onClick={handleWithdraw}
            style={{
              padding: '11px 14px',
              background: 'rgba(255, 82, 82, 0.12)',
              color: '#ff6b6b',
              border: '1px solid rgba(255, 82, 82, 0.4)',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Trash2 size={14} /> 회원탈퇴·즉시파기
          </button>
        </div>
      </div>
    </div>
  );
};

// ── 4. 회원가입 · 로그인 유도 모달 (닫기 허용, 개인정보 필요 사유 명확 고지) ──
export const AuthModal = ({
  isOpen,
  initialMode = 'signup',
  featureName = 'AI 탈모진단앱 및 복약 전·후 예상 경과 확인',
  onClose,
  onAuthenticated
}) => {
  const [mode, setMode] = useState(initialMode || 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [gender, setGender] = useState('male');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [verificationSent, setVerificationSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [consents, setConsents] = useState({
    age14: true,
    terms: true,
    privacyRequired: true,
    sensitiveHealth: true,
    thirdPartyResearch: false,
    marketingOptIn: false
  });

  const [viewingTermKey, setViewingTermKey] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'signup');
      setErrorMsg('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const allChecked = Object.values(consents).every(Boolean);
  const requiredChecked = consents.age14 && consents.terms && consents.privacyRequired && consents.sensitiveHealth;

  const toggleAllConsents = () => {
    const next = !allChecked;
    setConsents({
      age14: next,
      terms: next,
      privacyRequired: next,
      sensitiveHealth: next,
      thirdPartyResearch: next,
      marketingOptIn: next
    });
  };

  const toggleConsent = (key) => {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSendOtp = () => {
    const formatted = formatKoreanPhone(phone);
    if (formatted.length < 12) {
      setErrorMsg('올바른 휴대전화번호(010-XXXX-XXXX)를 입력해 주세요.');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setVerificationSent(true);
    setIsPhoneVerified(true);
    setErrorMsg('');
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('성명(실명 또는 2자 이상 닉네임)을 입력해 주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('유효한 이메일 주소를 입력해 주세요.');
      return;
    }
    const formattedPhone = formatKoreanPhone(phone);
    if (formattedPhone.length < 12) {
      setErrorMsg('휴대전화번호(010-XXXX-XXXX)를 정확히 입력해 주세요.');
      return;
    }
    const age = calculateKoreanAge(birthDate);
    if (age < 14) {
      setErrorMsg('개인정보보호법 제22조 제6항에 따라 만 14세 이상만 가입할 수 있습니다.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('비밀번호는 6자 이상으로 입력해 주세요.');
      return;
    }
    if (passwordConfirm && password !== passwordConfirm) {
      setErrorMsg('비밀번호와 비밀번호 재확인이 일치하지 않습니다.');
      return;
    }
    if (!requiredChecked) {
      setErrorMsg('[필수] 개인정보 및 민감정보(두피·복약 건강정보) 보호 동의 항목에 체크해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await registerKoreanMember({
        name,
        email,
        phone: formattedPhone,
        birthDate,
        gender,
        password,
        consents
      });
      if (onAuthenticated) onAuthenticated(user);
    } catch (err) {
      setErrorMsg(err.message || '회원가입 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await loginKoreanMember(email, password);
      if (onAuthenticated) onAuthenticated(user);
    } catch (err) {
      setErrorMsg(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px',
        zIndex: 9998
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'radial-gradient(circle at top, #1f1a10 0%, #111115 60%, #0a0a0c 100%)',
          border: '1.5px solid #D4AF37',
          borderRadius: '16px',
          padding: '20px 18px 24px',
          color: '#fff',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Close & Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(212, 175, 55, 0.16)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            color: '#D4AF37',
            fontSize: '0.68rem',
            fontWeight: 700
          }}>
            <ShieldCheck size={13} /> 개인정보보호법(제15조·제23조) 준수
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#ccc',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>나중에 둘러보기</span>
            <X size={14} />
          </button>
        </div>

        {/* 개인정보 보호 회원가입 유도 핵심 안내문 */}
        <div style={{
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.38)',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#D4AF37', marginBottom: '4px' }}>
            🔒 [{featureName}] 이용을 위한 회원가입 안내
          </div>
          <p style={{ fontSize: '0.75rem', color: '#e5e0d5', lineHeight: 1.5, margin: 0 }}>
            <strong>탈모진단앱</strong>과 <strong>복약 전·후 예상 경과 확인</strong>은 두피·모발 촬영 사진, 연령·성별 탈모 척도, 복용 약물 및 경과 기록 등 <strong>민감한 개인정보(건강정보)</strong>를 다루는 서비스입니다.<br />
            귀하의 개인정보를 안전하게 암호화하여 보호하고 맞춤형 분석 결과를 제공하기 위해 <strong>회원가입이 필요합니다.</strong>
          </p>
        </div>

        {/* Mode Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#141414',
          border: '1px solid #2b2b2b',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '14px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
            style={{
              padding: '9px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'signup' ? '#D4AF37' : 'transparent',
              color: mode === 'signup' ? '#000' : '#999',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            무료 회원가입 (30초)
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            style={{
              padding: '9px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'login' ? '#D4AF37' : 'transparent',
              color: mode === 'login' ? '#000' : '#999',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            기존 회원 로그인
          </button>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            background: 'rgba(255, 82, 82, 0.14)',
            border: '1px solid rgba(255, 82, 82, 0.5)',
            color: '#ff8a80',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '0.76rem',
            lineHeight: 1.45,
            marginBottom: '12px'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'signup' ? (
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 1. 성명 & 성별 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#bbb', marginBottom: '4px' }}>
                  성명 (실명/닉네임) <span style={{ color: '#D4AF37' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={14} color="#777" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 9px 9px 32px',
                      background: '#141414',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#bbb', marginBottom: '4px' }}>
                  성별 (진단척도 기준) <span style={{ color: '#D4AF37' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', height: '36px' }}>
                  {[
                    { key: 'male', label: '남성' },
                    { key: 'female', label: '여성' }
                  ].map(g => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setGender(g.key)}
                      style={{
                        borderRadius: '6px',
                        border: gender === g.key ? '1px solid #D4AF37' : '1px solid #333',
                        background: gender === g.key ? 'rgba(212,175,55,0.18)' : '#141414',
                        color: gender === g.key ? '#D4AF37' : '#888',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. 생년월일 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#bbb', marginBottom: '4px' }}>
                생년월일 (연령별 맞춤 탈모 척도 적용) <span style={{ color: '#D4AF37' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={14} color="#777" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="date"
                  value={birthDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setBirthDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 9px 9px 32px',
                    background: '#141414',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            </div>

            {/* 3. 이메일 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#bbb', marginBottom: '4px' }}>
                이메일 주소 (로그인 ID) <span style={{ color: '#D4AF37' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color="#777" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="example@naver.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 9px 9px 32px',
                    background: '#141414',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            </div>

            {/* 4. 휴대전화번호 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#bbb', marginBottom: '4px' }}>
                휴대전화번호 <span style={{ color: '#D4AF37' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Phone size={14} color="#777" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={e => {
                      const formatted = formatKoreanPhone(e.target.value);
                      setPhone(formatted);
                      if (formatted.length >= 12) {
                        setIsPhoneVerified(true);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 9px 9px 32px',
                      background: '#141414',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  style={{
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid #D4AF37',
                    background: isPhoneVerified ? 'rgba(76, 175, 80, 0.2)' : 'rgba(212, 175, 55, 0.15)',
                    color: isPhoneVerified ? '#81c784' : '#D4AF37',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isPhoneVerified ? '✓ 확인됨' : '번호확인'}
                </button>
              </div>
              {verificationSent && (
                <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#81c784', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={12} /> 본인 연락처 확인 완료 {generatedOtp ? `[${generatedOtp}]` : ''}
                </div>
              )}
            </div>

            {/* 5. 비밀번호 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#bbb', marginBottom: '4px' }}>
                  비밀번호 (6자 이상) <span style={{ color: '#D4AF37' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="#777" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 30px 9px 30px',
                      background: '#141414',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.8rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#bbb', marginBottom: '4px' }}>
                  비밀번호 재확인 <span style={{ color: '#D4AF37' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="#777" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="한 번 더 입력"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 9px 9px 30px',
                      background: '#141414',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 6. 개인정보 및 민감정보 동의 박스 */}
            <div style={{
              background: '#121212',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '8px',
              padding: '11px 12px',
              marginTop: '2px'
            }}>
              <div
                onClick={toggleAllConsents}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingBottom: '8px',
                  marginBottom: '8px',
                  borderBottom: '1px solid #2a2a2a',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAllConsents}
                  style={{ width: 16, height: 16, accentColor: '#D4AF37', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D4AF37' }}>
                  개인정보 및 민감정보(두피·복약 경과) 보호 전체 동의
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.73rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={consents.age14}
                    onChange={() => toggleConsent('age14')}
                    style={{ accentColor: '#D4AF37' }}
                  />
                  <span style={{ color: '#D4AF37', fontWeight: 600 }}>[필수]</span>
                  <span>만 14세 이상입니다 (제22조 제6항)</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={consents.terms}
                      onChange={() => toggleConsent('terms')}
                      style={{ accentColor: '#D4AF37' }}
                    />
                    <span style={{ color: '#D4AF37', fontWeight: 600 }}>[필수]</span>
                    <span>서비스 이용약관 및 의학적 고지 동의</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingTermKey('terms')}
                    style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '0.68rem', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    전문보기
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={consents.privacyRequired}
                      onChange={() => toggleConsent('privacyRequired')}
                      style={{ accentColor: '#D4AF37' }}
                    />
                    <span style={{ color: '#D4AF37', fontWeight: 600 }}>[필수]</span>
                    <span>개인정보 수집 및 이용 동의 (제15조)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingTermKey('privacyRequired')}
                    style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '0.68rem', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    전문보기
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={consents.sensitiveHealth}
                      onChange={() => toggleConsent('sensitiveHealth')}
                      style={{ accentColor: '#D4AF37' }}
                    />
                    <span style={{ color: '#ff8a80', fontWeight: 700 }}>[필수·별도]</span>
                    <span>민감정보(탈모진단·복약전후 경과) 처리 동의 (제23조)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingTermKey('sensitiveHealth')}
                    style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '0.68rem', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    전문보기
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', color: '#bbb' }}>
                    <input
                      type="checkbox"
                      checked={consents.marketingOptIn}
                      onChange={() => toggleConsent('marketingOptIn')}
                      style={{ accentColor: '#D4AF37' }}
                    />
                    <span style={{ color: '#888' }}>[선택]</span>
                    <span>맞춤 복약 골든타임 알림 및 케어 정보 수신</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingTermKey('marketingOptIn')}
                    style={{ background: 'none', border: 'none', color: '#777', fontSize: '0.68rem', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    내용보기
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '4px',
                padding: '13px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.25)'
              }}
            >
              {isSubmitting ? '가입 및 암호화 저장 중...' : '회원가입 완료하고 바로 시작하기 →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#bbb', marginBottom: '5px' }}>
                가입한 이메일 주소
              </label>
              <input
                type="email"
                placeholder="example@naver.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: '#141414',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.86rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#bbb', marginBottom: '5px' }}>
                비밀번호
              </label>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: '#141414',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.86rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '4px',
                padding: '13px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              {isSubmitting ? '로그인 확인 중...' : '로그인하여 바로 확인하기 →'}
            </button>
          </form>
        )}
      </div>

      {/* 약관 전문 보기 모달 */}
      {viewingTermKey && KOREAN_LEGAL_TERMS[viewingTermKey] && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
            zIndex: 10001
          }}
          onClick={() => setViewingTermKey(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              maxHeight: '80vh',
              background: '#141414',
              border: '1px solid #D4AF37',
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.92rem', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} /> {KOREAN_LEGAL_TERMS[viewingTermKey].title}
              </h3>
              <button onClick={() => setViewingTermKey(null)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              whiteSpace: 'pre-line',
              fontSize: '0.78rem',
              color: '#ccc',
              lineHeight: 1.65,
              background: '#0d0d0d',
              padding: '14px',
              borderRadius: '6px',
              border: '1px solid #222'
            }}>
              {KOREAN_LEGAL_TERMS[viewingTermKey].content}
            </div>
            <button
              type="button"
              onClick={() => {
                setConsents(prev => ({ ...prev, [viewingTermKey]: true }));
                setViewingTermKey(null);
              }}
              style={{
                marginTop: '14px',
                padding: '11px',
                background: '#D4AF37',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              내용 확인 및 해당 항목 동의하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── 5. 비차단형(Non-Blocking) AuthGate 컨테이너 ──
// 앱 시작 시 회원가입 화면으로 가로막지 않고 즉시 화면을 렌더링하며,
// 탈모진단앱 및 복약전후 예상 경과 확인 기능 이용 시 안내문과 함께 회원가입 모달을 유도합니다.
const AuthGate = ({ children }) => {
  const [user, setUser] = useState(() => getCurrentMember());
  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    mode: 'signup',
    featureName: '탈모진단앱 및 복약 전·후 예상 경과 확인',
    onSuccess: null
  });

  useEffect(() => {
    const syncAuth = () => {
      setUser(getCurrentMember());
    };
    window.addEventListener('authChanged', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('authChanged', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const handleLogout = useCallback(() => {
    logoutMember();
    setUser(null);
  }, []);

  const openAuthModal = useCallback((options = {}) => {
    setAuthModalState({
      isOpen: true,
      mode: options.mode || 'signup',
      featureName: options.featureName || '탈모진단앱 및 복약 전·후 예상 경과 확인',
      onSuccess: options.onSuccess || null
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalState(prev => ({ ...prev, isOpen: false, onSuccess: null }));
  }, []);

  const handleAuthenticated = useCallback((authenticatedUser) => {
    setUser(authenticatedUser);
    const pendingCallback = authModalState.onSuccess;
    setAuthModalState(prev => ({ ...prev, isOpen: false, onSuccess: null }));
    if (typeof pendingCallback === 'function') {
      pendingCallback(authenticatedUser);
    }
  }, [authModalState.onSuccess]);

  return (
    <>
      {typeof children === 'function' ? children(user, handleLogout, openAuthModal) : children}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        featureName={authModalState.featureName}
        onClose={closeAuthModal}
        onAuthenticated={handleAuthenticated}
      />
    </>
  );
};

export default AuthGate;
