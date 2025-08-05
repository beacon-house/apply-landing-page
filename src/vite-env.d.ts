/// <reference types="vite/client" />

interface Window {
  scrollToForm: () => void;
  dataLayer: any[];
  gtag: (...args: any[]) => void;
  fbq: (...args: any[]) => void;
  _fbq: any;
}