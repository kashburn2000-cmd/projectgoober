/**
 * Central site configuration.
 *
 * BRANDING IS ONE-LINE SWAPPABLE: every page, schema block, legal page, and the
 * logo render the name from this file. If the primary domain choice isn't
 * available, change SITE_NAME + SITE_URL here and rebuild — nothing else.
 */

export const SITE_NAME = 'WattBill';
export const SITE_URL = 'https://wattbill.com';
export const SITE_TAGLINE = 'What every plug in your home really costs';
export const SITE_DESCRIPTION =
  'Find out what any appliance costs to run using current electricity rates for your state — not a stale national average. Free calculators, state-by-state data, and a bill analyzer.';

/** Contact address — set up free Cloudflare Email Routing to forward this. */
export const CONTACT_EMAIL = 'hello@wattbill.com';

/**
 * Google AdSense publisher ID, e.g. 'ca-pub-1234567890123456'.
 * Leave null until your AdSense application is approved. While null, the site
 * renders no ad markup at all (no empty boxes, no layout shift).
 */
export const ADSENSE_PUB_ID = null;

/**
 * Cloudflare Web Analytics beacon token (free, cookieless). Optional.
 * Dashboard → Analytics & Logs → Web Analytics → Add site.
 */
export const CF_ANALYTICS_TOKEN = null;

/** Assumptions used across every calculator and page. */
export const DEFAULTS = {
  /** Fallback ¢/kWh when no state is chosen (US residential average; auto-refreshed). */
  daysPerMonth: 30.4,
  weeksPerMonth: 4.35,
};
