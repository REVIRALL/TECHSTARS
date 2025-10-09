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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const loadData = async (filterStartDate?: string, filterEndDate?: string) => {
    try {
      const userRes = await api.get('/api/auth/me');
      if (userRes.data.success) {
        setUser(userRes.data.data.user);
      }

      // 管理者権限チェック（/api/admin/statsにアクセスできるか）
      try {
        await api.get('/api/admin/stats');
        setIsAdmin(true);
      } catch {
        setIsAdmin(false);
      }

      const params: any = { limit: 100 };
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;

      const historyRes = await api.get('/api/analyze/history', { params });
      if (historyRes.data.success) {
        setAnalyses(historyRes.data.data.analyses);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to load data:', error);
      }
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
    // 両方のトークンを削除
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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

          {/* 管理画面リンク（管理者のみ） */}
          {isAdmin && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-purple-400/30 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">管理者権限</div>
                    <div className="text-sm text-purple-200">ユーザー承認・管理機能にアクセスできます</div>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/admin')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  管理画面を開く
                </button>
              </div>
            </div>
          )}

          {/* 承認待ちメッセージ */}
          {user?.approvalStatus === 'pending' && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-yellow-400/30 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg mb-2">アカウント承認待ち</h3>
                  <p className="text-yellow-100 leading-relaxed">
                    現在、アカウントの承認をお待ちいただいております。管理者による承認が完了するまで、一部機能に制限がある場合があります。承認まで今しばらくお待ちください。
                  </p>
                  <div className="mt-4 text-sm text-yellow-200/80">
                    通常、1営業日以内に承認されます。お急ぎの場合はサポートまでお問い合わせください。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 拒否メッセージ */}
          {user?.approvalStatus === 'rejected' && (
            <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-red-400/30 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg mb-2">アカウントが承認されませんでした</h3>
                  <p className="text-red-100 leading-relaxed">
                    申し訳ございませんが、アカウントの承認ができませんでした。詳細につきましては、サポートチームまでお問い合わせください。
                  </p>
                  <div className="mt-4">
                    <a
                      href="mailto:support@vibecoding.com"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      サポートに問い合わせる
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

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
