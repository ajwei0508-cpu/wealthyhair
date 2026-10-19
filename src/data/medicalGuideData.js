// src/data/medicalGuideData.js
// 임상 약리학(FDA·식약처 허가사항, Micromedex, 학술 논문) 기반 탈모 치료제·병용금기 양약·부작용·금기식품 데이터베이스

export const medicalData = [
  {
    id: 'finasteride',
    type: '피나스테리드 1mg (남성형 탈모 표준 1차 치료제)',
    ingredient: 'Finasteride 1mg',
    original: {
      name: '프로페시아정 1mg (Propecia)',
      manufacturer: '한국오가논 / MSD (미국 FDA 1997년 최초 승인)'
    },
    generics: [
      '모나드정 (JW신약)',
      '피나테드정 (한미약품)',
      '마이페시아정 (제뉴원사이언스)',
      '모모페시아정 (더유제약)',
      '베아리모정 (대웅제약)',
      '피나시드정 (케이에스제약)',
      '피나온정 (라온파마)',
      '헤어그로정 (한올바이오파마)',
      '피나스로정 (알리코제약)',
      '미노페시아정 (현대약품)',
      '다모케어정 (명문제약)',
      '피나시아정 (한국프라임제약)',
      '피나시딜정 (동국제약)',
      '프로스테리드정 (한국휴텍스제약)'
    ],
    halfLife: '약 5~6시간 (혈중 반감기), 조직 내 효소 결합 효과는 약 3~4주 지속 (헌혈 금지 기간: 중단 후 1개월)',
    efficacy: '모낭의 제2형 5α-환원효소(Type II 5α-reductase)를 선택적으로 억제하여 테스토스테론이 모낭 파괴 호르몬인 DHT(디하이드로테스토스테론)로 전환되는 것을 약 65~70% 차단합니다. 정수리 및 전두부 모낭 소형화를 억제하고 생장기 모발 비율을 회복시킵니다.',
    sideEffects: '성욕 감퇴(1.8%), 발기부전(1.3%), 사정량 감소(1.2%), 유방 압통·여성형 유방증(0.4~1%), 우울감·브레인포그(집중력 저하), 간효소(AST/ALT) 수치 일시 상승 등이 보고됩니다.',
    contraindications: '① 가임기 여성 및 임산부는 부서진 정제를 만지는 것만으로도 경피 흡수되어 남성 태아 외부생식기 기형(요도하열 등)을 유발하므로 절대 접촉 및 복용 금기(FDA 임부 금기 X등급). ② 복용 중 및 중단 후 1개월간 헌혈 절대 금지. ③ 전립선특이항원(PSA) 수치를 약 50% 낮추므로 건강검진 시 반드시 의사에게 복용 사실을 알려 측정치의 2배로 보정 해석해야 합니다.'
  },
  {
    id: 'dutasteride',
    type: '두타스테리드 0.5mg (남성형 탈모 — M자·정수리 강력 억제)',
    ingredient: 'Dutasteride 0.5mg',
    original: {
      name: '아보다트연질캡슐 0.5mg (Avodart)',
      manufacturer: 'GSK / 글락소스미스클라인 (한국 식약처 2009년 세계 최초 탈모 적응증 승인)'
    },
    generics: [
      '다모다트연질캡슐 (제일약품)',
      '두테드연질캡슐 (한미약품)',
      '네오다트연질캡슐 (JW신약)',
      '두타텍트연질캡슐 (대원제약)',
      '두타모아액티브정 / 연질캡슐 (JW중외제약)',
      '아보테리드연질캡슐 (종근당)'
    ],
    halfLife: '약 3~5주 (매우 긴 반감기로 중단 후에도 최대 4~6개월간 혈중 잔류 — 헌혈 금지 기간: 중단 후 6개월)',
    efficacy: '제1형(피지선·두피 전반 분포)과 제2형(모낭 유두세포 분포) 5α-환원효소를 모두 이중 억제하여 혈중 DHT를 약 90~92%, 두피 내 DHT를 크게 감소시킵니다. 다수의 임상 연구(Olsen et al. JAAD 2006, Gubelin Harcha et al. JAAD 2014)에서 M자(전측두부) 및 정수리 모발 수 증가 폭이 피나스테리드 1mg 대비 유의미하게 높게 나타났습니다.',
    sideEffects: '성욕 감소(3.3~4.5%), 발기부전(4.7~6.0%), 사정장애(1.4~1.8%), 유방 불편감·여성형 유방(1.3%), 피지 분비 감소로 인한 두피·피부 건조감, 정자 수 및 운동성 감소 가능성.',
    contraindications: '① 반감기가 약 5주로 매우 길어 복용 중단 후 최소 6개월간 헌혈을 절대 금지합니다. ② 연질캡슐 내용물이 누출된 경우 가임기 여성·소아의 피부 접촉을 엄격히 금합니다. ③ 간 대사(CYP3A4/CYP3A5) 의존도가 높으므로 중증 간장애 환자에게는 투여하지 않습니다.'
  },
  {
    id: 'minoxidil_topical',
    type: '미녹시딜 외용제 3%·5% (남성/여성 공통 바르는 발모제)',
    ingredient: 'Minoxidil Topical 2% / 3% / 5%',
    original: {
      name: '로게인폼 5% (Rogaine Foam)',
      manufacturer: '존슨앤드존슨 / 켄뷰 (FDA 승인 외용 일반의약품)'
    },
    generics: [
      '마이녹실액 3%·5% / 마이녹실 폼 (현대약품)',
      '동성 미녹시딜액 (동성제약)',
      '모바렌 폼에어로졸 (대웅제약)',
      '마이딜 폼에어로졸 (JW신약)',
      '카필러스 폼에어로졸 (동아제약)',
      '미녹시 폼에어로졸 (신신제약)',
      '목시딜액 (한미약품)',
      '케어모닉폼 (더유제약)'
    ],
    halfLife: '외용 도포 시 전신 흡수율 평균 1.4~2.0% (피부 내 저류 후 약 4일간 서서히 배설)',
    efficacy: '모낭 평활근의 ATP-민감성 칼륨 채널(KATP channel)을 개방하여 모유두 주변 미세혈관을 확장하고, 혈관내피성장인자(VEGF) 발현을 촉진합니다. 휴지기(Telogen) 모낭을 조기에 생장기(Anagen)로 진입시키고 생장기 기간을 연장하여 연모화된 솜털을 굵은 성모로 전환합니다.',
    sideEffects: '사용 시작 2~6주 차 초기 쉐딩(Shedding) 현상, 두피 소양감·각질·접촉성 피부염(주로 액상 제형의 프로필렌글리콜 PG 용매 알레르기 — 폼 제형 변경 시 완화), 안면·구레나룻 다모증, 어지러움, 두통.',
    contraindications: '① 반려묘(고양이)·반려견에게 치명적 맹독성: 고양이는 미녹시딜을 해독하는 글루쿠론산 전이효소(UGT)가 결핍되어 베개에 묻은 극소량만 핥아도 급성 폐수종·심부전으로 사망할 수 있으므로 격리 보관이 필수입니다. ② 두피에 상처·화상·심한 염증이 있는 경우 전신 흡수율이 급증하므로 도포 금지.'
  },
  {
    id: 'minoxidil_oral',
    type: '경구 미녹시딜 저용량 (LDOM — 먹는 미녹시딜)',
    ingredient: 'Oral Minoxidil (0.625mg ~ 5mg Off-label)',
    original: {
      name: '현대미녹시딜정 5mg',
      manufacturer: '현대약품 (원래 중증 고혈압 치료제이나 저용량 분할로 탈모 처방)'
    },
    generics: [
      '현대미녹시딜정 5mg (1/4정~1정 분할 처방)'
    ],
    halfLife: '혈중 반감기 약 4시간 (혈관 확장 작용은 24~72시간 지속)',
    efficacy: '외용 미녹시딜 도포가 불편하거나 두피 설포트랜스퍼라제(Sulfotransferase) 효소 활성이 낮아 외용제 효과가 떨어지는 환자에게 간에서 직접 활성형(Minoxidil sulfate)으로 전환되어 강력한 전신 모낭 자극 효과를 발휘합니다.',
    sideEffects: '전신 다모증(눈썹, 팔다리, 인중 등 15~25%), 반사성 빈맥(가슴 두근거림), 기립성 저혈압·어지러움, 하지·안면 부종(나트륨 및 수분 저류 2~5%), 드물게 심낭삼출.',
    contraindications: '협심증·심근경색 병력자, 심부전 환자, 폐동맥 고혈압 환자, 갈색세포종 환자는 금기이며, 혈압약(특히 구아네티딘 및 기타 강압제) 복용자는 중증 저혈압 위험이 있어 반드시 전문의 감독하에 복용해야 합니다.'
  },
  {
    id: 'spironolactone',
    type: '스피로노락톤 (여성형 탈모 경구 항안드로겐 치료제)',
    ingredient: 'Spironolactone 25mg ~ 100mg',
    original: {
      name: '알닥톤필름코팅정 25mg (Aldactone)',
      manufacturer: '한국화이자제약 (Pfizer)'
    },
    generics: [
      '스피로닥톤정 (구주제약)',
      '스피락톤정 (명문제약)',
      '스피로노락톤정 (다수 제약사)'
    ],
    halfLife: '모약물 약 1.4시간, 활성 대사체(Canrenone 등) 약 16.5시간',
    efficacy: '알도스테론 수용체 길항제이자 모낭의 안드로겐 수용체(Androgen Receptor)에 경쟁적으로 결합하여 DHT와 테스토스테론이 모낭을 공격하는 것을 차단합니다. 특히 다낭성 난소 증후군(PCOS), 성인 여드름, 다모증이 동반된 여성형 탈모(FPHL)에 탁월한 효과를 보입니다.',
    sideEffects: '생리 주기의 불규칙성(부정출혈 15~30%), 유방 압통, 빈뇨·이뇨 작용, 피로감, 기립성 어지러움, 혈중 칼륨 수치 상승(고칼륨혈증).',
    contraindications: '① 칼륨 보존성 이뇨제이므로 칼륨 영양제, ACE 억제제/ARB 혈압약과 병용 시 치명적인 고칼륨혈증 유발 가능. ② 임신 중 복용 시 남성 태아의 여성화를 유발하므로 복용 중 확실한 피임이 필수입니다. ③ 남성에게는 여성형 유방 및 성기능 저하가 심해 탈모 목적으로 처방하지 않습니다.'
  },
  {
    id: 'jak_inhibitors',
    type: '바리시티닙 / 리틀레시티닙 (중증 원형탈모 표적 JAK 억제제)',
    ingredient: 'Baricitinib (2mg/4mg) · Ritlecitinib (50mg)',
    original: {
      name: '올루미언트정 (Olumiant) / 리트풀로캡슐 (Litfulo)',
      manufacturer: '한국릴리 (Eli Lilly) / 한국화이자제약 (Pfizer)'
    },
    generics: [
      '특허 보유 신약 (제네릭 없음 — 중증 원형탈모 SALT 50점 이상 표적치료제)'
    ],
    halfLife: '바리시티닙 약 12시간 / 리틀레시티닙 약 1.3~2.3시간',
    efficacy: '원형탈모는 자가면역 T세포(CD8+ NKG2D+ T세포)가 모낭의 면역특권(Immune Privilege)을 파괴하여 발생하는 자가면역 질환입니다. JAK(야누스 키나아제) 신호전달 경로(IFN-γ, IL-15)를 차단하여 모낭 주위 자가면역 염증 공격을 중단시키고 완전 소실된 모발의 재생장을 유도합니다(BRAVE-AA1/AA2 임상시험 근거).',
    sideEffects: '상기도 감염·비인두염, 대상포진 재활성화, 여드름·모낭염, 혈중 콜레스테롤(LDL/HDL) 상승, 크레아틴 인산활성효소(CPK) 상승, 두통, 드물게 심부정맥혈전증(DVT)·폐색전증.',
    contraindications: '활동성 결핵 및 중증 감염 환자, 투여 중 생백신(대상포진 생백신, MMR 등) 접종 절대 금기, 임산부 및 수유부 금기, 투여 전 잠복결핵(IGRA) 및 B형·C형 간염 스크리닝 검사가 필수입니다.'
  },
  {
    id: 'escalation_guide',
    type: '💡 임상 가이드: 탈모약 농도 증량 및 성분 교체(피나 → 두타)의 의학적 원칙',
    isSpecial: true,
    original: null,
    generics: [],
    efficacy: '안드로겐성 탈모는 모낭의 5α-환원효소 활성도와 안드로겐 수용체 민감도에 의해 진행되는 만성 진행성 질환이므로, 최소 6~12개월 치료 반응 평가 후 단계적 치료 강화를 결정합니다.',
    sideEffects: '외용 미녹시딜 농도 상향 (2~3% → 5%) 또는 저용량 경구 미녹시딜 병합: 두피 내 설포트랜스퍼라제 효소 활성도에 따라 저농도 외용제에 반응이 부족한 경우 5% 폼 제형으로 상향하거나, 전문의 판단하에 저용량 경구 미녹시딜(0.625~2.5mg)을 병합하여 모낭 생장기 유도력을 극대화합니다.',
    contraindications: '피나스테리드 1mg → 두타스테리드 0.5mg 교체 원칙: 피나스테리드 1mg을 12개월 이상 꾸준히 복용했음에도 전측두부(M자) 후퇴나 정수리 연모화가 계속 진행될 경우, 2형 효소만 억제하는 피나스테리드에서 1형·2형 효소를 모두 차단하는 두타스테리드 0.5mg으로 교체합니다. (주의: 피나스테리드를 1mg에서 5mg으로 용량만 늘리는 것은 DHT 추가 억제 차이가 거의 없고 부작용만 증가하므로 용량 증량이 아닌 성분 교체가 의학적 표준입니다.)'
  }
];

// ── Requirement 9: 복용 탈모약 성분에 따라 함께 복용하면 안 되는 양약 (Drug-Drug Interactions) ──
export const DRUG_INTERACTIONS_DATA = [
  {
    drugKey: 'finasteride',
    drugName: '피나스테리드 (Finasteride 1mg)',
    brandExamples: '프로페시아, 모나드, 피나테드, 마이페시아, 베아리모 등',
    metabolismInfo: '간 대사 효소 CYP3A4 기질 (신장 배설 39%, 대변 배설 57%)',
    interactions: [
      {
        targetDrug: '전립선비대증 치료용 5α-환원효소 억제제',
        targetIngredients: 'Finasteride 5mg (프로스카 등), Dutasteride 0.5mg (아보다트 등)',
        category: '비뇨기과 / 전립선약',
        severity: '절대 병용금기',
        severityCode: 'danger',
        mechanism: '동일 기전(5α-환원효소 억제) 약물의 중복 복용으로, DHT 추가 감소 효과는 거의 없는 반면 성기능 장애(발기부전·사정장애), 여성형 유방증, 간독성 위험만 배가됩니다.',
        actionGuide: '비뇨기과에서 전립선비대증 약을 처방받을 때 반드시 탈모약(피나스테리드) 복용 사실을 고지하여 중복 처방을 피해야 합니다.'
      },
      {
        targetDrug: '경구용 아졸계 항진균제 (무좀·칸디다 치료제)',
        targetIngredients: 'Itraconazole (스포라녹스), Ketoconazole (경구제), Voriconazole (브이펜드)',
        category: '항진균제 (무좀약)',
        severity: '중등도 상호작용 주의',
        severityCode: 'warning',
        mechanism: '피나스테리드는 간 내 CYP3A4 효소에 의해 대사되어 배설됩니다. 강력한 CYP3A4 억제제인 경구 무좀약을 병용하면 피나스테리드 분해가 지연되어 혈중 약물 농도가 비정상적으로 상승할 수 있습니다. (단, 바르는 무좀약이나 케토코나졸 약용 샴푸는 전신 흡수가 극미하여 병용 가능합니다.)',
        actionGuide: '먹는 손발톱 무좀약(이트라코나졸 등)을 수주간 복용할 경우 의사·약사와 상담하여 간기능 수치 및 부작용 여부를 점검하세요.'
      },
      {
        targetDrug: '마크로라이드계 항생제 및 항바이러스제',
        targetIngredients: 'Clarithromycin (클래리시드), Ritonavir (팍스로비드 구성성분 등)',
        category: '항생제 / 항바이러스제',
        severity: '용량·부작용 모니터링',
        severityCode: 'caution',
        mechanism: '강력한 CYP3A4 대사 효소 억제로 피나스테리드의 혈장 청소율을 낮추어 일시적 피로감, 어지러움, 성욕 저하 가능성을 높입니다.',
        actionGuide: '단기 항생제 복용 시 복용 시간 간격을 2시간 이상 두거나 이상 반응 발생 시 의료진과 상의하세요.'
      },
      {
        targetDrug: '남성호르몬(테스토스테론) 보충 주사제·겔',
        targetIngredients: 'Testosterone undecanoate (네비도, 예나스테론), 테스토겔',
        category: '호르몬제',
        severity: '약효 상쇄 주의',
        severityCode: 'warning',
        mechanism: '외부에서 고용량 테스토스테론을 투여하면 기질 농도가 급증하여 잔여 5α-환원효소 및 안드로겐 수용체 자극이 커져 탈모 방어 효과가 크게 반감됩니다.',
        actionGuide: '남성 갱년기 치료 목적으로 테스토스테론 투여 시 탈모 전문의와 용량 및 두타스테리드 전환 여부를 상의해야 합니다.'
      }
    ]
  },
  {
    drugKey: 'dutasteride',
    drugName: '두타스테리드 (Dutasteride 0.5mg)',
    brandExamples: '아보다트, 다모다트, 두테드, 네오다트, 두타텍트 등',
    metabolismInfo: '간 CYP3A4 및 CYP3A5 효소에 의해 광범위 대사 (반감기 3~5주로 체내 축적성 높음)',
    interactions: [
      {
        targetDrug: '전립선비대증 치료제 / 피나스테리드 제제',
        targetIngredients: 'Finasteride 1mg/5mg (프로페시아, 프로스카), 타 두타스테리드 제제',
        category: '탈모약 / 전립선약',
        severity: '절대 병용금기',
        severityCode: 'danger',
        mechanism: '1·2형 5α-환원효소가 이미 90% 이상 차단된 상태에서 피나스테리드를 중복 복용하면 간 대사 과부하, 성기능 부작용, 정자 운동성 저하 위험만 급격히 상승합니다.',
        actionGuide: '피나스테리드와 두타스테리드는 절대 격일 교차 복용하거나 동시 복용하지 마시고, 하나의 성분만 선택해 복용하세요.'
      },
      {
        targetDrug: '칼슘채널차단제 계열 혈압·협심증·부정맥 치료제',
        targetIngredients: 'Verapamil (베라파밀/이솝틴), Diltiazem (딜티아젬/헤르벤)',
        category: '고혈압 / 심장약',
        severity: '중증 상호작용 주의',
        severityCode: 'danger',
        mechanism: '식약처 및 FDA 허가사항에 명시된 대표적 상호작용입니다. 베라파밀과 딜티아젬(중등도 CYP3A4 억제제)과 병용 시 두타스테리드의 혈청 청소율이 감소하여 혈중 농도(AUC)가 약 1.6~2.0배 상승하며, 반감기가 5주로 길어 체내 과다 축적됩니다.',
        actionGuide: '베라파밀이나 딜티아젬 계열 혈압·부정맥약을 복용 중인 경우, CYP3A4에 영향을 주지 않는 다른 혈압약(예: 암로디핀 등)으로 변경하거나 탈모약 간격을 조절해야 합니다.'
      },
      {
        targetDrug: '강력한 CYP3A4 억제 항진균제·항생제·항바이러스제',
        targetIngredients: 'Itraconazole (스포라녹스), Ketoconazole, Clarithromycin (클래리시드), Ritonavir/Nirmatrelvir (팍스로비드)',
        category: '항진균제 / 항생제 / 항바이러스제',
        severity: '중증 상호작용 주의',
        severityCode: 'warning',
        mechanism: '두타스테리드의 유일한 대사 경로인 CYP3A4/3A5를 강력히 차단하여 두타스테리드 혈중 농도를 급격히 높이고 간효소 수치 상승 및 성기능·유방 부작용을 유발합니다.',
        actionGuide: '장기 경구 항진균제 치료 시 두타스테리드 휴약 또는 감량(주 2~3회 복용)이 필요할 수 있으므로 처방의에게 반드시 알리세요.'
      },
      {
        targetDrug: '알파-1 교감신경 차단제 (전립선·혈압약)',
        targetIngredients: 'Tamsulosin (탐스로신/하루날디), Doxazosin (독사조신), Terazosin (테라조신)',
        category: '비뇨기과 / 혈압약',
        severity: '병용 주의 및 모니터링',
        severityCode: 'caution',
        mechanism: '장기 병용 임상시험(CombAT study)에서 기립성 저혈압, 어지러움 및 드물게 심부전 발생 빈도가 단독 투여군 대비 소폭 높게 보고되었습니다.',
        actionGuide: '기립 시 어지러움이나 부종, 호흡곤란이 나타나는지 모니터링이 필요합니다.'
      }
    ]
  },
  {
    drugKey: 'minoxidil',
    drugName: '미녹시딜 (경구 미녹시딜정 & 외용 미녹시딜 3%/5%)',
    brandExamples: '현대미녹시딜정, 로게인폼, 마이녹실, 모바렌, 커클랜드 미녹시딜 등',
    metabolismInfo: '직접적 말초 동맥 혈관확장제 (간 설포트랜스퍼라제 대사 후 신장 배설)',
    interactions: [
      {
        targetDrug: '교감신경 차단 강력 혈압강하제',
        targetIngredients: 'Guanethidine (구아네티딘), Bethanidine (베타니딘)',
        category: '고혈압 치료제',
        severity: '절대 병용금기',
        severityCode: 'danger',
        mechanism: '미녹시딜(특히 경구제)과 병용 시 교감신경 반사 보상이 차단되면서 심각하고 치명적인 기립성 저혈압 및 실신(Syncope)을 유발합니다.',
        actionGuide: '절대 병용 금기 약물입니다. 고혈압 약제를 복용 중인 분은 임의로 경구 미녹시딜을 복용해서는 안 됩니다.'
      },
      {
        targetDrug: '일반 고혈압 치료제 및 협심증 혈관확장제',
        targetIngredients: 'Amlodipine (노바스크), Valsartan/Losartan (디오반/코자), 프로프라놀롤 등 베타차단제, 니트로글리세린',
        category: '고혈압 / 심혈관약',
        severity: '중증 상호작용 주의',
        severityCode: 'danger',
        mechanism: '미녹시딜 자체가 혈관확장성 혈압강하제이므로 기존 혈압약과 상가 작용(Additive hypotension)을 일으켜 급격한 혈압 저하, 극심한 현기증, 반사성 빈맥(가슴 두근거림)을 유발합니다.',
        actionGuide: '혈압약 복용 환자는 경구 미녹시딜 대신 전신 흡수가 적은 외용 미녹시딜 폼을 우선 고려하고, 경구제 복용 시 반드시 내과·피부과 협진을 거치세요.'
      },
      {
        targetDrug: '발기부전 치료제 (PDE-5 억제제)',
        targetIngredients: 'Sildenafil (비아그라/팔팔정), Tadalafil (시알리스/구구정), Udenafil (자이데나)',
        category: '비뇨기과 / 혈관확장제',
        severity: '중등도 상호작용 주의',
        severityCode: 'warning',
        mechanism: 'PDE-5 억제제의 산화질소(NO) 매개 혈관 확장 작용과 미녹시딜의 칼륨채널 개방 혈관 확장 작용이 겹쳐 저혈압, 심한 두통, 안면 홍조, 심계항진을 유발할 수 있습니다.',
        actionGuide: '경구 미녹시딜과 발기부전 치료제는 같은 시간대에 동시 복용하지 마시고 최소 6~8시간 이상의 간격을 두세요.'
      },
      {
        targetDrug: '비스테로이드성 소염진통제 (NSAIDs)',
        targetIngredients: 'Ibuprofen (이부프로펜/부루펜), Naproxen (나프록센/탁센), Loxoprofen (록소프로펜), Celecoxib (세레브렉스)',
        category: '소염진통제 (진통제)',
        severity: '부종 악화 주의',
        severityCode: 'caution',
        mechanism: 'NSAIDs는 신장 혈류를 유지하는 프로스타글란딘 합성을 억제하여 나트륨과 수분 배설을 감소시킵니다. 미녹시딜의 대표적 부작용인 수분 저류(안면·발목 부종, 체중 증가)를 현저히 악화시키고 미녹시딜의 혈압 조절을 방해합니다.',
        actionGuide: '경구 미녹시딜 복용 중 두통·근육통으로 진통제가 필요할 때는 소염진통제(NSAIDs)보다 아세트아미노펜(타이레놀)을 단기 선택하는 것이 부종 예방에 유리합니다.'
      },
      {
        targetDrug: '외용 레티노이드(트레티노인) 및 고역가 두피 스테로이드제 동시 도포',
        targetIngredients: 'Tretinoin Cream (스티바A 등), Clobetasol (더모베이트 등)',
        category: '피부과 외용제',
        severity: '전신흡수 급증 주의',
        severityCode: 'warning',
        mechanism: '트레티노인은 각질층 장벽 투과도를 크게 높여 외용 미녹시딜의 경피 전신 흡수율을 약 3배 증가시킵니다. 이로 인해 바르는 미녹시딜만으로도 심장 두근거림, 어지러움 등 전신 부작용이 나타날 수 있습니다.',
        actionGuide: '두피에 두 외용제를 같은 시간에 섞어 바르지 마시고 아침/저녁으로 분리하거나 전문의 지시에 따르세요.'
      }
    ]
  },
  {
    drugKey: 'spironolactone',
    drugName: '스피로노락톤 (Spironolactone — 여성형 탈모)',
    brandExamples: '알닥톤필름코팅정 25mg, 스피로닥톤정, 스피락톤정',
    metabolismInfo: '칼륨 보존성 이뇨제 및 안드로겐 수용체 길항제 (신장 세뇨관 알도스테론 차단)',
    interactions: [
      {
        targetDrug: '칼륨 보충제 및 타 칼륨 보존성 이뇨제',
        targetIngredients: 'Potassium chloride (케이콘틴서방정), Amiloride (아밀로라이드), Triamterene, Eplerenone (인스프라)',
        category: '전해질제 / 이뇨제',
        severity: '절대 병용금기',
        severityCode: 'danger',
        mechanism: '신장에서 칼륨 배설이 이중으로 차단되어 혈중 칼륨 농도가 급상승하는 치명적인 고칼륨혈증(Hyperkalemia: 근육 마비, 심각한 심장 부정맥, 심정지)을 유발합니다.',
        actionGuide: '스피로노락톤 복용 중에는 고함량 칼륨 영양제나 칼륨 보존성 이뇨제를 절대 복용하지 마세요.'
      },
      {
        targetDrug: 'ACE 억제제 및 ARB 계열 고혈압 치료제',
        targetIngredients: 'Losartan (코자), Valsartan (디오반), Telmisartan (미카르디스), Enalapril, Ramipril',
        category: '고혈압 치료제',
        severity: '중증 상호작용 주의',
        severityCode: 'danger',
        mechanism: '레닌-안지오텐신-알도스테론계(RAAS)를 차단하는 혈압약과 스피로노락톤을 병용하면 알도스테론이 이중으로 억제되어 중증 고칼륨혈증 및 급성 신기능 저하 위험이 급증합니다.',
        actionGuide: '병용이 불가피한 경우 정기적인 혈액 전해질(혈청 칼륨 K+) 및 크레아티닌 검사가 필수입니다.'
      },
      {
        targetDrug: '리튬 (Lithium) 및 강심배당체 디곡신 (Digoxin)',
        targetIngredients: 'Lithium carbonate (명인탄산리튬정), Digoxin (디곡신정)',
        category: '정신건강의학과 / 심장약',
        severity: '중증 독성 주의',
        severityCode: 'danger',
        mechanism: '스피로노락톤은 신장에서 리튬과 디곡신의 세뇨관 청소율을 감소시켜 혈중 리튬 독성(손떨림, 신경독성) 및 디곡신 독성(부정맥, 오심)을 유발하며, 디곡신 혈액검사 수치를 위양성으로 교란합니다.',
        actionGuide: '리튬 또는 디곡신 복용 환자는 스피로노락톤 대신 외용 치료제로 대체해야 합니다.'
      },
      {
        targetDrug: '설파계 복합 항생제 (박트림 등) 및 NSAIDs 소염진통제',
        targetIngredients: 'Trimethoprim/Sulfamethoxazole (코트림/박트림), Ibuprofen, Naproxen',
        category: '항생제 / 소염진통제',
        severity: '중등도 상호작용 주의',
        severityCode: 'warning',
        mechanism: '트리메토프림은 아밀로라이드와 유사하게 신장 칼륨 배설을 억제하며, NSAIDs는 신혈류를 줄여 급성 고칼륨혈증 및 급성 신손상 위험을 높입니다.',
        actionGuide: '방광염·감기 등으로 항생제나 소염진통제 처방 시 스피로노락톤 복용 중임을 반드시 의사·약사에게 알리세요.'
      }
    ]
  },
  {
    drugKey: 'jak_inhibitors',
    drugName: '바리시티닙 / 리틀레시티닙 (중증 원형탈모 JAK 억제제)',
    brandExamples: '올루미언트정 2mg·4mg (Baricitinib), 리트풀로캡슐 50mg (Ritlecitinib)',
    metabolismInfo: '바리시티닙: 신장 OAT3 수송체 배설 / 리틀레시티닙: GST 및 CYP3A/1A2 대사 및 억제',
    interactions: [
      {
        targetDrug: '생백신 (Live Attenuated Vaccines)',
        targetIngredients: '대상포진 생백신(조스타박스), MMR(홍역·볼거리·풍진), 수두 백신, 황열 백신',
        category: '예방접종 / 백신',
        severity: '절대 병용금기',
        severityCode: 'danger',
        mechanism: 'JAK 억제제는 세포성 면역(T세포·NK세포 신호)을 억제하므로 살아있는 약독화 병원체인 생백신을 접종할 경우 백신 바이러스가 전신으로 증식하여 파종성 감염을 일으킬 수 있습니다.',
        actionGuide: '치료 시작 전에 필요한 예방접종을 완료해야 하며, 복용 중 대상포진 예방이 필요한 경우 생백신이 아닌 유전자재조합 사백신(싱그릭스)만 의료진 상담 후 접종 가능합니다.'
      },
      {
        targetDrug: '타 면역억제제 및 생물학적 제제',
        targetIngredients: 'Cyclosporine (사이폴엔/산디문), Azathioprine (이무란), Tacrolimus (프로그랍)',
        category: '면역억제제',
        severity: '절대 병용금기',
        severityCode: 'danger',
        mechanism: '강력한 면역억제제와 병용 시 중증 기회감염(결핵, 폐렴, 침습성 진균감염) 및 림프종 등 악성종양 발생 위험이 급격히 상승합니다.',
        actionGuide: '기존 원형탈모 치료로 사이클로스포린을 복용 중이었다면 반드시 중단 후 전환해야 하며 동시 복용하지 않습니다.'
      },
      {
        targetDrug: '통풍 치료제 프로베네시드 (Probenecid)',
        targetIngredients: 'Probenecid (프로베네시드 — 요산배설촉진제)',
        category: '통풍 치료제',
        severity: '용량 반감 필수 / 주의',
        severityCode: 'warning',
        mechanism: '프로베네시드는 신장의 유기음이온 수송체(OAT3)를 강력히 억제하여 바리시티닙(올루미언트)의 신장 배설을 막아 혈중 노출량(AUC)을 약 2배 증가시킵니다.',
        actionGuide: '프로베네시드 복용 환자가 올루미언트 4mg을 복용 중이라면 2mg으로 용량을 절반 감량해야 합니다.'
      },
      {
        targetDrug: '경구 피임약 및 에스트로겐 호르몬제',
        targetIngredients: 'Ethinylestradiol 복합 경구피임약 (야즈, 야스민, 머시론 등), 호르몬대체요법(HRT)',
        category: '피임약 / 호르몬제',
        severity: '혈전증 위험 주의',
        severityCode: 'warning',
        mechanism: 'JAK 억제제의 중대 주의사항인 정맥혈전색전증(심부정맥혈전증 DVT, 폐색전증 PE) 위험과 에스트로겐의 혈액 응고 촉진 작용이 상승 작용을 일으킬 수 있습니다.',
        actionGuide: '종아리 부종·통증이나 갑작스러운 호흡곤란 발생 시 즉시 복용을 멈추고 응급 진료를 받아야 합니다.'
      }
    ]
  }
];

// ── Requirement 10: 탈모약 복용 시 나타날 수 있는 부작용 총람 및 대처 가이드 ──
export const DRUG_SIDE_EFFECTS_DATA = [
  {
    id: 'se_shedding',
    system: '모발·두피 주기 반응',
    title: '초기 쉐딩 현상 (Initial Shedding — 일시적 탈락 증가)',
    relatedDrugs: ['외용 미녹시딜', '경구 미녹시딜', '피나스테리드', '두타스테리드'],
    incidence: '약 15~30% (특히 미녹시딜 시작 후 2~6주 차)',
    riskLevel: '정상 치료 반응 (지속 복용 권장)',
    riskBadge: 'safe',
    onsetTimeline: '복용/도포 시작 후 2주~6주 사이 발생, 보통 4~8주 이내 자연 종료',
    mechanism: '모낭이 약물 자극을 받아 새로운 굵은 생장기(Anagen) 모발을 아래에서 밀어 올리는 과정에서, 이미 수명이 다해 모낭에 얹혀 있던 가늘고 힘없는 휴지기(Telogen) 모발들이 한꺼번에 빠지는 현상입니다. 모낭이 파괴되는 것이 아니라 모발 주기가 동기화되며 리셋되는 강력한 약효 발현 신호입니다.',
    copingStrategy: '절대로 놀라서 약을 중단하지 마세요! 여기서 중단하면 빠진 휴지기 모발만 잃고 새로 올라오던 신생모의 성장 동력까지 끊기게 됩니다. 최소 3~6개월간 꾸준히 유지하면 빠진 자리에서 더 굵은 모발이 자라납니다.'
  },
  {
    id: 'se_sexual',
    system: '내분비·비뇨생식기계',
    title: '성욕 감퇴 · 발기력 저하 · 사정량 감소',
    relatedDrugs: ['피나스테리드 1mg', '두타스테리드 0.5mg'],
    incidence: '피나스테리드 약 1.3~1.8% / 두타스테리드 약 3.3~6.0% (1년 임상 기준)',
    riskLevel: '경과 관찰 또는 용량·복용주기 조절 상담',
    riskBadge: 'caution',
    onsetTimeline: '복용 초기 1~3개월 내 주로 발생, 장기 복용 시 오히려 감소하거나 적응되는 경향',
    mechanism: '전립선과 정낭의 크기를 유지하고 국소 산화질소(NO) 합성에 일부 관여하는 DHT 농도가 급감하면서 사정액(정낭액) 생성량이 줄어들거나 성욕·발기 강도가 저하될 수 있습니다. 또한 부작용에 대한 심리적 불안이 유발하는 노시보 효과(Nocebo effect)도 임상 연구(Mondaini et al., J Sex Med)에서 상당 비중을 차지하는 것으로 밝혀졌습니다.',
    copingStrategy: '① 증상이 경미하다면 1~2개월 복용을 유지하며 자연 호전 여부를 관찰합니다. ② 지속될 경우 임의 중단 대신 처방의와 상의하여 복용 주기를 조절(예: 주 3~4회 또는 격일 복용)하거나 두타스테리드에서 반감기가 짧은 피나스테리드로 변경, 또는 L-아르기닌·아연 보충 등을 병행할 수 있습니다. ③ 약물 중단 시 대다수에서 수주~수개월 내 정상 회복됩니다.'
  },
  {
    id: 'se_gynecomastia',
    system: '내분비·유방계',
    title: '여성형 유방증 (Gynecomastia) · 유방 압통 및 멍울',
    relatedDrugs: ['피나스테리드 1mg', '두타스테리드 0.5mg', '스피로노락톤'],
    incidence: '약 0.4~1.3%',
    riskLevel: '즉시 복용 중단 및 전문의 진료 필요',
    riskBadge: 'danger',
    onsetTimeline: '복용 후 수주에서 1년 이상 경과 후에도 발생 가능',
    mechanism: '5α-환원효소가 차단되면 DHT로 전환되지 못한 잉여 테스토스테론이 혈중에 약 10~20% 상승합니다. 이 잉여 테스토스테론이 체지방 내 아로마타제(Aromatase) 효소에 의해 여성호르몬(에스트라디올, Estradiol)으로 방향화(Aromatization)되면서 유선 조직을 자극하여 유두 주변 통증, 붓기, 단단한 유선 멍울을 형성합니다.',
    copingStrategy: '초기에 유두가 스치기만 해도 아프거나(압통) 몽우리가 만져질 때 즉시 복용을 중단하고 의사와 상담해야 합니다. 초기(섬유화 이전)에 약을 중단하면 가역적으로 소실되지만, 수개월 이상 방치하여 유선 조직이 섬유화되면 외과적 수술이 필요할 수 있습니다.'
  },
  {
    id: 'se_neuro',
    system: '정신·신경계',
    title: '브레인 포그 (기억력·집중력 저하) · 우울감 · 만성 피로',
    relatedDrugs: ['피나스테리드 1mg', '두타스테리드 0.5mg'],
    incidence: '약 0.5~1.5% (개인차 존재, 식약처·FDA 허가사항 반영)',
    riskLevel: '증상 뚜렷할 시 복용 중단 및 외용제 전환 상담',
    riskBadge: 'warning',
    onsetTimeline: '복용 수주~수개월 내 서서히 인지',
    mechanism: '5α-환원효소는 남성호르몬뿐만 아니라 뇌 신경계에서 프로게스테론을 알로프레그나놀론(Allopregnanolone) 등 신경보호 스테로이드(Neurosteroids)로 전환하는 데 관여합니다. 이 신경스테로이드가 감소하면 뇌 내 GABA-A 수용체 조절이 변화하여 머리가 안개 낀 것처럼 멍한 브레인 포그(Brain fog), 무기력감, 우울감이 나타날 수 있습니다.',
    copingStrategy: '우울감이나 심각한 집중력 저하가 일상생활에 지장을 줄 경우 경구 5α-환원효소 억제제를 중단하고, 전신 호르몬에 영향을 주지 않는 외용 미녹시딜, 저준위 레이저(LLLT), 두피 국소 치료 등으로 전환하는 것을 전문의와 상의하세요.'
  },
  {
    id: 'se_cardio',
    system: '심혈관·순환기계',
    title: '빈맥 (가슴 두근거림) · 기립성 저혈압 · 안면 및 발목 부종',
    relatedDrugs: ['경구 미녹시딜정', '고농도 외용 미녹시딜 과다 도포'],
    incidence: '경구 미녹시딜 약 2~6% / 외용제 약 0.5~1.5%',
    riskLevel: '흉통·호흡곤란 동반 시 즉시 중단 (용량 조절 필요)',
    riskBadge: 'danger',
    onsetTimeline: '복용 초기 1~4주 내 주로 발생',
    mechanism: '미녹시딜이 말초 소동맥을 확장시켜 혈압을 떨어뜨리면, 우리 몸의 교감신경계가 혈압을 유지하기 위해 반사적으로 심장 박동을 빠르게 뛰게(반사성 빈맥) 하고, 신장의 레닌-알도스테론계를 자극해 나트륨과 수분을 재흡수하여 아침 안면 부종이나 저녁 발목 부종을 유발합니다.',
    copingStrategy: '① 경구 미녹시딜은 취침 전 복용하거나 용량을 절반(예: 2.5mg → 1.25mg 또는 0.625mg)으로 감량하고 저염식을 실천하면 부종과 어지러움이 크게 줄어듭니다. ② 만약 안정 시 맥박이 분당 100회 이상 지속되거나 흉통, 누웠을 때 숨이 차는 증상(심낭삼출 의심)이 나타나면 즉시 중단하고 병원을 방문하세요.'
  },
  {
    id: 'se_derma',
    system: '피부·모발계',
    title: '안면·전신 다모증 (Hypertrichosis) 및 두피 접촉성 피부염',
    relatedDrugs: ['외용 미녹시딜 3%·5%', '경구 미녹시딜정'],
    incidence: '경구 미녹시딜 다모증 15~25% / 액상 미녹시딜 두피 자극 5~10%',
    riskLevel: '제형 변경(액상 → 폼) 또는 용량 조절로 관리 가능',
    riskBadge: 'caution',
    onsetTimeline: '피부염은 도포 후 수일~수주 내, 다모증은 6~8주 후부터 관찰',
    mechanism: '① 두피 가려움·비듬·홍반: 미녹시딜 성분 자체보다는 액상 제품에 용해제로 들어간 프로필렌글리콜(Propylene Glycol, PG)에 대한 알레르기성/자극성 접촉피부염인 경우가 90% 이상입니다. ② 다모증: 혈류를 타고 흡수되거나 베개에 묻은 미녹시딜이 눈썹, 광대, 인중, 팔다리의 휴지기 솜털 모낭까지 자극하여 털이 진해집니다.',
    copingStrategy: '① 두피 가려움·각질이 생기면 PG가 없는 폼(Foam, 거품) 제형(로게인폼, 마이녹실폼 등)으로 바꾸면 즉시 해결됩니다. ② 외용제는 취침 최소 2시간 전에 도포하여 완전히 말린 뒤 자야 베개를 통한 안면 다모증을 예방할 수 있습니다.'
  },
  {
    id: 'se_lab',
    system: '간·신장·혈액검진 지표',
    title: '간수치(AST/ALT) 상승 · 고칼륨혈증 · PSA 전립선암 지표 왜곡',
    relatedDrugs: ['피나스테리드', '두타스테리드', '스피로노락톤', '바리시티닙'],
    incidence: '간수치 경도 상승 1~2% / PSA 50% 감소는 복용자 전체 공통 현상',
    riskLevel: '정기 혈액검사 및 건강검진 시 의사 고지 필수',
    riskBadge: 'warning',
    onsetTimeline: '복용 3~6개월 이후 혈액검사로 확인',
    mechanism: '① 경구 탈모약은 간에서 대사되므로 음주나 타 약물 병용 시 AST/ALT가 상승할 수 있습니다. ② 피나스테리드·두타스테리드는 전립선 조직을 위축시켜 전립선암 선별검사인 혈청 PSA 수치를 실제보다 절반(50%)으로 낮추어 전립선암 조기 발견을 가릴 수 있습니다.',
    copingStrategy: '① 6개월~1년에 한 번 간기능 검사(AST, ALT, γ-GTP)를 권장합니다. ② 40대 이상 남성이 건강검진에서 PSA 검사를 받을 때는 반드시 "탈모약 복용 중"임을 밝혀 결과값에 2를 곱해 판정받으세요.'
  }
];

// ── Requirement 8: 탈모환자가 복용하면 안 되는 식품 리스트 및 의학적 원인 ──
export const CONTRAINDICATED_FOODS_DATA = [
  {
    id: 'food_high_gi',
    name: '액상과당 음료 · 설탕 · 고혈당지수(High-GI) 정제 탄수화물',
    examples: '탄산음료, 가당 과일주스, 에너지드링크, 케이크, 도넛, 흰식빵, 설탕 시럽 커피',
    dangerLevel: '절대 금기 / 고위험',
    dangerBadge: 'danger',
    harmfulComponent: '액상과당(HFCS), 정제당, 고혈당 부하(Glycemic Load)',
    medicalReason: '① 인슐린 & IGF-1 폭증에 의한 DHT 전환 가속: 단순당 섭취로 혈당이 급상승(혈당 스파이크)하면 췌장에서 인슐린과 간에서 IGF-1(인슐린 유사 성장인자-1)이 과다 분비됩니다. 이는 간에서 성호르몬 결합 글로불린(SHBG) 생성을 억제하여 혈중 유리 테스토스테론(Free Testosterone) 농도를 높이고 5α-환원효소를 자극해 모낭을 파괴하는 DHT 생성을 급증시킵니다(Tsinghua Univ. Nutrients 2023 연구에서 가당 음료 과다 섭취군 탈모 위험 30~42% 상승 확인). ② 당화 최종산물(AGEs) 생성: 과잉 당분이 모유두 주변 진피 콜라겐과 결합해 조직을 딱딱하게 경화시켜 모낭으로 가는 산소·영양 공급 모세혈관을 차단합니다.',
    safeAlternative: '현미·귀리·메밀 등 복합 탄수화물, 스테비아·알룰로스 대체당, 무가당 녹차·보리차'
  },
  {
    id: 'food_trans_fat',
    name: '트랜스지방 및 고포화지방 튀김 · 가공육',
    examples: '패스트푸드 감자튀김, 치킨, 마가린, 쇼트닝 베이커리, 베이컨, 소시지, 삼겹살 기름 과식',
    dangerLevel: '절대 금기 / 고위험',
    dangerBadge: 'danger',
    harmfulComponent: '트랜스지방산(Trans fatty acids), 과잉 포화지방산, 과산화지질',
    medicalReason: '① 모낭 줄기세포 고갈 (Nature 2021 학술 근거): 도쿄의과치과대학 연구팀이 학술지 《Nature》에 발표한 연구에 따르면, 고지방 식이는 모낭 줄기세포(HFSCs) 내부에 지질 방울 축적과 산화 스트레스를 유발하고 염증성 사이토카인(IL-1β, NF-κB) 신호를 활성화해 모낭 줄기세포를 표피 각질세포로 변성시켜 영구적 모낭 소형화를 촉진합니다. ② 스쿠알렌 과산화(Squalene Peroxide): 피지선 비대와 과다 분비된 피지가 자외선·활성산소에 산화되면서 두피 지루성 피부염과 모낭염을 악화시킵니다.',
    safeAlternative: '등푸른생선(고등어·연어 오메가-3), 엑스트라버진 올리브유, 수육·오리고기·두부·콩 단백질'
  },
  {
    id: 'food_alcohol',
    name: '알코올 (모든 주류 — 소주, 맥주, 와인, 위스키)',
    examples: '소주, 맥주, 막걸리, 하이볼, 과실주 등 음주 전반',
    dangerLevel: '절대 금기 / 고위험',
    dangerBadge: 'danger',
    harmfulComponent: '에탄올(Ethanol) 및 독성 대사체 아세트알데하이드(Acetaldehyde)',
    medicalReason: '① 모발 핵심 영양소(비오틴·아연·엽산) 고갈: 간에서 알코올을 해독하는 과정에서 모발 케라틴 단백질 합성에 필수적인 비타민 B군(특히 비오틴 B7, 엽산 B9)과 아연(Zinc), 글루타치온이 최우선으로 소모·배출됩니다. ② 상열감(上熱)과 두피 홍반: 알코올은 말초 혈관을 비정상적으로 확장시킨 뒤 반동성 수축과 염증 매개 물질(히스타민·프로스타글란딘) 분비를 유도해 두피 열감과 홍반을 극대화합니다. ③ 탈모약 간독성 및 저혈압 증폭: 피나스테리드/두타스테리드의 간 대사 부담을 높이고, 미녹시딜 복용자의 기립성 저혈압·실신 위험을 급증시킵니다.',
    safeAlternative: '무알코올 허브티, 루이보스티, 구기자차, 블랙체리·석류 무가당 탄산수'
  },
  {
    id: 'food_raw_egg_white',
    name: '익히지 않은 날달걀 흰자 (생란 흰자 지속 섭취)',
    examples: '날달걀 직접 섭취, 익히지 않은 머랭, 생계란 흰자 쉐이크',
    dangerLevel: '중등도 위험 (조리법 주의)',
    dangerBadge: 'warning',
    harmfulComponent: '아비딘 (Avidin — 당단백질 항영양소)',
    medicalReason: '날달걀 흰자에 다량 존재하는 단백질인 아비딘(Avidin)은 장관 내에서 모발 케라틴 합성의 핵심 조효소인 비오틴(Biotin, 비타민 B7)과 극도로 강력한 비가역적 결합(자연계에서 가장 강한 비공유 결합 중 하나)을 형성합니다. 결합된 아비딘-비오틴 복합체는 소화효소로 분해되지 않고 그대로 대변으로 배출되어 심각한 비오틴 결핍성 탈모(Egg-white injury)와 두피 습진을 유발합니다.',
    safeAlternative: '삶은 달걀, 구운 달걀, 수란 등 가열 조리된 달걀 (70℃ 이상 가열 시 아비딘이 불활성화되어 비오틴이 100% 정상 흡수됨)'
  },
  {
    id: 'food_excess_vit_a',
    name: '고용량 비타민 A(레티놀) 보충제 및 동물 간 과다 섭취',
    examples: '고함량 합성 비타민 A(레티놀 >10,000 IU/일) 영양제, 소간·돼지간·대구간유 과다 섭취',
    dangerLevel: '중등도 위험 (과잉 섭취 금기)',
    dangerBadge: 'warning',
    harmfulComponent: '과잉 레티노산 (Preformed Retinol / Retinoic Acid)',
    medicalReason: '비타민 A(레티놀)는 지용성 비타민으로 체내에 축적됩니다. 일일 상한 섭취량(3,000μg RAE, 약 10,000 IU)을 초과하여 섭취하면 모낭 내 레티노산 농도가 과잉 상승하여 모낭 줄기세포의 증식을 억제하고, 생장기(Anagen) 모낭을 조기에 퇴행기(Catagen) 및 휴지기(Telogen)로 강제 진입시켜 머리 전체가 우수수 빠지는 급성 휴지기 탈모(Telogen Effluvium)를 일으킵니다.',
    safeAlternative: '당근, 단호박, 시금치 등 식물성 베타카로틴(β-carotene) 식품 (체내 필요량만큼만 비타민 A로 전환되어 과잉 독성이 없음)'
  },
  {
    id: 'food_brazil_nut_excess',
    name: '브라질너트 과다 섭취 (셀레늄 과잉 독성)',
    examples: '브라질너트 하루 4~5알 이상 습관적 섭취, 고함량 셀레늄 영양제 중복 복용',
    dangerLevel: '중등도 위험 (섭취량 엄격 제한)',
    dangerBadge: 'warning',
    harmfulComponent: '과잉 셀레늄 (Selenium Toxicity / Selenosis)',
    medicalReason: '브라질너트 1알(약 4~5g)에는 셀레늄이 약 70~90μg 함유되어 있어 하루 1~2알로 권장량이 충족됩니다. 이를 간식처럼 하루 5알 이상 섭취하여 일일 상한량(400μg)을 넘기면 셀레늄 중독(Selenosis)이 발생합니다. 과잉 셀레늄이 모발 케라틴 단백질 내 황(Sulfur) 자리에 잘못 치환되면서 시스테인 이황화 결합(Disulfide bond)을 파괴해 머리카락이 뚝뚝 끊어지고 급격한 탈모와 손톱 변형을 유발합니다.',
    safeAlternative: '브라질너트는 하루 딱 1~2알만 섭취, 평상시에는 호두·아몬드·잣 등 일반 견과류 소량 섭취'
  },
  {
    id: 'food_mercury_fish',
    name: '고수은 심해 대형 어류 과다 섭취',
    examples: '참다랑어(참치 대뱃살)·눈다랑어 회 과식, 황새치, 상어고기, 메기·옥돔 다량 섭취',
    dangerLevel: '중등도 위험',
    dangerBadge: 'warning',
    harmfulComponent: '메틸수은 (Methylmercury) 중금속',
    medicalReason: '먹이사슬 최상위 대형 어류에 농축된 메틸수은은 황(Sulfur)에 대한 친화력이 매우 높습니다. 체내 유입 시 모발의 주성분인 케라틴 단백질의 시스테인 설프히드릴기(-SH)에 직접 결합하여 정상적인 케라틴 중합과 모낭 기질세포의 세포분열을 차단하고, 아연(Zinc)과 셀레늄의 항산화 효소 작용을 마비시켜 미만성 탈모를 유발합니다.',
    safeAlternative: '수은 함량이 낮고 오메가-3가 풍부한 소형·중형 어류 (고등어, 정어리, 꽁치, 연어, 멸치)'
  },
  {
    id: 'food_creatine_booster',
    name: '고용량 크레아틴(Creatine) 로딩 보충제 및 남성호르몬 부스터',
    examples: '크레아틴 모노하이드레이트 고용량 로딩, DHEA 보충제, 트리뷸러스 등 테스토스테론 부스터',
    dangerLevel: '고위험 (유전성 탈모 보유자 금기)',
    dangerBadge: 'danger',
    harmfulComponent: '크레아틴(Creatine), DHEA(디하이드로에피안드로스테론)',
    medicalReason: '남아프리카 스텔렌보스 대학 임상연구(van der Merwe et al., Clin J Sport Med 2009)에서 크레아틴 로딩(25g/일 7일 후 5g/일 유지) 시 혈중 테스토스테론 대비 DHT(디하이드로테스토스테론) 농도가 7일 만에 56% 급증하고 유지기에도 40% 높게 유지됨이 확인되었습니다. 또한 DHEA는 체내에서 안드로스텐디온과 테스토스테론, 최종적으로 DHT로 대사되어 유전성 탈모 환자의 M자·정수리 탈모를 급격히 악화시킬 수 있습니다.',
    safeAlternative: '순수 분리유청단백(WPI) 또는 대두·완두콩 식물성 단백질 파우더, L-아르기닌·L-시트룰린(혈류 개선 아미노산)'
  },
  {
    id: 'food_high_sodium',
    name: '고나트륨 국물 · 염장식품 · 화학조미료 과다 식품',
    examples: '라면 국물, 짬뽕, 젓갈류, 장아찌, 찌개 국물, 짠 스낵류',
    dangerLevel: '주의 요망',
    dangerBadge: 'caution',
    harmfulComponent: '과잉 나트륨(Na+), 세포외액 고삼투압',
    medicalReason: '① 말초 미세혈관 수축: 과다한 나트륨은 혈관 내피세포의 산화질소(NO) 생성을 억제하고 혈관을 수축시켜 두피 정수리 끝단 모세혈관의 혈류량을 감소시킵니다. ② 신장(腎) 수액 대사 부담 및 미녹시딜 부종 악화: 한의학적으로 짠맛(鹹味)의 과잉은 신수(腎水)와 혈(血)을 상하게 하여 모발 윤기를 떨어뜨리며, 특히 미녹시딜 복용 환자에서 수분 저류(얼굴·다리 부종) 부작용을 크게 악화시킵니다.',
    safeAlternative: '건더기 위주의 식사, 다시마·버섯·멸치 천연 육수, 칼륨이 풍부한 채소(단, 스피로노락톤 복용자는 과잉 칼륨 주의)'
  },
  {
    id: 'food_excess_caffeine',
    name: '고농축 에너지드링크 및 공복·야간 과다 카페인',
    examples: '고카페인 에너지드링크, 하루 4잔 이상의 진한 아메리카노, 식사 직후 진한 커피·홍차',
    dangerLevel: '주의 요망',
    dangerBadge: 'caution',
    harmfulComponent: '고용량 카페인(Caffeine >400mg/일), 탄닌·클로로겐산',
    medicalReason: '① 철분·아연 흡수 차단: 커피와 홍차의 폴리페놀(클로로겐산·탄닌)은 위장관에서 비헴철(Non-heme Iron)과 아연 이온과 킬레이트 결합을 형성해 철분 흡수율을 최대 60~70%까지 떨어뜨립니다(페리틴 저하성 여성 탈모의 주원인). ② 코르티솔 상승 및 수면 재생 차단: 과다 카페인은 교감신경을 흥분시켜 말초 두피 혈관을 수축시키고, 모낭 세포 분열이 가장 활발한 밤 11시~새벽 2시 깊은 수면(서파수면)과 성장호르몬·멜라토닌 분비를 방해합니다.',
    safeAlternative: '하루 1~2잔 이내로 식후 1시간 뒤에 마시기, 오후 2시 이후에는 디카페인 또는 흑콩차·오미자차 섭취'
  }
];
