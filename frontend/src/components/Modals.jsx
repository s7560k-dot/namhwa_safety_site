import React from 'react';
import { X, Plus, Upload, Trash, ArrowRight, CheckCircle, AlertTriangle } from './Icons';

export const SettingsModal = ({ show, onClose, onSave, startDate, targetDays, cctvUrl }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center bg-gray-800 text-white rounded-t-xl"><h3 className="font-bold">무재해 목표 설정</h3><button onClick={onClose}><X size={24} /></button></div>
                <form onSubmit={onSave} className="p-6 space-y-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">실착공일</label><input name="startDate" type="date" defaultValue={startDate} className="w-full border rounded-lg p-2" required /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">목표일수</label><input name="targetDays" type="number" defaultValue={targetDays} className="w-full border rounded-lg p-2" required /></div>
                    <div className="pt-2 border-t border-gray-100">
                        <label className="block text-sm font-bold text-blue-600 mb-1 flex items-center gap-1.5"><AlertTriangle size={14} /> ADT Caps CCTV 주소</label>
                        <input name="cctvUrl" type="url" defaultValue={cctvUrl} className="w-full border rounded-lg p-2 text-sm" placeholder="https://..." />
                        <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">* 공사용 뷰어 주소가 없다면 기본 서비스로 연결됩니다.</p>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700">설정 저장</button>
                </form>
            </div>
        </div>
    );
};

export const WorkerModal = ({ show, onClose, workerList, onChange, onAdd, onDelete, onSave }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-green-600 p-4 flex justify-between items-center text-white"><h3 className="font-bold">금일 출력 인원 수정</h3><button onClick={onClose}><X size={20} /></button></div>
                <div className="p-4">
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto mb-3">
                        {workerList.map((worker) => (
                            <div key={worker.id} className="flex items-center gap-2 mb-2">
                                <input type="text" className="border p-2 rounded w-1/2 text-sm" value={worker.trade} onChange={(e) => onChange(worker.id, 'trade', e.target.value)} placeholder="공종명" />
                                <input type="number" className="border p-2 rounded w-1/3 text-sm" value={worker.count} onChange={(e) => onChange(worker.id, 'count', e.target.value)} placeholder="인원" />
                                <button onClick={() => onDelete(worker.id)} className="text-red-400 hover:text-red-600"><Trash size={16} /></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={onAdd} className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200">+ 공종 추가</button>
                    <button onClick={onSave} className="w-full mt-2 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700">저장 및 닫기</button>
                </div>
            </div>
        </div>
    );
};

export const IssueModal = ({ show, onClose, issues, type, onAdd, onChange, onImageUpload, onSave, onStatusChange }) => {
    if (!show) return null;
    const filteredIssues = issues.filter(i => i.status === type);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className={`p-5 flex justify-between items-center text-white rounded-t-xl shrink-0 ${type === 'new' ? 'bg-red-500' : type === 'processing' ? 'bg-yellow-500' : 'bg-green-500'}`}>
                    <h3 className="font-bold text-lg">{type === 'new' ? '신규 발견 목록' : type === 'processing' ? '조치 중 목록' : '조치 완료 목록'}</h3>
                    <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto bg-gray-50 flex-1">
                    {type === 'new' && (
                        <button onClick={onAdd} className="w-full py-3 bg-red-50 text-red-600 rounded-lg border-2 border-dashed border-red-200 font-bold mb-4 hover:bg-red-100 transition flex items-center justify-center">
                            <Plus size={18} className="mr-2" /> + 신규 부적합 사항 등록
                        </button>
                    )}
                    {filteredIssues.length > 0 ? filteredIssues.map(issue => (
                        <div key={issue.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                            {/* ... Content inputs ... */}
                            <div className="flex justify-between items-end mb-4 pb-2 border-b border-gray-100">
                                <div className="flex-1 mr-4">
                                    <input type="text" className="w-full text-xl font-bold text-gray-800 bg-transparent placeholder-gray-300 focus:outline-none" value={issue.loc} onChange={(e) => onChange(issue.id, 'loc', e.target.value)} placeholder="장소 입력 (예: 105동 3층)" />
                                </div>
                                <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <span className="text-xs text-gray-500 mr-2 font-medium">발견자:</span>
                                    <input type="text" className="bg-transparent text-sm text-gray-700 font-medium focus:outline-none w-20 text-right border-b border-gray-300" value={issue.finder} onChange={(e) => onChange(issue.id, 'finder', e.target.value)} />
                                </div>
                            </div>
                            <textarea className="w-full border border-gray-200 rounded-lg p-4 text-gray-700 text-sm focus:outline-none h-28 mb-5 resize-none" value={issue.desc} onChange={(e) => onChange(issue.id, 'desc', e.target.value)} placeholder="안전 부적합 사항을 상세히 입력하세요." />

                            {/* Images */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <label className="group border-2 border-dashed border-gray-200 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-white overflow-hidden relative">
                                    {issue.beforeImg ? <img src={issue.beforeImg} alt="조치 전" className="w-full h-full object-cover" /> : <div className="text-center"><Upload size={18} className="mx-auto mb-1 text-gray-400" /><span className="text-xs font-bold text-gray-400">조치 전 사진</span></div>}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => onImageUpload(issue.id, 'beforeImg', e)} />
                                </label>
                                <label className="group border-2 border-dashed border-gray-200 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:border-green-400 transition-colors bg-gray-50 hover:bg-white overflow-hidden relative">
                                    {issue.afterImg ? <img src={issue.afterImg} alt="조치 후" className="w-full h-full object-cover" /> : <div className="text-center"><Upload size={18} className="mx-auto mb-1 text-gray-400" /><span className="text-xs font-bold text-gray-400">조치 후 사진</span></div>}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => onImageUpload(issue.id, 'afterImg', e)} />
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors" onClick={() => onSave(issue.id)}>내용 저장</button>
                                {type === 'new' && <button className="flex-1 bg-yellow-500 text-white py-3.5 rounded-lg text-sm font-bold hover:bg-yellow-600 transition-colors flex items-center justify-center" onClick={() => onStatusChange(issue.id, 'processing')}>조치 착수 <ArrowRight size={16} className="ml-2" /></button>}
                                {type === 'processing' && <button className="flex-1 bg-green-500 text-white py-3.5 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors flex items-center justify-center" onClick={() => onStatusChange(issue.id, 'done')}>조치 완료 승인 <CheckCircle size={16} className="ml-2" /></button>}
                                {type === 'done' && <div className="flex-1 bg-gray-50 border border-gray-200 text-green-600 py-3.5 rounded-lg text-sm font-bold flex items-center justify-center cursor-default">완료된 항목 <CheckCircle size={16} className="ml-2" /></div>}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-gray-400 py-20 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300"><AlertTriangle size={32} /></div>
                            <p>{type === 'new' ? '신규 발견된 항목이 없습니다.' : type === 'processing' ? '조치 중인 항목이 없습니다.' : '완료된 항목이 없습니다.'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const InspectionModal = ({ show, onClose, type, onSave, images, onImageUpload, onRemoveImage, setPreview }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center bg-blue-600 text-white rounded-t-xl"><h3 className="font-bold">{type} 점검 등록</h3><button onClick={onClose}><X size={24} /></button></div>
                <form onSubmit={onSave} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">품목명 / 장비명</label><input name="item" type="text" className="w-full border rounded-lg p-2" required placeholder="예: 이동식 크레인, 에폭시 등" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">점검 결과</label><div className="flex gap-4"><label className="flex items-center cursor-pointer"><input type="radio" name="result" value="합격" className="mr-2" defaultChecked /><span className="text-sm font-bold text-green-600">합격</span></label><label className="flex items-center cursor-pointer"><input type="radio" name="result" value="불합격" className="mr-2" /><span className="text-sm font-bold text-red-600">불합격</span></label></div></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">세부 점검 내용</label><textarea className="w-full border rounded-lg p-2 h-20" placeholder="특이사항 및 점검 결과를 입력하세요"></textarea></div>

                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">점검 사진 / 서류 첨부</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative w-20 h-20 border rounded-lg overflow-hidden group bg-gray-50 flex items-center justify-center cursor-pointer" onClick={() => setPreview(typeof img === 'string' ? { url: img, name: '이미지' } : img)}>
                                    {typeof img === 'string' ? <img src={img} className="w-full h-full object-cover" /> : (
                                        <div className="flex flex-col items-center justify-center text-center p-1"><span className="text-2xl">📄</span><span className="text-[10px] text-gray-500 truncate w-16 mt-1">{img.name}</span></div>
                                    )}
                                    <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveImage(idx); }} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={12} /></button>
                                </div>
                            ))}
                            <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <Plus className="w-6 h-6 text-gray-400" />
                                <input type="file" multiple className="hidden" accept="image/*, .pdf" onChange={onImageUpload} />
                            </label>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700">저장 하기</button>
                </form>
            </div>
        </div>
    );
};

export const NoticeModal = ({ show, onClose, notice }) => {
    if (!show || !notice) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center bg-purple-600 text-white rounded-t-xl"><h3 className="font-bold">공지사항 상세</h3><button onClick={onClose}><X size={24} /></button></div>
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4"><span className={`text-xs font-bold px-2 py-1 rounded ${notice.type === '공지' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{notice.type}</span><span className="text-sm text-gray-500">{notice.date} | {notice.author}</span></div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">{notice.title}</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm min-h-[150px] whitespace-pre-wrap leading-relaxed">{notice.content}</div>
                    {notice.attachment && (
                        <div className="mt-4 border-t pt-4">
                            <p className="text-sm font-bold text-gray-700 mb-2">첨부파일</p>
                            {notice.attachment.type === 'image' ? (
                                <img src={notice.attachment.url} className="max-w-full rounded-lg border" />
                            ) : (
                                <a href={notice.attachment.url} target="_blank" className="flex items-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-blue-600 font-bold">
                                    <span className="mr-2">📄</span> {notice.attachment.name || "PDF 문서 보기"}
                                </a>
                            )}
                        </div>
                    )}
                    <button onClick={onClose} className="w-full mt-4 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-300 transition">닫기</button>
                </div>
            </div>
        </div>
    );
};

export const NoticeWriteModal = ({ show, onClose, onSave, setFile }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center bg-purple-600 text-white rounded-t-xl"><h3 className="font-bold">새 공지사항 등록</h3><button onClick={onClose}><X size={24} /></button></div>
                <form onSubmit={onSave} className="p-6 space-y-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">제목</label><input name="title" type="text" className="w-full border rounded-lg p-2" placeholder="공지 제목을 입력하세요" required /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">내용</label><textarea name="content" className="w-full border rounded-lg p-2 h-32 resize-none" placeholder="공지 내용을 입력하세요 (선택)"></textarea></div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">첨부파일 (사진 또는 PDF)</label>
                        <input type="file" accept="image/*, .pdf" onChange={(e) => setFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                    </div>
                    <button type="submit" className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-bold hover:bg-purple-700">등록하기</button>
                </form>
            </div>
        </div>
    );
};

export const PreviewModal = ({ file, onClose }) => {
    if (!file) return null;
    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="p-3 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-gray-800 truncate px-2">{file.name || '미리보기'}</h3>
                    <div className="flex gap-2">
                        <a href={file.url} target="_blank" download className="p-2 hover:bg-gray-200 rounded text-gray-600" title="다운로드/새창"><Upload className="rotate-180" size={20} /></a>
                        <button onClick={onClose} className="p-2 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded transition"><X size={24} /></button>
                    </div>
                </div>
                <div className="flex-1 bg-gray-900 overflow-hidden flex items-center justify-center p-1">
                    {(file.type === 'pdf' || (file.url && file.url.toLowerCase().includes('.pdf'))) ? (
                        <iframe src={file.url} className="w-full h-full bg-white rounded" title="PDF Preview"></iframe>
                    ) : (
                        <img src={file.url} className="max-w-full max-h-full object-contain rounded" />
                    )}
                </div>
            </div>
        </div>
    );
};
