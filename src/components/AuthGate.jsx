// src/components/AuthGate.jsx
// 대한민국 개인정보보호법(제15조·제22조·제23조) 준수
// - 시작 시 강제 회원가입 차단으로 인한 이탈 방지 (개방형 탐색 지원)
// - 탈모진단앱 및 복약 전·후 예상 경과 확인은 개인정보 내용으로 간결한 안내문과 함께 회원가입 유도

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Lock, User, Mail, Phone, Calendar, CheckCircle2,
  Eye, EyeOff, FileText, X, AlertCircle, LogOut, Trash2, Sparkles
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

// ── 1. 상단 글로벌 헤더 바 (간결한 핵심 구성) ──
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
      background: 'rgba(12, 12, 14, 0.96)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.22)',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <img
          src="/logo_transparent.png"
          alt="모발부자"
          style={{ width: 24, height: 24, objectFit: 'contain' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '0.9rem',
          fontWeight: 700,
          color: '#D4AF37',
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap'
        }}>
          WEALTHY HAIR
        </span>
        {menuLabel && (
          <span style={{
            fontSize: '0.68rem',
            padding: '2px 8px',
            borderRadius: '999px',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: '#E5C158',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '130px'
          }}>
            {menuLabel}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
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
            cursor: 'pointer'
          }}
          title="불편사항 카카오톡 전송"
        >
          <span>💬</span>
          <span>카톡문의</span>
        </button>

        {activeMember ? (
          <button
            type="button"
            onClick={onOpenProfile}
            style={{
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#D4AF37',
              borderRadius: '6px',
              padding: '5px 9px',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {activeMember.name}님
          </button>
        ) : (
          onOpenAuth && (
            <button
              type="button"
              onClick={() => onOpenAuth({ mode: 'signup', featureName: '탈모진단 및 복약 경과 확인' })}
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #B68D2C)',
                border: 'none',
                color: '#000',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              회원가입·로그인
            </button>
          )
        )}
      </div>
    </div>
  );
};

// ── 2. 탈모진단앱 & 복약전후 예상 경과 확인 전용 간결한 개인정보 안내 배너 ──
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
        background: 'rgba(76, 175, 80, 0.1)',
        border: '1px solid rgba(129, 199, 132, 0.35)',
        borderRadius: '10px',
        padding: '8px 12px',
        marginBottom: '12px',
        fontSize: '0.74rem',
        color: '#c8e6c9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={15} color="#81c784" />
          <span><strong>{user.name}님</strong> 개인정보 암호화 보호 적용 중 (전 기능 활성화)</span>
        </div>
      </div>
    );
  }

  const labelMap = {
    diagnosis: 'AI 탈모진단앱',
    areata: '원형탈모(SALT) 진단앱',
    simulator: '복약 전·후 예상 경과 확인'
  };
  const targetLabel = labelMap[featureType] || '탈모진단 및 복약 경과 확인';

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(28, 23, 14, 0.96), rgba(15, 15, 18, 0.98))',
      border: '1px solid rgba(212, 175, 55, 0.45)',
      borderRadius: '12px',
      padding: '12px 14px',
      marginBottom: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <Lock size={16} color="#D4AF37" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.78rem', color: '#eee', lineHeight: 1.45 }}>
          <strong style={{ color: '#D4AF37' }}>탈모진단앱과 복약 전·후 예상 경과 확인</strong>은 개인 두피·건강정보를 다루므로 개인정보 보호를 위해 <strong>회원가입 후 이용</strong>하실 수 있습니다.
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
            gap: '5px'
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
            whiteSpace: 'nowrap'
          }}
        >
          로그인
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
    if (window.confirm('회원 탈퇴 시 저장된 개인정보 및 진단·복약 기록이 즉시 파기됩니다. 탈퇴하시겠습니까?')) {
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
        maxWidth: '380px',
        background: '#121215',
        border: '1px solid #D4AF37',
        borderRadius: '12px',
        padding: '18px',
        color: '#fff'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '0.96rem', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <ShieldCheck size={17} /> 내 회원정보
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background: '#18181c', borderRadius: '8px', padding: '12px', fontSize: '0.8rem', lineHeight: 1.75, border: '1px solid #2a2a2a' }}>
          <div><strong style={{ color: '#D4AF37' }}>성명:</strong> {activeMember.name}</div>
          <div><strong style={{ color: '#D4AF37' }}>이메일:</strong> {activeMember.email}</div>
          <div><strong style={{ color: '#D4AF37' }}>연락처:</strong> {activeMember.phone || '등록됨'}</div>
          <div><strong style={{ color: '#D4AF37' }}>생년월일/성별:</strong> {activeMember.birthDate || '-'} ({activeMember.gender === 'female' ? '여성' : '남성'})</div>
        </div>

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
              gap: '6px'
            }}
          >
            <LogOut size={14} /> 로그아웃
          </button>
          <button
            type="button"
            onClick={handleWithdraw}
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
              gap: '4px'
            }}
          >
            <Trash2 size={13} /> 탈퇴
          </button>
        </div>
      </div>
    </div>
  );
};

// ── 4. 회원가입 · 로그인 모달 (핵심 안내 + 간편 가입) ──
export const AuthModal = ({
  isOpen,
  initialMode = 'signup',
  featureName = '탈모진단 및 복약 경과 확인',
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
  const [showPassword, setShowPassword] = useState(false);

  const [consents, setConsents] = useState({
    age14: true,
    terms: true,
    privacyRequired: true,
    sensitiveHealth: true,
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
      marketingOptIn: next
    });
  };

  const toggleConsent = (key) => {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }));
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
      setErrorMsg('필수 개인정보 보호 동의 항목에 체크해 주세요.');
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
      setErrorMsg('이메일과 비밀번호를 입력해 주세요.');
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
        background: 'rgba(0, 0, 0, 0.86)',
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
          maxWidth: '410px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#121216',
          border: '1.5px solid #D4AF37',
          borderRadius: '16px',
          padding: '18px',
          color: '#fff',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={15} /> 개인정보 암호화 보호 멤버십
          </span>
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
              gap: '4px'
            }}
          >
            <span>닫기</span>
            <X size={13} />
          </button>
        </div>

        {/* 간결한 핵심 안내 */}
        <div style={{
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '10px',
          padding: '10px 12px',
          marginBottom: '12px',
          fontSize: '0.76rem',
          color: '#eee',
          lineHeight: 1.45
        }}>
          <strong style={{ color: '#D4AF37' }}>🔒 {featureName}</strong>은(는) 개인 민감정보(두피·복약 기록) 보호를 위해 회원가입 후 이용 가능합니다.
        </div>

        {/* 탭 전환 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#1a1a20',
          borderRadius: '8px',
          padding: '3px',
          marginBottom: '12px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'signup' ? '#D4AF37' : 'transparent',
              color: mode === 'signup' ? '#000' : '#999',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            무료 회원가입
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'login' ? '#D4AF37' : 'transparent',
              color: mode === 'login' ? '#000' : '#999',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            로그인
          </button>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 82, 82, 0.14)',
            border: '1px solid rgba(255, 82, 82, 0.45)',
            color: '#ff8a80',
            padding: '8px 10px',
            borderRadius: '8px',
            fontSize: '0.74rem',
            marginBottom: '10px'
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'signup' ? (
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', marginBottom: '3px' }}>성명 *</label>
                <div style={{ position: 'relative' }}>
                  <User size={13} color="#777" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 8px 8px 28px',
                      background: '#18181e',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', marginBottom: '3px' }}>성별 *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', height: '34px' }}>
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
                        background: gender === g.key ? 'rgba(212,175,55,0.18)' : '#18181e',
                        color: gender === g.key ? '#D4AF37' : '#888',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        cursor: 'pointer'
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', marginBottom: '3px' }}>생년월일 *</label>
                <input
                  type="date"
                  value={birthDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setBirthDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#18181e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.78rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', marginBottom: '3px' }}>휴대전화 *</label>
                <input
                  type="tel"
                  placeholder="010-1234-5678"
                  value={phone}
                  onChange={e => setPhone(formatKoreanPhone(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#18181e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.78rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', marginBottom: '3px' }}>이메일(ID) *</label>
                <input
                  type="email"
                  placeholder="id@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#18181e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.78rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', marginBottom: '3px' }}>비밀번호(6자+) *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 26px 8px 8px',
                      background: '#18181e',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.78rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* 간결한 약관 동의 */}
            <div style={{
              background: '#16161c',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '8px',
              padding: '9px 10px'
            }}>
              <div
                onClick={toggleAllConsents}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  paddingBottom: '6px',
                  marginBottom: '6px',
                  borderBottom: '1px solid #2a2a2a',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAllConsents}
                  style={{ accentColor: '#D4AF37' }}
                />
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#D4AF37' }}>
                  개인정보 및 민감정보 보호 전체 동의
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem', color: '#ccc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={consents.privacyRequired} onChange={() => toggleConsent('privacyRequired')} style={{ accentColor: '#D4AF37' }} />
                    <span>[필수] 만 14세 이상 · 이용약관 · 개인정보 수집 동의</span>
                  </label>
                  <button type="button" onClick={() => setViewingTermKey('privacyRequired')} style={{ background: 'none', border: 'none', color: '#999', fontSize: '0.66rem', textDecoration: 'underline', cursor: 'pointer' }}>보기</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={consents.sensitiveHealth} onChange={() => toggleConsent('sensitiveHealth')} style={{ accentColor: '#D4AF37' }} />
                    <span>[필수] 두피·복약 민감정보 암호화 처리 동의</span>
                  </label>
                  <button type="button" onClick={() => setViewingTermKey('sensitiveHealth')} style={{ background: 'none', border: 'none', color: '#999', fontSize: '0.66rem', textDecoration: 'underline', cursor: 'pointer' }}>보기</button>
                </div>
              </div>
            </div>

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
                cursor: 'pointer'
              }}
            >
              {isSubmitting ? '처리 중...' : '가입 완료하고 바로 시작하기 →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#18181e',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.84rem'
              }}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#18181e',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.84rem'
              }}
            />
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
                cursor: 'pointer'
              }}
            >
              {isSubmitting ? '로그인 중...' : '로그인 →'}
            </button>
          </form>
        )}
      </div>

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
              maxWidth: '400px',
              maxHeight: '75vh',
              background: '#141418',
              border: '1px solid #D4AF37',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '0.88rem', color: '#D4AF37', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} /> {KOREAN_LEGAL_TERMS[viewingTermKey].title}
              </h3>
              <button onClick={() => setViewingTermKey(null)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              whiteSpace: 'pre-line',
              fontSize: '0.75rem',
              color: '#ccc',
              lineHeight: 1.6,
              background: '#0d0d10',
              padding: '12px',
              borderRadius: '6px'
            }}>
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
                cursor: 'pointer'
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

// ── 5. 비차단형(Non-Blocking) AuthGate 컨테이너 ──
const AuthGate = ({ children }) => {
  const [user, setUser] = useState(() => getCurrentMember());
  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    mode: 'signup',
    featureName: '탈모진단 및 복약 전·후 예상 경과 확인',
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
      featureName: options.featureName || '탈모진단 및 복약 전·후 예상 경과 확인',
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
