import React, { useState, useRef } from "react";
import { ArrowLeft, UploadCloud, RefreshCw, AlertTriangle, Box as BoxIcon } from "lucide-react";
import { Link } from "react-router-dom";
import FloorPlan3DViewer from "./FloorPlan3DViewer";
// 클라이언트에서 Gemini SDK를 직접 호출하지 않고 Firebase Functions(백엔드)를 경유합니다.
// 이렇게 하면 API 키를 안전하게 서버에만 보관할 수 있습니다.

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

        setIsLoading(true);
        setError(null);

        try {
            // 업로드된 이미지에서 mimeType을 추출 (data:image/png;base64... 형식에서 추출)
            const mimeMatch = imageSrc.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
            const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

            // Firebase Hosting의 60초 타임아웃 제한을 피하기 위해 클라우드 함수의 직접 URL을 호출합니다.
            const CLOUD_FUNCTION_URL = "https://us-central1-namhwa-safety-dashboard.cloudfunctions.net/analyze_floorplan_3d";

            const response = await fetch(CLOUD_FUNCTION_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageBase64: imageSrc,
                    mimeType: mimeType
                })
            });

            // 1. 응답 데이터를 텍스트로 먼저 추출
            const responseText = await response.text();

            // 2. 상태 코드가 정상이 아닌 경우 처리 (HTML 에러 페이지 등)
            if (!response.ok) {
                console.error(`[API 에러] 상태 코드: ${response.status}, 응답 텍스트:`, responseText);

                let errorMessage = "서버에서 도면을 분석하는 중 오류가 발생했습니다.";
                try {
                    // 에러 응답이 JSON 포맷이라면 상세 메시지 추출
                    const errorJson = JSON.parse(responseText);
                    errorMessage = errorJson.detail || errorMessage;
                } catch (e) {
                    // HTML 문서 등 파싱 불가능한 텍스트일 경우
                    errorMessage = `서버 통신 오류 (상태: ${response.status}). 자세한 내용은 콘솔(F12)을 확인하세요.`;
                }
                throw new Error(errorMessage);
            }

            // 3. 정상 응답일 경우 JSON으로 변환
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error("[JSON 파싱 에러] 서버에서 받은 응답:", responseText);
                throw new Error("서버가 유효하지 않은 데이터(JSON 아님)를 반환했습니다.");
            }

            if (!result.data || !result.data.walls || !Array.isArray(result.data.walls)) {
                throw new Error("서버 응답(데이터 구조)이 올바르지 않습니다.");
            }

            setParsedData(result.data);
        } catch (err) {
            console.error("분석 에러:", err);
            setError("AI 변환 실패: " + (err.message || "Unknown error"));
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

                {/* 왼쪽: 컨트롤 패널 (업로드 & 설정) - lg:col-span-4 */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* 도면 업로드 카드 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col h-full">
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
                                        AI 분석 중 (약 5~10초 소요)...
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
