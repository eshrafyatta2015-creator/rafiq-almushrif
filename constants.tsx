
import React from 'react';

export const PERFORMANCE_INDICATORS = [
  { id: 'cur_1', domain: 'المنهاج\nوالمحتوى', label: 'يوظف أسس المنهاج وخطوطه العريضة في العملية التعليمية التعلمية.', max: 5 },
  { id: 'cur_2', domain: 'المنهاج\nوالمحتوى', label: 'يتمكن من ربط الأهداف العامة للمنهاج بأهداف المرحلة والأهداف الخاصة.', max: 7 },
  { id: 'cur_3', domain: 'المنهاج\nوالمحتوى', label: 'يتمكن من المحتوى التعليمي ويعمل على إثرائه.', max: 7 },
  { id: 'cur_4', domain: 'المنهاج\nوالمحتوى', label: 'يتمكن من الربط العمودي والأفقي للمحتوى التعليمي وبشكل تكاملي.', max: 7 },
  
  { id: 'ped_1', domain: 'البيداغوجيا العامة وبيداغوجيا المحتوى', label: 'يستخدم إستراتيجيات تدريس متنوعة تتلاءم مع الموقف التعليمي التعلمي، موظفاً المرافق المدرسية.', max: 7 },
  { id: 'ped_2', domain: 'البيداغوجيا العامة وبيداغوجيا المحتوى', label: 'يعد الخطط ويطورها وفق أسس علمية.', max: 5 },
  { id: 'ped_3', domain: 'البيداغوجيا العامة وبيداغوجيا المحتوى', label: 'يوظف تكنولوجيا التعليم بأنواعها في العملية التعليمية التعلمية، وجاهياً أو افتراضياً (عن بعد).', max: 4 },
  { id: 'ped_4', domain: 'البيداغوجيا العامة وبيداغوجيا المحتوى', label: 'يوظف المنصات التعليمية الإلكترونية (البوابة التعليمية elearn)، وفضائية فلسطين التعليمية؛ لتعزيز تعلم الطلبة.', max: 4 },
  { id: 'ped_5', domain: 'البيداغوجيا العامة وبيداغوجيا المحتوى', label: 'يوفر مناخاً تعليمياً آمناً وداعماً يمتاز بالمرونة، والابتكار، والتحفيز المستمر.', max: 6 },
  { id: 'ped_6', domain: 'البيداغوجيا العامة وبيداغوجيا المحتوى', label: 'يوظف القياس والتقويم التربوي بأنواعه.', max: 6 },
  { id: 'ped_7', domain: 'البيداغوجيا العامة وبيداغوجيا المحتوى', label: 'يكلف الطلبة بمهمات تعزز مهارات البحث العلمي ومهارات القرائية.', max: 4 },
  { id: 'ped_8', domain: 'البيداغوجيا العامة وبيداغوجيا المحتوى', label: 'يتمكن من ربط المبحث بسياقات حياتية وتعليمية واجتماعية متنوعة.', max: 6 },
  { id: 'ped_9', domain: 'البيداغوجيا العامة وبيداغوجيا المحتوى', label: 'يوظف طرق التدريس بما ينسجم مع احتياجات الطلبة وقدراتهم وخصائصهم النمائية.', max: 6 },
  { id: 'ped_10', domain: 'البيداغوجيا العامة وبيداغوجيا المحتوى', label: 'يدمج الطلبة ذوي الاحتياجات الخاصة في العملية التعليمية التعلمية.', max: 3 },
  
  { id: 'self_1', domain: 'الكفايات الذاتية', label: 'يتمكن من أساسيات اللغة العربية والعلوم والرياضيات.', max: 3 },
  { id: 'self_2', domain: 'الكفايات الذاتية', label: 'يعمق معرفته بالمحتوى العلمي، ويوجهها نحو زيادة اإللمام بموضوع محدد.', max: 4 },
  { id: 'self_3', domain: 'الكفايات الذاتية', label: 'يستثمر التغذية الراجعة الواردة من الجهات ذات العلاقة بالعملية التعليمية في تطوير أدائه.', max: 3 },
  { id: 'self_4', domain: 'الكفايات الذاتية', label: 'يوظف مهارات الاتصال والتواصل في العملية التعليمية التعلمية.', max: 3 },
  { id: 'self_5', domain: 'الكفايات الذاتية', label: 'يحرص على استمرارية نموه المهني، ويعد أبحاثاً أو مبادرات في مجال تخصصه.', max: 4 },
  
  { id: 'eth_1', domain: 'أخلاقيات\nالمهنة\nوقواعد\nالسلوك', label: 'يلتزم بالأنظمة والقوانين واللوائح التربوية المعمول بها.', max: 2 },
  { id: 'eth_2', domain: 'أخلاقيات\nالمهنة\nوقواعد\nالسلوك', label: 'يشارك في اللجان المختلفة والأنشطة التربوية.', max: 2 },
  { id: 'eth_3', domain: 'أخلاقيات\nالمهنة\nوقواعد\nالسلوك', label: 'يحرص على بناء عالقات إنسانية مع الأطراف ذات العلاقة.', max: 2 },
];

export const INITIAL_REPORT: any = {
  directorate: '',
  school: '',
  schoolNationalId: '',
  teacher: {
    name: '',
    idNumber: '',
    qualification: '',
    specialization: '',
    hireDate: '',
  },
  visit: {
    date: new Date().toISOString().split('T')[0],
    visitNumber: '1',
    type: 'وجاهية',
    subject: '',
    lessonTopic: '',
    classSection: '',
    period: '',
    academicYear: '2024/2025',
  },
  content: {
    proceedings: '',
    positives: '',
    improvements: '',
    studentAchievement: '',
    others: '',
    teacherRecommendations: '',
    principalRecommendations: '',
  },
  scores: PERFORMANCE_INDICATORS.reduce((acc: any, curr) => ({ ...acc, [curr.id]: 0 }), {}),
  supervisorName: '',
};

export const PALESTINE_LOGO_SVG = (
  <svg width="100" height="120" viewBox="0 0 512 600" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* High-fidelity Palestine Eagle Reconstruction */}
    <path d="M256 30L210 90L140 80L80 200L50 350L100 450L256 500L412 450L462 350L432 200L372 80L302 90L256 30Z" fill="#B8860B"/>
    <path d="M256 50L220 100L160 90L110 210L90 340L130 440L256 480L382 440L422 340L402 210L352 90L292 100L256 50Z" fill="#D4AF37"/>
    
    {/* Shield details */}
    <rect x="206" y="220" width="100" height="150" fill="white" stroke="black" strokeWidth="3"/>
    <path d="M206 220L256 270L306 220H206Z" fill="#EE2A35"/>
    <rect x="206" y="220" width="33" height="150" fill="black"/>
    <rect x="273" y="220" width="33" height="150" fill="#007A3D"/>
    
    {/* Base Scroll with text */}
    <path d="M80 440C80 440 160 500 256 500C352 500 432 440 432 440V470C432 470 352 520 256 520C160 520 80 470 80 470V440Z" fill="white" stroke="black" strokeWidth="2"/>
    <text x="256" y="495" textAnchor="middle" fontSize="35" fontWeight="900" fill="black" fontFamily="Tajawal">فلسطين</text>
  </svg>
);
