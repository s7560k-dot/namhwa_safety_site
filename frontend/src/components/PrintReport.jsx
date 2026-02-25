import React from 'react';

const PrintReport = ({ data, siteName, currentDate, accidentFreeDays, targetDays }) => {
    return (
        <div className="print-only p-2">
            <div className="report-title-area text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-4xl font-black mb-4">안전보건 일일 리포트</h1>
                <div className="flex justify-between text-base px-2">
                    <span>현장명: {siteName}</span>
                    <span>작성일: {currentDate}</span>
                    <span>무재해: {accidentFreeDays}일 (목표: {targetDays}일)</span>
                </div>
            </div>
            {/* 1. 금일 출력 현황 */}
            <div className="mb-6 avoid-break">
                <h2 className="report-section-title">1. 금일 출력 현황</h2>
                <table className="report-table text-center">
                    <thead>
                        <tr className="bg-gray-100"><th>공종</th><th>인원</th><th>공종</th><th>인원</th><th>공종</th><th>인원</th></tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: Math.ceil(data.workerList.length / 3) }).map((_, rowIndex) => (
                            <tr key={rowIndex}>
                                {[0, 1, 2].map(colIndex => {
                                    const item = data.workerList[rowIndex * 3 + colIndex];
                                    // 공종명이 있거나 인원이 0보다 큰 경우만 표시, 그 외엔 빈 칸
                                    const hasContent = item && (item.trade?.trim() || parseInt(item.count || 0) > 0);
                                    return hasContent ? (
                                        <React.Fragment key={colIndex}>
                                            <td className="w-[20%]">{item.trade}</td>
                                            <td className="w-[13.3%] font-bold">{item.count}명</td>
                                        </React.Fragment>
                                    ) : (
                                        <React.Fragment key={colIndex}>
                                            <td className="w-[20%]"></td>
                                            <td className="w-[13.3%]"></td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        ))}
                        <tr className="font-bold bg-gray-50 border-t-2 border-black">
                            <td colSpan="5" className="text-right pr-6 py-2">총 출력 인원</td>
                            <td className="py-2 text-blue-700">{data.workerList.reduce((acc, cur) => acc + parseInt(cur.count || 0), 0)}명</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {/* 2. 고위험 작업 */}
            <div className="mb-6 avoid-break">
                <h2 className="report-section-title">2. 고위험 작업 및 TBM(위험성평가) 기록</h2>
                <table className="report-table">
                    <thead><tr className="bg-gray-100"><th width="15%">작업팀</th><th width="25%">작업명</th><th width="10%">위험도</th><th width="10%">인원/교육</th><th width="40%">위험성평가 및 중점 관리 대책</th></tr></thead>
                    <tbody>
                        {data.riskWorks.length > 0 ? data.riskWorks.map(work => (
                            <tr key={work.id}><td className="text-center font-bold">{work.team}</td><td>{work.task}</td><td className="text-center"><span className={work.risk === '상' ? 'text-red-600 font-bold' : ''}>{work.risk}</span></td><td className="text-center font-bold">{work.eduCompleted} / {work.workerCount}</td><td className="text-left text-xs leading-relaxed">{work.assessment || '-'}</td></tr>
                        )) : [1, 2, 3].map((_, i) => (
                            <tr key={`empty-risk-${i}`}><td className="h-10"></td><td></td><td></td><td></td><td></td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* 3. 알림 */}
            <div className="mb-6 avoid-break">
                <h2 className="report-section-title">3. 안전 공지사항</h2>
                <table className="report-table">
                    <thead><tr className="bg-gray-100"><th width="15%">구분</th><th width="60%">제목 및 내용</th><th width="15%">작성자</th><th width="10%">날짜</th></tr></thead>
                    <tbody>
                        {data.noticeData.length > 0 ? data.noticeData.map(notice => (
                            <tr key={notice.id}><td className="text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${notice.type === '공지' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{notice.type}</span></td><td><div className="font-bold mb-1">{notice.title}</div><div className="text-[10px] text-gray-500 line-clamp-2">{notice.content}</div></td><td className="text-center">{notice.author}</td><td className="text-center">{notice.date}</td></tr>
                        )) : [1, 2, 3].map((_, i) => (
                            <tr key={`empty-notice-${i}`}><td className="h-10"></td><td></td><td></td><td></td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="page-break"></div>
            {/* 4. 부적합 조치 */}
            <div className="mb-6">
                <h2 className="report-section-title">4. 안전 부적합 조치 현황</h2>
                <table className="report-table border-2 border-black">
                    <thead>
                        <tr className="bg-gray-100">
                            <th width="5%">No</th>
                            <th width="15%">위치</th>
                            <th width="32%">부적합 내용 및 조치 요청</th>
                            <th width="24%">조치 전 사진</th>
                            <th width="24%">조치 후 사진</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.issueList.length > 0 ? data.issueList.map((issue, idx) => (
                            <tr key={issue.id} className="avoid-break">
                                <td className="text-center font-bold">{idx + 1}</td>
                                <td className="text-center font-bold bg-gray-50">{issue.loc}</td>
                                <td className="text-left text-[11px] p-2 leading-relaxed">
                                    <div className="font-bold border-b border-gray-200 mb-1 pb-1">발견자: {issue.finder} | 상태: <span className={issue.status === 'done' ? 'text-green-600' : 'text-red-600'}>{issue.status === 'done' ? '조치완료' : '조치중'}</span></div>
                                    {issue.desc}
                                </td>
                                <td className="p-1">
                                    <div className="w-full h-32 border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                                        {issue.beforeImg ? <img src={issue.beforeImg} className="w-full h-full object-contain" alt="조치 전" /> : <span className="text-[9px] text-gray-400">사진 없음</span>}
                                    </div>
                                </td>
                                <td className="p-1">
                                    <div className="w-full h-32 border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                                        {issue.afterImg ? <img src={issue.afterImg} className="w-full h-full object-contain" alt="조치 후" /> : <span className="text-[9px] text-gray-400">{issue.status === 'done' ? '사진 누락' : '조치 대기'}</span>}
                                    </div>
                                </td>
                            </tr>
                        )) : [1, 2].map((_, i) => (
                            <tr key={`empty-issue-${i}`} className="avoid-break">
                                <td className="text-center font-bold text-gray-300">{i + 1}</td>
                                <td className="bg-gray-50 h-32"></td>
                                <td></td>
                                <td className="p-1">
                                    <div className="w-full h-32 border border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50">
                                        <span className="text-[8px] text-gray-300 italic">PHOTO</span>
                                    </div>
                                </td>
                                <td className="p-1">
                                    <div className="w-full h-32 border border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50">
                                        <span className="text-[8px] text-gray-300 italic">PHOTO</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* 5. 점검 이력 (PDF 지원) */}
            <div className="mb-6 avoid-break">
                <h2 className="report-section-title">5. 반입 점검 및 기타 점검 기록</h2>
                <table className="report-table">
                    <thead><tr className="bg-gray-100"><th width="15%">구분</th><th width="40%">점검 대상</th><th width="15%">점검일</th><th width="15%">결과</th><th width="15%">확인</th></tr></thead>
                    <tbody>
                        {data.inspectionLog.length > 0 ? data.inspectionLog.map(log => (
                            <tr key={log.id}>
                                <td className="text-center">{log.type}</td>
                                <td>
                                    {log.item}
                                    {/* 첨부파일 아이콘 표시 */}
                                    {log.images && log.images.length > 0 && (
                                        <div className="flex gap-1 mt-1">
                                            {log.images.map((img, idx) => (
                                                <span key={idx} className="text-xs border rounded p-0.5 bg-gray-50">
                                                    {typeof img === 'string' ? '📷 사진' : img.type === 'pdf' ? '📄 PDF' : '📷 사진'}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="text-center">{log.date}</td>
                                <td className="text-center font-bold">{log.status}</td>
                                <td className="text-center text-gray-400">(서명)</td>
                            </tr>
                        )) : [1, 2, 3].map((_, i) => (
                            <tr key={`empty-inspect-${i}`}><td className="h-10"></td><td></td><td></td><td></td><td></td></tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* [추가] 결재 서명란 (5열 2행) - 작성, 검토, 검토, 조정, 승인 */}
            <div className="mt-12 flex justify-end avoid-break">
                <table className="text-center border-collapse" style={{ width: '60%' }}>
                    <tbody>
                        <tr>
                            <td rowSpan="2" className="border border-black bg-gray-100 font-bold w-10">결<br />재</td>
                            <td className="border border-black bg-gray-50 p-1 font-bold">작성</td>
                            <td className="border border-black bg-gray-50 p-1 font-bold">검토</td>
                            <td className="border border-black bg-gray-50 p-1 font-bold">검토</td>
                            <td className="border border-black bg-gray-50 p-1 font-bold">조정</td>
                            <td className="border border-black bg-gray-50 p-1 font-bold">승인</td>
                        </tr>
                        <tr>
                            <td className="border border-black h-20"></td>
                            <td className="border border-black h-20"></td>
                            <td className="border border-black h-20"></td>
                            <td className="border border-black h-20"></td>
                            <td className="border border-black h-20"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="text-center text-[10px] text-gray-400 mt-12 border-t pt-4">남화토건(주) 스마트 안전보건 플랫폼 - Safety ON Output System</div>

            {/* 인쇄 전용 스타일 인라인 주입 */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .report-section-title {
                    font-size: 16pt;
                    font-weight: 800;
                    border-left: 5pt solid black;
                    padding-left: 10px;
                    margin-top: 30px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                }
                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1pt solid black;
                }
                .report-table th, .report-table td {
                    border: 0.5pt solid #444;
                    padding: 6px 8px;
                    font-size: 10pt;
                    line-height: 1.4;
                }
                .report-table th {
                    background-color: #f1f5f9 !important;
                    font-weight: 900;
                    -webkit-print-color-adjust: exact;
                }
            `}} />
        </div>
    );
};

export default PrintReport;
