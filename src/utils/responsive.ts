/**
 * Responsive helpers for Phaser scenes.
 * Detects mobile vs desktop based on canvas scale factor and provides
 * scaled sizes for text, buttons, and layout.
 */

export interface ResponsiveConfig {
  isMobile: boolean;
  /** Scale multiplier: 1.0 on desktop, higher on mobile to compensate for small canvas */
  uiScale: number;
  /** Number of columns for object picker grid */
  pickerCols: number;
  /** Font sizes */
  fontSize: {
    hud: number;
    hudSmall: number;
    body: number;
    bodySmall: number;
    button: number;
    title: number;
  };
  /** Minimum interactive zone size (px in game coords) */
  minTouchTarget: number;
  /** Padding values */
  padding: {
    edge: number;
    hudTop: number;
  };
}

/**
 * Compute responsive config based on the actual rendered canvas size.
 * The game's internal resolution is always 800x600, but the canvas
 * gets scaled to fit the screen. On a 375px-wide phone the scale is ~0.47,
 * making 14px text render at ~7 real pixels — unreadable.
 *
 * We bump up game-coordinate sizes on mobile so that after canvas scaling
 * the rendered result is still legible.
 */
export function getResponsiveConfig(): ResponsiveConfig {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    return desktopDefaults();
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / 800;

  // If the canvas is rendered smaller than ~550px wide, treat as mobile
  const isMobile = rect.width < 550;

  if (!isMobile) {
    return desktopDefaults();
  }

  // On mobile: scale up UI elements inversely proportional to canvas shrink
  // At 375px width, scaleX ≈ 0.47. We want text to be ~2x bigger in game coords.
  const uiScale = Math.min(2.2, 1 / scaleX * 0.85);

  return {
    isMobile: true,
    uiScale,
    pickerCols: 3,
    fontSize: {
      hud: Math.round(18 * uiScale),
      hudSmall: Math.round(14 * uiScale),
      body: Math.round(16 * uiScale),
      bodySmall: Math.round(12 * uiScale),
      button: Math.round(18 * uiScale),
      title: Math.round(16 * uiScale),
    },
    minTouchTarget: Math.round(44 * uiScale),
    padding: {
      edge: Math.round(16 * uiScale),
      hudTop: Math.round(12 * uiScale),
    },
  };
}

function desktopDefaults(): ResponsiveConfig {
  return {
    isMobile: false,
    uiScale: 1,
    pickerCols: 4,
    fontSize: {
      hud: 18,
      hudSmall: 14,
      body: 16,
      bodySmall: 11,
      button: 14,
      title: 14,
    },
    minTouchTarget: 44,
    padding: {
      edge: 16,
      hudTop: 12,
    },
  };
}
