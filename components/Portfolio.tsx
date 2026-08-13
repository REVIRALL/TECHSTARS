import React, { useState, useEffect, useRef } from 'react';
import { SectionId, PortfolioItem } from '../types';
import { ArrowUpRight } from 'lucide-react';

const items: PortfolioItem[] = [
  {
    id: 1,
    name: 'Web制作',
    category: 'Day 1-2',
    description: 'Claude Code環境構築 → LP/ポートフォリオ実装 → レスポンシブ対応 → デプロイ',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
  },
  {
    id: 2,
    name: '業務自動化',
    category: 'Day 3-4',
    description: 'GAS基礎 → Gmail自動返信 → スプレッドシート集計 → Slack通知連携',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
  },
  {
    id: 3,
    name: 'バックエンド',
    category: 'Day 5-6',
    description: 'Render + Supabase環境構築 → DB設計 → CRUD実装 → 本番デプロイ',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop',
  },
  {
    id: 4,
    name: '卒業',
    category: 'Day 7',
    description: 'ポートフォリオ完成 → 案件獲得講座 → 見積もり実践 → コミュニティ招待',
    image: 'https://images.unsplash.com/photo-1523287562758-66c7fc58967f?w=800&h=600&fit=crop',
  },
];

export const Portfolio: React.FC = () => {
  const [activeImage, setActiveImage] = useState<string | null>(items[0].image);
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
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id={SectionId.Portfolio} className="relative bg-black pt-28 lg:pt-44 pb-24 lg:pb-36 overflow-x-hidden">
      {/* 上部の水平ネオンライン（セクション区切り） */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-500/60 via-brand-500/20 to-transparent"></div>

      {/* Cyber Grid Background - 視認性向上 */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none"></div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">
        <div className={`flex items-end justify-between mb-12 anim-hidden anim-up ${isVisible ? 'anim-visible' : ''}`}>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black italic tracking-tighter text-white">
            カリキュラム
          </h2>
          <span className="font-mono text-xs glass-card px-3 py-1.5 text-brand-500 border border-brand-500/30">
            // 7日間プログラム
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* List View - Terminal Log Pattern */}
          <div className="lg:col-span-7">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`group relative bg-black border border-slate-800 hover:border-brand-500/50 transition-all duration-300 cursor-pointer overflow-hidden anim-hidden anim-left ${isVisible ? `anim-visible delay-${index + 1}` : ''}`}
                  onMouseEnter={() => setActiveImage(item.image)}
                >
                  {/* Terminal Header Bar */}
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                      <div className={`w-2 h-2 rounded-full ${index === items.length - 1 ? 'bg-brand-500 animate-pulse' : 'bg-green-500'}`}></div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{item.category}</span>
                  </div>

                  {/* Content Area */}
                  <div className="p-4 md:p-6">
                    <div className="flex items-start gap-4">
                      {/* Step Number - Brutalist Style */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 bg-brand-500 flex items-center justify-center">
                          <span className="font-mono text-xl font-black text-black">0{item.id}</span>
                        </div>
                        {index < items.length - 1 && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-8 bg-gradient-to-b from-brand-500/50 to-transparent"></div>
                        )}
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-brand-400 transition-colors">
                            {item.name}
                          </h3>
                          <ArrowUpRight className="w-5 h-5 text-brand-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </div>

                        {/* Command Line Style Description */}
                        <div className="font-mono text-xs text-slate-400 bg-slate-900/50 p-3 border-l-2 border-brand-500/30 group-hover:border-brand-500 transition-colors">
                          <span className="text-brand-500">$</span> {item.description}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 h-1 bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500 group-hover:shadow-[0_0_10px_var(--brand)]"
                              style={{ width: `${(item.id / items.length) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">{Math.round((item.id / items.length) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/5 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Image Preview (Sticky) - Data Display Terminal Pattern */}
          <div className={`hidden lg:block lg:col-span-5 relative anim-hidden anim-scale ${isVisible ? 'anim-visible delay-2' : ''}`}>
            <div className="sticky top-32">
              {/* Terminal Window */}
              <div className="border border-slate-800 bg-black overflow-hidden">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <span className="font-mono text-xs text-slate-500">curriculum_preview.exe</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                    <span className="font-mono text-[10px] text-brand-400">LIVE</span>
                  </div>
                </div>

                {/* Image Area */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {activeImage && (
                    <img
                      src={activeImage}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover grayscale-[40%] opacity-90 transition-all duration-500 hover:grayscale-0"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

                  {/* Scanline Effect */}
                  <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 229, 255, 0.03) 2px, rgba(0, 229, 255, 0.03) 4px)' }}></div>

                  {/* Corner Brackets */}
                  <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-brand-500/70"></div>
                  <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-brand-500/70"></div>
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-brand-500/70"></div>
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-brand-500/70"></div>

                  {/* Center Crosshair */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 pointer-events-none opacity-30">
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-brand-500"></div>
                    <div className="absolute top-0 left-1/2 w-[1px] h-full bg-brand-500"></div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="px-4 py-3 bg-slate-900/80 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-slate-500">STATUS</span>
                    <span className="font-mono text-[10px] text-green-400">RENDERING</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="font-mono text-lg font-bold text-white">7</div>
                      <div className="font-mono text-[9px] text-slate-500">DAYS</div>
                    </div>
                    <div>
                      <div className="font-mono text-lg font-bold text-brand-400">4</div>
                      <div className="font-mono text-[9px] text-slate-500">MODULES</div>
                    </div>
                    <div>
                      <div className="font-mono text-lg font-bold text-white">3</div>
                      <div className="font-mono text-[9px] text-slate-500">OUTPUTS</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};