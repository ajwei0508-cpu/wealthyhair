import React from 'react';
import { CheckCircle, ChevronLeft, RotateCcw } from 'lucide-react';
import './ReviewView.css';

const ReviewView = ({ photos, onStartAnalysis, onRetakeAll, onBack }) => {
  return (
    <div className="rvw-wrapper">
      <div className="rvw-top-bar">
        <button className="rvw-icon-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <h2 className="rvw-header-title">Review</h2>
        <div style={{ width: 40 }}></div>
      </div>

      <div className="rvw-content">
        <div className="rvw-grid">
          <div className="rvw-grid-item">
            <img src={photos.front} alt="Front" />
            <div className="rvw-label">FRONT</div>
            <CheckCircle className="rvw-check-icon" size={20} color="#cda8fc" fill="#2a1b3d" />
          </div>
          <div className="rvw-grid-item">
            <img src={photos.left} alt="Left" />
            <div className="rvw-label">LEFT</div>
            <CheckCircle className="rvw-check-icon" size={20} color="#cda8fc" fill="#2a1b3d" />
          </div>
          <div className="rvw-grid-item">
            <img src={photos.right} alt="Right" />
            <div className="rvw-label">RIGHT</div>
            <CheckCircle className="rvw-check-icon" size={20} color="#cda8fc" fill="#2a1b3d" />
          </div>
          <div className="rvw-grid-item">
            <img src={photos.vertex} alt="Top" />
            <div className="rvw-label">TOP</div>
            <CheckCircle className="rvw-check-icon" size={20} color="#cda8fc" fill="#2a1b3d" />
          </div>
        </div>
      </div>

      <div className="rvw-bottom">
        <button className="rvw-btn-analyze" onClick={onStartAnalysis}>
          Start AI Analysis
        </button>
        <button className="rvw-btn-retake-all" onClick={onRetakeAll}>
          <RotateCcw size={16} /> RETAKE ALL
        </button>
      </div>
    </div>
  );
};

export default ReviewView;
