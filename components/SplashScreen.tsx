import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 1900;
    const timer = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(timer);
        onFinish();
      }
    }, 40);
    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className="fixed inset-0 z-[5000] flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 cursor-pointer select-none"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.35), transparent 45%), radial-gradient(circle at 80% 75%, rgba(79,70,229,0.35), transparent 45%)',
      }}
    >
      <div className="flex flex-col items-center animate-fadeInScale">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/40 blur-3xl rounded-full scale-110" />
          <img
            src="/icon.svg"
            alt="شعار رفيق المشرف"
            width={132}
            height={132}
            className="relative w-[132px] h-[132px] rounded-[2rem] shadow-2xl shadow-blue-900/60"
          />
          <div className="absolute -bottom-2 -left-2 bg-white/95 p-2 rounded-2xl shadow-xl">
            <Sparkles size={22} className="text-blue-700" />
          </div>
        </div>

        <h1 className="mt-8 text-4xl md:text-5xl font-black text-white tracking-tight text-center leading-tight">
          رفيق المشرف
        </h1>
        <p className="mt-3 text-blue-200 font-bold text-sm md:text-base text-center px-6">
          رفيقك الذكي في الزيارات الصفية وتقارير الإشراف التربوي
        </p>

        <div className="mt-10 w-56 h-1.5 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-blue-400 to-emerald-400 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-4 text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">
          Supervision Automation System
        </p>
      </div>

      <p className="absolute bottom-8 text-xs font-bold text-white/40">اضغط للدخول مباشرة</p>
    </div>
  );
};

export default SplashScreen;
