import React, { useEffect, useState } from 'react';
import {
  X,
  Database,
  Search,
  Save,
  Trash2,
  FolderOpen,
  Cloud,
  HardDrive,
  Loader2,
  FileText,
} from 'lucide-react';
import { ReportData } from '../types';
import {
  ArchiveEntry,
  AppSettings,
  deleteFromArchive,
  loadArchive,
  saveToArchive,
} from '../services/storage';

interface ArchiveModalProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  currentReport: ReportData;
  currentFont: string;
  canSaveCurrent: boolean;
  onLoad: (report: ReportData, font: string) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('ar-PS', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const ArchiveModal: React.FC<ArchiveModalProps> = ({
  open,
  onClose,
  settings,
  currentReport,
  currentFont,
  canSaveCurrent,
  onLoad,
  onToast,
}) => {
  const [items, setItems] = useState<ArchiveEntry[]>([]);
  const [query, setQuery] = useState('');
  const [cloudStatus, setCloudStatus] = useState<{ msg: string; type: 'success' | 'error' | 'loading' } | null>(
    null
  );
  const [cloudId, setCloudId] = useState('');

  useEffect(() => {
    if (open) {
      setItems(loadArchive());
      setCloudStatus(null);
    }
  }, [open]);

  if (!open) return null;

  const cloudUrl = (settings.archiveApiUrl || '').replace(/\/+$/, '');
  const trimmedQuery = query.trim();
  const results = trimmedQuery
    ? items.filter(
        (i) =>
          i.teacherId.includes(trimmedQuery) ||
          i.teacherName.includes(trimmedQuery) ||
          i.school.includes(trimmedQuery)
      )
    : items;

  const handleSaveLocal = () => {
    if (!currentReport.teacher.idNumber || !currentReport.teacher.name) {
      onToast('أدخل رقم هوية واسم المعلم في الخطوة الأولى قبل الحفظ.', 'error');
      return;
    }
    const entry: ArchiveEntry = {
      id: `${Date.now()}`,
      teacherId: currentReport.teacher.idNumber,
      teacherName: currentReport.teacher.name,
      school: currentReport.school,
      savedAt: new Date().toISOString(),
      font: currentFont,
      report: currentReport,
    };
    setItems(saveToArchive(entry));
    onToast('تم حفظ التقرير في أرشيف الجهاز بنجاح ✅', 'success');
  };

  const handleDelete = (id: string) => {
    setItems(deleteFromArchive(id));
    onToast('تم حذف السجل من الأرشيف.', 'info');
  };

  const cloudAction = async (action: 'save' | 'search') => {
    const id = action === 'save' ? currentReport.teacher.idNumber : cloudId.trim();
    if (!id) {
      onToast(action === 'save' ? 'أدخل رقم هوية المعلم أولاً.' : 'أدخل رقم الهوية للبحث.', 'error');
      return;
    }
    setCloudStatus({ msg: 'جاري الاتصال بالأرشيف السحابي...', type: 'loading' });
    try {
      if (action === 'save') {
        const response = await fetch(`${cloudUrl}?action=save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            name: currentReport.teacher.name,
            reportData: currentReport,
          }),
        });
        const result = await response.json();
        if (result.status === 'success') {
          setCloudStatus({ msg: 'تم الحفظ في الأرشيف السحابي بنجاح ✅', type: 'success' });
        } else {
          setCloudStatus({ msg: result.message || 'تعذر الحفظ في الأرشيف السحابي.', type: 'error' });
        }
      } else {
        const response = await fetch(`${cloudUrl}?action=search&id=${encodeURIComponent(id)}`);
        const result = await response.json();
        if (result.status === 'success') {
          try {
            onLoad(JSON.parse(result.savedData), currentFont);
            setCloudStatus({ msg: 'تم استرجاع البيانات من السحابة بنجاح ✅', type: 'success' });
            setTimeout(onClose, 1200);
          } catch {
            setCloudStatus({ msg: 'البيانات المسترجعة غير صالحة.', type: 'error' });
          }
        } else {
          setCloudStatus({ msg: 'لم يتم العثور على سجلات لهذا الرقم في السحابة.', type: 'error' });
        }
      }
    } catch {
      setCloudStatus({ msg: 'فشل الاتصال بالأرشيف السحابي، تحقق من الرابط والاتصال.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeInScale">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Database size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">الأرشيف</h3>
              <p className="text-[11px] font-bold text-slate-500">
                {items.length} سجل محفوظ على هذا الجهاز
              </p>
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

        {/* حفظ التقرير الحالي */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-2 text-emerald-800">
              <HardDrive size={18} />
              <p className="text-xs font-black leading-relaxed">
                حفظ التقرير المفتوح حاليًا في أرشيف الجهاز
              </p>
            </div>
            <button
              onClick={handleSaveLocal}
              disabled={!canSaveCurrent}
              className="btn-success !py-3 !px-5 text-sm disabled:opacity-40"
            >
              <Save size={16} /> حفظ محلي
            </button>
          </div>
          {!canSaveCurrent && (
            <p className="text-[11px] font-bold text-emerald-700 mt-2">
              أكمل رقم هوية واسم المعلم أولًا (الخطوة 1).
            </p>
          )}
        </div>

        {/* البحث المحلي */}
        <div className="flex gap-2 mb-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث برقم الهوية أو اسم المعلم أو المدرسة..."
            className="field-input flex-1"
          />
          <button className="p-3.5 bg-slate-100 text-slate-600 rounded-2xl" aria-label="بحث">
            <Search size={20} />
          </button>
        </div>

        {/* النتائج */}
        <div className="space-y-3 mb-6">
          {results.length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-black text-slate-500">
                {trimmedQuery ? 'لا توجد نتائج مطابقة' : 'لا توجد تقارير محفوظة بعد'}
              </p>
              <p className="text-xs font-bold text-slate-400 mt-1">
                {trimmedQuery ? 'جرّب رقم هوية آخر' : 'احفظ تقريرك ليظهر هنا'}
              </p>
            </div>
          )}
          {results.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:bg-slate-100/70 transition-all"
            >
              <div className="p-2.5 bg-white text-blue-600 rounded-xl shadow-sm flex-shrink-0">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-slate-900 truncate">{item.teacherName}</p>
                <p className="text-[11px] font-bold text-slate-500 truncate">
                  هوية: {item.teacherId} • {item.school || 'بدون مدرسة'} • {formatDate(item.savedAt)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    onLoad(item.report, item.font || currentFont);
                    onToast('تم فتح التقرير المحفوظ ✅', 'success');
                    onClose();
                  }}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                  title="فتح التقرير"
                >
                  <FolderOpen size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2.5 bg-white text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-all"
                  title="حذف السجل"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* الأرشيف السحابي (اختياري) */}
        <div className="pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Cloud size={18} className="text-indigo-600" />
            <h4 className="font-black text-sm text-slate-800">الأرشيف السحابي (اختياري)</h4>
          </div>
          {!cloudUrl ? (
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed bg-slate-50 rounded-xl p-3">
              غير مفعّل. يمكنك تفعيله بإدخال «رابط الأرشيف السحابي» في الإعدادات — التخزين المحلي
              يعمل دون إعداد أي شيء.
            </p>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="search"
                  value={cloudId}
                  onChange={(e) => setCloudId(e.target.value)}
                  placeholder="رقم الهوية للبحث في السحابة"
                  className="field-input flex-1"
                />
                <button
                  onClick={() => cloudAction('search')}
                  className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all"
                  aria-label="بحث سحابي"
                >
                  <Search size={20} />
                </button>
                <button
                  onClick={() => cloudAction('save')}
                  disabled={!canSaveCurrent}
                  className="p-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-40"
                  aria-label="حفظ سحابي"
                >
                  <Save size={20} />
                </button>
              </div>
              {cloudStatus && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs font-black text-center flex items-center justify-center gap-2 ${
                    cloudStatus.type === 'loading'
                      ? 'bg-blue-50 text-blue-600'
                      : cloudStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {cloudStatus.type === 'loading' && <Loader2 size={14} className="animate-spin" />}
                  {cloudStatus.msg}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveModal;
