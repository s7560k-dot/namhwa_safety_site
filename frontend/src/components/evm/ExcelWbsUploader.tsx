import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../../firebase';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { WbsTask } from './types';

// Staging용 임시 데이터 타입
export interface StagedTask {
    id: string; // 임시 ID (UI 매핑/삭제 용도)
    name: string;
    pv: number;
    mappedTaskId: string; // 매핑할 대상 WBS의 ID (빈 문자열이면 제외)
}

interface ExcelWbsUploaderProps {
    projectId: string;
    existingTasks: WbsTask[]; // 부모로부터 현재 DB에 등록된 WBS 목록을 받아옴
    onSuccess: () => void;
}

const ExcelWbsUploader: React.FC<ExcelWbsUploaderProps> = ({ projectId, existingTasks, onSuccess }) => {
    const [isParsing, setIsParsing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [stagedTasks, setStagedTasks] = useState<StagedTask[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 데이터 컬럼 인덱스 매핑 (사용자가 양식에 맞춰 쉽게 수정할 수 있도록 상수로 관리)
    const COL_INDEX = {
        CODE: 0,        // 품목 코드 (ex: '01010105')
        NAME: 1,        // 품명 (ex: '철근콘크리트공사')
        COST: 12,       // 합계 금액 (엑셀의 '합 계' 아래 '금 액' 열, A열이 0일 때 M열이면 12)
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setErrorMsg(null);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });

                // 2. 타겟 시트(Sheet) 엄격한 제한
                // "원가"가 포함된 시트 제외, 정확히 "총괄집계" 또는 "공종별집계" 인 시트만 파싱
                const summarySheetName = wb.SheetNames.find(name =>
                    !name.includes('원가') &&
                    (name.trim() === '총괄집계' || name.trim() === '공종별집계' || name.includes('총괄집계') || name.includes('공종별집계'))
                );

                if (!summarySheetName) {
                    throw new Error('"총괄집계" 또는 "공종별집계" 시트를 찾을 수 없습니다.');
                }

                let tempTasks: StagedTask[] = [];

                const ws = wb.Sheets[summarySheetName];
                const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (!aoa || aoa.length < 4) {
                    throw new Error('시트에 충분한 데이터가 없습니다.');
                }

                // 간접비 필터링 키워드
                const excludeKeywords = ["보험료", "보전비", "관리비", "수수료", "이윤", "부가세", "합계", "총계", "소계"];

                for (let i = 0; i < aoa.length; i++) {
                    const row = aoa[i];
                    if (!row || row.length === 0) continue;

                    // 유연한 코드 탐색 (Index 0 ~ 4 범위를 탐색하여 숫자로 시작하는 첫 번째 유효 문자열 찾기)
                    let code = '';
                    let codeIndex = -1;
                    for (let c = 0; c <= 4; c++) {
                        const val = row[c] ? String(row[c]).trim() : '';
                        if (val && /^\d/.test(val)) {
                            code = val;
                            codeIndex = c;
                            break;
                        }
                    }

                    // 조건 A: 코드가 존재해야 함 (숫자로 시작)
                    if (!code) continue;

                    // 유연한 공종명 추출: 코드가 발견된 열부터 뒤로 3칸 정도의 데이터를 합침
                    const nameParts = [code];
                    for (let c = codeIndex + 1; c <= codeIndex + 3 && c < row.length; c++) {
                        if (row[c]) nameParts.push(String(row[c]).trim());
                    }
                    const taskName = nameParts.filter(Boolean).join(' ');

                    // 조건 B: 간접비 키워드가 포함되어 있으면 무조건 제외
                    const cleanTaskName = taskName.replace(/\s+/g, '');
                    if (excludeKeywords.some(keyword => cleanTaskName.includes(keyword))) {
                        continue;
                    }

                    // 유연한 금액 탐색: 코드열 뒤부터 역순으로 탐색하여 처음 발견되는 유효숫자(1 이상)를 추출
                    // 엑셀 양식에서 보통 '합계'가 맨 우측에 있기 때문
                    let cost = 0;
                    for (let c = row.length - 1; c > codeIndex; c--) {
                        if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') {
                            const numStr = String(row[c]).replace(/,/g, '').trim();
                            const parsedNum = Number(numStr);
                            // 1 미만의 소수점(요율 등)은 무시
                            if (!isNaN(parsedNum) && parsedNum >= 1) {
                                cost = parsedNum;
                                break;
                            }
                        }
                    }

                    // 조건 C: 파싱된 금액이 1 이상이어야 함 (너무 엄격했던 100 조건을 1로 완화)
                    if (cost >= 1) {
                        tempTasks.push({
                            id: `staged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            name: taskName,
                            pv: cost,
                            mappedTaskId: '' // 기본적으로 선택 안함 상태
                        });
                    }
                }

                if (tempTasks.length === 0) {
                    throw new Error('파싱할 수 있는 유효한 공종 데이터가 하나도 없습니다. 양식을 확인해 주세요.');
                }

                setStagedTasks(tempTasks);
                if (fileInputRef.current) fileInputRef.current.value = '';

            } catch (err: any) {
                console.error("엑셀 파싱 에러:", err);
                setErrorMsg(err.message || '설계 내역서 엑셀 파일을 파싱하는 중 오류가 발생했습니다.');
                if (fileInputRef.current) fileInputRef.current.value = '';
            } finally {
                setIsParsing(false);
            }
        };

        reader.onerror = () => {
            setErrorMsg('파일을 읽어오는 중 브라우저 오류가 발생했습니다.');
            setIsParsing(false);
        };

        reader.readAsBinaryString(file);
    };

    // Staging 데이터 수정 핸들러
    const handleTaskModify = (id: string, field: keyof StagedTask, value: any) => {
        setStagedTasks(prev => prev.map(task =>
            task.id === id ? { ...task, [field]: value } : task
        ));
    };

    // Staging 데이터 삭제 핸들러 (불필요한 집계행 제거용)
    const handleTaskRemove = (id: string) => {
        setStagedTasks(prev => prev.filter(task => task.id !== id));
    };

    // 최종 DB Cost Loading (기존 데이터에 금액 업데이트)
    const handleFinalSubmit = async () => {
        if (stagedTasks.length === 0) return;

        // 매핑된 타겟 ID 기준으로 금액 합산 수행
        const costToLoad = new Map<string, number>();
        let mappedCount = 0;

        stagedTasks.forEach(task => {
            if (task.mappedTaskId) {
                const prevSum = costToLoad.get(task.mappedTaskId) || 0;
                costToLoad.set(task.mappedTaskId, prevSum + task.pv);
                mappedCount++;
            }
        });

        if (mappedCount === 0) {
            alert('대상 공정에 매핑된 항목이 하나도 없습니다. 최소 하나의 항목을 할당해주세요.');
            return;
        }

        if (!confirm(`총 ${mappedCount}건의 원가를 기존 ${costToLoad.size}개의 WBS 공정에 분배/할당하시겠습니까? (선택안함 처리된 항목은 무시됩니다)`)) return;

        setIsSaving(true);
        try {
            const batch = db.batch();
            const colRef = db.collection('sites').doc(projectId).collection('wbs_tasks');

            costToLoad.forEach((additionalCost, targetTaskId) => {
                const targetTask = existingTasks.find(t => t.id === targetTaskId);
                if (targetTask) {
                    const docRef = colRef.doc(targetTaskId);
                    // 기존 pv(계획예산)에 새 비용을 더해서 업데이트 수행
                    batch.update(docRef, {
                        pv: (targetTask.pv || 0) + additionalCost
                    });
                }
            });

            await batch.commit();

            alert('✅ 성공적으로 기존 WBS에 원가(Cost Loading)가 할당되었습니다!');
            setStagedTasks([]); // Staging 초기화
            onSuccess(); // 대시보드 새로고침

        } catch (error) {
            console.error('DB 업데이트 에러:', error);
            alert('Firestore에 원가를 업데이트하는 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* 상단 파일 업로드 영역 */}
            <div className={`bg-white rounded-xl border p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${stagedTasks.length > 0 ? 'border-emerald-300 shadow-md ring-4 ring-emerald-50' : 'border-emerald-100 shadow-sm hover:shadow-md'}`}>
                <div>
                    <h3 className="text-base font-bold text-emerald-800 flex items-center">
                        <FileSpreadsheet className="mr-2" size={18} />
                        설계 내역서(Excel) WBS 연동
                    </h3>
                    <p className="text-[11px] text-gray-500 font-bold mt-1">
                        DB로 바로 저장되지 않습니다. 엑셀을 업로드 한 뒤 아래 표에서 제외할 행을 지우고 매핑을 완료해 주세요. (타겟 시트명: <strong className="text-gray-700 bg-gray-100 px-1 rounded">총괄집계</strong>, 비용 열 <strong className="text-gray-700 bg-gray-100 px-1 rounded">M</strong> 기준)
                    </p>
                    {errorMsg && (
                        <p className="text-[10px] text-red-500 font-bold mt-2 flex items-center animate-pulse">
                            <AlertCircle size={12} className="mr-1" /> {errorMsg}
                        </p>
                    )}
                </div>

                {stagedTasks.length === 0 && (
                    <div className="flex-shrink-0 relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            ref={fileInputRef}
                            disabled={isParsing}
                        />
                        <button
                            disabled={isParsing}
                            className="flex items-center px-5 py-2.5 text-xs font-black tracking-wide text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                        >
                            {isParsing ? (
                                <>
                                    <span className="animate-spin h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full mr-2"></span>
                                    엑셀 분석 중...
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={16} className="mr-1.5" /> 내역서 찾아보기
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* 중간 렌더링 : Staging 미리보기 및 편집 테이블 */}
            {stagedTasks.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
                    <div className="bg-blue-50/50 p-4 border-b border-gray-200 flex justify-between items-center sm:flex-nowrap flex-wrap gap-2">
                        <h4 className="text-sm font-black text-blue-900">
                            미리보기 목록 편집 <span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded ml-2 text-xs">{stagedTasks.length}건</span>
                        </h4>
                        <div className="text-xs text-gray-500 font-bold">
                            공정표와 무관한 상위 집계행 등은 우측 삭제 버튼으로 지워주세요.
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-sm text-center">
                            <thead className="bg-gray-50 sticky top-0 shadow-sm z-10 text-gray-500 text-[11px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-3 py-3 w-1/3 whitespace-nowrap text-left">엑셀 내역명 (읽기 전용)</th>
                                    <th className="px-3 py-3 text-right whitespace-nowrap border-r border-gray-200">금액 (PV)</th>
                                    <th className="px-3 py-3 w-2/5 whitespace-nowrap text-left border-l border-gray-200">대상 공정 매핑(선택)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stagedTasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-blue-50/20 transition-colors">
                                        <td className="px-3 py-2 text-left">
                                            <div className="text-xs font-bold text-gray-800 break-words">{task.name}</div>
                                        </td>
                                        <td className="px-3 py-2 text-right font-black text-emerald-600 border-r border-gray-100">
                                            {task.pv.toLocaleString()}
                                        </td>
                                        <td className="px-2 py-2 text-left border-l border-gray-100">
                                            <select
                                                value={task.mappedTaskId}
                                                onChange={(e) => handleTaskModify(task.id, 'mappedTaskId', e.target.value)}
                                                className={`w-full text-xs font-bold ${task.mappedTaskId ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-gray-400 bg-gray-50 border-gray-200'} border rounded px-2 py-1.5 focus:border-blue-500 outline-none`}
                                            >
                                                <option value="">-- 매핑 대상 선택 안 함 (제외) --</option>
                                                {existingTasks.map(wbs => (
                                                    <option key={wbs.id} value={wbs.id}>
                                                        {wbs.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center sm:flex-nowrap flex-wrap gap-3">
                        <button
                            onClick={() => {
                                if (confirm('모든 매핑 데이터를 삭제하고 취소하시겠습니까?')) setStagedTasks([]);
                            }}
                            className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            초기화 및 취소
                        </button>
                        <button
                            onClick={handleFinalSubmit}
                            disabled={isSaving}
                            className="flex items-center px-6 py-2.5 text-xs font-black tracking-wide text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                        >
                            {isSaving ? (
                                <>
                                    <span className="animate-spin h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full mr-2"></span>
                                    저장 중...
                                </>
                            ) : (
                                `최종 원가 예산(Cost Loading) 할당 및 업데이트`
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExcelWbsUploader;
