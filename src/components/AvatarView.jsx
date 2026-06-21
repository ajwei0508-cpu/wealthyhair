import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Send, User, Loader2, Bell, X } from 'lucide-react';
import './AvatarView.css';

// D-ID API Credentials (DO NOT EXPOSE IN PRODUCTION - MVP USE ONLY)
const DID_API_KEY = "YWp3ZWkwNTA4QGdtYWlsLmNvbQ:MRbV4pRuSBmdNqHi9l4n6";
const DID_AUTH = "Basic " + btoa(DID_API_KEY);

const AvatarView = ({ onBack, diagnosisData }) => {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: '안녕하세요! 당신의 전담 매니저 아바타입니다. 오늘 진단받은 모발/두피 상태를 바탕으로 궁금한 점이나 관리 습관에 대해 편하게 물어보세요!' }
  ]);
  const [input, setInput] = useState('');
  
  // Customization states
  const [avatarName, setAvatarName] = useState('나의 아바타 매니저');
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Alarm states
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [medType, setMedType] = useState('피나스테리드 1정 (먹는약)');
  const [alarmTime, setAlarmTime] = useState('09:00');
  
  // Avatar states
  const [avatarImg, setAvatarImg] = useState(null); // Local preview image
  const [didSourceUrl, setDidSourceUrl] = useState(null); // D-ID server image URL
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null); // Playing video URL
  const [isGenerating, setIsGenerating] = useState(false); // Loading state for D-ID API
  
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const videoRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  // 1. Upload Image to D-ID Server
  const uploadImageToDID = async (file) => {
    try {
      const formData = new FormData();
      // Rename file to avoid InvalidFileNameError if the original name has Korean/Unicode characters
      const safeFile = new File([file], "avatar.jpg", { type: file.type });
      formData.append('image', safeFile);

      const res = await fetch('https://api.d-id.com/images', {
        method: 'POST',
        headers: {
          'Authorization': DID_AUTH
        },
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setDidSourceUrl(data.url);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: `[에러] 이미지 업로드 실패: ${JSON.stringify(data)}` }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'ai', text: `[에러] 이미지 업로드 중 네트워크 오류 발생 (CORS 등): ${e.message}` }]);
    }
  };

  // 2. Handle File Input Change
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImg(reader.result);
        setCurrentVideoUrl(null); // Reset video
        
        setMessages(prev => {
          const newMsg = [
            ...prev, 
            { sender: 'ai', text: '멋진 사진이네요! 이제 제가 이 모습으로 답변해 드릴게요. 말을 걸어보세요!' }
          ];
          scrollToBottom();
          return newMsg;
        });
      };
      reader.readAsDataURL(file);

      // Upload to D-ID in background
      uploadImageToDID(file);
    }
  };

  // 3. Create Talk Video using D-ID API
  const generateDIDVideo = async (text) => {
    if (!didSourceUrl) return null;
    
    try {
      setIsGenerating(true);
      setCurrentVideoUrl(null); // Clear previous video so spinner doesn't overlay on old video
      
      // Create Talk
      const talkRes = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers: {
          'Authorization': DID_AUTH,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_url: didSourceUrl,
          script: {
            type: 'text',
            input: text,
            provider: {
              type: 'microsoft',
              voice_id: 'ko-KR-SunHiNeural'
            }
          },
          config: {
            fluent: true,
            pad_audio: 0.0
          }
        })
      });
      const talkData = await talkRes.json();
      const talkId = talkData.id;
      
      if (!talkId) {
        setMessages(prev => [...prev, { sender: 'ai', text: `[에러] 비디오 생성 API 호출 실패: ${JSON.stringify(talkData)}` }]);
        setIsGenerating(false);
        return null;
      }

      // Poll Status
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout
        
        const interval = setInterval(async () => {
          attempts++;
          if (attempts > maxAttempts) {
            clearInterval(interval);
            setIsGenerating(false);
            setMessages(prev => [...prev, { sender: 'ai', text: `[에러] 비디오 생성 시간 초과 (60초)` }]);
            reject(new Error("Timeout"));
            return;
          }
          
          try {
            const statusRes = await fetch(`https://api.d-id.com/talks/${talkId}`, {
              method: 'GET',
              headers: { 'Authorization': DID_AUTH }
            });
            const statusData = await statusRes.json();
            
            if (statusData.status === 'done') {
              clearInterval(interval);
              setIsGenerating(false);
              resolve(statusData.result_url);
            } else if (statusData.status === 'started' || statusData.status === 'created') {
              // 정상 진행중 - 계속 대기
            } else {
              // error, rejected, failed 등 기타 모든 상태
              clearInterval(interval);
              setIsGenerating(false);
              console.error("D-ID Error Status:", statusData);
              // 에러 메시지 대신 안내 메시지 출력하고 fallback (비디오 없이 텍스트만)
              setMessages(prev => [...prev, { sender: 'ai', text: `[안내] 아바타 영상 처리에 실패했습니다 (상태: ${statusData.status}). 텍스트로 답변합니다.` }]);
              resolve(null);
            }
          } catch (err) {
            clearInterval(interval);
            setIsGenerating(false);
            reject(err);
          }
        }, 1000);
      });
      
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'ai', text: `[에러] 비디오 생성 중 예외 발생: ${e.message}` }]);
      setIsGenerating(false);
      return null;
    }
  };

  // 4. Handle Chat Send
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    scrollToBottom();

    // AI Logic (MVP Hardcoded)
    let reply = "꾸준한 두피 관리와 스트레스 완화가 중요합니다. 정확한 처방은 피부과 전문의와 상담하는 것을 권장드립니다.";
    if (userMsg.includes('샴푸') || userMsg.includes('영양제')) {
      reply = "탈모 완화 기능성 샴푸와 비오틴 등의 영양제 섭취가 도움이 될 수 있습니다.";
    } else if (userMsg.includes('병원') || userMsg.includes('심각')) {
      reply = "현재 진단된 단계에 따라 초기 약물 치료가 매우 효과적일 수 있으니, 가까운 병원 방문을 권장합니다.";
    } else if (userMsg.includes('관리') || userMsg.includes('습관')) {
      reply = "매일 저녁 올바른 방법으로 샴푸하고 충분한 수면을 취하는 것이 필수적입니다.";
    } else if (userMsg.includes('안녕') || userMsg.includes('반가워')) {
      reply = "반갑습니다! 오늘 하루는 어떠셨나요? 헤어 관리 외에도 편하게 일상 이야기를 나누셔도 좋아요.";
    }

    // 1. Show text immediately so user doesn't wait
    setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    scrollToBottom();

    // 2. Generate and play video in background
    if (didSourceUrl) {
       try {
         const videoUrl = await generateDIDVideo(reply);
         if (videoUrl) {
           setCurrentVideoUrl(videoUrl);
         }
       } catch (err) {
         console.error("Video generation error:", err);
       }
    } else {
       await new Promise(r => setTimeout(r, 1000));
    }
  };

  // Handle video end
  const handleVideoEnded = () => {
    // We can keep the last frame or revert to static image
    // For now, keeping the video element paused on last frame looks natural.
  };

  // Alarm Logic
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("이 브라우저는 알림을 지원하지 않습니다.");
      return false;
    }
    if (Notification.permission === 'granted') return true;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const simulateAlarm = async () => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      alert("알림 권한을 허용해주세요.");
      return;
    }
    setShowAlarmModal(false);
    
    // UI Feedback
    setMessages(prev => [...prev, { sender: 'ai', text: `[시스템] 알람이 설정되었습니다. (테스트를 위해 3초 뒤 울립니다)` }]);
    scrollToBottom();
    
    // Simulate web push
    setTimeout(() => {
      const notification = new Notification('아바타 매니저', {
        body: `약 드실 시간이에요! (${medType})`,
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Trigger Avatar to speak
      triggerAlarmMessage();
    }, 3000);
  };

  const triggerAlarmMessage = async () => {
    const reply = `안녕하세요! 지금 설정하신 ${medType}을(를) 드실 시간입니다. 꾸준한 복약이 가장 중요하니 잊지 말고 꼭 챙겨주세요!`;
    setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    scrollToBottom();

    if (didSourceUrl) {
       try {
         const videoUrl = await generateDIDVideo(reply);
         if (videoUrl) {
           setCurrentVideoUrl(videoUrl);
         }
       } catch (err) {
         console.error("Video generation error:", err);
       }
    } else {
      setMessages(prev => [...prev, { sender: 'ai', text: '[안내] 비디오를 생성하려면 먼저 프로필 사진을 업로드해주세요.' }]);
      scrollToBottom();
    }
  };

  return (
    <div className="av-container">
      <header className="av-header">
        <button className="av-back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        {isEditingName ? (
          <input 
            type="text" 
            value={avatarName} 
            onChange={e => setAvatarName(e.target.value)} 
            onBlur={() => setIsEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
            autoFocus
            style={{background:'transparent', color:'var(--text-main)', border:'1px solid var(--accent-gold)', fontSize:'18px', padding:'4px', outline:'none', borderRadius:'0', textAlign:'center', width:'150px'}}
          />
        ) : (
          <h1 onClick={() => setIsEditingName(true)} style={{cursor: 'pointer', flex: 1, textAlign: 'center', margin: 0}} title="클릭하여 이름 변경">{avatarName} ✎</h1>
        )}
        <button className="av-back-btn" onClick={() => setShowAlarmModal(true)} title="알림 설정">
          <Bell size={24} />
        </button>
      </header>
      
      {/* Alarm Settings Modal */}
      {showAlarmModal && (
        <div className="av-modal-overlay">
          <div className="av-modal">
            <div className="av-modal-header">
              <h2>복약 알림 설정</h2>
              <button className="av-modal-close" onClick={() => setShowAlarmModal(false)}><X size={24} /></button>
            </div>
            <div className="av-modal-body">
              <label className="av-modal-label">복약 종류</label>
              <select 
                className="av-modal-select"
                value={medType}
                onChange={(e) => setMedType(e.target.value)}
              >
                <option value="피나스테리드 1정 (먹는약)">피나스테리드 1정 (먹는약)</option>
                <option value="두타스테리드 1정 (먹는약)">두타스테리드 1정 (먹는약)</option>
                <option value="미녹시딜 5% (바르는약)">미녹시딜 5% (바르는약)</option>
                <option value="탈모 영양제 (비오틴 등)">탈모 영양제 (비오틴 등)</option>
              </select>

              <label className="av-modal-label" style={{marginTop: '16px'}}>알림 시간</label>
              <input 
                type="time" 
                className="av-modal-input"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
              />
              <p className="av-modal-hint">* 웹 푸시(Web Push) 알림이 제공됩니다.</p>
            </div>
            <div className="av-modal-footer">
              <button className="av-modal-btn" onClick={simulateAlarm}>3초 뒤 알림 테스트</button>
            </div>
          </div>
        </div>
      )}

      {/* 2D Avatar Display Section */}
      <section className="av-avatar-section">
        {/* Loading overlay */}
        {isGenerating && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="lucide-spin" size={40} color="var(--accent-gold)" style={{ animation: 'spin 2s linear infinite' }} />
            <span style={{ marginTop: '10px', fontSize: '14px', color: 'var(--accent-gold)' }}>아바타 생성 중...</span>
          </div>
        )}

        {currentVideoUrl ? (
          <video 
            ref={videoRef}
            src={currentVideoUrl} 
            className="av-avatar-image" 
            autoPlay 
            playsInline
            controls
            onEnded={handleVideoEnded}
            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
          />
        ) : avatarImg ? (
          <img src={avatarImg} alt="My Avatar" className="av-avatar-image" />
        ) : (
          <div className="av-avatar-placeholder">
            <User size={48} color="var(--accent-gold)" />
          </div>
        )}
        
        <input 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }} 
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
        {!avatarImg && (
          <button className="av-upload-btn" onClick={() => fileInputRef.current.click()} style={{ zIndex: 20 }}>
            <Upload size={18} />
            원하는 사진 업로드 (연예인 등)
          </button>
        )}
      </section>

      {/* Chat Section */}
      <section className="av-chat-section">
        <div className="av-chat-messages" ref={scrollRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`av-message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
        </div>
        
        <div className="av-chat-input-area">
          <button className="av-upload-icon-btn" onClick={() => fileInputRef.current.click()} title="사진 업로드" style={{ marginRight: '8px' }}>
            <Upload size={20} />
          </button>
          <input 
            type="text" 
            className="av-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지를 입력하세요..."
            disabled={isGenerating}
          />
          <button className="av-send-btn" onClick={handleSend} disabled={isGenerating}>
            <Send size={20} />
          </button>
        </div>
      </section>
      
      {/* Add spin animation locally just for the loader */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default AvatarView;
