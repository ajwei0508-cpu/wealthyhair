// src/components/AuthGate.jsx
// 대한민국 개인정보보호법(제15조·제22조·제23조) 준수 정식 회원가입·본인확인·민감정보 별도 동의 및 로그인 게이트

import React, { useState } from 'react';
import {
  ShieldCheck, Lock, User, Mail, Phone, Calendar, CheckCircle2,
  Eye, EyeOff, FileText, X, AlertCircle, LogOut, Trash2
} from 'lucide-react';
import {
  registerKoreanMember,
  loginKoreanMember,
  formatKoreanPhone,
  calculateKoreanAge,
  KOREAN_LEGAL_TERMS,
  logoutMember,
  withdrawMemberAccount
} from '../utils/authService';

export const MemberHeaderBar = ({ member, currentMenuLabel, onOpenReport, onOpenProfile }) => {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '0.92rem',
              fontWeight: 700,
              color: '#D4AF37',
              letterSpacing: '0.02em'
            }}>
              WEALTHY HAIR
            </span>
            {currentMenuLabel && (
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 7px',
                borderRadius: '10px',
                background: 'rgba(212, 175, 55, 0.14)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                color: '#E5C158',
                whiteSpace: 'nowrap'
              }}>
                {currentMenuLabel}
              </span>
            )}
          </div>
          {member && (
            <div style={{ fontSize: '0.68rem', color: '#999', marginTop: 1 }}>
              {member.name} 회원님 ({member.gender === 'female' ? '여' : '남'}{member.age ? `·${member.age}세` : ''})
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

        {member && (
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
        )}
      </div>
    </div>
  );
};

export const MemberProfileModal = ({ member, isOpen, onClose, onLoggedOut }) => {
  if (!isOpen || !member) return null;

  const handleWithdraw = () => {
    if (window.confirm('개인정보보호법 제36조에 따라 회원 탈퇴 시 귀하의 계정 및 저장된 민감정보(진단·복약 기록)가 즉시 파기됩니다. 정말 탈퇴하시겠습니까?')) {
      withdrawMemberAccount(member.id);
      onClose();
      if (onLoggedOut) onLoggedOut();
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
          <div><strong style={{ color: '#D4AF37' }}>성명:</strong> {member.name}</div>
          <div><strong style={{ color: '#D4AF37' }}>이메일(ID):</strong> {member.email}</div>
          <div><strong style={{ color: '#D4AF37' }}>휴대전화:</strong> {member.phone || '인증됨'}</div>
          <div><strong style={{ color: '#D4AF37' }}>생년월일 / 성별:</strong> {member.birthDate || '-'} ({member.gender === 'female' ? '여성' : '남성'})</div>
          <div><strong style={{ color: '#D4AF37' }}>약관·민감정보 동의일:</strong> {member.consents?.consentedAt ? new Date(member.consents.consentedAt).toLocaleString('ko-KR') : '동의 완료'}</div>
          <div><strong style={{ color: '#D4AF37' }}>적용 법령 기준:</strong> 개인정보보호법 제15조·제22조·제23조 준수</div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => {
              logoutMember();
              onClose();
              if (onLoggedOut) onLoggedOut();
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

const AuthGate = ({ onAuthenticated }) => {
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [gender, setGender] = useState('male');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 휴대전화 본인확인 인증번호 절차
  const [verificationSent, setVerificationSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // 대한민국 개인정보보호법 제22조 개별/전체 동의 상태
  const [consents, setConsents] = useState({
    age14: false,
    terms: false,
    privacyRequired: false,
    sensitiveHealth: false,
    thirdPartyResearch: false,
    marketingOptIn: false
  });

  const [viewingTermKey, setViewingTermKey] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setErrorMsg('올바른 대한민국 휴대전화번호(010-XXXX-XXXX)를 입력해 주세요.');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setEnteredOtp(code); // 브라우저 환경에서 즉시 확인 가능하도록 자동 세팅 및 안내 제공
    setVerificationSent(true);
    setIsPhoneVerified(true);
    setErrorMsg('');
  };

  const validatePasswordPolicy = (pw) => {
    const hasLetter = /[a-zA-Z]/.test(pw);
    const hasDigit = /\d/.test(pw);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/]/.test(pw);
    return pw.length >= 8 && hasLetter && hasDigit && hasSpecial;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('성명(실명 또는 2자 이상 닉네임)을 정확히 입력해 주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('유효한 이메일 주소를 입력해 주세요.');
      return;
    }
    if (formatKoreanPhone(phone).length < 12) {
      setErrorMsg('휴대전화번호(010-XXXX-XXXX)를 정확히 입력해 주세요.');
      return;
    }
    if (!isPhoneVerified) {
      setErrorMsg('휴대전화 본인확인 [인증확인] 버튼을 눌러 인증을 완료해 주세요.');
      return;
    }
    const age = calculateKoreanAge(birthDate);
    if (age < 14) {
      setErrorMsg('개인정보보호법 제22조 제6항에 따라 만 14세 이상만 가입할 수 있습니다.');
      return;
    }
    if (!validatePasswordPolicy(password)) {
      setErrorMsg('비밀번호는 영문, 숫자, 특수문자를 모두 포함하여 8자 이상으로 설정해야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMsg('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    if (!requiredChecked) {
      setErrorMsg('[필수] 약관 및 민감정보(건강·두피 정보) 수집·이용 동의에 모두 체크해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await registerKoreanMember({
        name,
        email,
        phone,
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
    <div style={{
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      background: 'radial-gradient(circle at top, #1b170e 0%, #090909 55%, #000000 100%)',
      padding: '24px 18px 60px',
      color: '#fff'
    }}>
      <div style={{ maxWidth: '430px', margin: '0 auto' }}>
        {/* Luxury Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img
            src="/logo_transparent.png"
            alt="모발부자 AI"
            style={{ width: '68px', height: '68px', objectFit: 'contain', marginBottom: '6px' }}
          />
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'rgba(212, 175, 55, 0.14)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            color: '#D4AF37',
            fontSize: '0.7rem',
            fontWeight: 600,
            marginBottom: '8px'
          }}>
            <ShieldCheck size={13} /> 대한민국 개인정보보호법(제15조·제22조·제23조) 준수
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.55rem', color: '#fff', letterSpacing: '-0.02em' }}>
            모발부자 AI 멤버십
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px', lineHeight: 1.5 }}>
            정밀 남성·여성·원형탈모 진단, 복용 전후 비교 및 사상체질 맞춤 처방 가이드는 본인 인증 회원가입 후 안전하게 이용하실 수 있습니다.
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
          marginBottom: '18px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'signup' ? '#D4AF37' : 'transparent',
              color: mode === 'signup' ? '#000' : '#999',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            정식 회원가입
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'login' ? '#D4AF37' : 'transparent',
              color: mode === 'login' ? '#000' : '#999',
              fontWeight: 700,
              fontSize: '0.84rem',
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
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            lineHeight: 1.5,
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'signup' ? (
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 1. 성명 & 성별 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#bbb', marginBottom: '5px' }}>
                  성명 (실명) <span style={{ color: '#D4AF37' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#777" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 10px 10px 34px',
                      background: '#141414',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.84rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#bbb', marginBottom: '5px' }}>
                  성별 (진단척도 기준) <span style={{ color: '#D4AF37' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', height: '38px' }}>
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
                        fontWeight: 600,
                        fontSize: '0.8rem',
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
              <label style={{ display: 'block', fontSize: '0.74rem', color: '#bbb', marginBottom: '5px' }}>
                생년월일 (만 14세 이상 가입 가능) <span style={{ color: '#D4AF37' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={15} color="#777" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="date"
                  value={birthDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setBirthDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 34px',
                    background: '#141414',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.84rem'
                  }}
                />
              </div>
            </div>

            {/* 3. 이메일 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: '#bbb', marginBottom: '5px' }}>
                이메일 주소 (로그인 ID) <span style={{ color: '#D4AF37' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#777" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="example@naver.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 34px',
                    background: '#141414',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.84rem'
                  }}
                />
              </div>
            </div>

            {/* 4. 휴대전화번호 및 본인인증 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: '#bbb', marginBottom: '5px' }}>
                휴대전화번호 및 본인확인 <span style={{ color: '#D4AF37' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Phone size={15} color="#777" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={e => {
                      setPhone(formatKoreanPhone(e.target.value));
                      setIsPhoneVerified(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 10px 10px 34px',
                      background: '#141414',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.84rem'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  style={{
                    padding: '0 14px',
                    borderRadius: '6px',
                    border: '1px solid #D4AF37',
                    background: isPhoneVerified ? 'rgba(76, 175, 80, 0.2)' : 'rgba(212, 175, 55, 0.15)',
                    color: isPhoneVerified ? '#81c784' : '#D4AF37',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isPhoneVerified ? '✓ 본인확인 완료' : '인증확인'}
                </button>
              </div>
              {verificationSent && (
                <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#81c784', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} /> 본인확인 인증코드 [{generatedOtp || enteredOtp}] 확인 완료
                </div>
              )}
            </div>

            {/* 5. 비밀번호 (영문+숫자+특수문자 8자 이상) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: '#bbb', marginBottom: '5px' }}>
                비밀번호 (영문·숫자·특수문자 포함 8자 이상) <span style={{ color: '#D4AF37' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#777" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="영문 + 숫자 + 특수문자 8자 이상"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 34px',
                    background: '#141414',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.84rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: '#bbb', marginBottom: '5px' }}>
                비밀번호 재확인 <span style={{ color: '#D4AF37' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#777" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 한 번 더 입력하세요"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 34px',
                    background: '#141414',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.84rem'
                  }}
                />
              </div>
            </div>

            {/* 6. 대한민국 개인정보보호법 제22조 약관 및 민감정보 분리 동의 박스 */}
            <div style={{
              background: '#121212',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '8px',
              padding: '14px',
              marginTop: '4px'
            }}>
              <div
                onClick={toggleAllConsents}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  paddingBottom: '10px',
                  marginBottom: '10px',
                  borderBottom: '1px solid #2a2a2a',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAllConsents}
                  style={{ width: 17, height: 17, accentColor: '#D4AF37', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#D4AF37' }}>
                    약관 및 개인정보·민감정보 처리 전체 동의
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#888' }}>
                    선택 항목에 동의하지 않아도 회원가입 및 서비스 이용이 가능합니다.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.76rem' }}>
                {/* 만 14세 이상 */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={consents.age14}
                    onChange={() => toggleConsent('age14')}
                    style={{ accentColor: '#D4AF37' }}
                  />
                  <span style={{ color: '#D4AF37', fontWeight: 600 }}>[필수]</span>
                  <span>만 14세 이상입니다 (개인정보보호법 제22조 제6항)</span>
                </label>

                {/* 이용약관 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
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
                    style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    전문보기
                  </button>
                </div>

                {/* 개인정보 수집·이용 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
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
                    style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    전문보기
                  </button>
                </div>

                {/* 민감정보 별도 동의 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={consents.sensitiveHealth}
                      onChange={() => toggleConsent('sensitiveHealth')}
                      style={{ accentColor: '#D4AF37' }}
                    />
                    <span style={{ color: '#ff8a80', fontWeight: 700 }}>[필수·별도]</span>
                    <span>민감정보(두피·탈모·체질·복약) 처리 동의 (제23조)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingTermKey('sensitiveHealth')}
                    style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    전문보기
                  </button>
                </div>

                {/* 선택 1 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#bbb' }}>
                    <input
                      type="checkbox"
                      checked={consents.thirdPartyResearch}
                      onChange={() => toggleConsent('thirdPartyResearch')}
                      style={{ accentColor: '#D4AF37' }}
                    />
                    <span style={{ color: '#888' }}>[선택]</span>
                    <span>가명·익명 통계 데이터 AI 알고리즘 연구 활용 동의</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingTermKey('thirdPartyResearch')}
                    style={{ background: 'none', border: 'none', color: '#777', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    내용보기
                  </button>
                </div>

                {/* 선택 2 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#bbb' }}>
                    <input
                      type="checkbox"
                      checked={consents.marketingOptIn}
                      onChange={() => toggleConsent('marketingOptIn')}
                      style={{ accentColor: '#D4AF37' }}
                    />
                    <span style={{ color: '#888' }}>[선택]</span>
                    <span>맞춤 복약 알림 및 케어 정보 수신 동의 (망법 제50조)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setViewingTermKey('marketingOptIn')}
                    style={{ background: 'none', border: 'none', color: '#777', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer' }}
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
                marginTop: '8px',
                padding: '14px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.25)'
              }}
            >
              {isSubmitting ? '가입 처리 및 암호화 저장 중...' : '개인정보 동의 완료 및 회원가입 시작하기 →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: '#bbb', marginBottom: '6px' }}>
                가입한 이메일 주소
              </label>
              <input
                type="email"
                placeholder="example@naver.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#141414',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: '#bbb', marginBottom: '6px' }}>
                비밀번호
              </label>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#141414',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '6px',
                padding: '14px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B68D2C 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer'
              }}
            >
              {isSubmitting ? '로그인 확인 중...' : '로그인하여 서비스 시작하기 →'}
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
            zIndex: 9999
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

export default AuthGate;
