import type { Handler, HandlerEvent } from '@netlify/functions';

/**
 * Returns the visitor's IP address.
 *
 * Meta CAPI uses client_ip_address as a match signal. It matters most for the
 * anonymous events this LP still fires (page view, CTA click) - there is no
 * email or phone on those, so IP and user-agent are doing the matching work.
 *
 * This replaces a Supabase edge function that did the same job, which was the
 * only remaining reason this landing page depended on Supabase at all.
 */
const handler: Handler = async (event: HandlerEvent) => {
  // Netlify sets this on every request. The x-forwarded-for fallback is for
  // netlify dev, which does not.
  const ip =
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    null;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({ ip }),
  };
};

export { handler };
