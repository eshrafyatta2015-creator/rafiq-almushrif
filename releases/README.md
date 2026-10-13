# مجلد الإصدارات (releases)

يوضع هنا ملفات APK الناتجة من عملية البناء:

| الملف | الوصف |
| --- | --- |
| `RafiqAlmushrif.apk` | نسخة التوزيع (Release) — موقّعة بتوقيع المشروع محليًا |
| `RafiqAlmushrif-debug.apk` | نسخة الاختبار (Debug) — موقّعة بتوقيع Android التجريبي |

## ملاحظات مهمة

- ملفات `*.apk` **مستدامة من Git** عمداً (لتجنب تضخيم المستودع)؛ النسخ الجاهزة للتوزيع تُرفع إلى **GitHub Releases**، وكل بناء يُتاح كـ **Artifact** في GitHub Actions.
- لإعادة بناء الملفات محليًا:

```bash
npm run android:sync
cd android
./gradlew assembleDebug assembleRelease   # أو gradlew.bat على Windows
```

ثم انسخ الملفات من `android/app/build/outputs/apk/` إلى هنا.

- رابط التنزيل المباشر للإصدار: انظر صفحة **Releases** في المستودع.
