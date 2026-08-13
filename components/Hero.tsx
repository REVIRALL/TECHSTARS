import React from 'react';
import { SectionId } from '../types';
import { TrendingUp, Clock } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section id={SectionId.Home} className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] bg-black text-white overflow-x-hidden pb-8 sm:pb-12">

      {/* Cyber Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0 cyber-grid opacity-30">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
      </div>

      {/* コンテンツ開始位置: モバイル最適化 */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 relative z-20 pt-[100px] sm:pt-[120px] md:pt-[160px] lg:pt-[200px]">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 sm:gap-8 lg:gap-12">
            <div className="relative w-full lg:w-auto">
                {/* Badge - Scale pop animation */}
                <div className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 border border-brand-500/50 bg-brand-500/20 mb-4 sm:mb-6 md:mb-8 opacity-0 animate-hero-badge">
                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-brand-500 rounded-full animate-blink"></div>
                    <span className="font-mono text-[10px] sm:text-xs font-bold text-brand-400 tracking-widest">
                    AIエンジニア育成プログラム
                    </span>
                </div>

                {/* Title - Hero slide animation - モバイル最適化 */}
                <h1 className="text-[13vw] sm:text-[11vw] md:text-[9vw] lg:text-[7vw] leading-[0.9] sm:leading-[0.85] font-black italic tracking-tighter text-white mb-4 sm:mb-6 md:mb-8 relative opacity-0 animate-hero-title">
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">7日間で</span>
                    <span className="block text-brand-500">プロへ。</span>
                </h1>
            </div>

            <div className="lg:mb-12 max-w-xl w-full">
                 {/* Description - Slide right animation */}
                 <div className="opacity-0 animate-hero-desc">
                   <p className="font-mono text-xs sm:text-sm text-brand-500 mb-2 sm:mb-4">// AI ENGINEER BOOTCAMP</p>
                   <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium leading-relaxed text-slate-300 mb-4 sm:mb-6 md:mb-8">
                      <span className="text-white font-bold italic">コードは書かない。指示を出す。</span><br/>
                      AIがコードを生成。あなたは設計と判断に集中。<br/>
                      7日間で、動くシステムを3つ作る。
                   </p>
                 </div>

                 {/* Cards - Slide up animation - モバイルは2列維持 */}
                 <div className="grid grid-cols-2 gap-3 sm:gap-4 opacity-0 animate-hero-cards">
                    <div className="glass-card holographic p-3 sm:p-4 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="relative icon-glow">
                          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500 mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="font-bold text-xs sm:text-sm">実践形式</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">講義90分 → 即実装</p>
                    </div>
                    <div className="glass-card holographic p-3 sm:p-4 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="relative icon-glow">
                          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500 mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="font-bold text-xs sm:text-sm">7日間</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">週末だけでも完了可能</p>
                    </div>
                 </div>
            </div>
        </div>

        {/* ===== 実績・数字 - DATA CARDS PATTERN ===== */}
        <div className="mt-10 sm:mt-16 md:mt-20 lg:mt-32 opacity-0 animate-hero-cards">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">

            {/* Card 1: Glass Standard Pattern */}
            <div className="glass-card p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl relative group overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,229,255,0.2)] hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-transparent"></div>
              <div className="flex justify-between items-start mb-3 sm:mb-6">
                <span className="font-mono text-[8px] sm:text-[10px] text-brand-400 border border-brand-500/30 px-1.5 sm:px-2 py-0.5 sm:py-1">DURATION</span>
              </div>
              <div className="relative z-10">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-1 group-hover:scale-110 transition-transform origin-left">7</div>
                <div className="text-xs sm:text-sm font-bold text-slate-400">日間</div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-24 sm:w-32 h-24 sm:h-32 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all"></div>
            </div>

            {/* Card 2: Neon Cyber Pattern */}
            <div className="relative bg-black border border-slate-800 p-4 sm:p-6 lg:p-8 group overflow-hidden hover:border-brand-500 transition-colors duration-300">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-50"></div>
              <div className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 text-[60px] sm:text-[80px] md:text-[100px] lg:text-[120px] font-black text-slate-900 leading-none select-none transition-transform duration-500 group-hover:text-slate-800 group-hover:translate-x-2">3</div>
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-brand-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] sm:text-xs font-mono text-brand-500 tracking-widest">OUTPUT</span>
                </div>
                <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 glitch-hover">3 TYPES</div>
                <div className="w-8 sm:w-12 h-1 bg-brand-500 group-hover:w-full transition-all duration-500"></div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">種のシステム</p>
              </div>
            </div>

            {/* Card 3: Data Display Terminal Pattern */}
            <div className="border border-slate-800 bg-slate-900/50 p-3 sm:p-5 lg:p-6 font-mono text-[9px] sm:text-[10px] group hover:border-brand-500/50 transition-colors">
              <div className="flex justify-between text-slate-500 mb-2 sm:mb-4 border-b border-white/5 pb-1.5 sm:pb-2">
                <span>ID: STY-01</span>
                <div className="flex gap-0.5 sm:gap-1">
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-slate-700 rounded-full"></div>
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-slate-700 rounded-full"></div>
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-brand-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-4 text-slate-300">
                <div className="flex justify-between"><span>STATUS</span><span className="text-brand-400">ACTIVE</span></div>
                <div className="flex justify-between"><span>TYPE</span><span>1:1</span></div>
                <div className="flex justify-between"><span>FORMAT</span><span>PRIVATE</span></div>
              </div>
              <div className="h-0.5 sm:h-1 w-full bg-slate-800 overflow-hidden relative">
                <div className="h-full bg-brand-500 w-full"></div>
              </div>
              <p className="text-white font-bold text-sm sm:text-lg mt-2 sm:mt-4 font-sans">マンツーマン</p>
            </div>

            {/* Card 4: Brutalist Pattern */}
            <div className="bg-brand-500 p-0.5 sm:p-1 hover:-translate-y-2 hover:-translate-x-2 transition-transform duration-200 group">
              <div className="bg-black text-white h-full p-3 sm:p-5 lg:p-6 border-2 border-transparent">
                <div className="flex justify-between items-baseline border-b-2 border-brand-500 pb-2 sm:pb-4 mb-2 sm:mb-4">
                  <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black">∞</span>
                  <span className="text-[8px] sm:text-xs font-bold bg-brand-500 text-black px-1">COMMUNITY</span>
                </div>
                <p className="font-bold text-sm sm:text-lg lg:text-xl leading-tight">卒業生と<br/>永久に繋がる</p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </section>
  );
};