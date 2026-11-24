# 세종대왕의 답장 — 배포 안내

학생은 QR코드로 학생 페이지에 접속해 활동지를 촬영/업로드합니다. AI는 사진에서 학생의 실제 아이디어를 읽고 개인 맞춤 답장을 생성합니다. 교사는 별도 로그인 페이지에서 전체 목록과 이름/번호 검색을 함께 사용할 수 있습니다.

## 파일
- `index.html`, `style.css`, `app.js`: 학생용 화면
- `teacher.html`, `teacher.js`: 교사용 전체 목록 + 검색 화면
- `supabase/schema.sql`: 비공개 사진 저장소와 데이터베이스 권한
- `supabase/functions/answer/index.ts`: OpenAI 이미지 분석 및 맞춤 답장 생성

## A. Supabase 준비
1. https://supabase.com 에서 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
3. Project Settings → API에서 Project URL과 `anon`/`publishable` public key를 복사합니다.
4. `app.js`와 `teacher.js`의 `YOUR_SUPABASE_URL`, `YOUR_SUPABASE_ANON_KEY`를 같은 값으로 교체합니다. 이 값은 브라우저에서 사용해도 되는 공개 키입니다.
5. Authentication → Users에서 교사 계정을 직접 생성합니다. 학생 계정은 만들지 않습니다.

## B. AI 답장 함수 배포
1. 컴퓨터에 Supabase CLI를 설치하고 터미널에서 로그인합니다.
2. 프로젝트 폴더에서 `supabase link --project-ref 프로젝트참조ID`를 실행합니다. 참조 ID는 프로젝트 URL의 `https://참조ID.supabase.co` 부분입니다.
3. OpenAI API 키를 안전하게 Supabase에 등록합니다:
   `supabase secrets set OPENAI_API_KEY=실제_OpenAI_API_키`
4. 함수 배포:
   `supabase functions deploy answer`
5. 함수는 서버에서 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 환경변수를 사용합니다. 이 키들을 HTML/JS/GitHub 저장소에 절대 넣지 마세요.

## C. GitHub Pages 배포
1. GitHub에서 새 Public 저장소를 만듭니다(예: `sejong-reply`).
2. 이 프로젝트 폴더 안의 파일과 `supabase` 폴더를 저장소 최상위에 업로드합니다. `index.html`이 저장소 최상위에 있어야 합니다.
3. GitHub 저장소 Settings → Pages → Build and deployment에서 `Deploy from a branch`, `main`, `/(root)`를 선택하고 Save를 누릅니다.
4. 배포가 끝나면 `https://깃허브아이디.github.io/sejong-reply/` 형태의 주소가 생깁니다.
5. 교사용 주소는 같은 주소 뒤에 `teacher.html`을 붙입니다.
6. 학생 페이지를 휴대전화에서 열어 HTTPS 카메라 권한을 허용하고 테스트합니다.

## D. 꼭 확인할 보안·개인정보 사항
- `service_role` 키와 OpenAI API 키는 절대 GitHub에 올리지 마세요. 이미 공개했다면 즉시 폐기/재발급하세요.
- 저장소는 비공개(Private)로 바꾸기보다 GitHub Pages 무료 공개 배포 조건을 확인한 뒤, 학생 페이지 주소를 아는 학급 구성원만 사용하도록 안내하세요. 페이지 자체는 공개 주소입니다.
- 학생 사진에는 얼굴, 이름표, 주소 등 불필요한 개인정보가 나오지 않게 합니다. 이름 대신 번호/별명을 권장합니다.
- 사진 저장은 비공개 Storage이며 교사 로그인으로만 조회되도록 정책을 설정했습니다. 교사 계정은 신뢰할 수 있는 담당자만 발급하세요.
- 학생 사진을 온라인 AI 서비스로 처리하므로 학교/교육청의 개인정보·AI 활용 지침과 보호자 안내/동의 절차를 먼저 확인하세요.
- OpenAI API 사용료가 발생할 수 있습니다. 계정의 사용량 한도를 설정하고 소수 학생으로 먼저 시험하세요.
- AI가 손글씨를 잘못 읽을 수 있습니다. 학생에게 답장을 사실 판정이나 성적 평가로 사용하지 않는다고 안내하세요.

## E. 첫 테스트 순서
1. 교사 페이지에서 로그인되는지 확인합니다.
2. 학생 페이지에서 테스트용 활동지(개인정보가 없는 샘플)를 올립니다.
3. 답장이 학생이 쓴 구체적인 물건/활용 아이디어를 언급하는지 확인합니다.
4. 교사 페이지 새로고침 후 사진과 답장이 나타나는지 확인합니다.
5. 이름/번호 검색이 동작하는지 확인합니다.

문제가 생기면 브라우저 개발자 도구의 Console과 Supabase Edge Functions 로그를 확인합니다.
