import React, { useState } from 'react';
import { X, Server, Type as TypeIcon, UserRound, Trash2, ShieldCheck } from 'lucide-react';
import { AppSettings } from '../services/storage';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onClose: () => void;
  onClearLocalData: () => void;
}

const FONTS = [
  { name: 'Tajawal', label: 'تجوال (عصري)' },
  { name: 'Cairo', label: 'كايو (هندسي)' },
  { name: 'Almarai', label: 'المراعي (ناعم)' },
  { name: 'Amiri', label: 'الأميري (رسمي كلاسيكي)' },
  { name: 'El Messiri', label: 'المسيري (فني)' },
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
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [urlError, setUrlError] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

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
