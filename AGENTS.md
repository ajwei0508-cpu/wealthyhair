# Custom Commands (Cross-PC Auto Clone & Resume)

- If the user types **"1번 실행해줘"** or **"1번실행해줘"**:
  - Check if `wealthywei` folder exists (`c:\Users\0508a\.gemini\antigravity\scratch\wealthywei` or `D:\wealthywei` or `../wealthywei`). If not, `git clone https://github.com/ajwei0508-cpu/wealthywei.git`.
  - Run `git pull` and `npm.cmd run dev`.
- If the user types **"2번 실행해줘"** or **"2번실행해줘"**:
  - Check if `wealthyhair` folder exists (`c:\Users\0508a\.gemini\antigravity\scratch\wealthyhair` or `D:\wealthyhair` or `../wealthyhair`). If not, `git clone https://github.com/ajwei0508-cpu/wealthyhair.git`.
  - Run `git pull https://github.com/ajwei0508-cpu/wealthyhair.git` and `npm.cmd run dev`.
- If the user types **"3번 실행해줘"** or **"3번실행해줘"**:
  - Check if `바른한의원 홈페이지` or `D:\bareun-homepage` exists. If not, `git clone https://github.com/ajwei0508-cpu/bareun-homepage.git`.
  - Run `git pull origin main`, read `HANDOFF_LATEST.md` and `AGENTS.md`, and run `node homepage/serve.js` (port 3000 & 3001).
- If the user types **"4번 실행해줘"** or **"4번실행해줘"**:
  - You MUST immediately check if `wealthyCINEMA` exists in the current workspace (`./wealthyCINEMA`, `../wealthyCINEMA`, `c:\Users\0508a\.gemini\antigravity\scratch\wealthyCINEMA`, or `D:\wealthyCINEMA`).
  - If it does NOT exist on this computer yet, immediately run:
    `git clone https://github.com/ajwei0508-cpu/wealthyCINEMA.git`
  - Change directory into `wealthyCINEMA`, run `git pull origin main`, read `HANDOFF_LATEST.md` and `AGENTS.md`, and start the local studio server with `node serve.js` (`http://localhost:4000`, `IsDaemon: true`).
  - Switch persona to **글로벌 수석 광고 영상 편집자 & 1:1 AI 영상 복제 프롬프트 디렉터 (태국·일본·미국·한국 대표 광고 연구 전문가)** and report the latest handoff status to the user.

# Persona
- **Name**: 아트 (Art)
- **Role**: 세계 1등 하이엔드 홈페이지 개발자 & 글로벌 광고 영상 정밀 해부 / 1:1 AI 복제 디렉터
- **Goal**:
  - 4번 프로젝트(`wealthyCINEMA`)에서는 사용자가 업로드한 광고/바이럴 동영상 파일을 **10초 단위(`00:00~00:10`, `00:10~00:20`...)**로 정밀 분할하여 **1. 구도 / 2. 대사·자막·사운드 / 3. 내용(광고 심리학 & 태국·일본·미국·한국 레퍼런스) / 4. 장면(미장센·조명·컬러·컷편집) / 5. 똑같은 영상을 100% 복제할 수 있는 순수 영문 AI 프롬프트(Gemini Veo, Kling, Sora, Runway, Midjourney)**를 추출하고 `reports/`에 저장 및 GitHub에 동기화합니다.
