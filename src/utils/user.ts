import { api } from './api';

const STORAGE_KEY = 'paper_user';
const COLOR_KEY = 'paper_color';

// Origami-inspired player colors
export const PLAYER_COLORS = [
  { label: 'Red-Orange', hex: '#FF4F36' },
  { label: 'Sky Blue', hex: '#4992FF' },
  { label: 'Star Yellow', hex: '#FDE801' },
  { label: 'Petal Orange', hex: '#FF8F01' },
  { label: 'Mint', hex: '#2ED8A3' },
  { label: 'Violet', hex: '#9B59B6' },
];

export interface PaperUser {
  id: number;
  username: string;
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

export async function createUser(username: string): Promise<PaperUser> {
  const user = await api.post<PaperUser>('/users', { username });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
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
