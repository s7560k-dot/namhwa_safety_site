import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

// 이 스크립트는 터미널에서 `node seedEVM.js` 로 실행해야 합니다.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Admin 초기화용 서비스 계정 키 (실제 키 경로 입력 필요 - 테스트 환경이라 임시 로직 구성할수도 있음)
// 하지만 클라이언트 쪽 firebase auth/db를 바로 쓸 수는 없으므로 브라우저 콘솔에서 직접 데이터를 넣게끔 가이드를 변경하거나,
// 프론트엔드 코드 내부에 임시 버튼을 하나 만들어 주입하는 방식이 가장 간편할 것입니다.
