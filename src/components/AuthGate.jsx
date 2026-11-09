// src/components/AuthGate.jsx
// 대한민국 개인정보보호법(제15조·제22조·제23조) 준수
// - 회원가입 · 로그인 · 향후 자동로그인 유지 · 개인 진단기록 연동 통합 인증 게이트

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  FileText,
  X,
  AlertCircle,
  LogOut,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  getCurrentMember,
  restoreMemberSession,
  getAutoLoginPreference,
  setAutoLoginForCurrentMember,
  registerKoreanMember,
  loginKoreanMember,
  formatKoreanPhone,
  calculateKoreanAge,
  KOREAN_LEGAL_TERMS,
  logoutMember,
  withdrawMemberAccount,
} from '../utils/authService';
import { getDiagnosisHistory } from '../utils/diagnosisHistoryService';
import PrivateAdminModal from './PrivateAdminModal';

// ── 1. 상단 글로벌 헤더 바 (로고 5연속 클릭 시크릿 트리거 & 비공개 보안 아이콘 내장) ──
export const MemberHeaderBar = ({
  member,
  user,
  currentMenuLabel,
  currentScreenName,
  onOpenReport,
  onOpenProfile,
  onOpenAuth,
}) => {
  const activeMember = member || user || null;
  const menuLabel = currentMenuLabel || currentScreenName || '';
  const [logoClickCount, setLogoClickCount] = useState(0);

  const handleSecretLogoClick = () => {
    setLogoClickCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('openPrivateAdminModal'));
        }
        return 0;
      }
      return next;
    });
  };

  useEffect(() => {
    if (logoClickCount === 0) return;
    const timer = setTimeout(() => setLogoClickCount(0), 2500);
    return () => clearTimeout(timer);
  }, [logoClickCount]);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'rgba(12, 12, 14, 0.96)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.22)',
        position: 'sticky',
        top: 0,
        zIndex: 90,
      }}
    >
      <div
        onClick={handleSecretLogoClick}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, cursor: 'pointer', userSelect: 'none' }}
        title="WEALTHY HAIR (5회 연속 클릭 시 비공개 관리자 모드)"
      >
        <img
          src="/logo_transparent.png"
          alt="모발부자 로고"
          style={{ width: 24, height: 24, objectFit: 'contain' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#D4AF37',
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
          }}
        >
          WEALTHY HAIR
        </span>
        {logoClickCount >= 3 && (
          <span
            style={{
              fontSize: '0.62rem',
              padding: '1px 6px',
              borderRadius: '999px',
              background: 'rgba(212, 175, 55, 0.25)',
              color: '#FFD54F',
              fontWeight: 800,
            }}
          >
            관리자 {5 - logoClickCount}회
          </span>
        )}
        {menuLabel && (
          <span
            style={{
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#E5C158',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '130px',
            }}
          >
            {menuLabel}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('openPrivateAdminModal'));
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.28)',
            color: '#D4AF37',
            borderRadius: '6px',
            padding: '5px 7px',
            fontSize: '0.68rem',
            cursor: 'pointer',
          }}
          title="비공개 관리자 모드 (PIN 보안)"
          aria-label="비공개 관리자 모드 열기"
        >
          <Lock size={13} />
        </button>

        <button
          type="button"
          onClick={onOpenReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#FEE500',
            color: '#191919',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 9px',
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          aria-label="불편사항 카카오톡 문의"
        >
          <span aria-hidden="true">💬</span>
          <span>카톡문의</span>
        </button>

        {activeMember ? (
          <button
            type="button"
            onClick={onOpenProfile}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#D4AF37',
              borderRadius: '6px',
              padding: '5px 9px',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#81C784',
                display: 'inline-block',
              }}
            />
            <span>{activeMember.name}님</span>
          </button>
        ) : (
          onOpenAuth && (
            <button
              type="button"
              onClick={() => onOpenAuth({ mode: 'signup', featureName: '탈모진단 및 개인 기록 저장' })}
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #B68D2C)',
                border: 'none',
                color: '#000',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              회원가입·로그인
            </button>
          )
        )}
      </div>
    </header>
  );
};

// ── 2. 탈모진단앱 & 원형탈모 진단 개인정보·자동로그인 상태 배너 ──
export const PrivacyMembershipNoticeCard = ({
  user,
  featureType = 'diagnosis',
  onOpenAuth,
}) => {
  if (user) {
    const autoLoginActive = user.autoLogin !== false;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap',
          background: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(129, 199, 132, 0.35)',
          borderRadius: '10px',
          padding: '8px 12px',
          marginBottom: '12px',
          fontSize: '0.73rem',
          color: '#c8e6c9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={15} color="#81c784" style={{ flexShrink: 0 }} />
          <span>
            <strong>{user.name}님</strong> 개인 진단 기록 자동저장 · 암호화 보호 중
          </span>
        </div>
        <span
          style={{
            fontSize: '0.64rem',
            padding: '2px 7px',
            borderRadius: '999px',
            background: autoLoginActive ? 'rgba(129, 199, 132, 0.2)' : 'rgba(255,255,255,0.08)',
            color: autoLoginActive ? '#81c784' : '#ccc',
            fontWeight: 700,
          }}
        >
          {autoLoginActive ? '자동로그인 유지 중' : '이번 세션 로그인'}
        </span>
      </div>
    );
  }

  const labelMap = {
    diagnosis: 'AI 탈모진단앱',
    areata: '원형탈모(SALT) 진단앱',
    simulator: '복약 전·후 AI 예측 (점검중)',
  };
  const targetLabel = labelMap[featureType] || 'AI 탈모 정밀 진단';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(28, 23, 14, 0.96), rgba(15, 15, 18, 0.98))',
        border: '1px solid rgba(212, 175, 55, 0.45)',
        borderRadius: '12px',
        padding: '12px 14px',
        marginBottom: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <Lock size={16} color="#D4AF37" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.78rem', color: '#eee', lineHeight: 1.45 }}>
          <strong style={{ color: '#D4AF37' }}>AI 탈모 정밀 진단 및 개인 기록 보관</strong>은 민감 건강·두피 정보를 다루므로{' '}
          <strong>회원가입(향후 자동로그인 지원)</strong> 후 안전하게 이용하실 수 있습니다.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => onOpenAuth && onOpenAuth({ mode: 'signup', featureName: targetLabel })}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
            color: '#000',
            fontWeight: 800,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
          }}
        >
          <Sparkles size={14} />
          <span>무료 회원가입 (30초)</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenAuth && onOpenAuth({ mode: 'login', featureName: targetLabel })}
          style={{
            padding: '9px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            background: 'rgba(255, 255, 255, 0.04)',
            color: '#D4AF37',
            fontWeight: 700,
            fontSize: '0.76rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          로그인
        </button>
      </div>
    </div>
  );
};

// ── 3. 내 회원정보 · 자동로그인 설정 · 개인기록 요약 모달 ──
export const MemberProfileModal = ({ member, user, isOpen, onClose, onLoggedOut, onLogout }) => {
  const activeMember = member || user;
  const handleLogoutCallback = onLoggedOut || onLogout;
  const [historyCount, setHistoryCount] = useState(0);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  useEffect(() => {
    if (!isOpen || !activeMember) return;
    getDiagnosisHistory(activeMember, 'all')
      .then((list) => setHistoryCount(list.length))
      .catch(() => setHistoryCount(0));
  }, [isOpen, activeMember]);

  if (!isOpen || !activeMember) return null;

  const isAutoLogin = activeMember.autoLogin !== false;

  const handleCloseModal = () => {
    setConfirmWithdraw(false);
    onClose();
  };

  const handleToggleAutoLogin = () => {
    setAutoLoginForCurrentMember(!isAutoLogin);
  };

  const handleConfirmWithdraw = () => {
    withdrawMemberAccount(activeMember.id);
    setConfirmWithdraw(false);
    onClose();
    if (handleLogoutCallback) handleLogoutCallback();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wh-member-profile-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.84)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 9999,
      }}
      onClick={handleCloseModal}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '390px',
          background: '#121215',
          border: '1px solid #D4AF37',
          borderRadius: '12px',
          padding: '18px',
          color: '#fff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h3
            id="wh-member-profile-title"
            style={{
              fontSize: '0.96rem',
              color: '#D4AF37',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              margin: 0,
            }}
          >
            <ShieldCheck size={17} /> 내 회원정보 및 자동로그인 관리
          </h3>
          <button
            type="button"
            onClick={handleCloseModal}
            aria-label="내 회원정보 닫기"
            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            background: '#18181c',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '0.8rem',
            lineHeight: 1.75,
            border: '1px solid #2a2a2a',
          }}
        >
          <div>
            <strong style={{ color: '#D4AF37' }}>성명:</strong> {activeMember.name}
          </div>
          <div>
            <strong style={{ color: '#D4AF37' }}>이메일:</strong> {activeMember.email}
          </div>
          <div>
            <strong style={{ color: '#D4AF37' }}>연락처:</strong> {activeMember.phone || '등록됨'}
          </div>
          <div>
            <strong style={{ color: '#D4AF37' }}>생년월일/성별:</strong> {activeMember.birthDate || '-'} (
            {activeMember.gender === 'female' ? '여성' : '남성'})
          </div>
          <div>
            <strong style={{ color: '#D4AF37' }}>보관된 개인 진단 기록:</strong>{' '}
            <span style={{ color: '#81C784', fontWeight: 800 }}>{historyCount}건</span>
          </div>
        </div>

        {/* 향후 자동로그인 ON/OFF 스위치 */}
        <div
          style={{
            marginTop: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.28)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f5f0e8' }}>
              향후 자동로그인 유지
            </div>
            <div style={{ fontSize: '0.67rem', color: '#aaa' }}>
              {isAutoLogin
                ? '브라우저 재방문 시 별도 로그인 없이 바로 연결됩니다.'
                : '브라우저를 닫으면 자동 로그아웃됩니다.'}
            </div>
          </div>
          <button
            type="button"
            aria-pressed={isAutoLogin}
            onClick={handleToggleAutoLogin}
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              border: isAutoLogin ? '1px solid #81C784' : '1px solid #555',
              background: isAutoLogin ? 'rgba(129, 199, 132, 0.2)' : '#25252b',
              color: isAutoLogin ? '#81C784' : '#aaa',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {isAutoLogin ? '켜짐 ON' : '꺼짐 OFF'}
          </button>
        </div>

        {confirmWithdraw ? (
          <div
            role="alert"
            style={{
              marginTop: '12px',
              padding: '11px',
              borderRadius: '8px',
              background: 'rgba(255, 82, 82, 0.12)',
              border: '1px solid rgba(255, 82, 82, 0.45)',
            }}
          >
            <div style={{ fontSize: '0.74rem', color: '#ffcdd2', marginBottom: '8px', lineHeight: 1.45 }}>
              탈퇴 시 개인정보 및 저장된 모든 진단·복약 기록이 즉시 영구 파기됩니다. 정말 탈퇴하시겠습니까?
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '7px',
                  border: 'none',
                  background: '#ff5252',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                영구 파기 및 탈퇴 확정
              </button>
              <button
                type="button"
                onClick={() => setConfirmWithdraw(false)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: '1px solid #444',
                  background: '#222',
                  color: '#ccc',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={() => {
                logoutMember();
                onClose();
                if (handleLogoutCallback) handleLogoutCallback();
              }}
              style={{
                flex: 1,
                padding: '10px',
                background: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <LogOut size={14} /> 로그아웃
            </button>
            <button
              type="button"
              onClick={() => setConfirmWithdraw(true)}
              style={{
                padding: '10px 12px',
                background: 'rgba(255, 82, 82, 0.12)',
                color: '#ff6b6b',
                border: '1px solid rgba(255, 82, 82, 0.4)',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Trash2 size={13} /> 탈퇴
            </button>
          </div>
        )}

        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('openPrivateAdminModal'));
              }
            }}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px dashed rgba(212, 175, 55, 0.35)',
              background: 'rgba(212, 175, 55, 0.06)',
              color: '#D4AF37',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <Lock size={12} /> 비공개 관리자 관제 센터 열기 (PIN 보안)
          </button>
        </div>
      </div>
    </div>
  );
};

// ── 4. 회원가입 · 로그인 모달 (표준 Autofill + 약관 동기화 + 향후 자동로그인 지원) ──
export const AuthModal = ({
  isOpen,
  initialMode = 'signup',
  featureName = '탈모진단 및 개인 기록 저장',
  onClose,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState(initialMode || 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [gender, setGender] = useState('male');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(() => getAutoLoginPreference().enabled !== false);

  const [consents, setConsents] = useState({
    age14: true,
    terms: true,
    privacyRequired: true,
    sensitiveHealth: true,
    marketingOptIn: false,
  });

  const [viewingTermKey, setViewingTermKey] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const corePrivacyChecked = consents.age14 && consents.terms && consents.privacyRequired;
  const requiredChecked = corePrivacyChecked && consents.sensitiveHealth;
  const allChecked = requiredChecked && consents.marketingOptIn;

  const toggleAllConsents = () => {
    const next = !allChecked;
    setConsents({
      age14: next,
      terms: next,
      privacyRequired: next,
      sensitiveHealth: next,
      marketingOptIn: next,
    });
  };

  // [필수 1] 만 14세 이상 · 이용약관 · 개인정보 수집 동의는 단일 통합 체크박스로 3개 필드를 동시 동기화 (해제 후 재체크 시 먹통 버그 완벽 해결)
  const toggleCorePrivacyConsent = () => {
    const next = !corePrivacyChecked;
    setConsents((prev) => ({
      ...prev,
      age14: next,
      terms: next,
      privacyRequired: next,
    }));
  };

  const toggleSingleConsent = (key) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('성명(2자 이상)을 입력해 주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('유효한 이메일 주소를 입력해 주세요.');
      return;
    }
    const formattedPhone = formatKoreanPhone(phone);
    if (formattedPhone.length < 12) {
      setErrorMsg('휴대전화번호(010-XXXX-XXXX)를 입력해 주세요.');
      return;
    }
    const age = calculateKoreanAge(birthDate);
    if (age < 14) {
      setErrorMsg('만 14세 이상만 가입할 수 있습니다.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('비밀번호는 6자 이상 입력해 주세요.');
      return;
    }
    if (!requiredChecked) {
      setErrorMsg('필수 개인정보 및 민감정보 보호 동의 항목에 모두 체크해 주세요.');
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
        consents,
        autoLogin,
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
      setErrorMsg('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await loginKoreanMember(email, password, { autoLogin });
      if (onAuthenticated) onAuthenticated(user);
    } catch (err) {
      setErrorMsg(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wh-auth-modal-heading"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.86)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px',
        zIndex: 9998,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '415px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#121216',
          border: '1.5px solid #D4AF37',
          borderRadius: '16px',
          padding: '18px',
          color: '#fff',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <h2
            id="wh-auth-modal-heading"
            style={{
              margin: 0,
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#D4AF37',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <ShieldCheck size={15} /> 개인정보 암호화 보호 멤버십
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#ccc',
              borderRadius: '999px',
              padding: '4px 10px',
              fontSize: '0.7rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>닫기</span>
            <X size={13} />
          </button>
        </div>

        {/* 핵심 안내 */}
        <div
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '12px',
            fontSize: '0.75rem',
            color: '#eee',
            lineHeight: 1.45,
          }}
        >
          <strong style={{ color: '#D4AF37' }}>🔒 {featureName}</strong>은(는) 개인 두피·진단 이력 보호 및 자동 보관을 위해 회원가입 후 이용 가능합니다.
        </div>

        {/* 가입 / 로그인 탭 전환 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#1a1a20',
            borderRadius: '8px',
            padding: '3px',
            marginBottom: '12px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'signup' ? '#D4AF37' : 'transparent',
              color: mode === 'signup' ? '#000' : '#999',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            무료 회원가입
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'login' ? '#D4AF37' : 'transparent',
              color: mode === 'login' ? '#000' : '#999',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            로그인
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 82, 82, 0.14)',
              border: '1px solid rgba(255, 82, 82, 0.45)',
              color: '#ff8a80',
              padding: '8px 10px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              marginBottom: '10px',
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'signup' ? (
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div>
                <label
                  htmlFor="wh-signup-name"
                  style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', marginBottom: '3px' }}
                >
                  성명 *
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={13}
                    color="#777"
                    aria-hidden="true"
                    style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="wh-signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 8px 8px 28px',
                      background: '#18181e',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
              </div>

              <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <legend style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: '3px', padding: 0 }}>
                  성별 *
                </legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', height: '35px' }}>
                  {[
                    { key: 'male', label: '남성' },
                    { key: 'female', label: '여성' },
                  ].map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      aria-pressed={gender === g.key}
                      onClick={() => setGender(g.key)}
                      style={{
                        borderRadius: '6px',
                        border: gender === g.key ? '1px solid #D4AF37' : '1px solid #333',
                        background: gender === g.key ? 'rgba(212,175,55,0.18)' : '#18181e',
                        color: gender === g.key ? '#D4AF37' : '#888',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label
                  htmlFor="wh-signup-bday"
                  style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', marginBottom: '3px' }}
                >
                  생년월일 *
                </label>
                <input
                  id="wh-signup-bday"
                  name="birthDate"
                  type="date"
                  autoComplete="bday"
                  required
                  value={birthDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setBirthDate(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#18181e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.78rem',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="wh-signup-phone"
                  style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', marginBottom: '3px' }}
                >
                  휴대전화 *
                </label>
                <input
                  id="wh-signup-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  placeholder="010-1234-5678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatKoreanPhone(e.target.value));
                    if (errorMsg) setErrorMsg('');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#18181e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.78rem',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '8px' }}>
              <div>
                <label
                  htmlFor="wh-signup-email"
                  style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', marginBottom: '3px' }}
                >
                  이메일(ID) *
                </label>
                <input
                  id="wh-signup-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  spellCheck={false}
                  required
                  placeholder="id@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#18181e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.78rem',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="wh-signup-password"
                  style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', marginBottom: '3px' }}
                >
                  비밀번호(6자+) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="wh-signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 28px 8px 8px',
                      background: '#18181e',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.78rem',
                    }}
                  />
                  <button
                    type="button"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* 약관 동의 (이중 클릭 버그 및 필수 체크 누락 함정 수정 완료) */}
            <div
              style={{
                background: '#16161c',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '8px',
                padding: '9px 10px',
              }}
            >
              <label
                htmlFor="wh-consent-all"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  paddingBottom: '6px',
                  marginBottom: '6px',
                  borderBottom: '1px solid #2a2a2a',
                  cursor: 'pointer',
                }}
              >
                <input
                  id="wh-consent-all"
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAllConsents}
                  style={{ accentColor: '#D4AF37' }}
                />
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#D4AF37' }}>
                  개인정보 및 민감정보 보호 전체 동의
                </span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.7rem', color: '#ccc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <label
                    htmlFor="wh-consent-core"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <input
                      id="wh-consent-core"
                      type="checkbox"
                      checked={corePrivacyChecked}
                      onChange={toggleCorePrivacyConsent}
                      style={{ accentColor: '#D4AF37' }}
                    />
                    <span>[필수] 만 14세 이상 · 이용약관 · 개인정보 수집 동의</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingTermKey('privacyRequired')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#aaa',
                      fontSize: '0.66rem',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    보기
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <label
                    htmlFor="wh-consent-sensitive"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <input
                      id="wh-consent-sensitive"
                      type="checkbox"
                      checked={consents.sensitiveHealth}
                      onChange={() => toggleSingleConsent('sensitiveHealth')}
                      style={{ accentColor: '#D4AF37' }}
                    />
                    <span>[필수] 두피·복약 민감정보 암호화 처리 동의</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingTermKey('sensitiveHealth')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#aaa',
                      fontSize: '0.66rem',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    보기
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <label
                    htmlFor="wh-consent-marketing"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#999' }}
                  >
                    <input
                      id="wh-consent-marketing"
                      type="checkbox"
                      checked={consents.marketingOptIn}
                      onChange={() => toggleSingleConsent('marketingOptIn')}
                      style={{ accentColor: '#D4AF37' }}
                    />
                    <span>[선택] 복약 골든타임 알림 및 케어 정보 수신</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingTermKey('marketingOptIn')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      fontSize: '0.66rem',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    보기
                  </button>
                </div>
              </div>
            </div>

            {/* 향후 자동로그인 유지 체크박스 */}
            <label
              htmlFor="wh-signup-autologin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'rgba(129, 199, 132, 0.08)',
                border: '1px solid rgba(129, 199, 132, 0.28)',
                cursor: 'pointer',
                fontSize: '0.73rem',
                color: '#dcedc8',
              }}
            >
              <input
                id="wh-signup-autologin"
                name="autoLogin"
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
                style={{ accentColor: '#81C784' }}
              />
              <span>
                <strong>향후 자동로그인 유지</strong> (다음 방문 시 바로 내 진단기록 연결)
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: isSubmitting ? 'wait' : 'pointer',
              }}
            >
              {isSubmitting ? '가입 처리 중...' : '회원가입 완료하고 바로 시작하기 →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label
                htmlFor="wh-login-email"
                style={{ display: 'block', fontSize: '0.72rem', color: '#aaa', marginBottom: '4px' }}
              >
                이메일 주소
              </label>
              <input
                id="wh-login-email"
                name="email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                required
                placeholder="id@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#18181e',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.84rem',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="wh-login-password"
                style={{ display: 'block', fontSize: '0.72rem', color: '#aaa', marginBottom: '4px' }}
              >
                비밀번호
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="wh-login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 34px 10px 10px',
                    background: '#18181e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.84rem',
                  }}
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    padding: 2,
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <label
              htmlFor="wh-login-autologin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'rgba(129, 199, 132, 0.08)',
                border: '1px solid rgba(129, 199, 132, 0.28)',
                cursor: 'pointer',
                fontSize: '0.74rem',
                color: '#dcedc8',
              }}
            >
              <input
                id="wh-login-autologin"
                name="autoLogin"
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
                style={{ accentColor: '#81C784' }}
              />
              <span>
                <strong>향후 자동로그인 유지</strong> (재방문 시 자동 로그인)
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: isSubmitting ? 'wait' : 'pointer',
              }}
            >
              {isSubmitting ? '로그인 중...' : '로그인하기 →'}
            </button>
          </form>
        )}
      </div>

      {viewingTermKey && KOREAN_LEGAL_TERMS[viewingTermKey] && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
            zIndex: 10001,
          }}
          onClick={() => setViewingTermKey(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              maxHeight: '75vh',
              background: '#141418',
              border: '1px solid #D4AF37',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <h3
                style={{
                  fontSize: '0.88rem',
                  color: '#D4AF37',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileText size={15} /> {KOREAN_LEGAL_TERMS[viewingTermKey].title}
              </h3>
              <button
                type="button"
                onClick={() => setViewingTermKey(null)}
                aria-label="약관 닫기"
                style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                whiteSpace: 'pre-line',
                fontSize: '0.75rem',
                color: '#ccc',
                lineHeight: 1.6,
                background: '#0d0d10',
                padding: '12px',
                borderRadius: '6px',
              }}
            >
              {KOREAN_LEGAL_TERMS[viewingTermKey].content}
            </div>
            <button
              type="button"
              onClick={() => setViewingTermKey(null)}
              style={{
                marginTop: '12px',
                padding: '10px',
                background: '#D4AF37',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── 5. 비차단형(Non-Blocking) AuthGate 컨테이너 + 자동로그인 복원 + 비공개 관리자 모드 ──
const AuthGate = ({ children }) => {
  const [user, setUser] = useState(() => getCurrentMember());
  const [adminModalOpen, setAdminModalOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('admin') === '1' || window.location.hash === '#admin';
  });
  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    openSeq: 0,
    mode: 'signup',
    featureName: '탈모진단 및 개인 기록 저장',
    onSuccess: null,
  });

  useEffect(() => {
    let active = true;
    restoreMemberSession().then((restored) => {
      if (active && restored) {
        setUser(restored);
      }
    });

    const syncAuth = () => {
      setUser(getCurrentMember());
    };
    const handleOpenAdmin = () => {
      setAdminModalOpen(true);
    };
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.altKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setAdminModalOpen((prev) => !prev);
      }
    };
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setAdminModalOpen(true);
      }
    };

    window.addEventListener('authChanged', syncAuth);
    window.addEventListener('storage', syncAuth);
    window.addEventListener('openPrivateAdminModal', handleOpenAdmin);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      active = false;
      window.removeEventListener('authChanged', syncAuth);
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('openPrivateAdminModal', handleOpenAdmin);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleLogout = useCallback(() => {
    logoutMember();
    setUser(null);
  }, []);

  const openAuthModal = useCallback((options = {}) => {
    setAuthModalState((prev) => ({
      isOpen: true,
      openSeq: prev.openSeq + 1,
      mode: options.mode || 'signup',
      featureName: options.featureName || '탈모진단 및 개인 기록 저장',
      onSuccess: options.onSuccess || null,
    }));
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false, onSuccess: null }));
  }, []);

  const handleAuthenticated = useCallback(
    (authenticatedUser) => {
      setUser(authenticatedUser);
      const pendingCallback = authModalState.onSuccess;
      setAuthModalState((prev) => ({ ...prev, isOpen: false, onSuccess: null }));
      if (typeof pendingCallback === 'function') {
        pendingCallback(authenticatedUser);
      }
    },
    [authModalState.onSuccess]
  );

  return (
    <>
      {typeof children === 'function' ? children(user, handleLogout, openAuthModal) : children}
      {authModalState.isOpen && (
        <AuthModal
          key={authModalState.openSeq}
          isOpen={authModalState.isOpen}
          initialMode={authModalState.mode}
          featureName={authModalState.featureName}
          onClose={closeAuthModal}
          onAuthenticated={handleAuthenticated}
        />
      )}
      <PrivateAdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        currentUser={user}
      />
    </>
  );
};

export default AuthGate;
