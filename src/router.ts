export interface RouteResult {
  scene: string;
  data: Record<string, any>;
}

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
  { pattern: /^\/paper-crew$/, scene: 'PaperCrewScene' },
  { pattern: /^\/paper-crew\/create$/, scene: 'CreateCrewScene' },
  { pattern: /^\/paper-crew\/join$/, scene: 'JoinCrewScene' },
  {
    pattern: /^\/paper-crew-room\/(\d+)$/,
    scene: 'CrewDetailScene',
    extract: (m) => ({ crewId: parseInt(m[1], 10) }),
  },
];

export function resolveRoute(): RouteResult {
  const path = window.location.pathname;
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (match) {
      return { scene: route.scene, data: route.extract ? route.extract(match) : {} };
    }
  }
  return { scene: 'MainMenuScene', data: {} };
}

export function pushRoute(path: string) {
  window.history.pushState({}, '', path);
}
