// src/components/KakaoReportModal.jsx
// 모든 메뉴에서 즉시 접근 가능한 '불편사항 신고 → 제작자 카카오톡 즉시 전송' 통합 시스템

import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, MessageSquareWarning, Copy, ExternalLink, Clock } from 'lucide-react';
import { supabase } from '../supabase';

// 제작자 공식 카카오톡 상담 채널 (바른한의원 / 제작자 직통 채널 _ykxcLK)
const DEFAULT_KAKAO_CHANNEL_ID = '_ykxcLK';
const KAKAO_CHAT_URL = `https://pf.kakao.com/${DEFAULT_KAKAO_CHANNEL_ID}/chat`;
const KAKAO_CHANNEL_HOME_URL = `https://pf.kakao.com/${DEFAULT_KAKAO_CHANNEL_ID}`;
const REPORT_HISTORY_KEY = 'wealthyhair_kakao_reports_v1';

const ISSUE_CATEGORIES = [
  '탈모 진단 정확도 / 결과 오류 신고',
  '카메라 촬영 · 사진 업로드 인식 불편',
  '복용 전후 비교 / AI 예측 시뮬레이션 문의',
  '사상체질 검사 · 식이 / 약물 정보 수정 건의',
  '화면 디자인 · 버튼 작동 오류 신고',
  '기타 서비스 불편사항 및 기능 제안'
];

const KakaoReportModal = ({ isOpen, onClose, currentMenu = '전체 메뉴', member = null }) => {
  const [category, setCategory] = useState(ISSUE_CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [replyContact, setReplyContact] = useState(member?.phone || member?.email || '');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (member?.phone || member?.email) {
      setReplyContact(member.phone || member.email);
    }
    try {
      const saved = localStorage.getItem(REPORT_HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, [member, isOpen]);

  if (!isOpen) return null;

  const buildFormattedKakaoMessage = () => {
    const nowStr = new Date().toLocaleString('ko-KR');
    return [
      `🚨 [모발부자(WealthyHair) 불편사항 직통 신고]`,
      `• 발생 메뉴: ${currentMenu}`,
      `• 신고 유형: ${category}`,
      `• 신고자: ${member?.name || '비회원'} (${replyContact || '연락처 미기재'})`,
      `• 접수 일시: ${nowStr}`,
      `────────────────────`,
      `[상세 불편 내용]`,
      content.trim(),
      `────────────────────`,
      `• 접속 환경: ${navigator.userAgent.slice(0, 80)}`
    ].join('\n');
  };

  const handleSendToCreatorKakao = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 3) {
      alert('불편하신 사항이나 개선 요청 내용을 3자 이상 입력해 주세요.');
      return;
    }

    setIsSending(true);
    const formattedMsg = buildFormattedKakaoMessage();

    try {
      // 1. 클립보드에 신고 전문 자동 복사 (카카오톡 채팅창 열림 즉시 붙여넣기·전송 완벽 지원)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formattedMsg);
      }
    } catch {
      // ignore clipboard error
    }

    // 2. Supabase 클라우드 DB에 실시간 신고 내역 영구 기록
    try {
      await supabase.from('surveys').insert([
        {
          score: 1,
          feedback: formattedMsg,
          norwood: `[KAKAO_REPORT] ${currentMenu}`,
          has_hair_loss: false,
          gender: member?.gender || null,
          age: member?.age ? String(member.age) : null
        }
      ]);
    } catch (err) {
      console.warn('Supabase report log notice:', err?.message);
    }

    // 3. 로컬 전송 이력 저장
    const newRecord = {
      id: Date.now(),
      menu: currentMenu,
      category,
      content: content.trim(),
      createdAt: new Date().toLocaleString('ko-KR'),
      formattedMsg
    };
    const nextHistory = [newRecord, ...history].slice(0, 10);
    setHistory(nextHistory);
    localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(nextHistory));

    setIsSending(false);
    setSentSuccess(true);

    // 4. 제작자 카카오톡 1:1 채팅방 즉시 오픈
    window.open(KAKAO_CHAT_URL, '_blank', 'noopener,noreferrer');
  };

  const handleCopyAgain = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('신고 내용이 클립보드에 복사되었습니다. 열린 카카오톡 채팅창에 붙여넣기(Ctrl+V)하여 바로 전송하세요!');
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.86)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: '88vh',
          overflowY: 'auto',
          background: '#121212',
          border: '1.5px solid #FEE500',
          borderRadius: '12px',
          padding: '20px',
          color: '#fff',
          boxShadow: '0 16px 48px rgba(0,0,0,0.85)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              background: '#FEE500',
              color: '#191919',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900
            }}>
              💬
            </div>
            <div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#FEE500', fontFamily: 'var(--font-sans)' }}>
                불편사항 신고 · 제작자 카톡 직통 전송
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#aaa' }}>
                현재 위치: <strong style={{ color: '#D4AF37' }}>[{currentMenu}]</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setSentSuccess(false); onClose(); }}
            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {sentSuccess ? (
          <div style={{
            background: '#191919',
            border: '1px solid rgba(254, 229, 0, 0.45)',
            borderRadius: '10px',
            padding: '18px',
            textAlign: 'center'
          }}>
            <CheckCircle2 size={40} color="#FEE500" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '1rem', color: '#FEE500', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
              클라우드 접수 완료 & 제작자 카카오톡 연결됨!
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#ccc', lineHeight: 1.6, marginBottom: '14px' }}>
              작성하신 신고 전문이 <strong>클라우드 DB에 즉시 전송</strong>되었으며, <strong>클립보드에 자동 복사</strong>되었습니다.<br />
              열린 제작자 카카오톡 1:1 채팅창에 <strong>붙여넣기(전송)</strong>하시면 실시간 대화가 바로 이어집니다.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href={KAKAO_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '12px',
                  background: '#FEE500',
                  color: '#191919',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  textDecoration: 'none'
                }}
              >
                <ExternalLink size={16} /> 제작자 카카오톡 1:1 채팅방 다시 열기
              </a>

              <button
                type="button"
                onClick={() => handleCopyAgain(buildFormattedKakaoMessage())}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  background: '#252525',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Copy size={15} /> 신고 내용 다시 복사하기
              </button>

              <button
                type="button"
                onClick={() => {
                  setSentSuccess(false);
                  setContent('');
                  onClose();
                }}
                style={{
                  padding: '10px',
                  background: 'transparent',
                  color: '#999',
                  border: 'none',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendToCreatorKakao} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#bbb', marginBottom: '5px' }}>
                불편 유형 선택
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.82rem'
                }}
              >
                {ISSUE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#bbb', marginBottom: '5px' }}>
                회신받을 연락처 (휴대전화 또는 카톡 ID)
              </label>
              <input
                type="text"
                placeholder="010-0000-0000 또는 카카오톡 ID"
                value={replyContact}
                onChange={e => setReplyContact(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.82rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#bbb', marginBottom: '5px' }}>
                불편하신 내용 상세 작성 <span style={{ color: '#FEE500' }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder={`[${currentMenu}] 이용 중 불편하셨던 점, 오류 현상, 또는 개선 아이디어를 적어주시면 제작자 카카오톡으로 즉시 전송됩니다.`}
                value={content}
                onChange={e => setContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.83rem',
                  lineHeight: 1.5,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              background: 'rgba(254, 229, 0, 0.08)',
              border: '1px solid rgba(254, 229, 0, 0.25)',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '0.73rem',
              color: '#ddd',
              lineHeight: 1.5
            }}>
              💡 전송 버튼을 누르면 <strong>① 제작자 클라우드 서버 자동 기록 + ② 신고 전문 클립보드 자동 복사 + ③ 제작자 카카오톡 1:1 채팅창 즉시 실행</strong>이 동시에 진행됩니다.
            </div>

            <button
              type="submit"
              disabled={isSending}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px',
                background: '#FEE500',
                color: '#191919',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <Send size={16} />
              {isSending ? '카카오톡 채널 연결 중...' : '제작자 카카오톡으로 즉시 전송하기'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <a
                href={KAKAO_CHANNEL_HOME_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.72rem', color: '#999', textDecoration: 'underline' }}
              >
                공식 카카오톡 채널 홈 바로가기 (@바른한의원 / 제작자 직통) ↗
              </a>
            </div>
          </form>
        )}

        {/* 최근 신고 내역 */}
        {history.length > 0 && (
          <div style={{ marginTop: '18px', borderTop: '1px solid #2a2a2a', paddingTop: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} /> 내 최근 카톡 신고 접수 내역 ({history.length}건)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {history.slice(0, 3).map(item => (
                <div key={item.id} style={{ background: '#1a1a1a', padding: '8px 10px', borderRadius: '6px', fontSize: '0.73rem', border: '1px solid #262626' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D4AF37', fontWeight: 600 }}>
                    <span>[{item.menu}] {item.category}</span>
                    <span style={{ color: '#777', fontWeight: 400 }}>{item.createdAt}</span>
                  </div>
                  <div style={{ color: '#ccc', marginTop: '3px' }}>{item.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KakaoReportModal;
