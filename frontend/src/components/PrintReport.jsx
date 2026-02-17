import React from 'react';

const PrintReport = ({ data, siteName, currentDate, accidentFreeDays, targetDays }) => {
    return (
        <div className="print-only p-4">
            <div className="border-b-2 border-black pb-4 mb-6">
                <h1 className="text-3xl font-bold text-center mb-2">안전보건 일일 리포트</h1>
                <div className="flex justify-between text-sm">
                    <span>현장명: {siteName}</span>
                    <span>작성일: {currentDate}</span>
                    <span>무재해: {accidentFreeDays}일 (목표: {targetDays}일)</span>
                </div>
            </div>
            {/* 1. 금일 출력 현황 */}
            <div className="mb-6 avoid-break">
                <h2 className="text-xl font-bold border-l-4 border-black pl-2 mb-2">1. 금일 출력 현황</h2>
                <table className="w-full text-center">
                    <thead>
                        <tr className="bg-gray-100"><th>공종</th><th>인원</th><th>공종</th><th>인원</th><th>공종</th><th>인원</th></tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: Math.ceil(data.workerList.length / 3) }).map((_, rowIndex) => (
                            <tr key={rowIndex}>
                                {[0, 1, 2].map(colIndex => {
                                    const item = data.workerList[rowIndex * 3 + colIndex];
                                    return item ? (<React.Fragment key={colIndex}><td>{item.trade}</td><td>{item.count}명</td></React.Fragment>) : (<React.Fragment key={colIndex}><td></td><td></td></React.Fragment>);
                                })}
                            </tr>
                        ))}
                        <tr className="font-bold bg-gray-50"><td colSpan="5" className="text-right pr-4">총 출력 인원</td><td>{data.workerList.reduce((acc, cur) => acc + parseInt(cur.count || 0), 0)}명</td></tr>
                    </tbody>
                </table>
            </div>
            {/* 2. 고위험 작업 */}
            <div className="mb-6 avoid-break">
                <h2 className="text-xl font-bold border-l-4 border-black pl-2 mb-2">2. 고위험 작업 및 TBM(위험성평가) 기록</h2>
                <table className="w-full">
                    <thead><tr className="bg-gray-100"><th width="15%">작업팀</th><th width="25%">작업명</th><th width="10%">위험도</th><th width="10%">인원/교육</th><th width="40%">위험성평가 및 중점 관리 대책</th></tr></thead>
                    <tbody>
                        {data.riskWorks.length > 0 ? data.riskWorks.map(work => (
                            <tr key={work.id}><td className="text-center">{work.team}</td><td>{work.task}</td><td className="text-center">{work.risk}</td><td className="text-center">{work.eduCompleted} / {work.workerCount}</td><td className="text-left text-xs">{work.assessment || '-'}</td></tr>
                        )) : <tr><td colSpan="5" className="text-center py-4">금일 고위험 작업 없음</td></tr>}
                    </tbody>
                </table>
            </div>
            {/* 3. 알림 */}
            <div className="mb-6 avoid-break">
                <h2 className="text-xl font-bold border-l-4 border-black pl-2 mb-2">3. 안전 공지사항</h2>
                <table className="w-full">
                    <thead><tr className="bg-gray-100"><th width="15%">구분</th><th width="60%">제목 및 내용</th><th width="15%">작성자</th><th width="10%">날짜</th></tr></thead>
                    <tbody>
                        {data.noticeData.length > 0 ? data.noticeData.map(notice => (
                            <tr key={notice.id}><td className="text-center">{notice.type}</td><td><div className="font-bold">{notice.title}</div><div className="text-xs text-gray-500">{notice.content}</div></td><td className="text-center">{notice.author}</td><td className="text-center">{notice.date}</td></tr>
                        )) : <tr><td colSpan="4" className="text-center py-4">등록된 공지사항 없음</td></tr>}
                    </tbody>
                </table>
            </div>
            <div className="page-break"></div>
            {/* 4. 부적합 조치 */}
            <div className="mb-6">
                <h2 className="text-xl font-bold border-l-4 border-black pl-2 mb-2">4. 안전 부적합 조치 현황</h2>
                <div className="grid grid-cols-2 gap-4">
                    {data.issueList.length > 0 ? data.issueList.map((issue, idx) => (
                        <div key={issue.id} className="border border-black p-2 avoid-break">
                            <div className="flex justify-between border-b border-black mb-2 pb-1"><span className="font-bold text-sm">#{idx + 1}. {issue.loc}</span><span className="text-xs">상태: {issue.status === 'done' ? '조치완료' : '조치중'} | 발견: {issue.finder}</span></div>
                            <div className="text-sm mb-2 h-10 overflow-hidden">{issue.desc}</div>
                            <div className="flex gap-1 h-32">
                                <div className="w-1/2 border border-dashed border-gray-400 flex items-center justify-center bg-gray-50 overflow-hidden relative">
                                    {issue.beforeImg ? <img src={issue.beforeImg} className="w-full h-full object-contain" /> : <span className="text-xs text-gray-400">조치 전 사진</span>}
                                </div>
                                <div className="w-1/2 border border-dashed border-gray-400 flex items-center justify-center bg-gray-50 overflow-hidden relative">
                                    {issue.afterImg ? <img src={issue.afterImg} className="w-full h-full object-contain" /> : <span className="text-xs text-gray-400">조치 후 사진</span>}
                                </div>
                            </div>
                        </div>
                    )) : <div className="col-span-2 text-center py-4 border">금일 부적합 사항 없음</div>}
                </div>
            </div>
            {/* 5. 점검 이력 (PDF 지원) */}
            <div className="mb-6 avoid-break">
                <h2 className="text-xl font-bold border-l-4 border-black pl-2 mb-2">5. 반입 점검 및 기타 점검 기록</h2>
                <table className="w-full">
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
                        )) : <tr><td colSpan="5" className="text-center py-4">금일 점검 내역 없음</td></tr>}
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

            <div className="text-center text-xs text-gray-400 mt-8 border-t pt-4">남화토건(주) 스마트 안전보건 플랫폼 - Safety ON Output System</div>
        </div>
    );
};

export default PrintReport;
