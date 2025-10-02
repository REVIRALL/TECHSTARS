'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // トークンがあればダッシュボードへ、なければログインへ
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">VIBECODING</h1>
        <p className="text-xl text-gray-600">AI時代のエンジニア育成プラットフォーム</p>
        <p className="mt-4 text-sm text-gray-500">リダイレクト中...</p>
      </div>
    </main>
  );
}
