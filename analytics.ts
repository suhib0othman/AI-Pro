import ReactGA from 'react-ga4';

const MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || 'G-SY6W6MWW38';

export function initGA(): void {
  ReactGA.initialize(MEASUREMENT_ID);
}

export function trackPageView(path: string): void {
  ReactGA.send({ hitType: 'pageview', page: path });
}

export function trackEvent(category: string, action: string, label?: string): void {
  ReactGA.event({ category, action, label });
}
