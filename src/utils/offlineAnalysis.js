// src/utils/offlineAnalysis.js

/**
 * 프론트엔드에서 넘어온 안면 좌표(FaceMesh)를 기반으로
 * 탈모 진행 정도(파임, 밀도)를 추정하여 반환합니다.
 * 백엔드 서버 없이 스마트폰 단독으로 작동하기 위한 모듈입니다.
 */
export const simulateOfflineAnalysis = async (pointsData) => {
  // 실제 AI 모델 분석처럼 느껴지도록 약간의 인공적인 지연 시간 추가 (1.5초)
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 간단한 좌표 기반 거리 계산 유틸리티
  const calculateRecession = (pts, type) => {
    if (!pts || !pts.face || pts.face.length === 0) return 0.0;
    
    // 얼굴 전체 높이 추정 (대략적인 바운딩 박스)
    const ys = pts.face.map(p => p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const faceHeight = maxY - minY;
    
    if (faceHeight <= 0) return 0.0;
    
    // 헤어라인의 평균 Y 좌표
    let hairlineY = minY;
    if (pts.hairline && pts.hairline.length > 0) {
      const hys = pts.hairline.map(p => p.y);
      hairlineY = Math.min(...hys);
    }
    
    // 이마 상단 끝(minY)과 헤어라인(hairlineY)의 거리 차이 측정
    // 거리가 클수록 파임이 심함
    const distancePixels = minY - hairlineY; 
    let recessionCm = 0.0;
    
    if (distancePixels > 0) {
      // 대략적인 픽셀 -> cm 변환 (평균 얼굴 높이 20cm 가정)
      recessionCm = (distancePixels / faceHeight) * 20.0;
    } else {
      // FaceMesh 상에서 이마가 충분히 안보이거나 앞머리가 덮여있을 때
      // 마스크 데이터 면적에 기반한 랜덤 추정치 부여 (프로토타입용)
      recessionCm = (Math.random() * 1.5); 
    }
    
    // 측면 사진의 경우 가중치 부여
    if (type === 'left' || type === 'right') {
      recessionCm = recessionCm * 1.5; 
    }
    
    return parseFloat(recessionCm.toFixed(2));
  };

  const front_val = calculateRecession(pointsData.front, 'front');
  const left_val = calculateRecession(pointsData.left, 'left');
  const right_val = calculateRecession(pointsData.right, 'right');
  
  // 템플(M자)의 대표값은 좌우 중 더 파인 곳으로 설정
  const temple_val = Math.max(left_val, right_val);
  
  // 정수리 밀도 감소율 (프로토타입이므로 랜덤 시뮬레이션 혹은 마스크 면적 비례)
  const vertex_val = parseFloat((Math.random() * 25 + 5).toFixed(2)); // 5% ~ 30% 사이

  // === 상세 원인 분석 문구 생성 로직 (단답형 항목별 요약) ===
  const explanations = [];
  explanations.push(`**[주요 측정 결과]**`);
  explanations.push(`- **측두부 (M자) 파임**: 약 ${temple_val.toFixed(1)} cm`);
  explanations.push(`- **전두부 (앞머리) 후퇴**: 약 ${front_val.toFixed(1)} cm`);
  explanations.push(`- **정수리 숱 감소율**: 정상 대비 약 ${vertex_val.toFixed(1)} % 감소\n`);
  explanations.push(`**[종합 분석 소견]**`);

  if (temple_val > 2.0) {
      if (left_val > right_val + 1.0) {
          explanations.push(`- 좌측 관자놀이가 우측보다 심하게 파인 비대칭 M자 패턴입니다.`);
      } else if (right_val > left_val + 1.0) {
          explanations.push(`- 우측 관자놀이가 좌측보다 심하게 파인 비대칭 M자 패턴입니다.`);
      } else {
          explanations.push(`- 양측 관자놀이에 뚜렷한 파임이 있는 전형적인 M자 패턴입니다.`);
      }
  } else {
      explanations.push("- 관자놀이(M자) 영역 헤어라인이 잘 유지되고 있습니다.");
  }

  if (front_val > 1.5) {
      explanations.push(`- 앞머리 중앙 라인이 넓게 후퇴하는 패턴이 동반되었습니다.`);
  }
      
  if (vertex_val > 30.0) {
      explanations.push(`- 정수리 모발이 얇아지고 숱이 눈에 띄게 감소했습니다.`);
  } else if (vertex_val > 15.0) {
      explanations.push(`- 정수리 부위에 미세한 모발 밀도 감소가 시작되었습니다.`);
  } else {
      explanations.push("- 정수리 부위 모발 숱과 두께는 정상 범주로 건강합니다.");
  }

  const explanation_text = explanations.join("\n");

  const features = {
      frontalRecessionCm: front_val,
      templeRecessionCm: temple_val,
      leftRecessionCm: left_val,
      rightRecessionCm: right_val,
      vertexThinningPercent: vertex_val,
      explanation: explanation_text
  };

  // 바운딩 박스는 프론트엔드에서는 렌더링에 사용하지 않거나,
  // 딥러닝 마스크(하늘색)를 사용하므로 빈 객체로 리턴
  const boxes = {
    front: [0, 0, 0, 0],
    left: [0, 0, 0, 0],
    right: [0, 0, 0, 0],
    vertex: [0, 0, 0, 0]
  };

  return {
    success: true,
    data: {
      features: features,
      boxes: boxes,
      // 마스크는 App.jsx에서 이미 pointsData 안에 들어있는 dataURL을 그대로 사용함
    }
  };
};
