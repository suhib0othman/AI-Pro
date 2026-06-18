import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { 
  Sparkles, 
  RotateCcw, 
  ArrowRight, 
  TrendingUp, 
  ArrowLeft, 
  Layers, 
  Wrench, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Share2, 
  HelpCircle, 
  Brain 
} from 'lucide-react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  serverTimestamp, 
  getDocFromServer 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import PlanDisplay from './PlanDisplay';

// Custom component to safely render Lucide Icons dynamically
function LucideIcon({ name, className, size = 20 }: { name: string; className?: string; size?: number }) {
  const Component = (Icons as any)[name] || Icons.Sparkles;
  return <Component className={className} size={size} />;
}

// Side Hustle Type Definition
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
  score?: number;
}

// Static definition of Side Hustles for calculation
const HUSTLE_TEMPLATES: Omit<SideHustle, 'bestFitReason'>[] = [
  {
    id: "content-agency",
    title: "صناعة المحتوى المرئي السريع بالذكاء الاصطناعي",
    category: "إنشاء المحتوى والتسويق",
    difficulty: "مبتدئ",
    timeRequired: "5-10 ساعات/أسبوع",
    potentialEarnings: "500$ - 2,500$ / شهرياً",
    description: "إنشاء وإدارة حسابات تسويقية وقنوات محتوى قصير (Shorts, Reels, TikTok) للشركات والأفراد المستقلين من خلال صياغة سيناريوهات وتوليد فيديوهات وصوت واقعي بالكامل عبر الذكاء الاصطناعي.",
    tools: [
      { name: "ChatGPT / Claude", desc: "لكتابة الأفكار والسيناريوهات التسويقية الجذابة." },
      { name: "Midjourney / Leonardo AI", desc: "لتصميم الصور والخلفيات البصرية المذهلة." },
      { name: "ElevenLabs", desc: "لتوليد تعليق صوتي واقعي بالكامل بمختلف اللهجات العربيّة والأجنبية." },
      { name: "Runway / HeyGen", desc: "لتحويل الصور إلى فيديوهات متحركة أو دمج مذيع افتراضي تفاعلي." },
      { name: "CapCut", desc: "للمونتاج النهائي وتأثيرات الكتابة التلقائية الذكية." }
    ],
    steps: [
      "اختر نيتش (Niche) أو تخصصاً مطلوباً مثل (تطوير الذات، الثقافة المالية، تبسيط الكتب، أو ريادة الأعمال).",
      "استخدم روبوت الكتابة لصياغة 10 سيناريوهات جاهزة، ثم قم بتوليد المؤثرات الصوتية والمرئية المناسبة لها.",
      "انشر الفيديوهات بانتظام، ثم اعرض خدمات صناعة الفيديوهات على أصحاب المتاجر والمشاريع الصغيرة كعقد شهري مريح."
    ],
    gradient: "from-cyan-500 to-indigo-600",
    iconName: "Video"
  },
  {
    id: "nocode-developer",
    title: "تطوير التطبيقات والمواقع التقنية بدون كود",
    category: "الخدمات التقنية وتطوير المواقع",
    difficulty: "متوسط",
    timeRequired: "10-15 ساعة/أسبوع",
    potentialEarnings: "1,200$ - 4,500$ / شهرياً",
    description: "بناء مواقع احترافية ونماذج أولية لتطبيقات الجوال والويب للشركات الناشئة وأصحاب الأفكار الاستثمارية دون كتابة سطر كود واحد، معتمداً على مولدات الواجهات والمنصات الذكية الحديثة.",
    tools: [
      { name: "v0.dev / Bolt.new", desc: "لتوليد واجهات المستخدم وتعديل الأكواد برمجياً بلغة طبيعية فورية." },
      { name: "Lovable.dev / Bubble", desc: "لتصميم وبناء تطبيقات ويب متكاملة بقواعد بيانات رصينة وسريعة." },
      { name: "Cursor / Windsurf", desc: "محرر أكواد ذكي لبرمجة إضافات وحلول تقنية مخصصة بمساعدة الذكاء الاصطناعي." },
      { name: "Figma (AI Features)", desc: "لتوليد النماذج والمخططات الأولية للواجهات بضغطة زر مع الحفاظ على الأبعاد." }
    ],
    steps: [
      "تعلم أساسيات التعامل مع أدوات مثل Lovable أو v0 لبناء صفحات هبوط وتطبيقات تفاعلية بسيطة.",
      "اعرض خدماتك على منصات العمل الحر مثل خمسات أو مستقل أو Upwork لتقديم نماذج أولية (MVP).",
      "استخدم الذكاء الاصطناعي لحل المشكلات التقنية وتعديل الأخطاء بسرعة لإمضاء وتسليم المشاريع بكفاءة خارقة."
    ],
    gradient: "from-fuchsia-500 to-cyan-600",
    iconName: "Code"
  },
  {
    id: "ai-automation",
    title: "وكالة أتمتة العمليات والربط الذكي للشركات (AAA)",
    category: "إدارة الأعمال والالحلول السحابية",
    difficulty: "محترف",
    timeRequired: "12-18 ساعة/أسبوع",
    potentialEarnings: "2,000$ - 6,000$ / شهرياً",
    description: "بناء وربط أنظمة اتصالات ذكية بين برامج الشركات المختلفة (مثل إدارة علاقات العملاء، المبيعات والبريد الكتروني) آلياً بمساعدة الذكاء الاصطناعي لتوفير مئات ساعات العمل للمؤسسات.",
    tools: [
      { name: "Make.com / Zapier", desc: "لربط التطبيقات المختلفة وبناء مسارات عمل آلية ومتشعبة للبيانات." },
      { name: "Voiceflow / Chatbase", desc: "لتطوير مساعدين أذكياء ومجيبين آليين يجيبون عن استفسارات المنتجات بكفاءة." },
      { name: "Claude API / OpenAI API", desc: "لمعالجة النصوص والبيانات الضخمة وفلترتها آلياً بأعلى دقة لغوية." }
    ],
    steps: [
      "ابحث عن المهام المتكررة في الشركات المحلية (مثل الرد على الطلبات، جدولة المواعيد، أو أرشفة الفواتير).",
      "قم بتصميم نموذج ربط ذكي يعمل تلقائياً عند وصول بريد إلكتروني أو رسالة واتساب جديدة لتأكيد الطلبات.",
      "قدم عرضاً للشركات لتخفيض تكاليف خدمة العملاء بنسبة 70% مقابل اشتراك شهري مستمر للنظام المصمم وصيانته."
    ],
    gradient: "from-fuchsia-600 to-purple-800",
    iconName: "Cpu"
  },
  {
    id: "ai-seo",
    title: "مستشار تهيئة محركات البحث وصناعة المقالات الذكية",
    category: "التسويق الرقمي وإدارة المحتوى",
    difficulty: "مبتدئ",
    timeRequired: "4-8 ساعات/أسبوع",
    potentialEarnings: "400$ - 1,800$ / شهرياً",
    description: "إعداد وتحسين مقالات المواقع والمدونات الإلكترونية لتتصدر محركات البحث قوقل، وتوليد مئات الكلمات المفتاحية في ثوانٍ باستخدام خوارزميات الذكاء الاصطناعي لزيادة عدد الزوار.",
    tools: [
      { name: "Perplexity AI", desc: "لإجراء بحوث دقيقة وشاملة حول المقال والكلمات المفتاحية الأكثر ربحية للنشاط." },
      { name: "NeuronWriter / Surfer SEO", desc: "لحساب النسبة المثالية للكلمات وتحسين بنية المقال للمنافسة وتخطّي المنافسين." },
      { name: "Claude (Sonnet)", desc: "لصياغة مقالات بجودة بشرية فائقة وخالية تماماً من الركود أو الرداءة اللغوية." }
    ],
    steps: [
      "حدد الكلمات المفتاحية ذات صعوبة منخفضة وبحث عالٍ باستخدام أدوات تحليل الـ SEO الذكية.",
      "اكتب مقالاً متكامل البنية ومحسّنًا تماماً لخوارزميات قوقل باستخدام مستند الكتابة الموجه بالذكاء الاصطناعي.",
      "راسل أصحاب المدونات الكبيرة وصناع المحتوى وعرّف عن تقديم خدمات كتابة مدعومة بالـ SEO مخصصة للنشر السريع."
    ],
    gradient: "from-sky-400 to-blue-600",
    iconName: "TrendingUp"
  },
  {
    id: "ai-branding",
    title: "مصمم هويات بصرية وإنتاج العلامات التجارية المتكاملة",
    category: "التصميم الرقمي والـ UX",
    difficulty: "مبتدئ",
    timeRequired: "5-12 ساعة/أسبوع",
    potentialEarnings: "600$ - 3,000$ / شهرياً",
    description: "تطوير وتصميم هويات بصرية فائقة الإتقان (شعارات، بطاقات أعمال، صور منتجات ثلاثية الأبعاد) باستخدام الذكاء الاصطناعي التوليدي، مع تعديلات واحترافية ممتازة للعملاء الجدد.",
    tools: [
      { name: "Midjourney (v6)", desc: "لتوليد شعارات وتصاميم ومنتجات عالية الدقة وغير مكررة أبداً بناءً على وصف نصي مكثف." },
      { name: "Canva Magic Studio", desc: "لدمج النصوص والتعديل الفوري وترتيب عناصر الهوية لتبدو متجانسة كلياً." },
      { name: "Magnific AI", desc: "لرفع جودة ودقة تفاصيل الصور والتصاميم إلى مستويات سينمائية مذهلة وبكسلة عالية." },
      { name: "Adobe Photoshop (AI Firefly)", desc: "لتعديل أجزاء الصورة، وتوسيع الأطراف، وإزالة العناصر غير المرغوبة باحترافية." }
    ],
    steps: [
      "اصنع معرض أعمال (Portfolio) مذهلاً بأسماء ماركات وهمية تم توليدها وتصميم هويتها بالذكاء الاصطناعي بالكامل.",
      "انشر أعمالك في منصات المصممين (Behance) ومجموعات رواد الأعمال والمشاريع على لينكد إن فيسبوك وتويتر.",
      "قدم باقات تجارية شاملة تشمل (شعار، ألوان الهوية، خطوط، تصاميم منشورات السوشيال ميديا، تصميم غلاف المنتجات)."
    ],
    gradient: "from-fuchsia-500 to-pink-600",
    iconName: "PenTool"
  },
  {
    id: "ai-copywriter",
    title: "مستشار صياغة الكلمات الإعلانية وصفحات البيع",
    category: "إنشاء المحتوى والتسويق",
    difficulty: "مبتدئ",
    timeRequired: "4-10 ساعات/أسبوع",
    potentialEarnings: "500$ - 2,000$ / شهرياً",
    description: "كتابة نصوص البريد التسويقي، وإعلانات فيسبوك وتيك توك، ونصوص صفحات الهبوط التي تقنع العميل بالشراء، اعتماداً على نماذج لغوية ذكّية دربت خصيصاً على سيكولوجيا المستهلك ومحاكاة الرغبة.",
    tools: [
      { name: "Copy.ai / Jasper", desc: "لتحليل المتاجر وكتابة مئات الزوايا الإعلانية بضربة زر ونماذج ترويجية ذكية." },
      { name: "ChatGPT", desc: "لتعديل نبرة الصوت وتحسين جودة العرض التسويقي ليتطابق لغوياً مع الثقافة العربية وسياق الجمهور." },
      { name: "Headline Analyzer", desc: "لفحص مدى قوة العناوين الإعلانية وجاذبيتها وقدرتها على لفت الانتباه الفوري." }
    ],
    steps: [
      "ادرس سيكولوجية العروض الناجحة وهياكل الإعلانات الشهيرة (مثل صيغ التسويق AIDA أو PAS).",
      "حلل العيوب التقييمية لمنتجات المنافسين في المتاجر الكبرى لإنشاء زوايا تسويقية تفوقهم وتنقذ المبيعات.",
      "راسل المتاجر الإلكترونية النشطة لتقديم تحسينات مجانية على صفحات منتجاتهم الضعيفة مقابل نسبة من زيادة الأرباح المتوقعة."
    ],
    gradient: "from-pink-500 to-rose-600",
    iconName: "Lightbulb"
  },
  {
    id: "ai-educator",
    title: "صناعة الدورات والكتب التعليمية بالذكاء الاصطناعي",
    category: "التعليم الرقمي والتدريب",
    difficulty: "مبتدئ",
    timeRequired: "6-12 ساعة/أسبوع",
    potentialEarnings: "800$ - 3,500$ / شهرياً",
    description: "إنشاء كتب إلكترونية تعليمية، مناهج دراسية، وعروض مرئية متكاملة لبيعها للجمهور المهتم عبر منصات النشر الرقمية الذاتية بمساعدة تقنيات جمع وتلخيص وعرض المعلومات آلياً بصورة ممتازة وسريعة.",
    tools: [
      { name: "Gamma App", desc: "لتوليد صفحات الويب التفاعلية والعروض التقديمية الاحترافية والكتب الرقمية في دقائق معدودة." },
      { name: "HeyGen / Synthesia", desc: "لإنشاء فيديوهات تدريبية بالذكاء الاصطناعي بمذيع رقمي يتحدث بطلاقة ونبرة طبيعية مجدية." },
      { name: "ChatGPT (Advanced Voice)", desc: "لتنظيم مخطط المنهج الدراسي وصياغة الشروحات التفصيلية والتمارين المقترحة." }
    ],
    steps: [
      "اختر موضوعاً تمتلك فيه شغفاً أو معرفة أو عليه طلب كبير وعالي (مثال: استخدام ذكاء اصطناعي، برمجة للمبتدئين، التسويق الشخصي).",
      "استخدم الأدوات الذكية لتجهيز مخطط الدورة وتوليد السلايدات وعروض الشرح في يوم واحد مع المراجعة اللغوية والتدقيق.",
      "انشر دورتك على منصات مثل Udemy أو قم بنشرها ككتاب رقمي PDF متناسق على Gumroad وتعرّف بجمهورك بمهارتك لتسويقها."
    ],
    gradient: "from-cyan-500 to-purple-600",
    iconName: "Layers"
  },
  {
    id: "chatbot-expert",
    title: "مطور ومثبّت روبوتات الدردشة الذكية للمتاجر",
    category: "الخدمات التقنية وتطوير المواقع",
    difficulty: "متوسط",
    timeRequired: "8-14 ساعة/أسبوع",
    potentialEarnings: "1,000$ - 4,000$ / شهرياً",
    description: "بناء روبوتات ذكية وتثبيتها على أنظمة خدمة عملاء المتاجر الإلكترونية ومواقع الشركات لتقوم بالرد الفوري التفاعلي على طلبات الأسعار والمنتجات بشكل مخصص بالكامل وبدون تدخل بشري.",
    tools: [
      { name: "Voiceflow / Chatbase", desc: "لتدريب روبوت الدردشة على ملفات الشركة والمنتجات والأسعار وتفاعله المباشر باللغة الطبيعية." },
      { name: "Zapier", desc: "لربط محادثات العميل بحالة طلباتهم في متجر شوبيفاي أو ووردبريس تلقائياً لاسترجاع حالة الشحن." },
      { name: "ManyChat", desc: "لإدارة الردود التلقائية والذكية المباشرة في منصات انستغرام وفيسبوك وواتساب لتلقي العروض وسرعة البيع." }
    ],
    steps: [
      "قم ببناء روبوت دردشة تجريبي مجاني مخصص لمتجر افتراضي واختبر دقته في الإجابة وحل مشكلات العملاء الشائعة.",
      "راسل أصحاب المتاجر الإلكترونية على تيك توك وإنستغرام الذين يعانون من تكدس رسائل الاستفسارات وبطء استجابة الرد.",
      "اعرض عليهم تجربة الروبوت لمدة أسبوع مجاناً، ثم اتفق على قيمة تشغيل وتثبيت شهرية أو سنوية ثابتة للرعاية التقنية."
    ],
    gradient: "from-sky-500 to-indigo-700",
    iconName: "Wrench"
  },
  {
    id: "ai-audio-transcriber",
    title: "خدمات الترجمة والتعليق الصوتي متعدد اللغات بالذكاء الاصطناعي",
    category: "الترجمة وصناعة الصوتيات",
    difficulty: "مبتدئ",
    timeRequired: "3-7 ساعات/أسبوع",
    potentialEarnings: "300$ - 1,500$ / شهرياً",
    description: "تفريغ وترجمة وتوليد دبلجة صوتية واقعية لمقاطع الفيديو، المدونات الصوتية، والأفلام الترويجية للشركات الراغبة في التوسع بأسواق عالمية وجذابة دون توظيف معلقين باهظي الثمن.",
    tools: [
      { name: "Whisper (OpenAI)", desc: "لتفريغ أي مقطع صوتي بدقة هائلة وسرعة خاطفة وبمختلف لهجات العالم المتاحة." },
      { name: "ElevenLabs Dubbing", desc: "لدبلجة الصوت وترجمته للغات متعددة مع الحفاظ على بصمة الصوت الأصلية وطاقة نبرة المتحدث الرئيسي." },
      { name: "DeepL Translate", desc: "لترجمة النصوص والمصطلحات القانونية والتجارية بأعلى دقة بديلة تضمن دقة المعنى وسياق الجمل." }
    ],
    steps: [
      "اعرض خدماتك كمتخصص في تفريغ الفيديوهات الطويلة للمؤتمرات أو البودكاست وتحويلها لنصوص مكتوبة قابلة للقراءة والبحث.",
      "اعرض خدمات دبلجة وتوطين المحتوى التسويقي والإعلاني الأجنبي للمصانع والشركات التي تود استهداف السوق العربي المحلي.",
      "سلّم الملفات بدقة عالية جداً وسرعة قياسية بفضل الأتمتة المتقدمة وحلول التدقيق المباشر للذكاء الاصطناعي."
    ],
    gradient: "from-violet-600 to-indigo-600",
    iconName: "Brain"
  },
  {
    id: "ai-childrens-books",
    title: "تأليف ونشر كتب وروايات الأطفال المرسومة بالذكاء الاصطناعي",
    category: "إنشاء المحتوى والتسويق",
    difficulty: "متوسط",
    timeRequired: "6-10 ساعات/أسبوع",
    potentialEarnings: "400$ - 3,000$ / شهرياً",
    description: "ابتكار قصص شيقة ملهمة للأطفال الصغار، وتصميم لوحات فنية متناسقة ومبهرة لكل صفحة عبر الخوارزميات الفنية، ومن ثم دمجها ونشرها رقمياً على متجر أمازون كيندل ومكتبات النشر العالمية.",
    tools: [
      { name: "Claude (Sonnet)", desc: "لكتابة قصص الأطفال بقيم تربوية جذابة وبأسلوب بسيط وسلس تفاعلي جذاب." },
      { name: "Midjourney", desc: "لتحسين ثبات الأشكال وإنشاء أساسيات شخصيات كرتونية وتكرارها بذات المظهر في جميع الصفحات." },
      { name: "Canva Pro", desc: "لترتيب النصوص والرسومات وتجهيز ملف الطباعة المتكامل بالتناغم مع أبعاد أمازون للطباعة الذاتية." }
    ],
    steps: [
      "قم بتأليف فكرة قصة تربوية قصيرة وبسيطة (مثلاً: أرنب صغير يتعلم كيفية الادخار ومشاركة ألعابه مع الآخرين).",
      "صمّم الشخصية الرئيسية في Midjourney وضمن ظهورها في لقطات متنوعة تفاعلية مع الحفاظ التام على سمات الوجه والألوان.",
      "جمّع صفحات الكتاب بالتفصيل في منصة كانفا ثم انشره على KDP Amazon ليتم طباعته وإيصاله للعميل تلقائياً بآلية الطباعة عند الطلب."
    ],
    gradient: "from-cyan-400 to-fuchsia-600",
    iconName: "Brain"
  }
];

// Interactive 10 Questions Array
interface Question {
  id: string;
  title: string;
  subtitle: string;
  options: { value: string; label: string; desc: string; icon: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: "field",
    title: "ما هو مجال خبرتك أو شغفك الأساسي؟",
    subtitle: "اختر المجال الأقرب لاهتماماتك لنقوم بتوجيه مسارك بدقة وعقلانية.",
    options: [
      { value: "tech", label: "التقنية والتعليم التقني", desc: "الأكود، الويب والبرمجيات، قواعد البيانات، والفضول الكبير لحل المشاكل التقنية.", icon: "Code" },
      { value: "writing", label: "الكتابة والترجمة وصناعة المحتوى", desc: "صياغة الأفكار والمقالات، صياغة الإعلانات، القصص الخيالية، والبحث العلمي اللغوي.", icon: "PenTool" },
      { value: "design", label: "التصميم وتنسيق الفنون الرقمية", desc: "تصميم الشعارات، تنسيق الألوان، تحرير ومونتاج الفيديوهات، وبناء الهويات المرئية.", icon: "Layers" },
      { value: "management", label: "التنظيم وإدارة مهام الأعمال والمبيعات", desc: "جدولة المشاريع، المراسلات، تحسين تواصل الشركات وخدمة العملاء الراقية.", icon: "Cpu" },
      { value: "marketing", label: "التسويق وجلب المبيعات وإشهار العلامات", desc: "الترويج، سيكولوجيا المشترين، إدارة صفحات السوشيال ميديا وجذب انتباه الجمهور.", icon: "TrendingUp" }
    ]
  },
  {
    id: "time",
    title: "ما هو مقدار الوقت الذي يمكنك تخصيصه أسبوعياً؟",
    subtitle: "تحديد الوقت يساعدنا على اقتراح فكرة تلائم جدول مهامك الحالي بدقة.",
    options: [
      { value: "under5", label: "أقل من 5 ساعات (مرن جداً)", desc: "عمل بسيط يعتمد بشكل جوهري على الأدوات المؤتمتة بالكامل لإنهاء العمل والمهام بسرعة.", icon: "Clock" },
      { value: "5to15", label: "من 5 إلى 15 ساعة أسبوعياً (متوازن)", desc: "خيار رائع يوازن بين بناء المهارات وتقديم خدمات لعملائك دون إخلال بالتزاماتك.", icon: "Clock" },
      { value: "above15", label: "أكثر من 15 ساعة أسبوعياً (تركيز قوي)", desc: "تفرغ جزئي متكامل يضمن تقدم المشاريع والمهام الكبرى لمرونة أرباح وسرعة نمو وافرة.", icon: "Clock" }
    ]
  },
  {
    id: "capital",
    title: "هل لديك رأس مال متاح للبدء والاستثمار الآن؟",
    subtitle: "بعض نماذج العمل تتطلب ميزانيات بسيطة للاشتراكات، وبعضها يعمل بميزانية صفرية تماماً.",
    options: [
      { value: "none", label: "لا، أرغب بالانطلاق بميزانية صفرية", desc: "التركيز المطلق على الأدوات الخدمية المجانية والتطبيقات ذات الفترات التجريبية.", icon: "DollarSign" },
      { value: "low", label: "ميزانية بسيطة للغاية (أقل من 50$ شهرياً)", desc: "كافية للاشتراك في أداة توليد صور ذكية رائدة أو تفعيل أداة أتمتة مهام أساسية.", icon: "DollarSign" },
      { value: "medium", label: "ميزانية متوسطة (أكثر من 50$ شهرياً)", desc: "تمكنك من اقتناء خطط تشغيل ذكية ورفع كفاءة وموثوقية الإنتاج للعملاء من البداية.", icon: "DollarSign" }
    ]
  },
  {
    id: "language",
    title: "ما هي اللغة الأساسية التي تفضل العمل والتواصل بها؟",
    subtitle: "أدوات الذكاء الاصطناعي ممتازة بكافة اللغات، لكننا نقيس توجه الجمهور المستهدف لك.",
    options: [
      { value: "arabic", label: "اللغة العربية الفصحى والمحلية", desc: "استهداف المتاجر والشركات المحلية والشرق الأوسط لتوفير متطلباتهم المحلية.", icon: "HelpCircle" },
      { value: "english", label: "اللغة الإنجليزية بشكل أساسي", desc: "استقبال طلبات من شركات أجنبية وعمل حر دولي في مجالات واسعة ومربحة.", icon: "HelpCircle" },
      { value: "both", label: "العربية والإنجليزية بالتساوي", desc: "مرونة كاملة في تقديم الهويات الثنائية ومضاعفة فرص جلب العقود المتنوعة.", icon: "Sparkles" }
    ]
  },
  {
    id: "style",
    title: "أي أساليب وطرق العمل تفضل أكثر؟",
    subtitle: "سواء كنت تفضل الاعتماد على نفسك كلياً أو العمل التعاوني المشترك.",
    options: [
      { value: "solo", label: "مستقل بمفرادي (Solo Freelancer)", desc: "إشراف كامل على كل التفاصيل والاعتماد المطلق على مجهودك وأسلوبك الشخصي.", icon: "Brain" },
      { value: "team", label: "بناء شراكات وأقران ضمن فريق متناغم", desc: "التحالف مع مقربين يشاركونك المجهود وتقديم رزمة خدمات ضخمة ومتكاملة للشركات.", icon: "Users" },
      { value: "any", label: "لا يهم، أنا مرن ومنفتح مع الخيارين", desc: "التكيف التام لتسليم المشاريع بالنهج الأكثر ربحية وملاءمة لطبيعة الطلب.", icon: "Sparkles" }
    ]
  },
  {
    id: "aiSkill",
    title: "ما هو مستوى مهارتك وإلمامك الحالي بالذكاء الاصطناعي؟",
    subtitle: "هذا يحدد مستوى عمق وصعوبة الأدوات التي سنقترحها لك لبدء واثق وممتع.",
    options: [
      { value: "beginner", label: "مبتدئ / أعرف روبوتات الدردشة العامة فقط", desc: "استخدام واجهات دردشة بسيطة لتوليد نصوص والحديث اليومي كبداية سهلة ومعقولة.", icon: "Brain" },
      { value: "intermediate", label: "متوسط / جربت صياغة الأوامر وفصل المخرجات", desc: "معرفة بخصائص هندسة الأوامر (Prompting) المتقدمة وبرمجيات الصوت والصورة التوليدية.", icon: "Brain" },
      { value: "expert", label: "محترف / قمت بربط الأكواد والـ APIs سابقاً", desc: "فهم عميق بآليات ضبط النماذج والأتمتة التفاعلية الذكية وبناء مسارات الـ workflows.", icon: "Cpu" }
    ]
  },
  {
    id: "goal",
    title: "ما هو المحرك والدافع الأقوى الذي يهمك في هذا العمل؟",
    subtitle: "تحديد الغاية يسلط الضوء على الفرص الأنسب لراحتك وطبيعة أهدافك الفردية.",
    options: [
      { value: "quickMoney", label: "تحقيق عائد وربح مالي سريع ومباشر", desc: "أعمال خدمية سريعة التسليم والدفع لتعويض استثمار وقتك بأسرع فترة ممكنة.", icon: "TrendingUp" },
      { value: "brand", label: "تأسيس علامة تجارية ودخل سلبي طويل المدى", desc: "بناء أصول ورقية، فكرية أو محتوى مكرر ينمو برتم هادئ ويدر دخلاً ثابتاً مستقبلاً.", icon: "Layers" },
      { value: "learning", label: "اكتساب خبرة قوية ومهارة حصرية للمستقبل", desc: "مواكبة طفرة السوق واكتساب أعمق الخبرات التقنية ببرامج المستقبل المطلوبة لعام 2026.", icon: "Lightbulb" }
    ]
  },
  {
    id: "activity",
    title: "أيهما تشعر أنه يفجر حماسك وطاقتك أثناء العمل؟",
    subtitle: "رؤية الفن والجمال أو حب المنطق وتسلسل المشاكل التقنية وتصميم الهياكل.",
    options: [
      { value: "creative", label: "الأنشطة الإبداعية الفنية والجمالية", desc: "الرسم الرقمي، كتابة النصوص وسيناريوهات الفيديوهات، واختيار المؤثرات البصرية الرائعة.", icon: "PenTool" },
      { value: "technical", label: "الأنشطة المنطقية والتحليل ومراجعة العلاقات الكودية", desc: "حل العقد التقنية، الربط البرمجي، دمج الأنظمة الهيكلية، تتبع الفواتير والملفات والذكاء البرمجي.", icon: "Wrench" },
      { value: "hybrid", label: "مزيج يربط الفن بالصلابة المنطقية معاً", desc: "قدرة تشغيل مرنة تأخذ من الفن الجمالية والتأثير، ومن البرمجة الأتمتة والترتيب السليم.", icon: "Sparkles" }
    ]
  },
  {
    id: "socialMedia",
    title: "ما هو مستوى إتقانك ومعرفتك بمنصات السوشيال ميديا؟",
    subtitle: "سيحدد ذلك مدى ملائمة العمل الذي يحتاج لإبراز خدماتك والتواصل المستمر.",
    options: [
      { value: "yes", label: "قوي جداً / أفهم ديناميكية الانتشار والخوارزميات", desc: "أستطيع التقاط التوجهات الرائجة (Trends) وصياغة هاشتاقات تجذب الآلاف للطلبات.", icon: "TrendingUp" },
      { value: "basic", label: "اعتيادي / أستخدمها للأمور والاهتمامات الشخصية", desc: "مرن في نشر منشور أو إرسال استفسار للشركات دون خبرة مكثفة بالتسويق الخوارزمي المتقدم.", icon: "HelpCircle" },
      { value: "no", label: "منخفض / أفضل العمل بالخلفية دون إدارة منصات عامة", desc: "الراحة الكاملة تكمن بصحة التركيز مع المهام والأجهزة دون إدارة علاقات عامة أو نقاش تسويقي مباشر.", icon: "Lock" }
    ]
  },
  {
    id: "obstacle",
    title: "ما هو أكبر تحدّ وعائق يمنعك من البدء الآن؟",
    subtitle: "تحديد عائقك الأكبر يمكننا من تصميم خطة دقيقة تتفادى مخاوفك وتدعم جهودك.",
    options: [
      { value: "time", label: "ضيق الوقت بسبب مهام معيشية أو دراسية صعبة", desc: "اقتراح مسارات فائقة الاختصار ومقترنة بنظام يومي بسيط لا يتعدى 20 دقيقة للتقدم.", icon: "Clock" },
      { value: "tech", label: "نقص المعرفة وغياب الخبرة التقنية والمفاهيم البرمجية", desc: "تركيز كلي على أدوات بواجهات مرئية غاية في السلاسة دون الحاجة لسطر كود واحد.", icon: "Wrench" },
      { value: "fear", label: "خوف حقيقي من الفشل أو الخسارة وصعوبات تسويق الخدمة", desc: "فرص بمهام لا تتطلب ريسك مالي، مدعومة بإثباتات حقيقية للمبيعات سهلة الإقناع للعملاء.", icon: "HelpCircle" },
      { value: "clarity", label: "تشتت التفكير وعشوائية العثور على البداية المثالية", desc: "حسم الشكوك عبر حصرها بـ 5 خيارات مخصصة تناسبك مع خطوات واضحة وموثوقة للبدء.", icon: "Lightbulb" }
    ]
  }
];

// Helper to calculate score dynamically matches
function calculateHustles(answers: Record<string, string>): SideHustle[] {
  return HUSTLE_TEMPLATES.map((hustle) => {
    let score = 75; // Baseline score
    let bestFitReason = "";

    // 1. Field matching
    if (hustle.id === "content-agency") {
      if (answers.field === "writing" || answers.field === "design" || answers.field === "marketing") {
        score += 15;
        bestFitReason = "مثالي لشغفك في إنشاء المحتوى الرقمي والتصاميم المرئية المبتكرة.";
      } else {
        score += 5;
        bestFitReason = "أداة رائعة لاستثمار مهاراتك بشكل ميسر وجديد.";
      }
    } else if (hustle.id === "nocode-developer") {
      if (answers.field === "tech" || answers.field === "design") {
        score += 15;
        bestFitReason = "يتماشى تماماً مع اهتمامك التقني والجمالي لتصميم وبناء واجهات المواقع المميزة.";
      } else {
        score += 5;
        bestFitReason = "فرصة ذهبية للمرور إلى عالم ريادة الأعمال التقني.";
      }
    } else if (hustle.id === "ai-automation") {
      if (answers.field === "tech" || answers.field === "management") {
        score += 15;
        bestFitReason = "شغفك بالمنطق وحل العقد يطابق مهارات الربط وبناء منصات الأتمتة.";
      } else {
        score += 5;
        bestFitReason = "أعمال الأتمتة والتحليلات هي الأكثر نمواً وطلباً للبداية المعقولة.";
      }
    } else if (hustle.id === "ai-seo") {
      if (answers.field === "writing" || answers.field === "marketing") {
        score += 15;
        bestFitReason = "حبك لصياغة المقالات والتسويق يجعلان تهيئة الـ SEO مساراً كفؤاً ويسيراً لك.";
      } else {
        score += 5;
        bestFitReason = "تصدر محركات البحث خيار ممتاز للخدمات الحرة ذات المدخول الثابت.";
      }
    } else if (hustle.id === "ai-branding") {
      if (answers.field === "design" || answers.field === "marketing") {
        score += 15;
        bestFitReason = "قدراتك الفنية وتنسيق الألوان هما حجر الأساس لبناء الهويات البصرية الممتازة.";
      } else {
        score += 5;
        bestFitReason = "مجال ممتع ومربح للبداية السريعة عبر مولدات الصور الحديثة.";
      }
    } else if (hustle.id === "ai-copywriter") {
      if (answers.field === "writing" || answers.field === "marketing") {
        score += 15;
        bestFitReason = "مهارات الإقناع والتأثير اللغوي مثالية لصياغة رزم الإعلانات وصفحات البيع الجذابة.";
      } else {
        score += 5;
        bestFitReason = "أسلوب الكتابة الموجه يحظى بأعلى نسب طلب لدى المتاجر لرفع مبيعاتها.";
      }
    } else if (hustle.id === "ai-educator") {
      if (answers.field === "writing" || answers.field === "management") {
        score += 15;
        bestFitReason = "تنظيم وتلخيص المعلومات يناسب مسار صناعة الكتب والمساقات التعليمية المتكاملة.";
      } else {
        score += 5;
        bestFitReason = "بناء دخل سلبي طويل المدى ومصادره عبر التوجيه التعليمي الدقيق.";
      }
    } else if (hustle.id === "chatbot-expert") {
      if (answers.field === "tech" || answers.field === "management" || answers.field === "marketing") {
        score += 15;
        bestFitReason = "مزج متناسق لخدمة العملاء مع بناء أنظمة الرد التلقائي للتوفير على المتاجر.";
      } else {
        score += 5;
        bestFitReason = "تطوير الروبوتات هو عصب العمليات الفعال والمبسط لكافة المواقع التجارية.";
      }
    } else if (hustle.id === "ai-audio-transcriber") {
      if (answers.field === "writing" || answers.field === "management") {
        score += 15;
        bestFitReason = "الحس اللغوي والتنظيمي المتميز يدعم الترجمة ودبلجة الدروس الصوتية باحترافية.";
      } else {
        score += 5;
        bestFitReason = "تفريغ وتوطين المحتوى الصوتي خدمة تنافسية سريعة الإتقان وقليلة الجهد.";
      }
    } else if (hustle.id === "ai-childrens-books") {
      if (answers.field === "writing" || answers.field === "design") {
        score += 15;
        bestFitReason = "تأليف ورسم قصص الأطفال يزاوج خيالك الكتابي مع دقة التصميم التوليدي المذهل.";
      } else {
        score += 5;
        bestFitReason = "النشر عبر أمازون خدمة رائعة توفر استمرارية الأرباح والانتشار العالي.";
      }
    }

    // Adjust score based on time
    if (answers.time === "under5") {
      if (hustle.timeRequired.includes("under") || hustle.timeRequired.includes("3-") || hustle.timeRequired.includes("4-") || hustle.timeRequired.includes("5-")) {
        score += 10;
      } else if (hustle.timeRequired.includes("12-") || hustle.timeRequired.includes("15-")) {
        score -= 10;
      }
    } else if (answers.time === "above15") {
      score += 10;
    }

    // Adjust score based on capital
    if (answers.capital === "none") {
      if (hustle.difficulty === "مبتدئ") {
        score += 5;
      }
    } else if (answers.capital === "medium") {
      if (hustle.difficulty === "محترف" || hustle.difficulty === "متوسط") {
        score += 5;
      }
    }

    const finalScore = Math.min(98, Math.max(65, score));

    return {
      ...hustle,
      bestFitReason,
      score: finalScore
    };
  }).sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// Persuasive copywriting-optimized, action-oriented execution plans
const ACTION_PLAN_STEPS_OVERRIDE: Record<string, string[]> = {
  "content-agency": [
    "ابدأ بـ تحديد واختيار تخصص مطلوب (Niche) مثل تطوير الذات، الثقافة المالية، أو تبسيط الكتب لضمان انطلاقة مستهدفة.",
    "أنشئ رزمة مكونة من 10 سيناريوهات جذابة باستخدام الذكاء الاصطناعي، ثم ولّد مرئيات وتعليقاً صوتياً عالي الاحترافية.",
    "أطلق خدمتك بالتوجّه لأصحاب المتاجر والمشاريع الصغيرة على السوشيال ميديا وعرض باقات اشتراك شهرية مريحة ومربحة."
  ],
  "nocode-developer": [
    "ابدأ بـ إتقان واكتساب أساسيات منصات التطوير فائقة السرعة مثل Lovable أو v0 لبناء صفحات الهبوط والمواقع التفاعلية.",
    "أنشئ معرضاً لستة نماذج أولية مبتكرة (MVPs)، ثم اعرضها بثقة على منصات مثل Upwork ومستقل لجذب العملاء الرياديين.",
    "أطلق خدمتك التقنية وعمليات تسليمك فائقة السرعة مستعيناً بالذكاء الاصطناعي في حل ومعالجة المشكلات البرمجية فوراً."
  ],
  "ai-automation": [
    "ابدأ بـ رصد وتتبع المهام اليومية المتكررة والمستنزفة للوقت في الشركات المحيطة كالرد المتأخر وفوات المبيعات.",
    "أنشئ نموذج أتمتة وربط ذكي على Make.com يربط رسائل العملاء ومبيعاتهم تلقائياً لتبسيط العمليات كلياً.",
    "أطلق باقتك للشركات تحت ضمان تقليص تكلفة خدمة العملاء بنسبة 70% مقابل اشتراك شهري مستمر يضمن ثبات الدخل."
  ],
  "ai-seo": [
    "ابدأ بـ استكشاف واقتناص الكلمات المفتاحية الأكثر ربحية وذات صعوبة منخفضة باستخدام أدوات الـ SEO الذكية.",
    "أنشئ مقالاً متكامل الهيكل ومصاغاً بجودة لغوية بشرية فائقة ومحسناً بالكامل ليتوافق مع خوارزميات محرك البحث Google.",
    "أطلق حملة التواصل الخاصة بك بمراسلة أصحاب المدونات وصنّاع المحتوى وعرض تقديم رزم مدونات منسقة تضمن تصدرهم."
  ],
  "ai-branding": [
    "ابدأ بـ تصميم وبناء معرض أعمال (Portfolio) وهمي فائق الفخامة لشخصيات وعلامات مبتكرة تم توليدها بالذكاء الاصطناعي.",
    "أنشئ حضورك الفني بنشر تصاميمك المميزة على منصات Behance ولينكد إن ومجموعات ريادة الأعمال لجلب الاهتمام الفوري.",
    "أطلق باقات لتقديم الهوية المتكاملة (شعارات، خطوط، وتغليف منتجات مجسم ثلاثي الأبعاد) لترقية ظهور عملائك البصري."
  ],
  "ai-copywriter": [
    "ابدأ بـ تحليل ودراسة هياكل الإعلانات العبقرية الجاذبة والنماذج السيكولوجية العريقة مثل نموذج التسويق (AIDA / PAS).",
    "أنشئ نصوصاً تسويقية مخصصة لحملات فيسبوك وتيك توك بعد الكشف عن نقاط الضعف وشكاوى العملاء من معروض المنافسين.",
    "أطلق مبادرتك بمراسلة المتاجر النشطة وتقديم تعديلات مجانية على صفحات بيعهم الضعيفة مقابل مشاركتك نسبة مئوية من زيادة المبيعات السريعة."
  ],
  "ai-educator": [
    "ابدأ بـ اختيار موضوع تثقيف ذكي ومرغوب جداً بالسوق (كـ مهارات الذكاء الاصطناعي، أو تبسيط التمويل للمبتدئين).",
    "أنشئ مخططاً دراسياً وسلايدات تفاعلية أنيقة وتجهيز كتاب رقمي (PDF) جذاب في يوم واحد بمساعدة Gamma و HeyGen.",
    "أطلق ونظم مبيعات مساقك التعليمي على Gumroad أو Udemy وسوّق له ببث مقاطع ومقتطفات صغيرة في السوشيال ميديا."
  ],
  "chatbot-expert": [
    "ابدأ بـ تصميم وتدريب روبوت دردشة (Chatbot) تجريبي لمتجر شهير واختبر سرعة إجابته للأمور وقضايا الإرجاع والشحن.",
    "أنشئ تواصلك الشخصي مع أصحاب المتاجر الإلكترونية لتقديم حلول سريعة والرد الفوري بدلاً من تراكم الرسائل الغير مجابة.",
    "أطلق شراكة مربعة بتثبيت الروبوت تجانساً مع شوبيفاي، وقدم له أسبوع تجربة مجانياً، يليه خطة الصيانة السنوية المريحة."
  ],
  "ai-audio-transcriber": [
    "ابدأ بـ استخلاص وتفريغ الفيديوهات والبودكاست الطويلة لرواد الأعمال وتحويلها إلى مقالات وملفات نصية منظمة وقابلة للبحث.",
    "أنشئ مسارات ذكية لدبلجة وتسهيل وصول مقاطع الفيديو التسويقية الأجنبية للغة المحلية مستخدماً بصمات صوتية مقنعة وجذابة.",
    "أطلق وتعهّد بتسليم ملفات الدبلجة بدقة بالغة وسرعة مستقيمة عبر استثمار أدوات الأتمتة المبتكرة لرواد الأعمال."
  ],
  "ai-childrens-books": [
    "ابدأ بـ تدوين وصياغة رواية تربوية قصيرة للأطفال تركز على مفاهيم جميلة بطريقة جذابة ومقنعة (كحل النزاعات والتعاون).",
    "أنشئ شخصية مذهلة وثابتة المظهر والسمات البصرية بمساعدة Midjourney واستعرضها في لقطات متعددة مكملة للرواية.",
    "أطلق كتابك المصور للطباعة عند الطلب على Amazon KDP، ليتم شحنها تلقائياً للطفل دون القلق حيال الشحن أو المخازن الملموسة."
  ]
};

// Subcomponent to render the highly polished, SaaS-designed interactive Action Plan with "SaaS Card" styling
function HustleActionPlan({ 
  hustle, 
  answers = {}, 
  relevanceReason 
}: { 
  hustle: Omit<SideHustle, "bestFitReason"> & { bestFitReason?: string }; 
  answers?: Record<string, string>; 
  relevanceReason: string;
}) {
  // Let's define the URL map for the tools
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
    if (trimmed.includes("magnific")) return "https://magnific.ai";
    if (trimmed.includes("photoshop") || trimmed.includes("adobe")) return "https://www.adobe.com/products/photoshop.html";
    if (trimmed.includes("copy.ai")) return "https://www.copy.ai";
    if (trimmed.includes("jasper")) return "https://www.jasper.ai";
    if (trimmed.includes("headline")) return "https://coschedule.com/headline-analyzer";
    if (trimmed.includes("manychat")) return "https://manychat.com";
    if (trimmed.includes("whisper")) return "https://openai.com/research/whisper";
    if (trimmed.includes("deepl")) return "https://www.deepl.com";
    return "https://google.com";
  };

  // Helper to get matching step icon
  const getStepIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <Icons.Compass className="w-4 h-4 text-cyan-400" />;
      case 1:
        return <Icons.Layers className="w-4 h-4 text-indigo-400" />;
      case 2:
      default:
        return <Icons.Rocket className="w-4 h-4 text-fuchsia-400 animate-pulse" />;
    }
  };

  // Get localized custom estimated timeframe text
  const getStepTimeframe = (idx: number) => {
    switch (idx) {
      case 0:
        return "الوقت المتوقع: ساعة واحدة للتخطيط والاستهداف الأولي";
      case 1:
        return "الوقت المتوقع: ساعتان للتوليد وبناء المعالم بمساعدة الذكاء الاصطناعي";
      case 2:
      default:
        return "الوقت المتوقع: 45 دقيقة للتواصل وجلب الطلب الحقيقي للعملاء";
    }
  };

  // Personalized Pro Tip based on survey answers
  const getPersonalizedProTip = () => {
    const obstacle = answers.obstacle || 'clarity';
    const capital = answers.capital || 'none';
    const goal = answers.goal || 'learning';

    let title = "نصيحة ذهبية مخصصة لانطلاقتك السريعة:";
    let tipText = "ابدأ بخطوة صغيرة اليوم! تخصيص 15 دقيقة فقط للتعرف على أداتك الأساسية سيكسر حاجز التردد ويضعك في طريق النجاح الموثق.";

    if (obstacle === 'time') {
      title = "نصيحة لوقتك المحدود وأتمتة مهامك:";
      tipText = "قسّم المهام الأسبوعية إلى دفعات يومية من 15 دقيقة مستقلة بالكامل. التركيز والجرأة اليومية تبني حضوراً مبهراً يفوق العمل المكثف والمنقطع.";
    } else if (obstacle === 'tech') {
      title = "توجيه ذهبي لتذليل العقبات البرمجية:";
      tipText = "لا تحتاج لكتابة أي أسطر كود لتبدأ عملك الجانبي المعزز. تعامل مع الذكاء الاصطناعي وكأنه شريك تقني خاص يقوم بكافة العمليات المعقدة بلغة بسيطة للغاية.";
    } else if (obstacle === 'fear') {
      title = "نصيحة فنية لتجاوز حاجز التردد والوصول الحر لعملاءك الأولين:";
      tipText = "اعرض خدماتك بشكل مجاني تام لأول 3 مستفيدين من رواد الأعمال مقابل الحصول على تقييم مرئي مميز يدعم علامتك وتصنيفك أمام العملاء القادمين.";
    } else if (obstacle === 'clarity') {
      title = "إرشاد لتجاوز عشوائية البداية وبناء الرؤية:";
      tipText = "تجنب تشتيت عقلك بمحاولة إتقان جميع الأدوات معاً. اختر أداة توليد رائدة واحدة مثل (" + (hustle.tools[0]?.name || "صانع الذكاء الاصطناعي") + ") وركز عليها طيلة أسبوعك الأول بمثابرة.";
    }

    if (capital === 'none') {
      tipText += " واستغل الفترات التجريبية المجانية للأدوات لإبرام مبيعاتك الأولى لتتمكن من إعادة شراء الاشتراكات عبر ميزانية الأرباح مباشرة.";
    } else if (capital === 'low') {
      tipText += " واستثمر ميزانيتك المرنة فوراً بترقية الأداة الأساسية لنسختها الاحترافية المدفوعة، لأن جودة الإنتاج تدعم زيادة تسعير خدماتك الفورية.";
    }

    if (goal === 'brand') {
      tipText += " واحرص على توثيق تحدي الإنتاج الخاص بك على السوشيال ميديا، فالشفافية تجذب المتابعين والعملاء المهتمين بسلاسة مذهلة.";
    }

    return { title, tipText };
  };

  const proTip = getPersonalizedProTip();
  const stepsToRender = ACTION_PLAN_STEPS_OVERRIDE[hustle.id] || hustle.steps;

  return (
    <div className="space-y-8">
      {/* Best Fit explanation */}
      <div className="p-6 border border-slate-800/80 bg-slate-950 mb-6 leading-relaxed relative rounded-2xl shadow-inner shadow-cyan-500/5 text-right">
        <div className="absolute top-0 right-10 -translate-y-1/2 px-3 bg-slate-950 border-x border-slate-800/60 text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
          مبررات الملاءمة الاستراتيجية // COMPATIBILITY
        </div>
        <p className="text-slate-300 text-xs sm:text-sm font-light font-serif italic text-justify leading-relaxed">
          « {relevanceReason} »
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-right">
        {/* Left Columns: 3 Steps timeline with execution icons */}
        <div className="lg:col-span-7">
          <h4 className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-6 pb-2 border-b border-slate-900 flex items-center gap-2 font-bold">
            <span>[ 01 // خطة ترويج وتدريب متسلسلة ]</span>
          </h4>

          <div className="flex flex-col gap-6 relative pr-1 pt-1">
            {/* Line in timeline */}
            <div className="absolute top-2 bottom-8 right-3.5 w-[1px] bg-slate-900" />
            
            {stepsToRender.map((st, sidx) => (
              <div key={sidx} className="flex items-start gap-4 pr-1 relative">
                {/* Visual Step Icon and Number block */}
                <div className="w-8 h-8 rounded-xl bg-slate-900/90 border border-slate-800 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 z-10 shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                  {getStepIcon(sidx)}
                </div>
                
                <div className="border border-slate-900/60 bg-slate-950/20 p-5 rounded-2xl flex-1 transition-all hover:bg-slate-900/20 hover:border-slate-800/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.05)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-cyan-400 font-mono tracking-wider font-bold">الخطوة 0{sidx + 1}</span>
                    <span className="text-slate-700 font-mono font-light select-none">/</span>
                    <span className="text-[10px] text-slate-500 font-sans">{sidx === 0 ? "ابدأ بـ" : sidx === 1 ? "أنشئ" : "أطلق"}</span>
                  </div>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans font-light mb-3">
                    {st}
                  </p>

                  {/* Urgency Timeframe element with timeline status */}
                  <div className="inline-flex items-center gap-1.5 bg-slate-900/50 border border-slate-850 px-2.5 py-1 rounded-lg text-[10px] text-amber-500 font-sans font-medium">
                    <Icons.Clock size={11} className="text-amber-500 shrink-0" />
                    <span>{getStepTimeframe(sidx)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Columns: Suggested AI Tools & metrics */}
        <div className="lg:col-span-5">
          <h4 className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-6 pb-2 border-b border-slate-900 flex items-center gap-2 font-bold">
            <span>[ 02 // حزمة البرمجيات المقترحة ]</span>
          </h4>

          <div className="flex flex-col gap-3">
            {hustle.tools.map((t, tid) => {
              const targetUrl = getToolUrl(t.name);
              
              return (
                <div key={tid} className="p-4 bg-slate-950/45 border border-slate-900 hover:border-slate-800 transition-colors rounded-2xl relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-1.5">
                    {/* Interactive Button Chip to open the tool */}
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-950 to-indigo-950 text-cyan-400 hover:text-white border border-cyan-800/40 hover:border-cyan-500/50 transition-all text-[11px] font-mono rounded-lg flex items-center gap-1.5 hover:shadow-[0_0_10px_rgba(34,211,238,0.25)] cursor-pointer"
                    >
                      <span className="font-extrabold">{t.name}</span>
                      <Icons.ExternalLink size={10} className="text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                    </a>
                    
                    <span className="text-[9px] text-slate-550 font-mono uppercase tracking-widest font-bold">أداة معتمدة</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed font-light font-sans">
                    {t.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Dynamic micro metrics with modern glassmorphism style */}
          <div className="mt-6 grid grid-cols-2 gap-4 bg-slate-900/10 p-4 border border-slate-850/60 text-xs rounded-2xl">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block mb-1 uppercase tracking-wider">متطلب الوقت</span>
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <Icons.Clock size={12} className="text-slate-550" />
                <span className="font-mono">{hustle.timeRequired}</span>
              </span>
            </div>
            
            <div>
              <span className="text-[10px] text-slate-500 font-mono block mb-1 uppercase tracking-wider">الأرباح المتوقعة</span>
              <span className="font-bold text-cyan-400 flex items-center gap-2">
                <Icons.DollarSign size={13} className="text-cyan-500" />
                <span className="font-mono">{hustle.potentialEarnings}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic SaaS "Pro Tip" card widget at the footer of the action plan panel */}
      <div className="mt-8 p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent relative overflow-hidden shadow-lg shadow-amber-500/2 text-right">
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -translate-x-12 -translate-y-12" />
        <div className="flex items-start gap-4 relative">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <Icons.Award className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h5 className="text-xs sm:text-sm font-bold text-amber-500 mb-1 font-sans">{proTip.title}</h5>
            <p className="text-slate-300 text-xs sm:text-xs leading-relaxed font-sans font-light text-justify">
              {proTip.tipText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SocialShareProps {
  isOpen: boolean;
  onClose: () => void;
  answers: Record<string, string>;
  isSavingPlan: boolean;
  sharingId: string | null;
  QUESTIONS: Question[];
}

function SocialShare({ isOpen, onClose, answers, isSavingPlan, sharingId, QUESTIONS }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const shareUrl = useMemo(() => {
    if (!sharingId) return "";
    return `${window.location.origin}/plan/${sharingId}`;
  }, [sharingId]);

  const shareText = "لقد صممت خطة عملي للذكاء الاصطناعي مع AI Assist Pro - اكتشف خطتك المخصصة الآن! ⚡🤖";

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw dark radial gradient background
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width/1.2);
    bgGrad.addColorStop(0, "#0f172a"); // slate-900
    bgGrad.addColorStop(1, "#020617"); // slate-950
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern
    ctx.strokeStyle = "rgba(168, 85, 247, 0.05)";
    ctx.lineWidth = 1;
    const size = 30;
    for (let x = 0; x < width; x += size) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Border gradient
    const borderGrad = ctx.createLinearGradient(0, 0, width, 0);
    borderGrad.addColorStop(0, "#06b6d4"); 
    borderGrad.addColorStop(1, "#a855f7"); 
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // RTL for Arabic
    ctx.direction = "rtl";

    // draw App Label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("AI Assist Pro ⚡", width - 80, 90);

    // Title line 1
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "300 24px sans-serif";
    ctx.fillText("خطة العمل المخصصة للذكاء الاصطناعي", width - 80, 145);

    // Card Box
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
    ctx.lineWidth = 2;
    
    const rx = 80;
    const ry = 200;
    const rw = width - 160;
    const rh = 180;
    const radius = 16;
    ctx.beginPath();
    ctx.moveTo(rx + radius, ry);
    ctx.lineTo(rx + rw - radius, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
    ctx.lineTo(rx + rw, ry + rh - radius);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
    ctx.lineTo(rx + radius, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
    ctx.lineTo(rx, ry + radius);
    ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text in the container
    ctx.fillStyle = "#22d3ee"; // cyan-400
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("الملخص الاستراتيجي للقدرات والمهارات المكتشفة", rx + rw - 45, 250);

    const fieldVal = answers.field;
    const fieldLabel = QUESTIONS[0]?.options.find(o => o.value === fieldVal)?.label || "متنوع";
    const skillVal = answers.aiSkill;
    const skillLabel = QUESTIONS[5]?.options.find(o => o.value === skillVal)?.label || "متوسط";
    const capitalVal = answers.capital;
    const capitalLabel = QUESTIONS[2]?.options.find(o => o.value === capitalVal)?.label || "بدون ميزانية";

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "normal 20px sans-serif";
    ctx.fillText(`• المجال المختار للريادة: ${fieldLabel}`, rx + rw - 60, 305);
    ctx.fillText(`• التكلفة وبدء الاستثمار: ${capitalLabel}`, rx + rw - 60, 345);

    // Footer Text
    ctx.fillStyle = "#c084fc"; // purple-400
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("صمم خطة تشغيلك الذاتي فوراً والتحق بثورة الأتمتة 🦾🚀", width - 100, 480);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "normal 16px sans-serif";
    ctx.fillText(`${window.location.host}`, width - 100, 520);
  }, [isOpen, answers, QUESTIONS]);

  const handleDownloadImage = () => {
    if (!canvasRef.current) return;
    const image = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "AI-Assist-Pro-Plan.png";
    link.href = image;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-xl overflow-hidden border border-slate-800/80 bg-slate-900 rounded-3xl shadow-2xl text-right p-6 sm:p-8"
      >
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 shadow-[0_3px_15px_rgba(6,182,212,0.5)]" />

        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Icons.X size={16} />
        </button>

        <div className="flex items-center gap-4 mb-6 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
            <Icons.Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100 font-serif">
              مشاركة خطتك المخصصة ⚡
            </h3>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              تأكتدنا من الحفاظ على خصوصيتك بالكامل. سيتم عرض ملخص استراتيجي فقط لتحفيز أصدقائك!
            </p>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={1000}
          height={560}
          className="hidden"
        />

        <div className="relative border border-slate-800/80 bg-slate-950 p-4 rounded-2xl overflow-hidden mb-6 group select-none">
          <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-500 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40 uppercase tracking-widest">
            معاينة بطاقة شبكات التواصل (Open Graph Card)
          </div>
          
          <div className="h-[140px] w-full bg-gradient-to-br from-cyan-950/20 via-slate-900 to-purple-950/20 flex flex-col justify-between p-4 rounded-xl relative overflow-hidden mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-100 tracking-wider">AI Assist Pro ⚡</span>
              <span className="text-[10px] text-slate-500 font-mono">{window.location.host}</span>
            </div>
            <div className="text-center font-bold text-sm sm:text-base text-cyan-400 leading-normal font-sans py-2">
              لقد صممت خطة عملي للذكاء الاصطناعي مع AI Assist Pro - اكتشف خطتك المخصصة الآن! 👇🤖
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-light">
              <span>توليد فوري وآمن %100</span>
              <span className="text-purple-400">ملخص القدرات والمستقبل التقني 🚀</span>
            </div>
          </div>

          <button
            onClick={handleDownloadImage}
            className="mt-3 w-full py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 font-mono transition-all flex items-center justify-center gap-2 rounded-xl cursor-pointer"
          >
            <Icons.Download size={13} />
            <span>تحميل أو حفظ بطاقة المشاركة الذكية كصورة // Save Card</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-2">رابط الخطة الديناميكي (Deep Link):</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={isSavingPlan ? "جاري إنشاء وتوليد الرابط الآمن للتطبيق..." : shareUrl}
                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs text-slate-300 font-mono tracking-wide focus:outline-none focus:border-cyan-500/50"
              />
              <button
                disabled={isSavingPlan || !shareUrl}
                onClick={handleCopy}
                className="px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-mono font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 inline-flex min-w-[90px]"
              >
                {copied ? <Icons.Check size={14} className="text-green-400" /> : <Icons.Copy size={14} />}
                <span>{copied ? "تم النسخ!" : "نسخ // Copy"}</span>
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-3">مشاركة سريعة عبر القنوات الاجتماعية:</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <a
                href={shareUrl ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-xs font-medium text-slate-200 flex items-center justify-center gap-2 rounded-xl ${(!shareUrl || isSavingPlan) ? "opacity-40 pointer-events-none" : ""}`}
              >
                <Icons.Twitter size={14} className="text-sky-400" />
                <span>تويتر / X</span>
              </a>
              <a
                href={shareUrl ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-blue-900 transition-all text-xs font-medium text-slate-200 flex items-center justify-center gap-2 rounded-xl ${(!shareUrl || isSavingPlan) ? "opacity-40 pointer-events-none" : ""}`}
              >
                <Icons.Linkedin size={14} className="text-blue-500" />
                <span>لينكد إن</span>
              </a>
              <a
                href={shareUrl ? `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-green-950 transition-all text-xs font-medium text-slate-200 flex items-center justify-center gap-2 rounded-xl ${(!shareUrl || isSavingPlan) ? "opacity-40 pointer-events-none" : ""}`}
              >
                <Icons.MessageSquare size={14} className="text-green-500" />
                <span>واتساب</span>
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<'welcome' | 'survey' | 'loading' | 'results' | 'favorites' | 'shared-plan'>('welcome');

  // Viral Social Sharing states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isViewingSharedPlan, setIsViewingSharedPlan] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [currentSharedPlanId, setCurrentSharedPlanId] = useState<string | null>(null);
  const [sharedPlanOwnerId, setSharedPlanOwnerId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingText, setLoadingText] = useState("بدء تحليل الارتباطات العصبية...");
  const [generatedResults, setGeneratedResults] = useState<SideHustle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterCapital, setFilterCapital] = useState<string>("all");
  const [viewingDetailId, setViewingDetailId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Authentication & Saved Lists States
  const [user, setUser] = useState<User | null>(null);
  const [savedHustlesList, setSavedHustlesList] = useState<string[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Connection tester to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Sync saved list from Firestore
  const fetchSavedHustles = async (uid: string) => {
    const path = "savedHustles";
    try {
      const q = query(collection(db, path), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const ids: string[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.hustleId) {
          ids.push(data.hustleId);
        }
      });
      setSavedHustlesList(ids);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        fetchSavedHustles(currentUser.uid);
      } else {
        setSavedHustlesList([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setAuthLoading(true);
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setUser(result.user);
        await fetchSavedHustles(result.user.uid);
      }
      setShowAuthModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setSavedHustlesList([]);
      if (screen === 'favorites') {
        setScreen('welcome');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch shared plan from Firestore
  const getPlanById = async (planId: string) => {
    try {
      const docRef = doc(db, "plans", planId);
      const docSnap = await getDocFromServer(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error("Error in getPlanById:", error);
      handleFirestoreError(error, OperationType.GET, `plans/${planId}`);
      return null;
    }
  };

  const fetchSharedPlan = async (planId: string) => {
    setIsLoadingPlan(true);
    try {
      const data = await getPlanById(planId);
      if (data && data.answers) {
        setAnswers(data.answers);
        setGeneratedResults(calculateHustles(data.answers));
        setCurrentSharedPlanId(planId);
        setSharedPlanOwnerId(data.userId || null);
        setIsViewingSharedPlan(true);
        setScreen("shared-plan");
      } else {
        console.error("Shared plan not found in database.");
      }
    } catch (error) {
      console.error("Error loading shared plan:", error);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  // Handle shares and loading shared parameters on mount
  useEffect(() => {
    const handleUrlState = async () => {
      // 1. Path check (e.g. /plan/ID)
      const path = window.location.pathname;
      let planId: string | null = null;
      if (path.includes('/plan/')) {
        planId = path.split('/plan/').pop() || null;
      }
      
      // 2. Query parameter check (e.g. ?plan=ID)
      const params = new URLSearchParams(window.location.search);
      if (!planId) {
        planId = params.get("plan");
      }

      // 3. Fallback old direct query parameters (?share=true)
      if (!planId && params.get("share") === "true") {
        const loadedAnswers: Record<string, string> = {};
        QUESTIONS.forEach((q) => {
          const val = params.get(q.id);
          if (val) {
            loadedAnswers[q.id] = val;
          }
        });
        if (Object.keys(loadedAnswers).length > 0) {
          setAnswers(loadedAnswers);
          setGeneratedResults(calculateHustles(loadedAnswers));
          setScreen("results");
        }
        return;
      }

      if (planId) {
        if (planId.startsWith("fb_")) {
          try {
            const rawBase64 = planId.substring(3).replace(/-/g, "+").replace(/_/g, "/");
            const decodedAnswers = JSON.parse(decodeURIComponent(escape(atob(rawBase64))));
            setAnswers(decodedAnswers);
            setGeneratedResults(calculateHustles(decodedAnswers));
            setCurrentSharedPlanId(planId);
            setSharedPlanOwnerId(null);
            setIsViewingSharedPlan(true);
            setScreen("shared-plan");
          } catch (e) {
            console.error("Failed to decode base64 fallback deep link:", e);
          }
        } else {
          await fetchSharedPlan(planId);
        }
      }
    };

    handleUrlState();
  }, []);

  // Loading Screen simulation transition
  useEffect(() => {
    if (screen === 'loading') {
      const texts = [
        "بدء تحليل الارتباطات العصبية...",
        "مراجعة متطلبات الوقت والميزانية...",
        "مطابقة المهارات والاهتمامات الشخصية...",
        "توليد خارطة الطريق المثالية لعام 2026...",
        "اكتمل التوليد الخوارزمي بنجاح!"
      ];
      let index = 0;
      setLoadingText(texts[0]);
      
      const interval = setInterval(() => {
        index++;
        if (index < texts.length) {
          setLoadingText(texts[index]);
        } else {
          clearInterval(interval);
          const results = calculateHustles(answers);
          setGeneratedResults(results);
          setScreen('results');
        }
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [screen, answers]);

  const question = QUESTIONS[currentStep];
  const progressPercent = Math.round((currentStep / QUESTIONS.length) * 100);

  // Function to save the generated side hustle plan to Firestore database automatically
  const saveUserPlan = async (currentAnswers: Record<string, string>, currentResults: SideHustle[]) => {
    setIsSavingPlan(true);
    try {
      // Create a new direct reference in the 'plans' collection with an autogenerated ID
      const docRef = doc(collection(db, "plans"));
      const uniqueId = docRef.id;
      
      const payload = {
        userId: user ? user.uid : null,
        answers: currentAnswers,
        results: currentResults.slice(0, 5).map(h => ({
          id: h.id,
          title: h.title,
          category: h.category,
          difficulty: h.difficulty,
          timeRequired: h.timeRequired,
          potentialEarnings: h.potentialEarnings,
          description: h.description
        })),
        createdAt: serverTimestamp()
      };
      
      await setDoc(docRef, payload);
      setSharingId(uniqueId);
      console.log("Plan successfully saved to Firebase database under ID:", uniqueId);
      return uniqueId;
    } catch (err) {
      console.error("Error saving plan to Firebase:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, "plans");
      } catch (e) {
        // Safe backend fallback: generate dynamic base64 client hash if network blocks Firestore writes
        const rawJsonString = JSON.stringify(currentAnswers);
        const base64Encoded = btoa(unescape(encodeURIComponent(rawJsonString)))
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_");
        setSharingId(`fb_${base64Encoded}`);
      }
      return null;
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleShowPlan = async () => {
    setScreen('loading');
    const results = calculateHustles(answers);
    await saveUserPlan(answers, results);
  };

  const handleSelectOption = (value: string) => {
    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const resetSurvey = () => {
    setAnswers({});
    setCurrentStep(0);
    setSearchTerm("");
    setFilterDifficulty("all");
    setFilterCapital("all");
    setViewingDetailId(null);
    setScreen("welcome");
    window.history.pushState({}, '', window.location.pathname);
  };

  const toggleFav = async (id: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const isCurrentlyFaved = savedHustlesList.includes(id);
    const docId = `${user.uid}_${id}`;
    const path = `savedHustles/${docId}`;

    if (isCurrentlyFaved) {
      try {
        await deleteDoc(doc(db, "savedHustles", docId));
        setSavedHustlesList(prev => prev.filter(item => item !== id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      try {
        await setDoc(doc(db, "savedHustles", docId), {
          userId: user.uid,
          hustleId: id,
          createdAt: serverTimestamp()
        });
        setSavedHustlesList(prev => [...prev, id]);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }
  };

  const handleOpenShare = async () => {
    setIsShareModalOpen(true);
    if (sharingId) return; // already generated
    
    setIsSavingPlan(true);
    try {
      const docRef = doc(collection(db, "plans"));
      const uniqueId = docRef.id;
      
      await setDoc(docRef, {
        answers,
        createdAt: serverTimestamp()
      });
      
      setSharingId(uniqueId);
    } catch (err) {
      console.error("Error generating dynamic shared plan ID:", err);
      // Fallback: encode answers as Base64 so the share never stops working
      try {
        const rawJsonString = JSON.stringify(answers);
        const base64Encoded = btoa(unescape(encodeURIComponent(rawJsonString)))
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_");
        setSharingId(`fb_${base64Encoded}`);
      } catch (e) {
        console.error("Failed to fallback to base64 encoding", e);
      }
    } finally {
      setIsSavingPlan(false);
    }
  };

  const copyResultsLink = () => {
    handleOpenShare();
  };

  const filteredResults = useMemo(() => {
    return generatedResults.filter((hustle) => {
      // 1. Search filter
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const matchTitle = hustle.title.toLowerCase().includes(term);
        const matchDesc = hustle.description.toLowerCase().includes(term);
        const matchCategory = hustle.category.toLowerCase().includes(term);
        const matchTools = hustle.tools.some(t => t.name.toLowerCase().includes(term) || t.desc.toLowerCase().includes(term));
        if (!matchTitle && !matchDesc && !matchCategory && !matchTools) {
          return false;
        }
      }

      // 2. Difficulty filter
      if (filterDifficulty !== "all" && hustle.difficulty !== filterDifficulty) {
        return false;
      }

      // 3. Capital map filter (free vs medium subscription)
      if (filterCapital !== "all") {
        const isFreeHustle = ["content-agency", "ai-seo", "ai-branding", "ai-copywriter", "ai-childrens-books", "ai-audio-transcriber"].includes(hustle.id);
        if (filterCapital === "free" && !isFreeHustle) {
          return false;
        }
        if (filterCapital === "medium" && isFreeHustle) {
          return false;
        }
      }

      return true;
    });
  }, [generatedResults, searchTerm, filterDifficulty, filterCapital]);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-300 relative flex flex-col">
      
      {/* Editorial layout aesthetic structure borders */}
      <div className="absolute inset-0 border-x border-slate-900/40 max-w-6xl mx-auto pointer-events-none -z-10" />

      {/* Main Header */}
      <header className="border-b border-slate-900/60 bg-slate-950/75 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetSurvey}>
            <div className="p-2 border border-slate-800 bg-slate-900 text-cyan-400 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-sans font-bold text-lg sm:text-xl tracking-tight text-slate-100">
                AI Assist Pro
              </span>
              <span className="text-[10px] block text-cyan-500/80 font-mono tracking-wider">YOUR AI PARTNER FOR SUCCESS // 2026</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Favorites dashboard toggle */}
            <button
              id="header-favorites-btn"
              onClick={() => {
                if (user) {
                  setScreen(screen === 'favorites' ? 'welcome' : 'favorites');
                } else {
                  setShowAuthModal(true);
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 border transition-all text-xs font-sans cursor-pointer relative ${
                screen === 'favorites'
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold"
                  : "border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-zinc-700"
              }`}
            >
              <Icons.Heart size={13} fill={savedHustlesList.length > 0 ? "currentColor" : "none"} className={savedHustlesList.length > 0 ? "text-rose-500" : ""} />
              <span className="hidden sm:inline">مشاريعي المحفوظة</span>
              {savedHustlesList.length > 0 && (
                <span className="bg-emerald-500 text-zinc-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono min-w-[18px] text-center inline-block">
                  {savedHustlesList.length}
                </span>
              )}
            </button>

            {/* Auth Indicator / Profile Controls */}
            {authLoading ? (
              <div className="w-5 h-5 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ""} referrerPolicy="no-referrer" className="w-7 h-7 rounded-sm border border-zinc-800" />
                ) : (
                  <div className="w-7 h-7 bg-zinc-800 border border-zinc-700 text-emerald-400 flex items-center justify-center text-xs font-bold rounded-sm uppercase font-mono">
                    {(user.displayName || user.email || "U").slice(0, 1)}
                  </div>
                )}
                <button
                  id="header-signout-btn"
                  onClick={handleSignOut}
                  className="hidden md:inline text-[10px] text-zinc-500 hover:text-rose-450 font-mono tracking-widest uppercase transition-colors"
                  title="تسجيل الخروج"
                >
                  [ خروج ]
                </button>
              </div>
            ) : (
              <button
                id="header-signin-btn"
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all text-xs font-mono tracking-wide cursor-pointer text-zinc-300"
              >
                <span>دخول // LOGIN</span>
              </button>
            )}

            {screen === 'results' && (
              <button 
                id="reset-survey-header-btn"
                onClick={resetSurvey}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-xs font-mono tracking-wide cursor-pointer text-zinc-400 hover:text-emerald-400"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">إعادة البدء // RESET</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero / Main Area Container */}
      <main className="max-w-6xl mx-auto w-full px-6 sm:px-10 py-12 sm:py-20 flex-grow flex flex-col justify-center min-h-[calc(100vh-160px)]">
        
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: WELCOME SCREEN */}
          {screen === 'welcome' && (
            <motion.div
              id="welcome-screen"
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900/60 border border-slate-800/80 text-slate-400 text-[11px] font-mono mb-8 tracking-wider rounded-full">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                <span>ALGORITHMIC REPORT // COGNITIVE PREDICTOR v2.0</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none mb-6 text-slate-100">
                AI Assist Pro<br />
                <span className="font-serif italic font-light text-cyan-400 text-xl sm:text-3xl md:text-4xl block mt-4">Your AI Partner for Side Hustle Success</span>
              </h1>

              <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-12 leading-relaxed font-sans font-light">
                أجب عن <span className="text-slate-200 font-medium">10 أسئلة منهجية دقيقة</span> لتقييم مهاراتك المتاحة، وجدولك الزمني وميزانيتك الخاصة. سيقوم نموذجنا الخوارزمي بتوليد 5 أفكار مخصصة متناغمة مع ملفك الشخصي مع خطط عمل تفصيلية.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button
                  id="start-survey-btn"
                  onClick={() => setScreen('survey')}
                  className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-[right_center] text-white font-bold text-base rounded-xl transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center gap-3 border border-indigo-500/30 hover:shadow-[0_0_25px_rgba(99,102,241,0.55)] font-sans tracking-wide"
                >
                  <span>ابدأ التقييم الآن</span>
                  <ArrowRight size={18} />
                </button>
                
                <div className="text-xs text-slate-500 font-mono tracking-widest flex items-center gap-2 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>انطلاق مجاني بالكامل // 100% FREE</span>
                </div>
              </div>

              {/* Bento Editorial Quick Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 mt-20 border border-slate-805/40 rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-800/40 text-right bg-slate-900/10 backdrop-blur-md">
                <div className="p-8 hover:bg-slate-900/20 transition-all">
                  <div className="text-xs text-cyan-400 font-mono mb-4 tracking-widest">[ 01 // مواءمة منهجية ]</div>
                  <h4 className="text-lg font-bold text-slate-200 mb-2 font-serif">توصيات مخصصة لك</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">تصفية دقيقة مطابقة لقدراتك لدمج تقنيات الأتمتة والذكاء الاصطناعي في جدولك القائم بانتظام.</p>
                </div>

                <div className="p-8 hover:bg-slate-900/20 transition-all">
                  <div className="text-xs text-cyan-400 font-mono mb-4 tracking-widest">[ 02 // حزمة التقنيات ]</div>
                  <h4 className="text-lg font-bold text-slate-200 mb-2 font-serif">التحكم بالأدوات الحديثة</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">مجموعة برمجيات ونقاط ربط بدون حاجة لخبرة برمجية مسبقة، لتسريع تسليم أعمالك ومضاعفة أرباحك.</p>
                </div>

                <div className="p-8 hover:bg-slate-900/20 transition-all">
                  <div className="text-xs text-cyan-400 font-mono mb-4 tracking-widest">[ 03 // دليل التشغيل ]</div>
                  <h4 className="text-lg font-bold text-slate-200 mb-2 font-serif">خارطة وبداية موثوقة</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">تفاصيل واضحة للبدء من ثلاث خطوات صلبة تهدف لمساعدة غير التقنيين وبناء دخلهم الرصين بثقة.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: ACTIVE SURVEY QUEST */}
          {screen === 'survey' && (
            <motion.div
              id="survey-screen"
              key="survey"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto w-full"
            >
              <div className="bg-slate-950/40 backdrop-blur-md border border-slate-800/80 p-8 sm:p-12 relative overflow-hidden rounded-2xl shadow-xl">
                
                {/* Subtle top index marker */}
                <div className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300" style={{ width: `${progressPercent || 3}%` }} />
                
                {/* Steps and Progress Indicator */}
                <div className="flex items-center justify-between mb-4 text-xs font-mono tracking-widest text-slate-450">
                  <span>
                    السؤال {currentStep + 1} // {QUESTIONS.length}
                  </span>
                  <span className="text-cyan-400 font-bold">
                    اكتمال التقييم: {progressPercent}%
                  </span>
                </div>

                {/* Progress bar line */}
                <div className="w-full bg-slate-900/80 h-1 rounded-full mb-10 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-350"
                    style={{ width: `${progressPercent || 3}%` }}
                  />
                </div>

                {/* Question Title */}
                <div className="mb-10">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 leading-snug mb-3 font-serif">
                    {question.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed font-sans">
                    {question.subtitle}
                  </p>
                </div>

                {/* Options Layout */}
                <div className="grid grid-cols-1 gap-4 mb-10">
                  {question.options.map((opt) => {
                    const isSelected = answers[question.id] === opt.value;
                    return (
                      <button
                        id={`option-${question.id}-${opt.value}`}
                        key={opt.value}
                        onClick={() => handleSelectOption(opt.value)}
                        className={`group w-full text-right p-5 border text-base transition-all duration-200 active:scale-[0.995] flex items-start gap-4 cursor-pointer relative rounded-xl ${
                          isSelected
                            ? "bg-slate-900/60 border-cyan-400 text-slate-100 shadow-lg shadow-cyan-500/5"
                            : "bg-slate-950/20 border-slate-900/80 hover:border-slate-800/60 hover:bg-slate-900/30 text-slate-300"
                        }`}
                      >
                        {/* Selector Indicator circle */}
                        <div className={`mt-1.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected 
                            ? "border-cyan-400 bg-cyan-400" 
                            : "border-slate-700 group-hover:border-slate-500"
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>

                        {/* Text and Description */}
                        <div className="flex-1">
                          <span className={`text-base sm:text-lg font-bold block mb-1 font-sans ${
                            isSelected ? "text-cyan-400" : "text-slate-200 group-hover:text-white"
                          }`}>
                            {opt.label}
                          </span>
                          <span className="text-xs text-slate-400 leading-relaxed font-light block font-sans">
                            {opt.desc}
                          </span>
                        </div>

                        {/* Floating Dynamic Icon */}
                        <div className={`p-2 shrink-0 ${
                          isSelected 
                            ? "text-cyan-400" 
                            : "text-slate-500 group-hover:text-slate-300"
                        }`}>
                          <LucideIcon name={opt.icon} size={16} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Show Plan button for the last question */}
                {currentStep === QUESTIONS.length - 1 && answers[question.id] && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <button
                      id="view-results-plan-btn"
                      onClick={handleShowPlan}
                      disabled={isSavingPlan}
                      className="w-full py-5 bg-gradient-to-r from-cyan-400 via-indigo-600 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-slate-100 font-extrabold text-base sm:text-lg rounded-xl transition-all duration-300 transform active:scale-[0.995] cursor-pointer flex items-center justify-center gap-3 border border-cyan-450/30 shadow-[0_4px_25px_rgba(34,211,238,0.25)] hover:shadow-[0_4px_35px_rgba(168,85,247,0.45)] disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                    >
                      {isSavingPlan ? (
                        <>
                          <Icons.Loader2 className="w-5 h-5 animate-spin text-slate-100" />
                          <span>جاري صياغة وحفظ خطتك الذكية...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 animate-pulse text-slate-100" />
                          <span>عرض الخطة // SHOW PLAN</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Navigation Toolbar */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-900">
                  <button
                    id="prev-question-btn"
                    onClick={handlePrevStep}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-1.5 px-4 py-2 border text-xs font-mono transition-all rounded-lg ${
                      currentStep === 0 
                        ? "border-transparent text-slate-800 cursor-not-allowed opacity-30" 
                        : "border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900/50 cursor-pointer"
                    }`}
                  >
                    <ArrowLeft size={14} />
                    <span>السابق // BACK</span>
                  </button>

                  <span className="text-[10px] text-zinc-600 font-mono tracking-widest hidden sm:inline">
                    HUSTLE_FINDER_2026 // SURVEY_SESSION
                  </span>
                </div>

              </div>
            </motion.div>
          )}

          {/* SCREEN 3: TRANSITIONAL LOADING AND ALGORITHMIC MATRIX SPIN */}
          {screen === 'loading' && (
            <motion.div
              id="loading-screen"
              key="loading"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto text-center py-16 border border-slate-800/60 bg-slate-950/40 backdrop-blur-md rounded-2xl shadow-xl p-8"
            >
              {/* Pulsing AI Icon setup */}
              <div className="relative w-20 h-20 mx-auto mb-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/60 animate-spin" style={{ animationDuration: '6s' }} />
                <div className="p-4 bg-slate-900 rounded-full border border-slate-700/60 relative z-10 text-cyan-400 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-100 mb-4 font-serif">
                جاري معالجة المتطلبات وصياغة التوقّعات...
              </h3>
              
              <div className="h-6 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingText}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    className="text-xs text-cyan-400 font-mono tracking-wide"
                  >
                    {loadingText}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="mt-12 text-slate-500 text-[10px] font-mono tracking-widest uppercase">
                [ ALGORITHM // WEIGHT_PROPAGATION_ACTIVE_2026 ]
              </div>
            </motion.div>
          )}

          {/* SCREEN 4: DETAILED EXQUISITE RESULTS COMPONENT */}
          {screen === 'results' && (
            <motion.div
              id="results-screen"
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full text-right"
            >
              {/* Viewing Shared Plan Invitation Alert */}
              {isViewingSharedPlan && (
                <div className="p-6 border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/40 mb-8 rounded-2xl backdrop-blur-md text-right relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
                  <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-purple-400">
                        <Icons.Sparkles className="w-5 h-5 animate-pulse" />
                        <span className="text-sm font-bold font-mono uppercase tracking-wider">خطة عمل مستضافة ومشاركة 🌐</span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-100 mb-2 font-serif">
                        أنت تشاهد خطة العمل الاستراتيجية المخصصة لأحد المبدعين التقنيين!
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-light font-sans max-w-2xl">
                        لقد تم تصميم هذه المقترحات وخارطة الطريق الذكية بالكامل لمطابقة سماته وأهدافه الشخصية. يمكنك البدء فوراً في الاستبيان لتصميم نسختك المخصصة ومضاعفة مهاراتك مجاناً وبأعلى دقة!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsViewingSharedPlan(false);
                        setAnswers({});
                        setScreen("welcome");
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all text-xs font-bold text-slate-950 rounded-xl cursor-pointer flex items-center gap-2 font-mono active:scale-95"
                    >
                      <Icons.Play className="w-4 h-4 fill-current text-slate-950" />
                      <span>صمم خطتك الخاصة الآن // START SURVEY</span>
                    </button>
                  </div>
                </div>
              )}

              {/* User Profile matching summary badge header */}
              <div className="p-8 border border-slate-800/60 bg-slate-900/10 mb-10 rounded-2xl backdrop-blur-md">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                  <div>
                    <span className="text-[10px] text-cyan-400 font-mono tracking-widest block uppercase mb-2">
                      [ صياغة مخصصة استناداً لسماتك الشخصية ]
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mb-3 font-serif">
                      أفضل 5 فرص تشغيل متوافقة مع ملفك
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed max-w-2xl font-sans">
                      تمت تصفية هذه المقترحات المتميزة لتعمل بكفاءة مع وقت طاقة <span className="text-slate-200 font-medium">{QUESTIONS[1].options.find(o => o.value === answers.time)?.label || ""}</span>، 
                      وميزانية تشغيلية قدرها <span className="text-slate-200 font-medium">{QUESTIONS[2].options.find(o => o.value === answers.capital)?.label || ""}</span>.
                    </p>
                  </div>

                  {/* Share button block & Actions */}
                  <div className="flex flex-wrap gap-3 shrink-0">
                    <button
                      id="share-results-btn"
                      onClick={handleOpenShare}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-400/30 hover:border-cyan-400/80 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-indigo-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all duration-300 text-xs font-mono text-cyan-300 cursor-pointer active:scale-95 flex items-center gap-2 rounded-xl"
                    >
                      <Icons.Share2 size={12} />
                      <span>مشاركة النتيجة // SHARE</span>
                    </button>
                    
                    <button
                      id="retake-survey-btn"
                      onClick={() => {
                        setIsViewingSharedPlan(false);
                        resetSurvey();
                      }}
                      className="px-4 py-2 bg-slate-900/40 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 transition-all text-xs font-mono text-slate-300 cursor-pointer flex items-center gap-2 rounded-xl"
                    >
                      <RotateCcw size={12} />
                      <span>تعديل الاستبيان</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Interactive Filters & Controllers bar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 mb-8 border border-slate-800/60 p-5 bg-slate-950/40 backdrop-blur-md rounded-2xl">
                
                {/* Left hand Search Input */}
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                    <Icons.Search size={14} />
                  </span>
                  <input
                    id="search-hustles-input"
                    type="text"
                    placeholder="البحث بالكلمات الدليلية، الأدوات، أو فئات العمل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 bg-slate-900/40 border border-slate-800/80 focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-500/10 text-xs sm:text-sm placeholder-slate-500 text-slate-100 focus:outline-none transition-all font-sans rounded-xl"
                  />
                </div>

                {/* Right hand Category & Filter buttons */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                  {/* Difficulty selector */}
                  <div className="flex items-center gap-1 bg-slate-900/50 p-1 border border-slate-800/60 rounded-xl">
                    <span className="text-slate-500 px-2 text-[11px]">مستوى الصعوبة:</span>
                    <button
                      id="filter-diff-all"
                      onClick={() => setFilterDifficulty('all')}
                      className={`px-3 py-1 text-[11px] transition-all rounded-lg cursor-pointer ${
                        filterDifficulty === 'all' ? "bg-indigo-600/25 border border-indigo-500/30 text-cyan-400 font-bold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      id="filter-diff-beg"
                      onClick={() => setFilterDifficulty('مبتدئ')}
                      className={`px-3 py-1 text-[11px] transition-all rounded-lg cursor-pointer ${
                        filterDifficulty === 'مبتدئ' ? "bg-indigo-600/25 border border-indigo-500/30 text-cyan-400 font-bold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      سهل
                    </button>
                    <button
                      id="filter-diff-int"
                      onClick={() => setFilterDifficulty('متوسط')}
                      className={`px-3 py-1 text-[11px] transition-all rounded-lg cursor-pointer ${
                        filterDifficulty === 'متوسط' ? "bg-indigo-600/25 border border-indigo-500/30 text-cyan-400 font-bold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      متوسط
                    </button>
                    <button
                      id="filter-diff-exp"
                      onClick={() => setFilterDifficulty('محترف')}
                      className={`px-3 py-1 text-[11px] transition-all rounded-lg cursor-pointer ${
                        filterDifficulty === 'محترف' ? "bg-indigo-600/25 border border-indigo-500/30 text-cyan-400 font-bold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      صعب
                    </button>
                  </div>

                  {/* Capital selector */}
                  <div className="flex items-center gap-1 bg-slate-900/50 p-1 border border-slate-800/60 rounded-xl">
                    <span className="text-slate-500 px-2 text-[11px]">الميزانية المطلوبة:</span>
                    <button
                      id="filter-cap-all"
                      onClick={() => setFilterCapital('all')}
                      className={`px-3 py-1 text-[11px] transition-all rounded-lg cursor-pointer ${
                        filterCapital === 'all' ? "bg-indigo-600/25 border border-indigo-500/30 text-cyan-400 font-bold" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      id="filter-cap-free"
                      onClick={() => setFilterCapital('free')}
                      className={`px-3 py-1 text-[11px] transition-all rounded-lg cursor-pointer ${
                        filterCapital === 'free' ? "bg-indigo-600/25 border border-indigo-500/30 text-cyan-400 font-bold" : "text-slate-400 hover:text-cyan-200"
                      }`}
                    >
                      مجانية بالكامل
                    </button>
                    <button
                      id="filter-cap-med"
                      onClick={() => setFilterCapital('medium')}
                      className={`px-3 py-1 text-[11px] transition-all rounded-lg cursor-pointer ${
                        filterCapital === 'medium' ? "bg-indigo-600/25 border border-indigo-500/30 text-cyan-400 font-bold" : "text-slate-400 hover:text-cyan-200"
                      }`}
                    >
                      تبدأ باشتراك
                    </button>
                  </div>
                </div>
              </div>

              {/* No items fallback container */}
              {filteredResults.length === 0 && (
                <div className="text-center py-20 border border-zinc-900 bg-zinc-950 p-6">
                  <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-4 animate-pulse" />
                  <h4 className="text-lg font-bold text-slate-350 font-serif">لا توجد مشاريع مطابقة لمعايير التصفية الحالية</h4>
                  <p className="text-xs text-slate-550 mt-2 max-w-sm mx-auto leading-relaxed font-sans">
                    يرجى محاولة تغيير الكلمات الدليلية في محرك البحث المكتوب، أو تعديل شروط التصفية لتلقي كامل الفرص المقترحة مجدداً.
                  </p>
                </div>
              )}

              {/* Dynamic Hustles List */}
              <div className="flex flex-col gap-8">
                {filteredResults.map((hustle, idx) => {
                  const isFaved = savedHustlesList.includes(hustle.id);
                  const isOpen = viewingDetailId === hustle.id;
                  
                  return (
                    <motion.div
                      id={`hustle-card-${hustle.id}`}
                      key={hustle.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={`border transition-all duration-300 relative rounded-2xl overflow-hidden backdrop-blur-md ${
                        isOpen 
                          ? "bg-slate-900/40 border-slate-700/80 shadow-lg shadow-indigo-500/5" 
                          : "bg-slate-950/45 border-slate-900/85 hover:border-slate-800/80 hover:bg-slate-900/30 hover:shadow-lg hover:shadow-cyan-500/5"
                      }`}
                    >
                      {/* Premium gradient strip marker */}
                      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-400 to-indigo-500" />

                      {/* Header Summary Row of Hustle */}
                      <div className="p-6 md:p-10 flex flex-col md:flex-row items-stretch justify-between gap-6">
                        
                        <div className="flex items-start gap-5 flex-grow">
                          {/* Avatar/Indicator with slate style */}
                          <div className="p-3.5 bg-slate-900 border border-slate-800 text-cyan-400 shrink-0 relative rounded-xl">
                            <LucideIcon name={hustle.iconName} className="w-5 h-5" />
                          </div>

                          {/* Titles and Metrics */}
                          <div className="flex-grow">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                                {hustle.category}
                              </span>
                              <span className="text-slate-800 font-mono select-none">//</span>
                              <span className={`text-[10px] uppercase font-mono tracking-wider ${
                                hustle.difficulty === 'مبتدئ' 
                                  ? 'text-cyan-400' 
                                  : hustle.difficulty === 'متوسط'
                                  ? 'text-amber-500 font-medium'
                                  : 'text-rose-400 font-medium'
                              }`}>
                                مهارة: {hustle.difficulty}
                              </span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mb-3 font-serif hover:text-cyan-400 transition-colors cursor-pointer" onClick={() => setViewingDetailId(isOpen ? null : hustle.id)}>
                              {hustle.title}
                            </h3>

                            {/* Brief Desc */}
                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl font-light font-sans">
                              {hustle.description}
                            </p>
                          </div>
                        </div>

                        {/* Match Rate & Actions vertical box */}
                        <div className="flex items-center md:flex-col justify-between w-full md:w-auto shrink-0 gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-900 md:border-r md:border-slate-900 md:pr-8">
                          
                          {/* Compatibility Metric */}
                          <div className="text-right md:text-left self-stretch flex md:flex-col justify-between md:justify-start items-center md:items-start">
                            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">
                              نسبة التوافق الهيكلية
                            </span>
                            <div className="inline-flex items-baseline gap-1.5 bg-slate-900/40 border border-slate-800/85 px-3 py-1 rounded-lg">
                              <span className="font-mono text-xl font-black text-cyan-400">
                                %{hustle.score}
                              </span>
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            </div>
                          </div>

                          {/* Toggle Actions */}
                          <div className="flex items-center gap-3 w-full justify-end">
                            <button
                              id={`fav-btn-${hustle.id}`}
                              onClick={() => toggleFav(hustle.id)}
                              className={`p-2 transition-all cursor-pointer ${
                                isFaved 
                                  ? "text-rose-500" 
                                  : "text-slate-600 hover:text-slate-400"
                              }`}
                              title={isFaved ? "إزالة الحفظ" : "حفظ الفكرة"}
                            >
                              <Heart size={15} fill={isFaved ? "#f43f5e" : "none"} className={isFaved ? "text-rose-500 animate-pulse" : ""} />
                            </button>

                            <button
                              id={`detail-toggle-btn-${hustle.id}`}
                              onClick={() => setViewingDetailId(isOpen ? null : hustle.id)}
                              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-all text-xs font-mono tracking-widest text-slate-300 cursor-pointer rounded-xl"
                            >
                              {isOpen ? "إخفاء التفاصيل" : "عرض خطة العمل // PLAN"}
                            </button>
                          </div>

                        </div>

                      </div>

                      {/* Dropdown Expandable Section inside the same unified view */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            id={`details-panel-${hustle.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-950/80 border-t border-slate-900/60 px-6 py-8 md:px-10 md:py-10 rounded-b-2xl border-x border-b border-slate-900/40 shadow-[0_4px_30px_rgba(34,211,238,0.03)]"
                          >
                            <HustleActionPlan 
                              hustle={hustle} 
                              answers={answers} 
                              relevanceReason={hustle.bestFitReason} 
                            />
                            <div className="hidden">
                            {/* Best Fit explanation */}
                            <div className="p-6 border border-slate-800 bg-slate-950 mb-8 leading-relaxed relative rounded-xl">
                              <div className="absolute top-0 right-10 -translate-y-1/2 px-3 bg-slate-950 border-x border-slate-800 text-[10px] text-cyan-500/80 font-mono tracking-widest uppercase">
                                مبررات الملاءمة الاستراتيجية
                              </div>
                              <p className="text-slate-300 text-xs sm:text-sm font-light font-serif italic text-justify leading-relaxed">
                                « {hustle.bestFitReason} »
                              </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-right">
                              
                              {/* Left Columns: 3 Steps timeline */}
                              <div className="lg:col-span-7">
                                <h4 className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-6 pb-2 border-b border-slate-900 flex items-center gap-2 font-bold">
                                  <span>[ 01 // خطة ترويج وتدريب متسلسلة ]</span>
                                </h4>

                                <div className="flex flex-col gap-6 relative pr-1 pt-1">
                                  {/* Line in timeline */}
                                  <div className="absolute top-2 bottom-8 right-3 w-[1px] bg-zinc-900" />
                                  
                                  {hustle.steps.map((st, sidx) => (
                                    <div key={sidx} className="flex items-start gap-4 pr-1 relative">
                                      {/* Number block */}
                                      <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 z-10">
                                        {sidx + 1}
                                      </div>
                                      
                                      <div className="border border-zinc-900 bg-zinc-950/20 p-4 rounded-none flex-1 transition-all">
                                        <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-sans font-light">
                                          {st}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Right Columns: Suggested AI Tools & metrics */}
                              <div className="lg:col-span-5">
                                <h4 className="text-xs font-mono tracking-widest text-zinc-500 uppercase mb-6 pb-2 border-b border-zinc-900 flex items-center gap-2 font-bold">
                                  <span>[ 02 // حزمة البرمجيات المقترحة ]</span>
                                </h4>

                                <div className="flex flex-col gap-3">
                                  {hustle.tools.map((t, tid) => (
                                    <div key={tid} className="p-4 bg-zinc-950 border border-zinc-900 hover:border-zinc-850 transition-colors">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs sm:text-sm text-emerald-450 text-emerald-400 select-all font-mono">
                                          {t.name}
                                        </span>
                                        <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest font-bold">أداة معتمدة</span>
                                      </div>
                                      <p className="text-zinc-400 text-xs leading-relaxed font-light font-sans">
                                        {t.desc}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                {/* Dynamic micro metrics */}
                                <div className="mt-8 grid grid-cols-2 gap-4 bg-zinc-900/20 p-4 border border-zinc-900 text-xs">
                                  <div>
                                    <span className="text-[10px] text-zinc-500 font-mono block mb-1 uppercase tracking-wider">متطلب الوقت</span>
                                    <span className="font-bold text-zinc-200 flex items-center gap-2">
                                      <Clock size={12} className="text-zinc-500" />
                                      <span className="font-mono">{hustle.timeRequired}</span>
                                    </span>
                                  </div>
                                  
                                  <div>
                                    <span className="text-[10px] text-zinc-500 font-mono block mb-1 uppercase tracking-wider">الأرباح المتوقعة</span>
                                    <span className="font-bold text-emerald-400 flex items-center gap-2">
                                      <DollarSign size={13} className="text-emerald-500" />
                                      <span className="font-mono">{hustle.potentialEarnings}</span>
                                    </span>
                                  </div>
                                </div>

                              </div>

                            </div>
                            </div>

                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {/* End Card CTA */}
              <div className="mt-16 text-center max-w-xl mx-auto p-8 border border-zinc-900 bg-zinc-950">
                <Brain className="w-6 h-6 text-zinc-550 text-zinc-500 mx-auto mb-4 animate-pulse" />
                <h4 className="text-sm font-bold text-zinc-350 font-serif mb-2">الاستمرارية هي سر التمكين المالي</h4>
                <p className="text-zinc-500 text-xs leading-relaxed font-extralight font-sans">
                  تذكر دائماً أن أدوات الذكاء الاصطناعي تسهل التنفيذ بنسبة 90%، لكن بناء السمعة الرقمية، الرد على عملائك، وتطوير أسلوب تواصل راقٍ هي الجزء البشري الضروري لاستدامة وإنجاح تجارتك الجانبية.
                </p>
              </div>

            </motion.div>
          )}

          {/* SCREEN 5: PERSONAL FAVORITES DASHBOARD */}
          {screen === 'favorites' && (
            <motion.div
              id="favorites-screen"
              key="favorites"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full text-right"
            >
              {/* Profile / Stats Header card */}
              <div className="p-8 border border-zinc-900 bg-zinc-900/10 mb-10">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-mono tracking-widest block uppercase mb-2">
                      [ الملف الشخصي الموثق ومشاريع المستقبل المخططة ]
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 mb-3 font-serif">
                      لوحة المحفوظات للأعمال الجانبية الذكية
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed max-w-2xl font-sans">
                      أهلاً بك <span className="text-zinc-100 font-medium">{user?.displayName || user?.email || ""}</span>، تستعرض هنا خارطة الطريق وحزم برمجياتك المعتمدة المستقرة والجاهزة للإطلاق والتواصل.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      id="fav-dashboard-back-btn"
                      onClick={() => setScreen('welcome')}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all text-xs font-sans cursor-pointer flex items-center gap-2 border border-emerald-600"
                    >
                      <span>استكشاف مشاريع جديدة</span>
                      <ArrowRight size={14} />
                    </button>
                    
                    <button
                      id="fav-dashboard-signout-btn"
                      onClick={handleSignOut}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 transition-all text-xs font-mono text-zinc-400 cursor-pointer flex items-center gap-1.5"
                    >
                      <Icons.LogOut size={12} />
                      <span>خروج // LOGOUT</span>
                    </button>
                  </div>
                </div>

                {/* Dashboard Stats Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-zinc-900 text-right">
                  <div className="p-4 bg-zinc-950 border border-zinc-900">
                    <span className="text-[10px] text-zinc-550 font-mono tracking-widest block uppercase mb-1">إجمالي الأفكار المحفوظة</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-zinc-100 font-mono">{savedHustlesList.length}</span>
                      <span className="text-xs text-zinc-500">أفكار مخصصة</span>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-900">
                    <span className="text-[10px] text-zinc-550 font-mono tracking-widest block uppercase mb-1">المدخول الإجمالي المحتمل</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-emerald-400 font-mono">
                        ${savedHustlesList.reduce((acc, hId) => {
                          const template = HUSTLE_TEMPLATES.find(t => t.id === hId);
                          if (!template) return acc;
                          const matchMax = template.potentialEarnings.match(/([\d,]+)\s*\$/);
                          if (matchMax) {
                            const val = parseInt(matchMax[1].replace(/,/g, ''), 10);
                            return acc + (isNaN(val) ? 0 : val);
                          }
                          return acc;
                        }, 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-zinc-500">شهرياً (حد أقصى)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-900">
                    <span className="text-[10px] text-zinc-550 font-mono tracking-widest block uppercase mb-1">تقنيات الأتمتة المعتمدة</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-indigo-400 font-mono">
                        {savedHustlesList.reduce((acc, hId) => {
                          const template = HUSTLE_TEMPLATES.find(t => t.id === hId);
                          if (!template) return acc;
                          return acc + template.tools.length;
                        }, 0)}
                      </span>
                      <span className="text-xs text-zinc-500">أدوات ذكية مدمجة</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saved list items */}
              {savedHustlesList.length === 0 ? (
                <div className="text-center py-24 border border-slate-900/60 bg-slate-950 p-6 max-w-xl mx-auto rounded-2xl">
                  <Icons.FolderHeart className="w-12 h-12 text-slate-650 mx-auto mb-4 animate-bounce shrink-0 text-slate-650" />
                  <h4 className="text-lg font-bold text-slate-350 font-serif">لا توجد أعمال محفوظة في حسابك بعد</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans mb-8">
                    ملف الأفكار المخصص مغلق حالياً. قم بإنهاء استبيان التوافق التقني والذكاء لفرز المشاريع وحفظ مفضلاتك بضغطة زر واحدة.
                  </p>
                  <button
                    id="find-hustles-empty-btn"
                    onClick={() => {
                        setAnswers({});
                        setCurrentStep(0);
                        setScreen('survey');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold transition-all text-xs font-sans cursor-pointer inline-flex items-center gap-2 border border-indigo-500/40 rounded-xl hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  >
                    <span>ابدأ استبيان ومطابقة الأعمال</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {HUSTLE_TEMPLATES.filter(h => savedHustlesList.includes(h.id)).map((hustle, idx) => {
                    const isOpen = viewingDetailId === hustle.id;

                    const userAnswersReason = answers?.field ? calculateHustles(answers).find(r => r.id === hustle.id)?.bestFitReason : null;
                    const relevanceReason = userAnswersReason || "تتوافق مع تفضيلاتك وسرعة إتقان لغات البرمجة والجماليات الخوارزمية.";
                    
                    return (
                      <motion.div
                        id={`fav-hustle-card-${hustle.id}`}
                        key={hustle.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border transition-all duration-300 relative rounded-2xl overflow-hidden backdrop-blur-md ${
                          isOpen 
                            ? "bg-slate-900/40 border-slate-700/80 shadow-lg shadow-indigo-500/5" 
                            : "bg-slate-950/45 border-slate-900/85 hover:border-slate-800/80 hover:bg-slate-900/30 hover:shadow-lg hover:shadow-cyan-500/5"
                        }`}
                      >
                        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-400 to-indigo-500" />

                        <div className="p-6 md:p-10 flex flex-col md:flex-row items-stretch justify-between gap-6">
                          
                          <div className="flex items-start gap-5 flex-grow">
                            <div className="p-3.5 bg-slate-900 border border-slate-800 text-cyan-400 shrink-0 rounded-xl">
                              <LucideIcon name={hustle.iconName} className="w-5 h-5" />
                            </div>

                            <div className="flex-grow">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                                  {hustle.category}
                                </span>
                                <span className="text-slate-800 font-mono select-none">//</span>
                                <span className={`text-[10px] uppercase font-mono tracking-wider ${
                                  hustle.difficulty === 'مبتدئ' 
                                    ? 'text-cyan-400' 
                                    : hustle.difficulty === 'متوسط'
                                    ? 'text-amber-500 font-medium'
                                    : 'text-rose-400 font-medium'
                                }`}>
                                  مهارة: {hustle.difficulty}
                                </span>
                              </div>

                              <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mb-3 font-serif hover:text-cyan-400 transition-colors cursor-pointer" onClick={() => setViewingDetailId(isOpen ? null : hustle.id)}>
                                {hustle.title}
                              </h3>

                              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl font-light font-sans">
                                {hustle.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center md:flex-col justify-between w-full md:w-auto shrink-0 gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-900 md:border-r md:border-slate-900 md:pr-8">
                            
                            <div className="text-right md:text-left self-stretch flex md:flex-col justify-between md:justify-start items-center md:items-start w-full">
                              <span className="text-[10px] text-slate-550 font-mono tracking-widest uppercase mb-1">الأرباح المتوقعة</span>
                              <span className="font-mono text-lg font-bold text-cyan-400">{hustle.potentialEarnings}</span>
                            </div>

                            <div className="flex items-center gap-3 w-full justify-end">
                              <button
                                id={`fav-btn-unfav-${hustle.id}`}
                                onClick={() => toggleFav(hustle.id)}
                                className="p-2 text-rose-500 hover:text-rose-400 transition-all cursor-pointer"
                                title="إزالة من المحفوظات"
                              >
                                <Icons.Heart size={15} fill="#f43f5e" className="text-rose-500 animate-pulse" />
                              </button>

                              <button
                                id={`fav-detail-toggle-${hustle.id}`}
                                onClick={() => setViewingDetailId(isOpen ? null : hustle.id)}
                                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-all text-xs font-mono tracking-widest text-slate-300 cursor-pointer rounded-xl"
                              >
                                {isOpen ? "إخفاء التفاصيل" : "عرض خطة العمل // PLAN"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Expandable Section */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              id={`fav-details-panel-${hustle.id}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-slate-950/80 border-t border-slate-950 px-6 py-8 md:px-10 md:py-10 rounded-b-2xl border-x border-b border-slate-900/40 shadow-[0_4px_30px_rgba(34,211,238,0.03)]"
                            >
                              <HustleActionPlan 
                                hustle={hustle} 
                                answers={answers} 
                                relevanceReason={relevanceReason} 
                              />
                              <div className="hidden">
                              <div className="p-6 border border-slate-800 bg-slate-950 mb-8 leading-relaxed relative rounded-xl">
                                <div className="absolute top-0 right-10 -translate-y-1/2 px-3 bg-slate-950 border-x border-slate-800 text-[10px] text-cyan-500/80 font-mono tracking-widest uppercase">
                                  مبررات الملاءمة الاستراتيجية
                                </div>
                                <p className="text-slate-300 text-xs sm:text-sm font-light font-serif italic text-justify leading-relaxed">
                                  « {relevanceReason} »
                                </p>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-right">
                                <div className="lg:col-span-7">
                                  <h4 className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-6 pb-2 border-b border-slate-900 flex items-center gap-2 font-bold">
                                    <span>[ 01 // خطة ترويج وتدريب متسلسلة ]</span>
                                  </h4>

                                  <div className="flex flex-col gap-6 relative pr-1 pt-1">
                                    <div className="absolute top-2 bottom-8 right-3 w-[1px] bg-slate-900" />
                                    {hustle.steps.map((st, sidx) => (
                                      <div key={sidx} className="flex items-start gap-4 pr-1 relative">
                                        <div className="w-6 h-6 bg-slate-900 border border-slate-800 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 z-10 rounded-lg">
                                          {sidx + 1}
                                        </div>
                                        <div className="border border-slate-900/60 bg-slate-950/20 p-4 rounded-xl flex-1 transition-all">
                                          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans font-light">
                                            {st}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="lg:col-span-5">
                                  <h4 className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-6 pb-2 border-b border-slate-900 flex items-center gap-2 font-bold">
                                    <span>[ 02 // حزمة البرمجيات المقترحة ]</span>
                                  </h4>

                                  <div className="flex flex-col gap-3">
                                    {hustle.tools.map((t, tid) => (
                                      <div key={tid} className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors rounded-xl">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-bold text-xs sm:text-sm text-cyan-400 select-all font-mono">
                                            {t.name}
                                          </span>
                                          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest font-bold">أداة معتمدة</span>
                                        </div>
                                        <p className="text-slate-400 text-xs leading-relaxed font-light font-sans">
                                          {t.desc}
                                        </p>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="mt-8 grid grid-cols-2 gap-4 bg-slate-900/10 p-4 border border-slate-850/60 text-xs rounded-xl">
                                    <div>
                                      <span className="text-[10px] text-slate-500 font-mono block mb-1 uppercase tracking-wider">متطلب الوقت</span>
                                      <span className="font-bold text-slate-200 flex items-center gap-2">
                                        <Clock size={12} className="text-slate-550" />
                                        <span className="font-mono">{hustle.timeRequired}</span>
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-500 font-mono block mb-1 uppercase tracking-wider">الأرباح المتوقعة</span>
                                      <span className="font-bold text-cyan-400 flex items-center gap-2">
                                        <DollarSign size={13} className="text-cyan-500" />
                                        <span className="font-mono">{hustle.potentialEarnings}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* SCREEN 6: SHARED PLAN DISPLAY SCREEN */}
          {screen === 'shared-plan' && currentSharedPlanId && (
            <PlanDisplay
              planId={currentSharedPlanId}
              onRestart={() => {
                setAnswers({});
                setCurrentStep(0);
                setIsViewingSharedPlan(false);
                setScreen('welcome');
              }}
              calculateHustles={calculateHustles}
              QUESTIONS={QUESTIONS}
            />
          )}

        </AnimatePresence>

      </main>

      {/* AUTHENTICATION / SIGN IN MODAL PROMPT */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-850 p-8 max-w-sm w-full relative text-right rounded-2xl shadow-xl shadow-indigo-500/10"
            >
              {/* Close Button */}
              <button
                id="close-auth-modal-btn"
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 left-4 p-1.5 border border-slate-800/85 text-slate-400 hover:text-white transition-colors rounded-xl cursor-pointer"
              >
                <Icons.X size={14} />
              </button>

              <div className="text-center mb-8 mt-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-100 font-serif">تسجيل الدخول المستقر للملف</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                  قم بربط حسابك لحفظ أعمالك الجانبية المفضلة وحفظ خطط العمل التفصيلية وحزمة برمجيات عام 2026 ضمن لوحة التحكم الخاصة بك.
                </p>
              </div>

              <div className="flex flex-col gap-4 font-sans">
                <button
                  id="google-signin-popup-btn"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50 rounded-xl"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>الدخول الفوري عبر Google</span>
                </button>
                
                <div className="text-[10px] text-slate-500 text-center font-mono">
                  SECURED BY FIREBASE AUTHENTICATION // SHA-256
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SocialShare
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        answers={answers}
        isSavingPlan={isSavingPlan}
        sharingId={sharingId}
        QUESTIONS={QUESTIONS}
      />

      {/* Styled Footer */}
      <footer className="border-t border-slate-900 py-10 mt-20 bg-slate-950 text-slate-500 text-center font-mono text-[11px] tracking-wide">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>AI Assist Pro // جميع الحقوق محفوظة لعام 2026 ©</span>
          <div className="flex gap-4">
            <span className="hover:text-cyan-400 cursor-pointer transition-colors" onClick={resetSurvey}>شروط الخدمة</span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors" onClick={resetSurvey}>سياسة الخصوصية</span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors" onClick={resetSurvey}>النموذج الخوارزمي</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

// Minimal placeholder icons to prevent compile issues if they aren't imported explicitly
function Zap(props: any) { return <Icons.Zap {...props} />; }
function Laptop(props: any) { return <Icons.Laptop {...props} />; }
function Search(props: any) { return <Icons.Search {...props} />; }
function Heart(props: any) { return <Icons.Heart {...props} />; }

