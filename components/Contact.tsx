import React, { useEffect, useRef, useState } from 'react';
import { SectionId } from '../types';
import { IdeaValidator } from './IdeaValidator';
import { CheckCircle } from 'lucide-react';

export const Contact: React.FC = () => {
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
    <section ref={sectionRef} id={SectionId.Contact} className="pt-28 lg:pt-44 pb-28 lg:pb-48 bg-black relative overflow-x-hidden">
      {/* 上部の水平ネオンライン（セクション区切り） */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-500/60 via-brand-500/20 to-transparent"></div>

      {/* Cyber Grid Background - 視認性向上 */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none"></div>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">

        {/* ===== こんな人におすすめ - Data Display Terminal Pattern ===== */}
        <div className="mb-20 lg:mb-32 relative z-10">
          <div className={`mb-10 anim-hidden anim-up ${isVisible ? 'anim-visible' : ''}`}>
            <p className="font-mono text-xs text-brand-500 mb-4 tracking-widest">// TARGET_PROFILE.scan()</p>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black italic tracking-tighter text-white">
              <span className="text-brand-500">こういう人</span>向け
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'USR-001', text: 'Progateで挫折した。でも諦めたくない', status: 'MATCH' },
              { id: 'USR-002', text: '仕事が忙しい。週末しか時間がない', status: 'MATCH' },
              { id: 'USR-003', text: 'ChatGPTは使ってる。もっと実用的に使いたい', status: 'MATCH' },
              { id: 'USR-004', text: '副業したい。でも何から始めていいかわからない', status: 'MATCH' },
              { id: 'USR-005', text: '毎日同じ作業の繰り返し。自動化したい', status: 'MATCH' },
              { id: 'USR-006', text: 'エンジニアに転職したい。独学は限界', status: 'MATCH' },
            ].map((item, i) => (
              <div
                key={i}
                className={`group relative bg-black border border-slate-800 hover:border-brand-500/50 transition-all duration-300 overflow-hidden anim-hidden anim-up ${isVisible ? `anim-visible delay-${(i % 3) + 1}` : ''}`}
              >
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
                  <span className="font-mono text-[10px] text-slate-500">{item.id}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="font-mono text-[10px] text-green-400">{item.status}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-500/10 border border-brand-500/30 flex items-center justify-center shrink-0 group-hover:bg-brand-500 group-hover:border-brand-500 transition-all">
                      <CheckCircle className="w-4 h-4 text-brand-500 group-hover:text-black transition-colors" />
                    </div>
                    <p className="text-sm text-slate-300 group-hover:text-white transition-colors leading-relaxed">{item.text}</p>
                  </div>
                </div>

                {/* Bottom Progress Line */}
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-500 group-hover:w-full transition-all duration-500"></div>
              </div>
            ))}
          </div>

          <div className={`mt-10 text-center anim-hidden anim-up ${isVisible ? 'anim-visible delay-4' : ''}`}>
            <div className="inline-flex items-center gap-4 bg-black border border-brand-500/50 px-6 py-4">
              <div className="w-3 h-3 bg-brand-500 animate-pulse"></div>
              <p className="text-white font-bold text-sm">
                <span className="text-brand-500">1つでも刺さったら、</span>詳細を見てほしい。
              </p>
              <span className="font-mono text-[10px] text-brand-400">SIGNAL_DETECTED</span>
            </div>
          </div>
        </div>

        {/* ===== お問い合わせ - Cyberpunk Terminal Pattern ===== */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 relative z-10">

          <div className={`anim-hidden anim-left ${isVisible ? 'anim-visible delay-5' : ''}`}>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-6">
              君も、<br /><span className="text-brand-500">星になれ。</span>
            </h2>
            <p className="text-lg text-slate-400 font-medium mb-8 max-w-md">
              TECHSTARSは「TECH × 星」。<br/>
              テクノロジーの力で、あなたを輝く星に変える。<br/>
              <span className="text-white font-bold">7日後、別人になっている。</span>
            </p>

            {/* Mission Statement */}
            <div className="mb-8 p-4 border-l-2 border-brand-500 bg-brand-500/5">
              <p className="text-sm text-slate-300 italic">
                "コードを書かなくても、システムは作れる。<br/>
                AIを味方につけた者が、次の時代を創る。"
              </p>
            </div>

            {/* Contact Info - Terminal Style */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 font-mono text-sm">
                <span className="text-brand-500">$</span>
                <span className="text-slate-500">mission</span>
                <span className="text-white">BECOME_A_STAR</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-sm">
                <span className="text-brand-500">$</span>
                <span className="text-slate-500">contact</span>
                <span className="text-white">support@techstars.studio</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-sm">
                <span className="text-brand-500">$</span>
                <span className="text-slate-500">status</span>
                <span className="text-green-400 animate-pulse">LAUNCHING_NOW</span>
              </div>
            </div>
          </div>

          <div className={`anim-hidden anim-right ${isVisible ? 'anim-visible delay-6' : ''}`}>
             {/* Terminal Window Frame */}
             <div className="border border-slate-800 bg-black overflow-hidden">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <span className="font-mono text-xs text-slate-500">ai_consultation.exe</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                    <span className="font-mono text-[10px] text-brand-400">READY</span>
                  </div>
                </div>

                {/* Form Content */}
                <div className="p-6 lg:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="font-mono text-brand-500 text-lg">&gt;</span>
                    <h3 className="text-xl font-bold text-white">無料で詳細を確認</h3>
                  </div>
                  <IdeaValidator />
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};