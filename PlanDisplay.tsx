import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { 
  Sparkles, 
  Share2, 
  RotateCcw, 
  Lock, 
  Unlock, 
  Code, 
  PenTool, 
  Layers, 
  Cpu, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Flame, 
  ChevronDown, 
  Copy, 
  Check,
  ChevronUp,
  Brain,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { auth, db } from './firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

// Subcomponent to render Lucide Icons dynamically
function LucideIcon({ name, className, size = 20 }: { name: string; className?: string; size?: number }) {
  const Component = (Icons as any)[name] || Icons.Sparkles;
  return <Component className={className} size={size} />;
}

// Interfaces copied from main App.tsx to ensure perfect type integrity
interface SideHustle {
  id: string;
  title: string;
  category: string;
  difficulty: "مبتدئ" | "متوسط" | "محترف";
  timeRequired: string;
  potentialEarnings: string;
  description: string;
  bestFitReason: string;
  tools: { name: string; desc: string }[];
  steps: string[];
  gradient: string;
  iconName: string;
}

interface PlanDisplayProps {
  planId: string;
  onRestart: () => void;
  calculateHustles: (answers: Record<string, string>) => SideHustle[];
  QUESTIONS: Array<{
    id: string;
    title: string;
    options: { value: string; label: string; desc: string; icon: string }[];
  }>;
}

export default function PlanDisplay({ planId, onRestart, calculateHustles, QUESTIONS }: PlanDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generatedResults, setGeneratedResults] = useState<SideHustle[]>([]);
  const [copied, setCopied] = useState(false);
  const [expandedHustleId, setExpandedHustleId] = useState<string | null>(null);

  // Load the target plan from Firestore Database on mount / planId changed
  useEffect(() => {
    let active = true;

    async function loadPlan() {
      setLoading(true);
      setError(null);
      
      // If it's a base64 encoded client-side fallback link
      if (planId.startsWith("fb_")) {
        try {
          const rawBase64 = planId.substring(3).replace(/-/g, "+").replace(/_/g, "/");
          const decodedAnswers = JSON.parse(decodeURIComponent(escape(atob(rawBase64))));
          if (active) {
            setAnswers(decodedAnswers);
            const results = calculateHustles(decodedAnswers);
            setGeneratedResults(results);
            setPlanData({
              userId: null,
              answers: decodedAnswers,
              createdAt: null
            });
            setLoading(false);
          }
        } catch (err) {
          console.error("Failed decoding fallback base64 plan:", err);
          if (active) {
            setError("عذراً، لم نتمكن من فك ترميز رابط خطة العمل الاحتياطي هذا.");
            setLoading(false);
          }
        }
        return;
      }

      // Standard Firestore fetching
      try {
        const docRef = doc(db, "plans", planId);
        const docSnap = await getDocFromServer(docRef);
        
        if (!active) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.answers) {
            setAnswers(data.answers);
            const computed = calculateHustles(data.answers);
            setGeneratedResults(computed);
            setPlanData(data);
          } else {
            setError("الخطة المطلوبة موجودة ولكنها لا تحتوي على بيانات استبيان صحيحة.");
          }
        } else {
          setError("عذراً، لم يتم العثور على خطة العمل المطلوبة في قاعدة البيانات. قد يكون الرابط خاطئاً أو قد تم حذف المستند.");
        }
      } catch (err: any) {
        console.error("Error loading plan inside PlanDisplay:", err);
        if (active) {
          setError("حدث خطأ غير متوقع أثناء محاولة استعادة خطتك البرمجية من السيرفر.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPlan();
    return () => {
      active = false;
    };
  }, [planId, calculateHustles]);

  // Check if current user is the owner of the loaded plan
  const isOwner = useMemo(() => {
    if (!planData || !planData.userId) return false;
    const currentUser = auth.currentUser;
    return currentUser ? currentUser.uid === planData.userId : false;
  }, [planData, auth.currentUser]);

  // Tool specific external links to support SaaS integrations
  const getToolUrl = (name: string): string => {
    const trimmed = name.toLowerCase();
    if (trimmed.includes("chatgpt")) return "https://chat.openai.com";
    if (trimmed.includes("claude")) return "https://claude.ai";
    if (trimmed.includes("midjourney")) return "https://www.midjourney.com";
    if (trimmed.includes("leonardo")) return "https://leonardo.ai";
    if (trimmed.includes("elevenlabs")) return "https://elevenlabs.io";
    if (trimmed.includes("runway")) return "https://runwayml.com";
    if (trimmed.includes("heygen")) return "https://heygen.com";
    if (trimmed.includes("synthesia")) return "https://www.synthesia.io";
    if (trimmed.includes("capcut")) return "https://www.capcut.com";
    if (trimmed.includes("v0.dev") || trimmed.includes("v0")) return "https://v0.dev";
    if (trimmed.includes("bolt.new") || trimmed.includes("bolt")) return "https://bolt.new";
    if (trimmed.includes("lovable")) return "https://lovable.dev";
    if (trimmed.includes("bubble")) return "https://bubble.io";
    if (trimmed.includes("cursor")) return "https://www.cursor.com";
    if (trimmed.includes("windsurf")) return "https://codeium.com/windsurf";
    if (trimmed.includes("figma")) return "https://www.figma.com";
    if (trimmed.includes("make.com") || trimmed.includes("make")) return "https://www.make.com";
    if (trimmed.includes("zapier")) return "https://zapier.com";
    if (trimmed.includes("voiceflow")) return "https://www.voiceflow.com";
    if (trimmed.includes("chatbase")) return "https://www.chatbase.co";
    if (trimmed.includes("perplexity")) return "https://www.perplexity.ai";
    if (trimmed.includes("neuronwriter")) return "https://www.neuronwriter.com";
    if (trimmed.includes("surfer seo") || trimmed.includes("surfer")) return "https://surferseo.com";
    if (trimmed.includes("canva")) return "https://www.canva.com";
    return "https://google.com";
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/plan/${planId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-slate-100 max-w-lg mx-auto">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="mb-6"
        >
          <Icons.Loader2 className="w-12 h-12 text-cyan-400" />
        </motion.div>
        <h3 className="text-xl font-bold font-serif mb-2">جاري استيراد وتحليل خطتك الاستراتيجية...</h3>
        <p className="text-xs text-slate-400 font-sans tracking-wide">
          نقوم الآن بالاستعلام الآمن من Firestore وتحميل حزم التوصيات والارتباطات العصبية المعتمدة.
        </p>
      </div>
    );
  }

  if (error || !planData) {
    return (
      <div className="p-8 border border-red-500/30 bg-red-950/20 rounded-2xl text-center max-w-2xl mx-auto backdrop-blur-md">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-100 mb-3">عذراً، لم تكتمل العملية</h3>
        <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto mb-6">
          {error || "لم نتمكن من سحب المستند المطلوب من قاعدة بيانات السحابة المعتمدة."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onRestart}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 rounded-xl font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ابدأ استبيان جديد مجاناً // START NEW</span>
          </button>
        </div>
      </div>
    );
  }

  // Map answers to localized question labels for dynamic report summaries
  const answersSummary = QUESTIONS.map(q => {
    const val = answers[q.id];
    const option = q.options.find(o => o.value === val);
    return {
      title: q.title,
      answerLabel: option ? option.label : val || "غير محدد"
    };
  }).filter(item => item.answerLabel !== "غير محدد");

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full text-right"
    >
      {/* 1. Dynamic Public Read & Write Ownership Bar */}
      <div className="p-5 border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-slate-900 to-cyan-950/30 mb-8 rounded-2xl backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
        
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-2">
            {isOwner ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold">
                <Unlock className="w-3 h-3" />
                أنت صاحب المستند // OWNER VIEW
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold">
                <Lock className="w-3 h-3" />
                للمشاهدة العامة // PUBLIC READ
              </span>
            )}
            <span className="text-zinc-500 text-xs font-mono">HASH: {planId.substring(0, 10)}...</span>
          </div>
          <h4 className="text-lg font-bold text-slate-100 mb-1 font-serif">
            {isOwner ? "أهلاً بك في لوحة تحكم خطة عملك السحابية المخصصة!" : "أنت تستعرض ملف أعمال مخصص تمت مشاركته!"}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed font-light font-sans max-w-2xl">
            {isOwner 
              ? "هذه نتائجك تم حفظها تلقائياً على خوادم قاعدة بيانات Firestore الآمنة. يمكنك الرجوع إليها ومشاركتها في أي وقت بنسخ الرابط الموثق." 
              : "تم حساب واقتراح هذه الفرص وأفكار العمل الذاتي المخصصة بناءً على مدخلات وإجابات واهتمامات أحد المبدعين المطورين."
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10">
          {/* Share Button */}
          <button
            onClick={handleCopyLink}
            className="px-5 py-2.5 border border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/10 hover:bg-cyan-900/30 text-cyan-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? "تم نسخ الرابط! // COPIED" : "نسخ رابط المشاركة // SHARE"}</span>
          </button>

          {/* New Plan CTA */}
          <button
            onClick={onRestart}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>تصميم خطة عمل جديدة // NEW ROADMAP</span>
          </button>
        </div>
      </div>

      {/* 2. Headline Title banner */}
      <div className="text-center mb-12 relative py-4">
        <div className="inline-block px-4 py-1.5 border border-cyan-500/20 bg-cyan-950/10 rounded-full text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">
          [ DEEP LINK RECONSTRUCTION COMPLETE ]
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-200 to-purple-400 leading-tight font-serif">
          خطة العمل والربط الذاتي الذكية المعتمدة
        </h2>
        <p className="text-sm text-slate-400 mt-3 max-w-xl mx-auto font-sans leading-relaxed">
          فرص الدخل الجانبي والأدوات البرمجية للذكاء الاصطناعي الأنسب لملفك التقني والشغفي بناءً على السمات الإستراتيجية.
        </p>
      </div>

      {/* 3. Answers Summary Collapse / Drawer Panel */}
      <div className="mb-12 border border-slate-900 bg-slate-950/60 p-6 rounded-2xl">
        <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2 font-serif">
          <Icons.FileText className="w-5 h-5 text-indigo-400" />
          <span>ملخص المعالم والردود الشغفية التي بنيت عليها الخطة:</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {answersSummary.map((item, idx) => (
            <div key={idx} className="p-3.5 border border-zinc-900/50 bg-zinc-950/50 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xs text-indigo-400 shrink-0 font-mono">
                {(idx + 1).toString().padStart(2, '0')}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 leading-none mb-1 font-sans">{item.title}</p>
                <p className="text-xs font-semibold text-slate-200 font-sans">{item.answerLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recommend side hustles maps */}
      <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-6 font-serif border-r-4 border-cyan-500 pr-3">
        أفكار ومسارات الدخل الجانبي المقترحة (أعلى 5 مطابقات):
      </h3>

      <div className="space-y-6">
        {generatedResults.map((hustle, idx) => {
          const isExpanded = expandedHustleId === hustle.id;
          return (
            <div
              key={hustle.id}
              className="border border-zinc-900 bg-zinc-950/40 rounded-2xl overflow-hidden hover:border-indigo-500/20 transition-all duration-300"
            >
              {/* Header card info */}
              <div 
                onClick={() => setExpandedHustleId(isExpanded ? null : hustle.id)}
                className="p-6 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none hover:bg-slate-950/35 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Circle number */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${hustle.gradient} flex items-center justify-center text-slate-950 font-extrabold text-lg select-none shrink-0 font-mono`}>
                    {(idx + 1).toString().padStart(2, '0')}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono tracking-wide px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-full font-bold">
                        {hustle.category}
                      </span>
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-slate-900 border ${
                        hustle.difficulty === 'مبتدئ' ? 'text-emerald-400 border-emerald-950/40' :
                        hustle.difficulty === 'متوسط' ? 'text-indigo-400 border-indigo-950/40' : 'text-fuchsia-400 border-fuchsia-950/40'
                      }`}>
                        صعوبة: {hustle.difficulty}
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-black text-slate-100 font-serif hover:text-cyan-300 transition-colors">
                      {hustle.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t border-slate-900 md:border-none">
                  {/* Earnings */}
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <DollarSign size={16} />
                    <div>
                      <span className="text-[9px] text-slate-500 block leading-none">العائد المتوقع</span>
                      <span className="text-xs sm:text-sm font-bold font-mono">{hustle.potentialEarnings}</span>
                    </div>
                  </div>

                  {/* Time required */}
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <Clock size={16} />
                    <div>
                      <span className="text-[9px] text-slate-500 block leading-none">تخصيص الوقت</span>
                      <span className="text-xs sm:text-sm font-bold font-sans">{hustle.timeRequired}</span>
                    </div>
                  </div>

                  {/* Expand dynamic Trigger */}
                  <div className="mr-auto">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-indigo-400 animate-bounce" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expansion block */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-6 pb-6 pt-2 border-t border-zinc-900 bg-slate-950/50"
                >
                  <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">
                    {hustle.description}
                  </p>

                  {/* Why this matches you */}
                  <div className="mb-6 p-4 rounded-xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 to-indigo-950/20">
                    <h5 className="text-xs font-bold font-mono text-indigo-400 mb-1.5 uppercase tracking-wide">
                      // لماذا يناسبك هذا التخصص؟:
                    </h5>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {hustle.bestFitReason || "مطابقة ممتازة بناءً على اهتمامات العمل الإبداعي والموارد الزمنية."}
                    </p>
                  </div>

                  {/* AI Tools suggested with direct absolute links */}
                  <div className="mb-6">
                    <h5 className="text-sm font-bold text-slate-200 mb-3 font-serif">
                      أدوات الذكاء الاصطناعي المقترحة للتنفيذ:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {hustle.tools.map((tool, tIdx) => (
                        <a 
                          key={tIdx}
                          href={getToolUrl(tool.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3.5 border border-zinc-900/40 bg-zinc-950/80 rounded-xl hover:border-cyan-500/30 hover:bg-slate-900/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                        >
                          <Zap className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-125 transition-transform" />
                          <div>
                            <span className="text-xs font-bold text-slate-150 block mb-0.5 group-hover:text-cyan-400 transition-colors">
                              {tool.name}
                            </span>
                            <span className="text-[10px] text-slate-400 leading-relaxed font-light block">
                              {tool.desc}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* 3 Step dynamic action Roadmap */}
                  <div>
                    <h5 className="text-sm font-bold text-slate-200 mb-3 font-serif">
                      خطة تنفيذ من 3 خطوات للبدء الفوري:
                    </h5>
                    <div className="space-y-4">
                      {hustle.steps.map((step, sIdx) => (
                        <div key={sIdx} className="p-4 border border-zinc-900/50 bg-stone-950/30 rounded-xl flex gap-4">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-cyan-400">
                            0{sIdx + 1}
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-mono mb-1">
                              {sIdx === 0 ? "الخطوة الأولى // الإطلاق" : sIdx === 1 ? "الخطوة الثانية // التطوير" : "الخطوة الثالثة // التواصل والربح"}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">{step}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
