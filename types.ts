
export interface TeacherInfo {
  name: string;
  idNumber: string;
  qualification: string;
  specialization: string;
  hireDate: string;
}

export interface VisitInfo {
  date: string;
  visitNumber: string;
  type: 'وجاهية' | 'افتراضية متزامنة' | 'افتراضية غير متزامنة';
  subject: string;
  lessonTopic: string;
  classSection: string;
  period: string;
  academicYear: string;
}

export interface ReportContent {
  proceedings: string;
  positives: string;
  improvements: string;
  studentAchievement: string;
  others: string;
  teacherRecommendations: string;
  principalRecommendations: string;
}

export interface PerformanceScores {
  [key: string]: number;
}

export interface ReportData {
  directorate: string;
  school: string;
  schoolNationalId: string;
  teacher: TeacherInfo;
  visit: VisitInfo;
  content: ReportContent;
  scores: PerformanceScores;
  supervisorName: string;
  supervisorSignature?: string;
}
