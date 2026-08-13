import React, { useEffect, useRef, useState } from 'react';
import { SectionId, TeamMember } from '../types';
import { Code, Briefcase, Rocket, Users } from 'lucide-react';

const members: TeamMember[] = [
  {
    id: 1,
    name: '坂本 純一',
    role: '代表 / メイン講師',
    bio: '2社経営の代表取締役。創業80期を迎える老舗企業を率いながら、AI駆動開発の最前線で実践中。',
    image: '/sakamoto.jpg',
  },
  {
    id: 2,
    name: '沼倉 隆平',
    role: 'AIスペシャリスト',
    bio: 'AI×開発のスペシャリスト。1000万円クラスの案件を1ヶ月で20本受注した超実践派。',
    image: '/numakura.jpg',
  },
];

export const Team: React.FC = () => {
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
    <section ref={sectionRef} id={SectionId.Team} className="pt-28 lg:pt-44 pb-24 lg:pb-36 bg-black relative overflow-x-hidden">
      {/* 上部の水平ネオンライン（セクション区切り） */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-500/60 via-brand-500/20 to-transparent"></div>

      {/* Cyber Grid Background - 視認性向上 */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none"></div>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">

        {/* ===== 受講後のあなた ===== */}
        <div className="mb-20 lg:mb-32">
          <div className={`mb-12 anim-hidden anim-up ${isVisible ? 'anim-visible' : ''}`}>
            <p className="font-mono text-xs text-brand-500 mb-4 tracking-widest">// OUTPUT</p>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black italic tracking-tighter text-white mb-4">
              7日後に<span className="text-brand-500">できること</span>
            </h2>
            <p className="text-slate-400 max-w-2xl">
              具体的に何ができるようになるか。曖昧な約束はしない。
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Glowing Edge Pattern */}
            <div className={`relative p-[2px] rounded-2xl overflow-hidden group anim-hidden anim-up ${isVisible ? 'anim-visible delay-1' : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-purple-600 to-brand-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow" style={{ animationDuration: '4s' }}></div>
              <div className="relative bg-black h-full rounded-2xl p-6 lg:p-8 flex flex-col">
                <div className="w-14 h-14 rounded-full bg-brand-500/10 flex items-center justify-center mb-4 text-brand-400 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                  <Code className="w-7 h-7" />
                </div>
                <span className="font-mono text-[10px] text-brand-500 tracking-widest mb-2">01</span>
                <h3 className="text-xl font-bold text-white mb-3">Webサイト制作</h3>
                <p className="text-sm text-slate-400 leading-relaxed">LP、ポートフォリオを0から実装できる。レスポンシブ対応、SEO基礎も含む。</p>
              </div>
            </div>

            {/* Card 2: Data Display Terminal Pattern */}
            <div className={`border border-slate-800 bg-slate-900/50 p-6 font-mono text-[10px] group hover:border-brand-500/50 transition-colors anim-hidden anim-up ${isVisible ? 'anim-visible delay-2' : ''}`}>
              <div className="flex justify-between text-slate-500 mb-4 border-b border-white/5 pb-2">
                <span>ID: AUTO-02</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
                  <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="w-12 h-12 border border-brand-500/30 flex items-center justify-center mb-4 text-brand-500">
                <Rocket className="w-6 h-6" />
              </div>
              <div className="space-y-2 mb-4 text-slate-300 text-xs">
                <div className="flex justify-between"><span>STATUS</span><span className="text-brand-400">ENABLED</span></div>
                <div className="flex justify-between"><span>TARGETS</span><span>GMAIL, GAS, SLACK</span></div>
              </div>
              <h3 className="text-white font-bold text-lg mt-4 font-sans">業務自動化</h3>
              <p className="text-slate-500 text-sm mt-2 font-sans">GASでGmail自動返信、スプレッドシート集計、Slack通知を構築できる。</p>
            </div>

            {/* Card 3: Brutalist Pattern */}
            <div className={`bg-brand-500 p-1 hover:-translate-y-2 hover:-translate-x-2 transition-transform duration-200 group anim-hidden anim-up ${isVisible ? 'anim-visible delay-3' : ''}`}>
              <div className="bg-black text-white h-full p-6 border-2 border-transparent">
                <div className="flex justify-between items-center border-b-2 border-brand-500 pb-3 mb-4">
                  <Briefcase className="w-8 h-8 text-brand-500" />
                  <span className="text-xs font-bold bg-brand-500 text-black px-2 py-1">03</span>
                </div>
                <h3 className="font-bold text-xl mb-3">案件獲得</h3>
                <p className="text-sm text-slate-400 leading-relaxed">見積もりの出し方、提案書テンプレートを提供。卒業翌週から営業開始可能。</p>
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-xs text-brand-500 font-mono">READY_TO_LAUNCH</span>
                </div>
              </div>
            </div>

            {/* Card 4: Glass Hologram Pattern */}
            <div className={`holographic p-6 lg:p-8 rounded-xl border border-white/10 group transition-all duration-500 hover:border-brand-500/50 anim-hidden anim-up ${isVisible ? 'anim-visible delay-4' : ''}`}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-xs text-slate-400">v.4.0</span>
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-brand-500 group-hover:text-brand-500 transition-all">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-mono text-[10px] text-brand-500 tracking-widest">04</span>
                <h3 className="text-xl font-bold text-white mt-2 mb-3">コミュニティ</h3>
                <p className="text-sm tracking-widest font-medium text-slate-400 leading-relaxed">卒業生Slackに招待。案件情報、技術相談、勉強会の案内を共有。</p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-400 font-mono">ACTIVE_MEMBERS</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 講師陣 ===== */}
        <h2 className={`text-3xl md:text-5xl lg:text-6xl font-black italic tracking-tighter text-white mb-12 md:mb-16 anim-hidden anim-left ${isVisible ? 'anim-visible delay-5' : ''}`}>
          講師陣
        </h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {members.map((member, index) => (
            <div
              key={member.id}
              className={`group relative glass-card min-h-[360px] sm:min-h-[400px] md:min-h-[480px] lg:min-h-[520px] p-6 flex flex-col justify-end overflow-hidden holographic anim-hidden anim-scale ${isVisible ? `anim-visible delay-${index + 2}` : ''}`}
            >
               {/* Hex Profile Image */}
               <div className="absolute inset-4 glitch-img">
                  <div className="hex-profile w-full h-full overflow-hidden">
                    <img src={member.image} alt={`${member.name}の写真`} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
               </div>

               {/* Scanline Effect */}
               <div className="absolute inset-0 pointer-events-none opacity-30 group-hover:opacity-0 transition-opacity" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 229, 255, 0.03) 2px, rgba(0, 229, 255, 0.03) 4px)' }}></div>

               {/* Content */}
               <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="font-mono text-xs text-brand-500 mb-1">{member.role}</p>
                  <h3 className="text-xl font-bold text-white mb-2 glitch-hover">{member.name}</h3>
                  <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                    <p className="text-xs text-slate-300 font-mono mt-2 border-t border-brand-500/30 pt-2">
                      {member.bio}
                    </p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};