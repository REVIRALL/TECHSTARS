'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// エラーメッセージのマッピング（セキュリティ: 技術的詳細を隠蔽）
const ERROR_MESSAGES: Record<string, string> = {
  'Invalid credentials': 'メールアドレスまたはパスワードが正しくありません',
  'Invalid or expired token': 'トークンが無効または期限切れです',
  'Email and password are required': 'メールアドレスとパスワードを入力してください',
  'Password must be at least 8 characters': 'パスワードは8文字以上で入力してください',
  'User already exists': 'このメールアドレスは既に登録されています',
  'A user with this email address has already been registered': 'このメールアドレスは既に登録されています。ログインしてください。',
  'Too many requests': 'リクエストが多すぎます。しばらく待ってから再度お試しください',
};

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await api.post('/api/auth/login', { email, password });
        if (res.data.success) {
          // アクセストークンとリフレッシュトークンを両方保存
          localStorage.setItem('accessToken', res.data.data.session.accessToken);
          localStorage.setItem('refreshToken', res.data.data.session.refreshToken);
          router.push('/dashboard');
        }
      } else {
        const res = await api.post('/api/auth/signup', { email, password, name });
        if (res.data.success) {
          const loginRes = await api.post('/api/auth/login', { email, password });
          if (loginRes.data.success) {
            // アクセストークンとリフレッシュトークンを両方保存
            localStorage.setItem('accessToken', loginRes.data.data.session.accessToken);
            localStorage.setItem('refreshToken', loginRes.data.data.session.refreshToken);
            router.push('/dashboard');
          }
        }
      }
    } catch (err: any) {
      const apiError = err.response?.data?.error || '';

      // 重複エラーの場合、ログインタブに自動切り替え
      if (apiError === 'A user with this email address has already been registered' && !isLogin) {
        setError('このメールアドレスは既に登録されています。ログインしてください。');
        setTimeout(() => {
          setIsLogin(true);
          setError('');
        }, 2000); // 2秒後に自動切り替え
      } else {
        // エラーメッセージをマッピング（技術的詳細を隠蔽）
        setError(ERROR_MESSAGES[apiError] || 'エラーが発生しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* 背景アニメーション */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-500/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* メインカード */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20">
          {/* ロゴ */}
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="VIBECODING" className="h-20 w-auto" />
          </div>
          <p className="text-center text-blue-200/80 mb-8 text-sm">AI時代のエンジニア育成プラットフォーム</p>

          {/* タブ切り替え */}
          <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-blue-200/60 hover:text-blue-200'
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                !isLogin
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-blue-200/60 hover:text-blue-200'
              }`}
            >
              新規登録
            </button>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-100">名前</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all backdrop-blur-sm"
                  placeholder="山田 太郎"
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-blue-100">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all backdrop-blur-sm"
                placeholder="example@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-blue-100">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all backdrop-blur-sm"
                placeholder="8文字以上"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={8}
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm animate-shake">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>処理中...</span>
                </span>
              ) : (
                isLogin ? 'ログイン' : 'アカウント作成'
              )}
            </button>
          </form>

          {/* フッター */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-sm text-blue-200/60">
              {isLogin ? 'アカウントをお持ちでない方は' : '既にアカウントをお持ちの方は'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="ml-1 text-blue-300 hover:text-blue-200 font-medium transition-colors"
              >
                {isLogin ? '新規登録' : 'ログイン'}
              </button>
            </p>
          </div>
        </div>

        {/* 下部テキスト */}
        <p className="text-center text-blue-200/40 text-xs mt-6">
          © 2024 VIBECODING. All rights reserved.
        </p>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
