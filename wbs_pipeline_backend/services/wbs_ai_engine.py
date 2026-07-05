import os
import json
import google.generativeai as genai
from typing import Dict, Any, List

# 1. 계획 -> 2. 검증 -> 3. 구현
# 1. 계획:
# - wbs_ai_prompt_guide.md 내용에 기반한 페르소나 및 시스템 프롬프트 작성.
# - Mock WBS DB와 Mock Safety DB를 로드하여 컨텍스트(RAG 대용)로 주입.
# - Gemini 2.5 Flash 모델 초기화 (API Key 필요).
# - 입력된 엑셀 파싱 JSON 데이터를 바탕으로 매핑 결과 반환.
# - (에러 방지를 위해 API KEY가 없으면 Mock 응답을 반환하도록 처리)

# 환경 변수에서 API 키 로드
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Mock DB 로드
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WBS_DB_PATH = os.path.join(BASE_DIR, "data", "mock_wbs_db.json")
SAFETY_DB_PATH = os.path.join(BASE_DIR, "data", "mock_safety_db.json")

def load_mock_db(filepath: str) -> List[Dict]:
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

WBS_CODEBOOK = load_mock_db(WBS_DB_PATH)
SAFETY_RISK_DB = load_mock_db(SAFETY_DB_PATH)

def build_system_prompt() -> str:
    """wbs_ai_prompt_guide.md 기반의 시스템 프롬프트를 생성합니다."""
    prompt = """
당신은 20년 경력의 대한민국 최고 건설 공정 관리자이자 안전보건 전문가입니다.
사용자가 엑셀 내역서(BoQ)의 한 행(Row) 데이터를 JSON 형태로 입력하면, 당신은 제공된 '표준 WBS 마스터 코드북'과 비교하여 가장 적합한 계층으로 분류해야 합니다.

[작업 지시 사항]
1. 입력된 `item_name`과 `major_category`의 맥락을 파악하여 아래 제공된 [표준 WBS 코드북] 내에서 가장 적합한 Level 1, Level 2, Level 3 명칭과 고유 코드(PNS)를 할당하세요. 절대 임의의 코드를 생성하지 마세요. (Hallucination 금지)
2. 입력된 `total_cost`(비용)는 그대로 유지하여 출력하세요.
3. 해당 작업 수행 시 예상되는 [주요 안전 리스크 1가지]와 [필수 점검 서류]를 도출하세요. 제공된 [안전보건 위험성 평가 DB]를 참고하세요.
4. 출력은 반드시 약속된 JSON 포맷으로만 응답하세요. 텍스트 설명은 제외합니다.

[표준 WBS 코드북 (Mock Context)]
{wbs_context}

[안전보건 위험성 평가 DB (Mock Context)]
{safety_context}

[출력 JSON 포맷 강제 스키마 예시]
{{
  "wbs_mapping": {{
    "level_1": {{"code": "...", "name": "..."}},
    "level_2": {{"code": "...", "name": "..."}},
    "level_3": {{"code": "...", "name": "...", "mapped_item": "...", "spec": "..."}}
  }},
  "metrics": {{
    "cost_krw": 0,
    "estimated_duration_days": 0
  }},
  "safety_management": {{
    "primary_risk": "...",
    "checklist_required": "..."
  }}
}}
"""
    return prompt.format(
        wbs_context=json.dumps(WBS_CODEBOOK, ensure_ascii=False, indent=2),
        safety_context=json.dumps(SAFETY_RISK_DB, ensure_ascii=False, indent=2)
    )

async def match_wbs_item(parsed_row: Dict[str, Any]) -> Dict[str, Any]:
    """Gemini API를 호출하여 단일 엑셀 행 데이터를 WBS 표준 코드로 매핑합니다."""
    
    # 간접비 항목인 경우 AI를 태우지 않고 룰 기반으로 조기 반환 (비용 절감)
    if parsed_row.get("is_indirect", False):
        return {
            "wbs_mapping": {
                "level_1": {"code": "PRJ-IND-000", "name": "공통/간접비"},
                "level_2": {"code": "PRJ-IND-100", "name": "현장 운영비"},
                "level_3": {"code": "PRJ-IND-110", "name": parsed_row.get("item_name", "간접비"), "mapped_item": parsed_row.get("item_name"), "spec": parsed_row.get("specification")}
            },
            "metrics": {
                "cost_krw": parsed_row.get("total_cost", 0),
                "estimated_duration_days": 0
            },
            "safety_management": {
                "primary_risk": "해당 없음 (간접비)",
                "checklist_required": "해당 없음"
            }
        }

    input_json = json.dumps({
        "major_category": parsed_row.get("major_category"),
        "item_name": parsed_row.get("item_name"),
        "specification": parsed_row.get("specification"),
        "unit": parsed_row.get("unit"),
        "quantity": parsed_row.get("quantity"),
        "total_cost": parsed_row.get("total_cost")
    }, ensure_ascii=False)

    # API 키가 없으면 Mock 응답 반환 (테스트 용이성)
    if not GEMINI_API_KEY:
        # Mocking logic for demonstration without API key
        return {
            "wbs_mapping": {
                "level_1": {"code": "PRJ-A1-001", "name": "건축공사 전체"},
                "level_2": {"code": "PRJ-A2-010", "name": "가설 및 토공사"},
                "level_3": {"code": "PRJ-A3-015", "name": "세륜기 및 가설시설물 설치/해체", "mapped_item": parsed_row.get("item_name"), "spec": parsed_row.get("specification")}
            },
            "metrics": {
                "cost_krw": parsed_row.get("total_cost", 0),
                "estimated_duration_days": 3
            },
            "safety_management": {
                "primary_risk": "장비 양중 시 중량물 낙하 및 설치 중 협착 위험 (Mock)",
                "checklist_required": "크레인 작업허가서(PTW), 줄걸이 용구 점검표"
            }
        }

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=build_system_prompt()
        )
        
        response = model.generate_content(
            f"다음 데이터를 분류해주세요:\n{input_json}",
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        # 실패 시 Fallback 구조 반환
        return {
            "error": "AI Mapping Failed",
            "message": str(e),
            "original_data": parsed_row
        }
