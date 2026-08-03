/**
 * Unified Form Hand-off
 *
 * The lead form no longer lives in this landing page. It lives in the unified
 * form product, and this LP is design + CTA only. Everything needed to hand a
 * visitor over to that form - and to keep their attribution intact across the
 * domain hop - lives in this one file.
 */

/**
 * Which landing page this is, from the form's point of view.
 *
 * Hardcoded rather than an env var on purpose: this value is identical in
 * staging and prod, so making it configurable would only add a way to forget
 * it. A missing env var here would silently produce unattributed leads.
 */
export const LEAD_SOURCE = 'apply';

/**
 * Used only if VITE_FORM_URL is missing. A dead CTA loses every lead on the
 * site, so we would rather send the visitor to the real production form than
 * fail. Same constant in both environments, so staging can be promoted to prod
 * unchanged.
 */
const FALLBACK_FORM_URL = 'https://form.beaconhouse.in/';

/** Give in-flight Pixel/GA4 beacons time to leave the tab before we unload it. */
const EVENT_FLUSH_DELAY_MS = 150;

function getFormBaseUrl(): string {
  const configured = import.meta.env.VITE_FORM_URL?.trim();

  if (!configured) {
    console.error(
      `[formUrl] VITE_FORM_URL is not set. Falling back to ${FALLBACK_FORM_URL}`
    );
    return FALLBACK_FORM_URL;
  }

  return configured;
}

/**
 * Build the hand-off URL: the form's base URL, carrying this visitor's inbound
 * query params, stamped with which LP they came from.
 *
 * Every inbound param is forwarded verbatim rather than an allow-list of known
 * UTMs. That is deliberate - it is what carries `fbclid` (which the form's Meta
 * Pixel needs to set `_fbc`, without which CAPI cannot attribute the ad click)
 * and `gclid`, plus anything Meta or Google adds later.
 */
export function buildFormUrl(search: string = window.location.search): string {
  let url: URL;

  try {
    url = new URL(getFormBaseUrl());
  } catch {
    console.error('[formUrl] VITE_FORM_URL is not a valid URL. Using fallback.');
    url = new URL(FALLBACK_FORM_URL);
  }

  new URLSearchParams(search).forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  // Stamped last: this LP owns its own identity, so an inbound `lead_source`
  // must never be able to overwrite it.
  url.searchParams.set('lead_source', LEAD_SOURCE);

  return url.toString();
}

/**
 * Send a visitor to the form from a CTA click.
 *
 * The delay matters. Callers fire their Pixel and GA4 CTA events immediately
 * before this, and those are fire-and-forget beacons. Previously the form was
 * an in-app route, so nothing tore down and the beacons always landed. Now the
 * navigation is cross-origin and unloads the page, which can cut a beacon
 * mid-flight and lose the CTA-click event. The delay is imperceptible to the
 * visitor and buys those beacons the moment they need.
 */
export function navigateToForm(): void {
  const target = buildFormUrl();

  window.setTimeout(() => {
    window.location.assign(target);
  }, EVENT_FLUSH_DELAY_MS);
}

/**
 * Send a visitor to the form from the retired in-page form route.
 *
 * No delay (there is no CTA event to flush) and `replace` rather than `assign`,
 * so the dead route does not sit in history and bounce the visitor back into
 * the redirect on a Back press.
 */
export function redirectToForm(): void {
  window.location.replace(buildFormUrl());
}
