import React from 'react';
import { PageType } from '../types';
import { X, ArrowRight, Shield, FileText, BarChart3, Database, Globe, Users } from 'lucide-react';

interface FixedPageOverlayProps {
  page: PageType;
  onClose: () => void;
}

export const FixedPageOverlay: React.FC<FixedPageOverlayProps> = ({ page, onClose }) => {
  if (page === PageType.None) return null;

  const isDarkPage = page === PageType.Privacy || page === PageType.Terms || page === PageType.Tokushoho;

  return (
    <div className={`fixed inset-0 z-[100] ${isDarkPage ? 'bg-black text-slate-300' : 'bg-slate-50 text-black'} overflow-y-auto animate-fade-in no-scrollbar`}>
      
      {/* Dynamic Header */}
      <div className={`fixed top-0 left-0 w-full px-6 lg:px-12 py-4 flex justify-between items-center ${isDarkPage ? 'bg-black/95 border-slate-800' : 'bg-white/95 border-slate-200'} border-b z-50`}>
         <div className="flex items-center gap-4">
            <div className={`flex flex-col items-center justify-center w-8 h-8 border ${isDarkPage ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-100'}`}>
               <span className="font-mono text-[10px] font-bold">ID</span>
            </div>
            <div>
               <span className="block font-black italic text-lg tracking-tighter uppercase leading-none">{page.replace('_', ' ')}</span>
               <span className="block font-mono text-[10px] text-brand-500 tracking-widest">:: 詳細情報 ::</span>
            </div>
         </div>
         <button onClick={onClose} className="group flex items-center gap-3 text-sm font-bold hover:text-brand-500 transition-colors">
            <span className="font-mono text-xs hidden md:inline-block opacity-50 group-hover:opacity-100">[ESC] 閉じる</span>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all group-hover:rotate-90 ${isDarkPage ? 'bg-slate-800 text-white group-hover:bg-brand-500 group-hover:text-black' : 'bg-black text-white group-hover:bg-brand-500 group-hover:text-black'}`}>
               <X size={16}/>
            </div>
         </button>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-32 pb-20">
        
        {/* COMPANY PAGE (PRICING): Technical Spec Sheet Style */}
        {page === PageType.Company && (
          <div className="animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-black pb-8 mb-12 gap-4">
               <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[0.8] font-black italic tracking-tighter">
                  料金<br/>プラン
               </h1>
               <div className="text-left md:text-right font-mono text-xs">
                  <p>7日間プログラム</p>
                  <p>オンライン / 日本全国</p>
                  <p>受付中</p>
               </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-12 lg:gap-24">
               {/* Left Column: Program Info */}
               <div className="lg:col-span-7">
                  <div className="prose prose-lg max-w-none">
                     <p className="text-xl md:text-2xl font-bold leading-relaxed mb-8">
                        7日間で、次世代エンジニアへ。<br/>
                        <span className="bg-brand-200 px-1">AIを相棒にした開発スキル</span>を習得します。
                     </p>
                     <p className="text-slate-600 leading-relaxed mb-8 font-medium">
                        完全オンライン完結のプログラム。経験豊富な講師陣によるマンツーマンサポートで、
                        未経験からでも確実にスキルを身につけることができます。
                     </p>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
                        <div className="bg-white p-6 border border-slate-200 shadow-sm hover:border-brand-500 transition-colors">
                           <BarChart3 className="w-8 h-8 text-brand-500 mb-4" />
                           <h4 className="font-black italic text-lg mb-2">7日間集中</h4>
                           <p className="text-sm text-slate-500">短期集中でスキル習得</p>
                        </div>
                        <div className="bg-white p-6 border border-slate-200 shadow-sm hover:border-brand-500 transition-colors">
                           <Database className="w-8 h-8 text-brand-500 mb-4" />
                           <h4 className="font-black italic text-lg mb-2">実践スキル</h4>
                           <p className="text-sm text-slate-500">実務で即使えるスキル</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Right Column: Pricing Sheet */}
               <div className="lg:col-span-5">
                  <div className="bg-white border-2 border-black p-1 relative">
                     <div className="border border-slate-200 p-6">
                        <h3 className="font-mono text-xs font-bold text-slate-400 mb-6 tracking-widest border-b border-slate-100 pb-2">
                           // プログラム詳細
                        </h3>
                        <dl className="space-y-6 font-mono text-sm">
                           <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-4">
                              <dt className="text-slate-500">期間</dt>
                              <dd className="sm:col-span-2 font-bold">7日間（講座+自習）</dd>
                           </div>
                           <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-4">
                              <dt className="text-slate-500">形式</dt>
                              <dd className="sm:col-span-2 font-bold">オンライン完結</dd>
                           </div>
                           <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-4">
                              <dt className="text-slate-500">サポート</dt>
                              <dd className="sm:col-span-2 font-bold">マンツーマンメンタリング</dd>
                           </div>
                           <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-4">
                              <dt className="text-slate-500">受講料</dt>
                              <dd className="sm:col-span-2">
                                 <span className="font-bold text-brand-600 text-lg">398,000円</span>
                                 <span className="text-xs text-slate-500 ml-1">+税</span>
                              </dd>
                           </div>
                           <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-4">
                              <dt className="text-slate-500">別途</dt>
                              <dd className="sm:col-span-2 text-xs text-slate-600">
                                 Claude Pro ($20〜/月) が必要です
                              </dd>
                           </div>
                           <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-4">
                              <dt className="text-slate-500">特典</dt>
                              <dd className="sm:col-span-2 font-bold">
                                 学習サポートツール＆専用サイト2ヶ月無料<br/>
                                 卒業証明書発行<br/>
                                 卒業生コミュニティ永久参加権
                              </dd>
                           </div>
                        </dl>

                        {/* Program ID */}
                        <div className="mt-8 pt-6 border-t border-slate-200">
                           <p className="text-[10px] text-center text-slate-400">プログラムID: 7DAYS-PRO-2026</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* FAQ PAGE */}
        {page === PageType.FAQ && (
          <div className="animate-slide-up">
            <div className="mb-16">
               <div className="inline-block bg-black text-white px-3 py-1 font-mono text-xs font-bold mb-4">
                  FAQ
               </div>
               <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1] font-black italic tracking-tighter mb-8">
                よくある<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-blue-600 pb-1 inline-block">質問</span>
              </h1>
              <p className="text-xl font-bold max-w-2xl text-slate-700">
                 プログラムに関するよくある質問をまとめました。<br/>
                 その他のご質問はお問い合わせください。
              </p>
            </div>

            <div className="space-y-4">
               {[
                  { q: "プログラミング未経験でも参加できますか？", a: "はい、未経験者も歓迎です。AIを活用することで、未経験からでも短期間でスキルを習得できます。基礎から丁寧に指導しますのでご安心ください。" },
                  { q: "7日間でどこまでのスキルが身につきますか？", a: "AIと協働してWebアプリケーションを開発できるレベルを目指します。Claude×Cursorを使った開発フロー、データベース設計、デプロイまでを実践的に学びます。" },
                  { q: "Claude Proの契約は必要ですか？", a: "はい、受講にはClaude Proのサブスクリプション（$20〜/月）が別途必要です。契約方法は受講前にご案内します。" },
                  { q: "オンライン完結とのことですが、サポート体制は？", a: "経験豊富な講師陣がマンツーマンでサポートします。チャットやビデオ通話でいつでも質問可能です。" },
                  { q: "受講に必要なものは何ですか？", a: "PC（Mac/Windows）とインターネット環境があれば受講可能です。Claudeアカウントとコマンドライン（ターミナル）を使用します。カリキュラムにより使用ツールは異なります。" },
                  { q: "卒業後はどうなりますか？", a: "卒業生限定のSlackコミュニティに永久参加できます。案件情報の共有、仕事の紹介・受け渡し、技術相談など、卒業生同士で繋がり続けられます。学習サポートツールは2ヶ月間無料で利用可能です。" },
                  { q: "支払い方法を教えてください", a: "クレジットカード、銀行振込に対応しています。分割払いについてはお問い合わせください。" }
               ].map((item, i) => (
                  <div key={i} className="group relative bg-white border border-slate-200 p-4 md:p-8 hover:border-black transition-all">
                     <h3 className="text-base md:text-xl font-black italic mb-4 group-hover:text-brand-600 transition-colors">{item.q}</h3>
                     <p className="text-sm md:text-base text-slate-600 leading-relaxed">{item.a}</p>
                  </div>
               ))}
            </div>
          </div>
        )}

        {/* PRIVACY PAGE */}
        {page === PageType.Privacy && (
           <div className="animate-slide-up max-w-3xl">
              <div className="mb-12 flex items-center gap-4 text-brand-500">
                 <Shield className="w-8 h-8 md:w-12 md:h-12" />
                 <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter text-white uppercase">プライバシーポリシー</h1>
              </div>

              <div className="space-y-10 text-sm leading-relaxed">
                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">1. 個人情報の定義</h3>
                    <p className="opacity-80">
                       「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。
                    </p>
                 </section>

                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">2. 個人情報の収集方法</h3>
                    <p className="opacity-80">
                       当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号などの個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を、当社の提携先（情報提供元、広告主、広告配信先などを含みます。以下、「提携先」といいます。）などから収集することがあります。
                    </p>
                 </section>

                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">3. 個人情報を収集・利用する目的</h3>
                    <ul className="opacity-80 list-disc list-inside space-y-2">
                       <li>当社サービスの提供・運営のため</li>
                       <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                       <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため</li>
                       <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                       <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                       <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
                       <li>有料サービスにおいて、ユーザーに利用料金を請求するため</li>
                       <li>上記の利用目的に付随する目的</li>
                    </ul>
                 </section>

                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">4. 利用目的の変更</h3>
                    <p className="opacity-80">
                       当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。
                    </p>
                 </section>

                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">5. 個人情報の第三者提供</h3>
                    <p className="opacity-80 mb-4">
                       当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
                    </p>
                    <ul className="opacity-80 list-disc list-inside space-y-2">
                       <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                       <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                       <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                    </ul>
                 </section>

                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">6. お問い合わせ窓口</h3>
                    <p className="opacity-80">
                       本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。<br/><br/>
                       <span className="text-white">株式会社リバイラル</span><br/>
                       Eメールアドレス：<span className="text-brand-500">support@techstars.studio</span>
                    </p>
                 </section>

                 <div className="pt-8 mt-8 border-t border-slate-800 text-xs text-slate-500">
                    <p>© 2026 Revirall Co., Ltd. All rights reserved.</p>
                 </div>
              </div>
           </div>
        )}

        {/* TERMS PAGE */}
        {page === PageType.Terms && (
           <div className="animate-slide-up max-w-3xl">
              <div className="mb-12 flex items-center gap-4 text-brand-500">
                 <FileText className="w-8 h-8 md:w-12 md:h-12" />
                 <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter text-white uppercase">利用規約</h1>
              </div>

              <div className="space-y-10 text-sm leading-relaxed">
                 <p className="opacity-80">
                    本規約は「株式会社リバイラル」（以下「当社」）が提供するウェブサービスの利用条件を定めるものです。ユーザーは本規約に従ってサービスを利用するものとします。
                 </p>

                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">第1条（適用）</h3>
                    <p className="opacity-80">
                       本規約は、ユーザーと当社との間のすべての関係に適用されます。
                    </p>
                 </section>

                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">第2条（利用登録）</h3>
                    <p className="opacity-80">
                       登録希望者が当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
                    </p>
                 </section>

                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">第3条（利用料金）</h3>
                    <p className="opacity-80">
                       ユーザーは、当社が指定する方法により利用料金を支払う義務を負います。
                    </p>
                 </section>

                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">第4条（禁止事項）</h3>
                    <p className="opacity-80 mb-4">ユーザーは、以下の行為をしてはなりません。</p>
                    <ul className="opacity-80 list-disc list-inside space-y-2">
                       <li>法令または公序良俗に違反する行為</li>
                       <li>犯罪行為に関連する行為</li>
                       <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                       <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                       <li>他のユーザーに成りすます行為</li>
                       <li>反社会的勢力に対して直接または間接に利益を供与する行為</li>
                       <li>その他、当社が不適切と判断する行為</li>
                    </ul>
                 </section>

                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">第5条（サービス提供の停止）</h3>
                    <p className="opacity-80">
                       当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなくサービスの全部または一部の提供を停止または中断することができるものとします。
                    </p>
                 </section>

                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">第6条（免責事項）</h3>
                    <p className="opacity-80">
                       当社の債務不履行責任は、当社の故意または重過失によらない場合には免責されるものとします。
                    </p>
                 </section>

                 <section>
                    <h3 className="text-white font-bold mb-4 text-lg">第7条（準拠法・裁判管轄）</h3>
                    <p className="opacity-80">
                       本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社本店所在地を管轄する裁判所を専属的合意管轄とします。
                    </p>
                 </section>

                 <div className="pt-8 mt-8 border-t border-slate-800 text-xs text-slate-500">
                    <p>© 2026 Revirall Co., Ltd. All rights reserved.</p>
                 </div>
              </div>
           </div>
        )}

        {/* TOKUSHOHO PAGE */}
        {page === PageType.Tokushoho && (
           <div className="animate-slide-up max-w-3xl">
              <div className="mb-12 flex items-center gap-4 text-brand-500">
                 <FileText className="w-8 h-8 md:w-12 md:h-12" />
                 <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter text-white uppercase">特定商取引法に基づく表記</h1>
              </div>

              <div className="space-y-6 text-sm leading-relaxed">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-6">
                    <dt className="text-slate-500">販売業者</dt>
                    <dd className="md:col-span-2 text-white">株式会社リバイラル</dd>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-6">
                    <dt className="text-slate-500">運営統括責任者</dt>
                    <dd className="md:col-span-2 text-white">沼倉 隆平</dd>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-6">
                    <dt className="text-slate-500">所在地</dt>
                    <dd className="md:col-span-2 text-white">〒171-0022 東京都豊島区南池袋一丁目3番9号2F</dd>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-6">
                    <dt className="text-slate-500">電話番号</dt>
                    <dd className="md:col-span-2 text-white">03-6821-4341</dd>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-6">
                    <dt className="text-slate-500">商品代金以外の必要料金</dt>
                    <dd className="md:col-span-2 opacity-80">消費税、銀行振込手数料（銀行振込の場合）</dd>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-6">
                    <dt className="text-slate-500">お支払方法</dt>
                    <dd className="md:col-span-2 opacity-80">クレジットカード決済、銀行振込</dd>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-6">
                    <dt className="text-slate-500">お支払時期</dt>
                    <dd className="md:col-span-2 opacity-80">
                       クレジットカード：各カード会社の引き落とし日<br/>
                       銀行振込：お申し込みから7日以内
                    </dd>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-6">
                    <dt className="text-slate-500">商品の引渡時期</dt>
                    <dd className="md:col-span-2 opacity-80">決済完了後、直ちにご利用いただけます</dd>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-6">
                    <dt className="text-slate-500">返品・キャンセルについて</dt>
                    <dd className="md:col-span-2 opacity-80">
                       デジタルコンテンツの性質上、決済完了後の返品・キャンセルはお受けしておりません。ただし、商品に欠陥がある場合はこの限りではありません。
                    </dd>
                 </div>

                 <div className="pt-8 mt-8 border-t border-slate-800 text-xs text-slate-500">
                    <p>© 2026 Revirall Co., Ltd. All rights reserved.</p>
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};