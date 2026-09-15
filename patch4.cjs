const fs = require('fs');
let content = fs.readFileSync('src/components/CameraView.jsx', 'utf-8');

// 1. Better FaceMesh missing handling
const faceMeshCheck = `if (!FaceMesh) {
      console.error("MediaPipe FaceMesh not loaded from CDN.");
      setCameraError("AI 모델(FaceMesh)을 불러오지 못했습니다. 네트워크 상태를 확인해주세요.");
      return;
    }`;
content = content.replace(/if \(!FaceMesh\) \{\s*console\.error\("MediaPipe FaceMesh not loaded from CDN\."\);\s*return;\s*\}/g, faceMeshCheck);

// 2. Add video.play() to ensure mobile video starts
const playCode = `setHasCamera(true);
        videoRef.current.play().catch(e => console.log("Video play error:", e));`;
content = content.replace('setHasCamera(true);', playCode);

fs.writeFileSync('src/components/CameraView.jsx', content);
console.log('Patch 4 applied!');
