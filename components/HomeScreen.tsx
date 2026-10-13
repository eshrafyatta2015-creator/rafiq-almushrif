import React from 'react';
import {
  FilePlus2,
  Clock3,
  Database,
  Settings,
  Sparkles,
  Mic,
  FileDown,
  Share2,
  ArrowLeft,
  CloudOff,
  HelpCircle,
  DatabaseBackup,
  ClipboardCheck,
} from 'lucide-react';

interface HomeScreenProps {
  hasDraft: boolean;
  draftSavedAt: number | null;
  archiveCount: number;
  aiServerConfigured: boolean;
  onNewReport: () => void;
  onContinueDraft: () => void;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
};

const HomeScreen: React.FC<HomeScreenProps> = ({
  hasDraft,
  draftSavedAt,
  archiveCount,
  aiServerConfigured,
  onNewReport,
  onContinueDraft,
  onOpenArchive,
  onOpenSettings,
  onOpenHelp,
}) => {
  const features = [
    { icon: <Sparkles size={18} />, text: 'تحليل ذكي للمجرييات' },
    { icon: <Mic size={18} />, text: 'إملاء صوتي عربي' },
    { icon: <ClipboardCheck size={18} />, text: 'تقدير عام بالحروف' },
    { icon: <FileDown size={18} />, text: 'تصدير PDF و Excel' },
    { icon: <Share2 size={18} />, text: 'مشاركة التقارير' },
    { icon: <DatabaseBackup size={18} />, text: 'نسخ احتياطي واستعادة' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* البطاقة الرئيسية */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-8 md:p-12 text-white shadow-2xl shadow-blue-900/30 no-print">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -right-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <span className="chip bg-white/15 border-white/20 text-blue-100">
              <Sparkles size={14} /> إشراف تربوي مدعوم بالذكاء الاصطناعي
            </span>
            <h2 className="text-3xl md:text-4xl font-black leading-tight">
              أنشئ تقرير زيارة صفية
              <br />
              خلال دقائق
            </h2>
            <p className="text-blue-100/90 font-bold text-sm md:text-base leading-relaxed max-w-xl">
              أدخل بيانات المعلم والحصة، وصف المجريات (كتابةً أو صوتيًا)، دع الذكاء الاصطناعي
              يبني التحليل الوصفي ويقدّر علامات الأداء، ثم صدّر التقرير الرسمي بصيغة PDF أو Excel.
            </p>
          </div>
          <button
            onClick={onNewReport}
            className="group flex items-center justify-center gap-3 bg-white text-blue-800 font-black px-8 py-5 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-100 transition-all text-lg flex-shrink-0"
          >
            <FilePlus2 size={24} />
            تقرير جديد
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* بطاقات الإجراءات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {hasDraft && (
          <button
            onClick={onContinueDraft}
            className="text-right bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:-translate-y-1 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-3.5 bg-amber-100 text-amber-700 rounded-2xl group-hover:scale-110 transition-transform">
                <Clock3 size={26} />
              </div>
              <span className="chip bg-amber-50 border-amber-200 text-amber-700">مسودة</span>
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">متابعة المسودة</h3>
            <p className="mt-1 text-xs font-bold text-slate-500 leading-relaxed">
              {draftSavedAt ? `آخر حفظ تلقائي: ${timeAgo(draftSavedAt)}` : 'استئناف التقرير المحفوظ'}
            </p>
          </button>
        )}

        <button
          onClick={onOpenArchive}
          className="text-right bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:-translate-y-1 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="p-3.5 bg-blue-100 text-blue-700 rounded-2xl group-hover:scale-110 transition-transform">
              <Database size={26} />
            </div>
            <span className="chip bg-blue-50 border-blue-200 text-blue-700">
              {archiveCount} سجل
            </span>
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-900">الأرشيف المحفوظ</h3>
          <p className="mt-1 text-xs font-bold text-slate-500 leading-relaxed">
            استرجاع التقارير المحفوظة على الجهاز حسب رقم هوية المعلم
          </p>
        </button>

        <button
          onClick={onOpenSettings}
          className="text-right bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:-translate-y-1 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="p-3.5 bg-slate-100 text-slate-700 rounded-2xl group-hover:scale-110 transition-transform">
              <Settings size={26} />
            </div>
            {!aiServerConfigured && (
              <span className="chip bg-red-50 border-red-200 text-red-600">
                <CloudOff size={13} /> الخادم غير مضبوط
              </span>
            )}
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-900">الإعدادات</h3>
          <p className="mt-1 text-xs font-bold text-slate-500 leading-relaxed">
            رابط الخادم الذكي، الخط الافتراضي، النسخ الاحتياطي وبيانات المشرف
          </p>
        </button>

        <button
          onClick={onOpenHelp}
          className="text-right bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:-translate-y-1 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="p-3.5 bg-violet-100 text-violet-700 rounded-2xl group-hover:scale-110 transition-transform">
              <HelpCircle size={26} />
            </div>
            <span className="chip bg-violet-50 border-violet-200 text-violet-700">دليل</span>
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-900">المساعدة والدليل</h3>
          <p className="mt-1 text-xs font-bold text-slate-500 leading-relaxed">
            خمس خطوات سريعة لإصدار تقرير مكتمل + نصائح الاستخدام والنسخ الاحتياطي
          </p>
        </button>
      </div>

      {/* المميزات */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/60 p-6 md:p-8 no-print">
        <h3 className="font-black text-slate-900 text-lg mb-5">مزايا رفيق المشرف</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {features.map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-700"
            >
              <span className="text-blue-600 flex-shrink-0">{f.icon}</span>
              <span className="text-xs font-black">{f.text}</span>
            </div>
          ))}
        </div>
        {!aiServerConfigured && (
          <div className="mt-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <CloudOff size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-amber-800 leading-relaxed">
              الميزات الذكية (تحليل المجريات وتقدير العلامات) تحتاج إلى خادم «رفيق المشرف»
              ومفتاح Gemini API. اضبط رابط الخادم من <strong>الإعدادات</strong> لتفعيلها، ويمكنك
              إكمال التقرير يدويًا دونها.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
