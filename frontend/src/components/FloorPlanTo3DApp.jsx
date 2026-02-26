import React, { useState, useRef } from "react";
import { ArrowLeft, UploadCloud, RefreshCw, AlertTriangle, Box as BoxIcon } from "lucide-react";
import { Link } from "react-router-dom";
import FloorPlan3DViewer from "./FloorPlan3DViewer";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. 계획 (상태 정의)
// - 업로드된 이미지 파일(base64) 상태
// - API 로딩(분석 중) 상태
// - 에러 메시지 상태
// - Gemini API로부터 완성되어 돌아온 파싱 데이터(JSON) 상태

// Vite 환경이므로 import.meta.env 사용 (주의: .env에 VITE_GEMINI_API_KEY 설정 필요)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export default function FloorPlanTo3DApp() {
    const [imageSrc, setImageSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedData, setParsedData] = useState(null);

    const fileInputRef = useRef(null);

    // 2. 구현: 이미지 업로드 핸들러 (Base64 변환)
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setParsedData(null);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageSrc(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // 3. 구현: API 호출 및 데이터 주입 파이프라인
    const analyzeFloorplan = async () => {
        if (!imageSrc) {
            setError("먼저 평면도 이미지를 업로드해주세요.");
            return;
        }

        if (!API_KEY) {
            setError("VITE_GEMINI_API_KEY 환경변수가 설정되지 않았습니다. 관리자에게 문의하세요.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.1,
                },
                systemInstruction: `
          너는 전문 건축 CAD AI다. 주어진 평면도 이미지를 분석하여 
          벽(walls), 문(doors), 창문(windows)의 상대적 좌표(x, y)와 크기를 극도로 정확하게 추출하라.
          
          원점(0, 0)은 도면의 좌측 상단 또는 좌측 하단을 기준으로 일관되게 적용하라.
          좌표 단위는 밀리미터(mm)를 가정하고 논리적인 픽셀 비율로 환산해서 제공하라.
          
          반드시 아래의 JSON 스키마 구조와 100% 일치하게 반환해야 하며, 마크다운 코드 블록(\`\`\`json) 등 그 어떤 부가적인 텍스트도 포함하지 마라.
          
          [JSON 스키마]
          {
            "walls": [
              {
                "id": "고유문자열 (예: wall-1)",
                "start": { "x": 숫자, "y": 숫자 },
                "end": { "x": 숫자, "y": 숫자 },
                "thickness": 숫자 (벽 두께),
                "height": 숫자 (벽 높이, 기본값 2800)
              }
            ],
            "doors": [
              {
                "id": "고유문자열",
                "wallId": "이 문이 위치한 벽체의 id",
                "start": { "x": 숫자, "y": 숫자 },
                "end": { "x": 숫자, "y": 숫자 },
                "thickness": 숫자,
                "height": 숫자 (기본값 2100)
              }
            ],
            "windows": [
              {
                "id": "고유문자열",
                "wallId": "이 창문이 위치한 벽체의 id",
                "start": { "x": 숫자, "y": 숫자 },
                "end": { "x": 숫자, "y": 숫자 },
                "thickness": 숫자,
                "height": 숫자 (기본값 1200),
                "elevation": 숫자 (바닥에서 창문 아래까지의 높이, 기본값 900)
              }
            ]
          }
        `,
            });

            const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, "");
            // 업로드된 이미지에서 mimeType을 추출 (data:image/png;base64... 형식에서 추출)
            const mimeMatch = imageSrc.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
            const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

            const prompt = "첨부된 평면도 이미지를 분석하여 지정된 JSON 포맷으로 구조화된 공간 데이터를 추출해 줘.";

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Data, mimeType } }
            ]);
            const responseText = result.response.text();

            const cleanJsonText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(cleanJsonText);

            if (!parsed.walls || !Array.isArray(parsed.walls)) {
                throw new Error("응답에 walls 배열이 없습니다.");
            }

            setParsedData(parsed);
        } catch (err) {
            console.error("분석 에러:", err);
            setError("AI가 도면을 분석하는 데 실패했습니다: " + (err.message || "Unknown error"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-24 pb-12 px-6">

            {/* 헤더 이동 컨트롤 */}
            <div className="w-full max-w-7xl mb-6">
                <Link to="/" className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                    <ArrowLeft size={16} className="mr-2" /> 뒤로 가기
                </Link>
            </div>

            {/* 헤더 */}
            <div className="w-full max-w-4xl text-center mb-10">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-2xl mb-4">
                    <BoxIcon size={32} />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
                    2D 도면 <span className="text-indigo-600">3D</span> 변환기
                </h1>
                <p className="text-slate-500 text-lg">
                    Google Gemini Vision API가 평면도를 분석하여 벽체를 3D 메쉬로 시각화합니다.
                </p>
            </div>

            {/* 메인 컨텐츠 영역 */}
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 h-auto lg:h-[700px]">

                {/* 왼쪽: 컨트롤 패널 (업로드 & 미리보기) - lg:col-span-4 */}
                <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col">
                    <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                        <UploadCloud size={20} className="text-indigo-500" /> 도면 업로드
                    </h2>

                    {/* 파일 업로드 박스 */}
                    <div
                        className={`w-full h-48 md:h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${imageSrc ? "border-indigo-400 bg-indigo-50/50 p-2" : "border-slate-300 hover:border-indigo-300 bg-slate-50"}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            accept="image/jpeg, image/png, image/webp"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                        />
                        {imageSrc ? (
                            <img src={imageSrc} alt="uploaded floorplan" className="h-full w-full object-contain rounded-lg" />
                        ) : (
                            <div className="text-center p-4">
                                <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600 font-bold">도면 이미지를 선택하세요</p>
                                <p className="mt-1 text-xs text-slate-400">JPG, PNG 파일 지원</p>
                            </div>
                        )}
                    </div>

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="w-full mt-4 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-2 leading-relaxed font-medium">
                            <AlertTriangle className="shrink-0 mt-0.5" size={16} /> {error}
                        </div>
                    )}

                    <div className="mt-auto pt-6">
                        {/* 분석 버튼 */}
                        <button
                            onClick={analyzeFloorplan}
                            disabled={!imageSrc || isLoading}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${!imageSrc || isLoading
                                    ? "bg-slate-300 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="animate-spin" size={20} />
                                    AI 분석 중...
                                </>
                            ) : (
                                <>
                                    <BoxIcon size={20} />
                                    3D 모델 생성
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 오른쪽: 3D 렌더링 뷰어 영역 - lg:col-span-8 */}
                <div className="lg:col-span-8 bg-slate-900 rounded-2xl shadow-xl overflow-hidden relative flex flex-col border border-slate-800 h-[500px] lg:h-full">
                    {parsedData ? (
                        <FloorPlan3DViewer data={parsedData} />
                    ) : (
                        <div className="text-center text-slate-500 m-auto flex flex-col items-center">
                            <BoxIcon className="h-16 w-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">AI가 공간을 모델링하면 이곳에 3D가 표시됩니다.</p>
                        </div>
                    )}
                </div>
            </div >

        </div >
    );
}
