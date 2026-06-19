import React from 'react';
import './ResultView.css';

const ResultView = ({ image, onReset, diagnosisData }) => {
  // Use real data from backend, or fallback to mock data if API failed
  const resultStage = diagnosisData?.stage || '노우드 2단계';
  const densityScore = diagnosisData?.density_score || 78;
  const rednessScore = diagnosisData?.redness_score || 15;
  
  const resultDesc = diagnosisData 
    ? `모발 픽셀 밀도 점수: ${densityScore}점 / 두피 염증(붉은기) 점수: ${rednessScore}점`
    : '초기 M자 진행 중. 양측 이마 라인의 후퇴가 관찰됩니다.';

  return (
    <main className="rv-main">
      {/* TopAppBar */}
      <header className="rv-header">
        <div className="rv-header-left">
          <img alt="Avatar" className="rv-avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRC-vHoNQVgwgrgLAUoEVpyDnk6MRv8F5bKAiPDFElb6IrgcmTQuOoDZRBpV69E_WvOE97Y3wlZsA9j15XYTLsEbCD-QNTOZLJ2AJoBPT_bvgVrfH3bXsGEt-Np2Cv39z7NesjISNgEbjAKVrzLQOJB0vuw_imCevXM8CzHQjMaHx6frvYwEzz58l_uuCTOS4_gsxHvEJmf3-GuNH28o1mVNDRMdzh1TsZMsb0d8v52jJURHt66kni2NZ01UnelMC4wIK0nnj9dg"/>
          <h1 className="rv-title">HairHealth AI</h1>
        </div>
        <button className="rv-icon-btn">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* Content Area */}
      <div className="rv-content">
        {/* Result Image Area */}
        <section className="rv-image-section">
          <img alt="Forehead analysis image" className="rv-main-image" src={image || "https://lh3.googleusercontent.com/aida-public/AB6AXuAG4UQs8BL5OT_2YdPJkcjnUE85cja_eao2RqV8z3rXDtbSSfTsi3DfGh7OC1S_nIMQVWTm-SWVmxNvWo7pGIWBxU7GYbwm0tQTtRFHUCN6Zqjrk2-V0J4ertWr-lhO1MKLbq0jcCbnyK1MlRIVctPMzmy8t40HirGBwbwrv5sCWTXWkoAuH1nmTApr-a-ZlfRskg0UncGnvExjkd3Hz63MVdFgOKfPJljq9msNwxmSp-6K2MaVzW26CkMiDMUCZV6LUEGWaC-ElA"}/>
          <div className="rv-image-overlay"></div>
          
          <div className="rv-box rv-box-left">
            <span className="rv-box-label">주의</span>
          </div>
          <div className="rv-box rv-box-right">
            <span className="rv-box-label">주의</span>
          </div>
        </section>

        {/* Diagnosis Result Card */}
        <section className="rv-card">
          <span className="rv-card-badge">Analysis Complete</span>
          <h2 className="rv-card-title">진단 결과: {resultStage}</h2>
          <p className="rv-card-desc">{resultDesc}</p>
        </section>

        {/* Concierge Avatar & Message */}
        <section className="rv-concierge">
          <div className="rv-c-avatar-wrap">
            <img alt="Concierge Avatar" className="rv-c-avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRC-vHoNQVgwgrgLAUoEVpyDnk6MRv8F5bKAiPDFElb6IrgcmTQuOoDZRBpV69E_WvOE97Y3wlZsA9j15XYTLsEbCD-QNTOZLJ2AJoBPT_bvgVrfH3bXsGEt-Np2Cv39z7NesjISNgEbjAKVrzLQOJB0vuw_imCevXM8CzHQjMaHx6frvYwEzz58l_uuCTOS4_gsxHvEJmf3-GuNH28o1mVNDRMdzh1TsZMsb0d8v52jJURHt66kni2NZ01UnelMC4wIK0nnj9dg"/>
          </div>
          <div className="rv-c-message">
            <p>너무 걱정 마세요! 지금부터 체계적으로 관리하면 충분히 개선될 수 있어요. 저희가 도와드릴게요.</p>
            <div className="rv-c-pointer"></div>
          </div>
        </section>
      </div>

      {/* CTA Button */}
      <div className="rv-cta-container">
        <button className="rv-cta-btn">
          <span className="material-symbols-outlined filled">local_pharmacy</span>
          🌿 내 탈모 유형에 맞춘 특허 한약 샴푸 보러가기
        </button>
      </div>

      {/* BottomNavBar */}
      <nav className="rv-bottom-nav">
        <div className="rv-nav-inner">
          <a className="rv-nav-item active" href="#" onClick={(e) => { e.preventDefault(); onReset(); }}>
            <span className="material-symbols-outlined filled">home</span>
            <span>Home</span>
          </a>
          <a className="rv-nav-item" href="#">
            <span className="material-symbols-outlined">history</span>
            <span>History</span>
          </a>
          <a className="rv-nav-item" href="#">
            <span className="material-symbols-outlined">shopping_bag</span>
            <span>Shop</span>
          </a>
        </div>
      </nav>
    </main>
  );
};

export default ResultView;
