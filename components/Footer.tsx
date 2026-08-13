import React, { useEffect, useRef, useState } from 'react';
import { PageType } from '../types';

interface FooterProps {
  onOpenPage: (page: PageType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPage }) => {
  const footerRef = useRef<HTMLElement>(null);
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
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="bg-black text-white pt-28 lg:pt-44 pb-12 relative overflow-x-hidden">
      {/* 上部の水平ネオンライン（セクション区切り） */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-500/60 via-brand-500/20 to-transparent"></div>

      {/* Cyber Grid Background - 視認性向上 */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none"></div>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12 mb-16">
          <div className={`anim-hidden anim-up ${isVisible ? 'anim-visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="TechStars" className="h-10 w-auto" />
              <div className="flex items-baseline gap-1">
                <span className="font-black text-white text-base tracking-tight">TECHSTARS</span>
                <span className="font-mono text-brand-500 text-xs tracking-widest">AI</span>
              </div>
            </div>
            <p className="font-mono text-xs text-slate-500 max-w-xs">
              7日間でプロへ。AIと作る、動くシステム3つ。
            </p>
          </div>
          
          <div className={`flex flex-wrap gap-8 md:gap-12 font-mono text-xs anim-hidden anim-up ${isVisible ? 'anim-visible delay-2' : ''}`}>
            <div className="flex flex-col gap-2">
              <span className="text-slate-500 font-bold pb-2">受講生</span>
              <a
                href="https://techstars-lms.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 text-brand-500 hover:text-brand-400 transition-colors"
              >
                受講生専用ページ
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-slate-500 font-bold pb-2">法的情報</span>
              <button
                onClick={() => onOpenPage(PageType.Privacy)}
                className="text-left py-2 hover:text-brand-500 transition-colors"
              >
                プライバシーポリシー
              </button>
              <button
                onClick={() => onOpenPage(PageType.Terms)}
                className="text-left py-2 hover:text-brand-500 transition-colors"
              >
                利用規約
              </button>
              <button
                onClick={() => onOpenPage(PageType.Tokushoho)}
                className="text-left py-2 hover:text-brand-500 transition-colors"
              >
                特定商取引法に基づく表記
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-slate-500 font-bold pb-2">SNS</span>
              <a href="#" className="py-2 hover:text-brand-500 transition-colors">Twitter / X</a>
              <a href="#" className="py-2 hover:text-brand-500 transition-colors">Instagram</a>
            </div>
          </div>
        </div>

        <div className={`border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 anim-hidden anim-up ${isVisible ? 'anim-visible delay-3' : ''}`}>
          <p className="font-mono text-[10px] text-slate-600">
            COPYRIGHT &copy; {new Date().getFullYear()} TECHSTARS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-mono text-[10px] text-slate-500">受付中</span>
          </div>
        </div>
      </div>
    </footer>
  );
};