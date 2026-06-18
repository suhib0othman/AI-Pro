import ReactGA from 'react-ga4';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export function initGA(): void {
  if (!MEASUREMENT_ID) return;
  ReactGA.initialize(MEASUREMENT_ID);
}

export function trackPageView(path: string): void {
  if (!MEASUREMENT_ID) return;
  ReactGA.send({ hitType: 'pageview', page: path });
}

export function trackEvent(category: string, action: string, label?: string): void {
  if (!MEASUREMENT_ID) return;
  ReactGA.event({ category, action, label });
}
