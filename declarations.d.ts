declare module 'html2pdf.js' {
  const html2pdf: any;
  export default html2pdf;
}

interface CapacitorGlobal {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    platform?: string;
  };
}

declare global {
  interface Window extends CapacitorGlobal {}
}

export {};
