'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadData = async (filterStartDate?: string, filterEndDate?: string) => {
    try {
      const userRes = await api.get('/api/auth/me');
      if (userRes.data.success) {
        setUser(userRes.data.data.user);
      }

      const params: any = { limit: 100 };
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;

      const historyRes = await api.get('/api/analyze/history', { params });
      if (historyRes.data.success) {
        setAnalyses(historyRes.data.data.analyses);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateFilter = () => {
    setLoading(true);
    loadData(startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setLoading(true);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  const handleViewDetail = (analysis: any) => {
    setSelectedAnalysis(analysis);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-blue-200 font-medium">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* ヘッダー */}
        <header className="bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="VIBECODING" className="w-12 h-12 rounded-xl shadow-lg" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                VIBECODING
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-blue-100">{user?.name}</div>
                  <div className="text-xs text-blue-300/70 capitalize">{user?.plan} プラン</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl transition-all text-sm font-medium text-blue-100 hover:text-white"
              >
                ログアウト
              </button>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
            ダッシュボード
          </h2>

          {/* 統計カード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-white/20 hover:border-white/30">
              <div className="text-sm text-blue-200/70 mb-2 font-medium">解析回数</div>
              <div className="text-4xl font-bold text-blue-100">{analyses.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-white/20 hover:border-white/30">
              <div className="text-sm text-blue-200/70 mb-2 font-medium">プラン</div>
              <div className="text-4xl font-bold capitalize text-blue-100">{user?.plan}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-white/20 hover:border-white/30">
              <div className="text-sm text-blue-200/70 mb-2 font-medium">本日の解析</div>
              <div className="text-4xl font-bold text-blue-100">
                {analyses.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).length}
              </div>
            </div>
          </div>

          {/* 日付フィルター */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <h3 className="text-lg font-bold text-blue-100 mb-4">期間で絞り込み</h3>
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm text-blue-200/70 mb-2">開始日</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-blue-100 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm text-blue-200/70 mb-2">終了日</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-blue-100 focus:outline-none focus:border-blue-400"
                />
              </div>
              <button
                onClick={handleDateFilter}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium"
              >
                絞り込み
              </button>
              <button
                onClick={handleClearFilter}
                className="px-6 py-2 bg-white/10 border border-white/20 text-blue-100 rounded-xl hover:bg-white/20 transition-all font-medium"
              >
                クリア
              </button>
            </div>
          </div>

          {/* 解析履歴 */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
            <div className="px-6 py-5 border-b border-white/10">
              <h3 className="text-xl font-bold text-blue-100">解析履歴 ({analyses.length}件)</h3>
            </div>

            {analyses.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <p className="text-blue-200 mb-2 text-lg font-medium">まだ解析履歴がありません</p>
                <p className="text-sm text-blue-300/60">VSCode拡張機能でコードを解析してみましょう</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {analyses.map((analysis: any) => (
                  <div key={analysis.id} className="px-6 py-5 hover:bg-white/5 transition-colors group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-blue-100 truncate text-lg mb-2">{analysis.file_name || 'Untitled'}</div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-blue-200/70">
                          <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg text-xs font-medium border border-white/20">{analysis.language}</span>
                          <span>•</span>
                          <span>{analysis.explanations?.length || 0} 解説</span>
                          {analysis.is_claude_generated && (
                            <>
                              <span>•</span>
                              <span className="px-3 py-1 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-200 text-xs rounded-lg font-medium backdrop-blur-sm border border-blue-400/30">
                                Claude Code
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-blue-300/50 mt-2">
                          {new Date(analysis.created_at).toLocaleString('ja-JP')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewDetail(analysis)}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all text-sm font-medium shadow-lg hover:shadow-xl flex-shrink-0 hover:-translate-y-0.5"
                      >
                        詳細
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* モーダル */}
      {selectedAnalysis && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setSelectedAnalysis(null)}
        >
          <div
            className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">解析詳細</h3>
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="w-10 h-10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center text-white text-2xl font-light"
              >
                ×
              </button>
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* ファイル情報 */}
              <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 p-5 rounded-2xl border border-blue-400/30 backdrop-blur-sm">
                <div className="text-sm text-blue-200/80 mb-2 font-medium">ファイル</div>
                <div className="font-mono text-sm text-blue-100 break-all">{selectedAnalysis.file_name}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/20">
                  <div className="text-sm text-blue-200/70 mb-2 font-medium">言語</div>
                  <div className="font-semibold text-blue-100 text-lg">{selectedAnalysis.language}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/20">
                  <div className="text-sm text-blue-200/70 mb-2 font-medium">解説数</div>
                  <div className="font-semibold text-blue-100 text-lg">{selectedAnalysis.explanations?.length || 0}個</div>
                </div>
              </div>

              {/* 解説 */}
              <div className="border-t border-white/10 pt-5">
                <h4 className="font-bold text-xl mb-5 text-blue-100">
                  解説内容
                </h4>
                {selectedAnalysis.explanations?.length > 0 ? (
                  <div className="space-y-4">
                    {selectedAnalysis.explanations.map((exp: any, idx: number) => (
                      <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 hover:shadow-xl transition-all">
                        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-blue-100 leading-relaxed">
                          {exp.content}
                        </div>
                        {exp.level && (
                          <div className="mt-4 inline-block px-4 py-1.5 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-200 text-xs rounded-full font-medium backdrop-blur-sm border border-blue-400/30">
                            レベル: {exp.level}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-blue-200/50 text-center py-16 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                    <div>解説がありません</div>
                  </div>
                )}
              </div>
            </div>

            {/* フッター */}
            <div className="bg-white/5 px-6 py-4 flex justify-end border-t border-white/10 backdrop-blur-sm">
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
