export interface RouteResult {
  scene: string;
  data: Record<string, any>;
}

// Only game routes live here — UI pages (/, /paper-crew, /paper-crew-room/:id, etc.)
// are handled by Vue components in App.vue
const routes: Array<{ pattern: RegExp; scene: string; extract?: (m: RegExpMatchArray) => Record<string, any> }> = [
  { pattern: /^\/toss-paper\/single$/, scene: 'TossPaperScene', extract: () => ({ mode: 'single' }) },
  {
    pattern: /^\/toss-paper\/multi\/(\d+)$/,
    scene: 'TossPaperScene',
    extract: (m) => ({ mode: 'multi', crew_id: parseInt(m[1], 10) }),
  },
  // Legacy /toss-paper redirects to single
  { pattern: /^\/toss-paper$/, scene: 'TossPaperScene', extract: () => ({ mode: 'single' }) },
  { pattern: /^\/origami-trail$/, scene: 'OrigamiTrailScene' },
  {
    pattern: /^\/origami-trail\/multi\/(\d+)$/,
    scene: 'OrigamiTrailScene',
    extract: (m) => ({ mode: 'multi', crew_id: parseInt(m[1], 10) }),
  },
];

export function resolveRoute(): RouteResult | null {
  const path = window.location.pathname;
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (match) {
      return { scene: route.scene, data: route.extract ? route.extract(match) : {} };
    }
  }
  return null;
}

export function pushRoute(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new CustomEvent('paper-navigate', { detail: { path } }));
}
