import React from 'react';
import { redirectToForm } from '@/lib/formUrl';

/**
 * The in-page form this route used to render has been retired - the form now
 * lives in the unified form product.
 *
 * The route itself is kept alive because historical links still point at it:
 * live ad creatives, bookmarks, and indexed URLs. Left rendering the old form,
 * those visitors would submit into this LP's retired Supabase/Zoho path and be
 * lost. Redirecting instead carries them - and their query params - to the real
 * form.
 */
export default function FormRedirect() {
  React.useEffect(() => {
    redirectToForm();
  }, []);

  return null;
}
