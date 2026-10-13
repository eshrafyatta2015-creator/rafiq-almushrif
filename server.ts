import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// السماح بطلبات من تطبيق Android (Capacitor) ومن نطاقات أخرى
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (_req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('مفتاح GEMINI_API_KEY غير مهيأ على الخادم.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// مسار فحص صحة الخادم
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/analyze-proceedings', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const { proceedings } = req.body;
    if (!proceedings || typeof proceedings !== 'string' || !proceedings.trim()) {
      return res.status(400).json({ error: 'الرجاء إدخال نص مجريات الحصة أولاً.' });
    }

    const ai = getAiClient();
    
    // استدعاء النموذج الفعال والسريع gemini-3.1-flash-lite مع بديل في حال الحاجة
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `
        بصفتك خبيراً في الإشراف التربوي، قم بتحليل نص "مجريات الحصة" التالي بناءً على "المذكرة الاسترشادية للإشراف على المعلمين" الرسمية.
        النص المراد تحليله: "${proceedings}"
        
        المطلوب (يجب أن تكون النتائج بصيغة نقاط مهنية مركزة، كل نقطة تبدأ بـ "• "):
        - "positives": استخلص نقاط القوة وأبرز الممارسات الإيجابية.
        - "improvements": حدد جوانب التطوير وفرص التحسين.
        - "studentAchievement": حلل مستوى تفاعل الطلبة وتحصيلهم ومشاركتهم.
        - "others": ملحوظات حول التحضير والبيئة الصفية والوسائل المستخدمة.
        - "teacherRecommendations": توصيات إجرائية وتطويرية محددة للمعلم.
        - "principalRecommendations": توصيات لإدارة المدرسة لمساندة المعلم.
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            positives: { type: Type.STRING },
            improvements: { type: Type.STRING },
            studentAchievement: { type: Type.STRING },
            others: { type: Type.STRING },
            teacherRecommendations: { type: Type.STRING },
            principalRecommendations: { type: Type.STRING },
          },
          required: [
            'positives',
            'improvements',
            'studentAchievement',
            'others',
            'teacherRecommendations',
            'principalRecommendations',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing proceedings:', error);
    const msg = error?.message || '';
    if (msg.includes('429')) {
      return res.status(429).json({ error: 'تم تجاوز معدل الطلبات المسموح، يرجى المحاولة بعد قليل.' });
    }
    return res.status(500).json({ 
      error: error?.message || 'حدث خطأ أثناء إجراء التحليل الذكي لمجريات الحصة.' 
    });
  }
});

app.post('/api/analyze-performance', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const { content, performanceIndicators } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'بيانات التقرير مطلوبة.' });
    }

    const indicators: Array<{ id: string; label: string; max: number; domain: string }> =
      Array.isArray(performanceIndicators) ? performanceIndicators : [];

    const indicatorsSchema: Record<string, any> = {};
    indicators.forEach((ind) => {
      indicatorsSchema[ind.id] = {
        type: Type.NUMBER,
        description: `العلامة (0-${ind.max})`,
      };
    });

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `
        بصفتك مقيماً تربوياً، قم بتقدير علامات المعلم لكل مؤشر من مؤشرات الأداء التالية بناءً على التحليل الوصفي المرفق.
        
        التحليل الوصفي:
        - مجريات الحصة: "${content.proceedings || ''}"
        - نقاط القوة: "${content.positives || ''}"
        - جوانب التطوير: "${content.improvements || ''}"
        
        المؤشرات والحد الأقصى لكل منها:
        ${indicators.map((i) => `- ${i.label} (الحد الأقصى: ${i.max})`).join('\n')}
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: indicatorsSchema,
          required: indicators.map((ind) => ind.id),
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing performance:', error);
    const msg = error?.message || '';
    if (msg.includes('429')) {
      return res.status(429).json({ error: 'تم تجاوز معدل الطلبات المسموح، يرجى المحاولة بعد قليل.' });
    }
    return res.status(500).json({ 
      error: error?.message || 'حدث خطأ أثناء تقدير العلامات الذكي.' 
    });
  }
});

// ضمان عدم إعادة صفحة HTML لأي مسار تحت /api
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'المسار البرمجي غير موجود' });
});

// معالج الأخطاء العام
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err?.message || 'حدث خطأ غير متوقع في الخادم.' });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    // معالجة صفحات التطبيق لغير مسارات api
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on 0.0.0.0:${PORT}`);
  });
}

startServer();
