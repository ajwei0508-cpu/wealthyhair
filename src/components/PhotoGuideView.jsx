import React from 'react';
import PhotoGuideModal from './PhotoGuideModal';
import './PhotoGuideView.css';

const PhotoGuideView = ({ onContinue }) => {
  return (
    <div className="pgv-full-screen-container">
      <PhotoGuideModal 
        isOpen={true} 
        isStandalone={true}
        onStartScanning={onContinue} 
      />
    </div>
  );
};

export default PhotoGuideView;
