import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import './AnalysisLoading.css';

const AnalysisLoading = ({ image }) => {
  return (
    <main className="al-main">
      {/* Header Actions (Translucent) */}
      <div className="al-header">
        <button className="al-close-btn" aria-label="닫기">
          <X size={24} />
        </button>
        <div className="al-ai-pill">
          <div className="al-ai-dot"></div>
          <span>Vertex AI 작동 중</span>
        </div>
      </div>

      {/* Camera Viewfinder Area */}
      <div className="al-viewfinder-area">
        {/* Source Image */}
        <div 
          className="al-source-image" 
          style={{ backgroundImage: `url(${image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAG4UQs8BL5OT_2YdPJkcjnUE85cja_eao2RqV8z3rXDtbSSfTsi3DfGh7OC1S_nIMQVWTm-SWVmxNvWo7pGIWBxU7GYbwm0tQTtRFHUCN6Zqjrk2-V0J4ertWr-lhO1MKLbq0jcCbnyK1MlRIVctPMzmy8t40HirGBwbwrv5sCWTXWkoAuH1nmTApr-a-ZlfRskg0UncGnvExjkd3Hz63MVdFgOKfPJljq9msNwxmSp-6K2MaVzW26CkMiDMUCZV6LUEGWaC-ElA'})` }}
        ></div>
        
        {/* Vignette & Darkening Overlay for UI contrast */}
        <div className="al-vignette"></div>
        
        {/* Viewfinder Brackets */}
        <div className="al-brackets">
          <div className="al-bracket top-left"></div>
          <div className="al-bracket top-right"></div>
          <div className="al-bracket bottom-left"></div>
          <div className="al-bracket bottom-right"></div>
        </div>
        
        {/* Scanner Laser Overlay */}
        <div className="al-scanner-laser">
          {/* Core Laser Line */}
          <div className="al-laser-core"></div>
          {/* Laser Glow Trail */}
          <div className="al-laser-trail"></div>
        </div>
      </div>

      {/* Bottom Content Sheet */}
      <div className="al-bottom-sheet-wrap">
        {/* Avatar Illustration (Floating out of the sheet) */}
        <div className="al-avatar-wrap">
          <div className="al-avatar-container">
            <div className="al-avatar-glow"></div>
            <img 
              alt="Avatar" 
              className="al-avatar-img" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRlgWQK8bxrEnXl9yCW06y36sC3hFLtAWdeb7Y5yez-5RbW5JWHBp4mPCVYUsgPOkrxTiTog9-hrbhzXi6Pyw2D_xgwPTk0FE6RgqPsYo5qdRt0JqVBdeu4pQtYjK4TzseJq1OTOfZSbxJFJPwvrWGpU4djJFape7WhjGNfutUIGolyKdBwYtHLT5oPy6_rarB9K9YwGjB7W6SidcjNZ4CpNwJ9CZWOw0YwXiBjRh0F7-CDg4xyZdb_M-kyKo8wgcq4kpQq1sLkw"
            />
          </div>
        </div>

        {/* Card Background */}
        <div className="al-card">
          {/* Medical Accent Bar */}
          <div className="al-accent-bar"></div>
          
          {/* Text Content */}
          <h1 className="al-title">정밀 분석 진행 중</h1>
          <p className="al-desc">
            Vertex AI가 모낭 밀도와<br/>
            <span className="al-highlight">M자 후퇴 각도</span>를 분석하고 있습니다...
          </p>
          
          {/* Medical Progress Bar */}
          <div className="al-progress-track">
            <div className="al-progress-fill"></div>
          </div>
          
          {/* Sub-status */}
          <div className="al-sub-status">
            <ShieldCheck size={16} />
            <span>안전하게 암호화되어 처리됩니다</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AnalysisLoading;
