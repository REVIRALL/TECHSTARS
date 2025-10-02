'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // ユーザー情報取得
      const userRes = await api.get('/api/auth/me');
      if (userRes.data.success) {
        setUser(userRes.data.data.user);
      }

      // 解析履歴取得
      const historyRes = await api.get('/api/analyze/history', {
        params: { limit: 10 },
      });
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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">VIBECODING</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              {user?.name} ({user?.plan})
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-4">📊 ダッシュボード</h2>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">解析回数</div>
            <div className="text-3xl font-bold">{analyses.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">プラン</div>
            <div className="text-3xl font-bold capitalize">{user?.plan}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">本日の解析</div>
            <div className="text-3xl font-bold">
              {
                analyses.filter(a =>
                  new Date(a.created_at).toDateString() === new Date().toDateString()
                ).length
              }
            </div>
          </div>
        </div>

        {/* 解析履歴 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-bold">📝 解析履歴</h3>
          </div>

          {analyses.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              まだ解析履歴がありません。<br />
              VSCode拡張機能でコードを解析してみましょう!
            </div>
          ) : (
            <div className="divide-y">
              {analyses.map((analysis: any) => (
                <div key={analysis.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{analysis.file_name || 'Untitled'}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {analysis.language} • {analysis.explanations?.length || 0} 解説
                        {analysis.is_claude_generated && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            Claude Code
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(analysis.created_at).toLocaleString('ja-JP')}
                      </div>
                    </div>
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
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
  );
}
