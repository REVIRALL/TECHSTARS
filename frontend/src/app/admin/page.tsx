'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_notes?: string;
  approved_at?: string;
  created_at: string;
  last_login_at?: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  todaySignups: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notes, setNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ページロード時の管理者権限チェック（セキュリティ強化）
  useEffect(() => {
    const checkAdminAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // 管理者権限を確認（/api/admin/statsにアクセス可能か）
        await api.get('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error: any) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          showToast('管理者権限が必要です', 'error');
          router.push('/dashboard');
        }
      }
    };

    checkAdminAuth();
  }, []);

  useEffect(() => {
    loadData();
  }, [filter]);

  const showToast = (message: string, type: Toast['type']) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        router.push('/login');
        return;
      }

      // 統計取得
      const statsRes = await api.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statsRes.data.success) {
        setStats(statsRes.data.data.stats);
      }

      // ユーザー一覧取得
      const usersRes = await api.get('/api/admin/users', {
        params: filter !== 'all' ? { status: filter } : {},
        headers: { Authorization: `Bearer ${token}` },
      });

      if (usersRes.data.success) {
        setUsers(usersRes.data.data.users);
      }
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to load admin data:', error);
      }
      if (error.response?.status === 403 || error.response?.status === 401) {
        showToast('管理者権限が必要です', 'error');
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('accessToken');

      const endpoint = modalAction === 'approve'
        ? `/api/admin/users/${selectedUser.id}/approve`
        : `/api/admin/users/${selectedUser.id}/reject`;

      await api.post(endpoint, { notes }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast(`ユーザーを${modalAction === 'approve' ? '承認' : '拒否'}しました`, 'success');
      setShowModal(false);
      setNotes('');
      setSelectedUser(null);
      loadData();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Action failed:', error);
      }
      showToast('操作に失敗しました', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (user: User, action: 'approve' | 'reject') => {
    setSelectedUser(user);
    setModalAction(action);
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
    };
    const labels = {
      pending: '承認待ち',
      approved: '承認済み',
      rejected: '拒否済み',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              管理画面
            </h1>
            <p className="text-sm text-slate-600 mt-1">ユーザー承認・管理</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
          >
            ← ダッシュボードへ
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats && (
            <>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">承認待ち</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">承認済み</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">拒否済み</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">本日の登録</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.todaySignups}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* フィルター */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg mb-6">
          <div className="flex gap-3">
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                  filter === f
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {f === 'all' ? '全て' : f === 'pending' ? '承認待ち' : f === 'approved' ? '承認済み' : '拒否済み'}
              </button>
            ))}
          </div>
        </div>

        {/* ユーザー一覧 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-12 text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-lg font-medium">ユーザーがいません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">名前</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">メール</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ステータス</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">登録日</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{user.name || '未設定'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.approval_status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {new Date(user.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {user.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => openModal(user, 'approve')}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                            >
                              承認
                            </button>
                            <button
                              onClick={() => openModal(user, 'reject')}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                            >
                              拒否
                            </button>
                          </>
                        )}
                        {user.approval_status !== 'pending' && (
                          <span className="text-slate-400 italic">完了</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* モーダル */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {modalAction === 'approve' ? '承認' : '拒否'}確認
            </h3>
            <p className="text-slate-600 mb-6">
              {selectedUser.name || selectedUser.email}を
              {modalAction === 'approve' ? '承認' : '拒否'}しますか？
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">メモ（任意）</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                rows={4}
                placeholder="理由やメモを入力..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNotes('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-all disabled:opacity-50 ${
                  modalAction === 'approve'
                    ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30'
                    : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                }`}
              >
                {actionLoading ? '処理中...' : modalAction === 'approve' ? '承認する' : '拒否する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast通知 */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border animate-slide-in-right min-w-[300px] ${
              toast.type === 'success'
                ? 'bg-green-500/90 border-green-400 text-white'
                : toast.type === 'error'
                ? 'bg-red-500/90 border-red-400 text-white'
                : 'bg-yellow-500/90 border-yellow-400 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' && (
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
