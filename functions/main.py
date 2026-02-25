import json
import os
import ezdxf
import io
import tempfile
import traceback
import google.generativeai as genai
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from firebase_functions import https_fn
from firebase_admin import initialize_app

initialize_app()

def set_cors_headers(resp: https_fn.Response):
    """CORS 헤더를 항상 추가하는 헬퍼 함수"""
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp

@https_fn.on_request(max_instances=10, memory=1024)
def analyze_dxf(req: https_fn.Request) -> https_fn.Response:
    """DXF 도면 파일 파싱 및 수량(길이, 면적) 추출 클라우드 함수"""
    if req.method == "OPTIONS":
        return set_cors_headers(https_fn.Response(status=204))
    
    if req.method != "POST":
        resp = https_fn.Response(json.dumps({"detail": "Only POST method is supported"}), status=405)
        return set_cors_headers(resp)
        
    try:
        # multipart/form-data 파싱
        # (단순화를 위해 첫 번째 파일 데이터만 추출)
        files = req.files
        if not files or "file" not in files:
             resp = https_fn.Response(json.dumps({"detail": "No file uploaded"}), status=400)
             return set_cors_headers(resp)

        file_obj = files["file"]
        content = file_obj.read()
        filename = file_obj.filename

        with tempfile.NamedTemporaryFile(delete=False, suffix=".dxf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            doc = ezdxf.readfile(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        msp = doc.modelspace()
        results = {}
        
        for entity in msp:
            layer = entity.dxf.layer
            if layer not in results: results[layer] = {"length": 0.0, "area": 0.0, "count": 0}
            
            etype = entity.dxftype()
            if etype == 'LINE':
                start, end = entity.dxf.start, entity.dxf.end
                results[layer]["length"] += ((end[0]-start[0])**2 + (end[1]-start[1])**2)**0.5
            elif etype == 'LWPOLYLINE':
                points = entity.get_points()
                for i in range(len(points) - 1):
                    p1, p2 = points[i], points[i+1]
                    results[layer]["length"] += ((p2[0]-p1[0])**2 + (p2[1]-p1[1])**2)**0.5
                if entity.is_closed:
                    p1, p2 = points[-1], points[0]
                    results[layer]["length"] += ((p2[0]-p1[0])**2 + (p2[1]-p1[1])**2)**0.5
                    try: results[layer]["area"] += entity.area()
                    except: pass
            results[layer]["count"] += 1
            
        for l in results:
            results[l]["length"] = round(results[l]["length"], 3)
            results[l]["area"] = round(results[l]["area"], 3)
            
        resp = https_fn.Response(json.dumps({"filename": filename, "layers": results}), content_type="application/json")
        return set_cors_headers(resp)

    except Exception as e:
        error_msg = traceback.format_exc()
        print(f"Error Analyzing DXF: {error_msg}")
        resp = https_fn.Response(json.dumps({"detail": f"DXF Parsing Error: {str(e)}"}), status=400, content_type="application/json")
        return set_cors_headers(resp)

@https_fn.on_request()
def recommend_basis(req: https_fn.Request) -> https_fn.Response:
    if req.method == "OPTIONS":
        return set_cors_headers(https_fn.Response(status=204))
        
    item_name = req.args.get('item_name', '')
    if not item_name:
         return set_cors_headers(https_fn.Response(json.dumps({"detail": "Item name is required"}), status=400, content_type="application/json"))

    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
             raise ValueError("GEMINI_API_KEY environment variable is missing")
             
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"당신은 건설 부대토목 전문가입니다. '{item_name}' 작업에 가장 적합한 대한민국 건설공사 표준품셈 (또는 전문 시방서) 기준 조항을 추천해주십시오. 설명 없이 관련된 기준명이나 조항(예: 토목공사 표준품셈 [2-1-1])만을 매우 간결하게 핵심만 대답하세요."
        response = model.generate_content(prompt)
        ai_recommendation = response.text.strip()
        
        resp = https_fn.Response(json.dumps({"item": item_name, "recommended_basis": ai_recommendation}), content_type="application/json")
        return set_cors_headers(resp)
        
    except Exception as e:
        error_msg = traceback.format_exc()
        print(f"Gemini API Error: {error_msg}")
        resp = https_fn.Response(json.dumps({"detail": f"AI Recommendation Failed: {str(e)}"}), status=500, content_type="application/json")
        return set_cors_headers(resp)

@https_fn.on_request(max_instances=10)
def export_excel(req: https_fn.Request) -> https_fn.Response:
    if req.method == "OPTIONS":
        return set_cors_headers(https_fn.Response(status=204))
    
    if req.method != "POST":
         return set_cors_headers(https_fn.Response("Method Not Allowed", status=405))
         
    try:
        data = req.get_json(silent=True) or {}
        wb = Workbook()
        ws = wb.active
        ws.title = "수량산출서"
        
        header_fill = PatternFill(start_color="EEEEEE", end_color="EEEEEE", fill_type="solid")
        thin_border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))
        
        headers = ["No", "공종/항목", "규격", "단위", "수량", "산출근거"]
        ws.append(headers)
        for cell in ws[1]:
            cell.font = Font(bold=True)
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")
            cell.border = thin_border
            
        items = data.get("items", [])
        for i, item in enumerate(items, start=1):
            row = [i, item.get("name"), item.get("spec"), item.get("unit"), item.get("quantity"), item.get("basis")]
            ws.append(row)
            for cell in ws[ws.max_row]:
                cell.border = thin_border
                cell.alignment = Alignment(horizontal="center" if isinstance(cell.value, (int, float)) else "left")

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        wb.save(tmp.name)
        tmp_path = tmp.name
        tmp.close()
        
        with open(tmp_path, "rb") as f:
            file_data = f.read()
            
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            
        resp = https_fn.Response(
            file_data, 
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=Namhwa_Quantity_Report.xlsx"}
        )
        return set_cors_headers(resp)
    except Exception as e:
        error_msg = traceback.format_exc()
        resp = https_fn.Response(json.dumps({"detail": f"Excel Export Error: {str(e)}"}), status=500)
        return set_cors_headers(resp)