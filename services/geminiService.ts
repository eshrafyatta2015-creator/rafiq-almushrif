import { PERFORMANCE_INDICATORS } from '../constants';
import { ReportContent } from '../types';
import { loadSettings } from './storage';

export interface AnalysisResult {
  positives: string;
  improvements: string;
  studentAchievement: string;
  others: string;
  teacherRecommendations: string;
  principalRecommendations: string;
}

const NETWORK_ERROR_MSG =
  'تعذر الوصول إلى الخادم الذكي. تحقق من اتصال الإنترنت، وإذا كنت تستخدم التطبيق كملف APK فحدّد رابط الخادم في الإعدادات (أكمل التقرير يدويًا في هذه الأثناء).';

const getApiBase = (): string => {
  try {
    return (loadSettings().apiBaseUrl || '').replace(/\/+$/, '');
  } catch {
    return '';
  }
};

const request = async <T>(path: string, body: unknown, defaultErrorMsg: string): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (_e) {
    throw new Error(NETWORK_ERROR_MSG);
  }

  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (_e) {
    console.error('Non-JSON response from server:', text.slice(0, 300));
    throw new Error(`${defaultErrorMsg} (استجابة غير صالحة من الخادم)`);
  }

  if (!response.ok) {
    throw new Error(data?.error || defaultErrorMsg);
  }

  return data as T;
};

export const analyzeProceedings = async (proceedings: string): Promise<AnalysisResult> => {
  return request<AnalysisResult>(
    '/api/analyze-proceedings',
    { proceedings },
    'حدث خطأ أثناء تحليل مجرييات الحصة'
  );
};

export const analyzePerformance = async (
  content: ReportContent
): Promise<Record<string, number>> => {
  return request<Record<string, number>>(
    '/api/analyze-performance',
    { content, performanceIndicators: PERFORMANCE_INDICATORS },
    'حدث خطأ أثناء تقدير العلامات'
  );
};
