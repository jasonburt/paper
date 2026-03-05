import { api } from './api';

const STORAGE_KEY = 'paper_user';
const COLOR_KEY = 'paper_color';
const ICON_KEY = 'paper_icon';
const PROFILE_SET_KEY = 'paper_profile_set';

// Origami-inspired player colors
export const PLAYER_COLORS = [
  { label: 'Red-Orange', hex: '#FF4F36' },
  { label: 'Sky Blue', hex: '#4992FF' },
  { label: 'Star Yellow', hex: '#FDE801' },
  { label: 'Petal Orange', hex: '#FF8F01' },
  { label: 'Mint', hex: '#2ED8A3' },
  { label: 'Violet', hex: '#9B59B6' },
];

// Paper-themed player icons (drawn as simple shapes in Phaser)
export const PLAYER_ICONS = [
  { key: 'plane', label: 'Paper Plane', emoji: '✈' },
  { key: 'crane', label: 'Crane', emoji: '🕊' },
  { key: 'star', label: 'Star', emoji: '⭐' },
  { key: 'boat', label: 'Paper Boat', emoji: '⛵' },
  { key: 'heart', label: 'Heart', emoji: '♥' },
  { key: 'diamond', label: 'Diamond', emoji: '◆' },
];

export interface PaperUser {
  id: number;
  username: string;
  icon?: string;
  color?: string;
}

export function getUser(): PaperUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserLocal(user: PaperUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export async function createUser(username: string): Promise<PaperUser> {
  const user = await api.post<PaperUser>('/users', { username });
  saveUserLocal(user);
  return user;
}

export async function updateUserProfile(userId: number, icon: string, color: string): Promise<PaperUser> {
  const user = await api.patch<PaperUser>(`/users/${userId}`, { icon, color });
  // Merge with existing local data
  const existing = getUser();
  const merged = { ...existing, ...user };
  saveUserLocal(merged);
  // Also sync the player color for Toss Paper
  setPlayerColor(color);
  setPlayerIcon(icon);
  setProfileSet(true);
  return merged;
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getPlayerColor(): string {
  return localStorage.getItem(COLOR_KEY) || PLAYER_COLORS[0].hex;
}

export function setPlayerColor(hex: string) {
  localStorage.setItem(COLOR_KEY, hex);
}

export function getPlayerIcon(): string {
  return localStorage.getItem(ICON_KEY) || PLAYER_ICONS[0].key;
}

export function setPlayerIcon(key: string) {
  localStorage.setItem(ICON_KEY, key);
}

export function isProfileSet(): boolean {
  return localStorage.getItem(PROFILE_SET_KEY) === 'true';
}

export function setProfileSet(value: boolean) {
  localStorage.setItem(PROFILE_SET_KEY, String(value));
}

/**
 * Draw a player icon into a Phaser Graphics object.
 * Used for crew member lists, leaderboards, and the profile picker.
 */
export function drawPlayerIcon(
  g: Phaser.GameObjects.Graphics,
  iconKey: string,
  x: number,
  y: number,
  size: number,
  colorHex: string,
) {
  const colorInt = parseInt(colorHex.replace('#', '0x'));
  g.fillStyle(colorInt, 1);

  const r = size / 2;

  switch (iconKey) {
    case 'plane':
      // Paper airplane triangle
      g.fillTriangle(x + size, y + r, x, y, x + size * 0.15, y + r);
      g.fillTriangle(x + size, y + r, x, y + size, x + size * 0.15, y + r);
      break;

    case 'crane':
      // Simplified crane / bird shape
      g.fillTriangle(x, y + r, x + r, y, x + size, y + r);
      g.fillTriangle(x + r * 0.3, y + r, x + r, y + size, x + size - r * 0.3, y + r);
      break;

    case 'star': {
      // 5-pointed star
      const cx = x + r, cy = y + r;
      const outer = r, inner = r * 0.4;
      const points: number[] = [];
      for (let i = 0; i < 5; i++) {
        const aOuter = (i * 72 - 90) * Math.PI / 180;
        const aInner = ((i * 72) + 36 - 90) * Math.PI / 180;
        points.push(cx + Math.cos(aOuter) * outer, cy + Math.sin(aOuter) * outer);
        points.push(cx + Math.cos(aInner) * inner, cy + Math.sin(aInner) * inner);
      }
      // Draw as triangles from center
      for (let i = 0; i < 10; i++) {
        const next = (i + 1) % 10;
        g.fillTriangle(cx, cy, points[i * 2], points[i * 2 + 1], points[next * 2], points[next * 2 + 1]);
      }
      break;
    }

    case 'boat':
      // Paper boat hull + sail
      g.fillTriangle(x, y + size * 0.7, x + size, y + size * 0.7, x + r, y + size);
      g.fillTriangle(x + r, y, x + r, y + size * 0.7, x + size * 0.8, y + size * 0.7);
      break;

    case 'heart': {
      // Heart shape from two circles + triangle
      const cx = x + r, cy = y + r;
      const hr = r * 0.55;
      g.fillCircle(cx - hr * 0.55, cy - hr * 0.3, hr);
      g.fillCircle(cx + hr * 0.55, cy - hr * 0.3, hr);
      g.fillTriangle(cx - r * 0.85, cy, cx + r * 0.85, cy, cx, cy + r * 0.95);
      break;
    }

    case 'diamond':
      // Diamond / rhombus
      g.fillTriangle(x + r, y, x, y + r, x + r, y + size);
      g.fillTriangle(x + r, y, x + size, y + r, x + r, y + size);
      break;

    default:
      // Fallback circle
      g.fillCircle(x + r, y + r, r);
      break;
  }
}
