const fs = require('fs');
let lines = fs.readFileSync('src/components/CameraView.jsx', 'utf-8').split('\n');

let startIndex = lines.findIndex(l => l.includes('onFrame: async () => {'));
let endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('ctx.shadowBlur = 0;'));
let catchEndIndex = lines.findIndex((l, i) => i > endIndex && l.includes('} catch (e) {'));

console.log('startIndex:', startIndex);
console.log('endIndex:', endIndex);

let newOnFrame = `            onFrame: async () => {
              if (videoRef.current && active && !previewImageRef.current) {
                if (isProcessingRef.current) return;
                isProcessingRef.current = true;
                try {
                  if (segmenterRef.current && drawingCanvasRef.current) {
                    segmenterRef.current.segmentForVideo(videoRef.current, performance.now(), (result) => {
                      const canvas = drawingCanvasRef.current;
                      if(!canvas) return;
                      if (videoRef.current && videoRef.current.videoWidth > 0 && (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight)) {
                        canvas.width = videoRef.current.videoWidth;
                        canvas.height = videoRef.current.videoHeight;
                      }
                      const ctx = canvas.getContext('2d');
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      if (result && result.categoryMask) {
                        const mask = result.categoryMask;
                        const maskImageData = new ImageData(mask.width, mask.height);
                        const data = maskImageData.data;
                        const maskData = mask.getAsUint8Array();
                        const halfWidth = mask.width / 2;
                        let targetPixelCount = 0;
                        for (let i = 0; i < maskData.length; i++) {
                          if (maskData[i] === 1 || maskData[i] === 2 || maskData[i] === 3) {
                            targetPixelCount++;
                          }
                          if (maskData[i] === 1) {
                            if (currentStepRef.current === 'vertex') {
                              const x = i % mask.width;
                              if (x < halfWidth) {
                                data[i * 4] = 0;
                                data[i * 4 + 1] = 150;
                                data[i * 4 + 2] = 255;
                                data[i * 4 + 3] = 100;
                              } else {
                                data[i * 4] = 255;
                                data[i * 4 + 1] = 82;
                                data[i * 4 + 2] = 82;
                                data[i * 4 + 3] = 100;
                              }
                            } else {
                              data[i * 4] = 212;
                              data[i * 4 + 1] = 175;
                              data[i * 4 + 2] = 55;
                              data[i * 4 + 3] = 120;
                            }
                          } else {
                            data[i * 4 + 3] = 0;
                          }
                        }
                        setIsTargetDetected(targetPixelCount > (mask.width * mask.height * 0.02));
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = mask.width;
                        tempCanvas.height = mask.height;
                        tempCanvas.getContext('2d').putImageData(maskImageData, 0, 0);
                        ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
                        
                        if (currentStepRef.current !== 'vertex' && latestFaceRef.current && latestFaceRef.current.length > 0) {
                          ctx.beginPath();
                          latestFaceRef.current.forEach((pt, index) => {
                            if (index === 0) ctx.moveTo(pt.x, pt.y);
                            else ctx.lineTo(pt.x, pt.y);
                          });
                          ctx.closePath();
                          ctx.strokeStyle = '#D4AF37';
                          ctx.lineWidth = 2;
                          ctx.stroke();
                        }
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '16px Pretendard, sans-serif';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                        ctx.shadowBlur = 4;
                        ctx.fillText(currentStepRef.current === 'vertex' ? '좌우 가르마 영역 실시간 분석 중...' : 'AI 실시간 모발 영역 인식 중...', 20, 30);
                        ctx.shadowBlur = 0;
                      }
                    });
                  }
                  
                  if (currentStepRef.current !== 'vertex') {
                     await faceMesh.send({image: videoRef.current});
                  }
                } catch (e) {
                  console.error(e);
                } finally {
                  isProcessingRef.current = false;
                }
              }`;

// Let's find the end of the onFrame function (which ends with `            },`)
let endOfOnFrame = lines.findIndex((l, i) => i > startIndex && l.includes('},') && l.trim() === '},');
console.log('endOfOnFrame:', endOfOnFrame);

lines.splice(startIndex, endOfOnFrame - startIndex + 1, newOnFrame, '            },');

fs.writeFileSync('src/components/CameraView.jsx', lines.join('\n'));
console.log('Replaced successfully!');
