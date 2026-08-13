import React, { useState, useEffect } from 'react';
import { SectionId, PageType } from '../types';
import { Menu, X, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  onOpenPage: (page: PageType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: '学習の流れ', href: `#${SectionId.Model}` },
    { label: 'カリキュラム', href: `#${SectionId.Portfolio}` },
    { label: '講師陣', href: `#${SectionId.Team}` },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-[background-color,border-color,padding] duration-300 border-b ${
          isScrolled
            ? 'bg-black/95 border-slate-800 py-3'
            : 'bg-transparent border-transparent py-6'
        }`}
        aria-label="メインナビゲーション"
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex justify-between items-center">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 md:gap-3 group z-50 shrink-0">
            <img src="/logo.png" alt="TechStars" className="h-8 md:h-10 w-auto group-hover:scale-105 transition-transform duration-300" />
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="font-black text-white text-xs md:text-base tracking-tight">TECHSTARS</span>
              <span className="font-mono text-brand-500 text-[8px] md:text-xs tracking-widest">AI</span>
            </div>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex gap-1 bg-black/50 px-2 py-1 border border-white/10">
                {navLinks.map((link) => (
                <a
                    key={link.label}
                    href={link.href}
                    className="px-5 py-2 font-mono text-xs font-bold text-slate-400 hover:text-brand-500 hover:bg-white/5 transition-all"
                >
                    {link.label}
                </a>
                ))}
            </div>

            <div className="h-6 w-[1px] bg-slate-800"></div>

            <button
                onClick={() => onOpenPage(PageType.Company)}
                className="font-mono text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            >
                料金 <ArrowUpRight className="w-3 h-3" />
            </button>
             <button
                onClick={() => onOpenPage(PageType.FAQ)}
                className="font-mono text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            >
                よくある質問 <ArrowUpRight className="w-3 h-3" />
            </button>

            <a
              href={`#${SectionId.Contact}`}
              className="ml-4 px-6 py-2 bg-white text-black font-sans font-black italic tracking-tighter text-sm hover:bg-brand-500 transition-colors duration-300"
            >
              無料で詳細を見る
            </a>
            <a
              href="https://techstars-lms.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-brand-500 text-brand-500 font-mono text-xs font-bold hover:bg-brand-500 hover:text-black transition-colors duration-300"
            >
              受講生専用
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 z-50"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col pt-24 px-6">
          {navLinks.map((link, idx) => (
            <a
              key={link.label}
              href={link.href}
              className="text-2xl sm:text-3xl md:text-4xl font-black italic tracking-tighter text-white py-3 sm:py-4 border-b border-slate-800 hover:text-brand-500 transition-colors flex items-center gap-3 sm:gap-4"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="text-xs font-mono text-brand-500">0{idx + 1}</span>
              {link.label}
            </a>
          ))}
          <button
            onClick={() => { setIsMenuOpen(false); onOpenPage(PageType.Company); }}
            className="text-left text-xl sm:text-2xl md:text-3xl font-black italic tracking-tighter text-slate-400 py-3 sm:py-4 border-b border-slate-800 hover:text-white"
          >
             料金プラン
          </button>
           <button
            onClick={() => { setIsMenuOpen(false); onOpenPage(PageType.FAQ); }}
            className="text-left text-xl sm:text-2xl md:text-3xl font-black italic tracking-tighter text-slate-400 py-3 sm:py-4 border-b border-slate-800 hover:text-white"
          >
             よくある質問
          </button>
          <a
            href="https://techstars-lms.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 px-6 py-4 border-2 border-brand-500 text-brand-500 font-mono text-sm font-bold hover:bg-brand-500 hover:text-black transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            受講生専用ページ <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </>
  );
};