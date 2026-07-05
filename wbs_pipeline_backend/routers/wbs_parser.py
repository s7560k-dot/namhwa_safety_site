from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import io
from services.wbs_ai_engine import match_wbs_item
import asyncio

router = APIRouter()

# 1. 계획 -> 2. 검증 -> 3. 구현
# 1. 계획:
# - Excel 파일 업로드 엔드포인트 구현.
# - 업로드된 파일을 Pandas로 파싱 (대분류, 품명, 규격, 단위, 수량, 합계 금액).
# - 룰 기반 간접비 항목(예: 전력요금, 가설사무실)을 사전에 필터링(분류).
# - 결과를 JSON 형태로 반환.

# 간접비 판별을 위한 Rule-based 키워드
INDIRECT_COST_KEYWORDS = ["가설사무실", "전력요금", "수도요금", "임대", "공과금"]

def is_indirect_cost(item_name: str) -> bool:
    """주어진 품명이 간접비 항목인지 확인합니다."""
    if not isinstance(item_name, str):
        return False
    return any(keyword in item_name for keyword in INDIRECT_COST_KEYWORDS)

@router.post("/parse-excel")
async def parse_excel_boq(file: UploadFile = File(...)):
    """엑셀 내역서를 파싱하고, AI 처리를 위해 JSON 데이터 배열을 반환합니다."""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Excel 파일(.xlsx, .xls)만 업로드 가능합니다.")
    
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # TODO: 실제 엑셀 양식에 맞춘 컬럼 매핑 로직 고도화 필요
        # 현재는 컬럼명이 정확히 일치한다고 가정하거나, 임의의 컬럼 인덱스로 매핑
        expected_columns = {
            "대분류(공종)": "major_category",
            "품명": "item_name",
            "규격": "specification",
            "단위": "unit",
            "수량": "quantity",
            "합계 금액": "total_cost"
        }
        
        # 입력 데이터 검증 (간단히 컬럼 존재 여부 확인)
        for col in expected_columns.keys():
            if col not in df.columns:
                # 엑셀 형식이 다를 수 있으므로 에러 반환 대신 일단 빈값으로 처리하도록 변경 가능
                pass

        parsed_data = []
        for index, row in df.iterrows():
            item_name = str(row.get("품명", ""))
            if not item_name or item_name == "nan":
                continue
                
            # 사전 Rule-based 필터링 (간접비 성격 항목 선분류)
            is_indirect = is_indirect_cost(item_name)
            
            row_data = {
                "major_category": str(row.get("대분류(공종)", "")),
                "item_name": item_name,
                "specification": str(row.get("규격", "")),
                "unit": str(row.get("단위", "")),
                "quantity": float(row.get("수량", 0)) if pd.notnull(row.get("수량")) else 0,
                "total_cost": float(row.get("합계 금액", 0)) if pd.notnull(row.get("합계 금액")) else 0,
                "is_indirect": is_indirect # AI 매칭 시 스킵 용도
            }
            parsed_data.append(row_data)

        # 비동기 AI 매칭 병렬 처리 (Task 그룹화)
        tasks = [match_wbs_item(row) for row in parsed_data]
        ai_results = await asyncio.gather(*tasks)

        return {
            "status": "success",
            "total_rows": len(parsed_data),
            "data": ai_results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"엑셀 파싱 중 오류가 발생했습니다: {str(e)}")
