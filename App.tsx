import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Users,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader2,
  FileDown,
  TrendingUp,
  ClipboardList,
  Share2,
  Copy,
  Info,
  ZoomIn,
  ZoomOut,
  Type as TypeIcon,
  FileSpreadsheet,
  Database,
  Search,
  Save,
  X,
  AlertTriangle,
  Home,
  Settings as SettingsIcon,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { INITIAL_REPORT, PALESTINE_LOGO_SVG, PERFORMANCE_INDICATORS } from './constants';
import { ReportData } from './types';
import SpeechInput from './components/SpeechInput';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import Toast, { ToastState } from './components/Toast';
import SettingsModal from './components/SettingsModal';
import ArchiveModal from './components/ArchiveModal';
import HelpModal from './components/HelpModal';
import { analyzeProceedings, analyzePerformance } from './services/geminiService';
import {
  numberToArabicWords,
  gradeForScore,
  buildReportSummary,
  toPlainDigits,
} from './services/utils';
import {
  AppSettings,
  clearDraft,
  loadArchive,
  loadDraft,
  loadSettings,
  saveDraft,
  saveSettings,
} from './services/storage';

const ARABIC_FONTS = [
  { name: 'Tajawal', label: 'تجوال (عصري)' },
  { name: 'Cairo', label: 'كايو (هندسي)' },
  { name: 'Almarai', label: 'المراعي (ناعم)' },
  { name: 'Amiri', label: 'الأميري (رسمي كلاسيكي)' },
  { name: 'El Messiri', label: 'المسيري (فني)' },
];

const STEP1_FIELDS = [
  { path: 'directorate', label: 'مديرية التربية والتعليم' },
  { path: 'school', label: 'المدرسة' },
  { path: 'teacher.name', label: 'اسم المعلم/ة' },
  { path: 'teacher.idNumber', label: 'رقم هوية المعلم' },
  { path: 'visit.subject', label: 'المبحث' },
  { path: 'visit.classSection', label: 'الصف/الشعبة' },
  { path: 'visit.date', label: 'تاريخ الزيارة' },
];

const App: React.FC = () => {
  const [view, setView] = useState<'splash' | 'home' | 'wizard'>('splash');
  const [afterSplash, setAfterSplash] = useState<'home' | 'wizard'>('home');
  const [step, setStep] = useState(1);
  const [report, setReport] = useState<ReportData>(INITIAL_REPORT);
  const [selectedFont, setSelectedFont] = useState('Tajawal');
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [archiveCount, setArchiveCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [zoomLevel, setZoomLevel] = useState(0.75);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<ToastState | null>(null);

  const isNative =
    typeof window !== 'undefined' && Boolean((window as any).Capacitor?.isNativePlatform?.());

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' | 'loading') => {
    setToast({ msg, type, id: Date.now() });
  }, []);

  const encodeData = (data: any) => {
    const json = JSON.stringify({ ...data, selectedFont });
    return btoa(unescape(encodeURIComponent(json)));
  };

  const decodeData = (base64: string) => {
    try {
      const json = decodeURIComponent(escape(atob(base64)));
      return JSON.parse(json);
    } catch (e) {
      console.error('Failed to decode shared data', e);
      return null;
    }
  };

  useEffect(() => {
    setArchiveCount(loadArchive().length);
    setDraftSavedAt(loadDraft()?.savedAt ?? null);
    document.body.style.fontFamily = `'${settings.font}', sans-serif`;
    setSelectedFont(settings.font);

    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('report');
    if (sharedData) {
      const decoded = decodeData(sharedData);
      if (decoded) {
        const { selectedFont: font, ...reportData } = decoded;
        setReport(reportData);
        if (font) setSelectedFont(font);
        setIsReadOnly(true);
        setStep(5);
        setAfterSplash('wizard');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.fontFamily = `'${selectedFont}', sans-serif`;
  }, [selectedFont]);

  // حفظ تلقائي للمسودة أثناء العمل
  useEffect(() => {
    if (view !== 'wizard' || isReadOnly) return;
    const t = setTimeout(() => {
      saveDraft(report, selectedFont, step);
      setDraftSavedAt(Date.now());
    }, 700);
    return () => clearTimeout(t);
  }, [report, selectedFont, step, view, isReadOnly]);

  // تنبيهات تغيّر حالة الاتصال
  useEffect(() => {
    const onOffline = () =>
      showToast('انقطع الاتصال بالإنترنت — يمكنك متابعة العمل وحفظ البيانات محليًا.', 'error');
    const onOnline = () => showToast('عاد الاتصال بالإنترنت', 'success');
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [showToast]);

  const handleShare = () => {
    if (isNative) {
      showToast(
        'رابط المشاركة متاح في نسخة الويب من التطبيق. في نسخة Android استخدم أزرار التصدير PDF/Excel.',
        'info'
      );
      return;
    }
    const encoded = encodeData(report);
    const url = `${window.location.origin}${window.location.pathname}?report=${encoded}`;
    setShareUrl(url);
    setShowShareModal(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('تم نسخ رابط المشاركة بنجاح', 'success');
    } catch {
      showToast('تعذر النسخ تلقائيًا، انسخ الرابط يدويًا.', 'error');
    }
  };

  const updateReport = (path: string, value: any) => {
    if (isReadOnly) return;
    const keys = path.split('.');
    setReport((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      let current = next;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return next;
    });
    if (fieldErrors[path]) {
      setFieldErrors((prev) => ({ ...prev, [path]: false }));
    }
  };

  const getValueByPath = (path: string): any => {
    return path.split('.').reduce((acc: any, k) => (acc == null ? acc : acc[k]), report);
  };

  const validateStep = (n: number): string[] => {
    const missing: string[] = [];
    const errs: Record<string, boolean> = {};
    if (n === 1) {
      STEP1_FIELDS.forEach((f) => {
        const v = String(getValueByPath(f.path) ?? '').trim();
        if (!v) {
          missing.push(f.label);
          errs[f.path] = true;
        }
      });
    }
    if (n === 2 && (report.content.proceedings || '').trim().length < 15) {
      missing.push('وصف مجريات الحصة (١٥ حرفًا على الأقل)');
    }
    if (n === 4 && !(report.supervisorName || '').trim()) {
      missing.push('اسم المشرف التربوي');
      errs['supervisorName'] = true;
    }
    setFieldErrors(errs);
    return missing;
  };

  const handleNext = () => {
    const missing = validateStep(step);
    if (missing.length > 0) {
      showToast(`الحقول الناقصة: ${missing.join('، ')}`, 'error');
      return;
    }
    setErrorMessage(null);
    setStep((prev) => Math.min(5, prev + 1));
  };

  const handlePrev = () => {
    setFieldErrors({});
    setStep((prev) => Math.max(1, prev - 1));
  };

  const startNewReport = () => {
    const base = JSON.parse(JSON.stringify(INITIAL_REPORT));
    base.directorate = settings.profile.directorate || '';
    base.school = settings.profile.school || '';
    base.supervisorName = settings.profile.supervisorName || '';
    setReport(base);
    setSelectedFont(settings.font);
    setIsReadOnly(false);
    setFieldErrors({});
    setErrorMessage(null);
    setStep(1);
    setView('wizard');
  };

  const continueDraft = () => {
    const d = loadDraft();
    if (!d) {
      showToast('لا توجد مسودة محفوظة.', 'info');
      setDraftSavedAt(null);
      return;
    }
    setReport(d.report);
    setSelectedFont(d.font || settings.font);
    setIsReadOnly(false);
    setStep(Math.min(Math.max(d.step || 1, 1), 5));
    setView('wizard');
    showToast('تم فتح المسودة المحفوظة', 'success');
  };

  const goHome = () => {
    if (isReadOnly) return;
    setView('home');
    setArchiveCount(loadArchive().length);
    setDraftSavedAt(loadDraft()?.savedAt ?? null);
  };

  const handleAIAnalysis = async () => {
    if (!report.content.proceedings) {
      showToast('الرجاء إدخال وصف مجريات الحصة أولاً.', 'error');
      return;
    }
    setIsAnalyzing(true);
    setErrorMessage(null);
    showToast('جاري التحليل الذكي لمجريات الحصة...', 'loading');
    try {
      const results = await analyzeProceedings(report.content.proceedings);
      setReport((prev) => ({
        ...prev,
        content: { ...prev.content, ...results },
      }));
      showToast('اكتمل التحليل الذكي بنجاح', 'success');
      setStep(3);
    } catch (error: any) {
      console.error('AI Analysis failed:', error);
      const msg = error?.message || 'عذراً، فشل التحليل الذكي. يرجى المحاولة مرة أخرى.';
      setErrorMessage(msg);
      showToast('فشل التحليل الذكي — راجع التنبيه أعلى الشاشة.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAIScoring = async () => {
    setIsScoring(true);
    setErrorMessage(null);
    showToast('جاري تقدير علامات الأداء...', 'loading');
    try {
      const scores = await analyzePerformance(report.content);
      const clamped: Record<string, number> = {};
      Object.entries(scores || {}).forEach(([id, value]) => {
        const max = PERFORMANCE_INDICATORS.find((i) => i.id === id)?.max ?? 100;
        clamped[id] = Math.max(0, Math.min(max, Number(value) || 0));
      });
      setReport((prev) => ({ ...prev, scores: { ...prev.scores, ...clamped } }));
      showToast('تم تقدير العلامات بنجاح', 'success');
      setStep(4);
    } catch (error: any) {
      console.error('AI Scoring failed:', error);
      const msg = error?.message || 'عذراً، حدث خطأ أثناء تقدير العلامات الذكي.';
      setErrorMessage(msg);
      showToast('فشل تقدير العلامات — راجع التنبيه أعلى الشاشة.', 'error');
    } finally {
      setIsScoring(false);
    }
  };

  const calculateTotal = (): number => {
    let total = 0;
    Object.values(report.scores).forEach((value) => {
      total += Number(value) || 0;
    });
    return total;
  };

  const totalWords = () => numberToArabicWords(calculateTotal());
  const totalGrade = () => gradeForScore(calculateTotal());

  const copyTextSummary = async () => {
    const text = buildReportSummary(report, calculateTotal(), totalGrade().label);
    try {
      await navigator.clipboard.writeText(text);
      showToast('تم نسخ الملخص النصي', 'success');
    } catch {
      showToast('تعذر النسخ تلقائيًا من هذا المتصفح.', 'error');
    }
  };

  const handleDownloadSinglePDF = (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      showToast('تعذر العثور على معاينة التقرير للتصدير.', 'error');
      return;
    }
    setIsDownloading(true);
    showToast('جاري تجهيز ملف PDF...', 'loading');
    const opt = {
      margin: 0,
      filename: `${fileName}_${report.teacher.name || 'تقرير'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak: { mode: ['css', 'legacy'] },
    };
    Promise.resolve(html2pdf().set(opt).from(element).save())
      .then(() => showToast('تم تحميل ملف PDF بنجاح', 'success'))
      .catch(() => showToast('تعذر إنشاء ملف PDF، حاول مرة أخرى.', 'error'))
      .finally(() => setIsDownloading(false));
  };

  const handleDownloadExcel = () => {
    try {
      const data: any[][] = [
        ['تقرير الأداء السنوي للمعلم - مخرجات رفيق المشرف الذكي'],
        [''],
        ['المديرية', report.directorate, 'المدرسة', report.school, 'الرقم الوطني', report.schoolNationalId],
        ['اسم المعلم', report.teacher.name, 'رقم الهوية', report.teacher.idNumber],
        ['المؤهل', report.teacher.qualification, 'التخصص', report.teacher.specialization, 'تاريخ التعيين', report.teacher.hireDate],
        ['العام الدراسي', report.visit.academicYear, 'تاريخ التقييم', report.visit.date],
        [''],
        ['المجال', 'مؤشر الأداء', 'العلامة القصوى', 'العلامة المستحقة'],
      ];

      PERFORMANCE_INDICATORS.forEach((ind) => {
        data.push([ind.domain, ind.label, ind.max, report.scores[ind.id] || 0]);
      });

      data.push(['']);
      data.push(['المجموع الكلي', '', '100', calculateTotal()]);
      data.push(['المجموع بالحروف', totalWords()]);
      data.push(['التقدير العام', totalGrade().label]);
      data.push(['']);
      data.push(['ملحوظات المشرف وتوصياته:']);
      data.push([report.content.teacherRecommendations]);
      data.push(['']);
      data.push(['اسم المشرف التربوي', report.supervisorName]);

      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'تقرير العلامات');
      XLSX.writeFile(wb, `تقرير_علامات_${report.teacher.name || 'معلم'}.xlsx`);
      showToast('تم تحميل ملف Excel للعلامات', 'success');
    } catch {
      showToast('تعذر إنشاء ملف Excel.', 'error');
    }
  };

  const handleDownloadDescriptiveExcel = () => {
    try {
      const data: any[][] = [
        ['تقرير الزيارة الإشرافية الصفية (الوصفي) - مخرجات رفيق المشرف الذكي'],
        [''],
        ['البيانات الأساسية'],
        ['المديرية', report.directorate, 'المدرسة', report.school, 'الرقم الوطني', report.schoolNationalId],
        ['اسم المعلم', report.teacher.name, 'رقم الهوية', report.teacher.idNumber],
        ['المؤهل', report.teacher.qualification, 'تخصص', report.teacher.specialization, 'التعيين', report.teacher.hireDate],
        ['المبحث', report.visit.subject, 'الموضوع', report.visit.lessonTopic, 'الصف', report.visit.classSection],
        ['رقم الزيارة', report.visit.visitNumber, 'نوعها', report.visit.type, 'التاريخ', report.visit.date],
        [''],
        ['التحليل الوصفي لمجريات الحصة'],
        ['البند', 'التفاصيل'],
        ['وصف مجريات الحصة', report.content.proceedings],
        ['أبرز الأمور الإيجابية', report.content.positives],
        ['أبرز الأمور التي تحتاج تطوير', report.content.improvements],
        ['تحصيل الطلبة', report.content.studentAchievement],
        ['ملحوظات أخرى', report.content.others],
        ['توصيات للمعلم', report.content.teacherRecommendations],
        ['توصيات للمدير', report.content.principalRecommendations],
        [''],
        ['المجموع بالأرقام', `${calculateTotal()} / 100`],
        ['المجموع بالحروف', totalWords()],
        ['التقدير العام', totalGrade().label],
        [''],
        ['توقيع المشرف التربوي', report.supervisorName],
        ['تاريخ التصدير', new Date().toLocaleDateString('ar-PS')],
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'التقرير الوصفي');
      ws['!cols'] = [{ wch: 25 }, { wch: 80 }];
      XLSX.writeFile(wb, `تقرير_وصفي_${report.teacher.name || 'معلم'}.xlsx`);
      showToast('تم تحميل ملف Excel الوصفي', 'success');
    } catch {
      showToast('تعذر إنشاء ملف Excel.', 'error');
    }
  };

  const handleSaveSettings = (next: AppSettings) => {
    saveSettings(next);
    setSettings(next);
    setSelectedFont(next.font);
    setShowSettingsModal(false);
    showToast('تم حفظ الإعدادات', 'success');
  };

  const handleClearLocalData = () => {
    clearDraft();
    try {
      localStorage.removeItem('rafiq.v1.archive');
    } catch {
      /* ignore */
    }
    setDraftSavedAt(null);
    setArchiveCount(0);
    setShowSettingsModal(false);
    showToast('تم مسح البيانات المحلية من الجهاز.', 'success');
  };

  const handleLoadArchived = (r: ReportData, font: string) => {
    setReport(r);
    if (font) setSelectedFont(font);
    setIsReadOnly(false);
    setErrorMessage(null);
    setView('wizard');
    setStep(1);
  };

  /* ==================== قوالب التقارير الرسمية ==================== */

  const renderDescriptiveTemplate = (id: string) => (
    <div
      id={id}
      className="bg-white text-black relative table-clamp"
      style={{
        direction: 'rtl',
        width: '210mm',
        minHeight: '297mm',
        height: 'auto',
        padding: '8mm 10mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: `'${selectedFont}', sans-serif`,
      }}
    >
      <div
        className="border-[3px] border-double border-black p-2 flex flex-col"
        style={{ minHeight: 'calc(297mm - 16mm)' }}
      >
        <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-2 px-2">
          <div className="w-1/3 text-right text-[11px] font-bold space-y-0.5 pt-1">
            <p>دولة فلسطين</p>
            <p>وزارة التربية والتعليم العالي</p>
            <p>الإدارة العامة للإشراف والتأهيل التربوي</p>
          </div>
          <div className="w-1/3 flex flex-col items-center">
            <div className="scale-90 transform origin-top">{PALESTINE_LOGO_SVG}</div>
          </div>
          <div className="w-1/3 text-right text-[11px] font-bold space-y-1 pt-1">
            <p>مديرية التربية والتعليم: <span className="underline">{report.directorate || '________________'}</span></p>
            <p>المدرسة: <span className="underline">{report.school || '________________'}</span></p>
            <p>الرقم الوطني: <span className="underline">{report.schoolNationalId || '________________'}</span></p>
          </div>
        </div>
        <h1 className="text-center font-black text-[16px] my-1">تقرير الزيارة الإشرافية الصفية (خاص بالمشرف التربوي)</h1>
        <table className="w-full border-collapse border-[1px] border-black mb-1 text-[10px]">
          <thead>
            <tr className="bg-gray-100 font-bold">
              <th className="border border-black p-1">اسم المعلم</th>
              <th className="border border-black p-1">رقم الهوية</th>
              <th className="border border-black p-1">المؤهل العلمي</th>
              <th className="border border-black p-1">التخصص</th>
              <th className="border border-black p-1">تاريخ التعيين</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-7 text-center font-bold">
              <td className="border border-black p-1">{report.teacher.name}</td>
              <td className="border border-black p-1">{report.teacher.idNumber}</td>
              <td className="border border-black p-1">{report.teacher.qualification}</td>
              <td className="border border-black p-1">{report.teacher.specialization}</td>
              <td className="border border-black p-1">{report.teacher.hireDate}</td>
            </tr>
          </tbody>
        </table>
        <table className="w-full border-collapse border-[1px] border-black mb-2 text-[10px]">
          <thead>
            <tr className="bg-gray-100 font-bold">
              <th className="border border-black p-1">تاريخ الزيارة</th>
              <th className="border border-black p-1">رقم الزيارة</th>
              <th className="border border-black p-1">نوع الزيارة*</th>
              <th className="border border-black p-1">المبحث</th>
              <th className="border border-black p-1">موضوع الدرس</th>
              <th className="border border-black p-1">الصف/ الشعبة</th>
              <th className="border border-black p-1">الحصة</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-7 text-center font-bold">
              <td className="border border-black p-1">{report.visit.date}</td>
              <td className="border border-black p-1">{report.visit.visitNumber}</td>
              <td className="border border-black p-1">{report.visit.type}</td>
              <td className="border border-black p-1">{report.visit.subject}</td>
              <td className="border border-black p-1">{report.visit.lessonTopic}</td>
              <td className="border border-black p-1">{report.visit.classSection}</td>
              <td className="border border-black p-1">{report.visit.period}</td>
            </tr>
          </tbody>
        </table>
        <div className="space-y-1 text-[11px] flex-1">
          <div className="border border-black p-2 min-h-[160px]">
            <p className="font-bold underline mb-1">وصف مجرييات الحصة: (المقدمة، المحتوى العلمي، الأنشطة، الاستراتيجيات، الأساليب، التقويم البنائي، توظيف التكنولوجيا...،) .</p>
            <div className="whitespace-pre-wrap text-justify leading-snug">{report.content.proceedings}</div>
          </div>
          <div className="border border-black p-2 min-h-[90px]">
            <p className="font-bold underline mb-1">أبرز الأمور الإيجابية: ( أساليب التدريس، التقويم بأنواعه...،)</p>
            <div className="whitespace-pre-wrap leading-tight">{report.content.positives}</div>
          </div>
          <div className="border border-black p-2 min-h-[90px]">
            <p className="font-bold underline mb-1">أبرز الأمور التي تحتاج إلى تطوير: ( المحتوى العلمي، أساليب التدريس، التقويم بأنواعه...،)</p>
            <div className="whitespace-pre-wrap leading-tight">{report.content.improvements}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-black p-2 min-h-[70px]">
              <p className="font-bold underline mb-1">تحصيل الطلبة: (نسبة الإجابات، الانخراط، نتاجات التعلم...)</p>
              <div className="whitespace-pre-wrap leading-tight text-[10px]">{report.content.studentAchievement}</div>
            </div>
            <div className="border border-black p-2 min-h-[70px]">
              <p className="font-bold underline mb-1">أمور أخرى: (التحضير، أوراق العمل، أمور إبداعية...)</p>
              <div className="whitespace-pre-wrap leading-tight text-[10px]">{report.content.others}</div>
            </div>
          </div>
          <div className="border border-black p-2 bg-gray-50/20">
            <p className="font-black underline mb-1 text-[12px]">التوصيات:</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-l border-dashed border-gray-400 pl-2">
                <p className="font-bold underline text-[10px] mb-1">للمعلم: (رفع كفايات، زيادة تحصيل...)</p>
                <div className="whitespace-pre-wrap min-h-[60px] leading-tight text-[10px]">{report.content.teacherRecommendations}</div>
              </div>
              <div>
                <p className="font-bold underline text-[10px] mb-1">للمدير: (المتابعة، الدعم الفني...)</p>
                <div className="whitespace-pre-wrap min-h-[60px] leading-tight text-[10px]">{report.content.principalRecommendations}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-4 text-[11px] font-bold px-4 pt-4 border-t border-black">
          <div className="text-right">
            <p>المشرف التربوي وتوقيعه:</p>
            <p className="text-blue-900 font-black mt-2">{report.supervisorName || '________________'}</p>
          </div>
          <div className="text-center">
            <p>ر.ق الإشراف التربوي:</p>
            <p className="mt-2">________________</p>
          </div>
          <div className="text-left">
            <p>مصادقة مدير التربية والتعليم:</p>
            <p className="mt-2">________________</p>
          </div>
        </div>
        <div className="mt-4 flex justify-between text-[10px] font-bold border-t border-gray-200 pt-2 px-2">
          <p>توقيع المعلم المستلم: ________________</p>
          <p>التاريخ: / / </p>
          <p>نسخة مدير المدرسة</p>
        </div>
      </div>
    </div>
  );

  const renderScoreTemplate = (id: string) => (
    <div
      id={id}
      className="bg-white text-black relative table-clamp"
      style={{
        direction: 'rtl',
        width: '210mm',
        minHeight: '297mm',
        height: 'auto',
        padding: '10mm 15mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: `'${selectedFont}', sans-serif`,
      }}
    >
      <div
        className="border-[3px] border-double border-black p-2 flex flex-col"
        style={{ minHeight: 'calc(297mm - 20mm)' }}
      >
        <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-2 px-2">
          <div className="w-1/3 text-right text-[11px] font-bold space-y-0.5 pt-1">
            <p>دولة فلسطين</p>
            <p>وزارة التربية والتعليم</p>
            <p>الإدارة العامة للتعليم المدرسي</p>
          </div>
          <div className="w-1/3 flex flex-col items-center">
            <div className="scale-95 transform origin-top">{PALESTINE_LOGO_SVG}</div>
          </div>
          <div className="w-1/3 text-right text-[11px] font-bold space-y-1 pt-1">
            <p>مديرية التربية والتعليم: {report.directorate || '..............'}</p>
            <p>المدرسة: {report.school || '..............'}</p>
            <p>الرقم الوطني: {report.schoolNationalId || '..............'}</p>
          </div>
        </div>
        <h1 className="text-center font-black text-[18px] my-2">تقرير الأداء السنوي للمعلم / خاص بالمشرف التربوي</h1>
        <table className="w-full border-collapse border-[1px] border-black mb-1 text-[11px]">
          <thead>
            <tr className="bg-gray-100 font-bold">
              <th className="border border-black p-1">اسم المعلم/ة</th>
              <th className="border border-black p-1">رقم الهوية</th>
              <th className="border border-black p-1">المؤهل</th>
              <th className="border border-black p-1">التخصص</th>
              <th className="border border-black p-1">تاريخ التعيين</th>
              <th className="border border-black p-1">العام الدراسي</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-8 text-center font-bold">
              <td className="border border-black p-1">{report.teacher.name}</td>
              <td className="border border-black p-1">{report.teacher.idNumber}</td>
              <td className="border border-black p-1">{report.teacher.qualification}</td>
              <td className="border border-black p-1">{report.teacher.specialization}</td>
              <td className="border border-black p-1">{report.teacher.hireDate}</td>
              <td className="border border-black p-1">{report.visit.academicYear}</td>
            </tr>
          </tbody>
        </table>
        <table className="w-full border-collapse border-[1px] border-black text-[10px] mb-1 flex-1">
          <thead>
            <tr className="bg-gray-200 h-10 font-bold">
              <th className="border border-black p-1 w-[10%]">المجال</th>
              <th className="border border-black p-1 w-[70%]">مؤشرات الأداء</th>
              <th className="border border-black p-1 w-[10%] text-center">القصوى</th>
              <th className="border border-black p-1 w-[10%] text-center">المعدل</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(new Set(PERFORMANCE_INDICATORS.map((ind) => ind.domain))).map((domain) => {
              const domainIndicators = PERFORMANCE_INDICATORS.filter((ind) => ind.domain === domain);
              return domainIndicators.map((ind, idx) => (
                <tr key={ind.id} className="h-[21px]">
                  {idx === 0 && (
                    <td
                      rowSpan={domainIndicators.length}
                      className="border border-black p-1 text-center font-black bg-gray-50"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        verticalAlign: 'middle',
                        whiteSpace: 'pre-wrap',
                        fontSize: '9px',
                      }}
                    >
                      {domain}
                    </td>
                  )}
                  <td className="border border-black p-1 text-right leading-tight pr-2">{ind.label}</td>
                  <td className="border border-black p-1 text-center font-bold">{ind.max}</td>
                  <td className="border border-black p-1 text-center font-black text-blue-900 bg-blue-50/10">
                    {report.scores[ind.id] || 0}
                  </td>
                </tr>
              ));
            })}
            <tr className="bg-gray-300 font-bold h-9">
              <td colSpan={2} className="border border-black p-1 text-center text-[12px]">المجموع بالأرقام</td>
              <td className="border border-black p-1 text-center text-[12px]">100</td>
              <td className="border border-black p-1 text-center text-[14px] text-blue-900">{calculateTotal()}</td>
            </tr>
          </tbody>
        </table>
        <div className="flex justify-between text-[11px] font-bold mb-1 px-4">
          <p>التاريخ: {report.visit.date}</p>
          <p>المجموع بالحروف: {totalWords()}</p>
        </div>
        <div className="border border-black p-2 min-h-[140px] text-[11px] mb-2 bg-slate-50/10">
          <p className="font-bold underline mb-1">ملحوظات المشرف وتوصياته:</p>
          <div className="whitespace-pre-wrap italic leading-relaxed text-justify">{report.content.teacherRecommendations}</div>
        </div>
        <div className="flex justify-between items-end text-[12px] font-bold px-6 py-4 border-t border-black">
          <div className="text-right">
            <p>التاريخ: / / </p>
          </div>
          <div className="text-left w-[50%]">
            <p>
              اسم المشرف وتوقيعه:{' '}
              <span className="font-black underline text-blue-900 ml-2">{report.supervisorName || '________________'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceTable = (isEditable = false) => {
    const domains = Array.from(new Set(PERFORMANCE_INDICATORS.map((ind) => ind.domain)));
    return (
      <table className="w-full border-collapse border-2 border-slate-200 text-sm bg-white shadow-sm rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-slate-800 text-white font-black">
            <th className="p-3 w-[12%] text-center">المجال</th>
            <th className="p-3 w-[68%] text-right">مؤشر الأداء</th>
            <th className="p-3 w-[10%] text-center">القصوى</th>
            <th className="p-3 w-[10%] text-center">المعدل</th>
          </tr>
        </thead>
        <tbody>
          {domains.map((domain) => {
            const domainIndicators = PERFORMANCE_INDICATORS.filter((ind) => ind.domain === domain);
            return domainIndicators.map((ind, idx) => (
              <tr key={ind.id} className="hover:bg-slate-50 border-b border-slate-100">
                {idx === 0 && (
                  <td
                    rowSpan={domainIndicators.length}
                    className="p-3 text-center font-black bg-slate-50 border-l border-slate-200"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', verticalAlign: 'middle' }}
                  >
                    {domain}
                  </td>
                )}
                <td className="p-3 text-right leading-relaxed font-medium">{ind.label}</td>
                <td className="p-3 text-center font-bold text-slate-500">{ind.max}</td>
                <td className="p-3 text-center font-black text-blue-800 bg-blue-50/10">
                  {isEditable ? (
                    <input
                      type="number"
                      min="0"
                      max={ind.max}
                      value={report.scores[ind.id]}
                      onChange={(e) =>
                        updateReport(
                          `scores.${ind.id}`,
                          Math.max(0, Math.min(ind.max, parseFloat(e.target.value) || 0))
                        )
                      }
                      className="w-full text-center border-none p-1 text-sm bg-transparent focus:ring-0 outline-none font-black"
                    />
                  ) : (
                    report.scores[ind.id]
                  )}
                </td>
              </tr>
            ));
          })}
          <tr className="bg-blue-600 text-white font-black">
            <td colSpan={2} className="p-4 text-center text-lg">المجموع الكلي</td>
            <td className="p-4 text-center text-lg">100</td>
            <td className="p-4 text-center text-2xl text-yellow-300">{calculateTotal()}</td>
          </tr>
        </tbody>
      </table>
    );
  };

  const renderStepIndicator = () => (
    <div className="flex justify-between items-center mb-8 md:mb-10 px-2 no-print max-w-4xl mx-auto overflow-x-auto steps-scroll pb-4 pt-2">
      {[
        { n: 1, label: 'البيانات', icon: <FileText size={20} /> },
        { n: 2, label: 'سرد الحصة', icon: <Users size={20} /> },
        { n: 3, label: 'التحليل الذكي', icon: <Sparkles size={20} /> },
        { n: 4, label: 'تقييم العلامات', icon: <TrendingUp size={20} /> },
        { n: 5, label: 'الاعتماد النهائي', icon: <CheckCircle size={20} /> },
      ].map((s) => (
        <div
          key={s.n}
          onClick={() => {
            if (isReadOnly || s.n >= step) return;
            setFieldErrors({});
            setStep(s.n);
          }}
          className={`flex flex-col items-center min-w-[68px] sm:min-w-[95px] cursor-pointer transition-all duration-300 ${
            step === s.n
              ? 'text-blue-600 scale-110 font-black'
              : step > s.n
              ? 'text-green-600 font-bold'
              : 'text-gray-400'
          } ${isReadOnly && s.n < 5 ? 'opacity-50 cursor-not-allowed' : ''} ${
            s.n >= step && !isReadOnly ? 'cursor-pointer' : ''
          }`}
        >
          <div
            className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-2 border-2 transition-all shadow-lg ${
              step === s.n
                ? 'border-blue-600 bg-blue-50 shadow-blue-100'
                : step > s.n
                ? 'border-green-600 bg-green-50 shadow-green-100'
                : 'border-gray-200 bg-white'
            }`}
          >
            {step > s.n ? <CheckCircle size={26} /> : s.icon}
          </div>
          <span className="text-[10px] sm:text-[12px] whitespace-nowrap">{s.label}</span>
        </div>
      ))}
    </div>
  );

  /* ==================== العرض ==================== */

  if (view === 'splash') {
    return (
      <>
        <Toast toast={toast} onClose={() => setToast(null)} />
        <SplashScreen onFinish={() => setView(afterSplash)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-32">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header className="bg-white/95 backdrop-blur-xl border-b sticky top-0 z-[100] no-print shadow-sm px-4 md:px-6 py-3 flex flex-wrap justify-between items-center gap-3">
        <button
          onClick={goHome}
          disabled={isReadOnly}
          className="flex items-center gap-3 text-right disabled:cursor-default group"
          title="العودة إلى الشاشة الرئيسية"
        >
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl text-white shadow-xl shadow-blue-200 group-hover:scale-105 transition-transform">
            <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="شعار" width={30} height={30} className="w-[30px] h-[30px] rounded-lg" />
          </div>
          <div className="text-right">
            <h1 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight leading-none">
              رفيق المشرف الذكي
            </h1>
            <p className="hidden sm:block text-[10px] md:text-[11px] text-blue-600 font-black uppercase tracking-widest mt-1">
              Supervision Automation System
            </p>
          </div>
        </button>

        <div className="flex gap-2 items-center flex-wrap">
          {isReadOnly && (
            <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-xl text-[11px] font-black border border-amber-200 flex items-center gap-2">
              <Info size={14} /> عرض للقراءة فقط
            </div>
          )}
          {view === 'wizard' && !isReadOnly && draftSavedAt && (
            <div
              className="hidden sm:flex bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-[11px] font-black border border-emerald-200 items-center gap-2"
              title="يُحفظ التقرير تلقائيًا أثناء العمل"
            >
              <CheckCircle size={14} /> حفظ تلقائي
            </div>
          )}
          {view === 'wizard' && step === 5 && (
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl shadow-inner">
              <button
                onClick={() => setZoomLevel((prev) => Math.max(0.4, prev - 0.1))}
                className="p-2 hover:bg-white rounded-lg transition-all text-slate-600"
                title="تصغير"
              >
                <ZoomOut size={18} />
              </button>
              <div className="px-2 flex items-center text-[10px] font-bold text-slate-500">
                {Math.round(zoomLevel * 100)}%
              </div>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(1.5, prev + 0.1))}
                className="p-2 hover:bg-white rounded-lg transition-all text-slate-600"
                title="تكبير"
              >
                <ZoomIn size={18} />
              </button>
            </div>
          )}
          <button
            onClick={() => setShowArchiveModal(true)}
            className="p-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-all border border-blue-100"
            title="الأرشيف"
          >
            <Database size={18} />
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all"
            title="الإعدادات"
          >
            <SettingsIcon size={18} />
          </button>
          {view === 'wizard' && (
            <button
              onClick={goHome}
              className="p-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-100"
              title="الشاشة الرئيسية"
            >
              <Home size={18} />
            </button>
          )}
        </div>
      </header>

      {errorMessage && (
        <div className="max-w-4xl mx-auto mt-6 px-4 no-print animate-fadeIn">
          <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-start gap-4 text-red-800">
            <AlertTriangle className="flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <p className="font-black">تنبيه:</p>
              <p className="text-sm font-bold opacity-90 leading-relaxed">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600" aria-label="إغلاق التنبيه">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <ArchiveModal
        open={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setArchiveCount(loadArchive().length);
        }}
        settings={settings}
        currentReport={report}
        currentFont={selectedFont}
        canSaveCurrent={Boolean(report.teacher.idNumber && report.teacher.name)}
        onLoad={handleLoadArchived}
        onToast={showToast}
      />

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
          onClearLocalData={handleClearLocalData}
          onRestored={() => {
            setArchiveCount(loadArchive().length);
            setDraftSavedAt(loadDraft()?.savedAt ?? null);
            const restored = loadSettings();
            setSettings(restored);
            setSelectedFont(restored.font);
            showToast('تمت استعادة النسخة الاحتياطية — أعد فتح المسودة أو الأرشيف لرؤيتها.', 'success');
          }}
        />
      )}

      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}

      {showShareModal && (
        <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-fadeInScale">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">مشاركة التقرير</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                aria-label="إغلاق"
              >
                <X size={22} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              هذا الرابط يحتوي على كافة بيانات التقرير بشكل مشفر — افتحه على أي جهاز لعرض التقرير
              للقراءة فقط.
            </p>
            <button
              onClick={copyTextSummary}
              className="w-full flex items-center justify-center gap-2 mb-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-black text-sm hover:bg-blue-100 transition-all"
            >
              <Copy size={16} /> نسخ ملخص التقرير نصيًا (واتساب/بريد)
            </button>
            <div className="flex gap-2 mb-6">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono focus:outline-none min-w-0"
              />
              <button
                onClick={copyToClipboard}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex-shrink-0"
                title="نسخ"
              >
                <Copy size={20} />
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {view === 'home' ? (
        <main className="max-w-5xl mx-auto px-4 mt-6 md:mt-10">
          <HomeScreen
            hasDraft={draftSavedAt !== null}
            draftSavedAt={draftSavedAt}
            archiveCount={archiveCount}
            aiServerConfigured={Boolean(settings.apiBaseUrl) || !isNative}
            onNewReport={startNewReport}
            onContinueDraft={continueDraft}
            onOpenArchive={() => setShowArchiveModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenHelp={() => setShowHelpModal(true)}
          />
          <footer className="text-center py-10 text-xs font-bold text-slate-400 no-print">
            رفيق المشرف الذكي • الإصدار 1.1.0 • صُمم للمشرفين التربويين في فلسطين
          </footer>
        </main>
      ) : (
        <main className="max-w-5xl mx-auto px-4 mt-6 md:mt-10">
          {renderStepIndicator()}
          <div className="no-print">
            {step === 1 && (
              <div className="card space-y-10 md:space-y-12 animate-fadeIn">
                <section>
                  <div className="section-title">
                    <div className="section-title-bar" />
                    <h3 className="section-title-text">إعدادات الخط والتقرير</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 bg-blue-50 p-6 md:p-8 rounded-3xl border-2 border-blue-100 shadow-inner mb-8 md:mb-10">
                    <div className="flex flex-col space-y-3">
                      <label className="field-label">
                        <TypeIcon size={18} /> نوع الخط العربي المفضل
                      </label>
                      <select
                        value={selectedFont}
                        onChange={(e) => {
                          setSelectedFont(e.target.value);
                          saveSettings({ ...settings, font: e.target.value });
                          setSettings((s) => ({ ...s, font: e.target.value }));
                        }}
                        className="field-input bg-white"
                      >
                        {ARABIC_FONTS.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-center p-4 border-2 border-dashed border-blue-200 rounded-2xl bg-white/50">
                      <p className="text-center font-bold text-blue-800" style={{ fontFamily: selectedFont }}>
                        هذه عينة من النص بالخط المختار: نموذج تقرير رسمي.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="section-title">
                    <div className="section-title-bar" />
                    <h3 className="section-title-text">بيانات الترويسة والزيارة</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                    <SpeechInput
                      label="مديرية التربية والتعليم"
                      required
                      error={fieldErrors['directorate']}
                      value={report.directorate}
                      onChange={(v) => updateReport('directorate', v)}
                    />
                    <SpeechInput
                      label="المدرسة"
                      required
                      error={fieldErrors['school']}
                      value={report.school}
                      onChange={(v) => updateReport('school', v)}
                    />
                    <SpeechInput
                      label="الرقم الوطني للمدرسة"
                      value={report.schoolNationalId}
                      onChange={(v) => updateReport('schoolNationalId', toPlainDigits(v))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 mt-6 md:mt-8">
                    <div className="flex flex-col space-y-2">
                      <label className="field-label">
                        تاريخ الزيارة <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={report.visit.date}
                        onChange={(e) => updateReport('visit.date', e.target.value)}
                        className={`field-input ${fieldErrors['visit.date'] ? 'field-input-error' : ''}`}
                      />
                    </div>
                    <SpeechInput
                      label="العام الدراسي"
                      value={report.visit.academicYear}
                      onChange={(v) => updateReport('visit.academicYear', v)}
                    />
                    <div className="flex flex-col space-y-2">
                      <label className="field-label">نوع الزيارة</label>
                      <select
                        value={report.visit.type}
                        onChange={(e) => updateReport('visit.type', e.target.value)}
                        className="field-input"
                      >
                        <option value="وجاهية">وجاهية</option>
                        <option value="افتراضية متزامنة">متزامنة</option>
                        <option value="افتراضية غير متزامنة">غير متزامنة</option>
                      </select>
                    </div>
                    <SpeechInput
                      label="رقم الحصة"
                      value={report.visit.period}
                      onChange={(v) => updateReport('visit.period', v)}
                    />
                    <SpeechInput
                      label="رقم الزيارة"
                      value={report.visit.visitNumber}
                      onChange={(v) => updateReport('visit.visitNumber', toPlainDigits(v))}
                    />
                  </div>
                </section>

                <section className="pt-8 md:pt-12 border-t-2 border-slate-50">
                  <div className="section-title">
                    <div className="w-2.5 h-10 bg-emerald-600 rounded-full shadow-lg shadow-emerald-100" />
                    <h3 className="section-title-text">بيانات المعلم والمبحث</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                    <SpeechInput
                      label="اسم المعلم/ة"
                      required
                      error={fieldErrors['teacher.name']}
                      value={report.teacher.name}
                      onChange={(v) => updateReport('teacher.name', v)}
                    />
                    <SpeechInput
                      label="رقم الهوية"
                      required
                      error={fieldErrors['teacher.idNumber']}
                      value={report.teacher.idNumber}
                      onChange={(v) => updateReport('teacher.idNumber', toPlainDigits(v))}
                    />
                    <SpeechInput
                      label="المؤهل العلمي"
                      value={report.teacher.qualification}
                      onChange={(v) => updateReport('teacher.qualification', v)}
                    />
                    <SpeechInput
                      label="التخصص"
                      value={report.teacher.specialization}
                      onChange={(v) => updateReport('teacher.specialization', v)}
                    />
                    <SpeechInput
                      label="تاريخ التعيين"
                      value={report.teacher.hireDate}
                      onChange={(v) => updateReport('teacher.hireDate', v)}
                    />
                    <SpeechInput
                      label="المبحث"
                      required
                      error={fieldErrors['visit.subject']}
                      value={report.visit.subject}
                      onChange={(v) => updateReport('visit.subject', v)}
                    />
                    <SpeechInput
                      label="موضوع الدرس"
                      value={report.visit.lessonTopic}
                      onChange={(v) => updateReport('visit.lessonTopic', v)}
                    />
                    <SpeechInput
                      label="الصف/ الشعبة"
                      required
                      error={fieldErrors['visit.classSection']}
                      value={report.visit.classSection}
                      onChange={(v) => updateReport('visit.classSection', v)}
                    />
                  </div>
                </section>
              </div>
            )}

            {step === 2 && (
              <div className="card space-y-8 md:space-y-12 animate-fadeIn">
                <div className="bg-gradient-to-br from-indigo-700 to-blue-900 p-6 md:p-10 rounded-[2.5rem] text-white shadow-2xl flex items-start gap-5 md:gap-8">
                  <div className="bg-white/20 p-4 md:p-5 rounded-3xl backdrop-blur-xl shadow-xl flex-shrink-0">
                    <Users size={36} />
                  </div>
                  <div>
                    <h4 className="font-black text-xl md:text-2xl tracking-tight">سرد مجرييات الحصة الصفية</h4>
                    <p className="text-sm opacity-90 leading-relaxed mt-2 md:mt-3 font-medium">
                      ابدأ الإملاء الصوتي (أو اكتب) لوصف الحصة بالكامل: المقدمة، المحتوى، الأنشطة،
                      الاستراتيجيات، والتقويم.
                    </p>
                  </div>
                </div>

                <SpeechInput
                  label="وصف مجرييات الحصة بالتفصيل"
                  required
                  error={Boolean(fieldErrors['proceedings'])}
                  value={report.content.proceedings}
                  onChange={(v) => updateReport('content.proceedings', v)}
                  multiline
                  placeholder="ابدأ السرد هنا..."
                />

                <div className="flex justify-center pt-4 md:pt-8">
                  <button
                    onClick={handleAIAnalysis}
                    disabled={isAnalyzing}
                    className="group flex items-center gap-4 md:gap-6 px-8 md:px-16 py-6 md:py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-lg md:text-2xl shadow-2xl shadow-blue-200 hover:scale-105 active:scale-100 transition-all disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {isAnalyzing ? <Loader2 className="animate-spin" size={30} /> : <Sparkles size={30} />}
                    <span>{isAnalyzing ? 'جاري التحليل الذكي...' : 'توليد التحليل الذكي'}</span>
                  </button>
                </div>
                <p className="text-center text-xs font-bold text-slate-400">
                  يتطلب اتصالًا بالخادم الذكي — يمكنك كذلك إكمال الخطوات التالية يدويًا.
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="card space-y-10 md:space-y-14 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-b-2 border-slate-50 pb-6 md:pb-10">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    مراجعة التحليل الوصفي
                  </h3>
                  <span className="chip bg-blue-50 border-blue-200 text-blue-700">
                    <Sparkles size={14} /> قابل للتعديل قبل الاعتماد
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  <SpeechInput label="أبرز الأمور الإيجابية" value={report.content.positives} onChange={(v) => updateReport('content.positives', v)} multiline />
                  <SpeechInput label="جوانب التطوير" value={report.content.improvements} onChange={(v) => updateReport('content.improvements', v)} multiline />
                  <SpeechInput label="تحصيل الطلبة" value={report.content.studentAchievement} onChange={(v) => updateReport('content.studentAchievement', v)} multiline />
                  <SpeechInput label="ملحوظات أخرى" value={report.content.others} onChange={(v) => updateReport('content.others', v)} multiline />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 bg-slate-50/50 p-6 md:p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-inner">
                  <SpeechInput label="توصيات للمعلم/ة" value={report.content.teacherRecommendations} onChange={(v) => updateReport('content.teacherRecommendations', v)} multiline />
                  <SpeechInput
                    label="توصيات لمدير/ة المدرسة"
                    value={report.content.principalRecommendations}
                    onChange={(v) => updateReport('content.principalRecommendations', v)}
                    multiline
                  />
                </div>
                <div className="flex justify-center pt-4 md:pt-8">
                  <button
                    onClick={handleAIScoring}
                    disabled={isScoring}
                    className="flex items-center gap-4 md:gap-5 px-8 md:px-16 py-5 md:py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-lg md:text-xl shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-100 transition-all disabled:opacity-60"
                  >
                    {isScoring ? <Loader2 className="animate-spin" size={28} /> : <TrendingUp size={28} />}
                    <span>{isScoring ? 'جاري تقدير العلامات...' : 'تقدير العلامات الذكي'}</span>
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="card space-y-8 md:space-y-12 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-b-2 border-slate-50 pb-6 md:pb-10">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                    توزيع علامات الأداء
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip bg-indigo-50 border-indigo-200 text-indigo-700">
                      المجموع: {calculateTotal()} / 100
                    </span>
                    <span className={`chip border ${totalGrade().className}`}>
                      التقدير العام: {totalGrade().label}
                    </span>
                    <span className="chip bg-slate-50 border-slate-200 text-slate-600">
                      {totalWords()}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-2xl border-2 border-slate-100 shadow-xl">
                  {renderPerformanceTable(true)}
                </div>
                <div className="pt-6 md:pt-12 border-t-2 border-slate-50">
                  <SpeechInput
                    label="اسم المشرف التربوي (للتوقيع)"
                    required
                    error={Boolean(fieldErrors['supervisorName'])}
                    value={report.supervisorName}
                    onChange={(v) => updateReport('supervisorName', v)}
                    placeholder="اكتب اسمك كاملاً"
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-10 md:space-y-14 animate-fadeIn pb-10">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-800 p-6 md:p-12 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between shadow-2xl gap-6 md:gap-10">
                  <div className="flex flex-col sm:flex-row items-center gap-5 md:gap-10 text-center md:text-right">
                    <div className="p-6 bg-white/20 rounded-[2rem] backdrop-blur-2xl shadow-2xl">
                      <CheckCircle size={56} />
                    </div>
                    <div>
                      <h4 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
                        {isReadOnly ? 'عرض التقرير المشترك' : 'اكتمل التقرير بنجاح'}
                      </h4>
                      <p className="text-sm font-bold opacity-90 mt-2">
                        {isReadOnly
                          ? 'نسخة للقراءة فقط، يمكنك تصديرها PDF أو Excel.'
                          : 'راجع المعاينتين بالأسفل ثم صدّرهما بصيغة PDF أو Excel.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-14 items-start">
                  <div className="space-y-6">
                    <div className="flex flex-wrap justify-between items-center gap-3 px-1">
                      <h4 className="font-black text-lg md:text-2xl text-slate-900 flex items-center">
                        <ClipboardList className="ml-3 text-blue-600" size={28} /> التقرير الوصفي
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDownloadDescriptiveExcel}
                          className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs md:text-sm font-black border border-emerald-200 hover:bg-emerald-200 transition-all flex items-center gap-2"
                        >
                          <FileSpreadsheet size={16} /> Excel
                        </button>
                        <button
                          onClick={() => handleDownloadSinglePDF('pdf-descriptive', 'وصفي')}
                          disabled={isDownloading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-60"
                        >
                          {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} PDF
                        </button>
                      </div>
                    </div>
                    <div className="border-2 border-slate-200 rounded-[2rem] shadow-2xl bg-slate-50 p-4 overflow-hidden flex justify-center">
                      <div
                        style={{
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'top center',
                          transition: 'transform 0.2s ease-out',
                        }}
                      >
                        {renderDescriptiveTemplate('preview-descriptive')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-wrap justify-between items-center gap-3 px-1">
                      <h4 className="font-black text-lg md:text-2xl text-slate-900 flex items-center">
                        <TrendingUp className="ml-3 text-indigo-600" size={28} /> تقرير العلامات
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDownloadExcel}
                          className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs md:text-sm font-black border border-emerald-200 hover:bg-emerald-200 transition-all flex items-center gap-2"
                        >
                          <FileSpreadsheet size={16} /> Excel
                        </button>
                        <button
                          onClick={() => handleDownloadSinglePDF('pdf-scores', 'علامات')}
                          disabled={isDownloading}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-60"
                        >
                          {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} PDF
                        </button>
                      </div>
                    </div>
                    <div className="border-2 border-slate-200 rounded-[2rem] shadow-2xl bg-slate-50 p-4 overflow-hidden flex justify-center">
                      <div
                        style={{
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'top center',
                          transition: 'transform 0.2s ease-out',
                        }}
                      >
                        {renderScoreTemplate('preview-scores')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isReadOnly && (
              <div className="mt-12 md:mt-20 flex flex-wrap justify-between items-center gap-4 max-w-4xl mx-auto border-t-2 border-slate-200 pt-8 md:pt-12 no-print">
                <button
                  onClick={handlePrev}
                  disabled={step === 1}
                  className="btn-secondary"
                >
                  <ChevronRight size={24} /> <span>السابق</span>
                </button>

                <button
                  onClick={goHome}
                  className="hidden sm:flex text-xs font-black text-slate-400 hover:text-slate-700 transition-all items-center gap-2 px-4 py-3"
                >
                  <Home size={16} /> الشاشة الرئيسية
                </button>

                <button
                  onClick={handleNext}
                  disabled={step === 5}
                  className="group btn-primary bg-blue-600"
                >
                  <span>{step === 4 ? 'معاينة التقارير' : 'حفظ ومتابعة'}</span>
                  <ChevronLeft size={24} className="group-hover:translate-x-[-6px] transition-transform" />
                </button>
              </div>
            )}
          </div>

          <div className="pdf-capture-container no-print">
            {renderDescriptiveTemplate('pdf-descriptive')}
            {renderScoreTemplate('pdf-scores')}
          </div>
        </main>
      )}

      {view === 'wizard' && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t p-3 md:p-5 flex justify-center items-center flex-wrap gap-3 no-print shadow-2xl z-[100]">
          {!isReadOnly ? (
            <div className="flex flex-wrap justify-center items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-emerald-50 px-5 py-3 rounded-2xl text-emerald-700 font-black border-2 border-emerald-200 transition-all text-sm"
              >
                <Share2 size={20} /> <span>مشاركة</span>
              </button>
              <button
                onClick={copyTextSummary}
                className="flex items-center gap-2 bg-blue-50 px-5 py-3 rounded-2xl text-blue-700 font-black border-2 border-blue-200 transition-all text-sm"
                title="نسخ ملخص التقرير نصيًا للمشاركة عبر واتساب أو البريد"
              >
                <Copy size={20} /> <span>نسخ الملخص</span>
              </button>
              <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
                <button
                  onClick={() => handleDownloadSinglePDF('pdf-descriptive', 'وصفي')}
                  disabled={isDownloading}
                  className="px-4 py-2.5 bg-slate-900 text-white font-black rounded-xl text-xs flex items-center gap-2 disabled:opacity-60"
                >
                  وصفي PDF
                </button>
                <button
                  onClick={handleDownloadDescriptiveExcel}
                  className="px-4 py-2.5 bg-emerald-600 text-white font-black rounded-xl text-xs flex items-center gap-2"
                >
                  وصفي Excel
                </button>
              </div>
              <div className="flex bg-indigo-50 rounded-2xl p-1 gap-1">
                <button
                  onClick={() => handleDownloadSinglePDF('pdf-scores', 'علامات')}
                  disabled={isDownloading}
                  className="px-4 py-2.5 bg-indigo-700 text-white font-black rounded-xl text-xs flex items-center gap-2 disabled:opacity-60"
                >
                  علامات PDF
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="px-4 py-2.5 bg-emerald-600 text-white font-black rounded-xl text-xs flex items-center gap-2"
                >
                  علامات Excel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              <button
                onClick={() => handleDownloadSinglePDF('pdf-descriptive', 'وصفي_مشترك')}
                disabled={isDownloading}
                className="px-5 py-3 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-2 text-sm disabled:opacity-60"
              >
                <FileDown size={18} /> الوصفي (PDF)
              </button>
              <button
                onClick={handleDownloadDescriptiveExcel}
                className="px-5 py-3 bg-emerald-600 text-white font-black rounded-2xl flex items-center gap-2 text-sm"
              >
                <FileSpreadsheet size={18} /> الوصفي (Excel)
              </button>
              <button
                onClick={() => handleDownloadSinglePDF('pdf-scores', 'علامات_مشتركة')}
                disabled={isDownloading}
                className="px-5 py-3 bg-indigo-700 text-white font-black rounded-2xl flex items-center gap-2 text-sm disabled:opacity-60"
              >
                <FileDown size={18} /> العلامات (PDF)
              </button>
              <button
                onClick={handleDownloadExcel}
                className="px-5 py-3 bg-emerald-600 text-white font-black rounded-2xl flex items-center gap-2 text-sm"
              >
                <FileSpreadsheet size={18} /> العلامات (Excel)
              </button>
            </div>
          )}
        </footer>
      )}
    </div>
  );
};

export default App;
