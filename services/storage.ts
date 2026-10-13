import { ReportData } from '../types';

const KEYS = {
  draft: 'rafiq.v1.draft',
  archive: 'rafiq.v1.archive',
  settings: 'rafiq.v1.settings',
} as const;

export interface AppSettings {
  apiBaseUrl: string;
  archiveApiUrl: string;
  font: string;
  profile: {
    supervisorName: string;
    directorate: string;
    school: string;
  };
}

export interface ArchiveEntry {
  id: string;
  teacherId: string;
  teacherName: string;
  school: string;
  savedAt: string;
  font: string;
  report: ReportData;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: '',
  archiveApiUrl: '',
  font: 'Tajawal',
  profile: { supervisorName: '', directorate: '', school: '' },
};

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const loadSettings = (): AppSettings => {
  try {
    const parsed = safeParse<Partial<AppSettings>>(localStorage.getItem(KEYS.settings), {});
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  } catch {
    /* التخزين غير متاح */
  }
};

export interface DraftState {
  report: ReportData;
  font: string;
  step: number;
  savedAt: number;
}

export const saveDraft = (report: ReportData, font: string, step: number): void => {
  try {
    localStorage.setItem(
      KEYS.draft,
      JSON.stringify({ report, font, step, savedAt: Date.now() } satisfies DraftState)
    );
  } catch {
    /* تجاهل امتلاء التخزين */
  }
};

export const loadDraft = (): DraftState | null => {
  try {
    const raw = localStorage.getItem(KEYS.draft);
    if (!raw) return null;
    const parsed = safeParse<DraftState | null>(raw, null);
    return parsed && parsed.report ? { step: 1, ...parsed } : null;
  } catch {
    return null;
  }
};

export const clearDraft = (): void => {
  try {
    localStorage.removeItem(KEYS.draft);
  } catch {
    /* ignore */
  }
};

export const loadArchive = (): ArchiveEntry[] => {
  try {
    return safeParse<ArchiveEntry[]>(localStorage.getItem(KEYS.archive), []);
  } catch {
    return [];
  }
};

export const saveToArchive = (entry: ArchiveEntry): ArchiveEntry[] => {
  const items = loadArchive();
  items.unshift(entry);
  const trimmed = items.slice(0, 100);
  try {
    localStorage.setItem(KEYS.archive, JSON.stringify(trimmed));
  } catch {
    /* امتلاء التخزين: حذف الأقدم */
    const reduced = trimmed.slice(0, 40);
    localStorage.setItem(KEYS.archive, JSON.stringify(reduced));
    return reduced;
  }
  return trimmed;
};

export const deleteFromArchive = (id: string): ArchiveEntry[] => {
  const items = loadArchive().filter((i) => i.id !== id);
  try {
    localStorage.setItem(KEYS.archive, JSON.stringify(items));
  } catch {
    /* ignore */
  }
  return items;
};

export const searchArchive = (query: string): ArchiveEntry[] => {
  const q = query.trim();
  if (!q) return [];
  return loadArchive().filter(
    (i) => i.teacherId.includes(q) || i.teacherName.includes(q) || i.school.includes(q)
  );
};
