import React from 'react';
import {
  X,
  UserRound,
  MessageSquareText,
  Sparkles,
  ClipboardCheck,
  FileDown,
  Lightbulb,
  DatabaseBackup,
} from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    icon: <UserRound size={20} />,
    title: '1. بيانات المعلم والمدرسة',
    body: 'املأ بيانات المديرية والمدرسة والمعلم (رقم الهوية والمبحث والصف)، ورقم الزيارة وتاريخها ونوعها. الحقول المعلّمة بعلامة «مطلوب» يجب إكمالها قبل الانتقال.',
  },
  {
    icon: <MessageSquareText size={20} />,
    title: '2. مجريات الحصة',
    body: 'صف ما جرى في الحصة كتابةً أو بالضغط على «إملاء صوتي» وتحرير النص. يمكنك ترك الحقل فارغًا إذا كنت ستكتب التحليل بنفسك.',
  },
  {
    icon: <Sparkles size={20} />,
    title: '3. التحليل الذكي',
    body: 'اضغط «تحليل ذكي» لبناء نقاط القوة وجوانب التطوير والتوصيات من مجرييات الحصة، ثم عدّل النص كما تشاء. وضع «التقدير الذكي» يقترح علامات المؤشرات.',
  },
  {
    icon: <ClipboardCheck size={20} />,
    title: '4. علامات الأداء والاعتماد',
    body: 'راجع علامات المؤشرات (يُحدَّد كل منها بقيمته القصوى تلقائيًا)، وتحقّق من المجموع الكلي والتقدير العام، ثم اضغط «اعتماد التقرير».',
  },
  {
    icon: <FileDown size={20} />,
    title: '5. التصدير والمشاركة',
    body: 'صدّر التقرير بصيغة PDF (قالب رسمي) أو Excel (دفتر علامات وتحليل وصفي)، أو انسخ ملخصًا نصيًا للمشاركة عبر واتساب.',
  },
];

const TIPS = [
  'يُحفظ كل شيء تلقائيًا على الجهاز؛ يمكنك إغلاق التطبيق والمتابعة لاحقًا من «متابعة المسودة».',
  'الأرشيف يحتفظ بآخر 100 تقرير ويمكن البحث فيه برقم هوية المعلم أو اسمه أو المدرسة.',
  'من «الإعدادات ← النسخ الاحتياطي» يمكنك تصدير كل بياناتك كملف واستعادتها على جهاز آخر.',
  'الإملاء الصوتي يعمل في المتصفح (Chrome/Edge) وقد لا يعمل داخل تطبيق أندرويد.',
  'الميزات الذكية تحتاج خادم «رفيق المشرف» مضبوطًا في الإعدادات، وباقي التطبيق يعمل دون إنترنت.',
];

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 no-print">
    <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeInScale">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
            <Lightbulb size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">دليل الاستخدام السريع</h3>
            <p className="text-xs font-bold text-slate-500">خمس خطوات لإصدار تقرير زيارة مكتمل</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
          aria-label="إغلاق"
        >
          <X size={22} />
        </button>
      </div>

      <ol className="space-y-4">
        {STEPS.map((s) => (
          <li
            key={s.title}
            className="flex gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4"
          >
            <span className="p-2.5 bg-white text-blue-700 rounded-xl border border-slate-100 flex-shrink-0 h-fit">
              {s.icon}
            </span>
            <div>
              <h4 className="font-black text-slate-900 text-sm">{s.title}</h4>
              <p className="text-xs font-bold text-slate-600 leading-relaxed mt-1">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h4 className="font-black text-blue-900 text-sm flex items-center gap-2 mb-3">
          <DatabaseBackup size={16} /> نصائح مهمة
        </h4>
        <ul className="space-y-2">
          {TIPS.map((t) => (
            <li
              key={t}
              className="text-xs font-bold text-blue-900/90 leading-relaxed flex gap-2"
            >
              <span className="text-blue-500 flex-shrink-0">•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={onClose} className="btn-primary w-full mt-6">
        فهمت، ابدأ
      </button>
    </div>
  </div>
);

export default HelpModal;
