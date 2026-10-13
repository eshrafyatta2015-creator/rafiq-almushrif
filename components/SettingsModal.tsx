import React, { useRef, useState } from 'react';
import {
  X,
  Server,
  Type as TypeIcon,
  UserRound,
  Trash2,
  ShieldCheck,
  Sparkles,
  Download,
  Upload,
} from 'lucide-react';
import { AppSettings, downloadBackupFile, restoreBackup } from '../services/storage';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onClose: () => void;
  onClearLocalData: () => void;
  onRestored: () => void;
}

const FONTS = [
  { name: 'Tajawal', label: 'تجوال (عصري)' },
  { name: 'Cairo', label: 'كايو (هندسي)' },
  { name: 'Almarai', label: 'المراعي (ناعم)' },
  { name: 'Amiri', label: 'الأميري (رسمي كلاسيكي)' },
  { name: 'El Messiri', label: 'المسيري (فني)' },
];

const ANALYSIS_STYLES: Array<{ value: AppSettings['analysisStyle']; label: string; hint: string }> = [
  { value: 'formal', label: 'متوازن (افتراضي)', hint: 'احترافي متوسط الطول' },
  { value: 'concise', label: 'مختصر', hint: 'نقاط مباشرة وجمل قصيرة' },
  { value: 'detailed', label: 'مفصّل', hint: 'شرح موسع مع أمثلة تطبيقية' },
];

const isValidUrl = (url: string) => {
  if (!url.trim()) return true;
  return /^https?:\/\/[^\s]+$/i.test(url.trim());
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
  onClearLocalData,
  onRestored,
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [urlError, setUrlError] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<AppSettings>) => setForm((p) => ({ ...p, ...patch }));
  const setProfile = (patch: Partial<AppSettings['profile']>) =>
    setForm((p) => ({ ...p, profile: { ...p.profile, ...patch } }));

  const submit = () => {
    const apiOk = isValidUrl(form.apiBaseUrl);
    const archiveOk = isValidUrl(form.archiveApiUrl);
    setUrlError(!apiOk || !archiveOk);
    if (!apiOk || !archiveOk) return;
    onSave({
      ...form,
      apiBaseUrl: form.apiBaseUrl.trim().replace(/\/+$/, ''),
      archiveApiUrl: form.archiveApiUrl.trim().replace(/\/+$/, ''),
    });
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const result = restoreBackup(JSON.parse(text));
      setBackupMsg({ ok: result.ok, text: result.message });
      if (result.ok) onRestored();
    } catch {
      setBackupMsg({ ok: false, text: 'تعذر قراءة الملف — تأكد أنه ملف JSON سليم.' });
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeInScale">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
              <Server size={22} />
            </div>
            <h3 className="text-xl font-black text-slate-900">إعدادات التطبيق</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
            aria-label="إغلاق"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="field-label">
              <Server size={16} /> رابط الخادم الذكي (Gemini API)
            </label>
            <input
              type="url"
              dir="ltr"
              value={form.apiBaseUrl}
              onChange={(e) => {
                set({ apiBaseUrl: e.target.value });
                setUrlError(false);
              }}
              placeholder="https://api.example.com"
              className={`field-input ${urlError && !isValidUrl(form.apiBaseUrl) ? 'field-input-error' : ''}`}
            />
            <p className="text-[11px] font-bold text-slate-500 mt-2 leading-relaxed">
              يُستخدم لتحليل المجريات وتقدير العلامات. اتركه فارغًا في نسخة الويب العاملة على نفس
              الخادم. في نسخة APK يجب إدخال رابط خادم «رفيق المشرف» المنشور.
            </p>
            {!isValidUrl(form.apiBaseUrl) && (
              <p className="text-xs font-black text-red-600 mt-1">
                الرابط غير صالح — يجب أن يبدأ بـ http:// أو https://
              </p>
            )}
          </div>

          <div>
            <label className="field-label">رابط الأرشيف السحابي (اختياري)</label>
            <input
              type="url"
              dir="ltr"
              value={form.archiveApiUrl}
              onChange={(e) => {
                set({ archiveApiUrl: e.target.value });
                setUrlError(false);
              }}
              placeholder="https://api.example.com/archive.php"
              className={`field-input ${urlError && !isValidUrl(form.archiveApiUrl) ? 'field-input-error' : ''}`}
            />
            <p className="text-[11px] font-bold text-slate-500 mt-2 leading-relaxed">
              إن وُضع، تظهر خيارات الحفظ والاسترجاع السحابي في نافذة الأرشيف. الافتراضي حفظ محلي
              على الجهاز.
            </p>
          </div>

          <div className="pt-5 border-t border-slate-100">
            <label className="field-label">
              <TypeIcon size={16} /> الخط الافتراضي للتقارير
            </label>
            <select
              value={form.font}
              onChange={(e) => set({ font: e.target.value })}
              className="field-input"
            >
              {FONTS.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-5 border-t border-slate-100">
            <label className="field-label">
              <Sparkles size={16} /> أسلوب التحليل الذكي
            </label>
            <select
              value={form.analysisStyle}
              onChange={(e) =>
                set({ analysisStyle: e.target.value as AppSettings['analysisStyle'] })
              }
              className="field-input"
            >
              {ANALYSIS_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} — {s.hint}
                </option>
              ))}
            </select>
            <p className="text-[11px] font-bold text-slate-500 mt-2 leading-relaxed">
              يُطبَّق على تحليل مجرييات الحصة عند استخدام الخادم الذكي.
            </p>
          </div>

          <div className="pt-5 border-t border-slate-100">
            <label className="field-label">
              <Download size={16} /> النسخ الاحتياطي والاستعادة
            </label>
            <p className="text-[11px] font-bold text-slate-500 mb-3 leading-relaxed">
              صدّر كل السجلات والمسودة والإعدادات كملف JSON، واستعيدها لاحقًا على أي جهاز.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={downloadBackupFile}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 font-black text-sm hover:bg-blue-100 transition-all"
              >
                <Download size={16} /> تصدير نسخة
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-sm hover:bg-emerald-100 transition-all"
              >
                <Upload size={16} /> استيراد نسخة
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
                e.target.value = '';
              }}
            />
            {backupMsg && (
              <p
                className={`text-xs font-black mt-3 ${backupMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {backupMsg.text}
              </p>
            )}
          </div>

          <div className="pt-5 border-t border-slate-100 space-y-4">
            <label className="field-label">
              <UserRound size={16} /> القيم الافتراضية للتقارير الجديدة
            </label>
            <input
              type="text"
              value={form.profile.supervisorName}
              onChange={(e) => setProfile({ supervisorName: e.target.value })}
              placeholder="اسم المشرف التربوي"
              className="field-input"
            />
            <input
              type="text"
              value={form.profile.directorate}
              onChange={(e) => setProfile({ directorate: e.target.value })}
              placeholder="مديرية التربية والتعليم"
              className="field-input"
            />
            <input
              type="text"
              value={form.profile.school}
              onChange={(e) => setProfile({ school: e.target.value })}
              placeholder="اسم المدرسة الافتراضية"
              className="field-input"
            />
          </div>

          <div className="pt-5 border-t border-slate-100">
            <div className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4">
              <ShieldCheck size={18} className="text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                لا يحفظ التطبيق أي كلمات مرور أو مفاتيح API على الجهاز؛ مفتاح Gemini يبقى على
                الخادم فقط.
              </p>
            </div>
            <button
              onClick={() => (confirmClear ? onClearLocalData() : setConfirmClear(true))}
              className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-black text-sm transition-all ${
                confirmClear
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
              }`}
            >
              <Trash2 size={16} />
              {confirmClear ? 'اضغط مرة أخرى للتأكيد: مسح كل البيانات المحلية' : 'مسح البيانات المحلية'}
            </button>
            {confirmClear && (
              <button
                onClick={() => setConfirmClear(false)}
                className="mt-2 w-full py-2 text-xs font-black text-slate-500 hover:text-slate-700"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={submit} className="btn-primary flex-1">
            حفظ الإعدادات
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
