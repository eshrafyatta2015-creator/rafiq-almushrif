/* أدوات مساعدة عامة */

/** تحويل الأرقام العربية/الفارسية إلى أرقام إنجليزية */
export const normalizeDigits = (value: string): string => {
  return String(value ?? '')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
};

/** أرقام بصيغة موحدة (إنجليزية) لاستخدامها في الحقول الرقمية */
export const toPlainDigits = (value: string): string =>
  normalizeDigits(value).replace(/[^\d]/g, '');

const TEENS: Record<number, string> = {
  10: 'عشرة',
  11: 'أحد عشر',
  12: 'اثنا عشر',
  13: 'ثلاثة عشر',
  14: 'أربعة عشر',
  15: 'خمسة عشر',
  16: 'ستة عشر',
  17: 'سبعة عشر',
  18: 'ثمانية عشر',
  19: 'تسعة عشر',
};

const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const TENS = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS = [
  '',
  'مئة',
  'مئتان',
  'ثلاثمائة',
  'أربعمائة',
  'خمسمائة',
  'ستمائة',
  'سبعمائة',
  'ثمانمائة',
  'تسعمائة',
];

/** تحويل عدد (0-100) إلى كلمات عربية — للتقرير الرسمي "المجموع بالحروف" */
export const numberToArabicWords = (value: number): string => {
  const n = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  if (n === 0) return 'صفر درجة';
  if (n === 100) return 'مئة درجة';

  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;

  if (h === 1) parts.push('مئة');
  else if (h === 2) parts.push('مئتان');
  else if (h > 2) parts.push(HUNDREDS[h]);

  if (rest > 0) {
    if (rest < 20) {
      parts.push(rest === 1 ? 'واحد' : rest === 2 ? 'اثنان' : TEENS[rest]);
    } else {
      const t = Math.floor(rest / 10);
      const o = rest % 10;
      parts.push(o > 0 ? `${ONES[o]} و${TENS[t]}` : TENS[t]);
    }
  }

  return parts.join(' و') + ' درجة';
};

export interface GradeInfo {
  label: string;
  hint: string;
  className: string;
}

/** التقدير العام حسب المجموع الكلي من 100 */
export const gradeForScore = (total: number): GradeInfo => {
  const t = Number(total) || 0;
  if (t >= 90) return { label: 'ممتاز', hint: 'أداء تربوي متميز', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (t >= 80) return { label: 'جيد جدًا', hint: 'أداء قوي مع فرص تحسين محدودة', className: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (t >= 70) return { label: 'جيد', hint: 'أداء جيد يحتاج دعمًا موجهًا', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  if (t >= 60) return { label: 'مقبول', hint: 'يحتاج خطة تطوير مهني', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'يحتاج تحسينًا', hint: 'يلزم برنامج تأهيل مدعم', className: 'bg-red-50 text-red-600 border-red-200' };
};

/** ملخص نصي للتقرير — يُستخدم في المشاركة عبر التطبيقات */
export const buildReportSummary = (report: any, total: number, grade: string): string => {
  const lines = [
    'تقرير الزيارة الإشرافية الصفية — رفيق المشرف الذكي',
    '──────────────────────',
    `المديرية: ${report.directorate || '—'}`,
    `المدرسة: ${report.school || '—'}`,
    `المعلم/ة: ${report.teacher.name || '—'} (هوية: ${report.teacher.idNumber || '—'})`,
    `المبحث: ${report.visit.subject || '—'} | الصف: ${report.visit.classSection || '—'} | الحصة: ${report.visit.period || '—'}`,
    `تاريخ الزيارة: ${report.visit.date || '—'} | النوع: ${report.visit.type || '—'}`,
    '',
    'أبرز نقاط القوة:',
    report.content.positives || '—',
    '',
    'جوانب التطوير:',
    report.content.improvements || '—',
    '',
    'توصيات للمعلم/ة:',
    report.content.teacherRecommendations || '—',
    '',
    `المجموع: ${total}/100 (${numberToArabicWords(total)}) — التقدير العام: ${grade}`,
    `المشرف التربوي: ${report.supervisorName || '—'}`,
  ];
  return lines.join('\n');
};

export const isNativeApp = (): boolean =>
  typeof window !== 'undefined' && Boolean((window as any).Capacitor?.isNativePlatform?.());

export const isValidHttpUrl = (url: string): boolean => {
  const u = (url || '').trim();
  if (!u) return true;
  return /^https?:\/\/[^\s]+$/i.test(u);
};
