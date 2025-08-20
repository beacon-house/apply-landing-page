import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { initializeAnalytics } from '@/lib/analytics';
import { initializeMetaPixel } from '@/lib/metaPixelEvents';
import { getUtmParametersFromUrl } from '@/lib/utm';
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
  
  React.useEffect(() => {
    // Initialize Google Analytics
    initializeAnalytics();
    
    // Initialize Meta Pixel
    initializeMetaPixel();
    
    // Extract and set UTM parameters
    const utm = getUtmParametersFromUrl();
    setUtmParameters(utm);
  }, [setUtmParameters]);

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