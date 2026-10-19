// src/utils/diagnosis.js
// 국제 표준 Hamilton-Norwood 척도, Ludwig 척도, Sinclair 5단계 가르마 척도 및 대한모발학회 BASP(Basic and Specific) 통합 진단 엔진

export function analyzeHairLoss(features) {
  const {
    gender = 'male',
    templeRecessionCm = 0,
    frontalRecessionCm = 0,
    leftRecessionCm = 0,
    rightRecessionCm = 0,
    vertexThinningPercent = 0,
    partingWidthMm = 1.8,
    follicularDensityPerCm2 = 140,
    scalpErythemaPercent = 8.0,
    familyHistory = null,
    duration = null,
  } = features;

  let norwood = 'Stage I (정상)';
  let ludwig = 'Normal (정상)';
  let sinclair = 'Stage 1 (정상 가르마)';
  let baspBasic = 'L';
  let baspSub = '';
  let baspSpecific = '';

  // 1. 남성형 탈모: 해밀턴-노우드 분류법 (Hamilton-Norwood Scale)
  if (gender === 'male') {
    if (templeRecessionCm < 1.8 && frontalRecessionCm < 1.8 && vertexThinningPercent < 15) {
      norwood = 'Stage I (정상 · 진행 안됨)';
    } else if (templeRecessionCm < 2.2 && frontalRecessionCm >= 1.8 && frontalRecessionCm < 3.5) {
      norwood = 'Stage IIA (초기 전두부 후퇴형)';
    } else if (templeRecessionCm >= 1.8 && templeRecessionCm < 3.5 && vertexThinningPercent < 22) {
      norwood = 'Stage II (초기 M자형 탈모)';
    } else if (templeRecessionCm >= 3.5 && templeRecessionCm < 5.2) {
      if (vertexThinningPercent >= 25) {
        norwood = 'Stage III Vertex (중기 M자 + 정수리 복합형)';
      } else {
        norwood = 'Stage III (중기 M자형 탈모)';
      }
    } else if (templeRecessionCm < 3.5 && frontalRecessionCm >= 3.5 && frontalRecessionCm < 5.2) {
      norwood = 'Stage IIIA (중기 전두부 후퇴형)';
    } else if ((templeRecessionCm >= 5.2 && frontalRecessionCm < 5.0) || (templeRecessionCm >= 3.0 && vertexThinningPercent >= 45 && vertexThinningPercent < 65)) {
      norwood = 'Stage IV (깊은 M자 및 정수리 탈모 심화)';
    } else if (frontalRecessionCm >= 5.2 && frontalRecessionCm < 6.5 && vertexThinningPercent < 55) {
      norwood = 'Stage IVA (심화된 전두부 후퇴형)';
    } else if ((templeRecessionCm >= 5.2 && frontalRecessionCm >= 4.8 && vertexThinningPercent >= 55 && vertexThinningPercent < 75) || (vertexThinningPercent >= 60 && vertexThinningPercent < 75)) {
      norwood = 'Stage V (전두부·정수리 가교 모발띠 축소 단계)';
    } else if ((frontalRecessionCm >= 6.2 && vertexThinningPercent >= 72 && vertexThinningPercent < 86) || vertexThinningPercent >= 75) {
      norwood = 'Stage VI (전두부·정수리 융합 광범위 탈모)';
    } else if (frontalRecessionCm >= 7.8 || vertexThinningPercent >= 86) {
      norwood = 'Stage VII (측두·후두부만 잔존한 고도 탈모)';
    } else if (vertexThinningPercent >= 22) {
      norwood = 'Stage III Vertex (정수리 중심 초기-중기 탈모)';
    } else {
      norwood = 'Stage II (초기 탈모 의심)';
    }
  }

  // 2. 여성형 탈모: 루드비히(Ludwig) 척도 + 싱클레어(Sinclair) 5단계 가르마 척도
  if (gender === 'female') {
    if (partingWidthMm < 2.8 && vertexThinningPercent < 16) {
      ludwig = 'Normal (정상 밀도)';
      sinclair = 'Sinclair Stage 1 (정상 중앙 가르마)';
    } else if (partingWidthMm < 4.5 && vertexThinningPercent < 28) {
      ludwig = 'Grade I-1 (경도 초기 가르마 확장)';
      sinclair = 'Sinclair Stage 2 (초기 가르마 확장)';
    } else if (partingWidthMm < 6.5 && vertexThinningPercent < 42) {
      ludwig = 'Grade I-2 (초기-중기 가르마 연모화)';
      sinclair = 'Sinclair Stage 3 (중등도 가르마 확장 · 크리스마스트리 패턴 초기)';
    } else if (partingWidthMm < 10.0 && vertexThinningPercent < 68) {
      ludwig = 'Grade II (중기 정수리 숱 감소 및 두피 비침)';
      sinclair = 'Sinclair Stage 4 (진행된 상부 미만성 밀도 저하)';
    } else {
      ludwig = 'Grade III (고도 광범위 정수리 탈모)';
      sinclair = 'Sinclair Stage 5 (고도 상부 두피 노출)';
    }
  }

  // 3. 대한모발학회 표준 BASP 분류법 (Basic Type: L, M0~3, C0~3, U1~3 / Specific Type: V1~3, F1~3)
  if (frontalRecessionCm >= 5.5 && templeRecessionCm >= 5.5) {
    baspBasic = 'U';
    baspSub = frontalRecessionCm >= 7.5 ? 'U3' : frontalRecessionCm >= 6.5 ? 'U2' : 'U1';
  } else if (frontalRecessionCm >= 2.2 && frontalRecessionCm >= templeRecessionCm * 0.85) {
    baspBasic = 'C';
    baspSub = frontalRecessionCm >= 4.5 ? 'C3' : frontalRecessionCm >= 3.2 ? 'C2' : 'C1';
  } else if (templeRecessionCm >= 1.8) {
    baspBasic = 'M';
    baspSub = templeRecessionCm >= 4.5 ? 'M3' : templeRecessionCm >= 3.0 ? 'M2' : 'M1';
  } else {
    baspBasic = 'L';
    baspSub = 'L (정상 일자형)';
  }

  // Specific Type (V: 정수리 Vertex, F: 전두부 미만성 Frontal)
  const specificList = [];
  if (vertexThinningPercent >= 55) specificList.push('V3');
  else if (vertexThinningPercent >= 28) specificList.push('V2');
  else if (vertexThinningPercent >= 15) specificList.push('V1');

  if (partingWidthMm >= 8.0) specificList.push('F3');
  else if (partingWidthMm >= 5.0) specificList.push('F2');
  else if (partingWidthMm >= 3.0) specificList.push('F1');

  baspSpecific = specificList.join(' + ');
  const baspResult = `${baspSub}형${baspSpecific ? ` (특정유형: ${baspSpecific})` : ''}`;

  const hasHairLoss =
    templeRecessionCm >= 1.8 ||
    frontalRecessionCm >= 1.8 ||
    vertexThinningPercent >= 16 ||
    partingWidthMm >= 2.8;

  // 상세 리포트 구성
  const details = [];
  details.push(`**[정밀 생체 계측 데이터]**`);
  details.push(`- **측두부(M자) 후퇴 깊이**: 최대 ${templeRecessionCm.toFixed(1)} cm (좌측 ${leftRecessionCm.toFixed(1)}cm / 우측 ${rightRecessionCm.toFixed(1)}cm)`);
  details.push(`- **전두부(앞머리 중앙) 후퇴**: 약 ${frontalRecessionCm.toFixed(1)} cm`);
  details.push(`- **정수리 밀도 감소율**: 약 ${vertexThinningPercent.toFixed(1)} % (추정 모낭 밀도: 약 ${follicularDensityPerCm2} hairs/cm²)`);
  details.push(`- **가르마 중심 폭**: 약 ${partingWidthMm.toFixed(1)} mm`);
  details.push(`- **두피 홍반·열감 지수(CIE a*)**: ${scalpErythemaPercent.toFixed(1)} % (${scalpErythemaPercent >= 22 ? '두피 상열감·염증 주의' : '안정적'})`);

  details.push(`\n**[의학적 종합 판정]**`);
  if (gender === 'male') {
    details.push(`- **국제 해밀턴-노우드 분류**: **${norwood}**`);
    details.push(`- **한국형 BASP 분류**: **${baspResult}**`);
  } else {
    details.push(`- **국제 루드비히 분류**: **${ludwig}**`);
    details.push(`- **싱클레어 가르마 척도**: **${sinclair}**`);
    details.push(`- **한국형 BASP 분류**: **${baspResult}**`);
  }

  if (Math.abs(leftRecessionCm - rightRecessionCm) >= 0.8) {
    const worseSide = leftRecessionCm > rightRecessionCm ? '좌측' : '우측';
    details.push(`- **좌·우 비대칭 소견**: ${worseSide} 관자놀이(M자) 후퇴가 반대편보다 약 ${Math.abs(leftRecessionCm - rightRecessionCm).toFixed(1)}cm 더 깊게 진행되어 집중 케어가 요구됩니다.`);
  }

  if (scalpErythemaPercent >= 22) {
    details.push(`- **두피 미세환경 소견**: 두피 적색도(홍반 지수)가 높게 계측되어 두피 열감(상열감) 또는 지루성 미세염증이 모낭 연모화를 가속하고 있을 가능성이 높습니다.`);
  }

  if (familyHistory && familyHistory !== '없음') {
    details.push(`- **유전적 위험도 반영**: 가족력(${familyHistory}) 소인이 확인되어 5α-환원효소 및 안드로겐 수용체 민감도에 따른 조기 방어 치료가 특히 중요합니다.`);
  }

  details.push(`\n**[맞춤 임상 치료 가이드라인]**`);
  if (!hasHairLoss) {
    details.push(`- 현재 헤어라인과 정수리 모낭 밀도가 정상 범주(약 ${follicularDensityPerCm2} hairs/cm²)로 건강하게 유지되고 있습니다. 고혈당·트랜스지방 식이를 피하고 두피 청결 및 항산화 영양(비오틴·아연·검은콩) 관리를 지속하세요.`);
  } else if (gender === 'male') {
    if (baspBasic === 'M' || templeRecessionCm >= 2.5) {
      details.push(`- **전측두부(M자) 방어 전략**: M자 부위는 모세혈관 분포가 적고 1·2형 5α-환원효소가 모두 작용하므로, 전문의 진료를 통해 경구 5α-환원효소 억제제(피나스테리드 1mg 또는 두타스테리드 0.5mg)와 외용 미녹시딜 5% 폼의 복합요법이 가장 높은 임상 근거(Level 1A)를 가집니다.`);
    }
    if (specificList.includes('V1') || specificList.includes('V2') || specificList.includes('V3')) {
      details.push(`- **정수리 밀도 회복 전략**: 정수리 연모화 구역은 약물 반응성이 가장 뛰어난 부위입니다. 경구 약물 치료와 함께 미녹시딜 도포 시 3~6개월 내 유의미한 모발 굵기 회복을 기대할 수 있습니다.`);
    }
  } else {
    details.push(`- **여성형 가르마·정수리 회복 전략**: 여성형 탈모(FPHL)는 전두부 헤어라인은 유지되면서 가르마가 크리스마스트리 형태로 넓어지는 특징이 있습니다. 외용 미녹시딜(3~5% 폼) 1일 1~2회 도포를 1차 치료로 권장하며, 다낭성난소증후군이나 안드로겐 과잉 동반 시 전문의 상담하에 스피로노락톤·알파트라디올 및 저장철(페리틴 ≥70ng/mL)·비오틴·아연 보충이 권장됩니다.`);
  }

  return {
    norwood,
    ludwig,
    sinclair,
    basp: baspResult,
    hasHairLoss,
    detailedExplanation: details.join('\n'),
    summary: gender === 'male'
      ? `정밀 계측 결과, 해밀턴-노우드 ${norwood} 및 한국형 BASP ${baspResult}으로 분석되었습니다.`
      : `정밀 계측 결과, 루드비히 ${ludwig} (${sinclair}) 및 BASP ${baspResult}으로 분석되었습니다.`
  };
}

export default analyzeHairLoss;
