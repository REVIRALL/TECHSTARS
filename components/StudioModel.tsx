import React, { useEffect, useRef, useState } from 'react';
import { SectionId } from '../types';
import { Zap, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export const StudioModel: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id={SectionId.Model} className="relative bg-black pt-28 lg:pt-44 pb-24 lg:pb-36 overflow-x-hidden">
       {/* Cyber Grid Background - 視認性向上 */}
       <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none"></div>
       {/* 上部の水平ネオンライン（セクション区切り） */}
       <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-500/60 via-brand-500/20 to-transparent"></div>

       <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">

          {/* ===== 時代背景セクション ===== */}
          <div className={`mb-16 lg:mb-24 anim-hidden anim-up ${isVisible ? 'anim-visible' : ''}`}>
            <p className="font-mono text-xs text-brand-500 mb-4 tracking-widest">// WHY NOW?</p>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black italic tracking-tighter text-white mb-8">
              エンジニアリングの<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-blue-400">ルールが変わった。</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {/* 過去 - Split Tone Dark Pattern */}
              <div className={`relative bg-slate-900/80 border border-slate-800 overflow-hidden anim-hidden anim-left ${isVisible ? 'anim-visible delay-1' : ''}`}>
                {/* Background number watermark */}
                <div className="absolute -right-8 -bottom-8 text-[180px] font-black text-slate-800/30 leading-none select-none">×</div>

                <div className="relative z-10 p-8 lg:p-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 border border-slate-700 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-slate-500" />
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-slate-600 tracking-widest block">LEGACY</span>
                        <span className="font-mono text-xs text-slate-400">従来の学習</span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] px-3 py-1 border border-slate-700 text-slate-500 tracking-widest">DEPRECATED</span>
                  </div>

                  <div className="mb-6">
                    <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-600 leading-none relative">
                      2〜3年
                      <span className="absolute left-0 top-1/2 w-full h-[4px] bg-red-500/70 -rotate-3"></span>
                    </p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 p-3 bg-slate-800/50 border-l-2 border-red-500/50">
                      <span className="text-red-500 font-mono text-xs">ERR</span>
                      <span className="text-slate-500">プログラミングスクールで基礎学習</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-800/50 border-l-2 border-red-500/50">
                      <span className="text-red-500 font-mono text-xs">ERR</span>
                      <span className="text-slate-500">膨大なコードを暗記・写経</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-800/50 border-l-2 border-red-500/50">
                      <span className="text-red-500 font-mono text-xs">ERR</span>
                      <span className="text-slate-500">エラーで何時間も詰まる日々</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-800/50 border-l-2 border-red-500/50">
                      <span className="text-red-500 font-mono text-xs">ERR</span>
                      <span className="text-slate-500">やっと「初心者エンジニア」へ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 現在 - Neon Cyber Active Pattern */}
              <div className={`relative bg-black border border-brand-500/50 overflow-hidden group hover:border-brand-500 transition-colors duration-300 anim-hidden anim-right ${isVisible ? 'anim-visible delay-2' : ''}`}>
                {/* Noise overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-30"></div>
                {/* Glow effect */}
                <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-brand-500/20 rounded-full blur-3xl group-hover:bg-brand-500/30 transition-all"></div>

                <div className="relative z-10 p-8 lg:p-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-brand-500 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                        <Zap className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-brand-400 tracking-widest block">AI_DRIVEN</span>
                        <span className="font-mono text-xs text-brand-500">AI時代の学習</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                      <span className="font-mono text-[10px] px-3 py-1 bg-brand-500 text-black font-bold tracking-widest">ACTIVE</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-brand-500 leading-none glitch-hover">7日間</p>
                    <div className="w-20 h-1 bg-brand-500 mt-2 group-hover:w-full transition-all duration-500"></div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 p-3 bg-brand-500/10 border-l-2 border-brand-500">
                      <span className="text-brand-500 font-mono text-xs">OK</span>
                      <span className="text-slate-200">AIがコードを生成、あなたは指示と判断</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-brand-500/10 border-l-2 border-brand-500">
                      <span className="text-brand-500 font-mono text-xs">OK</span>
                      <span className="text-slate-200">「何を作るか」に集中できる</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-brand-500/10 border-l-2 border-brand-500">
                      <span className="text-brand-500 font-mono text-xs">OK</span>
                      <span className="text-slate-200">エラーもAIが解決をサポート</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-brand-500/10 border-l-2 border-brand-500">
                      <span className="text-brand-500 font-mono text-xs">OK</span>
                      <span className="text-slate-200">最短距離で「作れるエンジニア」へ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className={`text-center text-lg md:text-xl font-bold text-white anim-hidden anim-up ${isVisible ? 'anim-visible delay-3' : ''}`}>
              <span className="glass-card px-4 py-2 border border-brand-500/30 text-brand-400">時代が変わった今、学び方も変わるべき。</span>
            </p>
          </div>

          {/* ===== 学習の流れ ===== */}
          <div className="flex flex-col lg:flex-row justify-between items-start mb-12 lg:mb-20">
             <div className={`anim-hidden anim-left ${isVisible ? 'anim-visible delay-4' : ''}`}>
               <h2 className="text-3xl md:text-5xl lg:text-6xl font-black italic tracking-tighter text-white mb-6">
                 学習の<br/>流れ
               </h2>
             </div>
             <div className={`max-w-xl pt-4 anim-hidden anim-right ${isVisible ? 'anim-visible delay-5' : ''}`}>
               <p className="text-lg font-bold leading-relaxed text-slate-300">
                 従来のスクール：コードを覚える。<br/>
                 TechStars：AIに指示を出す。<br/>
                 <span className="text-brand-500">覚えるのはAIの使い方だけ。</span><br/>
                 <span className="text-brand-500">作るのは本物のシステム。</span>
               </p>
             </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
             {/* Card 01: Horizontal Step Active - PROMPT */}
             <div className={`bg-brand-500 p-6 relative overflow-hidden group min-h-[240px] sm:min-h-[280px] flex flex-col justify-between hover:scale-105 transition-all duration-300 anim-hidden anim-up ${isVisible ? 'anim-visible delay-2' : ''}`}>
               <span className="absolute -right-4 -bottom-6 text-[100px] font-black text-black/20 leading-none select-none">01</span>
               <div className="relative z-10">
                 <span className="text-xs font-bold text-black bg-white/30 px-2 py-1 rounded">STEP 1</span>
               </div>
               <div className="relative z-10">
                 <h3 className="font-black text-4xl text-black mb-3 tracking-tight">PROMPT</h3>
                 <p className="text-sm font-medium text-black/80 leading-relaxed">「何を作るか」を言語化する。曖昧な要件を、AIが理解できる指示に変換。</p>
               </div>
             </div>

             {/* Card 02: Floating Island Pattern - GENERATE */}
             <div className={`relative bg-gradient-to-br from-slate-800 to-black p-6 border-t border-white/10 min-h-[240px] sm:min-h-[280px] flex flex-col justify-between hover:-translate-y-3 transition-all duration-500 shadow-2xl anim-hidden anim-up ${isVisible ? 'anim-visible delay-3' : ''}`}>
               <div className="flex justify-between items-start">
                 <div className="w-10 h-10 bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-500 font-black text-sm">02</div>
                 <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
               </div>
               <div>
                 <h3 className="font-black text-3xl text-white mb-3 tracking-tight">GENERATE</h3>
                 <p className="text-sm font-medium text-slate-400 leading-relaxed">AIがコードを生成。HTML、CSS、JavaScript、バックエンド。全部AIが書く。</p>
                 <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-4">
                   <div className="h-full bg-brand-500 w-[60%]"></div>
                 </div>
               </div>
             </div>

             {/* Card 03: Terminal Log Pattern - DEBUG */}
             <div className={`bg-slate-950 p-6 font-mono text-xs min-h-[240px] sm:min-h-[280px] flex flex-col border border-slate-800 hover:border-brand-500/50 transition-colors anim-hidden anim-up ${isVisible ? 'anim-visible delay-4' : ''}`}>
               <div className="flex gap-2 mb-4">
                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                 <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                 <div className="w-2 h-2 rounded-full bg-green-500"></div>
               </div>
               <div className="space-y-2 flex-1">
                 <div className="flex gap-2">
                   <span className="text-green-500">➜</span>
                   <span className="text-brand-400">detect error</span>
                   <span className="text-slate-500">--found</span>
                 </div>
                 <div className="flex gap-2">
                   <span className="text-green-500">➜</span>
                   <span className="text-brand-400">analyze cause</span>
                   <span className="text-slate-500">[0.3s]</span>
                 </div>
                 <div className="flex gap-2">
                   <span className="text-green-500">➜</span>
                   <span className="text-slate-300">generating fix...</span>
                 </div>
               </div>
               <div className="mt-auto pt-4">
                 <div className="p-2 bg-brand-500/10 border-l-2 border-brand-500 text-brand-300 mb-3">
                   Status: Fix Ready
                 </div>
                 <h3 className="font-black text-2xl text-white tracking-tight font-sans">DEBUG</h3>
                 <p className="text-slate-500 mt-1 font-sans text-sm">エラーが出たらAIに投げる。原因特定から修正まで数秒。</p>
               </div>
             </div>

             {/* Card 04: Brutalist Active Pattern - SHIP */}
             <div className={`bg-brand-500 p-1 hover:-translate-y-2 hover:-translate-x-2 transition-transform duration-200 min-h-[240px] sm:min-h-[280px] anim-hidden anim-up ${isVisible ? 'anim-visible delay-5' : ''}`}>
               <div className="bg-black text-white h-full p-6 border-2 border-transparent flex flex-col justify-between">
                 <div className="flex justify-between items-baseline border-b-2 border-brand-500 pb-3">
                   <span className="text-4xl font-black">04</span>
                   <span className="text-xs font-bold bg-brand-500 text-black px-2 py-1">FINAL</span>
                 </div>
                 <div>
                   <h3 className="font-black text-4xl text-brand-500 mb-3 tracking-tight">SHIP</h3>
                   <p className="text-sm font-medium text-slate-400 leading-relaxed">動くものをデプロイ。Day 7には、本番環境で動くシステムが手元にある。</p>
                 </div>
                 <div className="flex items-center gap-2 pt-4">
                   <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                   <span className="text-xs text-green-400 font-mono">DEPLOYED</span>
                 </div>
               </div>
             </div>
          </div>
       </div>
    </section>
  );
};