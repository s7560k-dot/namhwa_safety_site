import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from './firebase';
import Footer from './components/Footer';
import {
    ChevronLeft,
    FileText,
    Calendar,
    User,
    Search,
    RefreshCw,
    ExternalLink
} from 'lucide-react';

const GlobalBoard = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Error fetching global posts:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredPosts = posts.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 py-4 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all group"
                    >
                        <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                        <span>메인으로</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <FileText className="text-red-600" size={24} />
                        <h1 className="text-xl font-black tracking-tight">전사 공지사항</h1>
                    </div>
                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                {/* Search & Actions */}
                <div className="flex flex-col md:flex-row gap-4 mb-10 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="공지사항 제목 또는 내용 검색"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-sm font-medium"
                        />
                    </div>
                    <button
                        onClick={fetchPosts}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Post List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 text-center space-y-4">
                            <RefreshCw size={40} className="mx-auto text-slate-200 animate-spin" />
                            <p className="text-slate-400 font-bold tracking-widest">데이터를 불러오는 중입니다...</p>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                            <FileText size={48} className="mx-auto text-slate-100 mb-4" />
                            <p className="text-slate-400 font-bold">등록된 공지사항이 없습니다.</p>
                        </div>
                    ) : filteredPosts.map(post => (
                        <div key={post.id} className="group bg-white border border-slate-200 p-6 rounded-3xl hover:border-red-500 hover:shadow-xl transition-all duration-300">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${post.type === '공지' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {post.type || 'NOTICE'}
                                        </span>
                                        <h3 className="text-lg font-black text-slate-900 group-hover:text-red-600 transition-colors leading-tight">
                                            {post.title}
                                        </h3>
                                    </div>
                                    <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-wrap">
                                        {post.content}
                                    </p>

                                    {/* HTML 링크 감지 및 표시 */}
                                    {post.content && post.content.includes('.html') && (
                                        <div className="mt-4 pt-4 border-t border-slate-50">
                                            <a
                                                href={post.content.match(/\/notices\/[a-zA-Z0-9_-]+\.html/)?.[0] || post.content}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-900 hover:text-white transition-all border border-slate-100"
                                            >
                                                <ExternalLink size={14} /> 관련 HTML 페이지 열기
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-row md:flex-col items-center md:items-end gap-3 text-xs font-bold text-slate-400 shrink-0">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                        <Calendar size={14} />
                                        <span>{post.createdAt ? new Date(post.createdAt?.seconds * 1000).toLocaleDateString() : '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                        <User size={14} />
                                        <span>{post.author || '관리자'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default GlobalBoard;
