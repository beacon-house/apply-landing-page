import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { initializeAnalytics } from '@/lib/analytics';
import { initializeMetaPixel } from '@/lib/metaPixelEvents';
import { getUtmParametersFromUrl } from '@/lib/utm';
import { fetchClientIpAddress } from '@/lib/clientInfo';
import { useFormStore } from '@/store/formStore';
import LandingPage from './components/LandingPage';
import FormPage from './components/FormPage';
import NotFound from './components/NotFound';

declare global {
  interface Window {
    scrollToForm: () => void;
  }
}

function App() {
  const { setUtmParameters } = useFormStore();

  // Set UTM params synchronously before first render so child components
  // (FormContainer, etc.) see them in their mount effects. React runs
  // child effects before parent effects, so a useEffect here would be
  // too late — the first incremental save would read an empty store.
  const utmInitialized = React.useRef(false);
  if (!utmInitialized.current) {
    utmInitialized.current = true;
    const utm = getUtmParametersFromUrl();
    if (Object.keys(utm).length > 0) {
      setUtmParameters(utm);
    }
  }

  React.useEffect(() => {
    // Initialize Google Analytics
    initializeAnalytics();
    
    // Initialize Meta Pixel
    initializeMetaPixel();
    
    // Fetch client IP asynchronously (non-blocking)
    fetchClientIpAddress().catch(() => {});
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/application-form" element={<FormPage />} />
      <Route path="/questionnaire" element={<Navigate to="/application-form" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;