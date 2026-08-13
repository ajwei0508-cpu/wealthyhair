import React, { useState, useRef, useEffect } from 'react';
import './AvatarChat.css';

const MOCK_RESPONSES = [
  { keywords: ['깜빡', '안먹', '놓쳤'], text: '시간이 얼마 지나지 않았다면 지금 바로 복용하세요. 하지만 다음 복용 시간이 가깝다면 건너뛰고 다음 날 정해진 시간에 드시는 것이 좋습니다. 두 배 용량을 드시면 안 됩니다.' },
  { keywords: ['부작용', '속쓰', '피곤'], text: '초기 복용 시 경미한 부작용이 있을 수 있으나, 증상이 지속되거나 심하다면 전문의와 상담하는 것이 좋습니다.' },
  { keywords: ['술', '음주'], text: '과도한 음주는 간에 무리를 줄 수 있으므로 탈모약 복용 중에는 피하는 것이 좋습니다.' },
];

const AvatarChat = ({ onClose }) => {
  const [messages, setMessages] = useState([{ sender: 'ai', text: '안녕하세요! 복약 관련해서 궁금한 점이 있으신가요?' }]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userText = input;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');

    // Simple mock logic
    setTimeout(() => {
      let aiResponse = '탈모약 복용은 꾸준함이 생명입니다. 궁금한 점이 더 있다면 전문의와 상담을 권장합니다.';
      for (let rule of MOCK_RESPONSES) {
        if (rule.keywords.some(k => userText.includes(k))) {
          aiResponse = rule.text;
          break;
        }
      }
      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    }, 1000);
  };

  return (
    <div className="avatar-chat-container">
      <div className="chat-header">
        <button className="back-btn" onClick={onClose}>← 뒤로</button>
        <h3>복약지도 AI</h3>
      </div>
      
      <div className="avatar-display">
        {/* Mock Avatar Graphic */}
        <div className="avatar-circle">🤖</div>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`msg-bubble ${msg.sender === 'ai' ? 'ai' : 'user'}`}>
            {msg.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      
      <div className="chat-input-area">
        <input 
          type="text" 
          placeholder="질문을 입력하세요..." 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>전송</button>
      </div>
    </div>
  );
};

export default AvatarChat;
