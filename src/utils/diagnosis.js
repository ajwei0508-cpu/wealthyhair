/**
 * 해외의 Hairloss AI 진단 방식(이미지에서 추출한 특징점 수치화)을 모방하여
 * 노우드(Norwood), 루드비히(Ludwig), BASP 분류법으로 진단하는 코드입니다.
 * 
 * @param {Object} features AI가 이미지에서 추출한 특징 데이터 (가상)
 * @param {string} features.gender - 'male' 또는 'female'
 * @param {number} features.templeRecessionCm - M자/양측두부 파임 깊이 (cm)
 * @param {number} features.frontalRecessionCm - 전두부(앞머리) 전체 후퇴 깊이 (cm)
 * @param {number} features.vertexThinningPercent - 정수리 탈모 진행도 (0~100%)
 * @param {number} features.partingWidthMm - 가르마 두께 (mm)
 * @returns {Object} 노우드, 루드비히, BASP 진단 결과
 */
export function analyzeHairLoss(features) {
  const {
    gender = 'male',
    templeRecessionCm = 0,
    frontalRecessionCm = 0,
    vertexThinningPercent = 0,
    partingWidthMm = 1,
  } = features;

  let norwood = "Stage I (정상)";
  let ludwig = "Normal (정상)";
  let baspBasic; // L, M, C, U
  let baspSpecific = ""; // V, F

  // 1. 노우드 분류법 (Norwood Scale) - 주로 남성형 탈모
  if (gender === 'male') {
    if (templeRecessionCm < 2 && frontalRecessionCm < 2 && vertexThinningPercent < 10) {
      norwood = "Stage I (진행 안됨)";
    } else if (templeRecessionCm < 2 && frontalRecessionCm >= 2 && frontalRecessionCm < 4) {
      norwood = "Stage IIA (초기 전두부 탈모)";
    } else if (templeRecessionCm >= 2 && templeRecessionCm < 4 && vertexThinningPercent < 20) {
      norwood = "Stage II (초기 M자)";
    } else if (templeRecessionCm >= 4 && templeRecessionCm < 6) {
      if (vertexThinningPercent >= 30) {
        norwood = "Stage III Vertex (M자 + 정수리 탈모)";
      } else {
        norwood = "Stage III (중기 M자)";
      }
    } else if (templeRecessionCm < 4 && frontalRecessionCm >= 4 && frontalRecessionCm < 6) {
      norwood = "Stage IIIA (중기 전두부 탈모)";
    } else if (templeRecessionCm >= 6 && frontalRecessionCm < 5) {
      norwood = "Stage IV (깊은 M자 및 정수리 탈모 심화)";
    } else if (frontalRecessionCm >= 6 && frontalRecessionCm < 7) {
      norwood = "Stage IVA (깊은 전두부 탈모)";
    } else if (templeRecessionCm >= 6 && frontalRecessionCm >= 5 && frontalRecessionCm < 7) {
      norwood = "Stage V (전두부 및 정수리 연결 시작)";
    } else if (frontalRecessionCm >= 7 && vertexThinningPercent >= 70) {
      norwood = "Stage VI (광범위한 탈모)";
    } else if (frontalRecessionCm >= 9 && vertexThinningPercent >= 90) {
      norwood = "Stage VII (측면과 후면만 남음)";
    } else if (templeRecessionCm >= 2 || frontalRecessionCm >= 2) {
      norwood = "Stage II (초기 탈모 의심)";
    }
  }

  // 2. 루드비히 분류법 (Ludwig Scale) - 주로 여성형 탈모 (가르마 기준)
  if (gender === 'female') {
    if (partingWidthMm < 3) {
      ludwig = "Normal (정상)";
    } else if (partingWidthMm >= 3 && partingWidthMm < 6) {
      ludwig = "Grade I (초기 가르마 넓어짐)";
    } else if (partingWidthMm >= 6 && partingWidthMm < 10) {
      ludwig = "Grade II (중기 정수리 숱 감소)";
    } else if (partingWidthMm >= 10) {
      ludwig = "Grade III (광범위한 정수리 탈모)";
    }
  }

  // 3. BASP 분류법 (한국인/아시아인에 적합한 통합 분류법)
  // Basic Type: 앞머리 선의 모양 (L, M, C, U)
  if (frontalRecessionCm >= 5 && templeRecessionCm >= 5) {
    baspBasic = "U"; // U자형 후퇴
  } else if (frontalRecessionCm >= 3 && templeRecessionCm < 3) {
    baspBasic = "C"; // C자형 (앞머리 전체 후퇴)
  } else if (templeRecessionCm >= 2.5) {
    baspBasic = "M"; // M자형 후퇴
  } else {
    baspBasic = "L"; // 일자형 정상 유지
  }

  // Specific Type: 특정 부위 밀도 저하 (V: 정수리, F: 앞머리 밀도)
  if (vertexThinningPercent >= 50) {
    baspSpecific += "V3";
  } else if (vertexThinningPercent >= 20) {
    baspSpecific += "V2";
  } else if (vertexThinningPercent >= 5) {
    baspSpecific += "V1";
  }

  if (frontalRecessionCm < 3 && partingWidthMm >= 5) { // 전두부 밀도 저하
    if (partingWidthMm >= 8) baspSpecific += "F3";
    else if (partingWidthMm >= 6) baspSpecific += "F2";
    else baspSpecific += "F1";
  }

  const baspResult = `${baspBasic}형${baspSpecific ? ` (특정 유형: ${baspSpecific})` : ''}`;

  // 상세 설명 생성 로직 (단답형 / 항목별 요약)
  let details = [];
  details.push(`**[주요 측정 결과]**`);
  details.push(`- **측두부 (M자) 파임**: 약 ${templeRecessionCm.toFixed(1)} cm`);
  details.push(`- **전두부 (앞머리) 후퇴**: 약 ${frontalRecessionCm.toFixed(1)} cm`);
  
  if (vertexThinningPercent > 0) {
    details.push(`- **정수리 숱 감소율**: 정상 대비 약 ${vertexThinningPercent.toFixed(1)} % 감소`);
  } else {
    details.push(`- **정수리 숱 감소율**: 정상 (매우 양호)`);
  }

  details.push(`\n**[종합 분석 소견]**`);
  
  if (baspBasic === 'M') {
    details.push(`- 앞머리 전체 후퇴보다 양쪽 관자놀이 파임이 뚜렷한 전형적인 패턴입니다.`);
  } else if (baspBasic === 'C') {
    details.push(`- M자 파임보다는 앞머리 라인 전체가 반원 형태로 넓어지는 패턴입니다.`);
  } else if (baspBasic === 'U') {
    details.push(`- 앞머리와 관자놀이가 모두 깊게 파여 이마가 U자 형태로 넓어진 상태입니다.`);
  } else {
    details.push(`- 헤어라인이 일자 형태로 잘 유지되어 매우 양호한 상태입니다.`);
  }

  if (baspSpecific.includes('V')) {
    details.push(`- 정수리 밀도 저하 소견이 동반되어 정수리 집중 관리가 필요합니다.`);
  } else if (baspSpecific.includes('F')) {
    details.push(`- 앞머리 부근의 전반적인 모발 밀도 저하가 관찰됩니다.`);
  }

  if (gender === 'male') {
    details.push(`- **현재 단계**: 노우드(Norwood) 척도 **${norwood}** 단계 (예방 및 관리 권장)`);
  } else {
    details.push(`- **현재 단계**: 루드비히(Ludwig) 척도 **${ludwig}** 단계 (가르마 폭 ${partingWidthMm.toFixed(1)}mm 기준)`);
  }

  // --- [용어 설명 (사전적 의미)] ---
  details.push(`\n\n**[의학적 분류 기준 설명]**`);
  
  if (baspBasic === 'L') {
    details.push(`- **BASP L형 (Line)**: 앞머리 모발 선이 파임 없이 일자(ㅡ) 형태를 유지하고 있는 정상적인 상태입니다. M자 탈모가 진행되지 않은 가장 이상적인 헤어라인을 의미합니다.`);
  } else if (baspBasic === 'M') {
    details.push(`- **BASP M형 (M-shape)**: 이마 양쪽 끝 관자놀이 부위가 이마 중앙부보다 더 깊게 파고들어 M자 모양으로 후퇴하는 가장 흔한 남성형 탈모 패턴입니다.`);
  } else if (baspBasic === 'C') {
    details.push(`- **BASP C형 (C-shape)**: 이마 라인 전체가 반원(초승달) 형태로 넓어지며 후퇴하는 패턴입니다. M자 파임보다 이마 전체가 넓어지는 것이 특징입니다.`);
  } else if (baspBasic === 'U') {
    details.push(`- **BASP U형 (U-shape)**: 이마 라인이 정수리까지 매우 깊게 후퇴하여, 위에서 보았을 때 U자 형태를 띠는 심각한 탈모 진행 상태입니다.`);
  }

  if (gender === 'male') {
    if (norwood.includes('Stage I ')) {
      details.push(`- **Norwood Stage 1 (1단계)**: 남성 탈모의 국제 기준인 노우드 척도의 가장 첫 단계로, 탈모가 진행되지 않은 청소년 혹은 성인 초기의 정상적인 헤어라인을 의미합니다.`);
    } else if (norwood.includes('Stage IIA')) {
      details.push(`- **Norwood Stage 2A (2A단계)**: M자 파임보다는 앞머리 라인 전체가 약간 뒤로 밀려나는 초기 전두부 탈모 상태를 의미합니다.`);
    } else if (norwood.includes('Stage II ')) {
      details.push(`- **Norwood Stage 2 (2단계)**: 이마 양쪽 모서리가 삼각형 모양으로 약간 후퇴하기 시작하는 M자 탈모의 초기 상태입니다.`);
    } else if (norwood.includes('Stage III Vertex')) {
      details.push(`- **Norwood Stage 3 Vertex (3단계 정수리형)**: M자 파임과 함께 정수리(가마) 부위의 모발이 가늘어지고 원형으로 두피가 비쳐 보이는 상태입니다.`);
    } else if (norwood.includes('Stage III ')) {
      details.push(`- **Norwood Stage 3 (3단계)**: M자 파임이 뚜렷하게 깊어져, 본격적인 탈모 치료가 강하게 권장되는 중기 M자 탈모 상태입니다.`);
    } else if (norwood.includes('Stage IV')) {
      details.push(`- **Norwood Stage 4 (4단계)**: 깊은 M자 파임과 뚜렷한 정수리 탈모가 동시에 진행되지만, 두 부위 사이에 아직 모발 띠가 남아있는 상태입니다.`);
    } else if (norwood.includes('Stage V')) {
      details.push(`- **Norwood Stage 5 (5단계)**: 앞머리 탈모와 정수리 탈모 사이를 좁게 가로막고 있던 모발 띠가 거의 사라지기 직전인 상태입니다.`);
    } else if (norwood.includes('Stage VI')) {
      details.push(`- **Norwood Stage 6 (6단계)**: 앞머리부터 정수리까지의 모발이 모두 빠져 두 탈모 구역이 하나로 완전히 합쳐진 상태입니다.`);
    } else if (norwood.includes('Stage VII')) {
      details.push(`- **Norwood Stage 7 (7단계)**: 노우드 척도의 마지막 단계로, 옆머리와 뒷머리(말발굽 모양)만 남고 위쪽 모발이 모두 소실된 상태입니다.`);
    }
  } else {
    if (ludwig.includes('Normal')) {
      details.push(`- **Ludwig Normal (정상)**: 여성 탈모 기준인 루드비히 척도에서 가르마가 빽빽하고 정상적인 상태를 의미합니다.`);
    } else if (ludwig.includes('Grade I')) {
      details.push(`- **Ludwig Grade 1 (1단계)**: 가르마 선을 중심으로 모발이 가늘어지며 두피가 살짝 비쳐 보이기 시작하는 초기 여성형 탈모입니다.`);
    } else if (ludwig.includes('Grade II')) {
      details.push(`- **Ludwig Grade 2 (2단계)**: 가르마 선 주변의 모발 숱이 현저히 줄어들어 두피가 넓게 노출되는 중기 여성형 탈모입니다.`);
    } else if (ludwig.includes('Grade III')) {
      details.push(`- **Ludwig Grade 3 (3단계)**: 정수리 부위 모발이 거의 소실되어 훤하게 드러나는 심각한 여성형 탈모 상태입니다.`);
    }
  }

  const detailedExplanation = details.join('\n');

  return {
    norwood,
    ludwig,
    basp: baspResult,
    detailedExplanation,
    summary: gender === 'male' 
      ? `분석 결과, 노우드 ${norwood.split(' ')[1]} 단계 및 BASP ${baspBasic}형으로 진단됩니다.` 
      : `분석 결과, 루드비히 ${ludwig.split(' ')[1]} 및 BASP ${baspBasic}형으로 진단됩니다.`
  };
}

export default analyzeHairLoss;
