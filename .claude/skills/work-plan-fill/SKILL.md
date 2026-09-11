---
name: work-plan-fill
description: 사용자가 현장 데이터 표(마크다운 표 붙여넣기 또는 엑셀/CSV 첨부)를 주면서 "작업계획서 작성/채워줘"라고 할 때, 산업안전보건법 별표4 표준서식(work_plan 템플릿)에 매핑해 법정·실무 항목을 검토·기재하고 인쇄용 HTML 파일로 만든다.
---

# 작업계획서 자동 작성

남화토건 작업계획서 표준서식(`namhwa-safety-dashboard.web.app/work_plan`, Artifact 버전과 동일 소스)에 현장별 데이터를 채워 넣는 스킬. 매번 새 HTML 파일을 만들어 전달한다 — 실서비스 폼(work_plan/index.html) 자체는 건드리지 않는다.

## 준비물 (이 폴더 `reference/`)

| 파일 | 내용 |
|---|---|
| `template.html` | 표준서식 원본. **읽기 전용** — 항상 이 파일을 복사해서 새 산출물을 만든다. |
| `static_fields.json` | 일반사항~근로자주지 정적 필드 스키마: `{key, section, label, type, required?}` |
| `work_types.json` | 별표4 13개 작업유형: `{id, name, lift, pre_field, legal_fields[], practical_fields[], cases[]}`. `legal_fields`/`practical_fields`의 `key`는 `wt{id}_legal_{i}` / `wt{id}_field_{i}` 형식, 사전조사는 `wt{id}_pre_0`. |
| `lift_fields.json` | 중량물(id=11) 양중 계산표 32개 필드: `{key, label, type, unit, group, drives_calc, options?}`. key는 `wt11_lift_{k}`. |

## 절차

### 1. 입력 표 파싱
사용자가 붙여넣은 마크다운 표 또는 첨부한 .xlsx/.csv를 읽는다. 각 행의 "항목명"을 세 스키마 파일의 `label`/`requirement`/`title`과 대조해 대응 `key`를 찾는다. 정확히 일치하지 않으면 의미상 가장 가까운 필드에 매칭하고, 애매하면 사용자에게 확인한다. 표에 작업유형이 명시돼 있지 않으면 작업개요·투입 장비로 별표4 13개 중 해당 유형(복수 가능)을 판단하고, 애매하면 확인을 구한다.

### 2. 필드값 채우기 — 혼합 방식
- 표에 값이 있으면 그대로 쓰되 문장으로 다듬는다.
- 표에 없는 **법정 기재사항**·**실무 핵심 검토항목**은 `work_types.json`의 `cases`(사고사례)를 반영해 그 현장의 장비·공법·현장명에 맞춘 구체적 문장으로 새로 작성한다. 일반론으로 채우지 않는다.
- **계산 구동 숫자(`lift_fields.json`의 `drives_calc: true`, 특히 "해당 반경 정격하중")는 표에 없으면 절대 추정해서 채우지 않는다.** 빈칸으로 두고 최종 답변에서 "확인 필요" 항목으로 명시한다 — 정격하중은 실제 크레인 정격하중표를 봐야 나오는 값이다.
- 서명란(`sign_*`)은 항상 비워둔다.
- 체크박스(`ck_*`)는 표에 근거가 있을 때만 `true`.

### 3. 파일 생성
1. `reference/template.html` → `<현장명>_작업계획서.html`로 복사 (Read 금지 없이 통째로 Write해도 됨. 스크래치패드나 사용자가 지정한 위치에 생성).
2. 복사본의 `<title>...</title>` 줄 바로 다음에 시드 데이터 스크립트를 삽입:
   ```html
   <script>
   window.__SEED__ = {
     "fields": { "site_name": "…", "wt6_legal_0": "…", "wt11_lift_obj_w": "2.1", "ck_notify": true, … },
     "selectedTypes": [6, 11]
   };
   </script>
   ```
   - `fields`의 값은 모두 문자열(체크박스만 boolean).
3. 복사본에서 localStorage 복원 직후(`} catch (e) { /* 기본값 */ }` 다음 줄)에 시드 병합 코드를 삽입 (Edit 도구, 정확히 이 지점에):
   ```js
     } catch (e) { /* 기본값 */ }
     if (window.__SEED__) {
       state.fields = Object.assign({}, state.fields, window.__SEED__.fields || {});
       if (window.__SEED__.selectedTypes) state.selectedTypes = window.__SEED__.selectedTypes.slice();
     }
   ```
   반드시 이 위치(localStorage 복원 **이후**)에 넣을 것 — `var state = {...}` 선언 줄에서 바로 병합하면 이후의 localStorage 복원 로직이 시드값을 덮어써 버린다(이 서식은 같은 브라우저에서 열었던 이전 값을 기억하는 자동저장 기능이 있음).

### 4. 검증 (생략 금지)
Browser 도구로 생성 파일을 열어 확인:
- 선택된 작업유형 카드가 켜져 있고, 법정/실무 항목에 값이 채워져 있는가
- 중량물 작업 포함 시 양중 계산표 결과(총 인양하중·인양률·안전율 등)가 실제로 계산되어 나오는가 (`recalcLift`가 로드시 자동 실행됨)
- 하단 진행바("필수 검토항목")가 0/0이 아닌가
문제가 있으면 시드 데이터를 고쳐 다시 만든다.

### 5. 전달
- `SendUserFile`로 완성 HTML 전달.
- 응답에 반드시 포함:
  1. 표에서 못 채운 항목 목록 — 특히 계산용 숫자("정격하중표에서 확인 필요" 등)
  2. Claude가 표에 없던 내용을 새로 작성한 법정/실무 항목 목록 (사용자 검수용)
  3. 사용법: 파일 열기 → 내용 확인/수정 → "인쇄 / PDF 저장" 버튼 (여백 25/10/10/10mm, 필드 자동 계산 결과 포함해 출력됨)
- 이번 건을 남화 안전보건 자료실(namhwa-safety-dashboard)에도 올릴지는 물어본다 — 기본은 개별 파일 전달로 끝낸다(자료실 반영은 별도 요청 시).

## 원칙
- 법정 기재사항의 **항목명 자체는 바꾸지 않는다** (별표4 원문). 그 아래 내용만 채운다.
- 근거 없는 "적정"·"충분" 같은 판정 문구를 임의로 쓰지 않는다 — 안전율처럼 판정이 필요한 값은 실제 입력이 있을 때 폼의 계산 로직이 산출하도록 두고, Claude가 텍스트로 결론을 대신 써넣지 않는다.
- 계산에 쓰이는 수치를 지어내지 않는다(위 2.항 참조). 근거가 부족하면 채우지 말고 사용자에게 확인 요청.
