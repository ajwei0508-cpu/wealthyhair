const fs = require('fs');
let content = fs.readFileSync('src/components/CameraView.jsx', 'utf-8');

// 1. Add isProcessingRef
content = content.replace(
  'const previewImageRef = useRef(previewImage);',
  'const previewImageRef = useRef(previewImage);\n  const isProcessingRef = useRef(false);'
);

// 2. Add navigator.mediaDevices check
const cameraCheck = `if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("이 브라우저에서는 카메라를 지원하지 않습니다. (HTTPS 환경이거나 권한을 확인해주세요)");
      return;
    }

    navigator.mediaDevices.getUserMedia({`;
content = content.replace('navigator.mediaDevices.getUserMedia({', cameraCheck);

// 3. Fix onFrame memory leak using regex (safest way to replace multiline block)
content = content.replace(
/onFrame: async \(\) => \{\s*if \(videoRef\.current && active && !previewImageRef\.current\) \{\s*\/\/ FaceMesh 업데이트 \(정수리 촬영 제외\)\s*if \(currentStepRef\.current !== 'vertex'\) \{\s*try \{\s*\/\/ await를 빼고 백그라운드에서 처리하도록 하여 Segmenter 블로킹을 방지합니다\.\s*faceMesh\.send\(\{image: videoRef\.current\}\)\.catch\(e => console\.log\("FaceMesh error:", e\)\);\s*\} catch \(e\) \{\}\s*\}\s*\/\/ 실시간 Segmentation \(하늘색\/골드색 머리카락 마스크 그리기\) - 모든 스텝에서 항상 실행\s*if \(segmenterRef\.current && drawingCanvasRef\.current\) \{\s*try \{\s*segmenterRef\.current\.segmentForVideo\(videoRef\.current, performance\.now\(\), \(result\) => \{/g,
`onFrame: async () => {
              if (videoRef.current && active && !previewImageRef.current) {
                if (isProcessingRef.current) return;
                isProcessingRef.current = true;
                
                try {
                  // 실시간 Segmentation
                  if (segmenterRef.current && drawingCanvasRef.current) {
                    segmenterRef.current.segmentForVideo(videoRef.current, performance.now(), (result) => {`
);

content = content.replace(
/ctx\.shadowBlur = 0;\s*\}\s*\}\);\s*\} catch \(e\) \{\s*\}\s*\}\s*\}\s*\},/g,
`ctx.shadowBlur = 0;
                        }
                      });
                  }
                  
                  // FaceMesh 업데이트
                  if (currentStepRef.current !== 'vertex') {
                     await faceMesh.send({image: videoRef.current});
                  }
                } catch(e) {
                   console.error(e);
                } finally {
                   isProcessingRef.current = false;
                }
              }
            },`
);

fs.writeFileSync('src/components/CameraView.jsx', content);
console.log('Patched CameraView.jsx');
