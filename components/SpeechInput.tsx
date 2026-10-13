import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface SpeechInputProps {
  value: string;
  onChange: (text: string) => void;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  error?: boolean;
  maxLength?: number;
}

const SpeechInput: React.FC<SpeechInputProps> = ({
  value,
  onChange,
  label,
  placeholder,
  multiline = false,
  required = false,
  error = false,
  maxLength,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'ar-SA';

    rec.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        const current = valueRef.current;
        onChange(current + (current ? ' ' : '') + finalTranscript.trim());
      }
    };

    rec.onerror = (event: any) => {
      setIsListening(false);
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setSpeechError('تم رفض إذن الميكروفون. فعّل إذن الميكروفون من إعدادات المتصفح.');
      } else if (event?.error === 'no-speech') {
        setSpeechError('لم يتم التقاط أي صوت، حاول مرة أخرى.');
      } else if (event?.error !== 'aborted') {
        setSpeechError('تعذر تشغيل التعرّف الصوتي على هذا الجهاز.');
      }
    };

    rec.onend = () => setIsListening(false);
    setRecognition(rec);

    return () => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const supportsSpeech =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const toggleListening = () => {
    if (!recognition) {
      setSpeechError('الإملاء الصوتي غير مدعوم على هذا المتصفح/الجهاز، يمكنك الكتابة يدويًا.');
      return;
    }
    setSpeechError(null);
    if (isListening) {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch {
        setSpeechError('تعذر بدء التسجيل الصوتي، حاول بعد لحظات.');
      }
    }
  };

  const inputClasses = `w-full p-3.5 bg-slate-50 border-2 rounded-2xl text-sm focus:ring-4 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-400 placeholder:font-medium ${
    error
      ? 'border-red-300 bg-red-50/40 focus:ring-red-100'
      : 'border-slate-100 focus:ring-blue-100 focus:border-blue-300'
  }`;

  return (
    <div className="flex flex-col space-y-2 mb-4">
      <div className="flex justify-between items-center gap-2">
        <label className="text-sm font-black text-slate-600">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
          {maxLength && value.length > 0 && (
            <span className="text-[11px] font-bold text-slate-400 mr-2">{value.length} حرف</span>
          )}
        </label>
        <button
          type="button"
          onClick={toggleListening}
          aria-label={isListening ? 'إيقاف الإملاء الصوتي' : 'بدء الإملاء الصوتي'}
          className={`p-2.5 rounded-full transition-all ${
            isListening
              ? 'bg-red-100 text-red-600 animate-pulse shadow-lg shadow-red-100'
              : supportsSpeech
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'bg-slate-100 text-slate-400'
          }`}
          title={
            !supportsSpeech
              ? 'الإملاء الصوتي غير مدعوم على هذا الجهاز'
              : isListening
              ? 'إيقاف التسجيل'
              : 'ابدأ التسجيل الصوتي'
          }
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
      </div>

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`${inputClasses} min-h-[150px] resize-y leading-relaxed`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={inputClasses}
        />
      )}

      {speechError && (
        <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 animate-fadeIn">
          <AlertCircle size={14} /> {speechError}
        </p>
      )}
    </div>
  );
};

export default SpeechInput;
