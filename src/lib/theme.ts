export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

export function applyUserTheme(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) return;
  const root = document.documentElement;
  root.style.setProperty('--user-color', color);
  root.style.setProperty('--ur', String(rgb.r));
  root.style.setProperty('--ug', String(rgb.g));
  root.style.setProperty('--ub', String(rgb.b));
}

export const DEFAULT_COLOR = '#5C6BC0';

export const COLOUR_OPTIONS = [
  { hex: '#FF6B6B', name: 'Coral Red' },
  { hex: '#2EC4B6', name: 'Teal Cyan' },
  { hex: '#5C6BC0', name: 'Indigo Blue' },
  { hex: '#FFB300', name: 'Amber Gold' },
  { hex: '#43A047', name: 'Forest Green' },
  { hex: '#E91E63', name: 'Rose Pink' },
  { hex: '#039BE5', name: 'Sky Blue' },
  { hex: '#8E24AA', name: 'Deep Purple' },
];

export const AVATAR_OPTIONS = [
  { emoji: '🎨', label: 'Artist Palette' },
  { emoji: '🖌️', label: 'Paint Brush' },
  { emoji: '✏️', label: 'Pencil' },
  { emoji: '🎭', label: 'Theatre Masks' },
  { emoji: '📐', label: 'Set Square' },
  { emoji: '🔮', label: 'Crystal Ball' },
  { emoji: '💡', label: 'Lightbulb' },
  { emoji: '🌈', label: 'Rainbow' },
  { emoji: '💼', label: 'Briefcase' },
  { emoji: '📊', label: 'Bar Chart' },
  { emoji: '🏆', label: 'Trophy' },
  { emoji: '🎯', label: 'Target' },
  { emoji: '🌐', label: 'Globe' },
  { emoji: '📱', label: 'Smartphone' },
  { emoji: '🤝', label: 'Handshake' },
  { emoji: '🚀', label: 'Rocket' },
];
