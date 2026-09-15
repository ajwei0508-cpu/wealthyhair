const fs = require('fs');
let content = fs.readFileSync('src/components/CameraView.jsx', 'utf-8');

// 1. Add isProcessingRef
if (!content.includes('const isProcessingRef = useRef(false);')) {
  content = content.replace(
    'const previewImageRef = useRef(previewImage);',
    'const previewImageRef = useRef(previewImage);\n  const isProcessingRef = useRef(false);'
  );
}

// 2. Add navigator.mediaDevices check
const cameraCheck = `if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("이 브라우저에서는 카메라를 지원하지 않습니다. (HTTPS 환경이거나 브라우저 권한을 확인해주세요)");
      return;
    }

    navigator.mediaDevices.getUserMedia({`;
if (!content.includes('이 브라우저에서는 카메라를 지원하지 않습니다.')) {
  content = content.replace('navigator.mediaDevices.getUserMedia({', cameraCheck);
}

fs.writeFileSync('src/components/CameraView.jsx', content);
console.log('Final patch done!');
